import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0';
import { CustomControls } from './custom-controls.js';

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
        this.video_mode = this.getAttribute('video-mode') || 'hls';
        this._second = 0;

        // Pipeline de traducción (se carga al inicio)
        this._translatorPromise = pipeline('translation', 'Xenova/opus-mt-en-es');
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
    return ["song", "video-mode"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "song") {
      this.second = 0;
      this.render();
    } else if (name === "video-mode") {
      const video = this.shadowRoot.querySelector('video');
      if (video) {
        this.second = video.currentTime;
      }
      this.video_mode = newValue;
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

    // Recibir el valor de la sala
    socket.on('init main message', (roomId) => {
        document.querySelector('piano-component').setAttribute('roomCode', roomId);
    });

    // Recoger los mensajes de control del video
    socket.on('control message', (msg) => {
      if (msg.type === 'play') {
        this.playVideo();
      } else if (msg.type === 'pause') {
        this.pauseVideo();
      } else if (msg.type === 'skip-backward') {
        this.rewindVideo();
      } else if (msg.type === 'skip-forward') {
        this.forwardVideo();
      }
    });
  }

  // Funciones para controlar el video
  // Pause the video
  pauseVideo() {
    const videoEl = this.shadowRoot.querySelector('video');
    if (videoEl) {
      videoEl.pause();
    }
  }

  // Play the video
  playVideo() {
    const videoEl = this.shadowRoot.querySelector('video');
    if (videoEl) {
      videoEl.play();
    }
  }

  // Rewind the video by 10 seconds
  rewindVideo() {
    const videoEl = this.shadowRoot.querySelector('video');
    if (videoEl) {
      videoEl.currentTime = Math.max(0, videoEl.currentTime - 10);
    }
  }

  // Forward the video by 10 seconds
  forwardVideo() {
    const videoEl = this.shadowRoot.querySelector('video');
    if (videoEl) {
      videoEl.currentTime = Math.min(videoEl.duration, videoEl.currentTime + 10);
    }
  }

  // Render con overlay de carga y mensaje
  async render() {
    const song = this.song_playing;
    const shadow = this.shadowRoot;

    shadow.innerHTML =/* html */ `
      <style>
        .video-container {
          position: relative;
          width: 100%;
          height: auto;
        }
        video {
          border: 1px solid black;
          width: 100%;
          height: auto;
          display: block;
        }
        .loading-overlay {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          visibility: hidden;
          transition: visibility 0.2s;
        }
        .loading-overlay.show {
          visibility: visible;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner {
          border: 8px solid #f3f3f3;
          border-top: 8px solid #007bff;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          animation: spin 1s linear infinite;
        }
        .message {
          margin-top: 1rem;
          font-size: 1.1rem;
          color: #333;
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
        }
      </style>

      <div class="video-container">
        <video width="640" height="360" playsinline>
          <!-- Metadata -->
          <track id="sheetsTrack" kind="metadata" label="Sheets" src="assets/vtt/${song}/sheets.vtt">
          <track id="keysTrack" kind="metadata" label="Keys" src="assets/vtt/${song}/keys.vtt">
          <track id="recommendationsTrack" kind="metadata" label="Recommendations" src="assets/vtt/${song}/recommendations.vtt">

          <!-- Subtítulos Inglés -->
          <track src="assets/vtt/${song}/subtitles_en.vtt" kind="subtitles" srclang="en" label="Inglés" default>
        </video>

        <div class="loading-overlay">
          <div class="spinner"></div>
          <div class="message"></div>
        </div>
      </div>

      <div class="songs_buttons_list">
        ${this.songs.map(s => `
          <button class="song_button" data-song="${s}">${s}</button>
        `).join('')}
      </div>
    `;

    // Igual que antes: listeners de metadata y cambio de canción…
    const video = shadow.querySelector('video');
    const tracks = shadow.querySelectorAll('track');
    const sheetsTrack = tracks[0].track;
    const keysTrack = tracks[1].track;
    const recommendationsTrack = tracks[2].track;
    const buttons = shadow.querySelectorAll('.song_button');
    const custom = new CustomControls(video, shadow.querySelector('.video-container'));
    video.addEventListener('qualitychange', (e) => {
      let quality;

      if (this.hlsPlayer && this.video_mode === 'hls') {
        switch (e.detail.quality) {
          case "NL":
            quality = 3; // 2160p
            break;
          case "1080":
            quality = 2; // 1080p
            break;
          case "720":
            quality = 1; // 720p
            break;
          case "ML":
            quality = 0; // 360p
            break;
        }

        this.hlsPlayer.currentLevel = quality;

        // Vaciar el buffer forzando recarga
        this.hlsPlayer.stopLoad();
        this.hlsPlayer.startLoad();
      }

      if (this.dashPlayer && this.video_mode === 'dash') {

        switch (e.detail.quality) {
          case "NL":
            quality = 2; // 4k
            break;
          case "1080":
            quality = 1; // 1080p
            break;
          case "720":
            quality = 0; // 720p
            break;
          case "ML":
            quality = 3; // 480p
            break;
        }

        this.dashPlayer.updateSettings({
          streaming: {
            abr: {
              autoSwitchBitrate: { video: false }
            }
          }
        });
        this.dashPlayer.setRepresentationForTypeByIndex('video', quality, true);

        const currentTime = this.dashPlayer.time();
        this.dashPlayer.seek(currentTime); // Reproduce desde el mismo punto
      }
    });

    if (sheetsTrack) {
      sheetsTrack.mode = 'hidden';
      sheetsTrack.addEventListener('cuechange', () => {
        if (sheetsTrack.activeCues && sheetsTrack.activeCues.length > 0) {
          const activeCue = sheetsTrack.activeCues[0];
          if (activeCue) {
            const data = JSON.parse(activeCue.text); // Parsear el texto del cue
            if (data) {
              // Añadir propiedades de tiempo al objeto data
              data.startTime = activeCue.startTime;
              data.endTime = activeCue.endTime;
        
              // Pasar el texto del cue de las teclas
              this.updateSheetNotes(data);
            }
          }
        }
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

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.song_playing = btn.getAttribute('data-song');
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

    video.addEventListener('play', () => {
      this._socket.emit('control message', { type: 'play' });
    });
  
    video.addEventListener('pause', () => {
      this._socket.emit('control message', { type: 'pause' });
    });

    if (Hls.isSupported() && this.video_mode === 'hls') {
      let url;
      switch (song) {
        case 'imagine':
          url = 'https://media.thetavideoapi.com/org_t7ekvfajzpisa2aks00rwhftq19n/srvacc_rf5azx4xj0txhtp21jx2vxe7f/video_uv88xnustt4th3h9tq7q54y26b/master.m3u8';
          break;
        case 'scientist':
          url = 'https://media.thetavideoapi.com/org_t7ekvfajzpisa2aks00rwhftq19n/srvacc_rf5azx4xj0txhtp21jx2vxe7f/video_a28zp3khf7bu4u6izt9bti0vpc/master.m3u8';
          break;
      }
      this.hlsPlayer = new Hls();
      this.hlsPlayer.on(Hls.Events.MEDIA_ATTACHED, function () { /* ... */ });
      this.hlsPlayer.loadSource(url);
      this.hlsPlayer.attachMedia(video);

      video.addEventListener('loadedmetadata', () => {
        if (this.second > 0) {
          video.currentTime = this.second;
          video.play();
        }
      });
    } else {
      const url = `assets/media/video/${song}/manifest.mpd`;
      this.dashPlayer = dashjs.MediaPlayer().create();
      this.dashPlayer.initialize(video, url, false);

      video.addEventListener('loadedmetadata', () => {
        if (this.second > 0) {
          video.currentTime = this.second;
          video.play();
        }
      });
    }
  }

  // Traduce línea a línea
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

  // Traduce y maneja mensajes
  async translateSubtitles() {
    const shadow  = this.shadowRoot;
    const overlay = shadow.querySelector('.loading-overlay');
    const msg     = overlay.querySelector('.message');

    // 1) Mostrar texto de “Traduciendo…”
    msg.textContent = 'Traduciendo subtítulos…';
    overlay.classList.add('show');

    try {
      const translator = await this._translatorPromise;
      const song       = this.song_playing;

      // 2) Obtener y traducir VTT
      const vttEnText  = await fetch(`assets/vtt/${song}/subtitles_en.vtt`).then(r => r.text());
      const vttEsText  = await this._translateVTT(vttEnText, translator);

      // 3) Crear blob y URL
      const blob  = new Blob([vttEsText], { type: 'text/vtt' });
      const urlEs = URL.createObjectURL(blob);

      // 4) Insertar o actualizar pista ES
      const videoEl   = shadow.querySelector('video');
      let esTrackEl   = shadow.querySelector('track[srclang="es"]');
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

      // 5) Activar sólo ES
      Array.from(videoEl.querySelectorAll('track[kind="subtitles"]')).forEach(t => {
        t.track.mode = (t.srclang === 'es') ? 'showing' : 'disabled';
      });

      // 6) Cambiar texto a “Traducido” y esperar un momento
      msg.textContent = 'Traducido';
      await new Promise(res => setTimeout(res, 1200));

    } catch (err) {
      console.error('Error traduciendo subtítulos:', err);
      msg.textContent = 'Error al traducir';
      await new Promise(res => setTimeout(res, 1200));
    } finally {
      overlay.classList.remove('show');
    }
  }

  // Métodos RxJS…
  updateKeyNotes(data) {
    if (data && data.keys) this._subjectPiano.next(data);
  }
  updateSheetNotes(data) {
    if (data && data.compasses) this._subjectSheets.next(data);
  }
  updateRecommendations(data) {
    if (data && data.song_recommendations?.length > 0) {
      this._subjectRecommendations.next(data);
    }
  }
}

customElements.define('video-component', VideoComponent);