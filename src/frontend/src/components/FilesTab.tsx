import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAddFile, useDeleteFile, useGetFiles } from "@/hooks/useQueries";
import { ChevronDown, ChevronUp, FolderLock, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

export default function FilesTab() {
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [expandedId, setExpandedId] = useState<bigint | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: files, isLoading } = useGetFiles();
  const addFile = useAddFile();
  const deleteFile = useDeleteFile();

  const handleAdd = () => {
    if (!fileName.trim() || !fileContent.trim()) {
      toast.error("Name and content required");
      return;
    }
    addFile.mutate(
      { name: fileName.trim(), content: fileContent.trim() },
      {
        onSuccess: () => {
          setFileName("");
          setFileContent("");
          setShowForm(false);
          toast.success("File saved");
        },
        onError: () => toast.error("Failed to save file"),
      },
    );
  };

  const handleDelete = (id: bigint) => {
    deleteFile.mutate(id, {
      onSuccess: () => toast.success("File deleted"),
      onError: () => toast.error("Failed to delete"),
    });
  };

  const inputStyle = {
    background: "oklch(0.15 0.02 210)",
    border: "1px solid oklch(0.25 0.02 210)",
    color: "oklch(0.90 0 0)",
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
        <Button
          onClick={() => setShowForm((p) => !p)}
          className="w-full font-body"
          style={{
            background: "oklch(0.72 0.18 195)",
            color: "oklch(0.06 0 0)",
          }}
          data-ocid="files.open_modal_button"
        >
          <Plus size={16} className="mr-1" />
          {showForm ? "Cancel" : "Add New File"}
        </Button>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 mt-3">
                <div>
                  <Label
                    className="font-body text-xs mb-1 block"
                    style={{ color: "oklch(0.60 0.03 210)" }}
                  >
                    File Name
                  </Label>
                  <Input
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="e.g. passwords.txt"
                    style={inputStyle}
                    className="font-body text-sm"
                    data-ocid="files.input"
                  />
                </div>
                <div>
                  <Label
                    className="font-body text-xs mb-1 block"
                    style={{ color: "oklch(0.60 0.03 210)" }}
                  >
                    Content
                  </Label>
                  <Textarea
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    placeholder="File content..."
                    className="resize-none text-sm font-body min-h-24"
                    style={inputStyle}
                    data-ocid="files.textarea"
                  />
                </div>
                <Button
                  onClick={handleAdd}
                  disabled={
                    !fileName.trim() || !fileContent.trim() || addFile.isPending
                  }
                  className="w-full font-body"
                  style={{
                    background: "oklch(0.55 0.16 145)",
                    color: "oklch(0.96 0 0)",
                  }}
                  data-ocid="files.submit_button"
                >
                  {addFile.isPending ? "Saving..." : "Save File"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isLoading && (
            <div className="space-y-3" data-ocid="files.loading_state">
              {[1, 2].map((i) => (
                <Skeleton
                  key={i}
                  className="h-16 w-full rounded-xl"
                  style={{ background: "oklch(0.18 0.02 210)" }}
                />
              ))}
            </div>
          )}

          {!isLoading && (!files || files.length === 0) && (
            <div
              className="flex flex-col items-center justify-center py-12 gap-3"
              data-ocid="files.empty_state"
            >
              <FolderLock size={32} style={{ color: "oklch(0.35 0.03 210)" }} />
              <p
                className="font-body text-sm"
                style={{ color: "oklch(0.40 0.03 210)" }}
              >
                No hidden files yet
              </p>
            </div>
          )}

          <AnimatePresence>
            {files?.map((file, idx) => (
              <motion.div
                key={file.id.toString()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="vault-card rounded-xl overflow-hidden"
                data-ocid={`files.item.${idx + 1}`}
              >
                <div className="flex items-center gap-3 p-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "oklch(0.20 0.03 195)" }}
                  >
                    <FolderLock
                      size={14}
                      style={{ color: "oklch(0.72 0.18 195)" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-display font-medium text-sm truncate">
                      {file.name}
                    </p>
                    <p
                      className="font-body text-xs mt-0.5 truncate"
                      style={{ color: "oklch(0.50 0.03 210)" }}
                    >
                      {file.content.slice(0, 40)}
                      {file.content.length > 40 ? "..." : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(expandedId === file.id ? null : file.id)
                      }
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                      style={{ background: "oklch(0.20 0.02 210)" }}
                      data-ocid={`files.toggle.${idx + 1}`}
                    >
                      {expandedId === file.id ? (
                        <ChevronUp
                          size={14}
                          style={{ color: "oklch(0.72 0.18 195)" }}
                        />
                      ) : (
                        <ChevronDown
                          size={14}
                          style={{ color: "oklch(0.55 0.03 210)" }}
                        />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(file.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-900/30"
                      data-ocid={`files.delete_button.${idx + 1}`}
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
                <AnimatePresence>
                  {expandedId === file.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="px-3 pb-3 pt-1 border-t"
                        style={{ borderColor: "oklch(0.20 0.02 210)" }}
                      >
                        <p
                          className="text-sm font-body whitespace-pre-wrap leading-relaxed"
                          style={{ color: "oklch(0.80 0 0)" }}
                        >
                          {file.content}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
