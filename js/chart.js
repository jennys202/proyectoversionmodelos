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

label: metodo + " - " + datos.nombre,

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
maintainAspectRatio: false,
plugins:{
legend:{
position:"top"
}
}
}

})

}