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
    <div className="space-y-12 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-6 pt-8 pb-4">
        <h1 className="text-6xl font-bold gradient-text">
          Thales Video Indexing
        </h1>
        <p className="text-xl text-foreground-muted max-w-2xl mx-auto leading-relaxed">
          Advanced video processing platform with AI-powered entity detection and comprehensive analytics.
        </p>
        <div className="flex justify-center gap-4 pt-8">
          <Link to="/upload">
            <Button variant="default" size="lg" className="px-8 bg-primary hover:bg-primary-hover text-white font-semibold shadow-glow">
              <Upload className="h-5 w-5 mr-2" />
              Upload Video
            </Button>
          </Link>
          <Link to="/videos">
            <Button variant="outline" size="lg" className="px-8 border-border-subtle hover:bg-accent hover:border-primary/30 font-semibold">
              <Video className="h-5 w-5 mr-2" />
              View Library
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-hover bg-background-card border-border-subtle">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Total Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-primary">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="card-hover bg-background-card border-border-subtle">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-accent-yellow">{stats.processing}</div>
          </CardContent>
        </Card>

        <Card className="card-hover bg-background-card border-border-subtle">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-accent-green">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-hover bg-background-card border-border-subtle">
          <CardHeader className="space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center ring-1 ring-primary/20">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg font-semibold">Easy Upload</CardTitle>
            <CardDescription className="text-foreground-muted leading-relaxed">
              Drag and drop your videos for quick upload. Supports MP4, MKV, AVI, and MOV formats.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="card-hover bg-background-card border-border-subtle">
          <CardHeader className="space-y-4">
            <div className="w-12 h-12 bg-accent-yellow/10 rounded-lg flex items-center justify-center ring-1 ring-accent-yellow/20">
              <Play className="h-6 w-6 text-accent-yellow" />
            </div>
            <CardTitle className="text-lg font-semibold">Automated Processing</CardTitle>
            <CardDescription className="text-foreground-muted leading-relaxed">
              Videos are processed automatically with configurable frame extraction intervals.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="card-hover bg-background-card border-border-subtle">
          <CardHeader className="space-y-4">
            <div className="w-12 h-12 bg-accent-blue/10 rounded-lg flex items-center justify-center ring-1 ring-accent-blue/20">
              <Video className="h-6 w-6 text-accent-blue" />
            </div>
            <CardTitle className="text-lg font-semibold">Entity Detection</CardTitle>
            <CardDescription className="text-foreground-muted leading-relaxed">
              Advanced AI identifies and tracks entities throughout your videos with detailed reports.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Videos */}
      {data && data.videos.length > 0 && (
        <Card className="bg-background-card border-border-subtle">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">Recent Videos</CardTitle>
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
                  className="block p-4 rounded-lg border border-border-subtle hover:border-primary/30 hover:bg-accent transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium truncate text-foreground">{video.original_filename}</span>
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${
                      video.status === 'completed' ? 'bg-accent-green/10 text-accent-green ring-1 ring-accent-green/20' :
                      video.status === 'processing' ? 'bg-accent-yellow/10 text-accent-yellow ring-1 ring-accent-yellow/20' :
                      'bg-muted/50 text-foreground-muted ring-1 ring-border'
                    }`}>
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
