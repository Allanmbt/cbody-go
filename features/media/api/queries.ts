import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import {
    MAX_MEDIA_PER_GIRL,
    PHOTO_MAX_DIM,
    PHOTO_MAX_MB,
    PHOTO_QUALITY,
    VIDEO_MAX_DURATION_S,
    VIDEO_MAX_MB,
} from './constants';
import { getUploadUrl, removeTmp, reorderMedia, uploadToSignedUrl } from './ef';
import type { GirlMedia, MediaKind, MediaMeta, RemoveTmpRequest, ReorderRequest } from './types';

// Query keys
export const mediaKeys = {
  all: ['media'] as const,
  mine: (girlId: string) => [...mediaKeys.all, 'mine', girlId] as const,
  quota: (girlId: string) => [...mediaKeys.all, 'quota', girlId] as const,
};

/**
 * Fetch my media (all statuses)
 */
export function useMyMedia(girlId: string) {
  return useQuery({
    queryKey: mediaKeys.mine(girlId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('girls_media')
        .select('*')
        .eq('girl_id', girlId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as GirlMedia[];
    },
    staleTime: 1000 * 30, // 30s
    enabled: !!girlId,
  });
}

/**
 * Get media quota (used count)
 */
export function useMediaQuota(girlId: string) {
  return useQuery({
    queryKey: mediaKeys.quota(girlId),
    queryFn: async () => {
      const { count, error } = await supabase
        .from('girls_media')
        .select('*', { count: 'exact', head: true })
        .eq('girl_id', girlId)
        .in('status', ['pending', 'approved']);

      if (error) throw error;
      return {
        count: count || 0,
        max: MAX_MEDIA_PER_GIRL,
      };
    },
    staleTime: 1000 * 30,
    enabled: !!girlId,
  });
}

/**
 * Upload media mutation
 */
export function useUploadMedia(girlId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      asset,
      onProgress,
    }: {
      asset: ImagePicker.ImagePickerAsset;
      onProgress?: (progress: number) => void;
    }) => {
      const isVideo = asset.type === 'video';
      let kind: MediaKind = isVideo ? 'video' : 'image';
      let mainUri = asset.uri;
      let thumbUri: string | undefined;
      let meta: Partial<MediaMeta> = {};

      // Process based on type
      if (isVideo) {
        // Video: validate duration & size
        if (asset.duration && asset.duration > VIDEO_MAX_DURATION_S * 1000) {
          throw new Error(`Video must be under ${VIDEO_MAX_DURATION_S}s`);
        }

        // Estimate size (not exact, but good enough)
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const sizeMB = blob.size / (1024 * 1024);
        if (sizeMB > VIDEO_MAX_MB) {
          throw new Error(`Video must be under ${VIDEO_MAX_MB}MB`);
        }

        // Generate thumbnail
        try {
          const { uri: thumbGenUri } = await VideoThumbnails.getThumbnailAsync(asset.uri, {
            time: 0,
          });
          thumbUri = thumbGenUri;
        } catch (e) {
          console.warn('Failed to generate video thumbnail:', e);
        }

        meta = {
          mime: 'video/mp4',
          size: blob.size,
          width: asset.width,
          height: asset.height,
          duration: asset.duration ? Math.round(asset.duration / 1000) : undefined,
        };
      } else {
        // Image: compress & resize
        const manipResult = await ImageManipulator.manipulateAsync(
          asset.uri,
          [
            {
              resize: {
                width:
                  asset.width > PHOTO_MAX_DIM
                    ? PHOTO_MAX_DIM
                    : asset.height > PHOTO_MAX_DIM
                      ? undefined
                      : asset.width,
                height:
                  asset.height > PHOTO_MAX_DIM
                    ? PHOTO_MAX_DIM
                    : asset.width > PHOTO_MAX_DIM
                      ? undefined
                      : asset.height,
              },
            },
          ],
          { compress: PHOTO_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
        );

        mainUri = manipResult.uri;

        // Validate size
        const response = await fetch(mainUri);
        const blob = await response.blob();
        const sizeMB = blob.size / (1024 * 1024);
        if (sizeMB > PHOTO_MAX_MB) {
          throw new Error(`Image must be under ${PHOTO_MAX_MB}MB after compression`);
        }

        meta = {
          mime: 'image/jpeg',
          size: blob.size,
          width: manipResult.width,
          height: manipResult.height,
        };
      }

      // Get upload URLs
      const ext = isVideo ? 'mp4' : 'jpg';
      
      console.log('[useUploadMedia] Requesting upload URL:', {
        girl_id: girlId,
        kind,
        ext,
        hasThumb: !!thumbUri,
        meta,
      });

      const uploadData = await getUploadUrl({
        girl_id: girlId,
        kind,
        ext,
        hasThumb: !!thumbUri,
        meta,
      });

      console.log('[useUploadMedia] Upload URL received:', uploadData);

      // Upload main file
      await uploadToSignedUrl(uploadData.putUrlMain, mainUri, meta.mime || 'image/jpeg', (prog) => {
        onProgress?.(thumbUri ? prog * 0.8 : prog);
      });

      // Upload thumbnail if exists
      if (thumbUri && uploadData.putUrlThumb) {
        await uploadToSignedUrl(
          uploadData.putUrlThumb,
          thumbUri,
          'image/jpeg',
          (prog) => {
            onProgress?.(80 + prog * 0.2);
          }
        );
      }

      return uploadData.recordDraft;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.mine(girlId) });
      queryClient.invalidateQueries({ queryKey: mediaKeys.quota(girlId) });
    },
  });
}

/**
 * Remove pending media mutation
 */
export function useRemovePendingMedia(girlId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: RemoveTmpRequest) => {
      return await removeTmp(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.mine(girlId) });
      queryClient.invalidateQueries({ queryKey: mediaKeys.quota(girlId) });
    },
  });
}

/**
 * Reorder media mutation
 */
export function useReorderMedia(girlId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ReorderRequest) => {
      return await reorderMedia(request);
    },
    onMutate: async (request) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: mediaKeys.mine(girlId) });
      const previous = queryClient.getQueryData<GirlMedia[]>(mediaKeys.mine(girlId));

      if (previous) {
        const updated = [...previous];
        request.items.forEach((item) => {
          const idx = updated.findIndex((m) => m.id === item.id);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], sort_order: item.sort_order };
          }
        });
        updated.sort((a, b) => a.sort_order - b.sort_order);
        queryClient.setQueryData(mediaKeys.mine(girlId), updated);
      }

      return { previous };
    },
    onError: (_err, _request, context) => {
      if (context?.previous) {
        queryClient.setQueryData(mediaKeys.mine(girlId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.mine(girlId) });
    },
  });
}
