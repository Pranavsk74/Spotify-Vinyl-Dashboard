import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, Settings, Sparkles, RefreshCw } from 'lucide-react';

import { spotify, initAuth, logout } from './services/spotify';
import AmbientBackground from './components/AmbientBackground';
import VinylPlayer from './components/VinylPlayer';
import TypographyZone from './components/TypographyZone';
import ArtistCard from './components/ArtistCard';
import BottomControls from './components/BottomControls';
import SpotifyAuth from './components/SpotifyAuth';

// Premium preset songs for offline Ambient Demo Mode
const DEMO_TRACKS = [
  {
    id: 'demo1',
    name: 'Blood Bank',
    artists: [{ name: 'Bon Iver' }],
    albumName: 'Blood Bank EP',
    albumArt: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=600&auto=format&fit=crop',
    artistImage: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop',
    genre: 'Indie Folk',
    location: 'Eau Claire, USA',
    year: '2007',
    duration: '5:32',
    durationMs: 332000,
    energy: 0.42,
    mood: 'Calm',
    danceability: 0.35,
    acousticness: 0.78,
    quote: 'Music is the space between the notes.',
    contextName: 'For Emma, Forever Ago',
    colors: { primary: '#9B6B43', secondary: '#D1C7BD', accent: '#8B5E3C' }
  },
  {
    id: 'demo2',
    name: 'Merry Christmas Mr. Lawrence',
    artists: [{ name: 'Ryuichi Sakamoto' }],
    albumName: 'Cinematique Classics',
    albumArt: 'https://images.unsplash.com/photo-1552422535-c45813c61732?q=80&w=600&auto=format&fit=crop',
    artistImage: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=600&auto=format&fit=crop',
    genre: 'Ambient Classical',
    location: 'Tokyo, Japan',
    year: '1983',
    duration: '4:36',
    durationMs: 276000,
    energy: 0.28,
    mood: 'Dreamy',
    danceability: 0.22,
    acousticness: 0.90,
    quote: 'The piano is an extension of my hands and mind.',
    contextName: 'Ryuichi Sakamoto Essentials',
    colors: { primary: '#5C6B5E', secondary: '#F5F1EC', accent: '#3D4F40' }
  },
  {
    id: 'demo3',
    name: 'Veridis Quo',
    artists: [{ name: 'Daft Punk' }],
    albumName: 'Discovery',
    albumArt: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=600&auto=format&fit=crop',
    artistImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop',
    genre: 'Retro Synthesizer',
    location: 'Paris, France',
    year: '2001',
    duration: '5:44',
    durationMs: 344000,
    energy: 0.58,
    mood: 'Melancholic',
    danceability: 0.65,
    acousticness: 0.12,
    quote: 'A cinematic space odyssey in standard time.',
    contextName: 'Discovery (Remastered)',
    colors: { primary: '#2B4C7E', secondary: '#EFEAE3', accent: '#183054' }
  }
];

// Fallback HSL color palette generator for standard Spotify API items
const generateEditorialPalette = (songName, artistName) => {
  const key = `${songName || ''}-${artistName || ''}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const baseHue = Math.abs(hash % 360);
  const secondaryHue = (baseHue + 45) % 360;
  
  return {
    primary: `hsl(${baseHue}, 28%, 56%)`,
    secondary: `hsl(${secondaryHue}, 20%, 78%)`,
    accent: `hsl(${(baseHue + 180) % 360}, 24%, 42%)`
  };
};

export default function App() {
  const [token, setToken] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  
  // Playback and Song States
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressMs, setProgressMs] = useState(0);
  const [volume, setVolume] = useState(50);
  
  // Extra telemetry and metadata with ultra-safe defaults
  const [trackEnergy, setTrackEnergy] = useState(0.42);
  const [trackMood, setTrackMood] = useState('Calm');
  const [trackDanceability, setTrackDanceability] = useState(0.5);
  const [trackAcousticness, setTrackAcousticness] = useState(0.5);
  const [playlistName, setPlaylistName] = useState('Liked Songs');
  const [artistMetadata, setArtistMetadata] = useState({
    genre: 'Ambient',
    location: 'Studio Session',
    year: '2026',
    artistImage: null
  });
  const [ambientColors, setAmbientColors] = useState({
    primary: '#9B6B43',
    secondary: '#EFEAE3',
    accent: '#8B5E3C'
  });

  // Spotify UI telemetry alert trigger
  const [premiumAlert, setPremiumAlert] = useState(false);

  // Demo track indexing
  const [demoIndex, setDemoIndex] = useState(0);

  // Polling tracker references
  const pollingRef = useRef(null);
  const progressTimerRef = useRef(null);

  // 1. Unified Router-less Authentication State Machine on Mount
  useEffect(() => {
    const handleAuth = async () => {
      setIsAuthenticating(true);
      const startTime = Date.now();
      try {
        const auth = await initAuth();
        if (auth.error) {
          setAuthError(auth.error);
        } else if (auth.token) {
          setToken(auth.token);
          setIsDemoMode(false);
        } else {
          // No active session
        }
      } catch (err) {
        setAuthError(`Authentication initialization failed: ${err.message || err}`);
      } finally {
        setIsAuthenticating(false);
      }
    };

    handleAuth();
  }, []);

  // 2. Main Player Control Engine (Split between Demo and Real Spotify API)
  useEffect(() => {
    if (isDemoMode) {
      loadDemoSong(demoIndex);
      return;
    }

    if (token) {
      fetchCurrentlyPlaying();
      pollingRef.current = setInterval(fetchCurrentlyPlaying, 4000); // Poll every 4s
      return () => clearInterval(pollingRef.current);
    }
  }, [token, isDemoMode]);

  // 3. Simulated progress timer loop
  useEffect(() => {
    if (isPlaying) {
      progressTimerRef.current = setInterval(() => {
        setProgressMs(prev => {
          if (currentTrack && prev >= currentTrack.durationMs) {
            if (isDemoMode) {
              handleNextTrack();
              return 0;
            }
            return prev;
          }
          return prev + 1000;
        });
      }, 1000);
    } else {
      clearInterval(progressTimerRef.current);
    }

    return () => clearInterval(progressTimerRef.current);
  }, [isPlaying, currentTrack, isDemoMode, demoIndex]);

  // --- DEMO LOADER FUNCTIONS ---
  const loadDemoSong = (index) => {
    const track = DEMO_TRACKS[index];
    setCurrentTrack(track);
    setProgressMs(0);
    setIsPlaying(true);
    setTrackEnergy(track.energy ?? 0.42);
    setTrackMood(track.mood ?? 'Calm');
    setTrackDanceability(track.danceability ?? 0.5);
    setTrackAcousticness(track.acousticness ?? 0.5);
    setPlaylistName(track.contextName || 'Offline Acoustic Playlist');
    setAmbientColors(track.colors);
    setArtistMetadata({
      genre: track.genre,
      location: track.location,
      year: track.year,
      artistImage: track.artistImage
    });
  };

  // --- SPOTIFY WEB API GETTER ---
  const fetchCurrentlyPlaying = async () => {
    try {
      const playback = await spotify.getCurrentlyPlaying();
      if (!playback) {
        // Safe placeholder setup when no Spotify playback is actively running (STATE 3 fallback)
        setCurrentTrack({
          id: 'placeholder',
          name: 'Ambient Room Waiting...',
          artists: [{ name: 'Open Spotify & Play a Song' }],
          albumName: 'System Awaiting Feed',
          albumArt: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=600&auto=format&fit=crop',
          durationMs: 300000,
        });
        setProgressMs(0);
        setIsPlaying(false);
        setAmbientColors({ primary: '#6E6A66', secondary: '#EFEAE3', accent: '#9B6B43' });
        setPlaylistName('Liked Songs');
        setArtistMetadata({
          genre: 'Ambient',
          location: 'System Awaiting Feed',
          year: new Date().getFullYear(),
          artistImage: null
        });
        return;
      }

      const isSongSwitched = !currentTrack || currentTrack.id !== playback?.id || currentTrack.id === 'placeholder';
      
      setCurrentTrack(playback);
      setIsPlaying(playback?.isPlaying ?? false);
      setProgressMs(playback?.progressMs ?? 0);

      if (isSongSwitched) {
        const editorialPalette = generateEditorialPalette(playback?.name, playback?.artists?.[0]?.name);
        setAmbientColors(editorialPalette);

        // Fetch context name concurrently with elegant fallbacks
        const fetchPlaylistName = async () => {
          let pName = 'Liked Songs';
          if (playback?.context) {
            const type = playback.context.type;
            const uri = playback.context.uri || '';
            if (type === 'playlist') {
              const playlistId = uri.split(':').pop();
              try {
                const playlistData = await spotify.request(`/playlists/${playlistId}`);
                if (playlistData && playlistData.name) {
                  pName = playlistData.name;
                } else {
                  pName = playback.albumName || 'Playing from Queue';
                }
              } catch {
                pName = playback.albumName || 'Playing from Queue';
              }
            } else if (type === 'album') {
              pName = playback.albumName || 'Playing from Queue';
            } else if (type === 'artist') {
              pName = `This Is ${playback.artists?.[0]?.name || 'Artist'}`;
            } else {
              pName = 'Playing from Queue';
            }
          } else {
            pName = 'Liked Songs';
          }
          setPlaylistName(pName);
        };
        fetchPlaylistName();

        const [features, artist] = await Promise.all([
          spotify.getAudioFeatures(playback?.id),
          spotify.getArtistDetails(playback?.artists?.[0]?.id)
        ]);

        if (features) {
          setTrackEnergy(features.energy ?? 0.42);
          setTrackDanceability(features.danceability ?? 0.5);
          setTrackAcousticness(features.acousticness ?? 0.5);
          
          const v = features.valence ?? 0.5;
          if (v < 0.3) setTrackMood('Melancholic');
          else if (v < 0.5) setTrackMood('Calm');
          else if (v < 0.7) setTrackMood('Dreamy');
          else setTrackMood('Vibrant');
        } else {
          setTrackEnergy(0.45);
          setTrackMood('Dreamy');
          setTrackDanceability(0.5);
          setTrackAcousticness(0.5);
        }

        if (artist) {
          const genres = Array.isArray(artist.genres) ? artist.genres : [];
          const images = Array.isArray(artist.images) ? artist.images : [];
          setArtistMetadata({
            genre: genres?.[0] ? genres[0].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Ambient',
            location: 'Synced API Feed',
            year: new Date().getFullYear(),
            artistImage: images?.[0]?.url || images?.[1]?.url || playback?.albumArt || null
          });
        } else {
          setArtistMetadata({
            genre: 'Ambient Sync',
            location: 'Spotify Feed',
            year: new Date().getFullYear(),
            artistImage: playback?.albumArt || null
          });
        }
      }
    } catch (error) {
      if (error.message === 'TOKEN_EXPIRED') {
        localStorage.removeItem('spotify_token');
        setToken(null);
      } else if (error.message === 'PREMIUM_REQUIRED') {
        setPremiumAlert(true);
        setIsDemoMode(true);
      } else if (error.message === 'FORBIDDEN') {
        // Robust fallback: Do NOT log the user out, preserve token, let them stay in STATE 3 waiting room.
        if (!currentTrack) {
          setCurrentTrack({
            id: 'placeholder',
            name: 'Ambient Room Waiting...',
            artists: [{ name: 'Open Spotify & Play a Song' }],
            albumName: 'System Awaiting Feed',
            albumArt: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=600&auto=format&fit=crop',
            durationMs: 300000,
          });
          setProgressMs(0);
          setIsPlaying(false);
          setAmbientColors({ primary: '#6E6A66', secondary: '#EFEAE3', accent: '#9B6B43' });
        }
      } else {
        // Resilient network/rate-limit fallback: do not kick out the user, just transition to STATE 3 (ambient idle)
        if (!currentTrack) {
          setCurrentTrack({
            id: 'placeholder',
            name: 'Ambient Room Waiting...',
            artists: [{ name: 'Open Spotify & Play a Song' }],
            albumName: 'System Awaiting Feed',
            albumArt: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=600&auto=format&fit=crop',
            durationMs: 300000,
          });
          setProgressMs(0);
          setIsPlaying(false);
          setAmbientColors({ primary: '#6E6A66', secondary: '#EFEAE3', accent: '#9B6B43' });
        }
      }
    }
  };

  // --- PLAYBACK CONTROL HANDLERS ---
  const handleTogglePlay = async () => {
    if (isDemoMode) {
      setIsPlaying(!isPlaying);
      return;
    }

    try {
      if (isPlaying) {
        await spotify.pause();
        setIsPlaying(false);
      } else {
        await spotify.play();
        setIsPlaying(true);
      }
    } catch (err) {
      if (err.message === 'PREMIUM_REQUIRED') {
        setPremiumAlert(true);
        setIsPlaying(!isPlaying);
      }
    }
  };

  const handleNextTrack = async () => {
    if (isDemoMode) {
      const nextIdx = (demoIndex + 1) % DEMO_TRACKS.length;
      setDemoIndex(nextIdx);
      loadDemoSong(nextIdx);
      return;
    }

    try {
      await spotify.next();
      setTimeout(fetchCurrentlyPlaying, 500);
    } catch (err) {
      if (err.message === 'PREMIUM_REQUIRED') {
        setPremiumAlert(true);
        const nextIdx = (demoIndex + 1) % DEMO_TRACKS.length;
        setDemoIndex(nextIdx);
        loadDemoSong(nextIdx);
      }
    }
  };

  const handlePreviousTrack = async () => {
    if (isDemoMode) {
      const prevIdx = (demoIndex - 1 + DEMO_TRACKS.length) % DEMO_TRACKS.length;
      setDemoIndex(prevIdx);
      loadDemoSong(prevIdx);
      return;
    }

    try {
      await spotify.previous();
      setTimeout(fetchCurrentlyPlaying, 500);
    } catch (err) {
      if (err.message === 'PREMIUM_REQUIRED') {
        setPremiumAlert(true);
        const prevIdx = (demoIndex - 1 + DEMO_TRACKS.length) % DEMO_TRACKS.length;
        setDemoIndex(prevIdx);
        loadDemoSong(prevIdx);
      }
    }
  };

  const handleVolumeChange = async (newVal) => {
    setVolume(newVal);
    if (isDemoMode) return;

    try {
      await spotify.setVolume(newVal);
    } catch (err) {
      // Fluid telemetry slide support
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error("Fullscreen initiation failure: ", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // ==========================================
  // CENTRALIZED STATE MACHINE DERIVATION
  // ==========================================
  const isInitializing = isAuthenticating || (!!token && !isDemoMode && !currentTrack && !authError);
  const isAuthenticated = !!token || isDemoMode;
  const isPlaybackAvailable = isDemoMode || (!!currentTrack && currentTrack.id !== 'placeholder');

  const appState = {
    initializing: isInitializing,
    authenticated: isAuthenticated,
    playbackAvailable: isPlaybackAvailable,
    playbackData: isPlaybackAvailable ? currentTrack : {
      id: 'placeholder',
      name: 'Ambient Room Waiting...',
      artists: [{ name: 'Open Spotify & Play a Song' }],
      albumName: 'System Awaiting Feed',
      albumArt: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=600&auto=format&fit=crop',
      durationMs: 300000,
      contextName: 'System Awaiting Feed'
    }
  };

  // STATE 1 — INITIALIZING
  if (appState.initializing) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F5F1EC] px-6 select-none relative">
        <div className="grain-overlay" />
        <div className="absolute w-[50vw] h-[50vw] rounded-full bg-[#9B6B43]/10 blur-[130px] top-[-10%] left-[10%] -z-10 animate-pulse-slow" />
        
        <div className="flex flex-col items-center text-center max-w-[400px] animate-fade-in">
          <div className="w-12 h-12 rounded-full border border-[#9B6B43]/30 flex items-center justify-center mb-6 animate-spin">
            <div className="w-2.5 h-2.5 rounded-full bg-[#9B6B43]" />
          </div>
          <h2 className="font-serif text-2xl font-light text-typography tracking-wide mb-2">Syncing listening room...</h2>
          <p className="font-sans text-xs text-secondary-text/80 tracking-widest uppercase">Connecting with Spotify API</p>
        </div>
      </div>
    );
  }

  // STATE 2 — UNAUTHENTICATED
  if (!appState.authenticated) {
    if (authError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F5F1EC] px-6 select-none relative">
          <div className="grain-overlay" />
          <div className="flex flex-col items-center text-center max-w-[480px] animate-fade-in">
            <h2 className="font-serif text-2.5xl font-light text-typography tracking-wide mb-4 text-[#8B5E3C]">Connection Failed</h2>
            <p className="font-sans text-sm text-secondary-text leading-relaxed mb-8">{authError}</p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setAuthError(null);
                  setToken(null);
                  logout();
                }}
                className="px-6 py-3 rounded-full bg-[#9B6B43] text-white text-xs font-medium uppercase tracking-widest hover:bg-[#8B5E3C] cursor-pointer shadow-sm hover:shadow"
              >
                Back to Login
              </button>
              <button
                onClick={() => {
                  setAuthError(null);
                  setIsDemoMode(true);
                }}
                className="px-6 py-3 rounded-full border border-neutral-900/10 text-typography text-xs font-medium uppercase tracking-widest hover:bg-[#EFEAE3] cursor-pointer"
              >
                Enter Demo Mode
              </button>
            </div>
          </div>
        </div>
      );
    }
    return <SpotifyAuth onEnterDemo={() => setIsDemoMode(true)} />;
  }

  // STATES 3 & 4 — AUTHENTICATED (WITH OR WITHOUT ACTIVE SPOTIFY PLAYBACK)
  const displayTrack = appState.playbackData;
  const artistsStr = displayTrack?.artists?.map(a => a?.name || 'Unknown Artist').join(', ') || 'Various Artists';

  // Determine configuration settings dynamically depending on playback availability
  const isPlayingActive = isPlaying && appState.playbackAvailable;
  
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between p-6 md:p-10 select-none overflow-hidden animate-fade-in">
      
      <AmbientBackground colors={ambientColors} isPlaying={isPlayingActive} />

      {/* TOP HEADER ROW */}
      <div className="w-full flex items-center justify-between border-b border-neutral-900/5 pb-4 select-none">
        
        <div className="flex items-center gap-2">
          <div className="w-[18px] h-[18px] rounded-full border border-accent-gold/40 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
          </div>
          <span className="font-serif text-[13px] tracking-[0.15em] uppercase font-bold text-typography">
            Ambient Canvas
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-gold opacity-75 ${isPlayingActive ? 'block' : 'hidden'}`}></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-gold"></span>
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#6E6A66]">
              {isDemoMode ? 'Ambient Gallery Mode' : appState.playbackAvailable ? 'Connected Live' : 'Listening Deck Idle'}
            </span>
          </div>

          <button 
            onClick={handleToggleFullscreen}
            className="p-1.5 rounded-full border border-neutral-900/5 hover:border-neutral-900/15 transition-all text-secondary-text hover:text-typography cursor-pointer"
            title="Toggle TV Fullscreen Room"
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          {isDemoMode && (
            <button 
              onClick={() => {
                setIsDemoMode(false);
                setToken(null);
                logout();
              }}
              className="text-[9px] font-mono uppercase tracking-widest text-[#6E6A66] hover:text-accent-gold transition-colors py-1 px-3 border border-[#6E6A66]/20 rounded-full cursor-pointer bg-[#EFEAE3]/20"
            >
              Exit Demo
            </button>
          )}
        </div>
      </div>

      {/* CORE CANVAS: THREE-COLUMN CINEMATIC GRID */}
      <div className="w-full my-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-center">
          
          {/* Column 1: Vinyl Player (Static in STATE 3, Spinning in STATE 4 when playing) */}
          <div className="col-span-12 lg:col-span-4 flex items-center justify-center">
            <VinylPlayer 
              albumArt={displayTrack?.albumArt} 
              isPlaying={isPlayingActive} 
              onTogglePlay={handleTogglePlay}
              trackName={displayTrack?.name}
            />
          </div>

          {/* Column 2: Typography Zone (Muted calm waveforms in STATE 3, Dynamic live ones in STATE 4) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col justify-center">
            <TypographyZone 
              trackName={displayTrack?.name} 
              artists={artistsStr} 
              progressMs={appState.playbackAvailable ? progressMs : 0} 
              durationMs={displayTrack?.durationMs || 300000} 
              isPlaying={isPlayingActive} 
              energy={appState.playbackAvailable ? trackEnergy : 0.08}
              danceability={appState.playbackAvailable ? trackDanceability : 0.08}
              acousticness={appState.playbackAvailable ? trackAcousticness : 0.85}
              contextName={appState.playbackAvailable ? playlistName : 'System Awaiting Feed'}
            />
          </div>

          {/* Column 3: Artist Showcase Card (Gracefully falls back to beautiful aesthetic portrait / album art) */}
          <div className="col-span-12 lg:col-span-4 flex items-center justify-center">
            <ArtistCard 
              artistName={displayTrack?.artists?.[0]?.name}
              albumArt={displayTrack?.albumArt}
              artistImage={appState.playbackAvailable ? artistMetadata.artistImage : null}
              genre={appState.playbackAvailable ? artistMetadata.genre : 'Ambient'}
              location={appState.playbackAvailable ? artistMetadata.location : 'System Awaiting Feed'}
              year={appState.playbackAvailable ? artistMetadata.year : new Date().getFullYear()}
              duration={displayTrack?.duration || '5:00'}
            />
          </div>

        </div>
      </div>

      {/* BOTTOM CONTROLS AND TELEMETRY PANEL */}
      <div className="w-full select-none">
        <BottomControls 
          isPlaying={isPlayingActive}
          onTogglePlay={handleTogglePlay}
          onNext={handleNextTrack}
          onPrevious={handlePreviousTrack}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          playlistName={appState.playbackAvailable ? playlistName : 'Awaiting Playback'}
          isShuffle={false}
          onToggleShuffle={() => {}}
          isRepeat={true}
          onToggleRepeat={() => {}}
          isPremiumRestricted={premiumAlert}
          onDismissPremiumAlert={() => setPremiumAlert(false)}
        />
      </div>

    </div>
  );
}


