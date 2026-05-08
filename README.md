# GRIP

**Global Registry with Interceptors Pipeline**

GRIP is a lightweight JavaScript framework for organizing, protecting, and observing the business logic of an application. It provides a central registry where every function is declared with a precise contract — input validation, core logic, output verification — and a hook system for adding cross-cutting behaviors without modifying existing code.

---

## Why use it

Business functions grow over time. The need arises to log every execution, check authorization, measure performance, validate outputs. Without a structure, these cross-cutting concerns infiltrate domain code, making functions harder to test and maintain.

GRIP separates responsibilities cleanly:

- Business code knows nothing about logging, authentication, or monitoring
- Hooks add these behaviors declaratively, without touching the registered functions
- Every execution produces a structured, predictable response
- Errors are categorized: no need to compare messages to understand what went wrong

---

## Installation

**npm**

```
npm install @leonardo.ciaccio/grip
```

```js
import { grip, register, Grip } from '@leonardo.ciaccio/grip'
```

**CDN**

```html
<script type="module">
  import { grip, register, Grip } from 'https://unpkg.com/@leonardo.ciaccio/grip'
</script>
```

```html
<script type="module">
  import { grip, register, Grip } from 'https://cdn.jsdelivr.net/npm/@leonardo.ciaccio/grip'
</script>
```

**Local**

GRIP is also a single ES module file. Import directly from the source if you prefer no build step.

```js
import { grip, register, Grip } from './core/grip.js'
```

---

## Scripts

The following commands are available from the project root:

| Command | Description |
|---------|-------------|
| `npm run build` | Minifies `core/grip.js` into `core/grip.min.js` using Terser with three compression passes and full mangling. Run this after modifying the source to keep the distributed file in sync. |
| `npm run example` | Starts a local static server and serves the examples at `http://localhost:3000`. Handles path resolution across the project so examples can import GRIP from `core/` correctly, regardless of where the command is run from. |
| `npm test` | Runs the full test suite with Jest. |
| `npm run test:watch` | Runs Jest in watch mode — re-runs affected tests on every file change. Useful during active development. |
| `npm run test:coverage` | Runs the test suite and generates a coverage report. |
| `npm run test:verbose` | Runs the test suite with full per-test output. |

---

## Examples

The `example/` directory contains four browser-based demos that show GRIP in progressively more complex scenarios — from a single guarded function to a full financial dashboard with audit logging and budget enforcement.

```
npm run example
```

This starts a local static server and serves the examples at `http://localhost:3000`. No build step, no bundler. Each example is a self-contained set of ES modules that import GRIP directly from `core/grip.js`.

| Example | Functions | Hooks | Key features |
|---------|:---------:|:-----:|--------------|
| Div Counter | 1 | 3 | rate limiter, URL guard, CORS |
| Meteo | 3 | 3 | chained pipeline, assertResult, Open-Meteo API |
| Social Feed | 8 | 5 | auth guard, ownership, content moderation, localStorage |
| Finance | 9 | 4 | budget enforcer, amount normalizer, audit log, CSV export |

Every example includes a live 3D map of the GRIP instance — functions, hooks, and their connections — rendered in real time from the inspection API.

---

## Core concepts

### The registry

GRIP maintains an internal registry of functions. Each function is registered with a unique name and a contract that defines how it should behave.

### The execution pipeline

When a function is executed with `fire()`, GRIP runs it through the following stages in order:

```
before hooks  →  guard hooks  →  null check  →  validate  →  business  →  assertResult  →  after hooks
```

- **before**: observation hooks — logging, tracing, populating the context
- **guard**: fatal hooks — authorization, rate limiting. If they throw, execution is blocked
- **validate**: input validation — throws if arguments are not acceptable
- **business**: the core logic
- **assertResult**: output validation — verifies that the result meets the expected contract
- **after**: post-execution observation hooks — always run, even on error

### The response

Every `fire()` always returns a structured object and never throws (except for programmer errors such as unregistered names):

```js
{
  isSuccess:  true | false,
  message:    'functionName | Executed successfully.' | 'functionName | error message',
  errorType:  null | 'GUARD' | 'VALIDATION' | 'BUSINESS' | 'TIMEOUT' | 'ASSERT_RESULT',
  result:     <value returned by business> | null,
  hookErrors: []  // array of { label, error } for each hook that crashed
}
```

### The context

Every execution has an empty context object (`{}`) shared across all pipeline stages. Before hooks can write to it, subsequent stages can read from it. It is the channel for passing cross-cutting data (authenticated user, trace ID, permissions) without polluting the function's arguments.

---

## Basic usage

### Registering a function

```js
import { register } from './Grip.js'

register({
  name: 'calcArea',
  validate({ side }) {
    if (typeof side !== 'number' || side <= 0)
      throw new Error('side must be a positive number.')
  },
  business({ side }) {
    return side * side
  }
})
```

### Executing a function

```js
import { grip } from './Grip.js'

const res = await grip.fire('calcArea', { side: 5 })

if (res.isSuccess) {
  console.log(res.result)      // 25
  console.log(res.message)     // 'calcArea | Executed successfully.'
} else {
  console.error(res.errorType) // 'VALIDATION', 'BUSINESS', ...
  console.error(res.message)   // 'calcArea | side must be a positive number.'
}
```

---

## Register configuration

`register(config)` accepts an object with the following properties:

| Property | Type | Required | Description |
|----------|------|:--------:|-------------|
| `name` | `string` | ✓ | Unique name for the function. Must not have leading or trailing whitespace. |
| `validate` | `function` | ✓ | Receives `(args, context)`. Throws to signal invalid input. Can be `async`. |
| `business` | `function` | ✓ | Receives `(args, context)`. Contains the core logic. The returned value becomes `response.result`. Can be `async`. |
| `assertResult` | `function` | — | Receives `(result, context)`. Throws if the result does not meet the expected contract. Can be `async`. On error, `response.result` is reset to `null`. |
| `timeout` | `number` | — | Timeout in milliseconds for the `business` phase. Must be a finite positive number. If `business` exceeds the limit, the response has `errorType: 'TIMEOUT'`. |

### Example with all options

```js
register({
  name: 'createOrder',
  timeout: 3000,

  validate({ userId, items }) {
    if (!userId) throw new Error('userId is required.')
    if (!Array.isArray(items) || items.length === 0)
      throw new Error('items must be a non-empty array.')
  },

  async business({ userId, items }, context) {
    const order = await db.orders.create({ userId, items, createdBy: context.user })
    return order
  },

  assertResult(order) {
    if (!order?.id) throw new Error('The result does not contain a valid id.')
  }
})
```

---

## Hooks

Hooks add cross-cutting behaviors without modifying the registered functions.

### `grip.hook(name, hooks)`

Adds hooks to a specific function.

```js
grip.hook('createOrder', {
  before: (payload, context) => {
    context.startTime = Date.now()
  },
  after: (payload, context) => {
    const elapsed = Date.now() - context.startTime
    console.log(`createOrder completed in ${elapsed}ms`)
  }
})
```

### `grip.hookAll(hooks)`

Adds global hooks that fire on every registered function.

```js
grip.hookAll({
  before: (payload, context) => {
    context.traceId = crypto.randomUUID()
    logger.info(`[${context.traceId}] ${payload.name} started`)
  },
  after: (payload, context) => {
    logger.info(`[${context.traceId}] ${payload.name} completed — isSuccess: ${payload.result?.isSuccess}`)
  }
})
```

### Guard hooks

Guards are fatal hooks: if they throw, execution stops before `validate` and `business`. They are used for authorization and access control.

```js
grip.hook('deleteUser', {
  guard: (payload, context) => {
    if (!context.user?.isAdmin)
      throw new Error('Only administrators can delete users.')
  }
})
```

### Hook properties

| Property | Type | Description |
|----------|------|-------------|
| `before` | `function` | Runs before guards. Receives `({ name, args }, context)`. Errors are logged, not blocking. |
| `guard` | `function` | Runs after befores. Receives `({ name, args }, context)`. If it throws, blocks the pipeline with `errorType: 'GUARD'`. |
| `after` | `function` | Always runs at the end, even on error. Receives `({ name, args, result }, context)` where `result` is the full response. |
| `label` | `string` | Optional label. Included in the logger error message if the hook crashes: `GRIP: hook error in 'my-label' —` |

### Hook execution order

- **before**: global before local
- **guard**: global before local
- **after**: local before global

```js
// before order: [global-before, local-before]
// after order:  [local-after, global-after]
```

---

## Initial context

Data can be injected into the context directly from `fire()`, without needing a before hook. Useful for passing already-available data (authenticated user, request ID) from the HTTP layer into the pipeline.

```js
app.post('/orders', async (req, res) => {
  const result = await grip.fire('createOrder', req.body, {
    user: req.user,
    requestId: req.headers['x-request-id']
  })
  res.json(result)
})
```

> The initial context is never mutated by the framework. GRIP works on a copy (`{ ...initialContext }`).

---

## Hook error handling

Before and after hooks do not block the pipeline if they crash. Their errors are logged and collected in `response.hookErrors`.

```js
const res = await grip.fire('calcArea', { side: 5 })

if (res.hookErrors.length > 0) {
  for (const { label, error } of res.hookErrors) {
    console.warn(`Hook failed${label ? ` (${label})` : ''}: ${error.message}`)
  }
}
```

Each entry in `hookErrors` is `{ label: string | undefined, error: Error }`.

---

## Instance configuration

### Constructor `new Grip(options)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `logger` | `object` | `console` | Custom logger. Must expose `.error()` and `.warn()` methods. |
| `strict` | `boolean` | `false` | In strict mode, `hook()`, `clearHooks()`, and `unregister()` on unregistered names throw an error instead of emitting a warning. |

```js
import { Grip } from './Grip.js'

const grip = new Grip({
  logger: myLogger,
  strict: true
})
```

### Singleton and functional API

The module exports a ready-to-use singleton instance and a `register` function bound to it:

```js
import { grip, register } from './Grip.js'

// These are equivalent:
grip.register({ name: 'fn', ... })
register({ name: 'fn', ... })
```

For applications requiring isolated registries (e.g. microservices with separate contexts, test environments), use `new Grip()` directly.

---

## Full API

### Registration

```js
grip.register(config)   // Registers a function. Throws if the name is already registered.
grip.unregister(name)   // Removes the function from the registry.
```

### Execution

```js
await grip.fire(name, args)                    // Executes the function with args.
await grip.fire(name, args, initialContext)    // With initial context.
```

### Hooks

```js
grip.hook(name, hooks)            // Adds hooks to a specific function.
grip.hookAll(hooks)               // Adds global hooks to all functions.
grip.removeHook(name, phase, fn)  // Removes a single hook by reference.
                                  // phase: 'before' | 'after' | 'guard'
grip.clearHooks(name)             // Removes all hooks from a specific function.
grip.clearGlobalHooks()           // Removes all global hooks.
```

### Inspection

```js
grip.isRegistered(name)     // true | false
grip.list()                 // Array of registered names.
grip.getHooks(name)         // { before, after, guard } of active hooks. null if not registered.
grip.getPendingHooks(name)  // { before, after, guard } of hooks awaiting registration. null if none.
grip.globalHooks            // Getter: copy of the current global hooks.
```

### Lifecycle

```js
grip.reset()  // Clears the registry, pending hooks, and global hooks.
```

All methods except `fire()`, `isRegistered()`, `list()`, `getHooks()`, `getPendingHooks()`, and the `globalHooks` getter return `this` for chaining.

---

## Hooks on not-yet-registered functions

Hooks can be added to a function before it is registered. They are queued and applied automatically upon registration.

```js
// The authentication module adds hooks before functions are loaded
grip.hook('createOrder', {
  guard: checkAuth,
  label: 'auth-guard'
})

// Later, in the orders module:
register({ name: 'createOrder', ... })
// The guard hook is already active.
```

In non-strict mode, GRIP emits a `logger.warn()` to signal that the hook is pending. In strict mode, it throws immediately.

---

## Usage examples

### Centralized logging

```js
grip.hookAll({
  before: ({ name }, ctx) => {
    ctx.t0 = Date.now()
    logger.info(`→ ${name}`)
  },
  after: ({ name, result }, ctx) => {
    const ms = Date.now() - ctx.t0
    if (result.isSuccess) logger.info(`✓ ${name} (${ms}ms)`)
    else logger.error(`✗ ${name} [${result.errorType}] (${ms}ms): ${result.message}`)
  }
})
```

### Global authentication

```js
grip.hookAll({
  guard: (_, ctx) => {
    if (!ctx.user) throw new Error('User not authenticated.')
  }
})

// In every HTTP handler:
await grip.fire('createOrder', body, { user: req.user })
```

### Timeout for external calls

```js
register({
  name: 'fetchExternalData',
  timeout: 5000,  // 5 seconds
  validate: ({ id }) => { if (!id) throw new Error('id is required.') },
  async business({ id }) {
    return await externalApi.fetch(id)
  }
})

const res = await grip.fire('fetchExternalData', { id: '123' })
if (res.errorType === 'TIMEOUT') {
  // Handle fallback
}
```

### Isolated instances for testing

```js
import { Grip } from './Grip.js'

describe('createOrder', () => {
  let g

  beforeEach(() => {
    g = new Grip()
    g.register({ name: 'createOrder', validate, business })
  })

  test('...', async () => {
    const res = await g.fire('createOrder', { ... })
    expect(res.isSuccess).toBe(true)
  })
})
```

---

## Graph visualization

Because all functions and hooks are registered in a single, queryable registry, the full structure of a GRIP instance can be read at any time and mapped directly onto a graph.

Each registered function becomes a node. Each hook — local or global — becomes a node connected to its function with an edge labelled by phase. Global hooks connect to the instance root and implicitly reach every function in the registry.

The inspection API provides everything needed to build this graph:

```js
const nodes = []
const links = []

// Registry root
nodes.push({ id: 'grip' })

// Global hooks
const globals = grip.globalHooks
for (const phase of ['before', 'guard', 'after']) {
  globals[phase].forEach((hook, i) => {
    const id = `global-${phase}-${i}`
    nodes.push({ id, label: hook.label ?? phase })
    links.push({ source: 'grip', target: id })
  })
}

// Registered functions and their local hooks
for (const name of grip.list()) {
  nodes.push({ id: name })
  links.push({ source: 'grip', target: name })

  const hooks = grip.getHooks(name)
  for (const phase of ['before', 'guard', 'after']) {
    hooks[phase].forEach((hook, i) => {
      const id = `${name}-${phase}-${i}`
      nodes.push({ id, label: hook.label ?? phase })
      links.push({ source: name, target: id })
    })
  }
}
```

This is possible because GRIP has no hidden wiring. Every function, every hook, and every connection is declared explicitly through the public API and remains readable throughout the application's lifecycle.

---

## Error types

| `errorType` | Cause |
|-------------|-------|
| `null` | Execution succeeded (`isSuccess: true`) |
| `'GUARD'` | A guard hook threw an error |
| `'VALIDATION'` | `validate()` threw an error, or `args` is `null` |
| `'BUSINESS'` | `business()` threw an error |
| `'TIMEOUT'` | `business()` exceeded the configured `timeout` |
| `'ASSERT_RESULT'` | `assertResult()` threw an error |

---

## Known limitations

- The timeout applies only to the `business` phase. The `validate` and `assertResult` phases have no configurable time limit.
- Guards are fail-fast: the first guard that throws blocks all subsequent ones. It is not possible to collect multiple guard failures in a single execution.
- An in-flight Promise cannot be cancelled after a timeout: `Promise.race` returns early, but the business function continues executing in the background.
