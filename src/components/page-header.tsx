import { type ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold font-headline text-primary">{title}</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">{description}</p>
        </div>
        <div className="flex-shrink-0">{children}</div>
      </div>
    </div>
  );
}
