# SPEC.md: reglas del motor de métrica (borrador v0.1)

Ubicación prevista: `packages/motor/SPEC.md`.

Este documento es el contrato del motor. Si una regla no está aquí, no se implementa. Cuando cambies de opinión, el orden es: SPEC, luego prueba, luego código.

**Este borrador no está cerrado.** Las decisiones abiertas están en la sección 10 y son tuyas. No implementes una regla marcada como `pendiente` hasta resolverla.

## 0. Cómo leer este documento

**Estados de cada regla**

| Estado | Significado |
|---|---|
| `decidida` | Respaldada por una fuente que se leyó para este borrador. Aun así, revísala. |
| `propuesta` | Es la regla estándar del español o una adaptación razonable, pero no se verificó en una fuente. Necesita tu visto bueno. |
| `pendiente` | Hay una decisión abierta (ver sección 10). El motor no debe inventar la regla. |

**Fuentes**

- **[DC]**: José Domínguez Caparrós, *Métrica española* (nueva edición, 2014). Se citan sección y página. Es el libro que subiste, y de él se leyeron los capítulos 4 (sílaba), 5 (acento) y 7.1 (rima).
- **[LEX]**: Lexiquetos, analizador de poemas (`lexiquetos.org/silio`).
- **[RAE/Quilis]**: reglas de fonética y ortografía del español general. **No se consultaron para este borrador**: toda regla que cite esto está por verificar en tus manuales (RAE *Ortografía* 2010, Quilis, Navarro Tomás).

El libro [DC] es un manual de métrica, no de fonética. Explica la sílaba métrica y sus licencias, pero **no da** las reglas básicas de silabeo, ni la lista de monosílabos átonos, ni el tratamiento de los adverbios en *-mente*. Esos puntos están marcados como `propuesta` o `pendiente`.

## 1. Alcance y convenciones

| ID | Regla | Estado |
|---|---|---|
| ALC-01 | El motor analiza versos en español. Un verso es una línea del texto. | decidida |
| ALC-02 | La sílaba métrica se establece en la cadena hablada, es decir, es un hecho fonético. No coincide siempre con la sílaba fonológica de la palabra aislada. [DC 4.2, pp. 53-55] | decidida |
| ALC-03 | La norma por defecto es la pronunciación culta correcta. [DC 4.2, p. 54] | decidida |
| ALC-04 | Las licencias (sinalefa, hiato, sinéresis, diéresis) las elige el poeta, y un mismo verso puede tener más de una escansión válida. Por eso el análisis automático es una **propuesta** y el usuario puede sobrescribirlo (sección 9). [DC 4.2.1 a 4.2.4] | decidida |
| ALC-05 | La cantidad (sílabas largas y breves) no se usa como factor rítmico. [DC 4.2.5, p. 60] | decidida |
| ALC-06 | Variedad del español: ver D1. | pendiente |

## 2. Normalización

| ID | Regla | Estado |
|---|---|---|
| NOR-01 | Se compara en minúsculas. Se conservan las tildes y la diéresis ortográfica (ü). | propuesta |
| NOR-02 | Los signos de puntuación se quitan para silabear, pero se recuerda su posición porque la sinalefa puede cruzarlos (LIC-05). | propuesta |
| NOR-03 | La *h* se trata como muda por defecto. [DC 4.2.1, p. 56] | propuesta |
| NOR-04 | La marca de diéresis métrica (crema sobre la primera vocal, como en *süave*) puede aparecer en ediciones de textos. [DC 4.2.4, p. 59] Cómo se trata en la entrada: ver D11. | pendiente |
| NOR-05 | Números, siglas y extranjerismos: ver D12. | pendiente |

## 3. Silabeo

Fuente de toda la sección: [RAE/Quilis], por verificar. Las pruebas de silabeo salen de aquí.

| ID | Regla | Ejemplos | Estado |
|---|---|---|---|
| SIL-01 | Vocales abiertas: *a, e, o*. Cerradas: *i, u*. | | propuesta |
| SIL-02 | Diptongo: abierta + cerrada átona, cerrada átona + abierta, o dos cerradas distintas. Forma una sílaba. | *aire* → ai-re · *cielo* → cie-lo · *ciudad* → ciu-dad | propuesta |
| SIL-03 | Triptongo: cerrada átona + abierta + cerrada átona. Forma una sílaba. | *Uruguay* → U-ru-guay · *buey* → buey | propuesta |
| SIL-04 | Hiato: dos vocales abiertas, o cerrada tónica junto a abierta. Forman dos sílabas. | *poeta* → po-e-ta · *río* → rí-o · *país* → pa-ís | propuesta |
| SIL-05 | Una consonante entre vocales pasa a la sílaba siguiente. | *casa* → ca-sa | propuesta |
| SIL-06 | Dos consonantes se separan, salvo grupos inseparables y dígrafos. | *canto* → can-to · *perro* → pe-rro | propuesta |
| SIL-07 | Grupos inseparables: *pr, pl, br, bl, fr, fl, gr, gl, cr, cl, tr, dr*. Dígrafos *ch, ll, rr*. | *obra* → o-bra · *muchacho* → mu-cha-cho | propuesta |
| SIL-08 | Tres o más consonantes: la última (o el grupo inseparable final) pasa a la sílaba siguiente. | *instante* → ins-tan-te | propuesta |
| SIL-09 | En *que, qui, gue, gui* la *u* no suena. En *güe, güi* la *ü* sí suena y entra en el diptongo. | *queso* → que-so · *pingüino* → pin-güi-no | propuesta |
| SIL-10 | La *y* al final de palabra cuenta como vocal cerrada. | *rey* → rey · *hoy* → hoy | propuesta |
| SIL-11 | Grupo *tl*: ver D2. | | pendiente |
| SIL-12 | *h* intercalada entre vocales (¿diptongo o hiato?): ver D3. | | pendiente |
| SIL-13 | Palabras con prefijo (*subrayar*, *abrogar*): ver D4. | | pendiente |

## 4. Acento (tónicas y átonas)

| ID | Regla | Estado |
|---|---|---|
| ACE-01 | El punto de partida es el acento normal de las palabras en la pronunciación corriente. La adaptación al verso (acento rítmico) se trata aparte. [DC 5.1, p. 75] | decidida |
| ACE-02 | Con tilde: la tónica es la vocal con tilde. | propuesta |
| ACE-03 | Sin tilde: si termina en vocal, *n* o *s*, es llana (acento en la penúltima sílaba). Si termina en otra consonante, es aguda. | propuesta |
| ACE-04 | En un diptongo con vocal abierta, la tónica es la abierta. En *ui* e *iu*, la segunda vocal. | propuesta |
| ACE-05 | Monosílabos: se tratan como átonos o tónicos según una lista fija. La lista no viene en [DC]. Ver D5. | pendiente |
| ACE-06 | Adverbios en *-mente*: [DC] no define su acentuación. Ver D6. | pendiente |
| ACE-07 | Una palabra sobresdrújula se trata como aguda cuando se integra en el esquema del verso. [DC 4.3, p. 62] | decidida |
| ACE-08 | El motor calcula **solo el acento normal**. Estos fenómenos cambian el acento por razones rítmicas, y por eso son overrides del usuario y nunca automáticos: desplazamiento (sístole y diástole), doble acentuación de polisílabos, acentuación de monosílabos y desacentuación de sílabas tónicas. [DC 5.1, pp. 75-77] | decidida |
| ACE-09 | Clasificar cada acento dentro del verso como rítmico, extrarrítmico o antirrítmico es información opcional (v2). [DC 5.3, pp. 85-86] | decidida |

## 5. Licencias

| ID | Regla | Estado |
|---|---|---|
| LIC-01 | **Sinalefa**: por defecto, la vocal final de una palabra y la vocal inicial de la siguiente forman una sola sílaba métrica. Dos vocales siempre pueden unirse. Si no se unen, es por razones de énfasis o de lugar en el verso. [DC 4.2.1, p. 55] | decidida |
| LIC-02 | Tres o más vocales de palabras distintas solo forman sílaba si van de la más abierta a la más cerrada, de la más cerrada a la más abierta, o con la más abierta en el centro. No se unen si la más cerrada está en el centro. [DC 4.2.1, p. 55] | decidida |
| LIC-03 | Con las conjunciones *e, o, y* en el interior de un grupo de tres vocales, la sinalefa triple es posible pero violenta. Por defecto no se aplica, y sí se aplica la sinalefa de dos vocales. [DC 4.2.1, pp. 55-56] Revisa D7. | propuesta |
| LIC-04 | La *h* muda no impide la sinalefa. La *h* aspirada (la que viene de una *f* latina en poesía antigua) sí la impide. Por defecto: *h* muda. [DC 4.2.1, p. 56] Revisa D9. | decidida |
| LIC-05 | La sinalefa puede cruzar pausas ortográficas (coma, punto y coma, punto y seguido o aparte). [DC 4.2.1, pp. 56-57] | decidida |
| LIC-06 | **Hiato (dialefa)**: pronunciar en sílabas distintas la vocal final y la inicial de palabras contiguas. Un acento rítmico muy marcado en una de las dos vocales suele favorecerlo. **No es automático**: es un override del usuario. [DC 4.2.2, p. 58] | decidida |
| LIC-07 | **Sinéresis**: unir en una sílaba dos vocales contiguas en el interior de una palabra que no forman diptongo (*Faetón* → fae-tón). **No es automática**: override del usuario. [DC 4.2.3, p. 58] | decidida |
| LIC-08 | **Diéresis**: deshacer un diptongo en dos sílabas (*süave*, *rüido*). **No es automática**: override del usuario. [DC 4.2.4, p. 59] | decidida |
| LIC-09 | Sinalefa entre versos y entre personajes en teatro: fuera de alcance de la v1. [DC 4.2.1, p. 57; 4.4] | decidida |
| LIC-10 | ¿Bloquear la sinalefa cuando la vocal final es tónica y cae en un acento rítmico? Ver D7. | pendiente |

## 6. Cómputo silábico

| ID | Regla | Estado |
|---|---|---|
| COM-01 | El número de sílabas métricas es el de sílabas fonéticas tras aplicar las licencias vigentes (por defecto y overrides). | decidida |
| COM-02 | El final llano (acento en la penúltima sílaba) es el modelo. Si el verso termina en palabra **aguda**, se **suma 1**. Si termina en **esdrújula**, se **resta 1**. [DC 4.3, p. 60] | decidida |
| COM-03 | La sobresdrújula final cuenta como aguda (suma 1). [DC 4.3, p. 62] | decidida |
| COM-04 | La misma equivalencia vale al final del primer hemistiquio de los versos compuestos. Cesura y hemistiquios: fuera de alcance de la v1 (D14). [DC 4.3, p. 61] | pendiente |
| COM-05 | La salida del cómputo incluye el total de sílabas fonéticas y el total de sílabas métricas, para poder mostrar los dos. | propuesta |

## 7. Ritmo (sugerencia con confianza, no clasificación firme)

[DC] advierte que el análisis por cláusulas rítmicas (pies) tiene límites. Funciona bien en la versificación silabotónica y tónica, pero en la silábica (octosílabos, endecasílabos tradicionales) la regularidad acentual es una elección estilística del autor, no una exigencia del verso. [DC 5.2.4, p. 84] Por eso el motor **sugiere** un patrón y reporta un grado de confianza.

| ID | Regla | Estado |
|---|---|---|
| RIT-01 | El motor construye el vector de acentos del verso: una posición por sílaba métrica, tónica o átona. La notación es *o* (átona) y *ó* (tónica). [DC 5.1, p. 76] | decidida |
| RIT-02 | La penúltima sílaba métrica es siempre tónica, y su acento es siempre rítmico. [DC 5.3, p. 85] | decidida |
| RIT-03 | Yámbico: acentos en sílabas pares. [DC 5.3, p. 85] | decidida |
| RIT-04 | Dactílico: acentos en 1.ª, 4.ª, 7.ª, 10.ª. Anfibráquico: 2.ª, 5.ª, 8.ª, 11.ª. Anapéstico: 3.ª, 6.ª, 9.ª, 12.ª. [DC 5.2.4, nota 60, p. 83] | decidida |
| RIT-05 | Trocaico: acentos en sílabas impares. No viene en los pasajes leídos. Se propone por simetría con el yámbico. | propuesta |
| RIT-06 | Endecasílabo: yámbico si lleva acento en la 6.ª, o en la 4.ª y la 8.ª. Dactílico si lleva acento en la 4.ª y la 7.ª. [DC 5.3, p. 85] | decidida |
| RIT-07 | La etiqueta lleva una confianza. Cómo se calcula y qué umbrales se usan: ver D10. | pendiente |
| RIT-08 | En versos silábicos (por ejemplo octosílabos) la etiqueta es solo informativa. | decidida |

## 8. Rima

| ID | Regla | Ejemplos | Estado |
|---|---|---|---|
| RIM-01 | Rima es la igualdad o equivalencia de sonidos a partir de la vocal acentuada de la última palabra. [DC 7.1, p. 103] | | decidida |
| RIM-02 | **Consonante**: se repiten todos los sonidos desde la vocal tónica. [DC 7.1.1, p. 104] | *tesoro / lloro* (-oro) | decidida |
| RIM-03 | La rima consonante se basa en la fonología del español, no en la grafía: *b/v* y *j/g(e,i)* no impiden la consonancia. [DC 7.1.1, p. 104] | *iba / atractiva* · *dirige / dije* | decidida |
| RIM-04 | Rima consonante esdrújula (dactílica): igualdad de todos los sonidos desde la vocal tónica. [DC 7.1.1, p. 104] | | decidida |
| RIM-05 | **Asonante**: solo se repiten las vocales desde la última tónica. [DC 7.1.2, p. 113] | *rojos / poros* (-oo) | decidida |
| RIM-06 | En diptongos y triptongos solo cuenta la vocal fuerte, no la semiconsonante ni la semivocal. [DC 7.1.2, p. 113] | *palo / labios* → ao · *agua / santa* → aa | decidida |
| RIM-07 | Las agudas asuenan solo con agudas. Las esdrújulas pueden asonar con llanas, ignorando la vocal postónica. [DC 7.1.2, pp. 113-114] | *bóveda / aurora* → oa | decidida |
| RIM-08 | En llanas y esdrújulas, la *i* final átona equivale a *e*, y la *u* final átona a *o*. [DC 7.1.2, p. 114] | *cáliz / calle* → ae · *espíritu / lino* → io | decidida |
| RIM-09 | Diptongos *ui / iu* en asonancia (*viuda*, *cuida*): son polivalentes, pueden asonar en una u otra vocal. Se trata como override o como opción. [DC 7.1.2, n. 89, p. 113] Ver D13. | | pendiente |
| RIM-10 | La rima refleja la pronunciación de la época. El motor usa la pronunciación moderna y no aplica distinciones fonéticas antiguas. [DC 7.1.1, pp. 104-105] | | propuesta |
| RIM-11 | Equivalencias dependientes de la variedad (seseo, yeísmo): ver D1. | | pendiente |
| RIM-12 | La rima usa el **acento efectivo** del último verso, incluyendo un override de acento del usuario (diástole, sístole). | | propuesta |
| RIM-13 | El esquema se expresa con letras por verso (ABBA). Los versos sin pareja se marcan como sueltos. Tipos de estrofa: fuera de alcance de la v1. | | propuesta |

## 9. Overrides del usuario

| ID | Regla | Estado |
|---|---|---|
| OVR-01 | Tipos de override: sinalefa (activar o desactivar), hiato, sinéresis, diéresis y acento (mover la tónica). | propuesta |
| OVR-02 | Un override se ancla a la **palabra y su número de ocurrencia dentro del verso**, no a la posición en el texto. Así sobrevive a las ediciones. | propuesta |
| OVR-03 | Prioridad: override del usuario, luego regla del SPEC. | propuesta |
| OVR-04 | Los overrides nunca modifican el texto original. | decidida |

## 10. Decisiones abiertas (tuyas)

| N.º | Decisión | Opciones y contexto |
|---|---|---|
| D1 | Variedad del español para silabeo y rima | México, español general o configurable. Afecta *seseo* (¿*casa / plaza* riman?) y *yeísmo*. [DC] no fija esto. |
| D2 | Grupo *tl* (SIL-11) | *a-tlas* (frecuente en México) o *at-las* (frecuente en España). |
| D3 | *h* intercalada (SIL-12) | ¿Impide el diptongo o se ignora? Verificar en RAE *Ortografía* 2010. |
| D4 | Prefijos (SIL-13) | ¿Se silabea por morfología o solo por reglas fonéticas? |
| D5 | Lista de monosílabos átonos (ACE-05) | Propuesta de partida: artículos, preposiciones y conjunciones breves, pronombres átonos, posesivos antepuestos. Cerrar la lista concreta con una fuente. |
| D6 | Adverbios en *-mente* (ACE-06) | Una o dos tónicas. Si *men* cuenta como tónica, afecta al ritmo y a la rima (*claramente* ~ *-ente*). [DC] no lo define. |
| D7 | Sinalefa y vocal tónica final (LIC-03, LIC-10) | Hoy: sinalefa siempre por defecto. ¿Bloquearla si la vocal final es tónica y coincide con un acento rítmico? ¿Y con las conjunciones *e, o, y*? |
| D8 | Orden de aplicación de las licencias | Primero silabeo, luego sinalefa, luego cómputo. Confirmar que no hay interacciones que obliguen a otro orden. |
| D9 | *h* aspirada (LIC-04) | Soporte solo por override del usuario, o una lista de palabras (*hermosa*, *hacer*...) para poesía antigua. |
| D10 | Confianza del ritmo (RIT-07) | Proponer: proporción de acentos que coinciden con el patrón. Definir umbrales para "alta, media, baja". |
| D11 | Marca de diéresis en la entrada (NOR-04) | ¿Se interpreta *ü* como diéresis métrica o se usa solo el override? Ojo: *ü* también es ortográfica en *pingüino*. |
| D12 | Números, siglas y extranjerismos (NOR-05) | ¿Se ignoran, se silabean por reglas o se piden al usuario? |
| D13 | Polivalencia *ui / iu* en asonancia (RIM-09) | ¿Opción global o override por pareja de versos? |
| D14 | Versos compuestos (COM-04) | ¿Cesura y hemistiquios en la v1 o v2? |

## 11. Casos de prueba derivados de este SPEC

Las pruebas que salgan de aquí deben llevar el ID de la regla en su nombre (por ejemplo `LIC-01: ...`).

| Verso | Resultado esperado | Reglas | Fuente |
|---|---|---|---|
| *Cultivo una rosa blanca* | 8 (cul-ti-vo‿u-na-ro-sa-blan-ca) | LIC-01 | [LEX] |
| *encubre el cielo y amontona el viento* | 11, con sinalefas *breel*, *ya*, *nael*. No hay sinalefa triple en *cielo y amontona*. | LIC-01, LIC-02 | [DC 4.2.1, p. 56] |
| *de súbito la ciudad* | 7 sílabas fonéticas, final agudo, total métrico 8 | COM-02 | [DC 4.3, pp. 60-61] |
| *Este pues centro era* | Por defecto: 6 (sinalefa *troe*). Con override de hiato en *centro / era*: 7. | LIC-01, LIC-06 | [DC 4.2.1, p. 55] |
| *de nocturno Faetón carroza ardiente* | Por defecto: 12 (*Faetón* con hiato). Con override de sinéresis en *Faetón*: 11. | SIL-04, LIC-07 | [DC 4.2.3, p. 58] |

Los dos últimos son pruebas de override: demuestran que el motor sugiere un número y que el usuario puede llegar al número que el poeta pretendía.

## 12. Fuera de alcance de la v1

- Cesura y hemistiquios.
- Sinalefa entre versos y entre personajes en teatro.
- Clasificación de estrofas y tipos de verso (soneto, romance, silva).
- Rima interna y otras formas de eufonía.
- Verso libre: se tratará como etiqueta informativa, no como regla cerrada.
- Otros idiomas.