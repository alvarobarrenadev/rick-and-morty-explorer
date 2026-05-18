// Store global de la aplicación
// Centraliza todo el estado mutable y notifica a los suscriptores cuando cambia algo

import { readJSON, writeJSON } from './utils/storage.js';

// Clave usada para guardar y leer los favoritos en localStorage
const FAVORITES_KEY = 'favorites-characters';

// Objeto de estado único con todas las secciones de la app
// Los favoritos se recuperan de localStorage al iniciar para persistir entre sesiones
const state = {
  // Ruta activa en el router
  route: { name: 'characters', params: {} },
  // Estado de la sección de personajes
  characters: {
    filters: { name: '', status: '', species: '' },
    results: [],       // personajes cargados actualmente
    page: 1,           // página actual de la API
    info: null,        // objeto info de la API con next, prev, count, pages
    status: 'idle',    // idle | loading | loading-more | error | empty | ready
    error: null,
  },
  // Estado de la sección de episodios
  episodes: {
    results: [],
    page: 1,
    info: null,
    status: 'idle',
    error: null,
  },
  // Lista de personajes marcados como favoritos, cargada desde localStorage
  favorites: readJSON(FAVORITES_KEY, []),
};

// Conjunto de funciones suscritas que se ejecutan cuando se llama a notify()
const listeners = new Set();

// Devuelve una referencia de solo lectura al estado global
export function getState() {
  return state;
}

// Registra una función que se ejecutará cuando se notifique un cambio
// Devuelve una función para cancelar la suscripción
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Avisa a todos los suscriptores indicando qué sección del estado cambió
export function notify(scope) {
  listeners.forEach((listener) => listener(scope));
}

// Actualiza la ruta activa y notifica a los suscriptores
export function setRoute(route) {
  state.route = route;
  notify('route');
}

// Aplica un patch parcial sobre el estado de personajes y notifica
export function updateCharacters(patch) {
  Object.assign(state.characters, patch);
  notify('characters');
}

// Aplica un patch parcial sobre el estado de episodios y notifica
export function updateEpisodes(patch) {
  Object.assign(state.episodes, patch);
  notify('episodes');
}

// Resetea el estado de personajes a su valor inicial sin notificar
// Se usa antes de lanzar una nueva búsqueda desde la primera página
export function resetCharacters() {
  state.characters.results = [];
  state.characters.page = 1;
  state.characters.info = null;
  state.characters.status = 'idle';
  state.characters.error = null;
}

// Resetea el estado de episodios a su valor inicial sin notificar
export function resetEpisodes() {
  state.episodes.results = [];
  state.episodes.page = 1;
  state.episodes.info = null;
  state.episodes.status = 'idle';
  state.episodes.error = null;
}

// Comprueba si un personaje está en la lista de favoritos por su id
export function isFavorite(id) {
  return state.favorites.some((fav) => fav.id === id);
}

// Añade o elimina un personaje de favoritos, guarda en localStorage y notifica
// Devuelve true si el personaje quedó como favorito, false si fue eliminado
export function toggleFavorite(character) {
  const exists = isFavorite(character.id);
  if (exists) {
    // Elimina el personaje de la lista
    state.favorites = state.favorites.filter((fav) => fav.id !== character.id);
  } else {
    // Añade un snapshot al principio para que aparezca primero en la vista
    state.favorites = [snapshotCharacter(character), ...state.favorites];
  }
  // Persiste la lista actualizada en localStorage
  writeJSON(FAVORITES_KEY, state.favorites);
  notify('favorites');
  return !exists;
}

// Devuelve la lista actual de favoritos
export function getFavorites() {
  return state.favorites;
}

// Crea una copia plana del personaje con solo los campos necesarios para renderizar la card
// Así no se pierde información si el personaje cambia en la API en el futuro
function snapshotCharacter(c) {
  return {
    id: c.id,
    name: c.name,
    image: c.image,
    status: c.status,
    species: c.species,
    gender: c.gender,
    origin: c.origin ? { name: c.origin.name } : { name: 'Desconocido' },
    location: c.location ? { name: c.location.name } : { name: 'Desconocida' },
    created: c.created,
    episode: c.episode || [],
    type: c.type || '',
    url: c.url,
  };
}
