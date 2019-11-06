import {changeset, defineChangeset, field, label, type, clear, commit} from './changeset.js'

test('definition', () => {
  const def = defineChangeset([
    field('firstName', [label('First Name'), type('text')]),
    field('lastName', [label('Last Name'), type('text')]),
    field('age', [label('Age'), type('number')]),
  ])

  expect(def.fields).toEqual(new Set(['firstName', 'lastName', 'age']))
  expect(def.config.firstName).toEqual({
    key: 'firstName',
    label: 'First Name',
    type: 'text',
    value: '',
  })
  expect(def.config.lastName).toEqual({
    key: 'lastName',
    label: 'Last Name',
    type: 'text',
    value: '',
  })
  expect(def.config.age).toEqual({
    key: 'age',
    label: 'Age',
    type: 'number',
    value: 0,
  })

  expect(def.data).toEqual({firstName: '', lastName: '', age: 0})
  expect(def.changes).toEqual({})
  expect(def.values).toEqual({firstName: '', lastName: '', age: 0})
})

test('changeset', () => {
  const def = defineChangeset([
    field('firstName', [label('First Name'), type('text')]),
    field('lastName', [label('Last Name'), type('text')]),
    field('age', [label('Age'), type('number')]),
  ])

  const cx1 = changeset(def, {firstName: 'Bob'})
  const cx2 = changeset(cx1, {lastName: 'Builder'})
  const cx3 = changeset(cx2, {age: 25})
  const cx4 = clear(cx3)
  const cx5 = commit(cx3)

  // Run expects after all changesets happen to disprove mutation
  expect(def.data).toEqual({firstName: '', lastName: '', age: 0})
  expect(def.changes).toEqual({})
  expect(def.values).toEqual({firstName: '', lastName: '', age: 0})

  expect(cx1.data).toEqual({firstName: '', lastName: '', age: 0})
  expect(cx1.changes).toEqual({firstName: 'Bob'})
  expect(cx1.values).toEqual({firstName: 'Bob', lastName: '', age: 0})

  expect(cx2.data).toEqual({firstName: '', lastName: '', age: 0})
  expect(cx2.changes).toEqual({firstName: 'Bob', lastName: 'Builder'})
  expect(cx2.values).toEqual({firstName: 'Bob', lastName: 'Builder', age: 0})

  expect(cx3.data).toEqual({firstName: '', lastName: '', age: 0})
  expect(cx3.changes).toEqual({firstName: 'Bob', lastName: 'Builder', age: 25})
  expect(cx3.values).toEqual({firstName: 'Bob', lastName: 'Builder', age: 25})

  expect(cx4.data).toEqual(def.data)
  expect(cx4.changes).toEqual(def.changes)
  expect(cx4.values).toEqual(def.values)

  expect(cx5.data).toEqual(cx3.values)
  expect(cx5.changes).toEqual(def.changes)
  expect(cx5.values).toEqual(cx3.values)
})
