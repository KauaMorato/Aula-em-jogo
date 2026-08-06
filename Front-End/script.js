const menuBtn = document.getElementById('menuBtn');
const navMenu = document.getElementById('navMenu');
const API_URL = "http://127.0.0.1:5000/api";

let usuarioAtual = null;
let fase = 1;

function mostrarLogin() {
    document.getElementById("login").style.display = "block";
    document.getElementById("jogar").style.display = "none";
}

async function entrar() {
    const usuario = document.getElementById("usuario").value;
    const senha = document.getElementById("senha").value;
    const msg = document.getElementById("mensagem-auth");

    if (!usuario || !senha) {
        msg.innerText = "Preencha usuário e senha!";
        msg.style.color = "red";
        return;
    }

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario, senha })
        });

        const data = await res.json();

        if (res.ok) {
            usuarioAtual = usuario;
            fase = data.progresso.fase; // Pega a fase salva no banco do Python

            // Esconde o login e exibe a tela do jogo
            document.getElementById("login").style.display = "none";
            document.getElementById("jogar").style.display = "none";
            document.getElementById("jogo").style.display = "block";
            document.getElementById("bemVindo").textContent = "Bem-vindo, " + usuario + "!";
            
            atualizarInterfaceProgresso();
        } else {
            msg.style.color = "red";
            msg.innerText = data.erro || "Usuário ou senha incorretos.";
        }
    } catch (e) {
        msg.style.color = "red";
        msg.innerText = "Erro ao conectar com o servidor Python.";
    }
}

//Movimento do personagem provisório

let posX = 50;
let posY = 50;

document.addEventListener("keydown", function(event){
    if (document.getElementById ("jogo").style.display !=="block") return;

    if (
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight"
    ) {
        event.preventDefault();
    }

    const player = document.getElementById("player");

    if(event.key === "ArrowRight" && posX < 760){
        posX += 10;
    }

    if(event.key === "ArrowLeft" && posX > 0){
        posX -= 10;
    }

    if(event.key === "ArrowUp" && posY > 0){
        posY -= 10;
    }

    if(event.key === "ArrowDown" && posY < 410){
        posY += 10;
    }

    player.style.left = posX + "px";
    player.style.top = posY + "px";
});

async function cadastrar() {
    const usuario = document.getElementById("usuario").value;
    const senha = document.getElementById("senha").value;
    const msg = document.getElementById("mensagem-auth");

    if (!usuario || !senha) {
        msg.innerText = "Preencha usuário e senha!";
        msg.style.color = "red";
        return;
    }

    try {
        const res = await fetch(`${API_URL}/cadastrar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario, senha })
        });

        const data = await res.json();

        if (res.ok) {
            msg.style.color = "green";
            msg.innerText = "Cadastrado com sucesso! Clique em Entrar.";
        } else {
            msg.style.color = "red";
            msg.innerText = data.erro || "Erro ao cadastrar.";
        }
    } catch (e) {
        msg.style.color = "red";
        msg.innerText = "Erro: certifique-se de que o Python está rodando!";
    }
}

// Salva a nova fase no Python (SQLite)
async function salvarProgresso(novaFase) {
    try {
        const res = await fetch(`${API_URL}/progresso`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario: usuarioAtual, fase: novaFase })
        });

        if (res.ok) {
            fase = novaFase;
            atualizarInterfaceProgresso();
        }
    } catch (e) {
        console.error("Erro ao salvar progresso no banco", e);
    }
}

// Chamatória ao clicar no botão (+1)
function avancarFase() {
    const novaFase = fase + 1;
    salvarProgresso(novaFase);
}

// Atualiza o texto da fase e a barra gráfica
function atualizarInterfaceProgresso() {
    document.getElementById("faseAtual").innerText = fase;
    // Com (fase - 1), a Fase 1 resulta em 0% de preenchimento
    const porcentagem = Math.min((fase - 1) * 10, 100); 
    document.getElementById("barraProgresso").style.width = `${porcentagem}%`;
}

// Função para deslogar
function logout() {
    usuarioAtual = null;
    fase = 1;
    document.getElementById("jogo").style.display = "none";
    document.getElementById("jogar").style.display = "block";
}

menuBtn.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});