export type OperatorFunction = (valueA: any, valueB: any) => boolean

export interface Operators {
    [op: string]: OperatorFunction | undefined
}

export const BuildInOperators: Operators = {
    '!=': (a: any, b: any) => a !== b,
    '<': (a: any, b: any) => a < b,
    '<=': (a: any, b: any) => a <= b,
    '=': (a: any, b: any) => a === b,
    '>': (a: any, b: any) => a > b,
    '>=': (a: any, b: any) => a >= b,
}
