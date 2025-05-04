"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Info } from 'lucide-react';
import type { DirectionStep } from '@/types/hospital';

interface UseSpeechSynthesisReturn {
  isPlaying: boolean;
  currentStepIndex: number;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoiceURI: string | undefined;
  setSelectedVoiceURI: (uri: string | undefined) => void;
  togglePlayPause: () => void;
  stopSpeech: () => void; // Function to explicitly stop speech
}

/**
 * Hook to manage speech synthesis for direction steps.
 */
export function useSpeechSynthesis(steps: DirectionStep[]): UseSpeechSynthesisReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1); // -1 indicates not started or finished
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | undefined>(undefined);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const stepsRef = useRef(steps); // Ref to hold current steps to avoid stale closures

  // Update stepsRef when steps prop changes
  useEffect(() => {
      stepsRef.current = steps;
      // If steps change while playing, stop playback to avoid confusion
      if (isPlaying) {
          window.speechSynthesis.cancel();
          setIsPlaying(false);
          setCurrentStepIndex(-1);
          utteranceRef.current = null;
          toast.info("Directions updated, audio stopped.");
      }
  }, [steps]);

  // --- Effect to get available voices ---
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices.filter(v => v.lang));
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      // Ensure speech is cancelled if the component using the hook unmounts
      if (utteranceRef.current) {
          window.speechSynthesis.cancel();
          utteranceRef.current = null;
      }
    };
  }, []);

  // --- Effect to handle speech playback based on state ---
  useEffect(() => {
    const currentSteps = stepsRef.current;
    
    if (isPlaying && currentStepIndex >= 0 && currentStepIndex < currentSteps.length) {
      window.speechSynthesis.cancel(); // Cancel previous just in case
      
      const step = currentSteps[currentStepIndex];
      const utterance = new SpeechSynthesisUtterance(step.instruction);
      utteranceRef.current = utterance;

      const selectedVoice = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      } else if (availableVoices.length > 0 && !selectedVoiceURI) {
          // Auto-select first available voice if none is manually selected yet
          setSelectedVoiceURI(availableVoices[0].voiceURI);
          utterance.voice = availableVoices[0];
      }

      utterance.onend = () => {
        // Check if still playing before proceeding
        if (isPlaying) {
          setCurrentStepIndex(prevIndex => prevIndex + 1);
        }
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event.error);
        toast.error(`Speech error: ${event.error}`);
        setIsPlaying(false);
        setCurrentStepIndex(-1);
        utteranceRef.current = null;
      };

      window.speechSynthesis.speak(utterance);

    } else if (isPlaying && currentSteps.length > 0 && currentStepIndex >= currentSteps.length) {
       // Reached the end
       setIsPlaying(false);
       setCurrentStepIndex(-1);
       utteranceRef.current = null;
       toast.info("Finished reading directions.");
    }

    // No explicit cleanup needed here as starting a new speech implicitly cancels the old one,
    // and the togglePlayPause function handles explicit cancellation.

  }, [isPlaying, currentStepIndex, selectedVoiceURI, availableVoices]); // Removed stepsRef dependency

  // --- Control Functions ---
  const stopSpeech = useCallback(() => {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentStepIndex(-1);
      utteranceRef.current = null;
  }, []);

  const togglePlayPause = useCallback(() => {
    const currentSteps = stepsRef.current;
    if (isPlaying) {
      stopSpeech();
    } else {
      if (currentSteps.length > 0) {
        setCurrentStepIndex(0); // Start from the first step
        setIsPlaying(true);
      } else {
        toast.info("No directions steps available to read.");
      }
    }
  }, [isPlaying, stopSpeech]); // Add stepsRef.current length check? Maybe not needed as check is inside.

  // Return state and control functions
  return {
    isPlaying,
    currentStepIndex,
    availableVoices,
    selectedVoiceURI,
    setSelectedVoiceURI, // Expose setter directly
    togglePlayPause,
    stopSpeech,
  };
} 