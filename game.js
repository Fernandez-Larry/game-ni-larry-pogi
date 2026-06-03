(function(){
  function setWelcome(name){
    const header = document.querySelector('.navbar');
    if (!header) return;
    let el = document.getElementById('welcomeName');
    if (!name){ if (el) el.remove(); return; }
    if (!el){
      el = document.createElement('div');
      el.id = 'welcomeName';
      el.className = 'welcome-name';
      // place near the right side but inside header for consistent layout
      const right = document.createElement('div');
      right.className = 'welcome-wrap';
      right.appendChild(el);
      header.appendChild(right);
    }
    el.textContent = 'Welcome, ' + name;
  }

  window.updatePlayerName = function(name){ setWelcome(name); };

  // Confetti animation: simple canvas-based burst
  window.launchConfetti = function(durationMs = 2200){
    const count = 90;
    const colors = ['#ffd166','#06d6a0','#118ab2','#ef476f','#ffd54f'];
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = 10050;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize(); window.addEventListener('resize', resize);

    const particles = [];
    for (let i=0;i<count;i++){
      particles.push({
        x: window.innerWidth/2 + (Math.random()-0.5)*200,
        y: window.innerHeight/2 + (Math.random()-0.5)*60,
        vx: (Math.random()-0.5)*8,
        vy: - (2 + Math.random()*6),
        size: 6 + Math.random()*6,
        color: colors[Math.floor(Math.random()*colors.length)],
        rot: Math.random()*360,
        vr: (Math.random()-0.5)*10,
        life: 0
      });
    }

    let start = performance.now();
    function frame(t){
      const dt = t - start; start = t;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      for (let p of particles){
        p.vy += 0.12; // gravity
        p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life += dt;
        ctx.save();
        ctx.translate(p.x,p.y);
        ctx.rotate(p.rot*Math.PI/180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.6);
        ctx.restore();
      }
      // continue until duration elapsed
      if (performance.now() - (window.__confetti_started || (window.__confetti_started = performance.now())) < durationMs){
        requestAnimationFrame(frame);
      } else {
        // fade out and remove
        setTimeout(()=>{ document.body.removeChild(canvas); window.__confetti_started = null; }, 220);
      }
    }
    requestAnimationFrame((t)=>{ window.__confetti_started = performance.now(); start = t; frame(t); });
  };

  document.addEventListener('DOMContentLoaded', function(){
    setWelcome(localStorage.getItem('playerName'));
    window.addEventListener('storage', function(e){
      if (e.key === 'playerName') setWelcome(e.newValue);
    });
  });
})();
