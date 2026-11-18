var dashboard = document.getElementById('dashboard');
var pos = document.getElementById('pos');
var dboard_btn = document.getElementById('dboard_btn');
var pos_btn = document.getElementById('pos_btn');

let active = true;

if(active){
    dashboard.style.display = "flex";
}

dboard_btn.addEventListener('click', ()=>{
    dashboard.style.display = "flex";
    pos.style.display = "none";
});
pos_btn.addEventListener('click', ()=>{
    pos.style.display = "flex";
    dashboard.style.display = "none";
});