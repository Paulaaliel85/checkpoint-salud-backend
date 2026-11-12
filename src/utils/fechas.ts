// Devuelve una fecha y hora local (AAAA-MM-DDTHH:MM:00) desplazada N días de hoy.
export function enDias(dias: number, hora = '09:00'): string {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + dias)

  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')

  return `${anio}-${mes}-${dia}T${hora}:00`
}

// Días que faltan desde hoy hasta una fecha (negativo si ya pasó).
export function diasRestantes(fechaVencimiento: string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const vence = new Date(`${fechaVencimiento.slice(0, 10)}T00:00:00`)
  return Math.round((vence.getTime() - hoy.getTime()) / 86_400_000)
}

export function formatearFecha(iso: string): string {
  const fecha = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)

  return fecha.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatearHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}