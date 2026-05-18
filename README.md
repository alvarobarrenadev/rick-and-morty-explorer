# Rick & Morty Explorer

SPA que consume la [Rick and Morty API](https://rickandmortyapi.com/) para explorar personajes y episodios de la serie. Construida con Vanilla JS, Vite y Sass sin ningún framework de UI.

## Demo

[https://alvarobarrena.github.io/rick-and-morty-explorer/](https://alvarobarrena.github.io/rick-and-morty-explorer/)

---

## Características

- **Personajes** — grid responsive con búsqueda por nombre, filtro por estado y especie, paginación con "Cargar más"
- **Episodios** — listado completo de todos los episodios con paginación
- **Favoritos** — guarda personajes en `localStorage`, persisten entre sesiones
- **Detalle en modal** — al abrir un personaje muestra sus datos completos y los episodios en los que aparece; al abrir un episodio muestra los personajes que participan
- **Routing por hash** — navegación sin recarga basada en `window.location.hash` (`#/characters`, `#/episodes`, `#/favorites`)
- **PWA instalable** — service worker propio, manifest completo, instalable en móvil desde el navegador
- **Scroll suave** — integración con [Lenis](https://lenis.darkroom.engineering/)
- **Accesibilidad** — skip link, `aria-current`, `aria-live`, `role="dialog"`, `aria-modal`, gestión del foco en el modal, navegación por teclado

---

## Tecnologías

| Herramienta | Uso |
|---|---|
| Vanilla JS (ES Modules) | Toda la lógica de la app |
| [Vite 8](https://vite.dev/) | Bundler y dev server |
| [Sass](https://sass-lang.com/) | Estilos con arquitectura 7-in-1 |
| [Lenis](https://lenis.darkroom.engineering/) | Scroll suave |
| [gh-pages](https://github.com/tschaub/gh-pages) | Despliegue en GitHub Pages |
| [Rick and Morty API](https://rickandmortyapi.com/) | Fuente de datos |

---

## Estructura del proyecto

```
rick-and-morty-explorer/
├── public/
│   ├── favicon.svg                      # Logo SVG usado como icono y marca en el header
│   ├── apple-touch-icon.png             # Icono para iOS al añadir a pantalla de inicio
│   ├── favicon-96x96.png                # Icono PNG de propósito general
│   ├── web-app-manifest-192x192.png     # Icono PWA tamaño pequeño
│   ├── web-app-manifest-512x512.png     # Icono PWA tamaño grande
│   ├── site.webmanifest                 # Manifiesto de la PWA (nombre, colores, iconos, scope)
│   └── sw.js                            # Service worker: cache del app shell, red para la API
├── src/
│   ├── main.js                          # Entrada: importa estilos, arranca router, registra SW e inicializa Lenis
│   ├── js/
│   │   ├── state.js                     # Store global: estado de la app, subscribe/notify, favoritos en localStorage
│   │   ├── router.js                    # Router de hash: mapea #/ruta a render+teardown, actualiza nav y título
│   │   ├── api/
│   │   │   └── rickAndMortyApi.js       # Todas las llamadas a la API: personajes, episodios, paginación, AbortController
│   │   ├── components/
│   │   │   ├── CharacterCard.js         # Card de personaje con botón de favorito que se actualiza sin re-render
│   │   │   ├── EpisodeCard.js           # Card de episodio y mini-card de personaje usada en el detalle
│   │   │   ├── Modal.js                 # Modal accesible: foco, Escape, click fuera, restaura foco al cerrar
│   │   │   ├── Loader.js                # Spinner de carga con texto descriptivo
│   │   │   ├── ErrorMessage.js          # Bloque de error con icono, título, mensaje y botón de reintento
│   │   │   └── EmptyState.js            # Estado vacío cuando no hay resultados
│   │   ├── features/
│   │   │   ├── characters.js            # Vista de personajes: grid, paginación, caché de páginas, AbortController
│   │   │   ├── characterDetail.js       # Modal de personaje: datos completos, favorito, lista de episodios
│   │   │   ├── episodes.js              # Vista de episodios: grid con paginación incremental
│   │   │   ├── episodeDetail.js         # Modal de episodio: cabecera y grid de personajes participantes
│   │   │   ├── favorites.js             # Vista de favoritos: re-render completo desde localStorage
│   │   │   └── filters.js               # Barra de filtros: nombre (debounce 400ms), estado (inmediato), especie
│   │   └── utils/
│   │       ├── dom.js                   # Helper el(tag, attrs, children) para crear nodos DOM sin JSX
│   │       ├── storage.js               # Wrappers de localStorage con try/catch para modo privado y cuota llena
│   │       ├── debounce.js              # Debounce genérico con método .cancel() para limpiar el timeout pendiente
│   │       └── formatters.js            # Formatea fechas, traduce estados al español y extrae IDs de URLs de la API
│   └── sass/                            # Arquitectura 7-in-1
│       ├── main.scss
│       ├── abstracts/                   # Variables y mixins
│       ├── base/                        # Reset, tipografía, animaciones
│       ├── components/                  # Botones, cards, modal, loader, mensajes
│       ├── layout/                      # Header, navbar, grid, formularios
│       ├── pages/                       # Estilos específicos por sección
│       ├── themes/                      # Tema oscuro global
│       └── vendors/                     # Terceros (vacío por ahora)
├── index.html                           # HTML semántico: skip link, header, nav, main, footer, modal-root
├── vite.config.js                       # Configuración de Vite: base, aliases de Sass, sourcemaps
└── package.json
```

---

## Instalación y uso

**Requisitos:** Node.js 18+ y pnpm

```bash
# Clonar el repo
git clone https://github.com/alvarobarrena/rick-and-morty-explorer.git
cd rick-and-morty-explorer

# Instalar dependencias
pnpm install

# Arrancar el servidor de desarrollo
pnpm dev

# Generar build de producción
pnpm build

# Previsualizar el build
pnpm preview

# Desplegar en GitHub Pages
pnpm deploy
```

---

## Arquitectura JS

### Estado global (`state.js`)

Store centralizado sin librerías. Expone `subscribe(fn)` que devuelve una función para cancelar la suscripción y `notify(scope)` para avisar solo a los listeners interesados en un ámbito concreto (`'favorites'`, `'characters'`, etc.).

### Router (`router.js`)

Lee `window.location.hash` en cada evento `hashchange`. Por cada ruta llama a `teardown` de la ruta anterior (cancela peticiones en vuelo con `AbortController`) y al `render` de la nueva. Redirige a `#/characters` si el hash no coincide con ninguna ruta registrada.

### API (`rickAndMortyApi.js`)

Función `request(path, { signal })` centralizada con manejo de errores unificado. Las respuestas 404 devuelven `{ notFound: true }` en lugar de lanzar. Los parámetros nulos o vacíos se omiten automáticamente de la query string.

### Componentes DOM (`utils/dom.js`)

Helper `el(tag, attrs, children)` que crea nodos del DOM sin JSX ni templates. Acepta arrays de clases, objetos `dataset`, listeners `onXxx` y atributos booleanos.

### Service Worker (`public/sw.js`)

Estrategia *cache-first* para el app shell y assets estáticos. Las peticiones a `rickandmortyapi.com` siempre van a red para garantizar datos frescos. En cada activación limpia cachés de versiones anteriores.

---

## PWA

La app cumple los criterios de instalabilidad en Chrome y Safari para iOS:

- `site.webmanifest` con `start_url`, `scope`, iconos de 192 y 512px, `display: standalone`
- Service worker registrado en el scope correcto
- Meta tags para iOS (`apple-mobile-web-app-capable`, `apple-touch-icon`, etc.)
- Servida sobre HTTPS en producción (GitHub Pages)

Para instalarla en móvil: abre la URL en el navegador y usa la opción **"Añadir a pantalla de inicio"** del menú del navegador.

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `pnpm dev` | Servidor de desarrollo con HMR |
| `pnpm build` | Build optimizado en `dist/` |
| `pnpm preview` | Sirve el build localmente |
| `pnpm deploy` | Publica `dist/` en la rama `gh-pages` |