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
      <div className="position-relative w-100" style={{ height: 0, paddingBottom: '9%' }}>
        {currentVideo ? (
          <div
            ref={playerRef}
            className="yt-iframe position-absolute top-0 start-0 w-100 h-100"
          ></div>
        ) : (
          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark text-white fs-5 rounded-3">
            No audio playing
          </div>
        )}
      </div>
      
      <div className="mt-4">
        {currentVideo ? (
          <div className="card glass-panel border-0 shadow-sm">
            <div className="card-body d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
              <div>
                <h3 className="section-title h5 mb-2">Now Playing</h3>
                <a 
                  href={currentVideo.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="fw-semibold text-decoration-none text-dark"
                >
                  {currentVideo.title || `Audio (${currentVideo.videoId})`}
                </a>
                {currentVideo.duration && (
                  <span className="badge bg-light text-secondary ms-2 pill">{currentVideo.duration}</span>
                )}
              </div>
              <div className="d-flex flex-wrap gap-2">
                <button onClick={onPlayNext} className="btn btn-primary">
                  <i className="bi bi-skip-forward-fill me-1"></i>Play Next Audio
                </button>
                <button onClick={onVideoFinished} className="btn btn-outline-danger">
                  Skip Current
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card glass-panel border-0 shadow-sm">
            <div className="card-body d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
              <div>
                <h3 className="section-title h5 mb-1">Nothing playing</h3>
                <p className="text-secondary mb-0">Add a track or jump to the next in queue.</p>
              </div>
              {queue.length > 0 && (
                <div className="d-flex flex-wrap gap-2">
                  <button onClick={onPlayNext} className="btn btn-primary">
                    Play Next Audio
                  </button>
                  <button onClick={onVideoFinished} className="btn btn-outline-danger">
                    Skip Current
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="queue-section mt-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
          <div>
            <h3 className="section-title h5 mb-1">Up Next ({filteredQueue.length} audios)</h3>
            <p className="text-secondary small mb-0">Filter, select, and manage the queue.</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {selectedVideos.length > 0 ? (
              <>
                <button 
                  onClick={deleteSelectedVideos}
                  className="btn btn-danger btn-sm"
                  type="button"
                >
                  <i className="bi bi-trash me-1"></i>Delete Selected ({selectedVideos.length})
                </button>
                <button 
                  onClick={deselectAllVideos}
                  className="btn btn-outline-secondary btn-sm"
                  type="button"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button 
                onClick={selectAllVideos}
                className="btn btn-outline-primary btn-sm"
                type="button"
              >
                Select All ({filteredQueue.length})
              </button>
            )}
          </div>
        </div>

        <div className="mb-3">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-secondary"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by title or URL..."
            />
          </div>
        </div>
        
        {filteredQueue.length === 0 ? (
          <div className="empty-state">
            {searchTerm.trim() === '' ? 'No audios in queue.' : 'No matching audios found.'}
          </div>
        ) : (
          <ul className="queue-list d-grid gap-3">
            {filteredQueue.map((video, index) => (
              <li 
                key={video.id} 
                className={`queue-item bg-white d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 ${selectedVideos.includes(video.id) ? 'border-primary bg-primary-subtle' : ''}`}
              >
                <div className="d-flex align-items-center gap-3">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selectedVideos.includes(video.id)}
                      onChange={() => toggleVideoSelection(video.id)}
                      id={`upnext-${video.id}`}
                    />
                    <label className="visually-hidden" htmlFor={`upnext-${video.id}`}>Select {video.title || video.videoId}</label>
                  </div>
                  <img 
                    className="thumb"
                    src={`https://img.youtube.com/vi/${video.videoId}/default.jpg`} 
                    alt={video.title || `Thumbnail for ${video.videoId}`}
                  />
                  <div>
                    <span className="fw-bold me-1">#{index + 1}</span>
                    <a 
                      href={video.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="fw-semibold text-decoration-none text-dark"
                    >
                      {video.title || `Audio (${video.videoId})`}
                    </a>
                    {video.duration && <span className="badge bg-light text-secondary ms-2 pill">{video.duration}</span>}
                  </div>
                </div>
                <button 
                  onClick={() => onDeleteVideo(video.id)}
                  className="btn btn-outline-danger btn-sm"
                  type="button"
                >
                  <i className="bi bi-trash me-1"></i>Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
