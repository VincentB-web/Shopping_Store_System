var dashboard = document.getElementById('dashboard');
var pos = document.getElementById('pos');
var dboard_btn = document.getElementById('dboard_btn');
var pos_btn = document.getElementById('pos_btn');

let active = true;

if(active){
    dashboard.style.display = "flex";
}

dboard_btn.addEventListener('click', ()=>{
  if(active){
    dashboard.style.display = "flex";
    dboard_btn.style.backgroundColor = "#CDCDCD";
    pos.style.display = "none";
    active = false;
  } else {
    dboard_btn.style.backgroundColor = "#FFFFFF";
    active = true;
  }
});
pos_btn.addEventListener('click', ()=>{
  if(!active){
    pos.style.display = "flex";
    pos_btn.style.backgroundColor = "#CDCDCD";
    dashboard.style.display = "none";
    active = false;
  } else {
    pos_btn.style.backgroundColor = "#FFFFFF";
    active = true;
  }
});