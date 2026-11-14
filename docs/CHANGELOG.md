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

- `ritmo.ts` y `rima.ts` (fase 6 del `ARCHITECTURE.md`).
- Anclaje robusto de elecciones por offset+contexto (fase 4).
- UI, Web Worker, IndexedDB, Capacitor (fases 3–5).
## [Unreleased]

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
