export const defineChangeset = (mods = []) => {
  let changeset = mods.reduce((changeset, mod) => mod(changeset), new Changeset())
  for (let field of changeset.fields) {
    changeset.data[field] = changeset.config[field].value
  }
  changeset.values = {...changeset.data}
  changeset = validateChangeset(changeset)
  return changeset
}

const toString = v => String(v)
const ident = v => v
export const label = label => config => ((config.label = label), config)
const typeTypes = {text: 'text', number: 'number', float: 'number', boolean: 'boolean'}
const typeValues = {text: '', number: 0, float: 0.0, boolean: false}
const typeToValues = {text: toString, number: toString, float: toString, boolean: ident}
const typeFromValues = {
  text: v => v,
  number: v => parseInt(v, 10),
  float: v => parseFloat(v, 10),
  boolean: ident,
}

const fallback = (args = []) => {
  if (!args.length) return null
  const [head, ...tail] = args
  if (head != null) return head
  return fallback(tail)
}

export const type = (type, opts = {}) => config => {
  config.type = typeTypes[type] || type
  config.value = opts.value != null ? opts.value : typeValues[type]
  config.toInputValue = opts.toInputValue || typeToValues[type] || toString
  config.fromInputValue = opts.fromInputValue || typeFromValues[type] || ident
  return config
}

export const validation = (fns = []) => config => {
  config.validate = pipe(
    {
      type: config.type,
      label: config.label,
      fromInputValue: config.fromInputValue,
      toInputValue: config.toInputValue,
    },
    fns
  )
  return config
}

export const required = () => ({Good, Bad, toInputValue}, value) => {
  if (toInputValue(value).length <= 0) return Bad(value, 'is required')
  return Good(value)
}

export const validate = (reason, predicate = () => true) => ({Good, Bad}, value) => {
  if (!predicate(value)) return Bad(value, reason)
  return Good(value)
}

export const field = (key, mods = []) => node => {
  node.fields.add(key)
  node.config[key] = [label(key), type('text'), validation(), ...mods].reduce(
    (config, mod) => mod(config),
    {key}
  )
  return node
}

const count = (errors = {}) => Object.keys(errors).length

function validateChangeset(cs) {
  let data = {}
  let changes = {}
  let values = {}
  for (let field of cs.fields) {
    const check = cs.config[field].validate
    const dv = check(cs.data[field])
    if (isBad(dv)) {
      data[field] = dv.reason
      values[field] = dv.reason
    }
    if (cs.changes[field] != null) {
      delete values[field]
      const cv = check(cs.changes[field])
      if (isBad(cv)) {
        changes[field] = cv.reason
        values[field] = cv.reason
      }
    }
  }
  cs.errorsForData = data
  cs.validData = !count(data)
  cs.errorsForChanges = changes
  cs.validChanges = !count(changes)
  cs.errorsForValues = values
  cs.validValues = !count(values)
  return cs
}

export const change = (changeset, changes = {}) => {
  changeset = clone(changeset)
  changeset.changes = Object.keys(changes).reduce(
    (cx, key) => ({...cx, [key]: changes[key]}),
    changeset.changes
  )
  changeset.values = {...changeset.data, ...changeset.changes}
  changeset = validateChangeset(changeset)
  return new Changeset(changeset)
}

export const clear = changeset => {
  changeset = clone(changeset)
  changeset.changes = {}
  changeset.values = changeset.data
  changeset = validateChangeset(changeset)
  return changeset
}

export const commit = changeset => {
  changeset = clone(changeset)
  changeset.data = {...changeset.data, ...changeset.changes}
  changeset.changes = {}
  changeset.values = {...changeset.data}
  changeset = validateChangeset(changeset)
  return changeset
}

function clone(changeset) {
  return Object.assign(new Changeset(), changeset)
}

function Changeset(changeset = {}) {
  this.fields = changeset.fields || new Set()
  this.config = changeset.config || {}
  this.data = changeset.data || {}
  this.changes = changeset.changes || {}
  this.values = changeset.values || {}
  this.errorsForData = changeset.errorsForData || {}
  this.errorsForChanges = changeset.errorsForChanges || {}
  this.errorsForValues = changeset.errorsForValues || {}
  this.validData = changeset.validData || false
  this.validChanges = changeset.validChanges || false
  this.validValues = changeset.validValues || false
}

export function Good(value) {
  if (!isGood(this)) return new Good(...arguments)
  this.value = value
}

export function Bad(value, reason) {
  if (!isBad(this)) return new Bad(...arguments)
  this.value = value
  this.reason = reason
}

export function ret(value) {
  if (isGood(value) || isBad(value)) return value
  return Good(value)
}

export function isGood(value) {
  return value instanceof Good
}

export function isBad(value) {
  return value instanceof Bad
}

export function pipe(ctx = {}, fns = []) {
  ctx.Good = Good
  ctx.Bad = Bad
  return function innerPipe(maybe) {
    maybe = ret(maybe)
    if (!fns.length || isBad(maybe)) return maybe
    var [head, ...tail] = fns
    return pipe(
      ctx,
      tail
    )(head(ctx, maybe.value))
  }
}
