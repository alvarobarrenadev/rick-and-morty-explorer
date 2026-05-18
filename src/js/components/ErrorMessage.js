// Componente que muestra un mensaje de error dentro de la interfaz
// Nunca usa alert() — el error se renderiza como un bloque visual en la página

import { el } from '../utils/dom.js';

// Devuelve un nodo con role="alert" para que los lectores de pantalla lo anuncien inmediatamente
// Si se pasa onRetry, muestra un botón "Reintentar" que vuelve a ejecutar la petición fallida
export function ErrorMessage({ title = 'Algo salió mal', message = '', onRetry } = {}) {
  return el('div', { class: 'message message--error', role: 'alert' }, [
    // Icono de exclamación decorativo, oculto a lectores de pantalla
    el('div', { class: 'message__icon', 'aria-hidden': 'true' }, '!'),
    el('div', { class: 'message__body' }, [
      el('h3', { class: 'message__title' }, title),
      // El párrafo solo se renderiza si hay un texto descriptivo adicional
      message ? el('p', { class: 'message__text' }, message) : null,
      // El botón de reintento solo aparece si se pasa una función de callback
      onRetry
        ? el(
            'button',
            { type: 'button', class: 'btn btn--ghost', onClick: onRetry },
            'Reintentar'
          )
        : null,
    ]),
  ]);
}
