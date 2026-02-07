import { supabase } from "../supabase.js";

// PROTECCIÓN
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

// LOGOUT
document.getElementById("logoutBtn").onclick = async () => {
  await supabase.auth.signOut();
  window.location.href = "/index.html";
};

// CREAR SOCIO
const form = document.getElementById("formSocio");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const codigo = document.getElementById("codigo_socio").value;
  const nombres = document.getElementById("nombres").value;
  const ahorro = Number(document.getElementById("ahorro_inicial").value);

  const { error } = await supabase.rpc("crear_socio", {
    p_codigo_socio: codigo,
    p_nombres: nombres,
    p_ahorro_inicial: ahorro
  });

  if (error) {
    alert(error.message);
  } else {
    alert("Socio creado correctamente");
    form.reset();
    cargarSocios();
  }
});

// LISTAR SOCIOS
async function cargarSocios() {
  const { data, error } = await supabase
    .from("socios")
    .select("*")
    .order("created_at", { ascending: false });

  const tbody = document.getElementById("tablaSocios");
  tbody.innerHTML = "";

  data.forEach(s => {
    tbody.innerHTML += `
      <tr>
        <td>${s.codigo_socio}</td>
        <td>${s.nombres}</td>
        <td>${s.estado}</td>
        <td>${s.score}</td>
      </tr>
    `;
  });
}

cargarSocios();
