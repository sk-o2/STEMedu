import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAdminStats, getUsers, updateUserRole, adminUpdateUser, deleteUser,
  adminGetCourses, adminGetCourseAnalytics, adminGetCourse, adminCreateCourse, adminUpdateCourse, adminDeleteCourse,
  adminGetProjects, adminGetProject, adminCreateProject, adminUpdateProject, adminDeleteProject,
  uploadFile, uploadImage,
  adminGetMentoringBookings, adminGetMentoringRevenue, adminCancelMentoringBooking,
  adminAssignTutor, adminUpdateMentoringPricing,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Users, BookOpen, Cpu, Upload, Search, Plus, Edit2, Trash2,
  ChevronLeft, ChevronRight, X, Check, Globe, EyeOff, Eye, ChevronDown, ChevronUp,
  FileText, Video, Link, Image, AlertTriangle, BarChart2, Shield, GraduationCap, RefreshCw,
  Menu, LogOut, Settings, Package, Layers, PlusCircle, Presentation, Calendar, Clock,
  DollarSign, TrendingUp, UserCheck, XCircle, CheckCircle,
} from 'lucide-react';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CATEGORIES = ['Robotics', 'Game Development', 'Drone Technology', 'IoT', 'AI & Machine Learning', 'Electronics', '3D Printing', 'Coding'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const LESSON_TYPES = ['video', 'ppt', 'pdf', 'link', 'activity'];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const avatarUrl = (name, seed) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=${seed || '6366f1'}&color=fff&size=64`;

const Badge = ({ text, type }) => {
  const colors = {
    admin: '#f59e0b', tutor: '#10b981', student: '#6366f1',
    Beginner: '#10b981', Intermediate: '#f59e0b', Advanced: '#ef4444',
    true: '#10b981', false: '#6b7280', published: '#10b981', draft: '#6b7280',
  };
  const col = colors[text] || colors[type] || '#6366f1';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 10px',
      borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
      background: `${col}22`, color: col, border: `1px solid ${col}44`,
      textTransform: 'capitalize',
    }}>{text}</span>
  );
};

const Spinner = ({ size = 20 }) => (
  <div style={{
    width: size, height: size, border: `2px solid rgba(99,102,241,.3)`,
    borderTop: '2px solid #6366f1', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite', flexShrink: 0,
  }} />
);

const EmptyState = ({ icon: Icon, title, subtitle }) => (
  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
    <Icon size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
    <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>{title}</div>
    <div style={{ fontSize: 14 }}>{subtitle}</div>
  </div>
);

// ─── CONFIRMATION DIALOG ──────────────────────────────────────────────────────
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, danger }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, maxWidth: 400, width: '90%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <AlertTriangle size={24} color="#ef4444" />
          <h3 style={{ fontSize: 18, margin: 0 }}>{title}</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: danger ? '#ef4444' : '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div style={{
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px',
    display: 'flex', alignItems: 'flex-start', gap: 16, transition: 'transform .2s, box-shadow .2s',
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${color}22`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
  >
    <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={22} color={color} />
    </div>
    <div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{sub}</div>}
    </div>
  </div>
);

// ─── PAGINATION ───────────────────────────────────────────────────────────────
const Pagination = ({ page, pages, onPage }) => {
  if (pages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 24 }}>
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>
        <ChevronLeft size={16} />
      </button>
      {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
        const p = i + 1;
        return (
          <button key={p} onClick={() => onPage(p)} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${p === page ? '#6366f1' : 'var(--border)'}`, background: p === page ? '#6366f1' : 'transparent', color: p === page ? '#fff' : 'var(--text-primary)', cursor: 'pointer', fontWeight: p === page ? 700 : 400 }}>
            {p}
          </button>
        );
      })}
      <button onClick={() => onPage(page + 1)} disabled={page >= pages} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: page >= pages ? 'not-allowed' : 'pointer', opacity: page >= pages ? 0.4 : 1 }}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

// ─── FILE UPLOAD BUTTON ───────────────────────────────────────────────────────
const FileUploadBtn = ({ label, accept, onUploaded, isImage, children }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      if (isImage) fd.append('image', file);
      else fd.append('file', file);
      const fn = isImage ? uploadImage : uploadFile;
      const res = await fn(fd);
      onUploaded(res.data.url, file.name);
      toast.success('Upload successful!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }} onChange={handleChange} />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: uploading ? 'wait' : 'pointer', fontSize: 13, transition: 'all .2s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        {uploading ? <Spinner size={16} /> : (isImage ? <Image size={16} /> : <Upload size={16} />)}
        {uploading ? 'Uploading...' : (children || label)}
      </button>
    </>
  );
};

// ─── INPUT / TEXTAREA / SELECT HELPERS ───────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--bg-dark)',
  color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' };

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={labelStyle}>{label}</label>}
    {children}
  </div>
);

// ─── COURSE MODAL ─────────────────────────────────────────────────────────────
const defaultCourse = {
  title: '', description: '', shortDescription: '', category: 'Robotics', level: 'Beginner',
  price: 0, discountPrice: '', isFree: true, isPublished: false, thumbnail: '',
  previewVideo: '', tags: '', requirements: '', whatYouLearn: '', language: 'English',
  certificate: true, curriculum: [],
};

const CourseModal = ({ open, onClose, editData, tutors, onSaved }) => {
  const [form, setForm] = useState(defaultCourse);
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    if (editData) {
      setForm({
        ...editData,
        tags: (editData.tags || []).join(', '),
        requirements: (editData.requirements || []).join('\n'),
        whatYouLearn: (editData.whatYouLearn || []).join('\n'),
        curriculum: editData.curriculum || [],
      });
    } else {
      setForm(defaultCourse);
    }
  }, [editData, open]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addSection = () => {
    setForm(f => ({
      ...f,
      curriculum: [...f.curriculum, { title: 'New Section', lessons: [], order: f.curriculum.length }],
    }));
  };

  const updateSection = (si, key, val) => {
    setForm(f => {
      const c = [...f.curriculum];
      c[si] = { ...c[si], [key]: val };
      return { ...f, curriculum: c };
    });
  };

  const removeSection = (si) => {
    setForm(f => ({ ...f, curriculum: f.curriculum.filter((_, i) => i !== si) }));
  };

  const addLesson = (si) => {
    setForm(f => {
      const c = [...f.curriculum];
      c[si].lessons = [...(c[si].lessons || []), { title: 'New Lesson', type: 'video', url: '', isFree: false, duration: 0, order: c[si].lessons.length }];
      return { ...f, curriculum: c };
    });
  };

  const updateLesson = (si, li, key, val) => {
    setForm(f => {
      const c = [...f.curriculum];
      const lessons = [...c[si].lessons];
      lessons[li] = { ...lessons[li], [key]: val };
      c[si] = { ...c[si], lessons };
      return { ...f, curriculum: c };
    });
  };

  const removeLesson = (si, li) => {
    setForm(f => {
      const c = [...f.curriculum];
      c[si].lessons = c[si].lessons.filter((_, i) => i !== li);
      return { ...f, curriculum: c };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        requirements: form.requirements ? form.requirements.split('\n').map(t => t.trim()).filter(Boolean) : [],
        whatYouLearn: form.whatYouLearn ? form.whatYouLearn.split('\n').map(t => t.trim()).filter(Boolean) : [],
        price: Number(form.price) || 0,
        discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
      };
      let res;
      if (editData?._id) res = await adminUpdateCourse(editData._id, payload);
      else res = await adminCreateCourse(payload);
      toast.success(editData ? 'Course updated!' : 'Course created!');
      onSaved(res.data.course);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 9000, overflowY: 'auto', padding: '40px 20px', backdropFilter: 'blur(6px)' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, width: '100%', maxWidth: 800, position: 'relative' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={22} color="#6366f1" /> {editData ? 'Edit Course' : 'Create New Course'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}><X size={22} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Title */}
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Course Title *">
                <input required style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Robotics for Beginners" />
              </Field>
            </div>

            {/* Description */}
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Full Description *">
                <textarea required rows={4} style={{ ...inputStyle, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Detailed course description..." />
              </Field>
            </div>

            {/* Short Description */}
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Short Description (max 200 chars)">
                <input style={inputStyle} maxLength={200} value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)} placeholder="Brief summary shown on course cards" />
              </Field>
            </div>

            {/* Category */}
            <Field label="Category *">
              <select required style={inputStyle} value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            {/* Level */}
            <Field label="Level">
              <select style={inputStyle} value={form.level} onChange={e => set('level', e.target.value)}>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>

            {/* Instructor */}
            <Field label="Instructor">
              <select style={inputStyle} value={form.instructor?._id || form.instructor || ''} onChange={e => set('instructor', e.target.value)}>
                <option value="">— Select Instructor —</option>
                {tutors?.map(t => <option key={t._id} value={t._id}>{t.name} ({t.email})</option>)}
              </select>
            </Field>

            {/* Language */}
            <Field label="Language">
              <input style={inputStyle} value={form.language} onChange={e => set('language', e.target.value)} placeholder="English" />
            </Field>

            {/* Pricing */}
            <Field label="Is Free?">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.isFree} onChange={e => set('isFree', e.target.checked)} />
                  <span style={{ fontSize: 14 }}>Free Course</span>
                </label>
              </div>
            </Field>

            {!form.isFree && (
              <>
                <Field label="Price (₹)">
                  <input type="number" min={0} style={inputStyle} value={form.price} onChange={e => set('price', e.target.value)} />
                </Field>
                <Field label="Discount Price (₹)">
                  <input type="number" min={0} style={inputStyle} value={form.discountPrice} onChange={e => set('discountPrice', e.target.value)} />
                </Field>
              </>
            )}

            {/* Thumbnail */}
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Thumbnail Image">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input style={{ ...inputStyle, flex: 1, minWidth: 200 }} value={form.thumbnail} onChange={e => set('thumbnail', e.target.value)} placeholder="Image URL or upload below" />
                  <FileUploadBtn isImage accept="image/*" onUploaded={(url) => set('thumbnail', url)}>Upload Image</FileUploadBtn>
                </div>
                {form.thumbnail && <img src={form.thumbnail} alt="" style={{ marginTop: 8, height: 80, borderRadius: 8, objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />}
              </Field>
            </div>

            {/* Preview Video */}
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Preview Video URL">
                <input style={inputStyle} value={form.previewVideo} onChange={e => set('previewVideo', e.target.value)} placeholder="YouTube or direct video URL" />
              </Field>
            </div>

            {/* Tags */}
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Tags (comma-separated)">
                <input style={inputStyle} value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="robotics, arduino, beginner" />
              </Field>
            </div>

            {/* What You'll Learn */}
            <Field label="What You'll Learn (one per line)">
              <textarea rows={4} style={{ ...inputStyle, resize: 'vertical' }} value={form.whatYouLearn} onChange={e => set('whatYouLearn', e.target.value)} placeholder="Understand Arduino basics&#10;Build a simple robot&#10;..." />
            </Field>

            {/* Requirements */}
            <Field label="Requirements (one per line)">
              <textarea rows={4} style={{ ...inputStyle, resize: 'vertical' }} value={form.requirements} onChange={e => set('requirements', e.target.value)} placeholder="Basic electronics knowledge&#10;Laptop with USB port&#10;..." />
            </Field>

            {/* Flags */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[['isPublished', 'Published (visible to students)'], ['certificate', 'Offer Certificate']].map(([key, lbl]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} />
                  {lbl}
                </label>
              ))}
            </div>
          </div>

          {/* ── CURRICULUM BUILDER ── */}
          <div style={{ padding: '0 28px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Layers size={18} color="#6366f1" /> Curriculum</h3>
              <button type="button" onClick={addSection} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <Plus size={14} /> Add Section
              </button>
            </div>

            {form.curriculum.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px', border: '1px dashed var(--border)', borderRadius: 12, color: 'var(--text-secondary)', fontSize: 14 }}>
                No sections yet. Click "Add Section" to start building the curriculum.
              </div>
            )}

            {form.curriculum.map((section, si) => (
              <div key={si} style={{ border: '1px solid var(--border)', borderRadius: 12, marginBottom: 12, overflow: 'hidden' }}>
                {/* Section Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(99,102,241,.05)', cursor: 'pointer' }}
                  onClick={() => setExpandedSection(expandedSection === si ? null : si)}>
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeSection(si); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}>
                    <Trash2 size={14} />
                  </button>
                  <input
                    value={section.title}
                    onChange={e => { e.stopPropagation(); updateSection(si, 'title', e.target.value); }}
                    onClick={e => e.stopPropagation()}
                    style={{ ...inputStyle, padding: '6px 10px', flex: 1, fontWeight: 600 }}
                    placeholder="Section Title"
                  />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{section.lessons?.length || 0} lessons</span>
                  {expandedSection === si ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {/* Lessons */}
                {expandedSection === si && (
                  <div style={{ padding: '12px 16px' }}>
                    {(section.lessons || []).map((lesson, li) => (
                      <div key={li} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 10, background: 'var(--bg-dark)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                          <input value={lesson.title} onChange={e => updateLesson(si, li, 'title', e.target.value)} style={{ ...inputStyle, padding: '7px 12px' }} placeholder="Lesson title" />
                          <select value={lesson.type} onChange={e => updateLesson(si, li, 'type', e.target.value)} style={{ ...inputStyle, width: 120 }}>
                            {LESSON_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                          </select>
                          <button type="button" onClick={() => removeLesson(si, li)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>
                            <X size={16} />
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
                          <input value={lesson.url || ''} onChange={e => updateLesson(si, li, 'url', e.target.value)} style={{ ...inputStyle, padding: '7px 12px' }} placeholder={lesson.type === 'video' ? 'YouTube / video URL' : lesson.type === 'link' ? 'External link' : 'File URL'} />
                          {(lesson.type === 'ppt' || lesson.type === 'pdf') && (
                            <FileUploadBtn accept=".ppt,.pptx,.pdf" onUploaded={(url) => updateLesson(si, li, 'url', url)}>
                              Upload {lesson.type.toUpperCase()}
                            </FileUploadBtn>
                          )}
                          {lesson.type === 'video' && (
                            <FileUploadBtn isImage accept="image/*" onUploaded={(url) => updateLesson(si, li, 'thumbnail', url)}>
                              Thumb
                            </FileUploadBtn>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 16, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                            <input type="checkbox" checked={lesson.isFree} onChange={e => updateLesson(si, li, 'isFree', e.target.checked)} />
                            Free Preview
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Duration (min):</span>
                            <input type="number" min={0} value={lesson.duration || ''} onChange={e => updateLesson(si, li, 'duration', Number(e.target.value))} style={{ ...inputStyle, width: 80, padding: '5px 8px' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={() => addLesson(si)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px dashed #6366f1', background: 'transparent', color: '#6366f1', cursor: 'pointer', fontSize: 13, width: '100%', justifyContent: 'center' }}>
                      <PlusCircle size={14} /> Add Lesson
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 24px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 28px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: saving ? 'wait' : 'pointer', fontWeight: 700, fontSize: 15 }}>
              {saving ? <><Spinner size={16} /> Saving...</> : <><Check size={16} /> {editData ? 'Update Course' : 'Create Course'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── PROJECT MODAL ────────────────────────────────────────────────────────────
const defaultProject = {
  title: '', description: '', shortDescription: '', category: 'Robotics', difficulty: 'Beginner',
  estimatedTime: '', thumbnail: '', videoUrl: '', githubUrl: '', isFree: true, isPublished: true,
  tags: '', components: [], steps: [],
};

const ProjectModal = ({ open, onClose, editData, onSaved }) => {
  const [form, setForm] = useState(defaultProject);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editData) {
      setForm({
        ...editData,
        tags: (editData.tags || []).join(', '),
        components: editData.components || [],
        steps: (editData.steps || []).map(s => ({ ...s, images: s.images || [] })),
      });
    } else {
      setForm(defaultProject);
    }
  }, [editData, open]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addComponent = () => setForm(f => ({ ...f, components: [...f.components, { name: '', quantity: 1, optional: false, description: '', link: '' }] }));
  const updateComponent = (i, key, val) => setForm(f => { const c = [...f.components]; c[i] = { ...c[i], [key]: val }; return { ...f, components: c }; });
  const removeComponent = (i) => setForm(f => ({ ...f, components: f.components.filter((_, idx) => idx !== i) }));

  const addStep = () => setForm(f => ({
    ...f,
    steps: [...f.steps, { stepNumber: f.steps.length + 1, title: '', description: '', images: [], codeSnippet: '', codeLanguage: '', tip: '', warning: '' }],
  }));
  const updateStep = (i, key, val) => setForm(f => { const s = [...f.steps]; s[i] = { ...s[i], [key]: val }; return { ...f, steps: s }; });
  const removeStep = (i) => setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, stepNumber: idx + 1 })) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      let res;
      if (editData?._id) res = await adminUpdateProject(editData._id, payload);
      else res = await adminCreateProject(payload);
      toast.success(editData ? 'Project updated!' : 'Project created!');
      onSaved(res.data.project);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 9000, overflowY: 'auto', padding: '40px 20px', backdropFilter: 'blur(6px)' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, width: '100%', maxWidth: 800, position: 'relative' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Cpu size={22} color="#10b981" /> {editData ? 'Edit Project' : 'Create New Project'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}><X size={22} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Project Title *">
                <input required style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Bluetooth Controlled Robot" />
              </Field>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Description *">
                <textarea required rows={4} style={{ ...inputStyle, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Full project description..." />
              </Field>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Short Description (max 250 chars)">
                <input style={inputStyle} maxLength={250} value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)} placeholder="Brief summary for project cards" />
              </Field>
            </div>
            <Field label="Category *">
              <select required style={inputStyle} value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Difficulty">
              <select style={inputStyle} value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="Estimated Time">
              <input style={inputStyle} value={form.estimatedTime} onChange={e => set('estimatedTime', e.target.value)} placeholder="e.g. 2-3 hours" />
            </Field>
            <Field label="GitHub URL">
              <input style={inputStyle} value={form.githubUrl} onChange={e => set('githubUrl', e.target.value)} placeholder="https://github.com/..." />
            </Field>
            <Field label="Video Tutorial URL">
              <input style={inputStyle} value={form.videoUrl} onChange={e => set('videoUrl', e.target.value)} placeholder="YouTube or video link" />
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Thumbnail">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input style={{ ...inputStyle, flex: 1, minWidth: 200 }} value={form.thumbnail} onChange={e => set('thumbnail', e.target.value)} placeholder="Image URL or upload below" />
                  <FileUploadBtn isImage accept="image/*" onUploaded={(url) => set('thumbnail', url)}>Upload Image</FileUploadBtn>
                </div>
                {form.thumbnail && <img src={form.thumbnail} alt="" style={{ marginTop: 8, height: 80, borderRadius: 8, objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />}
              </Field>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Tags (comma-separated)">
                <input style={inputStyle} value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="arduino, robot, bluetooth" />
              </Field>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[['isFree', 'Free Project'], ['isPublished', 'Published']].map(([key, lbl]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} /> {lbl}
                </label>
              ))}
            </div>
          </div>

          {/* Components */}
          <div style={{ padding: '0 28px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Package size={18} color="#10b981" /> Components / Materials</h3>
              <button type="button" onClick={addComponent} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: '#10b981', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <Plus size={14} /> Add Component
              </button>
            </div>
            {form.components.map((comp, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px 1fr auto', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <input value={comp.name} onChange={e => updateComponent(i, 'name', e.target.value)} style={{ ...inputStyle, padding: '8px 12px' }} placeholder="Component name" />
                <input type="number" min={1} value={comp.quantity} onChange={e => updateComponent(i, 'quantity', Number(e.target.value))} style={{ ...inputStyle, padding: '8px 12px' }} placeholder="Qty" />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', justifyContent: 'center' }}>
                  <input type="checkbox" checked={comp.optional} onChange={e => updateComponent(i, 'optional', e.target.checked)} /> Optional
                </label>
                <input value={comp.link || ''} onChange={e => updateComponent(i, 'link', e.target.value)} style={{ ...inputStyle, padding: '8px 12px' }} placeholder="Buy link (optional)" />
                <button type="button" onClick={() => removeComponent(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><X size={16} /></button>
              </div>
            ))}
          </div>

          {/* Steps */}
          <div style={{ padding: '0 28px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Layers size={18} color="#10b981" /> Build Steps</h3>
              <button type="button" onClick={addStep} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: '#10b981', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <Plus size={14} /> Add Step
              </button>
            </div>
            {form.steps.map((step, i) => (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 12, background: 'var(--bg-dark)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{step.stepNumber}</div>
                  <input value={step.title} onChange={e => updateStep(i, 'title', e.target.value)} style={{ ...inputStyle, padding: '7px 12px', flex: 1 }} placeholder="Step title" />
                  <button type="button" onClick={() => removeStep(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                </div>
                <textarea rows={3} value={step.description} onChange={e => updateStep(i, 'description', e.target.value)} style={{ ...inputStyle, resize: 'vertical', marginBottom: 8 }} placeholder="Step description / instructions..." />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input value={step.tip || ''} onChange={e => updateStep(i, 'tip', e.target.value)} style={{ ...inputStyle, padding: '7px 12px' }} placeholder="💡 Tip (optional)" />
                  <input value={step.warning || ''} onChange={e => updateStep(i, 'warning', e.target.value)} style={{ ...inputStyle, padding: '7px 12px' }} placeholder="⚠️ Warning (optional)" />
                  <input value={step.codeLanguage || ''} onChange={e => updateStep(i, 'codeLanguage', e.target.value)} style={{ ...inputStyle, padding: '7px 12px' }} placeholder="Code language (e.g. arduino)" />
                  <FileUploadBtn isImage accept="image/*" onUploaded={(url) => updateStep(i, 'images', [...(step.images || []), url])}>Add Step Image</FileUploadBtn>
                </div>
                {step.codeSnippet !== undefined && (
                  <textarea rows={3} value={step.codeSnippet || ''} onChange={e => updateStep(i, 'codeSnippet', e.target.value)} style={{ ...inputStyle, resize: 'vertical', marginTop: 8, fontFamily: 'monospace', fontSize: 13 }} placeholder="// Code snippet (optional)" />
                )}
                {(step.images || []).length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    {step.images.map((img, ii) => (
                      <div key={ii} style={{ position: 'relative' }}>
                        <img src={img} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                        <button type="button" onClick={() => updateStep(i, 'images', step.images.filter((_, iii) => iii !== ii))}
                          style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', border: 'none', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 24px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 28px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', cursor: saving ? 'wait' : 'pointer', fontWeight: 700, fontSize: 15 }}>
              {saving ? <><Spinner size={16} /> Saving...</> : <><Check size={16} /> {editData ? 'Update Project' : 'Create Project'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── USER EDIT MODAL ──────────────────────────────────────────────────────────
const UserEditModal = ({ open, onClose, editUser, onSaved }) => {
  const [form, setForm] = useState({ name: '', email: '', bio: '', avatar: '', role: 'student', isVerified: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editUser) setForm({ name: editUser.name || '', email: editUser.email || '', bio: editUser.bio || '', avatar: editUser.avatar || '', role: editUser.role || 'student', isVerified: editUser.isVerified || false });
  }, [editUser, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminUpdateUser(editUser._id, form);
      toast.success('User updated!');
      onSaved(res.data.user);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, backdropFilter: 'blur(6px)', padding: 20 }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, width: '100%', maxWidth: 500 }}>
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 10 }}><Users size={20} color="#6366f1" /> Edit User</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ position: 'relative' }}>
              <img src={form.avatar || avatarUrl(form.name)} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border)' }} />
              <FileUploadBtn isImage accept="image/*" onUploaded={(url) => set('avatar', url)}>
                <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#6366f1', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Image size={12} color="#fff" />
                </div>
              </FileUploadBtn>
            </div>
          </div>
          <Field label="Name"><input required style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} /></Field>
          <Field label="Email"><input required type="email" style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} /></Field>
          <Field label="Bio"><textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={form.bio} onChange={e => set('bio', e.target.value)} /></Field>
          <Field label="Role">
            <select style={inputStyle} value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="student">Student</option>
              <option value="tutor">Tutor</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, marginBottom: 20 }}>
            <input type="checkbox" checked={form.isVerified} onChange={e => set('isVerified', e.target.checked)} />
            Email Verified
          </label>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: saving ? 'wait' : 'pointer', fontWeight: 700 }}>
              {saving ? <><Spinner size={16} /> Saving...</> : <><Check size={14} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── USERS TAB ────────────────────────────────────────────────────────────────
const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editUser, setEditUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const searchTimer = useRef(null);

  const load = useCallback(async (pg = page, s = search, r = roleFilter) => {
    setLoading(true);
    try {
      const res = await getUsers({ page: pg, limit: 15, search: s || undefined, role: r !== 'all' ? r : undefined });
      setUsers(res.data.users);
      setTotal(res.data.total);
      setPage(res.data.page);
      setPages(res.data.pages);
    } catch { toast.error('Failed to load users'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(1, search, roleFilter); }, [roleFilter]);
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(1, search, roleFilter), 400);
  }, [search]);

  const handleRoleChange = async (id, role) => {
    try {
      await updateUserRole(id, role);
      setUsers(u => u.map(usr => usr._id === id ? { ...usr, role } : usr));
      toast.success('Role updated!');
    } catch { toast.error('Failed to update role'); }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(confirmDelete._id);
      setUsers(u => u.filter(usr => usr._id !== confirmDelete._id));
      setTotal(t => t - 1);
      toast.success('User deleted');
    } catch { toast.error('Failed to delete user'); } finally { setConfirmDelete(null); }
  };

  const handleUserSaved = (updated) => {
    setUsers(u => u.map(usr => usr._id === updated._id ? updated : usr));
  };

  return (
    <div>
      <UserEditModal open={!!editUser} onClose={() => setEditUser(null)} editUser={editUser} onSaved={handleUserSaved} />
      <ConfirmDialog open={!!confirmDelete} title="Delete User" danger
        message={`Are you sure you want to permanently delete "${confirmDelete?.name}"? This cannot be undone.`}
        onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." style={{ ...inputStyle, paddingLeft: 38 }} />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ ...inputStyle, width: 150 }}>
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="tutor">Tutors</option>
          <option value="admin">Admins</option>
        </select>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{total} users</span>
        <button onClick={() => load(1, search, roleFilter)} style={{ padding: '8px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <RefreshCw size={15} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" subtitle="Try adjusting your search or filters." />
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(99,102,241,.06)' }}>
                {['User', 'Email', 'Role', 'Verified', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u._id} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.02)', transition: 'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.02)'}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={u.avatar || avatarUrl(u.name, u.role === 'tutor' ? '10b981' : '6366f1')} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <select value={u.role} onChange={e => handleRoleChange(u._id, e.target.value)} style={{ ...inputStyle, width: 110, padding: '5px 8px', fontSize: 13 }}>
                      <option value="student">Student</option>
                      <option value="tutor">Tutor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px 16px' }}><Badge text={u.isVerified ? '✓ Yes' : '✗ No'} type={u.isVerified ? 'true' : 'false'} /></td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 13, whiteSpace: 'nowrap' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setEditUser(u)} title="Edit" style={{ padding: '6px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: '#6366f1', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setConfirmDelete(u)} title="Delete" style={{ padding: '6px', borderRadius: 7, border: '1px solid #ef444433', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={pages} onPage={(p) => { setPage(p); load(p, search, roleFilter); }} />
    </div>
  );
};

// ─── COURSES TAB ──────────────────────────────────────────────────────────────
const CoursesTab = () => {
  const [activeSubTab, setActiveSubTab] = useState('catalog'); // 'catalog' | 'analytics'
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [pubFilter, setPubFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [tutors, setTutors] = useState([]);
  const searchTimer = useRef(null);

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const load = useCallback(async (pg = 1, s = '', cat = 'all', pub = 'all') => {
    setLoading(true);
    try {
      const res = await adminGetCourses({ page: pg, limit: 15, search: s || undefined, category: cat !== 'all' ? cat : undefined, isPublished: pub !== 'all' ? pub : undefined });
      setCourses(res.data.courses);
      setTotal(res.data.total);
      setPage(res.data.page);
      setPages(res.data.pages);
    } catch { toast.error('Failed to load courses'); } finally { setLoading(false); }
  }, []);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await adminGetCourseAnalytics();
      setAnalytics(res.data.analytics);
    } catch { toast.error('Failed to load course analytics'); } finally { setAnalyticsLoading(false); }
  }, []);

  useEffect(() => {
    load(1, search, catFilter, pubFilter);
    loadAnalytics();
    getUsers({ role: 'tutor', limit: 100 }).then(r => setTutors(r.data.users)).catch(() => {});
  }, [catFilter, pubFilter]);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(1, search, catFilter, pubFilter), 400);
  }, [search]);

  const handleDelete = async () => {
    try {
      await adminDeleteCourse(confirmDelete._id);
      setCourses(c => c.filter(x => x._id !== confirmDelete._id));
      setTotal(t => t - 1);
      loadAnalytics();
      toast.success('Course deleted');
    } catch { toast.error('Failed to delete'); } finally { setConfirmDelete(null); }
  };

  const handleTogglePublish = async (course) => {
    try {
      const res = await adminUpdateCourse(course._id, { isPublished: !course.isPublished });
      setCourses(c => c.map(x => x._id === course._id ? res.data.course : x));
      loadAnalytics();
      toast.success(res.data.course.isPublished ? 'Course published!' : 'Course unpublished');
    } catch { toast.error('Failed to toggle publish'); }
  };

  const handleEdit = async (course) => {
    try {
      const res = await adminGetCourse(course._id);
      setEditCourse(res.data.course);
      setShowModal(true);
    } catch { toast.error('Failed to load course details'); }
  };

  const handleSaved = (saved) => {
    if (editCourse) setCourses(c => c.map(x => x._id === saved._id ? saved : x));
    else { setCourses(c => [saved, ...c]); setTotal(t => t + 1); }
    setEditCourse(null);
    loadAnalytics();
  };

  const topCourse = analytics?.courseStats?.[0];

  return (
    <div>
      <ConfirmDialog open={!!confirmDelete} title="Delete Course" danger
        message={`Delete "${confirmDelete?.title}"? All curriculum data will be lost.`}
        onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
      <CourseModal open={showModal} onClose={() => { setShowModal(false); setEditCourse(null); }} editData={editCourse} tutors={tutors} onSaved={handleSaved} />

      {/* Analytics Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon={DollarSign} label="Total Course Revenue" value={`₹${(analytics?.totalRevenue || 0).toLocaleString('en-IN')}`} color="#10b981" sub={`${analytics?.paidSales || 0} paid sales`} />
        <StatCard icon={Users} label="Total Course Sales / Enrolled" value={analytics?.totalSales || 0} color="#6366f1" sub={`${analytics?.freeEnrollments || 0} free enrollments`} />
        <StatCard icon={GraduationCap} label="Top Revenue Course" value={topCourse ? `₹${topCourse.revenue.toLocaleString('en-IN')}` : '₹0'} color="#8b5cf6" sub={topCourse ? topCourse.title : 'No sales yet'} />
        <StatCard icon={BookOpen} label="Total Courses" value={analytics?.totalCoursesCount || 0} color="#f59e0b" sub="In platform catalog" />
      </div>

      {/* Sub-tab Switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'rgba(255,255,255,.03)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[
          { id: 'catalog', label: '📚 Course Catalog & Builder', icon: BookOpen },
          { id: 'analytics', label: '📊 Sales & Revenue Analytics', icon: TrendingUp },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveSubTab(tab.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none',
            cursor: 'pointer', fontSize: 13, fontWeight: 700,
            background: activeSubTab === tab.id ? '#6366f1' : 'transparent',
            color: activeSubTab === tab.id ? '#fff' : 'var(--text-secondary)',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Sub-tab 1: Course Catalog & Builder ── */}
      {activeSubTab === 'catalog' && (
        <div>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses..." style={{ ...inputStyle, paddingLeft: 38 }} />
            </div>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ ...inputStyle, width: 180 }}>
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={pubFilter} onChange={e => setPubFilter(e.target.value)} style={{ ...inputStyle, width: 140 }}>
              <option value="all">All Status</option>
              <option value="true">Published</option>
              <option value="false">Draft</option>
            </select>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{total} courses</span>
            <button onClick={() => { setEditCourse(null); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>
              <Plus size={16} /> New Course
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
          ) : courses.length === 0 ? (
            <EmptyState icon={BookOpen} title="No courses found" subtitle='Click "New Course" to create your first course.' />
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {courses.map(course => {
                const salesCount = course.studentsEnrolled?.length || 0;
                const effectivePrice = course.isFree ? 0 : (course.discountPrice || course.price || 0);
                const courseRevenue = salesCount * effectivePrice;
                return (
                  <div key={course._id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, transition: 'box-shadow .2s' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,.1)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                  >
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt="" style={{ width: 72, height: 54, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />
                    ) : (
                      <div style={{ width: 72, height: 54, borderRadius: 8, background: 'rgba(99,102,241,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BookOpen size={24} color="#6366f1" />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{course.title}</span>
                        <Badge text={course.isPublished ? 'Published' : 'Draft'} type={course.isPublished ? 'published' : 'draft'} />
                        <Badge text={course.level} type={course.level} />
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span>{course.category}</span>
                        <span style={{ color: '#6366f1', fontWeight: 700 }}>👥 {salesCount} sold / enrolled</span>
                        <span style={{ color: '#10b981', fontWeight: 800 }}>💰 Revenue: ₹{courseRevenue.toLocaleString('en-IN')}</span>
                        <span>{course.isFree ? 'Free' : `Price: ₹${course.discountPrice || course.price}`}</span>
                        {course.instructor && <span>by {course.instructor.name}</span>}
                        <span>{(course.curriculum || []).length} sections · {course.totalLessons || 0} lessons</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleTogglePublish(course)} title={course.isPublished ? 'Unpublish' : 'Publish'} style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${course.isPublished ? '#ef444433' : '#10b98133'}`, background: 'transparent', color: course.isPublished ? '#ef4444' : '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
                        {course.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                        {course.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button onClick={() => handleEdit(course)} title="Edit" style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: '#6366f1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
                        <Edit2 size={14} /> Edit
                      </button>
                      <button onClick={() => setConfirmDelete(course)} title="Delete" style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #ef444433', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Pagination page={page} pages={pages} onPage={(p) => { setPage(p); load(p, search, catFilter, pubFilter); }} />
        </div>
      )}

      {/* ── Sub-tab 2: Sales & Revenue Analytics ── */}
      {activeSubTab === 'analytics' && (
        <div>
          {analyticsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
          ) : !analytics ? (
            <EmptyState icon={TrendingUp} title="No analytics data available" subtitle="Click refresh to load course analytics" />
          ) : (
            <div>
              {/* Category Revenue Breakdown */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChart2 size={18} color="#6366f1" /> Course Revenue & Sales by Category
                </div>
                <div style={{ display: 'grid', gap: 14 }}>
                  {analytics.categoryStats?.map(cat => {
                    const pct = analytics.totalRevenue > 0 ? Math.round((cat.revenue / analytics.totalRevenue) * 100) : 0;
                    return (
                      <div key={cat.category}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat.category} ({cat.coursesCount} courses)</span>
                          <span style={{ fontWeight: 800, color: '#10b981' }}>
                            ₹{cat.revenue.toLocaleString('en-IN')} · <span style={{ color: '#6366f1' }}>{cat.salesCount} sold</span>
                          </span>
                        </div>
                        <div style={{ height: 8, background: 'rgba(255,255,255,.05)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#6366f1,#10b981)', borderRadius: 4, transition: 'width .5s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Per-Course Sales Ranking Table */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>🏆 Course Sales & Revenue Ranking</div>
                  <button onClick={loadAnalytics} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>
                    <RefreshCw size={14} /> Refresh Analytics
                  </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,.03)', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)' }}>Rank</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)' }}>Course</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)' }}>Category</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)' }}>Price</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-secondary)' }}>Sold / Enrolled</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-secondary)' }}>Total Revenue</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-secondary)' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.courseStats?.map((c, idx) => (
                        <tr key={c._id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 800, color: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--text-secondary)' }}>
                            #{idx + 1}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {c.thumbnail ? (
                                <img src={c.thumbnail} alt="" style={{ width: 40, height: 30, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                              ) : (
                                <div style={{ width: 40, height: 30, borderRadius: 6, background: 'rgba(99,102,241,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <BookOpen size={16} color="#6366f1" />
                                </div>
                              )}
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.title}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{c.category}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                            {c.isFree ? <span style={{ color: '#10b981' }}>Free</span> : `₹${c.effectivePrice}`}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 800, color: '#6366f1' }}>
                            {c.salesCount} students
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#10b981', fontSize: 14 }}>
                            ₹{c.revenue.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <Badge text={c.isPublished ? 'Published' : 'Draft'} type={c.isPublished ? 'published' : 'draft'} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


// ─── PROJECTS TAB ─────────────────────────────────────────────────────────────
const ProjectsTab = () => {
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [pubFilter, setPubFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const searchTimer = useRef(null);

  const load = useCallback(async (pg = 1, s = '', cat = 'all', pub = 'all') => {
    setLoading(true);
    try {
      const res = await adminGetProjects({ page: pg, limit: 15, search: s || undefined, category: cat !== 'all' ? cat : undefined, isPublished: pub !== 'all' ? pub : undefined });
      setProjects(res.data.projects);
      setTotal(res.data.total);
      setPage(res.data.page);
      setPages(res.data.pages);
    } catch { toast.error('Failed to load projects'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(1, search, catFilter, pubFilter); }, [catFilter, pubFilter]);
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(1, search, catFilter, pubFilter), 400);
  }, [search]);

  const handleDelete = async () => {
    try {
      await adminDeleteProject(confirmDelete._id);
      setProjects(p => p.filter(x => x._id !== confirmDelete._id));
      setTotal(t => t - 1);
      toast.success('Project deleted');
    } catch { toast.error('Failed to delete'); } finally { setConfirmDelete(null); }
  };

  const handleTogglePublish = async (project) => {
    try {
      const res = await adminUpdateProject(project._id, { isPublished: !project.isPublished });
      setProjects(p => p.map(x => x._id === project._id ? res.data.project : x));
      toast.success(res.data.project.isPublished ? 'Project published!' : 'Project unpublished');
    } catch { toast.error('Failed to toggle publish'); }
  };

  const handleEdit = async (project) => {
    try {
      const res = await adminGetProject(project._id);
      setEditProject(res.data.project);
      setShowModal(true);
    } catch { toast.error('Failed to load project details'); }
  };

  const handleSaved = (saved) => {
    if (editProject) setProjects(p => p.map(x => x._id === saved._id ? saved : x));
    else { setProjects(p => [saved, ...p]); setTotal(t => t + 1); }
    setEditProject(null);
  };

  return (
    <div>
      <ConfirmDialog open={!!confirmDelete} title="Delete Project" danger
        message={`Delete "${confirmDelete?.title}"? All steps and data will be permanently removed.`}
        onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
      <ProjectModal open={showModal} onClose={() => { setShowModal(false); setEditProject(null); }} editData={editProject} onSaved={handleSaved} />

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." style={{ ...inputStyle, paddingLeft: 38 }} />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ ...inputStyle, width: 180 }}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={pubFilter} onChange={e => setPubFilter(e.target.value)} style={{ ...inputStyle, width: 140 }}>
          <option value="all">All Status</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{total} projects</span>
        <button onClick={() => { setEditProject(null); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
      ) : projects.length === 0 ? (
        <EmptyState icon={Cpu} title="No projects found" subtitle='Click "New Project" to create your first project.' />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {projects.map(project => (
            <div key={project._id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, transition: 'box-shadow .2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(16,185,129,.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              {project.thumbnail ? (
                <img src={project.thumbnail} alt="" style={{ width: 72, height: 54, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />
              ) : (
                <div style={{ width: 72, height: 54, borderRadius: 8, background: 'rgba(16,185,129,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Cpu size={24} color="#10b981" />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{project.title}</span>
                  <Badge text={project.isPublished ? 'Published' : 'Draft'} type={project.isPublished ? 'published' : 'draft'} />
                  <Badge text={project.difficulty} type={project.difficulty} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span>{project.category}</span>
                  <span>⏱ {project.estimatedTime || 'N/A'}</span>
                  <span>👁 {project.views || 0} views</span>
                  <span>❤️ {project.likes?.length || 0} likes</span>
                  <span>{project.steps?.length || 0} steps</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button onClick={() => handleTogglePublish(project)} style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${project.isPublished ? '#ef444433' : '#10b98133'}`, background: 'transparent', color: project.isPublished ? '#ef4444' : '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
                  {project.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                  {project.isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => handleEdit(project)} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
                  <Edit2 size={14} /> Edit
                </button>
                <button onClick={() => setConfirmDelete(project)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #ef444433', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} pages={pages} onPage={(p) => { setPage(p); load(p, search, catFilter, pubFilter); }} />
    </div>
  );
};

// ─── DASHBOARD TAB ────────────────────────────────────────────────────────────
const DashboardTab = ({ stats, recentUsers, recentCourses, loading }) => {
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={40} /></div>;
  return (
    <div>
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers} color="#6366f1" sub={`${stats?.tutors || 0} tutors · ${stats?.students || 0} students`} />
        <StatCard icon={BookOpen} label="Total Courses" value={stats?.totalCourses} color="#8b5cf6" />
        <StatCard icon={Cpu} label="Total Projects" value={stats?.totalProjects} color="#10b981" />
        <StatCard icon={BarChart2} label="Chat Sessions" value={stats?.totalSessions} color="#f59e0b" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent Users */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Users size={16} color="#6366f1" /> Recent Users</h3>
          {(recentUsers || []).map(u => (
            <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <img src={u.avatar || avatarUrl(u.name)} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</div>
              </div>
              <Badge text={u.role} />
            </div>
          ))}
        </div>

        {/* Recent Courses */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><BookOpen size={16} color="#8b5cf6" /> Recent Courses</h3>
          {(recentCourses || []).map(c => (
            <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(139,92,246,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BookOpen size={16} color="#8b5cf6" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.category} · {c.studentsEnrolled?.length || 0} students</div>
              </div>
              <Badge text={c.isPublished ? 'Live' : 'Draft'} type={c.isPublished ? 'published' : 'draft'} />
            </div>
          ))}
          {(!recentCourses || recentCourses.length === 0) && (
            <div style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', padding: 20 }}>No courses yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── UPLOADS TAB ──────────────────────────────────────────────────────────────
const UploadsTab = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileUploaded = (url, name, type) => {
    setUploadedFiles(f => [{ url, name, type, id: Date.now() }, ...f]);
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
        {/* Image Upload */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(99,102,241,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Image size={28} color="#6366f1" />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Upload Image</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>Upload thumbnails, banners, or any image. Max 5MB. Formats: JPG, PNG, GIF, WebP.</p>
          <FileUploadBtn isImage accept="image/*" onUploaded={(url, name) => handleFileUploaded(url, name, 'image')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 10, background: '#6366f1', color: '#fff', fontWeight: 600 }}>
              <Upload size={16} /> Choose Image
            </div>
          </FileUploadBtn>
        </div>

        {/* PPT Upload */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(245,158,11,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Presentation size={28} color="#f59e0b" />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Upload PPT / PDF</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>Upload course materials, presentations, or guides. Max 50MB. Formats: PDF, PPT, PPTX.</p>
          <FileUploadBtn accept=".pdf,.ppt,.pptx" onUploaded={(url, name) => handleFileUploaded(url, name, 'file')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 10, background: '#f59e0b', color: '#fff', fontWeight: 600 }}>
              <Upload size={16} /> Choose File
            </div>
          </FileUploadBtn>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Uploaded This Session</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            {uploadedFiles.map(f => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-dark)', borderRadius: 10, border: '1px solid var(--border)' }}>
                {f.type === 'image' ? <Image size={18} color="#6366f1" /> : <FileText size={18} color="#f59e0b" />}
                <span style={{ flex: 1, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name || 'Uploaded file'}</span>
                <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <Globe size={14} /> Open URL
                </a>
                <button onClick={() => { navigator.clipboard.writeText(f.url); toast.success('URL copied!'); }} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}>
                  Copy URL
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 12, padding: '16px 20px', marginTop: 20 }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          💡 <strong>Tip:</strong> Files uploaded here are stored on Cloudinary. Copy the URL and paste it into lesson fields in the Courses tab when building your curriculum.
        </p>
      </div>
    </div>
  );
};

// ─── MENTORING TAB ────────────────────────────────────────────────────────────
const fmt12 = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const MentoringStatusBadge = ({ status }) => {
  const MAP = {
    pending:     { color: '#f59e0b', label: '⏳ Pending' },
    confirmed:   { color: '#10b981', label: '✅ Confirmed' },
    rejected:    { color: '#ef4444', label: '❌ Rejected' },
    cancelled:   { color: '#6b7280', label: '🚫 Cancelled' },
    rescheduled: { color: '#6366f1', label: '🔄 Rescheduled' },
    completed:   { color: '#8b5cf6', label: '🏆 Completed' },
  };
  const s = MAP[status] || MAP.pending;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 12px', borderRadius:20,
      fontSize:11, fontWeight:700, background:`${s.color}22`, color:s.color, border:`1px solid ${s.color}44`, whiteSpace:'nowrap' }}>
      {s.label}
    </span>
  );
};

const AssignTutorModal = ({ open, bookingId, tutors, onClose, onAssigned }) => {
  const [tutorId, setTutorId] = useState('');
  const [saving, setSaving] = useState(false);
  if (!open) return null;
  const handleSave = async () => {
    if (!tutorId) { toast.error('Select a tutor'); return; }
    setSaving(true);
    try {
      const r = await adminAssignTutor(bookingId, tutorId);
      toast.success('Tutor assigned!');
      onAssigned(r.data.booking);
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setSaving(false); }
  };
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(4px)', padding:16 }}>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:28, maxWidth:400, width:'100%' }}>
        <h3 style={{ margin:'0 0 20px', fontSize:18 }}>Assign Tutor</h3>
        <select value={tutorId} onChange={e => setTutorId(e.target.value)} style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-dark)', color:'var(--text-primary)', fontSize:14, marginBottom:20 }}>
          <option value="">Select a tutor...</option>
          {tutors.map(t => <option key={t._id} value={t._id}>{t.name} — {t.email}</option>)}
        </select>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text-primary)', cursor:'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding:'9px 18px', borderRadius:8, border:'none', background:'#6366f1', color:'#fff', cursor:'pointer', fontWeight:700 }}>{saving ? 'Saving...' : 'Assign'}</button>
        </div>
      </div>
    </div>
  );
};

const MentoringTab = () => {
  const [subTab, setSubTab] = useState('bookings');
  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [assignModal, setAssignModal] = useState(null); // bookingId
  const [tutors, setTutors] = useState([]);
  const [confirmCancel, setConfirmCancel] = useState(null);
  // Revenue state
  const [revenue, setRevenue] = useState(null);
  const [revLoading, setRevLoading] = useState(false);
  // Pricing state
  const [pricing, setPricing] = useState({ price30: 99, price1hr: 199, price2hr: 349 });
  const [pricingSaving, setPricingSaving] = useState(false);

  const loadBookings = useCallback(async (pg = 1, st = 'all') => {
    setLoading(true);
    try {
      const r = await adminGetMentoringBookings({ page: pg, limit: 15, status: st });
      setBookings(r.data.bookings);
      setTotal(r.data.total);
    } catch { toast.error('Failed to load bookings'); } finally { setLoading(false); }
  }, []);

  const loadRevenue = useCallback(async () => {
    setRevLoading(true);
    try {
      const r = await adminGetMentoringRevenue();
      setRevenue(r.data.revenue);
      if (r.data.revenue.packages) {
        setPricing({
          price30: r.data.revenue.packages['30min']?.price ?? 99,
          price1hr: r.data.revenue.packages['1hr']?.price ?? 199,
          price2hr: r.data.revenue.packages['2hr']?.price ?? 349,
        });
      }
    } catch { toast.error('Failed to load revenue'); } finally { setRevLoading(false); }
  }, []);

  useEffect(() => {
    loadBookings(1, statusFilter);
    getUsers({ role: 'tutor', limit: 100 }).then(r => setTutors(r.data.users || [])).catch(() => {});
  }, [statusFilter]);

  useEffect(() => { if (subTab === 'revenue') loadRevenue(); }, [subTab]);

  const handleCancelBooking = async () => {
    try {
      const r = await adminCancelMentoringBooking(confirmCancel);
      setBookings(b => b.map(x => x._id === confirmCancel ? r.data.booking : x));
      toast.success('Booking cancelled');
    } catch { toast.error('Failed'); } finally { setConfirmCancel(null); }
  };

  const handleAssigned = (updatedBooking) => {
    setBookings(b => b.map(x => x._id === updatedBooking._id ? updatedBooking : x));
  };

  const handleSavePricing = async () => {
    setPricingSaving(true);
    try {
      await adminUpdateMentoringPricing(pricing);
      toast.success('Pricing updated for this session!');
    } catch { toast.error('Failed to update pricing'); } finally { setPricingSaving(false); }
  };

  const subTabs = [
    { id: 'bookings', label: '📋 All Bookings', icon: Calendar },
    { id: 'revenue',  label: '💰 Revenue',       icon: TrendingUp },
    { id: 'pricing',  label: '⚙️ Pricing',        icon: Settings },
  ];

  return (
    <div>
      <AssignTutorModal
        open={!!assignModal}
        bookingId={assignModal}
        tutors={tutors}
        onClose={() => setAssignModal(null)}
        onAssigned={handleAssigned}
      />
      <ConfirmDialog
        open={!!confirmCancel}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        danger
        onConfirm={handleCancelBooking}
        onCancel={() => setConfirmCancel(null)}
      />

      {/* Sub-tab switcher */}
      <div style={{ display:'flex', gap:8, marginBottom:24, background:'rgba(255,255,255,.03)', border:'1px solid var(--border)', borderRadius:10, padding:4, width:'fit-content' }}>
        {subTabs.map(st => (
          <button key={st.id} onClick={() => setSubTab(st.id)} style={{
            display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:8, border:'none',
            cursor:'pointer', fontSize:13, fontWeight:700,
            background: subTab === st.id ? '#6366f1' : 'transparent',
            color: subTab === st.id ? '#fff' : 'var(--text-secondary)',
          }}>
            {st.label}
          </button>
        ))}
      </div>

      {/* ── BOOKINGS sub-tab ── */}
      {subTab === 'bookings' && (
        <div>
          {/* Status filter + count */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, flexWrap:'wrap' }}>
            {['all','pending','confirmed','rescheduled','completed','cancelled','rejected'].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} style={{
                padding:'7px 14px', borderRadius:20, border:'1px solid var(--border)', cursor:'pointer', fontSize:12, fontWeight:600,
                background: statusFilter === s ? '#6366f1' : 'transparent',
                color: statusFilter === s ? '#fff' : 'var(--text-secondary)', textTransform:'capitalize',
              }}>{s}</button>
            ))}
            <span style={{ marginLeft:'auto', color:'var(--text-secondary)', fontSize:13 }}>{total} bookings</span>
            <button onClick={() => loadBookings(page, statusFilter)} style={{ padding:'7px 12px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text-secondary)', cursor:'pointer' }}>
              <RefreshCw size={14} />
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign:'center', padding:60, color:'var(--text-secondary)' }}>Loading...</div>
          ) : bookings.length === 0 ? (
            <EmptyState icon={Calendar} title="No bookings found" subtitle="Try changing the status filter" />
          ) : (
            <div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'rgba(255,255,255,.03)' }}>
                      {['Booking ID','Student','Tutor','Package','Date & Time','Amount','Status','Actions'].map(h => (
                        <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:'var(--text-secondary)', fontSize:12, whiteSpace:'nowrap', borderBottom:'1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b._id} style={{ borderBottom:'1px solid var(--border)', transition:'background .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding:'12px 14px', fontWeight:700, color:'#6366f1', fontFamily:'monospace', fontSize:12 }}>{b.bookingId}</td>
                        <td style={{ padding:'12px 14px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <img src={b.student?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(b.student?.name||'S')}&background=6366f1&color=fff`}
                              alt="" style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
                            <div>
                              <div style={{ fontWeight:600 }}>{b.student?.name || '—'}</div>
                              <div style={{ fontSize:11, color:'var(--text-muted)' }}>{b.student?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:'12px 14px' }}>
                          {b.tutor ? (
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <img src={b.tutor?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(b.tutor?.name||'T')}&background=10b981&color=fff`}
                                alt="" style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
                              <span style={{ fontWeight:600 }}>{b.tutor.name}</span>
                            </div>
                          ) : (
                            <button onClick={() => setAssignModal(b._id)} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:7, border:'1px dashed rgba(99,102,241,.5)', background:'rgba(99,102,241,.08)', color:'#6366f1', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                              <UserCheck size={12} /> Assign
                            </button>
                          )}
                        </td>
                        <td style={{ padding:'12px 14px', whiteSpace:'nowrap' }}>
                          <span style={{ fontWeight:600 }}>{b.duration}min</span>
                        </td>
                        <td style={{ padding:'12px 14px', whiteSpace:'nowrap', color:'var(--text-secondary)' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                            <Calendar size={12} /> {b.date}
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
                            <Clock size={12} /> {fmt12(b.time)}
                          </div>
                        </td>
                        <td style={{ padding:'12px 14px', color:'#10b981', fontWeight:800 }}>₹{b.price}</td>
                        <td style={{ padding:'12px 14px' }}><MentoringStatusBadge status={b.status} /></td>
                        <td style={{ padding:'12px 14px' }}>
                          <div style={{ display:'flex', gap:6, flexWrap:'nowrap' }}>
                            {b.tutor && (
                              <button onClick={() => setAssignModal(b._id)} title="Reassign tutor" style={{ padding:'5px 8px', borderRadius:7, border:'1px solid var(--border)', background:'transparent', color:'#6366f1', cursor:'pointer', display:'flex', alignItems:'center' }}>
                                <UserCheck size={13} />
                              </button>
                            )}
                            {!['cancelled','rejected','completed'].includes(b.status) && (
                              <button onClick={() => setConfirmCancel(b._id)} title="Cancel booking" style={{ padding:'5px 8px', borderRadius:7, border:'1px solid rgba(239,68,68,.3)', background:'rgba(239,68,68,.08)', color:'#ef4444', cursor:'pointer', display:'flex', alignItems:'center' }}>
                                <XCircle size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} pages={Math.ceil(total / 15)} onPage={(p) => { setPage(p); loadBookings(p, statusFilter); }} />
            </div>
          )}
        </div>
      )}

      {/* ── REVENUE sub-tab ── */}
      {subTab === 'revenue' && (
        <div>
          {revLoading ? (
            <div style={{ textAlign:'center', padding:60, color:'var(--text-secondary)' }}>Loading revenue data...</div>
          ) : revenue ? (
            <div>
              {/* Summary cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:28 }}>
                {[
                  { icon: DollarSign, label: 'Total Revenue', value: `₹${revenue.total?.toLocaleString('en-IN') || 0}`, color: '#10b981' },
                  { icon: CheckCircle, label: 'Completed Sessions', value: revenue.completed, color: '#8b5cf6' },
                  { icon: Clock, label: 'Pending Sessions', value: revenue.pending, color: '#f59e0b' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <StatCard key={label} icon={Icon} label={label} value={value} color={color} />
                ))}
              </div>

              {/* By package breakdown */}
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:24, marginBottom:20 }}>
                <div style={{ fontWeight:700, fontSize:16, marginBottom:20 }}>📦 Revenue by Package</div>
                {revenue.byPackage && revenue.byPackage.length > 0 ? (
                  <div style={{ display:'grid', gap:12 }}>
                    {revenue.byPackage.map(pkg => {
                      const pkgInfo = revenue.packages?.[pkg._id];
                      const label = pkgInfo?.label || pkg._id;
                      const pct = revenue.total > 0 ? Math.round((pkg.revenue / revenue.total) * 100) : 0;
                      return (
                        <div key={pkg._id}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                            <span style={{ fontSize:14, fontWeight:600 }}>{label}</span>
                            <span style={{ fontSize:14, color:'#10b981', fontWeight:800 }}>₹{pkg.revenue?.toLocaleString('en-IN')} ({pkg.count} sessions)</span>
                          </div>
                          <div style={{ height:8, background:'rgba(255,255,255,.05)', borderRadius:4, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius:4, transition:'width .5s' }} />
                          </div>
                          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>{pct}% of total revenue</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState icon={TrendingUp} title="No revenue yet" subtitle="Revenue data will appear once sessions are completed" />
                )}
              </div>

              <button onClick={loadRevenue} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', borderRadius:9, border:'1px solid var(--border)', background:'transparent', color:'var(--text-secondary)', cursor:'pointer', fontSize:13 }}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          ) : (
            <EmptyState icon={TrendingUp} title="No revenue data" subtitle="Click refresh to load" />
          )}
        </div>
      )}

      {/* ── PRICING sub-tab ── */}
      {subTab === 'pricing' && (
        <div style={{ maxWidth:500 }}>
          <div style={{ background:'rgba(99,102,241,.08)', border:'1px solid rgba(99,102,241,.2)', borderRadius:12, padding:'14px 18px', marginBottom:28, fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>
            ⚠️ <strong style={{ color:'var(--text-primary)' }}>Note:</strong> Pricing changes apply for the current server session only. To make them permanent, update the <code>MENTORING_PRICE_*</code> environment variables in <code>server/.env</code>.
          </div>

          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:28, display:'grid', gap:20 }}>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:4 }}>⚙️ Session Prices (₹)</div>

            {[
              { key:'price30', label:'30 Minutes', emoji:'⚡', desc:'Quick doubt-clearing session' },
              { key:'price1hr', label:'1 Hour', emoji:'🎯', desc:'Deep-dive on any topic' },
              { key:'price2hr', label:'2 Hours', emoji:'🚀', desc:'Comprehensive mentoring session' },
            ].map(({ key, label, emoji, desc }) => (
              <div key={key} style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:12, alignItems:'center', padding:'16px 20px', background:'rgba(255,255,255,.03)', border:'1px solid var(--border)', borderRadius:12 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:2 }}>{emoji} {label}</div>
                  <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{desc}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ color:'var(--text-secondary)', fontSize:18, fontWeight:700 }}>₹</span>
                  <input
                    type="number"
                    min={1}
                    value={pricing[key]}
                    onChange={e => setPricing(p => ({ ...p, [key]: Number(e.target.value) }))}
                    style={{ width:90, padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-dark)', color:'var(--text-primary)', fontSize:16, fontWeight:700, textAlign:'right' }}
                  />
                </div>
              </div>
            ))}

            <button onClick={handleSavePricing} disabled={pricingSaving} style={{ padding:'12px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', cursor:pricingSaving ? 'wait' : 'pointer', fontWeight:700, fontSize:15, boxShadow:'0 4px 16px rgba(99,102,241,.35)', opacity:pricingSaving ? 0.7 : 1 }}>
              {pricingSaving ? 'Saving...' : '💾 Save Pricing'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MAIN ADMIN PANEL ─────────────────────────────────────────────────────────
const AdminPanel = () => {

  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentCourses, setRecentCourses] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then(res => {
        setStats(res.data.stats);
        setRecentUsers(res.data.recentUsers || []);
        setRecentCourses(res.data.recentCourses || []);
      })
      .catch(() => toast.error('Failed to load dashboard stats'))
      .finally(() => setStatsLoading(false));
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#6366f1' },
    { id: 'users', label: 'Users', icon: Users, color: '#6366f1' },
    { id: 'courses', label: 'Courses', icon: BookOpen, color: '#8b5cf6' },
    { id: 'projects', label: 'Projects', icon: Cpu, color: '#10b981' },
    { id: 'mentoring', label: '1-on-1 Mentoring', icon: Video, color: '#ec4899' },
    { id: 'uploads', label: 'Uploads', icon: Upload, color: '#f59e0b' },
  ];

  const tabTitles = {
    dashboard: 'Platform Overview',
    users: 'User Management',
    courses: 'Course Management',
    projects: 'Project Management',
    mentoring: '1-on-1 Mentoring Management',
    uploads: 'File Uploads',
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)', background: 'var(--bg-dark)' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 240 : 64, flexShrink: 0, background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)', transition: 'width .25s cubic-bezier(.4,0,.2,1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        position: 'sticky', top: 70, height: 'calc(100vh - 70px)',
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          {sidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shield size={18} color="#fff" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Admin Panel</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              </div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, flexShrink: 0 }}>
            <Menu size={20} />
          </button>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(item => {
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                title={!sidebarOpen ? item.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, border: 'none',
                  background: active ? `${item.color}22` : 'transparent', color: active ? item.color : 'var(--text-secondary)',
                  cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all .2s', fontWeight: active ? 700 : 400, fontSize: 14,
                  whiteSpace: 'nowrap', overflow: 'hidden',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
              >
                <item.icon size={18} style={{ flexShrink: 0 }} />
                {sidebarOpen && item.label}
              </button>
            );
          })}
        </nav>

        {/* User Info at Bottom */}
        {sidebarOpen && (
          <div style={{ padding: '16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={user?.avatar || avatarUrl(user?.name)} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: '#10b981' }}>Administrator</div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, minWidth: 0, padding: '32px 28px', overflowY: 'auto' }}>
        {/* Page Header */}
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {tabTitles[activeTab]}
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
              {activeTab === 'dashboard' && 'Overview of your platform activity'}
              {activeTab === 'users' && 'Manage students, tutors, and administrators'}
              {activeTab === 'courses' && 'Create and manage courses with full curriculum builder'}
              {activeTab === 'projects' && 'Create and manage hands-on projects'}
              {activeTab === 'mentoring' && 'View all bookings, revenue breakdown, assign tutors, and configure pricing'}
              {activeTab === 'uploads' && 'Upload images, PPTs, and PDF files to Cloudinary'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={user?.avatar || avatarUrl(user?.name)} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #6366f1' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>Admin</div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'dashboard' && <DashboardTab stats={stats} recentUsers={recentUsers} recentCourses={recentCourses} loading={statsLoading} />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'courses' && <CoursesTab />}
          {activeTab === 'projects' && <ProjectsTab />}
          {activeTab === 'mentoring' && <MentoringTab />}
          {activeTab === 'uploads' && <UploadsTab />}
        </div>
      </main>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AdminPanel;
