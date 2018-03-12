import { createHash } from 'crypto'
import { ascend, compose, descend, filter, path, prop, sortWith, uniqBy } from 'ramda'
import { Entity } from './entity'
import { compileExpression, Matcher } from './matcher'
import { Operators } from './operator'

import ms = require('ms')

const operators: Array<[string, number]> = [
    ['=', 100],
    ['>', 50],
    ['<', 50],
    ['<=', 50],
    ['>=', 50],
    ['', 0],
]
const operatorWeight = new Map<string, number>(operators)

export const filterRules = compose(
    uniqBy<CompiledRule, any>((path(['matcher', 'dimension']) as (obj: any) => string)),
    sortWith([ascend<CompiledRule>(path(['matcher', 'dimension'])), descend<CompiledRule>(prop('weight'))]),
    (rules: CompiledRules, entity: Entity) => filter<CompiledRule>(rule =>
        entity.hasOwnProperty(rule.matcher.dimension) && rule.matcher.match(entity))(rules),
)

export interface Rule {
    id?: string,
    expression: string,
    limitation: string,
    weight?: number,
}

export type Rules = Rule[]

export interface RuleLimitation {
    threshold: number,
    duration: number,
}

export type RuleLimitations = RuleLimitation[]

export interface CompiledRule {
    id: string,
    weight: number,
    matcher: Matcher,
    limitations: RuleLimitations,
    rule: Rule,
}

export type CompiledRules = CompiledRule[]

export function compileRule(rule: Rule, ops: Operators = {}): CompiledRule {
    let id = rule.id

    const matcher = compileExpression(rule.expression, ops)

    // if (matcher === null) {
    //     throw new Error(`Cannot compile expression "${rule.expression}"`)
    // }

    if (!id) {
        const hash = createHash('md5')
        hash.update(`${rule.expression}-${rule.limitation}`)
        id = hash.digest('hex')
    }

    return {
        id,
        matcher,
        rule,
        limitations: parseRuleLimitation(rule.limitation),
        weight: typeof rule.weight === 'number' ? rule.weight : getWeight(matcher.operator),
    }
}

function getWeight(operator: string): number {
    return operatorWeight.get(operator) || 0
}

export function parseRuleLimitation(limitation: string): RuleLimitations {
    return limitation.split(':').map(limit => {
        const [threshold, duration] = limit.split('/')
        return {
            duration: ms(duration.trim()),
            threshold: Math.floor(+threshold),
        }
    }).sort((a, b) => a.duration - b.duration)
}

export function canStepIn(times: number, limitation: RuleLimitation): boolean {
    return times < limitation.threshold
}
