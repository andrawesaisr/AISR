import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowDownOnSquareIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { getDocument, updateDocument } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const DocumentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [docType, setDocType] = useState('note');
  const [tagInput, setTagInput] = useState('');
  const [summary, setSummary] = useState('');
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
      setDocType(data.docType || 'note');
      setSummary(data.summary || '');
      setTagInput((data.tags || []).join(', '));
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, 'Failed to load document'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDocument(id!, {
        title,
        content,
        docType,
        summary,
        tags: tagInput
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      toast.success('Document saved!');
      setDocument((prev: any) =>
        prev
          ? {
              ...prev,
              title,
              content,
              docType,
              summary,
              tags: tagInput
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean),
            }
          : prev
      );
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save document'));
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

  const cleanContent = content || '';

  const docTypeLabel = useMemo(() => {
    switch (docType) {
      case 'meeting':
        return 'Meeting Notes';
      case 'decision':
        return 'Decision Log';
      case 'spec':
        return 'Project Brief';
      case 'retro':
        return 'Retrospective';
      case 'research':
        return 'Research';
      default:
        return 'Note';
    }
  }, [docType]);

  const actionItems = useMemo(() => {
    if (typeof window === 'undefined' || !cleanContent) return [] as string[];
    const parser = new window.DOMParser();
    const doc = parser.parseFromString(cleanContent, 'text/html');
    const items: string[] = [];
    doc.querySelectorAll('li').forEach((li) => {
      const text = li.textContent?.trim();
      if (!text) return;
      const normalized = text.replace(/^\[[^\]]*\]\s*/i, '').trim();
      if (/^\[\s?\]/.test(text) || /todo|action/i.test(text)) {
        items.push(normalized || text.trim());
      }
    });
    return items.slice(0, 10);
  }, [cleanContent]);

  const currentTags = useMemo(
    () =>
      tagInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tagInput]
  );

  if (loading) {
    return <LoadingState label="Loading document..." />;
  }

  if (!document) {
    return (
      <EmptyState
        icon={DocumentTextIcon}
        title="Document not found"
        description="This document might have been removed or you may not have access."
        action={
          <button onClick={() => navigate('/documents')} className="btn-primary flex items-center gap-2">
            <ArrowLeftIcon className="h-4 w-4" />
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
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={title || 'Untitled document'}
        subtitle={summary || 'Draft, align, and share knowledge without leaving the workspace.'}
        actions={
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2 text-14 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowDownOnSquareIcon className="h-5 w-5" />
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        }
      >
        <div className="flex flex-wrap items-center gap-2 text-11 text-neutral-600">
          <button
            onClick={() => navigate('/documents')}
            className="btn-ghost flex items-center gap-2 text-11 font-semibold uppercase tracking-wide"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            Back to documents
          </button>
          <span className="pill bg-neutral-200 text-neutral-700">{docTypeLabel}</span>
          <span className="pill bg-neutral-200 text-neutral-700">{projectLabel}</span>
          <span className="pill bg-neutral-200 text-neutral-700">Updated {updatedLabel}</span>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
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

        <aside className="space-y-4">
          <div className="rounded-2xl border border-neutral-300 bg-white p-5 shadow-soft space-y-4">
            <h3 className="text-14 font-semibold text-neutral-900">Document summary</h3>
            <textarea
              className="input-field min-h-[120px] rounded-xl border-2 border-neutral-300 bg-neutral-100 py-3 focus:bg-white"
              placeholder="Capture the key decisions or context for quick scanning."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
            <div>
              <label className="text-12 font-semibold uppercase tracking-wide text-neutral-700">Document type</label>
              <select
                className="mt-2 input-field rounded-xl border-2 border-neutral-300 bg-neutral-100 focus:bg-white"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                <option value="note">General note</option>
                <option value="meeting">Meeting notes</option>
                <option value="decision">Decision log</option>
                <option value="spec">Project brief</option>
                <option value="retro">Retrospective</option>
                <option value="research">Research</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="text-12 font-semibold uppercase tracking-wide text-neutral-700">Tags</label>
              <input
                type="text"
                className="mt-2 input-field rounded-xl border-2 border-neutral-300 bg-neutral-100 focus:bg-white"
                placeholder="meeting, decisions"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
              />
              <p className="mt-1 text-11 text-neutral-600">Comma separated</p>
              {currentTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {currentTags.map((tag) => (
                    <span key={tag} className="pill bg-neutral-200 text-neutral-700">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-12 font-semibold uppercase tracking-wide text-neutral-700">Action items</label>
              {actionItems.length > 0 ? (
                <ul className="mt-2 space-y-1 text-12 text-neutral-700">
                  {actionItems.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 rounded-lg bg-neutral-100 px-2 py-1">
                      <span className="mt-0.5 text-jira-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-12 text-neutral-600">No open action items detected.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DocumentPage;
