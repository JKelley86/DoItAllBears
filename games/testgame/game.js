let game = null;
let selectedState = null;

function startGame(mult){
  game = {
    multiplier: mult,
    startTime: Date.now(),
    player:{
      resources:{money:5000,oil:2000,steel:1500,research:0},
      ownedStates:[],
    },
    states:{}
  };

  STATES.forEach(s=>{
    game.states[s]={owner:null,buildings:[]}
  });

  document.getElementById("startScreen").style.display="none";
  renderMap();
  tick();
}

function renderMap(){
  const map=document.getElementById("map");
  map.innerHTML="";

  STATES.forEach(s=>{
    const div=document.createElement("div");
    div.className="state";
    if(game.player.ownedStates.includes(s)) div.classList.add("owned");
    div.innerText=s;
    div.onclick=()=>selectState(s);
    map.appendChild(div);
  });
}

function selectState(s){
  selectedState=s;

  if(game.player.ownedStates.length===0){
    game.player.ownedStates.push(s);
    game.states[s].owner="player";
    renderMap();
  }

  document.getElementById("stateName").innerText=s;
}

function build(type){
  if(!selectedState) return;

  const cost={factory:500,oil:400,steel:400,barracks:600};

  if(game.player.resources.money<cost[type]) return;

  game.player.resources.money-=cost[type];

  game.states[selectedState].buildings.push({
    type:type,
    start:Date.now(),
    time:10000
  });

  log(type+" started in "+selectedState);
}

function log(t){
  document.getElementById("log").innerHTML+=t+"<br>";
}

function tick(){
  if(!game) return;

  const elapsed=(Date.now()-game.startTime)*game.multiplier/1000;

  game.player.resources.money+=0.05;
  game.player.resources.oil+=0.02;
  game.player.resources.steel+=0.02;

  updateTop();
  saveGame();

  setTimeout(tick,1000);
}

function updateTop(){
  document.getElementById("money").innerText="Money: "+Math.floor(game.player.resources.money);
  document.getElementById("oil").innerText="Oil: "+Math.floor(game.player.resources.oil);
  document.getElementById("steel").innerText="Steel: "+Math.floor(game.player.resources.steel);
  document.getElementById("research").innerText="Research: "+Math.floor(game.player.resources.research);
}

function saveGame(){
  localStorage.setItem("justinGame",JSON.stringify(game));
}

function loadGame(){
  const s=localStorage.getItem("justinGame");
  if(s){
    game=JSON.parse(s);
    document.getElementById("startScreen").style.display="none";
    renderMap();
    tick();
  }
}

window.onload=loadGame;
