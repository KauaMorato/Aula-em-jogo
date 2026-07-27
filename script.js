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

    alert("Bem-Vindo, " + usuario + "!");

    localStorage.setItem("usuario", usuario);
}