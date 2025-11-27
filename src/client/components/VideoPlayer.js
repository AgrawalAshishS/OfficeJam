import React, { useEffect, useRef, useState } from 'react';

const VideoPlayer = ({ currentVideo, queue, onVideoFinished, onPlayNext, onDeleteVideo, onDeleteMultipleVideos }) => {
  const playerRef = useRef(null);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const playerInstance = useRef(null);

  // Filter queue based on search term
  const filteredQueue = queue.filter(video => 
    (video.title && video.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (video.url && video.url.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Initialize YouTube Player API
  useEffect(() => {
    if (currentVideo) {
      // Load YouTube Player API if not already loaded
      if (!window.YT) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(script);
        
        window.onYouTubeIframeAPIReady = () => {
          createPlayer();
        };
      } else {
        createPlayer();
      }
    }
    
    return () => {
      // Clean up player instance
      if (playerInstance.current) {
        playerInstance.current.destroy();
        playerInstance.current = null;
      }
    };
  }, [currentVideo]);

  const createPlayer = () => {
    if (playerInstance.current) {
      playerInstance.current.destroy();
    }
    
    playerInstance.current = new window.YT.Player(playerRef.current, {
      videoId: currentVideo.videoId,
      playerVars: {
        autoplay: 1, // Enable autoplay
        controls: 1, // Show controls
        modestbranding: 1, // Minimal YouTube branding
        rel: 0, // Don't show related videos at the end
        iv_load_policy: 3, // Hide annotations
        disablekb: 1, // Disable keyboard controls
        fs: 0, // Disable fullscreen button
        playsinline: 1, // Play inline on mobile
        // Audio-only parameters
        mute: 0, // Start unmuted
        enablejsapi: 1, // Enable JS API
      },
      events: {
        'onStateChange': onPlayerStateChange,
        'onError': onPlayerError
      }
    });
    
    // Apply audio-only styling after player is ready
    playerInstance.current.addEventListener('onReady', () => {
      // Hide video elements and show audio-only interface
      const iframe = playerRef.current.querySelector('iframe');
      if (iframe) {
        iframe.style.width = '100%';
        iframe.style.height = '60px'; // Reduced height for audio player
      }
    });
  };

  const onPlayerStateChange = (event) => {
    // YouTube Player States:
    // -1 = unstarted
    // 0 = ended
    // 1 = playing
    // 2 = paused
    // 3 = buffering
    // 5 = video cued
    
    if (event.data === 0) { // Video ended
      onVideoFinished();
    }
  };

  const onPlayerError = (event) => {
    console.error('YouTube Player Error:', event.data);
    // Still call onVideoFinished to move to next video even if there's an error
    onVideoFinished();
  };

  const toggleVideoSelection = (videoId) => {
    if (selectedVideos.includes(videoId)) {
      setSelectedVideos(selectedVideos.filter(id => id !== videoId));
    } else {
      setSelectedVideos([...selectedVideos, videoId]);
    }
  };

  const deleteSelectedVideos = () => {
    if (selectedVideos.length > 0) {
      onDeleteMultipleVideos(selectedVideos);
      setSelectedVideos([]);
    }
  };
  
  const selectAllVideos = () => {
    const allVideoIds = filteredQueue.map(video => video.id);
    setSelectedVideos(allVideoIds);
  };
  
  const deselectAllVideos = () => {
    setSelectedVideos([]);
  };

  return (
    <div className="video-player">
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '0', 
        paddingBottom: '9%' // Reduced height for audio player (was 56.25% for video)
      }}>
        {currentVideo ? (
          <div
            ref={playerRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}
          ></div>
        ) : (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
            color: '#fff',
            fontSize: '1.2em'
          }}>
            No audio playing
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        {currentVideo ? (
          <div>
            <h3>Now Playing</h3>
            <div style={{ 
              padding: '15px', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              marginBottom: '15px'
            }}>
              <a 
                href={currentVideo.url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  textDecoration: 'none', 
                  color: 'inherit',
                  fontWeight: 'bold',
                  fontSize: '1.1em'
                }}
              >
                {currentVideo.title || `Audio (${currentVideo.videoId})`}
              </a>
              {currentVideo.duration && <span style={{ marginLeft: '10px', fontStyle: 'italic' }}>{currentVideo.duration}</span>}
            </div>
            
            <div>
              <button onClick={onPlayNext} style={{ padding: '10px 20px', marginRight: '10px' }}>
                Play Next Audio
              </button>
              <button onClick={onVideoFinished} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Skip Current
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p>No audio currently playing.</p>
            {queue.length > 0 && (
              <div>
                <button onClick={onPlayNext} style={{ padding: '10px 20px', marginRight: '10px' }}>
                  Play Next Audio
                </button>
                <button onClick={onVideoFinished} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Skip Current
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="queue-section">
        <h3>Up Next ({filteredQueue.length} audios)</h3>
        
        {/* Search input for queue */}
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by title or URL..."
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>
        
        {filteredQueue.length === 0 ? (
          <p>{searchTerm.trim() === '' ? 'No audios in queue.' : 'No matching audios found.'}</p>
        ) : (
          <>
            <div style={{ marginBottom: '10px' }}>
              {selectedVideos.length > 0 ? (
                <>
                  <button 
                    onClick={deleteSelectedVideos}
                    style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Delete Selected ({selectedVideos.length})
                  </button>
                  <button 
                    onClick={deselectAllVideos}
                    style={{ padding: '5px 10px', marginLeft: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button 
                  onClick={selectAllVideos}
                  style={{ padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Select All ({filteredQueue.length})
                </button>
              )}
            </div>
            <ul>
              {filteredQueue.map((video, index) => (
                <li 
                  key={video.id} 
                  style={{ 
                    margin: '10px 0', 
                    padding: '10px', 
                    border: selectedVideos.includes(video.id) ? '2px solid #007bff' : '1px solid #ccc', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    backgroundColor: selectedVideos.includes(video.id) ? '#e3f2fd' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedVideos.includes(video.id)}
                      onChange={() => toggleVideoSelection(video.id)}
                      style={{ marginRight: '10px' }}
                    />
                    {/* Thumbnail */}
                    <div style={{ marginRight: '10px' }}>
                      <img 
                        src={`https://img.youtube.com/vi/${video.videoId}/default.jpg`} 
                        alt={video.title || `Thumbnail for ${video.videoId}`}
                        style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>#{index + 1}</span> - 
                      <a 
                        href={video.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none', color: 'inherit', marginLeft: '5px' }}
                      >
                        {video.title || `Audio (${video.videoId})`}
                      </a>
                      {video.duration && <span style={{ marginLeft: '10px', fontStyle: 'italic' }}>{video.duration}</span>}
                    </div>
                  </div>
                  <button 
                    onClick={() => onDeleteVideo(video.id)}
                    style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;