// assets/js/web_components/video-component.js
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0';

class VideoComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // --- Estado ---
    this.cues = [];
    this.sheetCues = [];
    this.song_playing = 'imagine';
    this.songs = ['imagine', 'scientist'];

    // Promesas para RxJS
    this._subjectPianoPromise = new Promise(res => this._resolveSubjectPiano = res);
    this._subjectSheetsPromise = new Promise(res => this._resolveSubjectSheets = res);
    this._subjectRecommendationsPromise = new Promise(res => this._resolveSubjectRecommendations = res);

    // Pipeline de traducción (se carga al inicio)
    this._translatorPromise = pipeline('translation', 'Xenova/opus-mt-en-es');
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

  // Render sin traducción automática
  async render() {
    const song = this.song_playing;
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
        <source src="assets/media/video/${song}/4k.mp4" type="video/mp4" media="(min-width: 2560px)">
        <source src="assets/media/video/${song}/1080.mp4" type="video/mp4" media="(min-width: 1280px)">
        <source src="assets/media/video/${song}/720.mp4" type="video/mp4" media="(min-width: 720px)">
        <source src="assets/media/video/${song}/480.mp4" type="video/mp4">

        <!-- Metadata -->
        <track id="sheetsTrack" kind="metadata" label="Sheets" src="assets/vtt/${song}/sheets.vtt">
        <track id="keysTrack" kind="metadata" label="Keys" src="assets/vtt/${song}/keys.vtt">
        <track id="recommendationsTrack" kind="metadata" label="Recommendations" src="assets/vtt/${song}/recommendations.vtt">

        <!-- Subtítulos Inglés -->
        <track src="assets/vtt/${song}/subtitles_en.vtt" kind="subtitles" srclang="en" label="Inglés" default>
      </video>
      <div class="songs_buttons_list">
        ${this.songs.map(s => `
          <button class="song_button" data-song="${s}">${s}</button>
        `).join('')}
      </div>
    `;

    // 2. Listeners metadata y cambio de canción (igual que antes)
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
  }

  // Traduce línea a línea (mantiene tiempos y numeración)
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

  // --- Nuevo: traduce y selecciona solo la pista en español ---
  async translateSubtitles() {
    try {
      const translator = await this._translatorPromise;
      const song = this.song_playing;
      // 1. Obtener y traducir VTT
      const vttEnText = await fetch(`assets/vtt/${song}/subtitles_en.vtt`).then(r => r.text());
      const vttEsText = await this._translateVTT(vttEnText, translator);

      // 2. Crear blob y URL
      const blob = new Blob([vttEsText], { type: 'text/vtt' });
      const urlEs = URL.createObjectURL(blob);

      // 3. Insertar o actualizar pista ES
      const videoEl = this.shadowRoot.querySelector('video');
      let esTrackEl = this.shadowRoot.querySelector('track[srclang="es"]');
      if (esTrackEl) {
        esTrackEl.src = urlEs;
      } else {
        esTrackEl = document.createElement('track');
        esTrackEl.kind    = 'subtitles';
        esTrackEl.srclang = 'es';
        esTrackEl.label   = 'Español';
        esTrackEl.src     = urlEs;
        videoEl.appendChild(esTrackEl);
      }

      // 4. Activar solo ES, desactivar INGLÉS
      Array.from(videoEl.querySelectorAll('track[kind="subtitles"]')).forEach(t => {
        const tt = t.track;
        if (t.srclang === 'es') tt.mode = 'showing';
        else                    tt.mode = 'disabled';
      });

    } catch (err) {
      console.error('Error traduciendo subtítulos:', err);
    }
  }

  // Métodos de envío a otros componentes
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
