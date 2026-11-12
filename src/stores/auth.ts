import { defineStore } from 'pinia'
import type { Usuario } from '../types/auth'

interface Sesion {
  token: string
  usuario: Usuario
}

const CLAVE_SESION = 'checkpoint-sesion'
// Función para leer la sesión almacenada en localStorage, devolviendo null si no existe o si hay un error al parsear.
function leerSesion(): Sesion | null {
  try {
    const guardada = localStorage.getItem(CLAVE_SESION)

    if (!guardada) return null

    const sesion = JSON.parse(guardada) as Sesion

    return sesion.token && sesion.usuario ? sesion : null
  } catch {
    return null
  }
}
// Store de autenticación utilizando Pinia, que maneja el estado de la sesión del usuario, incluyendo token y datos del usuario.
export const useAuthStore = defineStore('auth', {
  state: () => {
    const sesion = leerSesion()

    return {
      token: (sesion?.token ?? null) as string | null,
      usuario: (sesion?.usuario ?? null) as Usuario | null,
    }
  },

  getters: {
    estaAutenticado: (state) =>  // Getter que indica si el usuario está autenticado, basado en la presencia de un token y datos del usuario.
      Boolean(state.token && state.usuario),
  },

  actions: {
    iniciarSesion(sesion: Sesion) {  // Acción para iniciar sesión, estableciendo el token y los datos del usuario en el estado y almacenándolos en localStorage.
      this.token = sesion.token
      this.usuario = sesion.usuario

      localStorage.setItem(
        CLAVE_SESION,
        JSON.stringify(sesion),
      )
    },
// Acción para cerrar la sesión del usuario, eliminando el token y los datos del usuario del estado y del localStorage.
    cerrarSesion() {
      this.token = null
      this.usuario = null

      localStorage.removeItem(CLAVE_SESION)
    },
  },
})