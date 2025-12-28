// Sound effects utility - DISABLED
// Sons désactivés selon la demande utilisateur

let audioEnabled = false;

export const toggleAudio = () => {
  audioEnabled = false; // Always disabled
  return audioEnabled;
};

export const playSound = (soundType) => {
  // Sons désactivés
  return;
};

export const playSyntheticSound = (type) => {
  // Sons désactivés
  return;
};

export default {
  playSound,
  playSyntheticSound,
  toggleAudio
};