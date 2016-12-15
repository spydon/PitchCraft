const freqTable = require("./notes.json");

export class PitchDetect {
    static frameId;
    static micStream;
    static notesArray;
    static audioContext: AudioContext;
    static sourceAudioNode;
    static analyserAudioNode: AnalyserNode;
    static baseFreq = 440;
    static lastGoodNote;
    static currentNoteIndex = 57; // A4
    static isMicrophoneInUse = false;

    constructor () {
        if (this.isAudioContextSupported()) {
            PitchDetect.audioContext = new AudioContext();
            console.log(PitchDetect.audioContext);
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
        let notes = PitchDetect.notesArray;
        if (PitchDetect.lastGoodNote) {
            console.log(PitchDetect.lastGoodNote);
            return (notes.indexOf(PitchDetect.lastGoodNote) / notes.length) * height;
        } else {
            return -1;
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
            // We haven"t found a good correlation
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
        // We need to find how far freq is from PitchDetect.baseFreq in cents
        let log2 = 0.6931471805599453; // Math.log(2)
        let multiplicativeFactor = freq / refFreq;

        // We use Math.floor to get the integer part and ignore decimals
        let cents = Math.floor(1200 * (Math.log(multiplicativeFactor) / log2));
        return cents;
    }

    detectPitch () {
        let buffer = new Uint8Array(PitchDetect.analyserAudioNode.fftSize);
        PitchDetect.analyserAudioNode.getByteTimeDomainData(buffer);

        let fundamentalFreq = this.findFundamentalFreq(buffer, PitchDetect.audioContext.sampleRate);

        if (fundamentalFreq !== -1) {
            let note = this.findClosestNote(fundamentalFreq, PitchDetect.notesArray);
            let cents = this.findCentsOffPitch(fundamentalFreq, note.frequency);
            console.log(note.note);
            this.updateNote(note);
            this.updateCents(cents);
        } else {
            /* this.updateNote("--");*/
            /* this.updateCents(-50);*/
        }
    }

    streamReceived (stream) {
        PitchDetect.micStream = stream;

        let node = PitchDetect.audioContext.createScriptProcessor(2048, 1, 1);
        node.onaudioprocess = this.detectPitch.bind(this);

        // analyser
        PitchDetect.analyserAudioNode = PitchDetect.audioContext.createAnalyser();
        PitchDetect.analyserAudioNode.fftSize = 2048;

        // input
        PitchDetect.sourceAudioNode = PitchDetect.audioContext.createMediaStreamSource(PitchDetect.micStream);
        PitchDetect.sourceAudioNode.connect(PitchDetect.analyserAudioNode);
        PitchDetect.analyserAudioNode.connect(node);
        node.connect(PitchDetect.audioContext.destination);

        // Audible feedback
        // PitchDetect.sourceAudioNode.connect(PitchDetect.audioContext.destination);
    }

    turnOffMicrophone () {
        if (PitchDetect.sourceAudioNode &&
            PitchDetect.sourceAudioNode.mediaStream &&
            PitchDetect.sourceAudioNode.mediaStream.stop) {
            PitchDetect.sourceAudioNode.mediaStream.stop();
        }
        PitchDetect.sourceAudioNode = null;
        this.updatePitch("--");
        this.updateNote("--");
        this.updateCents(-50);
        PitchDetect.analyserAudioNode = null;
        PitchDetect.isMicrophoneInUse = false;
    }

    turnOnMicrophone () {
        if (!PitchDetect.isMicrophoneInUse) {
            if (this.isGetUserMediaSupported()) {
                PitchDetect.notesArray = freqTable[PitchDetect.baseFreq.toString()];

                let getUserMedia = navigator.mediaDevices && navigator.mediaDevices.getUserMedia ?
                    navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices) :
                    function (constraints) {
                        return new Promise(function (resolve, reject) {
                            navigator.getUserMedia(constraints, resolve, reject);
                        });
                    };

                // let getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
                // getUserMedia({audio: true}, this.streamReceived.bind(this), console.log);
                getUserMedia({audio: true}).then(this.streamReceived.bind(this)).catch(console.log);
                this.updatePitch(PitchDetect.baseFreq);
                PitchDetect.isMicrophoneInUse = true;
            } else {
                console.log("It looks like this browser does not support getUserMedia.");
            }
        }
    }

    changeBaseFreq (delta) {
        let newBaseFreq = PitchDetect.baseFreq + delta;
        if (newBaseFreq >= 432 && newBaseFreq <= 446) {
            PitchDetect.baseFreq = newBaseFreq;
            PitchDetect.notesArray = freqTable[PitchDetect.baseFreq.toString()];
            this.updatePitch(PitchDetect.baseFreq);
        }
    }

    updatePitch (pitch) {
        // console.log("pitch: " + pitch);
        // Do nothing yet
    }

    updateNote (note) {
        PitchDetect.lastGoodNote = note;
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
