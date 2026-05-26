let tickets = parseInt(localStorage.getItem('tickets')) || 500;
let tokens = parseInt(localStorage.getItem('tokens')) || 50;

function updateUI(){
    document.getElementById('tickets').textContent = tickets;
    document.getElementById('tokens').textContent = tokens;
}

export function spendTokens(amount){

    if(tokens < amount){
        alert('Not enough tokens!');
        return false;
    }

    tokens -= amount;

    save();
    updateUI();

    return true;
}

export function addTickets(amount){

    tickets += amount;

    save();
    updateUI();

    confetti({
        particleCount:80,
        spread:70
    });
}

export function addTokens(amount){

    tokens += amount;

    save();
    updateUI();
}

function save(){

    localStorage.setItem('tickets', tickets);
    localStorage.setItem('tokens', tokens);
}

export function initEconomy(){
    updateUI();
}
