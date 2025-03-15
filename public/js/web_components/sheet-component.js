class SheetComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._subject = null;
        this.musicSheets = [];
    }

    connectedCallback() {
        this.render();
    }

    set subject(value) {
        this._subject = value;
        this._subject.subscribe(data => {
            this.addScribeMusic(data);
            this.render(); // Re-render el componente
        });
    }

    addScribeMusic(data) {
        let partituraParseada = '';
        if (data.compasses.length === 0) {
            this.musicSheets = [];
        } else if (!data.compasses) {
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
            this.musicSheets.push(partituraParseada);
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                #container_music_sheet {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
            </style>
            <div id="container_music_sheet">
                ${this.musicSheets.map(sheet => `
                    <scribe-music type="sequence">${sheet}</scribe-music>
                `).join('')}
            </div>
        `;
    }
}

customElements.define("sheet-component", SheetComponent);