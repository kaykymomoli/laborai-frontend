import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import supabase from '../services/supabase'

export default function ResetPasswordPage() {
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') return
    })
  }, [])

  async function handleRedefinir() {
    setErro('')
    if (senha !== confirmarSenha) { setErro('As senhas não coincidem.'); return }
    if (senha.length < 6) { setErro('A senha deve ter no mínimo 6 caracteres.'); return }
    setSalvando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setSalvando(false)
    if (error) { setErro('Erro ao redefinir senha. Tente novamente.'); return }
    setSucesso(true)
    setTimeout(() => navigate('/login'), 3000)
  }

  return (
    <div className="flex h-screen w-screen">
      <div className="flex flex-col justify-center w-full max-w-lg px-16 bg-[#0f1117]">
        <div className="mb-10">
          <img src="/logo.png" alt="LaborAI" className="h-10" />
        </div>
        <h1 className="text-white text-3xl font-semibold mb-1">Nova senha</h1>
        <div className="w-16 h-0.5 bg-white mb-6"></div>
        <p className="text-gray-400 text-sm mb-8">Digite sua nova senha abaixo.</p>

        {sucesso ? (
          <div className="text-center">
            <p className="text-green-400 font-medium mb-2">Senha redefinida com sucesso!</p>
            <p className="text-gray-400 text-sm">Redirecionando para o login...</p>
          </div>
        ) : (
          <>
            <div className="relative mb-4">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                placeholder="Nova senha"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                className="w-full bg-[#1a1d27] text-white placeholder-gray-500 rounded-full px-6 py-3 outline-none border border-transparent focus:border-[#00bcd4] transition"
              />
              <button
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="relative mb-6">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                placeholder="Confirmar nova senha"
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRedefinir()}
                className="w-full bg-[#1a1d27] text-white placeholder-gray-500 rounded-full px-6 py-3 outline-none border border-transparent focus:border-[#00bcd4] transition"
              />
            </div>
            {erro && <p className="text-red-400 text-sm mb-4">{erro}</p>}
            <button
              onClick={handleRedefinir}
              disabled={salvando}
              className="bg-[#2a2d3a] hover:bg-[#353849] text-white rounded-full py-3 font-medium transition disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Redefinir senha'}
            </button>
          </>
        )}
      </div>
      <div
        className="flex-1 bg-cover bg-center hidden md:block"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1200&q=80')" }}
      />
    </div>
  )
}