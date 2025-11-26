import React, { useState, useEffect } from 'react';
import VideoList from './components/VideoList';
import VideoPlayer from './components/VideoPlayer';
import io from 'socket.io-client';

const socket = io();

function App() {
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [activeTab, setActiveTab] = useState('add'); // 'add' or 'play'

  useEffect(() => {
    socket.on('queue_update', (queue) => {
      setVideos(queue);
    });

    socket.on('play_video', (video) => {
      setCurrentVideo(video);
      setActiveTab('play');
    });

    socket.on('stop_video', () => {
      setCurrentVideo(null);
    });

    socket.on('video_playing', (video) => {
      setCurrentVideo(video);
    });

    return () => {
      socket.off('queue_update');
      socket.off('play_video');
      socket.off('stop_video');
      socket.off('video_playing');
    };
  }, []);

  const addVideo = (videoUrl) => {
    // Extract video ID from YouTube URL
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      alert('Invalid YouTube URL');
      return;
    }

    const videoData = {
      id: Date.now(), // Simple unique ID
      url: videoUrl,
      videoId: videoId,
      title: `Video ${videos.length + 1}` // In a real app, you'd fetch the actual title
    };

    socket.emit('add_video', videoData);
  };

  const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const playNext = () => {
    socket.emit('play_next');
  };

  return (
    <div className="app">
      <header>
        <h1>Shared YouTube Playlist Player</h1>
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
        >
          Play Videos
        </button>
      </nav>

      <main>
        {activeTab === 'add' ? (
          <VideoList videos={videos} onAddVideo={addVideo} />
        ) : (
          <VideoPlayer 
            currentVideo={currentVideo} 
            queue={videos}
            onVideoFinished={() => socket.emit('video_finished')}
            onPlayNext={playNext}
          />
        )}
      </main>
    </div>
  );
}

export default App;