export interface ItemInfo {
    key: string,
    value: number,
    expires: number,
    createdAt: number,
    modifiedAt: number,
}

export abstract class Store {
    abstract async has(key: string): Promise<boolean>
    abstract async get(key: string): Promise<ItemInfo | null>
    abstract async inc(key: string, expires?: number): Promise<ItemInfo>
    abstract async set(key: string, times: number, expires: number): Promise<ItemInfo>
    abstract async wipe(key: string): Promise<boolean>
    abstract async clean(): Promise<void>
}
