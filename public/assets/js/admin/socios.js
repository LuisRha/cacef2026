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
    .from("usuarios")
    .select("codigo_socio")
    .not("codigo_socio", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);

  let numero = 1;

  if (data && data.length > 0) {
    const ultimo = data[0].codigo_socio;
    const partes = ultimo.split("-");
    if (partes.length === 2) {
      const n = parseInt(partes[1], 10);
      if (!isNaN(n)) numero = n + 1;
    }
  }

  return "SOC-" + String(numero).padStart(4, "0");
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
   CREAR USUARIO / SOCIO
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

    /* =========================
       1️⃣ CREAR USUARIO EN AUTH
    ========================= */
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

    /* =========================
       2️⃣ CREAR PERFIL EN TABLA USUARIOS
    ========================= */
    const nuevoUsuario = {
      id: authUserId, // 🔑 CLAVE PARA EVITAR DUPLICATE KEY
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

    const { error: insertError } = await supabase
      .from("usuarios")
      .insert(nuevoUsuario);

    if (insertError) {
      alert("Error BD: " + insertError.message);
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
   LISTAR SOCIOS / USUARIOS
========================= */
async function cargarSocios() {
  const { data, error } = await supabase
    .from("usuarios")
    .select(
      "codigo_socio, nombre1, nombre2, apellido1, apellido2, cedula, rol, estado"
    )
    .order("created_at", { ascending: false });

  if (error || !data) return;

  const tbody = document.getElementById("tablaSocios");
  if (!tbody) return;

  tbody.innerHTML = "";

  data.forEach((u) => {
    const nombreCompleto =
      `${u.nombre1} ${u.nombre2 || ""} ${u.apellido1} ${u.apellido2}`;

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
