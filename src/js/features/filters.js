// Barra de filtros para la sección de personajes
// Combina búsqueda por nombre, selector de estado y campo de especie

import { el } from '../utils/dom.js';
import { debounce } from '../utils/debounce.js';

// Opciones del selector de estado, la primera es "Todos" que equivale a no filtrar
const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'alive', label: 'Vivo' },
  { value: 'dead', label: 'Muerto' },
  { value: 'unknown', label: 'Desconocido' },
];

// Sugerencias para el datalist de especie, ayudan al usuario sin restringir el valor
const SPECIES_SUGGESTIONS = [
  'Human',
  'Alien',
  'Humanoid',
  'Robot',
  'Animal',
  'Mythological Creature',
  'Disease',
  'Cronenberg',
];

// Construye y devuelve el bloque de filtros
// initial: valores iniciales de los filtros, usados al volver a la sección
// onChange: se llama con el nuevo objeto de filtros cuando el usuario cambia algo
// onClear: se llama cuando el usuario pulsa "Limpiar filtros"
export function FiltersBar({ initial, onChange, onClear }) {
  // Copia local del estado de filtros para actualizarla sin modificar el store directamente
  const state = { ...initial };

  // Emite el estado actualizado hacia arriba sin retardo (para selects)
  const emit = () => onChange?.({ ...state });
  // Versión con retardo de 400 ms para el input de texto, evita una petición por tecla
  const debouncedEmit = debounce(emit, 400);

  // Input de búsqueda por nombre del personaje
  const nameInput = el('input', {
    type: 'search',
    id: 'filter-name',
    class: 'input',
    placeholder: 'Ej. Rick, Morty…',
    value: state.name || '',
    autocomplete: 'off',
    onInput: (e) => {
      state.name = e.target.value.trim();
      // Usa debounce para no disparar la petición mientras el usuario sigue escribiendo
      debouncedEmit();
    },
  });

  // Selector de estado: Todos, Vivo, Muerto, Desconocido
  // El estado activo se marca con selected al crear las opciones
  const statusSelect = el(
    'select',
    {
      id: 'filter-status',
      class: 'input',
      onChange: (e) => {
        state.status = e.target.value;
        // El select responde inmediatamente, sin debounce
        emit();
      },
    },
    STATUS_OPTIONS.map((opt) =>
      el('option', { value: opt.value, selected: opt.value === (state.status || '') }, opt.label)
    )
  );

  // datalist asociado al input de especie que muestra sugerencias al escribir
  const speciesList = el(
    'datalist',
    { id: 'species-options' },
    SPECIES_SUGGESTIONS.map((sp) => el('option', { value: sp }))
  );

  // Input de especie vinculado al datalist de sugerencias
  const speciesInput = el('input', {
    type: 'text',
    id: 'filter-species',
    class: 'input',
    placeholder: 'Ej. Human, Alien…',
    list: 'species-options',
    value: state.species || '',
    autocomplete: 'off',
    onInput: (e) => {
      state.species = e.target.value.trim();
      debouncedEmit();
    },
  });

  // Botón que resetea todos los filtros a su estado vacío
  const clearButton = el(
    'button',
    {
      type: 'button',
      class: 'btn btn--ghost',
      onClick: () => {
        // Resetea el estado interno y los valores visuales de los controles
        state.name = '';
        state.status = '';
        state.species = '';
        nameInput.value = '';
        statusSelect.value = '';
        speciesInput.value = '';
        // Cancela cualquier debounce pendiente para no lanzar una búsqueda con el texto anterior
        debouncedEmit.cancel?.();
        // Notifica al padre para que recargue con filtros vacíos
        onClear?.();
      },
    },
    'Limpiar filtros'
  );

  // Devuelve el contenedor de filtros con todos los campos
  return el('section', { class: 'filters', 'aria-label': 'Filtros de personajes' }, [
    el('div', { class: 'filters__field' }, [
      el('label', { for: 'filter-name', class: 'filters__label' }, 'Buscar por nombre'),
      nameInput,
    ]),
    el('div', { class: 'filters__field' }, [
      el('label', { for: 'filter-status', class: 'filters__label' }, 'Estado'),
      statusSelect,
    ]),
    el('div', { class: 'filters__field' }, [
      el('label', { for: 'filter-species', class: 'filters__label' }, 'Especie'),
      speciesInput,
      speciesList,
    ]),
    el('div', { class: 'filters__actions' }, [clearButton]),
  ]);
}
