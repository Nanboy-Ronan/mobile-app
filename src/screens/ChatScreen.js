import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Platform, Pressable } from 'react-native';
import {
  loadChat,
  saveChat,
  addPendingChange,
  getPendingChanges,
  clearPendingChanges,
  setPendingChanges,
} from '../storage';
import io from 'socket.io-client';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import NetInfo from '@react-native-community/netinfo';
import config from '../config';
import { estateChat as estateChatApi, chat as chatApi, getEstateRecommendation, tts as ttsApi } from '../api/client';

export default function ChatScreen({ mode, id, name, onBack, onRecommendations }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const socketRef = useRef(null);
  const recorder = useRef(new AudioRecorderPlayer()).current;
  const chatId = mode === 'estate' ? 'estate' : id;
  const isConnected = useRef(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const playUrl = async (url) => {
    try {
      setIsPlaying(true);
      try { await recorder.stopPlayer(); } catch {}
      await recorder.startPlayer(url);
    } catch (e) {
      console.warn(e.message);
    } finally {
      setIsPlaying(false);
    }
  };

  const speakText = async (text) => {
    if (!voiceEnabled) return;
    try {
      const res = await ttsApi(text);
      if (res?.audio_url) {
        await playUrl(`${config.apiUrl}${res.audio_url}`);
      }
    } catch (e) {
      console.warn(e.message);
    }
  };

  useEffect(() => {
    if (mode === 'estate') {
      socketRef.current = io(config.apiUrl, { transports: ['websocket'] });
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [mode]);

  useEffect(() => {
    loadChat(chatId).then((data) => setMessages(data));
  }, [chatId]);

  useEffect(() => {
    saveChat(chatId, messages);
  }, [messages, chatId]);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      isConnected.current = !!state.isConnected;
      if (isConnected.current) {
        flushPending();
      }
    });
    NetInfo.fetch().then((state) => {
      isConnected.current = !!state.isConnected;
      if (isConnected.current) flushPending();
    });
    return () => unsub();
  }, []);

  const flushPending = async () => {
    const pending = await getPendingChanges();
    if (!pending.length) return;
    const remaining = [];
    for (const item of pending) {
      try {
        if (item.type === 'text') {
          if (item.mode === 'estate') {
            const res = await estateChatApi({ question: item.question });
            setMessages((m) => [...m, { role: 'assistant', text: res.answer }]);
            if (!res.audio_url) {
              await speakText(res.answer);
            }
            if (onRecommendations) {
              try {
                const rec = await getEstateRecommendation();
                onRecommendations(rec);
              } catch (err) {
                console.warn(err.message);
              }
            }
          } else {
            const data = new FormData();
            data.append('question', item.question);
            const res = await chatApi(item.id, data);
            setMessages((m) => [
              ...m,
              {
                role: 'assistant',
                text: res.answer,
                audioUrl: res.audio_url ? `${config.apiUrl}${res.audio_url}` : null,
              },
            ]);
            if (res.audio_url) {
              await recorder.startPlayer(`${config.apiUrl}${res.audio_url}`);
            }
          }
        } else if (item.type === 'audio') {
          const file = {
            uri: item.path,
            type: item.fileType,
            name: item.fileName,
          };
          const data = new FormData();
          data.append('audio', file);
          let res;
          if (item.mode === 'estate') {
            res = await estateChatApi(data);
            if (onRecommendations) {
              try {
                const rec = await getEstateRecommendation();
                onRecommendations(rec);
              } catch (err) {
                console.warn(err.message);
              }
            }
          } else {
            res = await chatApi(item.id, data);
          }
          setMessages((m) => [
            ...m,
            {
              role: 'assistant',
              text: res.answer,
              audioUrl: res.audio_url ? `${config.apiUrl}${res.audio_url}` : null,
            },
          ]);
          if (res.audio_url) {
            await playUrl(`${config.apiUrl}${res.audio_url}`);
          } else {
            await speakText(res.answer);
          }
        }
      } catch (err) {
        console.warn(err.message);
        remaining.push(item);
      }
    }
    if (remaining.length) {
      await setPendingChanges(remaining);
    } else {
      await clearPendingChanges();
    }
  };

  const sendText = async () => {
    const question = text.trim();
    if (!question) return;
    setMessages((m) => [...m, { role: 'user', text: question }]);
    setText('');
    if (!isConnected.current) {
      await addPendingChange({ type: 'text', mode, id, question });
      return;
    }
    if (mode === 'estate') {
      const assistIndex = messages.length + 1;
      let streamedText = '';
      setMessages((m) => [...m, { role: 'assistant', text: '' }]);
      const handleChunk = (chunk) => {
        streamedText += chunk;
        setMessages((m) => {
          const arr = [...m];
          arr[assistIndex].text = streamedText;
          return arr;
        });
      };
      socketRef.current.on('estate_chat_response', handleChunk);
      socketRef.current.once('estate_chat_complete', async () => {
        socketRef.current.off('estate_chat_response', handleChunk);
        // speak the streamed assistant message
        if (voiceEnabled && streamedText) await speakText(streamedText);
        if (onRecommendations) {
          try {
            const rec = await getEstateRecommendation();
            onRecommendations(rec);
          } catch (err) {
            console.warn(err.message);
          }
        }
      });
      socketRef.current.emit('estate_chat', { question });
    } else {
      const formData = new FormData();
      formData.append('question', question);
      const resp = await fetch(`${config.apiUrl}/chat_stream/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${config.apiKey}` },
        body: formData,
      });
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let assistText = '';
      setMessages((m) => [...m, { role: 'assistant', text: '' }]);
      while (true) {
        const { value, done } = await reader.read();
        if (value) {
          assistText += decoder.decode(value, { stream: true });
          setMessages((m) => {
            const arr = [...m];
            arr[arr.length - 1].text = assistText;
            return arr;
          });
        }
        if (done) break;
      }
      await speakText(assistText);
    }
  };

  const startRecording = async () => {
    setRecording(true);
    await recorder.startRecorder();
  };

  const stopRecording = async () => {
    const path = await recorder.stopRecorder();
    setRecording(false);
    const file = {
      uri: Platform.OS === 'android' ? `file://${path}` : path,
      type: Platform.select({ ios: 'audio/m4a', android: 'audio/mp4' }),
      name: 'recording.m4a',
    };
    if (!isConnected.current) {
      await addPendingChange({
        type: 'audio',
        mode,
        id,
        path: file.uri,
        fileType: file.type,
        fileName: file.name,
      });
      setMessages((m) => [...m, { role: 'user', text: '(voice message)' }]);
      return;
    }
    const data = new FormData();
    data.append('audio', file);
    let res;
    if (mode === 'estate') {
      res = await estateChatApi(data);
      if (onRecommendations) {
        try {
          const rec = await getEstateRecommendation();
          onRecommendations(rec);
        } catch (err) {
          console.warn(err.message);
        }
      }
    } else {
      res = await chatApi(id, data);
    }
    setMessages((m) => [
      ...m,
      { role: 'user', text: '(voice message)' },
      { role: 'assistant', text: res.answer, audioUrl: res.audio_url ? `${config.apiUrl}${res.audio_url}` : null },
    ]);
    if (res.audio_url) {
      await playUrl(`${config.apiUrl}${res.audio_url}`);
    } else {
      await speakText(res.answer);
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.message, item.role === 'user' ? styles.user : styles.assistant]}>
      <Text>{item.text}</Text>
      {item.audioUrl && (
        <Button title="Play" onPress={() => recorder.startPlayer(item.audioUrl)} />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button title="Back" onPress={onBack} />
        <Text style={styles.title}>{name || 'Chat'}</Text>
      </View>
      <FlatList
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        style={styles.history}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message"
        />
        <Button title="Send" onPress={sendText} />
        <Button title={voiceEnabled ? 'Voice: On' : 'Voice: Off'} onPress={() => setVoiceEnabled(v => !v)} />
      </View>
      <Pressable
        onPressIn={startRecording}
        onPressOut={stopRecording}
        style={styles.micButton}
        accessibilityLabel="Hold to talk"
      >
        <Text style={styles.micText}>{recording ? '●' : '🎤'}</Text>
      </Pressable>
      {isPlaying && (
        <Pressable
          onPress={async () => { try { await recorder.stopPlayer(); } catch {} finally { setIsPlaying(false); } }}
          style={[styles.micButton, { bottom: 160, backgroundColor: '#dc3545' }]}
          accessibilityLabel="Stop playback"
        >
          <Text style={styles.micText}>⏹</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
  history: { flex: 1, padding: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 4,
  },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', paddingHorizontal: 8, height: 40 },
  message: { marginVertical: 4, padding: 8, borderRadius: 6, maxWidth: '80%' },
  user: { backgroundColor: '#d1e7dd', alignSelf: 'flex-end' },
  assistant: { backgroundColor: '#e8eaf6', alignSelf: 'flex-start' },
  micButton: { position: 'absolute', right: 16, bottom: 90, width: 56, height: 56, borderRadius: 28, backgroundColor: '#007bff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  micText: { color: '#fff', fontSize: 24, fontWeight: '700' },
});
