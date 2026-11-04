import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-1.5 text-[13px] text-muted-foreground" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="size-4" />}
          {item.to ? (
            <Link to={item.to} className="hover:text-primary">
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

export function PageHeader({ title, meta, actions, breadcrumb }) {
  return (
    <div className="mb-6">
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {meta && <div className="mt-1.5 flex flex-wrap items-center gap-2 text-muted-foreground">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
      </div>
    </div>
  )
}
