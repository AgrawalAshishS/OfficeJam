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

// Get ports from environment variables or use defaults
const SERVER_PORT = process.env.CLIENT_PORT || 3003;
const CLIENT_PORT = process.env.CLIENT_PORT || 3003;

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

    // Create played videos history table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS played_videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      videoId TEXT NOT NULL,
      title TEXT,
      url TEXT NOT NULL,
      playedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating played_videos table:', err.message);
      } else {
        console.log('Played videos table ready');
        db.run('CREATE INDEX IF NOT EXISTS idx_played_videos_played_at_id ON played_videos (playedAt DESC, id DESC)', (indexError) => {
          if (indexError) {
            console.error('Error creating played videos index:', indexError.message);
          }
        });
      }
    });
  }
});

app.use(cors());
app.use(express.static(path.join(__dirname, '../../dist')));

// Store video queue in memory
let videoQueue = [];
let currentVideo = null;
let pausedVideo = null;
let meetingMode = false;

function startNextVideo() {
  if (meetingMode || videoQueue.length === 0) {
    return false;
  }

  currentVideo = videoQueue.shift();
  if (!currentVideo || !Number.isInteger(currentVideo.id)) {
    console.error('Invalid current video:', currentVideo);
    currentVideo = null;
    io.emit('stop_video');
    return false;
  }

  const historyStmt = db.prepare('INSERT INTO played_videos (videoId, title, url) VALUES (?, ?, ?)');
  historyStmt.run(currentVideo.videoId, currentVideo.title, currentVideo.url, (err) => {
    if (err) {
      console.error('Error recording played video:', err.message);
    }
  });
  historyStmt.finalize();

  const stmt = db.prepare('DELETE FROM videos WHERE id = ?');
  stmt.run(currentVideo.id, (err) => {
    if (err) {
      console.error('Error deleting video from database:', err.message);
    }
  });
  stmt.finalize();

  io.emit('queue_update', videoQueue);
  io.emit('play_video', currentVideo);
  return true;
}

async function fetchYouTubeVideoMetadata(videoId) {
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  if (youtubeApiKey) {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          id: videoId,
          key: youtubeApiKey,
          part: 'snippet,contentDetails'
        }
      });
      const video = response.data.items && response.data.items[0];
      if (video) {
        return {
          title: video.snippet.title,
          duration: parseISO8601Duration(video.contentDetails.duration)
        };
      }
    } catch (error) {
      console.error('YouTube Data API error:', error.response?.data || error.message);
    }
  }

  const response = await axios.get('https://www.youtube.com/oembed', {
    params: {
      url: `https://www.youtube.com/watch?v=${videoId}`,
      format: 'json'
    }
  });
  return { title: response.data.title, duration: 'Unknown' };
}

function isPlaceholderTitle(video) {
  return !video.title ||
    video.title === video.url ||
    video.title.startsWith('YouTube Video ') ||
    /^Video \d+$/.test(video.title);
}

async function refreshQueuedVideoMetadata() {
  await Promise.all(videoQueue.filter(isPlaceholderTitle).map(async (video) => {
    try {
      const metadata = await fetchYouTubeVideoMetadata(video.videoId);
      video.title = metadata.title;
      video.duration = metadata.duration;
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE videos SET title = ?, duration = ? WHERE id = ?',
          [metadata.title, metadata.duration, video.id],
          (error) => error ? reject(error) : resolve()
        );
      });
    } catch (error) {
      console.error(`Error refreshing metadata for ${video.videoId}:`, error.message);
    }
  }));
}

// Load queue from database on startup
db.all('SELECT * FROM videos ORDER BY id', (err, rows) => {
  if (err) {
    console.error('Error loading queue from database:', err.message);
  } else {
    videoQueue = rows;
    console.log(`Loaded ${videoQueue.length} videos from database`);
    refreshQueuedVideoMetadata().then(() => {
      io.emit('queue_update', videoQueue);
      if (!meetingMode) startNextVideo();
    });
  }
});

// Serve the React app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

// Endpoint to fetch YouTube video metadata
app.get('/api/video/:videoId', async (req, res) => {
  try {
    res.json(await fetchYouTubeVideoMetadata(req.params.videoId));
  } catch (error) {
    console.error('Error fetching video metadata:', error.response?.data || error.message);
    res.status(502).json({ error: 'Unable to fetch YouTube video metadata' });
  }
});

// Endpoint to fetch played video history
app.get('/api/history', (req, res) => {
  const requestedPage = Number.parseInt(req.query.page, 10);
  const requestedPageSize = Number.parseInt(req.query.limit, 10);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageSize = Number.isSafeInteger(requestedPageSize) && requestedPageSize > 0
    ? Math.min(requestedPageSize, 100)
    : 20;
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const where = search ? 'WHERE title LIKE ? OR url LIKE ? OR videoId LIKE ?' : '';
  const searchParams = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];

  db.get(
    `SELECT COUNT(*) AS total, (SELECT COUNT(*) FROM played_videos) AS totalPlayed FROM played_videos ${where}`,
    searchParams,
    (countError, counts) => {
      if (countError) {
        console.error('Error counting history:', countError.message);
        return res.status(500).json({ error: 'Failed to fetch history' });
      }

      db.all(
        `SELECT * FROM played_videos ${where} ORDER BY playedAt DESC, id DESC LIMIT ? OFFSET ?`,
        [...searchParams, pageSize, (page - 1) * pageSize],
        (err, rows) => {
          if (err) {
            console.error('Error fetching history:', err.message);
            return res.status(500).json({ error: 'Failed to fetch history' });
          }
          res.json({
            items: rows,
            total: counts.total,
            totalPlayed: counts.totalPlayed,
            page,
            pageSize
          });
        }
      );
    }
  );
});

// Endpoint to delete a video from history
app.delete('/api/history/:id', (req, res) => {
  const id = req.params.id;

  // Validate ID is a number
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid video ID' });
  }

  db.run('DELETE FROM played_videos WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Error deleting history record:', err.message);
      return res.status(500).json({ error: 'Failed to delete history record' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'History record not found' });
    }

    res.json({ message: 'History record deleted successfully' });
  });
});

// Endpoint to fetch YouTube playlist items
app.get('/api/playlist/:playlistId', async (req, res) => {
  try {
    const playlistId = req.params.playlistId;
    console.log(`Received playlist request for ID: "${playlistId}"`);

    // Check if YouTube API key is configured
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    if (!youtubeApiKey) {
      return res.status(400).json({
        error: 'YouTube API key not configured',
        code: 'YOUTUBE_API_KEY_MISSING'
      });
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

      const response = await axios.get(url, {
        headers: {
          'Referer': 'http://localhost:3004' // Provide a referer in case of restrictions
        }
      });

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
    const status = error.response ? error.response.status : 500;
    const message = error.response?.data?.error?.message || 'Failed to fetch playlist items';
    return res.status(status).json({ error: message });
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
  socket.emit('playback_state', { meetingMode, currentVideo });

  socket.on('player_mode', (enabled) => {
    if (enabled && !meetingMode && currentVideo) {
      socket.emit('play_video', currentVideo);
    }
  });

  socket.on('meeting_mode', (enabled) => {
    meetingMode = Boolean(enabled);
    if (meetingMode && currentVideo) {
      pausedVideo = currentVideo;
      currentVideo = null;
      io.emit('stop_video');
    } else if (!meetingMode && pausedVideo) {
      currentVideo = pausedVideo;
      pausedVideo = null;
      io.emit('play_video', currentVideo);
    } else if (!meetingMode) {
      startNextVideo();
    }
    io.emit('meeting_mode_update', meetingMode);
  });

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
      if (!meetingMode && !currentVideo && !pausedVideo) {
        startNextVideo();
      }
    } catch (error) {
      console.error('Error adding video to queue:', error.message);
      // Optionally send error back to client
      socket.emit('error', { message: 'Invalid video data' });
    }
  });

  // Handle video finished event
  socket.on('video_finished', () => {
    console.log('Video finished, moving to next');
    if (meetingMode) return;
    currentVideo = null;
    if (!startNextVideo()) {
      currentVideo = null;
      io.emit('stop_video');
    }
  });

  // Handle manual play request
  socket.on('play_next', () => {
    if (!meetingMode) startNextVideo();
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

  // Handle multiple videos deletion from queue
  socket.on('delete_multiple_videos', (videoIds) => {
    // Validate videoIds is an array of numbers
    if (!Array.isArray(videoIds) || videoIds.length === 0 || videoIds.some(id => typeof id !== 'number' || !Number.isInteger(id))) {
      console.error('Invalid video IDs for deletion:', videoIds);
      socket.emit('error', { message: 'Invalid video IDs' });
      return;
    }

    console.log('Deleting multiple videos from queue:', videoIds);
    videoQueue = videoQueue.filter(video => !videoIds.includes(video.id));

    // Remove from database in a single transaction
    const placeholders = videoIds.map(() => '?').join(',');
    const stmt = db.prepare(`DELETE FROM videos WHERE id IN (${placeholders})`);
    stmt.run(...videoIds, (err) => {
      if (err) {
        console.error('Error deleting videos from database:', err.message);
      } else {
        console.log(`${videoIds.length} videos deleted from database`);
      }
    });
    stmt.finalize();

    io.emit('queue_update', videoQueue);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(SERVER_PORT, () => {
  console.log(`Server running on port ${SERVER_PORT}`);
  console.log(`Client application available at http://localhost:${CLIENT_PORT}`);
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