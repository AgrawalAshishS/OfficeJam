import React, { useEffect, useRef, useState } from 'react';

const VideoPlayer = ({ currentVideo, queue, onVideoFinished, onPlayNext, onDeleteVideo, onDeleteMultipleVideos }) => {
  const playerRef = useRef(null);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter queue based on search term
  const filteredQueue = queue.filter(video => 
    (video.title && video.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (video.url && video.url.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
    const allVideoIds = filteredQueue.map(video => video.id);
    setSelectedVideos(allVideoIds);
  };
  
  const deselectAllVideos = () => {
    setSelectedVideos([]);
  };

  return (
    <div className="video-player">
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '0', 
        paddingBottom: '56.25%' // 16:9 aspect ratio
      }}>
        {currentVideo ? (
          <iframe
            ref={playerRef}
            src={`https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}
          ></iframe>
        ) : (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
            color: '#fff',
            fontSize: '1.2em'
          }}>
            No video playing
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        {currentVideo ? (
          <div>
            <h3>Now Playing</h3>
            <div style={{ 
              padding: '15px', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              marginBottom: '15px'
            }}>
              <a 
                href={currentVideo.url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  textDecoration: 'none', 
                  color: 'inherit',
                  fontWeight: 'bold',
                  fontSize: '1.1em'
                }}
              >
                {currentVideo.title || `Video (${currentVideo.videoId})`}
              </a>
              {currentVideo.duration && <span style={{ marginLeft: '10px', fontStyle: 'italic' }}>{currentVideo.duration}</span>}
            </div>
            
            <div>
              <button onClick={onPlayNext} style={{ padding: '10px 20px', marginRight: '10px' }}>
                Play Next Video
              </button>
              <button onClick={onVideoFinished} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Skip Current
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p>No video currently playing.</p>
            {queue.length > 0 && (
              <div>
                <button onClick={onPlayNext} style={{ padding: '10px 20px', marginRight: '10px' }}>
                  Play Next Video
                </button>
                <button onClick={onVideoFinished} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Skip Current
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="queue-section">
        <h3>Up Next ({filteredQueue.length} videos)</h3>
        
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
        
        {filteredQueue.length === 0 ? (
          <p>{searchTerm.trim() === '' ? 'No videos in queue.' : 'No matching videos found.'}</p>
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
                  Select All ({filteredQueue.length})
                </button>
              )}
            </div>
            <ul>
              {filteredQueue.map((video, index) => (
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
                    <div>
                      <span style={{ fontWeight: 'bold' }}>#{index + 1}</span> - 
                      <a 
                        href={video.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none', color: 'inherit', marginLeft: '5px' }}
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

export default VideoPlayer;