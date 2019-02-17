var onOff = true; // Ejecucion de Pausa/play
var dispatch = false; // Evalua si algo cambio en la lista de procesos
var dispatchEstado = true; // Evalua si algo cambio en la lista de en Espera
var proceso; // Hilo base

var arregloPintarProcesos = new Array(); //Hilo de Impresion Para Procesos

var procesoEnEjecucion = null; //Proceso que se esta ejecutando

var tiempoGlobalEjecucion = 0; //Tiempo de ejecucion de proceso

var procesoEspacioBase = 0; //Valor en la grafica donde se va asignar para su pintado

var reglaActual = 0; //Regla que se esta ejecutando actualmente

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

var myTimeExec = document.getElementById("timeExec");
var myInitTime = document.getElementById("inicioTiempo");
var myCantProcess = document.getElementById("cantidadProcesos");
var myCantProcessEspera = document.getElementById("cantidadProcesosEspera");
var myCantProcessFin = document.getElementById("cantidadProcesosFin");
var myCuantum = document.getElementById("cuantum");
var myVejezMaxima = document.getElementById("vejez");

var myTableProcessList = document.getElementById("processList");
var myTableRR0 = document.getElementById("processRR0");
var myTableFifo1 = document.getElementById("processFifo1");
var myTableSrtf2 = document.getElementById("processSrtf2");
var myTableProcessTerminados = document.getElementById("processListEnd");

var procesos = parseInt(myCantProcess.innerHTML); //Cantidad de Procesos en el sistema
var cuantum = parseInt(myCuantum.innerHTML)+1; //Cuantum Limite
var cuantumProcesoEjecucion = 1; //Numero de proceso de ejecucion para controlar en cuantum
var vejezMaxima = parseInt(myVejezMaxima.innerHTML);

var listas = function() {
    this.listaProcesos = [];

    this.listaRR = [];
    this.listaFifo = [];
    this.listaSrtf = [];

    this.listaTerminados = [];

    this.addListaProcesos = function(dato) {
        var valor = false;
        if (this.compararIdProceso(dato.id) == false && tiempoGlobalEjecucion < dato.tiempoInicio) {
            this.listaProcesos.push(dato);
            valor = true;
        }
        return valor;
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

    this.dotarBase = function() {
        this.listaProcesos.forEach(function(elem, ind) {
            elem.procesoBase = ind;
        });
    };

    this.agregarYpintarListaProceso = function(valor) {
        if (this.addListaProcesos(valor) == true) {
            myTableProcessList.innerHTML += valor.putTableShort();
            myCantProcess.innerHTML = this.cantListaProcesos();
        } else {
            alert("El ID esta duplicado o El tiempo de Inicio de Proceso ya Expiro, no se introducira.");
        }
    };

    this.agregarYpintarListaTerminados = function(valor) {
        myTableProcessTerminados.innerHTML += valor.putTableLong();
        myCantProcessFin.innerHTML = parseInt(myCantProcessFin.innerHTML) + 1;
    };

    this.addListaLlegados = function(dato) {
        if (dato.prioridad == 0) {
            this.listaRR.push(dato);
        }
        if (dato.prioridad == 1) {
            this.listaFifo.push(dato);
        }
        if (dato.prioridad == 2) {
            this.listaSrtf.push(dato);
        }
    };

    this.cantListaRR = function() {
        return this.listaRR.length;
    };

    this.cantListaFifo = function() {
        return this.listaFifo.length;
    };

    this.cantListaSrtf = function() {
        return this.listaSrtf.length;
    };

    this.cantProcesosLlegados = function() {
        return this.cantListaRR() + this.cantListaFifo() + this.cantListaSrtf();
    };

    this.isVacioRR = function() {
        return this.cantListaRR() == 0;
    };

    this.isVacioFifo = function() {
        return this.cantListaFifo() == 0;
    };

    this.isVacioSrtf = function() {
        return this.cantListaSrtf() == 0;
    };

    this.isVacioLlegados = function() {
        return this.isVacioRR() && this.isVacioFifo() && this.isVacioSrtf();
    };

    this.addListaTerminados = function(dato) {
        this.listaTerminados.push(dato);
    };

    this.cantListaProcesos = function() {
        return this.listaProcesos.length;
    };

    this.minProcesoRafaga = function() {
        // Solo para SRTF
        var indexProceso = 0;
        var rafagaMin = 1000;
        this.listaSrtf.forEach(function (elem, index) {
            if(elem.rafaga < rafagaMin) {
                rafagaMin = elem.rafaga;
                indexProceso = index;
            }
        });
        return this.listaSrtf.splice(indexProceso, 1)[0];
    };

    this.fifoProceso = function(lista) {
        // si lista == 0 -> RR
        // si lista == 1 -> FIFO
        if (lista == 0) {
            return this.listaRR.shift();
        }
        if (lista == 1) {
            return this.listaFifo.shift();
        }
        return null;
    };

    this.compararProcesosRafaga = function(ejecucion) {
        // Solo para SRTF
        var isMin = false;
        this.listaSrtf.forEach(function (elem) {
            if(elem.rafaga < ejecucion.rafaga) {
                isMin = true;
            }
        });
        return isMin;
    };

    this.indexProceso = function(tabla, proceso) {
        var index = 0;
        if (tabla == "rr") {
            this.listaRR.forEach(function(elem, ind) {
                if (elem.id == proceso.id) {
                    index = ind;
                }
            });
        }
        if (tabla == "fifo") {
            this.listaFifo.forEach(function(elem, ind) {
                if (elem.id == proceso.id) {
                    index = ind;
                }
            });
        }
        if (tabla == "srtf") {
            this.listaSrtf.forEach(function(elem, ind) {
                if (elem.id == proceso.id) {
                    index = ind;
                }
            });
        }
        return index;
    };

    this.pintarTabla = function(lista, tabla) {
        var definicion = "";
        var atributosTabla = `
            <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Tiempo Inicio</th>
                <th>Rafaga</th>
                <th>Prioridad</th>
                <th>Vejez</th>
                <th>Tiempo Comienzo</th>
                <th>Tiempo Final</th>
                <th>Tiempo Retorno</th>
                <th>Tiempo Espera</th>
            </tr>`;
        definicion += atributosTabla;

        if (lista == "rr") {
            this.listaRR.forEach(function(elem) {
                definicion += elem.putTableLong();
            });
        }
        if (lista == "fifo") {
            this.listaFifo.forEach(function(elem) {
                definicion += elem.putTableLong();
            });
        }
        if (lista == "srtf") {
            this.listaSrtf.forEach(function(elem) {
                definicion += elem.putTableLong();
            });
        }

        document.getElementById(tabla).innerHTML = definicion;
    };
}

var todasListas = new listas(); // Variable vital que inicializa todas las listas

var Proceso = function(_id, _nombre, _tiempo, _rafaga, _prioridad) {
    this.id = _id;
    this.nombre = _nombre;
    this.tiempoInicio = _tiempo;
    this.rafaga = _rafaga;
    this.rafaga_inicio = _rafaga;
    this.prioridad = _prioridad;

    this.vejez = 0;
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
              <td>${this.prioridad}</td>
              <td>${this.vejez}</td>
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
              <td>${this.prioridad}</td>
            </tr>
        `;
    };

    this.toString = function() {
        return `
              - ${this.id}
              - ${this.nombre}
              - ${this.tiempoInicio}
              - ${this.rafaga}
              - ${this.prioridad}
              - ${this.vejez}
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
    this.intervaloPrioridad = 3;

    this.rafaga = function() {
        return Math.floor(1+(Math.random()*this.intervaloRafaga));
    };

    this.identificador = function() {
        return Math.floor(Math.random()*this.intervaloIdentificador);
    };

    this.tiempoInicio = function(base) {
        return Math.floor(base+(Math.random()*this.intervaloMaxTiempo));
    };

    this.prioridad = function() {
        return Math.floor(Math.random()*this.intervaloPrioridad);
    };
}

function agregar() {
    var id = document.getElementById("txtId").value;
    var nombre = document.getElementById("txtNombre").value;
    var tiempo = parseInt(document.getElementById("txtTiempo").value);
    var rafaga = parseInt(document.getElementById("txtRafaga").value);
    var prioridad = parseInt(document.getElementById("txtPrioridad").value);

    var nProceso = new Proceso(id, nombre, tiempo, rafaga, prioridad);

    nProceso.procesoBase = procesoEspacioBase;
    procesoEspacioBase++;

    todasListas.agregarYpintarListaProceso(nProceso);
}

function generar() {
    var rl = new randomLetter();
    var rn = new randomNumber();

    var nombre = rl.get();
    var id = rn.identificador();
    var rafaga = rn.rafaga();
    var tiempo = rn.tiempoInicio(tiempoGlobalEjecucion + 1);
    var prioridad = rn.prioridad();

    document.getElementById("txtId").value = id;
    document.getElementById("txtNombre").value = nombre;
    document.getElementById("txtTiempo").value = tiempo;
    document.getElementById("txtRafaga").value = rafaga;
    document.getElementById("txtPrioridad").value = prioridad;
}

// function modificarProcesoEjecucion() {
//     var nombre = procesoEnEjecucion.nombre + procesoEnEjecucion.salidaDispatch;
//     var id = procesoEnEjecucion.id;
//     var rafaga = procesoEnEjecucion.rafaga;
//     var tiempo = procesoEnEjecucion.tiempo;

//     todasListas.modificarRafaga(procesoEnEjecucion, rafaga);

//     var nProceso = new Proceso(id, nombre, tiempo, rafaga);
//     nProceso.salidaDispatch = procesoEnEjecucion.salidaDispatch + 1;
//     nProceso.tiempoInicio = procesoEnEjecucion.tiempoInicio;
//     nProceso.tiempoEspera = procesoEnEjecucion.tiempoEspera;

//     procesoEnEjecucion.tiempoFinal = tiempoGlobalEjecucion;
//     nProceso.procesoBase = procesoEnEjecucion.procesoBase;

//     todasListas.addListaLlegados(nProceso);

//     addToTableLong("processListEnd", procesoEnEjecucion);
// }

function tiempo() {
    var d = new Date();
    return d.toLocaleTimeString();
}

// Dibujo Base

var grafico = function() {
    this.myCanvas = document.getElementById("myCanvas");

    this.myCanvas.width = 120;
    this.myCanvas.height = 300;

    this.ctx = this.myCanvas.getContext("2d");

    this.dibujarBase = function() {
        // Borra todo lo que hay en el canvas
        this.ctx.clearRect(0, 0, this.myCanvas.width, this.myCanvas.height);
    };

    this.dibujarLinea = function(startX, startY, endX, endY, color) {
        // La buena Herencia
        this.ctx.save();
        this.ctx.strokeStyle = color;
        //ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        //ctx.restore();
    };

    this.dibujarBarra = function(upperLeftCornerX, upperLeftCornerY, width, height, color) {
        //ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.fillRect(upperLeftCornerX, upperLeftCornerY, width, height);
        //ctx.restore();
    };

    this.dibujarTexto = function(txt, x, y, stroke_color) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = stroke_color;
        this.ctx.font = "bold 15px arial";
        this.ctx.fillText(txt,x,y);
    };

    this.lineasTiempo = function() {
        var grosorBarra = 2;
        var colorBarra = "#08088A";
        var inicioPintadoBarra = 30;
        var largoBarras = this.myCanvas.height;

        var posicionTexto = 20;

        if (procesos >= 11 && dispatch == false) {
            this.myCanvas.height = 60 + (procesos * 20);
            dispatch = true;
        }

        var nBarra = 0;
        while (nBarra <= tiempoGlobalEjecucion) {
            this.dibujarBarra(inicioBarras + (distanciaEntreBarras * nBarra), inicioPintadoBarra, grosorBarra, largoBarras, colorBarra);
            this.dibujarTexto(nBarra, inicioBarras + (distanciaEntreBarras * nBarra), posicionTexto, colorBarra);
            nBarra += 1;
        }
    };

    this.agregarTextos = function() {
        var temp = 0;
        var color = "#08298A";

        while (temp < procesos) {
            this.dibujarTexto(todasListas.listaProcesos[temp].nombre,  inicioNombres, margenProceso + ((temp + 1) * distanciaEntreProcesos), color);
            temp++;
        }
    };

    this.printProceso = function (x, y, estado) {
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
        this.dibujarBarra(inicioBarras + ( x * distanciaEntreBarras), (margenProceso + 10) + ( y * distanciaEntreProcesos), distanciaEntreBarras, anchoBarra, tempColor);
    };

    this.cambiarTamanoCanvas = function() {
        this.myCanvas.width += distanciaEntreBarras;
    };
}

var Posicion = function(_x, _y, _estado) {
    this.x = _x;
    this.y = _y;
    this.estado = _estado;

    this.dibujarPosicion = function(grafico) {
        grafico.printProceso(this.x, this.y, this.estado);
    };
}

function imprimirProcesoEjecucion() {
    if (tiempoGlobalEjecucion > 0 && procesoEnEjecucion != null) {
        document.getElementById("idProcesoEjecucion").innerHTML = procesoEnEjecucion.id;
        document.getElementById("nombreProcesoEjecucion").innerHTML = procesoEnEjecucion.nombre;
        document.getElementById("rafagaProcesoEjecucion").innerHTML = procesoEnEjecucion.rafaga;
        document.getElementById("prioridadProcesoEjecucion").innerHTML = procesoEnEjecucion.prioridad;
        document.getElementById("tComienzoProcesoEjecucion").innerHTML = procesoEnEjecucion.tiempoComienzo;
        document.getElementById("tRetornoProcesoEjecucion").innerHTML = procesoEnEjecucion.tiempoRetorno;
        document.getElementById("tEsperaProcesoEjecucion").innerHTML = procesoEnEjecucion.tiempoEspera;
    }
}

function pintarProcesos(grafico) {
    arregloPintarProcesos.forEach(function (elem) {
        elem.dibujarPosicion(grafico);
    });
}

function cambioProcesoWait(proceso) {
    proceso.tiempoRetorno += 1;
    proceso.tiempoEspera += 1;
    proceso.vejez += 1;

    var nPosicion = new Posicion(tiempoGlobalEjecucion, proceso.procesoBase, false);
    arregloPintarProcesos.push(nPosicion);
}

function incrementarWait() {
    todasListas.listaRR.forEach(function(elem) {
        cambioProcesoWait(elem);
    });
    todasListas.listaFifo.forEach(function(elem) {
        cambioProcesoWait(elem);
    });
    todasListas.listaSrtf.forEach(function(elem) {
        cambioProcesoWait(elem);
    });
}

function aumentarProcesoEjecucion() {
    if  (procesoEnEjecucion != null) {
        procesoEnEjecucion.tiempoFinal += 1;
        procesoEnEjecucion.tiempoRetorno += 1;
        procesoEnEjecucion.rafaga -= 1;

        if (procesoEnEjecucion.prioridad == 0){
            cuantumProcesoEjecucion += 1;
        }

        var nPosicion = new Posicion(tiempoGlobalEjecucion, procesoEnEjecucion.procesoBase, true);
        arregloPintarProcesos.push(nPosicion);
    }
}

function modificarProcesoPorRafagaCorta() {
    var nombre = procesoEnEjecucion.nombre + procesoEnEjecucion.salidaDispatch;
    var id = procesoEnEjecucion.id;
    var rafaga = procesoEnEjecucion.rafaga;
    var tiempo = procesoEnEjecucion.tiempo;
    var prioridad = procesoEnEjecucion.prioridad;

    var nProceso = new Proceso(id, nombre, tiempo, rafaga, prioridad);
    nProceso.salidaDispatch = procesoEnEjecucion.salidaDispatch + 1;
    nProceso.tiempoInicio = procesoEnEjecucion.tiempoInicio;
    nProceso.tiempoEspera = procesoEnEjecucion.tiempoEspera;
    nProceso.vejez = procesoEnEjecucion.vejez;
    nProceso.procesoBase = procesoEnEjecucion.procesoBase;

    procesoEnEjecucion.tiempoFinal = tiempoGlobalEjecucion;

    todasListas.addListaLlegados(nProceso);

    todasListas.agregarYpintarListaTerminados(procesoEnEjecucion);
}

function seleccionarProcesoEjecucion() {
    if (!todasListas.isVacioLlegados()) {
        if (!todasListas.isVacioRR()) {
            reglaActual = 0;
            procesoEnEjecucion = todasListas.fifoProceso(0);
        }
        else if (!todasListas.isVacioFifo()) {
            reglaActual = 1;
            procesoEnEjecucion = todasListas.fifoProceso(1);
        }
        else {
            reglaActual = 2;
            procesoEnEjecucion = todasListas.minProcesoRafaga();
        }
        console.log(procesoEnEjecucion);
        procesoEnEjecucion.tiempoComienzo = tiempoGlobalEjecucion;
    } else {
        procesoEnEjecucion = null;
    }
}

function verificarVejezProcesos() {
    todasListas.listaFifo.forEach(function (elem, index) {
        if (elem.vejez == vejezMaxima) {
            elem.vejez = 0;
            elem.prioridad = 0;
            todasListas.addListaLlegados(elem);
            todasListas.listaFifo.shift(index, 1);
        }
    });
    todasListas.listaSrtf.forEach(function (elem, index) {
        if (elem.vejez == vejezMaxima) {
            elem.vejez = 0;
            elem.prioridad = 1;
            todasListas.addListaLlegados(elem);
            todasListas.listaSrtf.shift(index, 1);
        }
    });
}

function prepararCiclo() {
    if (!todasListas.isVacioLlegados() || procesoEnEjecucion != null) {
        if (procesoEnEjecucion != null && procesoEnEjecucion.rafaga == 0) {
            procesoEnEjecucion.tiempoFinal = tiempoGlobalEjecucion;
            cuantumProcesoEjecucion = 1;
            todasListas.agregarYpintarListaTerminados(procesoEnEjecucion);

            seleccionarProcesoEjecucion();
        }
        if (dispatchEstado) {
            if (procesoEnEjecucion == null && !todasListas.isVacioLlegados()) {
                seleccionarProcesoEjecucion();
            } else {
                if (!todasListas.isVacioRR() && reglaActual > 0) {
                    modificarProcesoPorRafagaCorta();
                    cuantumProcesoEjecucion = 1;

                    reglaActual = 0;
                    procesoEnEjecucion = todasListas.fifoProceso(0);
                    procesoEnEjecucion.tiempoComienzo = tiempoGlobalEjecucion;
                } else if (!todasListas.isVacioFifo() && reglaActual > 1) {
                    modificarProcesoPorRafagaCorta();

                    reglaActual = 1;
                    procesoEnEjecucion = todasListas.fifoProceso(1);
                    procesoEnEjecucion.tiempoComienzo = tiempoGlobalEjecucion;
                } else if (!todasListas.isVacioSrtf() && reglaActual == 2) {
                    // Comparare la rafaga
                    if (todasListas.compararProcesosRafaga(procesoEnEjecucion)) {
                        modificarProcesoPorRafagaCorta();

                        procesoEnEjecucion = todasListas.minProcesoRafaga();
                        procesoEnEjecucion.tiempoComienzo = tiempoGlobalEjecucion;
                    }
                }
                if (cuantum == cuantumProcesoEjecucion && procesoEnEjecucion.rafaga != 0) {
                    modificarProcesoPorRafagaCorta();

                    procesoEnEjecucion = todasListas.fifoProceso(0);
                    procesoEnEjecucion.tiempoComienzo = tiempoGlobalEjecucion;
                    cuantumProcesoEjecucion = 1;
                }
            }
        }

        verificarVejezProcesos();
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

function pintarTablaEspera() {
    todasListas.pintarTabla("rr", "processRR0");
    todasListas.pintarTabla("fifo", "processFifo1");
    todasListas.pintarTabla("srtf", "processSrtf2");
}

// Manejo de Proceso Principal
var graficaProcesos = new grafico();

function arrancarEjecucion() {
    procesos = parseInt(myCantProcess.innerHTML); //Cantidad de Procesos en el sistema

    myTimeExec.innerHTML = tiempoGlobalEjecucion;

    graficaProcesos.cambiarTamanoCanvas();

    ejecucionProcesos(); //Pasa de una Cola a otra
    prepararCiclo(); //App en si
    imprimirProcesoEjecucion(); //Imprime el Proceso Actual

    pintarTablaEspera(); // Imprime la tabla en Espera

    // Parte Grafica
    graficaProcesos.lineasTiempo();
    graficaProcesos.agregarTextos();

    if (tiempoGlobalEjecucion > 0) {
        pintarProcesos(graficaProcesos);
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
    graficaProcesos.yanvas.width = 120;
    graficaProcesos.myCanvas.height = 300;
    onOff = true;
    clearInterval(proceso);
    tiempoGlobalEjecucion = 0;
    myInitTime.innerHTML = "Iniciar Ejecucion";
    myTimeExec.innerHTML = 0;
    graficaProcesos.dibujarBase(ctx);
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
