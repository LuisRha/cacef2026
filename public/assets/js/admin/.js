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
  listaSocios.style.display = "block";

  if (texto.length < 2) {
    listaSocios.style.display = "none";
    return;
  }

  console.log("🔍 Buscando:", texto);

  // 🔥 SI ES CAJA
  if (texto === "caja") {
    const item = document.createElement("div");
    item.className = "autocomplete-item";
    item.textContent = "CAJA (Sistema)";

    item.addEventListener("click", () => {
      buscarSocio.value = "CAJA";
      inputCodigoSocio.value = "CAJA";
      listaSocios.innerHTML = "";
      listaSocios.style.display = "none";
    });

    listaSocios.appendChild(item);
    return;
  }

  // 🔹 BUSCAR SOCIOS NORMAL
  const { data, error } = await supabase
    .from("socios")
    .select("codigo_socio, nombres")
    .ilike("nombres", `%${texto}%`)
    .limit(10);

  if (error) {
    console.error("❌ Error buscando socios:", error);
    return;
  }

  if (!data || data.length === 0) {
    listaSocios.innerHTML =
      "<div class='autocomplete-item'>No encontrado</div>";
    return;
  }

  data.forEach((socio) => {
    const item = document.createElement("div");
    item.className = "autocomplete-item";
    item.textContent = `${socio.nombres} (${socio.codigo_socio})`;

    item.addEventListener("click", () => {
      buscarSocio.value = socio.nombres;
      inputCodigoSocio.value = socio.id;
      listaSocios.innerHTML = "";
      listaSocios.style.display = "none";
    });

    listaSocios.appendChild(item);
  });
});


// cerrar autocomplete
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

  // 🔥 SI ES CAJA
  console.log("👉 codigoSocio:", codigoSocio);
  if (codigoSocio.trim().toLowerCase() === "caja") {

    const { error } = await supabase
      .from("caja")
      .insert([{
        monto: ingreso > 0 ? ingreso : -egreso,
        descripcion: descripcion || tipo,
        fecha: fecha
      }]);

    if (error) {
      console.error("❌ Error registrando en caja:", error);
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

    return;
  }

  // 🔹 SOCIO NORMAL
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

  const { data, error } = await supabase
    .from("v_historial_excel")
    .select("*");

  if (error) {
    console.error("❌ Error cargando historial:", error);
    return;
  }

  renderTabla(data || []);
}


/* =========================
   RENDER TABLA
========================= */
function renderTabla(data) {
  tablaHistorial.innerHTML = "";

  if (!data || data.length === 0) {
    tablaHistorial.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center;">Sin movimientos</td>
      </tr>
    `;
    return;
  }

  let total = 0;      // 🔴 TOTAL ACUMULADO (LIBRETA)
  let contador = 1;  // 🔢 NÚMERO CORRELATIVO (N°)

  data.forEach((m) => {
    const ingreso = Number(m.ingreso || 0);
    const egreso = Number(m.egreso || 0);

    // ✅ CASO ESPECIAL: SALDO INICIAL
    if ((m.descripcion || "").toUpperCase() === "SALDO 2025") {
      total = ingreso - egreso; // normalmente solo ingreso
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

// cargar al iniciar
cargarHistorial();
