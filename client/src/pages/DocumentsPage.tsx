import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DocumentTextIcon as FileText, PlusIcon as Plus, MagnifyingGlassIcon as Search, TrashIcon as Trash2, FolderIcon as FolderKanban, SparklesIcon as Sparkles, PencilSquareIcon as NotebookPen } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getDocuments, createDocument, deleteDocument, getProjects } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';

const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedDocType, setSelectedDocType] = useState('note');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [tagInput, setTagInput] = useState('');
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetchDocuments();
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const fetchDocuments = async () => {
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, 'Failed to load documents'));
    } finally {
      setLoading(false);
    }
  };

  const templates = useMemo(
    () => ({
      meeting: {
        id: 'meeting',
        label: 'Meeting Notes',
        docType: 'meeting',
        placeholderTitle: 'Team Sync – Week ##',
        tags: ['meeting', 'notes'],
        content: `## 📅 Meeting Details
- Date:
- Attendees:

## 📝 Agenda
- Topic 1
- Topic 2

## ✅ Decisions
- 

## 📌 Action Items
- [ ] Owner – Description (due …)

## 💬 Notes
- 
`,
      },
      decision: {
        id: 'decision',
        label: 'Decision Log',
        docType: 'decision',
        placeholderTitle: 'Decision: Short Description',
        tags: ['decision'],
        content: `## 🎯 Context
- 

## 🤔 Options Considered
- Option A – Pros / Cons
- Option B – Pros / Cons

## ✅ Decision
- 

## 🚀 Next Steps
- [ ] Owner – Description (due …)

## 📚 References
- 
`,
      },
      spec: {
        id: 'spec',
        label: 'Project Brief',
        docType: 'spec',
        placeholderTitle: 'Project: Short Name',
        tags: ['spec', 'project'],
        content: `## 🧭 Overview
- Goal:
- Success metrics:

## 👥 Stakeholders
- Owner:
- Collaborators:

## 📌 Requirements
- 

## 🧱 Constraints & Risks
- 

## 🔄 Milestones
- Milestone / Target date

## ❓Open Questions
- 
`,
      },
    }),
    []
  );

  const resetForm = () => {
    setNewDocTitle('');
    setNewDocContent('');
    setSelectedProject('');
    setSelectedDocType('note');
    setSelectedTemplate('');
    setTagInput('');
  };

  const applyTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates[templateId as keyof typeof templates];
    if (!template) return;
    setSelectedDocType(template.docType);
    setNewDocTitle(template.placeholderTitle);
    setNewDocContent(template.content);
    setTagInput(template.tags.join(', '));
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newDoc = await createDocument({ 
        title: newDocTitle, 
        content: newDocContent,
        project: selectedProject || undefined,
        docType: selectedDocType,
        tags: tagInput
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      setDocuments([newDoc, ...documents]);
      setShowCreateModal(false);
      resetForm();
      toast.success('Document created!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create document'));
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await deleteDocument(id);
      setDocuments(documents.filter(doc => doc._id !== id));
      toast.success('Document deleted');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete document'));
    }
  };

  const stats = useMemo(() => {
    const total = documents.length;
    const linkedToProjects = documents.filter((doc) => !!doc.project).length;
    const personal = total - linkedToProjects;
    const latestTimestamp = documents.reduce((latest, doc) => {
      const updatedAt = new Date(doc.updatedAt || doc.createdAt).getTime();
      return updatedAt > latest ? updatedAt : latest;
    }, 0);
    const lastUpdatedLabel = latestTimestamp
      ? new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }).format(new Date(latestTimestamp))
      : '—';

    return { total, linkedToProjects, personal, lastUpdatedLabel };
  }, [documents]);

  const filteredDocuments = useMemo(
    () =>
      documents.filter((doc) => {
        const query = searchQuery.toLowerCase();
        return (
          doc.title.toLowerCase().includes(query) ||
          (doc.tags || []).some((tag: string) => tag.toLowerCase().includes(query)) ||
          (doc.docType || '').toLowerCase().includes(query)
        );
      }),
    [documents, searchQuery]
  );

  const stripHtml = (content: string) =>
    content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  const getPreviewText = (content?: string) => {
    if (!content) return 'Empty document';
    const text = stripHtml(content);
    return text.length > 160 ? `${text.slice(0, 160)}…` : text || 'Empty document';
  };

  const getDocTypeLabel = (doc: any) => {
    switch (doc.docType) {
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
  };

  if (loading) {
    return <LoadingState label="Loading documents..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Documents"
        subtitle="Capture knowledge, meeting notes, and specs alongside projects."
        actions={
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-[18px] h-[18px]" />
            New document
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Workspace documents"
          value={stats.total}
          icon={FileText}
          tone="blue"
          description="Knowledge you can reference anytime."
        />
        <StatCard
          title="Linked to projects"
          value={stats.linkedToProjects}
          icon={FolderKanban}
          tone="purple"
          description="Docs tied to delivery in motion."
        />
        <StatCard
          title="Last updated"
          value={stats.lastUpdatedLabel}
          tone="amber"
          description="Keep content fresh and aligned."
        />
      </div>

      <div className="rounded-2xl border border-neutral-300 bg-white p-5 shadow-soft">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-[18px] h-[18px]" />
          <input
            type="text"
            placeholder="Search documents by title..."
            className="input-field w-full rounded-xl border-2 border-neutral-200 bg-neutral-100 pl-12 pr-4 text-14 focus:bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={searchQuery ? 'No documents match your search' : 'No documents yet'}
          description={
            searchQuery
              ? 'Try adjusting your search keywords or clear the filter to browse everything.'
              : 'Document sprint notes, decisions, or onboarding guides to share context.'
          }
          action={
            searchQuery ? (
              <button type="button" className="btn-secondary" onClick={() => setSearchQuery('')}>
                Clear search
              </button>
            ) : (
              <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
                <Plus className="w-[18px] h-[18px]" />
                Create document
              </button>
            )
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredDocuments.map((doc) => {
            const linkedProject =
              typeof doc.project === 'string'
                ? projects.find((project) => project.id === doc.project)
                : doc.project;
            return (
              <div
                key={doc.id}
                className="group relative flex h-full flex-col justify-between rounded-3xl border border-neutral-300 bg-white/90 p-6 shadow-jira transition hover:-translate-y-1 hover:shadow-jira-hover"
              >
                <Link to={`/documents/${doc.id}`} className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-status-purple/10 text-status-purple">
                        <FileText className="w-[22px] h-[22px]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-1000">{doc.title}</h3>
                        <p className="text-12 text-neutral-600">
                          Updated {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString()}
                        </p>
                        <p className="mt-1 text-11 font-semibold text-neutral-700">
                          {getDocTypeLabel(doc)}
                        </p>
                        {doc.summary && (
                          <p className="mt-1 text-12 text-neutral-600 line-clamp-2">
                            {doc.summary}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 flex-1 text-13 text-neutral-700 line-clamp-4">
                    {getPreviewText(doc.content)}
                  </p>
                </Link>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="pill bg-neutral-200 text-neutral-700">
                      {linkedProject?.name || 'Personal'}
                    </span>
                    {(doc.tags || []).map((tag: string) => (
                      <span key={tag} className="pill bg-neutral-200 text-neutral-700">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteDocument(doc.id);
                    }}
                    className="rounded-xl border border-red-200 px-3 py-1 text-12 font-semibold text-status-red opacity-0 transition group-hover:opacity-100 hover:bg-red-50"
                  >
                    <Trash2 className="w-[14px] h-[14px]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-neutral-200 px-6 py-5">
              <h2 className="text-24 font-semibold text-neutral-1000">Create document</h2>
              <p className="mt-1 text-12 text-neutral-600">
                Draft meetings notes, plan specs, or capture decisions for your team.
              </p>
            </div>
            <form onSubmit={handleCreateDocument} className="space-y-5 px-6 py-6">
              <div>
                <p className="text-12 font-semibold uppercase tracking-wide text-neutral-700 mb-2 flex items-center gap-2">
                  <Sparkles className="w-[14px] h-[14px]" /> Start from template
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {Object.values(templates).map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => applyTemplate(template.id)}
                      className={`rounded-xl border px-3 py-3 text-left transition hover:border-jira-300 hover:bg-jira-50 ${
                        selectedTemplate === template.id
                          ? 'border-jira-400 bg-jira-50'
                          : 'border-neutral-300 bg-white'
                      }`}
                    >
                      <p className="text-13 font-semibold text-neutral-900 flex items-center gap-2">
                        <NotebookPen className="w-[14px] h-[14px]" />
                        {template.label}
                      </p>
                      <p className="mt-1 text-11 text-neutral-600">{template.tags.join(', ')}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="title" className="mb-2 block text-12 font-semibold uppercase tracking-wide text-neutral-700">
                  Document title
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  className="input-field rounded-xl border-2 border-neutral-300 bg-neutral-100 focus:bg-white"
                  placeholder="Standup notes – Week 32"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="doc-type" className="mb-2 block text-12 font-semibold uppercase tracking-wide text-neutral-700">
                  Document type
                </label>
                <select
                  id="doc-type"
                  className="input-field rounded-xl border-2 border-neutral-300 bg-neutral-100 focus:bg-white"
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                >
                  <option value="note">General note</option>
                  <option value="meeting">Meeting notes</option>
                  <option value="decision">Decision log</option>
                  <option value="spec">Project brief</option>
                  <option value="retro">Retro</option>
                  <option value="research">Research</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label htmlFor="project" className="mb-2 block text-12 font-semibold uppercase tracking-wide text-neutral-700">
                  Project (optional)
                </label>
                <select
                  id="project"
                  className="input-field rounded-xl border-2 border-neutral-300 bg-neutral-100 focus:bg-white"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                >
                  <option value="">Personal document</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                      {project.organization?.name ? ` • ${project.organization.name}` : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-11 text-neutral-600">
                  Select a project to share this document with collaborators automatically.
                </p>
              </div>
              <div>
                <label htmlFor="doc-tags" className="mb-2 block text-12 font-semibold uppercase tracking-wide text-neutral-700">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  id="doc-tags"
                  className="input-field rounded-xl border-2 border-neutral-300 bg-neutral-100 focus:bg-white"
                  placeholder="meeting, decisions"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-12 font-semibold uppercase tracking-wide text-neutral-700">
                  Quick outline (optional)
                </label>
                <textarea
                  className="input-field min-h-[160px] rounded-xl border-2 border-neutral-300 bg-neutral-100 py-3 focus:bg-white"
                  placeholder="Add context or leave blank to start fresh in the editor."
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                />
                {selectedTemplate && (
                  <p className="mt-1 text-11 text-neutral-600">
                    Template content is preloaded – edit or add context before creating the document.
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
