# Arquitectura: editor de métrica poética en tiempo real

Nombre de trabajo del proyecto: `poetica` (cámbialo cuando quieras).

## 1. Objetivo

- Una app para escribir poemas y letras y ver, mientras se escribe, su análisis métrico: sílabas, sinalefas, sílabas tónicas y átonas, cómputo silábico, patrón de acentos y rima. El usuario puede corregir el análisis cuando algo no cuadra. También se puede pegar una letra ya escrita para analizarla.
- El motor no pretende dar una única verdad métrica: devuelve **candidatos de escansión** y el poeta elige. Un mismo verso puede tener más de una lectura válida.

## 2. Alcance

- **Idioma de la v1:** español.
- **Plataforma:** móvil primero. Después navegador y escritorio, con el mismo código.
- **Funciona sin internet.** No hay backend en las primeras fases.
- **Fuera de la v1:** clasificación de ritmo (yámbico, trocaico, etc.) como función estable; otros idiomas; tipos de poema (soneto, romance) más allá de la vista de rima.

## 3. Principios de diseño

1. **Spec antes que código.** Ninguna regla lingüística se implementa si no está escrita en `packages/motor/SPEC.md`. Si la regla no está escrita, el código la inventará distinto cada vez.
2. **Motor puro.** La lógica lingüística es una librería sin interfaz, que se puede probar desde la terminal.
3. **El análisis sugiere, el usuario decide.** Las licencias poéticas (sinalefa, hiato, sinéresis, diéresis) las elige el poeta. El motor devuelve candidatos, no una escansión cerrada.
4. **Las correcciones van aparte del texto.** El texto y el análisis automático no se modifican. Las elecciones del usuario viven en una capa separada y versionada.
5. **Local primero.** Los poemas se guardan en el dispositivo.
6. **Recalcular solo lo que cambió.** Cada verso se analiza por separado. Solo la rima depende de varios versos.
7. **Corpus verificado como oráculo.** La verdad del motor son versos escandidos a mano con fuente, no otro analizador automático.

## 4. Visión general

```text
texto → normalización → versos → palabras → sílabas → tónica / átona
      → candidatos de licencia (sinalefa, hiato, sinéresis, diéresis)
      → elecciones del usuario
      → escansión resuelta
      → cómputo silábico
      → patrón de acentos (+ rima, por estrofa)
```

Dos capas:

```text
┌──────────────────────────────┐
│  apps/web  (UI + Capacitor)  │  editor, marcas visuales, elecciones del usuario
├──────────────────────────────┤
│  packages/motor  (librería)  │  análisis métrico, sin interfaz
└──────────────────────────────┘
```

## 5. Motor lingüístico

| Módulo | Responsabilidad |
| --- | --- |
| `normalizar.ts` | Unicode NFC, comillas, apóstrofos, guiones, espacios. Todo lo demás trabaja sobre texto normalizado. |
| `silabeo.ts` | Separar una palabra en sílabas (diptongos, triptongos, hiatos, grupos consonánticos). |
| `acento.ts` | Decidir qué sílaba es tónica (por tilde y terminación) y qué palabras son átonas (monosílabos como "que" o "de"). Maneja adverbios en *-mente*. |
| `licencias.ts` | **Detectar candidatos**: dónde puede haber sinalefa, hiato, sinéresis o diéresis. No elige. |
| `escansion.ts` | Resolver candidatos + elecciones del usuario en una escansión concreta. Función pura e idempotente. |
| `computo.ts` | Contar sílabas métricas sobre una escansión resuelta. Final agudo suma 1, final esdrújulo resta 1. |
| `ritmo.ts` | **Experimental.** Devolver el patrón de acentos (posiciones tónicas/átonas) y, opcionalmente, una etiqueta de ritmo con nivel de confianza. |
| `rima.ts` | Rima consonante y asonante desde la última vocal tónica, por pares dentro de una estrofa. |
| `excepciones.json` | Palabras que las reglas no resuelven bien (hiatos raros, extranjerismos, etc.), con `fuente`, `fecha` y `motivo`. |
| `SPEC.md` | Contrato del motor: reglas cerradas, convenciones y decisiones. |

Las reglas cubren la mayoría de los casos. Lo que no cubren va en `excepciones.json`, más un **diccionario del usuario** para casos propios.

Convenciones que el `SPEC.md` debe cerrar antes de implementar:

- lista cerrada de diptongos y triptongos reconocidos;
- tratamiento de `ü`, `ñ`, `y` final, apóstrofos y guiones;
- qué monosílabos se consideran átonos y cuáles no;
- cómputo en adverbios en *-mente* (¿una o dos tónicas?);
- definición exacta del patrón de acentos (¿solo tónicas primarias?);
- qué cuenta como estrofa (línea vacía).

## 6. Modelo de datos

El análisis se calcula. Los candidatos y las elecciones se guardan.

```ts
type Candidato = {
  tipo: 'sinalefa' | 'hiato' | 'sinéresis' | 'diéresis' | 'acento';
  desde: number;   // offset en el verso normalizado
  hasta: number;
  opciones: string[]; // lecturas posibles
};

type Eleccion = {
  tipo: Candidato['tipo'];
  ancla: {
    offset: number;
    palabra: string;
    anterior?: string;
    siguiente?: string;
  };
  valor: string;
  huerfano?: boolean; // el ancla ya no coincide al recalcular
};

type Poema = {
  id: string;
  titulo: string;
  texto: string;
  elecciones: Eleccion[];
  schemaVersion: number;
  motorVersion: string;
  actualizado: number;
};
```

Notas:

- Las elecciones se anclan a `offset` + `palabra` + contexto, no a "ocurrencia número N". Así, si el usuario edita el poema, el ancla se puede revalidar.
- Si al recalcular el ancla no coincide, la elección se marca `huerfano: true` en vez de aplicarse mal. La UI decide si la muestra, la descarta o pide confirmación.
- `motorVersion` permite detectar elecciones calculadas con reglas antiguas tras un cambio del motor.

## 7. Tiempo real

- Debounce de unos 300 ms tras dejar de escribir.
- Se recalcula solo el verso modificado.
- El análisis corre en un Web Worker para no trabar el teclado.
- La rima se recalcula por estrofa (versos separados por línea vacía), comparando los pares relevantes, no solo versos vecinos.

## 8. Interfaz

- Editor de texto con marcas sobre el propio texto: sílabas separadas, tónica resaltada, número de sílabas al final de cada verso.
- Al tocar una unión entre palabras, se alterna entre las lecturas candidatas (sinalefa / hiato).
- Al tocar una palabra, se puede cambiar su acento o su silabeo.
- Vista de rima (letras por verso, como ABBA) y, si está activo, etiqueta de ritmo con su nivel de confianza.
- Indicador discreto de elecciones huérfanas.
- Modo de análisis: pegar una letra y ver el resultado sin editar.

## 9. Almacenamiento

- IndexedDB (con Dexie) para poemas y diccionario del usuario.
- Esquema versionado (`schemaVersion`) con migraciones explícitas.
- Exportación a texto y PDF.
- Sin backend al inicio. Si más adelante se quiere sincronizar entre dispositivos, se agrega después.

## 10. Tecnologías

| Para qué | Qué usar |
| --- | --- |
| Lenguaje | TypeScript |
| Gestor de paquetes | pnpm con workspaces |
| Pruebas del motor | Vitest |
| Servidor de desarrollo | Vite |
| Editor de texto | CodeMirror 6 |
| Análisis en segundo plano | Web Worker |
| Datos locales | IndexedDB (Dexie) |
| App móvil | Capacitor |
| Escritorio (después) | Tauri o Electron |

Por qué web y no React Native: CodeMirror maneja muy bien los estilos por fragmento de texto. En React Native, marcar fragmentos dentro de un editor es mucho más incómodo. A cambio, una app web empaquetada se siente menos nativa. Este riesgo se valida pronto (fase 3), no al final.

## 11. Estructura de carpetas

```text
poetica/
├─ pnpm-workspace.yaml
├─ ARCHITECTURE.md
├─ AGENTS.md
├─ ETAPA-1.md
├─ packages/
│  └─ motor/
│     ├─ SPEC.md
│     ├─ src/
│     │  ├─ normalizar.ts
│     │  ├─ silabeo.ts
│     │  ├─ acento.ts
│     │  ├─ licencias.ts
│     │  ├─ escansion.ts
│     │  ├─ computo.ts
│     │  ├─ ritmo.ts
│     │  ├─ rima.ts
│     │  ├─ excepciones.json
│     │  └─ index.ts
│     └─ tests/
│        ├─ corpus/
│        │  └─ versos.json      # corpus de oro con fuente
│        ├─ silabeo.test.ts
│        ├─ acento.test.ts
│        ├─ licencias.test.ts
│        ├─ propiedades.test.ts # invariantes
│        └─ poemas.test.ts
└─ apps/
   └─ web/
```

## 12. Estrategia de pruebas

1. **Corpus de oro.** Versos con escansión verificada a mano y fuente (libro y página, o "verificado a mano"). Vive en `packages/motor/tests/corpus/versos.json`. Debe incluir casos límite a propósito: hiatos raros, triptongos, versos agudos y esdrújulos, adverbios en *-mente*, `y` final, monosílabos átonos/tónicos, extranjerismos.
2. **Pruebas unitarias del motor (Vitest):** palabras sueltas para silabeo y acento; casos del corpus para licencias y cómputo.
3. **Pruebas de propiedades/invariantes:**
   - la suma de longitudes de sílabas = longitud de la palabra normalizada;
   - todo verso tiene al menos una tónica;
   - cómputo sin licencias $\ge$ cómputo con todas las sinalefas posibles;
   - silabeo idempotente;
   - aplicar y deshacer una elección vuelve al mismo estado.
4. **Fuzzing.** Palabras y versos aleatorios contra las invariantes. No se espera escansión correcta, solo que no explote ni viole propiedades.
5. **Pruebas diferenciales.** Comparar contra Lexiquetos y Poemas del Alma solo para encontrar zonas grises, no como oráculo. Cada discrepancia se revisa a mano; si es un caso real, entra al corpus con su fuente.
6. **Pruebas manuales.** Navegador con `pnpm dev`, celular por IP local con `pnpm dev --host`, y emulador o USB con Capacitor. Para iPhone hace falta una Mac con Xcode.

Reglas de trabajo:

- Las pruebas y el corpus los escribe y verifica el usuario. La IA escribe el código hasta que pasen. La IA no modifica tests ni corpus.
- La IA no genera el corpus esperado: se copiaría a sí misma.
- Un bug = una prueba. Cada error encontrado entra al corpus antes de arreglarlo.

## 13. Fases

1. Esqueleto del proyecto (ver `ETAPA-1.md`) + `SPEC.md` inicial.
2. Solo el motor, sin interfaz: normalización, silabeo, acento, candidatos de licencia, escansión, cómputo. Una función a la vez, con corpus y propiedades en verde antes de pasar a la siguiente. Esta fase no se cierra con "funciona en mis ejemplos", sino con corpus verificado en verde.
3. Editor web simple con análisis en vivo. Aquí se prueba CodeMirror dentro de Capacitor en un móvil real, no después.
4. Elecciones del usuario y diccionario del usuario, con anclaje robusto y manejo de huérfanas.
5. Empaquetar para móvil con Capacitor.
6. Rima por estrofa. Patrón de acentos. Clasificación de ritmo, si el corpus lo respalda. Tipos de poema.
7. Navegador y escritorio.

## 14. Riesgos y decisiones abiertas

- **El silabeo con diptongos, hiatos y casos raros** es donde más errores van a aparecer. Hay que reservar tiempo para afinarlo y alimentarlo con corpus verificado.
- **Ambigüedad métrica.** Hay que medir cuántos versos salen con más de un candidato. Si es un porcentaje alto, la spec es demasiado laxa o el corpus no cubre esos casos.
- **La clasificación de ritmo** (yámbico, trocaico, etc.) en español es acentual, no de cantidad como en el griego o latín. Conviene definir en el código con precisión qué patrón de acentos corresponde a cada nombre, y no presentarla como verdad.
- **Anclaje de elecciones.** Editar texto puede invalidar anclas. El diseño debe tolerar huérfanas sin corromper el análisis.
- **Versionado.** Cambios de reglas invalidan elecciones antiguas. `motorVersion` y `schemaVersion` deben existir desde la v1, no añadirse después.
- **Teclado móvil y editor:** probar CodeMirror dentro de Capacitor en un teléfono real pronto, porque ahí suelen aparecer los problemas.
- **Otros idiomas:** fuera de alcance en la v1. Si se agregan, el motor tendrá que separar reglas por idioma.

---

### Recordatorio de ubicaciones

| Archivo | Dónde |
| --- | --- |
| `ARCHITECTURE.md` | raíz del repo |
| `SPEC.md` | `packages/motor/` |
| `versos.json` | `packages/motor/tests/corpus/` |

En `AGENTS.md`: *"Antes de tocar `packages/motor`, leer `ARCHITECTURE.md` y `packages/motor/SPEC.md`. No modificar `tests/` ni `tests/corpus/`."*