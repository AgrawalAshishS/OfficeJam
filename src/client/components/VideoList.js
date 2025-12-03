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
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card glass-panel border-0 shadow-sm h-100">
            <div className="card-body">
              <h2 className="section-title h5 mb-1">Add YouTube Video</h2>
              <p className="text-secondary small mb-3">Drop in a YouTube URL to queue it instantly.</p>
              <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control"
                    id="singleVideo"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <label htmlFor="singleVideo">YouTube video URL</label>
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  <i className="bi bi-plus-circle me-2"></i>Add to queue
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card glass-panel border-0 shadow-sm h-100">
            <div className="card-body">
              <h3 className="section-title h5 mb-1">Add Playlist</h3>
              <p className="text-secondary small mb-3">We will fetch titles and durations for each track.</p>
              <form onSubmit={handlePlaylistSubmit} className="d-flex flex-column gap-3">
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control"
                    id="playlistUrl"
                    value={playlistUrl}
                    onChange={(e) => setPlaylistUrl(e.target.value)}
                    placeholder="https://youtube.com/playlist?list=..."
                  />
                  <label htmlFor="playlistUrl">YouTube playlist URL</label>
                </div>
                <button type="submit" className="btn btn-outline-primary w-100">
                  <i className="bi bi-collection-play me-2"></i>Add playlist
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="queue-section mt-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
          <div>
            <h3 className="section-title h5 mb-1">Current Queue ({filteredVideos.length} videos)</h3>
            <p className="text-secondary small mb-0">Search, multi-select, and manage items.</p>
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
                Select All ({filteredVideos.length})
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
        
        {filteredVideos.length === 0 ? (
          <div className="empty-state">
            {searchTerm.trim() === '' ? 'No videos in queue. Add some videos to get started!' : 'No matching videos found.'}
          </div>
        ) : (
          <ul className="queue-list d-grid gap-3">
            {filteredVideos.map((video) => (
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
                      id={`queue-${video.id}`}
                    />
                    <label className="visually-hidden" htmlFor={`queue-${video.id}`}>Select {video.title || video.videoId}</label>
                  </div>
                  <img 
                    className="thumb"
                    src={`https://img.youtube.com/vi/${video.videoId}/default.jpg`} 
                    alt={video.title || `Thumbnail for ${video.videoId}`}
                  />
                  <div>
                    <a 
                      href={video.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="fw-semibold text-decoration-none text-dark"
                    >
                      {video.title || `Video (${video.videoId})`}
                    </a>
                    {video.duration && (
                      <span className="badge bg-light text-secondary ms-2 pill">{video.duration}</span>
                    )}
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

export default VideoList;
