import React, { memo } from 'react';
import { motion } from 'framer-motion';

const AmbientBackground = memo(function AmbientBackground({ colors, isPlaying }) {
  // Safe defaults if no colors are extracted
  const primary = colors?.primary || '#9B6B43';
  const secondary = colors?.secondary || '#EFEAE3';
  const accent = colors?.accent || '#8B5E3C';

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-[#F5F1EC] -z-10 transition-colors duration-1000">
      {/* Dynamic atmospheric radial glow blobs */}
      <motion.div
        className="absolute w-[80vw] h-[80vw] md:w-[60vw] md:h-[60vw] rounded-full blur-[40px] opacity-40 mix-blend-multiply"
        style={{
          background: `radial-gradient(circle, ${primary} 0%, rgba(245,241,236,0) 70%)`,
          top: '-10%',
          left: '-10%',
        }}
        animate={
          isPlaying
            ? {
                x: [0, 40, -20, 0],
                y: [0, -30, 20, 0],
                scale: [1, 1.1, 0.95, 1],
              }
            : {}
        }
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute w-[90vw] h-[90vw] md:w-[70vw] md:h-[70vw] rounded-full blur-[45px] opacity-30 mix-blend-multiply"
        style={{
          background: `radial-gradient(circle, ${secondary} 0%, rgba(245,241,236,0) 75%)`,
          bottom: '-20%',
          right: '-10%',
        }}
        animate={
          isPlaying
            ? {
                x: [0, -30, 30, 0],
                y: [0, 40, -10, 0],
                scale: [1, 0.95, 1.05, 1],
              }
            : {}
        }
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute w-[50vw] h-[50vw] rounded-full blur-[35px] opacity-20 mix-blend-multiply"
        style={{
          background: `radial-gradient(circle, ${accent} 0%, rgba(245,241,236,0) 70%)`,
          top: '30%',
          left: '40%',
        }}
        animate={
          isPlaying
            ? {
                x: [0, 20, -30, 0],
                y: [0, 30, -20, 0],
                scale: [0.9, 1.1, 1, 0.9],
              }
            : {}
        }
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Dim overlay for idle/paused state */}
      <motion.div
        className="absolute inset-0 bg-[#171717] pointer-events-none mix-blend-color-burn"
        initial={{ opacity: 0 }}
        animate={{ opacity: isPlaying ? 0.02 : 0.08 }}
        transition={{ duration: 2 }}
      />
      
      {/* Subtle warm tint overlay */}
      <div className="absolute inset-0 bg-[#F5F1EC] opacity-30 mix-blend-overlay pointer-events-none" />

      {/* Real analog paper grain overlay */}
      <div className="grain-overlay" />
    </div>
  );
});

export default AmbientBackground;
