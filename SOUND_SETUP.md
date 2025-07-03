# Sound System Setup Guide

## Sound Files Required

Place the following sound files in the `public/sounds/` directory:

### Weapon Sounds

- `shoot.mp3` - Tank firing sound
- `reload.mp3` - Weapon reload sound

### Explosion and Impact Sounds

- `explosion.mp3` - Tank explosion sound
- `hit.mp3` - Bullet impact sound
- `metal-hit.mp3` - Metal impact sound

### Tank Movement

- `engine-start.mp3` - Tank engine starting
- `engine-idle.mp3` - Tank engine idling (will loop)
- `engine-stop.mp3` - Tank engine stopping

### UI Sounds

- `button-click.mp3` - Button click sound
- `level-up.mp3` - Level up achievement sound
- `power-up.mp3` - Power-up pickup sound
- `game-over.mp3` - Game over sound
- `victory.mp3` - Victory sound

### Competition Sounds

- `countdown.mp3` - Competition countdown
- `time-warning.mp3` - Time running out warning
- `coin-drop.mp3` - Prize/coin sound

### Background Music

- `background-music.mp3` - Main background music (will loop)

### Ambient Sounds

- `wind.mp3` - Ambient wind sound (will loop)

## Free Sound Resources

You can find free sound effects at:

- **Freesound.org** - High quality sounds with Creative Commons licenses
- **OpenGameArt.org** - Game-specific sounds and music
- **Zapsplat.com** - Professional sound library (free with registration)
- **BBC Sound Effects** - Free sound effects library

## Sound Format Recommendations

- **Format**: MP3 or OGG for best browser compatibility
- **Quality**: 44.1kHz, 16-bit for good quality/size balance
- **Size**: Keep files under 1MB each for fast loading
- **Duration**:
  - SFX: 0.5-3 seconds
  - Music: 30-120 seconds (will loop)
  - Ambient: 10-30 seconds (will loop)

## Testing Sounds

1. Add your sound files to `public/sounds/`
2. Open the sound control panel in the game
3. Use the test buttons to verify each sound works
4. Adjust volume levels as needed

## Integration Status

✅ Sound Manager implemented
✅ Sound Control Panel with sliders
✅ Volume controls (Master, Music, SFX)
✅ Mute functionality
✅ Local storage for settings
✅ Game integration ready

## Next Steps

1. Add sound files to `public/sounds/` directory
2. Integrate sound calls into game engine
3. Add sound control button to game menu
4. Test all sounds in gameplay
