// Vista de detalle de un episodio dentro del modal
// Muestra la información del episodio y carga sus personajes en un grid compacto

import { el } from '../utils/dom.js';
import { openModal, updateModalBody } from '../components/Modal.js';
import { Loader } from '../components/Loader.js';
import { ErrorMessage } from '../components/ErrorMessage.js';
import { EmptyState } from '../components/EmptyState.js';
import { getEpisodeById, getCharactersByIds } from '../api/rickAndMortyApi.js';
import { MiniCharacterCard } from '../components/EpisodeCard.js';
import { formatDate, extractIdFromUrl } from '../utils/formatters.js';
import { openCharacterDetail } from './characterDetail.js';

// Abre el modal con un loader y lanza la carga del episodio
// Acepta el objeto episodio completo o solo su id numérico
export function openEpisodeDetail(episodeOrId) {
  const id =
    typeof episodeOrId === 'object' && episodeOrId !== null
      ? episodeOrId.id
      : Number(episodeOrId);

  // Abre el modal inmediatamente con el loader mientras se obtienen los datos completos
  openModal({
    title: typeof episodeOrId === 'object' ? episodeOrId.name : 'Episodio',
    content: Loader({ label: 'Cargando episodio…' }),
  });

  // El catch vacío evita una promesa rechazada sin manejar si el modal se cierra antes
  load(id).catch(() => {});
}

// Obtiene los datos del episodio desde la API y renderiza el detalle
async function load(id) {
  try {
    const episode = await getEpisodeById(id);
    renderDetail(episode);
  } catch (error) {
    // Reemplaza el loader con un mensaje de error y la opción de reintentar
    updateModalBody(
      ErrorMessage({
        title: 'No se pudo cargar el episodio',
        message: error.message || '',
        onRetry: () => load(id),
      })
    );
  }
}

// Construye la estructura HTML del detalle del episodio y la inyecta en el modal
// Los personajes se cargan de forma asíncrona después del render inicial para no bloquear la UI
function renderDetail(episode) {
  // Contenedor donde se mostrarán las mini-cards de personajes; empieza con un loader
  const charactersWrap = el('div', { class: 'mini-grid' }, [
    Loader({ label: 'Cargando personajes…' }),
  ]);

  const detail = el('div', { class: 'episode-detail' }, [
    // Cabecera del episodio con código, nombre, fecha y recuento de personajes
    el('div', { class: 'episode-detail__head' }, [
      el('span', { class: 'episode-detail__code' }, episode.episode),
      el('h3', { class: 'episode-detail__name' }, episode.name),
      el('p', { class: 'episode-detail__meta' }, `Emisión: ${formatDate(episode.air_date)}`),
      el(
        'p',
        { class: 'episode-detail__meta' },
        `Personajes que aparecen: ${episode.characters?.length ?? 0}`
      ),
    ]),
    // Sección de personajes con el grid compacto que se rellenará asincrónicamente
    el('section', { class: 'episode-detail__characters' }, [
      el('h4', {}, 'Personajes'),
      charactersWrap,
    ]),
  ]);

  // Actualiza el body del modal con el detalle antes de que lleguen los personajes
  updateModalBody(detail);

  // Inicia la carga de personajes en paralelo sin bloquear la visualización del episodio
  loadCharacters(episode.characters || [], charactersWrap);
}

// Convierte las URLs de personajes a ids, los solicita a la API y los renderiza como mini-cards
async function loadCharacters(urls, wrap) {
  // Extrae los ids numéricos de las URLs y descarta cualquier valor nulo
  const ids = urls.map(extractIdFromUrl).filter(Boolean);
  if (!ids.length) {
    wrap.replaceChildren(
      EmptyState({ title: 'Sin personajes', message: 'Este episodio no tiene personajes.' })
    );
    return;
  }
  try {
    const characters = await getCharactersByIds(ids);
    // Sustituye el loader por una mini-card clicable por cada personaje
    wrap.replaceChildren(
      ...characters.map((c) =>
        MiniCharacterCard(c, {
          // Al hacer clic en una mini-card se abre el detalle de ese personaje
          onOpenDetail: (char) => openCharacterDetail(char),
        })
      )
    );
  } catch {
    // Si falla la carga de personajes, muestra un error sin cerrar el modal
    wrap.replaceChildren(
      ErrorMessage({
        title: 'No se pudieron cargar los personajes',
        message: 'Inténtalo más tarde.',
      })
    );
  }
}
