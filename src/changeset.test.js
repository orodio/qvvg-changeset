import {
  defineChangeset,
  change,
  field,
  label,
  type,
  clear,
  commit,
  validation,
  validate,
  required,
  updateData,
} from './changeset.js'

const FIELDS = new Set(['firstName', 'lastName', 'age', 'price', 'town'])

describe('definition', () => {
  const def = defineChangeset([
    field('firstName'),
    field('lastName', [
      label('Last Name'),
      type('text', {
        value: 'DEFAULT_VALUE',
        toInputValue: v => v.toLowerCase(),
        fromInputValue: v => v.toUpperCase(),
      }),
      validation([required()]),
    ]),
    field('age', [type('number', {value: 99})]),
    field('price', [type('float', {value: 12.345})]),
    field('town', [validation([required()])]),
  ])

  describe('basic structure', () => {
    describe('fields', () => {
      test('exists', () => expect(def.fields).toBeDefined())
      test('correct content', () => expect(def.fields).toEqual(FIELDS))
    })
    describe('config', () => {
      test('exists', () => expect(def.config).toBeDefined())
    })
    describe('data', () => {
      test('exists', () => expect(def.data).toBeDefined())
      test('has all fields', () => expect(new Set(Object.keys(def.data))).toEqual(FIELDS))
      test('has correct values', () => {
        const values = {}
        for (let field of def.fields) values[field] = def.config[field].value
        expect(def.data).toEqual(values)
      })
    })
    describe('changes', () => {
      test('exists', () => expect(def.changes).toBeDefined())
      test('starts out empty', () => expect(def.changes).toEqual({}))
    })
    describe('values', () => {
      test('exists', () => expect(def.values).toBeDefined())
      test('starts out same as data', () => expect(def.values).toEqual(def.data))
    })
    describe('errorsForData', () => {
      test('exists', () => expect(def.errorsForData).toBeDefined())
    })
    describe('errorsForChanges', () => {
      test('exists', () => expect(def.errorsForChanges).toBeDefined())
    })
    describe('errorsForValues', () => {
      test('exists', () => expect(def.errorsForChanges).toBeDefined())
    })
  })

  describe('config', () => {
    const testConfig = key => {
      describe(key, () => {
        const c = def.config[key]
        test('is defined', () => expect(c).toBeDefined())
        test(`key is ${key}`, () => expect(c.key).toBe(key))
        test(`label is defined`, () => expect(c.label).toBeDefined())
        test(`type is defined`, () => expect(c.type).toBeDefined())
        test(`value is defined`, () => expect(c.value).toBeDefined())
        test(`toInputValue is defined`, () => expect(c.toInputValue).toBeDefined())
        test(`fromInputValue is defined`, () => expect(c.fromInputValue).toBeDefined())
        test(`from(to(value)) === value`, () =>
          expect(c.fromInputValue(c.toInputValue(c.value))).toBe(c.value))
      })
    }

    for (let key of def.fields) testConfig(key)

    describe('type config for lastName', () => {
      const c = def.config.lastName
      describe('has custom', () => {
        test('default value', () => expect(c.value).toBe('DEFAULT_VALUE'))
        test('label', () => expect(c.label).toBe('Last Name'))
        test('toInputValue', () => expect(c.toInputValue(c.value)).toBe('default_value'))
        test('toFromValue', () =>
          expect(c.fromInputValue(c.toInputValue(c.value))).toBe('DEFAULT_VALUE'))
      })
    })

    describe('type config for age', () => {
      const c = def.config.age
      test('toInputValue', () => expect(c.toInputValue(c.value)).toBe('99'))
      test('fromInputValue', () => expect(c.fromInputValue(c.toInputValue(c.value))).toBe(99))
    })

    describe('type config for price', () => {
      const c = def.config.price
      test('toInputValue', () => expect(c.toInputValue(c.value)).toBe('12.345'))
      test('fromInputValue', () => expect(c.fromInputValue(c.toInputValue(c.value))).toBe(12.345))
    })
  })
})

test('change', () => {
  const def = defineChangeset([
    field('firstName', [label('First Name'), type('text')]),
    field('lastName', [label('Last Name'), type('text')]),
    field('age', [label('Age'), type('number')]),
  ])

  const cx1 = change(def, {firstName: 'Bob'})
  const cx2 = change(cx1, {lastName: 'Builder'})
  const cx3 = change(cx2, {age: 25})
  const cx4 = clear(cx3)
  const cx5 = commit(cx3)

  // Run expects after all change happen to disprove mutation
  expect(def.data).toEqual({firstName: '', lastName: '', age: 0})
  expect(def.changes).toEqual({})
  expect(def.changedFields.size).toEqual(0)
  expect(def.values).toEqual({firstName: '', lastName: '', age: 0})

  expect(cx1.data).toEqual({firstName: '', lastName: '', age: 0})
  expect(cx1.changes).toEqual({firstName: 'Bob'})
  expect(cx1.changedFields.size).toEqual(1)
  expect(cx1.values).toEqual({firstName: 'Bob', lastName: '', age: 0})

  expect(cx2.data).toEqual({firstName: '', lastName: '', age: 0})
  expect(cx2.changes).toEqual({firstName: 'Bob', lastName: 'Builder'})
  expect(cx2.changedFields.size).toEqual(2)
  expect(cx2.values).toEqual({firstName: 'Bob', lastName: 'Builder', age: 0})

  expect(cx3.data).toEqual({firstName: '', lastName: '', age: 0})
  expect(cx3.changes).toEqual({firstName: 'Bob', lastName: 'Builder', age: 25})
  expect(cx3.changedFields.size).toEqual(3)
  expect(cx3.values).toEqual({firstName: 'Bob', lastName: 'Builder', age: 25})

  expect(cx4.data).toEqual(def.data)
  expect(cx4.changes).toEqual(def.changes)
  expect(cx4.changedFields.size).toEqual(0)
  expect(cx4.values).toEqual(def.values)

  expect(cx5.data).toEqual(cx3.values)
  expect(cx5.changes).toEqual(def.changes)
  expect(cx5.values).toEqual(cx3.values)
  expect(cx5.changedFields.size).toEqual(0)
})

describe('validation', () => {
  const def = defineChangeset([
    field('a'),
    field('b', [validation([required()])]),
    field('c', [type('text', {value: 'foo'}), validation([required()])]),
    field('d', [type('number'), validation([validate('must be greater than 5', v => v > 5)])]),
    field('e', [
      type('number'),
      validation([
        (ctx, value) => {
          if (value <= 5) return ctx.Bad(value, 'NO!')
          return ctx.Good(value)
        },
      ]),
    ]),
    field('f', [type('text', {value: null}), validation([required()])]),
  ])

  const cx1 = change(def, {a: 'foo', b: 'rawr', c: 'pew', d: 9, e: 9, f: '10'})
  const cx2 = commit(cx1)
  const cx3 = clear(cx1)

  const testErrors = (label, cs, data = {}, changes = {}, values = {}) => {
    const count = (errors = {}) => Object.keys(errors).length

    describe('errors', () => {
      describe(label, () => {
        if (cs.validData == null) console.log('!!!!', cs)
        test('data', () => expect(cs.errorsForData).toEqual(data))
        test('data valid', () => expect(cs.validData).toBe(!count(data)))
        test('changes', () => expect(cs.errorsForChanges).toEqual(changes))
        test('changes valid', () => expect(cs.validChanges).toBe(!count(changes)))
        test('values', () => expect(cs.errorsForValues).toEqual(values))
        test('values valid', () => expect(cs.validValues).toBe(!count(values)))
      })
    })
  }

  testErrors(
    'initial',
    def,
    {b: 'is required', d: 'must be greater than 5', e: 'NO!', f: 'is required'},
    {},
    {b: 'is required', d: 'must be greater than 5', e: 'NO!', f: 'is required'}
  )
  testErrors('cx1', cx1, {b: 'is required', d: 'must be greater than 5', e: 'NO!', f: 'is required'}, {}, {})
  testErrors('cx2', cx2, {}, {}, {}, {})
  testErrors(
    'cx3',
    cx3,
    {b: 'is required', d: 'must be greater than 5', e: 'NO!', f: 'is required'},
    {},
    {b: 'is required', d: 'must be greater than 5', e: 'NO!', f: 'is required'}
  )
})

describe('scrub', () => {
  const def = defineChangeset([field('a'), field('b'), field('c')])

  const cx1 = commit(change(def, {a: 'foo', b: 'bar', c: 'baz'}))
  const cx2 = change(cx1, {a: 'foo', b: 'bar', c: 'baz'})

  expect(cx1.data).toEqual(cx2.data)
  expect(cx1.changes).toEqual(cx2.changes)
  expect(cx1.values).toEqual(cx2.values)
})

describe('updateData', () => {
  const def = defineChangeset([field('a'), field('b'), field('c')])

  const cx1 = commit(change(def, {a: 'foo', b: 'bar', c: 'baz'}))
  const cx2 = change(cx1, {a: 'a', b: 'b'})
  const cx3 = updateData(cx2, {a: 'a'})

  expect(cx3.data).toEqual({a: 'a', b: 'bar', c: 'baz'})
  expect(cx3.changes).toEqual({b: 'b'})
  expect(cx3.values).toEqual({a: 'a', b: 'b', c: 'baz'})
})
