// All app data lives in one object saved to LocalStorage: { checks: [], reports: [] }
import { useEffect, useState } from 'react'
const KEY = 'cbyl-data-v1'
export const POINTS_PER_CHECK = 10
export const ITEMS_PER_CHECK = 6

export function useStore() {
  const [data, setData] = useState(() => {
    try { return { checks: [], reports: [], ...JSON.parse(localStorage.getItem(KEY)) } }
    catch { return { checks: [], reports: [] } }
  })
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(data)) } catch {} }, [data])
  return [data, setData]
}

export const dayKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${x.getMonth() + 1}-${x.getDate()}` }

export const BADGES = [
  { id: 'first', name: 'First Green Step', desc: 'Complete your first checklist', goal: 1, value: (s) => s.total },
  { id: 'guardian', name: 'Energy Guardian', desc: 'Complete 10 checklists', goal: 10, value: (s) => s.total },
  { id: 'consistency', name: 'Consistency Champion', desc: 'Complete checklists on 5 different days', goal: 5, value: (s) => s.days },
  { id: 'hero', name: 'Campus Eco Hero', desc: 'Complete 25 checklists', goal: 25, value: (s) => s.total },
]

export function getStats(data) {
  const total = data.checks.length
  const daySet = new Set(data.checks.map((c) => dayKey(c.time)))
  // streak = consecutive days with a check, ending today (or yesterday, so it isn't lost before today's check)
  let streak = 0
  const d = new Date()
  if (!daySet.has(dayKey(d))) d.setDate(d.getDate() - 1)
  while (daySet.has(dayKey(d))) { streak++; d.setDate(d.getDate() - 1) }
  const week = [...Array(7)].map((_, i) => {
    const x = new Date(); x.setDate(x.getDate() - (6 - i))
    return { label: x.toLocaleDateString('en', { weekday: 'short' }), count: data.checks.filter((c) => dayKey(c.time) === dayKey(x)).length }
  })
  const today = data.checks.filter((c) => dayKey(c.time) === dayKey(new Date())).length
  const stats = { total, days: daySet.size, streak, week, today, points: total * POINTS_PER_CHECK, actions: total * ITEMS_PER_CHECK }
  stats.unlocked = BADGES.filter((b) => b.value(stats) >= b.goal).map((b) => b.id)
  return stats
}
