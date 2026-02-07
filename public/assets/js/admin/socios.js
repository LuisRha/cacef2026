import { supabase } from "../supabase.js";

/* =========================
   PROTECCIÓN (SOLO ADMIN)
========================= */
const { data: sessionData, error: sessionError } =
  await supabase.auth.getSession();

if (sessionError || !sessionData?.session) {
  window.location.href = "/";
}

const userId = sessionData.session.user.id;

const { data: userData, error: userError } = await supabase
  .from("usuarios")
  .select("rol")
  .eq("id", userId)
  .single();

if (userError || !userData || userData.rol !== "ADMIN") {
  alert("Acceso no autorizado");
  window.location.href = "/";
}

/* =========================
   LOGOUT
========================= */
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.onclick = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };
}

/* =========================
   GENERAR CÓDIGO SOCIO
========================= */
async function generarCodigo() {
  const { data } = await supabase
    .from("socios")
    .select("codigo_socio")
    .order("created_at", { ascending: false })
    .limit(1);

  let numero = 1;

  if (data && data.length > 0) {
    const ultimo = data[0].codigo_socio;
    const n = parseInt(ultimo.split("-")[1], 10);
    if (!isNaN(n)) numero = n + 1;
  }

  return "SOC-" + String(numero).padStart(3, "0");
}

/* =========================
   INICIALIZACIÓN
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  const codigoInput = document.getElementById("codigo_socio");
  if (codigoInput) {
    codigoInput.value = await generarCodigo();
  }
  await cargarSocios();
});

/* =========================
   CREAR USUARIO (AUTH + USUARIOS)
========================= */
const form = document.getElementById("formSocio");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("correo").value.trim();
    const cedula = document.getElementById("cedula").value.trim();

    if (!email || !cedula) {
      alert("Correo y cédula son obligatorios");
      return;
    }

    /* 1️⃣ Crear usuario en Auth */
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        email_confirm: true
      });

    if (authError) {
      alert("Error Auth: " + authError.message);
      return;
    }

    const authUserId = authData.user.id;

    /* 2️⃣ Crear registro en usuarios */
    const nuevoUsuario = {
      id: authUserId,
      codigo_socio: document.getElementById("codigo_socio").value,
      cedula,
      nombre1: document.getElementById("nombre1").value.trim(),
      nombre2: document.getElementById("nombre2").value.trim() || null,
      apellido1: document.getElementById("apellido1").value.trim(),
      apellido2: document.getElementById("apellido2").value.trim(),
      email,
      whatsapp: document.getElementById("whatsapp").value.trim(),
      direccion: document.getElementById("direccion").value.trim(),
      rol: document.getElementById("rol").value,
      estado: document.getElementById("estado").value
    };

    const { error: userError } = await supabase
      .from("usuarios")
      .insert(nuevoUsuario);

    if (userError) {
      alert("Error BD: " + userError.message);
      return;
    }

    alert("Usuario creado correctamente");
    form.reset();

    document.getElementById("codigo_socio").value =
      await generarCodigo();

    await cargarSocios();
  });
}

/* =========================
   LISTAR SOCIOS (TABLA SOCIOS)
========================= */
async function cargarSocios() {
  const { data, error } = await supabase
    .from("socios")
    .select("codigo_socio, nombres, estado, score")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const tbody = document.getElementById("tablaSocios");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;">No hay socios registrados</td>
      </tr>
    `;
    return;
  }

  data.forEach((s) => {
    tbody.innerHTML += `
      <tr>
        <td>${s.codigo_socio}</td>
        <td>${s.nombres}</td>
        <td>-</td>
        <td>SOCIO</td>
        <td>${s.estado}</td>
      </tr>
    `;
  });
}
