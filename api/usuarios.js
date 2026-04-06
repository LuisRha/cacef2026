import { supabase } from "../supabase.js";

console.log("🔥 Dashboard socio iniciado");

/* =========================
   🔐 VERIFICAR SESIÓN
========================= */
const { data: sessionData, error: sessionError } =
  await supabase.auth.getSession();

if (sessionError || !sessionData?.session) {
  window.location.href = "/";
}

const user = sessionData.session.user;

/* =========================
   🔐 VALIDAR ROL (SOCIO)
========================= */
const { data: userData, error: userError } = await supabase
  .from("usuarios")
  .select("rol")
  .eq("id", user.id)
  .single();

if (userError || !userData || userData.rol !== "SOCIO") {
  alert("Acceso no autorizado");
  await supabase.auth.signOut();
  window.location.href = "/";
}

/* =========================
   🔍 BUSCAR SOCIO
========================= */
const { data: socio, error: socioError } = await supabase
  .from("socios")
  .select("*")
  .eq("email", user.email) // 🔥 usamos email (más fácil)
  .single();

if (socioError || !socio) {
  console.error("❌ Socio no encontrado:", socioError);
  alert("No estás registrado como socio");
  return;
}

/* =========================
   🎯 MOSTRAR DATOS
========================= */
document.getElementById("nombreSocio").textContent =
  socio.nombres || "-";

document.getElementById("codigoSocio").textContent =
  socio.codigo_socio || "-";

document.getElementById("saldo").textContent =
  Number(socio.saldo || 0).toFixed(2);

/* =========================
   📊 RESUMEN (BÁSICO)
========================= */
const { data: movimientos } = await supabase
  .from("historial_movimientos")
  .select("*")
  .eq("socio_id", socio.id);

document.getElementById("totalMovimientos").textContent =
  movimientos ? movimientos.length : 0;

// (por ahora simples, luego los hacemos inteligentes)
document.getElementById("creditosActivos").textContent = 0;
document.getElementById("cuotasVencidas").textContent = 0;

/* =========================
   🔴 LOGOUT
========================= */
document.getElementById("logoutBtn").onclick = async () => {
  await supabase.auth.signOut();
  window.location.href = "/";
};