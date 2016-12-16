const freqTable = require("./notes.json");

export class PitchDetect {
    micStream;
    notesArray;
    audioContext: AudioContext;
    sourceAudioNode;
    analyserAudioNode: AnalyserNode;
    baseFreq = 440;
    lastGoodNote;
    isMicrophoneInUse = false;

    constructor () {
        if (this.isAudioContextSupported()) {
            this.audioContext = new AudioContext();
            this.turnOnMicrophone();
        } else {
            console.log("AudioContext is not supported in this browser");
        }
    }

    isAudioContextSupported () {
        return window.AudioContext != null;
    }

    isGetUserMediaSupported () {
        navigator.getUserMedia = (navigator.getUserMedia ||
                                  navigator.webkitGetUserMedia ||
                                  navigator.mozGetUserMedia ||
                                  navigator.msGetUserMedia);
        return ((navigator.mediaDevices != null && navigator.mediaDevices.getUserMedia != null) ||
                 navigator.getUserMedia != null);
    }

    getY (height) {
        let notes = this.notesArray;
        if (this.lastGoodNote) {
            let pos = ((notes.length - notes.indexOf(this.lastGoodNote)) / notes.length) * height;
            let halfScreen = height/2;
            let spread = Math.random() * (Math.abs(halfScreen - pos) / halfScreen) * 40;
            return pos + Math.sign(halfScreen-pos) * spread;
        } else {
            return height / 2;
        }
    }

    findFundamentalFreq (buffer: Uint8Array, sampleRate: number) {
        // We use Autocorrelation to find the fundamental frequency.

        // In order to correlate the signal with itself (hence the name of the algorithm),
        // we will check two points "k" frames away.
        // The autocorrelation index will be the average of these products. At the same time, we normalize the values.
        // Source: http://www.phy.mty.edu/~suits/autocorrelation.html
        // Assuming the sample rate is 48000Hz, a "k" equal to 1000 would correspond to a 48Hz signal (48000/1000 = 48),
        // while a "k" equal to 8 would correspond to a 6000Hz one, which is enough to cover most (if not all)
        // the notes we have in the notes.json file.
        let n = 1024;
        let bestK = -1;
        let bestR = 0;
        for (let k = 8; k <= 1000; k++) {
            let sum = 0;

            for (let i = 0; i < n; i++) {
                sum += ((buffer[i] - 128) / 128) * ((buffer[i + k] - 128) / 128);
            }

            let r = sum / (n + k);

            if (r > bestR) {
                bestR = r;
                bestK = k;
            }

            if (r > 0.9) {
                // Let"s assume that this is good enough and stop right here
                break;
            }
        }

        if (bestR > 0.0025) {
            // The period (in frames) of the fundamental frequency is "bestK".
            // Getting the frequency from there is trivial.
            return sampleRate / bestK;
        } else {
            // We haven't found a good correlation
            return -1;
        }
    }

    findClosestNote (freq: number, notes) {
        // Use binary search to find the closest note
        let low = -1;
        let high = notes.length;
        while (high - low > 1) {
            let pivot = Math.round((low + high) / 2);
            if (notes[pivot].frequency <= freq) {
                low = pivot;
            } else {
                high = pivot;
            }
        }

        if (Math.abs(notes[high].frequency - freq) <= Math.abs(notes[low].frequency - freq)) {
            // notes[high] is closer to the frequency we found
            return notes[high];
        }

        return notes[low];
    }

    findCentsOffPitch (freq, refFreq) {
        // We need to find how far freq is from this.baseFreq in cents
        let log2 = 0.6931471805599453; // Math.log(2)
        let multiplicativeFactor = freq / refFreq;

        // We use Math.floor to get the integer part and ignore decimals
        let cents = Math.floor(1200 * (Math.log(multiplicativeFactor) / log2));
        return cents;
    }

    detectPitch () {
        let buffer = new Uint8Array(this.analyserAudioNode.fftSize);
        this.analyserAudioNode.getByteTimeDomainData(buffer);

        let fundamentalFreq = this.findFundamentalFreq(buffer, this.audioContext.sampleRate);

        if (fundamentalFreq !== -1) {
            let note = this.findClosestNote(fundamentalFreq, this.notesArray);
            let cents = this.findCentsOffPitch(fundamentalFreq, note.frequency);
            if (!note.note.includes("F8") && !note.note.includes("F#8")) {
                console.log(note.note);
                this.updateNote(note);
                this.updateCents(cents);
            }
        } else {
            /* this.updateNote("--");*/
            /* this.updateCents(-50);*/
        }
    }

    streamReceived (stream) {
        this.micStream = stream;

        let node = this.audioContext.createScriptProcessor(2048, 1, 1);
        node.onaudioprocess = this.detectPitch.bind(this);

        // analyser
        this.analyserAudioNode = this.audioContext.createAnalyser();
        this.analyserAudioNode.fftSize = 2048;

        // input
        this.sourceAudioNode = this.audioContext.createMediaStreamSource(this.micStream);
        this.sourceAudioNode.connect(this.analyserAudioNode);
        this.analyserAudioNode.connect(node);
        node.connect(this.audioContext.destination);

        // Audible feedback
        // PitchDetect.sourceAudioNode.connect(PitchDetect.audioContext.destination);
    }

    turnOffMicrophone () {
        if (this.sourceAudioNode &&
            this.sourceAudioNode.mediaStream &&
            this.sourceAudioNode.mediaStream.stop) {
            this.sourceAudioNode.mediaStream.stop();
        }
        this.sourceAudioNode = null;
        this.updateNote(null);
        this.analyserAudioNode = null;
        this.isMicrophoneInUse = false;
    }

    turnOnMicrophone () {
        if (!this.isMicrophoneInUse) {
            if (this.isGetUserMediaSupported()) {
                this.notesArray = freqTable[this.baseFreq.toString()];

                let getUserMedia = navigator.mediaDevices && navigator.mediaDevices.getUserMedia ?
                    navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices) :
                    function (constraints) {
                        return new Promise(function (resolve, reject) {
                            navigator.getUserMedia(constraints, resolve, reject);
                        });
                    };

                getUserMedia({audio: true}).then(this.streamReceived.bind(this)).catch(console.log);
                this.updatePitch(this.baseFreq);
                this.isMicrophoneInUse = true;
            } else {
                console.log("It looks like this browser does not support getUserMedia.");
            }
        }
    }

    changeBaseFreq (delta) {
        let newBaseFreq = this.baseFreq + delta;
        if (newBaseFreq >= 432 && newBaseFreq <= 446) {
            this.baseFreq = newBaseFreq;
            this.notesArray = freqTable[this.baseFreq.toString()];
            this.updatePitch(this.baseFreq);
        }
    }

    updatePitch (pitch) {
        // console.log("pitch: " + pitch);
        // Do nothing yet
    }

    updateNote (note) {
        this.lastGoodNote = note;
        // console.log("note: " + note);
        // Do nothing yet
    }

    updateCents (cents) {
        // console.log("cents: " + cents);
        // Do nothing yet
    }

    baseFreqChangeHandler (event) {
        this.changeBaseFreq(event.data);
    }
}
