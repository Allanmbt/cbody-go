import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Dimensions, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { GirlMedia } from '../api/types';
import { useMediaUrls } from '../api/useMediaUrls';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SPACING = 8;
const NUM_COLUMNS = 3;
const ITEM_SIZE = (SCREEN_WIDTH - SPACING * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

interface MediaGridProps {
  data: GirlMedia[];
  onPress: (item: GirlMedia, index: number) => void;
  onLongPress: (item: GirlMedia) => void;
  onMoveUp: (item: GirlMedia, index: number) => void;
  onMoveDown: (item: GirlMedia, index: number) => void;
}

export function MediaGrid({ data, onPress, onLongPress, onMoveUp, onMoveDown }: MediaGridProps) {
  const mediaWithUrls = useMediaUrls(data);

  const renderItem = ({ item, index }: { item: GirlMedia; index: number }) => {
    const mediaItem = mediaWithUrls.find((m) => m.id === item.id);
    const isVideo = item.kind === 'video' || item.kind === 'live_photo';
    const isPending = item.status === 'pending';
    const isRejected = item.status === 'rejected';
    const isApproved = item.status === 'approved';
    const canMoveUp = index > 0;
    const canMoveDown = index < data.length - 1;

    return (
      <Animated.View entering={FadeIn} style={styles.itemWrapper}>
        <TouchableOpacity
          style={styles.item}
          activeOpacity={0.7}
          onPress={() => onPress(item, index)}
          onLongPress={() => onLongPress(item)}
        >
          {/* Thumbnail */}
          {mediaItem?.thumbUrl || mediaItem?.url ? (
            <Image
              source={{ uri: mediaItem.thumbUrl || mediaItem.url }}
              style={styles.thumbnail}
              contentFit="cover"
              transition={200}
              placeholder={require('@/assets/images/partial-react-logo.png')}
            />
          ) : (
            <View style={styles.thumbnail}>
              <View style={styles.placeholderThumb}>
                <Ionicons
                  name={isVideo ? 'videocam' : 'image'}
                  size={32}
                  color="#9ca3af"
                />
              </View>
            </View>
          )}

          {/* Video indicator */}
          {isVideo && (
            <View style={styles.videoIndicator}>
              <Ionicons name="play-circle" size={24} color="#ffffff" />
            </View>
          )}

          {/* Status badge */}
          <View
            style={[
              styles.statusBadge,
              isPending && styles.statusPending,
              isRejected && styles.statusRejected,
              isApproved && styles.statusApproved,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                isPending && styles.dotPending,
                isRejected && styles.dotRejected,
                isApproved && styles.dotApproved,
              ]}
            />
          </View>

          {/* Sort arrows (only for approved) */}
          {isApproved && (
            <View style={styles.sortControls}>
              <TouchableOpacity
                style={[styles.sortBtn, !canMoveUp && styles.sortBtnDisabled]}
                onPress={() => canMoveUp && onMoveUp(item, index)}
                disabled={!canMoveUp}
              >
                <Ionicons
                  name="chevron-up"
                  size={16}
                  color={canMoveUp ? '#ffffff' : '#6b7280'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortBtn, !canMoveDown && styles.sortBtnDisabled]}
                onPress={() => canMoveDown && onMoveDown(item, index)}
                disabled={!canMoveDown}
              >
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={canMoveDown ? '#ffffff' : '#6b7280'}
                />
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={NUM_COLUMNS}
      contentContainerStyle={styles.grid}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    padding: SPACING,
  },
  itemWrapper: {
    width: ITEM_SIZE + SPACING,
    height: ITEM_SIZE + SPACING,
    padding: SPACING / 2,
  },
  item: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumb: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusPending: {
    backgroundColor: 'rgba(251, 191, 36, 0.9)',
  },
  statusRejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  statusApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotPending: {
    backgroundColor: '#fbbf24',
  },
  dotRejected: {
    backgroundColor: '#ef4444',
  },
  dotApproved: {
    backgroundColor: '#10b981',
  },
  sortControls: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'column',
    gap: 2,
  },
  sortBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortBtnDisabled: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});