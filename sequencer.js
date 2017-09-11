let Sequencer = {
    init: function(scale) {
       this.output = this.audioContext.createGain();
       this.output.gain.value = 0.25;
       this.output.connect(this.audioContext.destination);
       this.scale = scale;
       this.beatGrid = Object.create(BeatGrid);
    },
    audioContext: new AudioContext(),
    beatGrid: null,
    playing: false,
    lookahead: 0.1,
    scheduleIntervalMs: 25,
    get tempo() {
        return this.beatGrid.beatsPerMinute;
    },
    get nextNoteTime() {
        return this.beatGrid.timeFor(this.beatNumber);
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
        this.beatNumber = (this.beatNumber + 1) % 8;
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

let BeatGrid = {
    beatsPerMinute: 144,
    zeroTime: 0,
    timeFor: function(beatNumber) {
        let secondsSinceZeroBeat = 60 * beatNumber / this.beatsPerMinute;
        return this.zeroTime + secondsSinceZeroBeat;
    },
    beatFor: function(time) {
        let secondsSinceZeroBeat = time - this.zeroTime;
        return secondsSinceZeroBeat * this.beatsPerMinute / 60;
    },
    changeTempo: function(newTempo) {
        let currentTime = this.audioContext.currentTime;
        let currentBeat = this.beatFor(currentTime);

        this.zeroTime = currentTime - (60 * currentBeat / newTempo);
        this.beatsPerMinute = newTempo;
    }
};

let MajorPentatonicScale = OctaveScale.createScale({scaleNotes: [0, 2, 4, 7, 9], octave: 0});

Sequencer.init(MajorPentatonicScale);

Sequencer.play(0.1);
Sequencer.pause(5);
window.setTimeout(function() {Sequencer.play(1);}, 5500);
window.setTimeout(function() {Sequencer.stop();}, 8000);
window.setTimeout(function() {Sequencer.play(1);}, 8500);