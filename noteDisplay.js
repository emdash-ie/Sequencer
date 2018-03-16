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
		this.xSize = xSize
		this.ySize = ySize
		this.blocks = new Map()
		this.notes = new Map()
		this.converter = new ClippingLinearScaler({
			'beat': {
				'zero': 40,
				'scaling': 40,
				'clip': 20,
			},
			'pitch': {
				'zero': 400,
				'scaling': -20,
				'clip': 20,
			}
		})
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
			let startPosition = this.converter.outputValuesFor({
				beat: note.start,
				pitch: note.number
			})
			let endPosition = this.converter.outputValuesFor({
				beat: note.start + note.length,
				pitch: note.number + 1
			})
			let block = new NoteBlock({
				top: startPosition.pitch,
				left: startPosition.beat,
				height: Math.abs(endPosition.pitch - startPosition.pitch),
				width: Math.abs(endPosition.beat - startPosition.beat),
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
		let blockId = Number(event.dataTransfer.getData('application/note-id'))
		let block = this.blocks.get(blockId)
		const newValues = this.converter.inputValuesFor({
			'beat': event.clientX - block.dragOffset.x,
			'pitch': event.clientY - block.dragOffset.y
		})
		this.sequence.moveNote({
			note: this.notes.get(blockId),
			newStart: newValues.beat,
			newPitch: newValues.pitch
		})
	}

	/**
	 * Adds a note to the note sequence when the grid is clicked.
	 *
	 * @param  {MouseEvent} clickEvent The click event that was fired.
	 */
	clickListener(clickEvent) {
		const [x, y] = [clickEvent.clientX, clickEvent.clientY]
		if (this.pointNotCovered(x, y)) {
			const {beat, pitch} = this.converter.inputValuesFor({
				'beat': x,
				'pitch': y,
			})
			this.sequence.addNote({
				start: beat,
				number: pitch,
				length: 1,
			})
		}
	}

	/**
	 * Checks whether a point onscreen is not covered by a block.
	 *
	 * @param  {Number} x The x-coordinate of the point.
	 * @param  {Number} y The y-coordinate of the point.
	 * @return {Boolean} True if the point is not covered, false if it is.
	 */
	pointNotCovered(x, y) {
		for (const [id, block] of this.blocks) {
			if (block.overlapsWith(x, y)) {
				return false
			}
		}
		return true
	}

	/**
         * Responds to a change in the note sequence.
         */
	notify() {
		this.deleteBlocks()
		this.drawNotes()
	}
}

/**
 * Converts units using linear relationships.
 *
 * @param units An object where each property describes a unit to provide
 *            scaling for.
 */
class LinearScaler {
	constructor(units) {
		this.units = units
	}

	/**
         * Calculates the output values for a set of input values.
         */
	outputValuesFor(inputValues) {
		let outputValues = {}

		for (let unit in inputValues) {
			if (this.units[unit] != undefined) {
				outputValues[unit] = this.units[unit].zero
					+ this.units[unit].scaling * inputValues[unit]
			}
		}

		return outputValues
	}

	/**
         * Calculates the input values for a set of output values.
         */
	inputValuesFor(outputValues) {
		let inputValues = {}

		for (let unit in outputValues) {
			if (this.units[unit] != undefined) {
				inputValues[unit] = (outputValues[unit] - this.units[unit].zero)
                    / this.units[unit].scaling
			}
		}

		return inputValues
	}
}

class ClippingLinearScaler {
	constructor(units) {
		this.units = units
		this.scaler = new LinearScaler(units)
	}

	outputValuesFor(inputValues) {
		return this.scaler.outputValuesFor(inputValues)
	}

	inputValuesFor(outputValues) {
		for (const unit in outputValues) {
			outputValues[unit] = this.round({
				value: outputValues[unit],
				precision: this.units[unit].clip,
				offset: this.units[unit].zero,
			})
		}
		return this.scaler.inputValuesFor(outputValues)
	}

	round({value, precision, offset}) {
		let rounded = Math.round((value - offset) / precision)
		return (rounded * precision) + offset
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
		this.dragOffset = {
			'x': e.clientX - parseInt(this.element.style.left),
			'y': e.clientY - parseInt(this.element.style.top)
		}
	}

	overlapsWith(x, y) {
		return this.top < x && x < this.top + this.height
			&& this.left < y && y < this.left + this.width
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
