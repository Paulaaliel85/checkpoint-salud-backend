
<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { iniciarSesionApi } from '../services/session'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const recordarme = ref(false)
const error = ref('')
const cargando = ref(false)

async function iniciarSesion() {
  error.value = ''

  const identificador = email.value.trim()

  if (!identificador || !password.value) {
    error.value = 'Completá el correo electrónico o DNI y la contraseña.'
    return
  }

  cargando.value = true

  try {
    const datos = await iniciarSesionApi(identificador, password.value)

    if (
      !datos.token ||
      !datos.usuario ||
      !['CLINICA', 'EMPRESA', 'ADMIN', 'PACIENTE'].includes(datos.usuario.rol)
    ) {
      error.value = 'La respuesta del servidor no es válida.'
      return
    }

    authStore.iniciarSesion({
      token: datos.token,
      usuario: datos.usuario,
    })

    switch (datos.usuario.rol) {
      case 'CLINICA':
        await router.push('/clinica')
        break
      case 'EMPRESA':
        await router.push('/empresa')
        break
      case 'ADMIN':
        await router.push('/admin')
        break
      case 'PACIENTE':
        await router.push('/paciente')
        break
      default:
        authStore.cerrarSesion()
        error.value = 'No se reconoce el rol de usuario.'
        return
    }
  } catch (e) {
    error.value =
      e instanceof Error
        ? e.message
        : 'No se pudo conectar con el servidor.'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <aside class="login-sidebar">
      <div class="sidebar-content">
        <div class="brand-icon" aria-hidden="true">
          <svg viewBox="0 0 64 64" fill="none">
            <rect x="5" y="5" width="54" height="54" rx="16" />
            <path d="M32 17V47M17 32H47" />
            <circle cx="32" cy="32" r="20" />
          </svg>
        </div>

        <p class="brand-overline">PLATAFORMA DE GESTIÓN</p>
        <h1 class="brand-title">CHECKPOINT <span>SALUD</span></h1>
        <p class="brand-subtitle">
          Gestión de medicina ocupacional
        </p>

        <div class="brand-divider"></div>

        <p class="brand-description">
          Tecnología y seguridad para una gestión más eficiente de la salud laboral.
        </p>

        <div class="logo-box">
          <div class="logo-inner">
            <span class="logo-code">&lt;ITS&gt;</span>
            <span class="logo-subtext">SOLUCIONES</span>
          </div>
        </div>
      </div>

      <footer class="sidebar-footer">
        <span>© 2026 Checkpoint Salud</span>
        <span>Seguridad en Salud del Trabajo</span>
      </footer>
    </aside>

    <main class="login-main">
      <div class="form-wrapper">
        <div class="form-heading">
          <span class="form-tag">
            <span class="status-dot"></span>
            ACCESO AL SISTEMA
          </span>

          <h2 class="form-title">Bienvenido</h2>
          <p class="form-description">
            Ingresá tus credenciales para acceder a la plataforma médica.
          </p>
        </div>

        <form @submit.prevent="iniciarSesion" class="login-form">
          <div class="input-group">
            <label for="email">Correo electrónico o DNI</label>

            <div class="input-wrapper">
              <svg
                class="input-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
              </svg>

              <input
                id="email"
                v-model="email"
                type="text"
                autocomplete="username"
                placeholder="Ingresá tu correo electrónico o DNI"
                required
              />
            </div>
          </div>

          <div class="input-group">
            <label for="password">Contraseña</label>

            <div class="input-wrapper">
              <svg
                class="input-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                aria-hidden="true"
              >
                <rect x="3" y="10" width="18" height="12" rx="2" />
                <path d="M7 10V7a5 5 0 0 1 10 0v3" />
              </svg>

              <input
                id="password"
                v-model="password"
                type="password"
                autocomplete="current-password"
                placeholder="Ingresá tu contraseña"
                required
              />
            </div>
          </div>

          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="recordarme" />
              <span class="custom-checkbox"></span>
              <span class="checkbox-text">Recordarme</span>
            </label>
          </div>

          <p v-if="error" class="error-message" role="alert">
            {{ error }}
          </p>

          <button
            type="submit"
            class="submit-btn"
            :disabled="cargando"
          >
            <span>{{ cargando ? 'Ingresando...' : 'Iniciar sesión' }}</span>

            <svg
              v-if="!cargando"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </form>

        <div class="security-note">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            aria-hidden="true"
          >
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          <span>Acceso seguro y confidencial</span>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.login-container {
  display: grid;
  grid-template-columns: minmax(360px, 0.9fr) minmax(0, 1.1fr);
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0;
  background: #080b14;
  color: #f4f7ff;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}

.login-sidebar {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
  min-height: 100vh;
  padding: clamp(32px, 5vw, 72px);
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 42%, rgba(0, 210, 235, 0.09), transparent 55%),
    linear-gradient(145deg, #101829 0%, #0a0e1a 55%, #080b14 100%);
  border-right: 1px solid #20283a;
}

.login-sidebar::before {
  position: absolute;
  top: -130px;
  left: -120px;
  width: 330px;
  height: 330px;
  border: 1px solid rgba(0, 229, 255, 0.09);
  border-radius: 50%;
  content: '';
  pointer-events: none;
}

.login-sidebar::after {
  position: absolute;
  right: -170px;
  bottom: 50px;
  width: 360px;
  height: 360px;
  border: 1px solid rgba(0, 229, 255, 0.07);
  border-radius: 50%;
  content: '';
  pointer-events: none;
}

.sidebar-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  text-align: center;
}

.brand-icon {
  display: grid;
  width: 76px;
  height: 76px;
  margin-bottom: 30px;
  place-items: center;
  color: #00e5ff;
  background: rgba(0, 229, 255, 0.06);
  border: 1px solid rgba(0, 229, 255, 0.28);
  border-radius: 22px;
  box-shadow: 0 0 38px rgba(0, 229, 255, 0.08);
}

.brand-icon svg {
  width: 48px;
  height: 48px;
  overflow: visible;
}

.brand-icon rect {
  stroke: currentColor;
  stroke-width: 1.2;
  opacity: 0.45;
}

.brand-icon circle {
  stroke: currentColor;
  stroke-width: 1.2;
}

.brand-icon path {
  stroke: currentColor;
  stroke-width: 3;
  stroke-linecap: round;
}

.brand-overline {
  margin: 0 0 12px;
  color: #00d8f0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 3px;
}

.brand-title {
  margin: 0;
  color: #f5f8ff;
  font-size: clamp(1.8rem, 2.5vw, 2.65rem);
  font-weight: 800;
  letter-spacing: -1.2px;
  line-height: 1.15;
}

.brand-title span {
  color: #00e5ff;
}

.brand-subtitle {
  margin: 14px 0 0;
  color: #a6b4cb;
  font-size: 1rem;
  line-height: 1.6;
}

.brand-divider {
  width: 52px;
  height: 3px;
  margin: 30px 0 20px;
  background: #00e5ff;
  border-radius: 10px;
}

.brand-description {
  max-width: 340px;
  margin: 0 0 36px;
  color: #8593ac;
  font-size: 0.9rem;
  line-height: 1.8;
}

.logo-box {
  display: flex;
  width: 150px;
  height: 112px;
  align-items: center;
  justify-content: center;
  background: rgba(4, 8, 17, 0.55);
  border: 1px solid rgba(0, 229, 255, 0.17);
  border-radius: 15px;
}

.logo-inner {
  display: flex;
  width: 92px;
  height: 92px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 229, 255, 0.65);
  border-radius: 50%;
  box-shadow: inset 0 0 18px rgba(0, 229, 255, 0.08);
}

.logo-code {
  color: #00e5ff;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: 1px;
}

.logo-subtext {
  margin-top: 3px;
  color: #a0aec0;
  font-size: 0.55rem;
  letter-spacing: 2px;
}

.sidebar-footer {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 10px;
  color: #66738a;
  font-size: 0.7rem;
  line-height: 1.5;
}

.login-main {
  display: flex;
  min-width: 0;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  padding: clamp(28px, 5vw, 80px);
  background:
    radial-gradient(ellipse at 85% 15%, rgba(26, 53, 83, 0.14), transparent 50%),
    #080b14;
}

.form-wrapper {
  width: 100%;
  max-width: 440px;
  margin: auto;
}

.form-heading {
  margin-bottom: 38px;
}

.form-tag {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 22px;
  padding: 8px 12px;
  color: #8fa3bb;
  background: #111827;
  border: 1px solid #253146;
  border-radius: 6px;
  font-size: 0.67rem;
  font-weight: 700;
  letter-spacing: 1.5px;
}

.status-dot {
  width: 7px;
  height: 7px;
  background: #00e5ff;
  border-radius: 50%;
  box-shadow: 0 0 9px rgba(0, 229, 255, 0.55);
}

.form-title {
  margin: 0 0 12px;
  color: #f5f8ff;
  font-size: clamp(2rem, 3vw, 2.6rem);
  font-weight: 750;
  letter-spacing: -1px;
  line-height: 1.2;
}

.form-description {
  max-width: 390px;
  margin: 0;
  color: #8794aa;
  font-size: 0.95rem;
  line-height: 1.8;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-group label {
  color: #d2d9e6;
  font-size: 0.85rem;
  font-weight: 600;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  width: 20px;
  height: 20px;
  color: #77869e;
  pointer-events: none;
}

.input-wrapper input {
  display: block;
  width: 100%;
  min-width: 0;
  height: 54px;
  padding: 0 48px;
  color: #f5f8ff;
  background: #111827;
  border: 1px solid #293449;
  border-radius: 9px;
  outline: none;
  font-size: 0.9rem;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.input-wrapper input::placeholder {
  color: #68768d;
}

.input-wrapper input:hover {
  border-color: #3b4a63;
}

.input-wrapper input:focus {
  background: #131c2d;
  border-color: #00cfe8;
  box-shadow: 0 0 0 3px rgba(0, 229, 255, 0.09);
}

.checkbox-group {
  margin-top: -3px;
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.custom-checkbox {
  position: relative;
  display: inline-block;
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  background: #111827;
  border: 1px solid #354158;
  border-radius: 5px;
  transition: background 0.2s, border-color 0.2s;
}

.checkbox-label input:checked + .custom-checkbox {
  background: #00d8f0;
  border-color: #00d8f0;
}

.checkbox-label input:checked + .custom-checkbox::after {
  position: absolute;
  top: 2px;
  left: 5px;
  width: 5px;
  height: 9px;
  border: solid #061019;
  border-width: 0 2px 2px 0;
  content: '';
  transform: rotate(45deg);
}

.checkbox-label input:focus-visible + .custom-checkbox {
  outline: 2px solid #00e5ff;
  outline-offset: 3px;
}

.checkbox-text {
  color: #aab6c9;
  font-size: 0.85rem;
}

.submit-btn {
  display: flex;
  width: 100%;
  min-height: 54px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 4px;
  padding: 14px 20px;
  color: #041016;
  background: #00dff7;
  border: 1px solid #00dff7;
  border-radius: 9px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 750;
  transition: background 0.2s, box-shadow 0.2s, transform 0.2s;
}

.submit-btn svg {
  width: 19px;
  height: 19px;
  transition: transform 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #48eaff;
  box-shadow: 0 5px 25px rgba(0, 223, 247, 0.15);
}

.submit-btn:hover:not(:disabled) svg {
  transform: translateX(3px);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.error-message {
  margin: -8px 0 0;
  padding: 12px 14px;
  color: #ff9caa;
  background: rgba(255, 82, 105, 0.08);
  border: 1px solid rgba(255, 82, 105, 0.2);
  border-radius: 7px;
  font-size: 0.85rem;
  line-height: 1.5;
}

.security-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  margin-top: 34px;
  color: #718098;
  font-size: 0.78rem;
}

.security-note svg {
  width: 17px;
  height: 17px;
  color: #00bcd4;
}

@media (max-width: 900px) {
  .login-container {
    grid-template-columns: minmax(0, 1fr);
  }

  .login-sidebar {
    min-height: auto;
    padding: 36px 24px 26px;
  }

  .sidebar-content {
    flex: initial;
  }

  .brand-icon {
    width: 58px;
    height: 58px;
    margin-bottom: 20px;
    border-radius: 17px;
  }

  .brand-icon svg {
    width: 38px;
    height: 38px;
  }

  .brand-title {
    font-size: clamp(1.65rem, 5vw, 2.3rem);
  }

  .brand-subtitle {
    margin-top: 10px;
  }

  .brand-divider {
    margin: 20px 0 12px;
  }

  .brand-description {
    margin-bottom: 20px;
  }

  .logo-box {
    width: 115px;
    height: 85px;
  }

  .logo-inner {
    width: 70px;
    height: 70px;
  }

  .logo-code {
    font-size: 1.15rem;
  }

  .logo-subtext {
    font-size: 0.45rem;
  }

  .sidebar-footer {
    margin-top: 28px;
    justify-content: center;
    text-align: center;
  }

  .login-main {
    min-height: auto;
    padding: 44px 24px 54px;
  }

  .form-wrapper {
    max-width: 460px;
  }
}

@media (max-width: 480px) {
  .login-sidebar {
    padding: 28px 20px 22px;
  }

  .brand-overline {
    font-size: 0.62rem;
    letter-spacing: 2px;
  }

  .brand-description {
    max-width: 290px;
    font-size: 0.84rem;
  }

  .login-main {
    padding: 36px 22px 44px;
  }

  .form-heading {
    margin-bottom: 30px;
  }

  .form-tag {
    margin-bottom: 18px;
  }

  .form-title {
    font-size: 2rem;
  }

  .login-form {
    gap: 21px;
  }

  .input-wrapper input {
    height: 52px;
    font-size: 0.84rem;
  }

  .sidebar-footer {
    flex-direction: column;
    gap: 5px;
  }
}
</style>
