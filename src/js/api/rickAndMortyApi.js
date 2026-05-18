// Módulo de acceso a la Rick and Morty API
// Todas las peticiones HTTP de la app pasan por aquí

const BASE_URL = 'https://rickandmortyapi.com/api';

// Función interna que realiza el fetch y unifica el manejo de errores
// Acepta una señal de AbortController para cancelar peticiones en vuelo
async function request(path, { signal } = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { signal });
  } catch (error) {
    // Si la petición fue cancelada intencionalmente, relanza el error sin envolverlo
    if (error.name === 'AbortError') throw error;
    // Cualquier otro fallo de red se convierte en un ApiError con mensaje legible
    throw new ApiError('No se pudo conectar con la API. Revisa tu conexión.', { cause: error });
  }

  // La API devuelve 404 cuando no hay resultados para los filtros aplicados
  // Se devuelve un objeto especial en lugar de lanzar un error
  if (response.status === 404) {
    return { notFound: true };
  }
  // Cualquier otro código de error HTTP se considera un fallo
  if (!response.ok) {
    throw new ApiError(`Error ${response.status} al consultar la API.`);
  }
  return response.json();
}

// Error personalizado que identifica los fallos originados en la API
// Permite distinguirlos de otros errores JavaScript en los bloques catch
export class ApiError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'ApiError';
  }
}

// Convierte un objeto de parámetros en una query string, omitiendo valores vacíos o nulos
// Ejemplo: { name: 'rick', status: '' } → '?name=rick'
function toQuery(params = {}) {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue;
    usp.set(key, value);
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

// Obtiene una página de personajes con filtros opcionales (name, status, species, page)
// Devuelve { results, info } con lista vacía si la API responde 404
export async function getCharacters(params = {}, options = {}) {
  const data = await request(`/character${toQuery(params)}`, options);
  if (data.notFound) return { results: [], info: { count: 0, pages: 0, next: null, prev: null } };
  return data;
}

// Obtiene un personaje por su id numérico
// Lanza ApiError si no existe
export async function getCharacterById(id, options = {}) {
  const data = await request(`/character/${id}`, options);
  if (data.notFound) throw new ApiError('Personaje no encontrado.');
  return data;
}

// Obtiene varios personajes a la vez pasando sus ids separados por coma
// La API devuelve un objeto en lugar de array cuando solo se pide un id; se normaliza aquí
export async function getCharactersByIds(ids = [], options = {}) {
  if (!ids.length) return [];
  const data = await request(`/character/${ids.join(',')}`, options);
  if (data.notFound) return [];
  return Array.isArray(data) ? data : [data];
}

// Obtiene una página de episodios con parámetros opcionales
export async function getEpisodes(params = {}, options = {}) {
  const data = await request(`/episode${toQuery(params)}`, options);
  if (data.notFound) return { results: [], info: { count: 0, pages: 0, next: null, prev: null } };
  return data;
}

// Obtiene un episodio por su id numérico
export async function getEpisodeById(id, options = {}) {
  const data = await request(`/episode/${id}`, options);
  if (data.notFound) throw new ApiError('Episodio no encontrado.');
  return data;
}

// Obtiene varios episodios a la vez por sus ids
// Normaliza la respuesta igual que getCharactersByIds
export async function getEpisodesByIds(ids = [], options = {}) {
  if (!ids.length) return [];
  const data = await request(`/episode/${ids.join(',')}`, options);
  if (data.notFound) return [];
  return Array.isArray(data) ? data : [data];
}

// Extrae el número de página del campo next o prev que devuelve la API en info
// Ejemplo: 'https://rickandmortyapi.com/api/character?page=3' → 3
export function pageFromUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const page = parsed.searchParams.get('page');
    return page ? Number(page) : null;
  } catch {
    return null;
  }
}
