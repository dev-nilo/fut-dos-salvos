export type PlayerPosition =
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

export interface Attributes {
  attr1: number; // VEL/DIV
  attr2: number; // RES/HAN
  attr3: number; // CHU/KIC
  attr4: number; // DRI/REF
  attr5: number; // PAS/SPD
  attr6: number; // DEF/POS
  attr7: number; // POS/COM
  attr8: number; // FIS/REA
}

export interface Player {
  id: string;
  name: string;
  position: PlayerPosition;
  image: string | null;
  attributes: Attributes;
  rating: number;
}

export interface TeamData {
  name: string;
  members: Player[];
  avg: number;
  color: string;
  borderColor: string;
  headerColor: string;
}
