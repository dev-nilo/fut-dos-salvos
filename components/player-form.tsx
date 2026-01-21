import React, { useRef } from "react";
import { X, Upload, Save, User } from "lucide-react";
import { Player, PlayerPosition, Attributes } from "@/lib/types";
import { StatSlider } from "./stat-slider";

interface PlayerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  newName: string;
  setNewName: (s: string) => void;
  newPosition: PlayerPosition;
  setNewPosition: (p: PlayerPosition) => void;
  newImage: string | null;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  attributes: Attributes;
  setAttributes: (a: Attributes) => void;
  liveRating: number;
  isEditing: boolean;
}

const POSITIONS: PlayerPosition[] = [
  "GK",
  "CB",
  "LB",
  "RB",
  "CDM",
  "CM",
  "CAM",
  "LM",
  "RM",
  "LW",
  "RW",
  "CF",
  "ST",
];
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

export function PlayerForm({
  isOpen,
  onClose,
  onSave,
  newName,
  setNewName,
  newPosition,
  setNewPosition,
  newImage,
  onImageUpload,
  attributes,
  setAttributes,
  liveRating,
  isEditing,
}: PlayerFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isGK = newPosition === "GK";
  const currentLabels = isGK ? GK_LABELS : OUTFIELD_LABELS;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">
            <User size={20} />
            {isEditing ? "Editar Jogador" : "Criar Jogador"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">
                Nome do Jogador
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Pelé"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">
                Posição
              </label>
              <div className="grid grid-cols-4 gap-2">
                {POSITIONS.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setNewPosition(pos)}
                    className={`text-xs py-2 rounded-md font-bold transition-all ${
                      newPosition === pos
                        ? "bg-amber-500 text-black shadow-lg"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">
                Foto (Avatar)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-32 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-slate-800/50 transition-all relative overflow-hidden group"
              >
                {newImage ? (
                  <img
                    src={newImage}
                    alt="Preview"
                    className="h-full object-contain z-10"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-500 group-hover:text-amber-500">
                    <Upload size={24} className="mb-2" />
                    <span className="text-xs">Clique para upload</span>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={onImageUpload}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <span className="text-sm font-bold text-slate-300">
                OVR Estimado
              </span>
              <span
                className={`text-3xl font-black ${liveRating >= 90 ? "text-amber-500" : "text-slate-100"}`}
              >
                {liveRating}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 bg-slate-800/30 p-4 rounded-xl border border-slate-700/30">
              {Object.keys(attributes).map((key) => (
                <StatSlider
                  key={key}
                  label={currentLabels[key as keyof Attributes]}
                  value={attributes[key as keyof Attributes]}
                  onChange={(v) => setAttributes({ ...attributes, [key]: v })}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-300 hover:text-white font-bold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={!newName}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 px-6 rounded-lg flex items-center gap-2 shadow-lg transition-all disabled:opacity-50"
          >
            <Save size={18} />{" "}
            {isEditing ? "Salvar Alterações" : "Salvar Carta"}
          </button>
        </div>
      </div>
    </div>
  );
}
