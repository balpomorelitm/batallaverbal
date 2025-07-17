# Batalla de Barcos

**Batalla de Barcos** es una versión educativa del clásico juego de Batalla Naval ("Battleship") pensada para practicar la conjugación de verbos en español.

El objetivo es hundir la flota enemiga mientras respondes correctamente la forma verbal que se solicita en cada casilla de ataque.

## Características principales

- Tablero de 10×10 con las reglas típicas de colocación de barcos.
- Selección de tiempos verbales y lista de verbos desde `verbos.json`.
- Para marcar un ataque debes conjugar el verbo mostrado según el pronombre correspondiente.
- Estadísticas visuales de aciertos y hundimientos.
- Diseño pensado para funcionar completamente en el navegador.

## Cómo jugar

1. Abre el proyecto en un servidor local (por ejemplo, ejecuta `python3 -m http.server` en la carpeta del repositorio).
2. Visita `http://localhost:8000/` y carga `index.html`.
3. Coloca tus barcos en el tablero "My Fleet" y fija su posición.
4. Ataca el tablero enemigo. Cada vez que selecciones una casilla, deberás escribir la conjugación correcta para continuar.
5. Gana quien hunda primero toda la flota rival.

## Archivo de datos

El listado de verbos y sus conjugaciones se encuentra en `verbos.json`. Puedes editar este archivo para añadir nuevos verbos o tiempos.

## Licencia

Este proyecto se distribuye bajo los términos de la licencia MIT que aparece en el archivo `LICENSE`.
