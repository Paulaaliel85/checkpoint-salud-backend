<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

defineProps<{
  titulo: string
  descripcion?: string
}>()

const auth = useAuthStore()
const router = useRouter()

function cerrarSesion() {
  auth.cerrarSesion()
  router.push('/login')
}
</script>

<template>
  <main
    class="min-h-screen bg-[#f4f6fa] p-6 font-['Segoe_UI',Arial,sans-serif] text-[#172033] [color-scheme:light] sm:p-8"
  >
    <header
      class="mb-6 flex items-start justify-between gap-4 border-b border-[#dce2eb] pb-5"
    >
      <div>
        <h1 class="m-0 text-2xl font-bold! text-[#173b70]!">{{ titulo }}</h1>
        <p v-if="descripcion" class="mt-1.5 mb-0 text-sm text-slate-500">
          {{ descripcion }}
        </p>
      </div>

      <button
        type="button"
        class="shrink-0 cursor-pointer rounded-lg border-0 bg-[#173b70] px-4 py-2.5 text-sm text-white transition-colors hover:bg-[#172033]"
        @click="cerrarSesion"
      >
        Cerrar sesión
      </button>
    </header>

    <slot />
  </main>
</template>