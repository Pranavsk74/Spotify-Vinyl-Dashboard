import React, { useEffect, useState, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TypographyZone = memo(function TypographyZone({ 
  trackName, 
  artists, 
  progressMs, 
  durationMs, 
  isPlaying, 
  energy = 0.5, 
  danceability = 0.5,
  acousticness = 0.5,
  contextName 
}) {
  const [timeStr, setTimeStr] = useState('00:00');
  const [durationStr, setDurationStr] = useState('00:00');
  const waveformRef = useRef(null);
  const animationRef = useRef();
  
  // Format milliseconds to MM:SS
  const formatTime = (ms) => {
    if (!ms || isNaN(ms)) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    setTimeStr(formatTime(progressMs));
    setDurationStr(formatTime(durationMs));
  }, [progressMs, durationMs]);

  // Percentage progress
  const progressPercent = durationMs > 0 ? (progressMs / durationMs) * 100 : 0;

  // Animate the ambient waveform directly in the DOM for maximum 60/120fps performance
  useEffect(() => {
    let tick = 0;
    const animateWave = () => {
      // Ripple speed increases with energy and danceability
      tick += isPlaying ? (0.03 + energy * 0.04 + danceability * 0.06) : 0.01;
      
      const container = waveformRef.current;
      if (container) {
        const bars = container.children;
        // Softer waveform height if acousticness is high
        const baseHeight = isPlaying ? (15 + energy * 30) * (1 - acousticness * 0.3) : 4;
        
        for (let i = 0; i < bars.length; i++) {
          const envelope = Math.sin((i / 34) * Math.PI); // Envelope peaks in middle
          
          // Organic, cinematic, breathing motion waves
          const wave1 = Math.sin(tick * 0.8 + i * 0.22) * baseHeight;
          const wave2 = Math.cos(tick * 0.4 + i * 0.12) * (baseHeight * 0.6);
          const wave3 = Math.sin(tick * 0.2 - i * 0.35) * (baseHeight * 0.4);
          const wave4 = Math.sin(tick * 0.1 + i * 0.08) * (baseHeight * 0.2); // Slow organic breathing layer
          
          let height = Math.abs(wave1 + wave2 + wave3 + wave4) * envelope;
          const clampedHeight = Math.max(isPlaying ? 5 : 3, Math.min(height, 65));
          
          if (bars[i]) {
            bars[i].style.height = `${clampedHeight}px`;
          }
        }
      }
      
      animationRef.current = requestAnimationFrame(animateWave);
    };

    animationRef.current = requestAnimationFrame(animateWave);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, energy, danceability, acousticness]);

  return (
    <div className="flex flex-col justify-center h-full px-6 md:px-12 select-none">
      {/* Typographic Song Details */}
      <div className="text-left mb-12">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={trackName + artists}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
          >
            <h1 className="font-serif text-[42px] md:text-[52px] xl:text-[60px] font-[300] text-typography leading-[1.1] tracking-tight text-balance">
              {trackName || 'Select a track'}
            </h1>
            <p className="font-sans text-[15px] md:text-[17px] font-[300] text-accent-gold mt-3 tracking-wide">
              {artists || 'Ambient Visualizer'}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress slider / bar */}
      <div className="w-full mb-10">
        <div className="flex justify-between items-center text-[11px] font-mono text-secondary-text mb-3 tracking-widest">
          <span>{timeStr}</span>
          <span>{durationStr}</span>
        </div>
        
        {/* Progress track */}
        <div className="relative w-full h-[3px] bg-neutral-900/5 rounded-full overflow-hidden">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-accent-gold rounded-full"
            style={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.1, ease: 'linear' }}
          />
        </div>
      </div>

      {/* Ambient Flowing Waveform */}
      <div className="w-full flex flex-col items-center justify-center mb-10 h-[90px]">
        <div 
          ref={waveformRef}
          className="flex items-end justify-center gap-[5px] h-[70px] w-full max-w-[380px]"
        >
          {Array(35).fill(0).map((_, i) => (
            <div
              key={i}
              className="w-[4px] rounded-full bg-accent-gold/45"
              style={{ height: '5px' }}
            />
          ))}
        </div>
      </div>

      {/* Playing Context Display Card */}
      <div className="flex justify-start">
        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-neutral-900/5 bg-[#EFEAE3]/50 backdrop-blur-md shadow-[0_4px_20px_rgba(239,234,227,0.4)]">
          {/* Subtle live equalizer animation for playing state */}
          <div className="flex gap-[3px] w-[14px] h-[10px] items-end">
            <span className={`w-[2px] rounded-full bg-accent-gold/80 transition-all ${isPlaying ? 'animate-pulse-slow' : 'h-[3px]'}`} style={{ height: isPlaying ? '100%' : '3px' }} />
            <span className={`w-[2px] rounded-full bg-accent-gold/80 transition-all ${isPlaying ? 'animate-pulse-slow' : 'h-[6px]'}`} style={{ height: isPlaying ? '60%' : '5px', animationDelay: '0.2s' }} />
            <span className={`w-[2px] rounded-full bg-accent-gold/80 transition-all ${isPlaying ? 'animate-pulse-slow' : 'h-[4px]'}`} style={{ height: isPlaying ? '80%' : '4px', animationDelay: '0.4s' }} />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#6E6A66]">
            {contextName || 'Offline Ambient Stream'}
          </span>
        </div>
      </div>
    </div>
  );
});

export default TypographyZone;
