import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: React.ReactNode
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone,
  loading,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  icon?: React.ReactNode
  tone?: 'default' | 'danger' | 'success' | 'info'
  loading?: boolean
}) {
  const skins = {
    default: {
      card: 'border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 dark:border-violet-900 dark:from-violet-950/50 dark:via-card dark:to-fuchsia-950/30',
      chip: 'brand-gradient text-white',
    },
    danger: {
      card: 'border-rose-200 bg-gradient-to-br from-rose-50 via-white to-orange-50 dark:border-rose-900 dark:from-rose-950/50 dark:via-card dark:to-orange-950/20',
      chip: 'bg-gradient-to-br from-rose-500 to-orange-500 text-white',
    },
    success: {
      card: 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:border-emerald-900 dark:from-emerald-950/50 dark:via-card dark:to-teal-950/20',
      chip: 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white',
    },
    info: {
      card: 'border-sky-200 bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:border-sky-900 dark:from-sky-950/50 dark:via-card dark:to-indigo-950/20',
      chip: 'bg-gradient-to-br from-sky-500 to-indigo-500 text-white',
    },
  } as const
  const skin = skins[tone ?? 'default']
  return (
    <Card className={cn('card-hover', skin.card)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          {icon ? (
            <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg shadow-sm [&_svg]:h-4 [&_svg]:w-4', skin.chip)} aria-hidden>
              {icon}
            </span>
          ) : null}
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {loading ? <Skeleton className="h-8 w-20" /> : value}
        </div>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}
