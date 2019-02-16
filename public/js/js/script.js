var onOff = true; // Ejecucion de Pausa/play
var dispatch = false; // Evalua si algo cambio en la lista de procesos
var dispatchEstado = true; // Evalua si algo cambio en la lista de en Espera
var proceso; // Hilo base

var arregloPintarProcesos = new Array(); //Hilo de Impresion Para Procesos

var procesoEnEjecucion = null; //Proceso que se esta ejecutando

var tiempoGlobalEjecucion = 0; //Tiempo de ejecucion de proceso

var procesoEspacioBase = 0;

//Colores Procesos
var colorVerde1 = "#088A08";
var colorVerde2 = "#58FA58";
var colorAmarillo1 = "#AEB404";
var colorAmarillo2 = "#F4FA58";

// Variables de grafica por defecto
var inicioNombres = 10;
var inicioBarras = 80;
var distanciaEntreProcesos = 20;
var margenProceso = 40;
var anchoBarra = 10;
var distanciaTiempoTexto = 40;
var distanciaEntreBarras = 60;

var myCanvas = document.getElementById("myCanvas");
var myTimeExec = document.getElementById("timeExec");
var myInitTime = document.getElementById("inicioTiempo");
var myCantProcess = document.getElementById("cantidadProcesos");
var myCantProcessEspera = document.getElementById("cantidadProcesosEspera");
var myCantProcessFin = document.getElementById("cantidadProcesosFin");

var procesos = parseInt(myCantProcess.innerHTML); //Cantidad de Procesos en el sistema

// Tamaño base del Canvas
myCanvas.width = 120;
myCanvas.height = 300;

// Configuracion Base
var ctx = myCanvas.getContext("2d");

var listas = function() {
    this.listaProcesos = [];
    this.listaLlegados = [];
    this.listaTerminados = [];

    this.addListaProcesos = function(dato) {
        var valor = false;
        if (this.compararIdProceso(dato.id) == false && tiempoGlobalEjecucion < dato.tiempoInicio) {
            this.listaProcesos.push(dato);
            valor = true;
        }
        return valor;
    };

    this.addListaLlegados = function(dato) {
        this.listaLlegados.push(dato);
    };

    this.addListaTerminados = function(dato) {
        this.listaTerminados.push(dato);
    };

    this.compararIdProceso = function(idComparar) {
        var valor = false;
        this.listaProcesos.forEach(function (elem) {
            if (elem.id == idComparar) {
                valor = true;
            }
        });
        return valor;
    };

    this.cantListaProcesos = function() {
        return this.listaProcesos.length;
    };

    this.cantListaProcesosEspera = function() {
        return this.listaLlegados.length;
    };

    this.minProcesoRafaga = function() {
        var proceso = 0;
        var rafagaMin = 1000;
        this.listaLlegados.forEach(function (elem, index) {
            if(elem.rafaga < rafagaMin) {
                rafagaMin = elem.rafaga;
                proceso = index;
            }
        });
        return this.listaLlegados.splice(proceso, 1)[0];
    };

    this.compararProcesosRafaga = function(ejecucion) {
        var isMin = false;
        this.listaLlegados.forEach(function (elem) {
            if(elem.rafaga < ejecucion.rafaga) {
                isMin = true;
            }
        });
        return isMin;
    };

    this.indexProceso = function(proceso) {
        var index = 0;
        this.listaProcesos.forEach(function(elem, ind) {
            if (elem.id == proceso.id) {
                index = ind;
            }
        });
        return index;
    };

    this.dotarBase = function() {
        this.listaProcesos.forEach(function(elem, ind) {
            elem.procesoBase = ind;
        });
    };

    this.rafagaProceso = function(proceso) {
        var vRafaga = 0;
        this.listaProcesos.forEach(function(elem) {
            if (elem.id == proceso.id) {
                vRafaga = elem.rafaga;
            }
        });
        return vRafaga;
    };

    this.modificarRafaga = function(proceso, rafaga) {
        this.listaProcesos.forEach(function(elem) {
            if (elem.id == proceso.id) {
                elem.rafaga = rafaga;
            }
        });
    };
}

var todasListas = new listas();

var Proceso = function(_id, _nombre, _tiempo, _rafaga) {
    this.id = _id;
    this.nombre = _nombre;
    this.tiempoInicio = _tiempo;
    this.rafaga = _rafaga;
    this.rafaga_inicio = _rafaga;
    this.tiempoComienzo = 0;
    this.tiempoFinal = 0;
    this.tiempoRetorno = 0;
    this.tiempoEspera = 0;
    this.salidaDispatch = 0;
    this.procesoBase = 0;

    this.putTableLong = function() {

        return `
            <tr>
              <td>${this.id}</td>
              <td>${this.nombre}</td>
              <td>${this.tiempoInicio}</td>
              <td>${this.rafaga_inicio}</td>
              <td>${this.tiempoComienzo}</td>
              <td>${this.tiempoFinal}</td>
              <td>${this.tiempoRetorno}</td>
              <td>${this.tiempoEspera}</td>
            </tr>
        `;
    };

    this.putTableShort = function() {

        return `
            <tr>
              <td>${this.id}</td>
              <td>${this.nombre}</td>
              <td>${this.tiempoInicio}</td>
              <td>${this.rafaga}</td>
            </tr>
        `;
    };

    this.toString = function() {
        return `
              - ${this.id}
              - ${this.nombre}
              - ${this.tiempoInicio}
              - ${this.rafaga}
              - ${this.tiempoComienzo}
              - ${this.tiempoFinal}
              - ${this.tiempoRetorno}
              - ${this.tiempoEspera}
        `;
    };
}

var randomLetter = function() {
    this.Letras = new Array('a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z');

    this.get = function() {
        return this.Letras[Math.floor(Math.random()*this.Letras.length)];
    };
}

var randomNumber = function() {
    this.intervaloRafaga = 10;
    this.intervaloMaxTiempo = 8;
    this.intervaloIdentificador = 9999;

    this.rafaga = function() {
        return Math.floor(1+(Math.random()*this.intervaloRafaga));
    };

    this.identificador = function() {
        return Math.floor(Math.random()*this.intervaloIdentificador);
    };

    this.tiempoInicio = function(base) {
        return Math.floor(base+(Math.random()*this.intervaloMaxTiempo));
    };
}

function pintarTablaEspera() {
    var definicion = "";
    var atributosTabla = `
            <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Tiempo Inicio</th>
                <th>Rafaga</th>
                <th>Tiempo Comienzo</th>
                <th>Tiempo Final</th>
                <th>Tiempo Retorno</th>
                <th>Tiempo Espera</th>
            </tr>`;
    definicion += atributosTabla;
    todasListas.listaLlegados.forEach(function(elem,index,array) {
        definicion += elem.putTableLong();
    });
    document.getElementById("processListWait").innerHTML = definicion;
}

function addToTableShort(_tabla, valor) {
    var tabla = document.getElementById(_tabla);
    if (todasListas.addListaProcesos(valor) == true) {
        tabla.innerHTML += valor.putTableShort();
        document.getElementById("cantidadProcesos").innerHTML = todasListas.cantListaProcesos();
    } else {
        alert("El ID esta duplicado o El tiempo de Inicio de Proceso ya Expiro, no se introducira.");
    }
}

function addToTableLong(_tabla, valor) {
    var tabla = document.getElementById(_tabla);
    tabla.innerHTML += valor.putTableLong();
    document.getElementById("cantidadProcesosFin").innerHTML = parseInt(document.getElementById("cantidadProcesosFin").innerHTML)+1;
}

function agregar() {
    var id = document.getElementById("txtId").value;
    var nombre = document.getElementById("txtNombre").value;
    var tiempo = parseInt(document.getElementById("txtTiempo").value);
    var rafaga = parseInt(document.getElementById("txtRafaga").value);

    var nProceso = new Proceso(id,nombre,tiempo,rafaga);
    nProceso.procesoBase = procesoEspacioBase;
    procesoEspacioBase++;
    addToTableShort("processList", nProceso);
}

function generar() {
    var tiempoEjecucion = parseInt(document.getElementById("timeExec").innerHTML);

    var rl = new randomLetter();
    var rn = new randomNumber();

    var nombre = rl.get();
    var id = rn.identificador();
    var rafaga = rn.rafaga();
    var tiempo = rn.tiempoInicio(tiempoEjecucion+1);

    document.getElementById("txtId").value = id;
    document.getElementById("txtNombre").value = nombre;
    document.getElementById("txtTiempo").value = tiempo;
    document.getElementById("txtRafaga").value = rafaga;
}

function modificarProcesoEjecucion() {
    var nombre = procesoEnEjecucion.nombre + procesoEnEjecucion.salidaDispatch;
    var id = procesoEnEjecucion.id;
    var rafaga = procesoEnEjecucion.rafaga;
    var tiempo = procesoEnEjecucion.tiempo;

    todasListas.modificarRafaga(procesoEnEjecucion, rafaga);

    var nProceso = new Proceso(id,nombre,tiempo,rafaga);
    nProceso.salidaDispatch = procesoEnEjecucion.salidaDispatch + 1;
    nProceso.tiempoInicio = procesoEnEjecucion.tiempoInicio;
    nProceso.tiempoEspera = procesoEnEjecucion.tiempoEspera;

    procesoEnEjecucion.tiempoFinal = tiempoGlobalEjecucion;
    nProceso.procesoBase = procesoEnEjecucion.procesoBase;

    todasListas.addListaLlegados(nProceso);

    addToTableLong("processListEnd", procesoEnEjecucion);
}

function tiempo() {
    var d = new Date();
    return d.toLocaleTimeString();
}

// Dibujo Base

function dibujarBase(ctx) {
    ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
}

function dibujarLinea(ctx, startX, startY, endX, endY, color) {
    // La buena Herencia
    ctx.save();
    ctx.strokeStyle = color;
    //ctx.beginPath();
    ctx.moveTo(startX,startY);
    ctx.lineTo(endX,endY);
    ctx.stroke();
    //ctx.restore();
}

function dibujarBarra(ctx, upperLeftCornerX, upperLeftCornerY, width, height, color){
    //ctx.save();
    ctx.fillStyle=color;
    ctx.fillRect(upperLeftCornerX,upperLeftCornerY,width,height);
    //ctx.restore();
}

function dibujarTexto(ctx, txt, x, y, stroke_color) {
    ctx.beginPath();
    ctx.strokeStyle = stroke_color;
    ctx.font="bold 15px arial";
    ctx.fillText(txt,x,y);
}

// Dibujo mas especifico

function lineasTiempo(ctx) {
    var grosorBarra = 2;
    var colorBarra = "#08088A";
    var inicioPintadoBarra = 30;
    var largoBarras = myCanvas.height;

    var posicionTexto = 20;

    if (procesos >= 11 && dispatch == false) {
        myCanvas.height = 60+(procesos*20);
        dispatch = true;
    }

    var i=0;
    while (i <= tiempoGlobalEjecucion) {
        dibujarBarra(ctx, inicioBarras+(distanciaEntreBarras*i), inicioPintadoBarra, grosorBarra, largoBarras, colorBarra);
        dibujarTexto(ctx, i, inicioBarras+(distanciaEntreBarras*i), posicionTexto, colorBarra);
        i += 1;
    }
}

function agregarTextos(ctx) {
    var temp = 0;
    var color = "#08298A";
    while (temp < procesos) {
        dibujarTexto(ctx, todasListas.listaProcesos[temp].nombre,  inicioNombres, margenProceso+((temp+1)*distanciaEntreProcesos), color);
        temp++;
    }
}

function imprimirProcesoEjecucion() {
    if (tiempoGlobalEjecucion > 0 && procesoEnEjecucion != null) {
        document.getElementById("idProcesoEjecucion").innerHTML = procesoEnEjecucion.id;
        document.getElementById("nombreProcesoEjecucion").innerHTML = procesoEnEjecucion.nombre;
        document.getElementById("rafagaProcesoEjecucion").innerHTML = procesoEnEjecucion.rafaga;
        document.getElementById("tComienzoProcesoEjecucion").innerHTML = procesoEnEjecucion.tiempoComienzo;
        document.getElementById("tRetornoProcesoEjecucion").innerHTML = procesoEnEjecucion.tiempoRetorno;
        document.getElementById("tEsperaProcesoEjecucion").innerHTML = procesoEnEjecucion.tiempoEspera;
    }
}

function printProceso(ctx, x, y, estado) {
    var tempColor = "";
    if (estado == true) {
        if (y%2 == 1) {
            tempColor = colorVerde2;
        } else {
            tempColor = colorVerde1;
        }
    } else {
        if (y%2 == 1) {
            tempColor = colorAmarillo2;
        } else {
            tempColor = colorAmarillo1;
        }
    }
    dibujarBarra(ctx, inicioBarras+(x*distanciaEntreBarras), (margenProceso + 10)+(y*distanciaEntreProcesos), distanciaEntreBarras, anchoBarra, tempColor);
}

var Posicion = function(_x, _y, _estado) {
    this.x = _x;
    this.y = _y;
    this.estado = _estado;

    this.dibujarPosicion = function(ctx) {
        printProceso(ctx, this.x, this.y, this.estado);
    };
}

function pintarProcesos(ctx) {
    arregloPintarProcesos.forEach(function (elem) {
        elem.dibujarPosicion(ctx);
    });
}

function incrementarWait() {
    todasListas.listaLlegados.forEach(function(elem) {
        elem.tiempoRetorno += 1;
        elem.tiempoEspera += 1;

        var nPosicion = new Posicion(tiempoGlobalEjecucion, elem.procesoBase, false);
        arregloPintarProcesos.push(nPosicion);
    });
}

function aumentarProcesoEjecucion() {
    if  (procesoEnEjecucion != null) {
        procesoEnEjecucion.tiempoFinal += 1;
        procesoEnEjecucion.tiempoRetorno += 1;
        procesoEnEjecucion.rafaga -= 1;

        var nPosicion = new Posicion(tiempoGlobalEjecucion, procesoEnEjecucion.procesoBase, true);
        arregloPintarProcesos.push(nPosicion);
    }
}

function prepararCiclo() {
    if (todasListas.cantListaProcesosEspera() > 0 || procesoEnEjecucion != null) {
        if (dispatchEstado == true) {
            if (procesoEnEjecucion == null) {
                procesoEnEjecucion = todasListas.minProcesoRafaga();
                procesoEnEjecucion.tiempoComienzo = tiempoGlobalEjecucion;
            } else {
                if (todasListas.compararProcesosRafaga(procesoEnEjecucion)) {
                    modificarProcesoEjecucion();
                    procesoEnEjecucion = todasListas.minProcesoRafaga();
                    procesoEnEjecucion.tiempoComienzo = tiempoGlobalEjecucion;
                }
            }
            dispatchEstado = false;
        }
        if (procesoEnEjecucion.rafaga == 0) {
            procesoEnEjecucion.tiempoFinal = tiempoGlobalEjecucion;
            addToTableLong("processListEnd", procesoEnEjecucion);

            if (todasListas.cantListaProcesosEspera() > 0){
                procesoEnEjecucion = todasListas.minProcesoRafaga();
                procesoEnEjecucion.tiempoComienzo = tiempoGlobalEjecucion;
            } else {
                procesoEnEjecucion = null;
            }

        }
        aumentarProcesoEjecucion();
        incrementarWait();
    }
}


function ejecucionProcesos() {
    todasListas.listaProcesos.forEach(function(elem) {
        if (elem.tiempoInicio == tiempoGlobalEjecucion) {
            todasListas.addListaLlegados(elem);
            myCantProcessEspera.innerHTML = parseInt(myCantProcessEspera.innerHTML)+1;
            dispatchEstado = true;
        }
    });
}

// Manejo de Proceso Principal

function arrancarEjecucion() {
    procesos = parseInt(myCantProcess.innerHTML); //Cantidad de Procesos en el sistema
    myTimeExec.innerHTML = tiempoGlobalEjecucion;
    myCanvas.width += distanciaEntreBarras;

    ejecucionProcesos(); //Pasa de una Cola a otra
    prepararCiclo(); //App en si
    imprimirProcesoEjecucion(); //Imprime el Proceso Actual
    pintarTablaEspera(); // Imprime la tabla en Espera

    // Parte Grafica
    lineasTiempo(ctx);
    agregarTextos(ctx);
    if (tiempoGlobalEjecucion > 0) {
        pintarProcesos(ctx);
    }
    tiempoGlobalEjecucion++;
}

function pausar() {
    if (!onOff) {
        // Pausar
        onOff = true;
        clearInterval(proceso);
        myInitTime.innerHTML = "Reanudar Ejecucion";
    } else {
        // Ejecutar
        onOff = false;
        proceso = setInterval(arrancarEjecucion, 1000);
        myInitTime.innerHTML = "Pausar Ejecucion";
    }
}

function detener() {
    // Tamaño base del Canvas
    myCanvas.width = 120;
    myCanvas.height = 300;
    onOff = true;
    clearInterval(proceso);
    tiempoGlobalEjecucion = 0;
    myInitTime.innerHTML = "Iniciar Ejecucion";
    myTimeExec.innerHTML = 0;
    dibujarBase(ctx);
    todasListas.listaLlegada = [];

    document.getElementById("idProcesoEjecucion").innerHTML = 0;
    document.getElementById("nombreProcesoEjecucion").innerHTML = "";
    document.getElementById("rafagaProcesoEjecucion").innerHTML = 0;
    document.getElementById("tComienzoProcesoEjecucion").innerHTML = 0;
    document.getElementById("tRetornoProcesoEjecucion").innerHTML = 0;
    document.getElementById("tEsperaProcesoEjecucion").innerHTML = 0;

    procesoEnEjecucion = null;
    arregloPintarProcesos = new Array();
}
