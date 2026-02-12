'use client'
import { Story, StoryItem } from '@flower/shared'
import { Button, Card } from '@flower/ui'
import { useEffect, useMemo, useState } from 'react'

export function StoriesBar({ stories }: { stories: Story[] }) {
  const [active, setActive] = useState<Story | null>(null)
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
        {stories.map(s => {
          const seen = typeof window !== 'undefined' && localStorage.getItem(`story-seen:${s.id}:${s.version}`)
          return <button key={s.id} onClick={() => setActive(s)} style={{ background: 'none', border: 0, cursor: 'pointer' }}>
            <img src={s.cover_image_url} width={74} height={74} style={{ borderRadius: 999, border: seen ? '3px solid #d9d9e5' : '3px solid #f5b6cc', objectFit: 'cover' }} />
          </button>
        })}
      </div>
      {active && <StoriesViewer story={active} onClose={() => setActive(null)} />}
    </div>
  )
}

function StoriesViewer({ story, onClose }: { story: Story; onClose: () => void }) {
  const [items, setItems] = useState<StoryItem[]>([])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/store/stories/${story.id}`).then(r => r.json()).then(setItems)
  }, [story.id])

  const current = items[index]
  useEffect(() => {
    if (!current) return
    const t = setTimeout(() => setIndex(i => (i + 1 < items.length ? i + 1 : i)), current.duration_ms || 3000)
    if (index === items.length - 1) localStorage.setItem(`story-seen:${story.id}:${story.version}`, '1')
    return () => clearTimeout(t)
  }, [current, index, items.length, story.id, story.version])

  const progress = useMemo(() => items.map((_, i) => i <= index ? 100 : 0), [items, index])
  if (!current) return null
  return <div className='modal'>
    <Card style={{ width: 'min(92vw, 420px)', background: '#111', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>{progress.map((p, i) => <div key={i} style={{ height: 3, flex: 1, background: 'rgba(255,255,255,0.3)' }}><div style={{ width: `${p}%`, height: '100%', background: '#fff' }} /></div>)}</div>
      <img src={current.media_url} style={{ width: '100%', height: 420, objectFit: 'cover', borderRadius: 12 }} />
      <h3>{current.headline || story.title}</h3>
      <p>{current.subtext}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        {current.cta_href && <a href={current.cta_href}><Button>{current.cta_label || 'Открыть'}</Button></a>}
        <Button onClick={() => setIndex(i => Math.max(0, i - 1))}>{'<'}</Button>
        <Button onClick={() => setIndex(i => Math.min(items.length - 1, i + 1))}>{'>'}</Button>
        <Button onClick={onClose}>Закрыть</Button>
      </div>
    </Card>
  </div>
}
