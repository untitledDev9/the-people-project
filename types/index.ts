export interface PublicParticipant {
  number: number;
  displayName: string;
  biography: string;
  quote: string;
  portraitUrl: string | null;
  videoUrl: string | null;
  dateMet: string;
  eventName: string;
  location: string;
}

export interface NavPerson {
  number: number;
  displayName: string;
}

export interface ParticipantDetail extends PublicParticipant {
  prev: NavPerson | null;
  next: NavPerson | null;
}

export interface AdminParticipant extends PublicParticipant {
  id: string;
  consentConfirmed: boolean;
  isPublished: boolean;
  returnCount: number;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Stats {
  target: number;
  total: number;
  remaining: number;
  percent: number;
  events: number;
  locations: number;
  latestNumber: number | null;
  startDate: string | null;
  milestones: number[];
  latestMilestone: number | null;
  nextMilestone: number | null;
}

export interface SiteSettings {
  projectName: string;
  brandName: string;
  tagline: string;
  description: string;
  aboutText: string;
  contactEmail: string;
  whatsapp: string;
  phone: string;
  socialLinks: { tiktok: string; instagram: string; youtube: string };
  heroImageUrl: string | null;
  featuredParticipants: PublicParticipant[];
}

export interface AdminSettings extends Omit<SiteSettings, "featuredParticipants"> {
  featuredNumbers: number[];
}

export interface AdminOverview {
  target: number;
  published: number;
  drafts: number;
  remaining: number;
  percent: number;
  recent: AdminParticipant[];
  latestMilestone: number | null;
  nextMilestone: number | null;
}

export interface DuplicateMatch {
  id: string;
  number: number;
  displayName: string;
  dateMet: string;
}

/** A file already uploaded straight to Cloudinary by the browser. */
export interface UploadAsset {
  url: string;
  publicId: string;
}

/** `next` is the number the next person gets; `vacant` are empty numbers left by deleted people. */
export interface SlotInfo {
  next: number;
  vacant: number[];
  /** Highest number ever handed out; new numbers continue from seq + 1. */
  seq?: number;
}

export interface ParticipantPayload {
  displayName: string;
  biography: string;
  quote: string;
  dateMet: string;
  eventName: string;
  location: string;
  consentConfirmed: boolean;
  isPublished: boolean;
  confirmNew: boolean;
  removePortrait: boolean;
  removeVideo: boolean;
  portraitAsset: UploadAsset | null;
  videoAsset: UploadAsset | null;
}
