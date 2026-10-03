import Auth from './components/Auth';
import { useAuth } from './context/AuthContext';
import { useEffect, useRef, useState } from 'react';
import { supabase } from './lib/supabase';
import './App.css';

const taskColumns =
  'id, title, priority, completed, created_at, completed_at';

const priorityOrder = {
  High: 1,
  Medium: 2,
  Low: 3,
};

function Icon({ name, size = 16 }) {
  const iconShapes = {
    brand: (
      <>
        <path d="M4 5.5h2.5M10 5.5h10M4 12h2.5M10 12h10M4 18.5h2.5M10 18.5h10" />
        <path d="m5 4.5 1 1 2-2M5 11l1 1 2-2M5 17.5l1 1 2-2" />
      </>
    ),
    add: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    complete: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16.5 9" />
      </>
    ),
    delete: (
      <>
        <path d="M4 7h16M10 11v6M14 11v6" />
        <path d="m6 7 1 13h10l1-13M9 7V4h6v3" />
      </>
    ),
    clear: (
      <>
        <path d="M4 7h16M10 11v6M14 11v6" />
        <path d="m6 7 1 13h10l1-13M9 7V4h6v3" />
        <path d="M18.5 3.5 21 6" />
      </>
    ),
    history: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
    unfinished: (
      <>
        <path d="M8 4H6a2 2 0 0 0-2 2v14h16V6a2 2 0 0 0-2-2h-2" />
        <path d="M9 4h6v3H9zM8 12h8M8 16h5" />
      </>
    ),
    historyEmpty: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2M8.5 3.8 7 2.5M15.5 3.8 17 2.5" />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4 4" />
      </>
    ),
    priorityHigh: (
      <>
        <path d="M12 19V5" />
        <path d="m6 11 6-6 6 6" />
      </>
    ),
    priorityMedium: <path d="M5 12h14" />,
    priorityLow: (
      <>
        <path d="M12 5v14" />
        <path d="m6 13 6 6 6-6" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconShapes[name]}
    </svg>
  );
}

function PriorityBadge({ priority }) {
  const iconName = {
    High: 'priorityHigh',
    Medium: 'priorityMedium',
    Low: 'priorityLow',
  }[priority];

  return (
    <span className={`priority-badge priority-${priority.toLowerCase()}`}>
      <Icon name={iconName} size={12} />
      {priority}
    </span>
  );
}

function mapTask(row) {
  return {
    id: row.id,
    title: row.title,
    priority: row.priority,
    completed: row.completed,
    createdAt: row.created_at,
    ...(row.completed_at ? { completedAt: row.completed_at } : {}),
  };
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div className="auth-shell">
        <Auth />
      </div>
    );
  }

  return (
    <TaskManager
      key={user.id}
      userId={user.id}
      userEmail={user.email}
    />
  );
}

function TaskManager({ userId, userEmail }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [taskError, setTaskError] = useState('');
  const [tasksLoading, setTasksLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [tasks, setTasks] = useState([]);
  const [taskHistory, setTaskHistory] = useState([]);
  const clearButtonRef = useRef(null);
  const cancelClearRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      const [unfinishedResult, historyResult, completedCountResult] = await Promise.all([
        supabase
          .from('tasks')
          .select(taskColumns)
          .eq('user_id', userId)
          .eq('completed', false)
          .order('created_at', { ascending: true }),
        supabase
          .from('tasks')
          .select(taskColumns)
          .eq('user_id', userId)
          .eq('completed', true)
          .order('completed_at', { ascending: false, nullsFirst: false })
          .limit(10),
        supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('completed', true),
      ]);

      if (
        unfinishedResult.error ||
        historyResult.error ||
        completedCountResult.error
      ) {
        throw new Error('Could not load tasks.');
      }

      if (!cancelled) {
        setTasks((unfinishedResult.data ?? []).map(mapTask));
        setTaskHistory((historyResult.data ?? []).map(mapTask));
        setCompletedCount(completedCountResult.count ?? 0);
        setTasksLoading(false);
      }
    }

    loadTasks().catch(() => {
      if (!cancelled) {
        setTaskError('Could not load your tasks. Please try again.');
        setTasksLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!clearDialogOpen) {
      return undefined;
    }

    const clearButton = clearButtonRef.current;
    cancelClearRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setClearDialogOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearButton?.focus();
    };
  }, [clearDialogOpen]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (pendingAction || tasksLoading) {
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    setPendingAction('create');
    setTaskError('');

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          title: trimmedTitle,
          priority,
          completed: false,
        })
        .select(taskColumns)
        .single();

      if (error || !data) {
        throw new Error('Could not create task.');
      }

      setTasks((currentTasks) => [...currentTasks, mapTask(data)]);
      setTitle('');
    } catch {
      setTaskError('Could not create task. Please try again.');
    } finally {
      setPendingAction(null);
    }
  }

  async function handleComplete(taskToComplete) {
    if (pendingAction) {
      return;
    }

    setPendingAction(`complete:${taskToComplete.id}`);
    setTaskError('');

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskToComplete.id)
        .eq('user_id', userId)
        .eq('completed', false)
        .select(taskColumns)
        .single();

      if (error || !data) {
        throw new Error('Could not complete task.');
      }

      const completedTask = mapTask(data);
      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskToComplete.id),
      );
      setTaskHistory((currentHistory) =>
        [completedTask, ...currentHistory].slice(0, 10),
      );
      setCompletedCount((count) => count + 1);
    } catch {
      setTaskError('Could not complete task. Please try again.');
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete(taskId) {
    if (pendingAction) {
      return;
    }

    setPendingAction(`delete:${taskId}`);
    setTaskError('');

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', userId)
        .eq('completed', false)
        .select('id')
        .single();

      if (error) {
        throw new Error('Could not delete task.');
      }

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId),
      );
    } catch {
      setTaskError('Could not delete task. Please try again.');
    } finally {
      setPendingAction(null);
    }
  }

  async function clearPendingTasks() {
    if (pendingAction) {
      return;
    }

    setPendingAction('clear');
    setTaskError('');

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', userId)
        .eq('completed', false);

      if (error) {
        throw new Error('Could not clear tasks.');
      }
      setTasks([]);
      setClearDialogOpen(false);
    } catch {
      setTaskError('Could not clear tasks. Please try again.');
    } finally {
      setPendingAction(null);
    }
  }

  const sortedTasks = [...tasks].sort(
    (firstTask, secondTask) =>
      priorityOrder[firstTask.priority] - priorityOrder[secondTask.priority],
  );
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase();
  const visibleTasks = sortedTasks.filter((task) => (
    (priorityFilter === 'All' || task.priority === priorityFilter) &&
    task.title.toLocaleLowerCase().includes(normalizedSearch)
  ));
  const pendingCount = tasks.length;
  const totalCount = pendingCount + completedCount;

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError('');

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      setLogoutError(error.message || 'Could not log out.');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-mark" aria-hidden="true">
          <Icon name="brand" size={27} />
        </div>
        <div className="header-copy">
          <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
          <h1>TaskSync</h1>
          <p className="subtitle">Stay organized. Get things done.</p>
        </div>
        <div className="header-account">
          <span className="user-email" title={userEmail}>{userEmail}</span>
          <button
            className="button button-logout"
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </header>
      {logoutError && <p className="feedback-error" role="alert">{logoutError}</p>}
      {taskError && !clearDialogOpen && (
        <p className="feedback-error" role="alert">{taskError}</p>
      )}
      {tasksLoading ? (
        <div className="loading-dashboard" role="status" aria-label="Loading dashboard">
          <span className="loading-message">Loading your workspace...</span>
          <div className="loading-stat-grid">
            {[1, 2, 3].map((item) => <div className="skeleton skeleton-stat" key={item} />)}
          </div>
          <div className="skeleton skeleton-create" />
          <div className="skeleton skeleton-dashboard" />
        </div>
      ) : (
        <main className="workspace">
          <section className="stats-grid" aria-label="Task statistics">
            <article className="stat-card">
              <span className="stat-label">Total tasks</span>
              <strong>{totalCount}</strong>
              <span className="stat-detail">In your workspace</span>
            </article>
            <article className="stat-card stat-completed">
              <span className="stat-label">Completed</span>
              <strong>{completedCount}</strong>
              <span className="stat-detail">All-time completed</span>
            </article>
            <article className="stat-card stat-pending">
              <span className="stat-label">Pending</span>
              <strong>{pendingCount}</strong>
              <span className="stat-detail">Ready when you are</span>
            </article>
          </section>

          <section className="panel create-panel" aria-labelledby="create-task-heading">
            <div className="section-heading">
              <div>
                <p className="eyebrow">MAKE PROGRESS</p>
                <h2 id="create-task-heading">Create New Task</h2>
              </div>
            </div>
            <form className="task-form" onSubmit={handleSubmit}>
              <div className="form-field title-field">
                <label htmlFor="task-title">Task title</label>
                <input
                  id="task-title"
                  name="title"
                  type="text"
                  placeholder="What needs to get done?"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  disabled={Boolean(pendingAction)}
                />
              </div>

              <div className="form-field priority-field">
                <label htmlFor="task-priority">Priority</label>
                <select
                  id="task-priority"
                  name="priority"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  disabled={Boolean(pendingAction)}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <button
                className="button button-primary add-button"
                type="submit"
                disabled={Boolean(pendingAction)}
              >
                <Icon name="add" />
                {pendingAction === 'create' ? 'Adding task...' : 'Add Task'}
              </button>
            </form>
          </section>

          <div className="dashboard-grid">
            <section
              className="panel tasks-panel"
              aria-labelledby="unfinished-tasks-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">YOUR WORKSPACE</p>
                  <h2 id="unfinished-tasks-heading">Pending Tasks</h2>
                </div>
                <span className="task-count" aria-label={`${tasks.length} pending tasks`}>
                  {tasks.length}
                </span>
              </div>

              <div className="task-tools">
                <label className="search-field">
                  <span className="sr-only">Search pending tasks</span>
                  <Icon name="search" size={17} />
                  <input
                    type="search"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </label>
                <div className="priority-filters" aria-label="Filter by priority">
                  {['All', 'High', 'Medium', 'Low'].map((filter) => (
                    <button
                      className={`filter-button${priorityFilter === filter ? ' active' : ''}`}
                      type="button"
                      key={filter}
                      aria-pressed={priorityFilter === filter}
                      onClick={() => setPriorityFilter(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

            {tasks.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state-icon" aria-hidden="true">
                    <Icon name="unfinished" size={20} />
                  </span>
                  <h3>No pending tasks</h3>
                  <p>You’re all caught up! Create a task to get started.</p>
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => document.getElementById('task-title')?.focus()}
                  >
                    Create a task
                  </button>
                </div>
            ) : (
                visibleTasks.length ? (
                  <ul className="task-list">
                    {visibleTasks.map((task) => (
                  <li key={task.id}>
                    <article className="task-card">
                      <div className="task-card-main">
                        <h3>{task.title}</h3>
                        <PriorityBadge priority={task.priority} />
                      </div>
                      <p className="task-time">
                        Created:{' '}
                        <time dateTime={task.createdAt}>
                          {new Date(task.createdAt).toLocaleString()}
                        </time>
                      </p>
                      <div className="task-actions">
                        <button
                          className="button button-complete"
                          type="button"
                          onClick={() => handleComplete(task)}
                          disabled={Boolean(pendingAction)}
                        >
                          <Icon name="complete" />
                          {pendingAction === `complete:${task.id}` ? 'Completing...' : 'Complete'}
                        </button>
                        <button
                          className="button button-delete"
                          type="button"
                          onClick={() => handleDelete(task.id)}
                          disabled={Boolean(pendingAction)}
                        >
                          <Icon name="delete" />
                          {pendingAction === `delete:${task.id}` ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </article>
                  </li>
                    ))}
                  </ul>
                ) : (
                  <div className="empty-state filtered-empty-state">
                    <h3>No matching tasks</h3>
                    <p>Try another search or priority filter.</p>
                  </div>
                )
            )}

            {tasks.length > 0 && (
              <button
                ref={clearButtonRef}
                className="button button-clear"
                type="button"
                onClick={() => setClearDialogOpen(true)}
                disabled={Boolean(pendingAction)}
              >
                <Icon name="clear" />
                Clear All Tasks
              </button>
            )}
            </section>

            <section
              className="panel history-panel"
              aria-labelledby="task-history-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">RECENTLY FINISHED</p>
                  <h2 id="task-history-heading" className="history-heading">
                    <Icon name="history" size={19} />
                    Task History
                  </h2>
                </div>
                <span className="history-limit">Latest 10</span>
              </div>
              {taskHistory.length === 0 ? (
                <div className="empty-state history-empty-state">
                  <span className="empty-state-icon history-icon" aria-hidden="true">
                    <Icon name="historyEmpty" size={20} />
                  </span>
                  <h3>No completed tasks yet</h3>
                  <p>Completed tasks will appear here.</p>
                </div>
              ) : (
                <ul className="task-list history-list">
                  {taskHistory.map((task) => (
                  <li key={task.id}>
                    <article className="task-card history-card">
                      <div className="task-card-main">
                        <span className="completion-mark" aria-label="Completed">
                          <Icon name="complete" size={14} />
                        </span>
                        <h3>{task.title}</h3>
                        <PriorityBadge priority={task.priority} />
                      </div>
                      <p className="task-time">
                        Completed:{' '}
                        <time dateTime={task.completedAt}>
                          {new Date(task.completedAt).toLocaleString()}
                        </time>
                      </p>
                    </article>
                  </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </main>
      )}
      {clearDialogOpen && (
        <div className="modal-backdrop">
          <section
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-dialog-title"
            aria-describedby="clear-dialog-description"
            onKeyDown={(event) => {
              if (event.key !== 'Tab') return;
              const focusable = event.currentTarget.querySelectorAll('button:not(:disabled)');
              if (!focusable.length) {
                event.preventDefault();
                return;
              }
              const first = focusable[0];
              const last = focusable[focusable.length - 1];
              if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
              } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
              }
            }}
          >
            <div className="dialog-icon"><Icon name="clear" size={20} /></div>
            <h2 id="clear-dialog-title">Clear all pending tasks?</h2>
            <p id="clear-dialog-description">
              This action will permanently remove all pending tasks. Completed
              history will not be affected.
            </p>
            {taskError && <p className="feedback-error dialog-error" role="alert">{taskError}</p>}
            {pendingAction === 'clear' && <p className="dialog-progress">Clearing pending tasks...</p>}
            <div className="dialog-actions">
              <button
                className="button button-secondary"
                type="button"
                ref={cancelClearRef}
                onClick={() => setClearDialogOpen(false)}
                disabled={pendingAction === 'clear'}
              >
                Cancel
              </button>
              <button
                className="button button-danger"
                type="button"
                onClick={clearPendingTasks}
                disabled={Boolean(pendingAction)}
              >
                {pendingAction === 'clear' ? 'Clearing...' : 'Clear Tasks'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;