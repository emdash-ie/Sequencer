/**
 * Creates a new note.
 *
 * @param start The beat the note should start at.
 * @param length The length of the note, in beats.
 * @param number The note number of the note.
 */
function createNote({start=0, length=1, number=0}) {
    return {start: start, length: length, number: number};
}

/**
 * A note with a specific pitch – a combination of a name and a tuning system
 * which relates the name to a pitch.
 */
let PitchedNote = {
    /**
     * Creates a new pitched note.
     *
     * @param note The Note the pitched note should be.
     * @param tuning The tuning system the pitched note should use.
     */
    createPitchedNote: function({note, tuning}) {
        let pitchedNote = Object.create(this);
        pitchedNote.note = note;
        pitchedNote.tuning = tuning;
        return pitchedNote;
    },
    getFrequency: function() {
        return this.tuning.frequencyOf(this.note);
    }
}

/**
 * A note which has a pitch and a start and end beat.
 */
let SequencedNote = {
    /**
     * Creates a new sequenced note.
     *
     * @param note The PitchedNote this note should be.
     * @param startBeat The beat this note starts at.
     * @param length The length of this note, in beats.
     */
    init: function({note, startBeat, length}) {
        this.note = note;
        this.start = startBeat;
        this.end = this.start + length;
    },
    get frequency: function() {
        return this.note.getFrequency();
    },
    get length() {
        return this.end - this.start;
    }
}

/**
 * A basic representation of a sequence of notes, that uses a linear search to find and add notes.
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
        this.notes.splice(position, 0, createNote({start: start, length: length, number: number}));
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

/**
 * Maps note numbers to frequencies using 440 Hz as the frequency for A4.
 *
 * A4 is assigned the note number 0, and each note number represents a
 * distance in semitones from this number (positive numbers correspond to
 * notes higher than A4, and negative numbers to notes lower than A4).
 *
 * For example, A3 is note number -12 and B4 is note number 2.
 */
let EqualTemperament = {
    referenceFreq: 440,
    /**
     * Calculates the frequency for a specific note number.
     *
     * @param noteNumber The number to give the frequency for.
     */
    frequencyOf: function(noteNumber) {
        return this.referenceFreq * Math.pow(2, noteNumber / 12);
    }
};

/**
 * Converts note numbers within an octave scale to frequencies, according to
 * a tuning system.
 */
let OctaveScale = {
    /**
     * Returns the frequency of a given note number.
     *
     * @param noteNumber The number to find the frequency of.
     * @return The frequency of the given note.
     */
    frequencyOf: function(noteNumber) {
        let divide = Math.trunc(noteNumber / this.notes.length);
        let mod = noteNumber % this.notes.length;

        let extendedNoteNumber = (divide + this.octave) * 12 + this.notes[mod];

        return this.tuningSystem.frequencyOf(extendedNoteNumber);
    },
    /**
     * Creates a new octave scale.
     *
     * @param scaleNotes The notes the scale should contain.
     * @param tuningSystem The tuning system that should be used to convert note numbers to frequencies.
     * @param octave An offset to use for the octave of the scale. For example, an offset value of 1 shifts every note up an octave.
     * @return A new octave scale.
     */
    createScale: function({
            scaleNotes,
            tuningSystem=EqualTemperament,
            octave=0,
        }) {
        let newScale = Object.create(this);
        newScale.tuningSystem = tuningSystem;
        newScale.notes = scaleNotes;
        newScale.octave = octave;
        return newScale;
    }
};

export default {
    /**
     * Creates a new octave scale, which is a scale whose notes repeat every octave.
     *
     * @param scaleNotes The intervals contained in the scale.
     * @param tuningSystem A mapping of note numbers to frequencies. Defaults to 12-tone equal temperament.
     * @param octave An octave offset – a value of 1 shifts all notes up an octave, for example.
     */
    createOctaveScale: function({scaleNotes, tuningSystem=EqualTemperament, octave=0}) {
        return OctaveScale.createScale({scaleNotes: scaleNotes, tuningSystem: tuningSystem, octave: octave});
    },
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
