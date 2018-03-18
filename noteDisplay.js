/**
 * Displays notes from a note sequence in a canvas.
 */
class NoteDisplay {
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
		this.surface = noteSurface
		this.surface.style.position = 'relative'
		this.addSurfaceListeners()
		this.sequence = noteSequence
		this.xGridSize = xSize
		this.yGridSize = ySize
		this.blocks = new Map()
		this.notes = new Map()
		this.sequence.addChangeListener(this)
	}

	/**
         * Adds the drag-and-drop listeners to the surface.
         */
	addSurfaceListeners() {
		let s = this.surface
		s.addEventListener('dragenter', this.dragOverListener, false)
		s.addEventListener('dragover', this.dragOverListener, false)
		s.addEventListener('drop', this.dropListener.bind(this), false)
		s.addEventListener('click', this.clickListener.bind(this), false)
	}

	/**
         * Draws the notes onscreen.
         */
	drawNotes() {
		let notes = this.sequence.getNotes({startBeat: 0, endBeat: 8})

		for (let note of notes) {
			const {top, right, bottom, left} = this.rectFromNote({
				start: note.start,
				length: note.length,
				pitch: note.number,
			})
			let block = new NoteBlock({
				top,
				left,
				height: bottom - top,
				width: right - left,
				unit: 'px',
			})
			this.blocks.set(block.id, block)
			this.notes.set(block.id, note)
			block.displayOn(this.surface)
		}
	}

	deleteBlocks() {
		for (let [key, value] of this.blocks.entries()) {
			value.delete()
			this.blocks.delete(key)
		}
	}

	dragOverListener(event) {
		if ([...event.dataTransfer.types].includes('application/note-id')) {
			event.preventDefault()
		}
	}

	dropListener(event) {
		let blockID = Number(event.dataTransfer.getData('application/note-id'))
		const beat = this.xToBeat(event.clientX)
		const pitch = this.yToPitch(event.clientY)
		this.sequence.moveNote({
			note: this.notes.get(blockID),
			newStart: beat,
			newPitch: pitch
		})
	}

	/**
	 * Adds a note to the note sequence when the grid is clicked.
	 *
	 * @param  {MouseEvent} click The click event that was fired.
	 */
	clickListener(click) {
		if (click.target == click.currentTarget) {
			const beat = this.xToBeat(click.clientX)
			const pitch = this.yToPitch(click.clientY)
			this.sequence.addNote({
				start: beat,
				number: pitch,
				length: 1,
			})
		} else {
			const note = this.notes.get(Number(click.target.dataset.blockID))
			this.sequence.removeNote(note)
		}
	}

	/**
         * Responds to a change in the note sequence.
         */
	notify() {
		this.deleteBlocks()
		this.drawNotes()
	}

	get yZero() {
		return this.surface.getBoundingClientRect().bottom
	}

	yToPitch(yCoordinate) {
		return Math.floor((this.yZero - yCoordinate) / this.yGridSize)
	}

	pitchToY(pitch) {
		return this.yZero - (pitch * this.yGridSize)
	}

	get xZero() {
		return this.surface.getBoundingClientRect().left
	}

	xToBeat(xCoordinate) {
		return Math.floor((xCoordinate - this.xZero) / this.xGridSize)
	}

	beatToX(beat) {
		return (beat * this.xGridSize) + this.xZero
	}

	rectFromNote({start, length, pitch}) {
		return {
			top: this.pitchToY(pitch + 1),
			right: this.beatToX(start + length),
			bottom: this.pitchToY(pitch),
			left: this.beatToX(start),
		}
	}
}

/**
 * A block representing a note in a note sequence.
 */
class NoteBlock {
	/**
         * Creates a new note block for a specific note.
         *
         * @param top The “top” value the block’s DOM element should have.
         * @param left The “left” value the block’s DOM element should have.
         * @param height The “height” value the block’s DOM element should have.
         * @param width The “width” value the block’s DOM element should have.
         * @param unit The unit the block’s DOM element should use, e.g. "px" or
         *        "em".
         */
	constructor({top, left, height, width, unit}) {
		this.id = NoteBlock.nextId()

		this.top = top
		this.left = left
		this.height = height
		this.width = width

		this.element = document.createElement('div')
		this.element.style.position = 'absolute'
		this.element.style.height = height + unit
		this.element.style.width = width + unit
		this.element.style.left = left + unit
		this.element.style.top = top + unit
		this.element.style.background = 'blue'
		this.element.dataset.blockID = this.id

		this.element.setAttribute('draggable', 'true')
		this.element.addEventListener(
			'dragstart',
			this.dragListener.bind(this),
			false
		)
	}

	/**
         * Displays the block on a surface.
         */
	displayOn(surface) {
		surface.appendChild(this.element)
	}

	delete() {
		this.element.parentNode.removeChild(this.element)
	}

	dragListener(e) {
		e.dataTransfer.setData('application/note-id', this.id)
	}
}

/**
 * Generates ids for the noteblocks.
 */
NoteBlock.idGenerator = function*() {
	let i = 0
	while (true) {
		yield i
		i++
	}
}()

/**
 * Returns the next noteblock id.
 */
NoteBlock.nextId = function() {
	return NoteBlock.idGenerator.next().value
}

module.exports = NoteDisplay
