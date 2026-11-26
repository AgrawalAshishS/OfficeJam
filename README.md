# OfficeJam - Shared YouTube Playlist Player

A centralized music player web application that allows multiple users to add YouTube videos to a shared queue. The video player runs on a central machine while users from different locations can contribute to the playlist.

## Features

- Add YouTube videos to a shared queue from any device
- Centralized video player that automatically plays videos from the queue
- Real-time synchronization across all clients using Socket.IO
- Automatic playback of the next video when the current one finishes
- Shared Meeting Mode (off by default) pauses playback and resumes the interrupted track when turned off
- Searchable, paginated play history
- Responsive web interface with React frontend

## Tech Stack

- **Backend**: Node.js with Express and Socket.IO
- **Frontend**: React with Webpack
- **Real-time Communication**: Socket.IO
- **Build Tool**: Webpack

## Folder Structure

```
src/
├── client/           # React frontend components
│   ├── components/   # Reusable UI components
│   ├── App.js        # Main application component
│   └── index.js      # Entry point for React app
├── server/           # Node.js server files
│   └── server.js     # Main server file
public/               # Static assets and built files
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```bash
   cd OfficeJam
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

#### Development Mode

To run both the server and client in development mode:
```bash
npm run dev
```

This will start:
- Server on port 3004 (can be customized with SERVER_PORT environment variable)
- Client development server on port 3003 (can be customized with CLIENT_PORT environment variable)

#### Production Mode

1. Build the React application:
   ```bash
   npm run build
   ```

2. Start the server:
   ```bash
   npm start
   ```

The application will be available at http://localhost:3003 (or the port specified by CLIENT_PORT)

## Usage

1. Open the application in a browser on the central machine (this will be the video player)
2. Open the application in browsers on other devices/nodes
3. On the central machine, enable Player Mode once; playback will switch to the player automatically
4. On any device, paste YouTube URLs into the input field and click "Add to Queue"
5. The first queued video starts automatically, and the rest play in order
6. Turn on Meeting Mode on any device to stop playback and pause the queue; turn it off to resume

## Environment Variables

You can customize the application behavior using environment variables:

- `SERVER_PORT`: Port for the backend server (default: 3004)
- `CLIENT_PORT`: Port for the client development server (default: 3003)
- `YOUTUBE_API_KEY`: YouTube Data API key for exact durations and adding full playlists; video titles are fetched without a key. Without it, a playlist-style video link adds only its current video.

Create a `.env` file in the project root to set these variables:
```
SERVER_PORT=3004
CLIENT_PORT=3003
YOUTUBE_API_KEY=your_youtube_api_key_here
```

## How It Works

1. Users add YouTube videos through the "Add Videos" interface
2. Videos are added to a shared queue stored on the server
3. All connected clients receive real-time updates of the queue
4. When Meeting Mode is off, the server starts the first queued video automatically
5. When the central player finishes a video, it notifies the server and the next one starts
6. Meeting Mode stops playback and resumes the interrupted video when disabled

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.