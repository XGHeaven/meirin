const { compileExpression } = require('../lib/matcher')

suite('compile express', () => {
    bench('without operator', () => {
        compileExpression('app')
    })

    bench('string value', () => {
        compileExpression('app = "ni hao"')
    })

    bench('implicit string value', () => {
        compileExpression('app = ford')
    })

    bench('number value', () => {
        compileExpression('app = 233.333e3')
    })

    bench('boolean value', () => {
        compileExpression('app = true')
    })

    bench('regexp value', () => {
        compileExpression('app = /FORD/')
    })
})
