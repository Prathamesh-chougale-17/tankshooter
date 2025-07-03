"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Volume2,
  VolumeX,
  Music,
  Zap,
  Settings,
  X,
  Play,
  Pause,
} from "lucide-react";
import { getSoundManager, SoundSettings } from "@/lib/sound-manager";

interface SoundControlPanelProps {
  onClose?: () => void;
  isVisible?: boolean;
}

export function SoundControlPanel({
  onClose,
  isVisible = true,
}: SoundControlPanelProps) {
  const [settings, setSettings] = useState<SoundSettings>({
    masterVolume: 0.7,
    musicVolume: 0.3,
    sfxVolume: 0.8,
    muted: false,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize sound manager and load settings
    const initializeAudio = async () => {
      try {
        const soundMgr = getSoundManager();
        if (!soundMgr) {
          console.warn("Sound manager not available");
          return;
        }
        await soundMgr.initializeSounds();
        setSettings(soundMgr.getSettings());
        setIsInitialized(true);
      } catch (error) {
        console.warn("Failed to initialize sound system:", error);
      }
    };

    initializeAudio();
  }, []);

  useEffect(() => {
    // Update local settings when sound manager settings change
    const soundMgr = getSoundManager();
    if (soundMgr) {
      setSettings(soundMgr.getSettings());
    }
  }, []);

  const handleMasterVolumeChange = (value: number[]) => {
    const volume = value[0] / 100;
    const soundMgr = getSoundManager();
    if (soundMgr) {
      soundMgr.setMasterVolume(volume);
      setSettings((prev) => ({ ...prev, masterVolume: volume }));
    }
  };

  const handleMusicVolumeChange = (value: number[]) => {
    const volume = value[0] / 100;
    const soundMgr = getSoundManager();
    if (soundMgr) {
      soundMgr.setMusicVolume(volume);
      setSettings((prev) => ({ ...prev, musicVolume: volume }));
    }
  };

  const handleSfxVolumeChange = (value: number[]) => {
    const volume = value[0] / 100;
    const soundMgr = getSoundManager();
    if (soundMgr) {
      soundMgr.setSfxVolume(volume);
      setSettings((prev) => ({ ...prev, sfxVolume: volume }));
    }
  };

  const handleMuteToggle = () => {
    const soundMgr = getSoundManager();
    if (soundMgr) {
      soundMgr.toggleMute();
      setSettings((prev) => ({ ...prev, muted: !prev.muted }));
    }
  };

  const handleMusicToggle = () => {
    const soundMgr = getSoundManager();
    if (!soundMgr) return;

    if (isPlaying) {
      soundMgr.stopBackgroundMusic();
      setIsPlaying(false);
    } else {
      soundMgr.playBackgroundMusic();
      setIsPlaying(true);
    }
  };

  const testSound = (soundName: string) => {
    const soundMgr = getSoundManager();
    if (soundMgr) {
      soundMgr.playSound(soundName);
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="w-80 bg-black/90 backdrop-blur-sm border-green-500/30 text-white shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-green-400 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Sound Settings
          </CardTitle>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={isInitialized ? "default" : "secondary"}
            className="text-xs"
          >
            {isInitialized ? "✓ Audio Ready" : "⏳ Loading..."}
          </Badge>
          {settings.muted && (
            <Badge variant="destructive" className="text-xs">
              🔇 Muted
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Master Volume Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center">
              <Volume2 className="h-4 w-4 mr-2 text-green-400" />
              Master Volume
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMuteToggle}
                className={`h-8 w-8 p-0 ${
                  settings.muted ? "text-red-400" : "text-green-400"
                }`}
              >
                {settings.muted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <span className="text-sm text-gray-300 w-10 text-right">
                {Math.round(settings.masterVolume * 100)}%
              </span>
            </div>
          </div>
          <Slider
            value={[settings.masterVolume * 100]}
            onValueChange={handleMasterVolumeChange}
            disabled={settings.muted}
            max={100}
            step={5}
            className="w-full"
          />
        </div>

        {/* Music Volume Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center">
              <Music className="h-4 w-4 mr-2 text-blue-400" />
              Background Music
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMusicToggle}
                disabled={settings.muted || !isInitialized}
                className="h-8 w-8 p-0 text-blue-400"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <span className="text-sm text-gray-300 w-10 text-right">
                {Math.round(settings.musicVolume * 100)}%
              </span>
            </div>
          </div>
          <Slider
            value={[settings.musicVolume * 100]}
            onValueChange={handleMusicVolumeChange}
            disabled={settings.muted}
            max={100}
            step={5}
            className="w-full"
          />
        </div>

        {/* Sound Effects Volume Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center">
              <Zap className="h-4 w-4 mr-2 text-yellow-400" />
              Sound Effects
            </label>
            <span className="text-sm text-gray-300 w-10 text-right">
              {Math.round(settings.sfxVolume * 100)}%
            </span>
          </div>
          <Slider
            value={[settings.sfxVolume * 100]}
            onValueChange={handleSfxVolumeChange}
            disabled={settings.muted}
            max={100}
            step={5}
            className="w-full"
          />
        </div>

        {/* Sound Test Buttons */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300">Test Sounds</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => testSound("shoot")}
              disabled={settings.muted || !isInitialized}
              className="text-xs bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20"
            >
              🔫 Shoot
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testSound("explosion")}
              disabled={settings.muted || !isInitialized}
              className="text-xs bg-orange-500/10 border-orange-500/30 text-orange-300 hover:bg-orange-500/20"
            >
              💥 Explosion
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testSound("levelUp")}
              disabled={settings.muted || !isInitialized}
              className="text-xs bg-green-500/10 border-green-500/30 text-green-300 hover:bg-green-500/20"
            >
              📈 Level Up
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testSound("coinDrop")}
              disabled={settings.muted || !isInitialized}
              className="text-xs bg-yellow-500/10 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20"
            >
              💰 Coin
            </Button>
          </div>
        </div>

        {/* Audio Information */}
        <div className="text-xs text-gray-400 space-y-1">
          <div>🎵 Background music will loop during gameplay</div>
          <div>🔊 Sound effects enhance the gaming experience</div>
          <div>⚙️ Settings are automatically saved</div>
        </div>
      </CardContent>
    </Card>
  );
}
