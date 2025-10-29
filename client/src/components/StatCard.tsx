import React from 'react';
import type { LucideIcon } from 'lucide-react';

type StatCardProps = {
  title: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  description?: string;
  tone?: 'blue' | 'green' | 'purple' | 'amber' | 'neutral';
};

const tones: Record<
  NonNullable<StatCardProps['tone']>,
  { wrapper: string; icon: string }
> = {
  blue: { wrapper: 'bg-jira-50 text-jira-600', icon: 'text-jira-600' },
  green: { wrapper: 'bg-green-50 text-status-green', icon: 'text-status-green' },
  purple: { wrapper: 'bg-status-purple/10 text-status-purple', icon: 'text-status-purple' },
  amber: { wrapper: 'bg-yellow-50 text-status-yellow', icon: 'text-status-yellow' },
  neutral: { wrapper: 'bg-neutral-200 text-neutral-800', icon: 'text-neutral-800' },
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description, tone = 'blue' }) => {
  const Icon = icon;
  const palette = tones[tone];

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-12 font-semibold uppercase tracking-wide text-neutral-600">
            {title}
          </p>
          <div className="mt-1 text-24 font-semibold text-neutral-1000">{value}</div>
          {description && (
            <p className="mt-2 text-12 text-neutral-700">{description}</p>
          )}
        </div>
        {Icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${palette.wrapper}`}>
            <Icon size={18} className={palette.icon} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
