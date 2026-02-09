import { supabase } from "../supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 1️⃣ Obtener usuario autenticado
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    window.location.href = "/index.html";
    return;
  }

  // 2️⃣ Consultar datos del socio enlazado
  const { data: socio, error } = await supabase
    .from("socios")
    .select("nombres, codigo_socio, saldo")
    .eq("user_id", user.id)
    .single();

  if (error || !socio) {
    console.error("Socio no encontrado:", error);
    return;
  }

  // 3️⃣ Pintar datos en el dashboard
  document.getElementById("nombreSocio").textContent = socio.nombres;
  document.getElementById("codigoSocio").textContent = socio.codigo_socio;
  document.getElementById("saldo").textContent = Number(socio.saldo).toFixed(2);
});
