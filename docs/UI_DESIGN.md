# Especificación de Diseño UI/UX: El Editor Visual (Fase 3)

## 1. Filosofía de la Interfaz
La aplicación debe ser **divertida, táctil y visualmente estimulante**. El objetivo no es solo escribir poesía, sino *jugar* con la métrica. La interfaz debe transformar la lógica abstracta del motor (`@verseek/motor`) en bloques visuales que el usuario pueda ver y manipular.

## 2. Modos de Interacción
La app tendrá dos modos claramente diferenciados para el usuario:
*   **Modo Creación:** El usuario escribe texto libremente. El sistema va analizando en tiempo real, mostrando colores y bloques a medida que se escribe.
*   **Modo Visualización:** El texto está bloqueado (solo lectura). El usuario puede hacer clic en las palabras, sílabas o rimas para ver información detallada (tooltips) sobre por qué se han agrupado de esa forma.

## 3. Representación Visual de las Sílabas (Los "Bloques")
En lugar de mostrar texto plano, cada palabra se dividirá en "cajas" o rectángulos según su separación silábica.
*   **Ejemplo:** Si el usuario escribe "agua", se renderizará visualmente como: `[a] [gua]`.
*   **Estado:** Estas cajas deben tener un diseño de "borde redondeado" (border-radius) para que parezcan piezas de un rompecabezas (puzzles).
*   **Interacción:** Al pasar el ratón por encima de una caja, debe resaltarse sutilmente (hover effect).

## 4. Paleta de Colores por Acento y Clasificación
El color de fondo o del borde de cada caja de sílaba dependerá de la clasificación de la palabra (basado en la salida de `acento.ts`):
*   **Sílaba Tónica:** Debe tener un color más fuerte, saturado o un borde más grueso. Es el "corazón" de la sílaba.
*   **Paletas por tipo de palabra:**
    *   *Agudas:* Tono cálido (ej. naranja/rojo suave).
    *   *Llanas:* Tono frío (ej. azul/verde suave).
    *   *Esdrújulas:* Tono morado/púrpura.
    *   *Sobresdrújulas:* Tono amarillo/dorado.
*   **Regla:** La sílaba tónica dentro de la caja siempre debe tener un contraste alto (texto blanco sobre fondo oscuro, o viceversa) para que el ojo lo detecte al instante.

## 5. Visualización de Rimas (El "Código de Colores")
Cuando dos o más palabras rimen al final de un verso, deben compartir un color de fondo o un indicador visual (ej. una línea inferior del mismo color).
*   **Rima Perfecta:** Mismo color sólido (ej. rosa fuerte). (Ej: "perdido" y "amigo").
*   **Rima Imperfecta (asonante):** Mismo color, pero con un patrón (ej. rayas diagonales o un color más translúcido).
*   **Feedback visual:** El usuario debería poder ver de un vistazo qué versos están rimando entre sí porque compartirán la misma "familia de color".

## 6. Visualización de la Métrica y el Ritmo
*   **Al final de cada verso:** Se mostrará un contador flotante con el número de sílabas métricas totales (basado en `computo.ts`).
*   **Ritmo:** Las sílabas tónicas de todo el verso (según `ritmo.ts`) deben tener un pequeño indicador visual (ej. un punto o un icono de nota musical) en la parte superior de la caja. Esto permitirá al usuario "ver" el patrón rítmico (yámbico, trocaico) como si fuera una partitura.

## 7. Notas Técnicas para la Implementación (CodeMirror 6)
*   Usar **Decoraciones de Editor** de CodeMirror para insertar las cajas (widgets) sin romper el texto subyacente.
*   El estado de los colores debe ser dinámico y recalcularse en el Web Worker cada vez que el usuario deja de escribir (debounce de 300ms).