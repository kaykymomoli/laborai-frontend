import { useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[var(--bg-page)] gap-4">
      <p className="text-[#00bcd4] text-6xl font-bold">404</p>
      <p className="text-[var(--text-primary)] text-xl font-medium">Página não encontrada</p>
      <p className="text-[var(--text-secondary)] text-sm">A página que você tentou acessar não existe.</p>
      <button
        onClick={() => navigate('/home')}
        className="flex items-center gap-2 mt-4 bg-[#00bcd4] hover:bg-[#00a8be] text-[#0f1117] font-semibold px-6 py-2.5 rounded-xl transition"
      >
        <Home size={16} />
        Voltar para o início
      </button>
    </div>
  )
}
