class VideoComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.cues = [];
        this.sheetCues = [];
        this.song_playing = 'imagine';
        this.songs = ['imagine', 'scientist'];
        this._subjectPianoPromise = new Promise(resolve => {
            this._resolveSubjectPiano = resolve;
        });
        this._subjectSheetsPromise = new Promise(resolve => {
            this._resolveSubjectSheets = resolve;
        });
        this._subjectRecommendationsPromise = new Promise(resolve => {
            this._resolveSubjectRecommendations = resolve;
        });
        this._socketPromise = new Promise(resolve => {
            this._resolveSocket = resolve;
        });
    }

    connectedCallback() {
        this.render();
        this.subscribeToEvents();
        this.initSocketDataTransfer();
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

    set socket(value) {
        this._socket = value;
        this._resolveSocket(value);
    }

    static get observedAttributes() {
        return ["song"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "song") {
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

    async initSocketDataTransfer() {
        console.log('socketDataTransfer');
        const socket = await this._socketPromise;

        // Indica que se inicaliza el compartir información de las teclas
        socket.emit('init main message');

        // Recibir el valor de la sala // TODO: Revisar si esto es necesario 
        socket.on('init main message', (roomId) => {
            this.roomId = roomId;
            console.log('roomId', roomId);
        });

        // TEMP
        // setInterval(() => {
        //     alert('Enviando mensaje a la sala...');
        //     socket.emit('main message', {
        //         text: 'Estamos en la salaaaa'
        //     })
        // }, 20000);
    }

    render() {
        const shadow = this.shadowRoot;
        shadow.innerHTML = `
            <style>
                video {
                    border: 1px solid black;
                    height: 90%;
                    width: 100%;
                    margin: 0 auto;
                }
                .songs_buttons_list {
                    display: flex;
                    gap: 50px;
                    justify-content: center;
                    margin-top: 10px;
                }
                .song_button {
                    margin: 0 5px;
                    padding: 0.65rem 1.4rem;
                    cursor: pointer;
                    background-color: #007bff;
                    color: white;
                    text-transform: capitalize;
                    font-size: 1.2rem;
                    font-weight: bold;
                    border: none;
                    border-radius: 3px;
                    opacity: 1;
                }
            </style>
            <video controls width="640" height="360">
                <source src="assets/media/video/${this.getAttribute('song')}/4k.mp4" type="video/mp4" media="(min-width: 2560px)">
                <source src="assets/media/video/${this.getAttribute('song')}/1080.mp4" type="video/mp4" media="(min-width: 1280px)">
                <source src="assets/media/video/${this.getAttribute('song')}/720.mp4" type="video/mp4" media="(min-width: 720px)">
                <source src="assets/media/video/${this.getAttribute('song')}/480.mp4" type="video/mp4">

                <track id="sheetsTrack" kind="metadata" label="Sheets" src="assets/vtt/${this.song_playing}/sheets.vtt">
                <track id="keysTrack" kind="metadata" label="Keys" src="assets/vtt/${this.song_playing}/keys.vtt">
                <track id="recommendationsTrack" kind="metadata" label="Recommendations" src="assets/vtt/${this.song_playing}/recommendations.vtt">

                <!-- Subtitles -->
                <track src="assets/vtt/${this.song_playing}/subtitles_en.vtt" kind="subtitles" srclang="en" label="Inglés" default>
            </video>
            <div class="songs_buttons_list">
                ${this.songs.map(song => `
                    <button class="song_button" id="btn_${song}" data-song="${song}">${song}</button>
                `).join('')}
            </div>
        `;

        const tracks = shadow.querySelectorAll('track');
        const sheetsTrack = tracks[0].track;
        const keysTrack = tracks[1].track;
        const recommendationsTrack = tracks[2].track;
        const buttons = shadow.querySelectorAll('.song_button');

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
                if (data) {
                    // Actualizar las notas de la canción en el teclado
                    this.updateKeyNotes(data);
                    // Enviar las notas a través del socket
                    this._socket.emit('main message', {
                        keys: data.keys
                    });
                }
            });
        }
        if (recommendationsTrack) {
            recommendationsTrack.mode = 'hidden';
            recommendationsTrack.addEventListener('cuechange', () => {
                const data = JSON.parse(recommendationsTrack.activeCues[0].text);
                if (data) this.updateRecommendations(data);
            });
        }
        
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                this.song_playing = button.getAttribute('data-song');
                this.setAttribute('song', this.song_playing);
                this.updateKeyNotes({ keys: [] });
                this._socket.emit('main message', {
                    keys: ''
                });
                this.updateSheetNotes({ compasses: [] });
                this.updateRecommendations({ song_recommendations: [], song_info: '' });
                this.render();
            });
        });
    }

    updateKeyNotes(data) {
        if (data && data.keys) {
            this._subjectPiano.next(data);
        }
    }

    updateSheetNotes(data) {
        if (data && data.compasses) {
            this._subjectSheets.next(data);
        }
    }

    updateRecommendations(data) {
        if (data && data.song_recommendations.length > 0) {
            this._subjectRecommendations.next(data);
        }
    }
}

customElements.define('video-component', VideoComponent);
