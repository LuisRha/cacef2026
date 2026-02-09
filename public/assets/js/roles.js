import { supabase } from "./supabase.js";

/* =========================
   OBTENER USUARIO ACTUAL
========================= */
export async function getUsuarioActual() {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data?.session) return null;

  const userId = data.session.user.id;

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, rol, activo")
    .eq("id", userId)
    .single();

  if (!usuario || !usuario.activo) return null;

  return usuario;
}

/* =========================
   SOLO ADMIN
========================= */
export async function soloAdmin() {
  const usuario = await getUsuarioActual();

  if (!usuario || !["ADMIN", "TESORERA", "PRESIDENTE"].includes(usuario.rol)) {
    window.location.href = "../index.html";
    throw new Error("Acceso solo admin");
  }

  return usuario;
}

/* =========================
   SOLO SOCIO
========================= */
export async function soloSocio() {
  const usuario = await getUsuarioActual();

  if (!usuario || usuario.rol !== "SOCIO") {
    window.location.href = "../index.html";
    throw new Error("Acceso solo socio");
  }

  return usuario;
}
