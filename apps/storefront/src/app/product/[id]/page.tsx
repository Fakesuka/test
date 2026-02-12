import { Product } from '@flower/shared'
import { Button, Card } from '@flower/ui'

async function getProduct(id: string): Promise<Product> {
  const products = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/store/products`, { cache: 'no-store' }).then(r => r.json())
  return products.find((x: Product) => x.id === id)
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const p = await getProduct(params.id)
  return <main className='container'>
    <Card>
      <img src={p.image_url} style={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: 14 }} />
      <h1>{p.title}</h1><p>{p.description}</p><strong>{p.price} ₽</strong>
      <Button onClick={() => { }}>Добавьте с главной</Button>
    </Card>
  </main>
}
