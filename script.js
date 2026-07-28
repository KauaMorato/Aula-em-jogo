const menuBtn = document.getElementById('menuBtn');
const navMenu = document.getElementById('navMenu');

function mostrarLogin() {
    document.getElementById("login").style.display = "block";
}

function entrar() {

    let usuario = document.getElementById("usuario").value;

    if (usuario === "") {
        alert("Digite um nome!");
        return;
    }

    localStorage.setItem("usuario", usuario);

    document.getElementById("login").style.display = "none";
    document.getElementById("jogo").style.display = "block";

    document.getElementById("bemVindo").textContent = "Bem-vindo, " + usuario + "!";
}

//Movimento do personagem provisório

let posX = 50;
let posY = 50;

document.addEventListener("keydown", function(event){

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