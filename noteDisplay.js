/**
 * Displays notes from a note sequence in a canvas.
 */
export class NoteDisplay {
    /**
     * Creates a new NoteDisplay.
     *
     * @param canvas The canvas on which to display the notes.
     * @param noteSequence The sequence of notes to be displayed.
     * @param beatSize The size used to represent 1 beat when drawing.
     */
    constructor({canvas, noteSequence, beatSize=20}) {
        this.context = canvas.getContext("2d");
        this.sequence = noteSequence;
        this.size = beatSize;
        this.x = 0;
        this.y = 0;
    }
    /**
     * Draws the notes onscreen.
     */
    drawNotes() {
        let notes = this.sequence.getNotes({startBeat: 0, endBeat: 8});

        for (let note of notes) {
            this.context.fillRect(this.x, this.y, this.size, this.size);
            this.x += this.size;
            this.y += this.size;
        }
    }
}
