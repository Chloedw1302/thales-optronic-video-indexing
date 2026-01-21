import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { useVideoReport } from '@/hooks/useVideoReport';
import { formatDuration } from '@/utils/formatters';
import { TimelineVisualization } from './TimelineVisualization';
import { EntityTimelineChart } from './EntityTimelineChart';

interface ReportViewProps {
  videoId: string;
}

export function ReportView({ videoId }: ReportViewProps) {
  const { data: report, isLoading, isError, error } = useVideoReport(videoId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (isError || !report) {
    return (
      <ErrorMessage
        title="Report Not Available"
        message={error instanceof Error ? error.message : 'Failed to load report'}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="text-2xl font-bold">{formatDuration(report.duration_seconds)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Frames Analyzed</p>
              <p className="text-2xl font-bold">{report.total_frames_analyzed}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Interval</p>
              <p className="text-2xl font-bold">{report.interval_seconds}s</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Unique Entities</p>
              <p className="text-2xl font-bold">{report.unique_entities.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unique Entities */}
      <Card>
        <CardHeader>
          <CardTitle>Detected Entities</CardTitle>
        </CardHeader>
        <CardContent>
          {report.unique_entities.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {report.unique_entities.map((entity) => (
                <Badge key={entity} variant="secondary" className="text-sm">
                  {entity}
                  {report.entity_appearances[entity] && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({report.entity_appearances[entity].count || 0})
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No entities detected</p>
          )}
        </CardContent>
      </Card>

      {/* Entity Timeline Chart */}
      <EntityTimelineChart report={report} />

      {/* Timeline Visualization */}
      <TimelineVisualization report={report} />

      {/* Entity Appearances Details */}
      {Object.keys(report.entity_appearances).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Entity Appearance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(report.entity_appearances).map(([entity, data]: [string, any]) => (
                <div key={entity} className="border-b pb-4 last:border-b-0">
                  <h4 className="font-medium mb-2">{entity}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Appearances: </span>
                      <span className="font-medium">{data.count || 0}</span>
                    </div>
                    {data.first_seen && (
                      <div>
                        <span className="text-muted-foreground">First seen: </span>
                        <span className="font-medium">Frame {data.first_seen}</span>
                      </div>
                    )}
                    {data.last_seen && (
                      <div>
                        <span className="text-muted-foreground">Last seen: </span>
                        <span className="font-medium">Frame {data.last_seen}</span>
                      </div>
                    )}
                  </div>
                  {/* Time Ranges */}
                  {data.time_ranges && data.time_ranges.length > 0 && (
                    <div className="mt-3">
                      <span className="text-muted-foreground text-sm">Time Ranges:</span>
                      <div className="mt-1 space-y-1 text-sm">
                        {data.time_ranges.map((range: any, idx: number) => (
                          <div key={idx} className="flex items-center">
                            <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                            <span>{range.start} - {range.end} ({range.duration_seconds}s)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Statistics */}
      {report.statistics && Object.keys(report.statistics).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(report.statistics).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
