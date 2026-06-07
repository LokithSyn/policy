export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export function Badge({ variant = 'default', className = '', ...props }: BadgeProps) {
  const variantClasses = {
    default: 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50',
    success: 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-50',
    warning: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-50',
    error: 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-50',
    info: 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-50',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
