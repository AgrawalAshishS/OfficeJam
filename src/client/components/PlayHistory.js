import React, { useState, useEffect } from 'react';

const PlayHistory = ({ onAddToQueue }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3004/api/history');
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToQueue = (video) => {
    // Pass the URL string directly to the onAddToQueue function
    onAddToQueue(video.url);
  };

  if (loading) return <div>Loading history...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="play-history">
      <h2>Play History</h2>
      {history.length === 0 ? (
        <p>No videos have been played yet.</p>
      ) : (
        <div>
          <p>Total videos played: {history.length}</p>
          <ul>
            {history.map((item) => (
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
                <button 
                  onClick={() => handleAddToQueue(item)}
                  style={{ 
                    padding: '5px 10px', 
                    backgroundColor: '#28a745', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer',
                    marginLeft: '10px'
                  }}
                >
                  Add to Queue
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PlayHistory;