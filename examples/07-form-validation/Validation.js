import {Observable as O} from "rx"
import {h} from "@cycle/dom"
import R from "ramda"
import isolate from "@cycle/isolate"

const isolatedInput = Clz => sources =>
  isolate(Clz, sources.label.replace(/[^A-Za-z0-9]/g, "").toLowerCase())(sources)


// const valid$ = form$.flatMapLatest(isFormValue(...spec...))
export const validate = (form$, spec) => {
  const mods$ = O.merge(R.toPairs(spec)
    .map(([field, validate]) => {
      const field$ = form$.lens(field)
      return field$.lens("errors").set(field$.lens("value").flatMapLatest(validate))
    }))
    .share()
  const isValid$ = O
    .combineLatest(...R.keys(spec).map(field => form$.map(f => (f[field] && f[field].errors) || [])))
    .map(R.all(R.isEmpty))
    .shareReplay(1)

  return [isValid$, mods$]
}



export const GenericInput = R.curry(({input$, change$}, sources) => {
  const {DOM, M, label} = sources
  const value$ = M.lens("value")
  const errors$ = M.lens("errors")

  const inputVdom$ = value$.flatMapLatest(v => input$(v, sources))
  const vdom$ = O.combineLatest(inputVdom$, errors$,
    (input, errors) =>
      h("label", [
        label,
        input,
        h("ul.errors", (errors || []).map(e => h("li", e)))
      ]))

  const mod$ = value$.set(change$(DOM))
  return {
    DOM: vdom$,
    M: mod$
  }
})

export const TextInput = GenericInput({
  input$: value => O.just(h("input", {type: "text", value})),
  change$: DOM => DOM.select("input").events("input").map(e => e.target.value)
})

export const CheckBox = GenericInput({
  input$: value => O.just(h("input", {type: "checkbox", checked: !!value})),
  change$: DOM => DOM.select("input").events("change").map(e => e.target.checked)
})

export const Select = GenericInput({
  input$: (value, {options$}) => options$.map(options =>
    h("select", options.map(o =>
      h("option", {selected: o.value === value}, o.label)
    ))),
  change$: DOM => DOM.select("select").events("change").map(e => e.target.value)
})


export const ITextInput = isolatedInput(TextInput)
export const ICheckBox = isolatedInput(CheckBox)
export const ISelect = isolatedInput(Select)
