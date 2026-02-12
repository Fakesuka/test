'use client'
import { Badge, Button, Card, Input } from '@flower/ui'
import { useEffect, useState } from 'react'
import { OrdersBoard } from '../../components/OrdersBoard'
const API = process.env.NEXT_PUBLIC_API_URL

export default function Admin() {
  const [points, setPoints] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [stories, setStories] = useState<any[]>([])
  const [email, setEmail] = useState('new@flowers.local')
  const [role, setRole] = useState('FLORIST_A')

  const load = async () => {
    const [p, u, s] = await Promise.all([
      fetch(`${API}/admin/pickup-points`, { credentials: 'include' }).then(r => r.json()),
      fetch(`${API}/admin/users`, { credentials: 'include' }).then(r => r.json()),
      fetch(`${API}/admin/stories`, { credentials: 'include' }).then(r => r.json())
    ])
    setPoints(p); setUsers(u); setStories(s)
  }
  useEffect(() => { load() }, [])

  const createStory = async () => {
    const now = new Date(); const end = new Date(Date.now() + 86400000)
    const created = await fetch(`${API}/admin/stories`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Новая история', cover_image_url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=900', starts_at: now.toISOString(), ends_at: end.toISOString(), sort_order: stories.length + 1, version: 1, is_active: true }) }).then(r => r.json())
    await fetch(`${API}/admin/stories/${created.id}/items`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'image', media_url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=900', duration_ms: 2500, headline: 'Весенний букет', subtext: 'Свежие цветы сегодня', cta_label: 'В каталог', cta_href: '/', sort_order: 1 }) })
    load()
  }

  const createUser = async () => {
    await fetch(`${API}/admin/users`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'password123', role, point_code: role === 'FLORIST_A' ? 'A' : role === 'FLORIST_B' ? 'B' : null }) })
    load()
  }

  return <main className='container'>
    <h1>Admin panel</h1>
    <Card><h3>Pickup points</h3>{points.map(p => <Badge key={p.id}>{p.code}: {p.name}</Badge>)}</Card>
    <Card style={{ marginTop: 12 }}><h3>Users</h3>{users.map(u => <p key={u.id}>{u.email} - {u.role}</p>)}<Input value={email} onChange={e => setEmail(e.target.value)} /><select value={role} onChange={e => setRole(e.target.value)}><option>FLORIST_A</option><option>FLORIST_B</option><option>ADMIN</option></select><Button onClick={createUser}>Create user</Button></Card>
    <Card style={{ marginTop: 12 }}><h3>Stories</h3>{stories.map(s => <p key={s.id}>{s.title}</p>)}<Button onClick={createStory}>Add story + item</Button></Card>
    <h2 style={{ marginTop: 16 }}>Orders overview</h2>
    <OrdersBoard accent='default' />
  </main>
}
