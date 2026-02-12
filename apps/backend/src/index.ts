import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'

const app = express()
const port = Number(process.env.PORT || 9000)
const jwtSecret = process.env.JWT_SECRET || 'dev_secret'
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/flowers' })

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001'], credentials: true }))
app.use(express.json())
app.use(cookieParser())

type Role = 'ADMIN' | 'FLORIST_A' | 'FLORIST_B'

async function initDb() {
  await pool.query(`
    create table if not exists users (
      id text primary key,
      email text unique not null,
      password_hash text not null,
      role text not null,
      point_code text
    );
    create table if not exists pickup_points (
      id text primary key,
      code text unique not null,
      name text not null
    );
    create table if not exists products (
      id text primary key,
      title text not null,
      description text not null,
      price integer not null,
      image_url text not null
    );
    create table if not exists stories (
      id text primary key,
      title text not null,
      cover_image_url text not null,
      is_active boolean default true,
      starts_at timestamptz not null,
      ends_at timestamptz not null,
      sort_order integer default 0,
      version integer default 1
    );
    create table if not exists story_items (
      id text primary key,
      story_id text not null references stories(id) on delete cascade,
      type text not null,
      media_url text not null,
      duration_ms integer not null,
      headline text,
      subtext text,
      cta_label text,
      cta_href text,
      sort_order integer default 0
    );
    create table if not exists orders (
      id text primary key,
      customer_name text not null,
      customer_phone text not null,
      status text not null,
      items jsonb not null,
      total integer not null,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz default now()
    );
  `)

  const users = await pool.query('select count(*)::int as c from users')
  if (users.rows[0].c === 0) {
    const adminPass = await bcrypt.hash('admin123', 10)
    const aPass = await bcrypt.hash('floristA123', 10)
    const bPass = await bcrypt.hash('floristB123', 10)
    await pool.query(
      'insert into users (id,email,password_hash,role,point_code) values ($1,$2,$3,$4,$5),($6,$7,$8,$9,$10),($11,$12,$13,$14,$15)',
      [uuid(), 'admin@flowers.local', adminPass, 'ADMIN', null, uuid(), 'a@flowers.local', aPass, 'FLORIST_A', 'A', uuid(), 'b@flowers.local', bPass, 'FLORIST_B', 'B']
    )
  }

  await pool.query(`insert into pickup_points(id,code,name) values
    ('pp-a','A','Point A') on conflict (code) do nothing`)
  await pool.query(`insert into pickup_points(id,code,name) values
    ('pp-b','B','Point B') on conflict (code) do nothing`)

  const prodCount = await pool.query('select count(*)::int as c from products')
  if (prodCount.rows[0].c === 0) {
    const data = [
      ['Розовый шепот', 'Нежный букет роз и эустомы', 3900, 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=900'],
      ['Утренний сад', 'Тюльпаны и маттиола', 3200, 'https://images.unsplash.com/photo-1463320726281-696a485928c7?w=900'],
      ['Лавандовый бриз', 'Лаванда, ранункулюс и зелень', 4500, 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=900'],
      ['Пудровый микс', 'Пионы и кустовая роза', 5200, 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=900'],
      ['Сливочный рассвет', 'Кремовые розы и гвоздики', 3600, 'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?w=900']
    ]
    for (const d of data) {
      await pool.query('insert into products(id,title,description,price,image_url) values($1,$2,$3,$4,$5)', [uuid(), d[0], d[1], d[2], d[3]])
    }
  }
}

function auth(required?: Role) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.cookies.ops_session
    if (!token) return res.status(401).json({ message: 'unauthorized' })
    try {
      const decoded = jwt.verify(token, jwtSecret) as { role: Role; email: string; point_code?: 'A' | 'B' }
      ;(req as any).user = decoded
      if (required && decoded.role !== required) return res.status(403).json({ message: 'forbidden' })
      next()
    } catch {
      return res.status(401).json({ message: 'invalid session' })
    }
  }
}

app.get('/health', (_, res) => res.json({ ok: true }))
app.get('/store/products', async (_, res) => {
  const products = await pool.query('select * from products order by title')
  res.json(products.rows)
})

app.get('/store/stories', async (_, res) => {
  const rows = await pool.query(`select * from stories where is_active=true and starts_at <= now() and ends_at >= now() order by sort_order asc`)
  res.json(rows.rows)
})
app.get('/store/stories/:id', async (req, res) => {
  const items = await pool.query('select * from story_items where story_id=$1 order by sort_order asc', [req.params.id])
  res.json(items.rows)
})

app.post('/store/orders', async (req, res) => {
  const { customer_name, customer_phone, items, metadata } = req.body
  const normalized = { ...metadata, payment_status: 'none', claimed_by_point_code: null, payment_link: null }
  const total = (items || []).reduce((s: number, i: any) => s + i.price * i.qty, 0)
  const order = {
    id: uuid(), customer_name, customer_phone, status: 'new', items, total, metadata: normalized
  }
  await pool.query('insert into orders(id,customer_name,customer_phone,status,items,total,metadata) values($1,$2,$3,$4,$5,$6,$7)',
    [order.id, order.customer_name, order.customer_phone, order.status, JSON.stringify(order.items), order.total, JSON.stringify(order.metadata)])
  res.status(201).json(order)
})

app.get('/store/orders/:id', async (req, res) => {
  const row = await pool.query('select * from orders where id=$1', [req.params.id])
  if (!row.rows[0]) return res.status(404).json({ message: 'not found' })
  res.json(row.rows[0])
})

app.post('/ops/auth/login', async (req, res) => {
  const { email, password } = req.body
  const user = await pool.query('select * from users where email=$1', [email])
  if (!user.rows[0]) return res.status(401).json({ message: 'bad credentials' })
  const ok = await bcrypt.compare(password, user.rows[0].password_hash)
  if (!ok) return res.status(401).json({ message: 'bad credentials' })
  const token = jwt.sign({ email, role: user.rows[0].role, point_code: user.rows[0].point_code }, jwtSecret, { expiresIn: '8h' })
  res.cookie('ops_session', token, { httpOnly: true, sameSite: 'lax' })
  res.json({ role: user.rows[0].role, point_code: user.rows[0].point_code })
})

app.get('/ops/me', auth(), (req, res) => res.json((req as any).user))

app.get('/ops/orders', auth(), async (req, res) => {
  const user = (req as any).user as { role: Role; point_code?: 'A' | 'B' }
  const rows = await pool.query('select * from orders order by created_at desc')
  let orders = rows.rows
  if (user.role === 'FLORIST_A' || user.role === 'FLORIST_B') {
    const code = user.point_code
    orders = orders.filter((o: any) => {
      const m = o.metadata
      const pickupMatch = m.delivery_mode === 'pickup' && m.pickup_point_code === code
      const deliveryVisible = m.delivery_mode === 'delivery' && (!m.claimed_by_point_code || m.claimed_by_point_code === code)
      return pickupMatch || deliveryVisible
    })
  }
  res.json(orders)
})

app.post('/ops/orders/:id/claim', auth(), async (req, res) => {
  const { point_code } = req.body as { point_code: 'A' | 'B' }
  const result = await pool.query(
    `update orders set metadata = jsonb_set(metadata, '{claimed_by_point_code}', to_jsonb($1::text))
     where id=$2 and metadata->>'delivery_mode'='delivery' and coalesce(metadata->>'claimed_by_point_code','') = '' returning *`,
    [point_code, req.params.id]
  )
  if (!result.rows[0]) return res.status(409).json({ message: 'already claimed' })
  res.json(result.rows[0])
})

app.post('/ops/orders/:id/confirm', auth(), async (req, res) => {
  const orderId = req.params.id
  const token = Buffer.from(`${orderId}:${Date.now()}`).toString('base64url')
  const link = `http://localhost:9000/pay/${orderId}?token=${token}`
  const updated = await pool.query(
    `update orders set status='awaiting_payment', metadata = metadata || jsonb_build_object('payment_link',$1,'payment_status','awaiting') where id=$2 returning *`,
    [link, orderId]
  )
  res.json(updated.rows[0])
})

app.post('/ops/orders/:id/message', auth(), async (req, res) => {
  const { text } = req.body
  const updated = await pool.query(`update orders set metadata = metadata || jsonb_build_object('last_message',$1) where id=$2 returning *`, [text, req.params.id])
  res.json(updated.rows[0])
})

app.get('/pay/:orderId', async (req, res) => {
  res.send(`<html><body><h1>Mock payment</h1><form method='post' action='/pay/complete'><input type='hidden' name='order_id' value='${req.params.orderId}'/><button>Complete payment</button></form></body></html>`)
})
app.use(express.urlencoded({ extended: true }))
app.post('/pay/complete', async (req, res) => {
  const { order_id } = req.body
  await pool.query(`update orders set status='paid', metadata = metadata || jsonb_build_object('payment_status','paid') where id=$1`, [order_id])
  res.send('Payment completed')
})

app.get('/admin/pickup-points', auth('ADMIN'), async (_, res) => res.json((await pool.query('select * from pickup_points order by code')).rows))
app.post('/admin/pickup-points', auth('ADMIN'), async (req, res) => {
  const p = await pool.query('insert into pickup_points(id,code,name) values($1,$2,$3) returning *', [uuid(), req.body.code, req.body.name])
  res.status(201).json(p.rows[0])
})
app.put('/admin/pickup-points/:id', auth('ADMIN'), async (req, res) => {
  const p = await pool.query('update pickup_points set code=$1,name=$2 where id=$3 returning *', [req.body.code, req.body.name, req.params.id])
  res.json(p.rows[0])
})
app.delete('/admin/pickup-points/:id', auth('ADMIN'), async (req, res) => { await pool.query('delete from pickup_points where id=$1', [req.params.id]); res.status(204).end() })

app.get('/admin/stories', auth('ADMIN'), async (_, res) => res.json((await pool.query('select * from stories order by sort_order')).rows))
app.post('/admin/stories', auth('ADMIN'), async (req, res) => {
  const s = req.body
  const r = await pool.query(`insert into stories(id,title,cover_image_url,is_active,starts_at,ends_at,sort_order,version) values($1,$2,$3,$4,$5,$6,$7,$8) returning *`, [uuid(), s.title, s.cover_image_url, s.is_active ?? true, s.starts_at, s.ends_at, s.sort_order ?? 0, s.version ?? 1])
  res.status(201).json(r.rows[0])
})
app.put('/admin/stories/:id', auth('ADMIN'), async (req, res) => {
  const s = req.body
  const r = await pool.query(`update stories set title=$1,cover_image_url=$2,is_active=$3,starts_at=$4,ends_at=$5,sort_order=$6,version=$7 where id=$8 returning *`, [s.title, s.cover_image_url, s.is_active, s.starts_at, s.ends_at, s.sort_order, s.version, req.params.id])
  res.json(r.rows[0])
})
app.delete('/admin/stories/:id', auth('ADMIN'), async (req, res) => { await pool.query('delete from stories where id=$1', [req.params.id]); res.status(204).end() })
app.get('/admin/stories/:id/items', auth('ADMIN'), async (req, res) => res.json((await pool.query('select * from story_items where story_id=$1 order by sort_order', [req.params.id])).rows))
app.post('/admin/stories/:id/items', auth('ADMIN'), async (req, res) => {
  const i = req.body
  const r = await pool.query(`insert into story_items(id,story_id,type,media_url,duration_ms,headline,subtext,cta_label,cta_href,sort_order) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`, [uuid(), req.params.id, i.type, i.media_url, i.duration_ms, i.headline || null, i.subtext || null, i.cta_label || null, i.cta_href || null, i.sort_order || 0])
  res.status(201).json(r.rows[0])
})

app.get('/admin/users', auth('ADMIN'), async (_, res) => res.json((await pool.query('select id,email,role,point_code from users order by email')).rows))
app.post('/admin/users', auth('ADMIN'), async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 10)
  const r = await pool.query('insert into users(id,email,password_hash,role,point_code) values($1,$2,$3,$4,$5) returning id,email,role,point_code', [uuid(), req.body.email, hash, req.body.role, req.body.point_code || null])
  res.status(201).json(r.rows[0])
})

initDb().then(() => app.listen(port, () => console.log(`backend on ${port}`)))
