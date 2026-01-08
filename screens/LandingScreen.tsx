import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

type RecordingState = 'idle' | 'recording' | 'stopped';

export default function LandingScreen() {
  const ticks = Array.from({ length: 60 });
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [menuVisible, setMenuVisible] = useState(false);
  const [recordingState, setRecordingState] =
    useState<RecordingState>('idle');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /* -------- START RECORDING -------- */
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await rec.startAsync();

      setRecording(rec);
      setRecordingState('recording');
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } catch (e) {
      console.log('Recording error', e);
    }
  };

  /* -------- STOP RECORDING -------- */
  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      setRecordedUri(uri ?? null);
      setRecording(null);
      setRecordingState('stopped');

      if (timerRef.current) clearInterval(timerRef.current);
    } catch (e) {
      console.log('Stop error', e);
    }
  };

  /* -------- SAVE RECORDING -------- */
  const saveRecording = async () => {
    if (!recordedUri) return;

    const fileName = `Recording ${new Date().toLocaleString()}`;

    const existing = await AsyncStorage.getItem('recordings');
    const recordings = existing ? JSON.parse(existing) : [];

    recordings.push({
      id: Date.now().toString(),
      name: fileName,
      uri: recordedUri,
      duration: seconds,
      createdAt: new Date().toISOString(),
    });

    await AsyncStorage.setItem(
      'recordings',
      JSON.stringify(recordings)
    );

    setRecordingState('idle');
    setRecordedUri(null);
    setSeconds(0);
  };

  /* -------- BUTTON HANDLER -------- */
  const onRecordPress = () => {
    if (recordingState === 'idle') startRecording();
    else if (recordingState === 'recording') stopRecording();
    else saveRecording();
  };

  const formatTime = (value: number) =>
    new Date(value * 1000).toISOString().substring(11, 19);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Text style={styles.menu}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Recorder</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* CONTENT */}
      <View style={styles.imageContainer}>
        <View style={styles.tickContainer}>
          {ticks.map((_, i) => (
            <View
              key={i}
              style={[
                styles.tick,
                {
                  transform: [
                    { rotate: `${i * 6}deg` },
                    { translateY: -110 },
                  ],
                },
              ]}
            />
          ))}

          <View style={styles.outerCircle}>
            <Image
              source={require('../assets/landing.png')}
              style={styles.micImage}
              resizeMode="contain"
            />
          </View>
        </View>

        <Text style={styles.infoText}>{formatTime(seconds)}</Text>

        <View style={styles.waveformContainer}>
          {Array.from({ length: 40 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.waveBar,
                {
                  height: Math.random() * 25 + 10,
                  backgroundColor:
                    i < 26 ? '#a58132ff' : '#e6dcc7',
                },
              ]}
            />
          ))}
          <View style={styles.playhead} />
        </View>

        <TouchableOpacity
          style={styles.recordButton}
          onPress={onRecordPress}
        >
          <Text style={styles.recordButtonText}>
            {recordingState === 'idle' && 'Start Recording'}
            {recordingState === 'recording' && 'Stop Recording'}
            {recordingState === 'stopped' && 'Save Recording'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* MENU */}
      <Modal transparent visible={menuVisible} animationType="slide">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuSheet}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('RecordingScreen');
              }}
            >
              <Text style={styles.menuItemText}>
                Saved Recordings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.cancelItem]}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  menu: {
    fontSize: 24,
    color: '#a58132ff',
  },
  headerTitle: {
    fontSize: 18,
    color: '#a58132ff',
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 40,
  },
  tickContainer: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    position: 'absolute',
    width: 2,
    height: 10,
    backgroundColor: '#a58132ff',
    opacity: 0.7,
  },
  outerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: 'rgba(199,188,165,1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micImage: {
    width: 70,
    height: 70,
  },
  infoText: {
    marginTop: 20,
    fontSize: 20,
    color: '#a58132ff',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '85%',
    height: 50,
    marginTop: 40,
    position: 'relative',
    marginLeft: 50,
  },
  waveBar: {
    width: 3,
    marginHorizontal: 2,
    borderRadius: 2,
  },
  playhead: {
    position: 'absolute',
    left: '50%',
    width: 2,
    height: '100%',
    backgroundColor: '#a58132ff',
  },
  recordButton: {
    marginTop: 60,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#a58132ff',
  },
  recordButtonText: {
    color: '#a58132ff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  menuItem: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  cancelItem: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelText: {
    fontSize: 16,
    color: '#a58132ff',
    textAlign: 'center',
    fontWeight: '600',
  },
});
