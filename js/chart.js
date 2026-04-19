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

datasets.push({

label: datos.nombre,

data: Object.values(datos.datos),

fill:false,
borderWidth:2

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
  plugins:{
    title:{
      display: true,
      text: "Municipio "
    },
    legend:{
      position: "top"
    }
  }
}

})

}

function actualizarGraficoClusters(){

const metodo = Object.keys(app.clusters)[0]  // puedes mejorar luego
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
    label: "Centroide " + cluster,
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
    plugins:{
        title:{
        display: true,
        text: "Patrones de referencia"
        },
        legend:{
        position: "top"
        }
    }
    }
  }
)

}

function actualizarGraficoDBSCAN(){

  const metodo = Object.keys(app.clusters)[0]
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