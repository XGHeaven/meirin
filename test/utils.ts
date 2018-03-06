export function sleep(ms: number) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms)
    })
}

export function loop(times: number, action: (i: number) => any, start: number = 0) {
    const end = start + times
    for (let i = start; i < end; i++) {
        action(i)
    }
}

export async function loop$(times: number, action: (i: number) => Promise<any>, start: number = 0) {
    const end = start + times
    for (let i = start; i < end; i++) {
        await action(i)
    }
}
