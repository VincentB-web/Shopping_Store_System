var usr = document.getElementById('username');
var pw = document.getElementById('pw');
var submit = document.getElementById('submit');
var stats = document.getElementById('status');

submit.addEventListener('click', ()=>{
  const username = usr.value;
  const password = pw.value;
  if (password === "Akivuv" && username === "admin") {
    stats.textContent = "logged in!";
    window.location.href = "/dashboard.html";
  } else {
    stats.textContent = "Invalid/empty input.";
  }
});