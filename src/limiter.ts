import { minBy, reduce } from 'ramda'
import { Entity } from './entity'
import { Operators } from './operator'
import { canStepIn, CompiledRule, CompiledRules, compileRule, filterRules, Rule, RuleLimitation, Rules } from './rule'
import { MemoryStore } from './store/memory'
import { Store } from './store/store'

export interface LimiterOptions {
    store?: Store,
    rules?: Rule[],
    prefix?: string, // TODO: 这个应该放到 Store 的配置当中
    operators?: Operators,
}

export interface HitStatus {
    rule: Rule,
    entity: Entity,
    allowed: boolean,
    expires: number,
    times: number,
    limit: number,
}

type SearchGroup = [number, CompiledRule, RuleLimitation] // [times, rule, limitation]

const findMinGroup = reduce(minBy((group: SearchGroup) =>
    group[2].threshold - group[0]))

function emptyStatus(entity: Entity): HitStatus {
    return {
        entity,
        allowed: true,
        expires: Infinity,
        limit: Infinity,
        rule: {
            expression: '',
            limitation: '',
        },
        times: 0,
    }
}

function limitedStatus(allowed: boolean, entity: Entity, rule: Rule, times: number, limit: RuleLimitation) {
    return {
        allowed,
        entity,
        rule,
        times,
        expires: limit.duration,
        limit: limit.threshold,
    }
}

export class Limiter {
    prefix: string
    operators: Operators

    private store: Store
    private rules: CompiledRules = []

    constructor(options: LimiterOptions = {}) {
        this.store = options.store || new MemoryStore()
        this.prefix = options.prefix || ''
        this.operators = options.operators || {}
        this.addRule(options.rules || [])
    }

    addRule(rule: Rule | Rule[]): void {
        if (Array.isArray(rule)) {
            for (const r of rule) {
                this.addRule(r)
            }
        } else {
            const compiledRule = compileRule(rule, this.operators)
            if (this.rules.findIndex(r => r.id === compiledRule.id) !== -1) {
                throw new Error(`rule ${compiledRule.rule.expression}(${compiledRule.rule.limitation}) exists`)
            }
            this.rules.push(compiledRule)
        }
    }

    getRules(): Rules {
        return this.rules.map(rule => rule.rule)
    }

    clearRules(): void {
        this.rules = []
    }

    async hit(entity: Entity): Promise<HitStatus> {
        const filteredRules = filterRules(this.rules, entity)

        if (filteredRules.length === 0) {
            return emptyStatus(entity)
        }

        const itemsGroups: SearchGroup[] = []

        for (const rule of filteredRules) {
            for (const [index, limitation] of rule.limitations.entries()) {
                const key = this.getStoreKey(rule, entity, index)
                let item = await this.store.get(key)
                if (!item) {
                    item = 0
                }

                if (!canStepIn(item, limitation)) {
                    return limitedStatus(false, entity, rule.rule, item, limitation)
                }

                itemsGroups.push([item, rule, limitation])
            }
        }

        const [minItem, minRule, minLimitation] = findMinGroup(itemsGroups[0], itemsGroups)

        return limitedStatus(true, entity, minRule.rule, minItem, minLimitation)
    }

    async request(entity: Entity): Promise<HitStatus> {
        const filteredRules = filterRules(this.rules, entity)

        if (filteredRules.length === 0) {
            return emptyStatus(entity)
        }

        for (const rule of filteredRules) {
            for (const [index, limitation] of rule.limitations.entries()) {
                const key = this.getStoreKey(rule, entity, index)
                const times = await this.store.get(key)

                if (!times) {
                    continue
                }

                if (!canStepIn(times, limitation)) {
                    return limitedStatus(false, entity, rule.rule, times, limitation)
                }
            }
        }

        const promises = []

        for (const rule of filteredRules) {
            for (const [index, limitation] of rule.limitations.entries()) {
                const key = this.getStoreKey(rule, entity, index)
                promises
                    .push(this.store.inc(key, limitation.duration)
                        .then(times => ([times, rule, limitation] as SearchGroup)))
            }
        }

        const itemsGroups = await Promise.all(promises)

        const [minTimes, minRule, minLimitation] = findMinGroup(itemsGroups[0], itemsGroups)

        return limitedStatus(true, entity, minRule.rule, minTimes, minLimitation)
    }

    async clear(): Promise<void> {
        await this.store.clean()
    }

    async reset(): Promise<void> {
        await this.clear()
        this.clearRules()
    }

    getStoreKey(rule: CompiledRule, entity: Entity, index: number): string {
        return [this.prefix, rule.id, entity[rule.matcher.dimension], index].join('__')
    }
}
