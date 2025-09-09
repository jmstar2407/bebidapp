// header-component.js
class HeaderComponent extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `
            <div class="header">
                <div style="margin-left: 50px;">
                    <h1>🍹 <span style="color: #1a2135">Bebid</span><span style="color: #fc4f62;">app</span> - Sistema de Bebida
                    </h1>
                </div>

                <div style="margin-right: 50px;display: inline-flex;gap: 1rem;">
                    <a href="index.html" class="button-link">Facturación</a>
                    <a href="inventario.html" class="button-link">Inventario</a>
                </div>
            </div>
        `;
        
        // Añadir clase active al botón correspondiente
        const currentPage = window.location.pathname.split('/').pop();
        const buttons = this.querySelectorAll('.button-link');
        
        buttons.forEach(button => {
            const buttonPage = button.getAttribute('href');
            if (currentPage === buttonPage) {
                button.classList.add('active');
            }
        });
    }
}

// Definir el componente personalizado
customElements.define('header-component', HeaderComponent);