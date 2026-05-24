// Spotify Web API Integration Service using Single-Path Authorization Code Flow with PKCE

// Scopes required for ambient now playing visualization
const SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-modify-playback-state'
];

// PKCE Cryptographic helper utilities
const generateRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
};

const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64urlencode = (buffer) => {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// Generates S256 challenge string
export const generateCodeChallenge = async (codeVerifier) => {
  const hashed = await sha256(codeVerifier);
  return base64urlencode(hashed);
};

// central API: Exchange Authorization Code for Access & Refresh Tokens
export const exchangeCode = async (code) => {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || window.location.origin;
  const codeVerifier = localStorage.getItem('spotify_code_verifier');

  console.log("[spotify.js PKCE Diagnostic] Starting Token Exchange Handshake", {
    code: code ? `${code.substring(0, 15)}...` : null,
    clientId,
    redirectUri,
    codeVerifier: codeVerifier ? `${codeVerifier.substring(0, 15)}...` : null,
    verifierLength: codeVerifier ? codeVerifier.length : 0
  });

  if (!codeVerifier) {
    console.error("[spotify.js PKCE Diagnostic Error] No code_verifier found in localStorage!");
    throw new Error("Missing spotify_code_verifier in localStorage");
  }

  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  };

  try {
    console.log("[spotify.js PKCE Diagnostic] Dispatching POST fetch request to accounts.spotify.com/api/token...");
    const response = await fetch('https://accounts.spotify.com/api/token', payload);
    
    if (!response.ok) {
      const errText = await response.text();
      console.error("[spotify.js PKCE Diagnostic Error] Token exchange rejected by Spotify:", errText);
      throw new Error(`Token exchange failed: ${errText}`);
    }

    const data = await response.json();
    console.log("[spotify.js PKCE Diagnostic] Token exchange successful! Response payload metadata:", {
      has_access_token: !!data.access_token,
      access_token_prefix: data.access_token ? data.access_token.substring(0, 10) : null,
      has_refresh_token: !!data.refresh_token,
      refresh_token_prefix: data.refresh_token ? data.refresh_token.substring(0, 10) : null,
      expires_in: data.expires_in,
      token_type: data.token_type,
      scope: data.scope
    });
    
    const expiresAt = Date.now() + Number(data.expires_in) * 1000;
    console.log("[spotify.js PKCE Diagnostic] Calculated token expiry:", {
      expiresAt,
      expiresAtISO: new Date(expiresAt).toISOString(),
      currentTime: Date.now()
    });

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: expiresAt
    };
  } catch (err) {
    console.error("[spotify.js PKCE Diagnostic Error] Exception caught during exchange fetch:", err.message);
    throw err;
  }
};

// central API: Refresh Access Token using Refresh Token
export const refreshAccessToken = async () => {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const refreshToken = localStorage.getItem('spotify_refresh_token');

  console.log("[spotify.js PKCE Diagnostic] Attempting Token Refresh", {
    clientId,
    hasRefreshToken: !!refreshToken
  });

  if (!refreshToken) {
    throw new Error("No refresh token found in localStorage");
  }

  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  };

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', payload);
    if (!response.ok) {
      const errText = await response.text();
      console.error("[spotify.js PKCE Diagnostic Error] Refresh rejected by Spotify:", errText);
      throw new Error("Token refresh attempt failed");
    }

    const data = await response.json();
    const expiresAt = Date.now() + Number(data.expires_in) * 1000;
    
    console.log("[spotify.js PKCE Diagnostic] Token refresh successful. Saving new tokens.");
    localStorage.setItem('spotify_token', data.access_token);
    localStorage.setItem('spotify_expires_at', expiresAt);
    if (data.refresh_token) {
      localStorage.setItem('spotify_refresh_token', data.refresh_token);
    }

    spotify.setToken(data.access_token, expiresAt);
    return data.access_token;
  } catch (err) {
    console.error("[spotify.js PKCE Diagnostic Error] Exception during refresh:", err);
    throw err;
  }
};

let activeExchangePromise = null;

// central API: Initialize Authentication (called once on boot)
export const initAuth = async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const spotifyError = params.get('error');

  console.log("[spotify.js initAuth] Starting initial authentication check. Query parameters:", {
    hasCode: !!code,
    hasError: !!spotifyError
  });

  // 1. Handle error cases redirected from Spotify
  if (spotifyError) {
    console.warn("[spotify.js initAuth] Spotify returned redirect error:", spotifyError);
    window.history.replaceState({}, document.title, "/");
    return { token: null, error: `Spotify authentication rejected: ${spotifyError}` };
  }

  // 2. Handle successful authorization code exchange
  if (code) {
    if (activeExchangePromise) {
      console.log("[spotify.js initAuth] Concurrency Shield: Token exchange already in progress. Awaiting existing promise...");
      return activeExchangePromise;
    }

    console.log("[spotify.js initAuth] Concurrency Shield: Creating new token exchange promise.");
    activeExchangePromise = (async () => {
      try {
        const credentials = await exchangeCode(code);
        
        console.log("[spotify.js initAuth] Token exchange success! Calling localStorage.setItem...", {
          accessTokenPrefix: credentials.accessToken ? credentials.accessToken.substring(0, 10) : null,
          hasRefreshToken: !!credentials.refreshToken,
          expiresAt: credentials.expiresAt
        });
        localStorage.setItem('spotify_token', credentials.accessToken);
        localStorage.setItem('spotify_refresh_token', credentials.refreshToken);
        localStorage.setItem('spotify_expires_at', credentials.expiresAt);
        
        // Immediate read verification
        console.log("[spotify.js initAuth] Calling localStorage.getItem to verify writes:", {
          storedTokenPrefix: localStorage.getItem('spotify_token') ? localStorage.getItem('spotify_token').substring(0, 10) : null,
          storedRefreshToken: !!localStorage.getItem('spotify_refresh_token'),
          storedExpiresAt: localStorage.getItem('spotify_expires_at')
        });

        spotify.setToken(credentials.accessToken, credentials.expiresAt);
        
        console.log("[spotify.js initAuth] URL query parameter sanitized. Redirecting user to listening room.");
        window.history.replaceState({}, document.title, "/");
        return { token: credentials.accessToken, error: null };
      } catch (err) {
        console.error("[spotify.js initAuth] Code exchange promise failed:", err);
        window.history.replaceState({}, document.title, "/");
        return { token: null, error: "Failed to verify Spotify credentials. The authorization code may have expired or client configurations are mismatched." };
      } finally {
        activeExchangePromise = null;
      }
    })();

    return activeExchangePromise;
  }

  // 3. Check for existing non-expired credentials in local storage
  const localToken = localStorage.getItem('spotify_token');
  const localExpires = localStorage.getItem('spotify_expires_at');

  console.log("[spotify.js initAuth] App start check: Calling localStorage.getItem for credentials:", {
    hasToken: !!localToken,
    tokenPrefix: localToken ? localToken.substring(0, 10) : null,
    expiresAt: localExpires ? new Date(Number(localExpires)).toISOString() : null,
    isValid: !!(localToken && localExpires && Number(localExpires) > Date.now()),
    expiresAtRaw: localExpires,
    currentTime: Date.now()
  });

  if (localToken && localExpires && Number(localExpires) > Date.now()) {
    spotify.setToken(localToken, Number(localExpires));
    return { token: localToken, error: null };
  }

  return { token: null, error: null };
};

// central API: Redirect User to Spotify Accounts portal
export const redirectToAuthCodeFlow = async () => {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || window.location.origin;

  console.log("[spotify.js PKCE Diagnostic] Initializing Auth Redirect", {
    clientId,
    redirectUri
  });

  if (!clientId) {
    alert("Spotify Client ID is missing from environment. Please add VITE_SPOTIFY_CLIENT_ID in your .env file.");
    return;
  }

  // Safeguard: Align browser origin with whitelisted Spotify redirectURI to prevent cross-origin local storage verifier loss
  try {
    const targetOrigin = new URL(redirectUri).origin;
    console.log("[spotify.js PKCE Diagnostic] Aligning Origin", {
      currentOrigin: window.location.origin,
      targetOrigin
    });
    if (window.location.origin !== targetOrigin) {
      console.warn("[spotify.js PKCE Diagnostic] Host origin mismatch detected! Redirecting page to target origin:", targetOrigin);
      window.location.href = targetOrigin + window.location.search;
      return;
    }
  } catch (err) {
    console.error("[spotify.js PKCE Diagnostic Error] Invalid redirect URI configuration:", err);
  }

  const verifier = generateRandomString(64);
  const challenge = await generateCodeChallenge(verifier);

  console.log("[spotify.js PKCE Diagnostic] PKCE Credentials Generated", {
    verifier: `${verifier.substring(0, 15)}...`,
    verifierLength: verifier.length,
    challenge: `${challenge.substring(0, 15)}...`
  });

  console.log("[spotify.js PKCE Diagnostic] Writing spotify_code_verifier to localStorage.");
  localStorage.setItem('spotify_code_verifier', verifier);

  const authEndpoint = 'https://accounts.spotify.com/authorize';
  const queryParams = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SCOPES.join(' '),
    code_challenge_method: 'S256',
    code_challenge: challenge,
    show_dialog: 'true'
  });

  const redirectUrl = `${authEndpoint}?${queryParams.toString()}`;
  console.log("[spotify.js PKCE Diagnostic] Initiating final redirect to accounts.spotify.com...", redirectUrl);
  window.location.href = redirectUrl;
};

// central API: Get valid active token
export const getToken = () => {
  const localToken = localStorage.getItem('spotify_token');
  const localExpires = localStorage.getItem('spotify_expires_at');
  if (localToken && localExpires && Number(localExpires) > Date.now()) {
    return localToken;
  }
  return null;
};

// central API: Clear authorization state (Logout)
export const logout = () => {
  localStorage.removeItem('spotify_token');
  localStorage.removeItem('spotify_refresh_token');
  localStorage.removeItem('spotify_expires_at');
  localStorage.removeItem('spotify_code_verifier');
  spotify.setToken(null, null);
};

// Spotify API helper class for request formatting and methods
class SpotifyClient {
  constructor() {
    this.token = null;
    this.expiresAt = null;
  }

  setToken(token, expiresAt) {
    this.token = token;
    this.expiresAt = expiresAt;
  }

  isTokenExpired() {
    return !this.token || (this.expiresAt && Date.now() > this.expiresAt);
  }

  async request(endpoint, options = {}) {
    // Background automatic token refresh
    if (this.isTokenExpired() && localStorage.getItem('spotify_refresh_token')) {
      try {
        const newToken = await refreshAccessToken();
        this.token = newToken;
      } catch (err) {
        console.warn("Background auto-refresh failed. Requesting re-auth.", err);
        throw new Error("TOKEN_EXPIRED");
      }
    }

    if (!this.token) {
      throw new Error("TOKEN_EXPIRED");
    }

    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 204) {
      return null;
    }

    if (response.status === 401) {
      if (localStorage.getItem('spotify_refresh_token')) {
        try {
          const newToken = await refreshAccessToken();
          this.token = newToken;
          return this.request(endpoint, options);
        } catch {
          throw new Error("TOKEN_EXPIRED");
        }
      }
      throw new Error("TOKEN_EXPIRED");
    }

    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData?.error?.reason === 'PREMIUM_REQUIRED' || errorData?.error?.message?.includes('Premium')) {
        throw new Error("PREMIUM_REQUIRED");
      }
      throw new Error("FORBIDDEN");
    }

    if (!response.ok) {
      throw new Error(`API_ERROR_${response.status}`);
    }

    return response.json();
  }

  // Fetch currently playing track
  async getCurrentlyPlaying() {
    try {
      const data = await this.request('/me/player/currently-playing');
      if (!data || !data.item) {
        const playback = await this.request('/me/player');
        if (playback && playback.item) {
          return this.formatPlaybackState(playback);
        }
        return null;
      }
      return this.formatPlaybackState(data);
    } catch (error) {
      throw error;
    }
  }

  // Fetch audio features for song mood (energy, tempo)
  async getAudioFeatures(trackId) {
    if (!trackId) return null;
    try {
      return await this.request(`/audio-features/${trackId}`);
    } catch {
      return null;
    }
  }

  // Fetch artist details (genres, extra images)
  async getArtistDetails(artistId) {
    if (!artistId) return null;
    try {
      return await this.request(`/artists/${artistId}`);
    } catch {
      return null;
    }
  }

  // Control playback states
  async play() {
    return this.request('/me/player/play', { method: 'PUT' });
  }

  async pause() {
    return this.request('/me/player/pause', { method: 'PUT' });
  }

  async next() {
    return this.request('/me/player/next', { method: 'POST' });
  }

  async previous() {
    return this.request('/me/player/previous', { method: 'POST' });
  }

  async setVolume(volumePercent) {
    return this.request(`/me/player/volume?volume_percent=${volumePercent}`, { method: 'PUT' });
  }

  // Helper formatting method
  formatPlaybackState(data) {
    if (!data || !data.item) {
      return null;
    }
    
    const item = data.item || {};
    const album = item.album || {};
    const images = Array.isArray(album.images) ? album.images : [];
    const artists = Array.isArray(item.artists) ? item.artists : [];
    
    return {
      isPlaying: !!data.is_playing,
      progressMs: Number(data.progress_ms) || 0,
      durationMs: Number(item.duration_ms) || 240000,
      id: item.id || '',
      name: item.name || 'Unknown Track',
      artists: artists.map(a => ({ name: a?.name || 'Unknown Artist', id: a?.id || '' })),
      albumName: album.name || 'Unknown Album',
      albumArt: images?.[0]?.url || images?.[1]?.url || null,
      artistId: artists?.[0]?.id || null,
      context: data.context || null,
      contextName: data.context?.type ? `Playing from ${data.context.type}` : 'Playing from Spotify Library'
    };
  }
}

export const spotify = new SpotifyClient();
export const redirectToSpotify = redirectToAuthCodeFlow;
