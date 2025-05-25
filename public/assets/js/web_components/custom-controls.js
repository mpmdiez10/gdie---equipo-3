export class CustomControls {
  constructor(video, container, options = {}) {
    this.video = video;
    this.container = container;
    this.options = options;
    this.createControls();
    this.container.style.position = 'relative';
    this.bindEvents();
  }

  createControls() {
    this.controls = document.createElement('div');
    this.controls.className = 'custom-controls';
    this.controls.innerHTML = `
      <style>
        .custom-controls {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 10;
          background: rgba(0, 0, 0, 0.3);
          transition: opacity 0.5s ease;
        }

        .custom-controls.hidden {
          opacity: 0;
          pointer-events: none;
        }

        .control-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 5px;
          flex-wrap: wrap;
          gap: 10px;
          max-width: 100%; /* Evita desbordamiento horizontal en pantalla completa */
          box-sizing: border-box;
        }

        button {
          background: transparent;
          border: none;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          position: relative;
          z-index: 1;
        }

        #options-button {
          margin-left: auto; /* Empuja el botón a la derecha */
        }

        #play-pause img {
          vertical-align: middle;
        }

        input[type=range]#progress {
          -webkit-appearance: none;
          width: 100%;
          height: 4px; /* Grosor más fino */
          background: rgba(255, 255, 255, 0.5);
          border-radius: 2px;
          cursor: pointer;
          margin: 10px 10px;
        }

        /* Para la barra "llenada" (thumb track) en WebKit */
        input[type=range]#progress::-webkit-slider-runnable-track {
          height: 4px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 2px;
        }

        /* Para el pulgar (thumb) en WebKit */
        input[type=range]#progress::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          margin-top: -4px; /* Centra el pulgar en la pista */
          position: relative;
          z-index: 2;
        }

        /* Firefox */
        input[type=range]#progress::-moz-range-track {
          height: 4px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 2px;
        }

        input[type=range]#progress::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }

        /* IE */
        input[type=range]#progress::-ms-track {
          height: 4px;
          background: transparent;
          border-color: transparent;
          color: transparent;
        }

        input[type=range]#progress::-ms-fill-lower {
          background: rgba(255, 255, 255, 0.7);
          border-radius: 2px;
        }

        input[type=range]#progress::-ms-fill-upper {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }

        input[type=range]#progress::-ms-thumb {
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          margin-top: 0px;
        }

        .dropdown-menu {
          position: absolute;
          bottom: 100%;
          right: 0;
          background: #222;
          border: 1px solid #444;
          border-radius: 4px;
          padding: 8px;
          display: none;
          z-index: 10;
          width: 200px;
          box-sizing: border-box;
          box-shadow: 0 4px 10px rgba(0,0,0,0.7);
        }

        .dropdown-menu label {
          display: block;
          margin-bottom: 6px;
          font-weight: bold;
          cursor: default;
          color: white;
        }

        .dropdown-menu select,
        .dropdown-menu input[type=range] {
          width: 100%;
          margin-bottom: 12px;
          cursor: pointer;
        }

        select {
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 0.9rem;
          cursor: pointer;
          appearance: none; /* Quita estilo nativo */
          background-image:
            linear-gradient(45deg, transparent 50%, white 50%),
            linear-gradient(135deg, white 50%, transparent 50%),
            radial-gradient(circle at center, rgba(255,255,255,0.3) 45%, transparent 46%);
          background-position:
            calc(100% - 20px) calc(1em + 2px),
            calc(100% - 15px) calc(1em + 2px),
            calc(100% - 2.5em) 0.5em;
          background-size: 5px 5px, 5px 5px, 1px 1.5em;
          background-repeat: no-repeat;
          transition: border-color 0.3s ease, background-color 0.3s ease;
        }

        select:hover {
          border-color: white;
          background-color: rgba(50, 50, 50, 0.9);
        }

        select:focus {
          outline: none;
          border-color: #fff;
          background-color: rgba(70, 70, 70, 0.95);
        }

        /* Estilo para controles en pantalla completa */
        :host-context(:fullscreen) .custom-controls,
        :fullscreen .custom-controls {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          width: 100%;

          /* Se ha reducido la opacidad en pantalla completa también */
          background: rgba(0, 0, 0, 0.6);
        }

        :fullscreen video {
          width: 100vw !important;
          height: 100vh !important;
          object-fit: contain;
          display: block;
        }

        /* El contenedor también se ajusta completamente */
        :fullscreen .custom-controls {
          bottom: 0;
          left: 0;
          right: 0;
          width: 100vw;
          max-width: 100vw;
          box-sizing: border-box;
        }
      </style>

      <div class="control-row">
        <button id="play-pause">
          <img src="assets/media/img/icons/play-button.svg" alt="reproducir/pausar video" id="play-pause-img" width="20" height="20">
        </button>

        <!-- Se ha movido el botón de pantalla completa al final, junto al de opciones -->
        <button id="options-button" aria-haspopup="true" aria-expanded="false" aria-controls="options-menu">
          <img src="assets/media/img/icons/settings-button.svg" alt="Opciones" width="20" height="20">
        </button>

        <button id="fullscreen-button">
          <img src="assets/media/img/icons/fullscreen-button.svg" alt="Pantalla completa" width="20" height="20">
        </button>

        <div class="dropdown-menu" id="options-menu" role="menu" aria-hidden="true" tabindex="-1">
          <label for="subtitles">Subtítulos:</label>
          <select id="subtitles" role="menuitem" aria-label="Subtítulos">
            <option value="none">Desactivado</option>
          </select>

          <label for="quality">Calidad:</label>
          <select id="quality" role="menuitem" aria-label="Calidad máxima">
          <option value="NL" selected>Sin límite</option>
          <option value="1080">1080p</option>
          <option value="720">720p</option>
          <option value="ML">Limitación máxima</option>
          </select>

          <label for="volume">Volumen:</label>
          <input type="range" id="volume" min="0" max="1" step="0.01" value="1" role="menuitem" aria-label="Volumen">
        </div>
      </div>

      <div class="control-row">
        <input type="range" id="progress" min="0" value="0" aria-label="Barra de progreso">
      </div>
    `;

    this.container.appendChild(this.controls);
  }

  // El resto del código permanece igual — solo se han hecho cambios en createControls
  bindEvents() {
    const playPause = this.controls.querySelector('#play-pause');
    const playPauseimg = this.controls.querySelector('#play-pause-img');
    const progress = this.controls.querySelector('#progress');
    const subtitles = this.controls.querySelector('#subtitles');
    const quality = this.controls.querySelector('#quality');
    const volume = this.controls.querySelector('#volume');
    const optionsButton = this.controls.querySelector('#options-button');
    const optionsMenu = this.controls.querySelector('#options-menu');
    const fullscreenButton = this.controls.querySelector('#fullscreen-button');

    // Botón de play/pausa
    playPause.addEventListener('click', () => {
      if (this.video.paused) {
        this.video.play();
        playPauseimg.setAttribute('src', 'assets/media/img/icons/pause-button.svg');
      } else {
        this.video.pause();
        playPauseimg.setAttribute('src', 'assets/media/img/icons/play-button.svg');
      }
    });

    // Barra de progreso
    this.video.addEventListener('timeupdate', () => {
      progress.value = this.video.currentTime;
    });
    this.video.addEventListener('loadedmetadata', () => {
      progress.max = this.video.duration;
    });
    progress.addEventListener('input', () => {
      this.video.currentTime = progress.value;
    });

    // Subtítulos disponibles
    const subtitleTracks = Array.from(this.video.textTracks).filter(track => track.kind === 'subtitles');
    subtitleTracks.forEach((track, i) => {
      const option = document.createElement('option');
      option.value = i.toString();
      option.textContent = track.label || track.language || `Subtítulo ${i + 1}`;
      subtitles.appendChild(option);
    });

    // Control de subtítulos
    subtitles.addEventListener('change', () => {
      const selected = subtitles.value;
      subtitleTracks.forEach((track, i) => {
        track.mode = selected === i.toString() ? 'showing' : 'disabled';
      });
      if (selected === 'none') {
        subtitleTracks.forEach(track => (track.mode = 'disabled'));
      }
    });

    // Volumen
    volume.addEventListener('input', () => {
      this.video.volume = parseFloat(volume.value);
    });

    // Cambio de calidad
    quality.addEventListener('change', () => {
      const event = new CustomEvent('qualitychange', {
        detail: { quality: quality.value }
      });
      this.video.dispatchEvent(event);
    });

    // Botón de opciones
    optionsButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = optionsMenu.style.display === 'block';
      if (isOpen) {
        this.hideOptionsMenu();
      } else {
        this.showOptionsMenu();
      }
    });

    document.addEventListener('click', (e) => {
      const path = e.composedPath();
      if (!path.includes(optionsMenu) && !path.includes(optionsButton)) {
        this.hideOptionsMenu();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideOptionsMenu();
      }
    });

    this.video.addEventListener('click', () => {
      if (this.video.paused) {
        this.video.play();
        playPauseimg.setAttribute('src', 'assets/media/img/icons/pause-button.svg');
      } else {
        this.video.pause();
        playPauseimg.setAttribute('src', 'assets/media/img/icons/play-button.svg');
      }
    });

    this.video.addEventListener('pause', () => {
      playPauseimg.setAttribute('src', 'assets/media/img/icons/play-button.svg');
    });
    this.video.addEventListener('play', () => {
      playPauseimg.setAttribute('src', 'assets/media/img/icons/pause-button.svg');
    });

    // Pantalla completa
    fullscreenButton.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        this.container.requestFullscreen().then(() => {
          // Intentar forzar orientación horizontal en móviles compatibles
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch((err) => {
              console.warn('No se pudo cambiar la orientación:', err);
            });
          }
        }).catch(err => {
          console.error(`Error al activar pantalla completa: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    });

    this.video.addEventListener('dblclick', () => {
      if (!document.fullscreenElement) {
        this.container.requestFullscreen().catch(err => {
          console.error(`Error al activar pantalla completa: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    });

    // Detectar cambios en modo pantalla completa
    document.addEventListener('fullscreenchange', () => {
      const isFullscreen = !!document.fullscreenElement;
      this.controls.classList.toggle('fullscreen-active', isFullscreen);
    });

    // Ocultar controles tras inactividad
    let mouseTimer;
    const hideControls = () => {
      this.controls.classList.add('hidden');
    };
    const showControls = () => {
      this.controls.classList.remove('hidden');
    };
    const resetMouseTimer = () => {
      showControls();
      clearTimeout(mouseTimer);
      mouseTimer = setTimeout(() => {
        if (!this.video.paused) hideControls();
      }, 3000);
    };

    this.container.addEventListener('mousemove', resetMouseTimer);
    this.container.addEventListener('touchstart', resetMouseTimer); // para móviles

    this.video.addEventListener('play', resetMouseTimer);
    this.video.addEventListener('pause', showControls); // siempre visibles si está pausado

    const updateSubtitlesMenu = () => {
      const subtitlesSelect = this.controls.querySelector('#subtitles');

      // Limpiar opciones previas excepto 'Ninguno'
      subtitlesSelect.innerHTML = '<option value="none">Ninguno</option>';

      const subtitleTracks = Array.from(this.video.textTracks).filter(track => track.kind === 'subtitles');
      let spanishFound = false;

      subtitleTracks.forEach((track, i) => {
        const option = document.createElement('option');
        option.value = i.toString();
        option.textContent = track.label || track.language || `Subtítulo ${i + 1}`;

        // Si el subtítulo es español (label o language)
        if (!spanishFound && /español|spanish|es/.test(track.label?.toLowerCase() || track.language?.toLowerCase())) {
          option.selected = true;
          track.mode = 'showing';
          spanishFound = true;
        } else {
          track.mode = 'disabled';
        }

        subtitlesSelect.appendChild(option);
      });

      // Reasignar evento por seguridad
      subtitlesSelect.addEventListener('change', () => {
        const selected = subtitlesSelect.value;
        subtitleTracks.forEach((track, i) => {
          track.mode = selected === i.toString() ? 'showing' : 'disabled';
        });
        if (selected === 'none') {
          subtitleTracks.forEach(track => (track.mode = 'disabled'));
        }
      });
    }

  // Observar cambios en el DOM del video (por ejemplo, cuando se añade un <track>)
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        updateSubtitlesMenu();
      }
    }
  });
  observer.observe(this.video, { childList: true });

  // Llamar inicialmente
  updateSubtitlesMenu();
  }

  showOptionsMenu() {
    const optionsMenu = this.controls.querySelector('#options-menu');
    const optionsButton = this.controls.querySelector('#options-button');
    optionsMenu.style.display = 'block';
    optionsMenu.setAttribute('aria-hidden', 'false');
    optionsButton.setAttribute('aria-expanded', 'true');
  }

  hideOptionsMenu() {
    const optionsMenu = this.controls.querySelector('#options-menu');
    const optionsButton = this.controls.querySelector('#options-button');
    optionsMenu.style.display = 'none';
    optionsMenu.setAttribute('aria-hidden', 'true');
    optionsButton.setAttribute('aria-expanded', 'false');
  }
}
