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
  const texto = buscarSocio.value.trim();

  listaSocios.innerHTML = "";

  if (texto.length < 2) {
    listaSocios.style.display = "none";
    return;
  }

  console.log("🔍 Buscando socio:", texto);

  const filtro =
    "codigo_socio.ilike.%" + texto + "%," +
    "nombres.ilike.%" + texto + "%," +
    "apellidos.ilike.%" + texto + "%," +
    "cedula.ilike.%" + texto + "%";

  const { data, error } = await supabase
    .from("socios")
    .select("codigo_socio, nombres, apellidos, cedula")
    .or(filtro)
    .limit(10);

  if (error) {
    console.error("❌ Error buscando socios:", error);
    return;
  }

  if (!data || data.length === 0) {
    listaSocios.innerHTML =
      "<div class='autocomplete-item'>No encontrado</div>";
    listaSocios.style.display = "block";
    return;
  }

  listaSocios.style.display = "block";

  data.forEach((socio) => {
    const nombreCompleto =
      `${socio.nombres ?? ""} ${socio.apellidos ?? ""}`.trim();

    const item = document.createElement("div");
    item.className = "autocomplete-item";
    item.textContent =
      `${nombreCompleto} (${socio.codigo_socio}) - ${socio.cedula ?? ""}`;

    item.addEventListener("click", () => {
      buscarSocio.value = nombreCompleto;
      inputCodigoSocio.value = socio.codigo_socio;
      listaSocios.innerHTML = "";
      listaSocios.style.display = "none";
    });

    listaSocios.appendChild(item);
  });
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
      <td>${m.numero ?? ""}</td>
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

cargarHistorial();