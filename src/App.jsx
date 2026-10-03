import Auth from './components/Auth';
import { useAuth } from './context/AuthContext';
import { useEffect, useState } from 'react';
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
    return <Auth />;
  }

  return <TaskManager key={user.id} userId={user.id} />;
}

function TaskManager({ userId }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [taskError, setTaskError] = useState('');
  const [tasksLoading, setTasksLoading] = useState(true);
  const [taskActionPending, setTaskActionPending] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [tasks, setTasks] = useState([]);
  const [taskHistory, setTaskHistory] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      const [unfinishedResult, historyResult] = await Promise.all([
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
      ]);

      if (unfinishedResult.error || historyResult.error) {
        throw new Error('Could not load tasks.');
      }

      if (!cancelled) {
        setTasks((unfinishedResult.data ?? []).map(mapTask));
        setTaskHistory((historyResult.data ?? []).map(mapTask));
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

  async function handleSubmit(event) {
    event.preventDefault();

    if (taskActionPending || tasksLoading) {
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    setTaskActionPending(true);
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
      setTaskActionPending(false);
    }
  }

  async function handleComplete(taskToComplete) {
    if (taskActionPending) {
      return;
    }

    setTaskActionPending(true);
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
    } catch {
      setTaskError('Could not complete task. Please try again.');
    } finally {
      setTaskActionPending(false);
    }
  }

  async function handleDelete(taskId) {
    if (taskActionPending) {
      return;
    }

    setTaskActionPending(true);
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
      setTaskActionPending(false);
    }
  }

  async function handleClearAllTasks() {
    if (taskActionPending) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to clear all unfinished tasks?',
    );

    if (confirmed) {
      setTaskActionPending(true);
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
      } catch {
        setTaskError('Could not clear tasks. Please try again.');
      } finally {
        setTaskActionPending(false);
      }
    }
  }

  const sortedTasks = [...tasks].sort(
    (firstTask, secondTask) =>
      priorityOrder[firstTask.priority] - priorityOrder[secondTask.priority],
  );

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
          <p className="eyebrow">PERSONAL TASK MANAGER</p>
          <h1>TaskSync</h1>
          <p className="subtitle">
            Organize your tasks and stay productive.
          </p>
          <button
            className="button button-logout"
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
          {logoutError && <p role="alert">{logoutError}</p>}
        </div>
      </header>
      {taskError && <p role="alert">{taskError}</p>}
      {tasksLoading ? (
        <p>Loading tasks...</p>
      ) : (
        <main className="dashboard-grid">
          <section
            className="panel tasks-panel"
            aria-labelledby="unfinished-tasks-heading"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">YOUR WORKSPACE</p>
                <h2 id="unfinished-tasks-heading">Unfinished Tasks</h2>
              </div>
              <span className="task-count" aria-label={`${tasks.length} unfinished tasks`}>
                {tasks.length}
              </span>
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
                  disabled={taskActionPending}
                />
              </div>

              <div className="form-field priority-field">
                <label htmlFor="task-priority">Priority</label>
                <select
                  id="task-priority"
                  name="priority"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  disabled={taskActionPending}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <button
                className="button button-primary add-button"
                type="submit"
                disabled={taskActionPending}
              >
                <Icon name="add" />
                Add Task
              </button>
            </form>

            {tasks.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon" aria-hidden="true">
                  <Icon name="unfinished" size={20} />
                </span>
                <h3>You’re all caught up</h3>
                <p>Add a task above and it’ll show up here.</p>
              </div>
            ) : (
              <ul className="task-list">
                {sortedTasks.map((task) => (
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
                          disabled={taskActionPending}
                        >
                          <Icon name="complete" />
                          Complete
                        </button>
                        <button
                          className="button button-delete"
                          type="button"
                          onClick={() => handleDelete(task.id)}
                          disabled={taskActionPending}
                        >
                          <Icon name="delete" />
                          Delete
                        </button>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}

            {tasks.length > 0 && (
              <button
                className="button button-clear"
                type="button"
                onClick={handleClearAllTasks}
                disabled={taskActionPending}
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
            </div>
            {taskHistory.length === 0 ? (
              <div className="empty-state history-empty-state">
                <span className="empty-state-icon history-icon" aria-hidden="true">
                  <Icon name="historyEmpty" size={20} />
                </span>
                <h3>Your progress starts here</h3>
                <p>Tasks you complete will appear in this list.</p>
              </div>
            ) : (
              <ul className="task-list history-list">
                {taskHistory.map((task) => (
                  <li key={task.id}>
                    <article className="task-card history-card">
                      <div className="task-card-main">
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
        </main>
      )}
    </div>
  );
}

export default App;