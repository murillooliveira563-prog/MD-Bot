const cliente = {

    nome: "Dr. Ricardo Júnior",

    profissao: "Advogado Criminalista",

    whatsapp: "5521999999999",

    palavrasUrgentes: [
    "preso",
    "presa",
    "prisão",
    "flagrante",
    "detido",
    "detida",
    "delegacia",
    "mandado de prisão",
    "audiência de custódia",
    "habeas corpus"
],

    mensagemInicial: `
Olá! Seja bem-vindo(a) ao atendimento do Dr. Ricardo Júnior.

⚖️ Advogado Criminalista

Para direcionarmos melhor o seu atendimento, selecione uma opção:
`,

    areas: {

        // ==============================
        // ADVOCACIA CRIMINAL
        // ==============================

        criminal: {

            nome: "Advocacia Criminal",

            categorias: [
                "🚨 Urgência / Prisão",
                "Delegacia / Investigação",
                "Processo Criminal",
                "Crimes envolvendo drogas",
                "Tribunal do Júri",
                "Execução Penal",
                "Outro assunto criminal"
            ],

            subcategorias: {

                "🚨 Urgência / Prisão": [
                    "Prisão em flagrante",
                    "Prisão preventiva",
                    "Audiência de custódia",
                    "Pessoa presa ou detida",
                    "Mandado de prisão",
                    "Pedido de liberdade",
                    "Habeas Corpus",
                    "Outra situação urgente"
                ],

                "Delegacia / Investigação": [
                    "Acompanhamento em delegacia",
                    "Acompanhamento de depoimento",
                    "Intimação para depor",
                    "Inquérito policial",
                    "Investigação criminal",
                    "Busca e apreensão",
                    "Orientação antes de prestar depoimento"
                ],

                "Processo Criminal": [
                    "Defesa criminal",
                    "Denúncia / citação",
                    "Audiência",
                    "Alegações finais",
                    "Recursos",
                    "Apelação",
                    "Habeas Corpus",
                    "Outro assunto processual"
                ],

                "Crimes envolvendo drogas": [
                    "Tráfico de drogas",
                    "Associação para o tráfico",
                    "Prisão relacionada a drogas",
                    "Investigação ou processo por tráfico"
                ],

                "Tribunal do Júri": [
                    "Homicídio",
                    "Tentativa de homicídio",
                    "Feminicídio",
                    "Pronúncia",
                    "Defesa no Tribunal do Júri"
                ],

                "Execução Penal": [
                    "Cumprimento de pena",
                    "Progressão de regime",
                    "Remição",
                    "Livramento condicional",
                    "Transferência",
                    "Outro assunto relacionado à execução"
                ]
            }
        },


        // ==============================
        // OUTROS ASSUNTOS JURÍDICOS
        // ==============================

        outros: {

            nome: "Outros assuntos jurídicos",

            categorias: [
                "Família",
                "Dívidas / Bancos / Cobranças",
                "Energia / Água / Serviços",
                "SPC / Serasa",
                "Imóveis / Contratos",
                "Direito do Consumidor",
                "Outro assunto"
            ],

            subcategorias: {

                "Família": [
                    "Divórcio",
                    "Pensão alimentícia",
                    "Guarda",
                    "Visitas / convivência",
                    "União estável"
                ],

                "Dívidas / Bancos / Cobranças": [
                    "Dívidas",
                    "Cobranças indevidas",
                    "Empréstimos",
                    "Problemas bancários"
                ],

                "Energia / Água / Serviços": [
                    "Corte de energia",
                    "Restabelecimento de energia",
                    "Cobrança indevida",
                    "Água",
                    "Telefone",
                    "Internet"
                ],

                "SPC / Serasa": [
                    "Nome negativado",
                    "Negativação indevida",
                    "Dívida já paga",
                    "Cobrança indevida"
                ],

                "Imóveis / Contratos": [
                    "Compra e venda",
                    "Aluguel",
                    "Contratos",
                    "Problemas com imóvel"
                ],

                "Direito do Consumidor": [
                    "Problema com produto",
                    "Problema com serviço",
                    "Compras",
                    "Cancelamentos",
                    "Cobranças",
                    "Problemas com empresas"
                ]
            }
        }
    }
};