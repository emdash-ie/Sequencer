/**
 * Displays notes from a note sequence in a canvas.
 */
export class NoteDisplay {
    /**
     * Creates a new NoteDisplay.
     *
     * @param noteSurface The element within which the notes should be created.
     * @param noteSequence The sequence of notes to be displayed.
     * @param xSize The size used to represent 1 beat when drawing, in pixels.
     * @param ySize The size used to represent 1 unit of pitch when drawing, in
     *        pixels.
     */
    constructor({noteSurface, noteSequence, xSize=40, ySize=20}) {
        this.surface = noteSurface;
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
            let node = document.createElement('div');
            node.style.position = 'absolute';
            node.style.height = this.ySize + 'px';
            node.style.width = (note.length * this.xSize) + 'px';
            node.style.left = (note.start * this.xSize) + 'px';
            node.style.top = (400 - (note.number * this.ySize)) + 'px';
            node.style.background = 'blue';
            this.surface.appendChild(node);
        }
    }
}
