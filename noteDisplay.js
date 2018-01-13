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
        this.addSurfaceListeners();
        this.sequence = noteSequence;
        this.xSize = xSize;
        this.ySize = ySize;
        this.blocks = new Map();
        this.notes = new Map();
    }

    /**
     * Adds the drag-and-drop listeners to the surface.
     */
    addSurfaceListeners() {
        let s = this.surface;
        s.addEventListener('dragenter', this.dragOverListener, false);
        s.addEventListener('dragover', this.dragOverListener, false);
        s.addEventListener('drop', this.dropListener.bind(this), false);
    }

    /**
     * Draws the notes onscreen.
     */
    drawNotes() {
        let notes = this.sequence.getNotes({startBeat: 0, endBeat: 8});

        for (let note of notes) {
            let block = new NoteBlock({
                note: note,
                xSize: this.xSize,
                ySize: this.ySize
            });
            this.blocks.set(block.id, block);
            this.notes.set(block.id, note);
            block.displayOn(this.surface);
        }
    }

    dragOverListener(event) {
        if ([...event.dataTransfer.types].includes('application/note-id')) {
            event.preventDefault();
        }
    }

    dropListener(event) {
        let blockId = Number(event.dataTransfer.getData('application/note-id'));
        this.noteSequence.moveNote({
            note: this.notes.get(blockId),
            newStart: 0
        });
    }
}

/**
 * A block representing a note in a note sequence.
 */
class NoteBlock {
    /**
     * Creates a new note block for a specific note.
     */
    constructor({note, xSize, ySize}) {
        this.note = note;
        this.id = NoteBlock.nextId();

        this.element = document.createElement('div');
        this.element.style.position = 'absolute';
        this.element.style.height = ySize + 'px';
        this.element.style.width = (note.length * xSize) + 'px';
        this.element.style.left = (note.start * xSize) + 'px';
        this.element.style.top = (400 - (note.number * ySize)) + 'px';
        this.element.style.background = 'blue';

        this.element.setAttribute('draggable', 'true');
        this.element.addEventListener(
            'dragstart',
            this.dragListener.bind(this),
            false
        );
    }

    /**
     * Displays the block on a surface.
     */
    displayOn(surface) {
        surface.appendChild(this.element);
    }

    dragListener(e) {
        e.dataTransfer.setData('application/note-id', this.id)
    }
}

/**
 * Generates ids for the noteblocks.
 */
NoteBlock.idGenerator = function*() {
    let i = 0;
    while (true) {
        yield i;
        i++;
    }
}();

/**
 * Returns the next noteblock id.
 */
NoteBlock.nextId = function() {
    return NoteBlock.idGenerator.next().value;
};
