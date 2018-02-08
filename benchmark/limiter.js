const { Limiter } = require('../')

let lmt = new Limiter()

suite('single dimension', () => {
    let lmtNoOp, lmtWithOp, lmtAlwaysReject, lmtEmptyRule
    before(() => {
        lmtNoOp = new Limiter({
            rules: [{
                expression: 'app',
                limitation: 'Infinity/10s',
            }]
        })

        lmtWithOp = new Limiter({
            rules: [{
                expression: 'app = BMW',
                limitation: 'Infinity/10s',
            }]
        })

        lmtAlwaysReject = new Limiter({
            rules: [{
                expression: 'app',
                limitation: '0/10s',
            }]
        })
    })

    bench('without operator', next => {
        lmtNoOp.request({app: 'app'}).then(next)
    })

    bench('with operator and matched', next => {
        lmtWithOp.request({app: 'BMW'}).then(next)
    })

    bench('with operator and not matched', next => {
        lmtWithOp.request({app: 'BYD'}).then(next)
    })

    bench('always reject', next => {
        lmtAlwaysReject.request({app: 'BMW'}).then(next)
    })

    bench('no rules found', next => {
        lmt.request({}).then(next)
    })
})
