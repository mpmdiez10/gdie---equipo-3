class PianoComponent extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" }); // Shadow DOM
    }
  
    connectedCallback() {
      this.render();
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
            width: 350px;
            height: 150px;
            display: flex;
            border: 2px solid black;
          }
          .white-key {
            width: 50px;
            height: 150px;
            background: white;
            border: 1px solid black;
            position: relative;
          }
          .black-key {
            border: 2px solid black;
            width: 30px;
            height: 90px;
            background: black;
            position: absolute;
            z-index: 100;
          }
          .highlight {
            background: lightblue !important;
          }
          #C\\# { left: 35px; }
          #D\\# { left: 85px; }
          #F\\# { left: 185px; }
          #G\\# { left: 235px; }
          #A\\# { left: 285px; }
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
  