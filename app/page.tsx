"use client";

import React, { useState, useMemo, useEffect, useId } from "react";
import { Plus, Loader2, Shuffle } from "lucide-react";
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
  User as FirebaseUser,
} from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
} from "firebase/firestore";
import { auth, db, appId } from "@/lib/firebase";
import { Player, Attributes, PlayerPosition, TeamData } from "@/lib/types";
import { calculateOVR, generateBalancedTeams, processImage } from "@/lib/utils";
import { toast } from "sonner";

import { PlayerCard } from "@/components/player-card";
import { PlayerForm } from "@/components/player-form";
import { TeamDrawer } from "@/components/team-drawer";
import BlurFade from "@/components/ui/blur-fade";

declare const __initial_auth_token: string | undefined;

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);
  const [generatedTeams, setGeneratedTeams] = useState<TeamData[] | null>(null);

  // Form State
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [newPlayerId, setNewPlayerId] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [newPosition, setNewPosition] = useState<PlayerPosition>("ST");
  const [newImage, setNewImage] = useState<string | null>(null);
  const [attributes, setAttributes] = useState<Attributes>({
    attr1: 60,
    attr2: 60,
    attr3: 60,
    attr4: 60,
    attr5: 60,
    attr6: 60,
    attr7: 60,
    attr8: 60,
  });

  const newPlayerIdHook = useId();

  useEffect(() => {
    const initAuth = async () => {
      const initialToken =
        typeof __initial_auth_token !== "undefined"
          ? __initial_auth_token
          : undefined;
      if (initialToken) await signInWithCustomToken(auth, initialToken);
      else await signInAnonymously(auth);
    };
    initAuth();
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "artifacts", appId, "users", user.uid, "players"),
    );
    return onSnapshot(q, (snapshot) => {
      setPlayers(snapshot.docs.map((doc) => doc.data() as Player));
      setLoading(false);
    });
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setNewImage(await processImage(e.target.files[0]));
  };

  const resetForm = () => {
    setEditingPlayerId(null);
    setNewPlayerId("");
    setNewName("");
    setNewPosition("ST");
    setNewImage(null);
    setAttributes({
      attr1: 60,
      attr2: 60,
      attr3: 60,
      attr4: 60,
      attr5: 60,
      attr6: 60,
      attr7: 60,
      attr8: 60,
    });
  };

  const handleSave = async () => {
    if (!newName || !user) return;
    const playerData: Player = {
      id: newPlayerId,
      name: newName,
      position: newPosition,
      image: newImage,
      attributes: { ...attributes },
      rating: calculateOVR(attributes),
    };

    const promise = setDoc(
      doc(db, "artifacts", appId, "users", user.uid, "players", newPlayerId),
      playerData,
    );
    toast.promise(promise, {
      loading: "Salvando carta...",
      success: "Carta salva com sucesso!",
      error: "Erro ao salvar carta",
    });

    try {
      await promise;
      resetForm();
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;

    toast("Tem certeza?", {
      action: {
        label: "Excluir",
        onClick: async () => {
          await deleteDoc(
            doc(db, "artifacts", appId, "users", user.uid, "players", id),
          );
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          toast.success("Carta excluída");
        },
      },
    });
  };

  const handleDrawTeams = () => {
    const selectedPlayers = players.filter((p) => selectedIds.has(p.id));
    setGeneratedTeams(generateBalancedTeams(selectedPlayers));
    setIsDrawModalOpen(true);
  };

  const handleEdit = (player: Player) => {
    setEditingPlayerId(player.id);
    setNewPlayerId(player.id);
    setNewName(player.name);
    setNewPosition(player.position);
    setNewImage(player.image);
    setAttributes(player.attributes);
    setIsModalOpen(true);
  };

  const liveRating = useMemo(() => calculateOVR(attributes), [attributes]);

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-500">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-black">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-amber-500">
            FUT <span className="text-white">DOS SALVOS</span>
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                setSelectedIds(
                  selectedIds.size === players.length
                    ? new Set()
                    : new Set(players.map((p) => p.id)),
                )
              }
              disabled={players.length === 0}
              className="text-xs font-bold text-slate-400 hover:text-white mr-2 hidden sm:block"
            >
              {selectedIds.size === players.length && players.length > 0
                ? "Desmarcar Todos"
                : "Marcar Todos"}
            </button>
            <button
              onClick={handleDrawTeams}
              disabled={selectedIds.size < 3}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold py-2 px-4 rounded-lg flex items-center gap-2 border border-slate-700 hover:border-amber-500/50 transition-all"
            >
              <Shuffle size={18} />{" "}
              <span className="hidden sm:inline">Sortear</span>
              {selectedIds.size > 0 && (
                <span className="bg-slate-900 px-2 py-0.5 rounded text-xs">
                  {selectedIds.size}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                resetForm();
                setNewPlayerId(newPlayerIdHook);
                setIsModalOpen(true);
              }}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all"
            >
              <Plus size={18} />{" "}
              <span className="hidden sm:inline">Nova Carta</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto p-8">
        {players.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-600">
            <p className="text-xl font-medium">Nenhum jogador encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
            {players.map((player, idx) => (
              <BlurFade key={player.id} delay={0.05 * idx} inView>
                <PlayerCard
                  player={player}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  isSelected={selectedIds.has(player.id)}
                  onToggleSelect={(id) =>
                    setSelectedIds((prev) => {
                      const n = new Set(prev);
                      n.has(id) ? n.delete(id) : n.add(id);
                      return n;
                    })
                  }
                />
              </BlurFade>
            ))}
          </div>
        )}
      </main>

      <PlayerForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        newName={newName}
        setNewName={setNewName}
        newPosition={newPosition}
        setNewPosition={setNewPosition}
        newImage={newImage}
        onImageUpload={handleImageUpload}
        attributes={attributes}
        setAttributes={setAttributes}
        liveRating={liveRating}
        isEditing={!!editingPlayerId}
      />

      <TeamDrawer
        isOpen={isDrawModalOpen}
        teams={generatedTeams}
        onClose={() => setIsDrawModalOpen(false)}
        onRedraw={handleDrawTeams}
        playerCount={selectedIds.size}
      />
    </div>
  );
}
