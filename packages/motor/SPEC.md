# SPEC.md: reglas del motor de métrica (borrador v0.2)

Ubicación prevista: `packages/motor/SPEC.md`.

Este documento es el contrato del motor. Si una regla no está aquí, no se implementa. Cuando cambies de opinión, el orden es: SPEC, luego prueba, luego código.

**Este borrador no está cerrado.** Las decisiones abiertas están en la sección 10 y son tuyas. No implementes una regla marcada como `pendiente` hasta resolverla.

---

## 0. Cómo leer este documento

### Estados de cada regla

| Estado | Significado |
| :--- | :--- |
| `decidida` | Respaldada por una fuente que se leyó para este borrador. Aun así, revísala. |
| `propuesta` | Es la regla estándar del español o una adaptación razonable, pero no se verificó en una fuente. Necesita tu visto bueno. |
| `pendiente` | Hay una decisión abierta (ver sección 10). El motor no debe inventar la regla. |

### Fuentes

- **[DC]**: José Domínguez Caparrós, *Métrica española* (nueva edición, 2014). Se citan sección y página. Es el libro que subiste primero, y de él se leyeron los capítulos 4 (sílaba), 5 (acento) y 7.1 (rima).
- **[NE1]**: José Domínguez Caparrós, *Nuevos estudios de métrica* (Madrid, UNED, 2007). Leído completo. Obra distinta de [DC]; se cita para las reglas y decisiones que se indican.
- **[NE2]**: José Domínguez Caparrós, *Estudios de métrica* (Madrid, UNED, 1999). Leído completo. Obra distinta de [DC]; se cita para las reglas y decisiones que se indican.
- **[LEX]**: Lexiquetos, analizador de poemas (`lexiquetos.org/silio`).
- **[RAE/Quilis]**: reglas de fonética y ortografía del español general. **No se consultaron para este borrador**: toda regla que cite esto está por verificar en tus manuales (RAE *Ortografía* 2010, Quilis, Navarro Tomás).

> **Nota:** [DC] es un manual de métrica, no de fonética. Explica la sílaba métrica y sus licencias, pero **no da** las reglas básicas de silabeo, ni la lista de monosílabos átonos, ni el tratamiento de los adverbios en *-mente*. Esos puntos están marcados como `propuesta` o `pendiente`. [NE1] y [NE2] son recopilaciones de trabajos del mismo autor; se usan aquí como fuentes complementarias, no como sustitutos de [DC].

### Registro de cambios v0.1 → v0.2

- Añadidas [NE1] y [NE2] como fuentes.
- ALC-04: añadida nota sobre el marco de Jakobson (modelo/ejemplo de verso y de ejecución) como fundamento del sistema de overrides.
- ACE-08: añadidos ejemplos de acentos forzados en Unamuno ([NE1] cap. XI).
- LIC-10 (D7): añadida evidencia de sinalefa con vocal tónica en *Urna votiva* ([NE1] cap. IX).
- NOR-04 (D11): añadida propuesta concreta de tratamiento de la diéresis ([NE1] cap. VII).
- RIT-07 (D10): añadida propuesta de umbrales de confianza.
- RIM-08: añadida nota sobre el carácter normativo (no fonético) de la equivalencia i/e, u/o.
- RIM-09 (D13): añadida evidencia de polivalencia *ui/iu* ([NE2] cap. VIII).
- COM-04 (D14): añadida nota sobre cesura en interior de palabra (tmesis) ([NE2] caps. X y XI).
- Sección 11: añadidos 8 casos de prueba nuevos.
- Sección 12: añadida nota sobre rimas extrasistemáticas (rima en caída, rima potencial).

---

## 1. Alcance y convenciones

| ID | Regla | Estado |
| :--- | :--- | :--- |
| ALC-01 | El motor analiza versos en español. Un verso es una línea del texto. | `decidida` |
| ALC-02 | La sílaba métrica se establece en la cadena hablada, es decir, es un hecho fonético. No coincide siempre con la sílaba fonológica de la palabra aislada. [DC 4.2, pp. 53-55] | `decidida` |
| ALC-03 | La norma por defecto es la pronunciación culta correcta. [DC 4.2, p. 54] | `decidida` |
| ALC-04 | Las licencias (sinalefa, hiato, sinéresis, diéresis) las elige el poeta, y un mismo verso puede tener más de una escansión válida. Por eso el análisis automático es una **propuesta** y el usuario puede sobrescribirlo (sección 9). [DC 4.2.1 a 4.2.4] | `decidida` |
| ALC-05 | La cantidad (sílabas largas y breves) no se usa como factor rítmico. [DC 4.2.5, p. 60] | `decidida` |
| ALC-06 | Variedad del español: ver D1. | `pendiente` |

### Nota sobre ALC-04
El fundamento teórico de que un mismo verso admita varias escansiones está en el cuadro de Jakobson (1960), expuesto en [NE2] cap. II, pp. 19-42. Distingue cuatro conceptos:

| Concepto | Definición | Nivel |
| :--- | :--- | :--- |
| Modelo de verso (*verse design*) | Esquema abstracto de regularidades | Producción |
| Ejemplo de verso (*verse instance*) | Realización lingüística concreta | Producción |
| Modelo de ejecución (*delivery design*) | Actitud del lector: rítmica o prosaria | Recepción |
| Ejemplo de ejecución (*delivery instance*) | Recitación concreta | Recepción |

El motor produce un **ejemplo de verso** (la escansión propuesta). Los **overrides** de la sección 9 permiten al usuario adoptar un **modelo de ejecución** distinto (rítmico vs. prosario). El motor no intenta adivinar el **ejemplo de ejecución** concreto, porque eso depende del recitador. Esta distinción justifica que OVR-02 ancle los overrides a la palabra y su ocurrencia, no a la posición en el texto: el modelo de ejecución es una decisión del lector sobre palabras concretas.

---

## 2. Normalización

| ID | Regla | Estado |
| :--- | :--- | :--- |
| NOR-01 | Se compara en minúsculas. Se conservan las tildes y la diéresis ortográfica (ü). | `propuesta` |
| NOR-02 | Los signos de puntuación se quitan para silabear, pero se recuerda su posición porque la sinalefa puede cruzarlos (LIC-05). | `propuesta` |
| NOR-03 | La *h* se trata como muda por defecto. [DC 4.2.1, p. 56] | `propuesta` |
| NOR-04 | La marca de diéresis métrica (crema sobre la primera vocal, como en *süave*) puede aparecer en ediciones de textos. [DC 4.2.4, p. 59] Cómo se trata en la entrada: ver D11. | `pendiente` |
| NOR-05 | Números, siglas y extranjerismos: ver D12. | `pendiente` |

---

## 3. Silabeo

*Fuente de toda la sección: [RAE/Quilis], por verificar. Las pruebas de silabeo salen de aquí.*

| ID | Regla | Ejemplos | Estado |
| :--- | :--- | :--- | :--- |
| SIL-01 | Vocales abiertas: *a, e, o*. Cerradas: *i, u*. | — | `propuesta` |
| SIL-02 | Diptongo: abierta + cerrada átona, cerrada átona + abierta, o dos cerradas distintas. Forma una sílaba. | *aire* → ai-re<br>*cielo* → cie-lo<br>*ciudad* → ciu-dad | `propuesta` |
| SIL-03 | Triptongo: cerrada átona + abierta + cerrada átona. Forma una sílaba. | *Uruguay* → U-ru-guay<br>*buey* → buey | `propuesta` |
| SIL-04 | Hiato: dos vocales abiertas, o cerrada tónica junto a abierta. Forman dos sílabas. | *poeta* → po-e-ta<br>*río* → rí-o<br>*país* → pa-ís | `propuesta` |
| SIL-05 | Una consonante entre vocales pasa a la sílaba siguiente. | *casa* → ca-sa | `propuesta` |
| SIL-06 | Dos consonantes se separan, salvo grupos inseparables y dígrafos. | *canto* → can-to<br>*perro* → pe-rro | `propuesta` |
| SIL-07 | Grupos inseparables: *pr, pl, br, bl, fr, fl, gr, gl, cr, cl, tr, dr*. Dígrafos *ch, ll, rr*. | *obra* → o-bra<br>*muchacho* → mu-cha-cho | `propuesta` |
| SIL-08 | Tres o más consonantes: la última (o el grupo inseparable final) pasa a la sílaba siguiente. | *instante* → ins-tan-te | `propuesta` |
| SIL-09 | En *que, qui, gue, gui* la *u* no suena. En *güe, güi* la *ü* sí suena y entra en el diptongo. | *queso* → que-so<br>*pingüino* → pin-güi-no | `propuesta` |
| SIL-10 | La *y* al final de palabra cuenta como vocal cerrada. | *rey* → rey<br>*hoy* → hoy | `propuesta` |
| SIL-11 | Grupo *tl*: ver D2. | — | `pendiente` |
| SIL-12 | *h* intercalada entre vocales (¿diptongo o hiato?): ver D3. | — | `pendiente` |
| SIL-13 | Palabras con prefijo (*subrayar*, *abrogar*): ver D4. | — | `pendiente` |

---

## 4. Acento (tónicas y átonas)

| ID | Regla | Estado |
| :--- | :--- | :--- |
| ACE-01 | El punto de partida es el acento normal de las palabras en la pronunciación corriente. La adaptación al verso (acento rítmico) se trata aparte. [DC 5.1, p. 75] | `decidida` |
| ACE-02 | Con tilde: la tónica es la vocal con tilde. | `propuesta` |
| ACE-03 | Sin tilde: si termina en vocal, *n* o *s*, es llana (acento en la penúltima sílaba). Si termina en otra consonante, es aguda. | `propuesta` |
| ACE-04 | En un diptongo con vocal abierta, la tónica es la abierta. En *ui* e *iu*, la segunda vocal. | `propuesta` |
| ACE-05 | Monosílabos átonos: se tratan como átonos los de la lista siguiente, buscados por su forma escrita con tilde (minúsculas): *el, la, lo, los, las, un, del, al*; *a, con, de, en, por, sin*; *y, e, o, u, ni, que, si*; *me, te, se, nos, os, le, les*; *mi, tu, su, mis, tus, sus*; *ha, he, has, han*. Todo monosílabo no listado, o con tilde diacrítica, es tónico. | `propuesta` |
| ACE-05b | Excepción: el monosílabo que cierra el verso es siempre tónico (COM-02b, RIT-02). | `propuesta` |
| ACE-06 | Adverbios en *-mente*: llevan **dos tónicas**, la de la base adjetival y la sílaba *men*. El acento final del verso (COM-02) no cambia: *men* es la penúltima sílaba. Ver nota abajo. | `propuesta` |
| ACE-07 | Una palabra sobresdrújula se trata como aguda cuando se integra en el esquema del verso. [DC 4.3, p. 62] | `decidida` |
| ACE-08 | El motor calcula **solo el acento normal**. Estos fenómenos cambian el acento por razones rítmicas, y por eso son overrides del usuario y nunca automáticos: desplazamiento (sístole y diástole), doble acentuación de polisílabos, acentuación de monosílabos y desacentuación de sílabas tónicas. [DC 5.1, pp. 75-77] | `decidida` |
| ACE-09 | Clasificar cada acento dentro del verso como rítmico, extrarrítmico o antirrítmico es información opcional (v2). [DC 5.3, pp. 85-86] | `decidida` |

### Notas sobre ACE-05 y ACE-05b

**Lista cerrada.** La lista de ACE-05 incluye artículos (*el, la, lo, los, las, un*), la contracción *del* y el artículo indeterminado *al*; preposiciones (*a, con, de, en, por, sin*); conjunciones breves (*y, e, o, u, ni, que, si*); pronombres átonos (*me, te, se, nos, os, le, les*); posesivos antepuestos (*mi, tu, su, mis, tus, sus*); y los auxiliares del verbo *haber* (*ha, he, has, han*). Se asume la limitación conocida del motor de no desambiguar categorías gramaticales contextuales: la clasificación se hace por forma escrita, no por función sintáctica.

**Tildes diacríticas (coherencia con NOR-01).** El filtrado de átonos/tónicos se realiza sobre la forma escrita que preserva la tilde diacrítica. Por tanto, formas como *él, mí, tú, sí, té, sé, dé, qué, más* conservan su condición tónica, diferenciándose de sus homógrafos átonos (*el, mi, tu, se, de, que*).

**Excepción por posición (ACE-05b).** Todo monosílabo situado en la última posición del verso recupera o mantiene su condición tónica, independientemente de que pertenezca a la lista de átonos. Esto garantiza la compatibilidad con COM-02b (recuento de sílabas) y RIT-02 (acento rítmico en la penúltima sílaba métrica o final de verso).

**Tratamiento de *como, cual, cuyo*.** Al no estar incluidos en la lista de átonos, se consolida como comportamiento por defecto que permanecen como tónicos, sin requerir apertura de nueva decisión teórica.

**Adverbios en *-mente* (ACE-06).** Se analizan como dos unidades acentuales: la base adjetival conserva su tónica (*clára-*, *rápida-*) y la sílaba *men* es también tónica. Esto produce dos acentos en el vector de RIT-01. La consecuencia para COM-02 es nula: en *claramente* la última sílaba es *men*, que es la penúltima del verso, así que el cómputo sigue el modelo llano. La consecuencia para RIT-02 sí importa: la penúltima sílaba métrica (*men*) es tónica por RIT-02, y la tónica de la base es un acento adicional que el motor reporta como parte del vector, no como override. Si el usuario quiere leer el adverbio con una sola tónica (desacentuando *men* o la base), lo hace con un override de acento (OVR-01, ACE-08).

### Evidencia para ACE-08
[NE1] cap. XI (sonetos tridecasílabos de Unamuno, pp. 151-168) documenta sistemáticamente acentos forzados para encajar el verso en el esquema del alejandrino a la francesa: *sin-vol-vér-la-vis-tà / queés-vol-vér-laa-la-muér-te* (¡Siémbrate!, v. 10); *vá-nas-i-lu-sio-nès / aun-por-ve-nír-mar-chá-mos* (Nihil novum sub sole, v. 9). Son casos de override del usuario, no de cálculo automático.

---

## 5. Licencias

| ID | Regla | Estado |
| :--- | :--- | :--- |
| LIC-01 | **Sinalefa**: por defecto, la vocal final de una palabra y la vocal inicial de la siguiente forman una sola sílaba métrica. Dos vocales siempre pueden unirse. Si no se unen, es por razones de énfasis o de lugar en el verso. [DC 4.2.1, p. 55] | `decidida` |
| LIC-02 | Tres o más vocales de palabras distintas solo forman sílaba si van de la más abierta a la más cerrada, de la más cerrada a la más abierta, o con la más abierta en el centro. No se unen si la más cerrada está en el centro. [DC 4.2.1, p. 55] | `decidida` |
| LIC-03 | Con las conjunciones *e, o, y* en el interior de un grupo de tres vocales, la sinalefa triple es posible pero violenta. Por defecto no se aplica, y sí se aplica la sinalefa de dos vocales. [DC 4.2.1, pp. 55-56] Revisa D7. | `propuesta` |
| LIC-04 | La *h* muda no impide la sinalefa. La *h* aspirada (la que viene de una *f* latina en poesía antigua) sí la impide. Por defecto: *h* muda. [DC 4.2.1, p. 56] Revisa D9. | `decidida` |
| LIC-05 | La sinalefa puede cruzar pausas ortográficas (coma, punto y coma, punto y seguido o aparte). [DC 4.2.1, pp. 56-57] El motor **no** bloquea la sinalefa por puntuación. | `decidida` |
| LIC-06 | **Hiato (dialefa)**: pronunciar en sílabas distintas la vocal final y la inicial de palabras contiguas. Un acento rítmico muy marcado en una de las dos vocales suele favorecerlo. **No es automático**: es un override del usuario. [DC 4.2.2, p. 58] | `decidida` |
| LIC-07 | **Sinéresis**: unir en una sílaba dos vocales contiguas en el interior de una palabra que no forman diptongo (*Faetón* → fae-tón). **No es automática**: override del usuario. [DC 4.2.3, p. 58] | `decidida` |
| LIC-08 | **Diéresis**: deshacer un diptongo en dos sílabas (*süave*, *rüido*). **No es automática**: override del usuario. [DC 4.2.4, p. 59] | `decidida` |
| LIC-09 | Sinalefa entre versos y entre personajes en teatro: fuera de alcance de la v1. [DC 4.2.1, p. 57; 4.4] | `decidida` |
| LIC-10 | ¿Bloquear la sinalefa cuando la vocal final es tónica y cae en un acento rítmico? Ver D7. | `pendiente` |

---

## 6. Cómputo silábico

| ID | Regla | Estado |
| :--- | :--- | :--- |
| COM-01 | El número de sílabas métricas es el de sílabas fonéticas tras aplicar las licencias vigentes (por defecto y overrides). | `decidida` |
| COM-02 | El final llano (acento en la penúltima sílaba) es el modelo. Si el verso termina en palabra **aguda**, se **suma 1**. Si termina en **esdrújula**, se **resta 1**. [DC 4.3, p. 60] | `decidida` |
| COM-03 | La sobresdrújula final cuenta como aguda (suma 1). [DC 4.3, p. 62] | `decidida` |
| COM-04 | La misma equivalencia vale al final del primer hemistiquio de los versos compuestos. Cesura y hemistiquios: fuera de alcance de la v1 (D14). [DC 4.3, p. 61] | `pendiente` |
| COM-05 | La salida del cómputo incluye el total de sílabas fonéticas y el total de sílabas métricas, para poder mostrar los dos. | `propuesta` |

---

## 7. Ritmo (sugerencia con confianza, no clasificación firme)

[DC] advierte que el análisis por cláusulas rítmicas (pies) tiene límites. Funciona bien en la versificación silabotónica y tónica, pero en la silábica (octosílabos, endecasílabos tradicionales) la regularidad acentual es una elección estilística del autor, no una exigencia del verso. [DC 5.2.4, p. 84] Por eso el motor **sugiere** un patrón y reporta un grado de confianza.

| ID | Regla | Estado |
| :--- | :--- | :--- |
| RIT-01 | El motor construye el vector de acentos del verso: una posición por sílaba métrica, tónica o átona. La notación es *o* (átona) y *ó* (tónica). [DC 5.1, p. 76] | `decidida` |
| RIT-02 | La penúltima sílaba métrica es siempre tónica, y su acento es siempre rítmico. [DC 5.3, p. 85] | `decidida` |
| RIT-03 | Yámbico: acentos en sílabas pares. [DC 5.3, p. 85] | `decidida` |
| RIT-04 | Dactílico: acentos en 1.ª, 4.ª, 7.ª, 10.ª. Anfibráquico: 2.ª, 5.ª, 8.ª, 11.ª. Anapéstico: 3.ª, 6.ª, 9.ª, 12.ª. [DC 5.2.4, nota 60, p. 83] | `decidida` |
| RIT-05 | Trocaico: acentos en sílabas impares. No viene en los pasajes leídos. Se propone por simetría con el yámbico. | `propuesta` |
| RIT-06 | Endecasílabo: yámbico si lleva acento en la 6.ª, o en la 4.ª y la 8.ª. Dactílico si lleva acento en la 4.ª y la 7.ª. [DC 5.3, p. 85] | `decidida` |
| RIT-07 | La etiqueta lleva una confianza. Cómo se calcula y qué umbrales se usan: ver D10. | `pendiente` |
| RIT-08 | En versos silábicos (por ejemplo octosílabos) la etiqueta es solo informativa. | `decidida` |

### Evidencia para RIT-07
[NE1] cap. I (El hada manzana, p. 21) clasifica los versos en dactílico, anfibráquico, anapéstico, yámbico, compuesto, trocaico y **dudoso**. La categoría "dudoso" se aplica al verso 20, que "puede entenderse como dodecasílabo de problemática definición: anfibráquico con ruptura del ritmo por acentuar en la sílaba 9.ª en lugar de en la 8.ª". Es un precedente útil para la escala de confianza.

### Evidencia para RIT-08
[NE2] cap. X (pp. 176-177) describe la versificación de cláusulas (*Nocturno* de Silva, *Marcha triunfal* de Darío) como un tipo de versificación con "repetición de un grupo de sílabas igual con el acento siempre en el mismo lugar del grupo, en versos que difieren mucho en el número de sus sílabas". La confianza del ritmo, por tanto, se calcula sobre el vector de acentos (RIT-01), no sobre el isosilabismo. Un poema heterométrico puede tener confianza alta si los acentos caen sistemáticamente en las mismas posiciones relativas. En versificación de cláusulas con heterometría alta, la etiqueta es informativa y la confianza mide **coincidencia con el patrón**, no **percepción del patrón** (el lector puede percibirlo como verso libre).

---

## 8. Rima

| ID | Regla | Ejemplos | Estado |
| :--- | :--- | :--- | :--- |
| RIM-01 | Rima es la igualdad o equivalencia de sonidos a partir de la vocal acentuada de la última palabra. [DC 7.1, p. 103] | — | `decidida` |
| RIM-02 | **Consonante**: se repiten todos los sonidos desde la vocal tónica. [DC 7.1.1, p. 104] | *tesoro / lloro* (-oro) | `decidida` |
| RIM-03 | La rima consonante se basa en la fonología del español, no en la grafía: *b/v* y *j/g(e,i)* no impiden la consonancia. [DC 7.1.1, p. 104] | *iba / atractiva*<br>*dirige / dije* | `decidida` |
| RIM-04 | Rima consonante esdrújula (dactílica): igualdad de todos los sonidos desde la vocal tónica. [DC 7.1.1, p. 104] | — | `decidida` |
| RIM-05 | **Asonante**: solo se repiten las vocales desde la última tónica. [DC 7.1.2, p. 113] | *rojos / poros* (-oo) | `decidida` |
| RIM-06 | En diptongos y triptongos solo cuenta la vocal fuerte, no la semiconsonante ni la semivocal. [DC 7.1.2, p. 113] | *palo / labios* → ao<br>*agua / santa* → aa | `decidida` |
| RIM-07 | Las agudas asuenan solo con agudas. Las esdrújulas pueden asonar con llanas, ignorando la vocal postónica. [DC 7.1.2, pp. 113-114] | *bóveda / aurora* → oa | `decidida` |
| RIM-08 | En llanas y esdrújulas, la *i* final átona equivale a *e*, y la *u* final átona a *o*. [DC 7.1.2, p. 114] | *cáliz / calle* → ae<br>*espíritu / lino* → io | `decidida` |
| RIM-09 | Diptongos *ui / iu* en asonancia (*viuda*, *cuida*): son polivalentes, pueden asonar en una u otra vocal. Se trata como override o como opción. [DC 7.1.2, n. 89, p. 113] Ver D13. | — | `pendiente` |
| RIM-10 | La rima refleja la pronunciación de la época. El motor usa la pronunciación moderna y no aplica distinciones fonéticas antiguas. [DC 7.1.1, pp. 104-105] | — | `propuesta` |
| RIM-11 | Equivalencias dependientes de la variedad (seseo, yeísmo): ver D1. | — | `pendiente` |
| RIM-12 | La rima usa el **acento efectivo** del último verso, incluyendo un override de acento del usuario (diástole, sístole). | — | `propuesta` |
| RIM-13 | El esquema se expresa con letras por verso (ABBA). Los versos sin pareja se marcan como sueltos. Tipos de estrofa: fuera de alcance de la v1. | — | `propuesta` |

### Nota sobre RIM-08
La equivalencia i/e, u/o es una convención **normativa**, no una descripción fonética. [NE2] cap. VIII (pp. 159-160) recoge la oposición de Robles Dégano: "que en oído netamente castellano esas vocales sean equivalentes en la asonancia, aunque los poetas lo hayan practicado, ni lo entiendo ni lo admito". El motor sigue la norma, pero conviene documentar que hay tratadistas que la discuten.

### Evidencia para RIM-09
[NE2] cap. VIII (pp. 160-161) confirma el fenómeno: *individuo* asonante en *uo*; *antigua* asonante en *ua* (García Lorca, tres veces); *lluvias* asonante en *ia* (Cernuda); *música* asonante en *ia* (Altolaguirre, Pellicer); *furia* asonante en *ia* (Alfonsina Storni). Cita la tesis de Devoto: "Existe un principio básico de la rima... y es la polivalencia de toda voz en su funcionamiento como rima". No hay una solución única: el mismo verso puede asonar de dos maneras según el poeta. La opción más segura para la v1 es marcar el caso como ambiguo y pedir al usuario que elija.

---

## 9. Overrides del usuario

| ID | Regla | Estado |
| :--- | :--- | :--- |
| OVR-01 | Tipos de override: sinalefa (activar o desactivar), hiato, sinéresis, diéresis y acento (mover la tónica). | `propuesta` |
| OVR-02 | Un override se ancla a la **palabra y su número de ocurrencia dentro del verso**, no a la posición en el texto. Así sobrevive a las ediciones. | `propuesta` |
| OVR-03 | Prioridad: override del usuario, luego regla del SPEC. | `propuesta` |
| OVR-04 | Los overrides nunca modifican el texto original. | `decidida` |
| OVR-05 | Las elecciones de sinéresis/diéresis se anclan solo a la palabra. La sinéresis se aplica al último par de vocales en hiato de la palabra; la diéresis, al primer diptongo. Tras la diéresis, la tónica queda en la mitad con la vocal tónica de la palabra. Anclaje exacto: fuera de v1. | `propuesta` |

### Nota sobre OVR-01 y OVR-02
El fundamento teórico está en el cuadro de Jakobson (ver nota en ALC-04). El motor produce un *ejemplo de verso*; los overrides permiten adoptar un *modelo de ejecución* distinto. Por eso se anclan a la palabra y su ocurrencia: el modelo de ejecución es una decisión del lector sobre palabras concretas.

---

## 10. Decisiones abiertas (tuyas)

| N.º | Decisión | Opciones y contexto | Evidencia |
| :--- | :--- | :--- | :--- |
| **D1** | Variedad del español para silabeo y rima | México, español general o configurable. Afecta *seseo* (¿*casa / plaza* riman?) y *yeísmo*. [DC] no fija esto. | Sin evidencia en [NE1]/[NE2]. [NE1] cap. XII (pp. 169-182) documenta que el seseo afecta a la rima en la copla sefardí, pero no resuelve la decisión. |
| **D2** | Grupo *tl* (SIL-11) | *a-tlas* (frecuente en México) o *at-las* (frecuente en España). | Sin evidencia en [NE1]/[NE2]. |
| **D3** | *h* intercalada (SIL-12) | ¿Impide el diptongo o se ignora? Verificar en RAE *Ortografía* 2010. | Sin evidencia en [NE1]/[NE2]. |
| **D4** | Prefijos (SIL-13) | ¿Se silabea por morfología o solo por reglas fonéticas? | Sin evidencia en [NE1]/[NE2]. |
| **D5** | Lista de monosílabos átonos (ACE-05) | **Cerrada (propuesta).** Lista en ACE-05: artículos (*el, la, lo, los, las, un*), contracción *del*, artículo indeterminado *al*, preposiciones, conjunciones breves, pronombres átonos, posesivos antepuestos, y auxiliares *ha, he, has, han*. Todo monosílabo no listado o con tilde diacrítica es tónico (*como, cual, cuyo* quedan tónicos por defecto). ACE-05b: el monosílabo final del verso es siempre tónico. | Sin evidencia en [NE1]/[NE2]. |
| **D6** | Adverbios en *-mente* (ACE-06) | **Cerrada: dos tónicas.** La base adjetival conserva su tónica y *men* es tónica. COM-02 no cambia (*men* es la penúltima). RIT-01 incluye ambas; RIT-02 se cumple por *men*. La rima se calcula desde la última tónica efectiva (*men*), por lo que *claramente* rima en *-ente*. Desacentuar una de las dos tónicas es override (OVR-01, ACE-08). | Sin evidencia en [NE1]/[NE2]. |
| **D7** | Sinalefa y vocal tónica final (LIC-03, LIC-10) | **Cerrada: no bloquear.** La sinalefa se aplica por defecto aunque la vocal final sea tónica o cerrada con tilde (*su último* → *su‿úl*). Las conjunciones *e, o, y* siguen LIC-03 (no sinalefa triple por defecto). | **[NE1] cap. IX (Urna votiva, pp. 136-137)** documenta sinalefas con vocal tónica sin problema. La evidencia apoya mantener LIC-01 y tratar D7 como override, no como bloqueo automático. |
| **D8** | Orden de aplicación de las licencias | Primero silabeo, luego sinalefa, luego cómputo. Confirmar que no hay interacciones que obliguen a otro orden. | Sin evidencia en [NE1]/[NE2]. |
| **D9** | *h* aspirada (LIC-04) | Soporte solo por override del usuario, o una lista de palabras (*hermosa*, *hacer*...) para poesía antigua. | Sin evidencia en [NE1]/[NE2]. |
| **D10** | Confianza del ritmo (RIT-07) | Proponer: proporción de acentos que coinciden con el patrón. Definir umbrales para "alta, media, baja". | **[NE1] cap. I (p. 21)** y **[NE2] cap. X (pp. 176-177)**. Propuesta concreta abajo. |
| **D11** | Marca de diéresis en la entrada (NOR-04) | ¿Se interpreta *ü* como diéresis métrica o se usa solo el override? Ojo: *ü* también es ortográfica en *pingüino*. | **[NE1] cap. VII (pp. 101-125)**. Propuesta concreta abajo. |
| **D12** | Números, siglas y extranjerismos (NOR-05) | ¿Se ignoran, se silabean por reglas o se piden al usuario? | Sin evidencia en [NE1]/[NE2]. |
| **D13** | Polivalencia *ui / iu* en asonancia (RIM-09) | ¿Opción global o override por pareja de versos? | **[NE2] cap. VIII (pp. 160-161)** confirma que es genuinamente ambiguo. Recomendación: override por pareja de versos u opción global. |
| **D14** | Versos compuestos (COM-04) | ¿Cesura y hemistiquios en la v1 o v2? | **[NE2] caps. X y XI** documentan cesura en interior de palabra (tmesis). Para v1, confirmar fuera de alcance. |

### Propuestas concretas para tres decisiones

#### D11 (diéresis)
Adoptar la convención ortográfica documentada en [NE1] cap. VII, p. 124: "escribiremos diéresis cuando se deshace un diptongo o triptongo gráfico". El motor debe:
1. Interpretar *ü* como **diéresis métrica** cuando aparece en una posición donde SIL-02 predeciría un diptongo (*süave*, *rüido*, *crüel*).
2. Tratar *ü* como **ortográfica** cuando no hay diptongo posible (*pingüino*, *vergüenza*), y aplicar SIL-09.
3. Permitir que el usuario marque diéresis con un override explícito (OVR-01) sobre cualquier vocal.

#### D10 (confianza del ritmo)
Calcular la confianza como la proporción de acentos del vector (RIT-01) que coinciden con el patrón propuesto. Umbrales:
- **Alta**: ≥ 75 % de coincidencia.
- **Media**: entre 50 % y 75 %.
- **Baja / dudosa**: < 50 %, o cuando hay dos patrones con proporciones similares (diferencia < 10 puntos).
- **Sin patrón**: ningún patrón supera el 40 %.

#### D13 (*ui / iu*)
Resolver como **override por pareja de versos** o **opción global**, no como regla automática. El motor puede sugerir una lectura por defecto pero debe permitir la otra.

---

## 11. Casos de prueba derivados de este SPEC

Las pruebas que salgan de aquí deben llevar el ID de la regla en su nombre (por ejemplo `LIC-01: ...`).

| Verso | Resultado esperado | Reglas | Fuente |
| :--- | :--- | :--- | :--- |
| *Cultivo una rosa blanca* | 8 (cul-ti-vo‿u-na-ro-sa-blan-ca) | LIC-01 | [LEX] |
| *encubre el cielo y amontona el viento* | 11, con sinalefas *breel*, *ya*, *nael*. No hay sinalefa triple en *cielo y amontona*. | LIC-01, LIC-02 | [DC 4.2.1, p. 56] |
| *de súbito la ciudad* | 7 sílabas fonéticas, final agudo, total métrico 8 | COM-02 | [DC 4.3, pp. 60-61] |
| *Este pues centro era* | Por defecto: 6 (sinalefa *troe*). Con override de hiato en *centro / era*: 7. | LIC-01, LIC-06 | [DC 4.2.1, p. 55] |
| *de nocturno Faetón carroza ardiente* | Por defecto: 12 (*Faetón* con hiato). Con override de sinéresis en *Faetón*: 11. | SIL-04, LIC-07 | [DC 4.2.3, p. 58] |
| *süave* | 3 sílabas (sü-a-ve) | LIC-08, NOR-04 | [NE1] cap. VII, p. 110 |
| *rüido* | 3 sílabas (rü-i-do) | LIC-08, NOR-04 | [NE1] cap. VII, p. 121 |
| *cruel* (bisílabo) | 2 sílabas (cru-el) | LIC-08 | [NE1] cap. VII, p. 121 |
| *Sobre el caro despojo esta urna cincelo* | 13 sílabas (so-breel-ca-ro-des-po-joes-ta-ur-na-cin-ce-lo) | LIC-01, LIC-02 | [NE1] cap. IX, p. 136 |
| *viborás* (por *víboras*) | Acento desplazado a la última sílaba | ACE-08, OVR-01 | [NE1] cap. XI, p. 156 |
| *Una noche, / una noche / toda llena / de perfumes...* | 4+4+4+4 sílabas, acentos en 3.ª de cada grupo → patrón tetrasílabo con confianza alta | RIT-04, RIT-07 | [NE2] cap. X, pp. 176-177 |
| *Inclitas razas ubérrimas, sangre de Hispania fecunda* | 17 sílabas (7+10), acentos en 1, 4, 7, 10, 13, 16 → heptadecasílabo dactílico | RIT-04 | [NE2] cap. X, p. 184 |
| *La princesa está triste. ¿Qué tendrá la princesa?* | 14 sílabas (7+7), acentos en 3 y 6 de cada hemistiquio → alejandrino anapéstico | RIT-04 | [NE2] cap. II, p. 21 |
| *mi ditirambo brá / sileño es ditirambo* | 14 sílabas con tmesis en *brá/sileño* | COM-04 (v2), D14 | [NE2] cap. X, p. 173 |
| *viuda* asonante en *ia* | Asonancia ambigua: puede asonar en *ia* o en *ua* | RIM-09, D13 | [NE2] cap. VIII, p. 160 |
| *claramente* | 4 sílabas (cla-ra-men-te), dos tónicas: *cla* y *men*. Final llano, total métrico 4. | ACE-06, COM-02, RIT-01 | — |

---

## 12. Fuera de alcance de la v1

- Cesura y hemistiquios.
- Sinalefa entre versos y entre personajes en teatro.
- Clasificación de estrofas y tipos de verso (soneto, romance, silva).
- Rima interna y otras formas de eufonía.
- Verso libre: se tratará como etiqueta informativa, no como regla cerrada.
- Otros idiomas.

### Nota sobre rimas extrasistemáticas
[NE2] caps. VIII y IX (pp. 157-163) documentan dos fenómenos que el motor **no** debe intentar resolver automáticamente en v1:
- **Rima en caída** (Carvajal): *ópalo / desamparo* asonante en *ao*; *rima / óptima / última* consonante en *ima*.
- **Rima potencial** (Luis Ángel Casas, Daniel Castañeda): *noche / derroché*, *espíritu / tú*.

---

## 13. Notas de fundamentación (referencia)

Esta sección no contiene reglas; es un índice de las fuentes para las notas que aparecen dispersas en el documento.

- **Marco de Jakobson** (modelo/ejemplo de verso y de ejecución): [NE2] cap. II, pp. 19-42. Fundamento de ALC-04 y OVR-01/OVR-02.
- **Acentos forzados en Unamuno**: [NE1] cap. XI, pp. 151-168. Evidencia para ACE-08.
- **Sinalefa con vocal tónica en *Urna votiva***: [NE1] cap. IX, pp. 136-137. Evidencia para D7.
- **Diéresis**: [NE1] cap. VII, pp. 101-125. Propuesta para D11.
- **Rima y acento**: [NE2] cap. VIII, pp. 157-163. Evidencia para RIM-08 y RIM-09.
- **Versificación de cláusulas y confianza del ritmo**: [NE2] cap. X, pp. 176-177. Evidencia para RIT-07 y RIT-08.
- **Cesura en interior de palabra (tmesis)**: [NE2] caps. X y XI. Evidencia para D14.
- **Rimas extrasistemáticas**: [NE2] caps. VIII y IX. Nota en sección 12.
