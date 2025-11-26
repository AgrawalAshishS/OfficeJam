const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

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

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Send current queue to newly connected client
  socket.emit('queue_update', videoQueue);
  
  // Send current playing video
  if (currentVideo) {
    socket.emit('video_playing', currentVideo);
  }
  
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