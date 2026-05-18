// Utilidades para crear y manipular nodos del DOM de forma declarativa
// Evita escribir múltiples líneas de createElement + setAttribute + appendChild

// Crea un elemento HTML con los atributos y los hijos indicados
// Admite clases como array, eventos como onXxx, datasets como objeto y atributos booleanos
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    // Omite atributos con valor false o null para no añadir atributos vacíos
    if (value === false || value == null) continue;

    if (key === 'class') {
      // Admite clase como string o como array de strings, filtrando valores falsy
      node.className = Array.isArray(value) ? value.filter(Boolean).join(' ') : value;
    } else if (key === 'dataset') {
      // Asigna cada clave del objeto como un data-attribute en el elemento
      for (const [dataKey, dataVal] of Object.entries(value)) {
        node.dataset[dataKey] = dataVal;
      }
    } else if (key.startsWith('on') && typeof value === 'function') {
      // Convierte onClick → click y registra el listener en el elemento
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key in node && typeof value !== 'string') {
      // Si la propiedad existe en el nodo y el valor no es string, se asigna como propiedad directa
      // Ejemplo: input.disabled = true, select.value = 'alive'
      node[key] = value;
    } else if (value === true) {
      // Atributo booleano sin valor: <input required> → setAttribute('required', '')
      node.setAttribute(key, '');
    } else {
      // Resto de atributos se asignan como strings con setAttribute
      node.setAttribute(key, value);
    }
  }

  appendChildren(node, children);
  return node;
}

// Añade hijos a un nodo padre de forma recursiva
// Admite nodos DOM, strings, arrays anidados y valores null/false (que se omiten)
function appendChildren(parent, children) {
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    // Ignora valores nulos o false, útil para renderizado condicional inline
    if (child == null || child === false) continue;
    if (Array.isArray(child)) {
      // Aplana arrays anidados recursivamente
      appendChildren(parent, child);
    } else if (child instanceof Node) {
      parent.appendChild(child);
    } else {
      // Convierte strings y números a nodo de texto
      parent.appendChild(document.createTextNode(String(child)));
    }
  }
}

// Elimina todos los hijos de un nodo sin reemplazar el nodo padre
export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

// Vacía el nodo padre y añade el nuevo nodo como único hijo
// Se usa para cambiar la vista activa sin recrear el contenedor raíz
export function mount(parent, node) {
  clear(parent);
  parent.appendChild(node);
}
