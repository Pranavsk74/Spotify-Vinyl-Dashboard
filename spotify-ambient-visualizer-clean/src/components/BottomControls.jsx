import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Shuffle, 
  Repeat, 
  Volume2, 
  Activity, 
  Sun, 
  HelpCircle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BottomControls({
  isPlaying,
  onTogglePlay,
  onNext,
  onPrevious,
  volume,
  onVolumeChange,
  playlistName = 'Liked Songs',
  isShuffle,
  onToggleShuffle,
  isRepeat,
  onToggleRepeat,
  isPremiumRestricted,
  onDismissPremiumAlert
}) {
  const [time, setTime] = useState(new Date());

  // Real-time ticking clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatClockTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const hoursStr = hours.toString().padStart(2, '0');
    return `${hoursStr}:${minutes} ${ampm}`;
  };

  return (
    <div className="w-full flex flex-col items-center bg-[#EFEAE3]/30 backdrop-blur-xl border border-neutral-900/5 rounded-[24px] p-6 shadow-[0_12px_40px_rgba(23,23,23,0.03)] select-none">
      
      {/* Premium API Action Alert */}
      <AnimatePresence>
        {isPremiumRestricted && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-[-70px] left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#9B6B43] text-[#F5F1EC] text-xs font-mono py-2 px-5 rounded-full shadow-lg border border-[#F5F1EC]/15 z-50 pointer-events-auto"
          >
            <span>Spotify Premium required for controls. Visualizer is simulated.</span>
            <button 
              onClick={onDismissPremiumAlert}
              className="hover:text-white underline uppercase text-[10px] ml-2 tracking-wider"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full grid grid-cols-12 gap-6 items-center">
        {/* Playback Controls (LEFT - Columns 1 to 4) */}
        <div className="col-span-12 md:col-span-4 flex items-center justify-center md:justify-start gap-5">
          <button 
            onClick={onToggleShuffle}
            className={`p-2 rounded-full transition-colors cursor-pointer hover:bg-neutral-900/5 ${isShuffle ? 'text-accent-gold' : 'text-secondary-text/60'}`}
          >
            <Shuffle size={16} strokeWidth={2} />
          </button>
          
          <button 
            onClick={onPrevious}
            className="p-2 rounded-full text-typography hover:bg-neutral-900/5 transition-colors cursor-pointer"
          >
            <SkipBack size={18} fill="currentColor" strokeWidth={0} />
          </button>
          
          {/* Main Play/Pause Button */}
          <button 
            onClick={onTogglePlay}
            className="w-12 h-12 rounded-full bg-accent-gold hover:bg-accent-dark text-[#F5F1EC] flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95 duration-300"
          >
            {isPlaying ? (
              <Pause size={18} fill="currentColor" strokeWidth={0} />
            ) : (
              <Play size={18} fill="currentColor" strokeWidth={0} className="ml-1" />
            )}
          </button>
          
          <button 
            onClick={onNext}
            className="p-2 rounded-full text-typography hover:bg-neutral-900/5 transition-colors cursor-pointer"
          >
            <SkipForward size={18} fill="currentColor" strokeWidth={0} />
          </button>
          
          <button 
            onClick={onToggleRepeat}
            className={`p-2 rounded-full transition-colors cursor-pointer hover:bg-neutral-900/5 ${isRepeat ? 'text-accent-gold' : 'text-secondary-text/60'}`}
          >
            <Repeat size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Unified Editorial Row: Volume | Playlist Name | Current Time (Columns 5 to 12) */}
        <div className="col-span-12 md:col-span-8 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 border-t md:border-t-0 md:border-l border-[#6E6A66]/10 pt-5 md:pt-0 md:pl-8">
          {/* Volume Control */}
          <div className="flex items-center gap-3 w-full md:w-[170px] xl:w-[200px]">
            <Volume2 size={15} className="text-secondary-text/80" />
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-full h-[3px] bg-neutral-900/5 rounded-full appearance-none cursor-pointer accent-accent-gold focus:outline-none"
              style={{
                background: `linear-gradient(to right, #9B6B43 ${volume}%, rgba(23, 23, 23, 0.05) ${volume}%)`
              }}
            />
            <span className="text-[10px] font-mono text-secondary-text/80 min-w-[28px] text-right">{volume}%</span>
          </div>

          {/* Playlist Name (Center) */}
          <div className="flex items-center gap-2 font-serif text-[13px] text-secondary-text tracking-wide max-w-[50%] truncate">
            <span className="text-[9px] uppercase font-mono tracking-widest text-[#6E6A66]/50">Source:</span>
            <span className="italic font-medium">{playlistName}</span>
          </div>

          {/* Digital Clock (Right) */}
          <div className="flex items-center gap-2 text-typography/90 font-mono text-[11px] tracking-wider">
            <Clock size={13} className="text-accent-gold" />
            <span>{formatClockTime(time)}</span>
          </div>
        </div>
      </div>

      {/* Signature Plaque & Spotify footer row */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between mt-6 pt-5 border-t border-[#6E6A66]/10 gap-3">
        {/* Subtle settings indicator */}
        <div className="flex items-center gap-2 text-secondary-text/50">
          <HelpCircle size={14} className="hover:text-accent-gold cursor-pointer transition-colors" />
        </div>

        {/* Signature Plaque */}
        <div className="text-center">
          <p className="text-[12px] italic text-[#6E6A66]/65 tracking-[0.08em] font-serif">
            Pranav Srikrishnan's Jukebox
          </p>
        </div>

        {/* Brand Integration */}
        <div className="flex items-center gap-1.5 opacity-65 hover:opacity-100 transition-opacity">
          <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="#9B6B43">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.894-.982-.336.076-.67-.135-.746-.472-.076-.336.135-.67.472-.746 3.855-.88 7.15-.502 9.82 1.132.296.18.388.566.208.86zm1.224-2.723c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.076-1.183-.412.125-.845-.107-.97-.52-.125-.413.108-.846.52-.97 3.667-1.112 8.232-.575 11.34 1.336.368.227.488.707.26 1.076zm.105-2.812C14.492 8.71 8.822 8.523 5.538 9.52c-.503.152-1.03-.135-1.182-.638-.152-.502.135-1.03.638-1.182 3.77-1.144 10.02-.93 14.97 2.008.453.27.602.855.333 1.308-.27.453-.855.602-1.308.333z" />
          </svg>
          <span className="text-[10px] font-mono tracking-[0.25em] text-accent-gold uppercase font-bold">Spotify</span>
        </div>
      </div>

    </div>
  );
}
