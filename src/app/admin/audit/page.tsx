import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const ACTION_BADGE: Record<string, string> = {
  create:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  update:   'bg-blue-50 text-blue-700 border-blue-200',
  delete:   'bg-red-50 text-red-700 border-red-200',
  approve:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  reject:   'bg-red-50 text-red-700 border-red-200',
  suspend:  'bg-gray-100 text-gray-600 border-gray-200',
  login:    'bg-purple-50 text-purple-700 border-purple-200',
}

function getBadge(action: string) {
  const key = Object.keys(ACTION_BADGE).find((k) => action.toLowerCase().includes(k))
  return key ? ACTION_BADGE[key] : 'bg-gray-100 text-gray-600 border-gray-200'
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: { resource?: string; page?: string }
}) {
  const supabase = await createClient()

  const resourceFilter = searchParams.resource ?? 'all'
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const perPage = 50
  const offset = (page - 1) * perPage

  let query = supabase
    .from('audit_logs')
    .select('id, action, resource_type, resource_id, old_values, new_values, ip_address, created_at, profiles(full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (resourceFilter !== 'all') {
    query = query.eq('resource_type', resourceFilter)
  }

  const { data: logs, count } = await query

  // Distinct resource types for filter
  const { data: resourceTypes } = await supabase
    .from('audit_logs')
    .select('resource_type')

  const uniqueResources = [...new Set((resourceTypes ?? []).map((r) => r.resource_type))].sort()
  const totalPages = Math.ceil((count ?? 0) / perPage)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A1F44]">Audit Log</h1>
          <p className="text-gray-500 mt-1 text-sm">Complete record of all admin actions on the platform.</p>
        </div>
        <span className="text-sm text-gray-400">{(count ?? 0).toLocaleString('en-ZA')} total events</span>
      </div>

      {/* Resource filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', ...uniqueResources].map((res) => (
          <a
            key={res}
            href={`/admin/audit?resource=${res}&page=1`}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all capitalize ${
              resourceFilter === res
                ? 'bg-[#0A1F44] text-white border-[#0A1F44]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {res}
          </a>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {(!logs || logs.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-2xl">📋</div>
            <p className="text-gray-500 font-medium">No audit events yet</p>
            <p className="text-gray-400 text-sm mt-1">Actions will appear here as admins use the platform.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Resource</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => {
                  const profile = log.profiles as any
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">{formatDate(log.created_at)}</td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-gray-800">{profile?.full_name ?? 'System'}</p>
                        <p className="text-xs text-gray-400">{profile?.email ?? ''}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${getBadge(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 rounded text-gray-600 capitalize">{log.resource_type}</span>
                        {log.resource_id && (
                          <p className="text-xs text-gray-400 mt-0.5 font-mono">{String(log.resource_id).slice(0, 8)}…</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-gray-400 font-mono">
                        {log.ip_address ? String(log.ip_address) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <a href={`/admin/audit?resource=${resourceFilter}&page=${page - 1}`}
                  className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                  ← Previous
                </a>
              )}
              {page < totalPages && (
                <a href={`/admin/audit?resource=${resourceFilter}&page=${page + 1}`}
                  className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                  Next →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
