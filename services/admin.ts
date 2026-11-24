import { api } from "@/lib/api";
import type { AdminOverview, AdminParticipant, AdminSettings, Paginated, ParticipantPayload, SlotInfo } from "@/types";

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
// Photos and videos are uploaded straight to Cloudinary first; these calls only send small JSON.
export const createParticipant = (body: ParticipantPayload) =>
  api.post<AdminParticipant>("/admin/participants", body).then((r) => r.data);
export const updateParticipant = (id: string, body: ParticipantPayload) =>
  api.put<AdminParticipant>(`/admin/participants/${id}`, body).then((r) => r.data);
export const getSlots = () => api.get<SlotInfo>("/admin/slots").then((r) => r.data);
export const signUpload = (kind: "image" | "video") =>
  api
    .post<{ uploadUrl: string; apiKey: string; params: Record<string, string | number>; signature: string }>(
      "/admin/uploads/sign",
      { kind },
    )
    .then((r) => r.data);
export const discardUpload = (kind: "image" | "video", publicId: string) =>
  api.post("/admin/uploads/discard", { kind, publicId }).then((r) => r.data);
export const setPublished = (id: string, isPublished: boolean) =>
  api.patch<AdminParticipant>(`/admin/participants/${id}/publish`, { isPublished }).then((r) => r.data);
export const logReturning = (id: string) =>
  api.post<AdminParticipant>(`/admin/participants/${id}/returning`).then((r) => r.data);
export const deleteParticipant = (id: string) => api.delete(`/admin/participants/${id}`).then((r) => r.data);

export const getSettings = () => api.get<AdminSettings>("/admin/settings").then((r) => r.data);
export const updateSettings = (form: FormData) => api.put<AdminSettings>("/admin/settings", form).then((r) => r.data);
