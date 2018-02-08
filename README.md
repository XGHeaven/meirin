# Hon Meirin (红美铃) 频率限制库

红美铃（Hon Meirin）是系列作品《东方Project》中的角色，于《东方红魔乡》首次登场。
红美铃是住在红魔馆的妖怪之一。由于是担任门卫，在红魔馆的妖怪里面是和人类接触率较高的。

> 开发中，可能会缺少文档或者文档错误，请见谅。

## Quick Start

```typescript
const { Limiter } = require('meirin')
const limiter = new Limiter({
    prefix: 'darts', // 缓存的前缀
    rules: [{
        expression: 'app_id',
        limitation: '10/1s:500/1min:10000/1h'
    }]
})

limiter.request({app_id: 'BMW'}).then(status => {
    console.log(status.allowed) // 是否允许这次访问
    console.log(status.limit) // 总共限制访问的次数
    console.log(status.expires) // 过期时间，单位 ms
    console.log(status.times) // 已经访问了多少次了
})
```

## Rule 规则

```typescript
// Rule Schema
interface Rule {
    id?: string, // 每一个规则都一个 ID，用于区分不同的规则。会自动生成
    expression: string, // 表达式规则
    limitation: string, // 限制频率和间隔
    weight?: number, // 权重
}
```

### Expression 表达式

`<维度> [操作符 值]`

- `维度` 是要进行限制的维度
- `操作符` 是进行逻辑运算的操作符
    - `=` 相等比较
    - `!=` `>=` `<=` `<` `>`
    - `可以自定义操作符`
- `值` 需要进行比较的值
    - `字符串` 用 `'` 或者 `"` 包裹
    - `正则表达式` 有 `/` 包裹，支持标志位
    - `数字` 符合 JS 数字字面量
    - `true/false` 布尔值

### Limitation 频率限制

`<次数1>/<时间1>[:<次数2>/<时间2>[...]]`

其中 `次数` 必须是整数，`时间` 符合 `ms` 包的格式

## 存储层

默认是内存存储，也可以通过继承 `Store` 进行扩展

```typescript
const {Store, Limiter} = require('meirin')

class OtherStore extends Store {
    // Overwrite methods
}

const limiter = new Limiter({
    store: new OtherStore(),
})
```

## Test

```bash
npm run test
```

## Benchmark

```bash
npm run bench
```
