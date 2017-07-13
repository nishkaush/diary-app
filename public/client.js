const home = document.getElementById("home-btn");
const create = document.getElementById("create-btn");
const logout = document.getElementById("logout-btn");
const backToHome = document.getElementById("back-to-home");

var updateBtn = document.querySelectorAll(".updatePostBtn");
var deleteBtn = document.querySelectorAll(".deletePostBtn");


var updateBtnArray = [].slice.call(updateBtn);
var deleteBtnArray = [].slice.call(deleteBtn);

if (updateBtnArray) {
    updateBtnArray.forEach(function(e) {
        e.addEventListener("click", function() {
            window.location = `/update/${this.value}`;
        });
    });
}

if (deleteBtnArray) {
    deleteBtnArray.forEach(function(e) {
        e.addEventListener("click", function() {
            window.location = `/delete/${this.value}`;
        });
    });
}


if (home) {
    home.addEventListener("click", function() {
        window.location = "/home";
    });
}

if (create) {
    create.addEventListener("click", function() {
        window.location = "/create";
    });
}

if (logout) {
    logout.addEventListener("click", function() {
        window.location = "/logout";
    });
}


if (backToHome) {
    backToHome.addEventListener("click", function() {
        window.location = "/";
    });
}
