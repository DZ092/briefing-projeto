// Fundo da página inteira: grade de letras quase apagada, sempre em movimento.
// Luzes que passeiam sozinhas acendem e embaralham as letras; o cursor (ou o dedo)
// acende mais forte. Para ficar leve: só redesenha as letras que mudam e roda a 30 quadros.
// Com "reduzir movimento", a grade fica parada.
(function () {
  if (!window.HTMLCanvasElement) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'fundo-letras';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(canvas, document.body.firstChild);
  const ctx = canvas.getContext('2d', { alpha: false });

  const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/+';
  const CL = 11, CA = 18;            // tamanho da célula
  const BASE = 0.13;                 // brilho das letras apagadas
  const INTERVALO = 1000 / 30;       // 30 quadros por segundo
  const parado = window.matchMedia('(prefers-reduced-motion: reduce)');

  let cols = 0, linhas = 0, total = 0, larg = 0, alt = 0;
  let grade, brilho, alvo, marcado, acesos = [];
  let cursor = { x: -9999, y: -9999, ativo: false };
  let quadro = 0, ultimo = 0, t0 = performance.now();

  // Luzes que passeiam pela tela (posição em fração da tela, velocidade e raio)
  const luzes = [
    { fx: 0.2, fy: 0.3, vx: 0.07, vy: 0.05, raio: 190, forca: 0.85 },
    { fx: 0.7, fy: 0.6, vx: -0.055, vy: 0.065, raio: 160, forca: 0.75 },
    { fx: 0.5, fy: 0.1, vx: 0.045, vy: -0.05, raio: 230, forca: 0.6 },
    { fx: 0.9, fy: 0.9, vx: -0.06, vy: -0.04, raio: 140, forca: 0.7 }
  ];

  function sortear() { return LETRAS[(Math.random() * LETRAS.length) | 0]; }

  function medir() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    larg = window.innerWidth; alt = window.innerHeight;
    canvas.width = Math.round(larg * dpr); canvas.height = Math.round(alt * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(larg / CL); linhas = Math.ceil(alt / CA); total = cols * linhas;
    grade = new Array(total); for (let i = 0; i < total; i++) grade[i] = sortear();
    brilho = new Float32Array(total); alvo = new Float32Array(total); marcado = new Uint8Array(total);
    acesos = [];
    ctx.font = '500 12px ui-monospace, Consolas, "Courier New", monospace';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, larg, alt);
    ctx.fillStyle = 'rgba(255,255,255,' + BASE + ')';
    for (let i = 0; i < total; i++) ctx.fillText(grade[i], (i % cols) * CL, ((i / cols) | 0) * CA);
  }

  function celula(i) {
    const x = (i % cols) * CL, y = ((i / cols) | 0) * CA;
    ctx.fillStyle = '#000'; ctx.fillRect(x, y, CL, CA);
    ctx.fillStyle = 'rgba(255,255,255,' + Math.min(1, BASE + brilho[i] * 0.87).toFixed(3) + ')';
    ctx.fillText(grade[i], x, y);
  }

  let candidatos = [];
  function candidato(i) { if (!marcado[i]) { marcado[i] = 1; candidatos.push(i); } }

  // Acende as células em volta de um ponto (só a caixa do raio, não a grade toda)
  function iluminar(px, py, raio, forca) {
    const c0 = Math.max(0, ((px - raio) / CL) | 0), c1 = Math.min(cols - 1, ((px + raio) / CL) | 0);
    const l0 = Math.max(0, ((py - raio) / CA) | 0), l1 = Math.min(linhas - 1, ((py + raio) / CA) | 0);
    for (let l = l0; l <= l1; l++) {
      for (let c = c0; c <= c1; c++) {
        const dx = c * CL + CL / 2 - px, dy = l * CA + CA / 2 - py;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d >= raio) continue;
        const i = l * cols + c, v = (1 - d / raio) * forca;
        if (v > alvo[i]) alvo[i] = v;
        candidato(i);
      }
    }
  }

  function passo(agora) {
    quadro = requestAnimationFrame(passo);
    if (agora - ultimo < INTERVALO) return;
    const dt = Math.min(0.1, (agora - ultimo) / 1000); ultimo = agora;
    const tempo = (agora - t0) / 1000;

    candidatos = [];
    for (let k = 0; k < acesos.length; k++) candidato(acesos[k]);

    luzes.forEach(function (z, n) {
      z.fx += z.vx * dt; z.fy += z.vy * dt;
      if (z.fx < 0 || z.fx > 1) z.vx = -z.vx;
      if (z.fy < 0 || z.fy > 1) z.vy = -z.vy;
      const pulso = 0.85 + 0.15 * Math.sin(tempo * 1.3 + n * 2);
      iluminar(z.fx * larg, z.fy * alt, z.raio * pulso, z.forca);
    });
    if (cursor.ativo) iluminar(cursor.x, cursor.y, 170, 1);

    // varredura: a cada 7 s uma faixa clara desce a tela inteira em 2,5 s
    const ciclo = tempo % 7;
    if (ciclo < 2.5) {
      const y = (ciclo / 2.5) * (alt + 6 * CA) - 3 * CA;
      const l0 = Math.max(0, ((y - 3 * CA) / CA) | 0), l1 = Math.min(linhas - 1, ((y + 3 * CA) / CA) | 0);
      for (let l = l0; l <= l1; l++) {
        const v = 0.55 * (1 - Math.abs(l * CA + CA / 2 - y) / (3 * CA));
        if (v <= 0) continue;
        for (let c = 0; c < cols; c++) { const i = l * cols + c; if (v > alvo[i]) alvo[i] = v; candidato(i); }
      }
    }

    // cintilação: algumas letras soltas acendem e trocam
    const soltas = Math.max(6, (total * 0.004) | 0);
    for (let k = 0; k < soltas; k++) {
      const i = (Math.random() * total) | 0;
      grade[i] = sortear();
      if (alvo[i] < 0.3 && Math.random() < 0.5) brilho[i] = Math.max(brilho[i], 0.5);
      candidato(i);
    }

    const novos = [];
    for (let k = 0; k < candidatos.length; k++) {
      const i = candidatos[k];
      brilho[i] += (alvo[i] - brilho[i]) * 0.2;
      if (brilho[i] > 0.15 && Math.random() < brilho[i] * 0.35) grade[i] = sortear();
      celula(i);
      if (brilho[i] > 0.01 || alvo[i] > 0) novos.push(i); else brilho[i] = 0;
      alvo[i] = 0; marcado[i] = 0;
    }
    acesos = novos;
  }

  function iniciar() {
    if (quadro || parado.matches || document.hidden) return;
    ultimo = performance.now(); quadro = requestAnimationFrame(passo);
  }
  function parar() { cancelAnimationFrame(quadro); quadro = 0; }

  window.addEventListener('pointermove', function (e) { cursor.x = e.clientX; cursor.y = e.clientY; cursor.ativo = true; }, { passive: true });
  window.addEventListener('pointerdown', function (e) { cursor.x = e.clientX; cursor.y = e.clientY; cursor.ativo = true; }, { passive: true });
  document.addEventListener('pointerleave', function () { cursor.ativo = false; });
  document.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') cursor.ativo = false; });
  document.addEventListener('visibilitychange', function () { if (document.hidden) parar(); else iniciar(); });

  let espera = 0;
  window.addEventListener('resize', function () {
    clearTimeout(espera);
    espera = setTimeout(function () {
      // no celular a barra de endereço muda a altura ao rolar: só refaz se mudar de verdade
      if (Math.abs(window.innerWidth - larg) > 2 || Math.abs(window.innerHeight - alt) > 80) medir();
    }, 150);
  });
  if (parado.addEventListener) parado.addEventListener('change', function () { if (parado.matches) { parar(); medir(); } else iniciar(); });

  medir();
  iniciar();
})();
