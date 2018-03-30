import { Rule } from '../src'
import { parseRuleLimitation, RuleLimitations, filterRules, compileRule } from '../src/rule'

describe('parse rule limitation', () => {
    interface TestLimitation {
        limitation: number,
        duration: string,
        ms: number,
    }

    function expectEqualLimitation(parsed: RuleLimitations, wanted: RuleLimitations) {
        expect(parsed).toHaveLength(wanted.length)
        expect(parsed).toEqual(wanted)
    }

    function doTest(tests: TestLimitation[][]) {
        for (const test of tests) {
            const limitationString = test.map(limit => `${limit.limitation}/${limit.duration}`).join(':')
            const parsedLimitation = parseRuleLimitation(limitationString)
            expectEqualLimitation(parsedLimitation, (test.map(limit => ({
                duration: limit.ms,
                threshold: limit.limitation,
            })).sort((a, b) => a.duration - b.duration)))
        }
    }

    it('single part', () => {
        doTest([
            [{
                duration: '10s',
                limitation: 100,
                ms: 10 * 1000,
            }],
            [{
                duration: '1min',
                limitation: 2000,
                ms: 60 * 1000,
            }],
        ])
    })

    it('multi part sort based on duration', () => {
        function buildTest(tests: TestLimitation[][]) {
            const result: TestLimitation[][] = []
            for (const test of tests) {
                let random = test.length
                while (random--) {
                    const poped = test.pop() as TestLimitation
                    test.splice(Math.floor(Math.random() * random), 0, poped)
                    result.push(JSON.parse(JSON.stringify(test)))
                }
            }
            return result
        }

        doTest(buildTest([
            [{
                duration: '10s',
                limitation: 100,
                ms: 10 * 1000,
            }, {
                duration: '1min',
                limitation: 1000,
                ms: 60 * 1000,
            }],
            [{
                duration: '10min',
                limitation: 100,
                ms: 10 * 60 * 1000,
            }, {
                duration: '1min',
                limitation: 10,
                ms: 60 * 1000,
            }, {
                duration: '10s',
                limitation: 1,
                ms: 10 * 1000,
            }],
        ]))
    })
})

describe('filterRules', async () => {
    it('single dimension rule with hold', async () => {
        const rules = [compileRule({
            expression: 'app!=hold',
            limitation: '5/1s',
        })]

        let filtered = filterRules(rules, { app: 'hold' })
        expect(filtered).toEqual([])

        filtered = filterRules(rules, { app: 'pack' })
        expect(filtered).toEqual(rules)
    })

    it('more single dimension rule with hole', async () => {
        const rules = ([{
            expression: 'app',
            limitation: '5/1s',
        }, {
            expression: 'app=hole',
            limitation: 'Infinity/Infinity',
        }] as Rule[]).map(rule => compileRule(rule))

        let filtered = filterRules(rules, { app: 'hole' })
        expect(filtered).toEqual([rules[1]])

        filtered = filterRules(rules, { app: 'packed' })
        expect(filtered).toEqual([rules[0]])
    })
})
