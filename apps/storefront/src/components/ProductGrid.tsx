'use client'
import { Product } from '@flower/shared'
import { Button, Card } from '@flower/ui'
import Link from 'next/link'

export function ProductGrid({ products }: { products: Product[] }) {
  const add = (p: Product) => {
    const prev = JSON.parse(localStorage.getItem('cart') || '[]')
    const existing = prev.find((x: any) => x.id === p.id)
    if (existing) existing.qty += 1
    else prev.push({ id: p.id, title: p.title, price: p.price, qty: 1 })
    localStorage.setItem('cart', JSON.stringify(prev))
    alert('Добавлено в корзину')
  }

  return <div className='grid'>
    {products.map(p => <Card key={p.id}>
      <img src={p.image_url} style={{ width: '100%', borderRadius: 14, height: 160, objectFit: 'cover' }} />
      <h3>{p.title}</h3>
      <p>{p.description}</p>
      <strong>{p.price} ₽</strong>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Button onClick={() => add(p)}>В корзину</Button>
        <Link href={`/product/${p.id}`}>Открыть</Link>
      </div>
    </Card>)}
  </div>
}
