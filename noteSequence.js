import Note from "./note.js"

/**
 * A basic representation of a sequence of notes, that uses a linear search to
 * find and add notes.
 */
let BasicNoteSequence = {
    init: function() {
        this.notes = [];
        this.listeners = [];
    },
    /**
     * Adds a new note to the sequence.
     *
     * @param {BasicNote} note The note to add to the sequence.
     */
    addNote: function(note) {
        let position = this.findPosition(note.start);
        this.notes.splice(
            position,
            0,
            note
        );
        this.notifyListeners();
    },
    /**
     * Finds the position in the note list associated with a certain beat.
     *
     * @param beat The beat to find the position for.
     * @return The index associated with that beat.
     */
    findPosition: function(beat) {
        let index = this.notes.length;
        for (let entry of this.notes.entries()) {
            if (entry[1].start >= beat) {
                index = entry[0];
                break;
            }
        }
        return index;
    },
    /**
     * Gets the notes happening between two beats.
     *
     * The startpoint of the range is included, but the endpoint isn’t.
     *
     * @param startBeat The start of the beat range.
     * @param endBeat The end of the beat range.
     * @return An array of all notes in the range.
     */
    getNotes: function({startBeat, endBeat}) {
        let startPosition = this.findPosition(startBeat);
        let endPosition = this.findPosition(endBeat);
        return this.notes.slice(startPosition, endPosition);
    },
    /**
     * Removes a note from the note sequence, if it is contained in the
     * sequence.
     *
     * @param {BasicNote} note The note to remove from the sequence.
     */
    removeNote: function(note) {
        let position = this.notes.indexOf(note);
        if (position != -1) {
            this.notes.splice(position, 1);
        }
        this.notifyListeners();
    },
    /**
     * Changes the starting beat of a note in the sequence.
     *
     * @param note The note whose starting beat should be changed.
     * @param newStart The new starting beat for the note.
     * @param newPitch The new pitch number for the note.
     */
    moveNote: function({note, newStart, newPitch}) {
        this.removeNote(note);
        let newPosition = this.findPosition(newStart);
        note.start = newStart;
        note.number = newPitch;
        this.notes.splice(newPosition, 0, note);
        this.notifyListeners();
    },
    /**
     * Adds a listener that will be notified of any changes to the notes in this
     * note sequence.
     *
     * The listener’s "notify" method will be called with no arguments.
     */
    addChangeListener: function(listener) {
        this.listeners.push(listener);
    },
    /**
     * Notifies the listeners of changes to the notes.
     */
    notifyListeners: function() {
        for (let listener of this.listeners) {
            listener.notify();
        }
    }
}

export default {
    /**
     * Creates an empty sequence of notes.
     *
     * @return A NoteSequence with no notes in it.
     */
    createEmptyNoteSequence: function() {
        let newSequence = Object.create(BasicNoteSequence);
        newSequence.init();
        return newSequence;
    }
}
