import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDuration } from '@/utils/formatters';
import { useState } from 'react';

interface TimelineEvent {
  entity: string;
  start: string;
  end: string;
  start_second: number;
  end_second: number;
  duration_seconds: number;
}

interface TimelineVisualizationProps {
  report: {
    consolidated_timeline: TimelineEvent[];
    duration_seconds: number;
    entity_appearances: Record<string, {
      count: number;
      time_ranges?: Array<{
        start: string;
        end: string;
        start_second: number;
        end_second: number;
        duration_seconds: number;
      }>;
    }>;
  };
}

export function TimelineVisualization({ report }: TimelineVisualizationProps) {
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);

  if (!report?.consolidated_timeline || report.consolidated_timeline.length === 0) {
    return null;
  }

  // Group timeline events by entity for visualization
  const entityTimelines = {} as Record<string, TimelineEvent[]>;
  report.consolidated_timeline.forEach((event: TimelineEvent) => {
    if (!entityTimelines[event.entity]) {
      entityTimelines[event.entity] = [];
    }
    entityTimelines[event.entity].push(event);
  });

  // Calculate total video duration for scaling
  const totalDuration = report.duration_seconds;

  // Calculate time markers (show ~8 evenly spaced markers)
  const numMarkers = 8;
  const timeMarkers = Array.from({ length: numMarkers }, (_, i) => {
    const second = (totalDuration / (numMarkers - 1)) * i;
    return {
      second,
      label: formatDuration(second),
      percent: (second / totalDuration) * 100,
    };
  });

  const ROW_HEIGHT = 50;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consolidated Timeline View</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Visual representation of when each entity appears in the video
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Entity-specific timelines with swimlanes */}
          <div className="space-y-3">
            {Object.entries(entityTimelines).map(([entity, events], entityIndex) => {
              const color = getEntityColor(entity);
              const totalPresenceTime = events.reduce((sum, e) => sum + e.duration_seconds, 0);
              const presencePercentage = ((totalPresenceTime / totalDuration) * 100).toFixed(1);

              return (
                <div key={entity} className="border-b pb-3 last:border-b-0">
                  {/* Entity header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                      <h4 className="font-semibold text-sm">{entity}</h4>
                      <span className="text-xs text-muted-foreground">
                        ({events.length} appearance{events.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded">
                      {presencePercentage}% of video
                    </span>
                  </div>

                  {/* Timeline bar */}
                  <div
                    className="relative w-full bg-gray-100 rounded-lg overflow-hidden"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {/* Time markers */}
                    {timeMarkers.map((marker, idx) => (
                      <div
                        key={idx}
                        className="absolute top-0 bottom-0 border-l border-gray-300/50"
                        style={{ left: `${marker.percent}%` }}
                      />
                    ))}

                    {/* Event blocks */}
                    {events.map((event, idx) => {
                      const startPercent = (event.start_second / totalDuration) * 100;
                      const widthPercent = (event.duration_seconds / totalDuration) * 100;
                      const blockId = `${entity}-${idx}`;
                      const isHovered = hoveredBlock === blockId;

                      return (
                        <div
                          key={idx}
                          className="absolute top-2 bottom-2 rounded shadow-sm cursor-pointer transition-all"
                          style={{
                            left: `${startPercent}%`,
                            width: `${Math.max(widthPercent, 0.5)}%`,
                            backgroundColor: color,
                            opacity: isHovered ? 1 : 0.85,
                            transform: isHovered ? 'scaleY(1.15)' : 'scaleY(1)',
                            zIndex: isHovered ? 10 : 1,
                          }}
                          onMouseEnter={() => setHoveredBlock(blockId)}
                          onMouseLeave={() => setHoveredBlock(null)}
                        >
                          {/* Tooltip on hover */}
                          {isHovered && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-50">
                              <div className="font-semibold">{entity}</div>
                              <div className="text-gray-300">
                                {event.start} → {event.end}
                              </div>
                              <div className="text-gray-300">
                                Duration: {event.duration_seconds}s
                              </div>
                              {/* Arrow */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                <div className="border-4 border-transparent border-t-gray-900" />
                              </div>
                            </div>
                          )}

                          {/* Show time labels for wider blocks */}
                          {widthPercent > 8 && (
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-medium px-1 overflow-hidden">
                              <span className="truncate">
                                {event.start} - {event.end}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Time axis (only show for first entity) */}
                  {entityIndex === 0 && (
                    <div className="relative w-full h-6 mt-1">
                      {timeMarkers.map((marker, idx) => (
                        <div
                          key={idx}
                          className="absolute text-[10px] text-gray-500 transform -translate-x-1/2"
                          style={{ left: `${marker.percent}%` }}
                        >
                          {marker.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary statistics */}
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Duration:</span>
                <div className="font-semibold">{formatDuration(totalDuration)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Total Entities:</span>
                <div className="font-semibold">{Object.keys(entityTimelines).length}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Total Events:</span>
                <div className="font-semibold">{report.consolidated_timeline.length}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Avg. Event Duration:</span>
                <div className="font-semibold">
                  {(
                    report.consolidated_timeline.reduce((sum, e) => sum + e.duration_seconds, 0) /
                    report.consolidated_timeline.length
                  ).toFixed(1)}s
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to generate consistent colors for entities
function getEntityColor(entity: string): string {
  // Simple hash function to generate consistent colors
  let hash = 0;
  for (let i = 0; i < entity.length; i++) {
    hash = entity.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
    '#EC4899', '#F97316', '#06B6D4', '#14B8A6', '#6366F1',
    '#F43F5E', '#FB923C', '#22C55E', '#3B82F6', '#A855F7',
    '#E11D48', '#EA580C', '#16A34A', '#2563EB', '#9333EA'
  ];
  
  return colors[Math.abs(hash) % colors.length];
}