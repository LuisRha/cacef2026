import { supabase } from "../supabase.js";
import { soloSocio } from "../seguridad.js";

console.log("🔥 Dashboard socio iniciado");

document.addEventListener("DOMContentLoaded", async () => {

  /* =========================
     🔐 VALIDAR USUARIO (SOLO SOCIO)
  ========================= */
  await soloSocio();

  /* =========================
     🔍 OBTENER USUARIO LOGIN
  ========================= */
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    console.error("❌ Usuario no autenticado");
    window.location.href = "/index.html";
    return;
  }

  const email = userData.user.email;

  /* =========================
     🔍 BUSCAR SOCIO POR EMAIL
  ========================= */
  const { data: socio, error } = await supabase
    .from("socios")
    .select("nombres, codigo_socio, saldo")
    .eq("email", email)
    .maybeSingle();

  console.log("SOCIO:", socio);

  if (error || !socio) {
    console.error("❌ Socio no encontrado:", error);
    alert("No existe socio vinculado");
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
     🔴 LOGOUT
  ========================= */
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      await supabase.auth.signOut();
      window.location.href = "/";
    };
  }

});