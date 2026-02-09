let states = {};
let playerState = null;
let selectedState = null;
let multiplier = 1;
let supplies = 100;
let gameHour = 0;

async function loadMap(){
  const res = await fetch("usa.svg");
  const svgText = await res.text();
  document.getElementById("mapContainer").innerHTML = svgText;

  document.querySelectorAll(".state").forEach(el=>{
    let id = el.id;

    states[id] = {
      owner:"peace",
      supplies:50
    };

    el.addEventListener("click",()=>selectState(id));
  });

  populateStartMenu();
}

function populateStartMenu(){
  let sel = document.getElementById("stateSelect");
  for(let s in states){
    let opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    sel.appendChild(opt);
  }
}

function startGame(){
  playerState = document.getElementById("stateSelect").value;
  multiplier = parseInt(document.getElementById("timeSelect").value);

  states[playerState].owner = "player";

  document.getElementById("startMenu").classList.add("hidden");
  document.getElementById("gameUI").classList.remove("hidden");

  updateColors();
  gameLoop();
}

function selectState(name){
  selectedState = name;

  document.getElementById("panelState").textContent = name;
  document.getElementById("panelStatus").textContent =
    "Status: "+states[name].owner;

  if(states[name].owner === "peace"){
    document.getElementById("warBtn").style.display="block";
  } else {
    document.getElementById("warBtn").style.display="none";
  }
}

function declareWar(){
  if(!selectedState) return;
  states[selectedState].owner = "enemy";
  updateColors();
  selectState(selectedState);
}

function updateColors(){
  for(let s in states){
    let el = document.getElementById(s);
    el.classList.remove("player","peace","enemy");
    el.classList.add(states[s].owner);
  }
}

function gameLoop(){
  setInterval(()=>{
    gameHour += multiplier;
    supplies += 1 * multiplier;

    document.getElementById("supplies").textContent = Math.floor(supplies);
    document.getElementById("gameTime").textContent = gameHour;

  },1000);
}

loadMap();
