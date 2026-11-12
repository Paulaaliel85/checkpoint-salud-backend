<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PanelPagina from '../../components/PanelPagina.vue'
import { apiFetch } from '../../services/api'
import { diasRestantes, formatearFecha } from '../../utils/fechas'

interface AptoMedico {
  id: string
  estadoAptitud: 'APTO' | 'APTO_CON_OBSERVACIONES' | 'NO_APTO'
  fechaEmision: string | null
  fechaVencimiento: string
  paciente: {
    id: string
    nombre: string
    apellido: string
    empresa: {
      razonSocial: string
    }
    puesto: {
      nombrePuesto: string
    }
  }
}

interface RespuestaAptos {
  mensaje: string
  aptos: AptoMedico[]
}

// Datos reales
const aptos = ref<AptoMedico[]>([])

// Estados de la vista
const cargando = ref(true)
const error = ref('')

// Estados de filtro
const filtroEstado = ref<string>('TODOS')
const filtroPuesto = ref<string>('TODOS')
const busqueda = ref('')

const filtrosEstado = [
  { valor: 'TODOS', etiqueta: 'Todos los estados' },
  { valor: 'CRITICO', etiqueta: 'Críticos (menos de 7 días)' },
  { valor: 'ADVERTENCIA', etiqueta: 'Advertencia (más de 7 días)' },
]

// Obtener los aptos filtrados por la empresa autenticada
async function cargarAptos() {
  cargando.value = true
  error.value = ''

  try {
    const respuesta = await apiFetch<RespuestaAptos>('/api/aptos')
    aptos.value = respuesta.aptos
  } catch (err) {
    error.value =
      err instanceof Error
        ? err.message
        : 'No se pudieron cargar los aptos médicos de la empresa.'
  } finally {
    cargando.value = false
  }
}

// Procesar los aptos recibidos
const aptosLista = computed(() => {
  return aptos.value
    .map((apto) => {
      const dias = apto.fechaVencimiento ? diasRestantes(apto.fechaVencimiento) : 999

      let estadoFiltro = 'ADVERTENCIA'

      if (dias <= 7) {
        estadoFiltro = 'CRITICO'
      }

      const texto =
        dias < 0
          ? `Vencido hace ${-dias} días`
          : dias === 0
            ? 'Vence hoy'
            : dias === 1
              ? 'Vence mañana'
              : `Vence en ${dias} días`

      return {
        id: apto.id,
        nombre: `${apto.paciente.apellido}, ${apto.paciente.nombre}`,
        empresa: apto.paciente.empresa.razonSocial,
        puesto: apto.paciente.puesto.nombrePuesto,
        fechaVencimiento: apto.fechaVencimiento,
        estadoAptitud: apto.estadoAptitud,
        dias,
        texto,
        estadoFiltro,
        urgente: dias <= 7,
      }
    })
    .sort((a, b) => a.dias - b.dias)
})

// Puestos disponibles para el selector (se calculan dinámicamente)
const puestosDisponibles = computed(() => {
  const puestos = new Set<string>()

  for (const item of aptosLista.value) {
    if (item.puesto) {
      puestos.add(item.puesto)
    }
  }

  return Array.from(puestos)
})

// Filtrado combinado por texto, estado y puesto
const aptosFiltrados = computed(() => {
  return aptosLista.value.filter((item) => {
    const coincideFiltroEstado =
      filtroEstado.value === 'TODOS' ||
      item.estadoFiltro === filtroEstado.value

    const coincideFiltroPuesto =
      filtroPuesto.value === 'TODOS' ||
      item.puesto === filtroPuesto.value

    const textoBusqueda = busqueda.value.toLowerCase()

    const coincideTexto =
      item.nombre.toLowerCase().includes(textoBusqueda) ||
      item.puesto.toLowerCase().includes(textoBusqueda)

    return coincideFiltroEstado && coincideFiltroPuesto && coincideTexto
  })
})

onMounted(cargarAptos)
</script>

<template>
  <PanelPagina
    titulo="Aptos y vencimientos"
    descripcion="Estado de aptitud y control preventivo de vencimientos del personal de la empresa."
  >
    <!-- Controles de búsqueda y filtros -->
    <div class="mt-5 mb-3 flex flex-wrap items-center justify-between gap-3">
      <!-- Buscador -->
      <div class="relative flex-1 max-w-sm">
        <input
          v-model="busqueda"
          type="text"
          placeholder="Buscar por trabajador o puesto..."
          class="w-full rounded-lg border border-[#dce2eb] bg-white px-3 py-2 text-sm text-[#172033] focus:outline-none focus:border-[#173b70]"
        />
      </div>

      <!-- Filtros y contador -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Selector por puesto -->
        <select
          v-model="filtroPuesto"
          class="ml-4 rounded-lg border border-[#dce2eb] bg-white px-3 py-2 text-sm text-[#172033] cursor-pointer focus:outline-none focus:border-[#173b70]"
        >
          <option value="TODOS">Todos los puestos</option>
          <option
            v-for="puesto in puestosDisponibles"
            :key="puesto"
            :value="puesto"
          >
            {{ puesto }}
          </option>
        </select>

        <!-- Selector por estado -->
        <select
          v-model="filtroEstado"
          class="rounded-lg border border-[#dce2eb] bg-white px-3 py-2 text-sm text-[#172033] cursor-pointer focus:outline-none focus:border-[#173b70]"
        >
          <option
            v-for="f in filtrosEstado"
            :key="f.valor"
            :value="f.valor"
          >
            {{ f.etiqueta }}
          </option>
        </select>

        <div class="text-sm text-slate-500 whitespace-nowrap">
          {{ aptosFiltrados.length }} registros
        </div>
      </div>
    </div>

    <!-- Tabla -->
    <div class="overflow-x-auto rounded-xl border border-[#e0e6ef] bg-white shadow-sm">
      <table class="w-full border-collapse text-left text-sm">
        <thead class="bg-[#f4f6fa] text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3 font-semibold">Trabajador</th>
            <th class="px-4 py-3 font-semibold">Puesto</th>
            <th class="px-4 py-3 font-semibold">Aptitud</th>
            <th class="px-4 py-3 font-semibold">Fecha de Vencimiento</th>
            <th class="px-4 py-3 font-semibold">Días Restantes</th>
          </tr>
        </thead>

        <tbody>
          <!-- Cargando -->
          <tr v-if="cargando">
            <td
              colspan="5"
              class="px-4 py-8 text-center text-slate-500"
            >
              Cargando aptos médicos...
            </td>
          </tr>

          <!-- Error -->
          <tr v-else-if="error">
            <td
              colspan="5"
              class="px-4 py-8 text-center text-red-600"
            >
              {{ error }}
              <button
                type="button"
                @click="cargarAptos"
                class="ml-2 font-semibold underline"
              >
                Reintentar
              </button>
            </td>
          </tr>

          <!-- Registros reales -->
          <template v-else>
            <tr
              v-for="item in aptosFiltrados"
              :key="item.id"
              class="border-t border-[#e0e6ef]"
            >
              <td class="px-4 py-3 font-medium">
                {{ item.nombre }}
              </td>

              <td class="px-4 py-3 text-slate-600">
                {{ item.puesto }}
              </td>

              <td class="px-4 py-3">
                <span
                  class="inline-block rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="
                    item.estadoAptitud === 'APTO'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  "
                >
                  {{ item.estadoAptitud.replace(/_/g, ' ') }}
                </span>
              </td>

              <td class="px-4 py-3">
                {{ formatearFecha(item.fechaVencimiento) }}
              </td>

              <td class="px-4 py-3">
                <span
                  class="inline-block rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="
                    item.urgente
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  "
                >
                  {{ item.texto }}
                </span>
              </td>
            </tr>

            <!-- Sin resultados -->
            <tr v-if="aptosFiltrados.length === 0">
              <td
                colspan="5"
                class="px-4 py-8 text-center text-slate-500"
              >
                No hay aptos médicos registrados para tu empresa con esos filtros.
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </PanelPagina>
</template>