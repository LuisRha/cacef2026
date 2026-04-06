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
    .select("id, nombres, codigo_socio")
    .eq("email", email)
    .maybeSingle();

  if (error || !socio) {
    console.error("❌ Socio no encontrado:", error);
    alert("No existe socio vinculado");
    return;
  }

  console.log("SOCIO:", socio);

  /* =========================
     💰 TRAER MOVIMIENTOS
  ========================= */
  const { data: movimientos, error: movError } = await supabase
    .from("historial_movimientos")
    .select("ingreso, egreso, tipo_movimiento")
    .eq("socio_id", socio.id);

  if (movError) {
    console.error("❌ Error movimientos:", movError);
    return;
  }

  /* =========================
     💰 CALCULAR TOTAL (IGUAL ADMIN)
  ========================= */
  let cuota = 0;
  let ahorro = 0;
  let beneficio = 0;
  let egreso = 0;
  let deuda = 0;

  movimientos?.forEach(m => {

    const tipo = (m.tipo_movimiento || "").trim().toUpperCase();

    const ingreso = Number(m.ingreso || 0);
    const egresoVal = Number(m.egreso || 0);

    if (tipo === "CUOTA_INICIAL") {
      cuota += ingreso - egresoVal;
    }

    if (tipo === "CUENTA_AHORRO") {
      ahorro += ingreso - egresoVal;
    }

    if (tipo === "BENEFICIOS_CONSOLIDADO") {
      beneficio += ingreso - egresoVal;
    }

    if (tipo === "EGRESO") {
      egreso += egresoVal;
    }

    if (tipo === "PRESTAMO") {
      deuda += egresoVal - ingreso;
    }

  });

  const total = cuota + ahorro + beneficio - egreso - deuda;

  /* =========================
     🎯 MOSTRAR DATOS
  ========================= */
  document.getElementById("nombreSocio").textContent =
    socio.nombres || "-";

  document.getElementById("codigoSocio").textContent =
    socio.codigo_socio || "-";

  document.getElementById("saldo").textContent =
    total.toFixed(2);

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