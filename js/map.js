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

card.appendChild(title)

const svg=document.createElementNS(svgNS,"svg")
svg.setAttribute("viewBox","0 0 500 400")

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

const factor = Math.pow(rawFactor, 0.5)

/* aplicar aclarado */

color = aclararColor(baseColor,factor)

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

})

svg.appendChild(g)

})

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