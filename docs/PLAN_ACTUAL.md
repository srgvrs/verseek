# PLAN ACTUAL — Motor (spike)

## Estado

| Módulo | Estado | Tests |
| --- | --- | --- |
| `normalizar.ts` | ✅ Implementado (§2, S-01…S-21) | 27 |
| `silabeo.ts` | ✅ Implementado (§3, S-22…S-36) | 25 |
| `acento.ts` | ✅ Implementado (§4, S-37…S-43) | 16 |
| `licencias.ts` | ✅ Implementado (§5, S-44…S-53) | 15 |
| `escansion.ts` | ✅ Implementado (§6, S-54…S-60) | 10 |
| `computo.ts` | ✅ Implementado (§7, S-61…S-67) | 8 |
| `ritmo.ts` | ✅ Implementado (experimental) | — |
| `rima.ts` | ❌ Fuera de alcance (fase 6) | — |

Total: **86+ tests en verde** (7 archivos).

## Fase 2 del motor: cerrada

Con `computo.ts` en verde se cierra la fase 2 del `ARCHITECTURE.md` §13
(motor sin interfaz). El pipeline completo funciona:

```
normalizar → silabeo → acento → licencias → escansion → computo
```

## Siguiente paso: fase 3 — editor web con análisis en vivo

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
