"use client";

import { Player } from "@/lib/types";
import Image from "next/image";
import { CheckCircle2, Pencil, Trash2, User } from "lucide-react";
import ShineBorder from "@/components/ui/shine-border";
import NumberTicker from "@/components/ui/number-ticker";

const OUTFIELD_LABELS = {
  attr1: "VEL",
  attr2: "RES",
  attr3: "CHU",
  attr4: "DRI",
  attr5: "PAS",
  attr6: "DEF",
  attr7: "POS",
  attr8: "FIS",
};
const GK_LABELS = {
  attr1: "DIV",
  attr2: "HAN",
  attr3: "KIC",
  attr4: "REF",
  attr5: "SPD",
  attr6: "POS",
  attr7: "COM",
  attr8: "REA",
};

interface PlayerCardProps {
  player: Player;
  onDelete: (id: string) => void;
  onEdit: (player: Player) => void;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

export function PlayerCard({
  player,
  onDelete,
  onEdit,
  isSelected,
  onToggleSelect,
}: PlayerCardProps) {
  const isGK = player.position === "GK";
  const labels = isGK ? GK_LABELS : OUTFIELD_LABELS;

  const CardContent = () => (
    <div className="relative w-full h-full bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 rounded-t-[28px] rounded-b-xl overflow-hidden select-none flex flex-col z-10">
      {/* Background Patterns */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-amber-200 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />

      {/* Top Section */}
      <div className="flex h-[60%] relative z-10 p-4 gap-4">
        <div className="flex flex-col items-center justify-start pt-4 w-1/4">
          <NumberTicker
            value={player.rating}
            className="text-4xl font-black text-amber-500 tracking-tighter leading-none"
          />
          <span className="text-lg font-bold text-amber-200/80 tracking-wide mt-1">
            {player.position}
          </span>
        </div>
        <div className="w-3/4 flex items-end justify-center relative">
          {player.image ? (
            <Image
              src={player.image}
              alt={player.name}
              width={200}
              height={200}
              className="h-full w-full object-cover drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] mask-image-gradient rounded-3xl"
            />
          ) : (
            <User size={96} className="text-slate-600 mb-4" />
          )}
        </div>
      </div>

      {/* Name Plate */}
      <div className="relative z-20 flex flex-col items-center justify-center -mt-2">
        <div className="w-[90%] h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
        <h2 className="text-xl font-black text-amber-100 uppercase tracking-tight py-1 truncate max-w-[90%] text-center font-sans">
          {player.name}
        </h2>
        <div className="w-[90%] h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mb-3" />
      </div>

      {/* Attributes Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-6 pb-6 text-sm font-bold text-amber-100/90 relative z-10">
        {[1, 4, 2, 5, 3, 6, 7, 8].map((i) => {
          const key = `attr${i}` as keyof typeof labels;
          return (
            <div key={key} className="flex justify-between">
              <span className="text-amber-500/80 w-8">{labels[key]}</span>
              <span>{player.attributes[key]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      onClick={() => onToggleSelect(player.id)}
      className="relative group perspective-1000 w-64 h-96 transition-all duration-300 hover:scale-105 hover:z-10 cursor-pointer"
    >
      {isSelected && (
        <div className="absolute -top-3 -left-3 z-50 bg-green-500 text-black p-1 rounded-full shadow-lg animate-in zoom-in duration-200">
          <CheckCircle2 size={24} fill="white" className="text-green-600" />
        </div>
      )}

      {/* Action Buttons */}
      <div className="absolute -top-2 -right-2 z-50 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(player);
          }}
          className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-500 transition-colors"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(player.id);
          }}
          className="bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-500 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {isSelected ? (
        <ShineBorder
          className="w-full h-full p-0 bg-transparent border-0 rounded-t-[32px] rounded-b-2xl overflow-hidden"
          color={["#22c55e", "#f59e0b"]}
          borderRadius={32}
          borderWidth={3}
        >
          <CardContent />
        </ShineBorder>
      ) : (
        <div className="w-full h-full rounded-t-[32px] rounded-b-2xl border-2 border-amber-600/50 shadow-2xl overflow-hidden">
          <CardContent />
        </div>
      )}
    </div>
  );
}
