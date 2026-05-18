// Componente de tarjeta para mostrar un personaje en el grid
// Incluye imagen, datos básicos, botón de favorito y botón para abrir el detalle

import { el } from '../utils/dom.js';
import { isFavorite, toggleFavorite } from '../state.js';
import { statusLabel, statusModifier } from '../utils/formatters.js';

// Recibe el objeto personaje y un callback onOpenDetail que se llama al pedir el detalle
export function CharacterCard(character, { onOpenDetail } = {}) {
  // Consulta el estado inicial del favorito para renderizar el icono correcto al crear la card
  const favorite = isFavorite(character.id);

  // Botón de estrella para marcar o desmarcar el personaje como favorito
  // aria-pressed indica el estado actual a lectores de pantalla
  const favButton = el(
    'button',
    {
      type: 'button',
      class: ['btn-icon', 'btn-fav', favorite ? 'is-active' : ''],
      'aria-pressed': favorite ? 'true' : 'false',
      'aria-label': favorite ? `Quitar a ${character.name} de favoritos` : `Añadir a ${character.name} a favoritos`,
      title: favorite ? 'Quitar de favoritos' : 'Añadir a favoritos',
      onClick: (event) => {
        // Evita que el clic en el botón propague al article y abra el detalle
        event.stopPropagation();
        const nowFav = toggleFavorite(character);
        // Actualiza el icono y los atributos de accesibilidad sin re-renderizar la card entera
        favButton.classList.toggle('is-active', nowFav);
        favButton.setAttribute('aria-pressed', nowFav ? 'true' : 'false');
        favButton.setAttribute(
          'aria-label',
          nowFav ? `Quitar a ${character.name} de favoritos` : `Añadir a ${character.name} a favoritos`
        );
      },
    },
    [el('span', { 'aria-hidden': 'true' }, favorite ? '★' : '☆')]
  );

  // Botón explícito para abrir el detalle del personaje
  const detailButton = el(
    'button',
    {
      type: 'button',
      class: 'btn btn--primary',
      onClick: (event) => {
        // Evita que el clic en el botón propague al article
        event.stopPropagation();
        onOpenDetail?.(character);
      },
    },
    'Ver detalle'
  );

  // Punto de color que indica visualmente el estado del personaje (vivo, muerto, desconocido)
  const statusDot = el('span', {
    class: ['status-dot', `status-dot--${statusModifier(character.status)}`],
    'aria-hidden': 'true',
  });

  // article actúa como raíz semántica de la card y también responde al teclado
  const card = el(
    'article',
    {
      class: 'card character-card',
      tabindex: '0',
      // Clic en cualquier parte de la card abre el detalle
      onClick: () => onOpenDetail?.(character),
      // Enter y espacio abren el detalle para usuarios de teclado
      onKeydown: (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDetail?.(character);
        }
      },
    },
    [
      // Bloque de imagen con el botón de favorito superpuesto
      el('div', { class: 'card__media' }, [
        el('img', {
          src: character.image,
          alt: `Retrato de ${character.name}`,
          loading: 'lazy',  // carga diferida para mejorar rendimiento en el grid
          width: '300',
          height: '300',
        }),
        favButton,
      ]),
      // Bloque de información textual del personaje
      el('div', { class: 'card__body' }, [
        el('h3', { class: 'card__title' }, character.name),
        // Línea de estado con el punto de color y el texto de estado + especie
        el('p', { class: 'card__meta' }, [
          statusDot,
          `${statusLabel(character.status)} · ${character.species || 'Especie desconocida'}`,
        ]),
        // Lista de definición con género, origen y ubicación actual
        el('dl', { class: 'card__list' }, [
          el('div', {}, [el('dt', {}, 'Género'), el('dd', {}, character.gender || '—')]),
          el('div', {}, [el('dt', {}, 'Origen'), el('dd', {}, character.origin?.name || '—')]),
          el('div', {}, [el('dt', {}, 'Ubicación'), el('dd', {}, character.location?.name || '—')]),
        ]),
        el('div', { class: 'card__actions' }, [detailButton]),
      ]),
    ]
  );

  return card;
}
