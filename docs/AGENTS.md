# AGENTS.md

Instrucciones operativas para agentes (IA o desarrolladores) que trabajen en este repositorio.

---

## 🚨 MODO SPIKE / PROTOTIPO: LIBERTAD TOTAL 🚨

**ATENCIÓN AGENTE:** El usuario ha activado el MODO SPIKE. Estamos en fase de pruebas y desarrollo rápido. El objetivo actual NO es la perfección arquitectónica, sino tener **algo funcional que se pueda ejecutar y probar lo antes posible**.

Mientras este bloque esté presente, **IGNORÁ** todas las reglas restrictivas de este documento que te impidan avanzar. Específicamente, tenés **AUTORIZACIÓN EXPLÍCITA** para:

1. **Escribir y modificar tests (`*.test.ts`)**: Podés crear los tests que necesites e iterar sobre ellos.
2. **Inventar reglas faltantes en el SPEC**: Si el `SPEC.md` no define algo, tomá una decisión lógica, implementala y anotá la decisión (ej. con un `// TODO: Decidir con el usuario`). No te detengas a preguntar.
3. **Generar datos de prueba**: Podés crear arrays de prueba en los tests (NO toques el `versos.json` real todavía, usá datos mock en el código).
4. **Saltar fases**: Si para probar `normalizar` necesitás un stub rápido de `silabeo`, hacelo.
5. **Ignorar la "Regla de Oro"**: No esperes a que el usuario actualice el SPEC para escribir código.

**Criterio de parada del Modo Spike:** El usuario te pedirá explícitamente "Desactivar Modo Spike" o quitará este bloque del archivo. Hasta entonces, tu lema es: *"Hacer que funcione, luego hacerlo bien"*.

---

*(El resto del documento queda como referencia para cuando se desactive el Modo Spike)*

## 1. Qué es este proyecto

**poetica** es un editor de métrica poética en tiempo real para español. Funciona sin internet (*local-first*) y guarda los poemas en el dispositivo del usuario.

Se divide en dos capas estrictas:

- **`packages/motor`**: librería pura de análisis métrico, sin interfaz gráfica ni efectos secundarios.
- **`apps/web`**: interfaz de usuario, editor (CodeMirror 6), Web Worker y empaquetado móvil (Capacitor).

## 2. Lectura obligatoria antes de cualquier cambio

Antes de realizar cualquier modificación, lee los documentos en este estricto orden:

1. `ARCHITECTURE.md` — decisiones de diseño, flujo de datos, modelos y alcance.
2. `packages/motor/SPEC.md` — contrato lingüístico del motor (reglas cerradas y convenciones).
3. `ETAPA-1.md` (o el archivo de fase en curso, si existe) — tarea concreta actual.

> **Regla de oro:** Si algo que necesitas implementar no está definido en `SPEC.md`, no lo inventes ni lo asumas. Detente, pregunta al usuario y espera a que la regla quede escrita en la especificación. El `SPEC.md` es la fuente de verdad; el código solo la implementa.

## 3. Reglas de trabajo (no negociables)

1. **Prohibido modificar pruebas o el corpus:**
   - `packages/motor/tests/**`
   - `packages/motor/tests/corpus/**`
   - Cualquier archivo `*.test.ts` o `*.spec.ts`
   - *Nota:* Estas pruebas las escribe y verifica el usuario. Si una prueba falla, el código de implementación está mal, no la prueba. Si sospechas que hay un error en una prueba, repórtalo en el chat; nunca la edites.

2. **Prohibido generar el corpus esperado:** El archivo `versos.json` contiene versos escandidos a mano con fuente verificada. Si la IA genera casos esperados, se validaría a sí misma y contaminaría el oráculo.

3. **Una función/módulo a la vez:** No implementes dos módulos en el mismo cambio. Termina `normalizar.ts` con sus pruebas en verde antes de empezar `silabeo.ts`, y así sucesivamente según el orden del pipeline.

4. **No tocar módulos fuera de alcance:** Si la tarea actual es `silabeo.ts`, no "aproveches" para refactorizar o adelantar lógica en `acento.ts` o `licencias.ts`.

5. **No añadir dependencias sin autorización:** El paquete `@verseek/motor` debe mantenerse libre de dependencias externas en tiempo de ejecución (*zero-runtime dependencies*).

6. **No adelantar fases:** Los módulos `ritmo.ts` y `rima.ts` no se implementan hasta que `normalizar`, `silabeo`, `acento`, `licencias`, `escansion` y `computo` estén completamente en verde frente al corpus verificado.

## 4. Filosofía del motor: candidatos, no verdades

El diseño del código debe respetar la separación entre detección y resolución:

- **`licencias.ts`**: detecta dónde puede existir sinalefa, hiato, sinéresis o diéresis. Devuelve una lista de `Candidato` con sus lecturas posibles (`opciones`). No toma decisiones.
- **`escansion.ts`**: resuelve los candidatos cruzándolos con las elecciones del usuario (`Eleccion[]`) para producir una escansión concreta. Debe ser pura e idempotente.
- **`computo.ts`**: realiza el conteo silábico (aplicando leyes de acento final: aguda $+1$, esdrújula $-1$) exclusivamente sobre una escansión ya resuelta.

Nunca fuerces al motor a "elegir por el usuario" si el `SPEC.md` no lo establece explícitamente. Que un verso devuelva múltiples lecturas válidas es el comportamiento esperado.

## 5. Convenciones de código y arquitectura

- **TypeScript estricto:** `strict: true` y `noUncheckedIndexedAccess: true`. Prohibido el uso de `any` implícito o explícito; usa `unknown` con validación de tipos si es necesario.
- **Pureza en el motor:** Cero efectos secundarios en `packages/motor`. Prohibido usar `Date.now()`, `Math.random()`, `window`, `document`, `localStorage`, `IndexedDB` o llamadas de red.
- **Inmutabilidad:** Las funciones del motor no deben mutar los objetos o arreglos que reciben como parámetros.
- **Nomenclatura en español:** Los archivos, tipos e identificadores del dominio poético deben escribirse en español (`normalizar`, `silabeo`, `acento`, `licencias`, `escansion`, `computo`, `Candidato`, `Eleccion`).
- **Contratos explícitos:** Cada módulo exporta sus tipos de entrada y salida de forma clara. Nada de `Record<string, any>` como interfaz pública.
- **Comentarios con propósito:** Comenta únicamente para referenciar o aclarar una regla compleja del `SPEC.md` (ej. `// Regla SPEC 3.2: hiato acentual`). No escribas comentarios obvios.
- **Conciencia de hilos (UI/Worker):** En `apps/web`, todo el análisis del motor debe ejecutarse dentro del Web Worker para garantizar que la escritura en CodeMirror 6 nunca se bloquee.

## 6. Comandos del repositorio

```bash
pnpm install                            # Instalar dependencias del workspace
pnpm --filter @verseek/motor test       # Ejecutar pruebas del motor (Vitest)
pnpm --filter @verseek/motor test:watch # Modo vigilancia
pnpm --filter web dev                   # Levantar servidor de desarrollo web
pnpm --filter web dev --host            # Accesible desde móvil en red local
pnpm -r test                            # Ejecutar toda la suite del monorepo
```

## Reglas de trabajo
- Después de implementar una nueva funcionalidad o corregir un bug, actualiza siempre `docs/CHANGELOG.md` con una breve descripción del cambio antes de dar la tarea por finalizada.
- Cada vez que implementes un módulo nuevo o corrijas un bug, actualiza SIEMPRE el archivo `docs/PLAN_ACTUAL.md` y `docs/CHANGELOG.md` antes de dar la tarea por finalizada.
## Reglas de código
- Siempre que crees un nuevo archivo de test (ej: `*.test.ts`), DEBES crear inmediatamente el archivo fuente correspondiente en `src/` con la implementación mínima para que pase.
- Nunca dejes un test importando un archivo que no existe.