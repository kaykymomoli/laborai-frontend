import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, X } from 'lucide-react'
import supabase from '../services/supabase'
import useStore from '../store/useStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [modalRecuperar, setModalRecuperar] = useState(false)
  const [emailRecuperar, setEmailRecuperar] = useState('')
  const [enviandoRecuperar, setEnviandoRecuperar] = useState(false)
  const [sucessoRecuperar, setSucessoRecuperar] = useState(false)
  const navigate = useNavigate()
  const setAuthToken = useStore(state => state.setAuthToken)

  async function handleLogin() {
    setErro('')
    setCarregando(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    setCarregando(false)
    if (error) { setErro('Email ou senha incorretos.'); return }
    setAuthToken(data.session.access_token)
    navigate('/home')
  }

  async function handleRecuperarSenha() {
    if (!emailRecuperar.trim()) return
    setEnviandoRecuperar(true)
    const { error } = await supabase.auth.resetPasswordForEmail(emailRecuperar, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setEnviandoRecuperar(false)
    if (!error) setSucessoRecuperar(true)
  }

  function handleFecharModal() {
    setModalRecuperar(false)
    setEmailRecuperar('')
    setSucessoRecuperar(false)
  }

  return (
    <div className="flex h-screen w-screen">
      <div className="flex flex-col justify-center w-full max-w-lg px-16 bg-[#0f1117]">
        <div className="mb-10">
          <img src="/logo.png" alt="LaborAI" className="h-10" />
        </div>
        <h1 className="text-white text-3xl font-semibold mb-1">Entrar</h1>
        <div className="w-16 h-0.5 bg-white mb-6"></div>
        <p className="text-gray-400 text-sm mb-8">Preencha os campos para acessar a sua conta.</p>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="bg-[#1a1d27] text-white placeholder-gray-500 rounded-full px-6 py-3 mb-4 outline-none border border-transparent focus:border-[#00bcd4] transition"
        />
        <div className="relative mb-6">
          <input
            type={mostrarSenha ? 'text' : 'password'}
            placeholder="Senha"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full bg-[#1a1d27] text-white placeholder-gray-500 rounded-full px-6 py-3 outline-none border border-transparent focus:border-[#00bcd4] transition"
          />
          <button
            onClick={() => setMostrarSenha(!mostrarSenha)}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
          >
            {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {erro && <p className="text-red-400 text-sm mb-4">{erro}</p>}
        <button
          onClick={handleLogin}
          disabled={carregando}
          className="bg-[#2a2d3a] hover:bg-[#353849] text-white rounded-full py-3 font-medium transition mb-4 disabled:opacity-50"
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
        <p
          onClick={() => setModalRecuperar(true)}
          className="text-gray-400 text-sm text-center cursor-pointer hover:text-white transition"
        >
          Esqueci minha senha
        </p>
      </div>
      <div
        className="flex-1 bg-cover bg-center hidden md:block"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1200&q=80')" }}
      />

      {modalRecuperar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1a1d27] border border-gray-700 rounded-2xl p-8 w-full max-w-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-lg font-semibold">Recuperar senha</h2>
              <button onClick={handleFecharModal} className="text-gray-400 hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            {sucessoRecuperar ? (
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-400 text-xl">✓</span>
                </div>
                <p className="text-white font-medium mb-2">Email enviado!</p>
                <p className="text-gray-400 text-sm mb-6">
                  Se seu email estiver correto, você irá receber em sua caixa de entrada as instruções para redefinir sua senha.
                </p>
                <button
                  onClick={handleFecharModal}
                  className="w-full bg-[#00bcd4] hover:bg-[#00a8be] text-[#0f1117] font-semibold rounded-xl py-3 text-sm transition"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <>
                <p className="text-gray-400 text-sm mb-4">
                  Digite seu email e enviaremos um link para redefinir sua senha.
                </p>
                <input
                  type="email"
                  value={emailRecuperar}
                  onChange={e => setEmailRecuperar(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRecuperarSenha()}
                  placeholder="seu@email.com"
                  className="w-full bg-[#0f1117] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm outline-none border border-gray-700 focus:border-[#00bcd4] transition mb-4"
                />
                <button
                  onClick={handleRecuperarSenha}
                  disabled={enviandoRecuperar || !emailRecuperar.trim()}
                  className="w-full bg-[#00bcd4] hover:bg-[#00a8be] text-[#0f1117] font-semibold rounded-xl py-3 text-sm transition disabled:opacity-50"
                >
                  {enviandoRecuperar ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}