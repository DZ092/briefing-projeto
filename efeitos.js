// Títulos que "decifram" letra por letra, no mesmo estilo das letras do fundo.
// O título principal decifra ao abrir; os das partes, quando aparecem na tela.
// Com "reduzir movimento", os textos aparecem prontos.
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/+';

  // Último pedaço de texto do elemento (no h2, o texto vem depois do "Parte X de 6" escondido)
  function textoDe(el) {
    for (let n = el.lastChild; n; n = n.previousSibling) if (n.nodeType === 3 && n.textContent.trim()) return n;
    return null;
  }

  function decifrar(el, duracao) {
    const no = textoDe(el);
    if (!no || el.dataset.decifrado) return;
    el.dataset.decifrado = '1';
    const final = no.textContent;
    el.setAttribute('aria-label', el.textContent); // leitor de tela lê o texto certo desde o início
    const t0 = performance.now();
    (function quadro(agora) {
      const p = Math.min(1, (agora - t0) / duracao);
      const prontas = Math.floor(p * final.length);
      let s = final.slice(0, prontas);
      for (let i = prontas; i < final.length; i++) {
        const ch = final[i];
        s += /\s/.test(ch) ? ch : LETRAS[(Math.random() * LETRAS.length) | 0];
      }
      no.textContent = s;
      if (p < 1) requestAnimationFrame(quadro);
      else { no.textContent = final; el.removeAttribute('aria-label'); }
    })(t0);
  }

  const h1 = document.querySelector('h1');
  if (h1) decifrar(h1, 1100);

  if (!('IntersectionObserver' in window)) return;
  const olho = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      decifrar(e.target, 650);
      olho.unobserve(e.target);
    });
  }, { threshold: 0.6 });
  function observar() { document.querySelectorAll('.secao h2, .final h2').forEach(function (h) { if (!h.dataset.decifrado) olho.observe(h); }); }
  observar();
  // o formulário é montado pelo pagina.js: observa de novo depois que ele existir
  window.addEventListener('load', observar);
})();
