import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import AgentCard from '../components/AgentCard'
import api from '../services/api'
import useStore from '../store/useStore'

const AGENTES = [
  { id: '1', agent_type: 'TR', name: 'Termo de Referência' },
  { id: '2', agent_type: 'ETP', name: 'Estudo Técnico Preliminar' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { setCurrentAgentType, setCurrentSessionId } = useStore()
  const [carregando, setCarregando] = useState(null)
  const [busca, setBusca] = useState('')

  const agentesFiltrados = AGENTES.filter(a =>
    a.name.toLowerCase().includes(busca.toLowerCase()) ||
    a.agent_type.toLowerCase().includes(busca.toLowerCase())
  )

  async function handleSelectAgent(agent) {
    if (carregando) return
    setCarregando(agent.agent_type)
    setCurrentAgentType(agent.agent_type)
    try {
      const { data } = await api.post('/agent/session/start', { agentType: agent.agent_type })
      setCurrentSessionId(data.sessionId)
      navigate('/chat')
    } catch (e) {
      console.error('Erro ao iniciar sessão', e)
      setCarregando(null)
    }
  }

  function handleSelectSession(session) {
    setCurrentSessionId(session.id)
    setCurrentAgentType(session.agent_type)
    navigate('/chat')
  }

  return (
    <div className="flex flex-col h-screen bg-[#13151f]">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onSelectSession={handleSelectSession} />
        <main className="flex-1 flex flex-col p-10">
          <h1 className="text-white text-2xl font-semibold mb-6">Escolha o seu assistente</h1>

          <div className="relative w-full max-w-2xl mb-8">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar assistente"
              className="w-full bg-[#1a1d27] text-white placeholder-gray-500 rounded-xl pl-10 pr-4 py-3 outline-none border border-gray-700 focus:border-[#00bcd4] transition text-sm"
            />
          </div>

          {agentesFiltrados.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum assistente encontrado.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
              {agentesFiltrados.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  carregando={carregando === agent.agent_type}
                  onClick={() => handleSelectAgent(agent)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}