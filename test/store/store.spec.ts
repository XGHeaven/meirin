import { Store } from '../../src'

it('extends store should implement all methods', async () => {
    function errMsg(method: string) {
        return `please implement ExtendStore#${method} method`
    }

    class ExtendStore extends Store {
        // nothing
    }

    const store = new ExtendStore()
    const key = 'key'

    expect(store.get(key)).rejects.toThrow(errMsg('get'))
    expect(store.inc(key)).rejects.toThrow(errMsg('inc'))
    expect(store.wipe(key)).rejects.toThrow(errMsg('wipe'))
    expect(store.clean()).rejects.toThrow(errMsg('clean'))
})
