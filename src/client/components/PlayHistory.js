import React, { useState, useEffect } from 'react';

const PAGE_SIZE = 20;

const PlayHistory = ({ onAddToQueue, currentQueue }) => {
  const [history, setHistory] = useState([]);
  const [totalHistory, setTotalHistory] = useState(0);
  const [totalPlayed, setTotalPlayed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null); // For displaying messages
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [refreshHistory, setRefreshHistory] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          search: searchTerm.trim()
        });
        const response = await fetch(`/api/history?${params}`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Failed to fetch history');
        }
        const data = await response.json();
        setHistory(data.items);
        setTotalHistory(data.total);
        setTotalPlayed(data.totalPlayed);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchHistory();
    return () => controller.abort();
  }, [page, searchTerm, refreshHistory]);

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
      
      if (history.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        setRefreshHistory(value => value + 1);
      }
      
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

  const totalPages = Math.ceil(totalHistory / PAGE_SIZE);
  const firstResult = totalHistory === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastResult = Math.min(page * PAGE_SIZE, totalHistory);

  if (loading) return <div>Loading history...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="play-history">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h2 className="section-title h5 mb-1">Play History</h2>
          <p className="text-secondary small mb-0">Re-queue a favorite or clean up the log.</p>
        </div>
        <div className="text-secondary small">Total played: {totalPlayed}</div>
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
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Filter by title or URL..."
          />
        </div>
      </div>
      
      {message && (
        <div className="alert alert-success py-2" role="alert">
          {message}
        </div>
      )}
      {history.length === 0 ? (
        <div className="empty-state">
          {searchTerm.trim() === '' ? 'No videos have been played yet.' : 'No matching videos found.'}
        </div>
      ) : (
        <div>
          <p className="text-secondary small">
            Showing {firstResult}–{lastResult} of {totalHistory}
          </p>
          <ul className="history-list d-grid gap-3">
            {history.map((item) => (
              <li 
                key={item.id} 
                className="history-item bg-white d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3"
              >
                <div className="history-content d-flex align-items-center gap-3">
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
                      className="history-title fw-semibold text-decoration-none text-dark"
                    >
                      {item.title || `Video (${item.videoId})`}
                    </a>
                    <p className="mb-0 text-secondary small">
                      Played at: {new Date(item.playedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="history-actions d-flex gap-2">
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
          {totalPages > 1 && (
            <nav className="d-flex justify-content-center align-items-center gap-3 mt-4" aria-label="History pagination">
              <button
                className="btn btn-outline-primary btn-sm"
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="text-secondary small">Page {page} of {totalPages}</span>
              <button
                className="btn btn-outline-primary btn-sm"
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayHistory;
