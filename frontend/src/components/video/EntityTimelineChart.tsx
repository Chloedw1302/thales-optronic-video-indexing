import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

interface EntityTimelineChartProps {
  report: {
    entities?: Record<string, {
      detections: Array<{
        timestamp: string;
        second: number;
        present: boolean;
      }>;
      statistics?: {
        presence_percentage?: number;
      };
    }>;
    duration_seconds: number;
    entity_appearances: Record<string, any>;
  };
}

export function EntityTimelineChart({ report }: EntityTimelineChartProps) {
  const [hoveredCell, setHoveredCell] = useState<{ entity: string; index: number } | null>(null);

  // Use entities data if available, otherwise fall back to entity_appearances
  const entities = report.entities || {};
  const entityNames = Object.keys(entities).filter(
    entity => entities[entity]?.detections && entities[entity].detections.length > 0
  );

  if (entityNames.length === 0) {
    return null;
  }

  // Get the first entity's detections to determine time points
  const firstEntity = entityNames[0];
  const timePoints = entities[firstEntity]?.detections || [];
  
  const ROW_HEIGHT = 40;
  const HEADER_HEIGHT = 60;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entity Presence Timeline</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Hover over cells to see detailed information. Colored blocks indicate presence.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div style={{ minWidth: '800px' }}>
            {/* Time axis header */}
            <div 
              className="flex border-b-2 border-gray-300 mb-2"
              style={{ height: HEADER_HEIGHT }}
            >
              <div className="w-40 flex-shrink-0 flex items-center px-4 font-semibold">
                Entity
              </div>
              <div className="flex-1 flex items-end pb-2">
                {timePoints.map((point, index) => {
                  const showLabel = index === 0 || 
                                   index === timePoints.length - 1 || 
                                   index % Math.ceil(timePoints.length / 10) === 0;
                  return (
                    <div
                      key={index}
                      className="flex-1 text-center text-xs text-gray-600"
                      style={{ minWidth: '20px' }}
                    >
                      {showLabel ? point.timestamp : ''}
                    </div>
                  );
                })}
              </div>
              <div className="w-20 flex-shrink-0 flex items-center justify-center text-xs font-semibold">
                Present
              </div>
            </div>

            {/* Entity rows */}
            <div className="space-y-1">
              {entityNames.map((entityName) => {
                const entityData = entities[entityName];
                const detections = entityData?.detections || [];
                const presencePercentage = entityData?.statistics?.presence_percentage || 0;
                const color = getEntityColor(entityName);

                return (
                  <div
                    key={entityName}
                    className="flex items-center hover:bg-gray-50/50 transition-colors rounded"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {/* Entity name */}
                    <div className="w-40 flex-shrink-0 px-4 font-medium text-sm truncate" title={entityName}>
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="truncate">{entityName}</span>
                      </div>
                    </div>

                    {/* Timeline blocks */}
                    <div className="flex-1 flex gap-0.5">
                      {detections.map((detection, index) => {
                        const isHovered = hoveredCell?.entity === entityName && hoveredCell?.index === index;
                        const isPresent = detection.present;
                        
                        return (
                          <div
                            key={index}
                            className="flex-1 h-8 rounded-sm transition-all cursor-pointer relative group"
                            style={{
                              backgroundColor: isPresent 
                                ? color
                                : 'rgba(229, 231, 235, 0.3)',
                              minWidth: '20px',
                              opacity: isHovered ? 1 : isPresent ? 0.85 : 0.5,
                              transform: isHovered ? 'scaleY(1.2)' : 'scaleY(1)',
                            }}
                            onMouseEnter={() => setHoveredCell({ entity: entityName, index })}
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            {/* Tooltip */}
                            {isHovered && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-50">
                                <div className="font-semibold">{entityName}</div>
                                <div className="text-gray-300">Time: {detection.timestamp}</div>
                                <div className={isPresent ? 'text-green-400' : 'text-red-400'}>
                                  {isPresent ? '● Present' : '○ Absent'}
                                </div>
                                {/* Arrow */}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                  <div className="border-4 border-transparent border-t-gray-900" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Percentage */}
                    <div className="w-20 flex-shrink-0 text-center text-sm font-medium">
                      {presencePercentage.toFixed(0)}%
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: getEntityColor('sample'), opacity: 0.85 }} />
                <span className="text-gray-600">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-200 opacity-50" />
                <span className="text-gray-600">Absent</span>
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