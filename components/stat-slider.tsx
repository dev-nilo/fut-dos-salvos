import { getStatColor } from "@/lib/utils"; // You need to export getStatColor or move logic here

const getStatColorLocal = (value: number) => {
  if (value >= 90) return "text-green-400";
  if (value >= 80) return "text-green-200";
  if (value >= 70) return "text-yellow-200";
  if (value >= 50) return "text-orange-300";
  return "text-red-400";
};

export const StatSlider = ({
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
      <span className={getStatColorLocal(value)}>{value}</span>
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
