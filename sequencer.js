/**
 * Plays through a sequence of notes.
 */
let Sequencer = {
    /**
     * Initialises the sequencer and creates an audio context for it.
     *
     * @param scale A scale object that maps note numbers to frequencies.
     * @param initialBpm The initial tempo the sequencer should use, in beats
     *        per minute.
     * @param audioContext {AudioContext} The audio context the sequencer should use.
     * @param noteSequence The sequence of notes the sequencer should play.
     */
    init: function(scale, initialBpm, audioContext, noteSequence) {
       this.audioContext = audioContext;
       this.output = this.audioContext.createGain();
       this.output.gain.value = 0.25;
       this.output.connect(this.audioContext.destination);
       this.scale = scale;
       this.timeline = Object.create(BeatTimeline);
       this.timeline.init({
           beatsPerMinute: initialBpm,
           referenceTime: this.audioContext.currentTime,
       })
       this.noteSequence = noteSequence;
    },
    playing: false,
    lookahead: 0.1,
    scheduleIntervalMs: 25,
    /**
     * The current tempo the sequencer is set to, in beats per minute.
     */
    get tempo() {
        return this.timeline.beatsPerMinute;
    },
    /**
     * The next beat to be scheduled.
     */
    beatNumber: 0,
    /**
     * Schedules upcoming notes for playback.
     */
    scheduleNotes: function() {
        let startBeat = this.beatNumber;
        let endBeat = this.timeline.beatFor(this.audioContext.currentTime + this.lookahead);
        let notes = this.noteSequence.getNotes({startBeat: startBeat, endBeat: endBeat});
        for (let thisNote of notes) {
            let oscillator = this.audioContext.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.value = this.scale.frequencyOf(thisNote.number);

            oscillator.connect(this.output);
            oscillator.start(this.timeline.timeFor(thisNote.start));
            oscillator.stop(this.timeline.timeFor(thisNote.start + thisNote.length));
        }
        this.updateBeat(endBeat);
    },
    /**
     * Updates the last-scheduled beat, and loops the sequence if needed.
     */
    updateBeat: function(newBeat) {
        this.beatNumber = newBeat;
        if (this.beatNumber >= 8) {
            this.beatNumber = 0;
            this.timeline = this.timeline.copyTimeShifted({beatDelay: 8});
        }
    },
    /**
     * Starts playback.
     *
     * @param secondsFromNow A number of seconds into the future to schedule the
     *        starting of playback.
     */
    play: function(secondsFromNow = 0) {
        if (this.playing !== false) {
            return;
        }
        let playFunction = function() {
            this.intervalID = window.setInterval(this.scheduleNotes.bind(this), this.scheduleIntervalMs);
            this.playing = true;
        };

        this.timeline = this.timeline.copyStartingAt({
            referenceTime: this.audioContext.currentTime,
            referenceBeat: this.resumeBeat,
        });
        window.setTimeout(playFunction.bind(this), secondsFromNow * 1000);
    },
    /**
     * Pauses playback.
     *
     * @param secondsFromNow A number of seconds into the future to schedule the
     *        pausing of playback.
     */
    pause: function(secondsFromNow = 0) {
        if (this.playing === false) {
            return;
        }
        let pauseFunction = function() {
            window.clearInterval(this.intervalID);
            this.playing = false;
        };
        window.setTimeout(pauseFunction.bind(this), secondsFromNow * 1000);
        this.resumeBeat = this.timeline.beatFor(this.audioContext.currentTime);
    },
    /**
     * Stops playback.
     *
     * @param secondsFromNow A number of seconds into the future to schedule the
     *        stopping of playback.
     */
    stop: function(secondsFromNow = 0) {
        let stopFunction = function() {
            if (this.playing === true) {
                this.pause();
            }
            this.resumeBeat = 0;
            this.beatNumber = 0;
        };
        window.setTimeout(stopFunction.bind(this), secondsFromNow * 1000);
    },
    /**
     * Changes the tempo at which the current sequence is being played.
     *
     * The tempo change will be applied from the next beat.
     *
     * @param newTempo {number} The new tempo to play the sequence at, in
     *    beats per minute.
     */
    changeTempo: function(newTempo) {
        this.timeline = this.timeline.withTempo(newTempo, this.beatNumber);
    }
};

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

/**
 * Links beats to times, defining a playback of a sequence.
 */
let BeatTimeline = {
    /**
     * Initialises the timeline.
     *
     * @param beatsPerMinute The tempo to use for the timeline.
     * @param referenceBeat The beat to use as the reference.
     * @param referenceTime The time to use as the reference.
     */
    init: function({beatsPerMinute, referenceBeat = 0, referenceTime = 0}) {
        this.beatsPerMinute = beatsPerMinute;
        this.referenceBeat = referenceBeat;
        this.referenceTime = referenceTime;
    },
    /**
     * Returns the time for a specific beat number, in the timebase of AudioContext.currentTime().
     *
     * @param beatNumber The beat to find the time for.
     * @return The time for the beat.
     */
    timeFor: function(beatNumber) {
        let beatsSinceReference = beatNumber - this.referenceBeat;
        let secondsSinceReference = beatsSinceReference * 60 / this.beatsPerMinute;
        return this.referenceTime + secondsSinceReference;
    },
    /**
     * Returns the beat value for a given time value.
     *
     * @param time The time value to find the beat value for.
     * @return The beat value for the given time value.
     */
    beatFor: function(time) {
        let secondsSinceReference = time - this.referenceTime;
        let beatsSinceReference = secondsSinceReference * this.beatsPerMinute / 60;
        return this.referenceBeat + beatsSinceReference;
    },
    /**
     * Creates a copy of this timeline which has been shifted in time.
     *
     * Positive values for the parameters shift the copy later in time,
     * negative values shift it earlier.
     *
     * @param {number} [beatDelay=0] A number of beats (in this timeline’s
     *        scale) by which to delay this timeline.
     * @param {number} [timeDelay=0] A time by which to delay this timeline,
     *        in the base of {@link AudioContext.currentTime()}.
     * @returns {Object} A copy of this timeline which has been shifted in time.
     */
    copyTimeShifted: function({beatDelay = 0, timeDelay = 0}) {
        let newTimeline = Object.create(Object.getPrototypeOf(this));
        newTimeline.init({
            beatsPerMinute: this.beatsPerMinute,
            referenceBeat: this.referenceBeat,
            referenceTime: this.timeFor(this.referenceBeat + beatDelay) + timeDelay,
        });
        return newTimeline;
    },
    /**
     * Creates a copy of this timeline with a new reference.
     *
     * @param referenceTime The time value to use for the new timeline’s reference.
     * @param referenceBeat The beat value to use for the new timeline’s reference. Defaults to 0.
     * @return A copy of this timeline, using the specified reference.
     */
    copyStartingAt: function({referenceTime, referenceBeat = 0}) {
        let newTimeline = Object.create(Object.getPrototypeOf(this));
        newTimeline.init({
            beatsPerMinute: this.beatsPerMinute,
            referenceBeat: referenceBeat,
            referenceTime: referenceTime,
        });
        return newTimeline;
    },
    /**
     * Creates a copy of this timeline with a new tempo.
     *
     * @param {number} newTempo The tempo the copy should use, in beats per
     *     minute.
     * @param {number} fromBeat The beat from which the tempo change should
     *    be applied.
     * @return A copy of this timeline, with the new tempo.
     */
    withTempo: function(newTempo, fromBeat) {
        let newTimeline = Object.create(Object.getPrototypeOf(this));
        newTimeline.init({
            beatsPerMinute: newTempo,
            referenceBeat: fromBeat,
            referenceTime: this.timeFor(fromBeat),
        });
        return newTimeline;
    }
};

export default {
    /**
     * Creates a new sequencer, an object which plays a sequence of notes.
     *
     * @param scale The scale to use to map note numbers to frequencies.
     * @param tempo The initial tempo to set the sequencer to, in beats per minute.
     * @param audioContext {AudioContext} The audio context the sequencer should use.
     * @param noteSequence The sequence of notes the sequencer should play.
     */
    createSequencer: function({scale, tempo, audioContext, noteSequence}) {
        let sequencer = Object.create(Sequencer);
        sequencer.init(scale, tempo, audioContext, noteSequence);
        return sequencer;
    },
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
