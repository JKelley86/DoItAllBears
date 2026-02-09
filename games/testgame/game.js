const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 40;

let gameStarted = false;
let timeMultiplier = 4;
let gameTime = 0;

let playerState = null;

let resources = {
  supplies:100,
  steel:100,
  oil:100,
  manpower:100
};

const states = [
  "Minnesota",
  "Texas",
  "California",
  "Florida",
  "New York"
];

const territories = [];
const units = [];
const aiStates = [];

const stateButtonsDiv = document.getElementById("stateButtons");

states.forEach(s=>{
  const btn = document.createElement("button");
  btn.innerText = s;
  btn.onclick = ()=> playerState = s;
  stateButtonsDiv.appendChild(btn);
});

document.getElementById("startBtn").onclick = startGame;

function startGame(){
  if(!playerState){
    alert("Select a state");
    return;
  }

  timeMultiplier = Number(document.getElementById("timeMultiplier").value);

  document.getElementById("startMenu").classList.add("hidden");
  document.getElementById("gameUI").classList.remove("hidden");

  initWorld();
  gameLoop();
}
function initWorld(){

  // Create Minnesota territories
  for(let i=0;i<10;i++){
    territories.push({
      id:"MN"+i,
      x:200 + Math.random()*300,
      y:200 + Math.random()*300,
      owner: i===0 ? "player" : "neutral",
      resource:["supplies","steel","oil"][Math.floor(Math.random()*3)],
      neighbors:[]
    });
  }

  // connect neighbors
  territories.forEach(t=>{
    territories.forEach(o=>{
      if(t!==o && Math.hypot(t.x-o.x,t.y-o.y)<180){
        t.neighbors.push(o.id);
      }
    });
  });

  spawnPlayerUnit();
  spawnAI();
}
function spawnPlayerUnit(){
  const start = territories.find(t=>t.owner==="player");

  units.push({
    x:start.x,
    y:start.y,
    target:null,
    owner:"player",
    speed:0.3
  });
}

function spawnAI(){
  for(let i=0;i<3;i++){
    const t = territories[Math.floor(Math.random()*territories.length)];
    t.owner="AI";

    aiStates.push({
      territory:t.id,
      timer:0
    });

    units.push({
      x:t.x,
      y:t.y,
      target:null,
      owner:"AI",
      speed:0.25
    });
  }
}
function gameLoop(){
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

setInterval(()=>{
  gameTime += 1 * timeMultiplier;

  territories.forEach(t=>{
    if(t.owner==="player"){
      resources[t.resource]+=5;
    }
  });

  document.getElementById("supplies").innerText = Math.floor(resources.supplies);
  document.getElementById("steel").innerText = Math.floor(resources.steel);
  document.getElementById("oil").innerText = Math.floor(resources.oil);
  document.getElementById("manpower").innerText = Math.floor(resources.manpower);
  document.getElementById("gameTime").innerText = Math.floor(gameTime);

  runAI();

},1000);
function runAI(){
  aiStates.forEach(ai=>{
    ai.timer++;

    if(ai.timer>10){
      ai.timer=0;

      const from = territories.find(t=>t.id===ai.territory);
      if(!from) return;

      const possible = from.neighbors
        .map(n=>territories.find(t=>t.id===n))
        .filter(t=>t.owner!=="AI");

      if(possible.length===0) return;

      const target = possible[Math.floor(Math.random()*possible.length)];

      units.push({
        x:from.x,
        y:from.y,
        target:target,
        owner:"AI",
        speed:0.25
      });
    }
  });
}
function update(){

  units.forEach(u=>{
    if(!u.target) return;

    const dx = u.target.x - u.x;
    const dy = u.target.y - u.y;
    const dist = Math.hypot(dx,dy);

    if(dist<1){
      u.target.owner = u.owner;
      u.target = null;
    }else{
      u.x += dx/dist * u.speed * 60;
      u.y += dy/dist * u.speed * 60;
    }
  });

}

canvas.onclick = e=>{
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const clicked = territories.find(t=>Math.hypot(t.x-mx,t.y-my)<20);

  if(!clicked) return;

  const playerUnit = units.find(u=>u.owner==="player" && !u.target);
  if(playerUnit){
    playerUnit.target = clicked;
  }
};

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // roads
  ctx.strokeStyle="#444";
  territories.forEach(t=>{
    t.neighbors.forEach(n=>{
      const o = territories.find(tt=>tt.id===n);
      ctx.beginPath();
      ctx.moveTo(t.x,t.y);
      ctx.lineTo(o.x,o.y);
      ctx.stroke();
    });
  });

  // territories
  territories.forEach(t=>{
    ctx.beginPath();
    ctx.arc(t.x,t.y,15,0,Math.PI*2);

    if(t.owner==="player") ctx.fillStyle="green";
    else if(t.owner==="AI") ctx.fillStyle="red";
    else ctx.fillStyle="gray";

    ctx.fill();
  });

  // units
  units.forEach(u=>{
    ctx.beginPath();
    ctx.arc(u.x,u.y,6,0,Math.PI*2);
    ctx.fillStyle = u.owner==="player" ? "#00ff88" : "#ff4444";
    ctx.fill();
  });
}
