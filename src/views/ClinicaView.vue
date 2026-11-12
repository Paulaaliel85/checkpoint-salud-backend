<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import PanelPagina from '../components/PanelPagina.vue'
import { formatearFecha, formatearHora } from '../utils/fechas'
import { apiFetch } from '../services/api'

//estados reactivos para almacenar empresas, turnos y estado de carga
const empresas = ref<any[]>([])
const turnos = ref<any[]>([])
const cargando = ref(true)

//estados reactivos para el modal de registro de apto médico
const turnoActual = ref<any | null>(null)
const estadoAptitud = ref('APTO') // Valor por defecto 
const detalleClinico = ref('')
const archivoDocumento = ref<File | null>(null) //espacio para almacenar el archivo PDF seleccionado, empieza como null
const guardando = ref(false) 

//funcion que carga los datos de turnos y empresas desde la API usando apiFetch
async function cargarDatos() {
  try {
    cargando.value = true //indico que se está cargando

    //ejecuta dos consultas de forma simultánea (en paralelo) y espera a que ambas terminen para guardar sus resultados
    const [resTurnos, resEmpresas] = await Promise.all([ 
      apiFetch<any[]>('/api/turnos'), //obtiene los turnos desde la API
      apiFetch<any[]>('/api/empresas') //obtiene las empresas desde la API
    ])

    turnos.value = resTurnos || [] //si no hay turnos, asigna un array vacío
    empresas.value = resEmpresas || [] //si no hay empresas, asigna un array vacío
  } catch (error) {
    console.error('Error al conectar con el backend:', error) //muestra un error en la consola si falla la conexión
  } finally {
    cargando.value = false //indica que terminó la carga, ya sea con éxito o con error
  }
}

onMounted(() => { //cuando el componente se monta, carga los datos iniciales
  cargarDatos()
})

function manejarArchivo(event: Event) { //función que maneja la selección de archivo PDF
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    archivoDocumento.value = target.files[0]
  }
}

// Función para registrar el apto médico usando apiFetch con FormData (Multer)
async function registrarAptoMedico() {
  if (!turnoActual.value) return

  try {
    guardando.value = true

    const formData = new FormData()
    formData.append('pacienteId', turnoActual.value.pacienteId)
    formData.append('turnoId', String(turnoActual.value.id))
    formData.append('estadoAptitud', estadoAptitud.value)
    formData.append('detalleClinico', detalleClinico.value)
    
    if (archivoDocumento.value) {
      formData.append('documento', archivoDocumento.value)
    }

    // apiFetch maneja de forma inteligente que si el body es FormData, NO agregará Content-Type JSON
    await apiFetch('/api/aptos', {
      method: 'POST',
      body: formData,
    })

    alert('¡Apto médico registrado con éxito y fecha de vencimiento calculada!')
    turnoActual.value = null
    detalleClinico.value = ''
    archivoDocumento.value = null
    cargarDatos() // Refrescar lista y tarjetas
  } catch (error: any) {
    console.error('Error al registrar:', error)
    alert('Error al registrar: ' + (error.message || 'Desconocido'))
  } finally {
    guardando.value = false
  }
}
// Computed properties para filtrar turnos pendientes y próximos
const turnosPendientes = computed(() =>
  turnos.value.filter((turno) => turno.estado === 'PENDIENTE'), //filtra los turnos que están pendientes de atención
)

const proximosTurnos = computed(() => //filtra los turnos que están pendientes de llenar y toma solo 4
  turnosPendientes.value.slice(0, 4),
)

const tarjetas = computed(() => [ //crea un array de objetos que representan las tarjetas de resumen
  {
    titulo: 'Empresas',
    valor: empresas.value.length,
    descripcion: 'Empresas atendidas por la clínica.',
    icono: 'empresa',
  },
  {
    titulo: 'Turnos',
    valor: turnos.value.length,
    descripcion: 'Turnos registrados en la agenda.',
    icono: 'turno',
  },
  {
    titulo: 'Pendientes',
    valor: turnosPendientes.value.length,
    descripcion: 'Turnos que todavía deben atenderse.',
    icono: 'pendiente',
  },
  {
    titulo: 'Próximos',
    valor: proximosTurnos.value.length,
    descripcion: 'Próximos turnos de la agenda.',
    icono: 'proximo',
  },
])
</script>

<template>
  <PanelPagina
    titulo="Panel de Clínica"
    descripcion="Resumen general de la actividad de la clínica."
  >
    <section class="mx-auto max-w-[1500px]">

      <!-- Bienvenida -->
      <div class="mb-7">
        <p class="text-sm text-slate-500">
          Desde aquí podés consultar la actividad de la clínica,
          gestionar empresas y revisar los turnos programados.
        </p>
      </div>

      <!-- Tarjetas de resumen -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="tarjeta in tarjetas"
          :key="tarjeta.titulo"
          class="rounded-2xl border border-[#dbe7ee] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="mb-1 text-sm text-slate-500">{{ tarjeta.titulo }}</p>
              <p class="text-3xl font-bold text-[#173b70]">{{ tarjeta.valor }}</p>
            </div>
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e5f8fb] text-[#38b8cf]">
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <rect x="3" y="4" width="18" height="17" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
          </div>
          <p class="mt-4 text-xs leading-relaxed text-slate-500">{{ tarjeta.descripcion }}</p>
        </article>
      </div>

      <!-- Próximos turnos con opción de evaluar -->
      <div class="mt-7">
        <section class="rounded-2xl border border-[#dbe7ee] bg-white p-6 shadow-sm">
          <div class="mb-5 flex items-center justify-between">
            <h3 class="text-lg font-bold text-[#173b70]">Próximos turnos a evaluar</h3>
          </div>

          <div v-if="cargando" class="text-sm text-slate-500 py-4">Cargando turnos...</div>
          <div v-else-if="proximosTurnos.length === 0" class="text-sm text-slate-500 py-4">No hay turnos pendientes.</div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <article
              v-for="turno in proximosTurnos"
              :key="turno.id"
              class="rounded-xl border border-[#edf1f5] bg-[#f9fcfd] p-4 flex flex-col justify-between"
            >
              <div>
                <div class="flex items-start justify-between gap-4">
                  <p class="text-sm font-semibold text-[#173b70]">{{ turno.paciente?.nombre || 'Paciente' }} {{ turno.paciente?.apellido || '' }}</p>
                  <span class="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    {{ turno.estado }}
                  </span>
                </div>
                <p class="mt-1 text-xs text-slate-500">DNI: {{ turno.paciente?.dni || 'N/A' }}</p>
              </div>

              <div class="mt-4 flex items-center justify-between">
                <span class="text-xs text-slate-500">{{ formatearFecha(turno.fechaHora) }} - {{ formatearHora(turno.fechaHora) }} hs</span>
                <button
                  @click="turnoActual = turno"
                  class="rounded-lg border border-[#173b70] bg-[#173b70] px-4 py-2 text-xs font-semibold text-white hover:bg-[#122d56] transition-colors"
                >
                  Registrar Apto
                </button>
              </div>
            </article>
          </div>
        </section>
      </div>

      <!-- Modal / Formulario flotante para CHK-15 con Multer PDF -->
      <div v-if="turnoActual" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          <h3 class="text-lg font-bold text-[#173b70] mb-4">Registrar Apto Médico</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Estado de Aptitud</label>
              <select v-model="estadoAptitud" class="w-full rounded-lg border border-slate-300 p-2 text-sm">
                <option value="">Seleccionar estado</option>
                <option value="APTO">Apto</option>
                <option value="APTO_CON_OBSERVACIONES">Apto con Observaciones</option>
                <option value="NO_APTO">No Apto</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Detalle Clínico / Observaciones</label>
              <textarea
                v-model="detalleClinico"
                rows="3"
                placeholder="Indique restricciones, observaciones o motivos..."
                class="w-full rounded-lg border border-slate-300 p-2 text-sm"
              ></textarea>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Certificado PDF Adjunto</label>
              <input
                type="file"
                accept=".pdf"
                @change="manejarArchivo"
                class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#173b70] file:text-white hover:file:bg-[#122d56] cursor-pointer"
              />
              <span class="text-[11px] text-slate-400 mt-1 block">Máximo 5 MB. Formato PDF obligatorio.</span>
            </div>

            <div class="flex justify-end gap-3 mt-6">
              <button
                @click="turnoActual = null"
                class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                @click="registrarAptoMedico"
                :disabled="guardando"
                class="rounded-lg border border-[#173b70] bg-[#173b70] px-5 py-2 text-sm font-semibold text-white hover:bg-[#122d56] disabled:opacity-50"
              >
                {{ guardando ? 'Guardando...' : 'Guardar y Calcular Vencimiento' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </PanelPagina>
</template>