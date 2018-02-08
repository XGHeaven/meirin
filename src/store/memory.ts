import { ItemInfo, Store } from './store'

interface MemoryItem {
    value: number,
    createdAt: number,
    expires: number,
    modifiedAt: number,
}

export class MemoryStore extends Store {
    store: Map<string, MemoryItem> = new Map()

    constructor() {
        super()
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
        if (!await this.has(key)) { return null }
        const memItem = this.store.get(key) as MemoryItem
        return {
            key,
            ...memItem,
        }
    }

    async inc(key: string, expires?: number): Promise<ItemInfo> {
        if (!await this.has(key)) {
            return await this.set(key, 1, expires)
        }
        const memItem = this.store.get(key) as MemoryItem
        memItem.value++
        memItem.modifiedAt = Date.now()
        return {
            key,
            ...memItem,
        }
    }

    async set(key: string, times: number, expires?: number): Promise<ItemInfo> {
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

        return {
            key,
            ...memItem,
        }
    }

    async wipe(key: string) {
        return this.store.delete(key)
    }

    async clean(): Promise<void> {
        this.store.clear()
    }
}

function isAlive(memItem: MemoryItem): boolean {
    return memItem.createdAt + memItem.expires > Date.now()
}
