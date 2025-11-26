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
      <h2>Now Playing</h2>
      {currentVideo ? (
        <div>
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
            <iframe
              ref={playerRef}
              src={`https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=1`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              title={currentVideo.title}
            ></iframe>
          </div>
          <h3>{currentVideo.title || `Video (${currentVideo.videoId})`}</h3>
        </div>
      ) : (
        <div>
          <p>No video currently playing.</p>
          {queue.length > 0 && (
            <button onClick={onPlayNext} style={{ padding: '10px 20px' }}>
              Play Next Video
            </button>
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
                <span style={{ fontWeight: 'bold' }}>#{index + 1}</span> - {video.title || `Video (${video.videoId})`}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;