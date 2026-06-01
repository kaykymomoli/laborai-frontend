import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Trash2, Send, Paperclip, X, Bot, Pencil, Check } from 'lucide-react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import api from '../services/api'
import useStore from '../store/useStore'

function MessageContent({ content }) {
  const parts = content.split(/\*\*(.*?)\*\*/g)
  return (
    <span>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <strong key={i} className="font-semibold text-white">{part}</strong>
          : <span key={i}>{part}</span>
      )}
    </span>
  )
}

export default function ChatPage() {
  const navigate = useNavigate()
  const { currentSessionId, currentAgentType, setCurrentSessionId, setCurrentAgentType } = useStore()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [arquivo, setArquivo] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [sessionTitle, setSessionTitle] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState('')
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0)
  const [modalDeletar, setModalDeletar] = useState(false)
  const messagesEndRef = useRef(null)
  const fileRef = useRef(null)

  const agentLabels = {
    TR: 'Termo de Referência',
    ETP: 'Estudo Técnico Preliminar'
  }

  useEffect(() => {
    if (currentSessionId) loadSession()
  }, [currentSessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadSession() {
    setCarregando(true)
    setMessages([])
    try {
      const { data } = await api.get(`/agent/session/${currentSessionId}/resume`)
      setMessages(data.messages || [])
      const title = data.session?.title || agentLabels[currentAgentType] || 'Chat'
      setSessionTitle(title)
    } catch (e) {
      console.error('Erro ao carregar sessão', e)
      setSessionTitle(agentLabels[currentAgentType] || 'Chat')
    } finally {
      setCarregando(false)
    }
  }

  async function handleSaveTitle(novoTitulo) {
    setEditingTitle(false)
    if (!novoTitulo.trim()) return
    setSessionTitle(novoTitulo)
    try {
      await api.patch(`/agent/session/${currentSessionId}/title`, { title: novoTitulo })
      setSidebarRefreshKey(prev => prev + 1)
    } catch (e) {
      console.error('Erro ao salvar título', e)
    }
  }

  async function handleDeletarSessao() {
    try {
      await api.delete(`/agent/session/${currentSessionId}`)
      setModalDeletar(false)
      navigate('/home')
    } catch (e) {
      console.error('Erro ao deletar sessão', e)
    }
  }

  async function handleEnviar() {
    if (!input.trim() && !arquivo) return
    if (enviando) return

    const mensagemUsuario = input
    setInput('')
    setEnviando(true)
    setMessages(prev => [...prev, { role: 'user', content: mensagemUsuario }])

    try {
      let data

      if (arquivo) {
        const formData = new FormData()
        formData.append('file', arquivo)
        formData.append('sessionId', currentSessionId)
        formData.append('instruction', mensagemUsuario || 'Analise este arquivo')
        const response = await api.post('/upload/file/analyze', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        data = response.data
        setArquivo(null)
      } else {
        const response = await api.post('/agent/message', {
          sessionId: currentSessionId,
          message: mensagemUsuario,
        })
        data = response.data
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message || data.response || 'Resposta recebida.'
      }])
    } catch (e) {
      console.error('Erro ao enviar mensagem', e)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Erro ao processar sua mensagem. Tente novamente.'
      }])
    } finally {
      setEnviando(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEnviar()
    }
  }

  async function handleCopiar(content) {
    await navigator.clipboard.writeText(content)
  }

  function handleSelectSession(session) {
    if (session.id === currentSessionId) return
    setCurrentSessionId(session.id)
    setCurrentAgentType(session.agent_type)
  }

  return (
    <div className="flex flex-col h-screen bg-[#13151f]">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          onSelectSession={handleSelectSession}
          refreshKey={sidebarRefreshKey}
        />
        <main className="flex-1 flex flex-col overflow-hidden">

          <div className="relative flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-[#0f1117]">
            <button onClick={() => navigate('/home')} className="text-gray-400 hover:text-white transition z-10">
              <ArrowLeft size={20} />
            </button>

            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={tempTitle}
                    onChange={e => setTempTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveTitle(tempTitle)
                      if (e.key === 'Escape') setEditingTitle(false)
                    }}
                    className="bg-transparent text-white font-medium outline-none border-b border-[#00bcd4] text-center min-w-48"
                  />
                  <button
                    onClick={() => handleSaveTitle(tempTitle)}
                    className="text-green-400 hover:text-green-300 transition"
                    title="Confirmar"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setEditingTitle(false)}
                    className="text-gray-500 hover:text-gray-300 transition"
                    title="Cancelar"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => { setTempTitle(sessionTitle); setEditingTitle(true) }}
                >
                  <h2 className="text-white font-medium">{sessionTitle}</h2>
                  <Pencil size={14} className="text-gray-500 group-hover:text-gray-300 transition" />
                </div>
              )}
            </div>

            <button
              onClick={() => setModalDeletar(true)}
              className="text-gray-400 hover:text-red-400 transition p-2 rounded-lg hover:bg-[#1a1d27] z-10"
              title="Excluir sessão"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {carregando ? (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500 text-sm">Carregando conversa...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500 text-sm">Inicie a conversa enviando uma mensagem.</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      <img src="/avatar-agent.png" alt="LaborAI" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="max-w-2xl">
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                      ${msg.role === 'user'
                        ? 'bg-[#1a1d27] text-white rounded-tr-sm'
                        : 'bg-[#22263a] text-gray-200 rounded-tl-sm'
                      }`}>
                      <MessageContent content={msg.content} />
                    </div>
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => handleCopiar(msg.content)}
                        className="mt-1 ml-1 text-gray-500 hover:text-gray-300 transition"
                        title="Copiar"
                      >
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}

            {enviando && (
              <div className="flex justify-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#00bcd4]/20 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-[#00bcd4]" />
                </div>
                <div className="bg-[#22263a] px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1 items-center">
                    <div className="w-2 h-2 bg-[#00bcd4] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-[#00bcd4] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-[#00bcd4] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-6 py-4 border-t border-gray-800 bg-[#0f1117]">
            {arquivo && (
              <div className="flex items-center gap-2 mb-3 bg-[#1a1d27] px-4 py-2 rounded-xl w-fit">
                <Paperclip size={16} className="text-[#00bcd4]" />
                <span className="text-gray-300 text-sm">{arquivo.name}</span>
                <button onClick={() => setArquivo(null)} className="text-gray-500 hover:text-white ml-1">
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="flex items-end gap-3">
              <button
                onClick={() => fileRef.current.click()}
                className="text-gray-400 hover:text-[#00bcd4] transition p-2 rounded-xl hover:bg-[#1a1d27] flex-shrink-0"
                title="Anexar arquivo"
              >
                <Paperclip size={20} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx"
                onChange={e => setArquivo(e.target.files[0])}
                className="hidden"
              />
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Faça sua pergunta..."
                rows={1}
                className="flex-1 bg-[#1a1d27] text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm outline-none border border-gray-700 focus:border-[#00bcd4] transition resize-none"
                style={{ minHeight: '44px', maxHeight: '160px' }}
              />
              <button
                onClick={handleEnviar}
                disabled={enviando || (!input.trim() && !arquivo)}
                className="bg-[#00bcd4] hover:bg-[#00a8be] text-[#0f1117] p-3 rounded-xl transition disabled:opacity-50 flex-shrink-0"
              >
                <Send size={18} />
              </button>
            </div>
          </div>

        </main>
      </div>

      {modalDeletar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1a1d27] border border-gray-700 rounded-2xl p-8 w-full max-w-sm">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 size={22} className="text-red-400" />
              </div>
            </div>
            <h3 className="text-white text-lg font-semibold text-center mb-2">
              Excluir conversa
            </h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              Tem certeza que deseja excluir <span className="text-white font-medium">"{sessionTitle}"</span>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setModalDeletar(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:bg-[#22263a] hover:text-white text-sm font-medium transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeletarSessao}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}