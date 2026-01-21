import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { videosApi } from '@/api/videos';

interface FrameViewerProps {
  videoId: string;
  totalFrames: number;
}

export function FrameViewer({ videoId, totalFrames }: FrameViewerProps) {
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const framesPerPage = 12;

  const totalPages = Math.ceil(totalFrames / framesPerPage);
  const startFrame = currentPage * framesPerPage;
  const endFrame = Math.min(startFrame + framesPerPage, totalFrames);

  const frameNumbers = Array.from(
    { length: endFrame - startFrame },
    (_, i) => startFrame + i
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Extracted Frames ({totalFrames} total)</CardTitle>
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {frameNumbers.map((frameNum) => (
              <div
                key={frameNum}
                className="relative group cursor-pointer rounded-lg overflow-hidden border hover:border-primary transition-colors"
                onClick={() => setSelectedFrame(frameNum)}
              >
                <img
                  src={videosApi.getFrameUrl(videoId, frameNum)}
                  alt={`Frame ${frameNum}`}
                  className="w-full h-40 object-cover"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 px-2">
                  Frame {frameNum}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lightbox */}
      {selectedFrame !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedFrame(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setSelectedFrame(null)}
          >
            <X className="h-8 w-8" />
          </button>

          <div className="relative max-w-5xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={videosApi.getFrameUrl(videoId, selectedFrame)}
              alt={`Frame ${selectedFrame}`}
              className="max-w-full max-h-[85vh] object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white py-2 px-4 flex items-center justify-between">
              <span>Frame {selectedFrame}</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFrame((f) => Math.max(0, (f || 0) - 1))}
                  disabled={selectedFrame === 0}
                  className="text-white hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFrame((f) => Math.min(totalFrames - 1, (f || 0) + 1))}
                  disabled={selectedFrame === totalFrames - 1}
                  className="text-white hover:text-white"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
