import { api } from "@/lib/api";
import type { AdminOverview, AdminParticipant, AdminSettings, Paginated } from "@/types";

export const login = (email: string, password: string) =>
  api.post<{ email: string }>("/admin/auth/login", { email, password }).then((r) => r.data);
export const logout = () => api.post("/admin/auth/logout").then((r) => r.data);
export const me = () => api.get<{ email: string }>("/admin/auth/me").then((r) => r.data);
export const getOverview = () => api.get<AdminOverview>("/admin/overview").then((r) => r.data);

export interface AdminListQuery {
  page?: number;
  limit?: number;
  q?: string;
  sort?: "newest" | "oldest";
  status?: "all" | "published" | "draft";
}
export const listParticipants = (params: AdminListQuery) =>
  api.get<Paginated<AdminParticipant>>("/admin/participants", { params }).then((r) => r.data);
export const getParticipant = (id: string) =>
  api.get<AdminParticipant>(`/admin/participants/${id}`).then((r) => r.data);
export const createParticipant = (form: FormData) =>
  api.post<AdminParticipant>("/admin/participants", form).then((r) => r.data);
export const updateParticipant = (id: string, form: FormData) =>
  api.put<AdminParticipant>(`/admin/participants/${id}`, form).then((r) => r.data);
export const setPublished = (id: string, isPublished: boolean) =>
  api.patch<AdminParticipant>(`/admin/participants/${id}/publish`, { isPublished }).then((r) => r.data);
export const logReturning = (id: string) =>
  api.post<AdminParticipant>(`/admin/participants/${id}/returning`).then((r) => r.data);
export const deleteParticipant = (id: string) => api.delete(`/admin/participants/${id}`).then((r) => r.data);

export const getSettings = () => api.get<AdminSettings>("/admin/settings").then((r) => r.data);
export const updateSettings = (form: FormData) => api.put<AdminSettings>("/admin/settings", form).then((r) => r.data);
