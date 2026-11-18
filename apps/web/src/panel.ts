import type { AnalisisVerso, CandidatoAnalizado } from "@verseek/motor";

export interface Panel {
  actualizar(analisis: AnalisisVerso | null): void;
}

/**
 * Crea un panel fijo en la parte inferior de la ventana que muestra los
 * candidatos de licencia del verso bajo el cursor. Cada candidato es un
 * botón que invoca `alClicar` para alternar su estado.
 */
export function crearPanel(
  alClicar: (c: CandidatoAnalizado) => void,
  alClicarSilaba: (palabra: number, silaba: number, tonica: boolean) => void,
): Panel {
  const contenedor = document.createElement("div");
  contenedor.id = "panel-candidatos";
  contenedor.style.position = "fixed";
  contenedor.style.left = "0";
  contenedor.style.right = "0";
  contenedor.style.bottom = "0";
  contenedor.style.width = "100%";
  contenedor.style.maxHeight = "30vh";
  contenedor.style.overflowY = "auto";
  contenedor.style.background = "#fafafa";
  contenedor.style.borderTop = "1px solid #ccc";
  contenedor.style.padding = "0.5rem 1rem";
  contenedor.style.boxSizing = "border-box";
  contenedor.style.fontFamily =
    "ui-monospace, SFMono-Regular, Menlo, monospace";
  contenedor.style.fontSize = "0.85rem";
  contenedor.style.zIndex = "10";
  document.body.appendChild(contenedor);

  function actualizar(analisis: AnalisisVerso | null): void {
    contenedor.textContent = "";

    const seccionRitmo = document.createElement("div");
    seccionRitmo.style.marginBottom = "0.5rem";
    const tituloRitmo = document.createElement("div");
    tituloRitmo.textContent = "Ritmo";
    tituloRitmo.style.fontWeight = "bold";
    seccionRitmo.appendChild(tituloRitmo);

    const ritmo = analisis?.ritmo ?? null;
    if (ritmo === null) {
      const sinRitmo = document.createElement("div");
      sinRitmo.textContent = "Sin ritmo";
      seccionRitmo.appendChild(sinRitmo);
    } else {
      const lineaPatron = document.createElement("div");
      lineaPatron.textContent = `patrón: ${ritmo.patron.join("")}`;
      seccionRitmo.appendChild(lineaPatron);

      const lineaEtiqueta = document.createElement("div");
      const etiquetaTexto =
        ritmo.etiqueta === "sin-patron" ? "ritmo libre" : ritmo.etiqueta;
      lineaEtiqueta.textContent = `etiqueta: ${etiquetaTexto} (experimental)`;
      seccionRitmo.appendChild(lineaEtiqueta);

      const lineaConfianza = document.createElement("div");
      lineaConfianza.textContent = `confianza: ${ritmo.confianza} (${ritmo.nivel})`;
      seccionRitmo.appendChild(lineaConfianza);

      const lineaPosiciones = document.createElement("div");
      lineaPosiciones.textContent = `posiciones tónicas: ${ritmo.posicionesTonicas.join(", ")}`;
      seccionRitmo.appendChild(lineaPosiciones);
    }
    contenedor.appendChild(seccionRitmo);

    const seccionSilabas = document.createElement("div");
    seccionSilabas.style.marginBottom = "0.5rem";
    const tituloSilabas = document.createElement("div");
    tituloSilabas.textContent = "Sílabas";
    tituloSilabas.style.fontWeight = "bold";
    seccionSilabas.appendChild(tituloSilabas);

    if (analisis === null || analisis.silabas.length === 0) {
      const sinSilabas = document.createElement("div");
      sinSilabas.textContent = "Sin sílabas";
      seccionSilabas.appendChild(sinSilabas);
    } else {
      const lineaSilabas = document.createElement("div");
      let palabraActual = -1;
      let indiceEnPalabra = 0;
      for (const s of analisis.silabas) {
        if (s.palabra !== palabraActual) {
          if (palabraActual !== -1) {
            lineaSilabas.appendChild(document.createTextNode(" "));
          }
          palabraActual = s.palabra;
          indiceEnPalabra = 0;
        }
        const indice = indiceEnPalabra;
        indiceEnPalabra += 1;
        const boton = document.createElement("button");
        boton.type = "button";
        boton.style.background = "transparent";
        boton.style.border = "none";
        boton.style.padding = "0 0.1rem";
        boton.style.font = "inherit";
        boton.style.cursor = "pointer";
        boton.textContent = s.texto;
        if (s.tonica) {
          boton.style.fontWeight = "bold";
        }
        boton.addEventListener("click", () =>
          alClicarSilaba(s.palabra, indice, s.tonica),
        );
        lineaSilabas.appendChild(boton);
      }
      seccionSilabas.appendChild(lineaSilabas);
    }
    contenedor.appendChild(seccionSilabas);

    const candidatos = analisis?.candidatos ?? null;
    if (analisis === null || candidatos === null || candidatos.length === 0) {
      const vacio = document.createElement("div");
      vacio.textContent = "Sin candidatos";
      contenedor.appendChild(vacio);
      return;
    }
    const palabras = analisis.palabras;
    for (const c of candidatos) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.style.display = "block";
      boton.style.width = "100%";
      boton.style.textAlign = "left";
      boton.style.background = "transparent";
      boton.style.border = "none";
      boton.style.padding = "0.1rem 0";
      boton.style.font = "inherit";
      boton.style.cursor = "pointer";
      const textoA = palabras[c.palabraA]?.texto ?? "";
      const textoB = palabras[c.palabraB]?.texto ?? "";
      const texto = `${c.tipo}: ${textoA} + ${textoB} — ${c.silabaA} + ${c.silabaB} (${c.silabasSin} -> ${c.silabasCon})`;
      boton.textContent = c.activo ? `● ${texto}` : texto;
      if (c.activo) {
        boton.style.fontWeight = "bold";
      }
      boton.addEventListener("click", () => alClicar(c));
      contenedor.appendChild(boton);
    }
  }

  return { actualizar };
}
