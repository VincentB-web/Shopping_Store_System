var dashboard = document.getElementById('dashboard');
var pos = document.getElementById('pos');
var dboard_btn = document.getElementById('dboard_btn');
var pos_btn = document.getElementById('pos_btn');

var active = true;

if(active){
  dashboard.style.display = "flex";
  dboard_btn.style.color = "dark";
} else {
}

dboard_btn.addEventListener('click', ()=>{
    dashboard.style.display = "flex";
    pos.style.display = "none";
<<<<<<< HEAD
});
pos_btn.addEventListener('click', ()=>{
=======
    active = false;
  } else {
    dboard_btn.style.backgroundColor = "#CDCDCD";
    active = true;
  }
});
pos_btn.addEventListener('click', ()=>{
  if(active){
>>>>>>> 022266390e01b0b82d5ed19a0cf1d08c9e2f2b0e
    pos.style.display = "flex";
    dashboard.style.display = "none";
});