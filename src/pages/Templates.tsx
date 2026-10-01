import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Save,
  X,
  Smartphone,
  Hash
} from 'lucide-react';
import { api } from '../services/api';

interface Template {
  id?: string;
  name: string;
  channel: 'WHATSAPP' | 'SMS';
  template_type: 'MARKS' | 'REMINDER' | 'GENERAL';
  subject?: string;
  body: string;
  is_active: boolean;
  variables?: string;
}

const SAMPLE_VARS: Record<string, string> = {
  parent_name: "Santhosh kumar  R's Parent",
  student_name: 'Santhosh kumar R',
  register_number: '922524205146',
  exam_name: 'Internal Assessment 1',
  class_section: 'Information Technology - Year 3, Section C',
  marks: '• CN: 96/100\n• BDA: 85/100\n• FSWT: 68/100\n• STA: 85/100\n• DC: 68/100\n• ESIOT: 68/100',
  total: '470',
  maximum_marks: '600',
  percentage: '78.33',
  result: 'PASS',
  college_name: 'VSB ENGINEERING COLLEGE',
  notice_message: 'The college will remain closed tomorrow on account of Government Holiday. Regular academic sessions will resume on Monday.'
};

const DEFAULT_TEMPLATES: Template[] = [
  {
    name: 'Internal Examination Marks Report (Detailed)',
    channel: 'WHATSAPP',
    template_type: 'MARKS',
    body: `Dear {parent_name},

{exam_name} marks of your ward:

Student: {student_name}
Register No: {register_number}

{marks}

Total: {total}/{maximum_marks}
Percentage: {percentage}%

Regards,
{college_name}`,
    is_active: true
  },
  {
    name: 'General / Holiday & Circular Notice (WhatsApp)',
    channel: 'WHATSAPP',
    template_type: 'GENERAL',
    body: `Dear {parent_name},

Greetings from {college_name}.

📢 Important Announcement / Holiday Notice:

Student: {student_name}
Register No: {register_number}

Circular Details:
{notice_message}

Kindly take note of the schedule. For any queries, please contact the class faculty advisor.

Warm regards,
Department of Information Technology,
{college_name}`,
    is_active: true
  },
  {
    name: 'Internal Examination Marks Report (SMS)',
    channel: 'SMS',
    template_type: 'MARKS',
    body: `Dear {parent_name}, {exam_name} marks of your ward: Student: {student_name}, Register No: {register_number}\n{marks}\nTotal: {total}/{maximum_marks}\nPercentage: {percentage}%\nRegards, {college_name}`,
    is_active: true
  },
  {
    name: 'General / Holiday & Circular Notice (SMS)',
    channel: 'SMS',
    template_type: 'GENERAL',
    body: `Notice from {college_name}: Dear Parent of {student_name} (Register No: {register_number}): {notice_message}. Regards, {college_name}`,
    is_active: true
  }
];

const renderPreview = (body: string): string => {
  let result = body;
  Object.entries(SAMPLE_VARS).forEach(([key, val]) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
  });
  return result;
};

const TemplateEditor: React.FC<{
  template: Template;
  onSave: (t: Template) => void;
  onCancel: () => void;
}> = ({ template, onSave, onCancel }) => {
  const [form, setForm] = useState<Template>(template);
  const [preview, setPreview] = useState(false);

  const update = (k: keyof Template, v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Edit2 className="w-4 h-4 text-indigo-600" />
        {template.id ? 'Edit Template' : 'New Template'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Template Name</label>
          <input
            value={form.name}
            onChange={e => update('name', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
            placeholder="e.g., WhatsApp Internal Marks"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Channel</label>
            <select value={form.channel} onChange={e => update('channel', e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs">
              <option value="WHATSAPP">WhatsApp</option>
              <option value="SMS">SMS</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Type</label>
            <select value={form.template_type} onChange={e => update('template_type', e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs">
              <option value="MARKS">Marks</option>
              <option value="REMINDER">Reminder</option>
              <option value="GENERAL">General</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-slate-600">Message Body</label>
          <button onClick={() => setPreview(!preview)}
            className="text-xs text-indigo-600 font-semibold flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {preview ? 'Edit' : 'Preview'}
          </button>
        </div>
        {preview ? (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-700 whitespace-pre-line min-h-[180px] font-mono leading-relaxed">
            {renderPreview(form.body)}
          </div>
        ) : (
          <textarea
            value={form.body}
            onChange={e => update('body', e.target.value)}
            rows={8}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono resize-none"
            placeholder="Use {student_name}, {marks_detail}, {total_marks}, {percentage}, etc."
          />
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-[11px] text-amber-800">
        <strong className="font-bold">Available Variables:</strong>
        <span className="flex flex-wrap gap-1 mt-1">
          {Object.keys(SAMPLE_VARS).map(k => (
            <code key={k} className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 cursor-pointer"
              onClick={() => update('body', form.body + `{${k}}`)}>
              {`{${k}}`}
            </code>
          ))}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_active} onChange={e => update('is_active', e.target.checked)}
            className="w-3.5 h-3.5 rounded" />
          <span className="text-xs font-semibold text-slate-700">Active Template</span>
        </label>
        <div className="flex items-center gap-2">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button onClick={() => onSave(form)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <Save className="w-3.5 h-3.5" /> Save Template
          </button>
        </div>
      </div>
    </div>
  );
};

export const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [filterChannel, setFilterChannel] = useState<'ALL' | 'WHATSAPP' | 'SMS'>('ALL');

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await api.templates.list();
      setTemplates(data);
    } catch {
      // If none exist, show defaults
      setTemplates(DEFAULT_TEMPLATES as Template[]);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async (t: Template) => {
    try {
      if (t.id) {
        await api.templates.update(t.id, t);
      } else {
        await api.templates.create(t);
      }
      setEditingTemplate(null);
      loadTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await api.templates.delete(id);
      loadTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = filterChannel === 'ALL' ? templates : templates.filter(t => t.channel === filterChannel);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <span>Message Templates</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create and manage WhatsApp & SMS templates. Use variables like <code className="bg-slate-100 px-1 rounded">{'{student_name}'}</code> for personalization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {(['ALL', 'WHATSAPP', 'SMS'] as const).map(ch => (
              <button key={ch} onClick={() => setFilterChannel(ch)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterChannel === ch ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}>{ch}</button>
            ))}
          </div>
          <button
            onClick={() => setEditingTemplate({ name: '', channel: 'WHATSAPP', template_type: 'MARKS', body: '', is_active: true })}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> New Template
          </button>
        </div>
      </div>

      {editingTemplate && (
        <TemplateEditor
          template={editingTemplate}
          onSave={saveTemplate}
          onCancel={() => setEditingTemplate(null)}
        />
      )}

      {loading ? (
        <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((t, i) => (
            <div key={t.id || i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {t.channel === 'WHATSAPP' ? (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                        <Smartphone className="w-3 h-3" /> WhatsApp
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                        <Hash className="w-3 h-3" /> SMS
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">{t.template_type}</span>
                    {!t.is_active && <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-bold">INACTIVE</span>}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{t.name}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setPreviewId(previewId === (t.id || String(i)) ? null : (t.id || String(i)))}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600" title="Preview">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setEditingTemplate(t)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600" title="Edit">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {t.id && (
                    <button onClick={() => deleteTemplate(t.id!)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              {previewId === (t.id || String(i)) ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 whitespace-pre-line max-h-48 overflow-y-auto font-mono">
                  {renderPreview(t.body)}
                </div>
              ) : (
                <p className="text-xs text-slate-500 line-clamp-3 font-mono">{t.body}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
