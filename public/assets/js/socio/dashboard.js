import { supabase } from "../supabase.js";
import { soloSocio } from "../auth.js";

console.log("🔥 Dashboard socio iniciado");

document.addEventListener("DOMContentLoaded", async () => {

  /* =========================
     🔐 VALIDAR USUARIO (SOLO SOCIO)
  ========================= */
  const usuario = await soloSocio();

  /* =========================
     🔍 BUSCAR SOCIO (POR ID)
  ========================= */
  const { data: socio, error } = await supabase
    .from("socios")
    .select("nombres, codigo_socio, saldo")
    .eq("id", usuario.id) // 🔥 conexión correcta
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