import { MemoryStore } from '../../src'
import { ItemInfo } from '../../src/store/store'
import { loop, loop$, sleep } from '../utils'

let store: MemoryStore

beforeEach(() => {
    store = new MemoryStore()
})

describe('get', async () => {
    it('should return 0 if key not exist', async () => {
        expect(await store.get('key')).toBe(0)
    })
})

describe('set value', () => {
    it('to change value', async () => {
        const key = 'Bavarian Motor Work'
        const setItem1 = await store.set(key, 1)
        expect(setItem1).toBe(1)
        const setItem2 = await store.set(key, 2)
        expect(setItem2).toBe(2)
    })

    it('with expires', async () => {
        const key = 'key'
        const value = 3
        const expires = 100
        await store.set(key, value, expires)
        const item = await store.get(key)
        expect(item).toEqual(value)
        await sleep(expires + 200)
        expect(await store.get(key)).toBe(0)
    })

    it('without expires default is Infinity', async () => {
        const key = 'Bavarian Motor Work'
        const value = 3
        const setItem = await store.set(key, value)
        const getItem = await store.get(key)
        expect(setItem).toEqual(getItem)
        expect(setItem).toBe(value)
    })

    it('again do not change expires', async () => {
        const key = 'key'
        await store.set(key, 1, 1000)
        let item = await store.get(key)
        expect(item).toEqual(1)
        await store.set(key, 2)
        item = await store.get(key)
        expect(item).toEqual(2)
    })

    it('again change expires', async () => {
        const key = 'key'
        await store.set(key, 1, 2000)
        let item = await store.get(key)
        expect(item).toEqual(1)
        await store.set(key, 2, 1000)
        item = await store.get(key)
        expect(item).toEqual(2)
        await sleep(1200)
        expect(await store.get(key)).toBe(0)
    })
})

describe('inc a value', () => {
    const key = 'Mercedes-Benz'

    it('set value to 1 with Infinity expires if not exist, ', async () => {
        expect(await store.has(key)).toBeFalsy()
        const incItem = await store.inc(key)
        expect(incItem).toBe(1)
    })

    it('with a expires if not exist, ', async () => {
        expect(await store.has(key)).toBeFalsy()
        let item = await store.inc(key, 100)
        expect(item).toBe(1)
        item = await store.inc(key, 100)
        expect(item).toBe(2)
        await sleep(100 + 100)
        item = await store.inc(key, 100)
        expect(item).toBe(1)
    })

    it('ignore expires when exist', async () => {
        let item = await store.inc(key, 100)
        item = await store.inc(key, 1000)
        expect(item).toBe(2)
        await sleep(100 + 200)
        item = await store.inc(key, 100)
        expect(item).toBe(1)
    })
})

describe('check if has a value', () => {
    const key = 'Porsche AG'

    async function checkExist() {
        expect(await store.has(key)).toBeTruthy()
    }

    async function checkNoExist() {
        expect(await store.has(key)).toBeFalsy()
    }

    it('Infinity item always return true', async () => {
        await store.set(key, 1)
        await checkExist()
        await sleep(1000)
        await checkExist()
    })

    it('with expires but still valid should return true', async () => {
        await store.set(key, 1, 200)
        await checkExist()
        await sleep(100)
        await checkExist()
        await sleep(150)
        await checkNoExist()
    })
})

it('wipe', async () => {
    const key1 = 'Ferrari'
    const key2 = 'Ferrari2'
    await store.inc(key1)
    await store.inc(key2)
    expect(await store.has(key1)).toBeTruthy()
    expect(await store.has(key2)).toBeTruthy()
    await store.wipe(key1)
    expect(await store.has(key1)).toBeFalsy()
    expect(await store.has(key2)).toBeTruthy()
})

it('clean', async () => {
    const key1 = 'Bentley1'
    const key2 = 'Bentley2'
    await store.inc(key1)
    await store.inc(key2)
    await store.clean()
    expect(await store.has(key1)).toBeFalsy()
    expect(await store.has(key2)).toBeFalsy()
})

describe('gc', () => {
    it('gc',  async () => {
        await loop$(100, async i => {
            await store.set(`key${i}`, i, 1000)
        })
        await sleep(1000)
        store.gc()
        expect(store.store.size).toBe(0)
    })

    it('run gc after call #set several times', async () => {
        store = new MemoryStore({
            gcCounter: 10,
        })
        const gcMock = jest.fn()
        store.gc = gcMock
        await loop$(10, async i => {
            await store.set(`key${i}`, i)
        })

        expect(gcMock.mock.calls.length).toBe(1)
        expect(store.counter).toBe(0)
    })
})
