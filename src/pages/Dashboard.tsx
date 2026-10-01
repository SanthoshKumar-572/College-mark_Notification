import React, { useEffect, useState } from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Send,
  History,
  BarChart3,
  RotateCcw,
  Clock,
  ArrowUpRight,
  Sparkles,
  FileSpreadsheet,
  CheckCheck,
  BookOpen,
  Plus,
  GraduationCap,
  Layers,
  UserCheck,
  Shield,
  ExternalLink,
  PhoneCall
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats, User, ClassItem } from '../types';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  user?: User | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, user }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [assignedClasses, setAssignedClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const currentUser = user || api.auth.getCurrentUser();
  const isAdmin = currentUser?.role === 'ADMIN';

  const loadData = async () => {
    try {
      const [statsData, classesData] = await Promise.all([
        api.reports.getDashboardStats(),
        api.academic.getMyClasses().catch(() => [])
      ]);
      setStats(statsData);
      setAssignedClasses(classesData || []);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRetryAll = async () => {
    setRetrying(true);
    try {
      const res = await api.notifications.retryAllFailed();
      setActionMessage(`Retried ${res.data.retried} failed notifications (${res.data.successful} recovered).`);
      await loadData();
    } catch (err: any) {
      setActionMessage(`Retry failed: ${err.message}`);
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const successRate = stats && stats.notificationsSent > 0
    ? Math.round((stats.deliveredCount / stats.notificationsSent) * 100)
    : 100;

  return (
    <div className="space-y-8">
      {/* Dashboard Title Header */}
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-display font-extrabold text-[#2B1B1B] tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-[#7A6A63] font-medium">
          Internal examination marks & parent notification overview.
        </p>
      </div>

      {/* Alert banner if there are failed notifications */}
      {stats && stats.failedCount > 0 && (
        <div className="p-4 rounded-3xl bg-[#FBF7F2] border border-[#D97706]/40 text-[#2B1B1B] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D97706]/15 border border-[#D97706]/30 flex items-center justify-center text-[#D97706] shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <div className="font-bold text-sm text-[#2B1B1B] font-display">Action Required: {stats.failedCount} Notifications Failed</div>
              <div className="text-xs text-[#7A6A63]">Some parent messages could not be delivered. Click to retry all failed dispatches.</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRetryAll}
              disabled={retrying}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7A1A2C] to-[#4A101E] hover:from-[#631524] hover:to-[#2d0811] text-[#fff3b8] text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 border border-[#C08A16]/30"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-[#F6C84C] ${retrying ? 'animate-spin' : ''}`} />
              <span>{retrying ? 'Retrying...' : 'Retry All Failed'}</span>
            </button>
            <button
              onClick={() => onNavigate('notifications')}
              className="px-3.5 py-2 rounded-xl border border-[#EADFD3] bg-white hover:bg-[#FBF7F2] text-[#2B1B1B] text-xs font-bold transition-colors shadow-xs"
            >
              View Logs
            </button>
          </div>
        </div>
      )}

      {actionMessage && (
        <div className="p-3.5 rounded-2xl bg-[#FBF7F2] border border-[#2E7D32]/30 text-[#2B1B1B] text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-[#7A6A63] hover:text-[#2B1B1B] text-xs font-bold">✕</button>
        </div>
      )}

      {/* Row 1: 4 Stat Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {/* Card 1: Students */}
        <div className="bg-white rounded-3xl p-6 border border-[#EADFD3] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7A1A2C] to-[#4A101E] flex items-center justify-center text-[#fff3b8] shadow-md shadow-[#7A1A2C]/20 border border-[#C08A16]/30">
            <Users className="w-6 h-6 text-[#fff3b8]" />
          </div>
          <div className="space-y-1">
            <div className="text-3xl md:text-4xl font-display font-extrabold text-[#2B1B1B] tracking-tight">
              {stats?.studentsCount ?? 5}
            </div>
            <div className="text-xs text-[#7A6A63] font-semibold tracking-wide">
              Students
            </div>
          </div>
        </div>

        {/* Card 2: Subjects / Classes */}
        <div className="bg-white rounded-3xl p-6 border border-[#EADFD3] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C08A16] to-[#7a5209] flex items-center justify-center text-white shadow-md shadow-[#C08A16]/20">
            <BookOpen className="w-6 h-6 text-[#fff3b8]" />
          </div>
          <div className="space-y-1">
            <div className="text-3xl md:text-4xl font-display font-extrabold text-[#2B1B1B] tracking-tight">
              {stats?.classesCount ?? 6}
            </div>
            <div className="text-xs text-[#7A6A63] font-semibold tracking-wide">
              Subjects
            </div>
          </div>
        </div>

        {/* Card 3: Exams */}
        <div className="bg-white rounded-3xl p-6 border border-[#EADFD3] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4A101E] to-[#1c060d] flex items-center justify-center text-[#F6C84C] shadow-md shadow-black/15 border border-[#F6C84C]/30 font-black">
            <FileSpreadsheet className="w-6 h-6 text-[#F6C84C]" />
          </div>
          <div className="space-y-1">
            <div className="text-3xl md:text-4xl font-display font-extrabold text-[#2B1B1B] tracking-tight">
              {stats?.examsCount ?? 1}
            </div>
            <div className="text-xs text-[#7A6A63] font-semibold tracking-wide">
              Exams
            </div>
          </div>
        </div>

        {/* Card 4: Notifications Sent */}
        <div className="bg-white rounded-3xl p-6 border border-[#EADFD3] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2E7D32] to-[#1b5e20] flex items-center justify-center text-white shadow-md shadow-[#2E7D32]/20">
            <Send className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-1">
            <div className="text-3xl md:text-4xl font-display font-extrabold text-[#2B1B1B] tracking-tight">
              {stats?.notificationsSent ?? 0}
            </div>
            <div className="text-xs text-[#7A6A63] font-semibold tracking-wide">
              Notifications Sent
            </div>
          </div>
        </div>
      </div>


      {/* Extra Faculty Class Quick-Access (if assigned) */}
      {assignedClasses && assignedClasses.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-[#EADFD3] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#7A1A2C]" />
              <h3 className="text-sm font-display font-bold text-[#2B1B1B]">Your Assigned Classes</h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#FBF7F2] text-[#7A1A2C] border border-[#EADFD3] text-xs font-mono font-bold">
              {assignedClasses.length} {assignedClasses.length === 1 ? 'Class' : 'Classes'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {assignedClasses.map((cls) => (
              <div
                key={cls.id}
                onClick={() => onNavigate('students')}
                className="p-4 rounded-2xl bg-[#FBF7F2]/60 hover:bg-[#FBF7F2] border border-[#EADFD3] hover:border-[#C08A16] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <div className="text-sm font-bold text-[#2B1B1B] group-hover:text-[#7A1A2C] transition-colors">{cls.name}</div>
                  <div className="text-xs text-[#7A6A63] mt-0.5">{cls.department_name || cls.department_code || 'IT'} • Semester {cls.semester || '5'}</div>
                </div>
                <div className="text-xs font-mono font-bold text-[#7A1A2C] group-hover:text-[#C08A16] transition-colors">
                  {cls.student_count || 0} students →
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

