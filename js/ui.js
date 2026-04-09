function actualizarUI(){

const score=silhouette(app.dataset,app.clusters)

info.innerText=
"K="+app.k+" silhouette="+score.toFixed(3)

dibujarMapa()

}

selectorK.onchange=e=>{

app.k=parseInt(e.target.value)

app.clusters=kmeans(app.dataset,app.k)

actualizarUI()

}


function metodosActivos(){

return [...document.querySelectorAll(".methodCheck:checked")]
.map(cb=>cb.value)

}

document.querySelectorAll(".methodCheck")
.forEach(cb=>{

cb.onchange=()=>{

app.recalcular()

}

})

document
.querySelectorAll('input[name="modoColor"]')
.forEach(r => {

r.onchange = e => {

app.modoColor = e.target.value

dibujarMapas()

}

})

document
.querySelectorAll('input[name="algoritmo"]')
.forEach(r=>{

r.onchange = e =>{

app.algoritmo = e.target.value

app.recalcular()

}

})

function crearSelectorColores(){

const panel = document.getElementById("colorPanel")

panel.innerHTML = ""

for(let i=0;i<app.k;i++){

const label = document.createElement("label")
label.textContent = "C"+i+": "

const input = document.createElement("input")

input.type = "color"
input.value = app.colors[i] || "#000000"

input.oninput = e =>{

app.colors[i] = e.target.value

dibujarMapas()

}

label.appendChild(input)
panel.appendChild(label)

}

}

document.getElementById("eps").onchange = e=>{
app.eps = parseFloat(e.target.value)
app.recalcular()
}

document.getElementById("minPts").onchange = e=>{
app.minPts = parseInt(e.target.value)
app.recalcular()
}

//mostrar parametros de acuerdo al modelo
const radios = document.querySelectorAll('input[name="algoritmo"]');
const paramsK = document.getElementById('params-k');
const paramsDBSCAN = document.getElementById('params-dbscan');

function actualizarParametros() {
  const seleccionado = document.querySelector('input[name="algoritmo"]:checked').value;

  if (seleccionado === 'dbscan') {
    paramsK.style.display = 'none';
    paramsDBSCAN.style.display = 'block';
  } else {
    paramsK.style.display = 'block';
    paramsDBSCAN.style.display = 'none';
  }
}

radios.forEach(radio => {
  radio.addEventListener('change', actualizarParametros);
});

actualizarParametros();


// Variable global accesible desde otros archivos
window.intensidad = 0.75;

document.addEventListener("DOMContentLoaded", () => {

    const slider = document.getElementById("sliderIntensidad");
    const labelValor = document.getElementById("valorIntensidad");

    if (!slider) {
        console.error("❌ Slider no encontrado");
        return;
    }

    slider.addEventListener("input", (e) => {
        window.intensidad = parseFloat(e.target.value);
        console.log("INTENSIDAD:", window.intensidad); // 👈 DEBUG
        labelValor.textContent = window.intensidad.toFixed(2);
       app.recalcular();
       //dibujarMapas
    });

});