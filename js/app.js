const app={}

app.k=3

app.colors=[
"#1f77b4",
"#ff7f0e",
"#2ca02c",
"#d62728",
"#9467bd"
]

app.selecciones = {}
app.centroides={}

app.modoColor = "centroide"

app.algoritmo = "kmeans"

app.eps = 0.5
app.minPts = 3

app.mostrarIslas = false

app.recalcular=function(){

const metodos=metodosActivos()

app.datasets={}
app.clusters={}
app.selecciones = {}
app.labelsPorMetodo = {}
app.islasPorMetodo = {}

metodos.forEach(m=>{

app.datasets[m]=construirDataset(m)

let res

if(app.algoritmo === "kmeans"){
if(m==="corr")
res=kmeans(app.datasets[m],app.k,distanciaCorrelacion)

if(m==="z")
res=kmeans(app.datasets[m],app.k,distanciaEuclidea)

if(m==="rel")
res=kmeans(app.datasets[m],app.k,distanciaEuclidea)

if(m==="mm")
res=kmeans(app.datasets[m],app.k,distanciaEuclidea)
}
else if(app.algoritmo === "dbscan"){

if(m==="corr")
res = dbscan(app.datasets[m],app.eps,app.minPts,distanciaCorrelacion)

else
res = dbscan(app.datasets[m],app.eps,app.minPts,distanciaEuclidea)

}
else{

if(m==="corr")
res = kmedoids(app.datasets[m],app.k,distanciaCorrelacion)

else
res = kmedoids(app.datasets[m],app.k,distanciaEuclidea)

}

const toggle = document.getElementById("toggleIslas")

if(app.algoritmo === "dbscan"){
  toggle.checked = false
  toggle.disabled = true
  app.mostrarIslas = false
}else{
  toggle.disabled = false
}

app.clusters[m]=res.clusters
app.centroides[m]=res.centroides
app.labelsPorMetodo[m] = res.clusters

if(m === metodos[0]){
  app.labelsMap = res.clusters
}

})

// PRIMERO calcular vecinos + islas
if(app.mostrarIslas && metodos){
    app.vecinos = construirVecinosTopologicos()
    metodos.forEach(m => {
    app.islasPorMetodo[m] = detectarIslas(
        app.labelsPorMetodo[m],
        app.vecinos
    )
    })
    console.log("Islas por método:", app.islasPorMetodo)
}else{
    app.vecinos  = []
    app.islasPorMetodo = []
}
//  DESPUÉS dibujar
dibujarMapas()

crearSelectorColores()

actualizarChartsSegunAlgoritmo();

if(Object.keys(app.selecciones).length > 0){
  actualizarGrafico()
}

}

document.getElementById("selectorK").onchange=e=>{

app.k=parseInt(e.target.value)
app.recalcular()

}

document.getElementById("toggleIslas").onchange = (e) => {

  app.mostrarIslas = e.target.checked
  app.recalcular() 

}

app.recalcular()
