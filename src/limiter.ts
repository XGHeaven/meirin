import { minBy, reduce } from 'ramda'
import { Entity } from './entity'
import { MatcherFunction } from './matcher'
import {
    canStepIn, CompiledRule, CompiledRules, compileRule, filterRules, Rule, RuleLimitation, Rules,
} from './rule'
import { MemoryStore } from './store/memory'
import { ItemInfo, Store } from './store/store'

export interface LimiterOperatorMap {
    [op: string]: MatcherFunction
}

export interface LimiterOptions {
    store?: Store,
    rules?: Rule[],
    prefix?: string, // TODO: 这个应该放到 Store 的配置当中
    operator?: LimiterOperatorMap, // TODO
}

export interface HitStatus {
    rule: Rule,
    entity: Entity,
    allowed: boolean,
    expires: number,
    times: number,
    limit: number,
    startAt: number,
    endAt: number,
}

const findMinGroup = reduce(minBy((group: [ItemInfo, CompiledRule, RuleLimitation]) =>
    group[2].threshold - group[0].value))

function emptyStatus(entity: Entity): HitStatus {
    return {
        entity,
        allowed: true,
        endAt: Date.now(),
        expires: Infinity,
        limit: Infinity,
        rule: {
            expression: '',
            limitation: '',
        },
        startAt: Date.now(),
        times: 0,
    }
}

function limitedStatus(allowed: boolean, entity: Entity, rule: Rule, item: ItemInfo, limit: RuleLimitation) {
    return {
        allowed,
        entity,
        rule,
        endAt: item.expiredAt,
        expires: limit.duration,
        limit: limit.threshold,
        startAt: item.expiredAt - limit.duration,
        times: item.value,
    }
}

export class Limiter {
    prefix: string

    private store: Store
    private rules: CompiledRules = []

    constructor(options: LimiterOptions = {}) {
        this.store = options.store || new MemoryStore()
        this.prefix = options.prefix || ''
        this.addRule(options.rules || [])
    }

    addRule(rule: Rule | Rule[]): void {
        if (Array.isArray(rule)) {
            for (const r of rule) {
                this.addRule(r)
            }
        } else {
            this.rules.push(compileRule(rule))
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

        const itemsGroups = []

        for (const rule of filteredRules) {
            for (const [index, limitation] of rule.limitations.entries()) {
                const key = this.getStoreKey(rule, entity, index)
                let item = await this.store.get(key)
                if (!item) {
                    item = {
                        key,
                        expiredAt: limitation.duration + Date.now(),
                        value: 0,
                    }
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
                const item = await this.store.get(key)
                if (!item) {
                    continue
                }

                if (!canStepIn(item, limitation)) {
                    return limitedStatus(false, entity, rule.rule, item, limitation)
                }
            }
        }

        const promises = []

        for (const rule of filteredRules) {
            for (const [index, limitation] of rule.limitations.entries()) {
                const key = this.getStoreKey(rule, entity, index)
                promises.push(this.store.inc(key, limitation.duration).then(item => [item, rule, limitation]))
            }
        }

        const itemsGroups = await Promise.all(promises)

        const [minItem, minRule, minLimitation] = findMinGroup(itemsGroups[0], itemsGroups)

        return limitedStatus(true, entity, minRule.rule, minItem, minLimitation)
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
