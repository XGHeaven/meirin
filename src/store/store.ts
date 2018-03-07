export interface ItemInfo {
    key: string,
    value: number,
    expiredAt: number,
}

export abstract class Store {
    async has(key: string): Promise<boolean> {
        throw new Error(`please implement ${this.constructor.name}#has method`)
    }

    async get(key: string): Promise<ItemInfo | null> {
        throw new Error(`please implement ${this.constructor.name}#get method`)
    }

    async inc(key: string, expires?: number): Promise<ItemInfo> {
        throw new Error(`please implement ${this.constructor.name}#inc method`)
    }

    async set(key: string, times: number, expires: number): Promise<ItemInfo> {
        throw new Error(`please implement ${this.constructor.name}#set method`)
    }

    async wipe(key: string): Promise<boolean> {
        throw new Error(`please implement ${this.constructor.name}#wipe method`)
    }

    async clean(): Promise<void> {
        throw new Error(`please implement ${this.constructor.name}#clean method`)
    }
}
