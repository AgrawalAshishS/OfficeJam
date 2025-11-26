import React, { useEffect, useRef } from 'react';

const VideoPlayer = ({ currentVideo, queue, onVideoFinished, onPlayNext }) => {
  const playerRef = useRef(null);

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
          <ul>
            {queue.map((video, index) => (
              <li key={video.id} style={{ margin: '10px 0', padding: '10px', border: '1px solid #ccc' }}>
                <div>
                  <span style={{ fontWeight: 'bold' }}>#{index + 1}</span> - {video.title || `Video (${video.videoId})`}
                  {video.duration && <span style={{ float: 'right', fontStyle: 'italic' }}>{video.duration}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;