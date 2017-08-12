let Sequencer = {
    init: function() {
       this.output = this.audioContext.createGain();
       this.output.gain.value = 0.25;
       this.output.connect(this.audioContext.destination);
    },
    audioContext: new AudioContext(),
    lookahead: 0.1,
    scheduleIntervalMs: 25,
    tempo: 144,
    nextNoteTime: 1,
    beatNumber: 0,
    notes: [
        [
            {
                length: 1,
                frequency: 800,
            },
        ],
        [
            {
                length: 1,
                frequency: 200,
            },
        ],
        [
            {
                length: 4,
                frequency: 700,
            },
        ],
        [],
        [],
        [],
        [
            {
                length: 1,
                frequency: 400,
            },
        ],
        [
            {
                length: 1,
                frequency: 320,
            },
        ],
    ],
    scheduleNotes: function() {
        while (this.nextNoteTime < this.audioContext.currentTime + this.lookahead) {
            for (let thisNote of this.notes[this.beatNumber]) {
                let oscillator = this.audioContext.createOscillator();
                oscillator.type = 'sine';
                oscillator.frequency.value = thisNote.frequency;

                oscillator.connect(this.output);
                oscillator.start(this.nextNoteTime);
                console.log('Note to start at ' + this.nextNoteTime);
                oscillator.stop(this.nextNoteTime + this.noteLength(thisNote.length));
                console.log('Note to finish at ' + this.noteLength(thisNote.length));
            }
            this.nextNote();
        }
    },
    nextNote: function() {
        let secondsPerBeat = 60 / this.tempo;
        this.nextNoteTime += secondsPerBeat / 2;
        this.beatNumber = (this.beatNumber + 1) % 8;
    },
    noteLength: function(beats) {
        let secondsPerQuaver = 60 / this.tempo / 2;
        return beats * secondsPerQuaver;
    },
};

Sequencer.init();

let boundSchedule = Sequencer.scheduleNotes.bind(Sequencer);

window.setInterval(boundSchedule, Sequencer.scheduleIntervalMs);