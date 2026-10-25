// Monta o formulário a partir de Briefing.SECOES e cuida do envio.
(function () {
  const B = window.Briefing;
  const form = document.getElementById('formulario');
  const final = document.getElementById('final');
  const resumo = document.getElementById('resumo');
  const aviso = document.getElementById('aviso');
  const barra = document.querySelector('.progresso');
  const CHAVE = 'briefing:rascunho';

  function el(tag, atributos, filhos) {
    const e = document.createElement(tag);
    Object.keys(atributos || {}).forEach(function (k) {
      if (k === 'texto') e.textContent = atributos[k];
      else if (atributos[k] === true) e.setAttribute(k, '');
      else if (atributos[k] !== false && atributos[k] != null) e.setAttribute(k, atributos[k]);
    });
    (filhos || []).forEach(function (f) { e.appendChild(f); });
    return e;
  }

  function campo(c) {
    const rotulo = el('span', { class: 'rotulo', texto: c.rotulo }, c.obrigatorio ? [el('b', { texto: ' *', 'aria-hidden': 'true' })] : []);
    const ajuda = c.ajuda ? el('small', { texto: c.ajuda, id: 'aj-' + c.id }) : null;
    const descr = ajuda ? 'aj-' + c.id : null;
    let controle;

    if (c.tipo === 'escolha' || c.tipo === 'varias') {
      const unico = c.tipo === 'escolha';
      const grupo = el('fieldset', { class: 'campo grupo', 'data-campo': c.id, 'data-para': c.para ? c.para.join(',') : null }, [el('legend', {}, [rotulo])]);
      if (ajuda) grupo.appendChild(ajuda);
      const opcoes = el('div', { class: 'opcoes' });
      c.opcoes.forEach(function (o, i) {
        const id = c.id + '-' + i;
        const texto = typeof o === 'string' ? o : o.t;
        opcoes.appendChild(el('label', { class: 'opcao', for: id, 'data-para': o.para ? o.para.join(',') : null }, [
          el('input', { type: unico ? 'radio' : 'checkbox', name: c.id, id: id, value: texto }),
          el('span', { texto: texto })
        ]));
      });
      grupo.appendChild(opcoes);
      return grupo;
    }

    if (c.tipo === 'lista') {
      controle = el('select', { id: c.id, name: c.id, 'aria-describedby': descr }, [el('option', { value: '', texto: 'Escolha uma opção' })]
        .concat(c.opcoes.map(function (o) { return el('option', { value: o, texto: o }); })));
    } else if (c.tipo === 'longo') {
      controle = el('textarea', { id: c.id, name: c.id, rows: '3', placeholder: c.placeholder, 'aria-describedby': descr, maxlength: '1500' });
    } else {
      controle = el('input', {
        id: c.id, name: c.id, type: c.tipo === 'telefone' ? 'tel' : 'text', placeholder: c.placeholder,
        inputmode: c.tipo === 'telefone' ? 'tel' : null, autocomplete: c.autocomplete || (c.tipo === 'telefone' ? 'tel' : 'off'),
        required: c.obrigatorio ? true : false, 'aria-describedby': descr, maxlength: '300'
      });
    }
    const caixa = el('div', { class: 'campo', 'data-campo': c.id, 'data-para': c.para ? c.para.join(',') : null }, [el('label', { for: c.id }, [rotulo])]);
    if (ajuda) caixa.appendChild(ajuda);
    caixa.appendChild(controle);
    return caixa;
  }

  B.SECOES.forEach(function (s, i) {
    const bloco = el('section', { class: 'secao', 'aria-labelledby': 'tit-' + s.id }, [
      el('p', { class: 'passo', texto: 'Parte ' + (i + 1) + ' de ' + B.SECOES.length }),
      el('h2', { id: 'tit-' + s.id, texto: s.titulo })
    ]);
    if (s.ajuda) bloco.appendChild(el('p', { class: 'sub', texto: s.ajuda }));
    s.campos.forEach(function (c) { bloco.appendChild(campo(c)); });
    form.appendChild(bloco);
  });
  form.appendChild(el('div', { class: 'enviar-linha' }, [
    el('button', { type: 'submit', class: 'botao principal grande', texto: 'Ver resumo e enviar' })
  ]));

  // ---------- respostas
  function ler() {
    const r = {};
    B.SECOES.forEach(function (s) {
      s.campos.forEach(function (c) {
        const itens = form.querySelectorAll('[name="' + c.id + '"]');
        const marcado = function (i) { return i.checked && !i.closest('label').hidden; };
        if (c.tipo === 'varias') r[c.id] = Array.prototype.filter.call(itens, marcado).map(function (i) { return i.value; });
        else if (c.tipo === 'escolha') { const m = Array.prototype.find.call(itens, marcado); r[c.id] = m ? m.value : ''; }
        else r[c.id] = itens[0] ? itens[0].value : '';
      });
    });
    return r;
  }

  function preencher(r) {
    B.SECOES.forEach(function (s) {
      s.campos.forEach(function (c) {
        const v = r[c.id];
        if (v === undefined) return;
        const itens = form.querySelectorAll('[name="' + c.id + '"]');
        if (c.tipo === 'varias') Array.prototype.forEach.call(itens, function (i) { i.checked = v.indexOf(i.value) >= 0; });
        else if (c.tipo === 'escolha') Array.prototype.forEach.call(itens, function (i) { i.checked = i.value === v; });
        else if (itens[0]) itens[0].value = v;
      });
    });
  }

  function progresso() {
    const r = ler();
    const visiveis = B.camposDoGrupo(B.grupoDe(r));
    const total = visiveis.length;
    const feitos = visiveis.filter(function (c) { return B.limpo(r[c.id]); }).length;
    const pct = Math.round(feitos / total * 100);
    barra.setAttribute('aria-valuenow', String(pct));
    barra.firstElementChild.style.width = pct + '%';
  }

  // Mostra só as perguntas (e opções) que valem para o tipo de negócio escolhido
  function aplicarGrupo() {
    const grupo = B.grupoDe(ler());
    form.querySelectorAll('[data-para]').forEach(function (e) {
      e.hidden = !B.vale(e.getAttribute('data-para').split(','), grupo);
    });
    form.querySelectorAll('.secao').forEach(function (sec) {
      sec.hidden = !sec.querySelector('.campo:not([hidden])');
    });
  }

  // Rascunho: o que o cliente já escreveu fica no aparelho dele
  function guardar() { try { localStorage.setItem(CHAVE, JSON.stringify(ler())); } catch (e) { /* sem armazenamento */ } }
  function recuperar() {
    try { const g = localStorage.getItem(CHAVE); if (g) preencher(JSON.parse(g)); } catch (e) { /* sem rascunho */ }
  }
  recuperar(); aplicarGrupo(); progresso();
  form.addEventListener('input', function () { guardar(); progresso(); });
  form.addEventListener('change', function () { aplicarGrupo(); guardar(); progresso(); });

  // ---------- envio
  function marcarErro(rotulos) {
    form.querySelectorAll('.erro').forEach(function (e) { e.classList.remove('erro'); e.querySelectorAll('.msg-erro').forEach(function (m) { m.remove(); }); });
    B.SECOES.forEach(function (s) {
      s.campos.forEach(function (c) {
        if (rotulos.indexOf(c.rotulo) < 0) return;
        const caixa = form.querySelector('[data-campo="' + c.id + '"]');
        caixa.classList.add('erro');
        caixa.appendChild(el('p', { class: 'msg-erro', role: 'alert', texto: 'Preencha este campo.' }));
      });
    });
    const primeiro = form.querySelector('.erro input, .erro textarea, .erro select');
    if (primeiro) primeiro.focus();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const r = ler();
    const falta = B.faltando(r);
    marcarErro(falta);
    if (falta.length) return;
    const texto = B.montarResumo(r);
    resumo.textContent = texto;
    const link = B.linkWhatsApp(B.CONFIG.whatsapp, texto);
    const enviar = document.getElementById('enviar');
    enviar.hidden = !link;
    if (link) enviar.href = link;
    document.getElementById('final-texto').textContent = link
      ? 'Confira o resumo abaixo e toque em enviar pelo WhatsApp.'
      : 'Confira o resumo abaixo, copie e me mande por mensagem.';
    form.hidden = true; barra.hidden = true; final.hidden = false;
    final.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('voltar').addEventListener('click', function () {
    final.hidden = true; form.hidden = false; barra.hidden = false; aviso.textContent = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function dizer(t) { aviso.textContent = t; }

  document.getElementById('copiar').addEventListener('click', function () {
    const t = resumo.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(function () { dizer('Respostas copiadas. Agora é só colar na conversa comigo.'); },
        function () { selecionar(); });
    } else selecionar();
  });
  function selecionar() {
    const faixa = document.createRange(); faixa.selectNodeContents(resumo);
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(faixa);
    dizer('Não consegui copiar sozinho. O texto está selecionado: use Copiar do seu aparelho.');
  }

  document.getElementById('baixar').addEventListener('click', function () {
    const nome = (B.limpo(ler().negocio) || 'projeto').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const url = URL.createObjectURL(new Blob([resumo.textContent], { type: 'text/plain;charset=utf-8' }));
    const a = el('a', { href: url, download: 'briefing-' + (nome || 'projeto') + '.txt' });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    dizer('Arquivo baixado. Me envie por mensagem.');
  });
})();
