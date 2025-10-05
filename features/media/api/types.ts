// Enum types matching DB
export type MediaKind = 'image' | 'video' | 'live_photo';
export type MediaStatus = 'pending' | 'approved' | 'rejected';

// Media metadata structure (stored in JSONB meta field)
export interface MediaMeta {
  mime?: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number; // for video/live_photo
  live?: {
    image_key: string;
    video_key: string;
  };
}

// girls_media table row
export interface GirlMedia {
  id: string;
  girl_id: string;
  kind: MediaKind;
  storage_key: string;
  thumb_key: string | null;
  meta: MediaMeta;
  min_user_level: number;
  status: MediaStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reject_reason: string | null;
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// API request/response types
export interface GetUploadUrlRequest {
  girl_id: string;
  kind: MediaKind;
  ext: string;
  hasThumb: boolean;
  meta?: Partial<MediaMeta>;
}

export interface GetUploadUrlResponse {
  putUrlMain: string;
  putUrlThumb?: string;
  tmpKeyMain: string;
  tmpKeyThumb?: string;
  recordDraft: GirlMedia;
}

export interface RemoveTmpRequest {
  media_id: string;
}

export interface RemoveTmpResponse {
  ok: boolean;
}

export interface ReorderRequest {
  girl_id: string;
  items: Array<{ id: string; sort_order: number }>;
}

export interface ReorderResponse {
  ok: boolean;
}

// Media with signed URLs (for display)
export interface MediaWithUrls extends GirlMedia {
  url: string;
  thumbUrl?: string;
}

// Upload progress tracking
export interface UploadTask {
  id: string;
  localUri: string;
  kind: MediaKind;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}
