// ==============================
// ELEMENTOS DA TELA
// ==============================

const areaMensagens = document.getElementById("mensagens");
const areaOpcoes = document.getElementById("opcoes");

const areaEntrada =
    document.getElementById("entrada");

const campoMensagem =
    document.getElementById("campoMensagem");

const botaoEnviar =
    document.getElementById("botaoEnviar");

// ==============================
// DADOS DO ATENDIMENTO ATUAL
// ==============================

let atendimentoAtual = {
    nome: null,
    cidade: null,
    relato: null,
    area: null,
    categoria: null,
    subcategoria: null,
    prioridade: "normal"
};
let etapaAtual = null;


// ==============================
// ADICIONAR MENSAGEM DO ROBÔ
// ==============================

function adicionarMensagemRobo(texto) {

    const mensagem = document.createElement("div");

    mensagem.classList.add(
        "mensagem",
        "mensagem-robo"
    );

    mensagem.textContent = texto.trim();

    areaMensagens.appendChild(mensagem);

    areaMensagens.scrollTop =
        areaMensagens.scrollHeight;
}


// ==============================
// ADICIONAR MENSAGEM DO CLIENTE
// ==============================

function adicionarMensagemCliente(texto) {

    const mensagem = document.createElement("div");

    mensagem.classList.add(
        "mensagem",
        "mensagem-cliente"
    );

    mensagem.textContent = texto;

    areaMensagens.appendChild(mensagem);

    areaMensagens.scrollTop =
        areaMensagens.scrollHeight;
}


// ==============================
// LIMPAR BOTÕES
// ==============================

function limparOpcoes() {

    areaOpcoes.innerHTML = "";
}


// ==============================
// CRIAR BOTÃO
// ==============================

function criarBotao(texto, acao) {

    const botao = document.createElement("button");

    botao.classList.add("botao-opcao");

    botao.textContent = texto;

    botao.addEventListener("click", acao);

    areaOpcoes.appendChild(botao);
}


// ==============================
// MENU PRINCIPAL
// ==============================

function mostrarMenuPrincipal() {

    limparOpcoes();

    criarBotao(
        `⚖️ ${cliente.areas.criminal.nome}`,
        abrirCriminal
    );

    criarBotao(
        `📋 ${cliente.areas.outros.nome}`,
        abrirOutrosAssuntos
    );
}


// ==============================
// ÁREA CRIMINAL
// ==============================

function abrirCriminal() {

    atendimentoAtual.area =
        cliente.areas.criminal.nome;

    adicionarMensagemCliente(
        cliente.areas.criminal.nome
    );

    adicionarMensagemRobo(
        "Certo. Vamos entender melhor o que aconteceu. Qual situação mais se aproxima do seu caso?"
    );

    limparOpcoes();

    cliente.areas.criminal.categorias.forEach(
        function(categoria) {

            criarBotao(
                categoria,
                function() {

                    escolherCategoriaCriminal(categoria);
                }
            );
        }
    );
}


// ==============================
// ESCOLHER CATEGORIA CRIMINAL
// ==============================

function escolherCategoriaCriminal(categoria) {

    atendimentoAtual.categoria = categoria;

    adicionarMensagemCliente(categoria);

    limparOpcoes();

    const subcategorias =
        cliente.areas.criminal.subcategorias[categoria];


    if (subcategorias) {

        adicionarMensagemRobo(
            "Certo. Selecione a opção que mais se aproxima da situação:"
        );

        subcategorias.forEach(
            function(subcategoria) {

                criarBotao(
                    subcategoria,
                    function() {

                        escolherSubcategoriaCriminal(
                            categoria,
                            subcategoria
                        );
                    }
                );
            }
        );

        return;
    }


    // ==============================
// CATEGORIA SEM SUBCATEGORIAS
// ==============================

atendimentoAtual.subcategoria = categoria;
atendimentoAtual.prioridade = "normal";

adicionarMensagemRobo(
    `Entendi. Você selecionou "${categoria}".

Sem problema. Durante o atendimento você poderá explicar, com suas próprias palavras, o que aconteceu.`
);

criarBotao(
    "Continuar atendimento",
    iniciarColetaAtendimento
);

}


// ==============================
// ESCOLHER SUBCATEGORIA CRIMINAL
// ==============================

function escolherSubcategoriaCriminal(
    categoria,
    subcategoria
) {

    adicionarMensagemCliente(subcategoria);

    limparOpcoes();

    atendimentoAtual.subcategoria = subcategoria;


    // ==============================
    // CASO URGENTE
    // ==============================

    if (categoria === "🚨 Urgência / Prisão") {

        atendimentoAtual.prioridade = "urgente";

        adicionarMensagemRobo(
            `🔴 ATENDIMENTO CRIMINAL URGENTE

Entendi. A situação foi identificada como "${subcategoria}".

Vamos coletar algumas informações para direcionar seu atendimento com prioridade ao Dr. Ricardo Júnior.`
        );

    } else {

        // ==============================
        // CASO NORMAL
        // ==============================

        atendimentoAtual.prioridade = "normal";

        adicionarMensagemRobo(
            `Entendi. O atendimento foi identificado como "${subcategoria}".

Vamos coletar algumas informações para direcionar corretamente o seu atendimento.`
        );
    }


    criarBotao(
        "Continuar atendimento",
        iniciarColetaAtendimento
    );
}

// ==============================
// CAMPO DE DIGITAÇÃO
// ==============================

function mostrarEntrada() {

    areaEntrada.classList.remove(
        "entrada-escondida"
    );

    campoMensagem.focus();
}


function esconderEntrada() {

    areaEntrada.classList.add(
        "entrada-escondida"
    );

    campoMensagem.value = "";
}

// ==============================
// COLETA DE DADOS URGENTES
// ==============================

function iniciarColetaAtendimento() {

    limparOpcoes();

    adicionarMensagemRobo(
        "Certo. Primeiro, qual é o seu nome?"
    );

    etapaAtual = "nome";

    mostrarEntrada();
}

// ==============================
// OUTROS ASSUNTOS
// ==============================

function abrirOutrosAssuntos() {

    atendimentoAtual.area =
        cliente.areas.outros.nome;

    adicionarMensagemCliente(
        cliente.areas.outros.nome
    );

    adicionarMensagemRobo(
        "Certo. Qual assunto melhor representa o seu caso?"
    );

    limparOpcoes();

    cliente.areas.outros.categorias.forEach(
        function(categoria) {

            criarBotao(
                categoria,
                function() {

                    escolherOutroAssunto(categoria);
                }
            );
        }
    );
}


// ==============================
// ESCOLHER OUTRO ASSUNTO
// ==============================

function escolherOutroAssunto(categoria) {

    atendimentoAtual.categoria = categoria;

    adicionarMensagemCliente(categoria);

    limparOpcoes();

    const subcategorias =
        cliente.areas.outros.subcategorias[categoria];


    // SE A CATEGORIA TIVER SUBCATEGORIAS
    if (subcategorias) {

        adicionarMensagemRobo(
            "Certo. Selecione a opção que mais se aproxima do seu caso:"
        );

        subcategorias.forEach(
            function(subcategoria) {

                criarBotao(
                    subcategoria,
                    function() {

                        escolherSubcategoriaOutroAssunto(
                            categoria,
                            subcategoria
                        );
                    }
                );
            }
        );

        return;
    }


    // CASO SEJA "OUTRO ASSUNTO"
    atendimentoAtual.subcategoria = categoria;
    atendimentoAtual.prioridade = "normal";

    adicionarMensagemRobo(
        `Sem problema.

Você poderá explicar com suas próprias palavras qual é o assunto e o que aconteceu.`
    );

    criarBotao(
        "Continuar atendimento",
        iniciarColetaAtendimento
    );
}

// ==============================
// SUBCATEGORIA - OUTROS ASSUNTOS
// ==============================

function escolherSubcategoriaOutroAssunto(
    categoria,
    subcategoria
) {

    atendimentoAtual.subcategoria = subcategoria;
    atendimentoAtual.prioridade = "normal";

    adicionarMensagemCliente(subcategoria);

    limparOpcoes();

    adicionarMensagemRobo(
        `Entendi. O assunto selecionado foi "${subcategoria}".

Vamos coletar algumas informações para direcionar corretamente o seu atendimento.`
    );

    criarBotao(
        "Continuar atendimento",
        iniciarColetaAtendimento
    );
}

// ==============================
// REINICIAR ATENDIMENTO
// ==============================

function reiniciarAtendimento() {

    // LIMPA A TELA
    areaMensagens.innerHTML = "";

    // LIMPA OS BOTÕES
    limparOpcoes();

    // ESCONDE O CAMPO DE DIGITAÇÃO
    esconderEntrada();

    // RESETA A ETAPA
    etapaAtual = null;

    // RESETA OS DADOS
    atendimentoAtual = {
        nome: null,
        cidade: null,
        relato: null,
        area: null,
        categoria: null,
        subcategoria: null,
        prioridade: "normal"
    };

    // COMEÇA TUDO DE NOVO
    iniciarAtendimento();
}

// ==============================
// INICIAR ROBÔ
// ==============================

function iniciarAtendimento() {

    adicionarMensagemRobo(
        cliente.mensagemInicial
    );

    mostrarMenuPrincipal();
}

// ==============================
// GERAR FICHA DO ATENDIMENTO
// ==============================

function gerarFichaAtendimento() {

    let titulo;
    let prioridade;
    let iconeSituacao;


    // ==============================
    // ATENDIMENTO CRIMINAL
    // ==============================

    if (atendimentoEhCriminal()) {

        iconeSituacao = "🚔";

        if (
            atendimentoAtual.prioridade ===
            "urgente"
        ) {

            titulo =
                "🚨 NOVO ATENDIMENTO CRIMINAL URGENTE";

            prioridade =
                "🔴 URGENTE";

        } else {

            titulo =
                "⚖️ NOVO ATENDIMENTO CRIMINAL";

            prioridade =
                "🟢 NORMAL";
        }

    } else {

        // ==============================
        // OUTROS ASSUNTOS
        // ==============================

        titulo =
            "📋 NOVO ATENDIMENTO JURÍDICO";

        prioridade =
            "🟢 NORMAL";

        iconeSituacao = "📌";
    }


    return `
${titulo}

👤 Cliente: ${atendimentoAtual.nome}

⚖️ Área: ${atendimentoAtual.area}

📂 Categoria: ${atendimentoAtual.categoria}

${iconeSituacao} Assunto: ${atendimentoAtual.subcategoria}

📍 Cidade: ${atendimentoAtual.cidade}

📝 Relato:
${atendimentoAtual.relato}

Prioridade: ${prioridade}
    `.trim();
}
// ==============================
// ENVIAR PARA WHATSAPP
// ==============================

function enviarAtendimentoWhatsApp() {

    const ficha =
        gerarFichaAtendimento();

    const mensagem =
        encodeURIComponent(ficha);

    const link =
        `https://wa.me/${cliente.whatsapp}?text=${mensagem}`;

    window.open(
        link,
        "_blank"
    );
}

// ==============================
// IDENTIFICAR TIPO DE ATENDIMENTO
// ==============================

function atendimentoEhCriminal() {

    return atendimentoAtual.area ===
        cliente.areas.criminal.nome;
}

// ==============================
// DETECTAR URGÊNCIA NO TEXTO
// ==============================

function detectarUrgencia(texto) {

    const textoMinusculo =
        texto.toLowerCase();

    return cliente.palavrasUrgentes.some(
        function(palavra) {

            return textoMinusculo.includes(
                palavra.toLowerCase()
            );
        }
    );
}

// ==============================
// RECEBER MENSAGEM DIGITADA
// ==============================

 function enviarMensagemDigitada() {

    const texto =
        campoMensagem.value.trim();

    if (texto === "") {
        return;
    }

    adicionarMensagemCliente(texto);

    campoMensagem.value = "";


    // ==============================
    // ETAPA: NOME
    // ==============================

    if (etapaAtual === "nome") {

        atendimentoAtual.nome = texto;


        // ATENDIMENTO CRIMINAL
        if (atendimentoEhCriminal()) {

            adicionarMensagemRobo(
                `Obrigado, ${texto}! Agora me informe a cidade ou local onde aconteceu a situação.`
            );

        } else {

            // OUTROS ASSUNTOS JURÍDICOS
            adicionarMensagemRobo(
                `Obrigado, ${texto}! Agora me informe sua cidade ou a cidade relacionada ao atendimento.`
            );
        }


        etapaAtual = "cidade";

        campoMensagem.focus();

        return;
    }


    // ==============================
    // ETAPA: CIDADE
    // ==============================

    if (etapaAtual === "cidade") {

        atendimentoAtual.cidade = texto;


        if (atendimentoEhCriminal()) {

            adicionarMensagemRobo(
                "Certo. Agora conte brevemente, com suas próprias palavras, o que aconteceu."
            );

        } else {

            adicionarMensagemRobo(
                `Certo. Agora explique brevemente sua situação e o que você precisa resolver.`
            );
        }


        etapaAtual = "relato";

        campoMensagem.focus();

        return;
    }


    // ==============================
    // ETAPA: RELATO
    // ==============================

    if (etapaAtual === "relato") {

        atendimentoAtual.relato = texto;

const urgenciaDetectada =
    detectarUrgencia(texto);


if (urgenciaDetectada) {

    atendimentoAtual.prioridade =
        "urgente";

    adicionarMensagemRobo(
        `🚨 Identifiquei informações que podem indicar uma situação criminal urgente.

Este atendimento será sinalizado como prioritário para o Dr. Ricardo Júnior.`
    );
}

        etapaAtual = null;

        esconderEntrada();

        const fichaAtendimento =
            gerarFichaAtendimento();


        if (
            atendimentoAtual.prioridade ===
            "urgente"
        ) {

            adicionarMensagemRobo(
                `Obrigado, ${atendimentoAtual.nome}.

Seu atendimento foi registrado e será direcionado com prioridade ao Dr. Ricardo Júnior.`
            );

        } else {

            adicionarMensagemRobo(
                `Obrigado, ${atendimentoAtual.nome}.

Seu atendimento foi registrado e será direcionado ao Dr. Ricardo Júnior.`
            );
        }


        criarBotao(
            "📲 Encaminhar atendimento",
            enviarAtendimentoWhatsApp
        );

        criarBotao(
    "🔄 Novo atendimento",
    reiniciarAtendimento
);


        console.log(fichaAtendimento);

        return;
    }
}



// CLICAR NO BOTÃO ➤
botaoEnviar.addEventListener(
    "click",
    enviarMensagemDigitada
);


// APERTAR ENTER
campoMensagem.addEventListener(
    "keydown",
    function(evento) {

        if (evento.key === "Enter") {

            enviarMensagemDigitada();
        }
    }
);

// LIGA O ROBÔ
iniciarAtendimento();