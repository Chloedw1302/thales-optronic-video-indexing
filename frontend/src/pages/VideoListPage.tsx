import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoList } from '@/components/video/VideoList';
import type { VideoStatus } from '@/types/video';

type FilterTab = 'all' | VideoStatus;

export function VideoListPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const tabs: { value: FilterTab; label: string }[] = [
    { value: 'all', label: 'All Videos' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Video Library</h1>
          <p className="text-muted-foreground mt-2">
            Manage and view all your uploaded videos
          </p>
        </div>
        <Link to="/upload">
          <Button variant="gradient">
            <Upload className="h-4 w-4 mr-2" />
            Upload New Video
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-border">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`pb-3 px-2 border-b-2 transition-colors font-medium ${
                activeTab === tab.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Video List */}
      <VideoList statusFilter={activeTab} />
    </div>
  );
}
