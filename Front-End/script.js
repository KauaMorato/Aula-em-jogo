import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://blwrjkpzimpxbubrgcna.supabase.co/rest/v1/";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd3Jqa3B6aW1weGJ1YnJnY25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjc0MTEsImV4cCI6MjEwMTcwMzQxMX0.MNPXNuvw06TG2jRZKKuKb61_fdBEwVjAIcspeQ425bw";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const menuBtn = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");

let usuarioAtual = null;
let fase = 1;
let authModo = "login";

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
    alternarModo("login");
}

async function entrar() {
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value;
    const msg = document.getElementById("mensagem-auth");

    if (!usuario || !senha) {
        msg.innerText = "Preencha usuário e senha!";
        msg.style.color = "red";
        return;
    }

    const emailFicticio = `${usuario}@jogo.com`;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: emailFicticio,
            password: senha,
        });

        if (error) throw error;

        usuarioAtual = usuario;

        const { data: cadastroData, error: dbError } = await supabase
            .from("Cadastro")
            .select("fase")
            .eq("id", data.user.id)
            .single();

        if (!dbError && cadastroData) {
            fase = cadastroData.fase;
        } else {
            fase = 1;
        }

        document.getElementById("login").style.display = "none";
        document.getElementById("jogar").style.display = "none";
        document.getElementById("jogo").style.display = "block";
        document.getElementById("bemVindo").textContent = "Bem-vindo, " + usuario + "!";

        atualizarInterfaceProgresso();
    } catch (e) {
        msg.style.color = "red";
        msg.innerText = "Usuário ou senha incorretos.";
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
    const msg = document.getElementById("mensagem-auth");

    if (!usuario || !senha) {
        msg.innerText = "Preencha usuário e senha!";
        msg.style.color = "red";
        return;
    }

    const emailFicticio = `${usuario}@jogo.com`;

    try {
        const { data, error } = await supabase.auth.signUp({
            email: emailFicticio,
            password: senha,
        });

        if (error) throw error;

        const { error: dbError } = await supabase
            .from("Cadastro")
            .insert([{ id: data.user.id, usuario: usuario, fase: 1 }]);

        if (dbError) throw dbError;

        msg.style.color = "green";
        msg.innerText = "Cadastrado com sucesso! Clique em Entrar.";
        alternarModo("login");
    } catch (e) {
        msg.style.color = "red";
        msg.innerText = "Erro ao cadastrar: " + e.message;
    }
}

async function salvarProgresso(novaFase) {
    try {
        const { error } = await supabase
            .from("Cadastro")
            .update({ fase: novaFase })
            .eq("usuario", usuarioAtual);

        if (!error) {
            fase = novaFase;
            atualizarInterfaceProgresso();
        }
    } catch (e) {
        console.error("Erro ao salvar progresso no Supabase", e);
    }
}

async function logout() {
    await supabase.auth.signOut();
    usuarioAtual = null;
    fase = 1;
    document.getElementById("jogo").style.display = "none";
    document.getElementById("jogar").style.display = "block";
    document.getElementById("login").style.display = "none";
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