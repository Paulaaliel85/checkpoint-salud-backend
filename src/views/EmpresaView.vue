
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PanelPagina from '../components/PanelPagina.vue'
import { apiFetch } from '../services/api'
import type { Empresa, TrabajadorEmpresa, RespuestaEmpresa } from '../types/empresa'

const empresa = ref<Empresa | null>(null)
const trabajadores = ref<TrabajadorEmpresa[]>([])
const cargando = ref(true)
const error = ref('')

async function cargarDatos() {
  cargando.value = true
  error.value = ''

  try {
    const respuesta = await apiFetch<RespuestaEmpresa>(
      '/api/empresa/trabajadores',
    )

    empresa.value = respuesta.empresa
    trabajadores.value = respuesta.trabajadores
  } catch (err) {
    error.value =
      err instanceof Error
        ? err.message
        : 'No se pudo cargar la información de la empresa.'
  } finally {
    cargando.value = false
  }
}

onMounted(cargarDatos)

const resumen = computed(() => {
  const total = trabajadores.value.length

  const porPuesto = new Map<string, number>()

  for (const trabajador of trabajadores.value) {
    const puesto = trabajador.puesto?.nombrePuesto ?? 'Sin puesto asignado'

    porPuesto.set(puesto, (porPuesto.get(puesto) ?? 0) + 1)
  }

  const puestos = [...porPuesto.entries()]
    .map(([puesto, cantidad]) => ({ puesto, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad || a.puesto.localeCompare(b.puesto))

  const sinPuesto = trabajadores.value.filter(
    (trabajador) => !trabajador.puesto,
  ).length

  return {
    total,
    sinPuesto,
    puestos,
  }
})

const indicadores = computed(() => [
  {
    titulo: 'Trabajadores registrados',
    valor: resumen.value.total,
    color: 'text-[#173b70]',
  },
  {
    titulo: 'Puestos ocupados',
    valor: resumen.value.puestos.length,
    color: 'text-emerald-700',
  },
  {
    titulo: 'Sin puesto asignado',
    valor: resumen.value.sinPuesto,
    color: 'text-amber-700',
  },
])
</script>

<template>
  <PanelPagina
    titulo="Panel de Empresa"
    :descripcion="empresa?.razonSocial ?? 'Información de la empresa'"
  >
    <!-- Cargando -->
    <section
      v-if="cargando"
      class="rounded-xl border border-[#e0e6ef] bg-white px-4 py-8 text-center shadow-sm"
    >
      <p class="text-sm text-slate-500">Cargando información de la empresa...</p>
    </section>

    <!-- Error -->
    <section
      v-else-if="error"
      class="rounded-xl border border-red-200 bg-red-50 px-4 py-5 shadow-sm"
    >
      <p class="text-sm font-medium text-red-700">{{ error }}</p>

      <button
        type="button"
        class="mt-3 rounded-lg bg-[#173b70] px-4 py-2 text-sm font-medium text-white hover:bg-[#102d56]"
        @click="cargarDatos"
      >
        Reintentar
      </button>
    </section>

    <template v-else-if="empresa">
      <!-- Ficha de la empresa -->
      <section
        class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e0e6ef] bg-white px-4 py-3 shadow-sm"
      >
        <div>
          <div class="text-sm font-semibold text-[#173b70]">
            {{ empresa.razonSocial }}
          </div>

          <div class="mt-0.5 text-xs text-slate-500">
            CUIT {{ empresa.cuit }}
          </div>
        </div>

        <div class="flex gap-6">
          <div>
            <div class="text-xs text-slate-500">Trabajadores</div>
            <div class="text-lg font-bold text-[#173b70]">
              {{ resumen.total }}
            </div>
          </div>

          <div>
            <div class="text-xs text-slate-500">Puestos</div>
            <div class="text-lg font-bold text-[#173b70]">
              {{ resumen.puestos.length }}
            </div>
          </div>
        </div>
      </section>

      <!-- Indicadores -->
      <section
        class="mt-3 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3"
        aria-label="Indicadores de la empresa"
      >
        <RouterLink
          v-for="item in indicadores"
          :key="item.titulo"
          to="/empresa/trabajadores"
          class="rounded-lg border border-[#e0e6ef] bg-white px-3 py-2.5 text-inherit no-underline shadow-sm transition-colors hover:border-[#173b70]"
        >
          <div class="text-xs text-slate-500">{{ item.titulo }}</div>
          <div class="mt-1 text-2xl font-bold" :class="item.color">
            {{ item.valor }}
          </div>
        </RouterLink>
      </section>

      <div class="mt-3 grid gap-3 lg:grid-cols-2">
        <!-- Trabajadores por puesto -->
        <section
          class="rounded-xl border border-[#e0e6ef] bg-white px-4 py-3 shadow-sm"
        >
          <div class="mb-2 text-sm font-semibold">
            Trabajadores por puesto
          </div>

          <div
            v-for="puesto in resumen.puestos"
            :key="puesto.puesto"
            class="flex items-center justify-between border-t border-[#e0e6ef] py-2 text-sm first:border-t-0"
          >
            <span>{{ puesto.puesto }}</span>

            <span class="font-semibold text-[#173b70]">
              {{ puesto.cantidad }}
            </span>
          </div>

          <div
            v-if="resumen.puestos.length === 0"
            class="py-3 text-sm text-slate-500"
          >
            Todavía no hay trabajadores registrados.
          </div>
        </section>

        <!-- Información -->
        <section
          class="rounded-xl border border-[#e0e6ef] bg-white px-4 py-3 shadow-sm"
        >
          <div class="mb-2 text-sm font-semibold">
            Información del personal
          </div>

          <div class="flex items-center justify-between border-t border-[#e0e6ef] py-2 text-sm">
            <span class="text-slate-600">Total de trabajadores</span>
            <span class="font-semibold text-[#173b70]">
              {{ resumen.total }}
            </span>
          </div>

          <div class="flex items-center justify-between border-t border-[#e0e6ef] py-2 text-sm">
            <span class="text-slate-600">Sin puesto asignado</span>
            <span class="font-semibold text-amber-700">
              {{ resumen.sinPuesto }}
            </span>
          </div>
        </section>
      </div>

      <!-- Lista de trabajadores -->
      <section
        class="mt-3 overflow-hidden rounded-xl border border-[#e0e6ef] bg-white shadow-sm"
      >
        <div class="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div>
            <h2 class="text-sm font-semibold text-[#173b70]">
              Trabajadores de la empresa
            </h2>

            <p class="mt-0.5 text-xs text-slate-500">
              Personal registrado en el sistema
            </p>
          </div>

          <span
            class="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#173b70]"
          >
            {{ resumen.total }} registrados
          </span>
        </div>

        <div v-if="trabajadores.length > 0" class="overflow-x-auto">
          <table class="w-full min-w-[550px] text-left text-sm">
            <thead class="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th class="px-4 py-3 font-medium">Trabajador</th>
                <th class="px-4 py-3 font-medium">DNI</th>
                <th class="px-4 py-3 font-medium">Puesto</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="trabajador in trabajadores"
                :key="trabajador.id"
                class="border-t border-[#e0e6ef] transition-colors hover:bg-slate-50"
              >
                <td class="px-4 py-3 font-medium text-slate-700">
                  {{ trabajador.apellido }}, {{ trabajador.nombre }}
                </td>

                <td class="px-4 py-3 text-slate-600">
                  {{ trabajador.dni }}
                </td>

                <td class="px-4 py-3 text-slate-600">
                  {{ trabajador.puesto?.nombrePuesto ?? 'Sin puesto asignado' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="px-4 py-8 text-center">
          <p class="text-sm font-medium text-slate-600">
            Todavía no hay trabajadores registrados.
          </p>

          <p class="mt-1 text-xs text-slate-400">
            Cuando se registren trabajadores para tu empresa, aparecerán en esta lista.
          </p>
        </div>
      </section>
    </template>
  </PanelPagina>
</template>
