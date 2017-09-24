let Sequencer = {
    init: function(scale, initialBpm) {
       this.output = this.audioContext.createGain();
       this.output.gain.value = 0.25;
       this.output.connect(this.audioContext.destination);
       this.scale = scale;
       this.timeline = Object.create(BeatTimeline);
       this.timeline.init({
           audioContext: this.audioContext,
           beatsPerMinute: initialBpm,
       })
    },
    audioContext: new AudioContext(),
    timeline: null,
    playing: false,
    lookahead: 0.1,
    scheduleIntervalMs: 25,
    get tempo() {
        return this.timeline.beatsPerMinute;
    },
    get nextNoteTime() {
        return this.timeline.timeFor(this.beatNumber);
    },
    beatNumber: 0,
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
    nextNote: function() {
        this.beatNumber++;
        if (this.beatNumber >= 8) {
            this.beatNumber %= 8;
            this.timeline = this.timeline.copyTimeShifted({beatDelay: 8});
        }
    },
    noteLength: function(beats) {
        let secondsPerQuaver = 60 / this.tempo / 2;
        return beats * secondsPerQuaver;
    },
    play: function(secondsFromNow = 0) {
        if (this.playing !== false) {
            return;
        }
        let playFunction = function() {
            this.intervalID = window.setInterval(this.scheduleNotes.bind(this), this.scheduleIntervalMs);
            this.playing = true;
        };
        window.setTimeout(playFunction.bind(this), secondsFromNow * 1000);
    },
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

let EqualTemperament = {
    referenceFreq: 440,
    frequencyOf: function(noteNumber) {
        return this.referenceFreq * Math.pow(2, noteNumber / 12);
    }
};

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
        let newTimeline = Object.create(this);
        newTimeline.init({
            beatsPerMinute: this.beatsPerMinute,
            referenceBeat: this.referenceBeat,
            referenceTime: this.timeFor(this.referenceBeat + beatDelay) + timeDelay,
        });
        return newTimeline;
    }
};

let MajorPentatonicScale = OctaveScale.createScale({scaleNotes: [0, 2, 4, 7, 9], octave: 0});

Sequencer.init(MajorPentatonicScale, 144);

Sequencer.play();