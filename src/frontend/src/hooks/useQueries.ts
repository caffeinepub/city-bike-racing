import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function useGetNotes() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllNotes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddNote() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      if (!actor) throw new Error("No actor");
      return actor.addNote(content);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useDeleteNote() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteNoteById(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useGetFiles() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["files"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFiles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddFile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      content,
    }: { name: string; content: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.addFile(name, content);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files"] }),
  });
}

export function useDeleteFile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteFileById(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files"] }),
  });
}

export function useHasPin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["hasPin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.hasPin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetPin() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pin: string) => {
      if (!actor) throw new Error("No actor");
      return actor.setPin(pin);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hasPin"] }),
  });
}

export function useVerifyPin() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (pin: string) => {
      if (!actor) throw new Error("No actor");
      return actor.verifyPin(pin);
    },
  });
}
