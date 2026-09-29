interface CardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  /** Removes inner padding — useful when the card contains a full-bleed list */
  flush?: boolean;
  children: React.ReactNode;
}

export function Card({
  title,
  subtitle,
  action,
  className = '',
  flush = false,
  children,
}: CardProps) {
  return (
    <div className={`rounded-lg border border-ink-200 bg-white ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            {title && <h2 className="text-sm font-semibold">{title}</h2>}
            {subtitle && (
              <p className="text-[11px] uppercase tracking-wider text-ink-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={flush ? '' : 'px-5 pb-5 pt-3'}>{children}</div>
    </div>
  );
}