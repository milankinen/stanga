import {Observable as O} from "rx"
import {h} from "@cycle/dom"
import R from "ramda"

const OPS = {
  "+": x => y => x + y,
  "-": x => y => x - y,
  "*": x => y => x * y,
  "/": x => y => x / y
}

const Calculator = R.curry(function(result, op, {DOM, M}) {
  const numpad$ = DOM.select(".num")
    .events("click")
    .map(e => e.target.textContent.trim())

  const op$ = DOM.select(".op")
    .events("click")
    .map(e => OPS[e.target.textContent.trim()])
    .share()

  const num$ = numpad$.scan(R.concat).map(Number).startWith(result).shareReplay(1)

  const Num = n => h("button.num", n.toString())
  const Op = op => h("button.op", op)

  const vdom$ = num$.map(num =>
    h("div", {style: {"font-family": "monospace"}}, [
      h("h2", num.toString()),
      h("hr"),
      h("div", [h("button.c", "C"), ...["+", "-", "*", "/"].map(Op)]),
      h("hr"),
      h("div", [Num(1), Num(2), Num(3)]),
      h("div", [Num(4), Num(5), Num(6)]),
      h("div", [Num(7), Num(8), Num(9)]),
      h("div", [Num(0)])
    ]))

  return {
    DOM: vdom$,
    M: O.merge(
      M.set(op$.withLatestFrom(num$, (next, num) => Calculator(op(num), next(op(num))))),
      M.set(DOM.select(".c").events("click").map(() => Calculator(0, R.identity)))
    )
  }
})

export default Calculator
