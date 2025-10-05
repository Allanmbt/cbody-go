// Media upload constraints
export const PHOTO_MAX_MB = 4;
export const PHOTO_MAX_DIM = 2160;
export const PHOTO_QUALITY = 0.82;

export const VIDEO_MAX_MB = 120;
export const VIDEO_MAX_DURATION_S = 60;

export const MAX_MEDIA_PER_GIRL = 30;

// Edge function endpoints
export const EF_ENDPOINTS = {
  GET_UPLOAD_URL: 'get-upload-url',
  REMOVE_TMP: 'remove-tmp',
  REORDER: 'reorder',
} as const;
