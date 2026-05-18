// Utilidades para leer y escribir JSON en localStorage de forma segura
// Usa un prefijo en todas las claves para evitar colisiones con otras apps en el mismo dominio

const PREFIX = 'rm-explorer:';

// Lee un valor JSON de localStorage y lo parsea
// Devuelve el fallback si la clave no existe o si el JSON está corrupto
export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    // Si la clave no existe, localStorage devuelve null
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    // JSON.parse puede lanzar si el valor guardado está malformado
    return fallback;
  }
}

// Serializa un valor a JSON y lo guarda en localStorage
// El bloque try/catch protege contra el modo privado o la cuota llena del navegador
export function writeJSON(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota or privacy mode — ignore silently */
  }
}
