/**
 * Displays notes from a note sequence in a canvas.
 */
export class NoteDisplay {
    /**
     * Creates a new NoteDisplay.
     *
     * @param canvas The canvas on which to display the notes.
     * @param noteSequence The sequence of notes to be displayed.
     * @param xSize The size used to represent 1 beat when drawing, in pixels.
     * @param ySize The size used to represent 1 unit of pitch when drawing, in
     *        pixels.
     */
    constructor({canvas, noteSequence, xSize=40, ySize=20}) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.sequence = noteSequence;
        this.xSize = xSize;
        this.ySize = ySize;
    }
    /**
     * Draws the notes onscreen.
     */
    drawNotes() {
        let notes = this.sequence.getNotes({startBeat: 0, endBeat: 8});

        for (let note of notes) {
            this.context.fillRect(
                note.start * this.xSize,
                this.canvas.height - (note.number * this.ySize),
                note.length * this.xSize,
                this.ySize
            );
        }
    }
}
