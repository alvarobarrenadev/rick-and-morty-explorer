// Vista principal de personajes
// Gestiona el renderizado del grid, los filtros, la paginación y los estados de carga / error / vacío

import { el, mount, clear } from '../utils/dom.js';
import { getCharacters, getEpisodesByIds, ApiError } from '../api/rickAndMortyApi.js';
import { getState, updateCharacters, resetCharacters } from '../state.js';
import { CharacterCard } from '../components/CharacterCard.js';
import { Loader } from '../components/Loader.js';
import { ErrorMessage } from '../components/ErrorMessage.js';
import { EmptyState } from '../components/EmptyState.js';
import { FiltersBar } from './filters.js';
import { openCharacterDetail } from './characterDetail.js';

// Controlador de la petición en vuelo, permite cancelarla si el usuario cambia los filtros
let currentController = null;
// Referencias a los nodos del DOM que se actualizan sin re-montar toda la vista
let listRef = null;
let loadMoreRef = null;
let statusRef = null;

// Monta la vista completa de personajes en el contenedor raíz
// Si ya hay resultados en el store, los pinta directamente sin volver a llamar a la API
export function renderCharactersView(viewRoot) {
  const state = getState();

  const header = el('header', { class: 'page__header' }, [
    el('h1', { class: 'page__title' }, 'Personajes'),
    el('p', { class: 'page__subtitle' }, 'Explora el multiverso de Rick and Morty.'),
  ]);

  // La barra de filtros notifica hacia arriba cuando el usuario cambia algo
  const filters = FiltersBar({
    initial: state.characters.filters,
    onChange: (next) => {
      // Actualiza los filtros en el store y recarga desde la primera página
      updateCharacters({ filters: next });
      loadFirstPage();
    },
    onClear: () => {
      // Resetea los filtros a vacío y recarga
      updateCharacters({ filters: { name: '', status: '', species: '' } });
      loadFirstPage();
    },
  });

  // Contenedor del grid de cards
  const list = el('div', { class: 'card-grid' });
  // Zona donde se muestran los estados de carga, error y lista vacía
  const status = el('div', { class: 'page__status', 'aria-live': 'polite' });
  // Zona donde aparece el botón "Cargar más" o el loader de paginación
  const loadMoreWrap = el('div', { class: 'page__load-more' });

  // Guarda referencias para poder actualizar estos nodos sin re-renderizar la vista
  listRef = list;
  statusRef = status;
  loadMoreRef = loadMoreWrap;

  const page = el('section', { class: 'page page--characters' }, [
    header,
    filters,
    status,
    list,
    loadMoreWrap,
  ]);

  mount(viewRoot, page);

  // Si ya hay resultados cacheados en el store, los pinta directamente
  // Evita una petición innecesaria al volver a esta sección después de haber navegado
  if (state.characters.results.length && state.characters.status !== 'idle') {
    paintList(state.characters.results);
    paintStatus();
    paintLoadMore();
  } else {
    loadFirstPage();
  }
}

// Vuelve a renderizar todas las cards para que los iconos de estrella reflejen el estado actual de favoritos
// Se llama desde main.js cuando el store notifica un cambio de favoritos
export function refreshCharacterCardsFavorites() {
  if (!listRef) return;
  const state = getState();
  paintList(state.characters.results);
}

// Vacía el grid y pinta una card por cada personaje del array
function paintList(results) {
  if (!listRef) return;
  clear(listRef);
  results.forEach((character) => {
    listRef.appendChild(
      CharacterCard(character, { onOpenDetail: openCharacterDetail })
    );
  });
}

// Actualiza la zona de estado según el valor de state.characters.status
// Puede mostrar un loader, un error con reintento o un mensaje de lista vacía
function paintStatus() {
  if (!statusRef) return;
  const state = getState();
  clear(statusRef);
  const ch = state.characters;

  if (ch.status === 'loading') {
    statusRef.appendChild(Loader({ label: 'Cargando personajes…' }));
  } else if (ch.status === 'error') {
    statusRef.appendChild(
      ErrorMessage({
        title: 'No pudimos cargar los personajes',
        message: ch.error || 'Inténtalo de nuevo en un momento.',
        onRetry: loadFirstPage,
      })
    );
  } else if (ch.status === 'empty') {
    statusRef.appendChild(
      EmptyState({
        title: 'Sin resultados',
        message: 'No se encontraron personajes con esos filtros.',
      })
    );
  }
}

// Actualiza la zona del botón "Cargar más"
// Muestra un loader durante la paginación, el botón si hay más páginas o nada si ya no las hay
function paintLoadMore() {
  if (!loadMoreRef) return;
  clear(loadMoreRef);
  const state = getState();
  const { info, status } = state.characters;

  if (status === 'loading-more') {
    loadMoreRef.appendChild(Loader({ label: 'Cargando más…' }));
    return;
  }
  // Si info.next es null, la API indica que no hay más páginas disponibles
  if (!info || !info.next) return;

  loadMoreRef.appendChild(
    el(
      'button',
      { type: 'button', class: 'btn btn--secondary', onClick: loadNextPage },
      'Cargar más'
    )
  );
}

// Carga la primera página aplicando los filtros activos
// Cancela cualquier petición anterior, resetea el estado y actualiza la UI
async function loadFirstPage() {
  const state = getState();
  // Cancela la petición anterior si aún está en vuelo
  if (currentController) currentController.abort();
  currentController = new AbortController();

  resetCharacters();
  updateCharacters({ status: 'loading' });
  paintList([]);
  paintStatus();
  paintLoadMore();

  try {
    const data = await getCharacters(
      { ...state.characters.filters, page: 1 },
      { signal: currentController.signal }
    );
    const results = data.results || [];
    updateCharacters({
      results,
      info: data.info || null,
      page: 1,
      // Si la API devuelve lista vacía, el estado pasa a 'empty' para mostrar el mensaje
      status: results.length ? 'ready' : 'empty',
      error: null,
    });
    paintList(results);
    paintStatus();
    paintLoadMore();
  } catch (error) {
    // Si la petición fue cancelada intencionalmente, no hace nada
    if (error.name === 'AbortError') return;
    updateCharacters({
      status: 'error',
      error: error instanceof ApiError ? error.message : 'Error inesperado.',
    });
    paintStatus();
    paintLoadMore();
  }
}

// Carga la siguiente página y añade los resultados al array ya existente
// Se llama al pulsar el botón "Cargar más"
async function loadNextPage() {
  const state = getState();
  if (!state.characters.info?.next) return;
  if (currentController) currentController.abort();
  currentController = new AbortController();

  const nextPage = state.characters.page + 1;
  updateCharacters({ status: 'loading-more' });
  paintLoadMore();

  try {
    const data = await getCharacters(
      { ...state.characters.filters, page: nextPage },
      { signal: currentController.signal }
    );
    // Fusiona los resultados anteriores con los nuevos para que no desaparezca lo ya cargado
    const merged = [...state.characters.results, ...(data.results || [])];
    updateCharacters({
      results: merged,
      info: data.info || null,
      page: nextPage,
      status: 'ready',
    });
    paintList(merged);
    paintLoadMore();
  } catch (error) {
    if (error.name === 'AbortError') return;
    updateCharacters({
      status: 'ready',
      error: error instanceof ApiError ? error.message : 'Error inesperado.',
    });
    paintLoadMore();
    // Muestra un error bajo el botón con opción de reintentar la página fallida
    if (loadMoreRef) {
      loadMoreRef.appendChild(
        ErrorMessage({
          title: 'No se pudo cargar la siguiente página',
          message: state.characters.error,
          onRetry: loadNextPage,
        })
      );
    }
  }
}

// Limpia las referencias al DOM y cancela peticiones pendientes al salir de esta sección
// El router llama a esta función antes de renderizar otra vista
export function teardownCharactersView() {
  if (currentController) currentController.abort();
  currentController = null;
  listRef = null;
  loadMoreRef = null;
  statusRef = null;
}

// Re-exporta getEpisodesByIds para que characterDetail pueda importarla desde aquí si lo necesita
export { getEpisodesByIds };
