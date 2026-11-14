# PLAN ACTUAL — Motor (spike)

## Estado

| Módulo | Estado | Tests |
| --- | --- | --- |
| `normalizar.ts` | ✅ Implementado (§2, S-01…S-21) | 27 |
| `silabeo.ts` | ✅ Implementado (§3, S-22…S-36) | 25 |
| `acento.ts` | ✅ Implementado (§4, S-37…S-43) | 16 |
| `licencias.ts` | ✅ Implementado (§5, S-44…S-53) | 15 |
| `escansion.ts` | ❌ Pendiente | — |
| `computo.ts` | ❌ Pendiente | — |
| `ritmo.ts` | ❌ Fuera de alcance (fase 6) | — |
| `rima.ts` | ❌ Fuera de alcance (fase 6) | — |

Total: **68 tests en verde** (4 archivos).

## Siguiente paso: `escansion.ts`

Pipeline según `ARCHITECTURE.md` §4–§5:

```
licencias (candidatos) → elecciones del usuario → escansión resuelta → cómputo
```

`licencias.ts` ya devuelve candidatos. Falta el módulo que **resuelve** esos
candidatos cruzados con las `Eleccion[]` del usuario para producir una
escansión concreta. Es el paso previo obligatorio a `computo.ts`.

### Alcance propuesto

1. **Firma** (a decidir en `SPEC.propuesta.md` §6, S-54…):

   ```ts
   export interface Eleccion {
     readonly tipo: TipoLicencia;
     readonly palabraA: number;
     readonly palabraB: number;
     readonly valor: "aplicar" | "no-aplicar";
   }

   export interface Escansion {
     readonly silabas: readonly Silaba[];
     readonly silabasMetricas: number;
     readonly eleccionesAplicadas: readonly Eleccion[];
     readonly eleccionesHuerfanas: readonly Eleccion[];
   }

   export function resolverEscansion(
     verso: string,
     elecciones: readonly Eleccion[],
   ): Escansion;
   ```

2. **Reglas a decidir** (bloques `[DECISIÓN]` nuevos, S-54…):
   - ¿Qué pasa si el usuario no elige nada? (¿default = no aplicar ninguna
     licencia? ¿o aplicar todas las sinalefas?)
   - ¿Cómo se identifica una elección huérfana? (por ahora `palabraA` /
     `palabraB` + `tipo`; el anclaje robusto por offset+contexto del
     `ARCHITECTURE.md` §6 queda para fase 4).
   - ¿Se permite aplicar sinalefa y hiato a la misma frontera? (no, son
     mutuamente excluyentes).
   - ¿Cómo se combinan sinéresis y diéresis intra-palabra con las elecciones
     entre palabras?

3. **Tests** (`packages/motor/tests/escansion.test.ts`):
   - verso sin candidatos → escansión = silabeo plano;
   - verso con sinalefa aplicada → −1 sílaba;
   - verso con sinalefa no aplicada → sin cambio;
   - elección huérfana (frontera que ya no existe) → se reporta, no se aplica;
   - idempotencia: aplicar y deshacer vuelve al mismo estado.

### Después de `escansion.ts`

`computo.ts` (aplicar ley de acento final: aguda +1, esdrújula −1) sobre la
escansión resuelta. Con eso se cierra la fase 2 del `ARCHITECTURE.md` §13.

## Fuera de alcance de esta fase

- `ritmo.ts` y `rima.ts` (fase 6 del `ARCHITECTURE.md`).
- Anclaje robusto de elecciones por offset+contexto (fase 4).
- UI, Web Worker, IndexedDB, Capacitor (fases 3–5).
