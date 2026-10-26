import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Mic, MicOff } from 'lucide-react';

export default function AudioPlayerToggle({ textToSpeak }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
    }
  }, []);

  const handleSpeak = () => {
    if (!supported || !textToSpeak) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    // Pick Indian English/Hindi voice if available
    const voices = window.speechSynthesis.getVoices();
    const inVoice = voices.find(v => v.lang.includes('IN') || v.lang.includes('hi') || v.name.includes('India'));
    if (inVoice) {
      utterance.voice = inVoice;
    }
    utterance.rate = 1.0;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  if (!supported) return null;

  return (
    <button
      onClick={handleSpeak}
      title={isPlaying ? "Stop Audio" : "Listen via Web Speech TTS"}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
        isPlaying
          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
      }`}
    >
      {isPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      <span>{isPlaying ? "Stop Voice" : "Audio TTS"}</span>
    </button>
  );
}
