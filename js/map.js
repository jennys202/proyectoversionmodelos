const svgNS="http://www.w3.org/2000/svg"

/* escala de colores para distancia al centroide */

const escalaCentroide=[
"#3C0000",
"#670010",
"#960018",
"#CB4C46",
"#FF8478"
]

function dibujarMapas(){
   console.log("DIBUJANDO MAPAS") 

const container=document.getElementById("mapsContainer")

container.innerHTML=""

const metodos=metodosActivos()

metodos.forEach(metodo=>{

const card=document.createElement("div")
card.className="mapCard"

const title=document.createElement("div")
title.className="mapTitle"

const nombres={
corr:"Correlación",
z:"Z-Score",
rel:"Crecimiento relativo",
mm:"Máximos y mínimos"
}

title.textContent=nombres[metodo]

title.style.marginTop = "5px"

const svg=document.createElementNS(svgNS,"svg")
svg.setAttribute("viewBox","0 0 480 290")
svg.setAttribute("width", "80%")
svg.setAttribute("height", "550")
svg.setAttribute("preserveAspectRatio", "xMidYMid meet")
svg.style.margin = "0 auto"
svg.style.marginTop = "-80px"

card.appendChild(title)
card.appendChild(svg)


container.appendChild(card)

const clusters=app.clusters[metodo]
const centroides=app.centroides[metodo]
const dataset=app.datasets[metodo]

const tooltip=document.getElementById("tooltip")

localidades.forEach(loc=>{

const g=document.createElementNS(svgNS,"g")

const cluster=clusters[loc.codigo] ?? 0

let color

if(app.algoritmo === "dbscan"){
    app.modoColor="cluster";
} 
else{
    app.modoColor="centroide"
}
console.log("ANTES DE COLOR "+app.modoColor)

if(cluster === -1){

color = "#cccccc"  // gris para ruido

} 
/* =====================
COLOR POR CLUSTER
===================== */

else if(app.modoColor==="cluster"){

color = app.colors[cluster % app.colors.length]

}

/* =====================
COLOR POR CENTROIDE
===================== */

else{
    console.log("centroides ANTES DE COLOR")
    color = app.colors[cluster % app.colors.length]

const baseColor = app.colors[cluster]

const centroide = centroides[cluster]

const item = dataset.find(d=>d.codigo===loc.codigo)
if(!item) return

const vector = item.vector

const dist = distanciaEuclidea(vector,centroide)

/* calcular distancia máxima del cluster */

let maxDist = 0

dataset
.filter(d=>clusters[d.codigo]===cluster)
.forEach(m=>{

const d = distanciaEuclidea(m.vector,centroide)

if(d > maxDist) maxDist = d

})

const rawFactor = maxDist < 1e-6 ? 0 : dist / maxDist
// limitar para evitar blanco
const factorBase = Math.min(rawFactor, 0.7)

// slider (0 a 1)
const intensidad = window.intensidad ?? 0.75

// invertir efecto: cuando intensidad=1 → factor=0
const factor = factorBase * (1 - intensidad)

color = aclararColor(baseColor, factor)

}


/* =====================
DIBUJAR MUNICIPIO
===================== */

;(loc.paths||[]).forEach(i=>{

const d=trayectos[i-1]

const path=document.createElementNS(svgNS,"path")

path.setAttribute("d",d)
path.setAttribute("fill",color)
path.setAttribute("stroke","#666")
path.setAttribute("stroke-width","0.5")

g.appendChild(path)

})

/* =====================
TOOLTIP
===================== */

g.addEventListener("mouseenter",(e)=>{

const datos=poblacionHistorica[loc.codigo]

const poblacionActual=datos.datos["2024"] || "N/A"

tooltip.textContent=
`${datos.nombre} (${poblacionActual} hab.)`

tooltip.style.visibility="visible"

})

g.addEventListener("mousemove",(e)=>{

tooltip.style.top=(e.pageY+12)+"px"
tooltip.style.left=(e.pageX+12)+"px"

})

g.addEventListener("mouseleave",()=>{

tooltip.style.visibility="hidden"

})

/* =====================
CLICK → GRÁFICO
===================== */

g.addEventListener("click",()=>{

app.selecciones[metodo]=loc.codigo

svg.querySelectorAll(".selected")
.forEach(el=>{

el.classList.remove("selected")

el.querySelectorAll("path")
.forEach(p=>{

p.setAttribute("stroke","#666")
p.setAttribute("stroke-width","0.5")

})

})

g.classList.add("selected")

g.querySelectorAll("path").forEach(p=>{

p.setAttribute("stroke","#000")
p.setAttribute("stroke-width","2")

})

actualizarGrafico()
actualizarChartsSegunAlgoritmo()

})

svg.appendChild(g)

})

/* =====================
DIBUJAR CENTROIDES
===================== */
/*console.log("CENTROIDES:", app.centroides[metodo])
Object.keys(app.centroides[metodo]).forEach(clusterId => {
    clusterId = Number(clusterId) 
    const item = obtenerMunicipioMasCercano(clusterId, metodo)
    console.log("ITEM:", item)
    if (!item) return

    const loc = localidades.find(l => l.codigo === item.codigo)
    if (!loc) return

    const pathIndex = loc.paths?.[0]
    if (!pathIndex) return

    const path = svg.querySelector(`path[d="${trayectos[pathIndex-1]}"]`)
    if (!path) return

    const bbox = path.getBBox()

    const cx = bbox.x + bbox.width / 2
    const cy = bbox.y + bbox.height / 2

    console.log("Centro:", cx, cy)

    const circle = document.createElementNS(svgNS, "circle")

    circle.setAttribute("cx", cx)
    circle.setAttribute("cy", cy)
    circle.setAttribute("r", 3)

    circle.setAttribute("fill", app.colors[clusterId])
    circle.setAttribute("stroke", "#000")
    circle.setAttribute("stroke-width", "1")


    svg.appendChild(circle)

})*/

})

}

function aclararColor(hex,factor){

const r = parseInt(hex.substr(1,2),16)
const g = parseInt(hex.substr(3,2),16)
const b = parseInt(hex.substr(5,2),16)

/* interpolación hacia blanco */

const nr = Math.round(r + (255 - r) * factor)
const ng = Math.round(g + (255 - g) * factor)
const nb = Math.round(b + (255 - b) * factor)

return `rgb(${nr},${ng},${nb})`

}

function obtenerMunicipioMasCercano(clusterId, metodo) {

    clusterId = Number(clusterId)   // 🔥 MUY IMPORTANTE

    const centroide = app.centroides[metodo][clusterId]

    let mejor = null
    let mejorDist = Infinity

    const dataset = app.datasets[metodo]
    const clusters = app.clusters[metodo]

    dataset
        .filter(d => clusters[d.codigo] === clusterId)
        .forEach(d => {

            const dist = distanciaEuclidea(d.vector, centroide)

            if (dist < mejorDist) {
                mejorDist = dist
                mejor = d
            }

        })

    return mejor
}