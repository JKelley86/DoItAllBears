let game=null;
let selectedState=null;

function startGame(mult){
  game={
    multiplier:mult,
    startTime:Date.now(),
    player:{ownedStates:[],resources:{money:500,oil:200,steel:200}},
    states:{}
  };

  for(const s in STATE_DATA){
    game.states[s]={owner:"AI"};
  }

  document.getElementById("startScreen").style.display="none";
  loadMap();
  tick();
}

function selectState(s){
  selectedState=s;

  if(game.player.ownedStates.length===0){
    game.player.ownedStates.push(s);
    game.states[s].owner="player";
    log("You started in "+s);
  }

  renderOwnership();
  document.getElementById("stateName").innerText=s;
}

function buildFactory(){
  if(!selectedState) return;
  log("Factory started in "+selectedState);
}

function tick(){
  if(!game) return;

  const hours=(Date.now()-game.startTime)/3600000*game.multiplier;

  game.player.resources.money=0;
  game.player.resources.oil=0;
  game.player.resources.steel=0;

  game.player.ownedStates.forEach(s=>{
    game.player.resources.money+=STATE_DATA[s].money;
    game.player.resources.oil+=STATE_DATA[s].oil;
    game.player.resources.steel+=STATE_DATA[s].steel;
  });

  updateTop();
  runAI();
  saveGame();

  setTimeout(tick,2000);
}

function updateTop(){
  document.getElementById("money").innerText="Money: "+Math.floor(game.player.resources.money);
  document.getElementById("oil").innerText="Oil: "+Math.floor(game.player.resources.oil);
  document.getElementById("steel").innerText="Steel: "+Math.floor(game.player.resources.steel);
}

function log(t){
  document.getElementById("log").innerHTML+=t+"<br>";
}

function saveGame(){
  localStorage.setItem("jtgSave",JSON.stringify(game));
}

function loadGame(){
  const s=localStorage.getItem("jtgSave");
  if(s){
    game=JSON.parse(s);
    loadMap();
    tick();
  }
}

window.onload=loadGame;
