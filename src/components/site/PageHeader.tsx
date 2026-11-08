import type { ReactNode } from "react";

/** Use context only when it identifies a section that the title alone does not explain. */
export function PageHeader({
  title,
  description,
  context,
  actions,
}: {
  title: string;
  description?: string;
  context?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header sports-heading">
      <div>
        {context && <p className="page-context">{context}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}
