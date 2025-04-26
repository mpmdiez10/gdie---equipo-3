class RecommendationsComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._subject = null;
        this._showingRecommendations = true;
    }

    connectedCallback() {
        this.render();
    }

    set subject(value) {
        this._subject = value;
        this._subject.subscribe(data => {
            this.addRecomendationsData(data);
        });
    }

    addRecomendationsData(data) {
        this.render(data);
    }

    render(data) {
        if (!data) return;
        if (data.song_recommendations.length === 0) return;
        if (!data.song_info) return;

        this.shadowRoot.innerHTML = /* html */`
            <style>
            .recommendation {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-bottom: 10px;
                padding: 10px;
                border-radius: 5px;
                word-wrap: break-word;
                max-width: 50%; /* Adjust the width as needed */
                text-align: center;
            }
            .recommendations_list {
                display: flex;
                align-items: center;
                justify-content: space-around;
                flex-wrap: wrap;
            }
            .song_info {
                text-align: justify;
                font-size: 1.4em;
            }
            .lever {
                margin: 0 5px;
                padding: 0.65rem 1.4rem;
                cursor: pointer;
                background-color: #007bff;
                color: white;
                text-transform: capitalize;
                font-size: 1.2rem;
                font-weight: bold;
                border: none;
                border-radius: 3px;
                opacity: 1;
            }
            .hidden {
                display: none;
            }
            h2 {
                font-size: 1.8em;
            }
            </style>
            <div>
                <button class="lever" id="toggleButton">Cambiar Información</button>
                <div id="recommendationContent">
                    <div id="recommendationContent_info" class="${this._showingRecommendations ? 'hidden' : ''}">
                        <h2>Información de la canción</h2>
                        <p class="song_info">${data.song_info}</p>
                    </div>
                    <div id="recommendationContent_recommendations" class="${this._showingRecommendations ? '' : 'hidden'}">
                        <h2>Canciones similares</h2>
                        <div class="recommendations_list">
                            ${data.song_recommendations.map(r => `
                                <div class="recommendation">
                                    <img src="../../../assets/media/img/recommendations/${r.img}" alt="${r.title}" style="width: 100px; height: 100px;">
                                    <h3>${r.title}</h3>
                                </div>                        
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        const toggleButton = this.shadowRoot.getElementById('toggleButton');

        toggleButton.addEventListener('click', () => {
            this._showingRecommendations = !this._showingRecommendations;
            this.render(data);
        });
    }
}

customElements.define('recommendations-component', RecommendationsComponent);