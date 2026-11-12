
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PanelPagina from '../../components/PanelPagina.vue'
import { apiFetch } from '../../services/api'
import type { EstadoAptitud } from '../../types/empresa'
import { diasRestantes, formatearFecha } from '../../utils/fechas'

import type {TrabajadorEmpresa,RespuestaTrabajadores,} from '../../types/empresa'

const filtroEstado = ref<EstadoAptitud | 'TODOS'>('TODOS')
const busqueda = ref('')
const trabajadoresOriginales = ref<TrabajadorEmpresa[]>([])
const cargando = ref(true)
const error = ref('')

const filtros: { valor: EstadoAptitud | 'TODOS'; etiqueta: string }[] = [
  { valor: 'TODOS', etiqueta: 'Todos' },
  { valor: 'APTO', etiqueta: 'Aptos' },
  { valor: 'NO_APTO', etiqueta: 'No aptos' },
  { valor: 'PENDIENTE', etiqueta: 'Pendientes de examen' },
  { valor: 'APTO_CON_OBSERVACIONES', etiqueta: 'Aptos con observaciones' },
]

const etiquetas: Record<EstadoAptitud, string> = {
  APTO: 'Apto',
  NO_APTO: 'No apto',
  PENDIENTE: 'Pendiente de examen',
  APTO_CON_OBSERVACIONES: 'Apto con observaciones',
}

const estilos: Record<EstadoAptitud, string> = {
  APTO: 'bg-emerald-100 text-emerald-800',
  NO_APTO: 'bg-red-100 text-red-800',
  PENDIENTE: 'bg-amber-100 text-amber-800',
  APTO_CON_OBSERVACIONES: 'bg-blue-100 text-blue-800',
}

async function cargarTrabajadores() {
  cargando.value = true
  error.value = ''

  try {
    const respuesta = await apiFetch<RespuestaTrabajadores>(
      '/api/empresa/trabajadores',
    )

    trabajadoresOriginales.value = respuesta.trabajadores
  } catch (err) {
    error.value =
      err instanceof Error
        ? err.message
        : 'No se pudieron cargar los trabajadores.'
  } finally {
    cargando.value = false
  }
}

onMounted(cargarTrabajadores)

const trabajadores = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()

  return trabajadoresOriginales.value
    .filter(
      (trabajador) =>
        filtroEstado.value === 'TODOS' ||
        trabajador.estadoAptitud === filtroEstado.value,
    )
    .filter(
      (trabajador) =>
        !texto ||
        `${trabajador.apellido} ${trabajador.nombre}`
          .toLowerCase()
          .includes(texto) ||
        trabajador.dni.includes(texto),
    )
    .sort((a, b) => a.apellido.localeCompare(b.apellido))
})
</script>

<template>
  <PanelPagina
    titulo="Trabajadores"
    descripcion="Estado de aptitud del personal que enviaste a examinar."
  >
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-3">
        <input
          v-model="busqueda"
          type="search"
          placeholder="Buscar por nombre o DNI"
          class="w-full max-w-xs rounded-lg border border-[#dce2eb] bg-white px-3 py-2 text-sm text-[#172033] placeholder:text-slate-400"
        />

        <label class="flex items-center gap-2 text-sm text-slate-600">
          Estado
          <select
            v-model="filtroEstado"
            class="rounded-lg border border-[#dce2eb] bg-white px-3 py-2 text-sm text-[#172033]"
          >
            <option v-for="f in filtros" :key="f.valor" :value="f.valor">
              {{ f.etiqueta }}
            </option>
          </select>
        </label>
      </div>

      <div class="text-sm text-slate-500">
        {{ trabajadores.length }} trabajadores
      </div>
    </div>

    <div
      v-if="cargando"
      class="rounded-xl border border-[#e0e6ef] bg-white px-4 py-8 text-center text-sm text-slate-500"
    >
      Cargando trabajadores...
    </div>

    <div
      v-else-if="error"
      class="rounded-xl border border-red-200 bg-red-50 px-4 py-5"
    >
      <p class="text-sm text-red-700">{{ error }}</p>

      <button
        type="button"
        class="mt-3 rounded-lg bg-[#173b70] px-4 py-2 text-sm font-medium text-white"
        @click="cargarTrabajadores"
      >
        Reintentar
      </button>
    </div>

    <div
      v-else
      class="overflow-x-auto rounded-xl border border-[#e0e6ef] bg-white shadow-sm"
    >
      <table class="w-full border-collapse text-left text-sm">
        <thead class="bg-[#f4f6fa] text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3 font-semibold">Trabajador</th>
            <th class="px-4 py-3 font-semibold">DNI</th>
            <th class="px-4 py-3 font-semibold">Puesto</th>
            <th class="px-4 py-3 font-semibold">Aptitud</th>
            <th class="px-4 py-3 font-semibold">Vencimiento</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="t in trabajadores"
            :key="t.id"
            class="border-t border-[#e0e6ef]"
          >
            <td class="px-4 py-3 font-medium">
              {{ t.apellido }}, {{ t.nombre }}
            </td>

            <td class="px-4 py-3">{{ t.dni }}</td>

            <td class="px-4 py-3">
              {{ t.puesto?.nombrePuesto ?? 'Sin puesto asignado' }}
            </td>

            <td class="px-4 py-3">
              <span
                class="inline-block rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="estilos[t.estadoAptitud]"
              >
                {{ etiquetas[t.estadoAptitud] }}
              </span>
            </td>

            <td class="px-4 py-3">
              <template v-if="t.fechaVencimiento">
                {{ formatearFecha(t.fechaVencimiento) }}

                <span
                  class="ml-1 text-xs"
                  :class="
                    diasRestantes(t.fechaVencimiento) <= 7
                      ? 'font-semibold text-red-700'
                      : 'text-slate-500'
                  "
                >
                  ({{ diasRestantes(t.fechaVencimiento) }} días)
                </span>
              </template>

              <span v-else class="text-slate-400">—</span>
            </td>
          </tr>

          <tr v-if="trabajadores.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-slate-500">
              No hay trabajadores que coincidan con la búsqueda.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-3 text-xs text-slate-500">
      La clínica no comparte con la empresa el detalle médico: solo el estado
      de aptitud y la fecha de vencimiento correspondiente.
    </div>
  </PanelPagina>
</template>
