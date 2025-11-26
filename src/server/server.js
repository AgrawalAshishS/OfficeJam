require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.static(path.join(__dirname, '../../dist')));

// Store video queue in memory
let videoQueue = [];
let currentVideo = null;

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
    console.log('Adding video to queue:', videoData);
    videoQueue.push(videoData);
    console.log('Updated queue:', videoQueue);
    io.emit('queue_update', videoQueue);
  });
  
  // Handle video finished event
  socket.on('video_finished', () => {
    console.log('Video finished, moving to next');
    if (videoQueue.length > 0) {
      currentVideo = videoQueue.shift();
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
      io.emit('queue_update', videoQueue);
      io.emit('play_video', currentVideo);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3004;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});