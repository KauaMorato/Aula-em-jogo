const API_URL = "http://127.0.0.1:5000/api";

const menuBtn = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");

let usuarioAtual = null;
let fase = 1;
let authModo = "login";

function ajustarMensagem(texto, cor = "red") {
    const msg = document.getElementById("mensagem-auth");
    msg.textContent = texto;
    msg.style.color = cor;
}

function alternarModo(modo) {
    authModo = modo;

    const tabLogin = document.getElementById("tabLogin");
    const tabCadastro = document.getElementById("tabCadastro");
    const submitButton = document.getElementById("authSubmitBtn");
    const title = document.getElementById("authTitle");
    const subtitle = document.getElementById("authSubtitle");

    const isLogin = modo === "login";

    tabLogin.classList.toggle("active", isLogin);
    tabCadastro.classList.toggle("active", !isLogin);

    title.textContent = isLogin ? "Entrar na sua conta" : "Crie sua conta";
    subtitle.textContent = isLogin
        ? "Acesse seu progresso e continue a jornada."
        : "Cadastre-se para salvar seu avanço no jogo.";

    submitButton.textContent = isLogin ? "Entrar" : "Cadastrar";
    submitButton.onclick = isLogin ? entrar : cadastrar;
}

function mostrarLogin() {
    document.getElementById("login").style.display = "flex";
    document.getElementById("jogar").style.display = "none";
    document.getElementById("jogo").style.display = "none";
    ajustarMensagem("");
    alternarModo("login");
    document.getElementById("usuario").focus();
}

async function entrar() {
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value;

    if (!usuario || !senha) {
        ajustarMensagem("Preencha usuário e senha!");
        return;
    }

    try {
        const resposta = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario, senha })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro ao entrar.");
        }

        usuarioAtual = usuario;
        fase = dados.progresso?.fase || 1;

        document.getElementById("login").style.display = "none";
        document.getElementById("jogar").style.display = "none";
        document.getElementById("jogo").style.display = "block";
        document.getElementById("bemVindo").textContent = "Bem-vindo, " + usuario + "!";

        atualizarInterfaceProgresso();
        ajustarMensagem("Login realizado com sucesso!", "green");
    } catch (erro) {
        ajustarMensagem(erro.message || "Usuário ou senha incorretos.");
    }
}

let posX = 50;
let posY = 50;

document.addEventListener("keydown", function (event) {
    if (document.getElementById("jogo").style.display !== "block") return;

    if (
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight"
    ) {
        event.preventDefault();
    }

    const player = document.getElementById("player");

    if (event.key === "ArrowRight" && posX < 760) {
        posX += 10;
    }

    if (event.key === "ArrowLeft" && posX > 0) {
        posX -= 10;
    }

    if (event.key === "ArrowUp" && posY > 0) {
        posY -= 10;
    }

    if (event.key === "ArrowDown" && posY < 410) {
        posY += 10;
    }

    player.style.left = posX + "px";
    player.style.top = posY + "px";
});

async function cadastrar() {
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value;

    if (!usuario || !senha) {
        ajustarMensagem("Preencha usuário e senha!");
        return;
    }

    try {
        const resposta = await fetch(`${API_URL}/cadastrar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario, senha })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro ao cadastrar.");
        }

        ajustarMensagem("Cadastrado com sucesso! Clique em Entrar.", "green");
        alternarModo("login");
    } catch (erro) {
        ajustarMensagem(erro.message || "Erro ao cadastrar.");
    }
}

async function salvarProgresso(novaFase) {
    if (!usuarioAtual) return;

    try {
        const resposta = await fetch(`${API_URL}/progresso`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario: usuarioAtual, fase: novaFase })
        });

        if (resposta.ok) {
            fase = novaFase;
            atualizarInterfaceProgresso();
        }
    } catch (erro) {
        console.error("Erro ao salvar progresso", erro);
    }
}

function logout() {
    usuarioAtual = null;
    fase = 1;
    document.getElementById("jogo").style.display = "none";
    document.getElementById("jogar").style.display = "block";
    document.getElementById("login").style.display = "none";
    ajustarMensagem("");
}

function avancarFase() {
    const novaFase = fase + 1;
    salvarProgresso(novaFase);
}

function atualizarInterfaceProgresso() {
    document.getElementById("faseAtual").innerText = fase;
    const porcentagem = Math.min((fase - 1) * 10, 100);
    document.getElementById("barraProgresso").style.width = `${porcentagem}%`;
}

if (menuBtn && navMenu) {
    menuBtn.addEventListener("click", () => {
        navMenu.classList.toggle("active");
    });

    document.querySelectorAll(".nav-menu a").forEach((link) => {
        link.addEventListener("click", () => navMenu.classList.remove("active"));
    });
}

window.mostrarLogin = mostrarLogin;
window.entrar = entrar;
window.cadastrar = cadastrar;
window.avançarFase = avancarFase;
window.logout = logout;
window.alternarModo = alternarModo;