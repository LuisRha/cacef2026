import { supabase } from "../supabase.js";
console.log("🔥 supabase importado", supabase);


/* =========================
   PROTECCIÓN (SOLO ADMIN)
========================= */
const { data: sessionData, error: sessionError } =
  await supabase.auth.getSession();

if (sessionError || !sessionData?.session) {
  window.location.href = "/";
  throw new Error("Sin sesión");
}

const userId = sessionData.session.user.id;

const { data: userData, error: userError } = await supabase
  .from("usuarios")
  .select("rol")
  .eq("id", userId)
  .single();

if (userError || userData?.rol !== "ADMIN") {
  alert("Acceso no autorizado");
  window.location.href = "/";
  throw new Error("No admin");
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
  const { data, error } = await supabase
    .from("socios")
    .select("codigo_socio");

  if (error || !data || data.length === 0) {
    return "SOC-001";
  }

  const numeros = data
    .map(s => parseInt(s.codigo_socio.replace("SOC-", ""), 10))
    .filter(n => !isNaN(n));

  const max = Math.max(...numeros);

  return "SOC-" + String(max + 1).padStart(3, "0");
}


/* =========================
   INICIALIZACIÓN
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("codigo_socio").value = await generarCodigo();
  cargarSocios();
});

// ✅ Cargar socios SOLO cuando la sesión esté lista
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    console.log("✅ Sesión lista, cargando socios");
    cargarSocios();
  }
});


/* =========================
   TOGGLE FORMULARIO
========================= */
const btnToggle = document.getElementById("btnMostrarForm");
const contenedorForm = document.getElementById("contenedorForm");

btnToggle.addEventListener("click", () => {
  contenedorForm.classList.toggle("oculto");
  btnToggle.textContent = contenedorForm.classList.contains("oculto")
    ? "➕ Crear nuevo socio"
    : "✖ Cerrar formulario";
});

/* =========================
   FORMATEOS INPUT
========================= */
const cedulaInput = document.getElementById("cedula");
cedulaInput.addEventListener("input", () => {
  let valor = cedulaInput.value.replace(/\D/g, "");
  if (valor.length > 10) valor = valor.slice(0, 10);
  if (valor.length > 9) valor = valor.slice(0, 9) + "-" + valor.slice(9);
  cedulaInput.value = valor;
});

const whatsappInput = document.getElementById("whatsapp");
whatsappInput.addEventListener("input", () => {
  let valor = whatsappInput.value.replace(/\D/g, "");
  if (valor.length > 10) valor = valor.slice(0, 10);
  whatsappInput.value = valor;
});

/* =========================
   CREAR SOCIO (SIN AUTH)
========================= */
const form = document.getElementById("formSocio");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre1 = document.getElementById("nombre1").value.trim();
  const nombre2 = document.getElementById("nombre2").value.trim();
  const apellido1 = document.getElementById("apellido1").value.trim();
  const apellido2 = document.getElementById("apellido2").value.trim();

  if (!nombre1 || !apellido1) {
    alert("Primer nombre y primer apellido son obligatorios");
    return;
  }

  const nombres = [nombre1, nombre2, apellido1, apellido2]
    .filter(v => v && v.length > 0)
    .join(" ");

  const socio = {
    // ❌ YA NO SE ENVÍA codigo_socio
    cedula: cedulaInput.value.trim(),

    // 👇 TUS CAMPOS ORIGINALES
    nombre1,
    nombre2: nombre2 || null,
    apellido1,
    apellido2,

    // 👇 CAMPO OBLIGATORIO EN BD
    nombres,

    email: document.getElementById("correo").value.trim(),
    whatsapp: whatsappInput.value.trim(),
    direccion: document.getElementById("direccion").value.trim(),
    estado: document.getElementById("estado").value,

    // 👇 CAMPOS FINANCIEROS
    saldo: 0,
    deuda_actual: 0
  };

  const { error } = await supabase.from("socios").insert(socio);

  if (error) {
    alert("Error BD: " + error.message);
    return;
  }

  alert("Socio creado correctamente");
  form.reset();

  // ❌ YA NO LLAMES generarCodigo()
  cargarSocios();
});



/* =========================
   LISTAR SOCIOS
========================= */
async function cargarSocios() {
  const { data, error } = await supabase
    .from("socios")
    .select(`
      codigo_socio,
      nombres,
      nombre1,
      nombre2,
      apellido1,
      apellido2,
      cedula,
      saldo,
      deuda_actual,
      estado
    `)
    .order("created_at", { ascending: true });

  const tbody = document.getElementById("tablaSocios");
  tbody.innerHTML = "";

  if (error) {
    console.error("Error al cargar socios:", error);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;">
          Error al cargar socios
        </td>
      </tr>
    `;
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;">
          No hay socios registrados
        </td>
      </tr>
    `;
    return;
  }

  data.forEach(s => {
    const nombreCompleto =
      s.nombres ||
      [s.nombre1, s.nombre2, s.apellido1, s.apellido2]
        .filter(Boolean)
        .join(" ");

    tbody.innerHTML += `
      <tr>
        <td>${s.codigo_socio}</td>
        <td>${nombreCompleto || "-"}</td>
        <td>${s.cedula ?? "-"}</td>
        <td>$ ${Number(s.saldo ?? 0).toFixed(2)}</td>
        <td>$ ${Number(s.deuda_actual ?? 0).toFixed(2)}</td>
        <td>${s.estado}</td>
      </tr>
    `;
  });
}
