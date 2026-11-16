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
