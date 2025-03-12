class RecommendationsComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._subject = null;
        this.recommendations = []; 
    }

    connectedCallback() {
        this.render();
    }

    set subject(value) {
        this._subject = value;
        this._subject.subscribe(data => {
            this.addRecomendationsData(data);
            this.render(); // Re-render el componente
        });
    }

    // TODO: Implementar lógica para añadir recomendaciones
    addRecomendationsData(data) {
        console.log(data);
        // Add the new recommendations data to the list
        this.recommendations.push(data);
    }

    // TODO: Implementar renderizado de recomendaciones
    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .recommendation {
                    margin-bottom: 10px;
                    padding: 10px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                }
            </style>
            <div>
                <h2>Recommendations</h2>
                ${this.recommendations.map(rec => `
                    <div class="recommendation">
                        <p>${rec}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

customElements.define('recommendations-component', RecommendationsComponent);