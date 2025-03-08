class VideoComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.cues = [];
        this._subjectPromise = new Promise(resolve => {
            this._resolveSubject = resolve;
        });
    }

    connectedCallback() {
        this.render();
        this.subscribeToEvents();
        this.readKeysFile();
    }

    set subject(value) {
        this._subject = value;
        this._resolveSubject(value);
        this._subject.next('Hola buenas');
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
        const subject = await this._subjectPromise;
        subject.subscribe(event => {
            if (event.type === 'keysFileLoaded') {
                this.cues = event.data;
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

        parser.oncue = function(cue) {
            cues.push(cue);
        };

        parser.parse(text);
        parser.flush();

        const subject = await this._subjectPromise;

        subject.next({ type: 'keysFileLoaded', data: cues });
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
                <track id="keysTrack" kind="metadata" label="Keys" src="keys.vtt">
            </video>
        `;

        const video = shadow.querySelector('video');
        video.addEventListener('timeupdate', () => {
            this.updateKeyNotes(video.currentTime);
        });
    }

    updateKeyNotes(currentTime) {
        const cue = this.cues.find(cue => cue.startTime <= currentTime && cue.endTime >= currentTime);
        if (cue) {
            try {
                // Remove the semicolon and parse the JSON
                const data = JSON.parse(cue.text.replace(';', ''));
                if (data && data.keys) {
                    this._subject.next(data.keys);
                } else {
                    console.error('Invalid data structure:', data);
                }
            } catch (error) {
                console.error('Error parsing cue text:', error);
            }
        }
    }
}

customElements.define('video-component', VideoComponent);