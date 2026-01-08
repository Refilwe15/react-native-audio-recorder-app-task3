import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  Alert,
  Animated,
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

  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [fileName, setFileName] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /* -------- WAVES -------- */
  const wave1 = useRef(new Animated.Value(10)).current;
  const wave2 = useRef(new Animated.Value(20)).current;
  const wave3 = useRef(new Animated.Value(14)).current;
  const waveLoop = useRef<Animated.CompositeAnimation | null>(null);

  const startWaves = () => {
    waveLoop.current = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(wave1, { toValue: 40, duration: 300, useNativeDriver: false }),
          Animated.timing(wave1, { toValue: 10, duration: 300, useNativeDriver: false }),
        ]),
        Animated.sequence([
          Animated.timing(wave2, { toValue: 55, duration: 400, useNativeDriver: false }),
          Animated.timing(wave2, { toValue: 20, duration: 400, useNativeDriver: false }),
        ]),
        Animated.sequence([
          Animated.timing(wave3, { toValue: 35, duration: 350, useNativeDriver: false }),
          Animated.timing(wave3, { toValue: 14, duration: 350, useNativeDriver: false }),
        ]),
      ])
    );
    waveLoop.current.start();
  };

  const stopWaves = () => waveLoop.current?.stop();

  /* -------- RECORD -------- */
  const startRecording = async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) return;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await rec.startAsync();

    setRecording(rec);
    setRecordingState('recording');
    setSeconds(0);
    startWaves();

    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
  };

  const stopRecording = async () => {
    if (!recording) return;

    await recording.stopAndUnloadAsync();
    setRecordedUri(recording.getURI() ?? null);
    setRecording(null);
    setRecordingState('stopped');
    stopWaves();

    if (timerRef.current) clearInterval(timerRef.current);
  };

  const saveRecording = async () => {
    if (!recordedUri || !fileName.trim()) return;

    const existing = await AsyncStorage.getItem('recordings');
    const recordings = existing ? JSON.parse(existing) : [];

    recordings.push({
      id: Date.now().toString(),
      name: fileName,
      uri: recordedUri,
      duration: seconds,
      createdAt: new Date().toISOString(),
    });

    await AsyncStorage.setItem('recordings', JSON.stringify(recordings));

    setSaveModalVisible(false);
    setFileName('');
    setRecordingState('idle');
    setRecordedUri(null);
    setSeconds(0);

    Alert.alert('Saved', 'Recording saved successfully ✅');
  };

  const onRecordPress = () => {
    if (recordingState === 'idle') startRecording();
    else if (recordingState === 'recording') stopRecording();
    else setSaveModalVisible(true);
  };

  const formatTime = (s: number) =>
    new Date(s * 1000).toISOString().substring(11, 19);

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
                { transform: [{ rotate: `${i * 6}deg` }, { translateY: -110 }] },
              ]}
            />
          ))}

          <View style={styles.outerCircle}>
            <Image
              source={require('../assets/landing.png')}
              style={styles.micImage}
            />
          </View>
        </View>

        {recordingState === 'recording' && (
          <View style={styles.waves}>
            <Animated.View style={[styles.wave, { height: wave1 }]} />
            <Animated.View style={[styles.wave, { height: wave2 }]} />
            <Animated.View style={[styles.wave, { height: wave3 }]} />
          </View>
        )}

        <Text style={styles.infoText}>{formatTime(seconds)}</Text>

        {/* WAVEFORM */}
        <View style={styles.waveformContainer}>
          {Array.from({ length: 40 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.waveBar,
                {
                  height: Math.random() * 25 + 10,
                  backgroundColor: i < 26 ? '#a58132ff' : '#e6dcc7',
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.recordButton} onPress={onRecordPress}>
          <Text style={styles.recordButtonText}>
            {recordingState === 'idle' && 'Start Recording'}
            {recordingState === 'recording' && 'Stop Recording'}
            {recordingState === 'stopped' && 'Save Recording'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* SAVE MODAL */}
      <Modal transparent visible={saveModalVisible} animationType="fade">
        <View style={styles.saveOverlay}>
          <View style={styles.saveBox}>
            <Text style={styles.saveTitle}>Save Recording As</Text>

            <TextInput
              placeholder="Enter file name"
              value={fileName}
              onChangeText={setFileName}
              style={styles.input}
            />

            <View style={styles.saveActions}>
              <TouchableOpacity onPress={() => setSaveModalVisible(false)}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={saveRecording}>
                <Text style={styles.save}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MENU */}
      <Modal transparent visible={menuVisible} animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuSheet}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('RecordingScreen');
              }}
            >
              <Text style={styles.menuItemText}>Saved Recordings</Text>
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
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  menu: { fontSize: 24, color: '#a58132ff' },
  headerTitle: { fontSize: 18, color: '#a58132ff', fontWeight: '600' },

  imageContainer: { flex: 1, alignItems: 'center', marginTop: 40 },
  tickContainer: { width: 260, height: 260, alignItems: 'center', justifyContent: 'center' },
  tick: { position: 'absolute', width: 2, height: 10, backgroundColor: '#a58132ff', opacity: 0.7 },

  outerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: 'rgba(199,188,165,1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micImage: { width: 70, height: 70 },

  waves: { flexDirection: 'row', marginTop: 16, gap: 10 },
  wave: { width: 6, borderRadius: 4, backgroundColor: '#a58132ff' },

  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    marginTop: 10,
    gap: 2,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },

  infoText: { marginTop: 20, fontSize: 20, color: '#a58132ff' },

  recordButton: {
    marginTop: 50,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#a58132ff',
  },
  recordButtonText: { color: '#a58132ff', fontSize: 16, fontWeight: '600' },

  saveOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBox: { width: '85%', backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  saveTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 },

  saveActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 20 },
  cancel: { color: '#777', fontSize: 16 },
  save: { color: '#a58132ff', fontSize: 16, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  menuSheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  menuItem: { paddingVertical: 18, paddingHorizontal: 20 },
  menuItemText: { fontSize: 16 },
  cancelItem: { borderTopWidth: 1, borderTopColor: '#eee' },
  cancelText: { fontSize: 16, color: '#a58132ff', textAlign: 'center', fontWeight: '600' },
});
