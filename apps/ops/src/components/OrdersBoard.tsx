'use client'
import { Badge, Button, Card, Input } from '@flower/ui'
import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL

export function OrdersBoard({ pointCode, accent }: { pointCode?: 'A' | 'B'; accent: 'a' | 'b' | 'default' }) {
  const [orders, setOrders] = useState<any[]>([])
  const [message, setMessage] = useState('Ваш заказ в работе 🌸')

  const load = () => fetch(`${API}/ops/orders`, { credentials: 'include' }).then(r => r.json()).then(setOrders)
  useEffect(() => { load() }, [])

  const claim = async (id: string) => {
    const r = await fetch(`${API}/ops/orders/${id}/claim`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ point_code: pointCode }) })
    if (r.status === 409) alert('Уже занято другой точкой')
    await load()
  }
  const confirm = async (id: string) => { await fetch(`${API}/ops/orders/${id}/confirm`, { method: 'POST', credentials: 'include' }); await load() }
  const saveMsg = async (id: string) => { await fetch(`${API}/ops/orders/${id}/message`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: message }) }); await load() }

  return <div style={{ display: 'grid', gap: 12 }}>
    {orders.map(o => <Card key={o.id} style={{ borderColor: accent === 'a' ? '#b8dff6' : accent === 'b' ? '#d9c6f7' : undefined }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <strong>{o.id.slice(0, 8)}</strong>
        <Badge tone={accent}>{o.status}</Badge>
      </div>
      <p>{o.customer_name} • {o.customer_phone}</p>
      <p>{o.metadata.delivery_mode} {o.metadata.pickup_point_code ? `(${o.metadata.pickup_point_code})` : ''}</p>
      <p>Оплата: {o.metadata.payment_status || 'none'} {o.metadata.payment_link && <a href={o.metadata.payment_link} target='_blank'>link</a>}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {o.metadata.delivery_mode === 'delivery' && !o.metadata.claimed_by_point_code && pointCode && <Button onClick={() => claim(o.id)}>Claim</Button>}
        <Button onClick={() => confirm(o.id)}>Confirm + link</Button>
        <Input value={message} onChange={(e) => setMessage(e.target.value)} style={{ maxWidth: 280 }} />
        <Button onClick={() => saveMsg(o.id)}>Save message</Button>
      </div>
    </Card>)}
  </div>
}
