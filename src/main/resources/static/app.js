var app = (function () {
    
    class Point{
        constructor(x,y){
            this.x=x;
            this.y=y;
        }        
    }
    
    var stompClient = null;
    var idDrawing = null;
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    var input = document.querySelector('#idDrawing');
    
    var loadEventListener = function(){
        if( input ) input.addEventListener('change', updateId);
        const eventCanvas = (window.PointerEvent)?'pointerdown':'mousedown';
        canvas.addEventListener(eventCanvas, eventPoint);
    }

    var updateId = function(event){
        idDrawing = event.target.value;
        console.log(`nuevoValor ${idDrawing}`);
        if( stompClient ) stompClient.disconnect();
    }

    var eventPoint = function (event){
        const { x ,y } = getMousePosition(event);
        //publicar el event
        if(idDrawing) app.publishPoint(x,y);
    }

    var addPointToCanvas = function (point) {        
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
    };
    
    var getMousePosition = function (evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };


    var connectAndSubscribe = function () {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);
        
        //subscribe to /topic/TOPICXX when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe(`/topic/newpoint.${idDrawing}`, function (eventbody) {
                var obj = JSON.parse(eventbody.body);
                addPointToCanvas(obj);
            });
        });
    };    

    
    return {

        init: function () {
            loadEventListener();
        },

        publishPoint: function(px,py){
            var pt=new Point(px,py);
            console.info("publishing point at "+pt);
            addPointToCanvas(pt);
            //publicar el evento
            stompClient.send(`/topic/newpoint.${idDrawing}`, {}, JSON.stringify(pt));
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            setConnected(false);
            console.log("Disconnected");
        },
        publishDrawing( currentId ){
            idDrawing = currentId;
            //websocket connection
            connectAndSubscribe();
        }
    };

})();


//otra forma para publicar un evento -> , enviar puntos al broker (servidor Spring) y mostrara el cambio a los demans clientes
/* stompClient.publish({
    destination:'/app/newpoint',
    body: JSON.stringify(pt) --> ESTE ES OPCIONAL
}) */