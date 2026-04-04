import { supabase } from "../supabase.js";

console.log("🔥 historial.js cargado");

/* =========================
   ELEMENTOS
========================= */
const buscarSocio = document.getElementById("buscarSocio");
const listaSocios = document.getElementById("listaSocios");
const inputCodigoSocio = document.getElementById("codigoSocio");

const tipoMovimiento = document.getElementById("tipoMovimiento");
const descripcionMovimiento = document.getElementById("descripcionMovimiento");
const montoMovimiento = document.getElementById("montoMovimiento");
const tipoMonto = document.getElementById("tipoMonto");
const fechaMovimiento = document.getElementById("fechaMovimiento");
const btnRegistrarMovimiento = document.getElementById("btnRegistrarMovimiento");

const tablaHistorial = document.getElementById("tablaHistorial");

/* =========================
   AUTOCOMPLETAR SOCIO
========================= */
buscarSocio.addEventListener("input", async () => {
  const texto = buscarSocio.value.trim().toLowerCase();

  listaSocios.innerHTML = "";

  if (texto.length < 1) {
    listaSocios.style.display = "none";
    return;
  }

  listaSocios.style.display = "block";

  // 🔥 MOSTRAR CAJA SIEMPRE SI COINCIDE
  if ("caja".includes(texto)) {
    const itemCaja = document.createElement("div");
    itemCaja.className = "autocomplete-item";
    itemCaja.textContent = "CAJA (Sistema)";

    itemCaja.addEventListener("click", () => {
      buscarSocio.value = "CAJA";
      inputCodigoSocio.value = "CAJA";
      listaSocios.innerHTML = "";
      listaSocios.style.display = "none";
    });

    listaSocios.appendChild(itemCaja);
  }

  console.log("🔍 Buscando socio:", texto);

  const filtro =
    "codigo_socio.ilike.%" + texto + "%," +
    "nombres.ilike.%" + texto + "%";

  const { data, error } = await supabase
    .from("socios")
    .select("id, codigo_socio, nombres")
    .or(filtro)
    .limit(10);

  if (error) {
    console.error("❌ Error buscando socios:", error);
    return;
  }

  // 🔴 AGREGAR SOCIOS SI EXISTEN
  if (data && data.length > 0) {
    data.forEach((socio) => {
      const item = document.createElement("div");
      item.className = "autocomplete-item";
      item.textContent =
        `${socio.nombres} (${socio.codigo_socio})`;

      item.addEventListener("click", () => {
        buscarSocio.value = socio.nombres;
        inputCodigoSocio.value = socio.id;
        listaSocios.innerHTML = "";
        listaSocios.style.display = "none";
      });

      listaSocios.appendChild(item);
    });
  }

  // 🔴 SI NO HAY NADA (NI CAJA NI SOCIOS)
  if (listaSocios.innerHTML === "") {
    listaSocios.innerHTML =
      "<div class='autocomplete-item'>No encontrado</div>";
  }
});

// cerrar autocomplete al hacer click fuera
document.addEventListener("click", (e) => {
  if (!buscarSocio.contains(e.target) && !listaSocios.contains(e.target)) {
    listaSocios.innerHTML = "";
    listaSocios.style.display = "none";
  }
});

/* =========================
   REGISTRAR MOVIMIENTO
========================= */
btnRegistrarMovimiento.addEventListener("click", async () => {
  console.log("🟢 Click en Registrar movimiento");

  const codigoSocio = inputCodigoSocio.value.trim();
  const tipo = tipoMovimiento.value;
  const descripcion = descripcionMovimiento.value.trim();
  const monto = Number(montoMovimiento.value);
  const fecha = fechaMovimiento.value;
  const tipoMontoSeleccionado = tipoMonto.value;

  // ✅ VALIDACIÓN
  if (
    !codigoSocio ||
    !tipo ||
    isNaN(monto) ||
    monto <= 0 ||
    !fecha ||
    !tipoMontoSeleccionado
  ) {
    alert("❌ Completa correctamente todos los campos obligatorios");
    return;
  }

  const ingreso = tipoMontoSeleccionado === "INGRESO" ? monto : 0;
  const egreso = tipoMontoSeleccionado === "EGRESO" ? monto : 0;

  console.log("👉 codigoSocio:", codigoSocio);

  // =========================
  // 🔥 SI ES CAJA
  // =========================
  if (codigoSocio.toLowerCase() === "caja") {

    const fechaISO = new Date(fecha).toISOString();

    const { error } = await supabase
      .from("caja")
      .insert([{
        monto: ingreso > 0 ? ingreso : -egreso,
        descripcion: descripcion || tipo,
        fecha: fechaISO
      }]);

    if (error) {
      console.error("❌ Error CAJA:", error);
      alert("❌ Error al registrar en CAJA");
      return;
    }

    alert("✅ Movimiento registrado en CAJA");

    // limpiar
    buscarSocio.value = "";
    inputCodigoSocio.value = "";
    descripcionMovimiento.value = "";
    montoMovimiento.value = "";
    fechaMovimiento.value = "";
    tipoMovimiento.value = "";
    tipoMonto.value = "INGRESO";

    cargarHistorial();
    return; // 🔥 IMPORTANTE
  }

  // =========================
  // 🔹 SOCIO NORMAL
  // =========================
  const { error } = await supabase.rpc("insertar_movimiento_por_codigo", {
    p_codigo_socio: codigoSocio,
    p_tipo: tipo,
    p_descripcion: descripcion || null,
    p_ingreso: ingreso,
    p_egreso: egreso,
    p_fecha: fecha
  });

  if (error) {
    console.error("❌ Error registrando movimiento:", error);
    alert("❌ Error al registrar movimiento");
    return;
  }

  alert("✅ Movimiento registrado correctamente");

  // limpiar
  buscarSocio.value = "";
  inputCodigoSocio.value = "";
  descripcionMovimiento.value = "";
  montoMovimiento.value = "";
  fechaMovimiento.value = "";
  tipoMovimiento.value = "";
  tipoMonto.value = "INGRESO";

  cargarHistorial();
});
/* =========================
   CARGAR HISTORIAL
========================= */
async function cargarHistorial() {
  console.log("📥 Cargando historial...");

  // 🔹 historial normal
  const { data: historial, error: errorHistorial } = await supabase
    .from("v_historial_excel")
    .select("*");

  if (errorHistorial) {
    console.error("❌ Error historial:", errorHistorial);
    return;
  }

  // 🔥 CAJA
  const { data: caja, error: errorCaja } = await supabase
    .from("caja")
    .select("*");

  if (errorCaja) {
    console.error("❌ Error caja:", errorCaja);
  }

  let data = [];

  // agregar historial
  if (historial) {
    data = [...historial];
  }

  // 🔥 transformar caja
  if (caja) {
    const cajaTransformada = caja.map((c) => ({
      numero: "CAJA",
      codigo_socio: "CAJA",
      nombres: "Caja CACEF",
      descripcion: c.descripcion,
      fecha_registro: c.fecha,
      ingreso: c.monto > 0 ? c.monto : 0,
      egreso: c.monto < 0 ? Math.abs(c.monto) : 0,
      estado_validacion: c.tipo || ""
    }));

    data = [...data, ...cajaTransformada];
  }

  // 🔥 ORDENAR POR FECHA
  data.sort((a, b) => {
    return new Date(a.fecha_registro) - new Date(b.fecha_registro);
  });

  // 👉 render
  renderTabla(data);
}

/* =========================
   RENDER TABLA
========================= */
function renderTabla(data) {
  tablaHistorial.innerHTML = "";

  if (!data || data.length === 0) {
    tablaHistorial.innerHTML = `
      <tr>
        <td colspan="10" style="text-align:center;">Sin movimientos</td>
      </tr>
    `;
    return;
  }

  let total = 0;
  let contador = 1;

  data.forEach((m) => {
    const ingreso = Number(m.ingreso || 0);
    const egreso = Number(m.egreso || 0);

    if ((m.descripcion || "").toUpperCase() === "SALDO 2025") {
      total = ingreso - egreso;
    } else {
      total = total + ingreso - egreso;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${contador}</td>
      <td>${m.trx ?? ""}</td>
      <td>${m.codigo_socio ?? ""}</td>
      <td>${m.nombres ?? ""}</td>
      <td>${m.descripcion ?? ""}</td>
      <td>${new Date(m.fecha_registro).toLocaleDateString("es-EC")}</td>
      <td>${ingreso > 0 ? "$ " + ingreso.toFixed(2) : ""}</td>
      <td>${egreso > 0 ? "$ " + egreso.toFixed(2) : ""}</td>
      <td><strong>$ ${total.toFixed(2)}</strong></td>
      <td>${m.estado_validacion ?? ""}</td>
    `;

    tablaHistorial.appendChild(tr);
    contador++;
  });
}

// 🚀 ejecutar
cargarHistorial();