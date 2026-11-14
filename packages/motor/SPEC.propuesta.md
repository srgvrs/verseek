# SPEC (propuesta / spike) — §2 normalizar + §13 contratos públicos

> **Estado: SPIKE.** Este archivo NO es `SPEC.md` y no sustituye al `SPEC.md`
> real. Cada bloque marcado `[DECISIÓN]` es una decisión tomada por la IA en
> esta sesión con autorización explícita del usuario, para obtener algo
> ejecutable y probable. El usuario revisará, corregirá y solo entonces
> promoverá lo que quiera al `SPEC.md` definitivo.
>
> Mientras este archivo siga siendo spike, `normalizar.ts` puede implementarse
> contra él, pero cualquier divergencia con el `SPEC.md` real se resuelve a
> favor del `SPEC.md` real.

---

## §2 Normalización (spike)

Contexto del `SPEC.md` real: §2 tiene NOR-01…NOR-05 en estado `propuesta` /
`pendiente`. Aquí se concretan para poder implementar.

### §2.1 Firma y resultado

```ts
export function normalizar(texto: string): ResultadoNormalizacion;

export interface ResultadoNormalizacion {
  /** Texto normalizado listo para el resto del pipeline. */
  readonly texto: string;
  /**
   * Mapa de posiciones: para cada índice `i` del texto normalizado,
   * `offsets[i]` es el índice en el texto ORIGINAL del carácter de origen.
   * Cuando un carácter normalizado proviene de un grupo (p. ej. `\r\n` → `\n`,
   * o un colapso de espacios), se reporta el índice del PRIMER carácter del
   * grupo original. Los originales sin correspondencia (marcas eliminadas)
   * simplemente no aparecen.
   */
  readonly offsets: readonly number[];
}
```

// [DECISIÓN] La firma pública es `normalizar(texto: string): ResultadoNormalizacion` (objeto con `texto` y `offsets`).
// Justificación: la UI y el worker necesitan remapear selecciones desde el texto normalizado al original; devolver un `string` pelado obliga a recalcularlo fuera del módulo.

// [DECISIÓN] `offsets` es un array `readonly number[]` paralelo a `texto` (misma longitud).
// Justificación: acceso O(1) por índice, serializable a JSON, y encaja con structured clone en el worker.

// [DECISIÓN] Los tipos de entrada y salida son `readonly`.
// Justificación: el motor no muta lo que produce; que el tipo lo impida en compilación evita bugs en módulos posteriores.

### §2.2 Mayúsculas y minúsculas

// [DECISIÓN] `normalizar` NO pasa el texto a minúsculas. Las mayúsculas se conservan tal cual.
// Justificación: el usuario (spike) pidió que se conserve el uso original; la comparación case-insensitive es responsabilidad de cada módulo que la necesite (`silabeo`, `acento`), no del normalizador.

// [DECISIÓN] Se CONSERVAN la tilde y la diéresis ortográfica (`ü`) sin tocarlas.
// Justificación: NOR-01 exige conservarlas; el acento es una regla de `acento.ts`, no de `normalizar`.

// [DECISIÓN] El texto normalizado mantiene exactamente la caja (mayús./minús.) del texto de entrada salvo en los caracteres que se unifican (§2.5 espacios, §2.7 apóstrofos, §2.6 saltos), que ya de por sí no tienen caja.
// Justificación: no introducimos ninguna transformación de caja; el normalizador solo unifica formas de carácter.

### §2.3 Puntuación (NOR-02)

// [DECISIÓN] Los signos de puntuación SE CONSERVAN en el texto normalizado. `normalizar` NO los elimina.
// Justificación: NOR-02 pide recordar su posición porque la sinalefa puede cruzarlos (LIC-05). Si `normalizar` los borrara, `silabeo`/`licencias` perderían la información; que los ignore quien tenga que ignorarlos es una decisión de §3/§5.

// [DECISIÓN] Se conservan puntuación ASCII (`.,;:!?¡¿`), comillas (`"'«»""` `''`) y guiones y rayas (`-`, `‐`, `–`, `—`, `−`) tal cual.
// Justificación: cualquier sustitución cambia la longitud del texto y por tanto dónde se cuentan licencias; la decisión lingüística de tratarlos pertenece a `silabeo`/`licencias`.

### §2.4 Unicode (NOR-05 en la parte de caracteres)

// [DECISIÓN] Se compone la entrada a NFC como primer paso (`texto.normalize("NFC")`).
// Justificación: unifica `e`+U+0301 vs `é`, y `u`+U+0308 vs `ü`, para que el resto de módulos comparen contra una forma canónica.

// [DECISIÓN] NO se eliminan marcas combinantes sueltas (U+0300–U+036F) que no formen carácter compuesto tras NFC.
// Justificación: eliminarlas silenciosamente esconde datos corruptos del usuario. Si aparecen en un caso real, se trata como excepción explícita en `excepciones.json`.

// [DECISIÓN] NO se limpian caracteres de control, zero-width (`U+200B`…), BOM (`U+FEFF`) ni espacios exóticos más allá de los listados en §2.5.
// Justificación: fuera de alcance de este spike; preferimos que el bug sea visible a maquillarlo en `normalizar`.

### §2.5 Espacios (NOR-05 colateral)

// [DECISIÓN] Se unifican a espacio U+0020 las siguientes variantes: U+00A0 (NBSP), U+2007 (figure space), U+2009 (thin space), U+202F (narrow NBSP), U+3000 (ideographic space) y `\t` (U+0009).
// Justificación: el conteo silábico del español no distingue tipos de espacio; unificarlos hace deterministas las comparaciones.

// [DECISIÓN] Se colapsan secuencias de espacios consecutivos a un único espacio U+0020.
// Justificación: evita que un doble espacio pegado por accidente infle el conteo de separadores de palabra en módulos posteriores.

// [DECISIÓN] NO se aplica `trim` al texto total.
// Justificación: recortar los bordes es decisión de la UI; el motor solo normaliza la forma interna.

### §2.6 Saltos de línea y estrofas

// [DECISIÓN] Se normalizan `\r\n` y `\r` aislado a `\n`.
// Justificación: consistencia entre editores y clips de Windows.

// [DECISIÓN] NO se colapsan saltos de línea múltiples (`\n\n\n` se conserva). No se define "estrofa" en `normalizar`.
// Justificación: la noción de estrofa es del editor; el motor solo normaliza el salto.

// [DECISIÓN] Los espacios no colapsan a través de un salto de línea (un espacio pegado antes de `\n` se conserva como parte del contenido de la línea, sujeto solo a §2.5).
// Justificación: borrar espacios en los extremos de línea pertenece al editor, no al motor.

### §2.7 Apóstrofos

// [DECISIÓN] Se unifican `'` (U+0027), `'` (U+2019), `'` (U+2018) y `` ` `` (U+0060) a `'` (U+0027).
// Justificación: en español aparecen en préstamos (`d'Artagnan`) y elisiones poéticas; unificar la forma evita que `silabeo`/`licencias` vean casos distintos por accidente tipográfico.

// [DECISIÓN] NO se eliminan los apóstrofos en `normalizar`.
// Justificación: decidir si un apóstrofo une o no sílabas pertenece a `licencias` (sinalefa/elisión).

### §2.8 Idempotencia

// [DECISIÓN] `normalizar` es idempotente en su salida: `normalizar(r.texto).texto === r.texto` para `r = normalizar(x)`.
// Justificación: invariante necesaria para que el worker pueda pasar el resultado de nuevo por el motor sin deriva.

// [DECISIÓN] `offsets` NO es idempotente y no se le exige serlo: en una segunda pasada mapea al texto producido por la primera, no al original inicial.
// Justificación: exigir idempotencia de `offsets` obligaría a mentir sobre su semántica (de entrada a salida de esta llamada).

### §2.9 Fuera de alcance de `normalizar`

Sinalefa, hiato, sinéresis, diéresis (van en `licencias`), sílaba tónica y clasificación acentual (van en `acento`), tratamiento de *h* muda/aspirada (regla de `silabeo`/`licencias` según SPEC §2 NOR-03 y §5 LIC-04), números, siglas y extranjerismos (D12 sigue abierto en el SPEC real).

---

## §3 Silabeo (spike)

Contexto del `SPEC.md` real: §3 tiene SIL-01…SIL-13 en estado `propuesta` /
`pendiente`. Aquí se concretan las `propuesta` y se toman decisiones para las
`pendiente` (D2–D4) a fin de poder implementar y probar.

### §3.1 Firma y resultado

```ts
export interface Silaba {
  readonly texto: string;
  readonly inicio: number;   // índice en la palabra de ENTRADA
  readonly fin: number;      // índice (exclusivo) en la palabra de ENTRADA
}

export function silabear(palabra: string): readonly Silaba[];
```

// [DECISIÓN] La firma es `silabear(palabra: string): readonly Silaba[]`, donde cada sílaba trae `{ texto, inicio, fin }` con índices sobre la palabra original (no sobre un normalizado interno).
// Justificación: `licencias` y `acento` necesitan saber dónde cae cada sílaba en la palabra para construir candidatos y resaltar; devolver solo `string[]` obligaría a recalcularlo después.

// [DECISIÓN] Si la entrada contiene espacios o varios caracteres que no son letras, `silabear` los agrupa por palabras: SÓLO se silabea la primera palabra.
// Justificación: `silabeo` es una función de palabra, no de verso. El caller (licencias / UI) parte el verso en palabras y llama N veces.

// [DECISIÓN] La invariancia `concat(sílabas) === palabra` se exige SIEMPRE (a nivel de código de unidades Unicode). La suma `fin - inicio` recorre toda la palabra.
// Justificación: es una propiedad natural; si no se cumple, hay un bug. `propiedades.test.ts` (cuando lo escribas) puede apoyarse en esto.

// [DECISIÓN] `silabeo` es idempotente en su salida: `concat(silabear(p)) === p`, `silabear(concat(silabear(p)))` produce la misma partición.
// Justificación: `silabeo` de una palabra ya concatenada de nuevo no debería cambiar; si lo hace, es un bug.

### §3.2 Vocales (§SIL-01)

// [DECISIÓN] Vocales abiertas: `a, e, o, á, é, ó`; cerradas: `i, u, í, ú, ü` (la `ü` también se considera vocal cerrada, sea diéresis ortográfica o métrica). La `y` no es vocal en sílaba interna; al FINAL de palabra cuenta como vocal cerrada (§3.6).
// Justificación: SIL-01 + SIL-09 + SIL-10; la ü debe considerarse cerrada para que `pingüino` se silabee como `pin-güi-no`.

// [DECISIÓN] Las vocales tónicas se reconocen por la tilde (`á é í ó ú`), no por el acento que `acento.ts` calcule.
// Justificación: en silabeo se necesita saber si una cerrada porta tilde para bloquear el diptongo (SIL-04) sin depender del módulo de acento (aún no implementado).

### §3.3 Diptongos y triptongos (§SIL-02, §SIL-03)

// [DECISIÓN] Combinaciones que forman diptongo cuando la cerrada NO lleva tilde y hay tres vocales máx. en juego:
//   abierta + cerrada (ai, ei, oi, au, eu, ou)
//   cerrada + abierta (ia, ie, io, ua, ue, uo)
//   cerrada + cerrada distinta (iu, ui)
// Justificación: SIL-02, resumido.

// [DECISIÓN] Triptongo = cerrada átona + abierta + cerrada átona. Cubre `uai/uay`, `iei`, `uau`, `uei`, `uoi`. La `y` final puede actuar como la cerrada final (`Uruguay`, `buey`).
// Justificación: SIL-03 + SIL-10 (y final = vocal cerrada).

// [DECISIÓN] Los signos de puntuación y cualquier carácter que no sea letra se considera FRONTERA de sílaba que se arrastra a la sílaba previa. En la práctica: `silabear` filtra por palabras y se detiene en el primer no-letra.
// Justificación: los tests actuales son de palabras sueltas; tratar puntuación en el silabeo de una palabra es un caso fuera de alcance de este spike (es trabajo de licencias/versos).

### §3.4 Hiatos (§SIL-04)

// [DECISIÓN] Hay hiato (dos sílabas) siempre que:
//   a) dos vocales abiertas están juntas (aa, ae, ao, ea, ee, eo, oa, oe, oo), con tilde o sin ella;
//   b) una vocal cerrada lleva TILDE junto a una abierta (o una cerrada con tilde junto a otra cerrada), independiente de cuál sea la fuerte;
//   c) se combina cerrada-tónica latente: `ía`, `íe`, `ío`, `úa`, `úe`, `úo`, `aí`, `eí`, `oí`, `aú`, `eú`, `oú`.
// Justificación: SIL-04 + regla estándar del español; el caso (b) es lo que distingue `pa-ís` de `bai-le` cuando la cerrada lleva tilde.

### §3.5 Consonantes (§SIL-05, §SIL-06, §SIL-07, §SIL-08)

// [DECISIÓN] Una consonante entre vocales pasa a la siguiente (`ca-sa`).
// Justificación: SIL-05.

// [DECISIÓN] Dígrafos `ch`, `ll`, `rr` cuentan como consonante única. `gu`/`qu` ante `e` o `i` cuentan como consonante única (la `u` no suena; SIL-09).
// Justificación: SIL-07 + SIL-09.

// [DECISIÓN] Grupos inseparables que van completos a la sílaba siguiente: `pr, pl, br, bl, fr, fl, gr, gl, cr, cl, tr, dr` (SIL-07).
// Justificación: SIL-07, exactamente la lista del SPEC.

// [DECISIÓN] **Grupo `tl`** (D2 del SPEC: `a-tlas` vs `at-las`): se trata como separable → `at-las`, `a-tle-ta`. Es decir, la `t` cierra la sílaba anterior y la `l` abre la siguiente.
// Justificación: alineado con España (dominante en manuales de métrica [DC], que es la fuente del repo); si el corpus del usuario demuestra lo contrario, se cambia.

// [DECISIÓN] **Grupo `gn`** (caso no listado en el SPEC): se trata como separable → `sig-no`. No lo consideramos grupo inseparable.
// Justificación: `gn` en español no es un grupo consonántico nativo y aparece sobre todo en cultismos y extranjerismos; separar es la opción menos sorpresiva.

// [DECISIÓN] Tres o más consonantes: la última (o el grupo inseparable final) pasa a la sílaba siguiente; el resto cierra la anterior. Casos: `ins-tan-te`, `obs-truir`, `cons-truir`, `abs-trac-to`.
// Justificación: SIL-08.

// [DECISIÓN] Prefijos (`sub-rayar`, `ab-rogar`): a este spike NO se aplica regla morfológica especial. Se silabea solo por reglas fonéticas.
// Justificación: D4 abierto; lo más seguro es no inventar. Si el corpus demuestra fallos por prefijos, se cambia después.

// [DECISIÓN] *h* intercalada entre vocales (`SIL-12`, D3): la *h* entre dos vocales cuenta como una consonante muda a efectos de corte silábico, pero **bloquea** el diptongo entre la vocal de la izquierda y la de la derecha. Es decir, se comporta como una consonante que se queda a la izquierda de la vocal siguiente.
// Ejemplos: `aho-ra` → `a-ho-ra`; `ahí` → `a-hí`; `bú-ho` → `bú-ho`; `rehén` → `re-hén`; `ahumado` → `a-hu-ma-do`; `Cuauhtémoc` → `Cuauh-té-moc`.
// Justificación: es la lectura estándar de NOR-03 + DC 4.2.1 (p. 56). La *h* muda no impide sinalefa entre palabras (eso es LIC-04), pero en el interior de la palabra sí divide sílaba. `aluvión`/`ahogo` etc. quedan como `a-ho-go` según esta regla. Si el corpus demuestra que alguna palabra debe tratarla como diptongo, se resuelve por `excepciones.json`.

### §3.6 La `y` (§SIL-10)

// [DECISIÓN] La `y` al final de palabra se considera vocal cerrada: participa en diptongos y triptongos. `rey` → `rey`; `hoy` → `hoy`; `Uruguay` → `U-ru-guay`.
// Justificación: SIL-10.

// [DECISIÓN] La `y` en posición interna se considera consonante (una consonante larga de una sola letra, equivalente a `ll` para silabeo): `mayo` → `ma-yo`, `payaso` → `pa-ya-so`.
// Justificación: lectura estándar de la `y` como consonante palatal entre vocales.

### §3.7 Diéresis (`ü`) (§SIL-09)

// [DECISIÓN] `güe`, `güi` forman diptongo (`pin-güi-no`). En cualquier otro contexto, la `ü` es una vocal cerrada normal, como en `nicaragüense` (`ni-ca-ra-güen-se` → diptongo `üe`).
// Justificación: SIL-09.

### §3.8 Fuera de alcance de `silabeo`

- Sinalefa entre palabras: `licencias`.
- Acento/tónica: `acento`.
- Tratamiento de *h* aspirada: `licencias` (override).

---

## §4 Acento (spike)

Contexto del `SPEC.md` real: §4 tiene ACN-01…ACN-0N en estado `propuesta` /
`pendiente`. Aquí se concretan para poder implementar `acento.ts`.

### §4.1 Firma y resultado

```ts
export type TipoAcento = "aguda" | "llana" | "esdrujula" | "sobresdrujula" | "monosilabo";

export interface ResultadoAcento {
  readonly tipo: TipoAcento;
  readonly silabaTonica: number;
  readonly tonica: Silaba | null;
  readonly silabas: readonly Silaba[];
}

export function clasificarAcento(palabra: string): ResultadoAcento;
```

// [DECISIÓN] La firma es `clasificarAcento(palabra: string): ResultadoAcento`, con `silabaTonica` como índice 0-based dentro de `silabas` y `tonica` como referencia directa a la sílaba.
// Justificación: `licencias`/`computo` necesitan saber cuál es la tónica para aplicar sinalefa y para el cómputo métrico; devolver solo el tipo obligaría a recalcular.

// [DECISIÓN] Los tipos son `readonly` y `silabas` es el array devuelto por `silabear` (misma partición).
// Justificación: coherencia con §2.1 y §3.1; el caller puede reutilizar la partición.

### §4.2 Tilde explícita

// [DECISIÓN] Si la palabra contiene una vocal con tilde (`á é í ó ú`), la sílaba tónica es la que la porta y el tipo se deriva de su posición desde el final: última → aguda, penúltima → llana, antepenúltima → esdrújula, anterior → sobresdrújula.
// Justificación: la tilde ortográfica es la señal más fiable; prevalece sobre la regla general.

### §4.3 Regla general sin tilde

// [DECISIÓN] Sin tilde: aguda si termina en vocal, `n` o `s`; llana en cualquier otro caso.
// Justificación: regla estándar del español (RAE).

### §4.4 Monosílabos

// [DECISIÓN] Una palabra con una sola sílaba se clasifica como `monosilabo`, independientemente de su terminación.
// Justificación: para métrica no hay distinción útil entre aguda/llana en monosílabos; el tipo `monosilabo` lo hace explícito.

### §4.5 Adverbios en `-mente`

// [DECISIÓN] Si la palabra termina en `-mente` (case-insensitive) y tiene más de 5 caracteres, se analiza la base (sin `-mente`) y se reporta el tipo de la base; la sílaba tónica es la de la base dentro de la palabra completa.
// Justificación: los adverbios en `-mente` conservan el acento de su adjetivo base (`rápida` → `rápidamente` es esdrújula). El sufijo añade sílabas al final sin desplazar la tónica.

### §4.6 Casos degenerados

// [DECISIÓN] Palabra vacía o sin vocales: `tipo: "monosilabo"`, `silabaTonica: 0`, `tonica: null` (o la única sílaba si existe).
// Justificación: no romper el pipeline; el caller decide si es un error.

### §4.7 Fuera de alcance de `acento`

- Acento diacrítico (`él`/`el`, `sí`/`si`, `más`/`mas`): no se distingue por contexto.
- Acento enfático / interrogativo: fuera de alcance.
- Sinalefa y cómputo métrico: `licencias` / `computo`.

---

## §13 Contratos públicos (spike)

// [DECISIÓN] Se declaran aquí los contratos de `normalizar` y `silabeo`. Los contratos de `acento`, `licencias`, `computo`, `Candidato` y `Eleccion` NO se definen todavía.
// Justificación: se mantiene el repo en el orden "una función a la vez"; ninguno de esos módulos tiene SPEC cerrado todavía.

```ts
// packages/motor/src/normalizar.ts — superficie pública
export interface ResultadoNormalizacion {
  readonly texto: string;
  readonly offsets: readonly number[];
}

export function normalizar(texto: string): ResultadoNormalizacion;
```

```ts
// packages/motor/src/silabeo.ts — superficie pública
export interface Silaba {
  readonly texto: string;
  readonly inicio: number;
  readonly fin: number;
}

export function silabear(palabra: string): readonly Silaba[];
```

```ts
// packages/motor/src/acento.ts — superficie pública
export type TipoAcento = "aguda" | "llana" | "esdrujula" | "sobresdrujula" | "monosilabo";

export interface ResultadoAcento {
  readonly tipo: TipoAcento;
  readonly silabaTonica: number;
  readonly tonica: Silaba | null;
  readonly silabas: readonly Silaba[];
}

export function clasificarAcento(palabra: string): ResultadoAcento;
```

```ts
// packages/motor/src/index.ts — reexports de la fachada
export type { ResultadoNormalizacion } from "./normalizar.js";
export type { Silaba } from "./silabeo.js";
export type { ResultadoAcento, TipoAcento } from "./acento.js";
export { normalizar } from "./normalizar.js";
export { silabear } from "./silabeo.js";
export { clasificarAcento } from "./acento.js";
```

// [DECISIÓN] `index.ts` reexporta `normalizar`, `silabear`, `clasificarAcento` y sus tipos, y nada más, hasta que existan los demás módulos.
// Justificación: la fachada pública no debe exponer símbolos no implementados.

---

## §13.1 Estado de las decisiones de este spike

| ID    | Sección | Decisión                                             | Estado       |
|-------|---------|------------------------------------------------------|--------------|
| S-01  | §2.1    | firma `normalizar(texto) → { texto, offsets }`       | spike        |
| S-02  | §2.1    | `offsets` array paralelo `readonly number[]`         | spike        |
| S-03  | §2.1    | tipos `readonly`                                     | spike        |
| S-04  | §2.2    | conservar mayúsculas (NO `toLowerCase()`)            | spike        |
| S-05  | §2.2    | conservar tilde y `ü`                                | spike        |
| S-06  | §2.2    | normalizar no transforma caja                        | spike        |
| S-07  | §2.3    | conservar puntuación                                 | spike        |
| S-08  | §2.3    | conservar comillas, guiones y rayas                  | spike        |
| S-09  | §2.4    | NFC al inicio                                        | spike        |
| S-10  | §2.4    | no eliminar marcas combinantes sueltas               | spike        |
| S-11  | §2.4    | no limpiar control/zero-width/BOM                    | spike        |
| S-12  | §2.5    | unificar espacios al U+0020 (lista)                  | spike        |
| S-13  | §2.5    | colapsar espacios consecutivos                       | spike        |
| S-14  | §2.5    | no `trim`                                            | spike        |
| S-15  | §2.6    | `\r\n`, `\r` → `\n`                                  | spike        |
| S-16  | §2.6    | no colapsar `\n\n\n`                                 | spike        |
| S-17  | §2.6    | no colapsar espacios a través de `\n`                | spike        |
| S-18  | §2.7    | apóstrofos → `'` (U+0027), sin eliminar              | spike        |
| S-19  | §2.8    | idempotencia de `texto`                              | spike        |
| S-20  | §2.8    | offsets NO idempotentes                              | spike        |
| S-21  | §13     | `index.ts` reexporta `normalizar` y su tipo          | spike        |
| S-22  | §3.1    | firma `silabear(palabra) → Silaba[]`                 | spike        |
| S-23  | §3.1    | `Silaba` con `{ texto, inicio, fin }`                | spike        |
| S-24  | §3.2    | abiertas/cerradas con tilde; `ü` cerrada             | spike        |
| S-25  | §3.3    | diptongos / triptongos                              | spike        |
| S-26  | §3.4    | hiatos: abierta+abierta y cerrada con tilde          | spike        |
| S-27  | §3.5    | dígrafos `ch/ll/rr`, `gu/qu`                         | spike        |
| S-28  | §3.5    | grupos inseparables (SIL-07)                         | spike        |
| S-29  | §3.5    | `tl` separable (D2)                                  | spike        |
| S-30  | §3.5    | `gn` separable (inventada)                           | spike        |
| S-31  | §3.5    | 3+ consonantes: cola (grupo) a la siguiente          | spike        |
| S-32  | §3.5    | prefijos: solo reglas fonéticas (D4 abierto)         | spike        |
| S-33  | §3.5    | *h* intercalada muda; no bloquea diptongo (D3)       | spike        |
| S-34  | §3.6    | `y` final = vocal cerrada                            | spike        |
| S-35  | §3.6    | `y` interna = consonante                             | spike        |
| S-36  | §3.7    | `güe/güi` diptongo                                   | spike        |
| S-37  | §4.1    | firma `clasificarAcento(palabra) → ResultadoAcento`  | spike        |
| S-38  | §4.1    | `ResultadoAcento` con `{ tipo, silabaTonica, tonica, silabas }` | spike |
| S-39  | §4.2    | tilde explícita manda sobre regla general            | spike        |
| S-40  | §4.3    | aguda si termina en vocal/n/s; llana en el resto     | spike        |
| S-41  | §4.4    | monosílabos → tipo `monosilabo`                      | spike        |
| S-42  | §4.5    | adverbios `-mente` → analizar base                   | spike        |
| S-43  | §4.6    | palabra vacía/sin vocales → `monosilabo`             | spike        |
