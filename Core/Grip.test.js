import { grip, register, Grip } from './grip.js'

beforeEach(() => grip.reset())

const square = {
    name: 'gripCalcAreaSquare',
    validate({ side }) {
        if (typeof side !== 'number' || side <= 0)
            throw new Error('side must be a strictly positive number.')
    },
    business({ side }) { return side * side }
}

describe('GRIP - fire (sync)', () => {

    beforeEach(() => register(square))

    test('restituisce isSuccess true con risultato corretto', async () => {
        const res = await grip.fire('gripCalcAreaSquare', { side: 5 })
        expect(res.isSuccess).toBe(true)
        expect(res.result).toBe(25)
        expect(res.message).toBe('gripCalcAreaSquare | Executed successfully.')
    })

    test('restituisce isSuccess false se la validazione fallisce', async () => {
        const res = await grip.fire('gripCalcAreaSquare', { side: -1 })
        expect(res.isSuccess).toBe(false)
        expect(res.result).toBeNull()
        expect(res.errorType).toBe('VALIDATION')
        expect(res.message).toMatch(/gripCalcAreaSquare/)
    })

    test('restituisce isSuccess false con argomento non numerico', async () => {
        const res = await grip.fire('gripCalcAreaSquare', { side: 'abc' })
        expect(res.isSuccess).toBe(false)
        expect(res.result).toBeNull()
    })

    test('lancia se il nome non è registrato', async () => {
        await expect(grip.fire('fnInesistente', {}))
            .rejects.toThrow("GRIP: 'fnInesistente' is not registered.")
    })

    test('lancia se si registra due volte lo stesso nome', () => {
        expect(() => register(square))
            .toThrow("GRIP: 'gripCalcAreaSquare' is already registered.")
    })

    test('nome da variabile — dispatch dinamico', async () => {
        const fnName = 'gripCalcAreaSquare'
        const res = await grip.fire(fnName, { side: 4 })
        expect(res.isSuccess).toBe(true)
        expect(res.result).toBe(16)
    })

    test('risposta contiene hookErrors vuoto in assenza di errori', async () => {
        const res = await grip.fire('gripCalcAreaSquare', { side: 3 })
        expect(res.hookErrors).toEqual([])
    })

})

describe('GRIP - fire (async business)', () => {

    test('gestisce business che ritorna una Promise', async () => {
        register({
            name: 'asyncSquare',
            validate({ side }) {
                if (typeof side !== 'number' || side <= 0)
                    throw new Error('side must be a strictly positive number.')
            },
            business({ side }) { return Promise.resolve(side * side) }
        })
        const res = await grip.fire('asyncSquare', { side: 5 })
        expect(res.isSuccess).toBe(true)
        expect(res.result).toBe(25)
    })

    test('gestisce business dichiarata async', async () => {
        register({
            name: 'asyncKeyword',
            validate: () => {},
            async business({ side }) { return side * side }
        })
        const res = await grip.fire('asyncKeyword', { side: 3 })
        expect(res.isSuccess).toBe(true)
        expect(res.result).toBe(9)
    })

    test('gestisce errore in business async', async () => {
        register({
            name: 'asyncFailing',
            validate: () => {},
            async business() { throw new Error('async failure') }
        })
        const res = await grip.fire('asyncFailing', {})
        expect(res.isSuccess).toBe(false)
        expect(res.errorType).toBe('BUSINESS')
        expect(res.message).toMatch(/async failure/)
    })

})

describe('GRIP - timeout', () => {

    test('business che supera il timeout restituisce TIMEOUT error', async () => {
        register({
            name: 'slowFn',
            validate: () => {},
            business: () => new Promise(r => setTimeout(r, 100)),
            timeout: 20
        })
        const res = await grip.fire('slowFn', {})
        expect(res.isSuccess).toBe(false)
        expect(res.errorType).toBe('TIMEOUT')
        expect(res.message).toMatch(/timed out after 20ms/)
    }, 500)

    test('business che completa prima del timeout ha successo', async () => {
        register({
            name: 'fastFn',
            validate: () => {},
            business: async () => { await new Promise(r => setTimeout(r, 10)); return 42 },
            timeout: 500
        })
        const res = await grip.fire('fastFn', {})
        expect(res.isSuccess).toBe(true)
        expect(res.result).toBe(42)
    }, 1000)

    test('after scatta anche dopo un timeout', async () => {
        const after = jest.fn()
        register({
            name: 'timeoutAfterFn',
            validate: () => {},
            business: () => new Promise(r => setTimeout(r, 100)),
            timeout: 20
        })
        grip.hook('timeoutAfterFn', { after })
        await grip.fire('timeoutAfterFn', {})
        expect(after).toHaveBeenCalled()
    }, 500)

    test('register: lancia se timeout è zero o negativo', () => {
        expect(() => register({ name: 'x', validate: () => {}, business: () => {}, timeout: 0 }))
            .toThrow('GRIP: timeout must be a finite positive number (milliseconds).')
        expect(() => register({ name: 'x', validate: () => {}, business: () => {}, timeout: -1 }))
            .toThrow('GRIP: timeout must be a finite positive number (milliseconds).')
    })

    test('register: lancia se timeout non è un numero', () => {
        expect(() => register({ name: 'x', validate: () => {}, business: () => {}, timeout: 'fast' }))
            .toThrow('GRIP: timeout must be a finite positive number (milliseconds).')
    })

    test('register: lancia se timeout è Infinity', () => {
        expect(() => register({ name: 'x', validate: () => {}, business: () => {}, timeout: Infinity }))
            .toThrow('GRIP: timeout must be a finite positive number (milliseconds).')
    })

})

describe('GRIP - hookErrors', () => {

    test('hookErrors viene popolato se un before hook crasha', async () => {
        register({ name: 'fnErr', validate: () => {}, business: () => 1 })
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
        grip.hook('fnErr', { before: () => { throw new Error('CRASH') }, label: 'my-hook' })
        const res = await grip.fire('fnErr', {})
        expect(res.isSuccess).toBe(true)
        expect(res.hookErrors).toHaveLength(1)
        expect(res.hookErrors[0].label).toBe('my-hook')
        expect(res.hookErrors[0].error.message).toBe('CRASH')
        consoleError.mockRestore()
    })

    test('hookErrors viene popolato se un after hook crasha', async () => {
        register({ name: 'fnAfterErr', validate: () => {}, business: () => 1 })
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
        grip.hook('fnAfterErr', { after: () => { throw new Error('AFTER_CRASH') } })
        const res = await grip.fire('fnAfterErr', {})
        expect(res.isSuccess).toBe(true)
        expect(res.hookErrors).toHaveLength(1)
        expect(res.hookErrors[0].error.message).toBe('AFTER_CRASH')
        consoleError.mockRestore()
    })

    test('hookErrors è vuoto in assenza di errori negli hook', async () => {
        register({ name: 'fnNoErr', validate: () => {}, business: () => 1 })
        grip.hook('fnNoErr', { before: jest.fn() })
        const res = await grip.fire('fnNoErr', {})
        expect(res.hookErrors).toEqual([])
    })

    test('hookErrors accumula errori da before e after', async () => {
        register({ name: 'fnBothErr', validate: () => {}, business: () => 1 })
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
        grip.hook('fnBothErr', {
            before: () => { throw new Error('BEFORE') },
            after:  () => { throw new Error('AFTER') }
        })
        const res = await grip.fire('fnBothErr', {})
        expect(res.hookErrors).toHaveLength(2)
        consoleError.mockRestore()
    })

})

describe('GRIP - hook pipeline (global + local combinati)', () => {

    beforeEach(() => register(square))

    test('global before + local before scattano entrambi in ordine', async () => {
        const calls = []
        grip.hookAll({ before: () => calls.push('global') })
        grip.hook('gripCalcAreaSquare', { before: () => calls.push('local') })
        await grip.fire('gripCalcAreaSquare', { side: 5 })
        expect(calls).toEqual(['global', 'local'])
    })

    test('local after + global after scattano entrambi in ordine', async () => {
        const calls = []
        grip.hookAll({ after: () => calls.push('global') })
        grip.hook('gripCalcAreaSquare', { after: () => calls.push('local') })
        await grip.fire('gripCalcAreaSquare', { side: 5 })
        expect(calls).toEqual(['local', 'global'])
    })

    test('più before hook scattano in ordine', async () => {
        const calls = []
        grip.hook('gripCalcAreaSquare', { before: () => calls.push(1) })
        grip.hook('gripCalcAreaSquare', { before: () => calls.push(2) })
        grip.hook('gripCalcAreaSquare', { before: () => calls.push(3) })
        await grip.fire('gripCalcAreaSquare', { side: 5 })
        expect(calls).toEqual([1, 2, 3])
    })

    test('hookAll non viene ignorato quando esiste un hook locale', async () => {
        const global = jest.fn()
        const local  = jest.fn()
        grip.hookAll({ before: global })
        grip.hook('gripCalcAreaSquare', { before: local })
        await grip.fire('gripCalcAreaSquare', { side: 5 })
        expect(global).toHaveBeenCalled()
        expect(local).toHaveBeenCalled()
    })

})

describe('GRIP - hook protetti da errori', () => {

    beforeEach(() => register(square))

    test('un hook before che crasha non blocca la business logic', async () => {
        grip.hook('gripCalcAreaSquare', { before: () => { throw new Error('hook crash') } })
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
        const res = await grip.fire('gripCalcAreaSquare', { side: 5 })
        expect(res.isSuccess).toBe(true)
        expect(res.result).toBe(25)
        expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('GRIP: hook error'), expect.any(Error))
        consoleError.mockRestore()
    })

    test('un hook after che crasha non modifica il risultato', async () => {
        grip.hook('gripCalcAreaSquare', { after: () => { throw new Error('after crash') } })
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
        const res = await grip.fire('gripCalcAreaSquare', { side: 4 })
        expect(res.isSuccess).toBe(true)
        expect(res.result).toBe(16)
        consoleError.mockRestore()
    })

})

describe('GRIP - assertResult', () => {

    test('assertResult valida il risultato e passa se corretto', async () => {
        register({
            name: 'withAssertResult',
            validate: () => {},
            business: () => 42,
            assertResult(result) {
                if (typeof result !== 'number') throw new Error('result must be a number.')
            }
        })
        const res = await grip.fire('withAssertResult', {})
        expect(res.isSuccess).toBe(true)
        expect(res.result).toBe(42)
        expect(res.errorType).toBeNull()
    })

    test('assertResult fallisce e restituisce isSuccess false con errorType ASSERT_RESULT', async () => {
        register({
            name: 'badAssertResult',
            validate: () => {},
            business: () => 'non un numero',
            assertResult(result) {
                if (typeof result !== 'number') throw new Error('result must be a number.')
            }
        })
        const res = await grip.fire('badAssertResult', {})
        expect(res.isSuccess).toBe(false)
        expect(res.errorType).toBe('ASSERT_RESULT')
        expect(res.result).toBeNull()
        expect(res.message).toMatch(/assertResult failed/)
    })

    test('assertResult async viene awaited correttamente', async () => {
        register({
            name: 'asyncAssertResult',
            validate: () => {},
            business: () => 42,
            async assertResult(result) {
                await Promise.resolve()
                if (typeof result !== 'number') throw new Error('not a number.')
            }
        })
        const res = await grip.fire('asyncAssertResult', {})
        expect(res.isSuccess).toBe(true)
    })

    test('assertResult riceve il context', async () => {
        register({
            name: 'ctxAssertResult',
            validate: () => {},
            business: () => 1,
            assertResult: (result, ctx) => { ctx.assertResultRan = true }
        })
        grip.hook('ctxAssertResult', { before: (_, ctx) => { ctx.tag = 'ok' } })
        const res = await grip.fire('ctxAssertResult', {})
        expect(res.isSuccess).toBe(true)
    })

})

describe('GRIP - async validate', () => {

    test('validate async viene awaited correttamente', async () => {
        register({
            name: 'asyncValidate',
            async validate({ side }) {
                await Promise.resolve()
                if (typeof side !== 'number' || side <= 0)
                    throw new Error('side must be positive.')
            },
            business({ side }) { return side * side }
        })
        const ok  = await grip.fire('asyncValidate', { side: 4 })
        const err = await grip.fire('asyncValidate', { side: -1 })
        expect(ok.isSuccess).toBe(true)
        expect(ok.result).toBe(16)
        expect(err.isSuccess).toBe(false)
        expect(err.errorType).toBe('VALIDATION')
    })

})

describe('GRIP - args null', () => {

    test('args null restituisce VALIDATION error con messaggio chiaro', async () => {
        register(square)
        const res = await grip.fire('gripCalcAreaSquare', null)
        expect(res.isSuccess).toBe(false)
        expect(res.errorType).toBe('VALIDATION')
        expect(res.message).toMatch(/args must not be null/)
    })

    test('after scatta anche quando args è null', async () => {
        const after = jest.fn()
        register(square)
        grip.hook('gripCalcAreaSquare', { after })
        await grip.fire('gripCalcAreaSquare', null)
        expect(after).toHaveBeenCalled()
    })

})

describe('GRIP - ghost entries separati', () => {

    test('hook su nome non ancora registrato emette un warning senza creare entry nel registry', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
        grip.hook('fantasma', { before: () => {} })
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("'fantasma'"))
        expect(grip.isRegistered('fantasma')).toBe(false)
        warn.mockRestore()
    })

    test('hook pendente viene applicato quando la funzione viene registrata', async () => {
        const warn   = jest.spyOn(console, 'warn').mockImplementation(() => {})
        const before = jest.fn()
        grip.hook('lazyFn', { before })
        register({ name: 'lazyFn', validate: () => {}, business: () => 42 })
        await grip.fire('lazyFn', {})
        expect(before).toHaveBeenCalled()
        warn.mockRestore()
    })

    test('hook su nome già registrato non emette warning', () => {
        register(square)
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
        grip.hook('gripCalcAreaSquare', { before: () => {} })
        expect(warn).not.toHaveBeenCalled()
        warn.mockRestore()
    })

})

describe('GRIP - protezione parametri', () => {

    test('hook: lancia se name non è una stringa', () => {
        expect(() => grip.hook(123, { before: () => {} }))
            .toThrow('GRIP: name must be a non-empty string.')
    })

    test('hook: lancia se name è stringa vuota', () => {
        expect(() => grip.hook('', { before: () => {} }))
            .toThrow('GRIP: name must be a non-empty string.')
    })

    test('hook: lancia se name ha spazi iniziali o finali', () => {
        expect(() => grip.hook(' fn ', { before: () => {} }))
            .toThrow('GRIP: name must not have leading or trailing whitespace.')
    })

    test('hook: lancia se hooks è un array', () => {
        expect(() => grip.hook('fn', [() => {}]))
            .toThrow('GRIP: hooks must be a plain object.')
    })

    test('hook: lancia se before non è una funzione', () => {
        expect(() => grip.hook('someFunc', { before: 'ciao' }))
            .toThrow('GRIP: before must be a function.')
    })

    test('hook: lancia se after non è una funzione', () => {
        expect(() => grip.hook('someFunc', { after: 42 }))
            .toThrow('GRIP: after must be a function.')
    })

    test('hook: lancia se viene passata una chiave sconosciuta', () => {
        expect(() => grip.hook('someFunc', { intemid: () => {} }))
            .toThrow("GRIP: unknown hook key 'intemid'. Allowed: before, after, guard, label.")
    })

    test('hook: lancia se hooks è un oggetto vuoto', () => {
        expect(() => grip.hook('qualsiasi', {}))
            .toThrow('GRIP: hooks must contain at least one of: before, after, guard.')
    })

    test('hook: lancia se label non è una stringa', () => {
        expect(() => grip.hook('someFunc', { before: () => {}, label: 42 }))
            .toThrow('GRIP: label must be a string.')
    })

    test('hookAll: lancia se viene passata una chiave sconosciuta', () => {
        expect(() => grip.hookAll({ middle: () => {} }))
            .toThrow("GRIP: unknown hook key 'middle'. Allowed: before, after, guard, label.")
    })

    test('hookAll: lancia se hooks è un oggetto vuoto', () => {
        expect(() => grip.hookAll({}))
            .toThrow('GRIP: hooks must contain at least one of: before, after, guard.')
    })

    test('register: lancia se config non è un oggetto', () => {
        expect(() => register('ciao'))
            .toThrow('GRIP: register requires a config object.')
    })

    test('register: lancia se config è un array', () => {
        expect(() => register([]))
            .toThrow('GRIP: register requires a config object.')
    })

    test('register: lancia se validate non è una funzione', () => {
        expect(() => register({ name: 'x', validate: 'no', business: () => {} }))
            .toThrow('GRIP: validate must be a function.')
    })

    test('register: lancia se business non è una funzione', () => {
        expect(() => register({ name: 'x', validate: () => {}, business: null }))
            .toThrow('GRIP: business must be a function.')
    })

    test('register: lancia se viene passata una chiave sconosciuta', () => {
        expect(() => register({ name: 'x', validate: () => {}, business: () => {}, extra: true }))
            .toThrow("GRIP: unknown config key 'extra'. Allowed: name, validate, business, assertResult, timeout.")
    })

    test('fire: lancia se name non è una stringa', async () => {
        await expect(grip.fire(null, {}))
            .rejects.toThrow('GRIP: name must be a non-empty string.')
    })

    test('fire: lancia se initialContext è null', async () => {
        register(square)
        await expect(grip.fire('gripCalcAreaSquare', {}, null))
            .rejects.toThrow('GRIP: initialContext must be a plain object.')
    })

    test('fire: lancia se initialContext è un primitivo', async () => {
        register(square)
        await expect(grip.fire('gripCalcAreaSquare', {}, 42))
            .rejects.toThrow('GRIP: initialContext must be a plain object.')
    })

    test('fire: lancia se initialContext è un array', async () => {
        register(square)
        await expect(grip.fire('gripCalcAreaSquare', {}, []))
            .rejects.toThrow('GRIP: initialContext must be a plain object.')
    })

    test('removeHook: lancia se phase è sconosciuta', () => {
        register(square)
        expect(() => grip.removeHook('gripCalcAreaSquare', 'middle', () => {}))
            .toThrow("GRIP: unknown phase 'middle'. Allowed: before, after, guard.")
    })

})

describe('GRIP - guard (hook fatale)', () => {

    beforeEach(() => {
        register({
            name: 'targetFn',
            validate({ data }) { if (!data) throw new Error('data missing') },
            business({ data }) { return data.length }
        })
    })

    test('guard che lancia blocca la business logic', async () => {
        grip.hook('targetFn', { guard: () => { throw new Error('UNAUTHORIZED') } })
        const res = await grip.fire('targetFn', { data: 'some data' })
        expect(res.isSuccess).toBe(false)
        expect(res.errorType).toBe('GUARD')
        expect(res.message).toMatch(/UNAUTHORIZED/)
    })

    test('business non viene eseguita se guard fallisce', async () => {
        const business = jest.fn()
        register({ name: 'guardedFn', validate: () => {}, business })
        grip.hook('guardedFn', { guard: () => { throw new Error('blocked') } })
        await grip.fire('guardedFn', {})
        expect(business).not.toHaveBeenCalled()
    })

    test('before non-fatale + guard fatale — before scatta, guard blocca', async () => {
        const calls = []
        register({ name: 'mixedFn', validate: () => {}, business: () => 1 })
        grip.hook('mixedFn', { before: () => calls.push('before') })
        grip.hook('mixedFn', { guard: () => { throw new Error('blocked') } })
        const res = await grip.fire('mixedFn', {})
        expect(calls).toContain('before')
        expect(res.errorType).toBe('GUARD')
    })

    test('after scatta anche dopo un guard fallito', async () => {
        const after = jest.fn()
        register({ name: 'guardAfterFn', validate: () => {}, business: () => 1 })
        grip.hook('guardAfterFn', { guard: () => { throw new Error('blocked') } })
        grip.hook('guardAfterFn', { after })
        await grip.fire('guardAfterFn', {})
        expect(after).toHaveBeenCalled()
    })

    test('global guard scatta prima del local guard', async () => {
        const order = []
        register({ name: 'guardOrder', validate: () => {}, business: () => 1 })
        grip.hookAll({ guard: () => order.push('global') })
        grip.hook('guardOrder', { guard: () => order.push('local') })
        await grip.fire('guardOrder', {})
        expect(order).toEqual(['global', 'local'])
    })

    test('globalHooks.before.push non corrompe lo stato interno', async () => {
        grip.globalHooks.before.push('NON UNA FUNZIONE')
        const res = await grip.fire('targetFn', { data: 'test' })
        expect(res.isSuccess).toBe(true)
        expect(res.result).toBe(4)
    })

})

describe('GRIP - isolamento istanza', () => {

    test('due istanze Grip hanno registry separati', async () => {
        const g1 = new Grip()
        const g2 = new Grip()
        g1.register({ name: 'fn', validate: () => {}, business: () => 1 })
        await expect(g2.fire('fn', {}))
            .rejects.toThrow("GRIP: 'fn' is not registered.")
    })

    test('hookAll su g1 non influenza g2', async () => {
        const g1 = new Grip()
        const g2 = new Grip()
        const before = jest.fn()
        g1.register({ name: 'fn', validate: () => {}, business: () => 1 })
        g2.register({ name: 'fn', validate: () => {}, business: () => 2 })
        g1.hookAll({ before })
        await g2.fire('fn', {})
        expect(before).not.toHaveBeenCalled()
    })

    test('fire concorrente — i context sono isolati', async () => {
        register({
            name: 'concurrentFn',
            validate: () => {},
            business: async (_, ctx) => {
                await new Promise(r => setTimeout(r, 10))
                return ctx.id
            }
        })
        grip.hook('concurrentFn', {
            before: async (_, ctx) => { ctx.id = Math.random() }
        })
        const [r1, r2] = await Promise.all([
            grip.fire('concurrentFn', {}),
            grip.fire('concurrentFn', {})
        ])
        expect(r1.result).not.toBe(r2.result)
        expect(typeof r1.result).toBe('number')
    })

})

describe('GRIP - introspection', () => {

    test('list restituisce i nomi delle funzioni registrate', () => {
        register({ name: 'fnA', validate: () => {}, business: () => 1 })
        register({ name: 'fnB', validate: () => {}, business: () => 2 })
        expect(grip.list()).toEqual(expect.arrayContaining(['fnA', 'fnB']))
    })

    test('isRegistered restituisce true per funzione registrata', () => {
        register({ name: 'fnX', validate: () => {}, business: () => 1 })
        expect(grip.isRegistered('fnX')).toBe(true)
    })

    test('isRegistered restituisce false per funzione non registrata', () => {
        expect(grip.isRegistered('inesistente')).toBe(false)
    })

    test('isRegistered restituisce false dopo unregister', () => {
        register({ name: 'fnZ', validate: () => {}, business: () => 1 })
        grip.unregister('fnZ')
        expect(grip.isRegistered('fnZ')).toBe(false)
    })

    test('unregister rimuove la funzione dal registry', async () => {
        register({ name: 'fnC', validate: () => {}, business: () => 3 })
        grip.unregister('fnC')
        await expect(grip.fire('fnC', {}))
            .rejects.toThrow("GRIP: 'fnC' is not registered.")
    })

    test('unregister su nome non registrato emette un warning', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
        grip.unregister('inesistente')
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("'inesistente'"))
        warn.mockRestore()
    })

    test('clearHooks rimuove gli hook di una funzione specifica', async () => {
        const before = jest.fn()
        register({ name: 'fnD', validate: () => {}, business: () => 4 })
        grip.hook('fnD', { before })
        grip.clearHooks('fnD')
        await grip.fire('fnD', {})
        expect(before).not.toHaveBeenCalled()
    })

    test('clearHooks su nome non registrato emette un warning', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
        grip.clearHooks('inesistente')
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("'inesistente'"))
        warn.mockRestore()
    })

    test('clearGlobalHooks svuota solo i global hooks', async () => {
        const globalFn = jest.fn()
        const localFn  = jest.fn()
        register({ name: 'fnGClear', validate: () => {}, business: () => 1 })
        grip.hookAll({ before: globalFn })
        grip.hook('fnGClear', { before: localFn })
        grip.clearGlobalHooks()
        await grip.fire('fnGClear', {})
        expect(globalFn).not.toHaveBeenCalled()
        expect(localFn).toHaveBeenCalled()
    })

    test('removeHook rimuove un singolo hook per riferimento', async () => {
        const fn1 = jest.fn()
        const fn2 = jest.fn()
        register({ name: 'fnRemove', validate: () => {}, business: () => 1 })
        grip.hook('fnRemove', { before: fn1 })
        grip.hook('fnRemove', { before: fn2 })
        grip.removeHook('fnRemove', 'before', fn1)
        await grip.fire('fnRemove', {})
        expect(fn1).not.toHaveBeenCalled()
        expect(fn2).toHaveBeenCalled()
    })

    test('reset svuota registry, pending hooks e global hooks', () => {
        register({ name: 'fnE', validate: () => {}, business: () => 5 })
        grip.hookAll({ before: jest.fn() })
        grip.reset()
        expect(grip.list()).toEqual([])
        expect(grip.globalHooks.before).toEqual([])
    })

    test('getHooks restituisce gli hook attivi su una funzione', () => {
        const fn1 = jest.fn()
        const fn2 = jest.fn()
        register({ name: 'fnHooks', validate: () => {}, business: () => 1 })
        grip.hook('fnHooks', { before: fn1, label: 'auth' })
        grip.hook('fnHooks', { after: fn2 })
        const hooks = grip.getHooks('fnHooks')
        expect(hooks.before).toHaveLength(1)
        expect(hooks.before[0].fn).toBe(fn1)
        expect(hooks.before[0].label).toBe('auth')
        expect(hooks.after).toHaveLength(1)
        expect(hooks.guard).toHaveLength(0)
    })

    test('getHooks restituisce null per funzione non registrata', () => {
        expect(grip.getHooks('inesistente')).toBeNull()
    })

    test('getHooks restituisce copie — mutarle non corrompe lo stato', async () => {
        const before = jest.fn()
        register({ name: 'fnHooksIso', validate: () => {}, business: () => 1 })
        grip.hook('fnHooksIso', { before })
        grip.getHooks('fnHooksIso').before.push({ fn: jest.fn(), label: 'injected' })
        await grip.fire('fnHooksIso', {})
        expect(before).toHaveBeenCalledTimes(1)
    })

    test('getPendingHooks restituisce gli hook pendenti per nome non ancora registrato', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
        const fn = jest.fn()
        grip.hook('pendingFn', { before: fn, label: 'my-label' })
        const pending = grip.getPendingHooks('pendingFn')
        expect(pending).not.toBeNull()
        expect(pending.before).toHaveLength(1)
        expect(pending.before[0].fn).toBe(fn)
        expect(pending.before[0].label).toBe('my-label')
        warn.mockRestore()
    })

    test('getPendingHooks restituisce null se non ci sono hook pendenti', () => {
        expect(grip.getPendingHooks('nessuno')).toBeNull()
    })

    test('getPendingHooks restituisce copie — mutarle non corrompe lo stato', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
        const fn = jest.fn()
        grip.hook('pendingIso', { before: fn })
        grip.getPendingHooks('pendingIso').before.push({ fn: jest.fn() })
        register({ name: 'pendingIso', validate: () => {}, business: () => 1 })
        await grip.fire('pendingIso', {})
        expect(fn).toHaveBeenCalledTimes(1)
        warn.mockRestore()
    })

    test('reset svuota i pending hooks', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
        const pendingBefore = jest.fn()
        grip.hook('futuro', { before: pendingBefore })
        grip.reset()
        register({ name: 'futuro', validate: () => {}, business: () => 1 })
        await grip.fire('futuro', {})
        expect(pendingBefore).not.toHaveBeenCalled()
        warn.mockRestore()
    })

})

describe('GRIP - Evidenze Criticità (Review)', () => {

    test('[Context] - before hook popola context, business lo legge', async () => {
        register({
            name: 'needContext',
            validate: () => {},
            business: (args, context) => context?.userId
        })

        grip.hook('needContext', {
            before: (payload, context) => {
                context.userId = 'user_123'
            }
        })

        const res = await grip.fire('needContext', { original: 'data' })
        expect(res.result).toBe('user_123')
    })

    test('[Context] - context è condiviso tra tutte le fasi della pipeline', async () => {
        const phases = []
        register({
            name: 'ctxPipeline',
            validate:     (_, ctx) => { phases.push(`validate:${ctx.tag}`) },
            business:     (_, ctx) => { phases.push(`business:${ctx.tag}`); return 1 },
            assertResult: (_, ctx) => { phases.push(`assertResult:${ctx.tag}`) }
        })
        grip.hook('ctxPipeline', {
            before: (_, ctx) => { ctx.tag = 'X'; phases.push(`before:${ctx.tag}`) },
            guard:  (_, ctx) => { phases.push(`guard:${ctx.tag}`) },
            after:  (_, ctx) => { phases.push(`after:${ctx.tag}`) }
        })
        await grip.fire('ctxPipeline', {})
        expect(phases).toEqual(['before:X', 'guard:X', 'validate:X', 'business:X', 'assertResult:X', 'after:X'])
    })

    test('[Context] - fire accetta un context iniziale', async () => {
        register({
            name: 'ctxInit',
            validate: () => {},
            business: (_, ctx) => ctx.userId
        })
        const res = await grip.fire('ctxInit', {}, { userId: 'u42' })
        expect(res.result).toBe('u42')
    })

    test('[Context] - initialContext non viene mutato dal framework', async () => {
        register({
            name: 'ctxMutate',
            validate: () => {},
            business: (_, ctx) => { ctx.internal = true; return 1 }
        })
        const initial = { userId: 'x' }
        await grip.fire('ctxMutate', {}, initial)
        expect(initial.internal).toBeUndefined()
    })

    test('[Strict Mode] - hook su nome non registrato lancia in modalità strict', () => {
        const strictGrip = new Grip({ strict: true })
        expect(() => {
            strictGrip.hook('gripCalcAreaSquarE', { before: () => {} })
        }).toThrow(/not registered/)
    })

    test('[Strict Mode] - clearHooks su nome non registrato lancia in strict mode', () => {
        const strictGrip = new Grip({ strict: true })
        expect(() => strictGrip.clearHooks('ghost'))
            .toThrow(/not registered/)
    })

    test('[Strict Mode] - unregister su nome non registrato lancia in strict mode', () => {
        const strictGrip = new Grip({ strict: true })
        expect(() => strictGrip.unregister('ghost'))
            .toThrow(/not registered/)
    })

    test('[Logger] - logger custom riceve gli errori degli hook', async () => {
        const customLogger = { error: jest.fn() }
        const g = new Grip({ logger: customLogger })

        g.register({ name: 'errorFn', validate: () => {}, business: () => {} })
        g.hook('errorFn', { before: () => { throw new Error('SILENT_ERROR') } })

        await g.fire('errorFn', {})
        expect(customLogger.error).toHaveBeenCalled()
    })

    test('[Label] - hook con label include il nome nel log di errore', async () => {
        const customLogger = { error: jest.fn() }
        const g = new Grip({ logger: customLogger })

        g.register({ name: 'labelFn', validate: () => {}, business: () => 1 })
        g.hook('labelFn', { before: () => { throw new Error('CRASH') }, label: 'my-auth-hook' })

        await g.fire('labelFn', {})
        expect(customLogger.error).toHaveBeenCalledWith(
            expect.stringContaining("in 'my-auth-hook'"),
            expect.any(Error)
        )
    })

})
