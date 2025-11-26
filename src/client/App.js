import React, { useState, useEffect } from 'react';
import VideoList from './components/VideoList';
import VideoPlayer from './components/VideoPlayer';
import io from 'socket.io-client';

const socket = io('http://localhost:3004');

function App() {
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [activeTab, setActiveTab] = useState('add'); // 'add' or 'play'
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
      const response = await fetch(`http://localhost:3004/api/video/${videoId}`);
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
  
  // Client-side YouTube URL validation
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
      const response = await fetch(`http://localhost:3004/api/playlist/${playlistId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Add each video to the queue
        for (const video of data.videos) {
          // Fetch individual video metadata
          try {
            const metadataResponse = await fetch(`http://localhost:3004/api/video/${video.videoId}`);
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
  
  const extractPlaylistId = (url) => {
    try {
      const urlObj = new URL(url);
      
      // Check if it's a YouTube domain
      const validDomains = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'];
      if (!validDomains.includes(urlObj.hostname)) {
        return null;
      }
      
      // For playlist URLs, must have playlist parameter
      if (urlObj.searchParams.has('list')) {
        const playlistId = urlObj.searchParams.get('list');
        if (playlistId && playlistId.length > 5) {
          return playlistId;
        } 
      }
      
      return null;
    } catch (error) {
      // Invalid URL format
      return null;
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Shared YouTube Audio Playlist Player</h1>
        <div>
          <label>
            <input 
              type="checkbox" 
              checked={isPlayer}
              onChange={(e) => setIsPlayer(e.target.checked)}
            />
            Enable Player Mode (Central Machine)
          </label>
        </div>
      </header>
      
      <nav>
        <button 
          className={activeTab === 'add' ? 'active' : ''}
          onClick={() => setActiveTab('add')}
        >
          Add Videos
        </button>
        <button 
          className={activeTab === 'play' ? 'active' : ''}
          onClick={() => setActiveTab('play')}
          disabled={!isPlayer}
        >
          Play Videos {isPlayer ? '' : '(Player Mode Required)'}
        </button>
      </nav>

      <main>
        {activeTab === 'add' ? (
          <VideoList videos={videos} onAddVideo={addVideo} onDeleteVideo={deleteVideo} onAddPlaylist={addPlaylist} />
        ) : (
          <VideoPlayer 
            currentVideo={currentVideo} 
            queue={videos}
            onVideoFinished={() => socket.emit('video_finished')}
            onPlayNext={playNext}
            onDeleteVideo={deleteVideo}
          />
        )}
      </main>
    </div>
  );
}

export default App;