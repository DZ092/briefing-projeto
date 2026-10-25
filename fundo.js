// Fundo do cabeçalho: grade de letras quase apagada que acende e embaralha
// perto do cursor (ou do dedo, no celular). Com "reduzir movimento", fica parada.
(function () {
  const topo = document.querySelector('.topo');
  if (!topo || !window.HTMLCanvasElement) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'fundo-letras';
  canvas.setAttribute('aria-hidden', 'true');
  topo.insertBefore(canvas, topo.firstChild);
  const ctx = canvas.getContext('2d');

  const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/+';
  const CELULA_L = 11, CELULA_A = 18, RAIO = 130;
  const parado = window.matchMedia('(prefers-reduced-motion: reduce)');
  let cols = 0, linhas = 0, grade = [], brilho = [];
  let largura = 0, altura = 0;
  let mx = -9999, my = -9999, ativo = false, visivel = true, quadro = 0;

  function sortear() { return LETRAS[(Math.random() * LETRAS.length) | 0]; }

  function medir() {
    const r = topo.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    largura = r.width; altura = r.height;
    canvas.width = Math.round(largura * dpr); canvas.height = Math.round(altura * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(largura / CELULA_L); linhas = Math.ceil(altura / CELULA_A);
    grade = Array.from({ length: cols * linhas }, sortear);
    brilho = new Float32Array(cols * linhas);
    desenhar();
  }

  function desenhar() {
    ctx.clearRect(0, 0, largura, altura);
    ctx.font = '500 12px ui-monospace, Consolas, "Courier New", monospace';
    ctx.textBaseline = 'top';
    for (let l = 0; l < linhas; l++) {
      for (let c = 0; c < cols; c++) {
        const i = l * cols + c, x = c * CELULA_L, y = l * CELULA_A;
        const b = brilho[i];
        if (b > 0.02) {
          // perto do cursor: amarelo marca-texto, mais forte no centro
          ctx.fillStyle = 'rgba(244, 194, 13, ' + (0.12 + b * 0.5).toFixed(3) + ')';
        } else {
          ctx.fillStyle = 'rgba(232, 241, 243, 0.10)';
        }
        ctx.fillText(grade[i], x, y);
      }
    }
  }

  function passo() {
    if (!visivel || document.hidden) { quadro = 0; return; }
    for (let l = 0; l < linhas; l++) {
      for (let c = 0; c < cols; c++) {
        const i = l * cols + c;
        let alvo = 0;
        if (ativo) {
          const dx = c * CELULA_L + CELULA_L / 2 - mx, dy = l * CELULA_A + CELULA_A / 2 - my;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < RAIO) alvo = 1 - d / RAIO;
        }
        brilho[i] += (alvo - brilho[i]) * 0.18;
        // embaralha quem está aceso; o resto troca bem devagar
        if ((brilho[i] > 0.2 && Math.random() < 0.25) || Math.random() < 0.002) grade[i] = sortear();
      }
    }
    desenhar();
    // continua rodando para a troca lenta de letras; para quando o cabeçalho sai da tela
    quadro = requestAnimationFrame(passo);
  }

  function iniciar() { if (!quadro && !parado.matches) quadro = requestAnimationFrame(passo); }

  function apontar(e) {
    const r = canvas.getBoundingClientRect();
    mx = e.clientX - r.left; my = e.clientY - r.top;
    ativo = my >= 0 && my <= r.height && mx >= 0 && mx <= r.width;
    iniciar();
  }

  window.addEventListener('pointermove', apontar, { passive: true });
  window.addEventListener('pointerdown', apontar, { passive: true });
  window.addEventListener('pointerleave', function () { ativo = false; });
  document.addEventListener('pointerup', function (e) { if (e.pointerType === 'touch') ativo = false; });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visivel = es[0].isIntersecting; if (visivel) iniciar(); }).observe(topo);
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) iniciar(); });
  if ('ResizeObserver' in window) new ResizeObserver(medir).observe(topo); else window.addEventListener('resize', medir);
  parado.addEventListener && parado.addEventListener('change', function () { if (parado.matches) { cancelAnimationFrame(quadro); quadro = 0; brilho.fill(0); desenhar(); } else iniciar(); });

  medir();
  iniciar();
})();
