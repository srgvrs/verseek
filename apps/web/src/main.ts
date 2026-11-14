import { montarEditor } from "./editor";

console.log("verseek web — arrancando");

const app = document.querySelector<HTMLElement>("#app");
if (app === null) {
  throw new Error('No se encontró el contenedor "#app" en el DOM.');
}

montarEditor(app);
console.log("verseek web — editor montado");
