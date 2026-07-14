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

 const pearson =
document.querySelector(
'input[value="pearson"]'
);

document.getElementById("eps").onchange = e=>{
app.eps = parseFloat(e.target.value)
app.recalcular()
}

document.getElementById("minPts").onchange = e=>{
app.minPts = parseInt(e.target.value)
app.recalcular()
}

document
.querySelectorAll('input[name="distancia"]')
.forEach(r=>{

    r.onchange = e=>{

        app.distancia = e.target.value

        app.recalcular()

    }

})

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

 const euclidea = document.querySelector(
    'input[value="euclidean"]'
);

const pearson = document.querySelector(
    'input[value="pearson"]'
);

if (seleccionado === "kmeans") {
    // Si Pearson estaba seleccionado, cambiar primero a Euclídea
    if (pearson.checked) {
        euclidea.checked = true;
        app.distancia = "euclidean";
        app.recalcular();
    }
    pearson.disabled = true;
} else {
    pearson.disabled = false;
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

function actualizarPanelMetricas(){

    const metodos = metodosActivos();

    if(metodos.length === 0)
        return;

    const metodo = app.metodoActivo || metodos[0];

    const m = app.metricas[metodo];

    if(!m)
        return;

    document.getElementById("ema").textContent =
        m.ema.toFixed(4);

    document.getElementById("silhouette").textContent =
        m.silhouette.toFixed(4);

    document.getElementById("ct").textContent =
        m.ct.toFixed(2) + " %";

    document.getElementById("islas").textContent =
        m.islas;

    actualizarResumenClusters(metodo);

}

function actualizarResumenClusters(metodo){
    const contenedor = document.getElementById("clusterSummary");
    if(!contenedor)
        return;
    contenedor.innerHTML = "";
    const asignaciones = app.asignaciones[metodo];
    if(!asignaciones)
        return;
    const etiquetas = Object.values(asignaciones);

    const total = etiquetas.length;
    const conteo = new Array(app.k).fill(0);
    etiquetas.forEach(c => {
        if(c >= 0)
            conteo[c]++;
    });
    for(let i=0;i<app.k;i++){
        const porcentaje = total===0
            ? 0
            : conteo[i]*100/total;
        const fila = document.createElement("div");
        fila.className="cluster-row";
        fila.innerHTML = `
            <div class="cluster-left">
                <div class="cluster-color"
                     style="background:${app.colors[i]}">
                </div>

                <span>C${i}</span>
            </div>

            <div class="cluster-right">

                ${conteo[i]} (${porcentaje.toFixed(1)}%)

            </div>
        `;
        contenedor.appendChild(fila);
    }

}