import React, { useState } from 'react';

const VideoList = ({ videos, onAddVideo, onDeleteVideo, onAddPlaylist, onDeleteMultipleVideos }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [selectedVideos, setSelectedVideos] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (videoUrl.trim()) {
      onAddVideo(videoUrl);
      setVideoUrl('');
    }
  };
  
  const handlePlaylistSubmit = async (e) => {
    e.preventDefault();
    if (playlistUrl.trim()) {
      await onAddPlaylist(playlistUrl);
      setPlaylistUrl('');
    }
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
      
      <h3 style={{ marginTop: '20px' }}>Add YouTube Playlist to Queue</h3>
      <form onSubmit={handlePlaylistSubmit}>
        <input
          type="text"
          value={playlistUrl}
          onChange={(e) => setPlaylistUrl(e.target.value)}
          placeholder="Enter YouTube Playlist URL"
          style={{ width: '70%', padding: '10px' }}
        />
        <button type="submit" style={{ padding: '10px 20px', marginLeft: '10px' }}>
          Add Playlist
        </button>
      </form>

      <div className="queue-section">
        <h3>Current Queue ({videos.length} videos)</h3>
        {videos.length === 0 ? (
          <p>No videos in queue. Add some videos to get started!</p>
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
              {videos.map((video, index) => (
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

export default VideoList;