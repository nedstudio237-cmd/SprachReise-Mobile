import { Audio } from 'expo-av';

// Force le haut-parleur principal (pas l'écouteur d'oreille)
export async function setupSpeaker() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      playsThroughEarpieceIOS: false,
      staysActiveInBackground: false,
    });
  } catch {}
}

// Mode enregistrement (pour PronounceScreen)
export async function setupRecording() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      playsThroughEarpieceIOS: false,
    });
  } catch {}
}
