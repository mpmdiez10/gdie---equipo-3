// assets/js/web_components/video-component.js
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0';

class VideoComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // --- Datos de estado original ---
    this.cues = [];
    this.sheetCues = [];
    this.song_playing = 'imagine';
    this.songs = ['imagine', 'scientist'];

    // Promesas para comunicar con los demás componentes
    this._subjectPianoPromise = new Promise(res => this._resolveSubjectPiano = res);
    this._subjectSheetsPromise = new Promise(res => this._resolveSubjectSheets = res);
    this._subjectRecommendationsPromise = new Promise(res => this._resolveSubjectRecommendations = res);

    // --- Preparación pipeline de traducción ---
    // Lanza la carga del modelo nada más construirse
    this._translatorPromise = pipeline('translation', 'Xenova/opus-mt-en-es');
  }

  connectedCallback() {
    // Renderizado inicial + suscripción a eventos de los demás componentes
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

  // Ahora async para poder await en la traducción
  async render() {
    const song = this.song_playing;
    const shadow = this.shadowRoot;

    // 1. Construimos todo el HTML (incluye pistas de metadata y la de inglés)
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

        <!-- Metadata tracks originales -->
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

    // 2. Configuramos los listeners para metadata
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
    buttons.forEach(button => {
      button.addEventListener('click', () => {
          this.song_playing = button.getAttribute('data-song');
          this.setAttribute('song', this.song_playing);
          this.updateKeyNotes({ keys: [] });
          this.updateSheetNotes({ compasses: [] });
          this.updateRecommendations({ song_recommendations: [], song_info: '' });
          this.render();
      });
    });

    // 3. Traducción de subtítulos EN → ES
    try {
      // Esperamos al pipeline
      const translator = await this._translatorPromise;
      const vttEnText   = await fetch(`assets/vtt/${song}/subtitles_en.vtt`).then(r => r.text());
      const vttEsText   = await this._translateVTT(vttEnText, translator);

      // Creamos un Blob y URL
      const blob = new Blob([vttEsText], { type: 'text/vtt' });
      const urlEs = URL.createObjectURL(blob);

      // Insertamos o actualizamos la pista ES
      const videoEl = shadow.querySelector('video');
      let esTrack = shadow.querySelector('track[srclang="es"]');
      if (esTrack) {
        esTrack.src = urlEs;
      } else {
        esTrack = document.createElement('track');
        esTrack.kind    = 'subtitles';
        esTrack.srclang = 'es';
        esTrack.label   = 'Español';
        esTrack.src     = urlEs;
        videoEl.appendChild(esTrack);
      }
    } catch (err) {
      console.error('Error traduciendo subtítulos:', err);
    }
  }

  // Helper: traduce línea a línea, mantiene timestamps y numeración
  async _translateVTT(vttText, translator) {
    const lines = vttText.split('\n');
    const out   = [];

    for (let line of lines) {
      if (/^\d+$/.test(line) || line.includes('-->') || line.trim() === '') {
        out.push(line);
      } else {
        const res = await translator(line);
        out.push(res[0].translation_text);
      }
    }
    return out.join('\n');
  }

  // Métodos de envío de datos a los demás componentes
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
    if (data && data.song_recommendations?.length > 0) {
      this._subjectRecommendations.next(data);
    }
  }
}

customElements.define('video-component', VideoComponent);
