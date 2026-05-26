"use client";

import { useMemo, useState } from "react";
import type { Task } from "@/lib/pomoTypes";
import { formatMinutes } from "@/lib/pomoUtils";

type SessionsStats = { sessions: number; focusMinutes: number };

export function TaskListPanel({
  tasks,
  activeTaskId,
  sessionsByTaskId,
  onActiveTaskIdChange,
  onTasksChange,
}: {
  tasks: Task[];
  activeTaskId: string | null;
  sessionsByTaskId: Map<string, SessionsStats>;
  onActiveTaskIdChange: (id: string | null) => void;
  onTasksChange: (updater: (prev: Task[]) => Task[]) => void;
  sessionsHydrated?: boolean;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [tasks]);

  const activeTaskTitle = useMemo(() => {
    const t = tasks.find((x) => x.id === activeTaskId);
    return t?.title ?? null;
  }, [activeTaskId, tasks]);

  const handleCreate = () => {
    const title = newTitle.trim();
    if (!title) return;
    onTasksChange((prev) => [
      ...prev,
      {
        id: `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        title,
        description: newDescription.trim(),
        archived: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    setNewTitle("");
    setNewDescription("");
  };

  const beginEdit = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const title = editTitle.trim();
    if (!title) return;
    onTasksChange((prev) =>
      prev.map((t) =>
        t.id === editingId
          ? { ...t, title, description: editDescription.trim() }
          : t
      )
    );
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const archiveTask = (taskId: string) => {
    onTasksChange((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, archived: true } : t))
    );
    if (activeTaskId === taskId) onActiveTaskIdChange(null);
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-zinc-100">Tasks</div>
          <div className="mt-1 text-xs text-zinc-400">
            {sortedTasks.length} active task{sortedTasks.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2">
          <div className="text-[11px] uppercase tracking-wider text-zinc-500">Active</div>
          <div className="mt-1 line-clamp-1 text-sm font-medium text-zinc-100">
            {activeTaskTitle ?? "None"}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/20 p-3">
          <div className="flex flex-col gap-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="New task title"
              className="w-full rounded-lg bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none ring-1 ring-inset ring-zinc-800 focus:ring-zinc-600"
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Optional description"
              className="min-h-[44px] resize-none w-full rounded-lg bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none ring-1 ring-inset ring-zinc-800 focus:ring-zinc-600"
            />
            <button
              onClick={handleCreate}
              className="rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-400 disabled:opacity-40"
              disabled={!newTitle.trim()}
            >
              Add task
            </button>
          </div>
        </div>

        {sortedTasks.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/20 px-3 py-6 text-center text-sm text-zinc-400">
            Add a task to start your next focus session.
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {sortedTasks.map((task) => {
              const stats = sessionsByTaskId.get(task.id) ?? {
                sessions: 0,
                focusMinutes: 0,
              };
              const isActive = task.id === activeTaskId;
              const isEditing = editingId === task.id;

              return (
                <div
                  key={task.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/20 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full rounded-lg bg-zinc-950/50 px-3 py-2 text-sm text-zinc-100 ring-1 ring-inset ring-zinc-800 outline-none focus:ring-zinc-600"
                          />
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="min-h-[42px] resize-none w-full rounded-lg bg-zinc-950/50 px-3 py-2 text-sm text-zinc-100 ring-1 ring-inset ring-zinc-800 outline-none focus:ring-zinc-600"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={saveEdit}
                              className="rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-900"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                onActiveTaskIdChange(
                                  isActive ? null : task.id
                                )
                              }
                              className={`h-8 w-8 rounded-lg border text-xs font-bold transition-colors ${
                                isActive
                                  ? "border-indigo-500 bg-indigo-500/20 text-indigo-200"
                                  : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:bg-zinc-900"
                              }`}
                              title="Set active task"
                            >
                              {isActive ? "A" : "•"}
                            </button>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-zinc-100">
                                {task.title}
                              </div>
                              {task.description ? (
                                <div className="mt-1 line-clamp-2 text-xs text-zinc-400">
                                  {task.description}
                                </div>
                              ) : null}
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                            <span>
                              {stats.sessions} session
                              {stats.sessions === 1 ? "" : "s"} (7d)
                            </span>
                            <span className="text-zinc-600">•</span>
                            <span>{formatMinutes(stats.focusMinutes)}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {!isEditing ? (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => beginEdit(task)}
                          className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => archiveTask(task.id)}
                          className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-900"
                        >
                          Archive
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

