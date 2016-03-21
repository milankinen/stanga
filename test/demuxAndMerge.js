import "should"
import {Observable as O} from "rx"
import {demuxAndMerge} from "../src/index"

describe("demuxAndMerge", () => {

  it("demuxes the streams by using given keys", () => {
    const list$$ = O.empty()
    const out = demuxAndMerge(list$$, "A", "B")
    Object.keys(out).should.deepEqual(["A", "B"])
    out.A.should.be.instanceof(O)
    out.B.should.be.instanceof(O)
  })

  it("merges the values from the demuxed list", done => {
    const list$$ = O.merge(
      O.just([{A: O.of("a1_1"), B: O.of("b1_1")}, {A: O.of("a1_21", "a1_22"), B: O.of("b1_2")}]),
      O.just([{A: O.of("a2_1"), B: O.of("b2_1")}, {A: O.of("a2_2"), B: O.of("b2_2")}]).delay(1)
    )
    const out = demuxAndMerge(list$$, "A")
    out.A.bufferWithCount(5).subscribe(x => {
      x.should.deepEqual(["a1_1", "a1_21", "a1_22", "a2_1", "a2_2"])
      done()
    })
  })

})
