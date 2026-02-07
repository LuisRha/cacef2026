import { supabase } from "../supabase.js";

// Verificar sesión
const { data: sessionData } = await supabase.auth.getSession();

if (!sessionData.session) {
  window.location.href = "/index.html";
}

// Obtener rol
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

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "/index.html";
});
