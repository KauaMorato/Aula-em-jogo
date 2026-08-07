// 1. Importações do Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. Chaves do seu projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCCeX7RZ84J12IFKN6N9p9HsVuT_VQ-jco",
  authDomain: "aula-em-jogo-5b614.firebaseapp.com",
  projectId: "aula-em-jogo-5b614",
  storageBucket: "aula-em-jogo-5b614.firebasestorage.app",
  messagingSenderId: "906330655287",
  appId: "1:906330655287:web:04edecec117ce237450db2"
};

// 3. Inicializando Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const menuBtn = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");

let usuarioAtual = null;
let fase = 1;
let authModo = "login";

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
        submitButton.onclick = isLogin ? entrar : cadastrar;
    }
}

function mostrarLogin() {
    document.getElementById("login").style.display = "flex";
    document.getElementById("jogar").style.display = "none";
    document.getElementById("jogo").style.display = "none";
    ajustarMensagem("");
    alternarModo("login");
    document.getElementById("usuario").focus();
}

// LOGIN NO FIREBASE
async function entrar() {
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value;

    if (!usuario || !senha) {
        ajustarMensagem("Preencha usuário e senha!");
        return;
    }

    const emailFicticio = `${usuario}@jogo.com`;

    try {
        // Autentica o usuário no Firebase Auth
        const credencial = await signInWithEmailAndPassword(auth, emailFicticio, senha);
        const user = credencial.user;

        usuarioAtual = user.uid;

        // Busca o progresso da Fase no Firestore
        const docRef = doc(db, "Cadastro", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            fase = docSnap.data().Fase || 1;
        } else {
            fase = 1;
        }

        document.getElementById("login").style.display = "none";
        document.getElementById("jogar").style.display = "none";
        document.getElementById("jogo").style.display = "block";
        document.getElementById("bemVindo").textContent = "Bem-vindo, " + usuario + "!";

        atualizarInterfaceProgresso();
        ajustarMensagem("Login realizado com sucesso!", "green");
    } catch (erro) {
        ajustarMensagem("Usuário ou senha incorretos.");
    }
}

// CADASTRO NO FIREBASE
async function cadastrar() {
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value;

    if (!usuario || !senha) {
        ajustarMensagem("Preencha usuário e senha!");
        return;
    }

    const emailFicticio = `${usuario}@jogo.com`;

    try {
        // Cria usuário no Firebase Auth
        const credencial = await createUserWithEmailAndPassword(auth, emailFicticio, senha);
        const user = credencial.user;

        // Cria o registro da fase no Firestore
        await setDoc(doc(db, "Cadastro", user.uid), {
            Nome: usuario,
            Fase: 1
        });

        ajustarMensagem("Cadastrado com sucesso! Clique em Entrar.", "green");
        alternarModo("login");
    } catch (erro) {
        if (erro.code === 'auth/weak-password') {
            ajustarMensagem("A senha deve ter no mínimo 6 caracteres!");
        } else if (erro.code === 'auth/email-already-in-use') {
            ajustarMensagem("Este usuário já está cadastrado!");
        } else {
            ajustarMensagem("Erro ao cadastrar.");
        }
    }
}

// SALVAR PROGRESSO NO FIRESTORE
async function salvarProgresso(novaFase) {
    if (!usuarioAtual) return;

    try {
        await setDoc(doc(db, "Cadastro", usuarioAtual), {
            Fase: novaFase
        }, { merge: true });

        fase = novaFase;
        atualizarInterfaceProgresso();
    } catch (erro) {
        console.error("Erro ao salvar progresso", erro);
    }
}

async function logout() {
    await signOut(auth);
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

// MOVIMENTAÇÃO DO PERSONAGEM
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

    if (event.key === "ArrowRight" && posX < 760) posX += 10;
    if (event.key === "ArrowLeft" && posX > 0) posX -= 10;
    if (event.key === "ArrowUp" && posY > 0) posY -= 10;
    if (event.key === "ArrowDown" && posY < 410) posY += 10;

    player.style.left = posX + "px";
    player.style.top = posY + "px";
});

if (menuBtn && navMenu) {
    menuBtn.addEventListener("click", () => {
        navMenu.classList.toggle("active");
    });

    document.querySelectorAll(".nav-menu a").forEach((link) => {
        link.addEventListener("click", () => navMenu.classList.remove("active"));
    });
}

// EXPORTAÇÃO GLOBAL
window.mostrarLogin = mostrarLogin;
window.entrar = entrar;
window.cadastrar = cadastrar;
window.avançarFase = avancarFase;
window.logout = logout;
window.alternarModo = alternarModo;