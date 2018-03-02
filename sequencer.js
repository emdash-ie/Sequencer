/**
 * Plays through a sequence of notes.
 */
let Sequencer = {
	/**
	 * Initialises the sequencer and creates an audio context for it.
	 *
	 * @param scale A scale object that maps note numbers to frequencies.
	 * @param initialBpm The initial tempo the sequencer should use, in beats
	 *        per minute.
	 * @param audioContext {AudioContext} The audio context the sequencer should
	 *        use.
	 * @param noteSequence The sequence of notes the sequencer should play.
	 */
	init: function(scale, initialBpm, audioContext, noteSequence) {
		this.audioContext = audioContext
		this.output = this.audioContext.createGain()
		this.output.gain.value = 0.25
		this.output.connect(this.audioContext.destination)
		this.scale = scale
		this.timeline = Object.create(BeatTimeline)
		this.timeline.init({
			beatsPerMinute: initialBpm,
			referenceTime: this.audioContext.currentTime,
		})
		this.noteSequence = noteSequence
	},
	playing: false,
	lookahead: 0.1,
	scheduleIntervalMs: 25,
	/**
	 * The current tempo the sequencer is set to, in beats per minute.
	 */
	get tempo() {
		return this.timeline.beatsPerMinute
	},
	/**
	 * The next beat to be scheduled.
	 */
	beatNumber: 0,
	/**
	 * Schedules upcoming notes for playback.
	 */
	scheduleNotes: function() {
		let startBeat = this.beatNumber
		let endBeat = this.timeline.beatFor(
			this.audioContext.currentTime + this.lookahead
		)
		let notes = this.noteSequence.getNotes(
			{
				startBeat: startBeat,
				endBeat: endBeat
			}
		)
		for (let thisNote of notes) {
			let oscillator = this.audioContext.createOscillator()
			oscillator.type = 'sine'
			oscillator.frequency.value =
                this.scale.frequencyOf(thisNote.number)

			oscillator.connect(this.output)
			oscillator.start(this.timeline.timeFor(thisNote.start))
			oscillator.stop(
				this.timeline.timeFor(
					thisNote.start + thisNote.length
				)
			)
		}
		this.updateBeat(endBeat)
	},
	/**
	 * Updates the last-scheduled beat, and loops the sequence if needed.
	 */
	updateBeat: function(newBeat) {
		this.beatNumber = newBeat
		if (this.beatNumber >= 8) {
			this.beatNumber = 0
			this.timeline = this.timeline.copyTimeShifted({beatDelay: 8})
		}
	},
	/**
	 * Starts playback.
	 *
	 * @param secondsFromNow A number of seconds into the future to schedule the
	 *        starting of playback.
	 */
	play: function(secondsFromNow = 0) {
		if (this.playing !== false) {
			return
		}
		let playFunction = function() {
			this.intervalID = window.setInterval(
				this.scheduleNotes.bind(this),
				this.scheduleIntervalMs
			)
			this.playing = true
		}

		this.timeline = this.timeline.copyStartingAt({
			referenceTime: this.audioContext.currentTime,
			referenceBeat: this.resumeBeat,
		})
		window.setTimeout(playFunction.bind(this), secondsFromNow * 1000)
	},
	/**
	 * Pauses playback.
	 *
	 * @param secondsFromNow A number of seconds into the future to schedule the
	 *        pausing of playback.
	 */
	pause: function(secondsFromNow = 0) {
		if (this.playing === false) {
			return
		}
		let pauseFunction = function() {
			window.clearInterval(this.intervalID)
			this.playing = false
		}
		window.setTimeout(pauseFunction.bind(this), secondsFromNow * 1000)
		this.resumeBeat = this.timeline.beatFor(this.audioContext.currentTime)
	},
	/**
	 * Stops playback.
	 *
	 * @param secondsFromNow A number of seconds into the future to schedule the
	 *        stopping of playback.
	 */
	stop: function(secondsFromNow = 0) {
		let stopFunction = function() {
			if (this.playing === true) {
				this.pause()
			}
			this.resumeBeat = 0
			this.beatNumber = 0
		}
		window.setTimeout(stopFunction.bind(this), secondsFromNow * 1000)
	},
	/**
	 * Changes the tempo at which the current sequence is being played.
	 *
	 * The tempo change will be applied from the next beat.
	 *
	 * @param newTempo {number} The new tempo to play the sequence at, in
	 *    beats per minute.
	 */
	changeTempo: function(newTempo) {
		this.timeline = this.timeline.withTempo(newTempo, this.beatNumber)
	}
}

/**
 * Links beats to times, defining a playback of a sequence.
 */
let BeatTimeline = {
	/**
	 * Initialises the timeline.
	 *
	 * @param beatsPerMinute The tempo to use for the timeline.
	 * @param referenceBeat The beat to use as the reference.
	 * @param referenceTime The time to use as the reference.
	 */
	init: function({beatsPerMinute, referenceBeat = 0, referenceTime = 0}) {
		this.beatsPerMinute = beatsPerMinute
		this.referenceBeat = referenceBeat
		this.referenceTime = referenceTime
	},
	/**
	 * Returns the time for a specific beat number, in the timebase of
	 * AudioContext.currentTime().
	 *
	 * @param beatNumber The beat to find the time for.
	 * @return The time for the beat.
	 */
	timeFor: function(beatNumber) {
		let beatsSinceReference = beatNumber - this.referenceBeat
		let secondsSinceReference
            = beatsSinceReference * 60 / this.beatsPerMinute
		return this.referenceTime + secondsSinceReference
	},
	/**
	 * Returns the beat value for a given time value.
	 *
	 * @param time The time value to find the beat value for.
	 * @return The beat value for the given time value.
	 */
	beatFor: function(time) {
		let secondsSinceReference = time - this.referenceTime
		let beatsSinceReference
            = secondsSinceReference * this.beatsPerMinute / 60
		return this.referenceBeat + beatsSinceReference
	},
	/**
	 * Creates a copy of this timeline which has been shifted in time.
	 *
	 * Positive values for the parameters shift the copy later in time,
	 * negative values shift it earlier.
	 *
	 * @param {number} [beatDelay=0] A number of beats (in this timeline’s
	 *        scale) by which to delay this timeline.
	 * @param {number} [timeDelay=0] A time by which to delay this timeline,
	 *        in the base of {@link AudioContext.currentTime()}.
	 * @returns {Object} A copy of this timeline which has been shifted in time.
	 */
	copyTimeShifted: function({beatDelay = 0, timeDelay = 0}) {
		let newTimeline = Object.create(Object.getPrototypeOf(this))
		newTimeline.init({
			beatsPerMinute: this.beatsPerMinute,
			referenceBeat: this.referenceBeat,
			referenceTime: this.timeFor(this.referenceBeat + beatDelay)
                + timeDelay,
		})
		return newTimeline
	},
	/**
	 * Creates a copy of this timeline with a new reference.
	 *
	 * @param referenceTime The time value to use for the new timeline’s
	 *        reference.
	 * @param referenceBeat The beat value to use for the new timeline’s
	 *        reference. Defaults to 0.
	 * @return A copy of this timeline, using the specified reference.
	 */
	copyStartingAt: function({referenceTime, referenceBeat = 0}) {
		let newTimeline = Object.create(Object.getPrototypeOf(this))
		newTimeline.init({
			beatsPerMinute: this.beatsPerMinute,
			referenceBeat: referenceBeat,
			referenceTime: referenceTime,
		})
		return newTimeline
	},
	/**
	 * Creates a copy of this timeline with a new tempo.
	 *
	 * @param {number} newTempo The tempo the copy should use, in beats per
	 *     minute.
	 * @param {number} fromBeat The beat from which the tempo change should
	 *    be applied.
	 * @return A copy of this timeline, with the new tempo.
	 */
	withTempo: function(newTempo, fromBeat) {
		let newTimeline = Object.create(Object.getPrototypeOf(this))
		newTimeline.init({
			beatsPerMinute: newTempo,
			referenceBeat: fromBeat,
			referenceTime: this.timeFor(fromBeat),
		})
		return newTimeline
	}
}

module.exports = {
	/**
	 * Creates a new sequencer, an object which plays a sequence of notes.
	 *
	 * @param scale The scale to use to map note numbers to frequencies.
	 * @param tempo The initial tempo to set the sequencer to, in beats per
	 *        minute.
	 * @param audioContext {AudioContext} The audio context the sequencer should
	 *        use.
	 * @param noteSequence The sequence of notes the sequencer should play.
	 */
	createSequencer: function({scale, tempo, audioContext, noteSequence}) {
		let sequencer = Object.create(Sequencer)
		sequencer.init(scale, tempo, audioContext, noteSequence)
		return sequencer
	}
}
