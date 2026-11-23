import { useState } from 'react'
import { Lightbulb, Fan, Projector, Plug, Snowflake, DoorOpen, ArrowRight, Flame, Star, ClipboardCheck, Award, Lock, CheckCircle2, Trash2, Zap } from 'lucide-react'
import { BADGES, POINTS_PER_CHECK, ITEMS_PER_CHECK } from './store'

const ROOMS = ['Classroom', 'Lab', 'Library', 'Seminar Room', 'Other']
const ITEMS = [
  ['Switch off lights', Lightbulb], ['Switch off fans', Fan], ['Turn off the projector', Projector],
  ['Switch off other electrical equipment', Plug], ['Turn off AC if not required', Snowflake], ['Ensure the room is empty', DoorOpen],
]
const fmt = (t) => new Date(t).toLocaleString('en', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
const Empty = ({ icon: Icon, title, text, action }) => (
  <div className="empty"><Icon size={28} /><h3>{title}</h3><p>{text}</p>{action}</div>
)
const Head = ({ title, sub }) => <header className="head"><h1>{title}</h1>{sub && <p>{sub}</p>}</header>
const Bar = ({ pct }) => <div className="bar"><i style={{ width: pct + '%' }} /></div>

function Ring({ pct }) {
  const r = 52, c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 130 130" className="ring">
      <circle cx="65" cy="65" r={r} className="ring-bg" />
      <circle cx="65" cy="65" r={r} className="ring-fg" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 65 65)" />
      <text x="65" y="71" textAnchor="middle" className="ring-text">{Math.round(pct)}%</text>
    </svg>
  )
}

export function Dashboard({ data, stats, go }) {
  const next = BADGES.find((b) => !stats.unlocked.includes(b.id))
  const pct = next ? Math.min(100, (next.value(stats) / next.goal) * 100) : 100
  const recent = [...data.checks].reverse().slice(0, 4)
  return (
    <>
      <section className="hero">
        <div>
          <p className="kicker">Welcome back</p>
          <h1>Make every exit count.</h1>
          <p>Lights, fans and projectors left on in empty rooms waste electricity. A 30-second check before you walk out keeps campus energy use down.</p>
          <button className="btn" onClick={() => go('checklist')}>Start Room Check <ArrowRight size={18} /></button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span><Lightbulb size={34} /></span><span><Fan size={34} /></span><span><Projector size={34} /></span><span className="off"><DoorOpen size={34} /></span>
        </div>
      </section>
      <div className="grid4">
        <Stat icon={ClipboardCheck} label="Room checks completed" value={stats.total} />
        <Stat icon={Zap} label="Energy-saving actions" value={stats.actions} />
        <Stat icon={Star} label="Eco-points" value={stats.points} />
        <Stat icon={Flame} label="Day streak" value={stats.streak} />
      </div>
      <div className="grid2">
        <div className="card">
          <h2>Today</h2>
          <p className="muted">{stats.today} room {stats.today === 1 ? 'check' : 'checks'} completed today.</p>
          <div className="row"><Ring pct={pct} /><div><strong>{next ? next.name : 'All badges unlocked'}</strong><p className="muted">{next ? `${next.value(stats)} of ${next.goal} toward your next badge` : 'You are a Campus Eco Hero.'}</p></div></div>
        </div>
        <div className="card">
          <h2>Recent activity</h2>
          {recent.length === 0 ? (
            <Empty icon={ClipboardCheck} title="No checks yet" text="Complete your first room check to see it here." action={<button className="btn small" onClick={() => go('checklist')}>Start a check</button>} />
          ) : recent.map((c) => <div className="li" key={c.id}><b>{c.room} {c.number}</b><span className="muted">{fmt(c.time)}</span></div>)}
        </div>
      </div>
      <blockquote className="quote">Small habits repeated by many people add up. The last person out is the one who decides.</blockquote>
    </>
  )
}
const Stat = ({ icon: Icon, label, value }) => (
  <div className="card stat"><Icon size={20} /><strong>{value}</strong><span className="muted">{label}</span></div>
)

export function Checklist({ data, setData, stats, notify }) {
  const [checked, setChecked] = useState(Array(ITEMS.length).fill(false))
  const [room, setRoom] = useState(ROOMS[0])
  const [number, setNumber] = useState('')
  const [done, setDone] = useState(null)
  const count = checked.filter(Boolean).length
  const pct = (count / ITEMS.length) * 100
  const ready = count === ITEMS.length && number.trim() !== ''

  const submit = (e) => {
    e.preventDefault()
    if (!ready) return
    const now = Date.now()
    const last = data.checks[data.checks.length - 1]
    // Duplicate guard: same room submitted within 60 seconds is ignored
    if (last && last.room === room && last.number === number.trim() && now - last.time < 60000) {
      notify('This room was already checked a moment ago.'); return
    }
    const before = stats.unlocked.length
    const entry = { id: now, time: now, room, number: number.trim(), items: ITEMS_PER_CHECK }
    const after = BADGES.filter((b) => b.value({ total: data.checks.length + 1, days: new Set([...data.checks.map((c) => new Date(c.time).toDateString()), new Date(now).toDateString()]).size }) >= b.goal).length
    setData({ ...data, checks: [...data.checks, entry] })
    setDone({ points: POINTS_PER_CHECK, badge: after > before })
    if (after > before) notify('New badge unlocked!')
  }
  const reset = () => { setChecked(Array(ITEMS.length).fill(false)); setNumber(''); setDone(null) }

  if (done) return (
    <div className="card success">
      <CheckCircle2 size={56} />
      <h1>Room check completed!</h1>
      <p>Thank you for helping create a greener campus.</p>
      <p className="pill">+{done.points} eco-points{done.badge ? ' and a new badge' : ''}</p>
      <button className="btn" onClick={reset}>Check another room</button>
    </div>
  )
  return (
    <>
      <Head title="Before You Leave, Check It." sub="Tick every item, then submit. All six are needed." />
      <form className="card" onSubmit={submit}>
        <div className="fields">
          <label>Room type<select value={room} onChange={(e) => setRoom(e.target.value)}>{ROOMS.map((r) => <option key={r}>{r}</option>)}</select></label>
          <label>Room number<input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="e.g. B-204" /></label>
        </div>
        <div className="progress"><span>{count} of {ITEMS.length} done</span><b>{Math.round(pct)}%</b></div>
        <Bar pct={pct} />
        <div className="checks">
          {ITEMS.map(([label, Icon], i) => (
            <label key={label} className={'check' + (checked[i] ? ' on' : '')}>
              <input type="checkbox" checked={checked[i]} onChange={() => setChecked(checked.map((v, j) => (j === i ? !v : v)))} />
              <Icon size={20} /><span>{label}</span><CheckCircle2 size={20} className="tick" />
            </label>
          ))}
        </div>
        <button className="btn" disabled={!ready}>Submit checklist</button>
        {!ready && <p className="muted hint">Check all items and enter a room number to submit.</p>}
      </form>
    </>
  )
}

export function Insights({ data, stats, go }) {
  const max = Math.max(1, ...stats.week.map((d) => d.count))
  const byRoom = ROOMS.map((r) => [r, data.checks.filter((c) => c.room === r).length])
  const history = [...data.checks].reverse().slice(0, 10)
  return (
    <>
      <Head title="Energy Insights" sub="These figures count checklist activity. They are activity-based estimates, not measured kWh." />
      <div className="grid4">
        <Stat icon={ClipboardCheck} label="Checklists completed" value={stats.total} />
        <Stat icon={Zap} label="Checklist actions" value={stats.actions} />
        <Stat icon={Star} label="Eco-points" value={stats.points} />
        <Stat icon={ClipboardCheck} label="Checks today" value={stats.today} />
      </div>
      <div className="grid2">
        <div className="card"><h2>Last 7 days</h2>
          <div className="chart">{stats.week.map((d, i) => (
            <div key={i} className="col"><span className="n">{d.count}</span><i style={{ height: (d.count / max) * 100 + '%' }} /><em>{d.label}</em></div>))}</div>
        </div>
        <div className="card"><h2>Checks by room type</h2>
          {byRoom.map(([r, n]) => <div key={r} className="hrow"><span>{r}</span><Bar pct={stats.total ? (n / stats.total) * 100 : 0} /><b>{n}</b></div>)}
        </div>
      </div>
      <div className="card"><h2>Activity history</h2>
        {history.length === 0 ? <Empty icon={BarChartEmpty} title="Nothing to chart yet" text="Your history appears after your first checklist." action={<button className="btn small" onClick={() => go('checklist')}>Start a check</button>} />
          : history.map((c) => <div className="li" key={c.id}><b>{c.room} {c.number}</b><span className="muted">{c.items} items checked · {fmt(c.time)}</span></div>)}
      </div>
    </>
  )
}
const BarChartEmpty = ClipboardCheck

export function Rewards({ stats }) {
  return (
    <>
      <Head title="Eco Rewards" sub={`${stats.points} points earned · ${stats.streak} day streak · ${POINTS_PER_CHECK} points per checklist`} />
      <div className="grid2">
        {BADGES.map((b) => {
          const v = Math.min(b.goal, b.value(stats)); const on = stats.unlocked.includes(b.id)
          return (
            <div key={b.id} className={'card badge' + (on ? ' unlocked' : '')}>
              <span className="medal">{on ? <Award size={26} /> : <Lock size={22} />}</span>
              <div><h3>{b.name}</h3><p className="muted">{b.desc}</p><Bar pct={(v / b.goal) * 100} /><small>{v} / {b.goal}{on ? ' · Unlocked' : ''}</small></div>
            </div>
          )
        })}
      </div>
    </>
  )
}

const ISSUES = ['Faulty switch', 'Light cannot be turned off', 'Faulty fan', 'Projector issue', 'AC problem', 'Other electrical equipment']
export function Report({ data, setData, notify }) {
  const blank = { room: ROOMS[0], number: '', category: ISSUES[0], description: '', severity: 'Medium' }
  const [f, setF] = useState(blank)
  const [sent, setSent] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = (e) => {
    e.preventDefault()
    setData({ ...data, reports: [...data.reports, { ...f, id: Date.now(), time: Date.now() }] })
    setF(blank); setSent(true); notify('Report saved. Thank you!')
  }
  return (
    <>
      <Head title="Report an Issue" sub="Found equipment that will not switch off or is not working? Tell us." />
      {sent && <div className="card okbox"><CheckCircle2 size={20} /> Your report was saved on this device.</div>}
      <form className="card" onSubmit={submit}>
        <div className="fields">
          <label>Room type<select value={f.room} onChange={set('room')}>{ROOMS.map((r) => <option key={r}>{r}</option>)}</select></label>
          <label>Room number<input required value={f.number} onChange={set('number')} placeholder="e.g. B-204" /></label>
          <label>Issue category<select value={f.category} onChange={set('category')}>{ISSUES.map((r) => <option key={r}>{r}</option>)}</select></label>
          <label>Severity (optional)<select value={f.severity} onChange={set('severity')}>{['Low', 'Medium', 'High'].map((r) => <option key={r}>{r}</option>)}</select></label>
        </div>
        <label>Description<textarea required rows="4" value={f.description} onChange={set('description')} placeholder="What is wrong?" /></label>
        <button className="btn">Submit report</button>
      </form>
      <div className="card"><h2>Your reports</h2>
        {data.reports.length === 0 ? <Empty icon={Flag2} title="No reports yet" text="Reports you submit are listed here." />
          : [...data.reports].reverse().map((r) => (
            <div className="li" key={r.id}><span><b>{r.category}</b> · {r.room} {r.number} · {r.severity}<br /><span className="muted">{r.description}</span></span>
              <button className="icon" aria-label="Delete report" onClick={() => setData({ ...data, reports: data.reports.filter((x) => x.id !== r.id) })}><Trash2 size={16} /></button></div>))}
      </div>
    </>
  )
}
const Flag2 = Plug

export function About() {
  const S = [
    ['The problem', 'Lights, fans, projectors and other equipment are often left running in empty classrooms and shared spaces. Nobody is clearly responsible for the final check.'],
    ['Why it matters', 'Wasted electricity raises campus costs and emissions, and it adds up across hundreds of rooms every day.'],
    ['Our solution', 'A simple exit checklist with points, streaks and badges that makes switching things off a visible, rewarding habit.'],
    ['How it works', 'Open Room Check, choose the room, tick all six items and submit. Points, streaks and badges update automatically and everything is saved in your browser.'],
    ['Objective', 'Build a lasting habit of checking a room before leaving it.'],
    ['Sustainability impact', 'Better habits reduce avoidable energy use. This app counts checklist activity only; it does not claim any measured savings.'],
    ['Future scope', 'Faculty and admin dashboards, QR codes on room doors, shared campus leaderboards, and optional smart-meter data.'],
  ]
  return (
    <>
      <Head title="About the project" sub="Check Before You Leave: a Design Thinking project." />
      <div className="card okbox">This is a student-created prototype. It does not control real electrical devices or measure electricity consumption.</div>
      {S.map(([t, p]) => <div className="card" key={t}><h2>{t}</h2><p>{p}</p></div>)}
    </>
  )
}
