import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGirlProfile } from '../../auth/hooks';
import { MAX_MEDIA_PER_GIRL } from '../api/constants';
import { useMediaQuota, useMyMedia, useRemovePendingMedia, useReorderMedia, useUploadMedia } from '../api/queries';
import type { GirlMedia } from '../api/types';
import { MediaGrid } from '../components/MediaGrid';
import { MediaPickerSheet } from '../components/MediaPickerSheet';
import { MediaPreview } from '../components/MediaPreview';
import { UploadProgressItem } from '../components/UploadProgressItem';

interface UploadingTask {
  id: string;
  asset: ImagePicker.ImagePickerAsset;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function MediaManager() {
  const insets = useSafeAreaInsets();
  const { data: girl, isLoading: girlLoading } = useGirlProfile();
  const girlId = girl?.id || '';

  const { data: media = [], isLoading: mediaLoading } = useMyMedia(girlId);
  const { data: quota, isLoading: quotaLoading } = useMediaQuota(girlId);
  const uploadMutation = useUploadMedia(girlId);
  const removeMutation = useRemovePendingMedia(girlId);
  const reorderMutation = useReorderMedia(girlId);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [uploadingTasks, setUploadingTasks] = useState<UploadingTask[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Filter media by tab
  const filteredMedia = useMemo(() => {
    if (activeTab === 'all') return media;
    return media.filter((m) => m.status === activeTab);
  }, [media, activeTab]);

  // Check if quota exceeded
  const isQuotaExceeded = quota && quota.count >= quota.max;

  // Handle media picked
  const handleMediaPicked = useCallback(
    async (assets: ImagePicker.ImagePickerAsset[]) => {
      if (isQuotaExceeded) {
        Alert.alert('Quota Exceeded', `You can only have up to ${MAX_MEDIA_PER_GIRL} media items.`);
        return;
      }

      // Create uploading tasks
      const newTasks: UploadingTask[] = assets.map((asset, idx) => ({
        id: `upload-${Date.now()}-${idx}`,
        asset,
        progress: 0,
        status: 'pending' as const,
      }));

      setUploadingTasks((prev) => [...prev, ...newTasks]);

      // Upload sequentially
      for (const task of newTasks) {
        setUploadingTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: 'uploading' as const } : t))
        );

        try {
          await uploadMutation.mutateAsync({
            asset: task.asset,
            onProgress: (progress) => {
              setUploadingTasks((prev) =>
                prev.map((t) => (t.id === task.id ? { ...t, progress } : t))
              );
            },
          });

          setUploadingTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, status: 'success' as const, progress: 100 } : t))
          );

          // Remove task after 2s
          setTimeout(() => {
            setUploadingTasks((prev) => prev.filter((t) => t.id !== task.id));
          }, 2000);
        } catch (error) {
          setUploadingTasks((prev) =>
            prev.map((t) =>
              t.id === task.id
                ? {
                    ...t,
                    status: 'error' as const,
                    error: error instanceof Error ? error.message : 'Upload failed',
                  }
                : t
            )
          );
        }
      }
    },
    [isQuotaExceeded, uploadMutation]
  );

  // Handle long press (delete)
  const handleLongPress = useCallback(
    (item: GirlMedia) => {
      if (item.status !== 'pending' && item.status !== 'rejected') return;

      Alert.alert(
        'Delete Media',
        item.status === 'rejected' && item.reject_reason
          ? `Rejected: ${item.reject_reason}\n\nDelete this media?`
          : 'Delete this media?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await removeMutation.mutateAsync({ media_id: item.id });
              } catch (error) {
                Alert.alert('Error', 'Failed to delete media');
              }
            },
          },
        ]
      );
    },
    [removeMutation]
  );

  // Handle move up
  const handleMoveUp = useCallback(
    (item: GirlMedia, index: number) => {
      if (index <= 0) return;
      const newData = [...filteredMedia];
      [newData[index - 1], newData[index]] = [newData[index], newData[index - 1]];
      const items = newData.map((m, idx) => ({ id: m.id, sort_order: idx }));
      reorderMutation.mutate({ girl_id: girlId, items });
    },
    [girlId, filteredMedia, reorderMutation]
  );

  // Handle move down
  const handleMoveDown = useCallback(
    (item: GirlMedia, index: number) => {
      if (index >= filteredMedia.length - 1) return;
      const newData = [...filteredMedia];
      [newData[index], newData[index + 1]] = [newData[index + 1], newData[index]];
      const items = newData.map((m, idx) => ({ id: m.id, sort_order: idx }));
      reorderMutation.mutate({ girl_id: girlId, items });
    },
    [girlId, filteredMedia, reorderMutation]
  );

  // Handle press (preview)
  const handlePress = useCallback(
    (item: GirlMedia, index: number) => {
      setPreviewIndex(index);
      setPreviewVisible(true);
    },
    []
  );

  // Show loading while checking girl profile
  if (girlLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#39b59a" />
        <Text style={[styles.emptyText, { marginTop: 16 }]}>Loading...</Text>
      </View>
    );
  }

  // Show error only after loading is complete and no girl found
  if (!girl || !girlId) {
    return (
      <View style={styles.centerContainer}>
        <View style={{ alignItems: 'center', paddingHorizontal: 32 }}>
          <Ionicons name="warning-outline" size={64} color="#ef4444" />
          <Text style={styles.emptyTitle}>No Girl Profile</Text>
          <Text style={styles.emptyText}>
            You must have a girl profile to manage media
          </Text>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#39b59a', borderRadius: 8 }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isLoading = mediaLoading || quotaLoading;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#39b59a', '#46c5a7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Gallery</Text>
          <Text style={styles.headerSubtitle}>
            {quota ? `${quota.count} / ${quota.max}` : '— / —'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setPickerVisible(true)}
          style={styles.addBtn}
          disabled={isQuotaExceeded}
        >
          <Ionicons name="add" size={28} color={isQuotaExceeded ? '#9ca3af' : '#ffffff'} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Tab filters */}
      <View style={styles.tabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Uploading tasks */}
      {uploadingTasks.length > 0 && (
        <View style={styles.uploadSection}>
          <Text style={styles.uploadTitle}>Uploading...</Text>
          {uploadingTasks.map((task) => (
            <UploadProgressItem
              key={task.id}
              localUri={task.asset.uri}
              progress={task.progress}
              status={task.status}
              error={task.error}
            />
          ))}
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#39b59a" />
        </View>
      ) : filteredMedia.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={80} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Media Yet</Text>
          <Text style={styles.emptyText}>
            {activeTab === 'all'
              ? 'Tap + to add photos or videos'
              : `No ${activeTab} media`}
          </Text>
        </View>
      ) : (
        <MediaGrid
          data={filteredMedia}
          onPress={handlePress}
          onLongPress={handleLongPress}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
        />
      )}

      {/* Picker sheet */}
      <MediaPickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onPick={handleMediaPicked}
      />

      {/* Preview modal */}
      <MediaPreview
        visible={previewVisible}
        media={filteredMedia}
        initialIndex={previewIndex}
        onClose={() => setPreviewVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#39b59a',
  },
  tabActive: {
    backgroundColor: '#39b59a',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#39b59a',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  uploadSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
});
