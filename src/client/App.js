import React, { useState, useEffect } from 'react';
import VideoList from './components/VideoList';
import VideoPlayer from './components/VideoPlayer';
import PlayHistory from './components/PlayHistory';
import io from 'socket.io-client';

// Use relative paths for API calls and socket connection
const socket = io();

function App() {
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [activeTab, setActiveTab] = useState('add'); // 'add', 'play', or 'history'
  const [isPlayer, setIsPlayer] = useState(false); // Whether this client is the central player

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
    
    socket.on('queue_update', (queue) => {
      console.log('Received queue update:', queue);
      setVideos(queue);
    });

    socket.on('play_video', (video) => {
      // Only the designated player should play videos
      if (isPlayer) {
        console.log('Playing video:', video);
        setCurrentVideo(video);
        setActiveTab('play');
      }
    });

    socket.on('stop_video', () => {
      // Only the designated player should stop videos
      if (isPlayer) {
        console.log('Stopping video');
        setCurrentVideo(null);
      }
    });
    
    socket.on('error', (error) => {
      console.error('Server error:', error);
      alert(`Error: ${error.message}`);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('queue_update');
      socket.off('play_video');
      socket.off('stop_video');
      socket.off('error');
    };
  }, [isPlayer]);

  const addVideo = async (videoUrl) => {
    console.log('Attempting to add video URL:', videoUrl);
    
    // Client-side URL validation
    if (!isValidYouTubeUrl(videoUrl)) {
      alert('Invalid YouTube URL. Please enter a valid YouTube video URL.');
      return;
    }
    
    // Extract video ID from YouTube URL
    const videoId = extractVideoId(videoUrl);
    console.log('Extracted video ID:', videoId);
    if (!videoId) {
      alert('Invalid YouTube URL');
      return;
    }

    // Fetch video metadata
    let title = `Video ${videos.length + 1}`;
    let duration = 'Unknown';
    
    try {
      const response = await fetch(`/api/video/${videoId}`);
      if (response.ok) {
        const metadata = await response.json();
        title = metadata.title;
        duration = metadata.duration;
      }
    } catch (error) {
      console.error('Error fetching video metadata:', error);
    }

    const videoData = {
      id: Date.now(), // Simple unique ID
      url: videoUrl,
      videoId: videoId,
      title: title,
      duration: duration
    };

    console.log('Sending video data to server:', videoData);
    socket.emit('add_video', videoData);
  };

  const videoFinished = () => {
    socket.emit('video_finished');
  };

  // Helper function to validate YouTube URLs
  const isValidYouTubeUrl = (url) => {
    try {
      const urlObj = new URL(url);
      
      // Check if it's a YouTube domain
      const validDomains = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'];
      if (!validDomains.includes(urlObj.hostname)) {
        return false;
      }
      
      // For youtu.be short URLs
      if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.length > 1; // Must have a video ID
      }
      
      // For full YouTube URLs, must have watch path and v parameter
      if (urlObj.pathname === '/watch' && urlObj.searchParams.has('v')) {
        const videoId = urlObj.searchParams.get('v');
        return videoId && videoId.length === 11; // YouTube video IDs are 11 characters
      }
      
      // For embed URLs
      if (urlObj.pathname.startsWith('/embed/')) {
        const videoId = urlObj.pathname.split('/')[2];
        return videoId && videoId.length === 11;
      }
      
      return false;
    } catch (error) {
      // Invalid URL format
      return false;
    }
  };

  // Helper function to extract video ID from various YouTube URL formats
  const extractVideoId = (url) => {
    const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})(?:[\w&#\?\=]*)?$/;
    const match = url.match(regExp);
    if (match && match[1]) {
      return match[1];
    }
    
    // Fallback for other formats
    const fallbackRegexp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const fallbackMatch = url.match(fallbackRegexp);
    return (fallbackMatch && fallbackMatch[2].length === 11) ? fallbackMatch[2] : null;
  };

  const playNext = () => {
    socket.emit('play_next');
  };
  
  const deleteVideo = (videoId) => {
    // Validate videoId is a number
    if (typeof videoId !== 'number') {
      alert('Invalid video ID');
      return;
    }
    socket.emit('delete_video', videoId);
  };
  
  const deleteMultipleVideos = (videoIds) => {
    // Validate videoIds are numbers
    if (!Array.isArray(videoIds) || videoIds.some(id => typeof id !== 'number')) {
      alert('Invalid video IDs');
      return;
    }
    socket.emit('delete_multiple_videos', videoIds);
  };
  
  const addPlaylist = async (playlistUrl) => {
    console.log('Attempting to add playlist URL:', playlistUrl);
    
    // Extract playlist ID from YouTube URL
    const playlistId = extractPlaylistId(playlistUrl);
    console.log('Extracted playlist ID:', playlistId);
    if (!playlistId) {
      alert('Invalid YouTube Playlist URL');
      return;
    }
    
    try {
      const response = await fetch(`/api/playlist/${playlistId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Add each video to the queue
        for (const video of data.videos) {
          // Fetch individual video metadata
          try {
            const metadataResponse = await fetch(`/api/video/${video.videoId}`);
            if (metadataResponse.ok) {
              const metadata = await metadataResponse.json();
              video.title = metadata.title;
              video.duration = metadata.duration;
            }
          } catch (error) {
            console.error('Error fetching video metadata:', error);
          }
          
          // Update the ID to be a unique integer
          video.id = Date.now() + Math.floor(Math.random() * 1000);
          
          console.log('Sending video data to server:', video);
          socket.emit('add_video', video);
          
          // Add a small delay to prevent overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        alert(`Added ${data.videos.length} videos to the queue`);
      } else {
        alert('Failed to fetch playlist');
      }
    } catch (error) {
      console.error('Error fetching playlist:', error);
      alert('Error adding playlist');
    }
  };

  // Helper function to extract playlist ID from YouTube playlist URL
  const extractPlaylistId = (url) => {
    try {
      const urlObj = new URL(url);
      
      // Check if it's a YouTube domain
      const validDomains = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'];
      if (!validDomains.includes(urlObj.hostname)) {
        return null;
      }
      
      // Must have playlist parameter
      if (urlObj.searchParams.has('list')) {
        const playlistId = urlObj.searchParams.get('list');
        return playlistId && playlistId.length > 5; // Playlist IDs are typically longer
      }
      
      return null;
    } catch (error) {
      // Invalid URL format
      return null;
    }
  };

  return (
    <div className="app">
      <header className="hero-card shadow-sm rounded-4 p-4 mb-4 border border-light">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div>
            <div className="d-flex flex-wrap gap-2">
              <span className="badge bg-primary-subtle text-primary-emphasis pill">Live Queue</span>
              <span className="badge bg-info-subtle text-info-emphasis pill">Synced via Socket</span>
            </div>
            <h1 className="mt-2 mb-1 fw-bold">OfficeJam</h1>
            <p className="text-secondary mb-0">
              Share YouTube tracks, keep the office playlist flowing, and control playback together.
            </p>
          </div>
          <div className="form-check form-switch ps-0">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="playerMode"
              checked={isPlayer}
              onChange={(e) => setIsPlayer(e.target.checked)}
            />
            <label className="form-check-label fw-semibold ms-2" htmlFor="playerMode">
              Enable Player Mode
              <small className="d-block text-secondary">Central machine handles playback</small>
            </label>
          </div>
        </div>
      </header>
      
      <nav className="mb-4">
        <ul className="nav nav-pills glass-panel shadow-sm rounded-4 p-2 flex-wrap gap-2 border border-light mb-0">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'add' ? 'active' : ''}`} 
              onClick={() => setActiveTab('add')}
              type="button"
            >
              <i className="bi bi-plus-circle me-2"></i>Add Videos
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link d-flex align-items-center ${activeTab === 'play' ? 'active' : ''}`} 
              onClick={() => setActiveTab('play')}
              disabled={!isPlayer}
              type="button"
            >
              <i className="bi bi-play-circle me-2"></i>
              Play Videos {!isPlayer && <span className="ms-1 text-muted">(Player mode)</span>}
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'history' ? 'active' : ''}`} 
              onClick={() => setActiveTab('history')}
              type="button"
            >
              <i className="bi bi-clock-history me-2"></i>Play History
            </button>
          </li>
        </ul>
      </nav>

      <main className="glass-panel rounded-4 shadow-sm p-4 border-0">
        {activeTab === 'add' ? (
          <VideoList 
            videos={videos}
            onAddVideo={addVideo}
            onDeleteVideo={deleteVideo}
            onAddPlaylist={addPlaylist}
            onDeleteMultipleVideos={deleteMultipleVideos}
          />
        ) : activeTab === 'play' ? (
          <VideoPlayer 
            currentVideo={currentVideo}
            queue={videos}
            onVideoFinished={videoFinished}
            onPlayNext={playNext}
            onDeleteVideo={deleteVideo}
            onDeleteMultipleVideos={deleteMultipleVideos}
          />
        ) : (
          <PlayHistory 
            onAddToQueue={addVideo}
            currentQueue={videos}
          />
        )}
      </main>
    </div>
  );
}

export default App;
