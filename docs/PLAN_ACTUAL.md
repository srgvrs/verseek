# PLAN ACTUAL — Motor (spike)

## Estado

| Módulo | Estado | Tests |
| --- | --- | --- |
| `normalizar.ts` | ✅ Implementado (§2, S-01…S-21) | 27 |
| `silabeo.ts` | ✅ Implementado (§3, S-22…S-36) | 25 |
| `acento.ts` | ✅ Implementado (§4, S-37…S-43) | 16 |
| `licencias.ts` | ✅ Implementado (§5, S-44…S-53) | 15 |
| `escansion.ts` | ✅ Implementado (§6, S-54…S-60) | 10 |
| `computo.ts` | ✅ Implementado (§7, S-61…S-67, COM-02b) | 10 |
| `ritmo.ts` | 🟡 Implementado (experimental, en revisión) | 58 |
| `rima.ts` | ❌ Fuera de alcance (fase 6) | — |

Total: **262 tests en verde, 0 fallos (10 archivos)**, incluido el corpus de
oro (`tests/corpus.test.ts`, 27 versos) y `corpus-ritmo.test.ts` (54/54).
`acento.test.ts` tiene 30 tests.

## Fase 2 del motor: 🟡 EN CURSO

> **Corrección (2026-11-14):** la fase 2 **no** está completada. La entrada
> anterior la daba por cerrada; se corrige aquí. El pipeline funciona, pero
> quedan decisiones abiertas y fallos de oráculo en el corpus de ritmo.

El pipeline completo funciona:

```
normalizar → silabeo → acento → licencias → escansion → computo
```

Estado: **262 tests en verde, 0 fallos (10 archivos)**. Fase 2 **en curso**.

### Hecho (2026-11-15)

- **Cómputo silábico validado**: `tests/corpus.test.ts` pasa completo con
  **27 versos**.
- `Escansion` expone `fronterasSinalefa`.
- `ritmo.ts` calcula unidades métricas con sinalefas encadenadas; `patron` y
  `posicionesTonicas` se derivan de las mismas unidades.
- `esAtono` en `acento.ts` (ACE-05, lista propuesta) con la excepción del
  monosílabo final (ACE-05b).
- Pruebas ACE-05b del monosílabo final de verso.
- Sinéresis/diéresis respetadas al calcular unidades métricas (OVR-05,
  propuesta).
- **ACE-06**: adverbios en `-mente` con dos tónicas (base + `men`). Lista
  manual `NO_ADVERBIOS_MENTE` para `demente`, `clemente`, `inclemente`,
  `vehemente`, `mente`.
- **OVR-06**: override de acento (`tipo: "acento"` con campo `silaba`).
  Solo afecta a `patron` y `posicionesTonicas`; no altera el cómputo.
- **Corpus de ritmo corregido** contra escansión manual (tónicas léxicas con
  ACE-05). `corpus-ritmo.test.ts` pasa completo (54/54). Los versos
  corregidos siguen con `"verificado": "pendiente"` en el JSON.

### Limitación conocida (2026-11-15)

- Formas verbales terminadas en `-mente` (`lamente`, `comente`, `aumente`)
  se tratarían como adverbios.

### Pendiente (2026-11-15)

- **D11**: `ü` automática.
- **Anclaje de elecciones intra-palabra**.
- **Contrato motor–Worker** para la UI y offsets de candidatos de licencia.
- **Script de revisión de tónicas**: necesita runner; se propone `tsx`.
- **Limpieza de notas "BUG MOTOR"** y fonéticas incoherentes en el JSON del
  corpus.
- **Verificar contra fuente** los versos corregidos.
- **Orden de docs en git** (ruta de archivos movidos) — *por confirmar*.
- **Unificar los dos SPEC** (`SPEC.md` y `SPEC.propuesta.md`) — *por
  confirmar* cuál es la fuente canónica.

### Corpus de oro: inicial en verde, ampliación pendiente

`tests/corpus/versos.json` arranca con **21 versos** verificados a mano
(Martí, *Versos sencillos* I y III; Machado, *Proverbios y cantares* XXIX;
un caso de Domínguez Caparrós con sinéresis). Todos pasan. Ampliado a
27 versos; todos pasan.

Pendiente para cerrar el corpus:

- Ampliar con los casos de prueba del `SPEC.md` §11 que aún no están
  (sinalefa triple, hiato con override, *süave* / *rüido* / *cruel*,
  *Urna votiva*, acentos forzados de Unamuno, versificación de cláusulas,
  tmesis, polivalencia *ui/iu*).
- Añadir casos de rima cuando `rima.ts` entre en alcance (fase 6).
- Revisar la categoría de cada verso y documentar la fuente de cada
  escansión.

Nota: las `elecciones` del corpus son solo objetos `Eleccion`; la
información de ajustes automáticos (aguda +1, monosílabo) vive en
`categoria`, no en `elecciones`.

## Fase 3 (Editor Web): infraestructura base ✅ COMPLETADA

Primer paso de la Fase 3 cerrado. Ya está en pie el andamiaje del editor:

- **Dependencias**: `codemirror`, `@codemirror/view`, `@codemirror/state` y
  `@codemirror/language` instaladas en `apps/web`.
- **Web Worker esqueleto** (`apps/web/src/worker/analisis.worker.ts`):
  escucha mensajes `{ tipo: "analizar", versos }` y responde con un mock
  `{ tipo: "resultado", versos: [] }`. Todavía no importa `@verseek/motor`.
- **Editor básico** (`apps/web/src/editor.ts`): `EditorView` de CodeMirror 6
  a pantalla completa, con `basicSetup` y `lineWrapping`. Sin decoraciones.
- **Montaje** (`apps/web/src/main.ts` + `apps/web/index.html`): el editor se
  monta en `<div id="app">` y se ve funcionando en el navegador.

Pendiente para cerrar la Fase 3: conectar el Worker con `@verseek/motor`,
añadir debounce, decoraciones por verso/sílaba y el `Map` de elecciones en
`estado.ts`.

## Siguiente sesión: cerrar Fase 2 y luego Fase 3 (Editor Web)

Antes de la Fase 3, cerrar los pendientes de la Fase 2 listados arriba
(D11, anclaje intra-palabra, contrato motor–Worker y offsets de candidatos,
script de revisión, limpieza del JSON, verificación contra fuente,
unificación de SPEC). Después, la Fase 3:

## Fase 3 (Editor Web) — pipeline real

Hito: editor CodeMirror 6 + Web Worker que muestre, mientras se escribe:

- sílabas separadas por verso;
- número de sílabas métricas al final de cada verso;
- tónica resaltada;
- candidatos de licencia clicables (sinalefa / hiato / sinéresis / diéresis);
- elecciones del usuario persistidas en memoria (IndexedDB en fase 4).

### Alcance propuesto

1. **Worker** (`apps/web/src/worker/analisis.worker.ts`):
   - recibe `{ verso: string, elecciones: Eleccion[] }`;
   - devuelve `{ escansion: Escansion, computo: Computo }`;
   - usa `@verseek/motor` (import desde el paquete).

2. **Editor** (`apps/web/src/editor.ts`):
   - CodeMirror 6 con `EditorView`;
   - debounce de ~300 ms;
   - decoraciones por verso (número de sílabas al final);
   - decoraciones por sílaba (tónica resaltada).

3. **Estado** (`apps/web/src/estado.ts`):
   - `Map<versoId, Eleccion[]>` en memoria;
   - recálculo solo del verso modificado.

### Después de la fase 3

Fase 4: elecciones del usuario con anclaje robusto (offset+contexto) y
persistencia en IndexedDB. Fase 5: empaquetado con Capacitor. Fase 6: rima y
ritmo.

## Fuera de alcance de esta fase

- `rima.ts` (fase 6 del `ARCHITECTURE.md`).
- Anclaje robusto de elecciones por offset+contexto (fase 4).
- UI, Web Worker, IndexedDB, Capacitor (fases 3–5).

## Notas "por confirmar"

- **Orden de docs en git**: hay archivos movidos cuya ruta final no está
  clara. Confirmar antes de reorganizar.
- **Unificación de SPEC**: existen `SPEC.md` y `SPEC.propuesta.md`. Confirmar
  cuál es la fuente canónica y cómo se fusionan.
- **Runner del script de revisión de tónicas**: se propone `tsx`; confirmar
  si se añade como dependencia de desarrollo.
