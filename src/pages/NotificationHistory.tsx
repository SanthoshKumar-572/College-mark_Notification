import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  MessageSquare,
  Smartphone,
  Eye,
  X,
  Filter,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { NotificationRecord } from '../types';

export const NotificationHistory: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Retry state
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryingBulk, setRetryingBulk] = useState(false);
  const [actionAlert, setActionAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Selected Notification for modal view
  const [selectedNotif, setSelectedNotif] = useState<NotificationRecord | null>(null);

  useEffect(() => {
    loadData();
  }, [channelFilter, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const records = await api.notifications.list({
        search,
        channel: channelFilter,
        status: statusFilter,
        limit: 100
      });
      setNotifications(records);
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleRetrySingle = async (id: string) => {
    setRetryingId(id);
    setActionAlert(null);
    try {
      const res = await api.notifications.retry(id);
      setActionAlert({ message: res.message || 'Notification retried successfully', type: 'success' });
      await loadData();
    } catch (err: any) {
      setActionAlert({ message: err.message || 'Retry failed', type: 'error' });
    } finally {
      setRetryingId(null);
    }
  };

  const handleRetryAllFailed = async () => {
    setRetryingBulk(true);
    setActionAlert(null);
    try {
      const res = await api.notifications.retryAllFailed();
      setActionAlert({
        message: `Bulk retry processed: ${res.data.successful} delivered, ${res.data.failed} failed of ${res.data.retried} retried.`,
        type: 'success'
      });
      await loadData();
    } catch (err: any) {
      setActionAlert({ message: err.message || 'Bulk retry failed', type: 'error' });
    } finally {
      setRetryingBulk(false);
    }
  };

  const failedCount = notifications.filter(n => n.status === 'FAILED').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <span>Notification Delivery History</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of all WhatsApp and SMS messages dispatched to parents.
          </p>
        </div>

        {failedCount > 0 && (
          <button
            onClick={handleRetryAllFailed}
            disabled={retryingBulk}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${retryingBulk ? 'animate-spin' : ''}`} />
            <span>Retry Failed ({failedCount})</span>
          </button>
        )}
      </div>

      {actionAlert && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between ${
          actionAlert.type === 'success'
            ? 'bg-indigo-50 border border-indigo-200 text-indigo-800'
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          <span>{actionAlert.message}</span>
          <button onClick={() => setActionAlert(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, reg no, parent..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Channel:</span>
          </div>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-white"
          >
            <option value="ALL">All Channels</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="SMS">SMS</option>
          </select>

          <div className="flex items-center gap-1.5 text-slate-500 ml-2">
            <span className="font-semibold">Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="DELIVERED">Delivered</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
            <option value="QUEUED">Queued</option>
          </select>

          <button
            onClick={loadData}
            title="Refresh"
            className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 ml-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Exam</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Recipient (Parent)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Dispatched At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{n.student_name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{n.register_number}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        {n.exam_name || 'Internal Exam'}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          n.channel === 'WHATSAPP'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {n.channel === 'WHATSAPP' ? (
                            <MessageSquare className="w-3 h-3 text-indigo-600" />
                          ) : (
                            <Smartphone className="w-3 h-3 text-blue-600" />
                          )}
                          <span>{n.channel}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600">
                        <div>{n.recipient_masked || n.recipient}</div>
                        {n.parent_name && <div className="text-[10px] text-slate-400 font-sans">{n.parent_name}</div>}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          n.status === 'DELIVERED' ? 'bg-indigo-100 text-indigo-800' :
                          n.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                          n.status === 'FAILED' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {n.status === 'DELIVERED' ? <CheckCircle2 className="w-3 h-3" /> :
                           n.status === 'FAILED' ? <XCircle className="w-3 h-3" /> :
                           <Clock className="w-3 h-3" />}
                          <span>{n.status}</span>
                        </span>
                        {n.retry_count > 0 && (
                          <span className="ml-1 text-[10px] font-mono text-slate-400">
                            (R{n.retry_count})
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {n.created_at ? n.created_at.substring(0, 16) : '—'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedNotif(n)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>

                          {n.status === 'FAILED' && n.retry_count < 3 && (
                            <button
                              onClick={() => handleRetrySingle(n.id)}
                              disabled={retryingId === n.id}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              <RotateCcw className={`w-3 h-3 ${retryingId === n.id ? 'animate-spin' : ''}`} />
                              <span>Retry</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      No notification records found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Message Details Modal */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg ${
                  selectedNotif.channel === 'WHATSAPP' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {selectedNotif.channel === 'WHATSAPP' ? <MessageSquare className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Message Dispatch Details</h3>
                  <p className="text-[11px] text-slate-500">{selectedNotif.student_name} ({selectedNotif.register_number})</p>
                </div>
              </div>
              <button onClick={() => setSelectedNotif(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Recipient:</span>
                <div className="font-mono font-semibold text-slate-800">{selectedNotif.recipient_masked || selectedNotif.recipient}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Status:</span>
                <div className="font-bold text-slate-800">{selectedNotif.status}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Provider Message ID:</span>
                <div className="font-mono text-[11px] text-slate-600 truncate">{selectedNotif.provider_message_id || 'N/A'}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Retry Count:</span>
                <div className="font-semibold text-slate-800">{selectedNotif.retry_count} / 3</div>
              </div>
            </div>

            {selectedNotif.error_message && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <span className="font-bold">Provider Error:</span> {selectedNotif.error_message}
              </div>
            )}

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Delivered Message Text</span>
              <div className="p-3.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-mono whitespace-pre-line border border-slate-200 max-h-48 overflow-y-auto leading-relaxed">
                {selectedNotif.message}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              {selectedNotif.status === 'FAILED' && selectedNotif.retry_count < 3 && (
                <button
                  onClick={() => {
                    handleRetrySingle(selectedNotif.id);
                    setSelectedNotif(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Message Now</span>
                </button>
              )}
              <button
                onClick={() => setSelectedNotif(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
