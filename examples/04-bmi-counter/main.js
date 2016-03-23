import {Observable as O} from "rx"
import {run} from "@cycle/core"
import {makeDOMDriver, h} from "@cycle/dom"
import isolate from "@cycle/isolate"
import {Model, L} from "stanga"
import Slider from "./Slider"

// Let's define the model function so that it takes the parent state
// and property containing the BMI counter state. We are making this
// BMI model as a separate function so that we could re-use it if needed
function model(M, prop) {
  const bmiLens = L(
    prop,
    // if we don't have <prop> property yet, then use these default values
    L.default({weight: 80, height: 180}),
    // add "read-only" bmi property to our BMI model that is derived from weight and height
    L.augment({bmi: ({weight: w, height: h}) => Math.round(w / (h * h * 0.0001))})
  )
  return M.lens(bmiLens)
}

function main({DOM, M}) {
  // now you could create as many BMI counters as you wish e.g.
  // const bmiA$ = model(M, "a"), bmiB$ = model(M, "b"), ...
  const bmi$ = model(M, "myBMI")

  // actually nothing new here anymore..
  const weight = isolate(Slider)({DOM, M: bmi$.lens("weight"), title: "Weight", min: 50, max: 150})
  const height = isolate(Slider)({DOM, M: bmi$.lens("height"), title: "Height", min: 100, max: 220})

  const vdom$ = O.combineLatest(bmi$, weight.DOM, height.DOM, ({bmi}, weight, height) =>
    h("div", [
      weight, height,
      h("h2", `BMI is ${bmi.toFixed(2)}`)
    ]))

  return {
    DOM: vdom$,
    M: O.merge(weight.M, height.M)
  }
}

run(main, {
  DOM: makeDOMDriver("#app"),
  M: Model({})
})
