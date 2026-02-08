function loadMap(){
  fetch("map.svg")
    .then(r=>r.text())
    .then(svg=>{
      document.getElementById("mapContainer").innerHTML=svg;
      setupStates();
      renderOwnership();
    });
}

function setupStates(){
  document.querySelectorAll(".state").forEach(el=>{
    el.addEventListener("click",()=>{
      selectState(el.id);
    });
  });
}

function renderOwnership(){
  document.querySelectorAll(".state").forEach(el=>{
    el.classList.remove("owned","ai");

    const s=el.id;
    if(!game) return;

    if(game.states[s].owner==="player") el.classList.add("owned");
    else el.classList.add("ai");
  });
}
