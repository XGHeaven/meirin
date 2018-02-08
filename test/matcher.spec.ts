import { compileExpression, MatcherAllowedValueType } from '../src/matcher'

describe('compile', () => {
    function doTest(tests: Array<{exp: string, dime: string, op: string, value: MatcherAllowedValueType}>) {
        for (const test of tests) {
            const matcher = compileExpression(test.exp)
            expect(matcher).not.toBeNull()
            if (matcher) {
                expect(matcher.dimension).toEqual(test.dime)
                expect(matcher.operator).toEqual(test.op)
                expect(matcher.value).toEqual(test.value)
            }
        }
    }

    it('without value & operator', () => {
        doTest([{
            exp: 'app',
            dime: 'app',
            value: '',
            op: '',
        }, {
            exp: ' ip ',
            dime: 'ip',
            value: '',
            op: '',
        }])
    })

    it('string value', () => {
        function buildTest(tests: Array<[string, string]>) {
            return tests.map(([expStr, value]) => ({
                value,
                exp: `e = ${expStr}`,
                op: '=',
                dime: 'e',
            }))
        }

        doTest(buildTest([
            ['"string"', 'string'],
            [' string', 'string'],
            ['"string\""', 'string"'],
            ['"string', '"string'],
            ['233eef', '233eef'],
            ['9e5f', '9e5f'],
        ]))
    })

    it('number value', () => {
        function buildTest(tests: Array<[string, number]>) {
            return tests.map(([expStr, value]) => ({
                value,
                exp: `n >= ${expStr}`,
                op: '>=',
                dime: 'n',
            }))
        }

        doTest(buildTest([
            ['233', 233],
            ['233.333', 233.333],
            ['2.3e3', 2.3e3],
            ['-233', -233],
            ['-2.3E3', -2.3e3],
        ]))
    })

    it('boolean value', () => {
        function buildTest(tests: Array<[string, boolean]>) {
            return tests.map(([exp, bool]) => ({
                value: bool,
                exp: `bool = ${bool}`,
                op: '=',
                dime: 'bool',
            }))
        }

        doTest(buildTest([
            ['true', true],
            ['false', false],
        ]))
    })

    it('regexp value', () => {
        function buildTests(tests: RegExp[]) {
            return tests.map(regexp => ({
                value: regexp,
                exp: `regexp = ${regexp.toString()}`,
                op: '=',
                dime: 'regexp',
            }))
        }

        doTest(buildTests([
            /^bala$/,
            /^balala/i,
            /^haha$/im,
        ]))
    })

    it('op', () => {
        function buildTest(tests: string[]) {
            return tests.map(op => ({
                op,
                exp: `app ${op} value`,
                dime: 'app',
                value: 'value',
            }))
        }

        doTest(buildTest([
            // build in support
            '=',
            '>=',
            '<=',
            '!=',
            '>',
            '<',
            // custom
            '==',
            '<>',
            '><',
        ]))
    })

    it('match', () => {
        const dime = 'app'
        const tests = {
            '': [
                [],
                ['123', '333', 333, /foo/gi, false, true],
            ],
            '= 1': [
                // false case
                ['budui', 'hai shi bu dui', 2, 3, /bye/, false, true],
                // true case
                [1],
            ],
            '= \'yes\'': [
                ['budui', 'haibu dui', 2, 3, /no/, false, true],
                ['yes'],
            ],
            '>= 10': [
                [],
                [10, 20, 30],
            ],
        }

        for (const [expr, cases] of Object.entries(tests)) {
            const matcher = compileExpression(`app ${expr}`)
            expect(matcher).not.toBeNull()
            if (!matcher) {
                return
            }
            for (const falseCase of cases[0]) {
                expect(matcher.match({
                    app: falseCase,
                })).toBeFalsy()
            }

            for (const trueCase of cases[1]) {
                expect(matcher.match({
                    app: trueCase,
                })).toBeTruthy()
            }
        }
    })
})

describe.skip('custom matcher', () => {
    // TODO
})

describe.skip('custom operator', () => {
    // TODO
})
