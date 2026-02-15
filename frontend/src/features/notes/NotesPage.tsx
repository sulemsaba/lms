import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { db, type LocalNote } from "@/services/db";
import styles from "./NotesPage.module.css";

interface DraftNote {
  title: string;
  content: string;
  courseLabel: string;
}

const initialDraft: DraftNote = {
  title: "",
  content: "",
  courseLabel: ""
};

function sortNotes(items: LocalNote[]): LocalNote[] {
  return [...items].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return left.pinned ? -1 : 1;
    }
    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

/**
 * Personal study notes with local-only persistence for offline usage.
 */
export default function NotesPage() {
  const [notes, setNotes] = useState<LocalNote[]>([]);
  const [draft, setDraft] = useState<DraftNote>(initialDraft);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState("");

  const reload = async () => {
    const rows = await db.notes.toArray();
    setNotes(sortNotes(rows));
  };

  useEffect(() => {
    void reload();
  }, []);

  const visibleNotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return notes;
    }
    return notes.filter((item) => {
      const text = `${item.title} ${item.content} ${item.courseLabel}`.toLowerCase();
      return text.includes(query);
    });
  }, [notes, search]);

  const onSaveNote = async () => {
    const title = draft.title.trim();
    const content = draft.content.trim();

    if (!title || !content) {
      setFeedback("Title and content are required.");
      return;
    }

    const now = new Date().toISOString();
    const note: LocalNote = {
      id: crypto.randomUUID(),
      title,
      content,
      courseLabel: draft.courseLabel.trim(),
      pinned: false,
      createdAt: now,
      updatedAt: now
    };

    await db.notes.put(note);
    await reload();
    setDraft(initialDraft);
    setFeedback("Note saved offline.");
  };

  const onTogglePin = async (note: LocalNote) => {
    await db.notes.put({
      ...note,
      pinned: !note.pinned,
      updatedAt: new Date().toISOString()
    });
    await reload();
  };

  const onDeleteNote = async (noteId: string) => {
    await db.notes.delete(noteId);
    await reload();
  };

  return (
    <section className={styles.stack}>
      <Card>
        <h2>Study Notes</h2>
        <p>Capture lecture summaries, key formulas, and revision points offline.</p>
        <div className={styles.form}>
          <input
            value={draft.title}
            onChange={(event) => setDraft((state) => ({ ...state, title: event.target.value }))}
            placeholder="Note title"
          />
          <input
            value={draft.courseLabel}
            onChange={(event) => setDraft((state) => ({ ...state, courseLabel: event.target.value }))}
            placeholder="Course tag (optional)"
          />
          <textarea
            value={draft.content}
            onChange={(event) => setDraft((state) => ({ ...state, content: event.target.value }))}
            placeholder="Write your note..."
            rows={6}
          />
          <Button onClick={() => void onSaveNote()}>Save Note</Button>
          {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
        </div>
      </Card>

      <Card>
        <h3>Your Notes</h3>
        <div className={styles.searchRow}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search notes..."
            aria-label="Search notes"
          />
          <Badge color="accent" text={`${visibleNotes.length} shown`} />
        </div>
      </Card>

      {visibleNotes.length === 0 ? (
        <Card>
          <p>No notes in this view.</p>
        </Card>
      ) : null}

      {visibleNotes.map((note) => (
        <Card key={note.id}>
          <div className={styles.noteHeader}>
            <div>
              <h3>{note.title}</h3>
              <p className={styles.meta}>
                {note.courseLabel ? `Course: ${note.courseLabel}` : "General note"} •{" "}
                {new Date(note.updatedAt).toLocaleString()}
              </p>
            </div>
            <Badge color={note.pinned ? "warning" : "success"} text={note.pinned ? "Pinned" : "Active"} />
          </div>
          <p className={styles.content}>{note.content}</p>
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => void onTogglePin(note)}>
              {note.pinned ? "Unpin" : "Pin"}
            </Button>
            <Button variant="text" onClick={() => void onDeleteNote(note.id)}>
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </section>
  );
}
