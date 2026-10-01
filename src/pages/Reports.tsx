import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Users,
  FileSpreadsheet,
  Send,
  CheckCircle2,
  XCircle,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'students' | 'classes' | 'analytics'>('students');
  const [studentReport, setStudentReport] = useState<any[]>([]);
  const [classReport, setClassReport] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [examList, classRpt, analyticsData] = await Promise.all([
        api.academic.getExams(),
        api.reports.getClassReport(),
        api.reports.getNotificationAnalytics()
      ]);
      setExams(examList);
      if (examList.length > 0 && !selectedExamId) {
        setSelectedExamId(examList[0].id);
      }
      setClassReport(classRpt);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentReport = async () => {
    if (!selectedExamId) return;
    setLoading(true);
    try {
      const data = await api.reports.getStudentReport({ exam_id: selectedExamId, search });
      setStudentReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExamId) loadStudentReport();
  }, [selectedExamId]);

  const downloadCSV = () => {
    const headers = ['Register No', 'Student Name', 'Department', 'Exam', 'Marks', 'Total', 'Max', 'Percentage', 'Notification Status'];
    const rows = studentReport.map(r => [
      r.register_number, r.student_name, r.department_name, r.exam_name,
      r.marks_summary, r.total_obtained, r.total_max, r.percentage, r.notification_status || 'N/A'
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_marks_report_${selectedExamId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Compute channel stats from analytics
  const channelStats = analytics?.channelStats || [];
  const totalWA = channelStats.filter((s: any) => s.channel === 'WHATSAPP').reduce((acc: number, s: any) => acc + Number(s.count), 0);
  const totalSMS = channelStats.filter((s: any) => s.channel === 'SMS').reduce((acc: number, s: any) => acc + Number(s.count), 0);
  const deliveredWA = channelStats.filter((s: any) => s.channel === 'WHATSAPP' && (s.status === 'DELIVERED' || s.status === 'SENT')).reduce((acc: number, s: any) => acc + Number(s.count), 0);
  const failedTotal = channelStats.filter((s: any) => s.status === 'FAILED').reduce((acc: number, s: any) => acc + Number(s.count), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <span>Reports & Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive student marks and notification delivery performance reports.
          </p>
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {(['students', 'classes', 'analytics'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                activeTab === tab ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'analytics' ? 'Notification Analytics' : `${tab.charAt(0).toUpperCase() + tab.slice(1)} Report`}
            </button>
          ))}
        </div>
      </div>

      {/* Student Report */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-white"
              >
                {exams.map(e => <option key={e.id} value={e.id}>{e.exam_name}</option>)}
              </select>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadStudentReport()}
                placeholder="Search student..."
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
              />
              <button
                onClick={loadStudentReport}
                className="p-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={downloadCSV}
              disabled={studentReport.length === 0}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Register No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Marks Summary</th>
                    <th className="py-3 px-4 text-center">Total</th>
                    <th className="py-3 px-4 text-center">%</th>
                    <th className="py-3 px-4">Notification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loading ? (
                    <tr><td colSpan={7} className="py-8 text-center"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                  ) : studentReport.length > 0 ? (
                    studentReport.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-4 font-bold text-slate-900 font-mono">{r.register_number}</td>
                        <td className="py-2.5 px-4">{r.student_name}</td>
                        <td className="py-2.5 px-4 text-slate-500">{r.department_name}</td>
                        <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate" title={r.marks_summary}>{r.marks_summary}</td>
                        <td className="py-2.5 px-4 text-center font-bold">{r.total_obtained}/{r.total_max}</td>
                        <td className={`py-2.5 px-4 text-center font-bold ${r.percentage >= 75 ? 'text-indigo-600' : r.percentage >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {r.percentage}%
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            r.notification_status === 'DELIVERED' ? 'bg-indigo-100 text-indigo-800' :
                            r.notification_status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                            r.notification_status === 'FAILED' ? 'bg-rose-100 text-rose-800' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {r.notification_status || 'Not sent'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={7} className="py-10 text-center text-slate-400 text-xs">No marks data for this exam. Upload an Excel file first.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Class Report */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 py-12 text-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
          ) : classReport.map((c, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div>
                <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider">{c.department_code} Department</div>
                <h3 className="text-base font-black text-slate-900 mt-0.5">Year {c.year} — Section {c.section}</h3>
                <div className="text-xs text-slate-500">{c.academic_year}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Students</div>
                  <div className="font-black text-slate-900 text-base mt-0.5">{c.total_students}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-2.5">
                  <div className="text-blue-400 text-[10px] uppercase font-bold">Marks Import</div>
                  <div className="font-black text-blue-800 text-base mt-0.5">{c.marks_imported_students}</div>
                </div>
                <div className="bg-indigo-50 rounded-lg p-2.5">
                  <div className="text-indigo-400 text-[10px] uppercase font-bold">Delivered</div>
                  <div className="font-black text-indigo-800 text-base mt-0.5">{c.delivered}</div>
                </div>
                <div className="bg-rose-50 rounded-lg p-2.5">
                  <div className="text-rose-400 text-[10px] uppercase font-bold">Failed</div>
                  <div className="font-black text-rose-800 text-base mt-0.5">{c.failed}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notification Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">WhatsApp Total</div>
              <div className="text-2xl font-black text-indigo-600 mt-1">{totalWA}</div>
              <div className="text-[11px] text-indigo-600 mt-1">Via Meta Cloud API</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">SMS Total</div>
              <div className="text-2xl font-black text-blue-600 mt-1">{totalSMS}</div>
              <div className="text-[11px] text-blue-600 mt-1">Via DLT Gateway</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">WA Delivered</div>
              <div className="text-2xl font-black text-indigo-700 mt-1">{deliveredWA}</div>
              <div className="text-[11px] text-indigo-600 mt-1">Confirmed delivery</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">Total Failed</div>
              <div className="text-2xl font-black text-rose-600 mt-1">{failedTotal}</div>
              <div className="text-[11px] text-rose-600 mt-1">Across all channels</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Delivery Status Breakdown by Channel</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Channel</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Count</th>
                    <th className="py-2.5 px-4">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {channelStats.map((s: any, i: number) => {
                    const total = s.channel === 'WHATSAPP' ? totalWA : totalSMS;
                    const share = total > 0 ? ((Number(s.count) / total) * 100).toFixed(1) : '0';
                    return (
                      <tr key={i} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            s.channel === 'WHATSAPP' ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'
                          }`}>{s.channel}</span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`font-bold ${
                            s.status === 'DELIVERED' ? 'text-indigo-600' :
                            s.status === 'FAILED' ? 'text-rose-600' : 'text-slate-600'
                          }`}>{s.status}</span>
                        </td>
                        <td className="py-2.5 px-4 font-bold">{s.count}</td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${share}%` }}></div>
                            </div>
                            <span className="text-slate-600 font-mono text-[11px]">{share}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
