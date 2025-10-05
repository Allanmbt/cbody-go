import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import type { GirlMedia, MediaWithUrls } from './types';

/**
 * Get signed download URL for a storage key
 */
async function getSignedUrl(bucket: string, path: string): Promise<string | null> {
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600); // 1 hour expiry

  if (error || !data) {
    console.error(`[getSignedUrl] Error for ${bucket}/${path}:`, error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Get bucket name based on media status
 */
function getBucketName(status: GirlMedia['status']): string {
  return status === 'approved' ? 'girls-media' : 'tmp-uploads';
}

/**
 * Hook to get signed URLs for a single media item
 */
export function useMediaUrl(media: GirlMedia | null): MediaWithUrls | null {
  const { data } = useQuery({
    queryKey: ['media-url', media?.id, media?.storage_key],
    queryFn: async () => {
      if (!media) return null;

      const bucket = getBucketName(media.status);
      const url = await getSignedUrl(bucket, media.storage_key);
      const thumbUrl = media.thumb_key
        ? await getSignedUrl(bucket, media.thumb_key)
        : undefined;

      return {
        ...media,
        url: url || '',
        thumbUrl,
      } as MediaWithUrls;
    },
    enabled: !!media,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  return data || null;
}

/**
 * Hook to get signed URLs for multiple media items
 */
export function useMediaUrls(mediaList: GirlMedia[]): MediaWithUrls[] {
  const { data } = useQuery({
    queryKey: ['media-urls', mediaList.map((m) => m.id).join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        mediaList.map(async (media) => {
          const bucket = getBucketName(media.status);
          const url = await getSignedUrl(bucket, media.storage_key);
          const thumbUrl = media.thumb_key
            ? await getSignedUrl(bucket, media.thumb_key)
            : undefined;

          return {
            ...media,
            url: url || '',
            thumbUrl,
          } as MediaWithUrls;
        })
      );

      return results;
    },
    enabled: mediaList.length > 0,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  return data || [];
}
