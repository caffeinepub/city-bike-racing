import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAddNote, useDeleteNote, useGetNotes } from "@/hooks/useQueries";
import { Plus, StickyNote, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

export default function NotesTab() {
  const [noteText, setNoteText] = useState("");
  const { data: notes, isLoading } = useGetNotes();
  const addNote = useAddNote();
  const deleteNote = useDeleteNote();

  const handleAdd = () => {
    const text = noteText.trim();
    if (!text) return;
    addNote.mutate(text, {
      onSuccess: () => {
        setNoteText("");
        toast.success("Note saved");
      },
      onError: () => toast.error("Failed to save note"),
    });
  };

  const handleDelete = (id: bigint) => {
    deleteNote.mutate(id, {
      onSuccess: () => toast.success("Note deleted"),
      onError: () => toast.error("Failed to delete"),
    });
  };

  return (
    <div
      className="h-full flex flex-col"
      style={{ maxHeight: "calc(100vh - 12rem)" }}
    >
      <div
        className="p-4 border-b"
        style={{ borderColor: "oklch(0.20 0.02 210)" }}
      >
        <Textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Write a private note..."
          className="resize-none text-sm font-body mb-3 min-h-20"
          style={{
            background: "oklch(0.15 0.02 210)",
            border: "1px solid oklch(0.25 0.02 210)",
            color: "oklch(0.90 0 0)",
          }}
          data-ocid="notes.textarea"
        />
        <Button
          onClick={handleAdd}
          disabled={!noteText.trim() || addNote.isPending}
          className="w-full font-body"
          style={{
            background: "oklch(0.72 0.18 195)",
            color: "oklch(0.06 0 0)",
          }}
          data-ocid="notes.submit_button"
        >
          <Plus size={16} className="mr-1" />
          {addNote.isPending ? "Saving..." : "Add Note"}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isLoading && (
            <div className="space-y-3" data-ocid="notes.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  className="h-20 w-full rounded-xl"
                  style={{ background: "oklch(0.18 0.02 210)" }}
                />
              ))}
            </div>
          )}

          {!isLoading && (!notes || notes.length === 0) && (
            <div
              className="flex flex-col items-center justify-center py-12 gap-3"
              data-ocid="notes.empty_state"
            >
              <StickyNote size={32} style={{ color: "oklch(0.35 0.03 210)" }} />
              <p
                className="font-body text-sm"
                style={{ color: "oklch(0.40 0.03 210)" }}
              >
                No private notes yet
              </p>
            </div>
          )}

          <AnimatePresence>
            {notes?.map((note, idx) => (
              <motion.div
                key={note.id.toString()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="vault-card rounded-xl p-4 flex items-start gap-3"
                data-ocid={`notes.item.${idx + 1}`}
              >
                <p
                  className="flex-1 text-sm font-body leading-relaxed"
                  style={{ color: "oklch(0.85 0 0)" }}
                >
                  {note.content}
                </p>
                <button
                  type="button"
                  onClick={() => handleDelete(note.id)}
                  className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-900/30"
                  data-ocid={`notes.delete_button.${idx + 1}`}
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
