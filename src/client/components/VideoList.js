import React, { useState } from 'react';

const VideoList = ({ videos, onAddVideo, onDeleteVideo, onAddPlaylist, onDeleteMultipleVideos }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter videos based on search term
  const filteredVideos = videos.filter(video => 
    (video.title && video.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (video.url && video.url.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
  
  const selectAllVideos = () => {
    const allVideoIds = filteredVideos.map(video => video.id);
    setSelectedVideos(allVideoIds);
  };
  
  const deselectAllVideos = () => {
    setSelectedVideos([]);
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
        <h3>Current Queue ({filteredVideos.length} videos)</h3>
        
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
        
        {filteredVideos.length === 0 ? (
          <p>{searchTerm.trim() === '' ? 'No videos in queue. Add some videos to get started!' : 'No matching videos found.'}</p>
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
                  Select All ({filteredVideos.length})
                </button>
              )}
            </div>
            <ul>
              {filteredVideos.map((video) => (
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