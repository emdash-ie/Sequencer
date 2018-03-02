/**
 * A basic note, which has a starting beat, a length, and a note number.
 *
 * @typedef {Object} BasicNote
 * @property {number} start - The beat the note starts at.
 * @property {number} length - The length of the note, in beats.
 * @property {number} number - The note number of the note.
 */

/**
 * Creates a new note.
 *
 * @param start The beat the note should start at.
 * @param length The length of the note, in beats.
 * @param number The note number of the note.
 */
function createNote({start=0, length=1, number=0}) {
	return {start: start, length: length, number: number}
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
		let pitchedNote = Object.create(this)
		pitchedNote.note = note
		pitchedNote.tuning = tuning
		return pitchedNote
	},
	getFrequency: function() {
		return this.tuning.frequencyOf(this.note)
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
		this.note = note
		this.start = startBeat
		this.end = this.start + length
	},
	get frequency() {
		return this.note.getFrequency()
	},
	get length() {
		return this.end - this.start
	}
}

module.exports = {
	/**
         * Create a new note.
         */
	createNote: createNote,
}
