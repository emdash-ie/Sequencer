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
     */
    init: function(scale, initialBpm) {
       this.output = this.audioContext.createGain();
       this.output.gain.value = 0.25;
       this.output.connect(this.audioContext.destination);
       this.scale = scale;
       this.timeline = Object.create(BeatTimeline);
       this.timeline.init({
           beatsPerMinute: initialBpm,
           referenceTime: this.audioContext.currentTime,
       })
    },
    audioContext: new AudioContext(),
    timeline: null,
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
     * The time that the next note will be scheduled to play.
     */
    get nextNoteTime() {
        return this.timeline.timeFor(this.beatNumber);
    },
    /**
     * The current beat.
     */
    beatNumber: 0,
    /**
     * The sequence of notes the sequencer plays.
     */
    notes: [
        [
            {
                length: 2,
                note: 0,
            },
        ],
        [],
        [
            {
                length: 2,
                note: 1,
            },
        ],
        [],
        [
            {
                length: 2,
                note: 2,
            },
        ],
        [],
        [
            {
                length: 1,
                note: 3,
            },
        ],
        [
            {
                length: 1,
                note: 4,
            },
        ],
    ],
    /**
     * Periodically schedules upcoming notes for playback.
     */
    scheduleNotes: function() {
        while (this.nextNoteTime < this.audioContext.currentTime + this.lookahead) {
            for (let thisNote of this.notes[this.beatNumber]) {
                let oscillator = this.audioContext.createOscillator();
                oscillator.type = 'sine';
                oscillator.frequency.value = this.scale.frequencyOf(thisNote.note);

                oscillator.connect(this.output);
                oscillator.start(this.nextNoteTime);
                oscillator.stop(this.nextNoteTime + this.noteLength(thisNote.length));
            }
            this.nextNote();
        }
    },
    /**
     * Moves on to the next note in the sequence.
     */
    nextNote: function() {
        this.beatNumber++;
        if (this.beatNumber >= 8) {
            this.beatNumber %= 8;
            this.timeline = this.timeline.copyTimeShifted({beatDelay: 8});
        }
    },
    /**
     * Calculates the length in time of a number of beats.
     *
     * This functionality will shortly be moved to the timeline object.
     *
     * @param beats A length in beats to convert to seconds.
     */
    noteLength: function(beats) {
        let secondsPerQuaver = 60 / this.tempo / 2;
        return beats * secondsPerQuaver;
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
        window.setTimeout(playFunction.bind(this), secondsFromNow * 1000);

        this.timeline = this.timeline.copyStartingAt({
            referenceBeat: this.beatNumber,
            referenceTime: this.audioContext.currentTime,
        });
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
            this.beatNumber = 0;
        };
        window.setTimeout(stopFunction.bind(this), secondsFromNow * 1000);
    }
};

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
    frequencyOf: function(noteNumber) {
        let divide = Math.trunc(noteNumber / this.notes.length);
        let mod = noteNumber % this.notes.length;

        let extendedNoteNumber = (divide + this.octave) * 12 + this.notes[mod];

        return this.tuningSystem.frequencyOf(extendedNoteNumber);
    },
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

let BeatTimeline = {
    init: function({beatsPerMinute, referenceBeat = 0, referenceTime = 0}) {
        this.beatsPerMinute = beatsPerMinute;
        this.referenceBeat = referenceBeat;
        this.referenceTime = referenceTime;
    },
    timeFor: function(beatNumber) {
        let beatsSinceReference = beatNumber - this.referenceBeat;
        let secondsSinceReference = beatsSinceReference * 60 / this.beatsPerMinute;
        return this.referenceTime + secondsSinceReference;
    },
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
};

let MajorPentatonicScale = OctaveScale.createScale({scaleNotes: [0, 2, 4, 7, 9], octave: 0});

Sequencer.init(MajorPentatonicScale, 144);

let playButton = document.querySelector('#play');
let pauseButton = document.querySelector('#pause');
let stopButton = document.querySelector('#stop');

playButton.addEventListener('click', function() {Sequencer.play();}, false);
pauseButton.addEventListener('click', function() {Sequencer.pause();}, false);
stopButton.addEventListener('click', function() {Sequencer.stop();}, false);
