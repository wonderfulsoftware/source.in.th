const config = [
  // https://github.com/wonderfulsoftware/source.in.th/blob/main/public/_redirects
  ['source.in.th', 'CNAME', 'apex-loadbalancer.netlify.com'],
  ['www.source.in.th', 'CNAME', 'sourceinth.netlify.app'],
  ['discord.bangkok.open.source.in.th', 'CNAME', 'sourceinth.netlify.app'],

  // https://github.com/rayriffy/lamb
  ['lamb.source.in.th', 'CNAME', 'rayriffy.github.io'],

  // https://github.com/dtinth/screenshot-redirector
  ['screenshot.source.in.th', 'CNAME', 'cname.vercel-dns.com'],

  // Experiment with Canasta
  ['bangkok.source.in.th', 'A', '103.169.67.34'],

  // https://github.com/dtinth/transit.source.in.th
  ['transit.source.in.th', 'CNAME', 'cname.vercel-dns.com'],

  // chordsource
  ['db.chord.source.in.th', 'CNAME', 'dtinth.github.io'],
]

const zoneId = process.env.CLOUDFLARE_ZONE_ID
const apiToken = process.env.CLOUDFLARE_API_TOKEN

await sync()

async function sync() {
  const zones = await getZones()
  const tasks = []
  for (const entry of config) {
    const [name, type, content] = entry
    const zone = zones.find((zone) => zone.name === name && zone.type === type)
    if (zone) {
      const id = zone.id
      if (!content) {
        tasks.push({
          name: `Delete: ${name} ${type} (id: ${id})`,
          run: () => deleteZoneById(id),
        })
      } else if (zone.content !== content) {
        tasks.push({
          name: `Update: ${name} ${type} -> ${content} (id: ${id})`,
          run: () => updateZoneById(id, type, name, content),
        })
      } else {
        tasks.push({
          name: `Up-to-date: ${name} ${type} -> ${content} (id: ${id})`,
        })
      }
    } else {
      tasks.push({
        name: `Create: ${name} ${type} -> ${content}`,
        run: () => createZone(type, name, content),
      })
    }
  }
  for (const task of tasks) {
    console.log(task.name)
    if (task.run && process.argv.includes('-f')) {
      console.log(await task.run())
    }
  }
}

async function getZones() {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    },
  )
  const { result } = await response.json()
  return result
}

async function deleteZoneById(id) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${id}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    },
  )
  return `${response.status}`
}

async function updateZoneById(id, type, name, content) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${id}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, name, content, ttl: 1 }),
    },
  )
  return `${response.status}`
}

async function createZone(type, name, content) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, name, content, ttl: 1 }),
    },
  )
  const { result } = await response.json()
  return `${response.status} ${result.id}`
}
