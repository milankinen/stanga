import {Observable as O} from "rx"
import {h} from "@cycle/dom"
import R from "ramda"

function main({DOM, M, title, max, min}) {
  const value$ = M
  const vdom$ = value$.map(value =>
    h("div", [
      h("label", [
        title,
        h("input.val", {type: "range", max, min, value}),
        value
      ])
    ])
  )
  const resetValueMod$ =
    value$.set(DOM.select(".val").events("input").map(e => e.target.value))

  return {
    DOM: vdom$,
    M: resetValueMod$
  }
}

export default main
