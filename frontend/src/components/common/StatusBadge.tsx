import { Badge } from '@/components/ui/badge';
import { STATUS_LABELS } from '@/utils/constants';
import type { VideoStatus } from '@/types/video';

interface StatusBadgeProps {
  status: VideoStatus;
}

const statusColorClasses: Record<VideoStatus, string> = {
  uploaded: 'bg-blue-600 hover:bg-blue-700',
  processing: 'bg-yellow-600 hover:bg-yellow-700',
  completed: 'bg-green-600 hover:bg-green-700',
  failed: 'bg-red-600 hover:bg-red-700',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge className={`${statusColorClasses[status]} text-white border-0 px-3 py-1 rounded-full`}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
