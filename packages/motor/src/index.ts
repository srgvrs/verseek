export type { ResultadoNormalizacion } from "./normalizar.js";
export type { Silaba } from "./silabeo.js";
export type { ResultadoAcento, TipoAcento } from "./acento.js";
export type { Candidato, TipoLicencia } from "./licencias.js";
export type { Eleccion, Escansion, FronteraSinalefa } from "./escansion.js";
export type { Computo } from "./computo.js";
export type { Ritmo, EtiquetaRitmo } from "./ritmo.js";
export type {
  AnalisisVerso,
  CandidatoAnalizado,
  SilabaAnalizada,
} from "./analisis.js";
export { normalizar } from "./normalizar.js";
export { silabear } from "./silabeo.js";
export { clasificarAcento, esAtono } from "./acento.js";
export { detectarCandidatos } from "./licencias.js";
export { resolverEscansion } from "./escansion.js";
export { computar } from "./computo.js";
export { analizarRitmo, unidadesMetricas } from "./ritmo.js";
export { analizarVerso } from "./analisis.js";

