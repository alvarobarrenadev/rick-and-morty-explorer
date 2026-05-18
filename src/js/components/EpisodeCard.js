// Componentes de tarjeta para episodios
// EpisodeCard: tarjeta completa para el grid de episodios
// MiniCharacterCard: tarjeta compacta usada dentro del detalle de un episodio

import { el } from '../utils/dom.js';
import { formatDate } from '../utils/formatters.js';

// Tarjeta de episodio para el grid principal
// Muestra el código del episodio, nombre, fecha de emisión y número de personajes
export function EpisodeCard(episode, { onOpenDetail } = {}) {
  // Botón explícito para abrir el detalle del episodio con sus personajes
  const detailButton = el(
    'button',
    {
      type: 'button',
      class: 'btn btn--primary',
      onClick: (event) => {
        // Evita que el clic propague al article y dispare el handler del artículo
        event.stopPropagation();
        onOpenDetail?.(episode);
      },
    },
    'Ver personajes'
  );

  // El article completo también es clicable para abrir el detalle
  return el(
    'article',
    {
      class: 'card episode-card',
      tabindex: '0',
      onClick: () => onOpenDetail?.(episode),
      // Soporte de teclado para usuarios que navegan sin ratón
      onKeydown: (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDetail?.(episode);
        }
      },
    },
    [
      // Código del episodio fuera del body para que actúe como etiqueta visual, por ejemplo S01E01
      el('div', { class: 'episode-card__code' }, episode.episode),
      el('div', { class: 'card__body' }, [
        el('h3', { class: 'card__title' }, episode.name),
        // Fecha de emisión formateada en español
        el('p', { class: 'card__meta' }, [
          el('span', {}, `Emisión: ${formatDate(episode.air_date)}`),
        ]),
        // Número de personajes que aparecen en el episodio con estilo de pill
        el('p', { class: 'card__meta' }, [
          el('span', { class: 'pill' }, `${episode.characters?.length ?? 0} personajes`),
        ]),
        el('div', { class: 'card__actions' }, [detailButton]),
      ]),
    ]
  );
}

// Tarjeta compacta de personaje usada en el grid de personajes de un episodio
// Es un botón para que sea interactivo y accesible sin depender de un div clicable
export function MiniCharacterCard(character, { onOpenDetail } = {}) {
  return el(
    'button',
    {
      type: 'button',
      class: 'mini-card',
      onClick: () => onOpenDetail?.(character),
      // aria-label describe la acción ya que la imagen no tiene texto visible como label
      'aria-label': `Ver detalle de ${character.name}`,
    },
    [
      // El alt está vacío porque el nombre del personaje ya se muestra en el span de abajo
      el('img', {
        src: character.image,
        alt: '',
        loading: 'lazy',
        width: '64',
        height: '64',
      }),
      el('span', { class: 'mini-card__name' }, character.name),
    ]
  );
}
