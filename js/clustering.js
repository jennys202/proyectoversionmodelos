function correlacion(a,b){

const n=a.length

const ma=a.reduce((s,v)=>s+v,0)/n
const mb=b.reduce((s,v)=>s+v,0)/n

let num=0,da=0,db=0

for(let i=0;i<n;i++){

const xa=a[i]-ma
const xb=b[i]-mb

num+=xa*xb
da+=xa*xa
db+=xb*xb

}

return num/Math.sqrt(da*db)

}

function distanciaCorrelacion(a,b){
return 1-correlacion(a,b)
}

function normalizarZ(s){

const m=s.reduce((a,b)=>a+b,0)/s.length

const sd=Math.sqrt(
s.reduce((sum,v)=>sum+(v-m)**2,0)/s.length
)

return s.map(v=>(v-m)/sd)

}

function relativo(s){

const base=s[0]

return s.map(v=>v/base)

}

function maxmin(s){

const max=Math.max(...s)
const min=Math.min(...s)

return s.map(v=>(v-min)/(max-min))

}

function construirDataset(tipo){

return localidades.map(loc=>{

let serie=Object.values(
poblacionHistorica[loc.codigo].datos
).map(Number)

if(tipo==="z") serie=normalizarZ(serie)
if(tipo==="rel") serie=relativo(serie)
if(tipo==="mm") serie=maxmin(serie)

return{
codigo:loc.codigo,
vector:serie
}

})

}

function kmeans(dataset,k,distancia){

let centroides = dataset.slice(0,k).map(d=>d.vector)

let clusters={}

for(let iter=0;iter<10;iter++){

dataset.forEach(p=>{

let mejor=0
let min=Infinity

centroides.forEach((c,i)=>{

const d = distancia(p.vector,c)

if(d<min){
min=d
mejor=i
}

})

clusters[p.codigo]=mejor

})

for(let i=0;i<k;i++){

const miembros = dataset.filter(
d=>clusters[d.codigo]===i
)

if(!miembros.length) continue

const dim = miembros[0].vector.length

let nuevo = new Array(dim).fill(0)

miembros.forEach(m=>{
for(let j=0;j<dim;j++)
nuevo[j]+=m.vector[j]
})

for(let j=0;j<dim;j++)
nuevo[j]/=miembros.length

centroides[i]=nuevo

}

}

return {
clusters,
centroides
}

}

function silhouette(dataset,clusters){

let total=0

dataset.forEach(p=>{

const ci=clusters[p.codigo]

const mismo=dataset.filter(
d=>clusters[d.codigo]===ci && d.codigo!==p.codigo
)

let a=0

if(mismo.length){

a=mismo
.map(d=>distancia(p.vector,d.vector))
.reduce((s,v)=>s+v,0)/mismo.length

}

let b=Infinity

const otros=[...new Set(Object.values(clusters))]
.filter(c=>c!==ci)

otros.forEach(c=>{

const grupo=dataset.filter(
d=>clusters[d.codigo]===c
)

const dist=grupo
.map(d=>distancia(p.vector,d.vector))
.reduce((s,v)=>s+v,0)/grupo.length

b=Math.min(b,dist)

})

total+=(b-a)/Math.max(a,b)

})

return total/dataset.length
}

function mejorK(dataset){

let bestK=2
let bestScore=-Infinity

for(let k=2;k<=5;k++){

const cl=kmeans(dataset,k)

const score=silhouette(dataset,cl)

if(score>bestScore){

bestScore=score
bestK=k

}

}

return{
k:bestK,
score:bestScore
}

}

function distanciaEuclidea(a,b){

let suma=0

for(let i=0;i<a.length;i++)
suma += (a[i]-b[i])**2

return Math.sqrt(suma)

}

function kmedoids(dataset,k,distancia){

let medoids = dataset.slice(0,k).map(d=>d.vector)

let clusters = {}

for(let iter=0;iter<10;iter++){

/* asignación */

dataset.forEach(p=>{

let mejor=0
let distMin=Infinity

medoids.forEach((m,i)=>{

const d = distancia(p.vector,m)

if(d < distMin){
distMin = d
mejor = i
}

})

clusters[p.codigo] = mejor

})

/* actualizar medoids */

for(let i=0;i<k;i++){

const miembros = dataset.filter(
d => clusters[d.codigo] === i
)

if(!miembros.length) continue

let mejorMedoid = miembros[0].vector
let mejorCoste = Infinity

miembros.forEach(candidato=>{

let coste = 0

miembros.forEach(m=>{

coste += distancia(candidato.vector,m.vector)

})

if(coste < mejorCoste){
mejorCoste = coste
mejorMedoid = candidato.vector
}

})

medoids[i] = mejorMedoid

}

}

return {
clusters,
centroides:medoids
}

}

function dbscan(dataset, eps, minPts, distancia){

let clusters = {}
let visitado = new Set()
let clusterId = 0

function vecinos(p){

return dataset.filter(q =>
distancia(p.vector,q.vector) <= eps
)

}

dataset.forEach(p=>{

if(visitado.has(p.codigo)) return

visitado.add(p.codigo)

const neigh = vecinos(p)

if(neigh.length < minPts){

clusters[p.codigo] = -1  // ruido

}else{

expandCluster(p,neigh,clusterId)
clusterId++

}

})

function expandCluster(p,neigh,clusterId){

clusters[p.codigo] = clusterId

for(let i=0;i<neigh.length;i++){

const q = neigh[i]

if(!visitado.has(q.codigo)){

visitado.add(q.codigo)

const neigh2 = vecinos(q)

if(neigh2.length >= minPts){

neigh = neigh.concat(neigh2)

}

}

if(clusters[q.codigo] === undefined){

clusters[q.codigo] = clusterId

}

}

}

return {
clusters,
centroides:{} // no aplica
}

}


