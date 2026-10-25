// =====================================================================
//  BRIEFING DO PROJETO
//  As perguntas ficam em SECOES (edite aqui para mudar o formulário).
//  A página monta o formulário a partir delas e gera um resumo em texto
//  que o cliente envia pelo WhatsApp, copia ou baixa.
//
//  "para": lista de grupos que veem a pergunta (sem "para" = todos).
//  Grupos, definidos pela resposta de "Que tipo de negócio é?":
//    alimentacao | comercio | servico | outro
//  Uma opção também pode ser { t: 'texto', para: [...] }.
// =====================================================================

(function (raiz) {

  // Para onde o cliente envia as respostas (só números, com 55 e DDD). Vazio = só copiar/baixar.
  const CONFIG = {
    whatsapp: '',
    titulo: 'Briefing do projeto',
    responsavel: 'Eduardo Jr. Coelho'
  };

  const TIPO_COMIDA = 'Alimentação (pastelaria, lanchonete, restaurante, padaria)';
  const TIPO_LOJA = 'Loja ou comércio';
  const TIPO_SERVICO = 'Prestação de serviço';
  const TIPO_OUTRO = 'Outro';
  const GRUPO_DO_TIPO = {};
  GRUPO_DO_TIPO[TIPO_COMIDA] = 'alimentacao';
  GRUPO_DO_TIPO[TIPO_LOJA] = 'comercio';
  GRUPO_DO_TIPO[TIPO_SERVICO] = 'servico';
  GRUPO_DO_TIPO[TIPO_OUTRO] = 'outro';

  const PRODUTO = ['alimentacao', 'comercio'];
  const ALIM = ['alimentacao'];
  const SERV = ['servico'];

  // tipo: texto | telefone | longo | escolha (uma opção) | varias (várias opções) | lista (select)
  const SECOES = [
    {
      id: 'negocio', titulo: 'Sobre você e o negócio',
      ajuda: 'Para eu saber com quem estou falando e qual é o seu tipo de negócio.',
      campos: [
        { id: 'responsavel', rotulo: 'Seu nome', tipo: 'texto', obrigatorio: true, autocomplete: 'name' },
        { id: 'negocio', rotulo: 'Nome do negócio', tipo: 'texto', obrigatorio: true },
        { id: 'contato', rotulo: 'Seu WhatsApp', tipo: 'telefone', obrigatorio: true, ajuda: 'Com DDD. É por ele que eu volto a falar com você.' },
        { id: 'tipo', rotulo: 'Que tipo de negócio é?', tipo: 'escolha', obrigatorio: true, opcoes: [TIPO_COMIDA, TIPO_LOJA, TIPO_SERVICO, TIPO_OUTRO], ajuda: 'As próximas perguntas mudam conforme a sua escolha.' },
        { id: 'cidade', rotulo: 'Cidade e bairro', tipo: 'texto', placeholder: 'Ex: Centro, Guarapuava' },
        { id: 'tempo', rotulo: 'Há quanto tempo o negócio existe?', tipo: 'texto', placeholder: 'Ex: desde 2015' },
        { id: 'redes', rotulo: 'Instagram, Facebook ou site que você já tem', tipo: 'longo', placeholder: 'Cole os links ou @ aqui' },
        { id: 'logo', rotulo: 'Você tem logo?', tipo: 'escolha', opcoes: ['Sim, tenho o arquivo', 'Sim, mas só a foto do perfil', 'Não tenho e preciso de uma'] }
      ]
    },
    {
      id: 'servicos', titulo: 'Serviços e produtos',
      ajuda: 'O que você vende ou faz e como o cliente é atendido.',
      campos: [
        { id: 'ramo_alim', rotulo: 'Que tipo de alimentação?', tipo: 'lista', para: ALIM, opcoes: ['Pastelaria', 'Lanchonete ou hamburgueria', 'Restaurante', 'Padaria ou confeitaria', 'Outro'] },
        { id: 'ramo_servico', rotulo: 'Em que área é o serviço?', tipo: 'lista', para: SERV, opcoes: ['Saúde e bem-estar', 'Beleza e estética', 'Construção, reforma e reparos', 'Limpeza e conservação', 'Consultoria, contabilidade ou jurídico', 'Educação e aulas', 'Automotivo', 'Tecnologia e design', 'Eventos e fotografia', 'Pets', 'Transporte e mudanças', 'Outro'] },
        { id: 'ramo_outro', rotulo: 'Se escolheu "Outro", qual?', tipo: 'texto' },
        { id: 'servicos', rotulo: 'Quais serviços ou produtos você oferece?', tipo: 'longo', placeholder: 'Liste o principal. Ex: pastéis e sucos, instalação elétrica, aulas de inglês' },
        { id: 'campeoes', rotulo: 'Quais são os mais procurados ou os que dão mais retorno?', tipo: 'longo' },
        { id: 'diferencial', rotulo: 'O que faz você diferente dos concorrentes?', tipo: 'longo', placeholder: 'Ex: frito na hora, atendimento no mesmo dia, 15 anos de experiência' },
        { id: 'atendimento', rotulo: 'Como o cliente recebe?', tipo: 'varias', para: PRODUTO, opcoes: ['Consome no local', 'Retira no balcão', 'Entrega', 'Encomenda para festa ou evento', 'Drive-thru'] },
        { id: 'onde_servico', rotulo: 'Onde o serviço é feito?', tipo: 'varias', para: SERV, opcoes: ['No meu espaço ou escritório', 'Na casa ou empresa do cliente', 'Online ou à distância'] },
        { id: 'agendamento', rotulo: 'Como o cliente contrata?', tipo: 'varias', para: SERV, opcoes: ['Marca horário (agenda)', 'Pede orçamento antes', 'Contrato mensal ou recorrente', 'Atendimento por ordem de chegada', 'Chama em urgência ou emergência'] },
        { id: 'area_atendimento', rotulo: 'Quais bairros ou cidades você atende?', tipo: 'texto', para: SERV },
        { id: 'equipe', rotulo: 'Quantas pessoas trabalham com você?', tipo: 'escolha', para: SERV, opcoes: ['Só eu', '2 a 5 pessoas', 'Mais de 5 pessoas'] },
        { id: 'credenciais', rotulo: 'Formação, registro profissional ou certificados que passam confiança', tipo: 'longo', para: SERV },
        { id: 'portfolio', rotulo: 'Trabalhos feitos, clientes atendidos ou depoimentos que podemos mostrar', tipo: 'longo', para: SERV },
        { id: 'unidades', rotulo: 'Quantas unidades ou lojas existem?', tipo: 'escolha', para: PRODUTO, opcoes: ['Só uma', '2 ou 3', 'Mais de 3'] },
        { id: 'horario', rotulo: 'Dias e horário de atendimento', tipo: 'longo' }
      ]
    },
    {
      id: 'publico', titulo: 'Público',
      ajuda: 'Quem compra de você hoje e quem você quer atingir.',
      campos: [
        { id: 'publico_produto', rotulo: 'Quem são os seus clientes?', tipo: 'varias', para: PRODUTO, opcoes: ['Famílias', 'Jovens e estudantes', 'Trabalhadores no almoço', 'Empresas e escritórios', 'Moradores do bairro', 'Turistas e visitantes', 'Clientes de festa e evento'] },
        { id: 'publico_servico', rotulo: 'Quem são os seus clientes?', tipo: 'varias', para: SERV, opcoes: ['Pessoas físicas', 'Famílias', 'Idosos', 'Pequenas empresas', 'Grandes empresas', 'Condomínios e construtoras', 'Órgãos públicos'] },
        { id: 'regiao', rotulo: 'Até onde você atende?', tipo: 'escolha', opcoes: ['Só o bairro', 'A cidade toda', 'Cidade e região', 'Todo o Brasil, online'] },
        { id: 'encontram', rotulo: 'Como os clientes encontram você hoje?', tipo: 'varias', opcoes: ['Indicação', 'Instagram ou Facebook', 'Google ou Maps', 'WhatsApp', 'Passam na frente do local', 'Aplicativo ou marketplace', 'Parcerias com outras empresas'] },
        { id: 'pedidos', rotulo: 'Por onde chegam os pedidos ou contatos hoje?', tipo: 'varias', opcoes: ['WhatsApp', 'Telefone', 'Aplicativo (aiqfome, iFood...)', 'Presencial', 'E-mail ou formulário'] },
        { id: 'novo_publico', rotulo: 'Que tipo de cliente você gostaria de atrair?', tipo: 'longo' }
      ]
    },
    {
      id: 'precos', titulo: 'Preços',
      ajuda: 'Como você cobra e como isso deve aparecer no site.',
      campos: [
        { id: 'tabela', rotulo: 'Como são os preços?', tipo: 'escolha', opcoes: ['Tabela fixa, tudo com preço', 'Alguns itens variam', 'Cada trabalho é um orçamento'] },
        { id: 'cobranca', rotulo: 'Como você cobra?', tipo: 'varias', para: SERV, opcoes: ['Por hora', 'Por serviço ou pacote', 'Por projeto', 'Mensalidade ou plano', 'Por metro, peça ou quantidade', 'Sob orçamento'] },
        { id: 'orcamento_info', rotulo: 'O que o cliente precisa informar para você passar um orçamento?', tipo: 'longo', para: SERV, placeholder: 'Ex: fotos do local, medidas, endereço, data desejada' },
        { id: 'visita', rotulo: 'Você cobra visita, deslocamento ou taxa de orçamento?', tipo: 'escolha', para: SERV, opcoes: ['Não cobra', 'Cobra, e abate se fechar o serviço', 'Cobra sempre'] },
        { id: 'sinal', rotulo: 'Pede sinal ou pagamento adiantado?', tipo: 'escolha', para: SERV, opcoes: ['Não', 'Sim, uma parte', 'Sim, o valor total'] },
        { id: 'faixa', rotulo: 'Como você se posiciona no preço?', tipo: 'escolha', opcoes: ['Mais barato que a concorrência', 'No preço do mercado', 'Mais caro, pela qualidade'] },
        { id: 'mostrar', rotulo: 'O site deve mostrar os preços?', tipo: 'escolha', opcoes: ['Sim, todos', 'Só "a partir de"', 'Não, o cliente pergunta'] },
        { id: 'preco_unidade', rotulo: 'Os preços mudam de uma unidade para outra?', tipo: 'escolha', para: PRODUTO, opcoes: ['Não, são iguais', 'Sim, cada unidade tem a sua tabela', 'Só tenho uma unidade'] },
        { id: 'tabela_envio', rotulo: 'Onde está a tabela de preços?', tipo: 'longo', placeholder: 'Link do aplicativo, foto do cardápio ou diga que vai mandar' },
        { id: 'entrega_taxa', rotulo: 'Quanto você cobra de entrega?', tipo: 'texto', para: PRODUTO, placeholder: 'Ex: R$ 10 fixo, ou varia por bairro' },
        { id: 'pagamento', rotulo: 'Formas de pagamento', tipo: 'varias', opcoes: ['Dinheiro', 'Pix', 'Cartão de débito', 'Cartão de crédito', 'Boleto', 'Vale-refeição'] },
        { id: 'promocoes', rotulo: 'Combos, pacotes ou promoções para destacar', tipo: 'longo' }
      ]
    },
    {
      id: 'site', titulo: 'O que o site precisa fazer',
      ajuda: 'O que você espera do projeto.',
      campos: [
        { id: 'objetivo', rotulo: 'Qual o principal objetivo do site?', tipo: 'varias', opcoes: [
          'Receber pedidos ou pedidos de orçamento pelo WhatsApp',
          'Mostrar o cardápio, os produtos ou os serviços',
          'Aparecer melhor no Google',
          'Passar mais confiança',
          { t: 'Deixar de pagar taxa de aplicativo', para: PRODUTO },
          { t: 'Fechar agendamentos', para: SERV }
        ] },
        { id: 'recursos', rotulo: 'O que mais você quer?', tipo: 'varias', opcoes: [
          { t: 'Carrinho de pedido', para: PRODUTO },
          { t: 'Formulário de orçamento', para: SERV },
          { t: 'Agendamento online', para: SERV },
          'Painel para eu mesmo editar os preços e o conteúdo',
          { t: 'Várias unidades no mesmo site', para: PRODUTO },
          'Avaliações de clientes',
          'Galeria de fotos ou portfólio',
          'Mapa e endereço'
        ] },
        { id: 'fotos', rotulo: 'Você tem fotos boas do trabalho e do local?', tipo: 'escolha', opcoes: ['Sim, tenho bastante', 'Tenho poucas', 'Não tenho'] },
        { id: 'estilo', rotulo: 'Cores e estilo que combinam com você', tipo: 'longo', placeholder: 'Ex: azul e branco, sério e profissional' },
        { id: 'referencias', rotulo: 'Sites que você gosta (de qualquer ramo)', tipo: 'longo' }
      ]
    },
    {
      id: 'prazo', titulo: 'Prazo e investimento',
      campos: [
        { id: 'prazo', rotulo: 'Para quando você precisa do site?', tipo: 'escolha', opcoes: ['O quanto antes', 'Em até 1 mês', 'Sem pressa'] },
        { id: 'investimento', rotulo: 'Quanto pretende investir?', tipo: 'escolha', opcoes: ['Até R$ 500', 'De R$ 500 a R$ 1.000', 'De R$ 1.000 a R$ 2.000', 'Ainda não sei, quero ver a proposta'] },
        { id: 'decide', rotulo: 'Quem aprova o projeto?', tipo: 'texto', placeholder: 'Só você ou mais alguém?' },
        { id: 'observacoes', rotulo: 'Observações', tipo: 'longo', placeholder: 'Algo mais que eu deva saber' }
      ]
    }
  ];

  function limpo(v) {
    if (Array.isArray(v)) return v.map(function (x) { return String(x).trim(); }).filter(Boolean).join(', ');
    return v === undefined || v === null ? '' : String(v).trim();
  }

  // Grupo do negócio, pela resposta de "Que tipo de negócio é?" ('' enquanto não escolheu)
  function grupoDe(respostas) {
    return GRUPO_DO_TIPO[limpo((respostas || {}).tipo)] || '';
  }

  function vale(para, grupo) { return !para || (grupo && para.indexOf(grupo) >= 0); }

  // Perguntas que o grupo vê (sem grupo escolhido: só as comuns)
  function camposDoGrupo(grupo) {
    return SECOES.flatMap(function (s) { return s.campos; }).filter(function (c) { return vale(c.para, grupo); });
  }

  // Textos das opções que o grupo vê
  function opcoesDoGrupo(campo, grupo) {
    return (campo.opcoes || []).filter(function (o) { return typeof o === 'string' || vale(o.para, grupo); })
      .map(function (o) { return typeof o === 'string' ? o : o.t; });
  }

  // Rótulos dos campos obrigatórios que ficaram sem resposta
  function faltando(respostas) {
    const r = respostas || {};
    return camposDoGrupo(grupoDe(r))
      .filter(function (c) { return c.obrigatorio && !limpo(r[c.id]); })
      .map(function (c) { return c.rotulo; });
  }

  // Texto que o cliente envia: só o que foi respondido e vale para o tipo de negócio, por seção
  function montarResumo(respostas) {
    const r = respostas || {};
    const visiveis = camposDoGrupo(grupoDe(r)).map(function (c) { return c.id; });
    const nome = limpo(r.negocio);
    const linhas = [CONFIG.titulo + (nome ? ': ' + nome : ''), ''];
    SECOES.forEach(function (s) {
      const respondidos = s.campos.filter(function (c) { return visiveis.indexOf(c.id) >= 0 && limpo(r[c.id]); });
      if (!respondidos.length) return;
      linhas.push(s.titulo.toUpperCase());
      respondidos.forEach(function (c) { linhas.push('• ' + c.rotulo + (/[?:]$/.test(c.rotulo) ? ' ' : ': ') + limpo(r[c.id])); });
      linhas.push('');
    });
    return linhas.join('\n').trim();
  }

  function linkWhatsApp(numero, texto) {
    const n = String(numero || '').replace(/\D/g, '');
    if (!n) return '';
    return 'https://wa.me/' + n + '?text=' + encodeURIComponent(texto);
  }

  const Briefing = {
    CONFIG: CONFIG, SECOES: SECOES, montarResumo: montarResumo, faltando: faltando, linkWhatsApp: linkWhatsApp,
    limpo: limpo, grupoDe: grupoDe, camposDoGrupo: camposDoGrupo, opcoesDoGrupo: opcoesDoGrupo, vale: vale
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Briefing;
  else raiz.Briefing = Briefing;

})(typeof window !== 'undefined' ? window : globalThis);
