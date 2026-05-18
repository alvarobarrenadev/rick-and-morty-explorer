// Punto de entrada de la aplicación
// Importa los estilos globales de Sass para que Vite los procese
import '@sass/main.scss';

// Importa el router que gestiona la navegación entre secciones
import { startRouter } from './js/router.js';
// Importa las funciones del store global necesarias en este módulo
import { getFavorites, getState, subscribe } from './js/state.js';
// Importa la función para refrescar las cards de personajes cuando cambian favoritos
import { refreshCharacterCardsFavorites } from './js/features/characters.js';
// Importa la función para re-renderizar la vista de favoritos cuando cambia la lista
import { paintFavorites } from './js/features/favorites.js';

// Actualiza el contador de favoritos que se muestra en el enlace del menú
function updateFavoritesBadge() {
  const node = document.getElementById('favorites-count');
  if (!node) return;
  const count = getFavorites().length;
  // Muestra el número actual de favoritos guardados
  node.textContent = String(count);
  // Aplica la clase de badge vacío cuando no hay ningún favorito
  node.classList.toggle('badge--zero', count === 0);
}

// Se suscribe al store global para reaccionar cuando cambian los favoritos
subscribe((scope) => {
  // Ignora cualquier notificación que no sea de favoritos
  if (scope !== 'favorites') return;
  // Actualiza el contador del menú
  updateFavoritesBadge();
  const route = getState().route.name;
  // Si el usuario está en la sección Favoritos, vuelve a pintarla con la lista actualizada
  if (route === 'favorites') paintFavorites();
  // Si está en Personajes, actualiza los iconos de estrella sin recargar la lista
  if (route === 'characters') refreshCharacterCardsFavorites();
});

// Inicializa el badge con el valor que hay en localStorage al cargar la página
updateFavoritesBadge();
// Arranca el router que decide qué vista mostrar según el hash de la URL
startRouter();
