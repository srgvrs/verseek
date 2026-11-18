# CHANGELOG

## [Unreleased] — 2026-11-17

### Fixed (ritmo)
- **RIT-10**: en la rama `n === 11` de `etiquetarPatron`, si la proporción del
  patrón decidido por RIT-06 es inferior al 40 % (`UMBRAL_MINIMO`), se devuelve
  `sin-patron` con nivel `sin-patron` y confianza 0. Antes devolvía la etiqueta
  de RIT-06 con confianza baja.
- **RIT-07**: cuando ningún patrón elegible alcanza el 40 % (con 2 o más
  tónicas libres), el nivel es `sin-patron` (antes `baja`). El caso de menos
  de 2 libres sigue devolviendo nivel `baja` y confianza 0.
- Cabecera de `ritmo.ts` reescrita: cita `SPEC.md` §7 (RIT-01…RIT-11) y D10;
  se elimina la referencia a `SPEC.propuesta.md` §8 y la afirmación
  "par → trocaico".
- Comentario del caso 4/6/7/10 corregido: la regla de la 6.ª se evalúa primero
  y devuelve yámbico; es resultado provisional (SPEC: pendiente a propósito).
  Sin cambio de comportamiento.

### Fixed (tests)
- `ritmo.test.ts`: los casos `dime lo que` y `que dime lo` esperan `trocaico`
  (n=4, penúltima = 3). Se eliminan los `console.log` y se corrigen los
  comentarios de tónicas libres.

### Changed (UI)
- `apps/web/src/panel.ts`: muestra `nivel` del ritmo, marca la etiqueta como
  `(experimental)` y presenta `sin-patron` como "ritmo libre" (RIT-10; solo
  texto de presentación, el identificador no cambia).

### Known limitation
- El monosílabo final del verso no suma +1 como aguda en el cómputo métrico.
  Cambiarlo afectaría al corpus; queda documentado como limitación conocida.

## [Spike] Estado actual del motor

### Implementado y en verde (68 tests)

- **`normalizar.ts`** (§2, S-01…S-21): NFC, unificación de espacios y apóstrofos,
  `\r\n` → `\n`, colapso de espacios, mapa de offsets. Conserva mayúsculas,
  tildes, `ü` y puntuación.
- **`silabeo.ts`** (§3, S-22…S-36): diptongos, triptongos, hiatos, dígrafos
  `ch/ll/rr`, `gu/qu`, grupos inseparables, `tl`/`gn` separables, *h* muda
  intercalada, `y` final como cerrada, `güe/güi`.
- **`acento.ts`** (§4, S-37…S-43): aguda/llana/esdrújula/sobresdrújula,
  monosílabos, adverbios en `-mente`, tilde explícita como override.
- **`licencias.ts`** (§5, S-44…S-53): detección de candidatos de sinalefa,
  hiato, sinéresis y diéresis. El motor NO elige; devuelve opciones.
  Puntuación bloquea sinalefa; *h* muda inicial no la bloquea; cerrada tónica
  bloquea la fusión.

### Pendiente (siguiente etapa)

- **`escansion.ts`**: resolver candidatos + `Eleccion[]` del usuario en una
  escansión concreta. Función pura e idempotente. Manejo de elecciones
  huérfanas (anclaje por `palabraA`/`palabraB` + `tipo` en este spike; anclaje
  robusto por offset+contexto queda para fase 4).
- **`computo.ts`**: conteo silábico sobre escansión resuelta, con ley de acento
  final (aguda +1, esdrújula −1).

### Fuera de alcance de esta fase

- `rima.ts` (fase 6 del `ARCHITECTURE.md`).
- Anclaje robusto de elecciones por offset+contexto (fase 4).
- UI, Web Worker, IndexedDB, Capacitor (fases 3–5).
## [Unreleased]

### Estado al 2026-11-15

**Fase 2 en curso** (no completada). Suite completa en verde: **262 tests
(10 archivos), 0 fallos**. `corpus-ritmo.test.ts` pasa completo (54/54);
`ritmo.test.ts` tiene 58 tests y `acento.test.ts` 30.

#### Hecho desde el 2026-11-14
- **ACE-06**: adverbios en `-mente` con dos tónicas (base + `men`). Lista
  manual `NO_ADVERBIOS_MENTE` para `demente`, `clemente`, `inclemente`,
  `vehemente`, `mente`, que se analizan como palabras normales.
- **OVR-06**: override de acento (`tipo: "acento"` con campo `silaba`).
  Solo afecta a `patron` y `posicionesTonicas`; no altera el cómputo.
- **Corpus de ritmo corregido** contra escansión manual (tónicas léxicas con
  ACE-05). Los versos corregidos siguen con `"verificado": "pendiente"` en
  el JSON.

#### Limitación conocida
- Formas verbales terminadas en `-mente` (`lamente`, `comente`, `aumente`)
  se tratarían como adverbios.

#### Pendiente
- D11 (`ü` automática).
- Anclaje de elecciones intra-palabra.
- Contrato motor–Worker para la UI y offsets de candidatos de licencia.
- Script de revisión de tónicas (se propone `tsx`).
- Limpieza de notas "BUG MOTOR" y fonéticas incoherentes en el JSON.
- Verificar contra fuente los versos corregidos.
- Orden de docs en git y unificar los dos SPEC — **por confirmar**.

### Estado al 2026-11-14

**Fase 2 en curso** (no completada). Corrección respecto a la entrada previa
que la daba por cerrada.

#### Hecho
- **Cómputo silábico validado**: `tests/corpus.test.ts` pasa completo con
  **27 versos** en el corpus de oro.
- `Escansion` expone `fronterasSinalefa`.
- `ritmo.ts` calcula unidades métricas con sinalefas encadenadas; `patron` y
  `posicionesTonicas` se derivan de las mismas unidades.
- `esAtono` en `acento.ts` (ACE-05, lista propuesta) con la excepción del
  monosílabo final (ACE-05b).
- Pruebas ACE-05b del monosílabo final de verso.
- Sinéresis/diéresis respetadas al calcular unidades métricas (OVR-05,
  propuesta).

#### Pendiente
- `tests/corpus-ritmo.test.ts`: **17 fallos**. Hipótesis por verificar: la
  mayoría serían oráculos `tonicas` del JSON sin contrastar con la fuente; no
  confirmado. Falta definir en el SPEC qué significa `tonicas` (propuesta:
  tónicas léxicas con ACE-05, sin acento rítmico).
- D6 (adverbios en `-mente`).
- D11 (`ü` automática).
- Anclaje de elecciones intra-palabra.
- Script de revisión de tónicas: necesita runner; se propone `tsx`.
- Limpieza de notas "BUG MOTOR" obsoletas en el JSON del corpus.
- Orden de docs en git (ruta de archivos movidos) — **por confirmar**.
- Unificar los dos SPEC (`SPEC.md` y `SPEC.propuesta.md`) — **por confirmar**
  cuál es la fuente canónica.

### Added
- `packages/motor/src/escansion.ts`: `resolverEscansion(verso, elecciones)`
  resuelve candidatos de `licencias.ts` contra las `Eleccion[]` del usuario
  y produce una `Escansion` con `silabasMetricas`, `eleccionesAplicadas` y
  `eleccionesHuerfanas`. Sin elección → baseline (silabeo plano). Sinalefa e
  hiato son excluyentes por frontera. Sinéresis/diéresis se suman a las
  elecciones entre palabras.
- `packages/motor/tests/escansion.test.ts`: 10 tests (baseline, sinalefa
  aplicada/no aplicada, huérfana, exclusión sinalefa/hiato, sinéresis,
  diéresis, idempotencia).
- `SPEC.propuesta.md` §6 (S-54…S-60) y contratos públicos actualizados.
- `index.ts` reexporta `resolverEscansion`, `Eleccion` y `Escansion`.

### Added (computo)
- `packages/motor/src/computo.ts`: `computar(escansion, verso)` aplica la ley
  de acento final sobre `escansion.silabasMetricas`. Aguda +1, esdrújula y
  sobresdrújula −1, llana 0. Monosílabo final sin ajuste. Verso vacío → 0.
- `packages/motor/tests/computo.test.ts`: 8 tests (vacío, llana, aguda,
  esdrújula, monosílabo, sinalefa + llana, sinalefa + aguda, puntuación final).
- `SPEC.propuesta.md` §7 (S-61…S-67) y contratos públicos actualizados.
- `index.ts` reexporta `computar` y `Computo`.

### Added (UI Fase 3, 2026-11-15)

Verificado a mano en el navegador; sin tests automáticos en `apps/web`.

- **Resaltado de la sílaba tónica** de cada palabra (`setTonicas`, `StateField`
  propio en `apps/web/src/editor.ts`), a partir de
  `analisis.silabas[].tonica`. Verificado: monosílabos átonos sin resaltar,
  monosílabo final tónico, dos tónicas en adverbios en `-mente`.
- **Panel de candidatos de licencia** del verso donde está el cursor
  (`apps/web/src/panel.ts`): tipo, palabras implicadas, sílabas y estado
  activo/inactivo.
- **Candidatos clicables** con estado de elecciones en memoria
  (`apps/web/src/estado.ts`, `Map<versoId, Eleccion[]>`). Sinalefa y hiato
  alternan por frontera; sinéresis y diéresis alternan aplicar/no-aplicar.
- Verificado a mano: *Faetón* con sinéresis 12 → 11; *suave brilla el ruido*
  con hiato 6 → 7, con diéresis añadida 8, y al volver a la sinalefa 6.

### Added (ritmo)
- `packages/motor/src/ritmo.ts`: `analizarRitmo(escansion, verso)` construye el
  patrón de acentos (`"T"` / `"a"`) por sílaba métrica, expone las posiciones
  tónicas (1-based) y devuelve una etiqueta experimental de ritmo
  (`yambico`, `trocaico`, `dactilico`, `anapestico`, `mixto`) con su nivel de
  confianza en `[0, 1]`. Aplica el ajuste de acento final (aguda +1,
  esdrújula/sobresdrújula −1) para alinear el patrón con las sílabas métricas.
- `packages/motor/tests/ritmo.test.ts`: tests del patrón, posiciones tónicas,
  etiquetas y confianza.
- `index.ts` reexporta `analizarRitmo`, `Ritmo` y `EtiquetaRitmo`.
