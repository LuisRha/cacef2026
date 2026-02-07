import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", () => {
  // Referencias al DOM
  const loginForm = document.getElementById("loginForm");
  const errorMsg = document.getElementById("error");

  if (!loginForm || !errorMsg) {
    console.error("Formulario o mensaje de error no encontrado en el DOM");
    return;
  }

  // Evento submit
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg.textContent = "";

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();

    if (!email || !password) {
      errorMsg.textContent = "Ingrese correo y contraseña";
      return;
    }

    try {
      // 1️⃣ Login con Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data?.user) {
        errorMsg.textContent = "Correo o contraseña incorrectos";
        return;
      }

      const userId = data.user.id;

      // 2️⃣ Obtener rol y estado desde tabla usuarios
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

      // 3️⃣ Redirección según rol
      if (["ADMIN", "TESORERA", "PRESIDENTE"].includes(usuario.rol)) {
        window.location.href = "/admin/dashboard.html";
      } else if (usuario.rol === "SOCIO") {
        window.location.href = "/socio/dashboard.html";
      } else {
        errorMsg.textContent = "Rol no reconocido";
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error(err);
      errorMsg.textContent = "Error inesperado, intente nuevamente";
    }
  });
});
