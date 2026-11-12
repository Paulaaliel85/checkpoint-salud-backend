
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { apiFetch } from '../services/api'
import type { Empresa, RolUsuario } from '../types/admin.ts'

const authStore = useAuthStore()
const router = useRouter()
// Aca estan las variables reactivas para el formulario de registro de trabajadores y usuarios
const empresas = ref<Empresa[]>([])
const tipoCuenta = ref<RolUsuario>('PACIENTE')
// El formulario comienza como campos vacios
const empresaId = ref('')
const puestoId = ref('')
const dni = ref('')
const nombre = ref('')
const apellido = ref('')
const email = ref('')
const password = ref('')
// Estados de carga y mensajes
const cargando = ref(false)
const cargandoEmpresas = ref(false)
const mensaje = ref('')
const error = ref('')
// Computed properties para filtrar los puestos disponibles según la empresa seleccionada
const puestosDisponibles = computed(() => {
  return empresas.value.find((empresa) => empresa.id === empresaId.value)?.puestos ?? []
})
// Computed properties para determinar el tipo de cuenta seleccionado
const esPaciente = computed(() => tipoCuenta.value === 'PACIENTE')
const esEmpresa = computed(() => tipoCuenta.value === 'EMPRESA')

//funcion de cierre de sesion
function cerrarSesion() {
  authStore.cerrarSesion()
  router.push('/login')
}

async function cargarEmpresas() {
  cargandoEmpresas.value = true
  error.value = ''

  try {
    empresas.value = await apiFetch<Empresa[]>('/api/empresas')
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : 'No se pudieron cargar las empresas.'
  } finally {
    cargandoEmpresas.value = false
  }
}
// si cambiamos el tipo de cuenta, el formulario se limpia, al igual que la empresa 
function limpiarFormulario() {
  dni.value = ''
  nombre.value = ''
  apellido.value = ''
  email.value = ''
  password.value = ''
  empresaId.value = ''
  puestoId.value = ''
}

function cambiarTipoCuenta() {
  mensaje.value = ''
  error.value = ''
  limpiarFormulario()
}

function cambiarEmpresa() {
  puestoId.value = ''
}
// si uno de los campos no esta completo muestra mensaje de error
async function crearTrabajador() {
  mensaje.value = ''
  error.value = ''

  if (!nombre.value.trim() || !apellido.value.trim()) {
    error.value = 'Completá el nombre y el apellido.'
    return
  }

  cargando.value = true

  try {
    if (esPaciente.value) {
      if (!dni.value.trim()) {
        throw new Error('Completá el DNI del trabajador.')
      }

      if (!empresaId.value || !puestoId.value) {
        throw new Error('Seleccioná una empresa y un puesto.')
      }
// si la empresa o el puesto no son validos, muestra mensaje de error
      const empresa = empresas.value.find((item) => item.id === empresaId.value)
      const puesto = puestosDisponibles.value.find((item) => item.id === puestoId.value)

      if (!empresa || !puesto) {
        throw new Error('La empresa o el puesto seleccionado no son válidos.')
      }
// si todo es correcto, hace la peticion al servidor para crear el trabajador
      const respuesta = await apiFetch<{
        mensaje: string
        totalErrores: number
        detallesErrores: string[]
      }>('/api/trabajadores/carga-masiva', {
        method: 'POST',
        body: JSON.stringify({
          trabajadores: [
            {
              dni: dni.value.trim(),
              nombre: nombre.value.trim(),
              apellido: apellido.value.trim(),
              cuitEmpresa: empresa.cuit,
              nombrePuesto: puesto.nombrePuesto,
            },
          ],
        }),
      })
// si hay errores en la respuesta, muestra mensaje de error
      if (respuesta.totalErrores > 0) {
        throw new Error(respuesta.detallesErrores.join(' '))
      }
// si todo es correcto, muestra mensaje de exito
      mensaje.value =
        `Trabajador ${nombre.value.trim()} ${apellido.value.trim()} registrado correctamente. Usuario y contraseña: ${dni.value.trim()}.`
    } else {
      if (!email.value.trim() || !password.value) {
        throw new Error('Completá el correo y la contraseña.')
      }

      if (password.value.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres.')
      }

      if (esEmpresa.value && !empresaId.value) {
        throw new Error('Seleccioná la empresa asociada a esta cuenta.')
      }
// si todo es correcto, hace la peticion al servidor para crear el usuario
      const respuesta = await apiFetch<{
        mensaje: string
      }>('/api/usuarios', {
        method: 'POST',
        body: JSON.stringify({
          nombre: nombre.value.trim(),
          apellido: apellido.value.trim(),
          email: email.value.trim(),
          password: password.value,
          rol: tipoCuenta.value,
          empresaId: esEmpresa.value ? empresaId.value : null,
        }),
      })

      mensaje.value = respuesta.mensaje
    }

    limpiarFormulario()
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : 'No se pudo crear la cuenta.'
  } finally {
    cargando.value = false
  }
}

onMounted(cargarEmpresas)
</script>

<template>
  <main class="pagina">
    <header class="encabezado">
      <div>
        <h1>CheckPoint Salud</h1>
        <p>Panel de Administración</p>
      </div>

      <button @click="cerrarSesion" class="btn-salir">
        Cerrar sesión
      </button>
    </header>

    <section class="contenido">
      <h2>Bienvenido al panel de Administración</h2>

      <p class="subtitulo-seccion">
        Desde este espacio podés registrar trabajadores y administrar los accesos al sistema.
      </p>

      <section class="seccion-gestion-usuarios">
        <h3>Crear usuario</h3>

        <form class="formulario-alta" @submit.prevent="crearTrabajador">
          <div class="inputs-group">
            <label>
              Tipo de cuenta
              <select
                v-model="tipoCuenta"
                class="select-rol"
                @change="cambiarTipoCuenta"
                required
              >
                <option value="PACIENTE">Paciente / Trabajador</option>
                <option value="CLINICA">Clínica</option>
                <option value="EMPRESA">Empresa</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </label>

            <label>
              Nombre
              <input
                v-model="nombre"
                type="text"
                placeholder="Nombre"
                class="input-texto"
                required
              />
            </label>

            <label>
              Apellido
              <input
                v-model="apellido"
                type="text"
                placeholder="Apellido"
                class="input-texto"
                required
              />
            </label>

            <template v-if="esPaciente">
              <label>
                DNI
                <input
                  v-model="dni"
                  type="text"
                  inputmode="numeric"
                  placeholder="Número de DNI"
                  class="input-texto"
                  required
                />
              </label>

              <label>
                Empresa
                <select
                  v-model="empresaId"
                  class="select-rol"
                  required
                  @change="cambiarEmpresa"
                >
                  <option value="" disabled>Seleccionar empresa</option>
                  <option
                    v-for="empresa in empresas"
                    :key="empresa.id"
                    :value="empresa.id"
                  >
                    {{ empresa.razonSocial }}
                  </option>
                </select>
              </label>

              <label>
                Puesto
                <select
                  v-model="puestoId"
                  class="select-rol"
                  required
                  :disabled="!empresaId"
                >
                  <option value="" disabled>Seleccionar puesto</option>
                  <option
                    v-for="puesto in puestosDisponibles"
                    :key="puesto.id"
                    :value="puesto.id"
                  >
                    {{ puesto.nombrePuesto }}
                  </option>
                </select>
              </label>
            </template>

            <template v-else>
              <label>
                Correo electrónico
                <input
                  v-model="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  class="input-texto"
                  autocomplete="email"
                  required
                />
              </label>

              <label>
                Contraseña inicial
                <input
                  v-model="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  class="input-texto"
                  autocomplete="new-password"
                  minlength="8"
                  required
                />
              </label>

              <label v-if="esEmpresa">
                Empresa asociada
                <select
                  v-model="empresaId"
                  class="select-rol"
                  required
                >
                  <option value="" disabled>Seleccionar empresa</option>
                  <option
                    v-for="empresa in empresas"
                    :key="empresa.id"
                    :value="empresa.id"
                  >
                    {{ empresa.razonSocial }}
                  </option>
                </select>
              </label>
            </template>
          </div>

          <p v-if="mensaje" class="mensaje-exito">{{ mensaje }}</p>
          <p v-if="error" class="mensaje-error">{{ error }}</p>

          <button
            type="submit"
            class="btn-agregar"
            :disabled="cargando || cargandoEmpresas"
          >
            {{ cargando ? 'Guardando...' : 'Crear cuenta' }}
          </button>

          <p v-if="cargandoEmpresas" class="ayuda">
            Cargando empresas...
          </p>

          <p v-else-if="empresas.length === 0" class="ayuda">
            No hay empresas registradas o no se pudieron cargar.
          </p>
        </form>

        <div class="informacion-acceso">
          <h4>Credenciales de acceso</h4>

          <template v-if="esPaciente">
            <p>El trabajador ingresará utilizando:</p>
            <ul>
              <li><strong>Usuario:</strong> su número de DNI.</li>
              <li><strong>Contraseña inicial:</strong> su número de DNI.</li>
            </ul>
          </template>

          <template v-else>
            <p>El personal ingresará utilizando:</p>
            <ul>
              <li><strong>Usuario:</strong> el correo electrónico registrado.</li>
              <li><strong>Contraseña:</strong> la contraseña inicial asignada.</li>
            </ul>
          </template>
        </div>
      </section>

      <div class="tarjetas">
        <article class="tarjeta">
          <h3>Trabajadores</h3>
          <p>Registro de empleados y asociación con sus empresas y puestos.</p>
        </article>

        <article class="tarjeta">
          <h3>Empresas</h3>
          <p>Consulta de las empresas registradas en el sistema.</p>
        </article>

        <article class="tarjeta">
          <h3>Accesos</h3>
          <p>Creación de cuentas según el rol de cada usuario.</p>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.pagina {
  min-height: 100vh;
  padding: 32px;
  background: #f4f6fa;
  color: #172033;
  font-family: 'Segoe UI', Arial, sans-serif;
}

.encabezado {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding-bottom: 24px;
  border-bottom: 1px solid #dce2eb;
}

.encabezado h1 {
  margin: 0;
  color: #173b70;
  font-size: 28px;
}

.encabezado p {
  margin: 6px 0 0;
  color: #64748b;
}

.btn-salir {
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  background: #173b70;
  color: white;
  cursor: pointer;
  font-weight: 600;
}

.btn-salir:hover {
  background: #24518f;
}

.contenido {
  max-width: 1100px;
  margin: 30px auto;
}

.contenido h2 {
  margin-bottom: 8px;
  color: #173b70;
}

.subtitulo-seccion {
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 24px;
}

.seccion-gestion-usuarios {
  background: white;
  padding: 28px;
  border-radius: 12px;
  border: 1px solid #e0e6ef;
  box-shadow: 0 4px 12px rgb(15 23 42 / 4%);
}

.seccion-gestion-usuarios h3,
.seccion-gestion-usuarios h4 {
  color: #173b70;
  margin-top: 0;
}

.formulario-alta {
  background: #f8fafc;
  padding: 18px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.inputs-group {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.inputs-group label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: #475569;
  font-size: 14px;
  font-weight: 600;
}

.input-texto,
.select-rol {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: white;
  color: #1e293b;
}

.input-texto:focus,
.select-rol:focus {
  border-color: #173b70;
  box-shadow: 0 0 0 3px rgb(23 59 112 / 10%);
}

.select-rol:disabled {
  background: #e2e8f0;
  cursor: not-allowed;
}

.btn-agregar {
  background: #10b981;
  color: white;
  padding: 11px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-agregar:hover {
  background: #059669;
}

.btn-agregar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mensaje-exito,
.mensaje-error,
.ayuda {
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
}

.mensaje-exito {
  color: #047857;
  background: #d1fae5;
}

.mensaje-error {
  color: #b91c1c;
  background: #fee2e2;
}

.ayuda {
  color: #64748b;
  background: #f1f5f9;
}

.informacion-acceso {
  margin-top: 24px;
  padding: 18px;
  background: #eff6ff;
  border-radius: 10px;
  color: #334155;
}

.informacion-acceso h4 {
  margin-bottom: 8px;
}

.informacion-acceso p {
  margin-bottom: 8px;
}

.informacion-acceso ul {
  padding-left: 22px;
  margin: 0;
  line-height: 1.8;
}

.tarjetas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-top: 30px;
}

.tarjeta {
  padding: 24px;
  border: 1px solid #e0e6ef;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 12px rgb(15 23 42 / 4%);
}

.tarjeta h3 {
  margin-top: 0;
  color: #173b70;
  font-size: 18px;
}

.tarjeta p {
  margin-bottom: 0;
  color: #64748b;
  line-height: 1.5;
  font-size: 14px;
}

@media (max-width: 650px) {
  .pagina {
    padding: 18px;
  }

  .inputs-group {
    grid-template-columns: 1fr;
  }

  .encabezado {
    align-items: flex-start;
  }
}
</style>
