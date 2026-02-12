'use client'
import { Button, Card, Input } from '@flower/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
const API = process.env.NEXT_PUBLIC_API_URL

export default function LoginPage() {
  const [email, setEmail] = useState('admin@flowers.local')
  const [password, setPassword] = useState('admin123')
  const router = useRouter()
  const login = async () => {
    const r = await fetch(`${API}/ops/auth/login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }).then(x => x.json())
    if (r.role === 'ADMIN') router.push('/admin')
    if (r.role === 'FLORIST_A') router.push('/ops/point-a')
    if (r.role === 'FLORIST_B') router.push('/ops/point-b')
  }
  return <main className='container'><Card><h1>Login</h1><Input value={email} onChange={e => setEmail(e.target.value)} /><Input type='password' value={password} onChange={e => setPassword(e.target.value)} style={{ marginTop: 8 }} /><Button onClick={login} style={{ marginTop: 8 }}>Войти</Button></Card></main>
}
