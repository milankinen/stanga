import R_ from "ramda"
import L_ from "partial.lenses"
import * as Op from "./operators"
import {makeModelDriver} from "./model"


export const R = R_

export const L = L_

export const Model = makeModelDriver

export const liftListBy = Op.liftListBy

export const liftListById = Op.liftListBy.bind(null, it => it.id)

export const flatMerge = Op.flatMerge

export const flatCombine = Op.flatCombine

export const mergeByKeys = Op.mergeByKeys
