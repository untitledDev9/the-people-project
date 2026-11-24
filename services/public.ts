import { api } from "@/lib/api";
import type { ParticipantDetail, Paginated, PublicParticipant, SiteSettings, Stats } from "@/types";

export interface DirectoryQuery {
  page?: number;
  limit?: number;
  q?: string;
  sort?: "newest" | "oldest";
  location?: string;
  event?: string;
}

export const getSettings = () => api.get<SiteSettings>("/settings").then((r) => r.data);
export const getStats = () => api.get<Stats>("/stats").then((r) => r.data);
export const getLatest = (limit = 8) =>
  api.get<{ items: PublicParticipant[] }>("/participants/latest", { params: { limit } }).then((r) => r.data.items);
export const getParticipants = (params: DirectoryQuery) =>
  api.get<Paginated<PublicParticipant>>("/participants", { params }).then((r) => r.data);
export const getParticipant = (n: number) => api.get<ParticipantDetail>(`/participants/${n}`).then((r) => r.data);
export const getFilters = () =>
  api.get<{ locations: string[]; events: string[] }>("/participants/filters").then((r) => r.data);
