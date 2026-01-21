# Thales Video Indexing Frontend

A modern React frontend application for the Thales Video Indexing API, built with TypeScript, TanStack Query, and Tailwind CSS.

## Features

- **Video Upload**: Drag-and-drop interface for uploading videos with optional voice description files
- **Real-time Progress Tracking**: Automatic polling to track video processing status
- **Video Library**: Browse, filter, and search through uploaded videos
- **Entity Detection Reports**: View detailed analysis reports with entity detection results
- **Frame Gallery**: Browse extracted frames with lightbox viewing
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **TanStack Query** (React Query) for server state management
- **React Router v6** for client-side routing
- **Tailwind CSS** for styling
- **shadcn/ui** components for UI elements
- **React Dropzone** for file uploads
- **Lucide React** for icons
- **Recharts** for data visualization
- **date-fns** for date formatting

## Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on port 8000

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` if your API is running on a different port:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:3000

The Vite dev server includes a proxy configuration that forwards `/api` requests to the backend API at `http://localhost:8000`.

## Building for Production

Build the application:

```bash
npm run build
```

The built files will be in the `dist/` directory.

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── api/                    # API client and endpoints
│   ├── components/
│   │   ├── common/            # Reusable components
│   │   ├── layout/            # Layout components
│   │   ├── ui/                # UI primitives (shadcn/ui)
│   │   └── video/             # Video-specific components
│   ├── hooks/                 # React Query hooks
│   ├── pages/                 # Page components
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   ├── lib/                   # Library utilities
│   ├── App.tsx                # Root component with routing
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── public/                    # Static assets
├── index.html                # HTML template
├── vite.config.ts            # Vite configuration
├── tailwind.config.js        # Tailwind configuration
└── tsconfig.json             # TypeScript configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Usage

### Uploading a Video

1. Navigate to the Upload page
2. Drag and drop a video file or click to browse
3. Optionally add a voice description text file
4. Set the frame extraction interval (1-60 seconds)
5. Click "Upload and Process"
6. You'll be redirected to the video details page where you can track progress

### Viewing Videos

1. Navigate to the Videos page
2. Use the tabs to filter by status (All, Processing, Completed, Failed)
3. Click "View Details" on any video card to see full information
4. For completed videos, view the analysis report and frame gallery

### Video Processing Status

The application automatically polls for status updates every 1.5 seconds while a video is processing. The progress bar and status messages update in real-time.

## API Integration

The frontend communicates with the FastAPI backend through the following endpoints:

- `POST /api/v1/videos/upload` - Upload video
- `GET /api/v1/videos` - List videos (with pagination and filtering)
- `GET /api/v1/videos/:id` - Get video details
- `GET /api/v1/videos/:id/status` - Get processing status
- `GET /api/v1/videos/:id/report` - Get analysis report
- `DELETE /api/v1/videos/:id` - Delete video
- `GET /api/v1/videos/:id/download/video` - Download video file
- `GET /api/v1/videos/:id/download/report` - Download report
- `GET /api/v1/videos/:id/frames/:frameNum` - Get frame image

## Troubleshooting

### Port 3000 already in use

Change the port in `vite.config.ts`:

```typescript
server: {
  port: 3001, // Use different port
  // ...
}
```

### API connection issues

1. Ensure the backend API is running on port 8000
2. Check the `VITE_API_URL` in your `.env` file
3. Verify the proxy configuration in `vite.config.ts`

### Build errors

1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Clear Vite cache:
   ```bash
   rm -rf node_modules/.vite
   ```

## License

This project is part of the Thales Optronic Video Indexing system.
