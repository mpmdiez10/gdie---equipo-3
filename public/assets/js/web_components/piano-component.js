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

    get window() {
      return this.getAttribute("window") || "desktop";
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
        ${this.window === "mobile" ? 
        // Visualización de móvil
          `
            #piano {
              position: relative;
              margin: 0 auto;
              width: 100%; /* Swapped width and height */
              height: 100%; /* Full height */
              max-height: 700px; /* Adjusted max height */
              display: flex;
              flex-direction: column; /* Stack keys vertically */
              border: 2px solid black;
            }

            .white-key {
              flex: 1;
              background: white;
              border: 1px solid black;
              position: relative;
              width: 100%; /* Full width for vertical layout */
              height: auto; /* Adjust height dynamically */
            }

            .black-key {
              height: 8.5%; /* Adjusted height for vertical layout */
              width: 60%; /* Adjusted width for black keys */
              border: 1px solid black;
              background: black;
              position: absolute;
              left: 20%; /* Center black keys horizontally */
              z-index: 100;
            }

            .highlight {
              background: lightblue !important;
            }

            /* Adjust positions for black keys in vertical layout */
            #C\\# { top: 9.5%; left: 40%; }
            #D\\# { top: 24%; left: 40%; }
            #F\\# { top: 52.5%; left: 40%; }
            #G\\# { top: 67%; left: 40%; }
            #A\\# { top: 81.5%; left: 40%; }
          ` 
        : 
        // Visualización de escritorio
          `
            #piano {
              position: relative;
              margin: 0 auto;
              width: 100%;
              height: 125px;
              max-width: 700px;
              display: flex;
              border: 2px solid black;
            }
            .white-key {
              flex: 1;
              background: white;
              border: 1px solid black;
              position: relative;
              height: 100%;
            }
            .black-key {
              width: 8.5%;
              height: 60%;
              border: 1px solid black;
              background: black;
              position: absolute;
              z-index: 100;
            }
            .highlight {
              background: lightblue !important;
            }
            #C\\# { left: 9.5%; }
            #D\\# { left: 24%; }
            #F\\# { left: 52.5%; }
            #G\\# { left: 67%; }
            #A\\# { left: 81.5%; }
            
            @media (min-width: 768px) {
              #piano {
                height: 150px; /* Fixed height for desktop */
              }
            }
            @media (min-width: 1024px) {
              #piano {
                height: 200px; /* Fixed height for desktop */
              }
            }
            @media (min-width: 1280px) {
              #piano {
                height: 250px; /* Fixed height for desktop */
              }
            }
            @media (min-width: 1536px) {
              #piano {
                height: 300px; /* Fixed height for desktop */
              }
            }
          `
        }
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
  