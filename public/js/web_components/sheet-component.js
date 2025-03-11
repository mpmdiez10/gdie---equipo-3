class SheetComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._subject = null;
        this.musicSheets = []; // Maintain a list of music sheets
    }

    connectedCallback() {
        this.render();
    }

    set subject(value) {
        this._subject = value;
        this._subject.subscribe(data => {
            this.addScribeMusic(data);
            this.render(); // Re-render the component
        });
    }

    addScribeMusic(data) {
        let partituraParseada = '';
        if (!data.keys) return;
        // Iterate over the notes in the sheet music
        data.keys.map((key) => {
            partituraParseada += `0 ${key} 0.2 ${data.duration.toString()} \n`;
        });

        // Add the parsed music sheet to the list
        this.musicSheets.push(partituraParseada);

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