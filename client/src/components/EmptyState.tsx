import React from 'react';
import type { HeroIcon } from '../types/icons';

type EmptyStateProps = {
  icon: HeroIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  tone?: 'neutral' | 'blue' | 'purple';
};

const toneClasses: Record<
  NonNullable<EmptyStateProps['tone']>,
  { icon: string; wrapper: string }
> = {
  neutral: { icon: 'text-neutral-400', wrapper: 'bg-neutral-100' },
  blue: { icon: 'text-jira-500', wrapper: 'bg-jira-50' },
  purple: { icon: 'text-status-purple', wrapper: 'bg-status-purple/10' },
};

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  tone = 'neutral',
}) => {
  const Icon = icon;
  const palette = toneClasses[tone];

  return (
    <div className="empty-state">
      <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${palette.wrapper}`}>
        <Icon className={`h-8 w-8 ${palette.icon}`} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
};

export default EmptyState;
