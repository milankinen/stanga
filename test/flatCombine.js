import "should"
import {Observable as O} from "rx"
import {flatCombine} from "../src/index"

describe("flatCombine", () => {

  it("demuxes the streams by using given keys", () => {
    const list$$ = O.empty()
    const out = flatCombine(list$$, "A", "B")
    Object.keys(out).should.deepEqual(["A", "B"])
    out.A.should.be.instanceof(O)
    out.B.should.be.instanceof(O)
  })

  it("combines the latest value of the demuxed list", done => {
    const list$$ = O.merge(
      O.just([{A: O.of("a1_1"), B: O.of("b1_1")}, {A: O.of("a1_21", "a1_22"), B: O.of("b1_2")}]),
      O.just([{A: O.of("a2_1"), B: O.of("b2_1")}, {A: O.of("a2_2"), B: O.of("b2_2")}]).delay(1)
    )
    const out = flatCombine(list$$, "A")
    out.A.bufferWithCount(3).subscribe(x => {
      x.should.deepEqual([
        ["a1_1", "a1_21"],
        ["a1_1", "a1_22"],
        ["a2_1", "a2_2"]
      ])
      done()
    })
  })

  it("handles empty lists", done => {
    const list$$ = O.merge(
      O.just([]),
      O.just([{A: O.of("a1")}, {A: O.of("a2")}]).delay(1),
      O.just([]).delay(10)
    )
    const out = flatCombine(list$$, "A")
    out.A.bufferWithCount(3).subscribe(x => {
      x.should.deepEqual([[], ["a1", "a2"], []])
      done()
    })
  })

})
