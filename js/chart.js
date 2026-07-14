let chart=null


function actualizarGrafico(){

const labels = Object.keys(
poblacionHistorica[
Object.values(app.selecciones)[0]
].datos
)

const datasets = []

Object.entries(app.selecciones).forEach(([metodo,codigo])=>{

const datos = poblacionHistorica[codigo]

// Cluster al que pertenece el municipio
const cluster = app.clusters[metodo][codigo];

// Color del cluster
const color = app.colors[cluster] || "#1976D2";

datasets.push({
    label: `${datos.nombre} (C${cluster})`,
    data: Object.values(datos.datos),
    fill:false,
    borderWidth:1,
    borderColor: color,
    backgroundColor: color,
    pointBackgroundColor: color,
    pointBorderColor: color,
    pointRadius:4,
    pointHoverRadius:6,
    tension:0.25
})

})

if(chart) chart.destroy()

chart = new Chart(

document.getElementById("chart"),

{
type:"line",

data:{
labels,
datasets
},

options:{
  responsive:true,
  maintainAspectRatio:false,
     layout:{
        padding:{
            top:15
        }
    },
  plugins:{
    legend:{
    position:"top",
    align:"center",
}
  }
}

})

}

function actualizarGraficoClusters(){

const metodo = app.mapaActivo;
const clusters = app.clusters[metodo]
const dataset = app.datasets[metodo]

const seriesPorCluster = {}

// agrupar datos por cluster
dataset.forEach(d => {

  const cluster = clusters[d.codigo]

  if(cluster === -1) return

  if(!seriesPorCluster[cluster]){
    seriesPorCluster[cluster] = []
  }

  seriesPorCluster[cluster].push(d.vector)

})

const labels = Object.keys(
  poblacionHistorica[dataset[0].codigo].datos
)

const datasetsChart = []

Object.entries(seriesPorCluster).forEach(([cluster, series]) => {

  const promedio = []

  const length = series[0].length

  for(let i=0;i<length;i++){

    let suma = 0

    series.forEach(s => suma += s[i])

    promedio.push(suma / series.length)

  }

  /*datasetsChart.push({
    label: "Cluster " + cluster,
    data: promedio,
    borderWidth: 2,
    borderColor: app.colors[cluster],
    fill: false
    
  })*/
//dibujar en el chart centroides

  const centroide = app.centroides[metodo][cluster]

if(centroide){

  datasetsChart.push({
    label: "C" + cluster,
    data: centroide,
    borderColor: app.colors[cluster],
    backgroundColor: app.colors[cluster],
    borderWidth: 2,
    fill: false,
  })

}

})


if(window.chartClusters && typeof window.chartClusters.destroy === "function"){
  window.chartClusters.destroy()
}
// Ajustar la altura del gráfico según el número de centroides
const k = datasetsChart.length;

const contenedor = document.getElementById("clusterChartContainer");


window.chartClusters = new Chart(
  document.getElementById("chartClusters"),
  {
    type: "line",
    data: {
      labels,
      datasets: datasetsChart
    },
    options:{
    responsive:true,
    maintainAspectRatio:false,
     layout:{
        padding:{
            top:15
        }
    },
    plugins:{
        legend:{
        position: "top",
        labels:{
                boxWidth:14,
                boxHeight:10,
                padding:8,
                font:{
                    size:11
                }
            }
        }
    }
    }
  }
)

}

function actualizarGraficoDBSCAN(){

  const metodo = app.mapaActivo;
  const clusters = app.clusters[metodo]

  const conteo = {}

  Object.values(clusters).forEach(c => {

    if(!conteo[c]) conteo[c] = 0
    conteo[c]++

  })

  const labels = []
  const data = []

  Object.entries(conteo).forEach(([cluster, cantidad]) => {

    if(cluster == -1){
      labels.push("Ruido")
    }else{
      labels.push("Cluster " + cluster)
    }

    data.push(cantidad)

  })

  if(window.chartClusters && typeof window.chartClusters.destroy === "function"){
    window.chartClusters.destroy()
  }

  window.chartClusters = new Chart(
    document.getElementById("chartClusters"),
    {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Número de municipios",
          data,
          backgroundColor: labels.map((l,i)=>
            l === "Ruido" ? "#999999" : app.colors[i]
          )
        }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        plugins:{
            title:{
            display: true,
            text: "Distribución de municipios"
            },
            legend:{
            position: "top"
            }
        }
        }
    }
  )

}

function actualizarChartsSegunAlgoritmo(){

  if(app.algoritmo === "dbscan"){

    actualizarGraficoDBSCAN()

  }else{

    actualizarGraficoClusters()

  }

}