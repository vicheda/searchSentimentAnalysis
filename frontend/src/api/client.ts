import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:3001/api" });

export interface BrandAttribute {
  id: string;
  text: string;
  sentiment: string;
}

export interface BrandResult {
  id: string;
  brandName: string;
  isVisible: boolean;
  mentionCount: number;
  firstMentionIndex: number | null;
  sentimentScore: number | null;
  sentimentLabel: string | null;
  scoringMethod: string | null;
  attributes: BrandAttribute[];
}

export interface Simulation {
  id: string;
  prompt: string;
  rawResponse: string;
  createdAt: string;
  brandResults: BrandResult[];
}

export const runSimulation = (prompt: string) =>
  api.post<Simulation>("/simulations", { prompt }).then(r => r.data);

export const getSimulations = () =>
  api.get<Simulation[]>("/simulations").then(r => r.data);

export const getSimulation = (id: string) =>
  api.get<Simulation>(`/simulations/${id}`).then(r => r.data);
