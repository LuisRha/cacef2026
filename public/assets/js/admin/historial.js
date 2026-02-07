import { supabase } from "../supabase.js";

// 🔐 PROTECCIÓN
const { data: sessionData } = await supabase.auth.getSession();
if (!sessionData.session) {
  window.location.href = "/index.html";
}

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

// 📘 CARGAR HISTORIAL
async function cargarHistorial(filtros = {}) {
  let query = supabase
    .from("historial_movimientos")
    .select(`
      fecha_registro,
      codigo_movimiento,
      descripcion,
      ingreso,
      egreso,
      saldo_socio,
      estado_validacion,
      socios (codigo_socio)
    `)
    .order("fecha_registro", { ascending: false });

  if (filtros.codigo) {
    query = query.eq("socios.codigo_socio", filtros.codigo);
  }

  if (filtros.desde) {
    query = query.gte("fecha_registro", filtros.desde);
  }

  if (filtros.hasta) {
    query = query.lte("fecha_registro", filtros.hasta);
  }

  const { data, error } = await query;

  const tbody = document.getElementById("tablaHistorial");
  tbody.innerHTML = "";

  data.forEach(m => {
    tbody.innerHTML += `
      <tr>
        <td>${new Date(m.fecha_registro).toLocaleDateString()}</td>
        <td>${m.codigo_movimiento}</td>
        <td>${m.socios?.codigo_socio || ""}</td>
        <td>${m.descripcion || ""}</td>
        <td class="ingreso">${m.ingreso > 0 ? "$" + m.ingreso : ""}</td>
        <td class="egreso">${m.egreso > 0 ? "$" + m.egreso : ""}</td>
        <td>$${m.saldo_socio}</td>
        <td class="${m.estado_validacion === "PENDIENTE" ? "pendiente" : ""}">
          ${m.estado_validacion}
        </td>
      </tr>
    `;
  });
}

// 🔍 FILTROS
document.getElementById("btnFiltrar").onclick = () => {
  cargarHistorial({
    codigo: document.getElementById("filtroSocio").value,
    desde: document.getElementById("fechaDesde").value,
    hasta: document.getElementById("fechaHasta").value
  });
};

// CARGA INICIAL
cargarHistorial();
