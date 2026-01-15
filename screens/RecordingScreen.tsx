import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  StatusBar,
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

const PRIMARY_GOLD = '#a58132';
const TEXT_DARK = '#2D2D2D';
const BG_LIGHT = '#FDFCFB';

export default function SavedRecordingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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

  const loadRecordings = async () => {
    const data = await AsyncStorage.getItem('recordings');
    const parsed: RecordingItem[] = data ? JSON.parse(data) : [];
    // Sort by newest first
    const sorted = parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setRecordings(sorted);
    setFiltered(sorted);
  };

  const onSearch = (text: string) => {
    setSearch(text);
    setFiltered(
      recordings.filter(r => r.name.toLowerCase().includes(text.toLowerCase()))
    );
  };

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
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: item.uri });
      setSound(newSound);
      setPlayingId(item.id);
      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate(status => {
        if ('didJustFinish' in status && status.didJustFinish) setPlayingId(null);
      });
    } catch (e) { console.log(e); }
  };

  const seek = async (seconds: number) => {
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;
    let newPos = status.positionMillis + seconds * 1000;
    await sound.setPositionAsync(Math.max(0, newPos));
  };

  const deleteRecording = (id: string) => {
    Alert.alert('Delete Recording', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = recordings.filter(r => r.id !== id);
          setRecordings(updated);
          setFiltered(updated);
          await AsyncStorage.setItem('recordings', JSON.stringify(updated));
        },
      },
    ]);
  };

  const formatTime = (seconds: number) =>
    new Date(seconds * 1000).toISOString().substring(14, 19);

  const renderItem = ({ item }: { item: RecordingItem }) => {
    const isPlaying = playingId === item.id;
    return (
      <View style={[styles.card, isPlaying && styles.activeCard]}>
        <View style={styles.cardContent}>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.subtitle}>
              {formatTime(item.duration)} • {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.actionRow}>
            {isPlaying && (
              <View style={styles.seekControls}>
                <TouchableOpacity onPress={() => seek(-10)} style={styles.seekBtn}>
                  <Ionicons name="play-back" size={20} color={PRIMARY_GOLD} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => seek(10)} style={styles.seekBtn}>
                  <Ionicons name="play-forward" size={20} color={PRIMARY_GOLD} />
                </TouchableOpacity>
              </View>
            )}
            
            <TouchableOpacity onPress={() => togglePlay(item)}>
              <Ionicons
                name={isPlaying ? 'pause-circle' : 'play-circle'}
                size={44}
                color={PRIMARY_GOLD}
              />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => deleteRecording(item.id)} 
              style={styles.deleteIcon}
            >
              <MaterialIcons name="delete-outline" size={24} color="#E57373" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.header}>Library</Text>
        <View style={{ width: 40 }} /> 
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          placeholder="Search your notes..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={onSearch}
          style={styles.search}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="mic-outline" size={50} color={PRIMARY_GOLD} />
            </View>
            <Text style={styles.emptyText}>Empty Library</Text>
            <Text style={styles.emptySubText}>Your saved voice notes will appear here.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_LIGHT,
    paddingTop: 60,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 3,
  },
  header: {
    fontSize: 24,
    fontWeight: '800',
    color: TEXT_DARK,
    letterSpacing: -0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F1F1',
    marginHorizontal: 20,
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 25,
  },
  searchIcon: {
    marginRight: 10,
  },
  search: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: TEXT_DARK,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  activeCard: {
    borderColor: PRIMARY_GOLD,
    backgroundColor: '#FFFBF2',
  },
  cardContent: {
    flexDirection: 'column',
  },
  textContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 12,
  },
  seekControls: {
    flexDirection: 'row',
    marginRight: 'auto',
    gap: 15,
  },
  seekBtn: {
    padding: 8,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
  },
  deleteIcon: {
    marginLeft: 15,
    padding: 8,
  },
  emptyContainer: {
    marginTop: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F9F6EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  emptySubText: {
    fontSize: 15,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});