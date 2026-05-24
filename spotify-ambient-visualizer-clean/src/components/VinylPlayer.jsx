import React, { useRef, useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VinylPlayer = memo(function VinylPlayer({ albumArt, isPlaying, onTogglePlay, trackName }) {
  const [rotation, setRotation] = useState(0);
  const [wobble, setWobble] = useState(0);
  
  const requestRef = useRef();
  const previousTimeRef = useRef();
  
  // Physics states
  const speedRef = useRef(0);
  const targetSpeedRef = useRef(isPlaying ? 0.6 : 0); // Degrees per frame (~33 RPM)
  const rotationRef = useRef(0);

  // Sync isPlaying with target speed
  useEffect(() => {
    // 0.3 degrees per frame is 18 deg/s (exactly 20 seconds per full 360deg revolution)
    targetSpeedRef.current = isPlaying ? 0.3 : 0;
  }, [isPlaying]);

  // Inertia simulation loop
  useEffect(() => {
    const animate = (time) => {
      if (previousTimeRef.current !== undefined) {
        // Accelerate or decelerate speed based on target speed
        const currentSpeed = speedRef.current;
        const targetSpeed = targetSpeedRef.current;
        
        if (targetSpeed > currentSpeed) {
          // Accelerate smoothly
          speedRef.current += (targetSpeed - currentSpeed) * 0.02;
        } else {
          // Decelerate smoothly (analog friction inertia)
          speedRef.current += (targetSpeed - currentSpeed) * 0.01;
        }

        // Apply friction when very close to zero
        if (Math.abs(speedRef.current - targetSpeed) < 0.001) {
          speedRef.current = targetSpeed;
        }

        // Update rotation
        rotationRef.current = (rotationRef.current + speedRef.current) % 360;
        setRotation(rotationRef.current);

        // Add subtle physical analog wobble
        if (speedRef.current > 0) {
          const wobbleFreq = 0.01;
          const wobbleAmp = 0.45; // Subtle translation wobble
          const currentWobble = Math.sin(time * wobbleFreq) * wobbleAmp * (speedRef.current / 0.3);
          setWobble(currentWobble);
        } else {
          setWobble(0);
        }
      }
      
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full select-none">
      {/* Vinyl record container */}
      <div className="relative group">
        {/* Glow behind the vinyl player */}
        <motion.div
          className="absolute inset-0 rounded-full bg-accent-gold/15 blur-[60px] pointer-events-none transition-all duration-1000"
          animate={{
            scale: isPlaying ? [1, 1.05, 0.98, 1] : 0.9,
            opacity: isPlaying ? 0.8 : 0.4,
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Outer subtle guide ring */}
        <div className="absolute inset-[-18px] rounded-full border border-[#9B6B43]/10 pointer-events-none scale-100 group-hover:scale-[1.01] transition-transform duration-700 ease-out" />
        
        {/* Vinyl Disc - grooved base remains static, only physical wobble translation is applied */}
        <motion.div
          onClick={onTogglePlay}
          className="relative w-[340px] h-[340px] md:w-[380px] md:h-[380px] xl:w-[410px] xl:h-[410px] rounded-full cursor-pointer flex items-center justify-center overflow-hidden active:scale-98 transition-transform duration-500 shadow-2xl"
          style={{
            transform: `translate(${wobble}px, ${wobble * 0.5}px)`,
          }}
          whileHover={{ scale: 1.02 }}
        >
          {/* Vinyl solid base and texture */}
          <div className="absolute inset-0 rounded-full bg-neutral-900 vinyl-texture" />
          
          {/* Micro-grooves */}
          <div className="absolute inset-0 rounded-full vinyl-grooves" />
          
          {/* Conic lighting sheen reflection */}
          <div className="absolute inset-0 rounded-full vinyl-sheen" />

          {/* Central paper label containing the song poster / album art - ONLY center label rotates */}
          <div 
            className="absolute w-[120px] h-[120px] md:w-[140px] md:h-[140px] rounded-full bg-[#EFEAE3] shadow-inner flex items-center justify-center p-1.5 border border-[#9B6B43]/15"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {/* Center Album Art Photo clipped to a perfect circle */}
            <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-[#F5F1EC] shadow-md border border-[#9B6B43]/5">
              <AnimatePresence>
                <motion.img
                  key={albumArt}
                  src={albumArt}
                  alt={trackName || 'Album art'}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
                />
              </AnimatePresence>
              
              {/* Subtle gold center label ring overlay */}
              <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
              
              {/* Central spindle hole spindle ring */}
              <div className="absolute w-[24px] h-[24px] md:w-[28px] md:h-[28px] rounded-full bg-neutral-900 shadow-lg border-[3px] border-[#EFEAE3] flex items-center justify-center">
                <div className="w-[6px] h-[6px] rounded-full bg-[#F5F1EC]" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating subtle guidance text */}
      <motion.p
        className="mt-8 text-[11px] uppercase tracking-[0.25em] font-mono text-[#6E6A66] select-none pointer-events-none"
        animate={{ opacity: isPlaying ? 0.35 : [0.35, 0.75, 0.35] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        {isPlaying ? 'Click Vinyl to Pause' : 'Click Vinyl to Spin'}
      </motion.p>
    </div>
  );
});

export default VinylPlayer;
