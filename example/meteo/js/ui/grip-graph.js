import { grip } from '../grip-instance.js'

const COLORS = {
  instance:        '#6366f1',
  function:        '#10b981',
  'hook-before':   '#38bdf8',
  'hook-guard':    '#fbbf24',
  'hook-after':    '#38bdf8',
  'global-before': '#818cf8',
  'global-guard':  '#f59e0b',
  'global-after':  '#818cf8',
}

function buildGraphData() {
  const nodes = []
  const links = []

  nodes.push({ id: 'grip', label: 'GRIP', group: 'instance', val: 12 })

  const globalHooks = grip.globalHooks
  for (const phase of ['before', 'guard', 'after']) {
    globalHooks[phase].forEach((hook, i) => {
      const id = `global-${phase}-${i}`
      nodes.push({ id, label: hook.label ?? `global ${phase}`, group: `global-${phase}`, val: 5 })
      links.push({ source: 'grip', target: id, phase })
    })
  }

  for (const name of grip.list()) {
    nodes.push({ id: name, label: name, group: 'function', val: 8 })
    links.push({ source: 'grip', target: name })

    const hooks = grip.getHooks(name)
    for (const phase of ['before', 'guard', 'after']) {
      hooks[phase].forEach((hook, i) => {
        const id = `${name}-${phase}-${i}`
        nodes.push({ id, label: hook.label ?? phase, group: `hook-${phase}`, val: 4 })
        links.push({ source: name, target: id, phase })
      })
    }
  }

  return { nodes, links }
}

let instance = null

export function openGripMap() {
  document.getElementById('gripMapModal').classList.remove('hidden')
  renderGraph()
}

export function closeGripMap() {
  document.getElementById('gripMapModal').classList.add('hidden')
  if (instance) { instance._destructor?.(); instance = null }
  document.getElementById('gripGraphContainer').innerHTML = ''
}

function renderGraph() {
  const container = document.getElementById('gripGraphContainer')
  container.innerHTML = ''

  const { nodes, links } = buildGraphData()

  instance = ForceGraph3D()(container)
    .width(container.clientWidth)
    .height(container.clientHeight)
    .backgroundColor('#030712')
    .graphData({ nodes, links })
    .nodeLabel('label')
    .nodeColor(n => COLORS[n.group] ?? '#6b7280')
    .nodeRelSize(5)
    .nodeOpacity(0.95)
    .linkColor(() => '#6b7280')
    .linkWidth(1.5)
    .linkDirectionalArrowLength(5)
    .linkDirectionalArrowRelPos(1)
    .linkDirectionalArrowColor(() => '#9ca3af')
}
