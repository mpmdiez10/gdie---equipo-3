class VideoComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this.render();
    }

    set subject(value) {
        this._subject = value;
        console.log('subject set')
        setTimeout(() => {
            console.log('Dentro del delay');
            this._subject.next('Hola buenas');
        }, 3000);
    }

    static get observedAttributes() {
        return ["src"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "src") {
            this.render();
        }
    }


    render() {
        const shadow = this.shadowRoot;
        shadow.innerHTML = `
            <style>
                video {
                    border: 1px solid black;
                }
            </style>
            <video controls width="640" height="360">
                <source src="${this.getAttribute('src')}" type="video/mp4">
            </video>
        `;
    }
}

customElements.define('video-component', VideoComponent);