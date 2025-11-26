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

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('queue_update');
      socket.off('play_video');
      socket.off('stop_video');
    };
  }, [isPlayer]);

  const addVideo = async (videoUrl) => {
    console.log('Attempting to add video URL:', videoUrl);
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
    socket.emit('delete_video', videoId);
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
          <VideoList videos={videos} onAddVideo={addVideo} onDeleteVideo={deleteVideo} />
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