// Router basado en el hash de la URL (#/characters, #/episodes, #/favorites)
// Decide qué vista renderizar según el fragmento activo y gestiona el ciclo de vida de cada sección

import { setRoute } from './state.js';
import { renderCharactersView, teardownCharactersView } from './features/characters.js';
import { renderEpisodesView, teardownEpisodesView } from './features/episodes.js';
import { renderFavoritesView, teardownFavoritesView } from './features/favorites.js';
import { closeModal } from './components/Modal.js';

// Mapa de rutas disponibles con su nombre legible, función de render y función de limpieza
const ROUTES = {
  characters: { name: 'Personajes', render: renderCharactersView, teardown: teardownCharactersView },
  episodes: { name: 'Episodios', render: renderEpisodesView, teardown: teardownEpisodesView },
  favorites: { name: 'Favoritos', render: renderFavoritesView, teardown: teardownFavoritesView },
};

// Guarda el nombre de la ruta actualmente renderizada para poder hacer teardown al salir
let currentRoute = null;

// Arranca el router: escucha cambios de hash y procesa el hash inicial
export function startRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

// Extrae el nombre de la ruta desde el hash de la URL
// Devuelve null si el hash no coincide con ninguna ruta registrada
function parseHash() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const [name] = hash.split('/').filter(Boolean);
  return ROUTES[name] ? name : null;
}

// Gestiona cada cambio de hash y coordina el ciclo render → teardown
function handleRoute() {
  let routeName = parseHash();
  // Si la URL no tiene un hash válido, redirige a personajes por defecto
  if (!routeName) {
    window.location.hash = '#/characters';
    return;
  }

  // Cierra cualquier modal abierto al cambiar de sección
  closeModal();

  // Si hay una sección activa distinta a la nueva, limpia sus referencias y peticiones pendientes
  if (currentRoute && currentRoute !== routeName) {
    ROUTES[currentRoute].teardown?.();
  }

  currentRoute = routeName;
  // Actualiza la ruta en el store global para que los suscriptores puedan reaccionar
  setRoute({ name: routeName, params: {} });

  // Renderiza la nueva vista en el contenedor principal
  const viewRoot = document.getElementById('view-root');
  ROUTES[routeName].render(viewRoot);

  // Marca el enlace activo en el menú de navegación
  updateActiveNav(routeName);
  // Actualiza el título de la pestaña del navegador
  document.title = `${ROUTES[routeName].name} · Rick & Morty Explorer`;
  // Vuelve al inicio de la página al cambiar de sección
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// Aplica la clase is-active y el atributo aria-current al enlace de la ruta activa
// y los elimina del resto de enlaces del menú
function updateActiveNav(routeName) {
  document.querySelectorAll('.main-nav__link').forEach((link) => {
    const isActive = link.dataset.route === routeName;
    link.classList.toggle('is-active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}
