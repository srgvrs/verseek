# CHANGELOG

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
