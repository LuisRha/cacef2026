import { supabase } from "../supabase.js";

// 🔐 Verificar sesión
const { data: sessionData } = await supabase.auth.getSession();

if (!sessionData.session) {
  window.location.href = "/index.html";
}

// 🔐 Obtener rol
const userId = sessionData.session.user.id;

const { data: userData } = await supabase
  .from("usuarios")
  .select("rol")
  .eq("id", userId)
  .single();

if (!userData || userData.rol === "SOCIO") {
  alert("Acceso no autorizado");
  await supabase.auth.signOut();
  window.location.href = "/index.html";
}

// 🔴 LOGOUT
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "/index.html";
});

// 🚀 FUNCIÓN PRINCIPAL
async function cargarSocios() {

  // 🔹 TRAER SOCIOS
  const { data: socios, error } = await supabase
    .from("socios")
    .select("*")
    .order("codigo_socio", { ascending: true });

  if (error) {
    console.error("Error cargando socios:", error);
    return;
  }

  // 🔹 TRAER CAJA
  const { data: cajaData, error: errorCaja } = await supabase
    .from("caja")
    .select("monto");

  if (errorCaja) {
    console.error("Error cargando caja:", errorCaja);
    return;
  }

  // 🔥 TOTAL CAJA
  let totalCaja = 0;
  cajaData?.forEach(c => {
    totalCaja += Number(c.monto || 0);
  });

  // 🔥 TRAER HISTORIAL
  const { data: movimientos, error: errorMov } = await supabase
    .from("historial_movimientos")
    .select("socio_id, ingreso, egreso, tipo_movimiento");

  if (errorMov) {
    console.error("Error historial:", errorMov);
    return;
  }

  console.log("MOVIMIENTOS:", movimientos);

  // 🔥 MAPAS POR CUENTA
  let cuentas = {
    CUOTA_INICIAL: {},
    CUENTA_AHORRO: {},
    BENEFICIO_CONSOLIDADO: {},
    INGRESO_INTERES: {},
    EGRESO: {},
    PRESTAMO: {}
  };

  // 🔥 AGRUPAR TODO
  movimientos?.forEach(m => {

    const tipo = (m.tipo_movimiento || "").trim().toUpperCase();
    const id = m.socio_id;

    if (!id) return;

    const ingreso = Number(m.ingreso || 0);
    const egreso = Number(m.egreso || 0);

    // 🔥 CUENTAS
    if (tipo === "CUOTA_INICIAL") {
      cuentas.CUOTA_INICIAL[id] = (cuentas.CUOTA_INICIAL[id] || 0) + ingreso;
    }

    if (tipo === "CUENTA_AHORRO") {
      cuentas.CUENTA_AHORRO[id] = (cuentas.CUENTA_AHORRO[id] || 0) + ingreso;
    }

    if (tipo === "BENEFICIOS_CONSOLIDADO") {
      cuentas.BENEFICIO_CONSOLIDADO[id] = (cuentas.BENEFICIO_CONSOLIDADO[id] || 0) + ingreso;
    }

    if (tipo === "INGRESO_INTERES") {
      cuentas.INGRESO_INTERES[id] = (cuentas.INGRESO_INTERES[id] || 0) + ingreso;
    }

    if (tipo === "EGRESO") {
      cuentas.EGRESO[id] = (cuentas.EGRESO[id] || 0) + egreso;
    }

// 🔥 CORRECCIÓN IMPORTANTE
if (tipo === "PRESTAMO") {

  // 💰 préstamo (aumenta deuda)
  if (egreso > 0) {
    cuentas.PRESTAMO[id] = (cuentas.PRESTAMO[id] || 0) + egreso;
  }

  // 💸 pago (reduce deuda)
  if (ingreso > 0) {
    cuentas.PRESTAMO[id] = (cuentas.PRESTAMO[id] || 0) - ingreso;
  }

}

});

console.log("CUENTAS:", cuentas);



  // 🔹 TABLA
  const tabla = document.getElementById("tablaSocios");

  if (!tabla) {
    console.error("No existe tablaSocios en HTML");
    return;
  }

  const totalSocios = socios.length;
  let html = "";

  // 🔥 RENDER
  socios.forEach((socio, index) => {

    const id = socio.id;

    const cuota = cuentas.CUOTA_INICIAL[id] || 0;
    const ahorro = cuentas.CUENTA_AHORRO[id] || 0;
    const beneficio = cuentas.BENEFICIO_CONSOLIDADO[id] || 0;
    const interes = cuentas.INGRESO_INTERES[id] || 0;
    const egreso = cuentas.EGRESO[id] || 0;
    const deuda = cuentas.PRESTAMO[id] || 0;
    const interesPendiente = deuda * 0.10;

    // 🔥 NUEVO → TOTAL REAL
    const total = cuota + ahorro + beneficio - egreso - deuda;

    html += `<tr>`;

    html += `<td>${index + 1}</td>`;
    html += `<td>${socio.nombres}</td>`;

    // 🔥 CAJA GLOBAL
    if (index === 0) {
      html += `<td rowspan="${totalSocios}">$${totalCaja.toFixed(2)}</td>`;
    }

    html += `
      <td>$${cuota.toFixed(2)}</td>
      <td>$${ahorro.toFixed(2)}</td>
      <td>$${beneficio.toFixed(2)}</td>
      <td>$${interes.toFixed(2)}</td>
      <td>$${egreso.toFixed(2)}</td>
      <td>$${interesPendiente.toFixed(2)}</td>
      <td>$${deuda.toFixed(2)}</td>
      <td>$${total.toFixed(2)}</td> <!-- 🔥 YA FUNCIONA -->
      <td>0</td>
      <td></td>
    `;

    html += `</tr>`;
  });

  tabla.innerHTML = html;
}

// 🚀 Ejecutar
cargarSocios();