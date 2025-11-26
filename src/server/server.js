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
    // For demo purposes, we'll return mock data
    // In a real application, you would use the YouTube Data API
    res.json({
      title: `YouTube Video ${videoId}`,
      duration: '3:45' // Mock duration
    });
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    res.status(500).json({ error: 'Failed to fetch video metadata' });
  }
});

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