<script setup lang="ts">
import { computed, ref } from 'vue'
import PanelPagina from '../../components/PanelPagina.vue'
import { datosEmpresaMock } from '../../services/empresaMock'

const EXTENSIONES = ['.xlsx', '.csv']

const empresa = datosEmpresaMock

const archivo = ref<File | null>(null)
const error = ref('')
const aviso = ref('')

// Solo nóminas de la propia empresa.
const archivosCargados = [
  {
    id: 1,
    nombre: 'nomina_octubre.xlsx',
    trabajadores: 8,
    fecha: '30/10/2026',
    estado: 'Procesado',
  },
  {
    id: 2,
    nombre: 'nomina_septiembre.csv',
    trabajadores: 6,
    fecha: '30/09/2026',
    estado: 'Procesado',
  },
]

const tamano = computed(() => {
  if (!archivo.value) return ''

  const kb = archivo.value.size / 1024

  return kb < 1024
    ? `${Math.round(kb)} KB`
    : `${(kb / 1024).toFixed(1)} MB`
})

function elegirArchivo(evento: Event) {
  const entrada = evento.target as HTMLInputElement
  const elegido = entrada.files?.[0] ?? null

  archivo.value = null
  error.value = ''
  aviso.value = ''

  if (!elegido) return

  const nombre = elegido.name.toLowerCase()

  if (!EXTENSIONES.some((ext) => nombre.endsWith(ext))) {
    error.value = 'El archivo tiene que ser .xlsx o .csv.'
    entrada.value = ''
    return
  }

  archivo.value = elegido
}

function procesar() {
  if (!archivo.value) {
    error.value = 'Elegí un archivo antes de procesar.'
    return
  }

  error.value = ''
  aviso.value =
    'La importación todavía no está disponible. Se implementará más adelante.'
}
</script>

<template>
  <PanelPagina
    titulo="Carga masiva"
    descripcion="Importá la nómina de trabajadores de tu empresa."
  >
    <section class="mx-auto max-w-[1500px]">
      <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <!-- CARGAR ARCHIVO -->
        <section
          class="rounded-2xl border border-[#dbe7ee] bg-white p-6 shadow-sm"
        >
          <div class="mb-5">
            <h3 class="text-lg font-bold text-[#173b70]">
              Cargar archivo
            </h3>

            <div class="mt-1 text-sm text-slate-500">
              Seleccioná la nómina que querés importar.
            </div>
          </div>

          <!-- Zona para seleccionar archivo -->
          <label
            class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#b8c4d6] bg-[#f9fcfd] px-6 py-12 text-center transition-colors hover:border-[#38b8cf] focus-within:border-[#38b8cf]"
          >
            <!-- Icono -->
            <div
              class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#e5f8fb] text-[#38b8cf]"
            >
              <svg
                class="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
                aria-hidden="true"
              >
                <path d="M12 16V4" />
                <path d="m7 9 5-5 5 5" />
                <path d="M5 14v5h14v-5" />
              </svg>
            </div>

            <span class="text-sm font-semibold text-[#173b70]">
              Elegí un archivo para cargar
            </span>

            <span class="mt-1 text-xs text-slate-500">
              Formatos admitidos: .xlsx y .csv
            </span>

            <input
              type="file"
              accept=".xlsx,.csv"
              class="sr-only"
              @change="elegirArchivo"
            />
          </label>

          <!-- Archivo seleccionado -->
          <div
            v-if="archivo"
            class="mt-4 flex items-center gap-3 rounded-xl border border-[#dbe7ee] bg-[#f9fcfd] p-4"
          >
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e5f8fb] text-[#38b8cf]"
            >
              <svg
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
                aria-hidden="true"
              >
                <path d="M6 2h8l4 4v16H6z" />
                <path d="M14 2v5h5" />
              </svg>
            </div>

            <div class="min-w-0">
              <div class="truncate text-sm font-semibold text-[#173b70]">
                {{ archivo.name }}
              </div>

              <div class="mt-0.5 text-xs text-slate-500">
                {{ tamano }}
              </div>
            </div>
          </div>

          <!-- Error -->
          <div
            v-if="error"
            role="alert"
            class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {{ error }}
          </div>

          <!-- Aviso -->
          <div
            v-if="aviso"
            role="status"
            class="mt-4 rounded-lg bg-[#f4f6fa] px-4 py-3 text-sm text-slate-600"
          >
            {{ aviso }}
          </div>

          <!-- Botón -->
          <button
            type="button"
            class="mt-5 cursor-pointer rounded-lg border-0 bg-[#173b70] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#24518f]"
            @click="procesar"
          >
            Procesar archivo
          </button>
        </section>

        <!-- ARCHIVOS CARGADOS -->
        <section
          class="rounded-2xl border border-[#dbe7ee] bg-white p-6 shadow-sm"
        >
          <div class="mb-5 flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-[#173b70]">
                Archivos cargados
              </h3>

              <div class="mt-1 text-sm text-slate-500">
                Últimas nóminas de {{ empresa.razonSocial }}.
              </div>
            </div>

            <span
              class="rounded-full bg-[#e5f8fb] px-3 py-1 text-xs font-semibold text-[#168ca1]"
            >
              {{ archivosCargados.length }}
            </span>
          </div>

          <!-- Lista -->
          <div class="space-y-3">
            <article
              v-for="item in archivosCargados"
              :key="item.id"
              class="rounded-xl border border-[#edf1f5] bg-[#f9fcfd] p-4"
            >
              <div class="flex items-start gap-3">
                <!-- Icono archivo -->
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e5f8fb] text-[#38b8cf]"
                >
                  <svg
                    class="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.7"
                    aria-hidden="true"
                  >
                    <path d="M6 2h8l4 4v16H6z" />
                    <path d="M14 2v5h5" />
                    <path d="M9 13h6M9 17h6" />
                  </svg>
                </div>

                <!-- Información -->
                <div class="min-w-0 flex-1">
                  <div
                    class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div class="min-w-0">
                      <div class="truncate text-sm font-semibold text-[#173b70]">
                        {{ item.nombre }}
                      </div>
                    </div>

                    <!-- Estado -->
                    <span
                      class="w-fit shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700"
                    >
                      {{ item.estado }}
                    </span>
                  </div>

                  <div
                    class="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500"
                  >
                    <span>{{ item.trabajadores }} trabajadores</span>
                    <span>{{ item.fecha }}</span>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </section>
  </PanelPagina>
</template>