import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { db, type LocalTask } from "@/services/db";
import styles from "./TasksPage.module.css";

interface NewTaskState {
  title: string;
  notes: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
}

const defaultTaskState: NewTaskState = {
  title: "",
  notes: "",
  dueDate: "",
  priority: "medium"
};

function sortTasks(tasks: LocalTask[]): LocalTask[] {
  return [...tasks].sort((left, right) => {
    if (left.completed !== right.completed) {
      return left.completed ? 1 : -1;
    }
    if (left.dueDate && right.dueDate) {
      return left.dueDate.localeCompare(right.dueDate);
    }
    if (left.dueDate) {
      return -1;
    }
    if (right.dueDate) {
      return 1;
    }
    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

/**
 * Personal task board persisted locally for offline planning.
 */
export default function TasksPage() {
  const [tasks, setTasks] = useState<LocalTask[]>([]);
  const [form, setForm] = useState<NewTaskState>(defaultTaskState);
  const [feedback, setFeedback] = useState("");

  const reload = async () => {
    const rows = await db.tasks.toArray();
    setTasks(sortTasks(rows));
  };

  useEffect(() => {
    void reload();
  }, []);

  const onCreateTask = async () => {
    if (!form.title.trim()) {
      setFeedback("Task title is required.");
      return;
    }

    const now = new Date().toISOString();
    const task: LocalTask = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      notes: form.notes.trim(),
      dueDate: form.dueDate || null,
      priority: form.priority,
      completed: false,
      createdAt: now,
      updatedAt: now
    };
    await db.tasks.put(task);
    await reload();
    setForm(defaultTaskState);
    setFeedback("Task saved locally.");
  };

  const onToggleTask = async (task: LocalTask) => {
    await db.tasks.put({
      ...task,
      completed: !task.completed,
      updatedAt: new Date().toISOString()
    });
    await reload();
  };

  const onDeleteTask = async (taskId: string) => {
    await db.tasks.delete(taskId);
    await reload();
  };

  return (
    <section className={styles.stack}>
      <Card>
        <h2>Tasks</h2>
        <p>Track personal learning tasks and deadlines even when offline.</p>
        <div className={styles.form}>
          <input
            value={form.title}
            onChange={(event) => setForm((state) => ({ ...state, title: event.target.value }))}
            placeholder="Task title"
          />
          <textarea
            value={form.notes}
            onChange={(event) => setForm((state) => ({ ...state, notes: event.target.value }))}
            placeholder="Notes (optional)"
          />
          <div className={styles.row}>
            <label className={styles.field}>
              <span>Due date</span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((state) => ({ ...state, dueDate: event.target.value }))}
              />
            </label>
            <label className={styles.field}>
              <span>Priority</span>
              <select
                value={form.priority}
                onChange={(event) =>
                  setForm((state) => ({
                    ...state,
                    priority: event.target.value as NewTaskState["priority"]
                  }))
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
          <Button onClick={() => void onCreateTask()}>Add Task</Button>
          {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
        </div>
      </Card>

      {tasks.length === 0 ? (
        <Card>
          <p>No tasks yet. Add one above to start planning offline.</p>
        </Card>
      ) : null}

      {tasks.map((task) => (
        <Card key={task.id}>
          <div className={styles.taskHeader}>
            <div>
              <h3 className={task.completed ? styles.completed : ""}>{task.title}</h3>
              {task.notes ? <p>{task.notes}</p> : null}
              <p className={styles.meta}>Due: {task.dueDate ?? "No deadline"}</p>
            </div>
            <Badge color={task.priority === "high" ? "error" : task.priority === "medium" ? "warning" : "success"} text={task.priority} />
          </div>
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => void onToggleTask(task)}>
              {task.completed ? "Mark Active" : "Mark Done"}
            </Button>
            <Button variant="text" onClick={() => void onDeleteTask(task.id)}>
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </section>
  );
}
