import { EditorView, basicSetup } from "codemirror";
import { StateEffect, StateField, type Range } from "@codemirror/state";
import {
  Decoration,
  WidgetType,
  type DecorationSet,
} from "@codemirror/view";
import type { CambioLineas } from "./anclaje.js";

/**
 * Efecto que reemplaza el mapa de métricas por línea.
 * Clave: nº de línea (0-based). Valor: sílabas métricas finales.
 */
export const setMetricas = StateEffect.define<ReadonlyMap<number, number>>();

/**
 * Efecto que reemplaza los rangos de sílabas tónicas por línea.
 * Clave: nº de línea (0-based). Valor: rangos relativos al verso
 * (`inicio`/`fin` con `fin` exclusivo) de las sílabas tónicas.
 */
export const setTonicas = StateEffect.define<
  ReadonlyMap<number, ReadonlyArray<{ inicio: number; fin: number }>>
>();

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
      const widgets: Range<Decoration>[] = [];
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

const marcaTonica = Decoration.mark({ class: "cm-tonica" });

const campoTonicas = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    let next = deco.map(tr.changes);
    for (const e of tr.effects) {
      if (!e.is(setTonicas)) continue;
      const doc = tr.state.doc;
      const marcas: Range<Decoration>[] = [];
      for (const [linea, rangos] of e.value) {
        if (linea < 0 || linea >= doc.lines) continue;
        const line = doc.line(linea + 1);
        for (const r of rangos) {
          const from = line.from + r.inicio;
          const to = line.from + r.fin;
          if (from >= to) continue;
          if (from < line.from || to > line.to) continue;
          marcas.push(marcaTonica.range(from, to));
        }
      }
      marcas.sort((a, b) => a.from - b.from || a.to - b.to);
      next = Decoration.set(marcas, true);
    }
    return next;
  },
  provide: (f) => EditorView.decorations.from(f),
});

function contarSaltos(texto: string): number {
  let n = 0;
  for (let i = 0; i < texto.length; i++) {
    if (texto.charCodeAt(i) === 10) n++;
  }
  return n;
}

/**
 * §OVR-02: traduce los cambios de una transacción a `CambioLineas[]`.
 * `iterChanges` da posiciones del documento inicial; ajustamos `desde`
 * sumando el desplazamiento acumulado de líneas de los cambios previos.
 */
function cambiosDeTransaccion(
  tr: { startState: { doc: { lineAt: (pos: number) => { number: number } } }; changes: { iterChanges: (f: (fromA: number, toA: number, fromB: number, toB: number, texto: { toString: () => string }) => void) => void } },
): CambioLineas[] {
  const out: CambioLineas[] = [];
  let desplazamiento = 0;
  tr.changes.iterChanges((fromA, toA, _fromB, _toB, texto) => {
    const desdeBase = tr.startState.doc.lineAt(fromA).number - 1;
    const borradas = contarSaltos(
      (tr.startState as unknown as { doc: { sliceString: (a: number, b: number) => string } }).doc.sliceString(fromA, toA),
    );
    const insertadas = contarSaltos(texto.toString());
    out.push({
      desde: desdeBase + desplazamiento,
      borradas,
      insertadas,
    });
    desplazamiento += insertadas - borradas;
  });
  return out;
}

/**
 * Monta un editor CodeMirror 6 a pantalla completa dentro de `contenedor`.
 * `alCambiar` se invoca en cada transacción que modifique el documento
 * (teclas, pegar, deshacer, comandos propios de CodeMirror, etc.) con la
 * lista de cambios de líneas (§OVR-02).
 */
export function montarEditor(
  contenedor: HTMLElement,
  alCambiar?: (cambios: CambioLineas[]) => void,
  alMoverCursor?: () => void,
): EditorView {
  const view = new EditorView({
    doc: "",
    parent: contenedor,
    extensions: [
      basicSetup,
      campoMetricas,
      campoTonicas,
      EditorView.updateListener.of((u) => {
        if (u.docChanged) alCambiar?.(cambiosDeTransaccion(u));
        if (u.selectionSet) alMoverCursor?.();
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
        ".cm-tonica": {
          backgroundColor: "rgba(255, 214, 102, 0.35)",
          textDecoration: "underline",
          textDecorationColor: "rgba(180, 120, 0, 0.6)",
          textUnderlineOffset: "2px",
        },
      }),
    ],
  });

  return view;
}
