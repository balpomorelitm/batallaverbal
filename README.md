# ⚓ Batalla Naval: Spanish Conjugation Game ⚓

## Tabla de Contenidos
- [Sobre el Proyecto](#sobre-el-proyecto)
- [Características](#características)
- [Cómo Jugar](#cómo-jugar)
  - [Fase de Colocación de Barcos](#fase-de-colocación-de-barcos)
  - [Fase de Batalla](#fase-de-batalla)
- [Tecnologías Usadas](#tecnologías-usadas)
- [Créditos](#créditos)


## Sobre el Proyecto
**Batalla Naval** es un innovador juego interactivo diseñado para hacer el aprendizaje de la conjugación de verbos en español divertido y efectivo. Combina la estrategia del clásico juego de Batalla Naval con la práctica de gramática, donde cada ataque requiere conjugar un verbo correctamente. ¡Hunde la flota enemiga mientras dominas el español!

*(English: Battleship Verb Conjugation is an innovative interactive game designed to make learning Spanish verb conjugation fun and effective. It combines the strategy of the classic Battleship game with grammar practice, where each attack requires correct verb conjugation. Sink the enemy fleet while mastering Spanish!)*

## Características
* **Aprendizaje Interactivo:** Conjugación de verbos como mecánica de ataque principal.
* **Barcos Dinámicos:** Los barcos se previsualizan y se colocan de forma más intuitiva, anclándose desde su centro.
* **Olas Animadas:** Fondo dinámico con olas que los barcos parecen "cabalgar".
* **Gestión de Verbos Personalizada:**
    * Selecciona verbos y tiempos verbales específicos (presente, pretérito, futuro, condicional, etc.).
    * Filtra verbos por tipo de irregularidad (cambio de raíz, primera persona irregular, etc.) y reflexividad.
    * Opción de "Copiar lista" para compartir configuraciones de verbos con otros jugadores.
    * "New Custom Game" para iniciar partidas con listas de verbos pegadas, asegurando el mismo orden para todos.
* **Experiencia de Juego Clara:** Fases de juego bien definidas y retroalimentación visual.
* **Diseño Moderno:** Interfaz de usuario inspirada en un tema naval, con elementos interactivos y animaciones sutiles.

## Cómo Jugar

### Fase de Colocación de Barcos
1.  Deberás colocar 5 barcos (Portaaviones: 5 celdas, Acorazado: 4 celdas, Crucero: 3 celdas, Submarino: 3 celdas, Destructor: 2 celdas) en tu tablero.
2.  Selecciona un barco del panel "Ships to Place".
3.  Haz clic en una celda de tu tablero "My Fleet". El barco seleccionado se previsualizará y se anclará intuitivamente al centro de tu puntero.
4.  Puedes rotar el barco entre orientación horizontal y vertical usando el botón azul de rotación (`↻`).
5.  Los barcos no pueden tocarse entre sí, ni siquiera diagonalmente.
6.  Una vez que los 5 barcos estén colocados, el botón "Fix Ships" se activará. Haz clic en él para bloquear las posiciones de tus barcos y pasar a la Fase de Batalla.

### Fase de Batalla
1.  En esta fase, atacarás el tablero "Enemy Fleet".
2.  Haz clic en cualquier celda del tablero "Enemy Fleet" para seleccionarla como objetivo.
3.  Aparecerá un modal "Attack Position" que muestra el verbo y el pronombre asociados a esa celda.
4.  Para realizar tu ataque, debes conjugar correctamente el verbo mostrado para el pronombre dado en el tiempo verbal seleccionado.
5.  Si tu conjugación es correcta, la celda se "desbloqueará" y podrás marcar su estado.
6.  Una vez desbloqueada una celda, haz clic repetidamente en ella para alternar entre los estados de ataque: 💧 (Agua/Fallo), 💥 (Impacto), 💀 (Hundido).
7.  Tu objetivo es marcar todas las posiciones de los barcos enemigos como "Impacto" o "Hundido".
8.  Si todas las partes de un barco enemigo están marcadas como "Impacto", ese barco se considera "Hundido".
9.  El juego termina cuando todos tus barcos son "Hundidos" o todos los barcos enemigos son "Hundidos".

## Tecnologías Usadas
* **HTML5**: Estructura del juego.
* **CSS3**: Estilizado y animaciones, incluyendo olas dinámicas y movimientos de barcos.
* **JavaScript (ES6+)**: Lógica del juego, manejo del estado, manipulación del DOM, y gestión de datos de verbos.
* **JSON**: Almacenamiento de datos de conjugación de verbos.


## Créditos
Desarrollado por Pablo Torrado como proyecto de aprendizaje.
Basado en datos de conjugación adaptados de recursos de aprendizaje de español.


