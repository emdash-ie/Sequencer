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
		return this.referenceFreq * Math.pow(2, noteNumber / 12)
	}
}

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
		let divide = Math.trunc(noteNumber / this.notes.length)
		let mod = noteNumber % this.notes.length

		let extendedNoteNumber = (divide + this.octave) * 12 + this.notes[mod]

		return this.tuningSystem.frequencyOf(extendedNoteNumber)
	},
	/**
	 * Creates a new octave scale.
	 *
	 * @param scaleNotes The notes the scale should contain.
	 * @param tuningSystem The tuning system that should be used to convert note
	 *        numbers to frequencies.
	 * @param octave An offset to use for the octave of the scale. For example,
	 *        an offset value of 1 shifts every note up an octave.
	 * @return A new octave scale.
	 */
	createScale: function({
		scaleNotes,
		tuningSystem=EqualTemperament,
		octave=0,
	}) {
		let newScale = Object.create(this)
		newScale.tuningSystem = tuningSystem
		newScale.notes = scaleNotes
		newScale.octave = octave
		return newScale
	}
}

module.exports = {
	/**
	 * The equal temperament tuning system.
	 */
	equalTemperament: EqualTemperament,
	/**
	 * Creates a new octave scale, which is a scale whose notes repeat every
	 * octave.
	 *
	 * @param scaleNotes The intervals contained in the scale.
	 * @param tuningSystem A mapping of note numbers to frequencies. Defaults to
	 *        12-tone equal temperament.
	 * @param octave An octave offset – a value of 1 shifts all notes up an
	 * octave, for example.
	 */
	createOctaveScale: function({scaleNotes, tuningSystem=EqualTemperament,
		octave=0}) {
		return OctaveScale.createScale({
			scaleNotes: scaleNotes,
			tuningSystem: tuningSystem,
			octave: octave
		})
	},
}
