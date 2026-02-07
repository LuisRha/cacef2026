import { supabase } from "../supabase.js";

/* =========================
   PROTECCIÓN (SOLO ADMIN)
========================= */
const { data: sessionData } = await supabase.auth.getSession();

if (!sessionData.session) {
  window.location.href = "/";
}

const userId = sessionData.session.user.id;

const { data: userData } = await supabase
  .from("usuarios")
  .select("rol")
  .eq("id", userId)
  .single();

if (!userData || userData.rol !== "ADMIN") {
  alert("Acceso no autorizado");
  window.location.href = "/";
}

/* =========================
   LOGOUT
========================= */
document.getElementById("logoutBtn").onclick = async () => {
  await supabase.auth.signOut();
  window.location.href = "/";
};

/* =========================
   GENERAR CÓDIGO SOCIO
========================= */
async function generarCodigo() {
  const { data } = await supabase
    .from("usuarios")
    .select("codigo_socio")
    .order("created_at", { ascending: false })
    .limit(1);

  let numero = 1;

  if (data && data.length > 0) {
    const ultimo = data[0].codigo_socio;
    const n = parseInt(ultimo.split("-")[1]);
    numero = n + 1;
  }

  return "SOC-" + String(numero).padStart(4, "0");
}

// cargar código al iniciar
document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("codigo_socio").value = await generarCodigo();
  cargarSocios();
});

/* =========================
   CREAR USUARIO / SOCIO
========================= */
const form = document.getElementById("formSocio");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nuevoUsuario = {
    codigo_socio: document.getElementById("codigo_socio").value,
    cedula: document.getElementById("cedula").value,
    nombre1: document.getElementById("nombre1").value,
    nombre2: document.getElementById("nombre2").value,
    apellido1: document.getElementById("apellido1").value,
    apellido2: document.getElementById("apellido2").value,
    correo: document.getElementById("correo").value,
    whatsapp: document.getElementById("whatsapp").value,
    direccion: document.getElementById("direccion").value,
    rol: document.getElementById("rol").value,
    estado: document.getElementById("estado").value
  };

  const { error } = await supabase
    .from("usuarios")
    .insert(nuevoUsuario);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Usuario creado correctamente");
  form.reset();
  document.getElementById("codigo_socio").value = await generarCodigo();
  cargarSocios();
});

/* =========================
   LISTAR SOCIOS / USUARIOS
========================= */
async function cargarSocios() {
  const { data, error } = await supabase
    .from("usuarios")
    .select("codigo_socio, nombre1, nombre2, apellido1, apellido2, cedula, rol, estado")
    .order("created_at", { ascending: false });

  if (error) return;

  const tbody = document.getElementById("tablaSocios");
  tbody.innerHTML = "";

  data.forEach(u => {
    const nombreCompleto = `${u.nombre1} ${u.nombre2 || ""} ${u.apellido1} ${u.apellido2}`;

    tbody.innerHTML += `
      <tr>
        <td>${u.codigo_socio}</td>
        <td>${nombreCompleto}</td>
        <td>${u.cedula}</td>
        <td>${u.rol}</td>
        <td>${u.estado}</td>
      </tr>
    `;
  });
}
