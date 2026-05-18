// Componente que indica que no hay resultados para mostrar
// Se usa cuando la API devuelve una lista vacía o cuando la sección de favoritos está vacía

import { el } from '../utils/dom.js';

// Devuelve un bloque visual con título, mensaje descriptivo y una acción opcional
// La acción puede ser, por ejemplo, un botón o enlace para ir a otra sección
export function EmptyState({ title = 'Sin resultados', message = '', action } = {}) {
  return el('div', { class: 'message message--empty' }, [
    // Símbolo decorativo del conjunto vacío, oculto a lectores de pantalla
    el('div', { class: 'message__icon', 'aria-hidden': 'true' }, '∅'),
    el('div', { class: 'message__body' }, [
      el('h3', { class: 'message__title' }, title),
      // El texto solo se renderiza si se proporciona
      message ? el('p', { class: 'message__text' }, message) : null,
      // La acción es un nodo DOM opcional, por ejemplo un botón o un enlace
      action || null,
    ]),
  ]);
}
