import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Key,
  Bell,
  Database,
  Shield,
  CheckCircle2,
  AlertCircle,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  Wifi
} from 'lucide-react';
import { api } from '../services/api';

interface SettingsGroup {
  group: string;
  label: string;
  icon: React.ReactNode;
  fields: SettingField[];
}

interface SettingField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'boolean' | 'select';
  help?: string;
  options?: string[];
  placeholder?: string;
}

const SETTINGS_SCHEMA: SettingsGroup[] = [
  {
    group: 'whatsapp',
    label: 'WhatsApp (Meta Cloud API)',
    icon: <Bell className="w-4 h-4 text-indigo-600" />,
    fields: [
      { key: 'WHATSAPP_PHONE_NUMBER_ID', label: 'Phone Number ID', type: 'text', placeholder: 'e.g., 123456789012345' },
      { key: 'WHATSAPP_TOKEN', label: 'API Bearer Token', type: 'password', placeholder: 'EAAxxxxxxx...' },
      { key: 'WHATSAPP_TEMPLATE_NAME', label: 'Approved Template Name', type: 'text', placeholder: 'marks_notification' },
      { key: 'WHATSAPP_MOCK_MODE', label: 'Mock Mode (dev only)', type: 'boolean', help: 'In mock mode, messages are logged but not actually sent.' }
    ]
  },
  {
    group: 'sms',
    label: 'SMS Gateway (DLT)',
    icon: <Key className="w-4 h-4 text-blue-600" />,
    fields: [
      { key: 'SMS_API_URL', label: 'API Endpoint URL', type: 'text', placeholder: 'https://sms.gateway.com/api/send' },
      { key: 'SMS_API_KEY', label: 'API Key', type: 'password', placeholder: 'Your DLT gateway API key' },
      { key: 'SMS_SENDER_ID', label: 'Sender ID (DLT Header)', type: 'text', placeholder: 'CLGSMK' },
      { key: 'SMS_TEMPLATE_ID', label: 'DLT Template ID', type: 'text', placeholder: '1707xxxxxxxxxx' },
      { key: 'SMS_MOCK_MODE', label: 'Mock Mode (dev only)', type: 'boolean' }
    ]
  },
  {
    group: 'notifications',
    label: 'Notification Behavior',
    icon: <Bell className="w-4 h-4 text-violet-600" />,
    fields: [
      { key: 'NOTIFICATION_MAX_RETRIES', label: 'Max Retry Attempts', type: 'number', placeholder: '3' },
      { key: 'NOTIFICATION_BATCH_SIZE', label: 'Batch Size per Run', type: 'number', placeholder: '50' },
      { key: 'DUPLICATE_WINDOW_HOURS', label: 'Duplicate Prevention Window (hours)', type: 'number', placeholder: '24', help: 'Prevent re-sending the same marks within this many hours.' }
    ]
  },
  {
    group: 'college',
    label: 'College Details',
    icon: <Database className="w-4 h-4 text-amber-600" />,
    fields: [
      { key: 'COLLEGE_NAME', label: 'College Name', type: 'text', placeholder: 'Sunrise College of Engineering' },
      { key: 'COLLEGE_CODE', label: 'College Code', type: 'text', placeholder: 'SRCEG' },
      { key: 'COLLEGE_PHONE', label: 'Contact Phone', type: 'text', placeholder: '+91 98765 43210' }
    ]
  }
];

export const Settings: React.FC = () => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'ok' | 'fail'>>({
    whatsapp: 'idle', sms: 'idle'
  });
  const [activeGroup, setActiveGroup] = useState('whatsapp');

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await api.settings.getAll();
      const map: Record<string, string> = {};
      (data as any[]).forEach((s: any) => { map[s.key] = s.value ?? ''; });
      setValues(map);
    } catch {
      // Default empty
    } finally {
      setLoading(false);
    }
  };

  const saveGroup = async (group: string) => {
    setSaving(true);
    const groupFields = SETTINGS_SCHEMA.find(g => g.group === group)?.fields || [];
    const payload = groupFields.map(f => ({ key: f.key, value: values[f.key] || '', group }));
    try {
      await api.settings.bulkUpdate(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (channel: 'whatsapp' | 'sms') => {
    setTestStatus(p => ({ ...p, [channel]: 'testing' }));
    try {
      const result = await api.settings.testConnection(channel);
      setTestStatus(p => ({ ...p, [channel]: result.ok ? 'ok' : 'fail' }));
    } catch {
      setTestStatus(p => ({ ...p, [channel]: 'fail' }));
    }
    setTimeout(() => setTestStatus(p => ({ ...p, [channel]: 'idle' })), 5000);
  };

  const updateValue = (key: string, val: string) => setValues(p => ({ ...p, [key]: val }));
  const toggleReveal = (key: string) => setRevealedKeys(prev => {
    const n = new Set(prev);
    n.has(key) ? n.delete(key) : n.add(key);
    return n;
  });

  const currentGroup = SETTINGS_SCHEMA.find(g => g.group === activeGroup)!;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-indigo-600" />
            <span>System Settings</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Configure API credentials, notification behavior, and college details.</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
          </div>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-44 shrink-0 space-y-1">
          {SETTINGS_SCHEMA.map(g => (
            <button
              key={g.group}
              onClick={() => setActiveGroup(g.group)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeGroup === g.group
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {g.icon}
              {g.label.split(' (')[0]}
            </button>
          ))}
        </div>

        {/* Main Panel */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {loading ? (
            <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
          ) : (
            <>
              <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                {currentGroup.icon}
                {currentGroup.label}
              </h3>
              <div className="border-b border-slate-100 mb-5 pb-3">
                {(activeGroup === 'whatsapp' || activeGroup === 'sms') && (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => testConnection(activeGroup as 'whatsapp' | 'sms')}
                      disabled={testStatus[activeGroup] === 'testing'}
                      className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline"
                    >
                      {testStatus[activeGroup] === 'testing' ? (
                        <><RefreshCw className="w-3 h-3 animate-spin" /> Testing…</>
                      ) : (
                        <><Wifi className="w-3 h-3" /> Test Connection</>
                      )}
                    </button>
                    {testStatus[activeGroup] === 'ok' && (
                      <span className="flex items-center gap-1 text-xs text-indigo-600 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    )}
                    {testStatus[activeGroup] === 'fail' && (
                      <span className="flex items-center gap-1 text-xs text-rose-600 font-bold">
                        <AlertCircle className="w-3 h-3" /> Failed
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {currentGroup.fields.map(field => (
                  <div key={field.key}>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">{field.label}</label>
                    {field.type === 'boolean' ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div
                          onClick={() => updateValue(field.key, values[field.key] === 'true' ? 'false' : 'true')}
                          className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                            values[field.key] === 'true' ? 'bg-indigo-500' : 'bg-slate-300'
                          }`}
                        >
                          <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                            values[field.key] === 'true' ? 'translate-x-5' : ''
                          }`} />
                        </div>
                        <span className="text-xs text-slate-600">{values[field.key] === 'true' ? 'Enabled' : 'Disabled'}</span>
                      </label>
                    ) : field.type === 'password' ? (
                      <div className="relative">
                        <input
                          type={revealedKeys.has(field.key) ? 'text' : 'password'}
                          value={values[field.key] || ''}
                          onChange={e => updateValue(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 pr-9 rounded-lg border border-slate-300 text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => toggleReveal(field.key)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                        >
                          {revealedKeys.has(field.key) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <input
                        type={field.type}
                        value={values[field.key] || ''}
                        onChange={e => updateValue(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                      />
                    )}
                    {field.help && <p className="text-[11px] text-slate-400 mt-1">{field.help}</p>}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-between items-center border-t border-slate-100 pt-4">
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Shield className="w-3 h-3" />
                  <span>Credentials are stored server-side and never exposed to the browser.</span>
                </div>
                <button
                  onClick={() => saveGroup(activeGroup)}
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving…</> : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
