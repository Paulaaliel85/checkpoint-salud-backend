<script setup lang="ts">
import { ref } from 'vue'
import PanelPagina from '../../components/PanelPagina.vue'
import { apiFetch } from '../../services/api.ts'
import type { ArchivoHistorial, RespuestaCarga } from '../../types/cargaMasiva.ts'
const archivoSeleccionado = ref<File | null>(null)
const contenidoPrevio = ref<string>('')
const mostrarVistaPrevia = ref(false) // <-- Aquí está declarada correctamente
const cargando = ref(false)
const resultadoMensaje = ref('')
const errorMensaje = ref('')
const detallesErrores = ref<string[]>([])


const archivosHistorial = ref<ArchivoHistorial[]>([])

function manejarSeleccion(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    archivoSeleccionado.value = file
    resultadoMensaje.value = ''
    errorMensaje.value = ''
    detallesErrores.value = []

    const reader = new FileReader()
    reader.onload = (e) => {
      contenidoPrevio.value = (e.target?.result as string) || ''
    }
    reader.readAsText(file)
  }
}

async function procesarArchivo() {
  if (!archivoSeleccionado.value) {
    errorMensaje.value = 'Por favor, seleccioná un archivo CSV primero.'
    return
  }

  const nombreArchivo = archivoSeleccionado.value.name
  const rawData = contenidoPrevio.value
  cargando.value = true
  resultadoMensaje.value = ''
  errorMensaje.value = ''
  detallesErrores.value = []

  try {
    const lineas = rawData.split(/\r\n|\n/).filter((linea) => linea.trim() !== '')

    if (lineas.length < 2) {
      throw new Error('El archivo CSV está vacío o no contiene registros.')
    }

    const cabeceras = lineas[0].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''))
    const trabajadores: Record<string, string>[] = []

    for (let i = 1; i < lineas.length; i++) {
      const valores = lineas[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''))
      const obj: Record<string, string> = {}

      cabeceras.forEach((cabecera, index) => {
        obj[cabecera] = valores[index] || ''
      })

      trabajadores.push(obj)
    }

    const data = await apiFetch<RespuestaCarga>('/api/trabajadores/carga-masiva', {
      method: 'POST',
      body: JSON.stringify({ trabajadores }),
    })

    resultadoMensaje.value = data.mensaje
    detallesErrores.value = data.detallesErrores ?? []

    archivosHistorial.value.unshift({
      nombre: nombreArchivo,
      fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      registros: trabajadores.length,
      estado: data.totalErrores > 0 ? 'Con advertencias' : 'Éxito',
      contenidoRaw: rawData,
    })

    archivoSeleccionado.value = null
    contenidoPrevio.value = ''
    mostrarVistaPrevia.value = false
  } catch (err) {
    errorMensaje.value = err instanceof Error ? err.message : 'No se pudo importar el archivo.'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <PanelPagina
    titulo="Carga Masiva de Trabajadores"
    descripcion="Importación mediante planilla CSV para la clínica ocupacional."
  >
    <section class="mx-auto max-w-[1300px]">
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Panel principal de carga -->
        <div class="lg:col-span-2 rounded-2xl border border-[#dbe7ee] bg-white p-6 shadow-sm">
          <p class="text-sm h-10 text-slate-500 mb-6">
            Cargá el archivo con la nómina de trabajadores para asociarlos a sus respectivas empresas y puestos.
          </p>

          <!-- Dropzone / Selector de archivo -->
          <div class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#dbe7ee] bg-[#f9fcfd] p-8 text-center transition hover:border-[#173b70]/50">
            <svg class="mb-3 h-10 w-10 text-[#173b70]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="mb-1 h-10 text-sm font-semibold text-[#173b70]">
              {{ archivoSeleccionado ? archivoSeleccionado.name : 'Arrastrá tu archivo CSV aquí o hacé clic para buscar' }}
            </p>
            
            <label class="cursor-pointer rounded-xl bg-[#173b70] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#122d56]">
              Examinar archivos
              <input type="file" accept=".csv" @change="manejarSeleccion" class="hidden" />
            </label>
          </div>

          <!-- Botón de acción principal -->
          <div class="mt-6 flex justify-end">
            <button
              @click="procesarArchivo"
              :disabled="cargando || !archivoSeleccionado"
              class="rounded-xl border border-[#173b70] bg-[#173b70] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#122d56] disabled:opacity-50"
            >
              {{ cargando ? 'Importando registros...' : 'Procesar e Importar' }}
            </button>
          </div>

          <!-- Mensajes de feedback -->
          <div v-if="resultadoMensaje" class="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-medium text-emerald-800">
            ✓ {{ resultadoMensaje }}
          </div>

          <div v-if="detallesErrores.length > 0" class="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            <p class="font-semibold mb-1">Advertencias durante la importación:</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
              <li v-for="(err, index) in detallesErrores" :key="index">{{ err }}</li>
            </ul>
          </div>

          <div v-if="errorMensaje" class="mt-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm font-medium text-red-700">
            ⚠ {{ errorMensaje }}
          </div>
        </div>

        <!-- Panel lateral: Historial de archivos cargados -->
        <div class="rounded-2xl border border-[#dbe7ee] bg-white p-6 shadow-sm flex flex-col">
          <h3 class="text-base font-semibold text-[#173b70] mb-3">Archivos Procesados</h3>
          <p class="text-xs h-10 text-slate-500 mb-4">
            Listado de planillas importadas en la sesión actual:
          </p>

          <div v-if="archivosHistorial.length === 0" class="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#dbe7ee] rounded-xl bg-[#f9fcfd]">
            <p class="text-xs text-slate-400">Todavía no se cargaron archivos en esta sesión.</p>
          </div>

          <div v-else class="space-y-3 overflow-y-auto max-h-[350px]">
            <div 
              v-for="(archivo, index) in archivosHistorial" 
              :key="index"
              class="rounded-xl border border-[#dbe7ee] bg-[#f9fcfd] p-3 text-xs flex flex-col gap-2 shadow-xs"
            >
              <div class="flex items-center justify-between font-semibold text-[#173b70]">
                <span class="truncate max-w-[160px]" :title="archivo.nombre">📄 {{ archivo.nombre }}</span>
                <span :class="archivo.estado === 'Éxito' ? 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full' : 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full'">
                  {{ archivo.estado }}
                </span>
              </div>
              <div class="flex items-center justify-between text-[11px] text-slate-500">
                <span>{{ archivo.registros }} registros</span>
                <span>{{ archivo.fecha }}</span>
              </div>
              <details class="mt-1 text-[11px] text-[#168ca1] cursor-pointer">
                <summary class="hover:underline font-medium">Ver contenido CSV</summary>
                <pre class="mt-2 max-h-24 overflow-y-auto text-[10px] font-mono text-slate-600 bg-white p-2 rounded border border-[#dbe7ee] whitespace-pre-wrap">{{ archivo.contenidoRaw }}</pre>
              </details>
            </div>
          </div>
        </div>
      </div>
    </section>
  </PanelPagina>
</template>