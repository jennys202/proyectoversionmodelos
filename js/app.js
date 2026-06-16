const app={}

app.k=3

app.colors=[
"#1f77b4",
"#ff7f0e",
"#2ca02c",
"#d62728",
"#9467bd",
"#0099C6",
"#DD4477", 
"#66AA00", 
"#B82E2E", 
"#316395" 
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

const resumen = resumenClusters(
    res.clusters
);

console.log(
    "Municipios por cluster"
);

Object.entries(
    resumen.clusters
).forEach(([cluster,total])=>{

    console.log(
        `Cluster ${cluster}: ${total} municipios`
    );

});

if(resumen.ruido > 0){

    console.log(
        `Ruido: ${resumen.ruido} municipios`
    );

}



const nombres = {
    mm:"MaxMin",
    z:"ZScore",
    rel:"Relativo",
    corr:"Correlacion"
};

let distanciaActual;

if(m === "corr")
    distanciaActual = distanciaCorrelacion;
else
    distanciaActual = distanciaEuclidea;

let ema = null;

if(
    app.algoritmo !== "dbscan"
){
    ema = calcularEMA(
        app.datasets[m],
        res.clusters,
        res.centroides,
        distanciaActual
    );
}

const sil = silhouette(
    app.datasets[m],
    res.clusters,
    distanciaActual
);

const vecinos = construirVecinosTopologicos();
const ct = calcularCT(
    res.clusters,
    vecinos
);

const islas = detectarIslas(
    res.clusters,
    vecinos
);

const numClusters =
    new Set(
        Object.values(res.clusters)
            .filter(c => c !== -1)
    ).size;

 const valorK =
    app.algoritmo === "dbscan"
        ? numClusters
        : app.k;   

console.log(
[
    app.algoritmo,
    nombres[m],
    valorK,
    ema === null ? "-" : ema.toFixed(4),
    sil.toFixed(4),
    ct.toFixed(2),
    islas.length
].join(";")
);


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

document.getElementById("btnExportar").onclick=exportarTodosLosK;

app.recalcular()

function exportarTodosLosK(){

    const filas = [];
    const metricas = [];

    const algoritmos = [
        "kmeans",
        "kmedoids"
    ];

    const metodos = [
        "mm",
        "z",
        "rel",
        "corr"
    ];

    const nombresMetodo = {
        mm: "MaxMin",
        z: "ZScore",
        rel: "Relativo",
        corr: "Correlacion"
    };

    const vecinos =
        construirVecinosTopologicos();

    algoritmos.forEach(algoritmo => {

        metodos.forEach(m => {

            const dataset =
                construirDataset(m);

            const distanciaActual =
                m === "corr"
                    ? distanciaCorrelacion
                    : distanciaEuclidea;

            for(let k=2; k<=10; k++){

                let resultado;

                if(algoritmo === "kmeans"){

                    resultado =
                        m === "corr"
                        ? kmeans(
                            dataset,
                            k,
                            distanciaCorrelacion
                        )
                        : kmeans(
                            dataset,
                            k,
                            distanciaEuclidea
                        );

                }
                else{

                    resultado =
                        m === "corr"
                        ? kmedoids(
                            dataset,
                            k,
                            distanciaCorrelacion
                        )
                        : kmedoids(
                            dataset,
                            k,
                            distanciaEuclidea
                        );

                }

                /* ===================================
                   CLASIFICACIÓN
                =================================== */

                Object.entries(
                    resultado.clusters
                ).forEach(([codigo, cluster]) => {

                    const municipio =
                        localidades.find(
                            l => l.codigo === codigo
                        );

                    filas.push({

                        algoritmo:
                            algoritmo,

                        metodo:
                            nombresMetodo[m],

                        k:
                            k,

                        codigo:
                            codigo,

                        municipio:
                            municipio?.nombre || "",

                        cluster:
                            cluster

                    });

                });

                /* ===================================
                   MÉTRICAS
                =================================== */

                const ema =
                    calcularEMA(
                        dataset,
                        resultado.clusters,
                        resultado.centroides,
                        distanciaActual
                    );

                const sil =
                    silhouette(
                        dataset,
                        resultado.clusters,
                        distanciaActual
                    );

                const ct =
                    calcularCT(
                        resultado.clusters,
                        vecinos
                    );

                const islas =
                    detectarIslas(
                        resultado.clusters,
                        vecinos
                    );

                metricas.push({

                    algoritmo:
                        algoritmo,

                    metodo:
                        nombresMetodo[m],

                    k:
                        k,

                    ema:
                        Number(
                            ema.toFixed(4)
                        ),

                    silhouette:
                        Number(
                            sil.toFixed(4)
                        ),

                    ct:
                        Number(
                            ct.toFixed(2)
                        ),

                    islas:
                        islas.length

                });

            }

        });

    });

    /* ===================================
       CREAR EXCEL
    =================================== */

    const wb =
        XLSX.utils.book_new();

    const wsClasificacion =
        XLSX.utils.json_to_sheet(
            filas
        );

    const wsMetricas =
        XLSX.utils.json_to_sheet(
            metricas
        );

    XLSX.utils.book_append_sheet(
        wb,
        wsClasificacion,
        "Clasificacion"
    );

    XLSX.utils.book_append_sheet(
        wb,
        wsMetricas,
        "Metricas"
    );

    XLSX.writeFile(
        wb,
        "Analisis_Clustering_Valladolid.xlsx"
    );

}