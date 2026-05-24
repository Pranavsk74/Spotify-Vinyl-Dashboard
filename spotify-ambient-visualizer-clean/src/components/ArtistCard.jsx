import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ArtistCard = memo(function ArtistCard({ 
  artistName, 
  albumArt, 
  artistImage, 
  genre, 
  location, 
  year, 
  duration 
}) {
  // If artist image isn't available, we fallback to album art, which also looks stunning
  const displayImage = artistImage || albumArt;

  return (
    <motion.div 
      className="flex flex-col items-center justify-center h-full px-6 select-none"
      animate={{
        y: [0, -6, 0, 6, 0],
        x: [0, 2, -2, 1, 0],
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {/* Editorial Card Container */}
      <div className="w-[280px] md:w-[320px] xl:w-[340px] rounded-[24px] bg-[#EFEAE3]/30 border border-neutral-900/5 p-4 shadow-[0_12px_36px_rgba(23,23,23,0.03)] backdrop-blur-md">
        
        {/* Aspect Ratio Image Container */}
        <div className="w-full aspect-[4/5] rounded-[18px] overflow-hidden bg-[#F5F1EC] relative shadow-[inset_0_0_15px_rgba(0,0,0,0.03)] border border-neutral-900/5">
          <AnimatePresence>
            <motion.img
              key={displayImage}
              src={displayImage}
              alt={artistName || 'Artist portrait'}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none filter sepia-[0.08] contrast-[0.92] saturate-[0.8]"
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
            />
          </AnimatePresence>
          
          {/* Subtle warm overlay on the image */}
          <div className="absolute inset-0 bg-[#9B6B43]/5 mix-blend-color pointer-events-none" />
        </div>

        {/* Typographic Metadata Container */}
        <div className="text-left mt-5 px-1 pb-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={artistName + genre}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="font-serif text-[20px] md:text-[23px] font-[400] text-typography tracking-wide">
                {artistName || 'Unknown Artist'}
              </h2>
              
              {/* Detailed subtle line info */}
              <div className="flex flex-wrap items-center gap-[6px] font-sans text-[11px] font-[400] text-secondary-text uppercase tracking-widest mt-2">
                <span>{genre || 'Ambient'}</span>
                {location && (
                  <>
                    <span className="text-accent-gold/40">•</span>
                    <span>{location}</span>
                  </>
                )}
              </div>

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
});

export default ArtistCard;
