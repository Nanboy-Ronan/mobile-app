import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  FlatList,
  TextInput,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';

import {
  getMemories,
  uploadText,
  uploadAudio,
  uploadImage,
  uploadVideo,
  renameMemory,
  deleteMemory,
} from '../api/client';
import {
  loadMemories as loadMemoriesLocal,
  saveMemories,
  addPendingChange,
  getPendingChanges,
  clearPendingChanges,
} from '../storage';

export default function HomeScreen({ openChat, openHousing }) {
  const [memories, setMemories] = useState([]);

  const fetchMemories = async () => {
    try {
      const data = await getMemories();
      // Ensure data is always an array
      const memoryData = Array.isArray(data) ? data : [];
      setMemories(memoryData);
      await saveMemories(memoryData);
    } catch (err) {
      console.warn(err.message);
      const local = await loadMemoriesLocal();
      setMemories(local);
    }
  };

  const syncPendingChanges = async () => {
    const pending = await getPendingChanges();
    if (!pending.length) return;
    for (const change of pending) {
      try {
        if (change.type === 'rename') {
          await renameMemory(change.id, change.newName);
        } else if (change.type === 'delete') {
          await deleteMemory(change.id);
        }
      } catch (err) {
        console.warn(err.message);
      }
    }
    await clearPendingChanges();
  };

  useEffect(() => {
    syncPendingChanges().then(fetchMemories);
  }, []);

  const pickAndUpload = async (kind) => {
    const typeMap = {
      text: DocumentPicker.types.plainText,
      audio: DocumentPicker.types.audio,
      image: DocumentPicker.types.images,
      video: DocumentPicker.types.video,
    };
    try {
      const res = await DocumentPicker.pickSingle({ type: typeMap[kind] });
      const file = {
        uri: res.uri,
        type: res.type || 'application/octet-stream',
        name: res.name || `upload.${kind}`,
      };
      if (kind === 'audio') {
        await uploadAudio(file, file.name);
      } else if (kind === 'image') {
        await uploadImage(file, file.name);
      } else if (kind === 'video') {
        await uploadVideo(file, file.name);
      } else {
        await uploadText(file, file.name);
      }
      await fetchMemories();
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.warn(err.message);
      }
    }
  };

  const handleRename = async (id, newName) => {
    try {
      await renameMemory(id, newName);
      await fetchMemories();
    } catch (err) {
      await addPendingChange({ type: 'rename', id, newName });
      setMemories((m) => m.map((mm) => (mm.id === id ? { ...mm, name: newName } : mm)));
      console.warn(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMemory(id);
      setMemories((m) => {
        const updated = m.filter((mm) => mm.id !== id);
        saveMemories(updated);
        return updated;
      });
    } catch (err) {
      await addPendingChange({ type: 'delete', id });
      setMemories((m) => {
        const updated = m.filter((mm) => mm.id !== id);
        saveMemories(updated);
        return updated;
      });
      console.warn(err.message);
    }
  };

  const MemoryItem = ({ item }) => {
    const [newName, setNewName] = useState('');
    return (
      <View style={styles.memoryItem}>
        <Text style={styles.memoryTitle}>{`${item.name} (${item.id})`}</Text>
        <View style={styles.renameRow}>
          <TextInput
            style={styles.renameInput}
            placeholder="New name"
            value={newName}
            onChangeText={setNewName}
          />
          <Button
            title="Rename"
            onPress={() => {
              const name = newName.trim();
              if (name) {
                handleRename(item.id, name);
                setNewName('');
              }
            }}
          />
        </View>
        <Button title="Delete" color="red" onPress={() => handleDelete(item.id)} />
        <Button title="Chat" onPress={() => openChat({ mode: 'memory', id: item.id, name: item.name })} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Memories</Text>
      <Button title="Estate Chat" onPress={() => openChat({ mode: 'estate', name: 'Estate Copilot' })} />
      <Button title="Browse Houses" onPress={openHousing} />
      <View style={styles.uploadRow}>
        <Button title="Upload Text" onPress={() => pickAndUpload('text')} />
        <Button title="Upload Audio" onPress={() => pickAndUpload('audio')} />
        <Button title="Upload Image" onPress={() => pickAndUpload('image')} />
        <Button title="Upload Video" onPress={() => pickAndUpload('video')} />
      </View>
      <FlatList
        data={memories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MemoryItem item={item} />}
        ListEmptyComponent={<Text>No memories stored.</Text>}
        contentContainerStyle={memories.length ? null : styles.emptyList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  uploadRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  memoryItem: {
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  memoryTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  renameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  renameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
    paddingHorizontal: 4,
    height: 32,
  },
  emptyList: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

