
/* Includes & Express */

var express = require('express');
var http = require("http");
var https = require("https");
var cors = require('cors');
var fs = require("fs");
var bodyParser = require('body-parser');
var config = require('./config-mk');
var mongoose = require('mongoose');
var SysexRecord = require('./models/SysexRecord.js');

const sxm = require('./public/js/sysexmaker');
var sxMaker = new sxm.sysexMaker.sxMaker();

var s_port;
var s_port_buffer = Buffer.alloc(0);
var s_port_name = '/dev/ttyAMA0'; 
var s_port_sx = "";

var port = 8001;

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
app.use(cors());

var runtime = "";
var enableSocket = false;
var mongoConnect = false;

process.argv.forEach(function (val, index, array) {
  if( process.argv[index] == '--raspi-gpio' ) runtime = process.argv[index];
  if( process.argv[index] == '--enable-sockets' ) enableSocket = true;
  if( process.argv[index] == '--mongo-connect' ) mongoConnect = true;

});

/* Mongo Connect */

if (mongoConnect == true && config.database != "") {
    mongoose.connect(config.database,{useNewUrlParser: true, useUnifiedTopology: true });
    mongoose.Promise = global.Promise;

}

/* Socket Stuff */

var socketRegisteredClientsObj = {};
var forwardSerialToSocketClientID = "";

if (enableSocket == true){

    var io = require("socket.io").listen(httpsserver);

    io.on('connect', function(client){

        client.on('register', function(data){
            clientObj =  { app: data.app, mkumlid: data.mkid, socketclientid: client.id };
            socketRegisteredClientsObj[client.id] = clientObj;
            client.emit('registered', client.id);
        });

        client.on('toggleroute', function(data){
            if (socketRegisteredClientsObj){

                socketRegisteredClientsObj.forEach(function(clientObj){
                    if (clientObj.app == 'mkuml' && clientObj.mkid == data.mkid){
                        io.to(co.socketclientid).emit('remotetoggleroute', data);
                    }
                });

            }
        });

        client.on('disconnect', function(){
            delete socketRegisteredClientsObj[client.id];
        });

    });

}

/* Raspi GPIO UART Runtime */

if (runtime == '--raspi-gpio'){

    var serialport = require("serialport");

    var s_port_config = {
      baudRate: 31250,
      dataBits: 8,
      parity: 'none',
      stopBits: 1,
      flowControl: false,
      autoOpen: true
    }

    s_port = new serialport(s_port_name, s_port_config);

    s_port.on('open', function(){
        console.log("serial/open");
    });

    s_port.on('data', function (s_port_data) {
        
        s_port_buffer = Buffer.concat([s_port_buffer, s_port_data]);

        if (s_port_buffer.includes("F0777778100104F7", 0, "hex")){

            var bufText = s_port_buffer.toString("hex").toUpperCase().split("F7").map((d) => d + "F7");
            io.to(forwardSerialToSocketClientID).emit('sysexdata', bufText);

            forwardSerialToSocketClientID = "";

        }

    });

}

/* API */

var apiRoutes = express.Router(); 

var initiateDump = function(sysex){
    s_port_buffer = Buffer.alloc(0);
    s_port_sx = Buffer.from(sxMaker.sxFullDump().full, "hex")
    s_port.write(s_port_sx);
}

apiRoutes.post('/command', function(req, res){

    console.log("api/command" + req.body.cmdid);

    if (s_port){

        var sysex = Buffer.from(req.body.sysex, "hex");
        s_port.write(sysex);

        res.json({ status: 'SUCCESS', message: req.body.cmdid + " rcv", s: sysex });
    } else {
        res.json({ status: 'FAILURE', message: 'Serialport not available', s: sysex });
    }

});

apiRoutes.post('/requestfulldump', function(req, res){

    console.log("api/requestfulldump");

    if ( runtime != '--raspi-gpio' ){
        res.json({ status: 'FAILURE', message: 'Raspi-GPIO Runtime Not Enabled' });
    } else {

        if ( forwardSerialToSocketClientID == ""){
            
            forwardSerialToSocketClientID = req.body.socketIdentity;
            initiateDump();
            
            res.json({ status: 'SUCCESS', message: 'full_dump rcv', s: s_port_sx });

        } else {

            res.json({ status: 'FAILURE', message: 'System busy or crashed, please try again' });
        }

    }

});

/* MIDI Rest API - Query GET */

apiRoutes.get('/resetrouting', function(req, res){
    var sysex = Buffer.from(sxMaker.sxResetRoute(), "hex")
    s_port.write(sysex);
});

apiRoutes.get('/resetirouting', function(req, res){
    var sysex = Buffer.from(sxMaker.sxResetIThru(), "hex")
    s_port.write(sysex);
});

apiRoutes.get('/resethardware', function(req, res){
    var sysex = Buffer.from(sxMaker.sxHwReset(), "hex")
    s_port.write(sysex);    
});

apiRoutes.get('/bootserial', function(req, res){
    var sysex = Buffer.from(sxMaker.sxBootSerial(), "hex")
    s_port.write(sysex);    
});

apiRoutes.get('/enablebus', function(req, res){
    var sysex = Buffer.from(sxMaker.sxEnableBus(), "hex")
    s_port.write(sysex);    
});

apiRoutes.get('/disablebus', function(req, res){
    var sysex = Buffer.from(sxMaker.sxDisableBus(), "hex")
    s_port.write(sysex);    
});

apiRoutes.get('/attachpipeline/:pipelineID/:srctype/:srcid', function(req, res){
    var rp = req.params;
    var sysex = Buffer.from(sxMaker.sxAttachPipeline(rp.pipelineID).srcType(rp.srctype).srcID(rp.srcid));
    s_port.write(sysex);
});

apiRoutes.get('/detachpipeline/:srctype/:srcid', function(req, res){
    var rp = req.params;
    var sysex = Buffer.from(sxMaker.sxDetachPipeline().srcType(rp.srctype).srcID(rp.srcid));
    s_port.write(sysex);
});

apiRoutes.get('/addpipe/:pipelineID/:pipeID/:pp1/:pp2/:pp3/:pp4', function(req, res){
    var rp = req.params;
    var sysex = Buffer.from(sxMaker.sxAddPipeToPipeline(rp.pipelineID).pipeID(rp.pipeID).parameters(rp.pp1, rp.pp2, rp.pp3, rp.pp4));  
    s_port.write(sysex); 
});

apiRoutes.get('/insertpipe/:pipelineID/:pipelineSlotID/:pipeID/:pp1/:pp2/:pp3/:pp4', function(req, res){
    var rp = req.params;
    var sysex = Buffer.from(sxMaker.sxInsertPipeToPipeline(rp.pipelineID).pipelineSlotID(rp.pipelineSlotID).pipeID(rp.pipeID).parameters(rp.pp1, rp.pp2, rp.pp3, rp.pp4));
    s_port.write(sysex);
});

apiRoutes.get('/replacepipe/:pipelineID/:pipelineSlotID/:pipeID/:pp1/:pp2/:pp3/:pp4', function(req, res){
    var rp = req.params;
    var sysex = Buffer.from(sxMaker.sxReplacePipeInPipeline(rp.pipelineID).pipelineSlotID(rp.pipelineSlotID).pipeID(rp.pipeID).parameters(rp.pp1, rp.pp2, rp.pp3, rp.pp4));
    s_port.write(sysex);
});

apiRoutes.get('/clearpipe/:pipelineID/:pipelineSlotID', function(req, res){
    var rp = req.params;
    var sysex = Buffer.from(sxMaker.sxClearPipelineSlot(rp.pipelineID).pipelineSlotID(rp.pipelineSlotID));
    s_port.write(sysex);
});

apiRoutes.get('/bypasspipe/:pipelineID/:pipelineSlotID', function(req, res){
    var rp = req.params;
    var sysex = Buffer.from(sxMaker.sxBypassPipelineSlot(rp.pipelineID).pipelineSlotID(rp.pipelineSlotID));
    s_port.write(sysex);
});

apiRoutes.get('/releasebypasspipe/:pipelineID/:pipelineSlotID', function(req, res){
    var rp = req.params;
    var sysex = Buffer.from(sxMaker.sxReleaseBypassPipelineSlot(rp.pipelineID).pipelineSlotID(rp.pipelineSlotID));
    s_port.write(sysex);
});

apiRoutes.get('/setdeviceid/:busID', function(req, res){
    var rp = req.params;
    var sysex = Buffer.from(xMaker.setBusID(rp.busID));
    s_port.write(sysex);
});

apiRoutes.get('/toggleroute/:srcType/:srcID/:tgtType/:tgtIDs', function(req, res){
    var rp = req.params;
    var tgtids = JSON.parse(decodeURIComponent(rp.tgtIDs));
    var sysex = Buffer.from(sxMaker.sxRoute().srcType(rp.srcType).srcID(rp.srcID).tgtType(rp.tgtType).tgtIDs(rp.tgtids));
    s_port.write(sysex);
});

apiRoutes.get('/toggleiroute/:srcID/:tgtType/:tgtIDs', function(req, res){
    var rp = req.params;
    var tgtids = JSON.parse(decodeURIComponent(rp.tgtIDs));
    var sysex = Buffer.from(sxMaker.sxIntelliRoute().srcID(rp.srcID).tgtType(rp.tgtType).tgtIDs(rp.tgtIDs));
    s_port.write(sysex);
});

/* MIDI Rest API - Body Post */

apiRoutes.post('/sysinfo', function(req, res){
    var message = "on " + s_port_name; 
    if (!s_port) message = "[error 1: no serial]";
    
    res.json({ status: 'SUCCESS', message });
    
});

apiRoutes.post('/resetrouting', function(req, res){
    var sysex = Buffer.from(sxMaker.sxResetRoute(), "hex")
    s_port.write(sysex);
});

apiRoutes.post('/resetirouting', function(req, res){
    var sysex = Buffer.from(sxMaker.sxResetIThru(), "hex")
    s_port.write(sysex);
});

apiRoutes.post('/resethardware', function(req, res){
    var sysex = Buffer.from(sxMaker.sxHwReset(), "hex")
    s_port.write(sysex);    
});

apiRoutes.post('/bootserial', function(req, res){
    var sysex = Buffer.from(sxMaker.sxBootSerial(), "hex")
    s_port.write(sysex);    
});

apiRoutes.post('/enablebus', function(req, res){
    var sysex = Buffer.from(sxMaker.sxEnableBus(), "hex")
    s_port.write(sysex);    
});

apiRoutes.post('/disablebus', function(req, res){
    var sysex = Buffer.from(sxMaker.sxDisableBus(), "hex")
    s_port.write(sysex);    
});

apiRoutes.post('/attachpipeline', function(req, res){
    var rb = req.body;
    var sysex = Buffer.from(sxMaker.sxAttachPipeline(rb.pipelineID).srcType(rb.srctype).srcID(rb.srcid));
    s_port.write(sysex);
});

apiRoutes.post('/detachpipeline', function(req, res){
    var rb = req.body;
    var sysex = Buffer.from(sxMaker.sxDetachPipeline().srcType(rb.srctype).srcID(rb.srcid));
    s_port.write(sysex);
});

apiRoutes.post('/addpipe', function(req, res){
    var rb = req.body;
    var sysex = Buffer.from(sxMaker.sxAddPipeToPipeline(rb.pipelineID).pipeID(rb.pipeID).parameters(rb.pp1, rb.pp2, rb.p3, rb.pp4));  
    s_port.write(sysex); 
});

apiRoutes.post('/insertpipe', function(req, res){
    var rb = req.body;
    var sysex = Buffer.from(sxMaker.sxInsertPipeToPipeline(rb.pipelineID).pipelineSlotID(rb.pipelineSlotID).pipeID(rb.pipeID).parameters(rb.pp1, rb.pp2, rb.pp3, rb.pp4));
    s_port.write(sysex);
});

apiRoutes.post('/replacepipe', function(req, res){
    var rb = req.body;
    var sysex = Buffer.from(sxMaker.sxReplacePipeInPipeline(rb.pipelineID).pipelineSlotID(rb.pipelineSlotID).pipeID(rb.pipeID).parameters(rb.pp1, rb.pp2, rb.pp3, rb.pp4));
    s_port.write(sysex);
});

apiRoutes.post('/clearpipe', function(req, res){
    var rb = req.body;
    var sysex = Buffer.from(sxMaker.sxClearPipelineSlot(rb.pipelineID).pipelineSlotID(rb.pipelineSlotID));
    s_port.write(sysex);
});

apiRoutes.post('/bypasspipe', function(req, res){
    var rb = req.body;
    var sysex = Buffer.from(sxMaker.sxBypassPipelineSlot(rb.pipelineID).pipelineSlotID(rb.pipelineSlotID));
    s_port.write(sysex);
});

apiRoutes.post('/releasebypasspipe', function(req, res){
    var rb = req.body;
    var sysex = Buffer.from(sxMaker.sxReleaseBypassPipelineSlot(rb.pipelineID).pipelineSlotID(rb.pipelineSlotID));
    s_port.write(sysex);
});

apiRoutes.post('/setdeviceid', function(req, res){
    var rb = req.body;
    var sysex = Buffer.from(sxMaker.setBusID(rb.busID));
    s_port.write(sysex);
});

apiRoutes.post('/toggleroute', function(req, res){
    var rb = req.body;
    var sysex = Buffer.from(sxMaker.sxRoute().srcType(rb.srcType).srcID(rb.rcID).tgtType(rb.tgtType).tgtIDs(rb.tgtIDs));
    s_port.write(sysex);
});

apiRoutes.post('/toggleiroute', function(req, res){
    var rb = req.body;
    var sysex = Buffer.from(sxMaker.sxIntelliRoute().srcID(rb.srcID).tgtType(rb.tgtType).tgtIDs(rb.tgtIDs));
    s_port.write(sysex);
});


/* Scenes */

apiRoutes.post('/deletescene', function(req, res){

    var sceneObj = { 
        user: req.body.user.trim(), 
        scene: req.body.scene.trim()
    };

    SysexRecord.deleteMany(sceneObj, function (err) {
        if(err) console.log(err);
        res.json({ status: 'SUCCESS', message: 'Scene cleared' });
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
