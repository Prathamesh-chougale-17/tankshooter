/**
 * Sound Manager for Tank Shooter Game
 * Handles all audio effects, background music, and sound controls
 */

export interface SoundEffect {
  name: string;
  url: string;
  volume?: number;
  loop?: boolean;
  preload?: boolean;
}

export interface SoundSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
}

export class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private backgroundMusic: HTMLAudioElement | null = null;
  private settings: SoundSettings = {
    masterVolume: 0.7,
    musicVolume: 0.3,
    sfxVolume: 0.8,
    muted: false,
  };

  // Default sound effects for the game
  private defaultSounds: SoundEffect[] = [
    // Weapon sounds
    { name: "shoot", url: "/sounds/shoot.mp3", volume: 0.4 },
    { name: "reload", url: "/sounds/reload.mp3", volume: 0.5 },

    // Explosion and impact sounds
    { name: "explosion", url: "/sounds/explosion.mp3", volume: 0.6 },
    { name: "hit", url: "/sounds/hit.mp3", volume: 0.5 },
    { name: "metalHit", url: "/sounds/metal-hit.mp3", volume: 0.4 },

    // Tank movement
    { name: "engineStart", url: "/sounds/engine-start.mp3", volume: 0.3 },
    {
      name: "engineIdle",
      url: "/sounds/engine-idle.mp3",
      volume: 0.2,
      loop: true,
    },
    { name: "engineStop", url: "/sounds/engine-stop.mp3", volume: 0.3 },

    // UI sounds
    { name: "buttonClick", url: "/sounds/button-click.mp3", volume: 0.6 },
    { name: "levelUp", url: "/sounds/level-up.mp3", volume: 0.7 },
    { name: "powerUp", url: "/sounds/power-up.mp3", volume: 0.6 },
    { name: "gameOver", url: "/sounds/game-over.mp3", volume: 0.8 },
    { name: "victory", url: "/sounds/victory.mp3", volume: 0.8 },

    // Competition sounds
    { name: "countdown", url: "/sounds/countdown.mp3", volume: 0.8 },
    { name: "timeWarning", url: "/sounds/time-warning.mp3", volume: 0.9 },
    { name: "coinDrop", url: "/sounds/coin-drop.mp3", volume: 0.7 },

    // Ambient sounds
    { name: "wind", url: "/sounds/wind.mp3", volume: 0.1, loop: true },
  ];

  constructor() {
    // Only initialize in browser environment
    if (typeof window !== "undefined") {
      this.initializeAudioContext();
      this.loadSettings();
    }
  }

  private initializeAudioContext() {
    // Check if we're in a browser environment
    if (typeof window === "undefined") return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
    } catch (error) {
      console.warn("Web Audio API not supported:", error);
    }
  }

  private loadSettings() {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof localStorage === "undefined")
      return;

    try {
      const saved = localStorage.getItem("tankShooterSoundSettings");
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn("Failed to load sound settings:", error);
    }
  }

  private saveSettings() {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof localStorage === "undefined")
      return;

    try {
      localStorage.setItem(
        "tankShooterSoundSettings",
        JSON.stringify(this.settings)
      );
    } catch (error) {
      console.warn("Failed to save sound settings:", error);
    }
  }

  async initializeSounds() {
    // Check if we're in a browser environment
    if (typeof window === "undefined") return;

    // Create audio elements for each sound effect
    for (const soundDef of this.defaultSounds) {
      try {
        const audio = new Audio();
        audio.preload = soundDef.preload !== false ? "auto" : "none";
        audio.loop = soundDef.loop || false;
        audio.volume =
          (soundDef.volume || 1) *
          this.settings.sfxVolume *
          this.settings.masterVolume;

        // Set up error handling
        audio.onerror = () => {
          console.warn(
            `Failed to load sound: ${soundDef.name} from ${soundDef.url}`
          );
        };

        // Try to load the audio file
        audio.src = soundDef.url;
        this.sounds.set(soundDef.name, audio);
      } catch (error) {
        console.warn(`Error creating audio for ${soundDef.name}:`, error);
      }
    }

    // Initialize background music
    try {
      this.backgroundMusic = new Audio("/sounds/background-music.mp3");
      this.backgroundMusic.loop = true;
      this.backgroundMusic.volume =
        this.settings.musicVolume * this.settings.masterVolume;
      this.backgroundMusic.preload = "auto";
    } catch (error) {
      console.warn("Failed to initialize background music:", error);
    }

    console.log(
      `Sound system initialized with ${this.sounds.size} sound effects`
    );
  }

  // Play a sound effect
  playSound(name: string, volumeOverride?: number) {
    // Check if we're in a browser environment
    if (typeof window === "undefined") return;
    if (this.settings.muted) return;

    const sound = this.sounds.get(name);
    if (!sound) {
      console.warn(`Sound not found: ${name}`);
      return;
    }

    try {
      // Reset to beginning if already playing
      sound.currentTime = 0;

      // Apply volume
      const baseVolume =
        volumeOverride !== undefined
          ? volumeOverride
          : this.defaultSounds.find((s) => s.name === name)?.volume || 1;
      sound.volume =
        baseVolume * this.settings.sfxVolume * this.settings.masterVolume;

      // Play the sound
      const playPromise = sound.play();
      if (playPromise) {
        playPromise.catch((error) => {
          console.warn(`Failed to play sound ${name}:`, error);
        });
      }
    } catch (error) {
      console.warn(`Error playing sound ${name}:`, error);
    }
  }

  // Play background music
  playBackgroundMusic() {
    // Check if we're in a browser environment
    if (typeof window === "undefined") return;
    if (this.settings.muted || !this.backgroundMusic) return;

    try {
      this.backgroundMusic.volume =
        this.settings.musicVolume * this.settings.masterVolume;
      const playPromise = this.backgroundMusic.play();
      if (playPromise) {
        playPromise.catch((error) => {
          console.warn("Failed to play background music:", error);
        });
      }
    } catch (error) {
      console.warn("Error playing background music:", error);
    }
  }

  // Stop background music
  stopBackgroundMusic() {
    // Check if we're in a browser environment
    if (typeof window === "undefined") return;
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
  }

  // Stop all sounds
  stopAllSounds() {
    // Check if we're in a browser environment
    if (typeof window === "undefined") return;
    this.sounds.forEach((sound) => {
      sound.pause();
      sound.currentTime = 0;
    });
    this.stopBackgroundMusic();
  }

  // Volume controls
  setMasterVolume(volume: number) {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
    this.saveSettings();
  }

  setMusicVolume(volume: number) {
    this.settings.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundMusic) {
      this.backgroundMusic.volume =
        this.settings.musicVolume * this.settings.masterVolume;
    }
    this.saveSettings();
  }

  setSfxVolume(volume: number) {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
    this.saveSettings();
  }

  private updateAllVolumes() {
    this.sounds.forEach((sound, name) => {
      const soundDef = this.defaultSounds.find((s) => s.name === name);
      const baseVolume = soundDef?.volume || 1;
      sound.volume =
        baseVolume * this.settings.sfxVolume * this.settings.masterVolume;
    });

    if (this.backgroundMusic) {
      this.backgroundMusic.volume =
        this.settings.musicVolume * this.settings.masterVolume;
    }
  }

  // Mute controls
  mute() {
    this.settings.muted = true;
    this.stopAllSounds();
    this.saveSettings();
  }

  unmute() {
    this.settings.muted = false;
    this.saveSettings();
  }

  toggleMute() {
    if (this.settings.muted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

  // Getters
  getSettings(): SoundSettings {
    return { ...this.settings };
  }

  isMuted(): boolean {
    return this.settings.muted;
  }

  // Game-specific sound methods
  playShootSound() {
    this.playSound("shoot");
  }

  playExplosionSound() {
    this.playSound("explosion");
  }

  playHitSound() {
    this.playSound("hit");
  }

  playLevelUpSound() {
    this.playSound("levelUp");
  }

  playGameOverSound() {
    this.playSound("gameOver");
  }

  playVictorySound() {
    this.playSound("victory");
  }

  playCountdownSound() {
    this.playSound("countdown");
  }

  playTimeWarningSound() {
    this.playSound("timeWarning");
  }

  playCoinDropSound() {
    this.playSound("coinDrop");
  }

  playButtonClickSound() {
    this.playSound("buttonClick");
  }

  // Engine sounds (for tank movement)
  startEngineSound() {
    this.playSound("engineStart");
    setTimeout(() => {
      this.playSound("engineIdle");
    }, 500);
  }

  stopEngineSound() {
    const engineIdle = this.sounds.get("engineIdle");
    if (engineIdle) {
      engineIdle.pause();
    }
    this.playSound("engineStop");
  }

  // Cleanup
  dispose() {
    this.stopAllSounds();
    this.sounds.clear();
    this.backgroundMusic = null;

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Create a singleton instance only on the client side
export const soundManager =
  typeof window !== "undefined" ? new SoundManager() : null;

// Helper function to get the sound manager safely
export function getSoundManager(): SoundManager | null {
  return soundManager;
}
