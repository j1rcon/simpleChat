/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/canvas',routes.canvas);

var server = http.createServer(app)
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


// redis example
var redis = require("redis");
var client = redis.createClient();

client.on("error", function(err) {
    console.log("Error " + err)
});

//client.set('HELLO', [1, 2, 3], redis.print);
//client.set('HELLO', "WORLD23", redis.print);
//client.get('HELLO' ,function(err, reply){
//    console.log(reply[0]);
//});


// socket.io example
var io = require('socket.io').listen(server)
var chatArr = new Array();
var pointArr = new Array();

io.sockets.on('connection', function(socket){

    socket.emit('message', {message : 'welcome to the chat'});

    client.get('chatSync' ,function(err, reply){
        console.log(reply == '');
        if(reply == null | reply == '')
            chatArr = new Array();
        else
            chatArr =  reply

        client.set('chatSync', chatArr, redis.print)
        socket.emit('chatSync', {chatArr : chatArr});
    });

    client.get('canvasSync' ,function(err, reply){
        console.log(reply == '');
        if(reply == null | reply == '')
            pointArr = new Array();
        else
            pointArr =  reply

        client.set('canvasSync', pointArr, redis.print)
        socket.emit('canvasSync', {pointArr : pointArr});
    });

    socket.on('send', function(data) {
        io.sockets.emit('message'. data);
    })
    socket.on('message', function(data){
        socket.broadcast.emit('message', {name : data.name, message : data.message});

        client.get('chatSync' ,function(err, reply){
            if(reply != null)
                chatArr  = reply
            else
                chatArr = new Array();
        });
        chatArr.push(data);
        client.set('chatSync', chatArr, redis.print);
    });

    var count = 0
    socket.on('draw', function(data){
        socket.broadcast.emit('draw', {
            width : data.width,
            color : data.color,
            x1 : data.x1,
            y1 : data.y1,
            x2 : data.x2,
            y2 : data.y2
        });

        client.get('canvasSync' ,function(err, reply){
            if(reply == null)
                reply = new Array();

            if(pointArr != null)
                reply.concat(pointArr);
            pointArr = new Array();
            client.set('canvasSync', reply, redis.print);
            console.log("b:" + reply + " : " + pointArr);
        })
//        console.log("AAA");
//        console.log("a:" + pointArr);
        pointArr.concat(data);

    });

    socket.on('senddata', function(data){
        socket.broadcast.emit('senddata', {
            strokeWidth : data.strokeWidth,
            strokeColor : data.strokeColor,
            fillColor : data.fillColor,
            authorName : data.authorName,
            authorId : data.authorId,
            id : data.id,
            isFill : data.isFill,
            isErase : data.isErase,
            sendQ : data.sendQ
        });
    });
});



