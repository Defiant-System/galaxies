
let bufferCache = {};

let SongGeneration = {
	addSoundToBuffer (sourceDataBuffer, targetDataBuffer, offset, mono = false) {
		const maxJ = Math.min(offset + sourceDataBuffer.length, targetDataBuffer.length)

		if (mono) {
			targetDataBuffer.set(sourceDataBuffer.subarray(0, maxJ - offset), offset)
		} else {
			for (let j = offset; j < maxJ; j++) {
				targetDataBuffer[j] += sourceDataBuffer[j - offset]
			}
		}
	},

	createTempBuffer (beatCount, bpm) {
		return new Float32Array(Math.ceil(contextSampleRate * beatCount * 60 / bpm))
	},

	makeNotesFromBars (notes) {
		let globalOffset = 0
		let result = []
		let lastOffset = 0
		notes.forEach(([offset, ...args]) => {
			if (offset < lastOffset) {
				globalOffset += 4
			}
			lastOffset = offset
			result.push([globalOffset + offset, ...args])
		})
		return result
	},

	addNotes (notes, output, instrument, bpm, mono = false) {
		if (!Array.isArray(output)) {
			output = [output]
		}

		const keyPrefix = instrument.toString().substr(0,20)
		notes.forEach(note => {
			let key = keyPrefix + note.slice(1).join('|')
			if (!bufferCache[key]) {
				bufferCache[key] = instrument(this.getFrequencyForTone(note[1]), this.getLengthInSeconds(note[2] || 1, bpm), ...note.slice(3))
			}
			if (!Array.isArray(bufferCache[key])) {
				bufferCache[key] = [bufferCache[key]]
			}
			for (let i = 0; i < output.length; i++) {
				this.addSoundToBuffer(
					bufferCache[key][i],
					output[i],
					this.getOffsetForBeat(note[0], bpm),
					mono
				)
			}
		})
	},

	getLengthInSeconds (n, bpm) {
		return n * 60 / bpm
	},

	getSamplePositionWithinBeat (n, bpm) {
		let beatDuration = contextSampleRate * 60 / bpm
		return (n % beatDuration) / beatDuration
	},

	getOffsetForBeat (n, bpm) {
		return Math.floor(contextSampleRate * n * 60 / bpm)
	},

	getOffsetForBar (n, bpm) {
		return this.getOffsetForBeat(n * 4, bpm)
	},

	getFrequencyForTone (n) {
		return 440 * 2 ** (n / 12)
	},

	repeatNotes (note, length, repeat) {
		const result = []
		for (let i = 0; i < repeat; i++) {
			result.push([length * i, note, length])
		}
		return result
	},

	addOctave (notes) {
		for (let i = 0, l = notes.length; i < l; i++) {
			let [offset, note, ...rest] = notes[i]
			notes.push([offset, note + 12, ...rest])
		}
		return notes
	},

	zipRhythmAndNotes (rhythm, notes) {
		return rhythm.map((beat, index) => {
			return [beat, notes[index]]
		})
	},

	offsetNotes (notes, amount) {
		notes.forEach(note => { note[0] += amount })
		return notes
	},

	setNoteLengths(notes, totalBeatCount) {
		for (let i = 0; i < notes.length - 1; i++) {
			notes[i][2] = notes[i + 1][0] - notes[i][0]
		}
		notes[notes.length - 1][2] = totalBeatCount - notes[notes.length - 1][0]
		return notes
	},

	applyRepeatingEnvelope (buffer, envelope, bpm) {
		const sampler = new EnvelopeSampler(envelope)
		let prevT = 0
		for (let i = 0; i < buffer.length; i++) {
			let t = getSamplePositionWithinBeat(i, bpm)
			if (t < prevT) {
				sampler.reset()
			}
			buffer[i] *= sampler.sample(t)
			prevT = t
		}

		return buffer
	}
};
