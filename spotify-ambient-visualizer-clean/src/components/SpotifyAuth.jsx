import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, HelpCircle, ArrowRight, Settings } from 'lucide-react';
import { redirectToAuthCodeFlow } from '../services/spotify';

export default function SpotifyAuth({ onEnterDemo }) {
  console.log("[SpotifyAuth.jsx Render Diagnostic] Welcoming user. Setup active status (VITE_SPOTIFY_CLIENT_ID):", !!import.meta.env.VITE_SPOTIFY_CLIENT_ID);
  const [showSetup, setShowSetup] = useState(false);
  const hasClientId = !!import.meta.env.VITE_SPOTIFY_CLIENT_ID;

  const handleConnect = () => {
    if (hasClientId) {
      redirectToAuthCodeFlow();
    } else {
      alert("Spotify Client ID is not configured. Please see the setup instructions below or enter Ambient Demo Mode.");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F5F1EC] px-6 relative select-none">
      {/* Real analog paper grain overlay */}
      <div className="grain-overlay" />

      {/* Ambient background blob */}
      <div className="absolute w-[50vw] h-[50vw] rounded-full bg-[#9B6B43]/10 blur-[130px] top-[-10%] left-[10%] -z-10" />
      <div className="absolute w-[60vw] h-[60vw] rounded-full bg-[#EFEAE3]/65 blur-[150px] bottom-[-20%] right-[10%] -z-10" />

      <div className="w-full max-w-[650px] flex flex-col items-center text-center">
        {/* Modern minimal branding badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="flex items-center gap-2 mb-8"
        >
          <div className="w-8 h-8 rounded-full border border-[#9B6B43]/35 flex items-center justify-center">
            <Music size={13} className="text-accent-gold" />
          </div>
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-secondary-text">
            Ambient Canvas
          </span>
        </motion.div>

        {/* Big Premium Editorial Header */}
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="font-serif text-[44px] md:text-[56px] font-[300] text-typography leading-[1.1] tracking-tight mb-6"
        >
          The Minimalist <br />
          <span className="italic font-[400] text-accent-gold">Listening Room</span>
        </motion.h1>

        {/* Body context */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.4 }}
          className="font-sans text-[#6E6A66] text-sm md:text-base font-[300] leading-relaxed max-w-[480px] mb-12 text-balance"
        >
          A calm, atmospheric, and high-fidelity 'Now Playing' showcase designed to run fullscreen on a TV or secondary monitor while music fills your room.
        </motion.p>

        {/* Call to Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center mb-16"
        >
          {/* Primary Spotify Connect */}
          <button
            onClick={handleConnect}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-accent-gold hover:bg-accent-dark text-[#F5F1EC] font-sans font-medium text-sm transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 group"
          >
            <span>Connect Spotify Account</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
          </button>

          {/* Secondary Demo Play */}
          <button
            onClick={onEnterDemo}
            className="w-full sm:w-auto px-8 py-4 rounded-full border border-neutral-900/10 hover:border-neutral-900/25 bg-[#EFEAE3]/30 text-typography font-sans font-medium text-sm transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Explore Demo Gallery</span>
          </button>
        </motion.div>

        {/* Interactive expandable developer setup guide */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <button
            onClick={() => setShowSetup(!showSetup)}
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#6E6A66] hover:text-accent-gold cursor-pointer py-2 transition-colors border-b border-[#6E6A66]/10"
          >
            <Settings size={11} />
            <span>{showSetup ? "Hide developer instructions" : "Show developer setup instructions"}</span>
          </button>

          <AnimatePresence>
            {showSetup && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                className="overflow-hidden mt-6 text-left"
              >
                <div className="p-6 rounded-2xl bg-[#EFEAE3]/50 border border-neutral-900/5 backdrop-blur-md text-xs font-sans text-secondary-text leading-relaxed">
                  <h3 className="font-serif font-bold text-typography text-sm mb-3">Spotify Web API Integration Setup</h3>
                  <p className="mb-4">To sync your active playback from the official Spotify server, configure your local environment by following these simple steps:</p>
                  
                  <ol className="list-decimal list-inside space-y-2.5 font-mono text-[11px] text-secondary-text">
                    <li>Go to <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer" className="text-accent-gold underline hover:text-accent-dark">Spotify Developer Dashboard</a> and register a new App.</li>
                    <li>Inside your Spotify App settings, add the redirect URI: <br />
                      <span className="text-typography bg-neutral-900/5 px-1 py-0.5 rounded select-all font-sans">http://127.0.0.1:3000</span>
                    </li>
                    <li>Copy your <strong className="text-typography font-sans">Client ID</strong>.</li>
                    <li>Create a <code className="text-typography bg-neutral-900/5 px-1 py-0.5 rounded font-mono font-bold">.env</code> file in your project root with the keys:
                      <pre className="mt-2 p-3 bg-neutral-900/5 border border-neutral-900/5 rounded font-mono text-[10px] text-typography whitespace-pre-wrap select-all">
{`VITE_SPOTIFY_CLIENT_ID=your_actual_spotify_client_id_here
VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000`}
                      </pre>
                    </li>
                  </ol>

                  {/* Environment Status Badge */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#6E6A66]/10 text-[10px] font-mono">
                    <span>Local Config Status:</span>
                    {hasClientId ? (
                      <span className="text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded font-bold">Configured (Client ID Found)</span>
                    ) : (
                      <span className="text-amber-700 bg-amber-100/50 px-2 py-0.5 rounded font-bold">Unconfigured (Using fallback redirect or Demo Mode)</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Subtle Aesthetic Footer */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-serif text-[11px] italic text-[#6E6A66]/40 select-none pointer-events-none text-center">
        "Music wash away from the soul the dust of everyday life." — Berthold Auerbach
      </div>
    </div>
  );
}
