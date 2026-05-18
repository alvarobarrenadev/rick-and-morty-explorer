// Componente de carga que muestra un spinner animado y un texto descriptivo
// Se usa en cualquier punto de la app donde se esté esperando datos de la API

import { el } from '../utils/dom.js';

// Devuelve un nodo con role="status" y aria-live="polite" para anunciar la carga a lectores de pantalla
// El label describe qué se está cargando, por ejemplo 'Cargando personajes…'
export function Loader({ label = 'Cargando…' } = {}) {
  return el('div', { class: 'loader', role: 'status', 'aria-live': 'polite' }, [
    // El spinner es solo visual, se oculta a los lectores de pantalla con aria-hidden
    el('span', { class: 'loader__spinner', 'aria-hidden': 'true' }),
    // El texto sí es leído por lectores de pantalla gracias al aria-live del padre
    el('span', { class: 'loader__label' }, label),
  ]);
}
