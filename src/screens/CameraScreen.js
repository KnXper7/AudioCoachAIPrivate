import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../components/Icon';
import Btn from '../components/Btn';
import { GlassCircle } from '../components/Glass';
import Placeholder from '../components/Placeholder';
import { useTheme } from '../theme/ThemeContext';
import { MODE_META } from '../services/aiService';

// Outfit shots are framed tall (3:4); face shots square-ish (1:1) for cropping.
const ASPECT = { face: [1, 1], outfit: [3, 4] };

export default function CameraScreen({ mode, onClose, onCapture }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const m = MODE_META[mode];
  const circle = m.guide === 'circle';

  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState(circle ? 'front' : 'back');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(0); // 3-2-1 hold-steady countdown

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [permission]);

  // Center-crop a captured photo to the mode's aspect ratio (gives outfit a clean
  // tall crop without an interactive editor on the live-camera path).
  const cropToAspect = async (uri) => {
    try {
      const [aw, ah] = ASPECT[mode];
      const info = await ImageManipulator.manipulateAsync(uri, [], {}); // get dimensions
      const { width, height } = info;
      const targetRatio = aw / ah;
      let cropW = width;
      let cropH = Math.round(width / targetRatio);
      if (cropH > height) {
        cropH = height;
        cropW = Math.round(height * targetRatio);
      }
      const originX = Math.round((width - cropW) / 2);
      const originY = Math.round((height - cropH) / 2);
      const out = await ImageManipulator.manipulateAsync(
        uri,
        [{ crop: { originX, originY, width: cropW, height: cropH } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );
      return out.uri;
    } catch (e) {
      return uri; // fall back to the raw capture if manipulation fails
    }
  };

  const capture = async () => {
    let uri = null;
    try {
      if (cameraRef.current && ready) {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: false });
        uri = photo?.uri || null;
        if (uri) uri = await cropToAspect(uri);
      }
    } catch (e) {
      // proceed with whatever we have
    }
    onCapture(uri);
  };

  // Tap → "hold steady" 3-2-1 countdown so you have time to line up in the guide.
  const shoot = () => {
    if (busy) return;
    setBusy(true);
    let n = 3;
    setCount(n);
    const tick = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(tick);
        setCount(0);
        capture();
        setBusy(false);
      } else {
        setCount(n);
      }
    }, 700);
  };

  // Gallery upload: interactive native crop (allowsEditing) with mode aspect.
  const pickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: ASPECT[mode],
      quality: 0.85,
    });
    if (!res.canceled && res.assets?.length) onCapture(res.assets[0].uri);
  };

  const canUseCamera = permission?.granted;

  return (
    <View style={{ flex: 1, backgroundColor: '#08090d' }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {canUseCamera ? (
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} onCameraReady={() => setReady(true)} />
        ) : (
          <Placeholder label="camera viewfinder" />
        )}
      </View>

      {/* guide overlay — turns solid + brighter during the countdown */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
        <View
          style={{
            width: circle ? 250 : 270,
            height: circle ? 330 : 380,
            borderRadius: circle ? 130 : 28,
            borderWidth: count > 0 ? 3 : 1.5,
            borderStyle: count > 0 ? 'solid' : 'dashed',
            borderColor: count > 0 ? t.accentB : t.accentB + 'bf',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {count > 0 && (
            <Text style={{ fontFamily: t.fonts.serif, fontSize: 96, lineHeight: 110, color: '#fff', includeFontPadding: false }}>{count}</Text>
          )}
        </View>
      </View>

      {/* top bar */}
      <View style={{ position: 'absolute', top: insets.top + 12, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 5 }}>
        <GlassCircle size={40} onPress={onClose} clear={false} fallbackStyle={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
          <Icon name="close" size={20} stroke="#fff" />
        </GlassCircle>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' }}>
          <Icon name={mode} size={17} stroke="#fff" />
          <Text style={{ fontFamily: t.fonts.sans, fontSize: 14, fontWeight: '600', color: '#fff' }}>{m.title}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* hint */}
      <View style={{ position: 'absolute', top: insets.top + 72, left: 0, right: 0, alignItems: 'center', zIndex: 5, paddingHorizontal: 30 }}>
        <Text style={{ fontFamily: t.fonts.mono, fontSize: 12, letterSpacing: 1, color: count > 0 ? t.accentB : 'rgba(255,255,255,0.8)', textTransform: 'uppercase', textAlign: 'center' }}>
          {count > 0 ? 'Hold steady…' : circle ? 'Line your face up in the oval, then tap' : m.frameLabel}
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
      <View style={{ position: 'absolute', bottom: insets.bottom + 30, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 54, zIndex: 5 }}>
        <Pressable onPress={pickFromGallery} style={{ width: 50, height: 50, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="image" size={24} stroke="#fff" />
        </Pressable>

        <Pressable onPress={shoot} style={{ width: 80, height: 80, borderRadius: 999, borderWidth: 4, borderColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.6 : 1 }}>
          <LinearGradient colors={[t.accentA, t.accentB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 62, height: 62, borderRadius: 999 }} />
        </Pressable>

        <GlassCircle size={50} onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))} clear={false} fallbackStyle={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.1)' }}>
          <Icon name="flip" size={22} stroke="#fff" />
        </GlassCircle>
      </View>
    </View>
  );
}
