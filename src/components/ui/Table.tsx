import React from 'react';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {}
interface TableHeadProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}
interface TableHeaderProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}
interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export function Table({ className = '', ...props }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table
        className={`w-full text-sm text-slate-900 dark:text-slate-50 ${className}`}
        {...props}
      />
    </div>
  );
}

export function TableHead({ className = '', ...props }: TableHeadProps) {
  return (
    <thead
      className={`border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 ${className}`}
      {...props}
    />
  );
}

export function TableBody({ className = '', ...props }: TableBodyProps) {
  return <tbody className={className} {...props} />;
}

export function TableRow({ className = '', ...props }: TableRowProps) {
  return (
    <tr
      className={`border-b border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 ${className}`}
      {...props}
    />
  );
}

export function TableHeader({ className = '', ...props }: TableHeaderProps) {
  return (
    <th className={`px-6 py-3 text-left font-semibold ${className}`} {...props} />
  );
}

export function TableCell({ className = '', ...props }: TableCellProps) {
  return <td className={`px-6 py-4 ${className}`} {...props} />;
}
