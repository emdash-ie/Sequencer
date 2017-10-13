import Flero from "./sequencer.js";
let MajorPentatonicScale = Flero.createOctaveScale({scaleNotes: [0, 2, 4, 7, 9], octave: 0});

let audioContext = new AudioContext();
let sequencer = Flero.createSequencer({scale: MajorPentatonicScale, tempo: 144, audioContext: audioContext});

let playButton = document.querySelector('#play');
let pauseButton = document.querySelector('#pause');
let stopButton = document.querySelector('#stop');
let tempoControl = document.querySelector('#tempoControl');

playButton.addEventListener('click', function() {sequencer.play();}, false);
pauseButton.addEventListener('click', function() {sequencer.pause();}, false);
stopButton.addEventListener('click', function() {sequencer.stop();}, false);
tempoControl.addEventListener('input', function(e) {sequencer.changeTempo(e.target.value)}, false);
tempoControl.value = sequencer.tempo;
