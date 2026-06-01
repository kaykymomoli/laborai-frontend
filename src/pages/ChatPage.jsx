import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Trash2, Send, Paperclip, X, Pencil, Check, Download } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import api from '../services/api'
import useStore from '../store/useStore'

const mdComponents = {
  a: ({ href, children }) => {
    const isDoc = href?.includes('.docx') || href?.includes('.pdf')
    if (isDoc) {
      return (
        <a href={href} download target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-3 bg-[#00bcd4] hover:bg-[#00a8be] text-[#0f1117] px-4 py-2.5 rounded-xl text-sm font-semibold transition">
          <Download size={16} />
          Baixar documento
        </a>
      )
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer"
        className="text-[#00bcd4] underline hover:text-white transition break-all">
        {children}
      </a>
    )
  },
  h1: ({ children }) => <h1 className="text-xl font-bold text-white mt-4 mb-2 first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-bold text-white mt-3 mb-2 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold text-white mt-3 mb-1 first:mt-0">{children}</h3>,
  h4: ({ children }) => <h4 className="text-sm font-semibold text-white mt-2 mb-1">{children}</h4>,
  p:  ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc list-outside ml-5 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-outside ml-5 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ className, children }) => {
    const isBlock = /language-/.test(className || '')
    return isBlock
      ? <code className="text-sm font-mono text-gray-300">{children}</code>
      : <code className="bg-[#0f1117] text-[#00bcd4] px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
  },
  pre: ({ children }) => (
    <pre className="bg-[#0f1117] rounded-lg p-3 mb-2 overflow-x-auto text-sm">{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-[#00bcd4] pl-3 italic text-gray-400 mb-2">{children}</blockquote>
  ),
  hr: () => <hr className="border-gray-700 my-3" />,
  table: ({ children }) => (
    <div className="overflow-x-auto mb-2">
      <table className="min-w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-gray-700">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-gray-800">{children}</tbody>,
  tr:   ({ children }) => <tr>{children}</tr>,
  th:   ({ children }) => <th className="px-3 py-2 text-left font-semibold text-white">{children}</th>,
  td:   ({ children }) => <td className="px-3 py-2 text-gray-300">{children}</td>,
}

function MessageContent({ content }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
      {content}
    </ReactMarkdown>
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
  const currentLoadingRef = useRef(null)

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
    const sessionId = currentSessionId
    currentLoadingRef.current = sessionId
    setCarregando(true)
    setMessages([])
    try {
      const { data } = await api.get(`/agent/session/${sessionId}/resume`)
      if (currentLoadingRef.current !== sessionId) return
      const mensagens = (data.messages || [])
        .filter(msg => {
          if (msg.role === 'assistant') {
            return !msg.content?.includes('recebido e analisado com sucesso') &&
                  !msg.content?.includes('O conteúdo foi extraído e está disponível como contexto')
          }
          return true
        })
        .map(msg => {
          if (msg.role === 'user' && msg.content?.startsWith('[FILE:')) {
            const match = msg.content.match(/^\[FILE:(.+?)\]\n?([\s\S]*)$/)
            if (match) return { ...msg, fileName: match[1], content: match[2] || '' }
          }
          return msg
        })
      setMessages(mensagens)
      const title = data.session?.title || agentLabels[currentAgentType] || 'Chat'
      setSessionTitle(title)
    } catch (e) {
      if (currentLoadingRef.current !== sessionId) return
      console.error('Erro ao carregar sessão', e)
      setSessionTitle(agentLabels[currentAgentType] || 'Chat')
    } finally {
      if (currentLoadingRef.current === sessionId) setCarregando(false)
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
    const arquivoAtual = arquivo
    setInput('')
    setArquivo(null)
    if (fileRef.current) fileRef.current.value = ''
    setEnviando(true)

    const conteudoUsuario = arquivoAtual
      ? `[FILE:${arquivoAtual.name}]\n${mensagemUsuario}`
      : mensagemUsuario
      
    setMessages(prev => [...prev, {
      role: 'user',
      content: mensagemUsuario,
      fileName: arquivoAtual?.name || null
    }])

    try {
      let response

      if (arquivoAtual) {
        const formData = new FormData()
        formData.append('file', arquivoAtual)
        formData.append('sessionId', currentSessionId)
        formData.append('instruction', conteudoUsuario)

        await api.post('/upload/file/analyze', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        const instrucao = mensagemUsuario ||
          `Analise o arquivo "${arquivoAtual.name}" que acabei de enviar. Se ele tiver relação com licitações ou contratações públicas, use o conteúdo como contexto para continuarmos. Caso contrário, me avise e continue com as perguntas do documento.`

        response = await api.post('/agent/message', {
          sessionId: currentSessionId,
          message: `[FILE:${arquivoAtual.name}]\n${instrucao}`,
        })
      } else {
        response = await api.post('/agent/message', {
          sessionId: currentSessionId,
          message: mensagemUsuario,
        })
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.message || response.data.response || 'Resposta recebida.',
        documentUrl: response.data.documentUrl || null
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
        <Sidebar onSelectSession={handleSelectSession} refreshKey={sidebarRefreshKey} activeSessionId={currentSessionId} />
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
                  <button onClick={() => handleSaveTitle(tempTitle)} className="text-green-400 hover:text-green-300 transition">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingTitle(false)} className="text-gray-500 hover:text-gray-300 transition">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => { setTempTitle(sessionTitle); setEditingTitle(true) }}>
                  <h2 className="text-white font-medium">{sessionTitle}</h2>
                  <Pencil size={14} className="text-gray-500 group-hover:text-gray-300 transition" />
                </div>
              )}
            </div>
            <button onClick={() => setModalDeletar(true)}
              className="text-gray-400 hover:text-red-400 transition p-2 rounded-lg hover:bg-[#1a1d27] z-10">
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
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-1">
                      <img src="/avatar-agent.png" alt="LaborAI" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="max-w-2xl">
                    <div className={`px-4 py-3 rounded-2xl text-base leading-relaxed whitespace-pre-wrap
                      ${msg.role === 'user'
                        ? 'bg-[#1a1d27] text-white rounded-tr-sm'
                        : 'bg-[#22263a] text-gray-200 rounded-tl-sm'}`}>
                      {msg.fileName && (
                        <div className="flex items-center gap-2 mb-2 bg-[#0f1117]/50 px-3 py-2 rounded-lg border border-gray-700">
                          <Paperclip size={13} className="text-[#00bcd4] flex-shrink-0" />
                          <span className="text-[#00bcd4] text-xs truncate">{msg.fileName}</span>
                        </div>
                      )}
                      {msg.content && (
                        <MessageContent content={msg.content} />
                      )}
                    </div>
                    {msg.role === 'assistant' && (
                      <button onClick={() => handleCopiar(msg.content)}
                        className="mt-1 ml-1 text-gray-500 hover:text-gray-300 transition" title="Copiar">
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}

            {enviando && (
              <div className="flex justify-start gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <img src="/avatar-agent.png" alt="LaborAI" className="w-full h-full object-cover" />
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
              <button onClick={() => fileRef.current.click()}
                className="text-gray-400 hover:text-[#00bcd4] transition p-2 rounded-xl hover:bg-[#1a1d27] flex-shrink-0"
                title="Anexar arquivo">
                <Paperclip size={20} />
              </button>
              <input ref={fileRef} type="file" accept=".pdf,.docx"
                onChange={e => setArquivo(e.target.files[0])} className="hidden" />
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Faça sua pergunta..."
                rows={1}
                className="flex-1 bg-[#1a1d27] text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm outline-none border border-gray-700 focus:border-[#00bcd4] transition resize-none"
                style={{ minHeight: '44px', maxHeight: '160px' }}
              />
              <button onClick={handleEnviar}
                disabled={enviando || (!input.trim() && !arquivo)}
                className="bg-[#00bcd4] hover:bg-[#00a8be] text-[#0f1117] p-3 rounded-xl transition disabled:opacity-50 flex-shrink-0">
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
            <h3 className="text-white text-lg font-semibold text-center mb-2">Excluir conversa</h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              Tem certeza que deseja excluir <span className="text-white font-medium">"{sessionTitle}"</span>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModalDeletar(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:bg-[#22263a] hover:text-white text-sm font-medium transition">
                Cancelar
              </button>
              <button onClick={handleDeletarSessao}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}