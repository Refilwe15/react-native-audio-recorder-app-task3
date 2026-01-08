import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

interface RecordingItem {
  id: string;
  name: string;
  uri: string;
  duration: number;
  createdAt: string;
}

export default function SavedRecordingsScreen() {
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    loadRecordings();
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, []);

  const loadRecordings = async () => {
    const data = await AsyncStorage.getItem('recordings');
    if (data) setRecordings(JSON.parse(data));
  };

  const playRecording = async (item: RecordingItem) => {
    try {
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

  const deleteRecording = async (id: string) => {
    Alert.alert('Delete Recording', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = recordings.filter(r => r.id !== id);
          setRecordings(updated);
          await AsyncStorage.setItem('recordings', JSON.stringify(updated));
        },
      },
    ]);
  };

  const formatTime = (seconds: number) =>
    new Date(seconds * 1000).toISOString().substring(14, 19);

  const renderItem = ({ item }: { item: RecordingItem }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.subtitle}>
          {formatTime(item.duration)} • {new Date(item.createdAt).toDateString()}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.playButton}
        onPress={() => playRecording(item)}
      >
        <Text style={styles.playText}>
          {playingId === item.id ? '⏸' : '▶'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => deleteRecording(item.id)}>
        <Text style={styles.delete}>🗑</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Saved Recordings</Text>

      <FlatList
        data={recordings}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={styles.empty}>No recordings yet</Text>
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
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#a58132ff',
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f6f1',
    padding: 14,
    borderRadius: 14,
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
  playButton: {
    marginHorizontal: 14,
  },
  playText: {
    fontSize: 22,
    color: '#a58132ff',
  },
  delete: {
    fontSize: 18,
    color: '#cc4444',
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 80,
  },
});
