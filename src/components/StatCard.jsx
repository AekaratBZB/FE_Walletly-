import React from 'react';

export const StatCard = ({
  label,
  value,
  subtext,
  icon: Icon,
  colorScheme = 'emerald',
  valueClass = ''
}) => {
  return (
    <div className="card stat-card">
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className={`stat-value num-font ${valueClass}`}>{value}</div>
        {subtext && <div className="stat-sub text-muted">{subtext}</div>}
      </div>
      {Icon && (
        <div className={`stat-icon-wrapper stat-icon-${colorScheme}`}>
          <Icon size={24} />
        </div>
      )}
    </div>
  );
};
