class ChildSpeechService {
  private isMuted: boolean = false;
  private speechRate: number = 0.88; // Slower cadence for 3-6 year olds
  private speechPitch: number = 1.15; // Cheerful friendly pitch

  speak(text: string): void {
    if (this.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      // Clean emojis and symbols for natural reading
      const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = this.speechRate;
      utterance.pitch = this.speechPitch;
      utterance.lang = 'en-US';

      // Pick a natural english voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Zira')));
      if (preferred) {
        utterance.voice = preferred;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore audio synthesis errors gracefully
    }
  }

  stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) this.stop();
    return this.isMuted;
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  setSpeechRate(rate: number): void {
    this.speechRate = rate;
  }
}

export const speechService = new ChildSpeechService();
