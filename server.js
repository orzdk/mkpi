
/* Standard Includes */

var express = require('express');
var http = require("http");
var https = require("https");
var fs = require("fs");
var bodyParser = require('body-parser');
var config = require('./config-mk');
var mongoose = require('mongoose');
var SysexRecord = require('./models/SysexRecord.js');

port = 8001;

var app = express(); 

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
    next();
});

const httpsOptions = {
  key: fs.readFileSync('key.pem', 'utf8'),
  cert: fs.readFileSync('cert.pem', 'utf8'),
  passphrase: 'boohoo'
};

var server = http.createServer(app).listen(port);
var httpsserver = https.createServer(httpsOptions, app).listen(443);

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());    
app.use(bodyParser.urlencoded({extended: true}));    


/* Socket Stuff *************************/

var io = require("socket.io").listen(httpsserver);
var socketRegisteredClientsObj = {};
var socketClientID = "";

io.on('connect', function(client){

    var dumpStatus = function(){
        console.log("-------------------------------------------------");
        console.log("socketRegisteredClientsObj",socketRegisteredClientsObj);
        console.log("-------------------------------------------------");
    }

    client.on('register', function(data){
        clientObj =  { app: data.app, mkumlid: data.mkid, socketclientid: client.id};
        socketRegisteredClientsObj[client.id] = clientObj;
        client.emit('registered', clientObj);
        dumpStatus();
    });

    client.on('toggleroute', function(data){

        if (socketRegisteredClientsObj){
            socketRegisteredClientsObj.forEach(function(co){
                if (co.type=='mkuml' && co.mkid == data.mkid){
                    console.log("mkuml for " + data.mkid + "found @ " + JSON.stringify(socketRegisteredClientsObj[client.id].clientid));
                    io.to(co.clientid).emit('toggleroute', data);
                }
            });
        }

        dumpStatus();

    });

    client.on('disconnect', function(){
        delete socketRegisteredClientsObj[client.id];
        dumpStatus();

    });

});

/* Raspi GPIO UART Runtime */

var serialport = require("serialport");
const Delimiter = require('@serialport/parser-delimiter')
const Ready = require('@serialport/parser-ready')
var portName = '/dev/ttyAMA0'; 

const sxm = require('./public/js/sysexmaker');
const ConvertBase = require('./public/js/baseconverter');

var serialPortConfig = {
  baudRate: 31250,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
  flowControl: false,
  autoOpen: true
}

var sxMaker = new sxm.sysexMaker.sxMaker(1);
var s_port = new serialport(portName, serialPortConfig);
var s_port_buffer = Buffer.alloc(0);

s_port.on('open', function(){
    console.log("Serialport Opened");
});

s_port.on('data', function (s_port_data) {
    
    s_port_buffer = Buffer.concat([s_port_buffer, s_port_data]);

    if (s_port_buffer.includes("F0777778100104F7",0,"hex")){

        var bufText = s_port_buffer.toString("hex").toUpperCase().split("F7").map((d) => d + "F7");
        io.to(socketClientID).emit('sysexdata', bufText);
        socketClientID == "";
        
    }

});

/* Midi Runtime */

var midi_runtime = process.argv[2];

if (midi_runtime == '--web-midi'){

} else if (midi_runtime == '--raspi-gpio'){

}

/* File Ops */ 

var writeFile = (fileName, objToSave, callback) => {
    fs.writeFile("data/" + fileName, JSON.stringify(objToSave, null, 2), function(err) {
        if(err) {
            callback({status:err});
        } else {
            callback({status:'OK'});
        }
    }); 
}

var writeFlatFile = (fileName, objToSave, callback) => {
    fs.writeFile("data/" + fileName, objToSave, function(err) {
        if(err) {
            callback({status:err});
        } else {
            callback({status:'OK'});
        }
    }); 
}

/* Mongo */

if (config.database != "") {
    mongoose.connect(config.database,{useNewUrlParser: true, /* useUnifiedTopology: true */});
    mongoose.Promise = global.Promise;
}

/* API */

var apiRoutes = express.Router(); 

apiRoutes.post('/requestfulldump', function(req, res){

    if ( socketClientID == ""){
        
        socketClientID = req.body.socketclientid;

        var a = Buffer.from(sxMaker.sxFullDump(), "hex");
        s_port.write(a);
        
        res.json({ status: 'SUCCESS', message: 'Full dump requested, please wait', fromIdentity: req.body });
    } else {
        res.json({ status: 'FAILURE', message: 'Unit busy, please try again', fromIdentity: req.body });
    }

});


apiRoutes.post('/deletescene', function(req, res){

    var sceneObj = { 
        user: req.body.user.trim(), 
        scene: req.body.scene.trim()
    };

    SysexRecord.deleteMany(sceneObj, function (err) {
        if(err) console.log(err);
    });

});

apiRoutes.post('/createsysexrecords', function(req, res){

    var sysexRecord = [{ 
        user: req.body.user.trim(), 
        scene: req.body.scene.trim(), 
        sysex: req.body.sysex
    }];

    
    SysexRecord.collection.insert(sysexRecord, (err, docs)=>{
        if (err) {
            res.json({ status: 'ERROR', message: err });
        } else {
            res.json({ status: 'SUCCESS', message: 'Record inserted' });
        }
    });

});

apiRoutes.post('/findscenerecords', function(req, res){
  
    SysexRecord.find( {user:req.body.user, scene:req.body.scene}, function(err, docs){
        if (err) {
            res.json({ status: 'ERROR', message: err });
        } else {
            res.json({ status: 'SUCCESS', message: docs });
        }
    });

});

apiRoutes.post('/findscenes', function(req, res){

	SysexRecord.collection.distinct("scene", { user: req.body.user }, function(err, scenes) {
	    if (err) {
	        res.json({ status: 'ERROR', message: err });
	    } else {
	        res.json({ status: 'SUCCESS', message: scenes });
	    }
	});

});

app.use('/api', apiRoutes);

console.log("SysexUML-Server @ http://localhost:" + port + ", CTRL + C to shutdown");
console.log("SysexUML-Server @ https://localhost, CTRL + C to shutdown");
