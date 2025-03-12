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
            // this.render(data); // Re-render el componente
        });
    }

    // TODO: Revisar esto de aquí, tal vez haya que mejorar esta función
    addRecomendationsData(data) {
        this.render(data);
    }

    // TODO: Arreglar contenido html para que las recomendaciones se vean mejor
    // TODO: tratar de mantener aún tras el renderizado que se mantenga el mismo apartado recomendaciones/info
    render(data) {
        if (!data) return;
        if (!data.song_recommendations) return;
        if (!data.song_info) return;

        this.shadowRoot.innerHTML = `
            <style>
            .recommendation {
                margin-bottom: 10px;
                padding: 10px;
                border: 1px solid #ccc;
                border-radius: 5px;
            }
            .lever {
                cursor: pointer;
                padding: 5px 10px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 5px;
                margin-bottom: 10px;
            }
            .hidden {
                display: none;
            }
            </style>
            <div>
            <button class="lever" id="toggleButton">Toggle Info</button>
            <div id="recommendationContent">
                <div id="recommendationContent_info">
                    <h2>Info</h2>
                    <p>${data.song_info}</p>
                </div>
                <div id="recommendationContent_recommendations" class="hidden">
                    <h2>Recommendations</h2>
                    <div class="recommendation">
                        ${data.song_recommendations.map(r => `
                            <img src="../../../media/img/recommendations/${r.img}" alt="${r.title}" style="width: 100px; height: 100px;">
                            <h3>${r.title}</h3>
                        `)}
                    </div>                        
                </div>
            </div>
            </div>
        `;

        const toggleButton = this.shadowRoot.getElementById('toggleButton');
        let showingRecommendations = true;

        toggleButton.addEventListener('click', () => {
            if (showingRecommendations) {
                this.shadowRoot.getElementById('recommendationContent_info').classList.add('hidden');
                this.shadowRoot.getElementById('recommendationContent_recommendations').classList.remove('hidden');
                toggleButton.textContent = 'Show Recommendations';
            } else {
                this.shadowRoot.getElementById('recommendationContent_info').classList.remove('hidden');
                this.shadowRoot.getElementById('recommendationContent_recommendations').classList.add('hidden');
                toggleButton.textContent = 'Show Info';
            }
            showingRecommendations = !showingRecommendations;
        });
    }
}

customElements.define('recommendations-component', RecommendationsComponent);