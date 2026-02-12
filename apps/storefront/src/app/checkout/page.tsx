'use client'
import { Button, Card, Input } from '@flower/ui'
import { useEffect, useMemo, useState } from 'react'

export default function CheckoutPage() {
  const [cart, setCart] = useState<any[]>([])
  const [mode, setMode] = useState<'pickup' | 'delivery'>('pickup')
  const [point, setPoint] = useState<'A' | 'B'>('A')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [order, setOrder] = useState<any>()

  useEffect(() => setCart(JSON.parse(localStorage.getItem('cart') || '[]')), [])
  const total = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart])

  const submit = async () => {
    const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/store/orders`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_name: name, customer_phone: phone, items: cart.map(i => ({ product_id: i.id, title: i.title, qty: i.qty, price: i.price })), metadata: { delivery_mode: mode, pickup_point_code: mode === 'pickup' ? point : null } })
    }).then(x => x.json())
    localStorage.removeItem('cart'); setOrder(r)
  }

  return <main className='container'>
    <h1>Checkout</h1>
    <Card>
      {cart.map(i => <div key={i.id}>{i.title} x{i.qty} = {i.price * i.qty} ₽</div>)}
      <p>Итого: {total} ₽</p>
      <Input placeholder='Имя' value={name} onChange={e => setName(e.target.value)} />
      <Input placeholder='Телефон' value={phone} onChange={e => setPhone(e.target.value)} style={{ marginTop: 8 }} />
      <div style={{ marginTop: 12 }}>
        <label><input type='radio' checked={mode === 'pickup'} onChange={() => setMode('pickup')} /> Самовывоз</label>
        <label style={{ marginLeft: 12 }}><input type='radio' checked={mode === 'delivery'} onChange={() => setMode('delivery')} /> Доставка</label>
      </div>
      {mode === 'pickup' && <div style={{ marginTop: 8 }}>
        <label><input type='radio' checked={point === 'A'} onChange={() => setPoint('A')} /> Point A</label>
        <label style={{ marginLeft: 12 }}><input type='radio' checked={point === 'B'} onChange={() => setPoint('B')} /> Point B</label>
      </div>}
      <Button onClick={submit} style={{ marginTop: 12 }}>Оформить</Button>
    </Card>
    {order && <Card style={{ marginTop: 16 }}><h3>Заказ {order.id}</h3><p>Ожидает подтверждения флористом.</p></Card>}
  </main>
}
