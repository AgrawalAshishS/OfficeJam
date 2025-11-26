# Shared YouTube Playlist Player

A centralized music player web application that allows multiple users to add YouTube videos to a shared queue. The video player runs on a central machine while users from different locations can contribute to the playlist.

## Features

- Add YouTube videos to a shared queue from any device
- Centralized video player that automatically plays videos from the queue
- Real-time synchronization across all clients using Socket.IO
- Automatic playback of the next video when the current one finishes
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
   cd SharedYTListPlayer
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
- Server on port 3000
- Client development server on port 3001

#### Production Mode

1. Build the React application:
   ```bash
   npm run build
   ```

2. Start the server:
   ```bash
   npm start
   ```

The application will be available at http://localhost:3000

## Usage

1. Open the application in a browser on the central machine (this will be the video player)
2. Open the application in browsers on other devices/nodes
3. On any device, paste YouTube URLs into the input field and click "Add to Queue"
4. On the central machine, click "Play Videos" tab to view the player
5. Videos will automatically play one after another from the queue

## How It Works

1. Users add YouTube videos through the "Add Videos" interface
2. Videos are added to a shared queue stored on the server
3. All connected clients receive real-time updates of the queue
4. When the central player finishes a video, it notifies the server
5. The server removes the played video from the queue and sends the next one
6. The central player receives the new video and starts playing it

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.