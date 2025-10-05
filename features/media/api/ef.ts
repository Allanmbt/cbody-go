import { supabase } from '@/lib/supabase';
import { EF_ENDPOINTS } from './constants';
import type {
    GetUploadUrlRequest,
    GetUploadUrlResponse,
    RemoveTmpRequest,
    RemoveTmpResponse,
    ReorderRequest,
    ReorderResponse,
} from './types';

/**
 * Call Edge Function: get-upload-url
 * Returns signed PUT URLs and creates draft record
 */
export async function getUploadUrl(
  request: GetUploadUrlRequest
): Promise<GetUploadUrlResponse> {
  console.log('[getUploadUrl] Request:', JSON.stringify(request, null, 2));

  const { data, error } = await supabase.functions.invoke(EF_ENDPOINTS.GET_UPLOAD_URL, {
    body: request,
  });

  console.log('[getUploadUrl] Response:', { data, error });

  if (error) {
    console.error('[getUploadUrl] Error:', error);
    throw new Error(error.message || 'Failed to get upload URL');
  }

  if (!data) {
    console.error('[getUploadUrl] No data received');
    throw new Error('No data received from server');
  }

  if (data.error) {
    console.error('[getUploadUrl] Server error:', data.error);
    throw new Error(data.error);
  }

  if (!data.putUrlMain || !data.tmpKeyMain || !data.recordDraft) {
    console.error('[getUploadUrl] Invalid response structure:', data);
    throw new Error('Invalid response from get-upload-url');
  }

  return data as GetUploadUrlResponse;
}

/**
 * Call Edge Function: remove-tmp
 * Deletes pending media and temp storage
 */
export async function removeTmp(request: RemoveTmpRequest): Promise<RemoveTmpResponse> {
  const { data, error } = await supabase.functions.invoke(EF_ENDPOINTS.REMOVE_TMP, {
    body: request,
  });

  if (error) {
    throw new Error(error.message || 'Failed to remove media');
  }

  return data as RemoveTmpResponse;
}

/**
 * Call Edge Function: reorder
 * Batch update sort_order for media items
 */
export async function reorderMedia(request: ReorderRequest): Promise<ReorderResponse> {
  const { data, error } = await supabase.functions.invoke(EF_ENDPOINTS.REORDER, {
    body: request,
  });

  if (error) {
    throw new Error(error.message || 'Failed to reorder media');
  }

  return data as ReorderResponse;
}

/**
 * Upload file to signed URL (PUT)
 */
export async function uploadToSignedUrl(
  url: string,
  fileUri: string,
  mimeType: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  try {
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // Use XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', mimeType);
      xhr.send(blob);
    });
  } catch (error) {
    throw new Error(`Failed to upload: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}
