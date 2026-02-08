function runAI(){
  if(!game) return;

  if(Math.random()<0.1){
    const aiStates=Object.keys(game.states).filter(s=>game.states[s].owner==="AI");
    const target=aiStates[Math.floor(Math.random()*aiStates.length)];

    game.states[target].owner="AI";
  }
}
