// Vista de detalle de un personaje dentro del modal
// Abre el modal con un loader, luego carga los datos completos y los renderiza

import { el } from '../utils/dom.js';
import { openModal, updateModalBody, closeModal } from '../components/Modal.js';
import { Loader } from '../components/Loader.js';
import { ErrorMessage } from '../components/ErrorMessage.js';
import { getCharacterById, getEpisodesByIds } from '../api/rickAndMortyApi.js';
import { isFavorite, toggleFavorite, subscribe } from '../state.js';
import {
  statusLabel,
  statusModifier,
  formatDate,
  extractIdFromUrl,
} from '../utils/formatters.js';

// Abre el modal y lanza la carga del detalle del personaje
// Acepta el objeto completo del personaje o solo su id numérico
export function openCharacterDetail(characterOrId) {
  // Extrae el id tanto si se pasa el objeto como si se pasa solo el número
  const initialId =
    typeof characterOrId === 'object' && characterOrId !== null
      ? characterOrId.id
      : Number(characterOrId);

  // Abre el modal inmediatamente con el loader para dar feedback visual mientras carga
  openModal({
    title: typeof characterOrId === 'object' ? characterOrId.name : 'Personaje',
    content: Loader({ label: 'Cargando detalle…' }),
  });

  // Lanza la petición en segundo plano; el catch vacío evita uncaught promise si se cancela
  load(initialId).catch(() => {});
}

// Obtiene los datos completos del personaje desde la API y renderiza el detalle en el modal
async function load(id) {
  try {
    const character = await getCharacterById(id);
    renderDetail(character);
  } catch (error) {
    // Si la petición falla, reemplaza el loader por un mensaje de error con botón de reintento
    updateModalBody(
      ErrorMessage({
        title: 'No se pudo cargar el personaje',
        message: error.message || '',
        onRetry: () => load(id),
      })
    );
  }
}

// Construye el HTML completo del detalle y lo inyecta en el body del modal
// Los episodios se cargan de forma asíncrona después del render inicial
function renderDetail(character) {
  const favorite = isFavorite(character.id);

  // Botón para añadir o quitar de favoritos desde el detalle
  // Se actualiza en línea sin necesidad de volver a renderizar todo el detalle
  const favButton = el(
    'button',
    {
      type: 'button',
      class: ['btn', favorite ? 'btn--primary' : 'btn--ghost'],
      onClick: () => {
        const nowFav = toggleFavorite(character);
        favButton.textContent = nowFav ? '★ Quitar de favoritos' : '☆ Añadir a favoritos';
        favButton.classList.toggle('btn--primary', nowFav);
        favButton.classList.toggle('btn--ghost', !nowFav);
      },
    },
    favorite ? '★ Quitar de favoritos' : '☆ Añadir a favoritos'
  );

  // Lista de episodios con un loader inicial que se reemplaza cuando llegan los datos
  const episodesList = el('ul', { class: 'episodes-list' }, [
    el('li', { class: 'episodes-list__loading' }, [Loader({ label: 'Cargando episodios…' })]),
  ]);

  // Estructura principal del detalle: columna de imagen a la izquierda, info a la derecha
  const detail = el('div', { class: 'character-detail' }, [
    el('div', { class: 'character-detail__media' }, [
      el('img', {
        src: character.image,
        alt: `Retrato de ${character.name}`,
        width: '300',
        height: '300',
      }),
      el('div', { class: 'character-detail__actions' }, [favButton]),
    ]),

    el('div', { class: 'character-detail__info' }, [
      el('h3', { class: 'character-detail__name' }, character.name),
      // Línea de estado con punto de color y texto de estado + especie
      el('p', { class: 'character-detail__status' }, [
        el('span', {
          class: ['status-dot', `status-dot--${statusModifier(character.status)}`],
          'aria-hidden': 'true',
        }),
        `${statusLabel(character.status)} · ${character.species || 'Especie desconocida'}`,
      ]),

      // Lista de definición con todos los datos del personaje
      el('dl', { class: 'character-detail__list' }, [
        item('Tipo', character.type || '-'),
        item('Género', character.gender || '-'),
        item('Origen', character.origin?.name || '-'),
        item('Ubicación actual', character.location?.name || '-'),
        item('Creado en la API', formatDate(character.created)),
        item('Episodios totales', String(character.episode?.length ?? 0)),
      ]),

      el('section', { class: 'character-detail__episodes' }, [
        el('h4', {}, 'Aparece en'),
        episodesList,
      ]),
    ]),
  ]);

  // Reemplaza el loader del modal con el detalle completo
  updateModalBody(detail);

  // Carga los episodios en segundo plano y los inyecta en la lista cuando estén listos
  loadEpisodes(character.episode || [], episodesList);
}

// Crea una fila de la lista de definición con etiqueta y valor
function item(label, value) {
  return el('div', { class: 'character-detail__row' }, [
    el('dt', {}, label),
    el('dd', {}, value),
  ]);
}

// Convierte las URLs de episodios a ids, los solicita a la API y los renderiza en la lista
// La API devuelve un array de URLs como 'https://rickandmortyapi.com/api/episode/12'
async function loadEpisodes(urls, listNode) {
  // Extrae los ids numéricos de cada URL y filtra posibles nulos
  const ids = urls.map(extractIdFromUrl).filter(Boolean);
  if (!ids.length) {
    listNode.replaceChildren(el('li', { class: 'episodes-list__empty' }, 'Sin episodios.'));
    return;
  }
  try {
    const episodes = await getEpisodesByIds(ids);
    // Reemplaza el loader con un item por cada episodio
    listNode.replaceChildren(
      ...episodes.map((ep) =>
        el('li', { class: 'episodes-list__item' }, [
          el('span', { class: 'episodes-list__code' }, ep.episode),
          el('span', { class: 'episodes-list__name' }, ep.name),
          el('span', { class: 'episodes-list__date' }, formatDate(ep.air_date)),
        ])
      )
    );
  } catch {
    // Si falla la carga de episodios, muestra un mensaje sin romper el resto del detalle
    listNode.replaceChildren(
      el('li', { class: 'episodes-list__error' }, 'No se pudieron cargar los episodios.')
    );
  }
}

// Re-exporta closeModal para que otros módulos puedan cerrarlo sin importar Modal directamente
export { closeModal };