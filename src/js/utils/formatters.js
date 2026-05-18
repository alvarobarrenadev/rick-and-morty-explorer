// Funciones de formateo de datos para mostrar valores legibles en la UI

// Formateador de fechas en español, reutilizado en toda la app para evitar recrearlo cada vez
const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

// Convierte una fecha ISO a formato legible en español, por ejemplo "15 de abril de 2021"
// Devuelve 'Desconocida' si el valor está vacío o no es una fecha válida
export function formatDate(value) {
  if (!value) return 'Desconocida';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Desconocida';
  return dateFormatter.format(date);
}

// Traduce el estado de un personaje de inglés a español para mostrarlo en la UI
// La API usa 'alive', 'dead' o 'unknown' en minúsculas
export function statusLabel(status) {
  switch ((status || '').toLowerCase()) {
    case 'alive':
      return 'Vivo';
    case 'dead':
      return 'Muerto';
    default:
      return 'Desconocido';
  }
}

// Devuelve el modificador CSS del estado para aplicar la clase de color correcta al indicador
// Ejemplo: 'Alive' → 'alive', 'Unknown' → 'unknown'
export function statusModifier(status) {
  const normalized = (status || 'unknown').toLowerCase();
  if (normalized === 'alive' || normalized === 'dead') return normalized;
  return 'unknown';
}

// Extrae el id numérico al final de una URL de la API
// Ejemplo: 'https://rickandmortyapi.com/api/episode/28' → 28
// Devuelve null si la URL no termina en un número
export function extractIdFromUrl(url) {
  if (!url) return null;
  const match = String(url).match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : null;
}
