AGENTS.md

Instrucciones operativas para agentes (IA o desarrolladores) que trabajen en este repositorio. Léelo completo antes de tocar una sola línea de código.

1. Qué es este proyecto

poetica es un editor de métrica poética en tiempo real para español. Funciona sin internet (local-first) y guarda los poemas en el dispositivo del usuario.

Se divide en dos capas estrictas:

packages/motor: librería pura de análisis métrico, sin interfaz gráfica ni efectos secundarios.

apps/web: interfaz de usuario, editor (CodeMirror 6), Web Worker y empaquetado móvil (Capacitor).

2. Lectura obligatoria antes de cualquier cambio

Antes de realizar cualquier modificación, lee los documentos en este estricto orden:

ARCHITECTURE.md — decisiones de diseño, flujo de datos, modelos y alcance.

packages/motor/SPEC.md — contrato lingüístico del motor (reglas cerradas y convenciones).

ETAPA-1.md (o el archivo de fase en curso, si existe) — tarea concreta actual.

Regla de oro: Si algo que necesitas implementar no está definido en SPEC.md, no lo inventes ni lo asumas. Detente, pregunta al usuario y espera a que la regla quede escrita en la especificación. El SPEC.md es la fuente de verdad; el código solo la implementa.

3. Reglas de trabajo (no negociables)

Prohibido modificar pruebas o el corpus:

packages/motor/tests/**

packages/motor/tests/corpus/**

Cualquier archivo *.test.ts o *.spec.ts

Estas pruebas las escribe y verifica el usuario. Si una prueba falla, el código de implementación está mal, no la prueba. Si sospechas que hay un error en una prueba, repórtalo en el chat; nunca la edites.

Prohibido generar el corpus esperado: El archivo versos.json contiene versos escandidos a mano con fuente verificada. Si la IA genera casos esperados, se validaría a sí misma y contaminaría el oráculo.

Una función/módulo a la vez: No implementes dos módulos en el mismo cambio. Termina normalizar.ts con sus pruebas en verde antes de empezar silabeo.ts, y así sucesivamente según el orden del pipeline.

No tocar módulos fuera de alcance: Si la tarea actual es silabeo.ts, no "aproveches" para refactorizar o adelantar lógica en acento.ts o licencias.ts.

No añadir dependencias sin autorización: El paquete @poetica/motor debe mantenerse libre de dependencias externas en tiempo de ejecución (zero-runtime dependencies).

No adelantar fases: Los módulos ritmo.ts y rima.ts no se implementan hasta que normalizar, silabeo, acento, licencias, escansion y computo estén completamente en verde frente al corpus verificado.

4. Filosofía del motor: candidatos, no verdades

El diseño del código debe respetar la separación entre detección y resolución:

licencias.ts detecta dónde puede existir sinalefa, hiato, sinéresis o diéresis. Devuelve una lista de Candidato con sus lecturas posibles (opciones). No toma decisiones.

escansion.ts resuelve los candidatos cruzándolos con las elecciones del usuario (Eleccion[]) para producir una escansión concreta. Debe ser pura e idempotente.

computo.ts realiza el conteo silábico (aplicando leyes de acento final: aguda +1, esdrújula -1) exclusivamente sobre una escansión ya resuelta.

Nunca fuerces al motor a "elegir por el usuario" si el SPEC.md no lo establece explícitamente. Que un verso devuelva múltiples lecturas válidas es el comportamiento esperado.

5. Convenciones de código y arquitectura

TypeScript estricto: strict: true y noUncheckedIndexedAccess: true. Prohibido el uso de any implícito o explícito; usa unknown con validación de tipos si es necesario.

Pureza en el motor: Cero efectos secundarios en packages/motor. Prohibido usar Date.now(), Math.random(), window, document, localStorage, IndexedDB o llamadas de red.

Inmutabilidad: Las funciones del motor no deben mutar los objetos o arreglos que reciben como parámetros.

Nomenclatura en español: Los archivos, tipos e identificadores del dominio poético deben escribirse en español (normalizar, silabeo, acento, licencias, escansion, computo, Candidato, Eleccion).

Contratos explícitos: Cada módulo exporta sus tipos de entrada y salida de forma clara. Nada de Record<string, any> como interfaz pública.

Comentarios con propósito: Comenta únicamente para referenciar o aclarar una regla compleja del SPEC.md (ej. // Regla SPEC 3.2: hiato acentual). No escribas comentarios obvios que repitan lo que hace el código.

Conciencia de hilos (UI/Worker): En apps/web, todo el análisis del motor debe ejecutarse dentro del Web Worker para garantizar que la escritura en CodeMirror 6 nunca se bloquee.

6. Comandos del repositorio

pnpm install                       # Instalar dependencias del workspace
pnpm --filter @poetica/motor test  # Ejecutar pruebas del motor (Vitest)
pnpm --filter @poetica/motor test:watch # Modo vigilancia para desarrollo del motor
pnpm --filter web dev              # Levantar servidor de desarrollo web
pnpm --filter web dev --host       # Levantar servidor accesible desde móvil en red local
pnpm -r test                       # Ejecutar toda la suite de pruebas del monorepo


Ningún cambio se considera válido si pnpm -r test no termina en verde.

7. Definición de "Terminado" (Checklist)

Una tarea o módulo del motor se considera terminado únicamente cuando se cumplen todos estos puntos:

[ ] La regla lingüística implementada está documentada en packages/motor/SPEC.md.

[ ] Las pruebas unitarias y del corpus correspondientes pasan al 100%.

[ ] Las pruebas de propiedades e invariantes (propiedades.test.ts) siguen pasando.

[ ] No se ha modificado ningún archivo dentro de tests/ ni tests/corpus/.

[ ] No se ha añadido ninguna dependencia no aprobada en package.json.

[ ] pnpm -r test ejecuta sin errores ni advertencias de tipos.

8. Protocolo ante imprevistos

Falta una regla en el SPEC.md: Detente y pregunta al usuario. No tomes decisiones lingüísticas por tu cuenta.

Una prueba falla y crees que el test está mal: Reporta el caso exacto en el chat explicando el porqué según el SPEC.md. No edites el test.

Aparece un caso excepcional (extranjerismo, hiato irregular, etc.): Propón el objeto JSON para packages/motor/src/excepciones.json incluyendo palabra, silabas, tonica, fuente, motivo y fecha, y espera confirmación antes de agregarlo.

Encuentras un bug: Sigue la regla "Un bug = una prueba". Pide al usuario que agregue el caso al corpus o a los tests antes de aplicar la solución en el código.

9. Límites estrictos de la v1 (Fuera de alcance)

No implementes ni prepares código para las siguientes características salvo indicación explícita del usuario:

Clasificación automática de ritmo (yámbico, trocaico, dactílico, etc.) como función estable.

Soporte para otros idiomas distintos del español.

Sincronización en la nube, cuentas de usuario o backend.

Validación estructural de formas poéticas completas (sonetos, décimas, romances) más allá de mostrar el esquema de rima por estrofa.

Reescribir ARCHITECTURE.md sin que el usuario lo solicite.