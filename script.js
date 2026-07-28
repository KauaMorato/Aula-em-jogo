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