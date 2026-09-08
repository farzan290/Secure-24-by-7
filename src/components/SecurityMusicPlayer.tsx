import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Music,
  Radio,
  Sliders,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ShieldAlert,
  Headphones
} from 'lucide-react';
import {
  soundEngine,
  SECURITY_TRACKS,
  SecurityTrackId,
  AudioEngineState
} from '../services/audio';

export const SecurityMusicPlayer: React.FC = () => {
  const [audioState, setAudioState] = useState<AudioEngineState>(soundEngine.getState());
  const [isExpanded, setIsExpanded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Subscribe to audio engine state changes
  useEffect(() => {
    const unsubscribe = soundEngine.subscribe(newState => {
      setAudioState(newState);
    });
    return () => unsubscribe();
  }, []);

  // Real-time audio visualizer drawing loop
  useEffect(() => {
    if (!audioState.isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      // Draw flat idle line
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, canvas.height / 2);
          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.stroke();
        }
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = soundEngine.getAnalyser();
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barCount = 24;
      const barWidth = (canvas.width / barCount) - 1.5;
      let x = 0;

      for (let i = 0; i < barCount; i++) {
        // Sample frequencies favoring low and sub-bass frequencies
        const freqIndex = Math.floor(Math.pow(i / barCount, 1.8) * bufferLength * 0.7);
        const value = dataArray[freqIndex] || 0;
        const percent = value / 255;
        const barHeight = Math.max(2, percent * (canvas.height - 4));

        // Security cyan-to-blue gradient
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#0284c7');
        gradient.addColorStop(0.7, '#06b6d4');
        gradient.addColorStop(1, '#38bdf8');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1.5;
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioState.isPlaying, isExpanded]);

  const handleTogglePlay = () => {
    soundEngine.toggleMusic();
  };

  const handleSelectTrack = (trackId: SecurityTrackId) => {
    soundEngine.setTrack(trackId);
    if (!audioState.isPlaying) {
      soundEngine.startMusic(trackId);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundEngine.setVolume(val);
  };

  const handleSetVolumePreset = (vol: number) => {
    soundEngine.setVolume(vol);
    if (!audioState.isPlaying) {
      soundEngine.startMusic();
    }
  };

  const activeTrack = SECURITY_TRACKS.find(t => t.id === audioState.currentTrackId) || SECURITY_TRACKS[0];

  return (
    <div className="fixed bottom-4 right-4 z-40 font-sans">
      {/* COLLAPSED PILL WIDGET */}
      {!isExpanded ? (
        <div className="flex items-center space-x-2 bg-slate-900/95 backdrop-blur-md border border-cyan-900/80 rounded-full px-3 py-1.5 shadow-2xl shadow-slate-950/80 hover:border-cyan-500 transition-all">
          <button
            id="btn-music-toggle-play"
            type="button"
            onClick={handleTogglePlay}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              audioState.isPlaying
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/50'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title={audioState.isPlaying ? 'Pause Security Music' : 'Play Security Music'}
          >
            {audioState.isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </button>

          {/* Mini animated equalizer bars */}
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex items-center space-x-2 text-left pr-1 cursor-pointer focus:outline-none"
          >
            <div className="flex items-end space-x-0.5 h-3.5 w-5">
              <span className={`w-1 bg-cyan-400 rounded-t transition-all ${audioState.isPlaying ? 'h-3 animate-pulse' : 'h-1'}`} />
              <span className={`w-1 bg-cyan-500 rounded-t transition-all ${audioState.isPlaying ? 'h-3.5 animate-bounce' : 'h-1.5'}`} />
              <span className={`w-1 bg-blue-400 rounded-t transition-all ${audioState.isPlaying ? 'h-2 animate-pulse' : 'h-1'}`} />
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-200 tracking-wide flex items-center space-x-1">
                <Headphones className="w-3 h-3 text-cyan-400" />
                <span className="truncate max-w-[130px] sm:max-w-[160px]">{activeTrack.name}</span>
              </span>
              <span className="text-[9px] font-mono text-cyan-400">
                {audioState.isPlaying ? `VOLUME: ${Math.round(audioState.volume * 100)}%` : 'MUTED / PAUSED'}
              </span>
            </div>

            <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>
        </div>
      ) : (
        /* EXPANDED SECURITY MUSIC CONSOLE */
        <div className="w-80 sm:w-96 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-cyan-800/80 p-4 shadow-2xl shadow-cyan-950/50 space-y-3.5 transition-all animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-xs text-white uppercase font-mono tracking-wider">
                    SECURITY AMBIENT AUDIO
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                    VOL {Math.round(audioState.volume * 100)}%
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Command center background soundtrack
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Minimize Player"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Real-time Spectrum Visualizer */}
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 h-16 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={340}
              height={64}
              className="w-full h-full block"
            />
            {!audioState.isPlaying && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px] flex items-center justify-center text-slate-400 text-xs font-mono">
                <span>SECURITY AUDIO PAUSED</span>
              </div>
            )}
            <div className="absolute top-1.5 right-2 text-[9px] font-mono text-cyan-400/80 pointer-events-none">
              {audioState.isPlaying ? 'SPECTRUM 20Hz - 4.8kHz' : 'STANDBY'}
            </div>
          </div>

          {/* Active Track Info */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">{activeTrack.name}</span>
              <span className="text-[10px] font-mono text-cyan-400">{activeTrack.genre} • {activeTrack.bpm} BPM</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">{activeTrack.description}</p>
          </div>

          {/* Track Selection Pills */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Select Security Mood
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {SECURITY_TRACKS.map(track => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => handleSelectTrack(track.id)}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold text-center truncate transition-all ${
                    audioState.currentTrackId === track.id
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-950'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-750'
                  }`}
                  title={track.name}
                >
                  {track.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Volume Control with Quick Presets */}
          <div className="space-y-2 pt-1.5 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1.5 text-slate-300 text-[11px]">
                {audioState.volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                )}
                <span>Output Volume: <strong className="text-cyan-300 font-mono text-xs">{Math.round(audioState.volume * 100)}%</strong></span>
              </div>

              <span className="text-[10px] font-mono text-slate-400">
                {audioState.volume >= 0.75 ? '🔥 HIGH' : audioState.volume >= 0.4 ? '🔊 MEDIUM' : '🔉 LOW'}
              </span>
            </div>

            {/* Slider */}
            <div className="flex items-center space-x-2">
              <input
                id="music-volume-slider"
                type="range"
                min="0"
                max="1.0"
                step="0.01"
                value={audioState.volume}
                onChange={handleVolumeChange}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Quick Volume Preset Buttons */}
            <div className="grid grid-cols-4 gap-1 pt-0.5">
              {[
                { label: '25% Low', val: 0.25 },
                { label: '50% Mid', val: 0.50 },
                { label: '75% High', val: 0.75 },
                { label: '100% Max', val: 1.00 }
              ].map(p => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => handleSetVolumePreset(p.val)}
                  className={`py-1 rounded text-[10px] font-mono font-bold transition-all ${
                    Math.abs(audioState.volume - p.val) < 0.05
                      ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-900'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-750'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Master Action Buttons */}
          <div className="flex items-center space-x-2 pt-1">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase flex items-center justify-center space-x-1.5 transition-all shadow-lg ${
                audioState.isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-amber-950/40'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-950/50'
              }`}
            >
              {audioState.isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause Music</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  <span>Play Security Music</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => soundEngine.setVolume(audioState.volume > 0 ? 0 : 0.50)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700"
              title={audioState.volume > 0 ? 'Mute' : 'Unmute (50%)'}
            >
              {audioState.volume > 0 ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
