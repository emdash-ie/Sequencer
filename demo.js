import Sequencer from "./sequencer.js";
import Note from "./note.js";
import NoteSequence from "./noteSequence.js";
import Tuning from "./tuning.js";

let MajorPentatonicScale = Tuning.createOctaveScale(
    {
        scaleNotes: [0, 2, 4, 7, 9],
        octave: 0
    }
);

let noteSequence = NoteSequence.createEmptyNoteSequence();
let notes = [
    {start: 0, length: 1, number: 1},
    {start: 1, length: 1, number: 2},
    {start: 2, length: 1, number: 3},
    {start: 3, length: 1, number: 4},
    {start: 5, length: 1, number: 2},
    {start: 6, length: 1, number: 3},
];

for (let note of notes) {
    noteSequence.addNote(note);
}

let audioContext = new AudioContext();
let sequencer = Sequencer.createSequencer(
    {scale: MajorPentatonicScale, tempo: 144,
        audioContext: audioContext, noteSequence: noteSequence}
);

let playButton = document.querySelector('#play');
let pauseButton = document.querySelector('#pause');
let stopButton = document.querySelector('#stop');
let tempoControl = document.querySelector('#tempoControl');

playButton.addEventListener('click', function() {sequencer.play();}, false);
pauseButton.addEventListener('click', function() {sequencer.pause();}, false);
stopButton.addEventListener('click', function() {sequencer.stop();}, false);
tempoControl.addEventListener(
    'input',
    function(e) {
        sequencer.changeTempo(e.target.value)
    },
    false
);
tempoControl.value = sequencer.tempo;
