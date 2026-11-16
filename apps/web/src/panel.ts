import type { CandidatoAnalizado } from "@verseek/motor";

export interface Panel {
  actualizar(candidatos: readonly CandidatoAnalizado[] | null): void;
}

/**
 * Crea un panel de solo lectura, fijo en la parte inferior de la ventana,
 * que muestra los candidatos de licencia del verso bajo el cursor.
 */
export function crearPanel(): Panel {
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

  function actualizar(candidatos: readonly CandidatoAnalizado[] | null): void {
    contenedor.textContent = "";
    if (candidatos === null || candidatos.length === 0) {
      const vacio = document.createElement("div");
      vacio.textContent = "Sin candidatos";
      contenedor.appendChild(vacio);
      return;
    }
    for (const c of candidatos) {
      const linea = document.createElement("div");
      const texto = `${c.tipo}: ${c.silabaA} + ${c.silabaB} (${c.silabasSin} -> ${c.silabasCon})`;
      linea.textContent = c.activo ? `● ${texto}` : texto;
      if (c.activo) {
        linea.style.fontWeight = "bold";
      }
      contenedor.appendChild(linea);
    }
  }

  return { actualizar };
}
