import { useEffect, useState } from "react";
import {
  getNotes,
  createNote,
  deleteNote,
  type Note,
  updateNote,
} from "../../services/noteService";
import Modal from "../shared/Modal";

type Props = {
  cowId: string;
};

function Notes({ cowId }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [notePendingDelete, setNotePendingDelete] = useState<Note | null>(null);

  useEffect(() => {
    async function loadNotes() {
      setLoading(true);
      setError("");

      try {
        const data = await getNotes(cowId);
        setNotes(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load notes";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadNotes();
  }, [cowId]);

  async function handleAdd() {
    if (!newNote.trim()) return;

    try {
      setError("");
      const created = await createNote(cowId, newNote);
      setNotes((prev) => [created, ...prev]);
      setNewNote("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add note";
      setError(message);
    }
  }

  async function handleDelete(noteId: string) {
    try {
      setError("");
      await deleteNote(cowId, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete note";
      setError(message);
    }
  }

  function startEditing(note: Note) {
    setError("");
    setEditingId(note.id);
    setEditingContent(note.content);
  }

  async function saveEdit(noteId: string) {
    if (!editingContent.trim()) return;

    try {
      setError("");
      const updated = await updateNote(cowId, noteId, editingContent);

      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));

      setEditingId(null);
      setEditingContent("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update note";
      setError(message);
    }
  }

  return (
    <section className="dashboardCard">
      <div className="dataCardHeader">
        <h2 className="cardTitle">Notes</h2>
        <span className="cardSubtle">Internal record</span>
      </div>

      <div className="notesContainer">
        {error && <div className="notesErrorBanner">{error}</div>}

        <div className="notesBody">
          {loading ? (
            <span className="emptyState">Loading notes...</span>
          ) : notes.length === 0 ? (
            <span className="emptyState">No notes yet.</span>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="noteItem">
                <div
                  className="noteContent"
                  onDoubleClick={() => startEditing(note)}
                >
                  {editingId === note.id ? (
                    <textarea
                      ref={(el) => {
                        if (el) {
                          el.style.height = "auto";
                          el.style.height = el.scrollHeight + "px";
                        }
                      }}
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      onBlur={() => saveEdit(note.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          saveEdit(note.id);
                        }
                      }}
                      autoFocus
                      rows={Math.max(3, editingContent.split("\n").length)}
                    />
                  ) : (
                    <>
                      <span>{note.content}</span>
                      <span className="noteTimestamp">
                        {new Date(note.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </>
                  )}
                </div>

                <button onClick={() => setNotePendingDelete(note)}>✕</button>
              </div>
            ))
          )}
        </div>

        <div className="addNoteRow">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Add a note..."
          />
          <button onClick={handleAdd}>Add</button>
        </div>
      </div>

      <Modal
        isOpen={notePendingDelete !== null}
        title="Delete Note"
        message="Are you sure you want to delete this note?"
        confirmText="Delete Note"
        onCancel={() => setNotePendingDelete(null)}
        onConfirm={async () => {
          if (!notePendingDelete) return;
          await handleDelete(notePendingDelete.id);
          setNotePendingDelete(null);
        }}
      />
    </section>
  );
}

export default Notes;
