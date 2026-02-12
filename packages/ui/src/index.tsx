import React from 'react'

export const tokens = {
  background: '#fbf7fb',
  surface: '#ffffff',
  primary: '#f5b6cc',
  accentA: '#b8dff6',
  accentB: '#d9c6f7',
  border: '#eadff0',
  text: '#3a2f3f'
}

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} style={{ borderRadius: 16, padding: '10px 14px', border: `1px solid ${tokens.border}`, background: tokens.primary, color: tokens.text, ...props.style }} />
}

export function Card({ children, style }: React.PropsWithChildren<{ style?: React.CSSProperties }>) {
  return <div style={{ borderRadius: 20, border: `1px solid ${tokens.border}`, background: tokens.surface, boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: 16, ...style }}>{children}</div>
}

export function Badge({ children, tone = 'default' }: React.PropsWithChildren<{ tone?: 'default' | 'a' | 'b' }>) {
  const bg = tone === 'a' ? tokens.accentA : tone === 'b' ? tokens.accentB : '#f5edf8'
  return <span style={{ borderRadius: 999, padding: '4px 10px', background: bg, fontSize: 12 }}>{children}</span>
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ borderRadius: 14, border: `1px solid ${tokens.border}`, padding: '10px 12px', width: '100%', ...props.style }} />
}
