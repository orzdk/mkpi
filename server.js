
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
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
app.use(cors());

var runtime = "";
var enableSocket = false;
var mongoConnect = false;

process.argv.forEach(function (val, index, array) {
  if( process.argv[index] == '--raspi-gpio' ) runtime = process.argv[index];
  if( process.argv[index] == '--enable-sockets' ) enableSocket = true;
  if( process.argv[index] == '--mongo-connect' ) mongoConnect = true;

});

var socketRegisteredClientsObj = {};
var forwardSerialToSocketClientID = "";


/* Mongo Connect */
if (mongoConnect == true && config.database != "") {
    mongoose.connect(config.database,{useNewUrlParser: true, useUnifiedTopology: true });
    mongoose.Promise = global.Promise;

}

/* Socket Stuff */
if (enableSocket == true){

    var io = require("socket.io").listen(httpsserver);

    io.on('connect', function(client){

        client.on('disconnectmepls', function(){
            console.log('disconnectmepls');
            client.disconnect();
        });

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
            s_port_buffer = Buffer.alloc(0);

        }

    });

}

/* API */

var apiRoutes = express.Router(); 

apiRoutes.post('/command', function(req, res){

    if (s_port){

        var sysex = Buffer.from(req.body.sysex, "hex");
        s_port.write(sysex);

        res.json({ status: 'SUCCESS', message: req.body.cmdid + " rcv", s: sysex });
    } else {
        res.json({ status: 'FAILURE', message: 'Serialport not available', s: sysex });
    }

});

apiRoutes.post('/requestfulldump', function(req, res){

    if ( runtime != '--raspi-gpio' ){
        res.json({ status: 'FAILURE', message: 'Raspi-GPIO Runtime Not Enabled' });
    } else {
          
        forwardSerialToSocketClientID = req.body.socketIdentity;
        s_port_sx = Buffer.from(sxMaker.sxFullDump().full, "hex")
        s_port.write(s_port_sx);
        
        res.json({ status: 'SUCCESS', message: 'full_dump rcv', s: s_port_sx });
    }

});

/* MIDI Rest API - Query GET */

var finish = function(res){
    io.to(forwardSerialToSocketClientID).emit('refreshpush', "Booh");
    res.sendStatus(200);
}

/* Global Functions */

apiRoutes.get('/resethardware', function(req, res){
    var sysex = Buffer.from(sxMaker.sxHwReset().full, "hex")
    s_port.write(sysex);
    finish(res);    
});

apiRoutes.get('/acktoggle', function(req, res){
    var sysex = Buffer.from(sxMaker.sxAckToggle().full, "hex")
    s_port.write(sysex);
    finish(res);    
});

apiRoutes.get('/factorysettings', function(req, res){
    var sysex = Buffer.from(sxMaker.sxFactorySettings().full, "hex")
    s_port.write(sysex);
    finish(res);    
});

apiRoutes.get('/saveflash', function(req, res){
    var sysex = Buffer.from(sxMaker.sxSaveFlash().full, "hex")
    s_port.write(sysex);
    finish(res);    
});

apiRoutes.get('/bootserial', function(req, res){
    var sysex = Buffer.from(sxMaker.sxBootSerial().full, "hex")
    s_port.write(sysex); 
    finish(res);   
});

apiRoutes.get('/fulldump', function(req, res){
    var sysex = Buffer.from(sxMaker.sxFullDump().full, "hex")
    s_port.write(sysex); 
    finish(res);   
});

apiRoutes.get('/resetall', function(req, res){
    var sysex = Buffer.from(sxMaker.sxResetAll().full, "hex")
    s_port.write(sysex); 
    finish(res);   
});


/* USB Device Settings */

apiRoutes.get('/setprodstring/:prodstring', function(req, res){ 
    var sysex = Buffer.from(sxMaker.sxSetProdString(req.params.prodstring));
    s_port.write(sysex);
    finish(res);
});

apiRoutes.get('/setprodstring/:vendID/:prodID', function(req, res){ 
    var sysex = Buffer.from(sxMaker.sxSetVendProdID().vendID(vendID).prodID(prodID));
    s_port.write(sysex);
    finish(res);
});

/* MIDI Clock Settings */

apiRoutes.get('/clockdisable/:clockid', function(req, res){ 
    var sysex = Buffer.from(sxMaker.sxClock(clockid).disable());
    s_port.write(sysex);
    finish(res);
});


apiRoutes.get('/clockenable/:clockid', function(req, res){ 
    var sysex = Buffer.from(sxMaker.sxClock(clockid).enable());
    s_port.write(sysex);
    finish(res);
});

apiRoutes.get('/mtcdisable/:clockid', function(req, res){ 
    var sysex = Buffer.from(sxMaker.sxClock(clockid).disableMTC());
    s_port.write(sysex);
    finish(res);
});


apiRoutes.get('/mtcenable/:clockid', function(req, res){ 
    var sysex = Buffer.from(sxMaker.sxClock(clockid).enableMTC());
    s_port.write(sysex);
    finish(res);
});


apiRoutes.get('/setclockbpm/:clockid/:bpm', function(req, res){ 
    var sysex = Buffer.from(sxMaker.sxClock(clockid).setBPM(bpm));
    s_port.write(sysex);
    finish(res);
});

/* IntelliThru */

apiRoutes.get('/resetroutingithru', function(req, res){
    var sysex = Buffer.from(sxMaker.sxResetIThru().full, "hex")
    s_port.write(sysex);
    finish(res);
});

apiRoutes.get('/disableallithru', function(req, res){
    var sysex = Buffer.from(sxMaker.sxDisableAllIThru().full, "hex")
    s_port.write(sysex);
    finish(res);
});

apiRoutes.get('/resetroutingithru/:usbidle', function(req, res){
    var sysex = Buffer.from(sxMaker.sxSetUSBIdle(usbidle).full, "hex")
    s_port.write(sysex);
    finish(res);
});

apiRoutes.get('/toggleiroute/:srcID/:tgtType/:tgtIDs', function(req, res){
    var tgtids = JSON.parse(decodeURIComponent(req.params.tgtIDs));
    var sysex = Buffer.from(sxMaker.sxIntelliRoute().srcID(req.params.srcID).tgtType(req.params.tgtType).tgtIDs(tgtids).full);
    s_port.write(sysex);
    finish(res);
});


/* Routes */

apiRoutes.get('/resetrouting', function(req, res){
    var sysex = Buffer.from(sxMaker.sxResetRoutes().full, "hex")
    s_port.write(sysex);
    finish(res);
});

apiRoutes.get('/route/:srcType/:srcID/:tgtType/:tgtIDs', function(req, res){
    var tgtids = JSON.parse(decodeURIComponent(rp.tgtIDs));
    var sysex = Buffer.from(sxMaker.sxRoute().srcType(req.params.srcType).srcID(req.params.srcID).tgtType(req.params.tgtType).tgtIDs(tgtids).full);
    s_port.write(sysex);
    finish(res);
});


/* Bus Mode */

apiRoutes.get('/enablebus', function(req, res){
    var sysex = Buffer.from(sxMaker.sxEnableBus().full, "hex")
    s_port.write(sysex);
    finish(res);    
});

apiRoutes.get('/disablebus', function(req, res){
    var sysex = Buffer.from(sxMaker.sxDisableBus().full, "hex")
    s_port.write(sysex); 
    finish(res);   
});

apiRoutes.get('/setdeviceid/:busID', function(req, res){
    var rp = req.params;
    var sysex = Buffer.from(xMaker.setBusID(rp.busID).full);
    s_port.write(sysex);
    finish(res);
});


/* Transformations - Pipelines */

apiRoutes.get('/attachpipeline/:pipelineID/:portType/:portID', function(req, res){ 
    var sysex = Buffer.from(sxMaker.sxPipeline(req.params.pipelineID).attachPort().portType(req.params.portType).portID(req.params.portID));
    s_port.write(sysex);
    finish(res);
});

apiRoutes.get('/detachpipeline/:portType/:portID', function(req, res){
    var sysex = Buffer.from(sxMaker.sxPipeline().clearPort().portType(req.params.portType).portID(req.params.portID));
    s_port.write(sysex);
    finish(res);
});


/* Transformations - Pipes */

apiRoutes.get('/addpipe/:pipelineID/:pipeID/:pp1/:pp2/:pp3/:pp4', function(req, res){
    var rp = req.params;
    var sysex = Buffer.from(sxMaker.sxAddPipe(rp.pipelineID).pipeID(rp.pipeID).parms(rp.pp1, rp.pp2, rp.pp3, rp.pp4).full);  
    s_port.write(sysex); 
    finish(res);
});

apiRoutes.get('/insertpipe/:pipelineID/:pipelineSlotID/:pipeID/:pp1/:pp2/:pp3/:pp4', function(req, res){
    var rp = req.params;
    var sysex = Buffer.from(sxMaker.sxInsertPipe(rp.pipelineID).slotID(rp.slotID).pipeID(rp.pipeID).parms(rp.pp1, rp.pp2, rp.pp3, rp.pp4).full);
    s_port.write(sysex);
    finish(res);
});

apiRoutes.get('/replacepipe/:pipelineID/:pipelineSlotID/:pipeID/:pp1/:pp2/:pp3/:pp4', function(req, res){
    var rp = req.params;
    var sysex = Buffer.from(sxMaker.sxReplacePipe(rp.pipelineID).slotID(rp.slotID).pipeID(rp.pipeID).parms(rp.pp1, rp.pp2, rp.pp3, rp.pp4).full);
    s_port.write(sysex);
    finish(res);
});

apiRoutes.get('/clearpipe/:pipelineID/:pipelineSlotID', function(req, res){
    var rp = req.params;
    var sysex = Buffer.from(sxMaker.sxClearPipe(rp.pipelineID).slotID(rp.slotID).full);
    s_port.write(sysex);
    finish(res);
});

apiRoutes.get('/bypasspipe/:pipelineID/:pipelineSlotID', function(req, res){
    var sysex = Buffer.from(sxMaker.sxBypassPipe(req.params.pipelineID).slotID(req.params.slotID).full);
    s_port.write(sysex);
    finish(res);
});

apiRoutes.get('/releasebypasspipe/:pipelineID/:pipelineSlotID', function(req, res){
    var rp = req.params;
    var sysex = Buffer.from(sxMaker.sxReleaseBypassPipe(rp.pipelineID).slotID(rp.slotID).full);
    s_port.write(sysex);
    finish(res);
});

/* Sysinfo */

apiRoutes.post('/sysinfo', function(req, res){
    var message = "on " + s_port_name; 
    if (!s_port) message = "[error 1: no serial]";
    
    res.json({ status: 'SUCCESS', message });
    
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
            SysexRecord.find( {user:req.body.user }, function(err, docs){
                if (err) {
                    res.json({ status: 'ERROR', message: err });
                } else {
                    res.json({ status: 'SUCCESS', message: docs });
                }
            });
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
