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

switch(tipo){

    case "original":
        break;

    case "mm":
        serie = maxmin(serie);
        break;

    case "z":
        serie = normalizarZ(serie);
        break;

    case "rel":
        serie = relativo(serie);
        break;

}

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

const d = distanciaEuclidea(p.vector,c)

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

function silhouette(
    dataset,
    clusters,
    distancia
){

    let distanciaAct =
    app.distancia === "pearson"
        ? distanciaCorrelacion
        : distanciaEuclidea;

    const valores = [];

    dataset.forEach(p => {

        const clusterActual = clusters[p.codigo];

        // Ignorar ruido DBSCAN
        if(clusterActual === -1 || clusterActual === undefined)
            return;

        // Municipios del mismo cluster
        const mismoCluster = dataset.filter(
            d =>
                clusters[d.codigo] === clusterActual &&
                d.codigo !== p.codigo
        );

        // a(i): distancia media dentro del cluster
        let a = 0;

        if(mismoCluster.length > 0){

            mismoCluster.forEach(d => {

                a += distanciaAct(
                    p.vector,
                    d.vector
                );

            });

            a /= mismoCluster.length;

        }

        // Obtener clusters distintos
        const otrosClusters = [
            ...new Set(
                Object.values(clusters)
            )
        ].filter(
            c => c !== clusterActual && c !== -1
        );

        // b(i): distancia media mínima al cluster más cercano
        let b = Infinity;

        otrosClusters.forEach(c => {

            const miembros = dataset.filter(
                d => clusters[d.codigo] === c
            );

            if(!miembros.length)
                return;

            let distMedia = 0;

            miembros.forEach(d => {

                distMedia += distanciaAct(
                    p.vector,
                    d.vector
                );

            });

            distMedia /= miembros.length;

            if(distMedia < b)
                b = distMedia;

        });

        // Evitar divisiones por cero
        if(b === Infinity)
            return;

        const s =
            (b - a) /
            Math.max(a, b);

        valores.push(s);

    });

    // Silhouette global
    if(!valores.length)
        return 0;

    return (
        valores.reduce(
            (sum, v) => sum + v,
            0
        ) / valores.length
    );

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

let distanciaAct =
    app.distancia === "pearson"
        ? distanciaCorrelacion
        : distanciaEuclidea;

for(let iter=0;iter<10;iter++){

/* asignación */

dataset.forEach(p=>{

let mejor=0
let distMin=Infinity

medoids.forEach((m,i)=>{

const d = distanciaAct(p.vector,m)

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

coste += distanciaAct(candidato.vector,m.vector)

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

function detectarIslas(labelsMap, vecinos) {
  const islas = [];

  localidades.forEach(loc => {
    const cod = loc.codigo;
    const cluster = labelsMap[cod];

    // Ignoramos si por alguna razón el municipio no tiene un cluster asignado
    if (cluster === undefined) return;

    const vec = vecinos[cod] || [];

    // Si el municipio no tiene vecinos registrados, no podemos evaluarlo espacialmente
    if (vec.length === 0) return;

    let vecinosMismoCluster = 0;

    // Evaluamos el cluster de cada vecino
    vec.forEach(v => {
      const clusterVecino = labelsMap[v];
      if (clusterVecino === cluster) {
        vecinosMismoCluster++;
      }
    });

    //Condición de isla espacial: Ningún vecino colindante pertenece a su mismo cluster
    if (vecinosMismoCluster === 0) {
      islas.push(cod);
    }
  });

  return islas;
}

function calcularEMA(dataset, clusters, centroides, distancia){

    let suma = 0;
    let total = 0;

    let distanciaAct =
    app.distancia === "pearson"
        ? distanciaCorrelacion
        : distanciaEuclidea;

    dataset.forEach(p => {

        const cluster = clusters[p.codigo];

        // Ignorar ruido DBSCAN
        if(cluster === -1 || cluster === undefined) return;

        const representante = centroides[cluster];

        suma += distanciaAct(
            p.vector,
            representante
        );

        total++;

    });

    return total > 0
        ? suma / total
        : 0;

}

function calcularCT(labelsMap, vecinos){

    let municipiosTotales = 0;
    let municipiosCoherentes = 0;

    localidades.forEach(loc => {

        const cod = loc.codigo;

        const cluster = labelsMap[cod];

        if(cluster === undefined)
            return;

        municipiosTotales++;

        const vec = vecinos[cod] || [];

        let tieneVecinoMismoCluster = false;

        vec.forEach(v => {

            if(labelsMap[v] === cluster){

                tieneVecinoMismoCluster = true;

            }

        });

        if(tieneVecinoMismoCluster){

            municipiosCoherentes++;

        }

    });

    return (
        municipiosCoherentes /
        municipiosTotales
    ) * 100;

}

function resumenClusters(clusters){

    const conteo = {};
    let ruido = 0;

    Object.values(clusters).forEach(cluster => {

        if(cluster === -1){

            ruido++;
            return;

        }

        conteo[cluster] =
            (conteo[cluster] || 0) + 1;

    });

    return {
        clusters: conteo,
        ruido
    };

}