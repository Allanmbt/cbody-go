import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MediaPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onPick: (assets: ImagePicker.ImagePickerAsset[]) => void;
}

export function MediaPickerSheet({ visible, onClose, onPick }: MediaPickerSheetProps) {
  const insets = useSafeAreaInsets();

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 1,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets.length > 0) {
      onPick(result.assets);
      onClose();
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      quality: 1,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets.length > 0) {
      onPick(result.assets);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.backdrop}>
            <TouchableWithoutFeedback>
              <Animated.View
                entering={SlideInDown}
                exiting={SlideOutDown}
                style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
              >
              <View style={styles.header}>
                <View style={styles.handle} />
                <Text style={styles.title}>Add Media</Text>
              </View>

              <TouchableOpacity
                style={styles.option}
                activeOpacity={0.7}
                onPress={pickFromLibrary}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="images-outline" size={24} color="#39b59a" />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Photo Library</Text>
                  <Text style={styles.optionDesc}>Choose from your albums</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.option} activeOpacity={0.7} onPress={takePhoto}>
                <View style={styles.optionIcon}>
                  <Ionicons name="camera-outline" size={24} color="#39b59a" />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Take Photo/Video</Text>
                  <Text style={styles.optionDesc}>Use your camera</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.7} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginLeft: 60,
  },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
});
