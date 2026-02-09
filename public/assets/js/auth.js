import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const errorMsg = document.getElementById("error");

  if (!loginForm || !errorMsg) {
    console.error("Formulario o mensaje de error no encontrado");
    return;
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg.textContent = "";

    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value.trim();

    if (!email || !password) {
      errorMsg.textContent = "Ingrese correo y contraseña";
      return;
    }

    try {
      /* =========================
         1️⃣ LOGIN
      ========================= */
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data?.user) {
        errorMsg.textContent = "Correo o contraseña incorrectos";
        return;
      }

      const userId = data.user.id;

      /* =========================
         2️⃣ ROL Y ESTADO
      ========================= */
      const { data: usuario, error: roleError } = await supabase
        .from("usuarios")
        .select("rol, activo")
        .eq("id", userId)
        .single();

      if (roleError || !usuario) {
        errorMsg.textContent = "Usuario sin rol asignado";
        await supabase.auth.signOut();
        return;
      }

      if (!usuario.activo) {
        errorMsg.textContent = "Usuario inactivo";
        await supabase.auth.signOut();
        return;
      }

      /* =========================
         3️⃣ REDIRECCIÓN
      ========================= */
      if (["ADMIN", "TESORERA", "PRESIDENTE"].includes(usuario.rol)) {
        window.location.href = "/admin/dashboard.html";
        return;
      }

      if (usuario.rol === "SOCIO") {
        window.location.href = "/socio/dashboard.html";
        return;
      }

      // rol no reconocido
      errorMsg.textContent = "Rol no reconocido";
      await supabase.auth.signOut();

    } catch (err) {
      console.error("Error login:", err);
      errorMsg.textContent = "Error inesperado, intente nuevamente";
      await supabase.auth.signOut();
    }
  });
});
