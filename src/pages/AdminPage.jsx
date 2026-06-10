import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Users, Trash2, Shield, Eye, EyeOff, Search } from 'lucide-react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import api from '../services/api'

export default function AdminPage() {
  const navigate = useNavigate()
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [form, setForm] = useState({ email: '', nome: '', password: '', role: 'user' })
  const [criando, setCriando] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [buscaUsuario, setBuscaUsuario] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => { loadUsuarios() }, [])

  async function loadUsuarios() {
    try {
      const { data } = await api.get('/admin/users')
      setUsuarios(data)
    } catch {
      setErro('Erro ao carregar usuários.')
    } finally {
      setCarregando(false)
    }
  }

  async function handleCriarUsuario() {
    if (!form.email || !form.password || !form.nome) {
      setErro('Preencha todos os campos.')
      return
    }
    setCriando(true)
    setErro('')
    try {
      await api.post('/admin/users', form)
      setForm({ email: '', nome: '', password: '', role: 'user' })
      showSucesso('Usuário criado com sucesso!')
      loadUsuarios()
    } catch {
      setErro('Erro ao criar usuário.')
    } finally {
      setCriando(false)
    }
  }

  async function handleDeletarUsuario(id) {
    if (!window.confirm('Remover este usuário?')) return
    try {
      await api.delete(`/admin/users/${id}`)
      showSucesso('Usuário removido.')
      loadUsuarios()
    } catch {
      setErro('Erro ao remover usuário.')
    }
  }

  function showSucesso(msg) {
    setSucesso(msg)
    setTimeout(() => setSucesso(''), 3000)
  }

  const usuariosFiltrados = usuarios.filter(u =>
    u.nome?.toLowerCase().includes(buscaUsuario.toLowerCase()) ||
    u.email?.toLowerCase().includes(buscaUsuario.toLowerCase())
  )

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-page)]">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onSelectSession={() => navigate('/chat')} />
        <main className="flex-1 overflow-y-auto p-10">

          <h1 className="text-[var(--text-primary)] text-2xl font-semibold mb-8 flex items-center gap-3">
            <Shield size={24} className="text-[var(--text-accent)]" />
            Painel de Administração
          </h1>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 mb-8 max-w-2xl">
            <h2 className="text-[var(--text-primary)] font-semibold mb-4 flex items-center gap-2">
              <UserPlus size={18} className="text-[var(--text-accent)]" />
              Criar novo usuário
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[var(--text-secondary)] text-xs mb-1.5 block">Nome completo *</label>
                <input
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                  placeholder="Nome do usuário"
                  className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl px-4 py-2.5 text-sm outline-none border border-[var(--border)] focus:border-[#00bcd4] transition"
                />
              </div>
              <div>
                <label className="text-[var(--text-secondary)] text-xs mb-1.5 block">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl px-4 py-2.5 text-sm outline-none border border-[var(--border)] focus:border-[#00bcd4] transition"
                />
              </div>
              <div>
                <label className="text-[var(--text-secondary)] text-xs mb-1.5 block">Senha *</label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Senha inicial"
                    className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl px-4 pr-10 py-2.5 text-sm outline-none border border-[var(--border)] focus:border-[#00bcd4] transition"
                  />
                  <button
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[var(--text-secondary)] text-xs mb-1.5 block">Perfil</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] rounded-xl px-4 py-2.5 text-sm outline-none border border-[var(--border)] focus:border-[#00bcd4] transition"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            {erro && <p className="text-red-500 text-sm mb-3">{erro}</p>}
            {sucesso && <p className="text-green-500 text-sm mb-3">{sucesso}</p>}

            <button
              onClick={handleCriarUsuario}
              disabled={criando}
              className="bg-[#00bcd4] hover:bg-[#00a8be] text-[#0f1117] font-semibold rounded-xl px-6 py-2.5 text-sm transition disabled:opacity-50"
            >
              {criando ? 'Criando...' : 'Criar usuário'}
            </button>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[var(--text-primary)] font-semibold flex items-center gap-2">
                <Users size={18} className="text-[var(--text-accent)]" />
                Usuários cadastrados
              </h2>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  value={buscaUsuario}
                  onChange={e => setBuscaUsuario(e.target.value)}
                  placeholder="Buscar por nome ou email"
                  className="bg-[var(--bg-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl pl-8 pr-4 py-2 text-sm outline-none border border-[var(--border)] focus:border-[#00bcd4] transition w-64"
                />
              </div>
            </div>

            {carregando ? (
              <p className="text-[var(--text-secondary)] text-sm">Carregando...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left text-[var(--text-secondary)] font-medium pb-3 pr-4">Nome</th>
                      <th className="text-left text-[var(--text-secondary)] font-medium pb-3 pr-4">Email</th>
                      <th className="text-left text-[var(--text-secondary)] font-medium pb-3 pr-4">Perfil</th>
                      <th className="text-left text-[var(--text-secondary)] font-medium pb-3 pr-4">Último acesso</th>
                      <th className="text-left text-[var(--text-secondary)] font-medium pb-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosFiltrados.map(u => (
                      <tr key={u.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition">
                        <td className="py-3 pr-4 text-[var(--text-primary)]">{u.nome || '—'}</td>
                        <td className="py-3 pr-4 text-[var(--text-secondary)]">{u.email}</td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.role === 'admin' ? 'bg-[#00bcd4]/20 text-[var(--text-accent)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)]'}`}>
                            {u.role === 'admin' ? 'Admin' : 'Usuário'}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-[var(--text-muted)] text-xs">
                          {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => handleDeletarUsuario(u.id)}
                            className="text-[var(--text-muted)] hover:text-red-500 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {usuariosFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-[var(--text-muted)] text-sm">
                          Nenhum usuário encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  )
}
