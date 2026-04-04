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
    PRESTAMO: {},
    PAGO_INTERES: {} // 🔥 NUEVO (AÑADIDO)
  };

  // 🔥 AGRUPAR TODO
  movimientos?.forEach(m => {

    const tipo = (m.tipo_movimiento || "").trim().toUpperCase();
    const id = m.socio_id;

    if (!id) return;

    const ingreso = Number(m.ingreso || 0);
    const egreso = Number(m.egreso || 0);

    // 🔥 CUENTAS
    // 🔥 CUOTA INICIAL (CORREGIDO)
if (tipo === "CUOTA_INICIAL") {

  // 💰 suma ingresos
  if (ingreso > 0) {
    cuentas.CUOTA_INICIAL[id] =
      (cuentas.CUOTA_INICIAL[id] || 0) + ingreso;
  }

  // 💸 resta egresos
  if (egreso > 0) {
    cuentas.CUOTA_INICIAL[id] =
      (cuentas.CUOTA_INICIAL[id] || 0) - egreso;
  }

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

    // 🔥 PRÉSTAMO
    if (tipo === "PRESTAMO") {

      if (egreso > 0) {
        cuentas.PRESTAMO[id] = (cuentas.PRESTAMO[id] || 0) + egreso;
      }

      if (ingreso > 0) {
        cuentas.PRESTAMO[id] = (cuentas.PRESTAMO[id] || 0) - ingreso;
      }
    }

    // 🔥 NUEVO → PAGO DE INTERÉS
    if (tipo === "PAGO_INTERES") {
      cuentas.PAGO_INTERES[id] =
        (cuentas.PAGO_INTERES[id] || 0) + ingreso;
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

    // 🔥 NUEVO SISTEMA DE INTERÉS (AÑADIDO)
    const interesGenerado = deuda > 0 ? deuda * 0.10 : 0;
    const interesPagado = cuentas.PAGO_INTERES[id] || 0;

    let interesPendienteReal = interesGenerado - interesPagado;

    if (interesPendienteReal < 0) {
      interesPendienteReal = 0;
    }

    // 🔥 TOTAL
    const total = cuota + ahorro + beneficio - egreso - deuda;

    html += `<tr>`;

    html += `<td>${index + 1}</td>`;
    html += `<td>${socio.nombres}</td>`;

    if (index === 0) {
      html += `<td rowspan="${totalSocios}">$${totalCaja.toFixed(2)}</td>`;
    }

    html += `
      <td>$${cuota.toFixed(2)}</td>
      <td>$${ahorro.toFixed(2)}</td>
      <td>$${beneficio.toFixed(2)}</td>
      <td>$${interes.toFixed(2)}</td>
      <td>$${egreso.toFixed(2)}</td>
      <td>$${interesPendienteReal.toFixed(2)}</td> <!-- 🔥 CAMBIO -->
      <td>$${deuda.toFixed(2)}</td>
      <td>$${total.toFixed(2)}</td>
      <td>0</td>
      <td></td>
    `;

    html += `</tr>`;
  });

  tabla.innerHTML = html;
}

// 🚀 Ejecutar
cargarSocios();