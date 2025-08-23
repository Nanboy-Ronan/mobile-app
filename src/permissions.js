import { Platform } from 'react-native';
import { request, PERMISSIONS } from 'react-native-permissions';

export async function requestAppPermissions() {
  if (Platform.OS === 'android') {
    await Promise.all([
      request(PERMISSIONS.ANDROID.RECORD_AUDIO),
      request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE),
      request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE),
      request(PERMISSIONS.ANDROID.ACCESS_NETWORK_STATE),
    ]);
  } else {
    await Promise.all([
      request(PERMISSIONS.IOS.MICROPHONE),
      request(PERMISSIONS.IOS.MEDIA_LIBRARY),
    ]);
    // iOS does not require explicit permission to access network state.
  }
}
