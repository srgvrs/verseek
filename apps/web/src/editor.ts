import { EditorView, basicSetup } from "codemirror";
import { StateEffect, StateField } from "@codemirror/state";
import {
  Decoration,
  WidgetType,
  type DecorationSet,
} from "@codemirror/view";

/**
 * Efecto que reemplaza el mapa de métricas por línea.
 * Clave: nº de línea (0-based). Valor: sílabas métricas finales.
 */
export const setMetricas = StateEffect.define<ReadonlyMap<number, number>>();

class MetricaWidget extends WidgetType {
  constructor(readonly n: number) {
    super();
  }

  eq(otro: WidgetType): boolean {
    return otro instanceof MetricaWidget && otro.n === this.n;
  }

  toDOM(): HTMLElement {
    const span = document.createElement("span");
    span.className = "cm-metrica";
    span.textContent = ` ${this.n}`;
    return span;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

const widgetMetrica = (n: number): Decoration =>
  Decoration.widget({ widget: new MetricaWidget(n), side: 1 });

const campoMetricas = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    let next = deco.map(tr.changes);
    for (const e of tr.effects) {
      if (!e.is(setMetricas)) continue;
      const widgets: Decoration[] = [];
      const doc = tr.state.doc;
      for (const [linea, n] of e.value) {
        if (linea < 0 || linea >= doc.lines) continue;
        const line = doc.line(linea + 1);
        widgets.push(widgetMetrica(n).range(line.to));
      }
      next = Decoration.set(widgets, true);
    }
    return next;
  },
  provide: (f) => EditorView.decorations.from(f),
});

/**
 * Monta un editor CodeMirror 6 a pantalla completa dentro de `contenedor`.
 * `alCambiar` se invoca en cada transacción que modifique el documento
 * (teclas, pegar, deshacer, comandos propios de CodeMirror, etc.).
 */
export function montarEditor(
  contenedor: HTMLElement,
  alCambiar?: () => void,
): EditorView {
  const view = new EditorView({
    doc: "",
    parent: contenedor,
    extensions: [
      basicSetup,
      campoMetricas,
      EditorView.updateListener.of((u) => {
        if (u.docChanged) alCambiar?.();
      }),
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
        ".cm-metrica": {
          color: "#888",
          fontSize: "0.85em",
          userSelect: "none",
        },
      }),
    ],
  });

  return view;
}
