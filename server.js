var express = require('express')
var http = require('http');
var path = require("path");

var app = express();
var server = http.createServer(app);

var io = require('socket.io').listen(server);

var foundClient = false;
var client = null;

server.listen(8080);


app.get("/", function(request, response){

	app.use(express.static('public'));

	response.sendFile(path.join(__dirname + '/public/index.html'));

	var cookie = parseCookies(request);
	console.log(cookie.userid);
	console.log(cookie);

	client = clientComingBack(cookie.userid);

	if (client != null){

		foundClient = true;
	}

});


var clients = [];
var lfgs = [];
var lfms = [];


io.on('connection', function(socket) {

	if (foundClient){

		client.sid = socket.id;

		socket.emit("clientFound", client);
		foundClient = false;

		if (client.mode == "lfg"){
			lfgs.push(client);
		} else if (client.mode == "lfm"){
			lfms.push(client);
		}
	}

    socket.emit("ready");

    socket.on("test", function(data){

		console.log(data);
		io.to(data.sid).emit("private", {data: "private message!", sid: data.sid});
	});

	socket.on("lfg", function(data){

		if (!clientSearching(data.sid)){
		//console.log(data);
			clients.push({mode: "lfg", summonerName: data.summonerName, region: data.region, sid: data.sid, userid: data.userid});
			lfgs.push({mode: "lfg", summonerName: data.summonerName, region: data.region, sid: data.sid, userid: data.userid});
			matchPlayers();
		}
	});

	socket.on("lfm", function(data){

		if (!clientSearching(data.sid)){

			//console.log(data);
			clients.push({mode: "lfm", howMany: data.howMany, region: data.region, sid: data.sid, userid: data.userid});
			lfms.push({mode: "lfm", region: data.region, howMany: data.howMany, sid: data.sid, userid: data.userid});
			matchPlayers();
		}
	});

	socket.on("disconnect", function(){

		console.log("disconnected", socket.id);
		removeDisconnected(socket.id);
	});
});

function parseCookies (request) {

    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

function matchPlayers(){

	if (lfgs.length > 0 && lfms.length > 0){

		//for(var i = lfms.length-1; i >= 0; i--){
		for (var i = 0; i < lfms.length; i++){
			
			var matches = [];

			var group = lfms[i];

			//for (var k = lfgs.length-1; k >= 0; k--){
			for (var k = 0; k < lfgs.length; k++){
				
				var player = lfgs[k];

				if (group.howMany < 1){
					break;
				}

				if (player.region == group.region && group.howMany > 0){

					matches.push(player);
					lfgs.splice(k,1);
					group.howMany -= 1;
					var index = clients.findIndex(function(x){if(x.sid==group.sid){return true}else{return false}});
					clients.splice(index,1);
				}
			}

			if (matches.length > 0){

				io.to(group.sid).emit("foundPlayer", {data: matches});
			}

			for (var j = 0; j < matches.length; j++){

				io.to(matches[i].sid).emit("foundGroup", null);
			}

			if (group.howMany == 0){

				lfms.splice(i,1);
				var index = clients.findIndex(function(x){if(x.sid==group.sid){return true}else{return false}});
				clients.splice(index,1);
			}

		}
	}

}

function removeDisconnected(sid){

	for (var i = 0; i < lfgs.length; i++){

		if (lfgs[i].sid == sid){

			lfgs.splice(i,1);
			break;
		}
	}

	for (var i = 0; i < lfms.length; i++){

		if (lfms[i].sid == sid){

			lfms.splice(i,1);
			break;
		}
	}
}

function clientSearching(sid){

	var searching = false;

	for (var i = 0; i < clients.length; i++){

		if (clients[i].sid == sid){

			searching = true;
			break;
		}
	}

	return searching;
}

function clientComingBack(userid){

	var client = null;

	for (var i = 0; i < clients.length; i++){

		if (clients[i].userid == userid){

			client = clients[i];
		}
	}

	return client;
}

//From stackoverflow
if (!Array.prototype.findIndex) {
  Object.defineProperty(Array.prototype, 'findIndex', {
    value: function(predicate) {
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }
      var o = Object(this);
      var len = o.length >>> 0;
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      var thisArg = arguments[1];
      var k = 0;
      while (k < len) {
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return k;
        }
        k++;
      }
      return -1;
    }
  });
}
