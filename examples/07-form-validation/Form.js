import {Observable as O} from "rx"
import {h} from "@cycle/dom"
import {L, mergeByKeys} from "stanga"
import R from "ramda"

import {validate, ITextInput, ICheckBox, ISelect} from "./Validation"

// validations are just functions taking the current value and returning
// an observable of error messages (empty array if no errors)
const required = (msg = "Value is required") =>
  value => O.just(value ? [] : [msg])

const matches = regex => value =>
  O.just(regex.test(value) ? [] : [`Value doesnt match ${regex}`])

const requiredIf = (bool$, msg = "Value is required") => value =>
  bool$.map(b => !b || value ? [] : [msg])

// etc ...


export default function main(sources) {
  const {DOM, M} = sources

  const form$ = M.lens(L(
    "myForm",
    L.default({}),
    L.augment({
      values: fields => R.mapObjIndexed(R.prop("value"), fields)
    })
  ))
  const validators = {
    name: required(),
    gender: required("Please select gender"),
    // http://www.regular-expressions.info/creditcard.html
    card: matches(/^4[0-9]{12}(?:[0-9]{3})?$/g),
    address: requiredIf(form$.lens(R.lensPath(["shipHome", "value"])),
      "Address is required if shipping home is enabled")
  }
  const [isValid$, mods$] = validate(form$, validators)

  const name = ITextInput({
    ...sources,
    label: "Name",
    M: form$.lens(L("name", L.default({value: ""})))
  })

  const gender = ISelect({
    ...sources,
    label: "Gender",
    M: form$.lens(L("gender", L.default({value: ""}))),
    options$: O.just([
      {value: "", label: "-- Select --"},
      {value: "m", label: "Male"},
      {value: "f", label: "Female"}
    ])
  })

  const cardNumber = ITextInput({
    ...sources,
    label: "Card number (Visa)",
    M: form$.lens("card")
  })

  const shipHome = ICheckBox({
    ...sources,
    label: "Ship home?",
    M: form$.lens(L("shipHome", L.default({value: false})))
  })

  const address = ITextInput({
    ...sources,
    label: "Address",
    M: form$.lens("address")
  })

  const vdom$ = O.combineLatest(
    name.DOM, gender.DOM, cardNumber.DOM, shipHome.DOM, address.DOM, isValid$,
    (name, gender, cardNumber, shipHome, address, isFormValid) =>
      h("form", [
        name, gender, cardNumber, shipHome, address,
        h("button.submit", {disabled: !isFormValid}, "Submit")
      ]))

  const submit$ = form$
    .pluck("values")
    .map(R.compose(R.join("\n"), R.map(([k, v]) => `${k}=${v}`), R.toPairs))
    .sample(DOM.select(".submit").events("click").do(e => e.preventDefault()))

  // compose mods from child sinks
  const fieldSinks = mergeByKeys(name, gender, cardNumber, shipHome, address, {M: mods$})
  // add DOM and alert sinks from the form
  return {
    ...fieldSinks,
    DOM: vdom$,
    alert: submit$
  }
}
