import { supabase } from "../supabase.js";

// 🔐 PROTECCIÓN
const { data: sessionData } = await supabase.auth.getSession();
if (!sessionData.session) window.location.href = "/index.html";

const userId = sessionData.session.user.id;
const { data: userData } = await supabase
  .from("usuarios")
  .select("rol")
  .eq("id", userId)
  .single();

if (!userData || userData.rol === "SOCIO") {
  alert("Acceso no autorizado");
  window.location.href = "/index.html";
}

// 🚪 LOGOUT
document.getElementById("logoutBtn").onclick = async () => {
  await supabase.auth.signOut();
  window.location.href = "/index.html";
};

// 🧾 REGISTRAR PAGO
document.getElementById("formPago").addEventListener("submit", async (e) => {
  e.preventDefault();

  const { error } = await supabase.rpc("registrar_pago", {
    p_codigo_socio: document.getElementById("codigo_socio").value,
    p_monto: Number(document.getElementById("monto").value),
    p_comprobante: document.getElementById("comprobante").value,
    p_medio_pago: document.getElementById("medio_pago").value,
    p_fecha_pago: document.getElementById("fecha_pago").value
  });

  if (error) {
    alert(error.message);
  } else {
    alert("Pago registrado (pendiente de validación)");
    e.target.reset();
    cargarPagos();
  }
});

// 📋 LISTAR PAGOS PENDIENTES
async function cargarPagos() {
  const { data } = await supabase
    .from("historial_movimientos")
    .select(`
      id,
      fecha_pago,
      ingreso,
      numero_comprobante,
      socios (codigo_socio)
    `)
    .eq("estado_validacion", "PENDIENTE")
    .order("fecha_pago");

  const tbody = document.getElementById("tablaPagos");
  tbody.innerHTML = "";

  data.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td>${p.fecha_pago}</td>
        <td>${p.socios.codigo_socio}</td>
        <td>$${p.ingreso}</td>
        <td>${p.numero_comprobante}</td>
        <td><em>Pendiente</em></td>
      </tr>
    `;
  });
}

cargarPagos();
