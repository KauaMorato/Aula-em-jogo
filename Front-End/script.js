// 1. Importação do cliente Supabase
import { supabase } from '../src/lib/supabase.js';

// Variáveis de estado global do jogo
let usuarioAtual = null;
let fase = 1;
const MAX_FASES = 5;
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
    const btnAvancar = document.getElementById("btnAvancar");
    const btnVoltar = document.getElementById("btnVoltar");
    const btnLogout = document.getElementById("btnLogout");

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