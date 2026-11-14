# PLAN ACTUAL — Motor (spike)

## Estado

| Módulo | Estado | Tests |
| --- | --- | --- |
| `normalizar.ts` | ✅ Implementado (§2, S-01…S-21) | 27 |
| `silabeo.ts` | ✅ Implementado (§3, S-22…S-36) | 25 |
| `acento.ts` | ✅ Implementado (§4, S-37…S-43) | 16 |
| `licencias.ts` | ✅ Implementado (§5, S-44…S-53) | 15 |
| `escansion.ts` | ✅ Implementado (§6, S-54…S-60) | 10 |
| `computo.ts` | ❌ Pendiente | — |
| `ritmo.ts` | ❌ Fuera de alcance (fase 6) | — |
| `rima.ts` | ❌ Fuera de alcance (fase 6) | — |

Total: **78 tests en verde** (5 archivos).

## Siguiente paso: `computo.ts`

Pipeline según `ARCHITECTURE.md` §4–§5:

```
licencias (candidatos) → elecciones del usuario → escansión resuelta → cómputo
```

`escansion.ts` ya resuelve candidatos + elecciones en una `Escansion` con
`silabasMetricas`. Falta aplicar la **ley de acento final** sobre esa
escansión para obtener el cómputo métrico definitivo del verso.

### Alcance propuesto

1. **Firma** (a decidir en `SPEC.propuesta.md` §7, S-61…):

   ```ts
   export interface Computo {
     readonly silabasMetricas: number;
     readonly ajuste: -1 | 0 | 1;
     readonly tipoFinal: TipoAcento;
   }

   export function computar(escansion: Escansion, verso: string): Computo;
   ```

2. **Reglas a decidir** (bloques `[DECISIÓN]` nuevos, S-61…):
   - ¿Cómo se determina la última palabra del verso? (última secuencia de
     letras).
   - ¿Qué pasa si la última palabra es monosílaba? (no ajusta).
   - ¿Qué pasa si el verso está vacío? (cómputo 0).
   - ¿Se aplica el ajuste sobre `silabasMetricas` de la escansión o se
     recalcula desde cero?

3. **Tests** (`packages/motor/tests/computo.test.ts`):
   - verso llano → sin ajuste;
   - verso agudo → +1;
   - verso esdrújulo → −1;
   - verso vacío → 0;
   - verso con sinalefa aplicada + final agudo → ajuste combinado.

### Después de `computo.ts`

Con `computo.ts` en verde se cierra la fase 2 del `ARCHITECTURE.md` §13
(motor sin interfaz). El siguiente hito es la fase 3: editor web con análisis
en vivo (CodeMirror 6 + Web Worker).

## Fuera de alcance de esta fase

- `ritmo.ts` y `rima.ts` (fase 6 del `ARCHITECTURE.md`).
- Anclaje robusto de elecciones por offset+contexto (fase 4).
- UI, Web Worker, IndexedDB, Capacitor (fases 3–5).
