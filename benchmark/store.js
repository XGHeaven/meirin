const { MemoryStore } = require('../lib/store/memory')

suite('MemoryStore', () => {
    const map1e3 = new MemoryStore()
    const map1e4 = new MemoryStore()
    const map1e5 = new MemoryStore()
    const map1e6 = new MemoryStore()

    for (let i = 0; i < 1e3; i++) map1e3.set(i, i)
    for (let i = 0; i < 1e4; i++) map1e4.set(i, i)
    for (let i = 0; i < 1e5; i++) map1e5.set(i, i)
    for (let i = 0; i < 1e6; i++) map1e6.set(i, i)

    bench('gc:1e3', () => {
        map1e3.gc()
    })

    bench('gc:1e4', () => {
        map1e4.gc()
    })

    bench('gc:1e5', () => {
        map1e5.gc()
    })

    bench('gc:1e6', () => {
        map1e6.gc()
    })
})
