// src/utils/textToSpeech.ts
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let utterance: SpeechSynthesisUtterance | null = null;
let voicesLoaded = false;

const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise(resolve => {
    if (!synth) return resolve([]);
    
    const checkVoices = () => {
      const voices = synth.getVoices();
      if (voices.length > 0) {
        voicesLoaded = true;
        resolve(voices);
      }
    };

    if (voicesLoaded || synth.getVoices().length > 0) {
      return checkVoices();
    }

    synth.onvoiceschanged = checkVoices;
    setTimeout(checkVoices, 1000); 
  });
};

const getFrenchVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
    const frenchVoice = voices.find(voice => voice.lang.startsWith('fr'));
    
    return frenchVoice; 
}

export const speak = async (text: string): Promise<SpeechSynthesisUtterance | null> => {
  if (!synth || !text) return null;

  stopSpeaking(); 

  const voices = await loadVoices(); 
  if (synth.pending) {
      await new Promise(r => setTimeout(r, 50));
  }

  utterance = new SpeechSynthesisUtterance(text);
  
  const voiceToUse = getFrenchVoice(voices);
  
  if (voiceToUse) {
    utterance.voice = voiceToUse;
    utterance.lang = voiceToUse.lang;
  } else {
    utterance.lang = 'fr-FR'; 
    console.warn("Voix française non trouvée. Utilisation de la voix par défaut.");
  }
  
  try {
    synth.speak(utterance);
    return utterance;
  } catch (error) {
    console.error("Échec de synth.speak():", error);
    return null;
  }
};

export const stopSpeaking = () => {
  if (synth && synth.speaking) {
    synth.cancel();
  }
};