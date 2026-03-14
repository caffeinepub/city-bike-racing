import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Array "mo:core/Array";

actor {
  type Note = {
    id : Nat;
    content : Text;
  };

  module Note {
    public func compareById(note1 : Note, note2 : Note) : Order.Order {
      Nat.compare(note1.id, note2.id);
    };
  };

  type FileEntry = {
    id : Nat;
    name : Text;
    content : Text;
  };

  module FileEntry {
    public func compareById(fileEntry1 : FileEntry, fileEntry2 : FileEntry) : Order.Order {
      Nat.compare(fileEntry1.id, fileEntry2.id);
    };
  };

  type UserData = {
    pin : ?Text;
    nextNoteId : Nat;
    nextFileId : Nat;
    notes : [Note];
    files : [FileEntry];
  };

  let userData = Map.empty<Principal, UserData>();

  // PIN management
  public shared ({ caller }) func setPin(newPin : Text) : async () {
    if (newPin.size() != 4) {
      Runtime.trap("The PIN must have exactly 4 digits.");
    };

    for (char in newPin.chars()) {
      if (char < '0' or char > '9') {
        Runtime.trap("The PIN must only contain digits from 0 to 9.");
      };
    };

    let data = switch (userData.get(caller)) {
      case (null) {
        {
          pin = ?newPin;
          nextNoteId = 0;
          nextFileId = 0;
          notes = [];
          files = [];
        };
      };
      case (?existingData) {
        { existingData with pin = ?newPin };
      };
    };
    userData.add(caller, data);
  };

  public shared ({ caller }) func verifyPin(inputPin : Text) : async Bool {
    switch (userData.get(caller)) {
      case (null) { Runtime.trap("No PIN was set for this user yet.") };
      case (?data) {
        switch (data.pin) {
          case (null) { false };
          case (?storedPin) { storedPin == inputPin };
        };
      };
    };
  };

  public shared ({ caller }) func hasPin() : async Bool {
    switch (userData.get(caller)) {
      case (null) { false };
      case (?data) { data.pin != null };
    };
  };

  // Hidden notes
  public shared ({ caller }) func addNote(content : Text) : async () {
    let data = switch (userData.get(caller)) {
      case (null) {
        Runtime.trap("Please set a PIN before adding notes and files.");
      };
      case (?existingData) { existingData };
    };

    let note = { id = data.nextNoteId; content };
    let newNotes = data.notes.concat([note]);

    let updatedData = {
      data with
      nextNoteId = data.nextNoteId + 1;
      notes = newNotes;
    };
    userData.add(caller, updatedData);
  };

  public shared ({ caller }) func getAllNotes() : async [Note] {
    switch (userData.get(caller)) {
      case (null) { [] };
      case (?data) { data.notes.sort(Note.compareById) };
    };
  };

  public shared ({ caller }) func deleteNoteById(noteId : Nat) : async () {
    let data = switch (userData.get(caller)) {
      case (null) {
        Runtime.trap("No notes found for this user.");
      };
      case (?existingData) { existingData };
    };

    let filteredNotes = data.notes.filter(
      func(note) {
        note.id != noteId;
      }
    );

    if (filteredNotes.size() == data.notes.size()) {
      Runtime.trap("No note with the given id found");
    };

    let updatedData = { data with notes = filteredNotes };
    userData.add(caller, updatedData);
  };

  // Hidden files
  public shared ({ caller }) func addFile(name : Text, content : Text) : async () {
    let data = switch (userData.get(caller)) {
      case (null) { Runtime.trap("Please set a PIN before adding notes and files.") };
      case (?existingData) { existingData };
    };

    let file = { id = data.nextFileId; name; content };
    let newFiles = data.files.concat([file]);

    let updatedData = {
      data with
      nextFileId = data.nextFileId + 1;
      files = newFiles;
    };
    userData.add(caller, updatedData);
  };

  public shared ({ caller }) func getAllFiles() : async [FileEntry] {
    switch (userData.get(caller)) {
      case (null) { [] };
      case (?data) { data.files.sort(FileEntry.compareById) };
    };
  };

  public shared ({ caller }) func deleteFileById(fileId : Nat) : async () {
    let data = switch (userData.get(caller)) {
      case (null) { Runtime.trap("No files found for this user.") };
      case (?existingData) { existingData };
    };

    let filteredFiles = data.files.filter(
      func(file) {
        file.id != fileId;
      }
    );

    if (filteredFiles.size() == data.files.size()) {
      Runtime.trap("No file with the given id found");
    };

    let updatedData = { data with files = filteredFiles };
    userData.add(caller, updatedData);
  };
};
