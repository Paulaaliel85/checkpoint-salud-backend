<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { menuPorRol } from '../config/menu.config'
import type { Rol } from '../types/auth'

const auth = useAuthStore()

const rutaInicio = computed(() => {
  const rol = auth.usuario?.rol?.toUpperCase() as Rol | undefined
  if (rol === 'PACIENTE') return '/paciente'
  return (rol && menuPorRol[rol]?.[0]?.route) || '/login'
})
</script>

<template>
  <main
    class="flex min-h-screen flex-1 items-center justify-center bg-[#f4f6fa] p-10 font-['Segoe_UI',Arial,sans-serif]"
  >
    <section
      class="w-full h-60 max-w-sm rounded-xl border border-[#e68a93] bg-white p-10 text-center shadow-sm"
    >
      <div
        class="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#fdecec] text-2xl font-bold text-[#721c24]"
        aria-hidden="true"
      >
        !
      </div>

      <h1 class="mt-0 mb-2 text-l font-bold text-[#842029]">Acceso denegado</h1>
      <p class="mt-0 mb-6 h-22 leading-relaxed text-slate-500">
        No tenés permiso para ver esta pantalla. Volvé al inicio para
        seguir con las opciones de tu rol.
      </p>

      <RouterLink
        :to="rutaInicio"
        class="inline-block rounded-lg bg-[#00dbe7] px-5 py-2.5 text-white no-underline transition-colors hover:bg-[#00dbe7b0]"
      >
        Volver al inicio
      </RouterLink>
    </section>
  </main>
</template>