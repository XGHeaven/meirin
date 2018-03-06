import { HitStatus, Limiter } from '../src/limiter'
import { loop$, sleep } from './utils'

let lmt: Limiter

beforeEach(() => {
    lmt = new Limiter()
})

interface StatusAssertion extends Object {
    limit?: number,
    times?: number,
    allowed?: boolean,
    expires?: number,
}

function assertStatus(status: HitStatus, expected: StatusAssertion) {
    expect(status.allowed).toBe(!!expected.allowed)
    if (expected.hasOwnProperty('limit')) { expect(status.limit).toBe(expected.limit) }
    if (expected.hasOwnProperty('times')) { expect(status.times).toBe(expected.times) }
    if (expected.hasOwnProperty('expires')) { expect(status.expires).toBe(expected.expires) }
}

async function wantAllowed(entity: any, expected: StatusAssertion = {}) {
    const status = await lmt.request(entity)
    assertStatus(status, {
        ...expected,
        allowed: true,
    })
    return status
}

async function wantDisallowed(entity: any, expected: StatusAssertion = {}) {
    const status = await lmt.request(entity)
    assertStatus(status, {
        ...expected,
        allowed: false,
    })
    return status
}

async function wantHitAllowed(entity: any, expected: StatusAssertion = {}) {
    const status = await lmt.hit(entity)
    assertStatus(status, {
        ...expected,
        allowed: true,
    })
    return status
}

async function wantHitDisallowed(entity: any, expected: StatusAssertion = {}) {
    const status = await lmt.hit(entity)
    assertStatus(status, {
        ...expected,
        allowed: false,
    })
}

describe.skip('add rule', () => {
    // TODO
    it('single rule')
    it('rule array')
    it('overwrite rule if same id found')
})

describe('request', () => {
    it('empty rule allow all request', async () => {
        expect(lmt.getRules()).toHaveLength(0)

        const entity = {}

        for (let i = 0; i < 100; i++) {
            await wantAllowed(entity, {times: 0, expires: Infinity, limit: Infinity})
        }
    })

    it('single dimension', async () => {
        const limiter = new Limiter()
        limiter.addRule({
            expression: 'app = "app1"',
            id: '1',
            limitation: '10/1s',
        })

        const entity = {
            app: 'app1',
        }

        await loop$(10, async i => {
            const res = await limiter.request(entity)
            expect(res.allowed).toBeTruthy()
            expect(res.times).toEqual(i + 1)
        })

        const status = await limiter.request(entity)
        expect(status.allowed).toBeFalsy()
        expect(status.times).toBe(10)

        await sleep(1000 + 200)

        const newStatus = await limiter.request(entity)
        expect(newStatus.allowed).toBeTruthy()
        expect(newStatus.times).toBe(1)
    })

    it('multipart dimension', async () => {
        lmt.addRule([{
            expression: 'app',
            id: 'app_rule',
            limitation: '8/2s',
        }, {
            expression: 'ip',
            id: 'ip_rule',
            limitation: '5/1s',
        }])

        const entity = {
            app: 'Jaguar',
            ip: '127.0.0.1',
        }

        const allowed = wantAllowed.bind(null, entity)
        const disallowed = wantDisallowed.bind(null, entity)

        await loop$(5, async i => {
            await allowed({times: i + 1})
        })
        await disallowed({times: 5})

        await sleep(1000)

        await loop$(3, async i => {
            await allowed({times: 5 + i + 1})
        })
        await disallowed({times: 8})

        await sleep(1000)
    })

    it('more limitation', async () => {
        lmt.addRule({
            expression: 'app',
            id: 'app_rule',
            limitation: '10/1s:15/2s:20/3s',
        })

        const entity = {
            app: 'cheniu',
        }

        const allowed = wantAllowed.bind(null, entity)
        const disallowed = wantDisallowed.bind(null, entity)

        await loop$(10, async i => {
            await allowed({times: i + 1})
        })

        await disallowed({times: 10})

        // wait the first expires
        await sleep(1000)

        await loop$(5, async i => {
            await allowed({times: 10 + i + 1})
        })

        disallowed({times: 15, limit: 15})

        await sleep(1000)

        await loop$(5, async i => {
            await allowed({times: 15 + i + 1})
        })

        await disallowed({times: 20, limit: 20})

        await sleep(1000)

        await allowed({times: 1})
    })

    it('ignored if entity no have special dimension', async () => {
        lmt.addRule({
            expression: 'app',
            limitation: '10/1s',
        })

        await loop$(20, async i => {
            await wantAllowed({}, {times: 0, limit: Infinity})
        })

        await loop$(10, async i => {
            await wantAllowed({app: 'Automobili Lamborghini S.p.A'}, {times: i + 1})
        })

        await wantDisallowed({app: 'Automobili Lamborghini S.p.A'})
    })
})

describe('hit', () => {
    it('if no rules match get a default status', async () => {
        await loop$(20, async i => {
            await wantHitAllowed({app: 'app'}, {times: 0, limit: Infinity})
        })
    })

    it('cannot change status', async () => {
        lmt.addRule({
            expression: 'app',
            limitation: '10/1s',
        })

        const entity = {
            app: 'app',
        }

        await loop$(9, async i => {
            await wantAllowed(entity, {times: i + 1})
        })

        await loop$(5, async i => {
            await wantHitAllowed(entity, {times: 9})
        })

        await wantAllowed(entity, {times: 10})
        await wantHitDisallowed(entity, {times: 10})
    })
})
