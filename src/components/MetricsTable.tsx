import { deltaClass } from '@/lib/format'

type Metric = { label: string; value: string | number; delta?: string | number | null; delta_pct?: number | null; unit?: string | null; note?: string | null }

export function MetricsTable({ metrics }: { metrics: unknown }) {
  if (!Array.isArray(metrics) || metrics.length === 0) return null
  const rows = metrics as Metric[]
  return (
    <div className="my-6 overflow-x-auto rounded-lg border border-neutral-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-3 py-2 font-medium">Metric</th>
            <th className="px-3 py-2 text-right font-medium">Value</th>
            <th className="px-3 py-2 text-right font-medium">Change</th>
            <th className="hidden px-3 py-2 font-medium sm:table-cell">Note</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((m, i) => {
            const delta = m.delta != null ? String(m.delta) : null
            const pct = m.delta_pct != null ? `${m.delta_pct > 0 ? '+' : ''}${m.delta_pct}%` : null
            return (
              <tr key={i}>
                <td className="px-3 py-2 font-medium">{m.label}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {String(m.value)}
                  {m.unit ? <span className="ml-1 text-neutral-500">{m.unit}</span> : null}
                </td>
                <td className={`px-3 py-2 text-right tabular-nums ${deltaClass(delta ?? pct)}`}>
                  {[delta, pct].filter(Boolean).join(' · ') || '—'}
                </td>
                <td className="hidden px-3 py-2 text-neutral-500 sm:table-cell">{m.note ?? ''}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
