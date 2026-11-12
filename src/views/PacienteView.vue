
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { apiFetch } from '../services/api'
import type { Turno, RespuestaTurnos, Apto, RespuestaApto } from '../types/paciente'

const authStore = useAuthStore()
const router = useRouter()


const turnos = ref<Turno[]>([])
const apto = ref<Apto | null>(null)

const cargandoTurnos = ref(true)
const cargandoApto = ref(true)
const errorTurnos = ref('')
const errorApto = ref('')

async function obtenerTurnos() {
  try {
    cargandoTurnos.value = true

    const respuesta = await apiFetch<RespuestaTurnos>(
      '/api/paciente/turnos',
    )

    turnos.value = respuesta.turnos ?? []
  } catch (error) {
    console.error('Error al obtener los turnos:', error)
    errorTurnos.value = 'No se pudieron cargar tus turnos.'
  } finally {
    cargandoTurnos.value = false
  }
}

async function obtenerApto() {
  try {
    cargandoApto.value = true

    const respuesta = await apiFetch<RespuestaApto>(
      '/api/aptos/paciente/actual',
    )

    apto.value = respuesta.apto
  } catch (error) {
    console.error('Error al obtener el apto médico:', error)

    const mensaje = error instanceof Error ? error.message : ''

    if (mensaje.includes('Todavía no tenés un apto médico registrado')) {
      apto.value = null
      errorApto.value = ''
    } else {
      errorApto.value = 'No se pudo consultar tu apto médico.'
    }
  } finally {
    cargandoApto.value = false
  }
}

// Próximo turno
const turnoProximo = computed(() => {
  const turno = turnos.value
    .filter((item) => new Date(item.fechaHora).getTime() >= Date.now())
    .sort(
      (a, b) =>
        new Date(a.fechaHora).getTime() -
        new Date(b.fechaHora).getTime(),
    )[0]

  if (!turno) return null

  const fecha = new Date(turno.fechaHora)

  const formatoFecha = new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  })

  const formatoPartes = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).formatToParts(fecha)

  const dia =
    formatoPartes.find((parte) => parte.type === 'day')?.value ?? ''

  const mes =
    formatoPartes
      .find((parte) => parte.type === 'month')
      ?.value.replace('.', '')
      .toUpperCase() ?? ''

  const hora = new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(fecha)

  return {
    fecha: formatoFecha.format(fecha),
    dia,
    mes,
    hora,
    sede: turno.sede?.nombre ?? 'Sin sede asignada',
    direccion: turno.sede?.direccion ?? '',
    estado: turno.estado,
  }
})

// Nombre del paciente
const nombrePaciente = computed(() => {
  const nombre = authStore.usuario?.email?.split('@')[0] || 'Paciente'

  return nombre.charAt(0).toUpperCase() + nombre.slice(1)
})

// Cálculo de días restantes.
// Se comparan fechas de calendario para evitar errores por horas.
function calcularDiasRestantes(fechaVencimiento: string): number {
  const partes = fechaVencimiento.slice(0, 10).split('-').map(Number)

  const vencimiento = Date.UTC(partes[0], partes[1] - 1, partes[2])
  const ahora = new Date()

  const hoy = Date.UTC(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate(),
  )

  return Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))
}

const diasRestantes = computed(() => {
  if (!apto.value?.fechaVencimiento) return null

  return calcularDiasRestantes(apto.value.fechaVencimiento)
})

const estadoAptoTexto = computed(() => {
  if (!apto.value) return ''

  const estados: Record<string, string> = {
    APTO: 'Apto',
    APTO_CON_OBSERVACIONES: 'Apto con observaciones',
    NO_APTO: 'No apto',
  }

  return estados[apto.value.estadoAptitud] ?? apto.value.estadoAptitud
})

const estadoVencimiento = computed(() => {
  if (!apto.value) return null

  if (apto.value.estadoAptitud === 'NO_APTO') {
    return {
      titulo: 'Resultado no apto',
      descripcion: 'Comunicate con la clínica o tu empresa para recibir indicaciones.',
      color: 'red',
    }
  }

  if (!apto.value.fechaVencimiento) {
    return {
      titulo: 'Sin fecha de vencimiento',
      descripcion: 'Consultá con la clínica para obtener más información.',
      color: 'slate',
    }
  }

  const dias = diasRestantes.value!

  if (dias < 0) {
    return {
      titulo: 'Apto médico vencido',
      descripcion: 'Tu apto necesita renovarse. Comunicate con tu empresa.',
      color: 'red',
    }
  }

  if (dias <= 30) {
    return {
      titulo: '¡Próximo vencimiento!',
      descripcion: 'Tu apto está próximo a vencer. Comunicate con tu empresa para coordinar la renovación.',
      color: 'amber',
    }
  }

  return {
    titulo: 'Tu apto está vigente',
    descripcion: 'Por el momento no necesitás realizar ninguna renovación.',
    color: 'green',
  }
})

function formatearFecha(fecha: string): string {
  const partes = fecha.slice(0, 10).split('-').map(Number)

  const fechaLocal = new Date(
    partes[0],
    partes[1] - 1,
    partes[2],
  )

  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fechaLocal)
}

function cerrarSesion() {
  authStore.cerrarSesion()
  router.push('/login')
}

onMounted(() => {
  obtenerTurnos()
  obtenerApto()
})
</script>

<template>
  <div class="min-h-screen bg-[#f2f8fc] font-sans text-[#173b70]">

    <!-- Encabezado -->
    <header class="border-b border-[#dceaf2] bg-white px-5 py-5 shadow-sm sm:px-8 lg:px-12">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">

        <div class="flex min-w-0 items-center gap-3">
          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-200 bg-[#e8faff] text-2xl font-bold text-[#00bcd4]"
            aria-hidden="true"
          >
            +
          </div>

          <div>
            <h1 class="text-lg font-extrabold tracking-tight sm:text-xl">
              CHECKPOINT <span class="text-[#00bcd4]">SALUD</span>
            </h1>
            <p class="mt-1 text-xs text-slate-500 sm:text-sm">
              Portal del paciente
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="cerrarSesion"
          class="inline-flex items-center gap-2 rounded-lg border border-[#dce6ef] bg-white px-4 py-2.5 text-sm font-semibold text-[#52677f] transition hover:border-cyan-300 hover:bg-[#f0fbfd] hover:text-[#008fa3]"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M10 17l5-5-5-5M15 12H3" />
            <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </header>

    <!-- Contenido principal -->
    <main class="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12">

      <!-- Bienvenida -->
      <section class="mb-9 sm:mb-10">
        <div class="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-white px-3 py-2 text-[10px] font-bold tracking-[1.5px] text-[#168ca2] shadow-sm sm:text-xs">
          <span class="h-2 w-2 rounded-full bg-[#00bcd4]"></span>
          MI PORTAL DE SALUD
        </div>

        <h2 class="text-3xl font-bold tracking-tight text-[#173b70] sm:text-4xl">
          ¡Hola, <span class="text-[#00bcd4]">{{ nombrePaciente }}</span>!
        </h2>

        <p class="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
          Consultá la información de tu próximo turno y conocé el estado
          y vencimiento de tu apto médico.
        </p>
      </section>

      <!-- Tarjetas principales -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">

        <!-- Próximo turno -->
        <section class="rounded-2xl border border-[#dceaf2] bg-white p-5 shadow-sm sm:p-7">
          <div class="mb-6 flex items-center justify-between gap-4 border-b border-[#edf2f7] pb-5">
            <div>
              <p class="mb-2 text-[10px] font-bold tracking-[1.8px] text-[#00a9c1] sm:text-xs">
                AGENDA
              </p>
              <h3 class="text-xl font-bold text-[#173b70] sm:text-2xl">
                Tu próximo turno
              </h3>
              <p class="mt-2 text-sm text-slate-500">
                Información de tu próxima cita médica.
              </p>
            </div>

            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e8faff] text-[#00a9c1]">
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 10h18" />
                <path d="m9 15 2 2 4-4" />
              </svg>
            </div>
          </div>

          <div v-if="cargandoTurnos" class="py-10 text-center text-sm text-slate-500">
            Cargando tus turnos...
          </div>

          <div v-else-if="errorTurnos" class="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {{ errorTurnos }}
          </div>

          <article v-else-if="turnoProximo" class="rounded-xl border border-[#dceaf2] bg-[#f6fbfe] p-5">

            <span class="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              {{ turnoProximo.estado }}
            </span>

            <h4 class="mt-4 text-lg font-bold text-[#173b70]">
              Control de salud ocupacional
            </h4>

            <div class="mt-5 space-y-4">
              <div class="flex items-center gap-3">
                <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-[#e8faff] text-[#00a9c1]">
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M16 3v4M8 3v4M3 10h18" />
                  </svg>
                </div>
                <div>
                  <p class="text-xs text-slate-500">Fecha</p>
                  <p class="mt-1 text-sm font-semibold text-[#173b70]">
                    {{ turnoProximo.fecha }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-[#e8faff] text-[#00a9c1]">
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </div>
                <div>
                  <p class="text-xs text-slate-500">Horario</p>
                  <p class="mt-1 text-sm font-semibold text-[#173b70]">
                    {{ turnoProximo.hora }} hs.
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-[#e8faff] text-[#00a9c1]">
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </div>
                <div>
                  <p class="text-xs text-slate-500">Sede</p>
                  <p class="mt-1 text-sm font-semibold text-[#173b70]">
                    {{ turnoProximo.sede }}
                  </p>
                  <p v-if="turnoProximo.direccion" class="text-xs text-slate-500">
                    {{ turnoProximo.direccion }}
                  </p>
                </div>
              </div>
            </div>

            <div class="mt-5 rounded-lg border border-cyan-100 bg-white p-4">
              <p class="text-sm font-semibold text-[#168ca2]">
                Recordatorio
              </p>
              <p class="mt-1 text-sm leading-6 text-slate-500">
                Te recomendamos presentarte unos minutos antes del horario
                indicado. Si necesitás modificar tu asistencia, comunicate
                con tu empresa.
              </p>
            </div>
          </article>

          <article v-else class="rounded-xl border border-dashed border-[#cbdce8] bg-[#f8fbfd] px-5 py-10 text-center">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8faff] text-[#00a9c1]">
              <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 10h18M9 15h6" />
              </svg>
            </div>
            <h4 class="font-bold text-[#173b70]">
              No tenés turnos próximos
            </h4>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              Cuando tu empresa te asigne un turno, vas a poder consultar
              acá la fecha, el horario y la sede correspondiente.
            </p>
          </article>
        </section>

        <!-- Estado del apto médico -->
        <section class="rounded-2xl border border-[#dceaf2] bg-white p-5 shadow-sm sm:p-7">
          <div class="mb-6 flex items-center justify-between gap-4 border-b border-[#edf2f7] pb-5">
            <div>
              <p class="mb-2 text-[10px] font-bold tracking-[1.8px] text-[#00a9c1] sm:text-xs">
                SALUD OCUPACIONAL
              </p>
              <h3 class="text-xl font-bold text-[#173b70] sm:text-2xl">
                Tu apto médico
              </h3>
              <p class="mt-2 text-sm text-slate-500">
                Estado y fecha de vencimiento.
              </p>
            </div>

            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e8faff] text-[#00a9c1]">
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M8 3h7l5 5v13H4V3h4Z" />
                <path d="M14 3v6h6M8 14h8M8 18h5" />
              </svg>
            </div>
          </div>

          <div v-if="cargandoApto" class="py-10 text-center text-sm text-slate-500">
            Consultando tu apto médico...
          </div>

          <div v-else-if="errorApto" class="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {{ errorApto }}
          </div>

          <article v-else-if="apto" class="rounded-xl border border-[#dceaf2] bg-[#f6fbfe] p-5">

            <div class="flex flex-wrap items-center justify-between gap-3">
              <span class="text-sm font-semibold text-slate-500">
                Resultado del examen
              </span>

              <span
                class="rounded-full px-3 py-1.5 text-xs font-bold"
                :class="{
                  'bg-emerald-100 text-emerald-700': apto.estadoAptitud === 'APTO',
                  'bg-amber-100 text-amber-700': apto.estadoAptitud === 'APTO_CON_OBSERVACIONES',
                  'bg-red-100 text-red-700': apto.estadoAptitud === 'NO_APTO',
                }"
              >
                {{ estadoAptoTexto }}
              </span>
            </div>

            <div class="mt-7 text-center">
              <template v-if="apto.estadoAptitud === 'NO_APTO'">
                <p class="text-2xl font-extrabold text-red-600">
                  No apto
                </p>
                <p class="mt-2 text-sm text-slate-500">
                  Consultá con la clínica para recibir indicaciones.
                </p>
              </template>

              <template v-else-if="diasRestantes !== null">
                <p
                  class="text-5xl font-extrabold tracking-tight"
                  :class="{
                    'text-emerald-600': diasRestantes > 30,
                    'text-amber-500': diasRestantes >= 0 && diasRestantes <= 30,
                    'text-red-600': diasRestantes < 0,
                  }"
                >
                  {{ diasRestantes < 0 ? Math.abs(diasRestantes) : diasRestantes }}
                </p>

                <p class="mt-2 text-sm font-semibold text-slate-500">
                  {{ diasRestantes < 0
                    ? 'días desde el vencimiento'
                    : diasRestantes === 0
                      ? 'vence hoy'
                      : 'días restantes'
                  }}
                </p>
              </template>

              <template v-else>
                <p class="text-xl font-bold text-slate-600">
                  Sin vencimiento registrado
                </p>
              </template>
            </div>

            <div class="mt-7 space-y-3 border-t border-[#dceaf2] pt-5">
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm text-slate-500">
                  Fecha de emisión
                </span>
                <strong class="text-right text-sm text-[#173b70]">
                  {{ formatearFecha(apto.fechaEmision) }}
                </strong>
              </div>

              <div class="flex items-center justify-between gap-3">
                <span class="text-sm text-slate-500">
                  Fecha de vencimiento
                </span>
                <strong class="text-right text-sm text-[#173b70]">
                  {{ apto.fechaVencimiento
                    ? formatearFecha(apto.fechaVencimiento)
                    : 'No registrada'
                  }}
                </strong>
              </div>
            </div>

            <!-- Alerta según vencimiento -->
            <div
              v-if="estadoVencimiento"
              class="mt-5 rounded-lg border p-4"
              :class="{
                'border-emerald-200 bg-emerald-50': estadoVencimiento.color === 'green',
                'border-amber-200 bg-amber-50': estadoVencimiento.color === 'amber',
                'border-red-200 bg-red-50': estadoVencimiento.color === 'red',
                'border-slate-200 bg-slate-50': estadoVencimiento.color === 'slate',
              }"
            >
              <p
                class="text-sm font-bold"
                :class="{
                  'text-emerald-700': estadoVencimiento.color === 'green',
                  'text-amber-700': estadoVencimiento.color === 'amber',
                  'text-red-700': estadoVencimiento.color === 'red',
                  'text-slate-700': estadoVencimiento.color === 'slate',
                }"
              >
                {{ estadoVencimiento.titulo }}
              </p>

              <p class="mt-1 text-sm leading-6 text-slate-600">
                {{ estadoVencimiento.descripcion }}
              </p>
            </div>
          </article>

          <article v-else class="rounded-xl border border-dashed border-[#cbdce8] bg-[#f8fbfd] px-5 py-10 text-center">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8faff] text-[#00a9c1]">
              <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                <path d="M8 3h7l5 5v13H4V3h4Z" />
                <path d="M14 3v6h6M8 14h8M8 18h5" />
              </svg>
            </div>

            <h4 class="font-bold text-[#173b70]">
              Todavía no tenés un apto registrado
            </h4>

            <p class="mt-2 text-sm leading-6 text-slate-500">
              Cuando la clínica registre el resultado de tu examen,
              vas a poder consultar acá tu estado y vencimiento.
            </p>
          </article>
        </section>
      </div>

      <!-- Pie de página -->
      <footer class="mt-10 flex flex-col items-center justify-between gap-2 border-t border-[#dceaf2] py-6 text-center text-xs text-slate-400 sm:flex-row sm:text-left">
        <p>© 2026 CheckPoint Salud</p>
        <p class="flex items-center gap-2">
          <svg class="h-4 w-4 text-[#00bcd4]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          Tu información, de forma clara y segura.
        </p>
      </footer>

    </main>
  </div>
</template>
