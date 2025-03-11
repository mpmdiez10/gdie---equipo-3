class VideoComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.cues = [];
        this.sheetCues = [];
        this._subjectPianoPromise = new Promise(resolve => {
            this._resolveSubjectPiano = resolve;
        });
        this._subjectSheetsPromise = new Promise(resolve => {
            this._resolveSubjectSheets = resolve;
        });
    }

    connectedCallback() {
        this.render();
        this.subscribeToEvents();
        this.readKeysFile();
    }

    set subjectPiano(value) {
        this._subjectPiano = value;
        this._resolveSubjectPiano(value);
    }

    set subjectSheets(value) {
        this._subjectSheets = value;
        this._resolveSubjectSheets(value);
    }

    static get observedAttributes() {
        return ["src"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "src") {
            this.render();
        }
    }

    async subscribeToEvents() {
        const subjectPiano = await this._subjectPianoPromise;
        subjectPiano.subscribe(event => {
            if (event.type === 'keysFileLoaded') {
                this.cues = event.data;
            }
        });

        const subjectSheets = await this._subjectSheetsPromise;
        subjectSheets.subscribe(event => {
            if (event.type === 'sheetsFileLoaded') {
                this.sheetCues = event.data;
            }
        });
    }

    async readKeysFile() {
        const response = await fetch('/vtt/keys.vtt');
        if (!response.ok) {
            console.error('Failed to load keys.vtt file');
            return;
        }
        const text = await response.text();
        const parser = new WebVTT.Parser(window, WebVTT.StringDecoder());
        const cues = [];

        parser.oncue = function (cue) {
            cues.push(cue);
        };

        parser.parse(text);
        parser.flush();

        const subjectPiano = await this._subjectPianoPromise;
        subjectPiano.next({ type: 'keysFileLoaded', data: cues });
    }

    render() {
        const shadow = this.shadowRoot;
        shadow.innerHTML = `
            <style>
                video {
                    border: 1px solid black;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
            </style>
            <video controls width="640" height="360">
                <source src="${this.getAttribute('src')}" type="video/mp4">
                <track id="sheetsTrack" kind="metadata" label="Sheets" src="../vtt/sheets.vtt">
                <track id="keysTrack" kind="metadata" label="Keys" src="../vtt/keys.vtt">
            </video>
        `;

        const video = shadow.querySelector('video');
        const video2 = shadow.querySelector('video track');
        const track = video2.track;
        if (track) {
            track.mode = 'hidden';
            track.addEventListener('cuechange', () => {
                const data = JSON.parse(track.activeCues[0].text);
                if (data) this.updateSheetNotes(data);
            });
        }
        video.addEventListener('timeupdate', () => {
            this.updateKeyNotes(video.currentTime);
        });
    }

    updateKeyNotes(currentTime) {
        const cue = this.cues.find(cue => cue.startTime <= currentTime && cue.endTime >= currentTime);
        if (cue) {
            try {
                const data = JSON.parse(cue.text.replace(';', ''));
                if (data && data.keys) {
                    this._subjectPiano.next(data.keys);
                } else {
                    console.error('Invalid data structure:', data);
                }
            } catch (error) {
                console.error('Error parsing cue text:', error);
            }
        }
    }

    updateSheetNotes(data) {
        this._subjectSheets.next(data);
    }
}

customElements.define('video-component', VideoComponent);