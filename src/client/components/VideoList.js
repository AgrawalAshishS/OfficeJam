import React, { useState } from 'react';

const VideoList = ({ videos, onAddVideo, onDeleteVideo }) => {
  const [videoUrl, setVideoUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (videoUrl.trim()) {
      onAddVideo(videoUrl);
      setVideoUrl('');
    }
  };

  return (
    <div className="video-list">
      <h2>Add YouTube Video to Queue</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Enter YouTube URL"
          style={{ width: '70%', padding: '10px' }}
        />
        <button type="submit" style={{ padding: '10px 20px', marginLeft: '10px' }}>
          Add to Queue
        </button>
      </form>

      <div className="queue-section">
        <h3>Current Queue ({videos.length} videos)</h3>
        {videos.length === 0 ? (
          <p>No videos in queue. Add some videos to get started!</p>
        ) : (
          <ul>
            {videos.map((video, index) => (
              <li key={video.id} style={{ margin: '10px 0', padding: '10px', border: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 'bold' }}>#{index + 1}</span> - {video.title || `Video (${video.videoId})`}
                  {video.duration && <span style={{ marginLeft: '10px', fontStyle: 'italic' }}>{video.duration}</span>}
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
        )}
      </div>
    </div>
  );
};

export default VideoList;