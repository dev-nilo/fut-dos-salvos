import { Attributes, Player, TeamData } from "./types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const calculateOVR = (attrs: Attributes): number => {
  const values = Object.values(attrs);
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round(sum / values.length);
};

export const processImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement("img");
      img.onload = () => {
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

        const imgRatio = img.width / img.height;
        let renderW, renderH, offsetX, offsetY;

        if (imgRatio > targetRatio) {
          renderH = targetHeight;
          renderW = targetHeight * imgRatio;
          offsetX = (targetWidth - renderW) / 2;
          offsetY = 0;
        } else {
          renderW = targetWidth;
          renderH = targetWidth / imgRatio;
          offsetX = 0;
          offsetY = 0;
        }

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

export const generateBalancedTeams = (players: Player[]): TeamData[] => {
  const sortedPlayers = [...players].sort((a, b) => b.rating - a.rating);
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

  return [
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
};
