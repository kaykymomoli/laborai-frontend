import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutGrid, ChevronDown, LogOut, User, Shield } from 'lucide-react'
import useStore from '../store/useStore'
import supabase from '../services/supabase'
import ProfileModal from './ProfileModal'

export default function Navbar() {
  const navigate = useNavigate()
  const logout = useStore(state => state.logout)
  const [usuario, setUsuario] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUsuario(data?.user)
      setAvatarUrl(data?.user?.user_metadata?.avatar_url || null)
      setIsAdmin(data?.user?.user_metadata?.role === 'admin')
    })
  }, [])

  useEffect(() => {
    function handleClickFora(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    logout()
    navigate('/login')
  }

  function getIniciais() {
    const nome = usuario?.user_metadata?.full_name
    if (nome) return nome.slice(0, 2).toUpperCase()
    if (usuario?.email) return usuario.email.slice(0, 2).toUpperCase()
    return 'U'
  }

  function handleFecharModal() {
    setModalAberto(false)
    supabase.auth.getUser().then(({ data }) => {
      setUsuario(data?.user)
      setAvatarUrl(data?.user?.user_metadata?.avatar_url || null)
    })
  }

  return (
    <>
      <nav className="flex items-center justify-between px-6 py-3 bg-[#0f1117] border-b border-gray-800">
        <div className="flex items-center gap-8">
          <img
            src="/logo.png"
            alt="LaborAI"
            className="h-7 cursor-pointer"
            onClick={() => navigate('/home')}
          />
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 font-medium px-4 py-2 rounded-lg border border-[#00bcd4] text-[#00bcd4] hover:bg-[#00bcd4]/10 transition text-base"
          >
            <LayoutGrid size={18} />
            Assistentes
          </button>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            <div className="w-9 h-9 rounded-full bg-[#00bcd4] flex items-center justify-center text-[#0f1117] font-bold text-sm overflow-hidden">
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : getIniciais()
              }
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {menuAberto && (
            <div className="absolute right-0 mt-2 w-52 bg-[#1a1d27] border border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700">
                <p className="text-white text-sm font-medium truncate">
                  {usuario?.user_metadata?.full_name || usuario?.email}
                </p>
                <p className="text-gray-500 text-xs mt-0.5 truncate">{usuario?.email}</p>
              </div>

              {isAdmin && (
                <button
                  onClick={() => { setMenuAberto(false); navigate('/admin') }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#00bcd4] hover:bg-[#22263a] transition"
                >
                  <Shield size={16} />
                  Painel Admin
                </button>
              )}

              <button
                onClick={() => { setMenuAberto(false); setModalAberto(true) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-[#22263a] hover:text-white transition"
              >
                <User size={16} />
                Editar perfil
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-[#22263a] hover:text-red-300 transition"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          )}
        </div>
      </nav>

      {modalAberto && <ProfileModal onClose={handleFecharModal} />}
    </>
  )
}