require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialize SQLite database
const db = new sqlite3.Database('./queue.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    // Create videos table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY,
      url TEXT NOT NULL,
      videoId TEXT NOT NULL,
      title TEXT,
      duration TEXT
    )`, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      } else {
        console.log('Videos table ready');
      }
    });
  }
});

app.use(cors());
app.use(express.static(path.join(__dirname, '../../dist')));

// Store video queue in memory
let videoQueue = [];
let currentVideo = null;

// Load queue from database on startup
db.all('SELECT * FROM videos ORDER BY id', (err, rows) => {
  if (err) {
    console.error('Error loading queue from database:', err.message);
  } else {
    videoQueue = rows;
    console.log(`Loaded ${videoQueue.length} videos from database`);
  }
});

// Serve the React app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

// Endpoint to fetch YouTube video metadata
app.get('/api/video/:videoId', async (req, res) => {
  try {
    const videoId = req.params.videoId;
    
    // Check if YouTube API key is configured
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    if (!youtubeApiKey) {
      // Return mock data if no API key is configured
      console.log('No YouTube API key configured, returning mock data');
      return res.json({
        title: `YouTube Video ${videoId}`,
        duration: '0:00' // Mock duration
      });
    }
    
    // Log the API key length for debugging (don't log the actual key for security)
    console.log(`YouTube API key configured (length: ${youtubeApiKey.length})`);
    
    // Fetch actual video metadata from YouTube Data API
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${youtubeApiKey}&part=snippet,contentDetails`
      );
      
      // Log response status for debugging
      console.log(`YouTube API response status: ${response.status}`);
      
      if (response.data.items && response.data.items.length > 0) {
        const video = response.data.items[0];
        const title = video.snippet.title;
        const duration = parseISO8601Duration(video.contentDetails.duration);
        
        return res.json({
          title: title,
          duration: duration
        });
      } else {
        // Return mock data if video not found
        console.log('Video not found in YouTube API response');
        return res.json({
          title: `YouTube Video ${videoId}`,
          duration: 'Unknown'
        });
      }
    } catch (apiError) {
      console.error('YouTube API Error:', apiError.response?.data || apiError.message);
      console.error('Status:', apiError.response?.status);
      console.error('Headers:', apiError.response?.headers);
      
      // Return mock data as fallback
      return res.json({
        title: `YouTube Video ${req.params.videoId}`,
        duration: 'Unknown'
      });
    }
  } catch (error) {
    console.error('Error fetching video metadata:', error.message);
    // Return mock data as fallback
    res.json({
      title: `YouTube Video ${req.params.videoId}`,
      duration: 'Unknown'
    });
  }
});

// Endpoint to fetch YouTube playlist items
app.get('/api/playlist/:playlistId', async (req, res) => {
  try {
    const playlistId = req.params.playlistId;
    
    // Check if YouTube API key is configured
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    if (!youtubeApiKey) {
      return res.status(400).json({ error: 'YouTube API key not configured' });
    }
    
    // Fetch playlist items from YouTube Data API
    const maxResults = 50; // Maximum allowed per request
    let allItems = [];
    let nextPageToken = null;
    
    do {
      let url = `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${playlistId}&key=${youtubeApiKey}&part=snippet,contentDetails&maxResults=${maxResults}`;
      if (nextPageToken) {
        url += `&pageToken=${nextPageToken}`;
      }
      
      const response = await axios.get(url);
      
      if (response.data.items) {
        allItems = allItems.concat(response.data.items);
      }
      
      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);
    
    // Transform the data to match our video format
    const videos = allItems
      .filter(item => item.snippet.resourceId.kind === 'youtube#video')
      .map(item => ({
        id: Date.now() + Math.random(), // Temporary ID, will be replaced by client
        url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
        videoId: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        duration: 'Unknown' // Will be fetched separately if needed
      }));
    
    return res.json({ videos });
  } catch (error) {
    console.error('Error fetching playlist items:', error.message);
    return res.status(500).json({ error: 'Failed to fetch playlist items' });
  }
});

// Helper function to validate YouTube URLs
function isValidYouTubeUrl(url) {
  try {
    const urlObj = new URL(url);
    
    // Check if it's a YouTube domain
    const validDomains = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'];
    if (!validDomains.includes(urlObj.hostname)) {
      return false;
    }
    
    // For youtu.be short URLs
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.length > 1; // Must have a video ID
    }
    
    // For full YouTube URLs, must have watch path and v parameter
    if (urlObj.pathname === '/watch' && urlObj.searchParams.has('v')) {
      const videoId = urlObj.searchParams.get('v');
      return videoId && videoId.length === 11; // YouTube video IDs are 11 characters
    }
    
    // For embed URLs
    if (urlObj.pathname.startsWith('/embed/')) {
      const videoId = urlObj.pathname.split('/')[2];
      return videoId && videoId.length === 11;
    }
    
    return false;
  } catch (error) {
    // Invalid URL format
    return false;
  }
}

// Helper function to sanitize video data
function sanitizeVideoData(videoData) {
  // Remove any potentially dangerous properties
  const sanitized = {};
  
  // Only allow specific properties
  if (videoData.id) sanitized.id = videoData.id;
  if (videoData.url) sanitized.url = videoData.url;
  if (videoData.videoId) sanitized.videoId = videoData.videoId;
  if (videoData.title) sanitized.title = videoData.title;
  if (videoData.duration) sanitized.duration = videoData.duration;
  
  // Validate URL
  if (sanitized.url && !isValidYouTubeUrl(sanitized.url)) {
    throw new Error('Invalid YouTube URL');
  }
  
  return sanitized;
}

// Helper function to parse ISO 8601 duration format
function parseISO8601Duration(duration) {
  // Parse PT1H30M15S format
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 'Unknown';
  
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Send current queue to newly connected client
  socket.emit('queue_update', videoQueue);
  
  // Handle adding video to queue
  socket.on('add_video', (videoData) => {
    try {
      console.log('Adding video to queue:', videoData);
      
      // Sanitize and validate video data
      const sanitizedData = sanitizeVideoData(videoData);
      
      videoQueue.push(sanitizedData);
      console.log('Updated queue:', videoQueue);
      
      // Save to database
      const stmt = db.prepare('INSERT INTO videos (id, url, videoId, title, duration) VALUES (?, ?, ?, ?, ?)');
      stmt.run(sanitizedData.id, sanitizedData.url, sanitizedData.videoId, sanitizedData.title, sanitizedData.duration, (err) => {
        if (err) {
          console.error('Error saving video to database:', err.message);
        } else {
          console.log('Video saved to database');
        }
      });
      stmt.finalize();
      
      io.emit('queue_update', videoQueue);
    } catch (error) {
      console.error('Error adding video to queue:', error.message);
      // Optionally send error back to client
      socket.emit('error', { message: 'Invalid video data' });
    }
  });
  
  // Handle video finished event
  socket.on('video_finished', () => {
    console.log('Video finished, moving to next');
    if (videoQueue.length > 0) {
      currentVideo = videoQueue.shift();
      
      // Validate currentVideo has valid ID
      if (!currentVideo || typeof currentVideo.id !== 'number' || !Number.isInteger(currentVideo.id)) {
        console.error('Invalid current video for deletion:', currentVideo);
        currentVideo = null;
        io.emit('stop_video');
        return;
      }
      
      // Remove from database
      const stmt = db.prepare('DELETE FROM videos WHERE id = ?');
      stmt.run(currentVideo.id, (err) => {
        if (err) {
          console.error('Error deleting video from database:', err.message);
        } else {
          console.log('Video deleted from database');
        }
      });
      stmt.finalize();
      
      io.emit('queue_update', videoQueue);
      io.emit('play_video', currentVideo);
    } else {
      currentVideo = null;
      io.emit('stop_video');
    }
  });
  
  // Handle manual play request
  socket.on('play_next', () => {
    if (videoQueue.length > 0) {
      currentVideo = videoQueue.shift();
      
      // Validate currentVideo has valid ID
      if (!currentVideo || typeof currentVideo.id !== 'number' || !Number.isInteger(currentVideo.id)) {
        console.error('Invalid current video for deletion:', currentVideo);
        currentVideo = null;
        io.emit('stop_video');
        return;
      }
      
      // Remove from database
      const stmt = db.prepare('DELETE FROM videos WHERE id = ?');
      stmt.run(currentVideo.id, (err) => {
        if (err) {
          console.error('Error deleting video from database:', err.message);
        } else {
          console.log('Video deleted from database');
        }
      });
      stmt.finalize();
      
      io.emit('queue_update', videoQueue);
      io.emit('play_video', currentVideo);
    }
  });
  
  // Handle video deletion from queue
  socket.on('delete_video', (videoId) => {
    // Validate videoId is a number
    if (typeof videoId !== 'number' || !Number.isInteger(videoId)) {
      console.error('Invalid video ID for deletion:', videoId);
      socket.emit('error', { message: 'Invalid video ID' });
      return;
    }
    
    console.log('Deleting video from queue:', videoId);
    videoQueue = videoQueue.filter(video => video.id !== videoId);
    
    // Remove from database
    const stmt = db.prepare('DELETE FROM videos WHERE id = ?');
    stmt.run(videoId, (err) => {
      if (err) {
        console.error('Error deleting video from database:', err.message);
      } else {
        console.log('Video deleted from database');
      }
    });
    stmt.finalize();
    
    io.emit('queue_update', videoQueue);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3004;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Close database connection when server shuts down
process.on('SIGINT', () => {
  console.log('Closing database connection');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});