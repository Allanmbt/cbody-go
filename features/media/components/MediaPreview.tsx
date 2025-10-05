import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { Image } from 'expo-image';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { GirlMedia } from '../api/types';
import { useMediaUrls } from '../api/useMediaUrls';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MediaPreviewProps {
  visible: boolean;
  media: GirlMedia[];
  initialIndex: number;
  onClose: () => void;
}

export function MediaPreview({ visible, media, initialIndex, onClose }: MediaPreviewProps) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);
  const mediaWithUrls = useMediaUrls(media);

  React.useEffect(() => {
    if (visible && initialIndex >= 0 && initialIndex < media.length) {
      setCurrentIndex(initialIndex);
      // Delay to ensure modal is mounted
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      }, 100);
    }
  }, [visible, initialIndex, media.length]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  });

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  });

  const renderItem = ({ item, index }: { item: GirlMedia; index: number }) => {
    const isVideo = item.kind === 'video' || item.kind === 'live_photo';
    const mediaItem = mediaWithUrls.find((m) => m.id === item.id);
    const isCurrentSlide = index === currentIndex;

    return (
      <View style={styles.slide}>
        <View style={styles.mediaContainer}>
          {!mediaItem?.url ? (
            <View style={styles.placeholder}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.placeholderText}>Loading...</Text>
            </View>
          ) : isVideo ? (
            <Video
              source={{ uri: mediaItem.url }}
              style={styles.media}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay={isCurrentSlide}
              isLooping
            />
          ) : (
            <Image
              source={{ uri: mediaItem.url }}
              style={styles.media}
              contentFit="contain"
              transition={300}
            />
          )}
        </View>

        {/* Info overlay */}
        <View style={[styles.infoOverlay, { bottom: insets.bottom + 80 }]}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusChip,
                item.status === 'pending' && styles.chipPending,
                item.status === 'approved' && styles.chipApproved,
                item.status === 'rejected' && styles.chipRejected,
              ]}
            >
              <Text style={styles.statusChipText}>
                {item.status === 'pending' && 'Pending Review'}
                {item.status === 'approved' && 'Approved'}
                {item.status === 'rejected' && 'Rejected'}
              </Text>
            </View>
          </View>

          {item.status === 'rejected' && item.reject_reason && (
            <View style={styles.reasonBox}>
              <Ionicons name="alert-circle-outline" size={18} color="#ef4444" />
              <Text style={styles.reasonText}>{item.reject_reason}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color="#ffffff" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              {currentIndex + 1} / {media.length}
            </Text>

            <View style={styles.closeBtn} />
          </View>

          {/* Media carousel */}
          <FlatList
            ref={flatListRef}
            data={media}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged.current}
            viewabilityConfig={viewabilityConfig.current}
            getItemLayout={(data, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
          />
        </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9ca3af',
  },
  infoOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  chipPending: {
    backgroundColor: 'rgba(251, 191, 36, 0.95)',
  },
  chipApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
  },
  chipRejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
  },
  statusChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(254, 226, 226, 0.95)',
    padding: 12,
    borderRadius: 12,
  },
  reasonText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#991b1b',
    lineHeight: 20,
  },
});
