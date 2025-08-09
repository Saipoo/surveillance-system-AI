import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function playAlarm() {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // High-pitched tone
  gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 1);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 1);
}
