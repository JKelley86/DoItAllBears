const overlay = document.getElementById('gameOverlay');
const title = document.getElementById('gameTitle');

document.getElementById('exitBtn').onclick = closeGame;

export function openGame(name){

    overlay.style.display = 'flex';
    title.textContent = name;
}

export function closeGame(){

    overlay.style.display = 'none';
}
