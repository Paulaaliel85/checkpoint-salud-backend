<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PanelPagina from '../../components/PanelPagina.vue'
import { apiFetch } from '../../services/api.ts'

//Seccion de empresas cargadas desde el servidor, se usa en la vista de empresas
// Estados reactivos
const empresas = ref<any[]>([])
const cargando = ref(true)
const error = ref('')

// Cargar Empresas
async function cargarEmpresas() {
  try {
    cargando.value = true
    error.value = ''
    empresas.value = await apiFetch<any[]>('/api/empresas') //me traigo las empresas desde el servidor usando la función apiFetch
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudieron cargar las empresas.' //si hay un error, lo guardo en el estado de error
  } finally {
    cargando.value = false
  }
}

onMounted(cargarEmpresas)
</script>

<template>
  <PanelPagina
    titulo="Empresas"
    descripcion="Gestioná las empresas contratistas atendidas por la clínica."
  >
    <section class="mx-auto max-w-[1500px]">
      <div class="mb-7">
        <p class="text-sm text-slate-500">
          Control de corporaciones adheridas al sistema de salud ocupacional.
        </p>
      </div>

      <!-- Listado de Empresas -->
      <div class="rounded-2xl border border-[#dbe7ee] bg-white shadow-sm overflow-hidden">
        <div v-if="cargando" class="p-8 text-center text-sm text-slate-500">
          Cargando empresas desde el servidor...
        </div>

        <div v-else-if="empresas.length === 0" class="p-8 text-center text-sm text-slate-500">
          No hay empresas registradas en el sistema.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-[#dbe7ee] bg-[#f9fcfd] text-xs font-semibold text-[#173b70]">
                <th class="px-5 py-4">Razón Social</th>
                <th class="px-5 py-4">CUIT</th>
                <th class="px-5 py-4">Trabajadores Registrados</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#edf1f5] text-sm">
              <tr v-for="empresa in empresas" :key="empresa.id" class="hover:bg-[#f9fcfd]/60 transition-colors">
                <td class="px-5 py-4 font-semibold text-[#173b70]">
                  {{ empresa.razonSocial }}
                </td>
                <td class="px-5 py-4 text-slate-600">{{ empresa.cuit }}</td>
                <td class="px-5 py-4 text-slate-600">
                  <span class="rounded-full bg-[#e5f8fb] px-3 py-1 text-xs font-semibold text-[#168ca1]">
                    {{ empresa.pacientes?.length || 0 }} trabajadores
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </PanelPagina>
</template>