import { Link } from 'react-router-dom';
import { Upload, Video, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useVideos } from '@/hooks/useVideos';

export function HomePage() {
  const { data } = useVideos({ limit: 5 });

  const stats = {
    total: data?.total || 0,
    processing: data?.videos.filter((v) => v.status === 'processing').length || 0,
    completed: data?.videos.filter((v) => v.status === 'completed').length || 0,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      {/* Hero Section */}
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-foreground">
          Thales Video Indexing
        </h1>
        <p className="text-base text-foreground-muted max-w-3xl leading-relaxed">
          Advanced video processing platform with AI-powered entity detection and comprehensive analytics.
        </p>
        <div className="flex flex-wrap gap-4 pt-4">
          <Link to="/upload">
            <Button variant="default" size="default" className="px-6">
              <Upload className="h-4 w-4 mr-2" />
              Upload Video
            </Button>
          </Link>
          <Link to="/videos">
            <Button variant="outline" size="default" className="px-6">
              <Video className="h-4 w-4 mr-2" />
              View Library
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Total Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent-orange">{stats.processing}</div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent-green">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-hover">
          <CardHeader className="space-y-3">
            <div className="w-10 h-10 bg-primary/10 rounded-sm flex items-center justify-center border border-primary/20">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base font-medium">Easy Upload</CardTitle>
            <CardDescription className="text-foreground-muted leading-relaxed">
              Drag and drop your videos for quick upload. Supports MP4, MKV, AVI, and MOV formats.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="card-hover">
          <CardHeader className="space-y-3">
            <div className="w-10 h-10 bg-accent-orange/10 rounded-sm flex items-center justify-center border border-accent-orange/20">
              <Play className="h-5 w-5 text-accent-orange" />
            </div>
            <CardTitle className="text-base font-medium">Automated Processing</CardTitle>
            <CardDescription className="text-foreground-muted leading-relaxed">
              Videos are processed automatically with configurable frame extraction intervals.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="card-hover">
          <CardHeader className="space-y-3">
            <div className="w-10 h-10 bg-accent-blue/10 rounded-sm flex items-center justify-center border border-accent-blue/20">
              <Video className="h-5 w-5 text-accent-blue" />
            </div>
            <CardTitle className="text-base font-medium">Entity Detection</CardTitle>
            <CardDescription className="text-foreground-muted leading-relaxed">
              Advanced AI identifies and tracks entities throughout your videos with detailed reports.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Videos */}
      {data && data.videos.length > 0 && (
        <Card className="card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Recent Videos</CardTitle>
              <Link to="/videos">
                <Button variant="ghost" size="sm" className="hover:bg-accent-hover text-foreground-muted hover:text-foreground">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.videos.slice(0, 5).map((video) => (
                <Link
                  key={video.id}
                  to={`/videos/${video.id}`}
                  className="block p-3 rounded-sm border border-border hover:border-primary/30 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium truncate text-foreground">{video.original_filename}</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-sm whitespace-nowrap status-${video.status}`}>
                      {video.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
