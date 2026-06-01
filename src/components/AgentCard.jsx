import { PenLine, FileText, MessageSquare } from 'lucide-react'

const descricoes = {
  TR: 'Gera Termos de Referência completos conforme a Lei 14.133/2021',
  ETP: 'Gera Estudos Técnicos Preliminares conforme o Art. 18 da Lei 14.133/2021',
}

export default function AgentCard({ agent, onClick, carregando }) {
  return (
    <div
      onClick={onClick}
      className="bg-[#1a1d27] hover:bg-[#22263a] border border-gray-700 hover:border-[#00bcd4] rounded-xl p-6 cursor-pointer transition-all"
    >
      <div className="flex gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#00bcd4]/20 flex items-center justify-center text-[#00bcd4]">
          <PenLine size={16} />
        </div>
        <div className="w-8 h-8 rounded-lg bg-[#00bcd4]/20 flex items-center justify-center text-[#00bcd4]">
          <FileText size={16} />
        </div>
        <div className="w-8 h-8 rounded-lg bg-[#00bcd4]/20 flex items-center justify-center text-[#00bcd4]">
          <MessageSquare size={16} />
        </div>
      </div>
      <h3 className="text-white font-semibold mb-1">
        {carregando ? 'Iniciando...' : agent.name}
      </h3>
      <p className="text-gray-400 text-sm">{descricoes[agent.agent_type]}</p>
    </div>
  )
}