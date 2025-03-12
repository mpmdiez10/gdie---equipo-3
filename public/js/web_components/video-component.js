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
        this._subjectRecommendationsPromise = new Promise(resolve => {
            this._resolveSubjectRecommendations = resolve;
        });
    }

    connectedCallback() {
        this.render();
        this.subscribeToEvents();
    }

    set subjectPiano(value) {
        this._subjectPiano = value;
        this._resolveSubjectPiano(value);
    }

    set subjectSheets(value) {
        this._subjectSheets = value;
        this._resolveSubjectSheets(value);
    }

    set subjectRecommendations(value) {
        this._subjectRecommendations = value;
        this._resolveSubjectRecommendations(value);
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

        const subjectRecommendations = await this._subjectRecommendationsPromise;
        subjectRecommendations.subscribe(event => {
            if (event.type === 'recommendationsFileLoaded') {
                this.recommendations = event.data;
            }
        });
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
                <track id="recommendationsTrack" kind="metadata" label="Recommendations" src="../vtt/recommendations.vtt">
            </video>
        `;

        const tracks = shadow.querySelectorAll('track')
        const sheetsTrack = tracks[0].track;
        const keysTrack = tracks[1].track;
        const recommendationsTrack = tracks[2].track;

        if (sheetsTrack) {
            sheetsTrack.mode = 'hidden';
            sheetsTrack.addEventListener('cuechange', () => {
                const data = JSON.parse(sheetsTrack.activeCues[0].text);
                if (data) this.updateSheetNotes(data);
            });
        }
        if (keysTrack) {
            keysTrack.mode = 'hidden';
            keysTrack.addEventListener('cuechange', () => {
                const data = JSON.parse(keysTrack.activeCues[0].text);
                if (data) this.updateKeyNotes(data);
            });
        }
        if (recommendationsTrack) {
            recommendationsTrack.mode = 'hidden';
            recommendationsTrack.addEventListener('cuechange', () => {
                const data = JSON.parse(recommendationsTrack.activeCues[0].text);
                if (data) this.updateRecommendations(data);
            });
        }
    }

    updateKeyNotes(data) {
        this._subjectPiano.next(data);
    }

    updateSheetNotes(data) {
        this._subjectSheets.next(data);
    }

    updateRecommendations(data) {
        this._subjectRecommendations.next(data);
    }
}

customElements.define('video-component', VideoComponent);