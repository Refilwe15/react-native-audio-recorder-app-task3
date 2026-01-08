import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface RecordingItem {
  id: string;
  name: string;
  uri: string;
  duration: number;
  createdAt: string;
}

export default function SavedRecordingsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [filtered, setFiltered] = useState<RecordingItem[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadRecordings();
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, []);

  /* -------- LOAD RECORDINGS -------- */
  const loadRecordings = async () => {
    const data = await AsyncStorage.getItem('recordings');
    const parsed: RecordingItem[] = data ? JSON.parse(data) : [];
    setRecordings(parsed);
    setFiltered(parsed);
  };

  /* -------- SEARCH -------- */
  const onSearch = (text: string) => {
    setSearch(text);
    setFiltered(
      recordings.filter(r =>
        r.name.toLowerCase().includes(text.toLowerCase())
      )
    );
  };

  /* -------- PLAY / PAUSE -------- */
  const togglePlay = async (item: RecordingItem) => {
    try {
      if (playingId === item.id && sound) {
        await sound.pauseAsync();
        setPlayingId(null);
        return;
      }

      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync({
        uri: item.uri,
      });

      setSound(newSound);
      setPlayingId(item.id);
      await newSound.playAsync();

      newSound.setOnPlaybackStatusUpdate(status => {
        if ('didJustFinish' in status && status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (e) {
      console.log('Playback error', e);
    }
  };

  /* -------- SEEK -------- */
  const seek = async (seconds: number) => {
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;

    let newPos = status.positionMillis + seconds * 1000;
    newPos = Math.max(0, newPos);
    await sound.setPositionAsync(newPos);
  };

  /* -------- DELETE -------- */
  const deleteRecording = async (id: string) => {
    Alert.alert('Delete Recording', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = recordings.filter(r => r.id !== id);
          setRecordings(updated);
          setFiltered(updated);
          await AsyncStorage.setItem(
            'recordings',
            JSON.stringify(updated)
          );
        },
      },
    ]);
  };

  const formatTime = (seconds: number) =>
    new Date(seconds * 1000).toISOString().substring(14, 19);

  /* -------- ITEM UI -------- */
  const renderItem = ({ item }: { item: RecordingItem }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.subtitle}>
          {formatTime(item.duration)} •{' '}
          {new Date(item.createdAt).toDateString()}
        </Text>

        {playingId === item.id && (
          <View style={styles.controls}>
            <TouchableOpacity onPress={() => seek(-10)}>
              <Ionicons
                name="play-back"
                size={22}
                color="#a58132ff"
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => seek(10)}>
              <Ionicons
                name="play-forward"
                size={22}
                color="#a58132ff"
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity onPress={() => togglePlay(item)}>
        <Ionicons
          name={
            playingId === item.id
              ? 'pause-circle'
              : 'play-circle'
          }
          size={36}
          color="#a58132ff"
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => deleteRecording(item.id)}
        style={{ marginLeft: 10 }}
      >
        <MaterialIcons
          name="delete"
          size={24}
          color="#cc4444"
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color="#a58132ff"
          />
        </TouchableOpacity>

        <Text style={styles.header}>Saved Recordings</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* SEARCH */}
      <TextInput
        placeholder="Search recordings..."
        value={search}
        onChangeText={onSearch}
        style={styles.search}
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="mic-outline"
              size={80}
              color="#d6c9a8"
            />
            <Text style={styles.emptyText}>
              No recordings yet
            </Text>
            <Text style={styles.emptySubText}>
              Start recording from the home screen
            </Text>
          </View>
        }
      />
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#a58132ff',
  },
  search: {
    marginTop: 20,
    marginBottom: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f6f1',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 10,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#a58132ff',
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#777',
    marginTop: 6,
    textAlign: 'center',
  },
});
