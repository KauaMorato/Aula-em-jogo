// 1. Importação do cliente Supabase
import { supabase } from '../src/lib/supabase.js';

// Variáveis de estado global do jogo
let usuarioAtual = null;
let fase = 1;
let authModo = "login";

// Posição do personagem
let posX = 50;
let posY = 50;

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

    const usuarioSanitizado = usuario.toLowerCase().replace(/\s+/g, '');
    const emailFicticio = `${usuarioSanitizado}@jogo.com`;

    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: emailFicticio,
            password: senha
        });

        if (authError) throw authError;

        const user = authData.user;
        usuarioAtual = user.id;

        const { data: docSnap } = await supabase
            .from("Cadastro")
            .select("Fase")
            .eq("id", user.id)
            .maybeSingle();

        if (docSnap && docSnap.Fase) {
            fase = docSnap.Fase;
        } else {
            fase = 1;
        }

        document.getElementById("login").style.display = "none";
        document.getElementById("jogar").style.display = "none";
        document.getElementById("jogo").style.display = "block";
        document.getElementById("bemVindo").textContent = "Bem-vindo, " + usuario + "!";

        atualizarInterfaceProgresso();
        atualizarEstadoDocumentacao();
        ajustarMensagem("Login realizado com sucesso!", "green");
    } catch (erro) {
        console.error("Erro no login:", erro);
        ajustarMensagem(erro.message || "Usuário ou senha incorretos.");
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

    const usuarioSanitizado = usuario.toLowerCase().replace(/\s+/g, '');
    const emailFicticio = `${usuarioSanitizado}@jogo.com`;

    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: emailFicticio,
            password: senha
        });

        if (authError) throw authError;

        const user = authData.user;
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
        if (erro.message && erro.message.includes("Password should be at least")) {
            ajustarMensagem("A senha deve ter no mínimo 6 caracteres!");
        } else if (erro.message && erro.message.includes("User already registered")) {
            ajustarMensagem("Este usuário já está cadastrado!");
        } else {
            ajustarMensagem(erro.message || "Erro ao cadastrar.");
        }
    }
}

// SALVAR PROGRESSO
async function salvarProgresso(novaFase) {
    if (!usuarioAtual) return;

    try {
        const { error } = await supabase
            .from("Cadastro")
            .upsert({
                id: usuarioAtual,
                Fase: novaFase
            }, { onConflict: "id" });

        if (error) throw error;

        fase = novaFase;
        atualizarInterfaceProgresso();
    } catch (erro) {
        console.error("Erro ao salvar progresso", erro);
    }
}

async function logout() {
    await supabase.auth.signOut();
    usuarioAtual = null;
    fase = 1;
    mostrarLogin("");
    atualizarEstadoDocumentacao();
}

function avancarFase() {
    const novaFase = fase + 1;
    salvarProgresso(novaFase);
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

    if (elFase) elFase.innerText = fase;
    if (elBarra) {
        const porcentagem = Math.min((fase - 1) * 10, 100);
        elBarra.style.width = `${porcentagem}%`;
    }
}

// CONTROLE DE TECLADO E MOVIMENTAÇÃO
document.addEventListener("keydown", function (event) {
    const elJogo = document.getElementById("jogo");
    if (!elJogo || elJogo.style.display !== "block") return;

    const tecla = event.key.toLowerCase();

    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(tecla)) {
        event.preventDefault();
    }

    const player = document.getElementById("player");
    if (!player) return;

    if ((tecla === "arrowright" || tecla === "d") && posX < 736) posX += 10;
    if ((tecla === "arrowleft" || tecla === "a") && posX > 0) posX -= 10;
    if ((tecla === "arrowup" || tecla === "w") && posY > 0) posY -= 10;
    if ((tecla === "arrowdown" || tecla === "s") && posY < 386) posY += 10;

    player.style.left = posX + "px";
    player.style.top = posY + "px";
});

// INICIALIZAÇÃO E EVENTOS DE CLIQUE
document.addEventListener("DOMContentLoaded", () => {
    const menuBtn = document.getElementById("menuBtn");
    const navMenu = document.getElementById("navMenu");
    const tabLogin = document.getElementById("tabLogin");
    const tabCadastro = document.getElementById("tabCadastro");
    const submitButton = document.getElementById("authSubmitBtn");

    if (menuBtn && navMenu) {
        menuBtn.addEventListener("click", () => {
            navMenu.classList.toggle("active");
        });

        document.querySelectorAll(".nav-menu a").forEach((link) => {
            link.addEventListener("click", () => navMenu.classList.remove("active"));
        });
    }

    if (tabLogin) {
        tabLogin.addEventListener("click", () => alternarModo("login"));
    }

    if (tabCadastro) {
        tabCadastro.addEventListener("click", () => alternarModo("cadastro"));
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

    atualizarEstadoDocumentacao();
    mostrarLogin();
});

// EXPORTAÇÃO GLOBAL PARA EVENTOS ONCLICK DO HTML
window.mostrarLogin = mostrarLogin;
window.entrar = entrar;
window.cadastrar = cadastrar;
window.avancarFase = avancarFase;
window.voltarFase = voltarFase;
window.logout = logout;
window.alternarModo = alternarModo;