import { useEffect, useState } from 'react'
import { PanelLeftClose, PanelLeftOpen, Loader2 } from 'lucide-react'
import api from '../services/api'

export default function Sidebar({ onSelectSession, refreshKey, activeSessionId }) {
  const [sessions, setSessions] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    setCarregando(true)
    api.get('/agent/sessions')
      .then(({ data }) => setSessions(data))
      .catch(e => console.error('Erro ao carregar sessões', e))
      .finally(() => setCarregando(false))
  }, [refreshKey])

  function groupSessions() {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const last7 = new Date(today); last7.setDate(last7.getDate() - 7)
    const filtered = sessions.filter(s =>
      (s.title || s.agent_type)?.toLowerCase().includes(busca.toLowerCase())
    )
    return {
      hoje: filtered.filter(s => new Date(s.updated_at) >= today),
      ultimos7: filtered.filter(s => { const d = new Date(s.updated_at); return d >= last7 && d < today }),
      historico: filtered.filter(s => new Date(s.updated_at) < last7),
    }
  }

  const { hoje, ultimos7, historico } = groupSessions()

  function SessionItem({ session }) {
    const isActive = session.id === activeSessionId
    return (
      <div
        onClick={() => onSelectSession(session)}
        className={`px-3 py-1.5 text-sm rounded cursor-pointer truncate transition
          ${isActive
            ? 'bg-[var(--bg-card)] text-[var(--text-primary)] border-l-2 border-[#00bcd4]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
          }`}
      >
        {session.title || session.agent_type}
      </div>
    )
  }

  function Section({ title, items }) {
    if (!items.length) return null
    return (
      <div className="mb-4">
        <p className="text-xs text-[var(--text-muted)] px-3 mb-1">{title}</p>
        {items.map(s => <SessionItem key={s.id} session={s} />)}
      </div>
    )
  }

  return (
    <div className={`flex flex-col bg-[var(--bg-main)] border-r border-[var(--border-subtle)] transition-all duration-300 ${collapsed ? 'w-12' : 'w-64'}`}>
      <div className="flex items-center px-3 py-3 gap-2">
        {!collapsed && (
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar conversa"
            className="flex-1 bg-transparent text-[var(--text-secondary)] placeholder-[var(--text-muted)] text-sm outline-none"
          />
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition ml-auto">
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-1 py-2">
          {carregando ? (
            <div className="flex justify-center py-8">
              <Loader2 size={18} className="text-[var(--text-muted)] animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-[var(--text-muted)] text-xs text-center px-3 py-6">
              Nenhuma conversa ainda.
            </p>
          ) : (
            <>
              <Section title="Hoje" items={hoje} />
              <Section title="Últimos 7 dias" items={ultimos7} />
              <Section title="Histórico" items={historico} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
