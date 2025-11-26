import React, { useEffect, useRef, useState } from 'react';

const VideoPlayer = ({ currentVideo, queue, onVideoFinished, onPlayNext, onDeleteVideo, onDeleteMultipleVideos }) => {
  const playerRef = useRef(null);
  const [selectedVideos, setSelectedVideos] = useState([]);

  // This is a simplified approach to detect when a YouTube video ends
  // In a production app, you would use the YouTube Player API for more accurate detection
  useEffect(() => {
    if (currentVideo) {
      const timer = setTimeout(() => {
        onVideoFinished();
      }, 30000); // Assume 30 seconds for demo purposes
      
      return () => clearTimeout(timer);
    }
  }, [currentVideo, onVideoFinished]);

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

  return (
    <div className="video-player">
      <h2>Now Playing (Audio Only)</h2>
      {currentVideo ? (
        <div>
          <div style={{ position: 'relative', paddingBottom: '10%', height: 0 }}>
            <iframe
              ref={playerRef}
              src={`https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=1&audio=1`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              title={currentVideo.title}
            ></iframe>
          </div>
          <h3>{currentVideo.title || `Video (${currentVideo.videoId})`}
          {currentVideo.duration && <p>Duration: {currentVideo.duration}</p>}</h3>
          <button onClick={onVideoFinished} style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '10px' }}>
            Skip Video
          </button>
        </div>
      ) : (
        <div>
          <p>No video currently playing.</p>
          {queue.length > 0 && (
            <div>
              <button onClick={onPlayNext} style={{ padding: '10px 20px', marginRight: '10px' }}>
                Play Next Video
              </button>
              <button onClick={onVideoFinished} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Skip Current
              </button>
            </div>
          )}
        </div>
      )}
      
      <div className="queue-section">
        <h3>Up Next ({queue.length} videos)</h3>
        {queue.length === 0 ? (
          <p>No videos in queue.</p>
        ) : (
          <>
            {selectedVideos.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <button 
                  onClick={deleteSelectedVideos}
                  style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Delete Selected ({selectedVideos.length})
                </button>
                <button 
                  onClick={() => setSelectedVideos([])}
                  style={{ padding: '5px 10px', marginLeft: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            )}
            <ul>
              {queue.map((video, index) => (
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
                  <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                    <input
                      type="checkbox"
                      checked={selectedVideos.includes(video.id)}
                      onChange={() => toggleVideoSelection(video.id)}
                      style={{ marginRight: '10px' }}
                    />
                    <div onClick={(e) => {
                      // Prevent click from affecting checkbox when clicking on the link
                      if (e.target.tagName !== 'A') {
                        toggleVideoSelection(video.id);
                      }
                    }} style={{ cursor: 'pointer', flexGrow: 1 }}>
                      <span style={{ fontWeight: 'bold' }}>#{index + 1}</span> - 
                      <a 
                        href={video.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        {video.title || `Video (${video.videoId})`}
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