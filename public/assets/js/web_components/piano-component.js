class PianoComponent extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" }); // Shadow DOM
    }
  
    connectedCallback() {
      this.render();
    }
  
    set subject(value) {
      this._subject = value;
      this._subject.subscribe(data => {
          if (data.keys.length === 0) {
            this.setAttribute('notes', '');
          } else if (!data.keys) {
            console.error('Invalid data structure:', data);
          } else {
            this.setAttribute('notes', data.keys.join(','));
          }          
        });
    }

    static get observedAttributes() {
      return ["notes"];
    }
  
    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "notes") {
        this.render();
      }
    }
  
    get notes() {
      return this.getAttribute("notes")?.split(",") || [];
    }
  
    render() {
      const keys = [
        { id: "C", type: "white" }, { id: "C#", type: "black" },
        { id: "D", type: "white" }, { id: "D#", type: "black" },
        { id: "E", type: "white" }, { id: "F", type: "white" },
        { id: "F#", type: "black" }, { id: "G", type: "white" },
        { id: "G#", type: "black" }, { id: "A", type: "white" },
        { id: "A#", type: "black" }, { id: "B", type: "white" }
      ];
  
      const highlightedNotes = this.notes;
  
      this.shadowRoot.innerHTML = `
        <style>
          #piano {
            position: relative;
            margin: 0 auto;
            width: 700px; /* Double the width */
            height: 300px; /* Double the height */
            display: flex;
            border: 2px solid black;
          }
          .white-key {
            width: 100px; /* Double the width */
            height: 300px; /* Double the height */
            background: white;
            border: 2px solid black;
            position: relative;
          }
          .black-key {
            width: 60px; /* Double the width */
            height: 180px; /* Double the height */
            border: 2px solid black;
            background: black;
            position: absolute;
            z-index: 100;
          }
          .highlight {
            background: lightblue !important;
          }
          #C\\# { left: 70px; } /* Double the left position */
          #D\\# { left: 170px; } /* Double the left position */
          #F\\# { left: 370px; } /* Double the left position */
          #G\\# { left: 470px; } /* Double the left position */
          #A\\# { left: 570px; } /* Double the left position */
        </style>
        <div id="piano">
          ${keys
            .map(
              (key) => `<div id="${key.id}" class="${key.type}-key ${highlightedNotes.includes(key.id) ? "highlight" : ""}"></div>`
            )
            .join("")}
        </div>
      `;
    }
  }
  
  customElements.define("piano-component", PianoComponent);
  