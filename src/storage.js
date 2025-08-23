import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAT_KEY = 'chat_history_';
const MEMORIES_KEY = 'memory_metadata';
const PENDING_KEY = 'pending_changes';
const TOKEN_KEY = 'session_token';

export async function loadChat(id) {
  const json = await AsyncStorage.getItem(CHAT_KEY + id);
  return json ? JSON.parse(json) : [];
}

export async function saveChat(id, messages) {
  await AsyncStorage.setItem(CHAT_KEY + id, JSON.stringify(messages));
}

export async function loadMemories() {
  const json = await AsyncStorage.getItem(MEMORIES_KEY);
  return json ? JSON.parse(json) : [];
}

export async function saveMemories(memories) {
  await AsyncStorage.setItem(MEMORIES_KEY, JSON.stringify(memories));
}

export async function getPendingChanges() {
  const json = await AsyncStorage.getItem(PENDING_KEY);
  return json ? JSON.parse(json) : [];
}

export async function addPendingChange(change) {
  const changes = await getPendingChanges();
  changes.push(change);
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(changes));
}

export async function clearPendingChanges() {
  await AsyncStorage.removeItem(PENDING_KEY);
}

export async function setPendingChanges(changes) {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(changes));
}

export async function setToken(token) {
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }
}

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}
