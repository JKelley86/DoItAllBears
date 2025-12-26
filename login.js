// NOTE: Since navigateTo is global in index.html, no need to redeclare here.

document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar');
    const mainContainer = document.getElementById('main-container');

    function updateSidebarForLoggedInUser(username) {
        const loginBtn = document.querySelector('.popup-button');
        if (loginBtn) loginBtn.style.display = 'none';

        const themeToggle = document.querySelector('.theme-toggle');
        const insertBeforeNode = loginBtn || themeToggle;

        if (!sidebar.querySelector('a[href="home/index.html"]')) {
            const houseLink = document.createElement('a');
            houseLink.href = 'home/index.html';
            houseLink.textContent = '🏠 House';
            sidebar.insertBefore(houseLink, insertBeforeNode);
        }

        if (!sidebar.querySelector('a[href="justin/index.html"]')) {
            const justinLink = document.createElement('a');
            justinLink.href = 'justin/index.html';
            justinLink.textContent = '🏕️ Justins Page';
            sidebar.insertBefore(justinLink, insertBeforeNode);
        }

        if (!sidebar.querySelector('button.logout-btn')) {
            const logoutBtn = document.createElement('button');
            logoutBtn.textContent = '🚪 Logout';
            logoutBtn.className = 'popup-button login-btn';
            logoutBtn.onclick = logout;
            sidebar.insertBefore(logoutBtn, insertBeforeNode);
        }
    }

        function addHouseCardToMain() {
            // Always (re)add the listener even if the card exists
            let card = mainContainer.querySelector('[data-dynamic="house"]');
            if (!mainContainer) return;

            if (!card) {
                card = document.createElement('div');
                card.className = 'nav-card';
                card.textContent = '🏡 Home';
                card.setAttribute('data-dynamic', 'house');
                mainContainer.insertBefore(card, mainContainer.firstChild);
            }

    // Reattach click listener
    card.onclick = () => navigateTo('home/index.html');
}

    function updateUIIfLoggedIn() {
        const user = localStorage.getItem('loggedInUser');
        if (user) {
            updateSidebarForLoggedInUser(user);
            addHouseCardToMain();
        }
    }

    document.addEventListener('navbarLoaded', updateUIIfLoggedIn);
    updateUIIfLoggedIn();
});
