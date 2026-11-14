
Reglas operativas adicionales para agentes (IA o desarrolladores).

---

## 1. Cuándo detenerse

Si una tarea te está llevando demasiado tiempo y estás dando vueltas sin una
solución directa:

1. **Detente.** No sigas iterando sobre el mismo razonamiento.
2. **Explica el bloqueo.** Di en qué punto estás atascado, qué has intentado y
   por qué no avanza.
3. **Espera instrucciones.** No inventes una solución forzada ni cambies de
   enfoque sin que el usuario lo indique.

El criterio de "demasiado tiempo" lo determina el propio agente: si detectas
que estás repitiendo el mismo análisis o releyendo los mismos archivos sin
producir un cambio concreto, es señal de que debes parar y reportar.

> Ejemplo: si al corregir un bug no puedes decidir en qué módulo vive la causa
> y llevas varias vueltas releyendo los mismos archivos, detente y di
> "estoy atascado en X, necesito Y para continuar".
# CODIGO
1. **Verificación de existencia de archivos:** Nunca asumas que un archivo (especialmente de tests) existe solo porque se mencionó en el pasado. Si el archivo no está en el chat o en el Repo Map, asume que no existe. Si necesitas leerlo, pídemelo. Si necesitas crearlo, créalo.
2. **Prohibido el bucle de razonamiento infinito:** Si te encuentras atrapado en un dilema (por ejemplo, una regla te prohíbe tocar algo, pero el arreglo lo requiere), NO te quedes pensando en voz alta repitiendo el problema. Detente inmediatamente y hazme una pregunta directa y concisa para desbloquearte.
3. **Manejo de tests faltantes:** Si para arreglar un bug en `src/` es necesario crear un archivo de test que no existe, créalo automáticamente. No te bloquees esperando a que el test exista previamente.
4. **Código roto = tests rotos:** Si modificas una función y rompes un test existente, tienes permiso para actualizar el test SI Y SOLO SI la lógica nueva es matemáticamente/lingüísticamente correcta. En caso de duda, pregúntame primero.

## Regla de Libertad de Edición (Código y Tests)

- **Libertad total:** Tienes permiso absoluto para modificar tanto el código fuente (`src/`) como los archivos de test (`tests/`). No necesitas pedir permiso para cambiar un test si detectas que está mal planteado.
- **Prioridad de la lógica:** Si un test falla porque el código está mal, corrige el código. Si un test falla porque sus expectativas son lógicamente incorrectas (por ejemplo, un error matemático o una regla lingüística mal aplicada), corrige el test.
- **Responsabilidad:** Cada vez que modifiques un test para corregir un error de planteamiento, DEBES añadir un comentario en el código justo encima de la línea modificada explicando brevemente por qué se cambió (ej: `// Corregido: 'corazón' tiene 3 sílabas + 1 por aguda = 4`).
- **No elimines tests:** No borres tests que fallan solo para que la suite pase en verde. Si un test es irrelevante, coméntalo y explica por qué antes de borrarlo.

## Regla de Gestión de Contexto (Tokens)
- **Recordatorio al usuario:** Cuando termines de implementar una funcionalidad completa y todos los tests pasen en verde, DEBES recordarme que use el comando `/reset` o `/drop` para limpiar el contexto y ahorrar tokens, antes de empezar con la siguiente tarea.
- **No lo hagas tú:** No intentes borrar archivos del contexto por tu cuenta, solo dame la instrucción al usuario.