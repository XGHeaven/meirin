export interface ItemInfo {
    key: string,
    value: number,
    expiredAt: number,
}

export abstract class Store {
    async get(key: string): Promise<number> {
        throw new Error(`please implement ${this.constructor.name}#get method`)
    }

    async inc(key: string, expires?: number): Promise<number> {
        throw new Error(`please implement ${this.constructor.name}#inc method`)
    }

    async wipe(key: string): Promise<boolean> {
        throw new Error(`please implement ${this.constructor.name}#wipe method`)
    }

    async clean(): Promise<void> {
        throw new Error(`please implement ${this.constructor.name}#clean method`)
    }
}
