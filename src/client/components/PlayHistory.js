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
      <h2>Play History</h2>
      
      {/* Search input */}
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
      
      {message && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          border: '1px solid #c3e6cb', 
          borderRadius: '4px', 
          marginBottom: '15px' 
        }}>
          {message}
        </div>
      )}
      {filteredHistory.length === 0 ? (
        <p>{searchTerm.trim() === '' ? 'No videos have been played yet.' : 'No matching videos found.'}</p>
      ) : (
        <div>
          <p>Total videos played: {filteredHistory.length} {searchTerm.trim() !== '' && `(filtered from ${history.length})`}</p>
          <ul>
            {filteredHistory.map((item) => (
              <li 
                key={item.id} 
                style={{ 
                  margin: '10px 0', 
                  padding: '10px', 
                  border: '1px solid #ccc',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                {/* Thumbnail and video info */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ marginRight: '10px' }}>
                    <img 
                      src={`https://img.youtube.com/vi/${item.videoId}/default.jpg`} 
                      alt={item.title || `Thumbnail for ${item.videoId}`}
                      style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        textDecoration: 'none', 
                        color: 'inherit',
                        fontWeight: 'bold'
                      }}
                    >
                      {item.title || `Video (${item.videoId})`}
                    </a>
                    <p style={{ 
                      margin: '5px 0 0 0', 
                      fontSize: '0.9em', 
                      color: '#666' 
                    }}>
                      Played at: {new Date(item.playedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div>
                  {!isVideoInQueue(item.videoId) ? (
                    <button 
                      onClick={() => handleAddToQueue(item)}
                      style={{ 
                        padding: '5px 10px', 
                        backgroundColor: '#28a745', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        marginRight: '5px'
                      }}
                    >
                      Add to Queue
                    </button>
                  ) : (
                    <span style={{ 
                      padding: '5px 10px', 
                      backgroundColor: '#6c757d', 
                      color: 'white', 
                      borderRadius: '4px', 
                      marginRight: '5px'
                    }}>
                      Already in Queue
                    </span>
                  )}
                  <button 
                    onClick={() => handleDeleteFromHistory(item.id, item.title || item.videoId)}
                    style={{ 
                      padding: '5px 10px', 
                      backgroundColor: '#dc3545', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer'
                    }}
                  >
                    Delete
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