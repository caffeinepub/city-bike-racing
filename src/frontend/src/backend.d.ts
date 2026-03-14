import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface FileEntry {
    id: bigint;
    content: string;
    name: string;
}
export interface Note {
    id: bigint;
    content: string;
}
export interface backendInterface {
    addFile(name: string, content: string): Promise<void>;
    addNote(content: string): Promise<void>;
    deleteFileById(fileId: bigint): Promise<void>;
    deleteNoteById(noteId: bigint): Promise<void>;
    getAllFiles(): Promise<Array<FileEntry>>;
    getAllNotes(): Promise<Array<Note>>;
    hasPin(): Promise<boolean>;
    setPin(newPin: string): Promise<void>;
    verifyPin(inputPin: string): Promise<boolean>;
}
