import { compose, F, partialRight, prop, T } from 'ramda'
import { BuildInOperators, Operators } from './operator'

export type MatcherFunction = (entity: any) => boolean

const exprRegexp = /^\s*(\w+)\s*([=><!#@$%^*~]+)\s*(.+?)\s*$/

const noMatchAnyFunction = F
const matchAnyFunction = T

export function composeMatcherFunction(
    operator: string,
    dimension: string,
    value: MatcherAllowedValueType,
    ops: Operators,
): MatcherFunction {
    let operation = prop(operator, BuildInOperators)
    if (!operation) {
        operation = prop(operator, ops)
    }
    if (operation) {
        return compose(partialRight(operation, [value]), prop(dimension))
    }
    return noMatchAnyFunction
}

export type MatcherAllowedValueType = string | number | boolean | RegExp

export interface Matcher {
    dimension: string
    operator: string,
    value: MatcherAllowedValueType,
    match: (entity: any) => boolean,
}

export function compileExpression(expr: string, ops: Operators = {}): Matcher {
    expr = expr.trim()
    const matches = expr.match(exprRegexp)
    let dimension = ''
    let operator = ''
    let value: MatcherAllowedValueType = ''
    let match: MatcherFunction = matchAnyFunction
    if (!matches) {
        if (expr.length) {
            dimension = expr
        }
    } else {
        dimension = parseExpressionValue(matches[1]).toString()
        operator = matches[2]
        value = parseExpressionValue(matches[3])
        match = composeMatcherFunction(operator, dimension, value, ops)
    }

    return {
        dimension,
        match,
        operator,
        value,
    }
}

export function parseExpressionValue(value: string): MatcherAllowedValueType {
    value = value.trim()
    if (value === 'true') {
        return true
    }
    if (value === 'false') {
        return false
    }
    if (value.startsWith('"') && value.endsWith('"') || value.startsWith('\'') && value.endsWith('\'')) {
        return value.slice(1, -1)
    }

    const tryNumber = +value

    if (typeof tryNumber === 'number' && !Number.isNaN(tryNumber)) {
        return tryNumber
    }

    const tryRegexp = tryParseRegexp(value)
    return tryRegexp || value
}

export function tryParseRegexp(expr: string): RegExp | null {
    expr = expr.trim()
    if (/^\/.*\/g?i?m?u?y?$/.test(expr)) {
        try {
            const [, pattern, flags] = expr.split('/')
            return new RegExp(pattern, flags)
        } catch (e) {
            return null
        }
    }
    return null
}
