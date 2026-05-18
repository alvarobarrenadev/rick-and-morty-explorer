// Vista principal de episodios
// Gestiona el grid de episodios, la paginación y los estados de carga / error / vacío
// No tiene filtros propios; la API de episodios se consume sin parámetros adicionales

import { el, mount, clear } from '../utils/dom.js';
import { getEpisodes, ApiError } from '../api/rickAndMortyApi.js';
import { getState, updateEpisodes, resetEpisodes } from '../state.js';
import { EpisodeCard } from '../components/EpisodeCard.js';
import { Loader } from '../components/Loader.js';
import { ErrorMessage } from '../components/ErrorMessage.js';
import { EmptyState } from '../components/EmptyState.js';
import { openEpisodeDetail } from './episodeDetail.js';

// Controlador para cancelar la petición en vuelo si se sale de la sección antes de que termine
let currentController = null;
// Referencias a nodos del DOM para actualizarlos sin re-montar la vista
let listRef = null;
let loadMoreRef = null;
let statusRef = null;

// Monta la vista de episodios en el contenedor raíz
// Si ya hay resultados cacheados en el store, los pinta sin llamar a la API
export function renderEpisodesView(viewRoot) {
  const header = el('header', { class: 'page__header' }, [
    el('h1', { class: 'page__title' }, 'Episodios'),
    el('p', { class: 'page__subtitle' }, 'Todos los episodios del multiverso.'),
  ]);

  // Grid de cards de episodios con columnas distintas a las de personajes
  const list = el('div', { class: 'card-grid card-grid--episodes' });
  // Zona de estados visuales: loader, error o vacío
  const status = el('div', { class: 'page__status', 'aria-live': 'polite' });
  // Zona del botón "Cargar más" y del loader de paginación
  const loadMoreWrap = el('div', { class: 'page__load-more' });

  listRef = list;
  statusRef = status;
  loadMoreRef = loadMoreWrap;

  const page = el('section', { class: 'page page--episodes' }, [
    header,
    status,
    list,
    loadMoreWrap,
  ]);

  mount(viewRoot, page);

  const state = getState();
  // Si ya se cargaron episodios antes, los pinta sin otra petición
  if (state.episodes.results.length && state.episodes.status !== 'idle') {
    paintList(state.episodes.results);
    paintStatus();
    paintLoadMore();
  } else {
    loadFirstPage();
  }
}

// Vacía el grid y renderiza una card por cada episodio del array
function paintList(results) {
  if (!listRef) return;
  clear(listRef);
  results.forEach((ep) => {
    listRef.appendChild(EpisodeCard(ep, { onOpenDetail: openEpisodeDetail }));
  });
}

// Actualiza la zona de estado según el valor de state.episodes.status
function paintStatus() {
  if (!statusRef) return;
  const state = getState();
  clear(statusRef);
  const ep = state.episodes;

  if (ep.status === 'loading') {
    statusRef.appendChild(Loader({ label: 'Cargando episodios…' }));
  } else if (ep.status === 'error') {
    statusRef.appendChild(
      ErrorMessage({
        title: 'No pudimos cargar los episodios',
        message: ep.error || '',
        onRetry: loadFirstPage,
      })
    );
  } else if (ep.status === 'empty') {
    statusRef.appendChild(
      EmptyState({ title: 'Sin episodios', message: 'No encontramos episodios.' })
    );
  }
}

// Actualiza la zona del botón "Cargar más" según si hay más páginas disponibles
function paintLoadMore() {
  if (!loadMoreRef) return;
  clear(loadMoreRef);
  const state = getState();
  const { info, status } = state.episodes;

  if (status === 'loading-more') {
    loadMoreRef.appendChild(Loader({ label: 'Cargando más…' }));
    return;
  }
  // Si info.next es null, la API indica que esta es la última página
  if (!info || !info.next) return;

  loadMoreRef.appendChild(
    el('button', { type: 'button', class: 'btn btn--secondary', onClick: loadNextPage }, 'Cargar más')
  );
}

// Carga la primera página de episodios, cancela peticiones previas y resetea el estado
async function loadFirstPage() {
  if (currentController) currentController.abort();
  currentController = new AbortController();

  resetEpisodes();
  updateEpisodes({ status: 'loading' });
  paintList([]);
  paintStatus();
  paintLoadMore();

  try {
    const data = await getEpisodes({ page: 1 }, { signal: currentController.signal });
    const results = data.results || [];
    updateEpisodes({
      results,
      info: data.info || null,
      page: 1,
      status: results.length ? 'ready' : 'empty',
      error: null,
    });
    paintList(results);
    paintStatus();
    paintLoadMore();
  } catch (error) {
    if (error.name === 'AbortError') return;
    updateEpisodes({
      status: 'error',
      error: error instanceof ApiError ? error.message : 'Error inesperado.',
    });
    paintStatus();
    paintLoadMore();
  }
}

// Carga la siguiente página y fusiona los resultados con los ya existentes
async function loadNextPage() {
  const state = getState();
  if (!state.episodes.info?.next) return;
  if (currentController) currentController.abort();
  currentController = new AbortController();

  const nextPage = state.episodes.page + 1;
  updateEpisodes({ status: 'loading-more' });
  paintLoadMore();

  try {
    const data = await getEpisodes({ page: nextPage }, { signal: currentController.signal });
    // Concatena sin perder los resultados anteriores
    const merged = [...state.episodes.results, ...(data.results || [])];
    updateEpisodes({
      results: merged,
      info: data.info || null,
      page: nextPage,
      status: 'ready',
    });
    paintList(merged);
    paintLoadMore();
  } catch (error) {
    if (error.name === 'AbortError') return;
    updateEpisodes({
      status: 'ready',
      error: error instanceof ApiError ? error.message : 'Error inesperado.',
    });
    paintLoadMore();
    // Muestra el error bajo la zona de "Cargar más" con opción de reintentar
    if (loadMoreRef) {
      loadMoreRef.appendChild(
        ErrorMessage({
          title: 'No se pudo cargar la siguiente página',
          message: state.episodes.error,
          onRetry: loadNextPage,
        })
      );
    }
  }
}

// Limpia las referencias al DOM y cancela peticiones pendientes al salir de la sección
export function teardownEpisodesView() {
  if (currentController) currentController.abort();
  currentController = null;
  listRef = null;
  statusRef = null;
  loadMoreRef = null;
}
