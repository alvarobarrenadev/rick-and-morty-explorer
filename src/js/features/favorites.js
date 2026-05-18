// Vista de favoritos
// Muestra las cards de los personajes guardados o un estado vacío si no hay ninguno
// Se re-renderiza completa cada vez que cambia la lista de favoritos en el store

import { el, mount, clear } from '../utils/dom.js';
import { getFavorites } from '../state.js';
import { CharacterCard } from '../components/CharacterCard.js';
import { EmptyState } from '../components/EmptyState.js';
import { openCharacterDetail } from './characterDetail.js';

// Referencia al nodo raíz de la vista, necesaria para re-renderizar desde fuera
let viewRootRef = null;

// Monta la vista de favoritos en el contenedor raíz y guarda la referencia para re-renders
export function renderFavoritesView(viewRoot) {
  viewRootRef = viewRoot;
  paint();
}

// Vuelve a pintar la vista con el estado actual de favoritos
// Se llama desde main.js cuando el store notifica un cambio en la lista de favoritos
export function paintFavorites() {
  if (!viewRootRef) return;
  paint();
}

// Construye y monta la vista completa a partir de la lista de favoritos actual
// Esta función se llama tanto en el render inicial como en cada actualización
function paint() {
  const favorites = getFavorites();

  const header = el('header', { class: 'page__header' }, [
    el('h1', { class: 'page__title' }, 'Favoritos'),
    el('p', { class: 'page__subtitle' }, 'Tus personajes guardados localmente.'),
  ]);

  let body;
  if (!favorites.length) {
    // Si no hay favoritos, muestra un estado vacío con un enlace para ir a explorar personajes
    body = el('div', { class: 'page__empty' }, [
      EmptyState({
        title: 'Aún no tienes favoritos',
        message: 'Marca personajes con la estrella para guardarlos aquí.',
        action: el(
          'a',
          { href: '#/characters', class: 'btn btn--primary' },
          'Explorar personajes'
        ),
      }),
    ]);
  } else {
    // Si hay favoritos, construye el grid con una card por cada personaje guardado
    body = el(
      'div',
      { class: 'card-grid' },
      favorites.map((character) =>
        CharacterCard(character, { onOpenDetail: openCharacterDetail })
      )
    );
  }

  const page = el('section', { class: 'page page--favorites' }, [header, body]);
  // Reemplaza el contenido anterior del viewRoot con la nueva vista
  mount(viewRootRef, page);
}

// Limpia la referencia al nodo raíz al salir de la sección
// El router llama a esta función antes de renderizar otra vista
export function teardownFavoritesView() {
  viewRootRef = null;
}
