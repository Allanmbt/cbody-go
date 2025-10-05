import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface UploadProgressItemProps {
  localUri: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  onCancel?: () => void;
}

export function UploadProgressItem({
  localUri,
  progress,
  status,
  error,
  onCancel,
}: UploadProgressItemProps) {
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.container}>
      <Image source={{ uri: localUri }} style={styles.thumbnail} contentFit="cover" />

      <View style={styles.info}>
        <Text style={styles.statusText} numberOfLines={1}>
          {status === 'pending' && 'Pending...'}
          {status === 'uploading' && `Uploading ${Math.round(progress)}%`}
          {status === 'success' && 'Uploaded'}
          {status === 'error' && error}
        </Text>

        {status === 'uploading' && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        )}
      </View>

      {status === 'uploading' && onCancel && (
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <Ionicons name="close-circle" size={24} color="#ef4444" />
        </TouchableOpacity>
      )}

      {status === 'success' && (
        <Ionicons name="checkmark-circle" size={24} color="#10b981" style={styles.icon} />
      )}

      {status === 'error' && (
        <Ionicons name="alert-circle" size={24} color="#ef4444" style={styles.icon} />
      )}

      {status === 'pending' && <ActivityIndicator size="small" color="#39b59a" />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#39b59a',
    borderRadius: 2,
  },
  cancelBtn: {
    padding: 4,
  },
  icon: {
    marginLeft: 8,
  },
});
