class SheetComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._subject = null;
        this.musicSheets = [];
        this._socketPromise = new Promise(resolve => {
            this._resolveSocket = resolve;
        });
    }

    connectedCallback() {
        this.render();
        this.initSocketDataTransfer();
    }

    set subject(value) {
        this._subject = value;
        this._subject.subscribe(data => {
            this.addScribeMusic(data);
            this.render(); // Re-render el componente
        });
    }

    set socket(value) {
        this._socket = value;
        this._resolveSocket(value);
    }

    addScribeMusic(data) {
        let partituraParseada = '';
        if (data.compasses.length === 0 || !data.compasses) {
            this.musicSheets = [];
        } else {
            // Iterar sobre los compases de la partitura
            let auxPossComp = 0;
            data.compasses.map((compass) => {
                compass.keys.map((key) => {
                    partituraParseada += `${(auxPossComp).toString()} ${key} 0.2 ${compass.duration.toString()} \n`;
                });
                auxPossComp += compass.duration;
            });
    
            // Añadir la nueva partitura a la lista
            this.musicSheets.push({
                sheet: partituraParseada,
                startTime: data.startTime,
                endTime: data.endTime
            });
        }
    }

    async initSocketDataTransfer() {
        const socket = await this._socketPromise;
    
        // Recibir el valor de la sala
        socket.on('control message', (msg) => {
            if (msg.type === 'skip-backward') {
                // Sacar la última partitura de la lista
                const auxSheet = this.musicSheets.pop();
                // Mirar si el tiempo entre startTime y endTime es mayor que 10 segundos
                if (auxSheet.endTime - auxSheet.startTime > 10) this.musicSheets.pop();
                this.render(); // Re-render el componente
            }
        });
      }

    render() {
        this.shadowRoot.innerHTML = /* html */`
            <style>
                #container_music_sheet {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
            </style>
            <div id="container_music_sheet">
                ${this.musicSheets.map(sheet => `
                    <scribe-music type="sequence">${sheet.sheet}</scribe-music>
                `).join('')}
            </div>
        `;
    }
}

customElements.define("sheet-component", SheetComponent);