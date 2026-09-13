// ======================================================
// MD BOT - DR. RICARDO JÚNIOR
// WhatsApp + Twilio + PostgreSQL
// ======================================================

require("dotenv").config();

const express = require("express");
const twilio = require("twilio");
const { Pool } = require("pg");

const app = express();

const PORT = process.env.PORT || 3000;

// ======================================================
// VARIÁVEIS DE AMBIENTE
// ======================================================

const DATABASE_URL = process.env.DATABASE_URL;

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;
const JUNIOR_WHATSAPP = process.env.JUNIOR_WHATSAPP;

// ======================================================
// TWILIO
// ======================================================

const twilioClient =
  TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
    ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    : null;

// ======================================================
// POSTGRESQL
// ======================================================

const pool = new Pool({
  connectionString: DATABASE_URL
});

// ======================================================
// MIDDLEWARES
// ======================================================

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// ======================================================
// MEMÓRIA TEMPORÁRIA DAS CONVERSAS
// ======================================================

const atendimentos = new Map();

// ======================================================
// PALAVRAS QUE INDICAM URGÊNCIA
// ======================================================

const PALAVRAS_URGENCIA = [
  "preso",
  "presa",
  "prisão",
  "prisao",
  "flagrante",
  "detido",
  "detida",
  "mandado de prisão",
  "mandado de prisao",
  "audiência de custódia",
  "audiencia de custodia",
  "habeas corpus"
];

// ======================================================
// CATEGORIAS
// ======================================================

const CATEGORIAS_CRIMINAL = {
  "1": {
    nome: "Urgência / Prisão",
    urgente: true,
    assuntos: {
      "1": "Prisão em flagrante",
      "2": "Prisão preventiva",
      "3": "Audiência de custódia",
      "4": "Pessoa presa ou detida",
      "5": "Mandado de prisão",
      "6": "Pedido de liberdade",
      "7": "Habeas corpus",
      "8": "Outra situação urgente"
    }
  },

  "2": {
    nome: "Delegacia / Investigação",
    assuntos: {
      "1": "Acompanhamento em delegacia ou depoimento",
      "2": "Intimação",
      "3": "Inquérito policial",
      "4": "Investigação",
      "5": "Busca e apreensão",
      "6": "Orientação antes de depoimento",
      "7": "Outro assunto de investigação"
    }
  },

  "3": {
    nome: "Processo Criminal",
    assuntos: {
      "1": "Defesa em processo criminal",
      "2": "Denúncia ou citação",
      "3": "Audiência",
      "4": "Alegações finais",
      "5": "Recursos",
      "6": "Apelação",
      "7": "Habeas corpus",
      "8": "Outro assunto processual"
    }
  },

  "4": {
    nome: "Drogas",
    assuntos: {
      "1": "Tráfico de drogas",
      "2": "Associação para o tráfico",
      "3": "Prisão relacionada a drogas",
      "4": "Investigação ou processo por tráfico",
      "5": "Outro assunto relacionado a drogas"
    }
  },

  "5": {
    nome: "Tribunal do Júri",
    assuntos: {
      "1": "Homicídio",
      "2": "Tentativa de homicídio",
      "3": "Feminicídio",
      "4": "Pronúncia",
      "5": "Defesa no Tribunal do Júri",
      "6": "Outro assunto do Júri"
    }
  },

  "6": {
    nome: "Execução Penal",
    assuntos: {
      "1": "Cumprimento de pena",
      "2": "Progressão de regime",
      "3": "Remição de pena",
      "4": "Livramento condicional",
      "5": "Transferência",
      "6": "Outro assunto de execução penal"
    }
  },

  "7": {
    nome: "Outro assunto criminal",
    assuntos: {
      "1": "Outro assunto criminal"
    }
  }
};

const CATEGORIAS_OUTROS = {
  "1": {
    nome: "Família",
    assuntos: {
      "1": "Divórcio",
      "2": "Pensão alimentícia",
      "3": "Guarda",
      "4": "Visitas / Convivência",
      "5": "União estável",
      "6": "Outro assunto de família"
    }
  },

  "2": {
    nome: "Dívidas / Bancos / Cobranças",
    assuntos: {
      "1": "Dívidas",
      "2": "Cobrança indevida",
      "3": "Empréstimos",
      "4": "Problemas bancários",
      "5": "Outro assunto bancário"
    }
  },

  "3": {
    nome: "Energia / Água / Serviços",
    assuntos: {
      "1": "Corte ou restabelecimento de energia",
      "2": "Cobrança indevida de energia",
      "3": "Problemas com água",
      "4": "Telefone",
      "5": "Internet",
      "6": "Outro serviço"
    }
  },

  "4": {
    nome: "SPC / Serasa",
    assuntos: {
      "1": "Nome negativado",
      "2": "Negativação indevida",
      "3": "Dívida já paga",
      "4": "Cobrança indevida",
      "5": "Outro problema com negativação"
    }
  },

  "5": {
    nome: "Imóveis / Contratos",
    assuntos: {
      "1": "Compra e venda",
      "2": "Aluguel",
      "3": "Contratos",
      "4": "Problema com imóvel",
      "5": "Outro assunto de imóvel"
    }
  },

  "6": {
    nome: "Consumidor",
    assuntos: {
      "1": "Problema com produto",
      "2": "Problema com serviço",
      "3": "Compras",
      "4": "Cancelamentos",
      "5": "Cobranças",
      "6": "Problemas com empresas",
      "7": "Outro problema de consumo"
    }
  },

  "7": {
    nome: "Outro assunto jurídico",
    assuntos: {
      "1": "Outro assunto jurídico"
    }
  }
};

// ======================================================
// BANCO DE DADOS
// ======================================================

async function prepararBanco() {
  if (!DATABASE_URL) {
    console.log("⚠️ DATABASE_URL não configurada.");
    return;
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS atendimentos (
        id SERIAL PRIMARY KEY,
        telefone VARCHAR(30),
        nome VARCHAR(150),
        area VARCHAR(150),
        categoria VARCHAR(150),
        assunto VARCHAR(200),
        cidade VARCHAR(150),
        relato TEXT,
        prioridade VARCHAR(30),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ Banco de dados preparado.");
  } catch (erro) {
    console.error("❌ Erro ao preparar banco:", erro.message);
  }
}

async function salvarAtendimento(atendimento) {
  if (!DATABASE_URL) {
    console.log("⚠️ Atendimento não salvo: DATABASE_URL ausente.");
    return;
  }

  try {
    const resultado = await pool.query(
      `
      INSERT INTO atendimentos
      (
        telefone,
        nome,
        area,
        categoria,
        assunto,
        cidade,
        relato,
        prioridade
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
      `,
      [
        atendimento.telefone || null,
        atendimento.nome || null,
        atendimento.area || null,
        atendimento.categoria || null,
        atendimento.assunto || null,
        atendimento.cidade || null,
        atendimento.relato || null,
        atendimento.prioridade || "normal"
      ]
    );

    console.log(
      `💾 Atendimento salvo no banco. ID: ${resultado.rows[0].id}`
    );
  } catch (erro) {
    console.error(
      "❌ Erro ao salvar atendimento no banco:",
      erro.message
    );
  }
}

// ======================================================
// FUNÇÕES AUXILIARES
// ======================================================

function detectarUrgencia(texto = "") {
  const mensagem = texto.toLowerCase();

  return PALAVRAS_URGENCIA.some((palavra) =>
    mensagem.includes(palavra)
  );
}

function gerarFicha(a) {
  return `
📋 NOVO ATENDIMENTO JURÍDICO

👤 Cliente: ${a.nome || "Não informado"}

📞 Telefone: ${a.telefone || "Não informado"}

⚖️ Área: ${a.area || "Não informada"}

📁 Categoria: ${a.categoria || "Não informada"}

📌 Assunto: ${a.assunto || "Não informado"}

📍 Cidade: ${a.cidade || "Não informada"}

📝 Relato:
${a.relato || "Não informado"}

Prioridade: ${
    a.prioridade === "urgente"
      ? "🚨 URGENTE"
      : "🟢 NORMAL"
  }
`.trim();
}

function menuPrincipal() {
  return `🤖 Olá! Seja bem-vindo(a) ao atendimento do Dr. Ricardo Júnior.

⚖️ Advogado Criminalista

Para direcionarmos melhor o seu atendimento, escolha uma opção:

1️⃣ Advocacia Criminal
2️⃣ Outros assuntos jurídicos

Responda com 1 ou 2.`;
}

function menuCriminal() {
  return `⚖️ ADVOCACIA CRIMINAL

Escolha uma opção:

1️⃣ 🚨 Urgência / Prisão
2️⃣ Delegacia / Investigação
3️⃣ Processo Criminal
4️⃣ Drogas
5️⃣ Tribunal do Júri
6️⃣ Execução Penal
7️⃣ Outro assunto criminal

Responda apenas com o número da opção.`;
}

function menuOutros() {
  return `📚 OUTROS ASSUNTOS JURÍDICOS

Escolha uma opção:

1️⃣ Família
2️⃣ Dívidas / Bancos / Cobranças
3️⃣ Energia / Água / Serviços
4️⃣ SPC / Serasa
5️⃣ Imóveis / Contratos
6️⃣ Consumidor
7️⃣ Outro assunto jurídico

Responda apenas com o número da opção.`;
}

function gerarMenuAssuntos(categoria) {
  let texto = `📌 ${categoria.nome}\n\n`;

  for (const [numero, assunto] of Object.entries(categoria.assuntos)) {
    texto += `${numero}️⃣ ${assunto}\n`;
  }

  texto += "\nResponda apenas com o número da opção.";

  return texto;
}

function criarAtendimento(telefone, nomeContato = "") {
  return {
    telefone,
    nomeContato,
    etapa: "menu_principal",
    area: null,
    categoria: null,
    assunto: null,
    nome: null,
    cidade: null,
    relato: null,
    prioridade: "normal",
    categoriaSelecionada: null
  };
}

// ======================================================
// ENVIO DA FICHA PARA O DR. RICARDO JÚNIOR
// ======================================================

async function enviarFichaParaJunior(atendimento) {
  if (
    !twilioClient ||
    !TWILIO_WHATSAPP_FROM ||
    !JUNIOR_WHATSAPP
  ) {
    console.log(
      "⚠️ Twilio ou WhatsApp do Júnior ainda não configurados."
    );
    return;
  }

  const cabecalho =
    atendimento.prioridade === "urgente"
      ? "🚨🚨🚨 URGÊNCIA CRIMINAL 🚨🚨🚨"
      : "📋 NOVO ATENDIMENTO";

  const mensagem = `${cabecalho}

${gerarFicha(atendimento)}`;

  try {
    const envio = await twilioClient.messages.create({
      from: TWILIO_WHATSAPP_FROM,
      to: JUNIOR_WHATSAPP,
      body: mensagem
    });

    console.log(
      `✅ Ficha enviada ao Júnior. SID: ${envio.sid}`
    );
  } catch (erro) {
    console.error(
      "❌ Erro ao enviar ficha ao Júnior:",
      erro.message
    );
  }
}

// ======================================================
// PROCESSAMENTO DO ATENDIMENTO
// ======================================================

async function processarMensagem(
  telefone,
  nomeContato,
  mensagemRecebida
) {
  const mensagem = String(mensagemRecebida || "").trim();

  const comando = mensagem.toLowerCase();

  // ------------------------------------------------------
  // NOVO / MENU / REINICIAR
  // ------------------------------------------------------

  if (
    comando === "novo" ||
    comando === "menu" ||
    comando === "reiniciar"
  ) {
    const atendimento = criarAtendimento(
      telefone,
      nomeContato
    );

    atendimentos.set(telefone, atendimento);

    return menuPrincipal();
  }

  // ------------------------------------------------------
  // PRIMEIRO CONTATO
  // ------------------------------------------------------

  if (!atendimentos.has(telefone)) {
    const atendimento = criarAtendimento(
      telefone,
      nomeContato
    );

    atendimentos.set(telefone, atendimento);

    return menuPrincipal();
  }

  const a = atendimentos.get(telefone);

  // ------------------------------------------------------
  // MENU PRINCIPAL
  // ------------------------------------------------------

  if (a.etapa === "menu_principal") {
    if (mensagem === "1") {
      a.area = "Advocacia Criminal";
      a.etapa = "categoria_criminal";

      return menuCriminal();
    }

    if (mensagem === "2") {
      a.area = "Outros assuntos jurídicos";
      a.etapa = "categoria_outros";

      return menuOutros();
    }

    return `Não consegui identificar sua opção.

${menuPrincipal()}`;
  }

  // ------------------------------------------------------
  // CATEGORIA CRIMINAL
  // ------------------------------------------------------

  if (a.etapa === "categoria_criminal") {
    const categoria = CATEGORIAS_CRIMINAL[mensagem];

    if (!categoria) {
      return `Opção inválida.

${menuCriminal()}`;
    }

    a.categoria = categoria.nome;
    a.categoriaSelecionada = categoria;

    if (categoria.urgente) {
      a.prioridade = "urgente";
    }

    a.etapa = "assunto";

    return gerarMenuAssuntos(categoria);
  }

  // ------------------------------------------------------
  // CATEGORIA OUTROS
  // ------------------------------------------------------

  if (a.etapa === "categoria_outros") {
    const categoria = CATEGORIAS_OUTROS[mensagem];

    if (!categoria) {
      return `Opção inválida.

${menuOutros()}`;
    }

    a.categoria = categoria.nome;
    a.categoriaSelecionada = categoria;

    a.etapa = "assunto";

    return gerarMenuAssuntos(categoria);
  }

  // ------------------------------------------------------
  // ASSUNTO
  // ------------------------------------------------------

  if (a.etapa === "assunto") {
    const assunto =
      a.categoriaSelecionada?.assuntos?.[mensagem];

    if (!assunto) {
      return `Opção inválida.

${gerarMenuAssuntos(a.categoriaSelecionada)}`;
    }

    a.assunto = assunto;

    a.etapa = "coletar_nome";

    return `Certo.

Para continuar, qual é o seu nome?`;
  }

  // ------------------------------------------------------
  // NOME
  // ------------------------------------------------------

  if (a.etapa === "coletar_nome") {
    a.nome = mensagem;

    a.etapa = "coletar_cidade";

    return a.area === "Advocacia Criminal"
      ? `Obrigado, ${a.nome}.

Agora informe a cidade ou local relacionado à situação.`
      : `Obrigado, ${a.nome}.

Agora informe sua cidade ou a cidade relacionada ao atendimento.`;
  }

  // ------------------------------------------------------
  // CIDADE
  // ------------------------------------------------------

  if (a.etapa === "coletar_cidade") {
    a.cidade = mensagem;

    a.etapa = "coletar_relato";

    return a.area === "Advocacia Criminal"
      ? "Certo. Agora conte brevemente, com suas próprias palavras, o que aconteceu."
      : "Certo. Agora explique brevemente sua situação e o que você precisa resolver.";
  }

  // ------------------------------------------------------
  // RELATO / FINALIZAÇÃO
  // ------------------------------------------------------

  if (a.etapa === "coletar_relato") {
    a.relato = mensagem;

    if (detectarUrgencia(a.relato)) {
      a.prioridade = "urgente";
    }

    a.etapa = "finalizado";

    console.log(
      "\n================================\n" +
        gerarFicha(a) +
        "\n================================\n"
    );

    // Salva permanentemente no PostgreSQL
    await salvarAtendimento(a);

    // Tenta enviar a ficha para o Júnior
    // No Trial da Twilio isso pode ser bloqueado.
    enviarFichaParaJunior(a);

    if (a.prioridade === "urgente") {
      return `Obrigado, ${a.nome}.

🚨 Seu atendimento foi registrado como prioritário.

As informações serão direcionadas ao Dr. Ricardo Júnior.

Para iniciar outro atendimento, envie NOVO.`;
    }

    return `Obrigado, ${a.nome}.

Seu atendimento foi registrado.

As informações serão direcionadas ao Dr. Ricardo Júnior.

Para iniciar outro atendimento, envie NOVO.`;
  }

  // ------------------------------------------------------
  // ATENDIMENTO FINALIZADO
  // ------------------------------------------------------

  if (a.etapa === "finalizado") {
    return `Este atendimento já foi finalizado.

Para iniciar outro atendimento, envie NOVO.`;
  }

  return `Não consegui identificar a etapa do atendimento.

Envie MENU para recomeçar.`;
}

// ======================================================
// XML SEGURO PARA TWILIO
// ======================================================

function escaparXml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ======================================================
// WEBHOOK TWILIO
// ======================================================

app.post("/twilio", async (req, res) => {
  try {
    const telefone = String(
      req.body.From || ""
    ).replace("whatsapp:", "");

    const nomeContato = String(
      req.body.ProfileName || "Cliente"
    );

    const mensagem = String(
      req.body.Body || ""
    ).trim();

    console.log(
      `📩 WhatsApp: ${telefone} - ${mensagem}`
    );

    const resposta = await processarMensagem(
      telefone,
      nomeContato,
      mensagem
    );

    res
      .type("text/xml")
      .send(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escaparXml(resposta)}</Message>
</Response>`
      );
  } catch (erro) {
    console.error(
      "❌ Erro no webhook da Twilio:",
      erro
    );

    res
      .type("text/xml")
      .send(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Ocorreu um erro no atendimento. Por favor, tente novamente.</Message>
</Response>`
      );
  }
});

// ======================================================
// ROTA PARA VER SE O SERVIDOR ESTÁ ONLINE
// ======================================================

app.get("/", (req, res) => {
  res.send("✅ MD Bot está online.");
});

// ======================================================
// INICIALIZAÇÃO
// ======================================================

async function iniciarServidor() {
  await prepararBanco();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `🚀 MD Bot rodando na porta ${PORT}`
    );
  });
}

iniciarServidor();