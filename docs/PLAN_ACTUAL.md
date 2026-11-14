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
| `ritmo.ts` | ✅ Implementado (experimental) | 13 |
| `rima.ts` | ❌ Fuera de alcance (fase 6) | — |

Total: **137 tests en verde** (9 archivos), incluido el corpus de oro
(`tests/corpus.test.ts`, 21 versos).

## Fase 2 del motor: ✅ COMPLETADA

Con `computo.ts` en verde se cierra la fase 2 del `ARCHITECTURE.md` §13
(motor sin interfaz). El pipeline completo funciona:

```
normalizar → silabeo → acento → licencias → escansion → computo
```

Estado: **137 tests en verde** (9 archivos). Fase 2 cerrada oficialmente.

### Corpus de oro: inicial en verde, ampliación pendiente

`tests/corpus/versos.json` arranca con **21 versos** verificados a mano
(Martí, *Versos sencillos* I y III; Machado, *Proverbios y cantares* XXIX;
un caso de Domínguez Caparrós con sinéresis). Todos pasan.

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

## Siguiente sesión: ampliar corpus y Fase 3 (Editor Web)

Antes de la Fase 3, ampliar el corpus de oro con los casos del `SPEC.md` §11
que faltan (ver arriba). Después, la Fase 3:

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
