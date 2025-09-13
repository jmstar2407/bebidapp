// header-component.js
class HeaderComponent extends HTMLElement {
    constructor() {
        super();
        this.initialized = false;
    }

    connectedCallback() {
        this.render();
        this.waitForFirebase();
    }

    render() {
        this.innerHTML = `
            <div class="header">
                <div style="margin-left: 50px;">
                    <h1>🍹 <span style="color: #1a2135">Bebid</span><span style="color: #fc4f62;">app</span> - Sistema de Bebida</h1>
                </div>

                <div style="margin-right: 50px;display: inline-flex;gap: 1rem;align-items: center;">
                    <a href="index.html" class="button-link">Facturación</a>
                    <a href="caja.html" class="button-link">Caja</a>
                    <a href="facturas_generadas.html" class="button-link">Facturas Generadas</a>
                    <a href="inventario.html" class="button-link">Inventario</a>
                    <a href="admin.html" class="button-link" id="adminLink" style="display:none;">Admin</a>
                    
                                        <div class="user-info" id="userInfo" style="display: none;">
                        <div class="user-name" id="userName"></div>
                        <div class="user-role" id="userRole"></div>
                    </div>
                    
                    <button class="button-link" id="logoutBtn" style="display:none;"><img src="./img/icons/logout_1.png" style="    height: 34px;"></button>
                </div>
            </div>
        `;

        // Marcar botón activo según la página actual
        const currentPage = window.location.pathname.split('/').pop();
        this.querySelectorAll('.button-link').forEach(button => {
            const buttonPage = button.getAttribute('href');
            if (buttonPage && currentPage === buttonPage) {
                button.classList.add('active');
            }
        });

        // Evento logout
        const logoutBtn = this.querySelector('#logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    waitForFirebase() {
        // Verificar si Firebase ya está cargado
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            this.checkAuth();
            return;
        }

        // Si no está cargado, esperar a que se cargue
        const checkInterval = setInterval(() => {
            if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                clearInterval(checkInterval);
                this.checkAuth();
            }
        }, 100);

        // Timeout por si Firebase nunca se carga
        setTimeout(() => {
            clearInterval(checkInterval);
            if (typeof firebase === 'undefined') {
                console.error('Firebase no se cargó después de 5 segundos');
            }
        }, 5000);
    }

   async checkAuth() {
        if (this.initialized) return;
        
        try {
            const auth = firebase.auth();
            const db = firebase.firestore();

            auth.onAuthStateChanged(async (user) => {
                const adminLink = this.querySelector('#adminLink');
                const inventoryLink = this.querySelector('#inventoryLink'); // Nuevo selector
                const logoutBtn = this.querySelector('#logoutBtn');
                const userInfo = this.querySelector('#userInfo');
                const userName = this.querySelector('#userName');
                const userRole = this.querySelector('#userRole');

                if (user) {
                    // ✅ Mostrar botón de cerrar sesión
                    if (logoutBtn) logoutBtn.style.removeProperty("display");
                    
                    // ✅ Obtener información del usuario desde Firestore
                    try {
                        const doc = await db.collection('users').doc(user.uid).get();
                        if (doc.exists) {
                            const userData = doc.data();
                            
                            // Mostrar información del usuario
                            if (userInfo) userInfo.style.removeProperty("display");
                            
                            // Obtener solo el primer nombre
                            const firstName = userData.name ? userData.name.split(' ')[0] : 'Usuario';
                            if (userName) userName.textContent = firstName;
                            
                            // Mostrar el rol con la primera letra en mayúscula
                            const role = userData.role || 'usuario';
                            if (userRole) userRole.textContent = role.charAt(0).toUpperCase() + role.slice(1);
                            
                            // Verificar si es administrador
                            if (userData.role === 'administrador') {
                                if (adminLink) adminLink.style.removeProperty("display");
                                if (inventoryLink) inventoryLink.style.removeProperty("display"); // Mostrar inventario
                            } else {
                                if (adminLink) adminLink.style.display = "none";
                                if (inventoryLink) inventoryLink.style.display = "none"; // Ocultar inventario
                            }
                        }
                    } catch (error) {
                        console.error('Error al obtener datos del usuario:', error);
                    }
                } else {
                    // ❌ No hay usuario: ocultar botones
                    if (adminLink) adminLink.style.display = "none";
                    if (inventoryLink) inventoryLink.style.display = "none"; // Ocultar inventario
                    if (logoutBtn) logoutBtn.style.display = "none";
                    if (userInfo) userInfo.style.display = "none";

                    // Redirigir al login si no estamos ya en login.html
                    if (!window.location.pathname.endsWith('login.html')) {
                        window.location.href = 'login.html';
                    }
                }
            });
            
            this.initialized = true;
        } catch (error) {
            console.error('Error inicializando Firebase en header:', error);
        }
    }

    

    logout() {
        if (typeof firebase !== 'undefined') {
            firebase.auth().signOut()
                .then(() => window.location.href = 'login.html')
                .catch((error) => console.error('Error al cerrar sesión:', error));
        } else {
            window.location.href = 'login.html';
        }
    }
}

customElements.define('header-component', HeaderComponent);