import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import HomeScreen from '../src/screens/HomeScreen';

jest.mock('../src/api/client', () => ({
  getMemories: jest.fn().mockResolvedValue([]),
  uploadText: jest.fn(),
  uploadAudio: jest.fn(),
  uploadImage: jest.fn(),
  uploadVideo: jest.fn(),
  renameMemory: jest.fn(),
  deleteMemory: jest.fn(),
}));

jest.mock('../src/storage', () => ({
  loadMemories: jest.fn().mockResolvedValue([]),
  saveMemories: jest.fn(),
  addPendingChange: jest.fn(),
  getPendingChanges: jest.fn().mockResolvedValue([]),
  clearPendingChanges: jest.fn(),
}));

jest.mock('react-native-document-picker', () => ({
  types: { plainText: 'text/plain', audio: 'audio/*', images: 'image/*', video: 'video/*' },
  pickSingle: jest.fn(),
  isCancel: () => false,
}));

describe('HomeScreen', () => {
  it('renders memories title', async () => {
    const { getByText } = render(<HomeScreen openChat={() => {}} openHousing={() => {}} />);
    await waitFor(() => expect(getByText('Memories')).toBeTruthy());
  });
});
