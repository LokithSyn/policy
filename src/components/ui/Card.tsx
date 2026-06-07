export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = '', ...props }: CardProps) {
  return (
    <div className={`border-b border-slate-200 pb-4 dark:border-slate-800 ${className}`} {...props} />
  );
}

export function CardTitle({
  className = '',
  ...props
}: CardProps & { children?: React.ReactNode }) {
  return <h3 className={`text-lg font-semibold ${className}`} {...props} />;
}

export function CardContent({ className = '', ...props }: CardProps) {
  return <div className={`pt-4 ${className}`} {...props} />;
}
