import { parseRuleLimitation, RuleLimitations } from '../src/rule'

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
