import {Observable as O} from "rx"
import {h} from "@cycle/dom"
import {mergeByKeys} from "stanga"

import CounterList from "../03-counter-list/List"
import undoable from "./undoable"


export default function main({DOM, M}) {
  const {value$: counters$, canUndo$, canRedo$, mods: {undo$, redo$}} = undoable(M)

  const list = CounterList({DOM, M: counters$})
  const vdom$ = O.combineLatest(list.DOM, canUndo$, canRedo$,
    (listVDom, canUndo, canRedo) =>
      h("div", [
        h("button.undo", {disabled: !canUndo}, "Undo"),
        h("button.redo", {disabled: !canRedo}, "Redo"),
        h("hr"),
        listVDom
      ]))

  const mod$ = O.merge(
    undo$.sample(DOM.select(".undo").events("click")),
    redo$.sample(DOM.select(".redo").events("click"))
  )

  return {
    DOM: vdom$,
    M: O.merge(mod$, list.M)
  }
}
