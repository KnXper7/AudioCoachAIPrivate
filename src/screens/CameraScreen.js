import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../components/Icon';
import Btn from '../components/Btn';
import Placeholder from '../components/Placeholder';
import { useTheme } from '../theme/ThemeContext';
import { MODE_META } from '../services/aiService';

export default function CameraScreen({ mode, onClose, onCapture }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const m = MODE_META[mode];
  const circle = m.guide === 'circle';

  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState(circle ? 'front' : 'back');
  const [flash, setFlash] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [permission]);

  const shoot = async () => {
    setFlash(true);
    let uri = null;
    try {
      if (cameraRef.current && ready) {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, skipProcessing: true });
        uri = photo?.uri || null;
      }
    } catch (e) {
      // fall through with null uri — analyze still works on the mock
    }
    setTimeout(() => onCapture(uri), 240);
  };

  const pickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.length) onCapture(res.assets[0].uri);
  };

  const canUseCamera = permission?.granted;

  return (
    <View style={{ flex: 1, backgroundColor: '#08090d' }}>
      {/* viewfinder */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {canUseCamera ? (
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing={facing}
            onCameraReady={() => setReady(true)}
          />
        ) : (
          <Placeholder label="camera viewfinder" />
        )}
      </View>

      {/* guide overlay (dims everything outside the cutout) */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
        <View
          style={{
            width: circle ? 250 : 270,
            height: circle ? 330 : 380,
            borderRadius: circle ? 130 : 28,
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: t.accentB + 'bf',
            shadowColor: '#06070b',
            shadowOpacity: 0.55,
            shadowRadius: 2000,
            // big spread shadow approximates the design's 2000px scrim
            elevation: 0,
          }}
        />
      </View>

      {/* top bar */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + 12,
          left: 20,
          right: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 5,
        }}
      >
        <Pressable
          onPress={onClose}
          style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="close" size={20} stroke="#fff" />
        </Pressable>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 9,
            paddingHorizontal: 16,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.12)',
          }}
        >
          <Icon name={mode} size={17} stroke="#fff" />
          <Text style={{ fontFamily: t.fonts.sans, fontSize: 14, fontWeight: '600', color: '#fff' }}>{m.title}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* hint */}
      <View style={{ position: 'absolute', top: insets.top + 72, left: 0, right: 0, alignItems: 'center', zIndex: 5 }}>
        <Text style={{ fontFamily: t.fonts.mono, fontSize: 12, letterSpacing: 1, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
          {m.frameLabel}
        </Text>
      </View>

      {/* permission prompt */}
      {permission && !permission.granted && (
        <View style={{ position: 'absolute', top: '42%', left: 30, right: 30, alignItems: 'center', zIndex: 6 }}>
          <Text style={{ fontFamily: t.fonts.sans, fontSize: 14, color: '#fff', textAlign: 'center', marginBottom: 14 }}>
            Camera access is off. You can still upload a photo from your gallery.
          </Text>
          <Btn size="sm" onPress={requestPermission}>Enable camera</Btn>
        </View>
      )}

      {/* controls */}
      <View
        style={{
          position: 'absolute',
          bottom: insets.bottom + 30,
          left: 0,
          right: 0,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 54,
          zIndex: 5,
        }}
      >
        <Pressable
          onPress={pickFromGallery}
          style={{ width: 50, height: 50, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="image" size={24} stroke="#fff" />
        </Pressable>

        <Pressable
          onPress={shoot}
          style={{ width: 80, height: 80, borderRadius: 999, borderWidth: 4, borderColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' }}
        >
          <LinearGradient colors={[t.accentA, t.accentB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 62, height: 62, borderRadius: 999 }} />
        </Pressable>

        <Pressable
          onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))}
          style={{ width: 50, height: 50, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="flip" size={22} stroke="#fff" />
        </Pressable>
      </View>

      {flash && <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff', zIndex: 10, opacity: 0.9 }} />}
    </View>
  );
}
