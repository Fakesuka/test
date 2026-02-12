export type Role = 'ADMIN' | 'FLORIST_A' | 'FLORIST_B'
export type PointCode = 'A' | 'B'

export interface StoryItem {
  id: string
  story_id: string
  type: 'image' | 'video'
  media_url: string
  duration_ms: number
  headline?: string
  subtext?: string
  cta_label?: string
  cta_href?: string
  sort_order: number
}

export interface Story {
  id: string
  title: string
  cover_image_url: string
  is_active: boolean
  starts_at: string
  ends_at: string
  sort_order: number
  version: number
  items?: StoryItem[]
}

export interface Product {
  id: string
  title: string
  description: string
  price: number
  image_url: string
}

export interface Order {
  id: string
  status: string
  customer_name: string
  customer_phone: string
  items: Array<{ product_id: string; qty: number; price: number; title: string }>
  total: number
  metadata: {
    pickup_point_code?: PointCode
    delivery_mode: 'pickup' | 'delivery'
    claimed_by_point_code?: PointCode | null
    payment_link?: string | null
    payment_status?: 'awaiting' | 'paid' | 'none'
    last_message?: string | null
  }
}
