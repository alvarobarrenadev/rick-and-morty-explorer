// Utilidad para retrasar la ejecución de una función hasta que el usuario deja de llamarla
// Se usa en el buscador para no lanzar una petición a la API en cada pulsación de tecla

// Devuelve una versión de fn que solo se ejecuta cuando han pasado `delay` ms sin llamarla
// También expone debounced.cancel() para cancelar el timer pendiente si es necesario
export function debounce(fn, delay = 400) {
  let timer;
  const debounced = (...args) => {
    // Cancela el timer anterior si el usuario sigue escribiendo
    clearTimeout(timer);
    // Programa la ejecución real de fn tras el retardo indicado
    timer = setTimeout(() => fn(...args), delay);
  };
  // Permite cancelar la llamada pendiente sin ejecutarla, por ejemplo al limpiar filtros
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}
