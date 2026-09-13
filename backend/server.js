require("dotenv").config();

const crypto = require("crypto");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || "";
const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || "v26.0";
const APP_SECRET = process.env.APP_SECRET || "";

const palavrasUrgentes = [
  "preso", "presa", "prisão", "prisao", "flagrante", "detido", "detida",
  "delegacia", "mandado de prisão", "mandado de prisao",
  "audiência de custódia", "audiencia de custodia", "habeas corpus"
];

const categoriasCriminais = {
  "1": { nome: "🚨 Urgência / Prisão", prioridade: "urgente", opcoes: {
    "1": "Prisão em flagrante", "2": "Prisão preventiva", "3": "Audiência de custódia",
    "4": "Pessoa presa ou detida", "5": "Mandado de prisão", "6": "Pedido de liberdade",
    "7": "Habeas Corpus", "8": "Outra situação urgente"
  }},
  "2": { nome: "Delegacia / Investigação", prioridade: "normal", opcoes: {
    "1": "Acompanhamento em delegacia", "2": "Acompanhamento de depoimento",
    "3": "Intimação para depor", "4": "Inquérito policial", "5": "Investigação criminal",
    "6": "Busca e apreensão", "7": "Orientação antes de prestar depoimento"
  }},
  "3": { nome: "Processo Criminal", prioridade: "normal", opcoes: {
    "1": "Defesa criminal", "2": "Denúncia / citação", "3": "Audiência", "4": "Alegações finais",
    "5": "Recursos", "6": "Apelação", "7": "Habeas Corpus", "8": "Outro assunto processual"
  }},
  "4": { nome: "Crimes envolvendo drogas", prioridade: "normal", opcoes: {
    "1": "Tráfico de drogas", "2": "Associação para o tráfico", "3": "Prisão relacionada a drogas",
    "4": "Investigação ou processo por tráfico"
  }},
  "5": { nome: "Tribunal do Júri", prioridade: "normal", opcoes: {
    "1": "Homicídio", "2": "Tentativa de homicídio", "3": "Feminicídio",
    "4": "Pronúncia", "5": "Defesa no Tribunal do Júri"
  }},
  "6": { nome: "Execução Penal", prioridade: "normal", opcoes: {
    "1": "Cumprimento de pena", "2": "Progressão de regime", "3": "Remição",
    "4": "Livramento condicional", "5": "Transferência", "6": "Outro assunto relacionado à execução"
  }},
  "7": { nome: "Outro assunto criminal", prioridade: "normal", opcoes: null }
};

const categoriasOutros = {
  "1": { nome: "Família", opcoes: {
    "1": "Divórcio", "2": "Pensão alimentícia", "3": "Guarda", "4": "Visitas / convivência", "5": "União estável"
  }},
  "2": { nome: "Dívidas / Bancos / Cobranças", opcoes: {
    "1": "Dívidas", "2": "Cobranças indevidas", "3": "Empréstimos", "4": "Problemas bancários"
  }},
  "3": { nome: "Energia / Água / Serviços", opcoes: {
    "1": "Corte de energia", "2": "Restabelecimento de energia", "3": "Cobrança indevida",
    "4": "Água", "5": "Telefone", "6": "Internet"
  }},
  "4": { nome: "SPC / Serasa", opcoes: {
    "1": "Nome negativado", "2": "Negativação indevida", "3": "Dívida já paga", "4": "Cobrança indevida"
  }},
  "5": { nome: "Imóveis / Contratos", opcoes: {
    "1": "Compra e venda", "2": "Aluguel", "3": "Contratos", "4": "Problemas com imóvel"
  }},
  "6": { nome: "Direito do Consumidor", opcoes: {
    "1": "Problema com produto", "2": "Problema com serviço", "3": "Compras",
    "4": "Cancelamentos", "5": "Cobranças", "6": "Problemas com empresas"
  }},
  "7": { nome: "Outro assunto", opcoes: null }
};

const atendimentos = new Map();
const mensagensProcessadas = new Set();

app.use(express.json({ verify(req, res, buf) { req.rawBody = Buffer.from(buf); } }));
app.use(express.urlencoded({
    extended: false
}));
function normalizarTexto(texto) {
  return String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function detectarUrgencia(texto) {
  const t = normalizarTexto(texto);
  return palavrasUrgentes.some(p => t.includes(normalizarTexto(p)));
}

function criarAtendimento(nomeContato) {
  return {
    nomeContato, nome: null, area: null, categoria: null, categoriaId: null,
    subcategoria: null, cidade: null, relato: null, prioridade: "normal", etapa: "menu_principal"
  };
}

function numeroEmoji(n) {
  return ({"1":"1️⃣","2":"2️⃣","3":"3️⃣","4":"4️⃣","5":"5️⃣","6":"6️⃣","7":"7️⃣","8":"8️⃣","9":"9️⃣"})[n] || n;
}

function menuPrincipal(nome) {
  return `🤖 Olá, ${nome}! Seja bem-vindo(a) ao atendimento do Dr. Ricardo Júnior.\n\n⚖️ Advogado Criminalista\n\nPara direcionarmos melhor o seu atendimento, escolha uma opção:\n\n1️⃣ Advocacia Criminal\n2️⃣ Outros assuntos jurídicos\n\nResponda com 1 ou 2.`;
}

function menuCriminal() {
  return `⚖️ ADVOCACIA CRIMINAL\n\nQual situação mais se aproxima do seu caso?\n\n1️⃣ 🚨 Urgência / Prisão\n2️⃣ Delegacia / Investigação\n3️⃣ Processo Criminal\n4️⃣ Crimes envolvendo drogas\n5️⃣ Tribunal do Júri\n6️⃣ Execução Penal\n7️⃣ Outro assunto criminal`;
}

function menuOutros() {
  return `📋 OUTROS ASSUNTOS JURÍDICOS\n\nQual é o assunto?\n\n1️⃣ Família\n2️⃣ Dívidas / Bancos / Cobranças\n3️⃣ Energia / Água / Serviços\n4️⃣ SPC / Serasa\n5️⃣ Imóveis / Contratos\n6️⃣ Direito do Consumidor\n7️⃣ Outro assunto`;
}

function criarMenuOpcoes(titulo, opcoes) {
  let texto = `${titulo}\n\nQual opção mais se aproxima do seu caso?\n\n`;
  for (const numero in opcoes) texto += `${numeroEmoji(numero)} ${opcoes[numero]}\n`;
  return texto.trim();
}

function gerarFicha(a) {
  let titulo = "📋 NOVO ATENDIMENTO JURÍDICO";
  let prioridade = "🟢 NORMAL";
  if (a.prioridade === "urgente" && a.area === "Advocacia Criminal") {
    titulo = "🚨 NOVO ATENDIMENTO CRIMINAL URGENTE"; prioridade = "🔴 URGENTE";
  } else if (a.prioridade === "urgente") {
    titulo = "🚨 NOVO ATENDIMENTO JURÍDICO PRIORITÁRIO"; prioridade = "🔴 URGENTE";
  } else if (a.area === "Advocacia Criminal") {
    titulo = "⚖️ NOVO ATENDIMENTO CRIMINAL";
  }
  return `${titulo}\n\n👤 Cliente: ${a.nome}\n⚖️ Área: ${a.area}\n📂 Categoria: ${a.categoria}\n📌 Assunto: ${a.subcategoria}\n📍 Cidade: ${a.cidade}\n\n📝 Relato:\n${a.relato}\n\nPrioridade: ${prioridade}`;
}

function processarMensagem(telefone, nomeContato, mensagem) {
  let a = atendimentos.get(telefone);

  if (!a) {
    a = criarAtendimento(nomeContato);
    atendimentos.set(telefone, a);
    if (detectarUrgencia(mensagem)) {
      a.area = "Advocacia Criminal"; a.categoria = categoriasCriminais["1"].nome;
      a.categoriaId = "1"; a.prioridade = "urgente"; a.etapa = "criminal_subcategoria";
      return criarMenuOpcoes("🔴 ATENDIMENTO CRIMINAL URGENTE", categoriasCriminais["1"].opcoes);
    }
    return menuPrincipal(nomeContato);
  }

  const m = normalizarTexto(mensagem);
  if (["novo","reiniciar","menu"].includes(m)) {
    a = criarAtendimento(nomeContato); atendimentos.set(telefone, a); return menuPrincipal(nomeContato);
  }

  if (a.etapa === "menu_principal") {
    if (mensagem === "1") { a.area = "Advocacia Criminal"; a.etapa = "criminal_categoria"; return menuCriminal(); }
    if (mensagem === "2") { a.area = "Outros assuntos jurídicos"; a.etapa = "outros_categoria"; return menuOutros(); }
    return "Por favor, responda apenas com 1 ou 2.";
  }

  if (a.etapa === "criminal_categoria") {
    const c = categoriasCriminais[mensagem];
    if (!c) return "Escolha uma opção criminal de 1 a 7.";
    a.categoria = c.nome; a.categoriaId = mensagem; a.prioridade = c.prioridade;
    if (!c.opcoes) { a.subcategoria = c.nome; a.etapa = "coletar_nome"; return "⚖️ Outro assunto criminal.\n\nSem problema. Você poderá explicar o caso com suas próprias palavras.\n\nPara começar, qual é o seu nome?"; }
    a.etapa = "criminal_subcategoria";
    return criarMenuOpcoes(c.prioridade === "urgente" ? "🔴 ATENDIMENTO CRIMINAL URGENTE" : `⚖️ ${c.nome}`, c.opcoes);
  }

  if (a.etapa === "criminal_subcategoria") {
    const c = categoriasCriminais[a.categoriaId]; const s = c?.opcoes?.[mensagem];
    if (!s) return "Essa opção não existe. Escolha um dos números apresentados.";
    a.subcategoria = s; a.etapa = "coletar_nome";
    return `Entendi.\n\nO atendimento foi identificado como:\n\n📌 ${s}\n\nPara continuar, qual é o seu nome?`;
  }

  if (a.etapa === "outros_categoria") {
    const c = categoriasOutros[mensagem];
    if (!c) return "Escolha uma opção de 1 a 7.";
    a.categoria = c.nome; a.categoriaId = mensagem; a.prioridade = "normal";
    if (!c.opcoes) { a.subcategoria = c.nome; a.etapa = "coletar_nome"; return "📋 Sem problema.\n\nVocê poderá explicar qual é o assunto durante o atendimento.\n\nPara começar, qual é o seu nome?"; }
    a.etapa = "outros_subcategoria"; return criarMenuOpcoes(`📋 ${c.nome}`, c.opcoes);
  }

  if (a.etapa === "outros_subcategoria") {
    const c = categoriasOutros[a.categoriaId]; const s = c?.opcoes?.[mensagem];
    if (!s) return "Essa opção não existe. Escolha um dos números apresentados.";
    a.subcategoria = s; a.etapa = "coletar_nome";
    return `Entendi.\n\nO assunto selecionado foi:\n\n📌 ${s}\n\nPara continuar, qual é o seu nome?`;
  }

  if (a.etapa === "coletar_nome") {
    a.nome = mensagem; a.etapa = "coletar_cidade";
    return a.area === "Advocacia Criminal"
      ? `Obrigado, ${a.nome}.\n\nAgora informe a cidade ou local relacionado à situação.`
      : `Obrigado, ${a.nome}.\n\nAgora informe sua cidade ou a cidade relacionada ao atendimento.`;
  }

  if (a.etapa === "coletar_cidade") {
    a.cidade = mensagem; a.etapa = "coletar_relato";
    return a.area === "Advocacia Criminal"
      ? "Certo. Agora conte brevemente, com suas próprias palavras, o que aconteceu."
      : "Certo. Agora explique brevemente sua situação e o que você precisa resolver.";
  }

  if (a.etapa === "coletar_relato") {
    a.relato = mensagem; if (detectarUrgencia(a.relato)) a.prioridade = "urgente"; a.etapa = "finalizado";
    console.log("\n================================\n" + gerarFicha(a) + "\n================================\n");
    return a.prioridade === "urgente"
      ? `Obrigado, ${a.nome}.\n\n🚨 Seu atendimento foi registrado como prioritário.\n\nAs informações serão direcionadas ao Dr. Ricardo Júnior.\n\nPara iniciar outro atendimento, envie NOVO.`
      : `Obrigado, ${a.nome}.\n\nSeu atendimento foi registrado.\n\nAs informações serão direcionadas ao Dr. Ricardo Júnior.\n\nPara iniciar outro atendimento, envie NOVO.`;
  }

  if (a.etapa === "finalizado") return "Este atendimento já foi finalizado.\n\nPara iniciar outro atendimento, envie NOVO.";
  return "Não consegui identificar a etapa do atendimento. Envie MENU para recomeçar.";
}

async function enviarMensagemWhatsApp(telefone, texto) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.log("⚠️ WHATSAPP_TOKEN ou PHONE_NUMBER_ID ausente. Resposta simulada:\n" + texto);
    return;
  }
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${PHONE_NUMBER_ID}/messages`;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: telefone, type: "text", text: { preview_url: false, body: texto } })
  });
  if (!r.ok) console.error("❌ Erro WhatsApp:", r.status, await r.text());
}

function assinaturaValida(req) {
  if (!APP_SECRET) return true;
  const recebida = req.get("x-hub-signature-256");
  if (!recebida || !req.rawBody) return false;
  const esperada = "sha256=" + crypto.createHmac("sha256", APP_SECRET).update(req.rawBody).digest("hex");
  const a = Buffer.from(recebida), b = Buffer.from(esperada);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function extrairMensagemMeta(payload) {
  const value = payload?.entry?.[0]?.changes?.[0]?.value;
  const msg = value?.messages?.[0];
  if (!msg) return null;
  let texto = "";
  if (msg.type === "text") texto = msg.text?.body || "";
  else if (msg.type === "interactive") texto = msg.interactive?.button_reply?.id || msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.id || msg.interactive?.list_reply?.title || "";
  else texto = "Quero atendimento";
  return { id: msg.id, telefone: msg.from, nome: value?.contacts?.[0]?.profile?.name || "Cliente", texto: String(texto).trim() };
}

async function processarEventoMeta(payload) {
  const d = extrairMensagemMeta(payload); if (!d) return;
  if (d.id && mensagensProcessadas.has(d.id)) return;
  if (d.id) { mensagensProcessadas.add(d.id); if (mensagensProcessadas.size > 5000) mensagensProcessadas.delete(mensagensProcessadas.values().next().value); }
  console.log(`📩 ${d.telefone}: ${d.texto}`);
  const resposta = processarMensagem(d.telefone, d.nome, d.texto);
  await enviarMensagemWhatsApp(d.telefone, resposta);
}

app.get("/", (req, res) => res.send("🤖 MD Bot está online!"));

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"], token = req.query["hub.verify_token"], challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) { console.log("✅ Webhook verificado pela Meta."); return res.status(200).send(challenge); }
  return res.sendStatus(403);
});

app.post("/webhook", (req, res) => {
  if (req.body?.telefone && req.body?.mensagem !== undefined) {
    const resposta = processarMensagem(String(req.body.telefone), String(req.body.nome || "Cliente"), String(req.body.mensagem).trim());
    return res.json({ resposta });
  }
  if (!assinaturaValida(req)) return res.sendStatus(401);
  res.sendStatus(200);
  processarEventoMeta(req.body).catch(err => console.error("❌ Erro processando webhook:", err));
});

// ==================================================
// WEBHOOK DA TWILIO
// ==================================================

function escaparXml(texto) {

    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}


app.post("/twilio", function(req, res) {

    const telefone =
        String(req.body.From || "")
            .replace("whatsapp:", "");

    const nome =
        String(
            req.body.ProfileName ||
            "Cliente"
        );

    const mensagem =
        String(
            req.body.Body ||
            ""
        ).trim();


    console.log(
        `📩 WhatsApp: ${telefone} - ${mensagem}`
    );


    const resposta =
        processarMensagem(
            telefone,
            nome,
            mensagem
        );


    res
        .type("text/xml")
        .send(`
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${escaparXml(resposta)}</Message>
</Response>
        `.trim());
});


// ==================================================
// LIGAR SERVIDOR
// ==================================================

app.listen(
    PORT,
    "0.0.0.0",
    () => console.log(
        `🤖 MD Bot rodando na porta ${PORT}`
    )
);
