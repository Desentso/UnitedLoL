var id;
var socket = io.connect("http://localhost:8080/");

var searching = false;

$(document).ready(function(){
  
  var findGroupBtn = document.getElementById("findg");
  var haveGroupBtn = document.getElementById("haveg");

  findGroupBtn.addEventListener("click", function(){findGroup()});
  haveGroupBtn.addEventListener("click", function(){haveGroup()});

  socket.on("time", function(data){
    //console.log(data.time);
  });
  
  socket.on("ready", function(){

    socket.emit("test", {sid: socket.id});
  });

  socket.on("private", function(data){
    console.log(data);
  });

  if (document.cookie === ""){

    var userId = "";

    for (var i = 0; i < 5; i++){
      userId += Math.round(Math.random() * 9).toString();
    }

    userId += new Date().getTime();

    console.log(userId);

    document.cookie = "userid=" + userId + "; expires=tomorrow;";
  };
  console.log(document.cookie);

});

$("#find").on("click", function(){
  
  if (!searching){

    searching = true;

    $(".findGroup").hide();
    
    var name = $("#nameInput").val();
    var region = $("#region").val();
    console.log(name);
    
    $("#mode").text("group...");
    $(".searching").show();

    var userId = document.cookie.split(";")[0].split("=")[1];
    socket.emit("lfg", {summonerName: name, region: region, sid: socket.id, userid: userId});
  };
});

$(".num").on("click", function(){
  
  if (!searching){

    searching = true;

    $(".haveGroup").hide();
    var players = this.id;
    
    $("#mode").text("players...");
    $(".searching").show();
    
    var userId = document.cookie.split(";")[0].split("=")[1];

    socket.emit("lfm", {sid: socket.id, howMany: players, region: "EUW", userid: userId});
  };
});

function findGroup(){
  
  if (!searching){
    $(".appArea").show();
    $(".haveGroup").hide();
    $(".findGroup").show();
    $("#nameInput").focus();
  }
}

function haveGroup(){
  
  if (!searching){
    $(".appArea").show();
    $(".findGroup").hide();
    $(".haveGroup").show();
    $(".appArea").focus();
  }  
}

socket.on("foundGroup", function(data){

  $(".searching").hide();
  $(".data").show();

  $("#alert").text("Found Group!");
});

socket.on("foundPlayer", function(data){

  $(".searching").hide();
  $(".data").show();

  $("#alert").text("Found Players!");

  console.log(data);
  for (var i = 0; i < data.data.length; i++){
    $(".data").append("<p class='summoner'>Summoner Name: <span class='sName'>" + data.data[i].summonerName + "</span></p>");//<p>" + data.data[0].region + "</p>");
  }
});

socket.on("clientFound", function(data){

  console.log(data);
  searching = true;
  if (data.mode == "lfg"){

    $("#mode").text("group...");
    $(".searching").show();
  } else if (data.mode == "lfm"){

    $("#mode").text("players...");
    $(".searching").show();
  }

});
