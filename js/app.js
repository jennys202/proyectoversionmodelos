const app={}

app.k=4

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
app.metricas = {}
app.asignaciones = {}

app.modoColor = "centroide"

app.algoritmo = "kmeans"

app.distancia = "euclidean"

app.eps = 0.5
app.minPts = 3

app.mostrarIslas = false

app.recalcular=function(){

const metodos=metodosActivos()

if (
    app.mapaActivo === null ||
    app.mapaActivo === undefined ||
    !metodos.includes(app.mapaActivo)
) {
    app.mapaActivo = metodos[0];
}

const distanciaActual =
    app.distancia === "pearson"
        ? distanciaCorrelacion
        : distanciaEuclidea;

app.datasets={}
app.clusters={}
app.selecciones = {}
app.labelsPorMetodo = {}
app.islasPorMetodo = {}
app.asignaciones = {}

metodos.forEach(m=>{

app.datasets[m]=construirDataset(m)

let res

if(app.algoritmo === "kmeans"){

res =
kmeans(
app.datasets[m],
app.k,
distanciaActual
)
}

else if(app.algoritmo === "dbscan"){

res =
dbscan(
app.datasets[m],
app.eps,
app.minPts,
distanciaActual
)

}
else{

res =
kmedoids(
app.datasets[m],
app.k,
distanciaActual
)

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
app.asignaciones[m] = res.clusters;

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
     original:"Original",
    mm:"MaxMin",
    z:"ZScore",
    rel:"Relativo"
};


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

app.metricas[m] = {
    ema: ema,
    silhouette: sil,
    ct: ct,
    islas: islas.length,
    algoritmo: app.algoritmo,
    metodo: m,
    k: valorK
}


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
actualizarPanelMetricas();

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

function exportarTodosLosK(){

    const filas = [];
    const metricas = [];

    /* ===================================
       ALGORITMOS
    =================================== */

    const algoritmos = [
        "kmeans",
        "kmedoids",
        "dbscan"
    ];

    /* ===================================
       TRANSFORMACIONES
    =================================== */

    const metodos = [
        "original",
        "mm",
        "z",
        "rel"
    ];

    const nombresMetodo = {
        original: "Original",
        mm: "MaxMin",
        z: "ZScore",
        rel: "Relativo"
    };

    /* ===================================
       MÉTRICAS DE DISTANCIA
    =================================== */

    const metricasDistancia = [
        {
            nombre: "Euclídea",
            funcion: distanciaEuclidea
        },
        {
            nombre: "Pearson",
            funcion: distanciaCorrelacion
        }
    ];

    /* ===================================
       VECINOS TOPOLOGICOS
    =================================== */

    const vecinos =
        construirVecinosTopologicos();

    /* ===================================
       AÑOS DE LA SERIE TEMPORAL
    =================================== */

    const primerCodigo =
        localidades[0].codigo;

    const anios =
        Object.keys(
            poblacionHistorica[primerCodigo].datos
        );

    /* ===================================
       RECORRER ALGORITMOS
    =================================== */

    algoritmos.forEach(algoritmo => {

        /* =================================
           RECORRER TRANSFORMACIONES
        ================================= */

        metodos.forEach(metodo => {

            const dataset =
                construirDataset(metodo);

            /* ===============================
               RECORRER MÉTRICAS
            =============================== */

            metricasDistancia.forEach(metrica => {

                const distancia =
                    metrica.funcion;


                /* ==================================================
                   K-MEANS Y K-MEDOIDS
                   K = 2 ... 10
                ================================================== */

                if(
                    algoritmo === "kmeans" ||
                    algoritmo === "kmedoids"
                ){

                    for(let k=2; k<=10; k++){

                        let resultado;


                        /* ==========================
                           EJECUTAR ALGORITMO
                        ========================== */

                        if(
                            algoritmo === "kmeans"
                        ){

                            resultado =
                                kmeans(
                                    dataset,
                                    k,
                                    distancia
                                );

                        }
                        else{

                            resultado =
                                kmedoids(
                                    dataset,
                                    k,
                                    distancia
                                );

                        }


                        /* ==========================
                           CLASIFICACIÓN
                        ========================== */

                        Object.entries(
                            resultado.clusters
                        ).forEach(
                            ([codigo, cluster]) => {

                            const municipio =
                                localidades.find(
                                    l =>
                                        l.codigo === codigo
                                );


                            /*
                             * Obtener centroide
                             * del cluster asignado
                             */

                            let centroide = null;


                            if(
                                resultado.centroides &&
                                resultado.centroides[cluster]
                            ){

                                centroide =
                                    resultado.centroides[cluster];

                            }


                            /* ==========================
                               REGISTRO
                            ========================== */

                            const fila = {

                                algoritmo:
                                    algoritmo,

                                metrica:
                                    metrica.nombre,

                                metodo:
                                    nombresMetodo[metodo],

                                k:
                                    k,

                                eps:
                                    "",

                                minPts:
                                    "",

                                codigo:
                                    codigo,

                                municipio:
                                    municipio?.nombre || "",

                                cluster:
                                    cluster

                            };


                            /* ==========================
                               CENTROIDE
                            ========================== */

                            anios.forEach(
                                (anio, index) => {

                                fila[
                                    "centroide_" + anio
                                ] =
                                    centroide
                                        ? centroide[index]
                                        : "";

                            });


                            filas.push(fila);

                        });


                        /* ==========================
                           MÉTRICAS
                        ========================== */

                        const ema =
                            calcularEMA(
                                dataset,
                                resultado.clusters,
                                resultado.centroides,
                                distancia
                            );


                        const sil =
                            silhouette(
                                dataset,
                                resultado.clusters,
                                distancia
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


                        /*
                         * Número de clusters
                         */

                        const numeroClusters =
                            new Set(
                                Object.values(
                                    resultado.clusters
                                ).filter(
                                    c => c !== -1
                                )
                            ).size;


                        /* ==========================
                           GUARDAR MÉTRICAS
                        ========================== */

                        metricas.push({

                            algoritmo:
                                algoritmo,

                            metrica:
                                metrica.nombre,

                            metodo:
                                nombresMetodo[metodo],

                            k:
                                k,

                            eps:
                                "",

                            minPts:
                                "",

                            clusters:
                                numeroClusters,

                            ruido:
                                0,

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

                }


                /* ==================================================
                   DBSCAN
                   No utiliza K
                ================================================== */

                if(
                    algoritmo === "dbscan"
                ){

                    const resultado =
                        dbscan(
                            dataset,
                            app.eps,
                            app.minPts,
                            distancia
                        );


                    /* ==========================
                       CLASIFICACIÓN
                    ========================== */

                    Object.entries(
                        resultado.clusters
                    ).forEach(
                        ([codigo, cluster]) => {

                        const municipio =
                            localidades.find(
                                l =>
                                    l.codigo === codigo
                            );


                        /*
                         * DBSCAN no genera
                         * centroides
                         */

                        const fila = {

                            algoritmo:
                                "dbscan",

                            metrica:
                                metrica.nombre,

                            metodo:
                                nombresMetodo[metodo],

                            k:
                                "",

                            eps:
                                app.eps,

                            minPts:
                                app.minPts,

                            codigo:
                                codigo,

                            municipio:
                                municipio?.nombre || "",

                            cluster:
                                cluster

                        };


                        /*
                         * Dejar vacías las columnas
                         * de centroides
                         */

                        anios.forEach(
                            anio => {

                            fila[
                                "centroide_" + anio
                            ] = "";

                        });


                        filas.push(fila);

                    });


                    /* ==========================
                       MÉTRICAS DBSCAN
                    ========================== */

                    const sil =
                        silhouette(
                            dataset,
                            resultado.clusters,
                            distancia
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


                    /* ==========================
                       NÚMERO DE CLUSTERS
                    ========================== */

                    const numeroClusters =
                        new Set(
                            Object.values(
                                resultado.clusters
                            ).filter(
                                c => c !== -1
                            )
                        ).size;


                    /* ==========================
                       MUNICIPIOS RUIDO
                    ========================== */

                    const ruido =
                        Object.values(
                            resultado.clusters
                        ).filter(
                            c => c === -1
                        ).length;


                    /* ==========================
                       GUARDAR MÉTRICAS
                    ========================== */

                    metricas.push({

                        algoritmo:
                            "dbscan",

                        metrica:
                            metrica.nombre,

                        metodo:
                            nombresMetodo[metodo],

                        k:
                            "",

                        eps:
                            app.eps,

                        minPts:
                            app.minPts,

                        clusters:
                            numeroClusters,

                        ruido:
                            ruido,

                        /*
                         * DBSCAN no utiliza
                         * centroides, por tanto
                         * EMA no aplica.
                         */

                        ema:
                            "",

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

    });


    /* ===================================
       CREAR ARCHIVO EXCEL
    =================================== */

    const wb =
        XLSX.utils.book_new();


    /* ===================================
       HOJA CLASIFICACIÓN
    =================================== */

    const wsClasificacion =
        XLSX.utils.json_to_sheet(
            filas
        );


    /* ===================================
       HOJA MÉTRICAS
    =================================== */

    const wsMetricas =
        XLSX.utils.json_to_sheet(
            metricas
        );


    /* ===================================
       AGREGAR HOJAS
    =================================== */

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


    /* ===================================
       DESCARGAR
    =================================== */

    XLSX.writeFile(
        wb,
        "Analisis_Clustering_Valladolid.xlsx"
    );

}

document.getElementById("btnExportar")
    .addEventListener("click", exportarTodosLosK);