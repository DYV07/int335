import { useCallback, useEffect, useState } from 'react'
import { Leaf, LayoutDashboard, ClipboardCheck, BarChart3, Award, Flag, Info, CheckCircle2 } from 'lucide-react'
import { useStore, getStats } from './store'
import { Dashboard, Checklist, Insights, Rewards, Report, About } from './pages'

const NAV = [
  ['dashboard', 'Dashboard', LayoutDashboard, Dashboard],
  ['checklist', 'Room Checklist', ClipboardCheck, Checklist],
  ['insights', 'Energy Insights', BarChart3, Insights],
  ['rewards', 'Eco Rewards', Award, Rewards],
  ['report', 'Report an Issue', Flag, Report],
  ['about', 'About Project', Info, About],
]

export default function App() {
  const [data, setData] = useStore()
  const [page, setPage] = useState(() => location.hash.slice(1) || 'dashboard')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const onHash = () => setPage(location.hash.slice(1) || 'dashboard')
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])

  const notify = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(null), 3200) }, [])
  const go = (p) => { location.hash = p; window.scrollTo(0, 0) }
  const current = NAV.find((n) => n[0] === page) || NAV[0]
  const Page = current[3]
  const stats = getStats(data)

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="logo"><Leaf size={20} /></span><span>Check Before<br />You Leave</span></div>
        <nav>
          {NAV.map(([id, label, Icon]) => (
            <button key={id} className={'nav-item' + (current[0] === id ? ' active' : '')} onClick={() => go(id)}>
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="side-note">Student prototype. It does not control or measure real devices.</div>
      </aside>
      <main className="main">
        <div className="page" key={current[0]}>
          <Page data={data} setData={setData} stats={stats} notify={notify} go={go} />
        </div>
      </main>
      {toast && <div className="toast" role="status"><CheckCircle2 size={18} />{toast}</div>}
    </div>
  )
}
