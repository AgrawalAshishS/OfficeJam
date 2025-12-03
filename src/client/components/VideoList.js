import React, { useState } from 'react';

const VideoList = ({ videos, onAddMedia, onDeleteVideo, onDeleteMultipleVideos }) => {
  const [mediaUrl, setMediaUrl] = useState('');
  const [detectedType, setDetectedType] = useState(null);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter videos based on search term
  const filteredVideos = videos.filter(video => 
    (video.title && video.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (video.url && video.url.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const detectType = (url) => {
    if (!url.trim()) return null;
    return /[?&]list=|\/playlist/.test(url) ? 'playlist' : 'video';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mediaUrl.trim()) {
      await onAddMedia(mediaUrl);
      setMediaUrl('');
      setDetectedType(null);
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
        <div className="col-12">
          <div className="card glass-panel border-0 shadow-sm h-100">
            <div className="card-body">
              <h2 className="section-title h5 mb-1">Queue a YouTube Link</h2>
              <p className="text-secondary small mb-3">
                Paste a video or playlist URL and we will handle the right flow automatically.
              </p>
              <form onSubmit={handleSubmit} className="d-flex flex-column flex-md-row gap-3 align-items-md-start">
                <div className="flex-grow-1 w-100">
                  <div className="form-floating">
                    <input
                      type="text"
                      className="form-control"
                      id="unifiedUrl"
                      value={mediaUrl}
                      onChange={(e) => {
                        setMediaUrl(e.target.value);
                        setDetectedType(detectType(e.target.value));
                      }}
                      placeholder="https://youtube.com/watch?v=... or /playlist?list=..."
                    />
                    <label htmlFor="unifiedUrl">YouTube video or playlist URL</label>
                  </div>
                  <div className="form-text text-secondary mt-2">
                    {detectedType === 'playlist' && 'Detected playlist link — all tracks will be queued.'}
                    {detectedType === 'video' && 'Detected single video link — will add to queue.'}
                    {!detectedType && 'Supports full YouTube, youtu.be, and playlist URLs.'}
                  </div>
                </div>
                <button type="submit" className="btn btn-primary px-4 align-self-stretch">
                  <i className="bi bi-plus-circle me-2"></i>Add to queue
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
