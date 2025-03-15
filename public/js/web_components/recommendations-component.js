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

    // TODO: Revisar esto de aquí, tal vez haya que mejorar esta función
    addRecomendationsData(data) {
        this.render(data);
    }

    render(data) {
        if (!data) return;
        if (!data.song_recommendations) return;
        if (!data.song_info) return;

        this.shadowRoot.innerHTML = `
            <style>
            .recommendation {
                margin-bottom: 10px;
                padding: 10px;
                border-radius: 5px;
            }
            .recommendations_list {
                display: flex;
                align-items: center;
                justify-content: space-around;
                flex-wrap: wrap;
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
                <div id="recommendationContent_info" class="${this._showingRecommendations ? 'hidden' : ''}">
                    <h2>Info</h2>
                    <p>${data.song_info}</p>
                </div>
                <div id="recommendationContent_recommendations" class="${this._showingRecommendations ? '' : 'hidden'}">
                    <h2>Recommendations</h2>
                    <div class="recommendations_list">
                        ${data.song_recommendations.map(r => `
                            <div class="recommendation">
                                <img src="../../../media/img/recommendations/${r.img}" alt="${r.title}" style="width: 100px; height: 100px;">
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