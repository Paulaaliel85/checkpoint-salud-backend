import { useAuthStore } from '../stores/auth'

export const API_URL: string =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:3000' : '')
// Función genérica para realizar peticiones a la API, manejando autenticación y errores.
export async function apiFetch<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const auth = useAuthStore()
  const cabeceras = new Headers(opciones.headers)

  if (auth.token) cabeceras.set('Authorization', `Bearer ${auth.token}`)

  // Con FormData (archivos) el navegador agrega el Content-Type por su cuenta.
  if (opciones.body && !(opciones.body instanceof FormData) && !cabeceras.has('Content-Type')) {
    cabeceras.set('Content-Type', 'application/json')
  }

  let respuesta: Response

  try {
    respuesta = await fetch(`${API_URL}${ruta}`, { ...opciones, headers: cabeceras })
  } catch {
    throw new Error('No se pudo conectar con el servidor.')
  }
// Manejo de errores de autenticación y redirección al login si la sesión ha expirado.
  if (respuesta.status === 401) {
    auth.cerrarSesion()
    window.location.assign('/login')
    throw new Error('Tu sesión venció. Volvé a iniciar sesión.')
  }
// Manejo de errores de autorización y redirección al login si el usuario no tiene permisos.
  const cuerpo = await respuesta.json().catch(() => ({}))

  if (!respuesta.ok) {
    throw new Error(cuerpo.mensaje ?? cuerpo.error ?? 'No se pudo completar la operación.')
  }

  return cuerpo as T
}