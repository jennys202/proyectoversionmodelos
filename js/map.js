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

const metodos=metodosActivos();

// Asignamos una clase dinámica según la cantidad de mapas (layout-1, layout-2, etc.)
    container.className = "layout-" + metodos.length;

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

const svg = document.createElementNS(svgNS, "svg");
        
        // Ajustamos el viewBox para que no recorte los bordes de la provincia
        svg.setAttribute("viewBox", "-30 15 570 335"); 
        svg.setAttribute("preserveAspectRatio", "xMidYMin meet");
        
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.style.margin = "0";

        card.appendChild(title);
        card.appendChild(svg);


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

  // AQUÍ VA LA LÓGICA DE ISLAS
const islasMetodo = app.islasPorMetodo?.[metodo] || []
  const esIsla = islasMetodo.includes(loc.codigo)

  if(app.mostrarIslas && esIsla){
    path.setAttribute("stroke", "#000")
    path.setAttribute("stroke-width", "2")
    path.setAttribute("stroke-dasharray", "3,2")
  }



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

function extraerPuntos(pathString){

  const coords = []

  const regex = /(-?\d+\.?\d*),(-?\d+\.?\d*)/g
  let match

  while((match = regex.exec(pathString)) !== null){
    coords.push({
      x: parseFloat(match[1]),
      y: parseFloat(match[2])
    })
  }

  return coords
}

function obtenerCentroide(pathString){

  const puntos = extraerPuntos(pathString)

  let x = 0, y = 0

  puntos.forEach(p => {
    x += p.x
    y += p.y
  })

  return {
    x: x / puntos.length,
    y: y / puntos.length
  }
}

function construirVecinos(){

  const vecinos = {}
  const centros = {}

  // 1. calcular centroides
  localidades.forEach(loc => {

    const coords = []

    loc.paths.forEach(idx => {
      const path = trayectos[idx]
      const centro = obtenerCentroide(path)
      coords.push(centro)
    })

    const cx = coords.reduce((a,c)=>a+c.x,0) / coords.length
    const cy = coords.reduce((a,c)=>a+c.y,0) / coords.length

    centros[loc.codigo] = {x:cx, y:cy}
  })

  // 2. K vecinos más cercanos
  const K = 20 

  localidades.forEach(a => {

    const distancias = []

    localidades.forEach(b => {

      if(a.codigo === b.codigo) return

      const ca = centros[a.codigo]
      const cb = centros[b.codigo]

      const dist = Math.hypot(ca.x - cb.x, ca.y - cb.y)

      distancias.push({
        codigo: b.codigo,
        dist: dist
      })

    })

    // ordenar por distancia
    distancias.sort((a,b)=>a.dist - b.dist)

    // quedarse con los K más cercanos
    //vecinos[a.codigo] = distancias.slice(0, K).map(d => d.codigo)

    const K = 10
const FACTOR = 1.8

vecinos[a.codigo] = distancias
  .slice(0, K)
  .filter(d => d.dist <= distancias[0].dist * FACTOR)
  .map(d => d.codigo)

    if(a.codigo === "47001"){
  console.log("Vecinos reales:", vecinos[a.codigo])
}

  })

  return vecinos
}



function construirVecinosTopologicos(){

  const vecinos = {}
  const boxesMunicipios = {}

  // SVG oculto reutilizable
  let svgTemp = document.getElementById("svgTemp")

  if(!svgTemp){
    svgTemp = document.createElementNS("http://www.w3.org/2000/svg","svg")
    svgTemp.setAttribute("id","svgTemp")
    svgTemp.style.position = "absolute"
    svgTemp.style.visibility = "hidden"
    document.body.appendChild(svgTemp)
  }

  //PASO 1: calcular bounding boxes reales
  localidades.forEach(loc => {

    let minX = Infinity, minY = Infinity
    let maxX = -Infinity, maxY = -Infinity

    ;(loc.paths || []).forEach(i => {

      const d = trayectos[i-1]

      const path = document.createElementNS("http://www.w3.org/2000/svg","path")
      path.setAttribute("d", d)

      svgTemp.appendChild(path)
      const box = path.getBBox()
      svgTemp.removeChild(path)

      minX = Math.min(minX, box.x)
      minY = Math.min(minY, box.y)
      maxX = Math.max(maxX, box.x + box.width)
      maxY = Math.max(maxY, box.y + box.height)
    })

    boxesMunicipios[loc.codigo] = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }

    vecinos[loc.codigo] = []
  })

  //PASO 2: detectar vecinos por intersección
  localidades.forEach(a => {

    const boxA = boxesMunicipios[a.codigo]

    localidades.forEach(b => {

      if(a.codigo === b.codigo) return

      const boxB = boxesMunicipios[b.codigo]

      const intersecta =
        boxA.x < boxB.x + boxB.width &&
        boxA.x + boxA.width > boxB.x &&
        boxA.y < boxB.y + boxB.height &&
        boxA.y + boxA.height > boxB.y

      if(intersecta){
        vecinos[a.codigo].push(b.codigo)
      }

    })

  })

  return vecinos
}