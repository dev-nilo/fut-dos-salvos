import { TeamData, Player } from "@/lib/types";
import Image from "next/image";
import { User, RefreshCw, X, Shuffle } from "lucide-react";
import ShineBorder from "./ui/shine-border";

const MiniPlayerRow = ({ player }: { player: Player }) => (
  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-amber-500/50 transition-colors">
    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-900 border border-slate-600 shrink-0">
      {player.image ? (
        <Image
          src={player.image}
          alt={player.name}
          width={40}
          height={40}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-500">
          <User size={20} />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-bold text-slate-200 truncate">{player.name}</div>
      <div className="text-xs text-amber-500 font-bold">{player.position}</div>
    </div>
    <div className="text-xl font-black text-slate-300">{player.rating}</div>
  </div>
);

interface TeamDrawerProps {
  isOpen: boolean;
  teams: TeamData[] | null;
  onClose: () => void;
  onRedraw: () => void;
  playerCount: number;
}

export function TeamDrawer({
  isOpen,
  teams,
  onClose,
  onRedraw,
  playerCount,
}: TeamDrawerProps) {
  if (!isOpen || !teams) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">
            <Shuffle size={20} /> Sorteio Realizado ({playerCount} Jogadores)
          </h2>
          <div className="flex gap-2">
            <button
              onClick={onRedraw}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-amber-500 transition-colors"
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
          {teams.map((team, idx) => (
            <ShineBorder
              key={idx}
              className="w-full p-0 flex flex-col h-full bg-slate-900/80 !border-0"
              color={
                idx === 0
                  ? ["#1e3a8a", "#60a5fa"]
                  : idx === 1
                    ? ["#7f1d1d", "#f87171"]
                    : ["#14532d", "#4ade80"]
              }
              borderRadius={12}
            >
              <div className="w-full h-full flex flex-col bg-slate-900/90 backdrop-blur-sm rounded-xl overflow-hidden">
                <div
                  className={`bg-gradient-to-r ${team.color} p-4 border-b ${team.borderColor} flex justify-between items-center`}
                >
                  <h3 className={`font-black ${team.headerColor} text-lg`}>
                    {team.name}
                  </h3>
                  <div className="flex flex-col items-end">
                    <span
                      className={`text-xs ${team.headerColor} font-bold uppercase opacity-70`}
                    >
                      Média OVR
                    </span>
                    <span className="text-2xl font-black text-white leading-none">
                      {team.avg}
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-2 flex-1">
                  {team.members.length > 0 ? (
                    team.members.map((p) => (
                      <MiniPlayerRow key={p.id} player={p} />
                    ))
                  ) : (
                    <div className="text-center text-slate-500 py-8 italic text-sm">
                      Sem jogadores
                    </div>
                  )}
                </div>
              </div>
            </ShineBorder>
          ))}
        </div>
      </div>
    </div>
  );
}
