class SheetComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._subject = null;
        this._hola = null;
    }

    connectedCallback() {
        this.render();
    }

    set subject(value) {
        this._subject = value;
        this._subject.subscribe(data => {
            console.log('Received data:', data);
            this.addScribeMusic(data);
        });
    }

    addScribeMusic(data) {
        console.log('Adding scribe music:', data);

        const scribeMusic = document.createElement('scribe-music');
        // const scribeMusic = document.createElement('div');
        scribeMusic.setAttribute('type', 'sequence');

        // Parsear el contenido de la partitura
        let parsedData, partituraParseada = "";
        try {
            parsedData = JSON.parse(data.data[0].text);
            console.log('Parsed data:', parsedData);

            // Recorrer las notas de la partitura
            parsedData.keys.forEach((key) => {
                partituraParseada += "\n0 " + key + " 0.2 " + parsedData.duration.toString() ;
                console.log('partituraParseada:', partituraParseada);
            });

            scribeMusic.innerHTML = partituraParseada;
        } catch (error) {
            console.error('Error parsing JSON:', error);
            scribeMusic.innerHTML = 'Error parsing music data';
        }
        
        this.shadowRoot.querySelector('#container_music_sheet').appendChild(scribeMusic);
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
            <div id="container_music_sheet"></div>
        `;
    }
}

customElements.define("sheet-component", SheetComponent);