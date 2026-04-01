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


async function cargarSocios() {

  // 🔹 TRAER SOCIOS
  const { data, error } = await supabase
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

  // 🔥 CALCULAR TOTAL CAJA
  let totalCaja = 0;
  if (cajaData) {
    cajaData.forEach(c => {
      totalCaja += Number(c.monto || 0);
    });
  }

  // 🔥 TRAER CUOTAS INICIALES
  const { data: cuotasData } = await supabase
    .from("historial_movimientos")
    .select("socio_id, ingreso, descripcion");

  // 🔥 AGRUPAR CUOTAS POR SOCIO
  let cuotasPorSocio = {};

  if (cuotasData) {
    cuotasData.forEach(m => {
      if ((m.descripcion || "").toUpperCase().includes("INICIAL")) {
        if (!cuotasPorSocio[m.socio_id]) {
          cuotasPorSocio[m.socio_id] = 0;
        }
        cuotasPorSocio[m.socio_id] += Number(m.ingreso || 0);
      }
    });
  }

  const tabla = document.getElementById("tablaSocios");

  if (!tabla) {
    console.error("No existe tablaSocios en HTML");
    return;
  }

  const totalSocios = data.length;
  let html = "";

  // 🔥 RENDER TABLA
  data.forEach((socio, index) => {

    html += `<tr>`;

    html += `<td>${index + 1}</td>`;
    html += `<td>${socio.nombres}</td>`;

    // 🔥 CAJA solo una vez
    if (index === 0) {
      html += `<td rowspan="${totalSocios}">$${totalCaja.toFixed(2)}</td>`;
    }

    // 🔥 CUOTA INICIAL DINÁMICA
    const cuota = cuotasPorSocio[socio.id] || 0;

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