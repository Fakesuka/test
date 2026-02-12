import { Product, Story } from '@flower/shared'
import { Button } from '@flower/ui'
import Link from 'next/link'
import { ProductGrid } from '../components/ProductGrid'
import { StoriesBar } from '../components/Stories'

async function getData<T>(path: string): Promise<T> {
  const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, { cache: 'no-store' })
  return r.json()
}

export default async function Home() {
  const [stories, products] = await Promise.all([
    getData<Story[]>('/store/stories'),
    getData<Product[]>('/store/products')
  ])

  return <main className='container'>
    <h1>Pastel Flowers</h1>
    <StoriesBar stories={stories} />
    <div style={{ marginBottom: 16 }}><Link href='/checkout'><Button>Корзина / Checkout</Button></Link></div>
    <ProductGrid products={products} />
  </main>
}
