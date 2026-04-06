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

app.eps = 0.15
app.minPts = 3

app.recalcular=function(){

const metodos=metodosActivos()

app.datasets={}
app.clusters={}

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

app.clusters[m]=res.clusters
app.centroides[m]=res.centroides

})

dibujarMapas()

crearSelectorColores()

}

document.getElementById("selectorK").onchange=e=>{

app.k=parseInt(e.target.value)
app.recalcular()

}

app.recalcular()