/**
 * @fileoverview GRIP — Global Registry with Interceptors Pipeline
 *
 * A lightweight JavaScript framework for organizing, protecting, and observing
 * the business logic of an application. Every function is declared with a precise
 * contract (validate → business → assertResult) and exposed through a central
 * registry. Cross-cutting concerns (logging, authentication, monitoring) are added
 * via hooks without touching the registered functions.
 *
 * Execution pipeline per fire() call:
 *   before hooks → guard hooks → null check → validate → business (+ timeout)
 *   → assertResult → after hooks
 *
 * @module Grip
 * @author Leonardo Ciaccio
 */

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

/** Valid keys accepted by hook() and hookAll(). */
const HOOK_KEYS = new Set(['before', 'after', 'guard', 'label'])

/** Valid keys accepted by register(). */
const REGISTER_KEYS = new Set(['name', 'validate', 'business', 'assertResult', 'timeout'])

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Sentinel error class used to distinguish a timeout expiry from a genuine
 * business logic failure. Kept internal — callers identify timeouts via
 * `response.errorType === 'TIMEOUT'`.
 * @private
 */
class TimeoutError extends Error {}

/**
 * Races a promise against a timeout. Uses `finally` to guarantee the timer is
 * cleared regardless of whether the promise settles first, preventing leaks.
 *
 * @param {Promise<*>} promise - The promise to race.
 * @param {number}     ms      - Timeout in milliseconds.
 * @returns {Promise<*>}
 * @private
 */
function withTimeout(promise, ms) {
    let timer
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            timer = setTimeout(() => reject(new TimeoutError(`timed out after ${ms}ms`)), ms)
        })
    ]).finally(() => clearTimeout(timer))
}

/**
 * Validates that `name` is a non-empty string with no leading/trailing whitespace.
 * Throws a descriptive error rather than propagating a generic TypeError.
 *
 * @param {*} name
 * @throws {Error}
 * @private
 */
function assertName(name) {
    if (typeof name !== 'string' || name.trim() === '')
        throw new Error('GRIP: name must be a non-empty string.')
    if (name !== name.trim())
        throw new Error('GRIP: name must not have leading or trailing whitespace.')
}

/**
 * Validates a hooks descriptor object. Rejects unknown keys eagerly so that
 * typos (e.g. `{ befor: fn }`) surface immediately instead of silently doing
 * nothing.
 *
 * @param {object} hooks
 * @throws {Error}
 * @private
 */
function assertHooks(hooks) {
    if (hooks === null || typeof hooks !== 'object' || Array.isArray(hooks))
        throw new Error('GRIP: hooks must be a plain object.')
    for (const key of Object.keys(hooks)) {
        if (!HOOK_KEYS.has(key))
            throw new Error(`GRIP: unknown hook key '${key}'. Allowed: before, after, guard, label.`)
    }
    if (hooks.before !== undefined && typeof hooks.before !== 'function')
        throw new Error('GRIP: before must be a function.')
    if (hooks.after !== undefined && typeof hooks.after !== 'function')
        throw new Error('GRIP: after must be a function.')
    if (hooks.guard !== undefined && typeof hooks.guard !== 'function')
        throw new Error('GRIP: guard must be a function.')
    if (hooks.label !== undefined && typeof hooks.label !== 'string')
        throw new Error('GRIP: label must be a string.')
    if (!hooks.before && !hooks.after && !hooks.guard)
        throw new Error('GRIP: hooks must contain at least one of: before, after, guard.')
}

/**
 * Validates a register() configuration object. Unknown keys are rejected so
 * that configuration mistakes fail loudly at registration time.
 *
 * @param {object} config
 * @throws {Error}
 * @private
 */
function assertRegisterConfig(config) {
    if (typeof config !== 'object' || config === null || Array.isArray(config))
        throw new Error('GRIP: register requires a config object.')
    for (const key of Object.keys(config)) {
        if (!REGISTER_KEYS.has(key))
            throw new Error(`GRIP: unknown config key '${key}'. Allowed: name, validate, business, assertResult, timeout.`)
    }
    if (typeof config.validate !== 'function')
        throw new Error('GRIP: validate must be a function.')
    if (typeof config.business !== 'function')
        throw new Error('GRIP: business must be a function.')
    if (config.assertResult !== undefined && typeof config.assertResult !== 'function')
        throw new Error('GRIP: assertResult must be a function.')
    if (config.timeout !== undefined && (
        typeof config.timeout !== 'number' || config.timeout <= 0 || !isFinite(config.timeout)
    ))
        throw new Error('GRIP: timeout must be a finite positive number (milliseconds).')
}

/**
 * Validates the optional third argument of fire(). Only plain objects are
 * accepted; null and arrays are rejected explicitly to catch common mistakes.
 *
 * @param {*} ctx
 * @throws {Error}
 * @private
 */
function assertInitialContext(ctx) {
    if (ctx !== undefined && (ctx === null || typeof ctx !== 'object' || Array.isArray(ctx)))
        throw new Error('GRIP: initialContext must be a plain object.')
}

// ---------------------------------------------------------------------------
// Grip class
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} GripResponse
 * @property {boolean}          isSuccess  - `true` if the full pipeline completed without errors.
 * @property {string}           message    - Human-readable outcome: success message or error detail.
 * @property {string|null}      errorType  - One of `'GUARD'`, `'VALIDATION'`, `'BUSINESS'`, `'TIMEOUT'`,
 *                                           `'ASSERT_RESULT'`, or `null` on success.
 * @property {*}                result     - Value returned by `business()`, or `null` on failure.
 * @property {Array<{label: string|undefined, error: Error}>} hookErrors
 *                                         - Errors from non-fatal before/after hooks. Never throws.
 */

/**
 * @typedef {Object} HookDescriptor
 * @property {Function} [before] - Observation hook. Runs before guards. Receives `({name, args}, context)`.
 * @property {Function} [after]  - Post-execution hook. Always runs, even on error.
 *                                 Receives `({name, args, result}, context)`.
 * @property {Function} [guard]  - Fatal hook. Runs after befores. Throws to block the pipeline.
 *                                 Receives `({name, args}, context)`.
 * @property {string}   [label]  - Optional identifier included in log messages when the hook crashes.
 */

/**
 * @typedef {Object} RegisterConfig
 * @property {string}    name          - Unique function name. No leading/trailing whitespace.
 * @property {Function}  validate      - `(args, context) => void`. Throws to reject invalid input.
 * @property {Function}  business      - `(args, context) => *`. Core logic. Return value becomes `result`.
 * @property {Function}  [assertResult]- `(result, context) => void`. Throws if output contract is violated.
 * @property {number}    [timeout]     - Timeout in ms for the business phase. Must be a finite positive number.
 */

/**
 * GRIP — Global Registry with Interceptors Pipeline.
 *
 * Maintains an internal registry of named functions, each declared with a
 * validate/business/assertResult contract. Executes them through a structured
 * pipeline and always returns a {@link GripResponse} — it never throws from
 * `fire()` unless the function name is unregistered.
 *
 * @example
 * const grip = new Grip({ strict: true, logger: myLogger })
 *
 * grip.register({
 *   name: 'calcArea',
 *   validate({ side }) { if (side <= 0) throw new Error('side must be positive.') },
 *   business({ side }) { return side * side }
 * })
 *
 * const res = await grip.fire('calcArea', { side: 5 })
 * // { isSuccess: true, result: 25, errorType: null, ... }
 */
export class Grip {

    /** @type {Map<string, {registered: boolean, config: RegisterConfig, hooks: object}>} */
    #registry = new Map()

    /**
     * Hooks attached to names not yet registered. Flushed into the entry's
     * hook arrays the moment register() is called for that name.
     * @type {Map<string, {before: object[], after: object[], guard: object[]}>}
     */
    #pendingHooks = new Map()

    /**
     * Global hooks applied to every fire() call, regardless of function name.
     * Before/guard run global-first; after runs local-first.
     * @type {{before: object[], after: object[], guard: object[]}}
     */
    #globalHooks = { before: [], after: [], guard: [] }

    /** @type {{error: Function, warn: Function}} */
    #logger

    /**
     * When true, hook(), clearHooks(), and unregister() throw on unknown names
     * instead of emitting a warning.
     * @type {boolean}
     */
    #strict

    /**
     * @param {object}  [options]
     * @param {object}  [options.logger=console] - Custom logger. Must expose `.error()` and `.warn()`.
     * @param {boolean} [options.strict=false]   - Enable strict mode.
     */
    constructor({ logger = console, strict = false } = {}) {
        this.#logger = logger
        this.#strict = strict
    }

    // -----------------------------------------------------------------------
    // Private — pipeline internals
    // -----------------------------------------------------------------------

    /**
     * Runs an ordered list of hook items sequentially. A crashing hook is logged
     * and collected in the returned error array but never re-thrown, preserving
     * pipeline continuity for non-fatal phases.
     *
     * @param {Array<{fn: Function, label: string|undefined}>} hookItems
     * @param {object} payload   - Contextual data passed to each hook function.
     * @param {object} context   - Shared execution context for the current fire() call.
     * @returns {Promise<Array<{label: string|undefined, error: Error}>>}
     * @private
     */
    async #safeRunHooks(hookItems, payload, context) {
        const errors = []
        for (const { fn, label } of hookItems) {
            try { await fn(payload, context) } catch (e) {
                this.#logger.error(`GRIP: hook error${label ? ` in '${label}'` : ''} —`, e)
                errors.push({ label, error: e })
            }
        }
        return errors
    }

    /**
     * Runs the full interceptor pipeline for a single fire() call.
     *
     * Pipeline order:
     *   1. before hooks  (global → local) — non-fatal, populate context
     *   2. guard hooks   (global → local) — fatal, first throw stops all subsequent guards
     *   3. null check    on args
     *   4. validate      (args, context)
     *   5. business      (args, context) — optional timeout via Promise.race
     *   6. assertResult  (result, context)
     *   7. after hooks   (local → global) — always run, even on error
     *
     * @param {RegisterConfig} config
     * @param {{before: object[], after: object[], guard: object[]}} hooks - Function-local hooks.
     * @param {*}      args    - Arguments passed by the caller.
     * @param {object} context - Fresh context object for this execution.
     * @returns {Promise<GripResponse>}
     * @private
     */
    async #execute(config, hooks, args, context) {
        const { name, validate, business, assertResult, timeout } = config

        // Merge global and local hooks, respecting execution order.
        const befores = [...this.#globalHooks.before, ...hooks.before]
        const afters  = [...hooks.after,              ...this.#globalHooks.after]
        const guards  = [...this.#globalHooks.guard,  ...hooks.guard]

        const response = { isSuccess: false, message: '', errorType: null, result: null, hookErrors: [] }

        // Extracted to avoid duplicating after-hook logic across every early return.
        const runAfters = async () => {
            const errs = await this.#safeRunHooks(afters, { name, args, result: response }, context)
            response.hookErrors.push(...errs)
        }

        // Phase 1: before — observation only, non-fatal.
        const beforeErrs = await this.#safeRunHooks(befores, { name, args }, context)
        response.hookErrors.push(...beforeErrs)

        // Phase 2: guard — fatal, fail-fast on the first throw.
        try {
            for (const { fn } of guards) await fn({ name, args }, context)
        } catch (error) {
            response.message   = `${name} | ${error.message}`
            response.errorType = 'GUARD'
            await runAfters()
            return response
        }

        // Phase 3: null check — explicit guard against null args before destructuring in validate.
        if (args === null) {
            response.message   = `${name} | args must not be null.`
            response.errorType = 'VALIDATION'
            await runAfters()
            return response
        }

        // Phase 4: validate — input contract enforcement.
        try {
            await validate(args, context)
        } catch (error) {
            response.message   = `${name} | ${error.message}`
            response.errorType = 'VALIDATION'
            await runAfters()
            return response
        }

        // Phase 5: business — core logic, with optional timeout.
        try {
            const call = business(args, context)
            response.result = await (timeout ? withTimeout(call, timeout) : call)
        } catch (error) {
            response.message   = `${name} | ${error.message}`
            response.errorType = error instanceof TimeoutError ? 'TIMEOUT' : 'BUSINESS'
            await runAfters()
            return response
        }

        // Phase 6: assertResult — output contract verification.
        if (assertResult) {
            try {
                await assertResult(response.result, context)
            } catch (error) {
                response.result    = null
                response.message   = `${name} | assertResult failed: ${error.message}`
                response.errorType = 'ASSERT_RESULT'
                await runAfters()
                return response
            }
        }

        // Phase 7: after — always runs.
        response.isSuccess = true
        response.message   = `${name} | Executed successfully.`
        await runAfters()
        return response
    }

    // -----------------------------------------------------------------------
    // Private — hook wiring
    // -----------------------------------------------------------------------

    /**
     * Pushes hook functions from a descriptor into a target hook store.
     * Stores `{fn, label}` objects instead of bare functions to carry the label
     * through to error logging without additional closures.
     *
     * @param {{before: object[], after: object[], guard: object[]}} target
     * @param {HookDescriptor} hooks
     * @private
     */
    #applyHook(target, hooks) {
        const label = hooks.label
        if (hooks.before) target.before.push({ fn: hooks.before, label })
        if (hooks.after)  target.after.push({ fn: hooks.after, label })
        if (hooks.guard)  target.guard.push({ fn: hooks.guard, label })
    }

    // -----------------------------------------------------------------------
    // Public — inspection
    // -----------------------------------------------------------------------

    /**
     * Returns a shallow copy of the current global hooks store.
     * Mutating the returned arrays does not affect internal state.
     *
     * @returns {{before: object[], after: object[], guard: object[]}}
     */
    get globalHooks() {
        return {
            before: [...this.#globalHooks.before],
            after:  [...this.#globalHooks.after],
            guard:  [...this.#globalHooks.guard]
        }
    }

    /**
     * Returns the active hook arrays for a registered function, or `null` if
     * the name is not in the registry. The returned arrays are copies — mutating
     * them has no effect on internal state.
     *
     * @param {string} name
     * @returns {{before: object[], after: object[], guard: object[]} | null}
     */
    getHooks(name) {
        assertName(name)
        const entry = this.#registry.get(name)
        if (!entry) return null
        return {
            before: [...entry.hooks.before],
            after:  [...entry.hooks.after],
            guard:  [...entry.hooks.guard]
        }
    }

    /**
     * Returns the pending hook arrays for a name that has not yet been registered,
     * or `null` if none exist. The returned arrays are copies.
     *
     * @param {string} name
     * @returns {{before: object[], after: object[], guard: object[]} | null}
     */
    getPendingHooks(name) {
        assertName(name)
        const pending = this.#pendingHooks.get(name)
        if (!pending) return null
        return {
            before: [...pending.before],
            after:  [...pending.after],
            guard:  [...pending.guard]
        }
    }

    /**
     * Returns `true` if a function with the given name is currently registered.
     *
     * @param {string} name
     * @returns {boolean}
     */
    isRegistered(name) {
        assertName(name)
        return this.#registry.get(name)?.registered === true
    }

    /**
     * Returns an array of all currently registered function names.
     *
     * @returns {string[]}
     */
    list() {
        return [...this.#registry.entries()]
            .filter(([, entry]) => entry.registered)
            .map(([name]) => name)
    }

    // -----------------------------------------------------------------------
    // Public — registration
    // -----------------------------------------------------------------------

    /**
     * Registers a function under the given name. Throws if the name is already
     * taken. Any hooks previously queued via `hook()` for this name are applied
     * immediately.
     *
     * @param {RegisterConfig} config
     * @returns {this} — for chaining.
     * @throws {Error} If the name is already registered or if config is invalid.
     */
    register(config) {
        assertRegisterConfig(config)
        const { name, validate, business, assertResult, timeout } = config
        assertName(name)

        if (this.#registry.has(name))
            throw new Error(`GRIP: '${name}' is already registered.`)

        // Flush any hooks that arrived before this registration.
        const pending = this.#pendingHooks.get(name) ?? { before: [], after: [], guard: [] }
        this.#pendingHooks.delete(name)

        this.#registry.set(name, {
            registered: true,
            config: { name, validate, business, assertResult, timeout },
            hooks: {
                before: [...pending.before],
                after:  [...pending.after],
                guard:  [...pending.guard]
            }
        })

        return this
    }

    /**
     * Removes a function from the registry. In non-strict mode, calling this on
     * an unknown name emits a warning; in strict mode it throws.
     *
     * @param {string} name
     * @returns {this}
     */
    unregister(name) {
        assertName(name)
        if (!this.#registry.has(name)) {
            if (this.#strict)
                throw new Error(`GRIP: '${name}' is not registered.`)
            this.#logger.warn(`GRIP: unregister called on unknown name '${name}'.`)
        }
        this.#registry.delete(name)
        return this
    }

    // -----------------------------------------------------------------------
    // Public — hooks
    // -----------------------------------------------------------------------

    /**
     * Adds hooks to a specific registered function. If the function is not yet
     * registered, hooks are queued and applied automatically upon registration.
     * In strict mode, hooking an unregistered name throws immediately.
     *
     * @param {string}         name
     * @param {HookDescriptor} hooks
     * @returns {this}
     */
    hook(name, hooks = {}) {
        assertName(name)
        assertHooks(hooks)
        if (this.#registry.has(name)) {
            this.#applyHook(this.#registry.get(name).hooks, hooks)
        } else {
            if (this.#strict)
                throw new Error(`GRIP: '${name}' is not registered.`)
            if (!this.#pendingHooks.has(name))
                this.#pendingHooks.set(name, { before: [], after: [], guard: [] })
            this.#applyHook(this.#pendingHooks.get(name), hooks)
            this.#logger.warn(`GRIP: hooking '${name}' before it is registered. Ensure it will be registered later.`)
        }
        return this
    }

    /**
     * Adds global hooks that fire on every registered function.
     * Execution order: global before → local before; local after → global after.
     *
     * @param {HookDescriptor} hooks
     * @returns {this}
     */
    hookAll(hooks = {}) {
        assertHooks(hooks)
        this.#applyHook(this.#globalHooks, hooks)
        return this
    }

    /**
     * Removes a single hook from a specific function by function reference.
     * No-ops silently if the name is unregistered or the reference is not found.
     *
     * @param {string}   name  - Registered function name.
     * @param {string}   phase - `'before'`, `'after'`, or `'guard'`.
     * @param {Function} fn    - The exact function reference to remove.
     * @returns {this}
     * @throws {Error} If `phase` is not a valid hook phase.
     */
    removeHook(name, phase, fn) {
        assertName(name)
        if (!['before', 'after', 'guard'].includes(phase))
            throw new Error(`GRIP: unknown phase '${phase}'. Allowed: before, after, guard.`)
        const entry = this.#registry.get(name)
        if (entry) entry.hooks[phase] = entry.hooks[phase].filter(item => item.fn !== fn)
        return this
    }

    /**
     * Removes all local hooks from a specific function.
     * Does not affect global hooks. In non-strict mode, calling this on an
     * unknown name emits a warning; in strict mode it throws.
     *
     * @param {string} name
     * @returns {this}
     */
    clearHooks(name) {
        assertName(name)
        const entry = this.#registry.get(name)
        if (!entry) {
            if (this.#strict)
                throw new Error(`GRIP: '${name}' is not registered.`)
            this.#logger.warn(`GRIP: clearHooks called on unknown name '${name}'.`)
            return this
        }
        entry.hooks.before = []
        entry.hooks.after  = []
        entry.hooks.guard  = []
        return this
    }

    /**
     * Removes all global hooks. Local hooks on individual functions are unaffected.
     *
     * @returns {this}
     */
    clearGlobalHooks() {
        this.#globalHooks.before = []
        this.#globalHooks.after  = []
        this.#globalHooks.guard  = []
        return this
    }

    // -----------------------------------------------------------------------
    // Public — execution
    // -----------------------------------------------------------------------

    /**
     * Executes a registered function through the full interceptor pipeline.
     * Always resolves to a {@link GripResponse} — never rejects (unless the name
     * is not registered, which is a programmer error).
     *
     * @param {string} name           - Name of the registered function to execute.
     * @param {*}      args           - Arguments forwarded to validate() and business().
     * @param {object} [initialContext={}] - Data injected into the context before before-hooks run.
     *                                  GRIP works on a shallow copy — the original is never mutated.
     * @returns {Promise<GripResponse>}
     * @throws {Error} If `name` is not registered.
     */
    async fire(name, args, initialContext = {}) {
        assertName(name)
        assertInitialContext(initialContext)
        const entry = this.#registry.get(name)
        if (!entry?.registered)
            throw new Error(`GRIP: '${name}' is not registered.`)
        return this.#execute(entry.config, entry.hooks, args, { ...initialContext })
    }

    // -----------------------------------------------------------------------
    // Public — lifecycle
    // -----------------------------------------------------------------------

    /**
     * Clears the registry, all pending hooks, and all global hooks.
     * Returns the instance to a pristine state — useful for test isolation.
     *
     * @returns {this}
     */
    reset() {
        this.#registry.clear()
        this.#pendingHooks.clear()
        this.#globalHooks.before = []
        this.#globalHooks.after  = []
        this.#globalHooks.guard  = []
        return this
    }

}

// ---------------------------------------------------------------------------
// Module-level singleton and convenience export
// ---------------------------------------------------------------------------

/** Ready-to-use singleton instance. Suitable for single-registry applications. */
export const grip = new Grip()

/**
 * Shorthand for `grip.register()`, bound to the singleton instance.
 * Equivalent to calling `grip.register(config)` directly.
 *
 * @type {(config: RegisterConfig) => Grip}
 */
export const register = grip.register.bind(grip)
