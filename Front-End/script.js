// 1. Importação do cliente Supabase
import { supabase } from '../src/lib/supabase.js';

// Variáveis de estado global do jogo
let usuarioAtual = null;
let fase = 1;
const MAX_FASES = 5;
let authModo = "login";

// Posição do personagem e colisão sólida do ponto de exclamação
let posX = 50;
let posY = 50;
const PLAYER_SIZE = 64;

const exclamacaoObj = {
    x: 520,
    y: 120,
    width: 42,
    height: 42
};
const MARGEM_PROXIMIDADE = 28;
let caixaAberta = false;

// Músicas por fase (em loop ao interagir com "E" nas fases)
const MUSICAS_POR_FASE = {
    1: new URL("../assets/Audio/jogo 1.wav", import.meta.url).href,
    2: new URL("../assets/Audio/jogo 2.wav", import.meta.url).href,
    3: new URL("../assets/Audio/jogo 3.wav", import.meta.url).href,
    4: new URL("../assets/Audio/jogo 4.wav", import.meta.url).href,
    5: new URL("../assets/Audio/jogo 5.wav", import.meta.url).href
};

// Gancho reservado para futura música de fundo antes de iniciar as atividades
// const MUSICA_FUNDO_INICIAL = null;

let audioAtual = null;
let faseMusicaAtual = null;
let audioMutado = false;

// Textos das mensagens e introduções das 5 fases
const NOTAS_SLIDES_KAUAN = [
    "Nos slides tem umas caixa colorida, no segundo é verdade no terceiro é outra cor",
    "Tira um print e joga no site la",
    "Coloca o exclamação na onde te disse ontem, com aquele esquema de chegar perto e aparecer os negocio escrito",
    "O que vai aparecer escrito é os bloco que falei nos slides"
];

const INTRODUCOES_FASES = {
    1: {
        titulo: "Fase 1 - Despertar do Código",
        missao: "MISSÃO 01. PRIMEIROS PASSOS\nBem-vindo à sua jornada em Python! Aprenda a exibir mensagens com print() e a guardar dados em variáveis e tipos básicos.\nAbra a aba Documentação e estude a Aula 1 antes de iniciar o desafio!",
        tema: "Comandos print(), input(), variáveis e tipos primitivos.",
        material: "Guia da Aula e Exercício 1 no portal."
    },
    2: {
        titulo: "Fase 2 - A Encruzilhada Lógica",
        missao: "MISSÃO 02 TOMANDO DECISÕES\nO caminho ficou desafiador! Dê inteligência ao código fazendo cálculos e escolhendo rotas com if, elif e else.\nAbra a aba Documentação e consulte a Aula 2 antes de resolver!",
        tema: "Operadores matemáticos, comparações e estruturas if, elif e else.",
        material: "Guia da Aula 2 e Exercício 2 no portal."
    },
    3: {
        titulo: "Fase 3 - Ciclo Infinito",
        missao: "MISSÃO 03. PODER DA REPETIÇÃO\nAutomatize tarefas repetitivas dominando os laços while e for com range(), sem cair em um loop infinito!\nAbra a aba Documentação e leia a Aula 3 para avançar de fase!",
        tema: "Laços while, for, função range(), break e continue.",
        material: "Guia da Aula 3 e Exercício 3 no portal."
    },
    4: {
        titulo: "Fase 4 - O Inventário do Herói",
        missao: "MISSÃO 04. ORGANIZANDO DADOS\nOrganize seu inventário usando listas dinâmicas, tuplas protegidas e dicionários com chave e valor.\nAbra a aba Documentação e confira a Aula 4 antes de jogar!",
        tema: "Coleções de dados: listas, tuplas imutáveis e dicionários.",
        material: "Guia da Aula 4 e Exercício 4 no portal."
    },
    5: {
        titulo: "Fase 5 - 0 Mestre das Funções",
        missao: "MISSÃO 05. O DESAFIO FINAL\nPatamar máximo alcançado! Crie comandos reutilizáveis com def, envie parâmetros e devolva resultados com return.\nAbra a aba Documentação e revise a Aula 5 para concluir o jogo!",
        tema: "Definição de funções com def, parâmetros, return e escopo.",
        material: "Guia da Aula 5 e Exercício 5 no portal."
    }
};

function colideComExclamacao(novoX, novoY) {
    return (
        novoX < exclamacaoObj.x + exclamacaoObj.width &&
        novoX + PLAYER_SIZE > exclamacaoObj.x &&
        novoY < exclamacaoObj.y + exclamacaoObj.height &&
        novoY + PLAYER_SIZE > exclamacaoObj.y
    );
}

function estaPertoDaExclamacao() {
    return (
        posX < exclamacaoObj.x + exclamacaoObj.width + MARGEM_PROXIMIDADE &&
        posX + PLAYER_SIZE > exclamacaoObj.x - MARGEM_PROXIMIDADE &&
        posY < exclamacaoObj.y + exclamacaoObj.height + MARGEM_PROXIMIDADE &&
        posY + PLAYER_SIZE > exclamacaoObj.y - MARGEM_PROXIMIDADE
    );
}

function garantirElementoAviso() {
    const gameArea = document.getElementById("gameArea");
    if (!gameArea) return null;

    let aviso = document.getElementById("avisoInteragir");
    if (!aviso) {
        aviso = document.createElement("div");
        aviso.id = "avisoInteragir";
        aviso.className = "aviso-interagir";
        aviso.textContent = "Aperte E para interagir";
        aviso.style.display = "none";
        gameArea.appendChild(aviso);
    }
    return aviso;
}

function renderizarConteudoInteracao() {
    const conteudo = document.getElementById("conteudoInteracao");
    if (!conteudo) return;

    const infoFase = INTRODUCOES_FASES[fase] || INTRODUCOES_FASES[1];
    const blocosSlides = NOTAS_SLIDES_KAUAN.map((txt) => `• ${txt}`).join("\n");

    conteudo.innerHTML = `
        <h4>${infoFase.titulo}</h4>
        <p>${infoFase.missao}</p>
        <p><strong>Tema da Fase:</strong> ${infoFase.tema}<br><strong>Material Indicado:</strong> ${infoFase.material}</p>
        <p><strong>Blocos / Slides:</strong>\n${blocosSlides}</p>
        <p><em>Aperte E novamente para fechar.</em></p>
    `;
}

function atualizarBotaoMute() {
    const btnMute = document.getElementById("btnMute");
    const iconeAtivo = document.getElementById("iconeAudioAtivo");
    const iconeMudo = document.getElementById("iconeAudioMudo");

    if (btnMute) {
        btnMute.classList.toggle("mutado", audioMutado);
        btnMute.setAttribute("aria-label", audioMutado ? "Ativar áudio" : "Mutar áudio");
    }

    if (iconeAtivo) {
        iconeAtivo.style.display = audioMutado ? "none" : "block";
    }

    if (iconeMudo) {
        iconeMudo.style.display = audioMutado ? "block" : "none";
    }
}

function alternarMute() {
    audioMutado = !audioMutado;
    if (audioAtual) {
        audioAtual.muted = audioMutado;
    }
    atualizarBotaoMute();
}

function tocarMusicaDaFase(numeroFase, forcarReiniciar = false) {
    const faseSegura = Math.max(1, Math.min(numeroFase, MAX_FASES));
    const srcMusica = MUSICAS_POR_FASE[faseSegura];
    if (!srcMusica) return;

    if (!forcarReiniciar && faseMusicaAtual === faseSegura && audioAtual && !audioAtual.paused) {
        audioAtual.muted = audioMutado;
        return;
    }

    if (audioAtual) {
        audioAtual.pause();
        audioAtual.currentTime = 0;
    }

    audioAtual = new Audio(srcMusica);
    audioAtual.loop = true;
    audioAtual.muted = audioMutado;
    faseMusicaAtual = faseSegura;

    audioAtual.play().catch((erro) => {
        console.warn("Erro ao reproduzir música da fase:", erro);
    });
}

function pararMusica() {
    if (audioAtual) {
        audioAtual.pause();
        audioAtual.currentTime = 0;
    }
    faseMusicaAtual = null;
}

function atualizarEstadoInteracao() {
    const aviso = garantirElementoAviso();
    const caixa = document.getElementById("caixaInteracao");
    if (!aviso || !caixa) return;

    const perto = estaPertoDaExclamacao();

    if (!perto) {
        if (caixaAberta) {
            caixaAberta = false;
            pararMusica();
        }
        caixa.style.display = "none";
        aviso.style.display = "none";
        return;
    }

    if (caixaAberta) {
        aviso.style.display = "none";
        renderizarConteudoInteracao();
        caixa.style.display = "block";
        tocarMusicaDaFase(fase, false);
    } else {
        caixa.style.display = "none";
        aviso.style.display = "block";
        pararMusica();
    }
}

function atualizarEstadoDocumentacao() {
    const secaoDocumentacao = document.getElementById("documentacao");
    const linksDocumentacao = document.querySelectorAll(".nav-doc-item, .footer-doc-item");

    if (secaoDocumentacao) {
        secaoDocumentacao.style.display = usuarioAtual ? "block" : "none";
    }

    linksDocumentacao.forEach((item) => {
        item.style.display = usuarioAtual ? "block" : "none";
    });
}

function ajustarMensagem(texto, cor = "red") {
    const msg = document.getElementById("mensagem-auth");
    if (msg) {
        msg.textContent = texto;
        msg.style.color = cor;
    }
}

function definirCarregamento(carregando) {
    const submitButton = document.getElementById("authSubmitBtn");
    if (!submitButton) return;

    submitButton.disabled = carregando;
    submitButton.textContent = carregando
        ? "Aguarde..."
        : (authModo === "login" ? "Entrar" : "Cadastrar");
}

function obterEmailDoUsuario(usuario) {
    const usuarioSanitizado = usuario
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9_-]/g, "");

    if (!usuarioSanitizado) {
        throw new Error("O usuário deve conter pelo menos uma letra ou número.");
    }

    return `${usuarioSanitizado}@jogo.com`;
}

function obterMensagemDeErroAuth(erro, acao) {
    const codigo = erro?.code || "";
    const mensagem = erro?.message || "";

    if (codigo === "email_not_confirmed" || mensagem.toLowerCase().includes("email not confirmed")) {
        return "Esta conta ainda não foi confirmada. Confirme-a no painel do Supabase em Authentication > Users.";
    }
    if (codigo === "invalid_credentials" || mensagem.toLowerCase().includes("invalid login credentials")) {
        return "Usuário ou senha incorretos.";
    }
    if (codigo === "user_already_exists" || mensagem.includes("User already registered")) {
        return "Este usuário já está cadastrado!";
    }
    if (codigo === "weak_password" || mensagem.includes("Password should be at least")) {
        return "A senha deve ter no mínimo 6 caracteres!";
    }
    if (codigo === "over_email_send_rate_limit") {
        return "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
    }
    if (mensagem.toLowerCase().includes("failed to fetch") || mensagem.toLowerCase().includes("network")) {
        return "Não foi possível conectar ao Supabase. Verifique sua conexão e as configurações do projeto.";
    }

    return mensagem || (acao === "cadastro" ? "Erro ao cadastrar." : "Erro ao entrar.");
}

function alternarModo(modo) {
    authModo = modo;

    const tabLogin = document.getElementById("tabLogin");
    const tabCadastro = document.getElementById("tabCadastro");
    const submitButton = document.getElementById("authSubmitBtn");
    const title = document.getElementById("authTitle");
    const subtitle = document.getElementById("authSubtitle");

    const isLogin = modo === "login";

    if (tabLogin) tabLogin.classList.toggle("active", isLogin);
    if (tabCadastro) tabCadastro.classList.toggle("active", !isLogin);

    if (title) title.textContent = isLogin ? "Entrar na sua conta" : "Crie sua conta";
    if (subtitle) {
        subtitle.textContent = isLogin
            ? "Acesse seu progresso e continue a jornada."
            : "Cadastre-se para salvar seu avanço no jogo.";
    }

    if (submitButton) {
        submitButton.textContent = isLogin ? "Entrar" : "Cadastrar";
    }
}

function mostrarLogin(mensagem = "") {
    const elLogin = document.getElementById("login");
    const elJogar = document.getElementById("jogar");
    const elJogo = document.getElementById("jogo");

    if (elLogin) elLogin.style.display = "flex";
    if (elJogar) elJogar.style.display = "none";
    if (elJogo) elJogo.style.display = "none";

    ajustarMensagem(mensagem);
    alternarModo("login");

    const elUsuario = document.getElementById("usuario");
    if (elUsuario) elUsuario.focus();
}

// LOGIN NO SUPABASE
async function entrar() {
    const elUsuario = document.getElementById("usuario");
    const elSenha = document.getElementById("senha");

    const usuario = elUsuario ? elUsuario.value.trim() : "";
    const senha = elSenha ? elSenha.value : "";

    if (!usuario || !senha) {
        ajustarMensagem("Preencha usuário e senha!");
        return;
    }

    try {
        const emailFicticio = obterEmailDoUsuario(usuario);
        definirCarregamento(true);

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: emailFicticio,
            password: senha
        });

        if (authError) throw authError;
        if (!authData?.session || !authData.user) {
            throw new Error("O login não criou uma sessão válida.");
        }

        const user = authData.user;
        usuarioAtual = user.id;

        const { data: docSnap, error: docError } = await supabase
            .from("Cadastro")
            .select("Fase")
            .eq("id", user.id)
            .maybeSingle();

        if (docError) throw docError;

        if (docSnap && docSnap.Fase) {
            fase = Math.min(docSnap.Fase, MAX_FASES);
        } else {
            fase = 1;
        }

        const elLogin = document.getElementById("login");
        const elJogar = document.getElementById("jogar");
        const elJogo = document.getElementById("jogo");
        const elBemVindo = document.getElementById("bemVindo");

        if (elLogin) elLogin.style.display = "none";
        if (elJogar) elJogar.style.display = "none";
        if (elJogo) elJogo.style.display = "block";
        if (elBemVindo) elBemVindo.textContent = "Bem-vindo, " + usuario + "!";

        atualizarInterfaceProgresso();
        atualizarEstadoDocumentacao();
        atualizarEstadoInteracao();
        ajustarMensagem("Login realizado com sucesso!", "green");
    } catch (erro) {
        console.error("Erro no login:", erro);
        ajustarMensagem(obterMensagemDeErroAuth(erro, "login"));
    } finally {
        definirCarregamento(false);
    }
}

// CADASTRO NO SUPABASE
async function cadastrar() {
    const elUsuario = document.getElementById("usuario");
    const elSenha = document.getElementById("senha");

    const usuario = elUsuario ? elUsuario.value.trim() : "";
    const senha = elSenha ? elSenha.value : "";

    if (!usuario || !senha) {
        ajustarMensagem("Preencha usuário e senha!");
        return;
    }

    try {
        const emailFicticio = obterEmailDoUsuario(usuario);
        definirCarregamento(true);

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: emailFicticio,
            password: senha
        });

        if (authError) throw authError;

        const user = authData.user;
        if (!user) {
            throw new Error("O cadastro não criou o usuário no Supabase.");
        }

        if (!authData.session) {
            await supabase.auth.signOut();
            ajustarMensagem(
                "Cadastro criado, mas a confirmação de e-mail está ativa. No Supabase, desative-a em Authentication > Providers > Email ou confirme o usuário no painel.",
                "red"
            );
            return;
        }

        usuarioAtual = user.id;

        const { error: dbError } = await supabase
            .from("Cadastro")
            .upsert({
                id: user.id,
                Nome: usuario,
                Fase: 1
            });

        if (dbError) throw dbError;

        ajustarMensagem("Cadastrado com sucesso! Clique em Entrar.", "green");
        alternarModo("login");
        atualizarEstadoDocumentacao();
    } catch (erro) {
        console.error("Erro no cadastro:", erro);
        ajustarMensagem(obterMensagemDeErroAuth(erro, "cadastro"));
    } finally {
        definirCarregamento(false);
    }
}

// SALVAR PROGRESSO
async function salvarProgresso(novaFase) {
    if (!usuarioAtual) return;

    const faseValidada = Math.max(1, Math.min(novaFase, MAX_FASES));

    try {
        const { error } = await supabase
            .from("Cadastro")
            .upsert({
                id: usuarioAtual,
                Fase: faseValidada
            }, { onConflict: "id" });

        if (error) throw error;

        fase = faseValidada;
        atualizarInterfaceProgresso();
        if (caixaAberta) {
            renderizarConteudoInteracao();
            tocarMusicaDaFase(fase, true);
        }
    } catch (erro) {
        console.error("Erro ao salvar progresso", erro);
    }
}

async function logout() {
    pararMusica();
    await supabase.auth.signOut();
    usuarioAtual = null;
    fase = 1;
    caixaAberta = false;
    mostrarLogin("");
    atualizarEstadoDocumentacao();
}

async function restaurarSessao() {
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const session = data?.session;
        if (!session?.user) {
            mostrarLogin("");
            return;
        }

        usuarioAtual = session.user.id;

        const { data: docSnap, error: docError } = await supabase
            .from("Cadastro")
            .select("Fase")
            .eq("id", usuarioAtual)
            .maybeSingle();

        if (docError) throw docError;
        fase = Math.min(docSnap?.Fase || 1, MAX_FASES);

        const elLogin = document.getElementById("login");
        const elJogo = document.getElementById("jogo");
        if (elLogin) elLogin.style.display = "none";
        if (elJogo) elJogo.style.display = "block";

        atualizarInterfaceProgresso();
        atualizarEstadoDocumentacao();
        atualizarEstadoInteracao();
    } catch (erro) {
        console.error("Erro ao restaurar sessão:", erro);
        await supabase.auth.signOut();
        mostrarLogin(obterMensagemDeErroAuth(erro, "login"));
    }
}

function avancarFase() {
    if (fase < MAX_FASES) {
        const novaFase = fase + 1;
        salvarProgresso(novaFase);
    }
}

function voltarFase() {
    if (fase > 1) {
        const novaFase = fase - 1;
        salvarProgresso(novaFase);
    }
}

function atualizarInterfaceProgresso() {
    const elFase = document.getElementById("faseAtual");
    const elBarra = document.getElementById("barraProgresso");
    const btnAvancar = document.getElementById("btnAvancar");

    if (elFase) elFase.innerText = fase;

    if (elBarra) {
        const porcentagem = ((fase - 1) / (MAX_FASES - 1)) * 100;
        elBarra.style.width = `${Math.min(Math.max(porcentagem, 0), 100)}%`;
    }

    if (btnAvancar) {
        btnAvancar.disabled = (fase >= MAX_FASES);
    }
}

// CONTROLE DE TECLADO E MOVIMENTAÇÃO
document.addEventListener("keydown", function (event) {
    const elJogo = document.getElementById("jogo");
    if (!elJogo || elJogo.style.display !== "block") return;

    const tecla = event.key.toLowerCase();

    if (tecla === "e") {
        event.preventDefault();
        if (estaPertoDaExclamacao()) {
            caixaAberta = !caixaAberta;
            atualizarEstadoInteracao();
        }
        return;
    }

    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(tecla)) {
        event.preventDefault();
    }

    const player = document.getElementById("player");
    if (!player) return;

    let proximoX = posX;
    let proximoY = posY;

    if ((tecla === "arrowright" || tecla === "d") && posX < 736) proximoX += 10;
    if ((tecla === "arrowleft" || tecla === "a") && posX > 0) proximoX -= 10;
    if ((tecla === "arrowup" || tecla === "w") && posY > 0) proximoY -= 10;
    if ((tecla === "arrowdown" || tecla === "s") && posY < 386) proximoY += 10;

    if (!colideComExclamacao(proximoX, proximoY)) {
        posX = proximoX;
        posY = proximoY;
        player.style.left = posX + "px";
        player.style.top = posY + "px";
    }

    atualizarEstadoInteracao();
});

// INICIALIZAÇÃO E EVENTOS DE CLIQUE
document.addEventListener("DOMContentLoaded", () => {
    garantirElementoAviso();
    atualizarBotaoMute();

    const btnMute = document.getElementById("btnMute");
    const menuBtn = document.getElementById("menuBtn");
    const navMenu = document.getElementById("navMenu");
    const tabLogin = document.getElementById("tabLogin");
    const tabCadastro = document.getElementById("tabCadastro");
    const submitButton = document.getElementById("authSubmitBtn");
    const btnAvancar = document.getElementById("btnAvancar");
    const btnVoltar = document.getElementById("btnVoltar");
    const btnLogout = document.getElementById("btnLogout");

    if (btnMute) {
        btnMute.addEventListener("click", (e) => {
            e.preventDefault();
            alternarMute();
        });
    }

    if (menuBtn && navMenu) {
        menuBtn.addEventListener("click", () => {
            navMenu.classList.toggle("active");
        });

        document.querySelectorAll(".nav-menu a").forEach((link) => {
            link.addEventListener("click", () => navMenu.classList.remove("active"));
        });
    }

    if (tabLogin) {
        tabLogin.addEventListener("click", (e) => {
            e.preventDefault();
            alternarModo("login");
        });
    }

    if (tabCadastro) {
        tabCadastro.addEventListener("click", (e) => {
            e.preventDefault();
            alternarModo("cadastro");
        });
    }

    if (submitButton) {
        submitButton.addEventListener("click", (e) => {
            e.preventDefault();
            if (authModo === "login") {
                entrar();
            } else {
                cadastrar();
            }
        });
    }

    if (btnAvancar) {
        btnAvancar.addEventListener("click", (e) => {
            e.preventDefault();
            avancarFase();
        });
    }

    if (btnVoltar) {
        btnVoltar.addEventListener("click", (e) => {
            e.preventDefault();
            voltarFase();
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener("click", (e) => {
            e.preventDefault();
            logout();
        });
    }

    atualizarEstadoDocumentacao();
    restaurarSessao();
});

// EXPORTAÇÃO GLOBAL PARA EVENTOS ONCLICK DO HTML
window.mostrarLogin = (msg) => mostrarLogin(msg);
window.entrar = () => entrar();
window.cadastrar = () => cadastrar();
window.avancarFase = () => avancarFase();
window.voltarFase = () => voltarFase();
window.logout = () => logout();
window.alternarModo = (modo) => alternarModo(modo);