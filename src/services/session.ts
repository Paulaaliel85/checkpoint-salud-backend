
import type { Rol } from '../types/auth'

interface RespuestaLogin {
  mensaje: string
  token: string
  usuario: {
    id: string
    email: string
    rol: Rol
  }
}
// Función para iniciar sesión en la API, enviando el identificador y la contraseña, y devolviendo la respuesta con el token y los datos del usuario.
export async function iniciarSesionApi(
  identificador: string,
  password: string,
): Promise<RespuestaLogin> {
  const respuesta = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      identificador,
      password,
    }),
  })
// Manejo de errores de la respuesta de la API, lanzando un error si la respuesta no es exitosa.
  const datos = await respuesta.json()

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || 'No se pudo iniciar sesión.')
  }

  return datos
}
