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

  // 🔥 TRAER HISTORIAL (CORRECTO)
  const { data: movimientos } = await supabase
    .from("historial_movimientos")
    .select("socio_id, ingreso, tipo_movimiento");

  // 🔥 AGRUPAR CUOTA INICIAL
  let cuotasPorSocio = {};

  movimientos?.forEach(m => {

    if (m.tipo_movimiento === "CUOTA_INICIAL") {

      const key = m.socio_id;

      cuotasPorSocio[key] =
        (cuotasPorSocio[key] || 0) + Number(m.ingreso || 0);
    }

  });

  // 🔍 DEBUG
  console.log("MAPA CUOTAS:", cuotasPorSocio);
  console.log("SOCIOS IDS:", socios.map(s => s.id));

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

    // 🔥 CLAVE CORRECTA
    const cuota = cuotasPorSocio[socio.id] || 0;

    html += `<tr>`;

    html += `<td>${index + 1}</td>`;
    html += `<td>${socio.nombres}</td>`;

    // 🔥 CAJA
    if (index === 0) {
      html += `<td rowspan="${totalSocios}">$${totalCaja.toFixed(2)}</td>`;
    }

    html += `
      <td>$${cuota.toFixed(2)}</td>
      <td>$0.00</td>
      <td>$0.00</td>
      <td>$0.00</td>
      <td>$0.00</td>
      <td>$0.00</td>
      <td>$0.00</td>
      <td>$0.00</td>
      <td>0</td>
      <td></td>
    `;

    html += `</tr>`;
  });

  tabla.innerHTML = html;
}

// 🚀 Ejecutar
cargarSocios();