import type { Request, Response } from 'express'
import { MongoClient } from 'mongodb'

const mongoUrl = process.env.MONGO_URL || 'mongodb://mongo/mredb'
let client: MongoClient | null = null

async function propertiesCollection() {
  if (!client) {
    client = new MongoClient(mongoUrl)
    await client.connect()
  }
  return client.db().collection('properties')
}

/**
 * GET /tenantapi/public/properties?realmId=...&city=FES&type=room&minPrice=0&maxPrice=10000000&q=&limit=200
 */
export async function getPublicProperties(req: Request, res: Response) {
  try {
    const { realmId, city, type, minPrice, maxPrice, q } = req.query as Record<string, string>
    const limit = Math.min(Number(req.query.limit) || 200, 500)
    if (!realmId) return res.status(400).json({ error: 'realmId_required' })

    const filter: any = { realmId, published: true }
    if (city) filter['address.city'] = city
    if (type && type !== 'all') filter.type = type
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = Number(minPrice)
      if (maxPrice) filter.price.$lte = Number(maxPrice)
    }
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { 'address.city': { $regex: q, $options: 'i' } }
      ]
    }

    const col = await propertiesCollection()
    const items = await col.find(filter, {
      projection: {
        _id: 1, name: 1, type: 1, transaction: 1, price: 1, surface: 1,
        rooms: 1, address: 1, description: 1, image: 1, images: 1
      }
    }).sort({ _id: -1 }).limit(limit).toArray()

    return res.json({
      items: items.map(x => ({
        id: x._id,
        name: x.name,
        type: x.type,
        transaction: x.transaction || (x.type === 'room' ? 'rent' : 'sale'),
        price: Number(x.price) || 0,
        surface: Number(x.surface) || 0,
        rooms: x.rooms,
        address: x.address,
        description: x.description || '',
        image: x.image || null,
        images: Array.isArray(x.images) ? x.images : []
      }))
    })
  } catch {
    return res.status(500).json({ error: 'internal_error' })
  }
}
