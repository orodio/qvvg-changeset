export const defineChangeset = (mods = []) => {
  const changeset = mods.reduce((changeset, mod) => mod(changeset), new Changeset())
  for (let field of changeset.fields) {
    changeset.data[field] = changeset.config[field].value
  }
  changeset.values = {...changeset.data}
  return changeset
}

export const field = (key, mods = []) => node => {
  node.fields.add(key)
  node.config[key] = mods.reduce((config, mod) => mod(config), {key})
  return node
}

export const label = label => config => ((config.label = label), config)

export const type = (type, value = null) => config => {
  config.type = type
  config.value = value != null ? value : {text: '', number: 0}[type]
  return config
}

export const changeset = (changeset, changes = {}) => {
  changeset = clone(changeset)
  changeset.changes = Object.keys(changes).reduce(
    (cx, key) => ({...cx, [key]: changes[key]}),
    changeset.changes
  )
  changeset.values = {...changeset.data, ...changeset.changes}
  return new Changeset(changeset)
}

export const clear = changeset => {
  changeset = clone(changeset)
  changeset.changes = {}
  changeset.values = changeset.data
  return changeset
}

export const commit = changeset => {
  changeset = clone(changeset)
  changeset.data = {...changeset.data, ...changeset.changes}
  changeset.changes = {}
  changeset.values = {...changeset.data}
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
}
