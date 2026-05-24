# Spotify Ambient Visualizer

A premium, editorial-style ambient web visualizer that syncs with your live Spotify playback. Designed to transform any screen into a stunning "now playing" listening room with dynamic colors, spinning vinyl animations, and synchronized audio metadata.

## Features
- **Live Playback Sync:** Connects to your active Spotify session in real-time.
- **Dynamic Aesthetic Extraction:** Generates luxurious color palettes based on the currently playing track's artwork and title.
- **Spinning Vinyl Player:** Realistically rotating record animation synchronized to playback state.
- **Data-Driven Ambient Information:** Extracts acoustic features to display mood, genre, and duration gracefully.
- **Offline Demo Mode:** A fully functioning premium showcase mode requiring no Spotify connection.
- **Responsive Cinematic Grid:** Perfect for large TVs, tablets, or desktop browsers.

## Screenshots
<img width="1919" height="899" alt="image" src="https://github.com/user-attachments/assets/1e847e8f-4512-4edf-998e-14a9324547fd" />

- Dashboard Light Mode
- Typography Detail
- Ambient Room Dark Setup

## Tech Stack
- **Frontend Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4 + Framer Motion
- **Icons:** Lucide React
- **API Integration:** Spotify Web API (PKCE OAuth Flow)

## Ambient Design Philosophy
This project was meticulously designed rejecting the standard "dark mode streaming app" paradigm in favor of an **Editorial Maximalist** aesthetic. 
The visualizer embraces:
1. **Luxurious Beige Foundations:** Rooted in organic, warm neutral tones (#F5F1EC) to simulate physical art galleries rather than software.
2. **Editorial Typography:** Utilizing classic serif headlines (Playfair/Georgia) paired with ultra-clean, widely-spaced geometric sans-serif (Inter) caps.
3. **Data as Decoration:** Exposing structural metadata (BPM, Acousticness, Energy) to create a highly technical yet deeply aesthetic "control center" feel.

---

## Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Spotify Developer Setup
To run this application with live syncing, you need to create a Spotify Developer application:
1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/).
2. Create a new App.
3. Add `http://127.0.0.1:3000` to your **Redirect URIs** in the app settings.
4. Retrieve your **Client ID**.

### 3. Environment Variables
Create a `.env` file in the root directory based on `.env.example`:
```env
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000
```

### 4. Running Locally
Run the Vite development server:
```bash
npm run dev
```
Open `http://127.0.0.1:3000` in your browser. *(Note: Make sure to access via `127.0.0.1` and not `localhost` for Spotify's PKCE redirect to match precisely).*

## Vercel Deployment
This project is fully configured for zero-config Vercel deployment:
1. Push your repository to GitHub.
2. Import the project into Vercel.
3. Set the Environment Variables (`VITE_SPOTIFY_CLIENT_ID` and your production `VITE_SPOTIFY_REDIRECT_URI`) in the Vercel dashboard.
4. **Important:** Remember to add your production URL (e.g., `https://your-app.vercel.app`) to your Spotify Developer Dashboard **Redirect URIs** and update `VITE_SPOTIFY_REDIRECT_URI` accordingly.
5. Deploy. The included `vercel.json` ensures Single Page App (SPA) routing behaves correctly.
