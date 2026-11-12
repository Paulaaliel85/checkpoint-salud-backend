<script setup lang="ts">
import PanelPagina from '../components/PanelPagina.vue'

defineProps<{
  titulo: string
}>()
</script>

<template>
  <PanelPagina :titulo="titulo" descripcion="Pantalla en desarrollo." />
</template>