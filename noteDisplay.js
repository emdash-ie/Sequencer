/**
 * Displays notes from a note sequence in a canvas.
 */
export class NoteDisplay {
    constructor({canvas, noteSequence}) {
        this.context = canvas.getContext("2d");
        this.sequence = noteSequence;
        this.x = 0;
        this.y = 0;
        this.size = 20;
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
