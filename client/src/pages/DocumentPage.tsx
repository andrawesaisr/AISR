import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { getDocument, updateDocument } from '../services/api';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const DocumentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDocument();
    }
  }, [id]);

  const fetchDocument = async () => {
    try {
      const data = await getDocument(id!);
      setDocument(data);
      setTitle(data.title);
      setContent(data.content || '');
    } catch (err) {
      console.error(err);
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDocument(id!, { title, content });
      toast.success('Document saved!');
    } catch (err) {
      toast.error('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  if (loading) {
    return <LoadingState label="Loading document..." />;
  }

  if (!document) {
    return (
      <EmptyState
        icon={FileText}
        title="Document not found"
        description="This document might have been removed or you may not have access."
        action={
          <button onClick={() => navigate('/documents')} className="btn-primary flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to documents
          </button>
        }
      />
    );
  }

  const projectLabel =
    document.project && typeof document.project === 'object'
      ? document.project.name
      : document.project
      ? 'Linked project'
      : 'Personal document';

  const updatedLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(document.updatedAt || document.createdAt));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title={title || 'Untitled document'}
        subtitle="Draft, align, and share knowledge without leaving the workspace."
        actions={
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2 text-14 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        }
      >
        <div className="flex flex-wrap items-center gap-2 text-11 text-neutral-600">
          <button
            onClick={() => navigate('/documents')}
            className="btn-ghost flex items-center gap-2 text-11 font-semibold uppercase tracking-wide"
          >
            <ArrowLeft size={14} />
            Back to documents
          </button>
          <span className="pill bg-neutral-200 text-neutral-700">{projectLabel}</span>
          <span className="pill bg-neutral-200 text-neutral-700">Updated {updatedLabel}</span>
        </div>
      </PageHeader>

      <div className="rounded-3xl border border-neutral-300 bg-white shadow-soft">
        <div className="border-b border-neutral-200 px-6 py-5">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-none bg-transparent text-3xl font-semibold text-neutral-1000 outline-none placeholder-neutral-500"
            placeholder="Untitled document"
          />
        </div>
        <div className="px-2 pb-6">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            className="min-h-[520px]"
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentPage;
