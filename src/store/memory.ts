import { ItemInfo, Store } from './store'

export interface MemoryItem {
    value: number,
    createdAt: number,
    expires: number,
    modifiedAt: number,
}

export interface MemoryStoreOptions {
    gcCounter?: number,
    gcLimit?: number,
    autoGc?: boolean,
}

const GcLimit = 1e4
const GcCounter = 1e3 + 7

export class MemoryStore extends Store {
    store: Map<string, MemoryItem> = new Map()
    counter: number = 0
    autoGc = true
    gcLimit = GcLimit
    gcCounter = GcCounter

    constructor(options: MemoryStoreOptions = {}) {
        super()
        this.autoGc = options.autoGc || this.autoGc
        this.gcLimit = options.gcLimit || this.gcLimit
        this.gcCounter = options.gcCounter || this.gcCounter
    }

    async has(key: string): Promise<boolean> {
        if (this.store.has(key)) {
            const memItem = this.store.get(key)
            if (memItem && isAlive(memItem)) {
                return true
            }
        }
        return false
    }

    async get(key: string) {
        if (!await this.has(key)) { return 0 }
        const memItem = this.store.get(key) as MemoryItem
        return memItem.value
    }

    async inc(key: string, expires?: number) {
        if (!await this.has(key)) {
            return await this.set(key, 1, expires)
        }
        const memItem = this.store.get(key) as MemoryItem
        memItem.value++
        memItem.modifiedAt = Date.now()
        return memItem.value
    }

    async set(key: string, times: number, expires?: number) {
        let memItem: MemoryItem | null = null
        if (this.store.has(key)) {
            memItem = this.store.get(key) as MemoryItem
            memItem.value = times
            memItem.modifiedAt = Date.now()
        }

        if (!memItem || !isAlive(memItem)) {
            const now = Date.now()
            memItem = Object.assign(memItem || {}, {
                createdAt: now,
                expires: Infinity,
                modifiedAt: now,
                value: times,
            })
            this.store.set(key, memItem)
        }

        if (typeof expires !== 'undefined') {
            memItem.expires = expires
        }

        if (this.autoGc) {
            this.counter++
            if (this.counter >= this.gcCounter) {
                this.gc()
                this.counter = 0
            }
        }

        return memItem.value
    }

    async wipe(key: string) {
        return this.store.delete(key)
    }

    async clean(): Promise<void> {
        this.store.clear()
    }

    gc() {
        const it = this.store.keys()
        const expiredKeys = []
        let count = 0
        do {
            const data = it.next()
            if (data.done) {
                break
            }
            const key = data.value
            const item = this.store.get(key) as MemoryItem

            if (!isAlive(item)) {
                expiredKeys.push(key)
                count++
            }
        } while (count < this.gcLimit)

        for (const key of expiredKeys) {
            this.store.delete(key)
        }
    }
}

function isAlive(memItem: MemoryItem): boolean {
    return memItem.createdAt + memItem.expires > Date.now()
}
