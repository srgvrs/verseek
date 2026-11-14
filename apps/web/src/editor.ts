import { EditorView, basicSetup } from "codemirror";

/**
 * Monta un editor CodeMirror 6 a pantalla completa dentro de `contenedor`.
 * Sin decoraciones todavía (Fase 3, Paso 3).
 */
export function montarEditor(contenedor: HTMLElement): EditorView {
  const view = new EditorView({
    doc: "",
    parent: contenedor,
    extensions: [
      basicSetup,
      EditorView.lineWrapping,
      EditorView.theme({
        "&": {
          height: "100vh",
          fontSize: "16px",
        },
        ".cm-scroller": {
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          overflow: "auto",
        },
        ".cm-content": {
          padding: "1rem",
        },
      }),
    ],
  });

  return view;
}
