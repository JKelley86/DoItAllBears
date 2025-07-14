// ✅ Make navigateTo globally available
function navigateTo(url) {
    window.location.href = url;
}

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

        if (!sidebar.querySelector('button.logout-btn')) {
            const logoutBtn = document.createElement('button');
            logoutBtn.textContent = '🚪 Logout';
            logoutBtn.className = 'popup-button login-btn';
            logoutBtn.onclick = logout;
            sidebar.insertBefore(logoutBtn, insertBeforeNode);
        }
    }

    function addHouseCardToMain() {
        if (!mainContainer || mainContainer.querySelector('[data-dynamic="house"]')) return;

        const card = document.createElement('div');
        card.className = 'nav-card';
        card.textContent = '🏡 Home';
        card.setAttribute('data-dynamic', 'house');
        card.onclick = () => navigateTo('home/index.html');
        mainContainer.insertBefore(card, mainContainer.firstChild);
    }

    function logout() {
        localStorage.removeItem('loggedInUser');
        location.reload();
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
