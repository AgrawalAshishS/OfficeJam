import React, { useState, useEffect } from 'react';

const PlayHistory = ({ onAddToQueue, currentQueue }) => {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null); // For displaying messages
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    // Filter history based on search term
    if (searchTerm.trim() === '') {
      setFilteredHistory(history);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = history.filter(item => 
        (item.title && item.title.toLowerCase().includes(term)) ||
        (item.url && item.url.toLowerCase().includes(term))
      );
      setFilteredHistory(filtered);
    }
  }, [searchTerm, history]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/history');
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      const data = await response.json();
      setHistory(data);
      setFilteredHistory(data); // Initialize filtered history with all items
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToQueue = (video) => {
    // Pass the URL string directly to the onAddToQueue function
    onAddToQueue(video.url);
    // Show success message
    setMessage(`"${video.title || video.videoId}" added to queue!`);
    // Clear message after 3 seconds
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  const handleDeleteFromHistory = async (videoId, videoTitle) => {
    try {
      const response = await fetch(`/api/history/${videoId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete video from history');
      }
      
      // Remove the video from the local state
      const updatedHistory = history.filter(item => item.id !== videoId);
      setHistory(updatedHistory);
      
      // Show success message
      setMessage(`"${videoTitle || videoId}" deleted from history!`);
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Check if a video is already in the queue
  const isVideoInQueue = (videoId) => {
    return currentQueue && currentQueue.some(video => video.videoId === videoId);
  };

  if (loading) return <div>Loading history...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="play-history">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h2 className="section-title h5 mb-1">Play History</h2>
          <p className="text-secondary small mb-0">Re-queue a favorite or clean up the log.</p>
        </div>
        <div className="text-secondary small">Total played: {history.length}</div>
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
      
      {message && (
        <div className="alert alert-success py-2" role="alert">
          {message}
        </div>
      )}
      {filteredHistory.length === 0 ? (
        <div className="empty-state">
          {searchTerm.trim() === '' ? 'No videos have been played yet.' : 'No matching videos found.'}
        </div>
      ) : (
        <div>
          <p className="text-secondary small">
            Showing {filteredHistory.length} {searchTerm.trim() !== '' && `(filtered from ${history.length})`}
          </p>
          <ul className="history-list d-grid gap-3">
            {filteredHistory.map((item) => (
              <li 
                key={item.id} 
                className="history-item bg-white d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3"
              >
                {/* Thumbnail and video info */}
                <div className="d-flex align-items-center gap-3">
                  <img 
                    src={`https://img.youtube.com/vi/${item.videoId}/default.jpg`} 
                    alt={item.title || `Thumbnail for ${item.videoId}`}
                    className="thumb"
                  />
                  <div>
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="fw-semibold text-decoration-none text-dark"
                    >
                      {item.title || `Video (${item.videoId})`}
                    </a>
                    <p className="mb-0 text-secondary small">
                      Played at: {new Date(item.playedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="d-flex flex-wrap gap-2">
                  {!isVideoInQueue(item.videoId) ? (
                    <button 
                      onClick={() => handleAddToQueue(item)}
                      className="btn btn-success btn-sm"
                      type="button"
                    >
                      <i className="bi bi-plus-circle me-1"></i>Add to Queue
                    </button>
                  ) : (
                    <span className="badge bg-secondary align-self-center">Already in Queue</span>
                  )}
                  <button 
                    onClick={() => handleDeleteFromHistory(item.id, item.title || item.videoId)}
                    className="btn btn-outline-danger btn-sm"
                    type="button"
                  >
                    <i className="bi bi-trash me-1"></i>Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PlayHistory;
