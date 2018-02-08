import { MemoryStore } from '../../src/store/memory'
import { ItemInfo } from '../../src/store/store'
import { sleep } from '../utils'
import set = Reflect.set

let store: MemoryStore

beforeEach(() => {
    store = new MemoryStore()
})

describe('set value', () => {
    it('to change value', async () => {
        const key = 'Bavarian Motor Work'
        const setItem1 = await store.set(key, 1)
        expect(setItem1.value).toBe(1)
        const setItem2 = await store.set(key, 2)
        expect(setItem2.value).toBe(2)
    })

    it('with expires', async () => {
        const key = 'key'
        const value = 3
        const expires = 100
        await store.set(key, value, expires)
        const item = await store.get(key) as ItemInfo
        expect(item).not.toBeNull()
        expect(item.value).toEqual(value)
        expect(item.expires).toEqual(expires)
        await sleep(expires + 200)
        expect(await store.get(key)).toBeNull()
    })

    it('without expires default is Infinity', async () => {
        const key = 'Bavarian Motor Work'
        const value = 3
        const setItem = await store.set(key, value)
        const getItem = await store.get(key)
        expect(setItem).toEqual(getItem)
        expect(setItem.value).toBe(value)
        expect(setItem.expires).toBe(Infinity)
    })

    it('again do not change expires', async () => {
        const key = 'key'
        await store.set(key, 1, 1000)
        let item = await store.get(key) as ItemInfo
        expect(item).not.toBeNull()
        expect(item.value).toEqual(1)
        expect(item.expires).toEqual(1000)
        await store.set(key, 2)
        item = await store.get(key) as ItemInfo
        expect(item).not.toBeNull()
        expect(item.value).toEqual(2)
        expect(item.expires).toEqual(1000)
    })

    it('again change expires', async () => {
        const key = 'key'
        await store.set(key, 1, 2000)
        let item = await store.get(key) as ItemInfo
        expect(item).not.toBeNull()
        expect(item.value).toEqual(1)
        expect(item.expires).toEqual(2000)
        await store.set(key, 2, 1000)
        item = await store.get(key) as ItemInfo
        expect(item).not.toBeNull()
        expect(item.value).toEqual(2)
        expect(item.expires).toEqual(1000)
        await sleep(1200)
        expect(await store.get(key)).toBeNull()
    })
})

describe('inc a value', () => {
    const key = 'Mercedes-Benz'

    it('set value to 1 with Infinity expires if not exist, ', async () => {
        expect(await store.has(key)).toBeFalsy()
        const incItem = await store.inc(key)
        expect(incItem.value).toBe(1)
        expect(incItem.expires).toBe(Infinity)
    })

    it('with a expires if not exist, ', async () => {
        expect(await store.has(key)).toBeFalsy()
        let item = await store.inc(key, 100)
        expect(item.value).toBe(1)
        expect(item.expires).toBe(100)
        item = await store.inc(key, 100)
        expect(item.value).toBe(2)
        expect(item.expires).toBe(100)
        await sleep(100 + 100)
        item = await store.inc(key, 100)
        expect(item.value).toBe(1)
        expect(item.expires).toBe(100)
    })

    it('ignore expires when exist', async () => {
        let item = await store.inc(key, 100)
        item = await store.inc(key, 1000)
        expect(item.expires).toBe(100)
        expect(item.value).toBe(2)
        await sleep(100 + 200)
        item = await store.inc(key, 100)
        expect(item.value).toBe(1)
        expect(item.expires).toBe(100)
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
