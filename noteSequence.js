import Note from "./note.js"

/**
 * A basic representation of a sequence of notes, that uses a linear search to
 * find and add notes.
 */
let BasicNoteSequence = {
    init: function() {
        this.notes = [];
    },
    /**
     * Adds a new note to the sequence.
     *
     * @param start The starting beat of the note.
     * @param length The length of the note in beats.
     * @param number The note number of the note.
     */
    addNote: function({start=0, length=1, number=0}) {
        let position = this.findPosition(start);
        this.notes.splice(
            position,
            0,
            Note.createNote({start: start, length: length, number: number})
        );
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
