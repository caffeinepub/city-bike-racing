import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FolderLock, Key, X } from "lucide-react";
import { motion } from "motion/react";
import AppLockTab from "./AppLockTab";
import FilesTab from "./FilesTab";
import NotesTab from "./NotesTab";

interface Props {
  onClose: () => void;
}

export default function HiddenVault({ onClose }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
      className="fixed inset-0 z-50 vault-bg flex flex-col"
      data-ocid="vault.panel"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 pt-12 pb-4 border-b"
        style={{ borderColor: "oklch(0.22 0.02 210)" }}
      >
        <div>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "oklch(0.72 0.18 195)" }}
            />
            <span className="text-[oklch(0.72_0.18_195)] font-display font-semibold text-sm tracking-widest uppercase">
              Secure Vault
            </span>
          </div>
          <p className="text-[oklch(0.40_0.02_210)] text-xs font-body mt-0.5">
            Private & encrypted
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "oklch(0.18 0.02 210)" }}
          data-ocid="vault.close_button"
        >
          <X size={16} className="text-white" />
        </button>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="notes"
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-hidden">
          <TabsContent value="notes" className="h-full m-0">
            <NotesTab />
          </TabsContent>
          <TabsContent value="applock" className="h-full m-0">
            <AppLockTab />
          </TabsContent>
          <TabsContent value="files" className="h-full m-0">
            <FilesTab />
          </TabsContent>
        </div>

        <TabsList
          className="w-full rounded-none border-t h-16"
          style={{
            background: "oklch(0.10 0.01 210)",
            borderColor: "oklch(0.22 0.02 210)",
          }}
        >
          <TabsTrigger
            value="notes"
            className="flex-1 h-full flex-col gap-1 rounded-none data-[state=active]:bg-transparent"
            style={{ color: "oklch(0.50 0.03 210)" }}
            data-ocid="vault.tab"
          >
            <BookOpen size={18} />
            <span className="text-[10px] font-body">Hidden App</span>
          </TabsTrigger>
          <TabsTrigger
            value="applock"
            className="flex-1 h-full flex-col gap-1 rounded-none data-[state=active]:bg-transparent"
            style={{ color: "oklch(0.50 0.03 210)" }}
            data-ocid="vault.tab"
          >
            <Key size={18} />
            <span className="text-[10px] font-body">App Lock</span>
          </TabsTrigger>
          <TabsTrigger
            value="files"
            className="flex-1 h-full flex-col gap-1 rounded-none data-[state=active]:bg-transparent"
            style={{ color: "oklch(0.50 0.03 210)" }}
            data-ocid="vault.tab"
          >
            <FolderLock size={18} />
            <span className="text-[10px] font-body">Hidden Files</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Toaster />
    </motion.div>
  );
}
