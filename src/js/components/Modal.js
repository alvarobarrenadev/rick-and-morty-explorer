// Sistema de modal para mostrar el detalle de personajes y episodios
// Solo puede haber un modal abierto a la vez
// Cumple los requisitos de accesibilidad: foco atrapado, cierre con Esc, restauración del foco

import { el, clear } from '../utils/dom.js';

// Referencia al overlay del modal activo, null cuando no hay ninguno abierto
let activeModal = null;
// Elemento que tenía el foco antes de abrir el modal, para restaurarlo al cerrarlo
let previouslyFocused = null;

// Atajo para obtener el nodo raíz del modal declarado en el HTML
const root = () => document.getElementById('modal-root');

// Abre el modal con un título, contenido inicial y un id para aria-labelledby
// Si ya hay un modal abierto, lo cierra antes de abrir el nuevo
export function openModal({ title, content, labelledBy = 'modal-title' }) {
  closeModal();

  // Guarda el elemento activo para devolver el foco cuando se cierre el modal
  previouslyFocused = document.activeElement;

  // Botón de cierre que aparece en la cabecera del modal
  const closeButton = el(
    'button',
    {
      type: 'button',
      class: 'modal__close',
      'aria-label': 'Cerrar detalle',
      onClick: closeModal,
    },
    '×'
  );

  // Cabecera del modal con el título y el botón de cierre
  const header = el('header', { class: 'modal__header' }, [
    title ? el('h2', { id: labelledBy, class: 'modal__title' }, title) : null,
    closeButton,
  ]);

  // Contenedor del contenido principal del modal
  const body = el('div', { class: 'modal__body' }, content);

  // Diálogo accesible: role="dialog", aria-modal y aria-labelledby vinculan el título
  // tabindex="-1" permite que el diálogo reciba foco programáticamente
  const dialog = el(
    'div',
    {
      class: 'modal__dialog',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': labelledBy,
      tabindex: '-1',
    },
    [header, body]
  );

  // Overlay oscuro de fondo: clic fuera del diálogo cierra el modal
  const overlay = el(
    'div',
    {
      class: 'modal__overlay',
      onClick: (event) => {
        // Solo cierra si el clic fue directamente sobre el overlay, no sobre el diálogo
        if (event.target === overlay) closeModal();
      },
    },
    [dialog]
  );

  // Monta el overlay en el nodo raíz y actualiza el atributo aria-hidden
  const host = root();
  host.setAttribute('aria-hidden', 'false');
  host.appendChild(overlay);
  // Bloquea el scroll del body mientras el modal esté abierto
  document.body.classList.add('is-modal-open');
  // Registra el listener de teclado para detectar la tecla Escape
  document.addEventListener('keydown', onKeyDown);

  activeModal = overlay;
  // Aplaza el foco un frame para asegurarse de que el nodo ya está en el DOM
  requestAnimationFrame(() => dialog.focus());

  return { close: closeModal };
}

// Reemplaza el contenido del body del modal activo sin recrearlo
// Se usa para actualizar el contenido una vez llegan los datos de la API
export function updateModalBody(content) {
  if (!activeModal) return;
  const body = activeModal.querySelector('.modal__body');
  if (!body) return;
  // Limpia el contenido anterior antes de insertar el nuevo
  clear(body);
  if (Array.isArray(content)) {
    content.forEach((node) => node && body.appendChild(node));
  } else if (content) {
    body.appendChild(content);
  }
}

// Cierra el modal activo, restaura el scroll y devuelve el foco al elemento previo
export function closeModal() {
  if (!activeModal) return;
  const host = root();
  // Elimina el overlay del DOM
  clear(host);
  host.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-modal-open');
  // Elimina el listener de teclado que se creó al abrir el modal
  document.removeEventListener('keydown', onKeyDown);
  activeModal = null;

  // Devuelve el foco al elemento que lo tenía antes de abrir el modal
  if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
    previouslyFocused.focus();
  }
  previouslyFocused = null;
}

// Cierra el modal al pulsar Escape
function onKeyDown(event) {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeModal();
  }
}
