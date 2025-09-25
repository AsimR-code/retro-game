const ROWS=6, COLS=9;
const START_ROW=Math.floor(ROWS/2);
let mines, player, visited, successGoalRow=null, gameOver=false;
let revealedMines=new Set(); let debugMode=false;

const gridEl=document.getElementById("grid");
const statusEl=document.getElementById("status");
const key=(r,c)=>`${r},${c}`;
function inBounds(r,c){ return r>=0&&r<ROWS&&c>=0&&c<COLS; }
function neighbors4(r,c){ return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].filter(([rr,cc])=>inBounds(rr,cc)); }
function hasColMine(col){ for(let r=0;r<ROWS;r++) if(mines.has(key(r,col))) return true; return false; }

function makeGrid(){
  gridEl.innerHTML="";
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      const d=document.createElement("div");
      d.className="cell"; d.dataset.r=r; d.dataset.c=c;
      if(r===START_ROW && c===0) d.classList.add("start");
      if(c===COLS-1) d.classList.add("goal");
      gridEl.appendChild(d);
    }
  }
}

function pathExists(){
  const q=[[START_ROW,0]];
  const seen=new Set([key(START_ROW,0)]);
  while(q.length){
    const [r,c]=q.shift();
    if(c===COLS-1) return true;
    for(const [nr,nc] of neighbors4(r,c)){
      const k=key(nr,nc);
      if(mines.has(k)||seen.has(k)) continue;
      seen.add(k); q.push([nr,nc]);
    }
  }
  return false;
}


function fixNoFourEmptyInRow(){
  let changed=false;
  for(let r=0;r<ROWS;r++){
    let run=0;
    for(let c=0;c<COLS-1;c++){
      const k=key(r,c);
      if(!mines.has(k)){
        run++;
        if(run>=4){
          const candidates=[];
          for(let cc=c-3;cc<=c;cc++){
            if(cc===COLS-2) continue;
            if(r===START_ROW && cc===0) continue;
            candidates.push(cc);
          }
          if(candidates.length){
            const targetCol=candidates[Math.floor(Math.random()*candidates.length)];
            const rr=r;
            mines.add(key(rr,targetCol));
            changed=true;
          }
          run=0;
        }
      } else run=0;
    }
  }
  return changed;
}

function generateBoard(){
  let ok=false;
  while(!ok){
    mines=new Set();
    const density=Math.max(0,Math.min(0.8,parseFloat(document.getElementById("mineRatio").value)||0.5));
    for(let rr=0;rr<ROWS;rr++){
      for(let cc=0;cc<COLS-1;cc++){
        if(cc===COLS-2) continue;
        if(rr===START_ROW && cc===0) continue;
        if(Math.random()<density) mines.add(key(rr,cc));
      }
    }
  
    for(let cc=1;cc<COLS-2;cc++){
      if(!hasColMine(cc)){
        let rr=Math.floor(Math.random()*ROWS);
        mines.add(key(rr,cc));
      }
    }
  
    while(fixNoFourEmptyInRow()){}
    ok=pathExists();
  }
}

function resetState(){
  player={r:START_ROW,c:0};
  visited=new Set([key(player.r,player.c)]);
  if(successGoalRow===null) successGoalRow=Math.floor(Math.random()*ROWS);
  gameOver=false; revealedMines.clear();
  setStatus("Hazır"); paint();
}

function setStatus(t){ statusEl.textContent=t; }

function paint(){
  [...gridEl.children].forEach(el=>{
    const r=+el.dataset.r,c=+el.dataset.c,k=key(r,c);
    el.className="cell";
    if(r===START_ROW&&c===0) el.classList.add("start");
    if(c===COLS-1) el.classList.add("goal");
    if(visited.has(k)) el.classList.add("visited");
    if(player.r===r&&player.c===c) el.classList.add("player");
    if(revealedMines.has(k)) el.classList.add("mine-revealed");
    if(debugMode&&mines.has(k)) el.classList.add("debug-mine");
  });
}

document.addEventListener("keydown",e=>{
  if(e.key==="ArrowRight") move("R");
  if(e.key==="ArrowUp") move("U");
  if(e.key==="ArrowDown") move("D");
  if(e.key.toLowerCase()==="m"){ debugMode=!debugMode; paint(); }
});
document.getElementById("newGame").addEventListener("click",init);

function move(dir){
  if(gameOver) return;
  let {r,c}=player; let nr=r,nc=c;
  if(dir==="R") nc++; if(dir==="U") nr--; if(dir==="D") nr++;
  if(!inBounds(nr,nc)||nc<c) return;
  const k=key(nr,nc);
  const cellEl=gridEl.querySelector(`[data-r="${nr}"][data-c="${nc}"]`);
  if(mines.has(k)){
    revealedMines.add(k); paint();
    cellEl.classList.add("mine-revealed"); setStatus("💣 Mina!");
    player={r:START_ROW,c:0}; visited=new Set([key(player.r,player.c)]);
    setTimeout(paint,30); return;
  }
  player={r:nr,c:nc}; visited.add(k); paint();
  if(nc===COLS-1){
    if(nr===successGoalRow){
      cellEl.textContent="REFINANS"; cellEl.classList.add("success-card");
      setStatus("🏁 Uğurlu kart!");
       confetti({
    particleCount: 150,
    spread: 80,
    origin: { y: 0.6 }
  });
    } else {
      cellEl.textContent="X"; cellEl.classList.add("fail-card");
      setStatus("❌ Uğursuz kart!");
    }
    gameOver=true;
  } else setStatus("Davam...");
}

function init(){ makeGrid(); generateBoard(); resetState(); }
init();
