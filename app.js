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
var rid=0;

client.on("error", function(err) {
    console.log("Error " + err)
});

// socket.io example
var io = require('socket.io').listen(server)
var util= require('util');
var chatArr = new Array();

io.sockets.on('connection', function(socket){
    socket.emit('message', {message : 'welcome to the chat'});
    socket.emit('chatSync', {chatArr : chatArr});

    socket.on('joinRoom',function(data){
        console.log("JOIN"+data.key);

        socket.set('room',"A"+data.key,function(){
            console.log("room"+data.key);
        });

        socket.join("A"+data.key);

        client.llen("A"+data.key, function(err,reply){
            for(var j=0;j<reply;j++){
                client.lindex("A"+data.key,j, function(err,data){
                    socket.emit('senddata',JSON.parse(data));
                });
            }
        });
    });

    socket.on('send', function(data) {
        io.sockets.emit('message'. data);
    });

    socket.on('message', function(data){
        socket.broadcast.emit('message', {name : data.name, message : data.message});
        chatArr.push(data);
    });

    socket.on('redis', function(data){
//        client.hgetall(0,function(err, reply){console.log(reply.points)});
    });

    socket.on('senddata', function(data){
        socket.broadcast.to('A'+data.key).emit('senddata', {
            strokeWidth : data.strokeWidth,
            strokeColor : data.strokeColor,
            fillColor : data.fillColor,
            authorName : data.authorName,
            authorId : data.authorId,
            id : data.id,
            isFill : data.isFill,
            isErase : data.isErase,
            points : data.points
        });

        client.rpush("A"+data.key, JSON.stringify(data,null,4), redis.print);
    });

    socket.on('clear', function(data)
    {
        socket.broadcast.emit('clear');
        socket.emit('clear');
        client.del('A0');
    });


});