<script setup lang="ts">
import { computed } from 'vue'
import type { Rol } from '../types/auth'
import { menuPorRol } from '../config/menu.config'
// Definición de las propiedades que recibe el componente, en este caso el rol del usuario.
const props = defineProps<{
  rol: Rol
}>()
// computed que devuelve las opciones de menú según el rol del usuario, utilizando la configuración definida en menuPorRol.
const opcionesMenu = computed(() => menuPorRol[props.rol] ?? [])
</script>

<template>
  <aside class="sidebar">
    <div class="logo">
      <h2>ITS</h2>
      <span>SOLUCIONES</span>
    </div>

    <nav class="menu">
      <RouterLink
        v-for="item in opcionesMenu"
        :key="item.route"
        :to="item.route"
        class="menu-item"
      >
        {{ item.label }}
      </RouterLink>
    </nav>

    <div class="rol">{{ rol }}</div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 210px;
  flex-shrink: 0;
  height: 100vh;
  overflow-y: auto;
  padding: 26px 10px;
  background: #0B0F21;
  color: white;
  z-index: 10;
  box-sizing: border-box;
}
.logo {
  margin-bottom: 50px;
  text-align: center;
}
.logo h2 {
  margin: 0;
  color: white;
}
.logo span {
  font-size: 20px;
}
.menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.menu-item {
  padding: 12px;
  border-radius: 6px;
  color: #d8e2eb;
  text-decoration: none;
}
.menu-item:hover {
  background: #111e35;
  color: white;
}
.menu-item.router-link-exact-active {
  color: #00dbe7;
  border-bottom: 2px solid #00dbe7;
}
.rol {
  margin-top: 40px;
  padding: 12px;
  color: #8fa4b8;
  font-size: 12px;
}
</style>