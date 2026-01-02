"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus,
  X,
  Upload,
  Shield,
  Trash2,
  Save,
  User,
  Shuffle,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Pencil,
} from "lucide-react";

// --- Firebase Imports ---
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
  User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
} from "firebase/firestore";

// --- Firebase Initialization ---

/* ===================================================================================
  GUIA DE CONFIGURAÇÃO PARA SEU PROJETO (PRODUÇÃO / VERCEL / LOCALHOST)
  ===================================================================================
  1. Crie um projeto no Firebase Console (https://console.firebase.google.com).
  2. Habilite "Authentication" (Sign-in method > Anonymous).
  3. Crie um "Firestore Database" (Rules: allow read, write: if request.auth != null;).
  4. Crie um arquivo `.env.local` na raiz do seu projeto Next.js com suas chaves:
     NEXT_PUBLIC_FIREBASE_API_KEY=...
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
     NEXT_PUBLIC_FIREBASE_APP_ID=...

  5. DESCOMENTE O BLOCO ABAIXO E COMENTE A SEÇÃO "CONFIGURAÇÃO AUTOMÁTICA":
*/

/*
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};
const appId = 'meu-fut-app-v1'; // Defina um nome para a coleção do seu app
*/

// ===================================================================================
// CONFIGURAÇÃO AUTOMÁTICA (SOMENTE PARA ESTE AMBIENTE CANVAS - NÃO COPIE ISTO)
// ===================================================================================
// Declaração de variáveis globais injetadas pelo ambiente de teste
declare const __firebase_config: string;
declare const __app_id: string;
declare const __initial_auth_token: string | undefined;

// Lógica de fallback para funcionar no Canvas sem quebrar se as variáveis não existirem
const getCanvasConfig = () => {
  try {
    return typeof __firebase_config !== "undefined"
      ? JSON.parse(__firebase_config)
      : {
          apiKey: "AIzaSyCdgujm12Phca07r8lIkZ-Vu-ShA4_1ebY",
          authDomain: "fut-dos-salvos.firebaseapp.com",
          projectId: "fut-dos-salvos",
          storageBucket: "fut-dos-salvos.firebasestorage.app",
          messagingSenderId: "1015340809584",
          appId: "1:1015340809584:web:97f771bb9df23286bae3b5",
          measurementId: "G-CZN3CBZV9H",
        };
  } catch (e) {
    return {
      apiKey: "AIzaSyCdgujm12Phca07r8lIkZ-Vu-ShA4_1ebY",
      authDomain: "fut-dos-salvos.firebaseapp.com",
      projectId: "fut-dos-salvos",
      storageBucket: "fut-dos-salvos.firebasestorage.app",
      messagingSenderId: "1015340809584",
      appId: "1:1015340809584:web:97f771bb9df23286bae3b5",
      measurementId: "G-CZN3CBZV9H",
    };
  }
};

const firebaseConfig = getCanvasConfig();
const appId = typeof __app_id !== "undefined" ? __app_id : "fut-dos-salvos";

// Inicialização (Igual para ambos os ambientes)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Types & Constants ---

type PlayerPosition =
  | "GK"
  | "CB"
  | "LB"
  | "RB"
  | "CDM"
  | "CM"
  | "CAM"
  | "LM"
  | "RM"
  | "LW"
  | "RW"
  | "CF"
  | "ST";

interface Attributes {
  attr1: number; // PAC / DIV
  attr2: number; // SHO / HAN
  attr3: number; // PAS / KIC
  attr4: number; // DRI / REF
  attr5: number; // DEF / SPD
  attr6: number; // PHY / POS
}

interface Player {
  id: string;
  name: string;
  position: PlayerPosition;
  image: string | null;
  attributes: Attributes;
  rating: number; // Calculated OVR
}

interface TeamData {
  name: string;
  members: Player[];
  avg: number;
  color: string;
  borderColor: string;
  headerColor: string;
}

const OUTFIELD_LABELS = {
  attr1: "PAC",
  attr2: "SHO",
  attr3: "PAS",
  attr4: "DRI",
  attr5: "DEF",
  attr6: "PHY",
};

const GK_LABELS = {
  attr1: "DIV",
  attr2: "HAN",
  attr3: "KIC",
  attr4: "REF",
  attr5: "SPD",
  attr6: "POS",
};

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

// --- Helper Functions ---

const calculateOVR = (attrs: Attributes): number => {
  const values = Object.values(attrs);
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round(sum / values.length);
};

const getStatColor = (value: number) => {
  if (value >= 90) return "text-green-400";
  if (value >= 80) return "text-green-200";
  if (value >= 70) return "text-yellow-200";
  if (value >= 50) return "text-orange-300";
  return "text-red-400";
};

// --- Image Processing Helper ---
const processImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Define Standard Format: 3:4 Aspect Ratio (Portrait)
        const targetWidth = 300;
        const targetHeight = 400;
        const targetRatio = targetWidth / targetHeight;

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(img.src);
          return;
        }

        // Logic to "Cover" and "Top Align"
        const imgRatio = img.width / img.height;

        let renderW, renderH, offsetX, offsetY;

        if (imgRatio > targetRatio) {
          // Image is wider than target (Landscape-ish)
          renderH = targetHeight;
          renderW = targetHeight * imgRatio;
          offsetX = (targetWidth - renderW) / 2; // Center Horizontally
          offsetY = 0; // Top Align (Focus on face)
        } else {
          // Image is taller than target (Portrait-ish)
          renderW = targetWidth;
          renderH = targetWidth / imgRatio;
          offsetX = 0;
          offsetY = 0; // Top Align
        }

        // Draw with smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, offsetX, offsetY, renderW, renderH);

        resolve(canvas.toDataURL("image/png"));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

// --- Components ---

const StatSlider = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
}) => (
  <div className="flex flex-col space-y-1">
    <div className="flex justify-between text-xs font-bold tracking-wider text-slate-400">
      <span>{label}</span>
      <span className={getStatColor(value)}>{value}</span>
    </div>
    <input
      type="range"
      min="1"
      max="99"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all"
    />
  </div>
);

const PlayerCard = ({
  player,
  onDelete,
  onEdit,
  isSelected,
  onToggleSelect,
}: {
  player: Player;
  onDelete: (id: string) => void;
  onEdit: (player: Player) => void;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}) => {
  const isGK = player.position === "GK";
  const labels = isGK ? GK_LABELS : OUTFIELD_LABELS;

  return (
    <div
      onClick={() => onToggleSelect(player.id)}
      className={`relative group perspective-1000 w-64 h-96 transition-all duration-300 hover:scale-105 hover:z-10 cursor-pointer ${
        isSelected ? "ring-4 ring-green-500 rounded-[2rem]" : ""
      }`}
    >
      {/* Selection Indicator Overlay */}
      {isSelected && (
        <div className="absolute -top-3 -left-3 z-50 bg-green-500 text-black p-1 rounded-full shadow-lg animate-in zoom-in duration-200">
          <CheckCircle2 size={24} fill="white" className="text-green-600" />
        </div>
      )}

      {/* Action Buttons (Visible on Hover) */}
      <div className="absolute -top-2 -right-2 z-50 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(player);
          }}
          className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-500 transition-colors"
          title="Editar Carta"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(player.id);
          }}
          className="bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-500 transition-colors"
          title="Excluir Carta"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Card Container */}
      <div
        className={`relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 ${
          isSelected ? "border-green-500" : "border-amber-600/50"
        } rounded-t-[2rem] rounded-b-xl shadow-2xl overflow-hidden select-none flex flex-col`}
      >
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-200 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute top-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>

        {/* Top Section: Rating, Pos, Image */}
        <div className="flex h-[55%] relative z-10 p-4">
          <div className="flex flex-col items-center justify-start pt-4 w-1/4">
            <span className="text-4xl font-black text-amber-500 tracking-tighter leading-none">
              {player.rating}
            </span>
            <span className="text-lg font-bold text-amber-200/80 tracking-wide mt-1">
              {player.position}
            </span>
            <div className="w-8 h-px bg-amber-600/50 my-2"></div>
            <img
              src="https://upload.wikimedia.org/wikipedia/en/thumb/0/05/Flag_of_Brazil.svg/640px-Flag_of_Brazil.svg.png"
              alt="Nation"
              width={24}
              height={16}
              className="w-6 h-4 object-cover shadow-sm opacity-80"
            />
          </div>
          <div className="w-3/4 flex items-end justify-center relative">
            {player.image ? (
              /* Updated Image CSS for Standard Fit */
              <img
                src={player.image}
                alt={player.name}
                className="h-full w-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] mask-image-gradient"
              />
            ) : (
              <User size={96} className="text-slate-600 mb-4" />
            )}
          </div>
        </div>

        {/* Name Plate */}
        <div className="relative z-20 flex flex-col items-center justify-center -mt-2">
          <div className="w-[90%] h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
          <h2 className="text-xl font-black text-amber-100 uppercase tracking-tight py-1 truncate max-w-[90%] text-center font-sans">
            {player.name}
          </h2>
          <div className="w-[90%] h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mb-3"></div>
        </div>

        {/* Attributes Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-6 pb-6 text-sm font-bold text-amber-100/90 relative z-10">
          <div className="flex justify-between">
            <span className="text-amber-500/80 w-8">{labels.attr1}</span>
            <span>{player.attributes.attr1}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-amber-500/80 w-8">{labels.attr4}</span>
            <span>{player.attributes.attr4}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-amber-500/80 w-8">{labels.attr2}</span>
            <span>{player.attributes.attr2}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-amber-500/80 w-8">{labels.attr5}</span>
            <span>{player.attributes.attr5}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-amber-500/80 w-8">{labels.attr3}</span>
            <span>{player.attributes.attr3}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-amber-500/80 w-8">{labels.attr6}</span>
            <span>{player.attributes.attr6}</span>
          </div>
        </div>

        {/* Bottom Decorative Element */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-30">
          <Shield size={64} className="text-amber-900 fill-amber-950/50" />
        </div>
      </div>
    </div>
  );
};

const MiniPlayerRow = ({ player }: { player: Player }) => (
  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-amber-500/50 transition-colors">
    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-900 border border-slate-600 shrink-0">
      {player.image ? (
        <img
          src={player.image}
          alt={player.name}
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

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);
  const [generatedTeams, setGeneratedTeams] = useState<TeamData[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newPosition, setNewPosition] = useState<PlayerPosition>("ST");
  const [newImage, setNewImage] = useState<string | null>(null);
  const [attributes, setAttributes] = useState<Attributes>({
    attr1: 75,
    attr2: 75,
    attr3: 75,
    attr4: 75,
    attr5: 75,
    attr6: 75,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Firebase Auth & Data Sync ---
  useEffect(() => {
    const initAuth = async () => {
      const initialToken =
        typeof __initial_auth_token !== "undefined"
          ? __initial_auth_token
          : undefined;

      if (initialToken) {
        await signInWithCustomToken(auth, initialToken);
      } else {
        await signInAnonymously(auth);
      }
    };

    initAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const playersRef = collection(
      db,
      "artifacts",
      appId,
      "users",
      user.uid,
      "players"
    );
    const q = query(playersRef);

    const unsubscribeSnapshot = onSnapshot(
      q,
      (snapshot) => {
        const loadedPlayers: Player[] = [];
        snapshot.forEach((doc) => {
          loadedPlayers.push(doc.data() as Player);
        });
        setPlayers(loadedPlayers);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching players:", error);
        setLoading(false);
      }
    );

    return () => unsubscribeSnapshot();
  }, [user]);

  // --- Handlers ---

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Use the Imperative Standard Processor
      const processedImage = await processImage(file);
      setNewImage(processedImage);
    }
  };

  const handleEdit = (player: Player) => {
    setEditingPlayerId(player.id);
    setNewName(player.name);
    setNewPosition(player.position);
    setNewImage(player.image);
    setAttributes(player.attributes);
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!newName || !user) return;

    // If editing, use existing ID, else generate new
    const idToUse = editingPlayerId || Date.now().toString();

    const playerData: Player = {
      id: idToUse,
      name: newName,
      position: newPosition,
      image: newImage,
      attributes: { ...attributes },
      rating: calculateOVR(attributes),
    };

    try {
      await setDoc(
        doc(db, "artifacts", appId, "users", user.uid, "players", idToUse),
        playerData
      );
      resetForm();
      setIsModalOpen(false);
    } catch (e) {
      console.error("Error saving player", e);
      alert("Erro ao salvar carta. Tente novamente.");
    }
  };

  const resetForm = () => {
    setEditingPlayerId(null);
    setNewName("");
    setNewPosition("ST");
    setNewImage(null);
    setAttributes({
      attr1: 75,
      attr2: 75,
      attr3: 75,
      attr4: 75,
      attr5: 75,
      attr6: 75,
    });
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(
        doc(db, "artifacts", appId, "users", user.uid, "players", id)
      );
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (e) {
      console.error("Error deleting player", e);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === players.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(players.map((p) => p.id)));
    }
  };

  // --- Team Balancing Logic (3 Teams) ---
  const handleDrawTeams = () => {
    const selectedPlayers = players.filter((p) => selectedIds.has(p.id));
    const sortedPlayers = [...selectedPlayers].sort(
      (a, b) => b.rating - a.rating
    );

    const teams: Player[][] = [[], [], []];
    const teamSums = [0, 0, 0];

    sortedPlayers.forEach((player) => {
      let minIndex = 0;
      let minSum = teamSums[0];

      for (let i = 1; i < 3; i++) {
        if (teamSums[i] < minSum) {
          minSum = teamSums[i];
          minIndex = i;
        }
      }

      teams[minIndex].push(player);
      teamSums[minIndex] += player.rating;
    });

    const resultTeams: TeamData[] = [
      {
        name: "TIME A",
        members: teams[0],
        avg: teams[0].length ? Math.round(teamSums[0] / teams[0].length) : 0,
        color: "from-blue-900 to-slate-900",
        borderColor: "border-blue-800",
        headerColor: "text-blue-200",
      },
      {
        name: "TIME B",
        members: teams[1],
        avg: teams[1].length ? Math.round(teamSums[1] / teams[1].length) : 0,
        color: "from-red-900 to-slate-900",
        borderColor: "border-red-800",
        headerColor: "text-red-200",
      },
      {
        name: "TIME C",
        members: teams[2],
        avg: teams[2].length ? Math.round(teamSums[2] / teams[2].length) : 0,
        color: "from-green-900 to-slate-900",
        borderColor: "border-green-800",
        headerColor: "text-green-200",
      },
    ];

    setGeneratedTeams(resultTeams);
    setIsDrawModalOpen(true);
  };

  const isGK = newPosition === "GK";
  const currentLabels = isGK ? GK_LABELS : OUTFIELD_LABELS;
  const liveRating = useMemo(() => calculateOVR(attributes), [attributes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-500">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-black">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="text-amber-500 fill-amber-500/20" />
            <h1 className="text-xl font-bold tracking-tight text-amber-500">
              FUT <span className="text-white">DOS SALVOS</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={selectAll}
              disabled={players.length === 0}
              className="text-xs font-bold text-slate-400 hover:text-white mr-2 hidden sm:block disabled:opacity-30"
            >
              {selectedIds.size === players.length && players.length > 0
                ? "Desmarcar Todos"
                : "Marcar Todos"}
            </button>
            <button
              onClick={handleDrawTeams}
              disabled={selectedIds.size < 3}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all border border-slate-700 hover:border-amber-500/50"
            >
              <Shuffle size={18} />
              <span className="hidden sm:inline">Sortear Times</span>
              {selectedIds.size > 0 && (
                <span className="bg-slate-900 px-2 py-0.5 rounded text-xs ml-1 border border-slate-700">
                  {selectedIds.size}
                </span>
              )}
            </button>
            <button
              onClick={handleOpenNew}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Nova Carta</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto p-8">
        {players.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-600">
            <Shield size={64} className="mb-4 opacity-20" />
            <p className="text-xl font-medium">Nenhum jogador encontrado.</p>
            <p className="text-sm opacity-60">
              Suas cartas ficarão salvas aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                onDelete={handleDelete}
                onEdit={handleEdit}
                isSelected={selectedIds.has(player.id)}
                onToggleSelect={handleToggleSelect}
              />
            ))}
          </div>
        )}
      </main>

      {/* Creator Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">
                <User size={20} />
                {editingPlayerId ? "Editar Jogador" : "Criar Jogador"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
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
                    autoFocus
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
                            ? "bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]"
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
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>
              </div>
              {/* Right Column */}
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <span className="text-sm font-bold text-slate-300">
                    OVR Estimado
                  </span>
                  <span
                    className={`text-3xl font-black ${
                      liveRating >= 90 ? "text-amber-500" : "text-slate-100"
                    }`}
                  >
                    {liveRating}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 bg-slate-800/30 p-4 rounded-xl border border-slate-700/30">
                  <StatSlider
                    label={currentLabels.attr1}
                    value={attributes.attr1}
                    onChange={(v) => setAttributes({ ...attributes, attr1: v })}
                  />
                  <StatSlider
                    label={currentLabels.attr2}
                    value={attributes.attr2}
                    onChange={(v) => setAttributes({ ...attributes, attr2: v })}
                  />
                  <StatSlider
                    label={currentLabels.attr3}
                    value={attributes.attr3}
                    onChange={(v) => setAttributes({ ...attributes, attr3: v })}
                  />
                  <StatSlider
                    label={currentLabels.attr4}
                    value={attributes.attr4}
                    onChange={(v) => setAttributes({ ...attributes, attr4: v })}
                  />
                  <StatSlider
                    label={currentLabels.attr5}
                    value={attributes.attr5}
                    onChange={(v) => setAttributes({ ...attributes, attr5: v })}
                  />
                  <StatSlider
                    label={currentLabels.attr6}
                    value={attributes.attr6}
                    onChange={(v) => setAttributes({ ...attributes, attr6: v })}
                  />
                </div>
              </div>
            </div>
            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-300 hover:text-white font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!newName}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-2 px-6 rounded-lg flex items-center gap-2 shadow-lg transition-all"
              >
                <Save size={18} />
                {editingPlayerId ? "Salvar Alterações" : "Salvar Carta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draw Teams Modal */}
      {isDrawModalOpen && generatedTeams && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">
                <Shuffle size={20} />
                Sorteio Realizado ({selectedIds.size} Jogadores)
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleDrawTeams}
                  className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-amber-500 transition-colors"
                  title="Refazer Sorteio"
                >
                  <RefreshCw size={20} />
                </button>
                <button
                  onClick={() => setIsDrawModalOpen(false)}
                  className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Teams Grid - Now 3 Columns */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
              {generatedTeams.map((team, idx) => (
                <div
                  key={idx}
                  className={`bg-slate-900/80 rounded-xl border ${team.borderColor} overflow-hidden flex flex-col shadow-xl`}
                >
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
                  <div className="bg-slate-950/30 p-2 text-center text-xs text-slate-400 font-bold border-t border-slate-800/50">
                    {team.members.length} Jogadores
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
