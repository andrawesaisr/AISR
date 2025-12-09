import React, { useState } from 'react';
import { XMarkIcon, SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { generateTasks, createTask } from '../services/api';
import { getErrorMessage } from '../utils/errors';

interface TaskSuggestion {
  title: string;
  description?: string;
  priority: string;
  type: string;
  estimatedHours?: number;
  tags?: string[];
}

interface AITaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onTasksCreated: () => void;
}

const AITaskDrawer: React.FC<AITaskDrawerProps> = ({
  isOpen,
  onClose,
  projectId,
  onTasksCreated,
}) => {
  const [description, setDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error('Please describe what you need to accomplish');
      return;
    }

    setGenerating(true);
    try {
      const response = await generateTasks({ description, projectId });
      setSuggestions(response.tasks || []);

      setSelectedTasks(new Set(response.tasks.map((_: any, i: number) => i)));

      toast.success(`Generated ${response.tasks.length} task suggestions!`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to generate tasks'));
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTask = (index: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTasks(newSelected);
  };

  const handleAddSelected = async () => {
    if (selectedTasks.size === 0) {
      toast.error('Please select at least one task');
      return;
    }

    setCreating(true);
    try {
      const tasksToCreate = Array.from(selectedTasks).map(i => suggestions[i]);

      await Promise.all(
        tasksToCreate.map(task =>
          createTask({
            title: task.title,
            description: task.description || '',
            project: projectId,
            priority: task.priority,
            status: 'To Do',
          })
        )
      );

      toast.success(`Created ${selectedTasks.size} tasks!`);

      setDescription('');
      setSuggestions([]);
      setSelectedTasks(new Set());

      onTasksCreated();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create tasks'));
    } finally {
      setCreating(false);
    }
  };

  const handleReset = () => {
    setSuggestions([]);
    setSelectedTasks(new Set());
    setDescription('');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-status-red bg-red-50';
      case 'HIGH':
        return 'text-status-yellow bg-yellow-50';
      case 'MEDIUM':
        return 'text-status-blue bg-blue-50';
      case 'LOW':
        return 'text-status-gray bg-neutral-100';
      default:
        return 'text-status-gray bg-neutral-100';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'STORY':
        return 'bg-green-50 text-green-700';
      case 'BUG':
        return 'bg-red-50 text-red-700';
      case 'EPIC':
        return 'bg-purple-50 text-purple-700';
      default:
        return 'bg-blue-50 text-blue-700';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-neutral-1000 bg-opacity-30 z-40 animate-fade-in"
        onClick={onClose}
      />

      <div
        className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] bg-white dark:bg-neutral-950 shadow-2xl z-50 flex flex-col animate-slide-in-right overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-neutral-300 px-6 py-5 dark:border-neutral-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-24 font-semibold text-neutral-1000 dark:text-neutral-0 flex items-center gap-2">
                <SparklesIcon className="h-6 w-6 text-jira-500" />
                AI Task Assistant
              </h2>
              <p className="mt-1 text-12 text-neutral-600 dark:text-neutral-400">
                Describe what you need and I'll break it down into actionable tasks
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-6">
          {/* Input Section */}
          <div className="space-y-3">
            <label className="block text-12 font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">
              What do you need to accomplish?
            </label>
            <textarea
              className="input-field min-h-[160px] rounded-xl border-2 border-neutral-300 bg-neutral-100 py-3 focus:bg-white dark:bg-neutral-900 dark:border-neutral-700"
              placeholder="Example: We need to build a user authentication system with email/password login, password reset, and session management."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={generating || creating}
            />
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={generating || creating || !description.trim()}
                className="btn-primary flex items-center gap-2"
              >
                <SparklesIcon className="h-4 w-4" />
                {generating ? 'Generating...' : 'Generate Tasks'}
              </button>
              {suggestions.length > 0 && (
                <button
                  onClick={handleReset}
                  disabled={generating || creating}
                  className="btn-secondary"
                >
                  Start Over
                </button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {generating && (
            <div className="rounded-2xl border border-neutral-300 bg-neutral-50 p-8 text-center dark:bg-neutral-900 dark:border-neutral-800">
              <div className="inline-flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-jira-500 border-t-transparent" />
                <span className="text-14 font-medium">AI is analyzing your request...</span>
              </div>
            </div>
          )}

          {/* Results Section */}
          {suggestions.length > 0 && !generating && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-14 font-semibold text-neutral-900 dark:text-neutral-100">
                  Suggested Tasks ({suggestions.length})
                </h3>
                <button
                  onClick={() => {
                    if (selectedTasks.size === suggestions.length) {
                      setSelectedTasks(new Set());
                    } else {
                      setSelectedTasks(new Set(suggestions.map((_, i) => i)));
                    }
                  }}
                  className="text-12 text-jira-500 hover:text-jira-600 font-medium"
                >
                  {selectedTasks.size === suggestions.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-3">
                {suggestions.map((task, index) => (
                  <div
                    key={index}
                    className={`rounded-2xl border-2 p-4 transition cursor-pointer ${
                      selectedTasks.has(index)
                        ? 'border-jira-400 bg-jira-50 dark:bg-jira-950 dark:border-jira-600'
                        : 'border-neutral-300 bg-white hover:border-neutral-400 dark:bg-neutral-900 dark:border-neutral-700'
                    }`}
                    onClick={() => handleToggleTask(index)}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(index)}
                        onChange={() => handleToggleTask(index)}
                        className="mt-1 h-4 w-4 rounded border-neutral-300 text-jira-500 focus:ring-jira-500"
                      />
                      <div className="flex-1 space-y-2">
                        <h4 className="text-14 font-semibold text-neutral-1000 dark:text-neutral-0">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-12 text-neutral-700 dark:text-neutral-300">
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-1 rounded text-11 font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-1 rounded text-11 font-medium ${getTypeColor(task.type)}`}>
                            {task.type}
                          </span>
                          {task.estimatedHours && (
                            <span className="px-2 py-1 rounded bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 text-11 font-medium">
                              {task.estimatedHours}h
                            </span>
                          )}
                          {task.tags?.map((tag, i) => (
                            <span key={i} className="px-2 py-1 rounded bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 text-11 font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {suggestions.length === 0 && !generating && (
            <div className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
              <SparklesIcon className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600" />
              <p className="mt-3 text-14 text-neutral-600 dark:text-neutral-400">
                Describe your project needs above and I'll generate actionable tasks for you
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {suggestions.length > 0 && (
          <div className="flex-shrink-0 border-t border-neutral-300 bg-neutral-50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="space-y-3">
              <span className="block text-12 text-neutral-600 dark:text-neutral-400">
                {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="btn-secondary flex-1"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSelected}
                  disabled={creating || selectedTasks.size === 0}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  {creating ? 'Adding...' : `Add ${selectedTasks.size} Task${selectedTasks.size !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AITaskDrawer;
