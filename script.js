var dashboard = document.getElementById('dashboard');
var pos = document.getElementById('pos');
var dboard_btn = document.getElementById('dboard_btn');
var pos_btn = document.getElementById('pos_btn');

let active = true;

dboard_btn.addEventListener('click', ()=>{
  if(active){
    dashboard.style.display = "block";
    active = false;
  } else {
    dashboard.style.display = "none";
  }
});