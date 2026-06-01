import { useState, useEffect, useRef } from 'react'
import { X, Camera, Eye, EyeOff, User, Phone, Building2, Briefcase, Mail, Lock } from 'lucide-react'
import supabase from '../services/supabase'

export default function ProfileModal({ onClose }) {
  const [aba, setAba] = useState('perfil')
  const [usuario, setUsuario] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [uploadando, setUploadando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    orgao: '',
    cargo: '',
  })

  const [senhaForm, setSenhaForm] = useState({
    novaSenha: '',
    confirmarSenha: '',
  })
  const [mostrarSenha, setMostrarSenha] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user
      setUsuario(u)
      setForm({
        nome: u?.user_metadata?.full_name || '',
        telefone: u?.user_metadata?.phone || '',
        orgao: u?.user_metadata?.orgao || '',
        cargo: u?.user_metadata?.cargo || '',
      })
      setAvatarUrl(u?.user_metadata?.avatar_url || null)
    })
  }, [])

  function getIniciais() {
    if (form.nome) return form.nome.slice(0, 2).toUpperCase()
    if (usuario?.email) return usuario.email.slice(0, 2).toUpperCase()
    return 'U'
  }

  async function handleUploadFoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadando(true)
    setErro('')
    const ext = file.name.split('.').pop()
    const path = `avatars/${usuario.id}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })
    if (uploadError) {
      setErro('Erro ao fazer upload da foto.')
      setUploadando(false)
      return
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl } })
    setAvatarUrl(data.publicUrl)
    setUploadando(false)
    showSucesso('Foto atualizada!')
  }

  async function handleSalvarPerfil() {
    setSalvando(true)
    setErro('')
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: form.nome,
        phone: form.telefone,
        orgao: form.orgao,
        cargo: form.cargo,
      }
    })
    setSalvando(false)
    if (error) { setErro('Erro ao salvar perfil.'); return }
    showSucesso('Perfil atualizado com sucesso!')
  }

  async function handleAlterarSenha() {
    setErro('')
    if (senhaForm.novaSenha !== senhaForm.confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }
    if (senhaForm.novaSenha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    setSalvando(true)
    const { error } = await supabase.auth.updateUser({ password: senhaForm.novaSenha })
    setSalvando(false)
    if (error) { setErro('Erro ao alterar senha.'); return }
    setSenhaForm({ novaSenha: '', confirmarSenha: '' })
    showSucesso('Senha alterada com sucesso!')
  }

  function showSucesso(msg) {
    setSucesso(msg)
    setTimeout(() => setSucesso(''), 3000)
  }

  function Campo({ label, icon: Icon, value, onChange, placeholder, disabled, type = 'text' }) {
    return (
      <div>
        <label className="text-gray-400 text-xs mb-1.5 block">{label}</label>
        <div className="relative">
          <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full bg-[#0f1117] text-white placeholder-gray-600 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none border transition
              ${disabled ? 'border-gray-800 text-gray-500 cursor-not-allowed' : 'border-gray-700 focus:border-[#00bcd4]'}`}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1d27] border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-white text-lg font-semibold">Meu perfil</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setAba('perfil')}
            className={`flex-1 py-3 text-sm font-medium transition ${aba === 'perfil' ? 'text-[#00bcd4] border-b-2 border-[#00bcd4]' : 'text-gray-400 hover:text-white'}`}
          >
            Informações pessoais
          </button>
          <button
            onClick={() => setAba('senha')}
            className={`flex-1 py-3 text-sm font-medium transition ${aba === 'senha' ? 'text-[#00bcd4] border-b-2 border-[#00bcd4]' : 'text-gray-400 hover:text-white'}`}
          >
            Segurança
          </button>
        </div>

        <div className="px-6 py-6">

          {aba === 'perfil' && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-center mb-2">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-[#00bcd4] flex items-center justify-center text-[#0f1117] font-bold text-2xl overflow-hidden">
                    {avatarUrl
                      ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      : getIniciais()
                    }
                  </div>
                  <button
                    onClick={() => fileRef.current.click()}
                    disabled={uploadando}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-[#00bcd4] rounded-full flex items-center justify-center text-[#0f1117] hover:bg-[#00a8be] transition"
                  >
                    <Camera size={14} />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleUploadFoto} className="hidden" />
                </div>
              </div>
              {uploadando && <p className="text-[#00bcd4] text-xs text-center">Enviando foto...</p>}

              <Campo label="Nome completo" icon={User} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Seu nome" />
              <Campo label="Email" icon={Mail} value={usuario?.email || ''} onChange={() => {}} disabled />
              <Campo label="Telefone" icon={Phone} value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} placeholder="(00) 00000-0000" />
              <Campo label="Órgão / Instituição" icon={Building2} value={form.orgao} onChange={e => setForm({ ...form, orgao: e.target.value })} placeholder="Ex: Prefeitura Municipal de..." />
              <Campo label="Cargo" icon={Briefcase} value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })} placeholder="Ex: Analista de Licitações" />

              {sucesso && <p className="text-green-400 text-sm text-center">{sucesso}</p>}
              {erro && <p className="text-red-400 text-sm text-center">{erro}</p>}

              <button
                onClick={handleSalvarPerfil}
                disabled={salvando}
                className="w-full bg-[#00bcd4] hover:bg-[#00a8be] text-[#0f1117] font-semibold rounded-xl py-3 text-sm transition disabled:opacity-50 mt-2"
              >
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          )}

          {aba === 'senha' && (
            <div className="flex flex-col gap-4">
              <p className="text-gray-400 text-sm">Digite a nova senha desejada. Ela deve ter no mínimo 6 caracteres.</p>

              <div>
                <label className="text-gray-400 text-xs mb-1.5 block">Nova senha</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senhaForm.novaSenha}
                    onChange={e => setSenhaForm({ ...senhaForm, novaSenha: e.target.value })}
                    placeholder="Nova senha"
                    className="w-full bg-[#0f1117] text-white placeholder-gray-600 rounded-xl pl-9 pr-10 py-2.5 text-sm outline-none border border-gray-700 focus:border-[#00bcd4] transition"
                  />
                  <button onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1.5 block">Confirmar nova senha</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senhaForm.confirmarSenha}
                    onChange={e => setSenhaForm({ ...senhaForm, confirmarSenha: e.target.value })}
                    placeholder="Confirmar senha"
                    className="w-full bg-[#0f1117] text-white placeholder-gray-600 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none border border-gray-700 focus:border-[#00bcd4] transition"
                  />
                </div>
              </div>

              {sucesso && <p className="text-green-400 text-sm text-center">{sucesso}</p>}
              {erro && <p className="text-red-400 text-sm text-center">{erro}</p>}

              <button
                onClick={handleAlterarSenha}
                disabled={salvando}
                className="w-full bg-[#00bcd4] hover:bg-[#00a8be] text-[#0f1117] font-semibold rounded-xl py-3 text-sm transition disabled:opacity-50 mt-2"
              >
                {salvando ? 'Alterando...' : 'Alterar senha'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}