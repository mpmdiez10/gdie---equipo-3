class ControlsComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._controllsDisplayed = false;
    this.isVideoPaused = true;
    this._socketPromise = new Promise(resolve => {
      this._resolveSocket = resolve;
    });
  }

  connectedCallback() {
    this.initSocketDataTransfer();
    this.render();
  }

  set isVideoPaused(value) {
    this._isVideoPaused = value;
    this.render();
  }

  set socket(value) {
    this._socket = value;
    this._resolveSocket(value);
  }

  async initSocketDataTransfer() {
    const socket = await this._socketPromise;
    console.log('Socket connected:', socket.id);
    // Recoger los mensajes del socket
    socket.on('control message', (msg) => {
      console.log('Control message received:', msg);
      if (msg.type === 'play'){
        this._isVideoPaused = false;
        this.render();
      }
      else if (msg.type === 'pause') {
        this._isVideoPaused = true;
        this.render();
      }
    });
  }

  render() {
    this.shadowRoot.innerHTML = /* html */`
      <style>
        .button {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background-color: blue;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 5px;
          cursor: pointer;
          transition: transform 0.4s ease, opacity 0.4s ease;
        }

        .controls-container {
          display: flex;
          align-items: center;
          position: relative;
        }

        .controls {
          display: flex;
          flex-direction: row;
          align-items: center;
        }

        .controls .button {
          opacity: 0;
          transform: translateX(-40px) scale(0.5);
          pointer-events: none;
        }

        .controls.show .button {
          opacity: 1;
          transform: translateX(0) scale(1);
          pointer-events: auto;
        }

        .controls.show .button:nth-child(1) {
          transition-delay: 0.05s;
        }
        .controls.show .button:nth-child(2) {
          transition-delay: 0.15s;
        }
        .controls.show .button:nth-child(3) {
          transition-delay: 0.25s;
        }
        .controls.show .button:nth-child(4) {
          transition-delay: 0.40s;
          background-color: red;
        }

        .menu-icon line {
          stroke: white;
          stroke-width: 2;
          stroke-linecap: round;
          transition: transform 0.3s ease, opacity 0.3s ease;
          transform-box: fill-box;
          transform-origin: center;
        }

        /* Posición inicial simulando líneas separadas */
        .menu-icon .top {
          transform: translateY(-6px);
        }
        .menu-icon .bottom {
          transform: translateY(6px);
        }

        /* Animación a X */
        .menu-icon.open .top {
          transform: rotate(45deg);
        }
        .menu-icon.open .middle {
          opacity: 0;
        }
        .menu-icon.open .bottom {
          transform: rotate(-45deg);
        }

      </style>

      <div class="controls-container">
        <div class="button menu-button">
          <svg class="menu-icon ${this._controllsDisplayed ? 'open' : ''}" viewBox="0 0 24 24" width="30" height="30">
            <line class="top" x1="3" y1="12" x2="21" y2="12" />
            <line class="middle" x1="3" y1="12" x2="21" y2="12" />
            <line class="bottom" x1="3" y1="12" x2="21" y2="12" />
          </svg>      
        </div>

        <div class="controls ${this._controllsDisplayed ? 'show' : ''}">
          <div class="button" id="skip-backward-button">
            <img src="assets/media/img/icons/skip-back-button.svg" alt="Volver atrás 10 segundos">
          </div>
          <div class="button" id="play-pause-button">
            <img src="assets/media/img/icons/${this._isVideoPaused ? 'play-button.svg' : 'pause-button.svg'}" alt="reproducir/pausar video">
          </div>
          <div class="button" id="skip-forward-button">
            <img src="assets/media/img/icons/skip-forward-button.svg" alt="Adelantar 10 segundos">
          </div>
          <div class="button" id="exit-button">
            <img src="assets/media/img/icons/exit-button.svg" alt="Volver a la página principal">
          </div>
        </div>
      </div>
    `;

    const menuButton = this.shadowRoot.querySelector('.menu-button');
    const controlsEl = this.shadowRoot.querySelector('.controls');
    const menuIcon = this.shadowRoot.querySelector('.menu-icon');

    const playPauseButton = this.shadowRoot.querySelector('#play-pause-button');
    const skipBackwardButton = this.shadowRoot.querySelector('#skip-backward-button');
    const skipForwardButton = this.shadowRoot.querySelector('#skip-forward-button');
    const exitButton = this.shadowRoot.querySelector('#exit-button');

    menuButton.addEventListener('click', () => {
      this._controllsDisplayed = !this._controllsDisplayed;
      controlsEl.classList.toggle('show');
      menuIcon.classList.toggle('open');
    });

    // Acciones para los botones
    playPauseButton.addEventListener('click', () => {
      if (this._isVideoPaused) {
        this._socket.emit('control message', { type: 'play' });
        this._isVideoPaused = false;
        this.render();
      } else {
        this._socket.emit('control message', { type: 'pause' });
        this._isVideoPaused = true;
        this.render();
      }
    });
    skipBackwardButton.addEventListener('click', () => {
      this._socket.emit('control message', { type: 'skip-backward' });
    });
    skipForwardButton.addEventListener('click', () => {
      this._socket.emit('control message', { type: 'skip-forward' });
    });
    exitButton.addEventListener('click', () => {
      window.open('https://gdie2503.ltim.uib.es/', '_self');
    });
  }
}

customElements.define('controls-component', ControlsComponent);
