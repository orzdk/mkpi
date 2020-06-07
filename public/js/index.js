
var cableJackE = { 0: "cable", 1: "jack", 2: "virtual" };
var directionE = { 0: "down", 1: "right" };
var rankerE = 	 { 0: "network-simplex", 1: "tight-tree", 2: "longest-path" };

var inputsE = {
	'cablein': { min: 0, max: 5, canvas: cableCanvas },
	'jackin': { min: 0, max: 5, canvas: jackCanvas },
	'jackithru': { min: 0, max: 5, canvas: jackithruCanvas },
	'cableout': { min: 0, max: 5 },
	'jackout': { min: 0, max: 5 },
	'virtualin': { min: 0, max: 5 , canvas: virtualCanvas},
	'virtualout': { min: 0, max: 5 }
};

var sxMaker = new sysexMaker.sxMaker();
var selectedToggle = { srctype:0, srcid:0, tgttype: 1, tgtid: 0 };
var pipelinePositionsBlank = ["1:","2:","3:","4:","5:","6:","7:","8:"];
var pipelinePositions = JSON.parse(JSON.stringify(pipelinePositionsBlank));

var globalFontsize = 10;
var globalSpacing = 20;
var globalPadding = 5;
var globalDirectionVal = 1;
var globalRankerVal = 0;
var globalEdgeMargin = 0;
var globalShowParmDetails = 1;
var globalShowFreeSlots = 0;
var globalShowVirtuals = 1;
var globalLoopbackDisplay = 1;
var globalEdges = 'rounded';
var globalBendSize = 8;
var globalLineWidth = 2;
var globalGutter = 20;
var globalTitle = "UMKUML";
var globalAcyclicer = "greedy";
var globalZoom = 9;
var globalIdentity = "Waiting for identity...";
var globalVendorProduct = "Waiting for product/vendor id";

var PORTS = [];
var PIPEDEF = {};
var ENUMS = {};
var RESET_PIPES = [];

var umlHeader = "";
var intelliInputs = {};
var frames = {};	
var sysexRecords = [];
var renderObject = {};
var user = "";
var render = false;

var activeRuntime = "none";
var webmidiConnected = false;

var socket;
var socketIdentity = {};

$(document).ready(function(){
	var newUser = "MK" + parseInt(Math.random() * 100000000000);
	cookieUser = $.cookie('mkusername');
	if(!cookieUser){
		$("#userinfo").val(newUser);
		user = newUser;	
	} else {
		$("#userinfo").val(cookieUser);
		user = cookieUser;
	}
});


var toByteArray = function(hexString) {

  var result = [];
  for (var i = 0; i < hexString.length; i += 2) {
    result.push(parseInt(hexString.substr(i, 2), 16));
  }
  return result;

}

WebMidi.enable(function (err) {

	var refreshInputOutputLists = function(){

		var $inputs = $("#midiInputSelect");	  		
		var $outputs = $("#midiOutputSelect");

		$inputs.empty();
		$outputs.empty();

		$.each(WebMidi.inputs, function(i,o) {
			$inputs.append($("<option />").val(o.name).text(o.name));
		});

		$.each(WebMidi.outputs, function(i,o) {
			$outputs.append($("<option />").val(o.name).text(o.name));
		});

	}

	if (err) {
		console.log("WebMidi could not be enabled.", err);
		activeRuntime = "none";

	} else {
		console.log("WebMidi enabled!");
		activeRuntime = "webmidi";
		webmidiConnected = true;
		refreshInputOutputLists();
	}

	/*Init & Utils */

	var clearRenderObject = function(){
		
		render = false;

		renderObject.routes = [];
		renderObject.intelliRoutes = [];
		renderObject.pipes = { 
			pipeLines: [
				{ slotid:1, attachedTo: [] },
				{ slotid:2, attachedTo: [] },
				{ slotid:3, attachedTo: [] },
				{ slotid:4, attachedTo: [] },
				{ slotid:5, attachedTo: [] },
				{ slotid:6, attachedTo: [] },
				{ slotid:7, attachedTo: [] },
				{ slotid:8, attachedTo: [] }
		  	], 
		  	pipeSlots: [
		  	] 
		};

	}

	var refreshPipelineSlotPositions = function(){

		$("#pipelineSlotIdx").empty();

		pipelinePositions = JSON.parse(JSON.stringify(pipelinePositionsBlank));

		renderObject.pipes.pipeSlots.forEach((slot)=>{
			if (slot.slotid == $("#pipelineID").val()){
				pipelinePositions[slot.pipeidx] = (slot.pipeidx+1) + ": " + PIPEDEF[slot.pipeid].title;
			} 
		});
		
		for (i=0;i<8;i++){
			$("#pipelineSlotIdx").append($("<option />").val(i).text(pipelinePositions[i]));
		}

	}

	var updateNomnomHeader = function(){

		umlHeader =  "#fontSize: " + globalFontsize + "\r\n";
		umlHeader += "#spacing: " + globalSpacing + "\r\n";
		umlHeader += "#padding: " + globalPadding + "\r\n";
		umlHeader += "#direction: " + directionE[globalDirectionVal] + "\r\n";
		umlHeader += "#ranker: " + rankerE[globalRankerVal] + "\r\n";
		umlHeader += "#edgeMargin:" + globalEdgeMargin + "\r\n";
		umlHeader += "#edges:" + globalEdges + "\r\n";
		umlHeader += "#bendSize: " + globalBendSize/10 + "\r\n";
		umlHeader += "#lineWidth: " + globalLineWidth + "\r\n";
		umlHeader += "#gutter: " + globalGutter + "\r\n";
		umlHeader += "#title: " + globalTitle + "\r\n";
		umlHeader += "#acyclicer: " + globalAcyclicer + "\r\n";
		umlHeader += "#zoom: " + globalZoom/10 + "\r\n";

		umlHeader += "#.cablein: fill=#81C47D \r\n";
		umlHeader += "#.cableout: fill=#6FA86B \r\n";
		umlHeader += "#.jackin: fill=#C67F7D \r\n";
		umlHeader += "#.jackithru: fill=#C67F7D \r\n";
		umlHeader += "#.jackout: fill=#B57473 \r\n";
		umlHeader += "#.virtualin: fill=#9999DD stroke=#000\r\n";
		umlHeader += "#.virtualout: fill=#8888AA stroke=#000\r\n";
		umlHeader += "#.blocked: stroke=#700 dashed\r\n";
		umlHeader += "#.loopback: stroke=#007  \r\n";
		umlHeader += "#.bypass: fill=#ccc dashed \r\n";
		umlHeader += "#.selected: fill=#cccc00 \r\n";
		umlHeader += "#.stroke: fill=#000 \r\n";
		umlHeader += "#.unusedjack: fill=#fdd \r\n";
		umlHeader += "#.unusedcable: fill=#dfd \r\n";
		umlHeader += "#.unusedvirtual: fill=#ddf \r\n";

	}

	var bitmaskValue = function(){

		var a = $("#cbm_channel_voice").is(":checked") ? 1 : 0;
		var b = $("#cbm_common").is(":checked") ? 2: 0;
		var c = $("#cbm_realtime").is(":checked") ? 4 : 0;
		var d = $("#cbm_sysex").is(":checked") ? 8 : 0;

		return (a+b+c+d);
	}

	var refreshParameterUI1234 = function(parameterID){
		
		var placeholder = "";
		var selectedPipeID = $("#pipeID").val();
		var selectedPipeDefinition = PIPEDEF[selectedPipeID];	

		var pfield = "p" + parameterID;
		var pselect = "#pp" + parameterID; 
		var ptext = "#pp" + parameterID + "t";
		var plabel = "#p" + parameterID + "l";
		var pcb = "#pp" + parameterID + "cb";

		var obj;

		if (parameterID == 1){

			$(plabel).text(selectedPipeDefinition[pfield].title);

			$(pselect).empty();
			$(pselect).removeClass("d-none"); 
			$(ptext).addClass("d-none");

			if (selectedPipeDefinition[pfield].parmdef.enum){

				Object.keys(selectedPipeDefinition[pfield].parmdef.enum).forEach(function(key,val) {
				  $("#pp" + parameterID).append($("<option />").val(key).text(selectedPipeDefinition[pfield].parmdef.enum[key]));
				});

			} else {

				if (selectedPipeDefinition.p1.parmdef.range){

					enumKey = selectedPipeDefinition[pfield].parmdef.range.min + "-" + selectedPipeDefinition[pfield].parmdef.range.max;

					Object.keys(ENUMS[enumKey]).forEach(function(key,val) {
					  $("#pp" + parameterID).append($("<option />").val(key).text(ENUMS[enumKey][key]));
					});

				}
				
			}

		} else {

			$(pselect).addClass("d-none"); $(ptext).addClass("d-none"); $(plabel).addClass("d-none");

			if (selectedPipeDefinition[pfield])
			if (Object.keys(selectedPipeDefinition[pfield]).length > 0){

				var p1val, p2val, p3val, p4val;

				if (selectedPipeDefinition.p1){
					if (selectedPipeDefinition.p1.parmdef){
						p1val = selectedPipeDefinition.p1.parmdef.enum ? $("#pp1").val() : selectedPipeDefinition.p1.parmdef.range ? $("#pp1t").val() : "";	
					}
				}

				if (selectedPipeDefinition.p2){
					if (selectedPipeDefinition.p2.parmdef){
						p2val = selectedPipeDefinition.p2.parmdef.enum ? $("#pp2").val() : selectedPipeDefinition.p2.parmdef.range ? $("#pp2t").val() : "";	
					}
				}

				if (selectedPipeDefinition.p3){
					if (selectedPipeDefinition.p3.parmdef){
						p3val = selectedPipeDefinition.p3.parmdef.enum ? $("#pp3").val() : selectedPipeDefinition.p3.parmdef.range ? $("#pp3t").val() : "";	
					}
				}
				
				if (selectedPipeDefinition.p4){
					if (selectedPipeDefinition.p4.parmdef){
						p4val = selectedPipeDefinition.p4.parmdef.enum ? $("#pp4").val() : selectedPipeDefinition.p4.parmdef.range ? $("#pp4t").val() : "";	
					}
				}

				if (selectedPipeDefinition[pfield].p1 && selectedPipeDefinition[pfield].p1[p1val]){
					obj = selectedPipeDefinition[pfield].p1[p1val];
				} else if (selectedPipeDefinition[pfield].p2 && selectedPipeDefinition[pfield].p2[p2val]) {
					obj = selectedPipeDefinition[pfield].p3[p3val]
				} else if (selectedPipeDefinition[pfield].p3 && selectedPipeDefinition[pfield].p3[p3val]) {
					obj = selectedPipeDefinition[pfield].p3[p3val]	
				} else if (selectedPipeDefinition[pfield].p4 && selectedPipeDefinition[pfield].p4[p4val]) {
					obj = selectedPipeDefinition[pfield].p4[p4val]	
				} else {
					obj = selectedPipeDefinition[pfield];
				}

				$(plabel).removeClass("d-none"); 
				$(plabel).text(obj.title);

				if (obj.parmdef){

					$(pselect).empty();
					$(pselect).removeClass("d-none"); 
					$(ptext).addClass("d-none");

					if (obj.parmdef.enum){

						Object.keys(obj.parmdef.enum).forEach(function(key,val) {
						  $("#pp" + parameterID).append($("<option />").val(key).text(obj.parmdef.enum[key]));
						});

					} else {

						if (obj.parmdef.range){
							enumKey = obj.parmdef.range.min + "-" + obj.parmdef.range.max;

							if (enumKey == "bit-mask"){

								$(pselect).empty();
								$(pselect).addClass("d-none"); 
								$(ptext).addClass("d-none");	
								$(pcb).removeClass("d-none");	

							} else {

								$(pcb).addClass("d-none");	

								if (parameterID == 3 || parameterID == 4){
									if (enumKey.indexOf("0x") > -1){
										enumKey += "-" + parameterID;
									}
								}

								Object.keys(ENUMS[enumKey]).forEach(function(key,val) {
								  $("#pp" + parameterID).append($("<option />").val(key).text(ENUMS[enumKey][key]));
								});

							}

						}
						
					}
				} else {
					$(plabel).addClass("d-none"); 
				}


			}

		}

	}

	var refreshParameterUI = function(refreshP1, refreshP2, refreshP3, refreshP4){

		$("#pipedescription").text(PIPEDEF[$("#pipeID").val()].description || "");

		if (refreshP1) refreshParameterUI1234(1);
		if (refreshP2) refreshParameterUI1234(2); 
		if (refreshP3) refreshParameterUI1234(3); 
		if (refreshP4) refreshParameterUI1234(4); 

	}

	var unusedPorts = function(){

		var unused = [];
		
		unused = PORTS.filter(function(ap) { 
			var found = false;
			renderObject.routes.forEach(function(rt){
				if (rt.src.srcuid == ap.uid || rt.tgt.tgtuid == ap.uid) found = true;
			});
			return !found && (ap.tag.indexOf("virt") == -1 || globalShowVirtuals == 1); 
		}); 

		return unused;

	}

	var convertToReadableSysex = function(sysex){
		if (sysex == null) return;

		var s="",p= "";
		sysex.forEach(function(byte){
			p = ConvertBase.dec2hex(byte).toUpperCase() + " ";
			if (p.length-1 == 1) s+="0";
			s+=p;
		});

		return s;
	
	}

	var processSysex = function(sysexData){

		sysexRecords.push(sysexData);

		var rs = convertToReadableSysex(sysexData);
		$("#sysex_received").val($("#sysex_received").val() + "\r\n" + rs); 

		var msgdata = sysexData.slice(4,sysexData.length-1);
		var functionCommand = msgdata[0];
		var pfunc = mkumlProcessors[functionCommand];

		if (pfunc) {

			r =	pfunc(msgdata, sysexData.length);	

			if (r)	
			if (r.process == 16){
				render = true;
			}
			else if (r.process == 15){
				renderObject.routes = renderObject.routes.concat(r.newObjects);
			}
			else if (r.process == 14){
				renderObject.intelliRoutes = renderObject.intelliRoutes.concat(r.newObjects);
			}
			else if (r.process == 11){
				globalIdentity = r.globalIdentity;
				$("#unitinfo").html(globalIdentity + "," + globalVendorProduct);
			}
			else if (r.process == 12){
				globalVendorProduct = r.globalVendorProduct;
				$("#unitinfo").html(globalIdentity + "," + globalVendorProduct);
			}
			else if (r.process == 17){

				if (r.subfunc == 0 && r.command == 2){

					renderObject.pipes.pipeLines[r.slotid-1].attachedTo.push(r.attachment);

				} else if (r.subfunc == 1 && r.command == 1){

					renderObject.pipes.pipeSlots.push(r.pipeSlot);

					if (r.pipeSlot.slotid == $("#pipelineID").val()){
						pipelinePositions[r.pipeSlot.pipeidx] = (r.pipeSlot.pipeidx+1) + ": " + PIPEDEF[r.pipeSlot.pipeid].title;
					} 

				} else if (r.subfunc == 1 && r.command == 5){

					renderObject.pipes.pipeSlots.forEach(function(ps){
						if (ps.slotid == r.slotid && ps.pipeidx == r.pipeidx) ps.bypass = r.bypass;
					});

				}

			}
		}

		if (render == true) drawUML();

	}

	var onSysex = function(sysex){

		processSysex(sysex.data);

	}

	/* Nomnoml */

	var filterFrameRoutes = function(routeData,filter){
		var frameRoutes = routeData.filter(function(r) {
		    return (r.src.srctag == filter 
		    	 && r.src.srcid >= inputsE[r.src.srctag].min 
		    	 && r.src.srcid <= inputsE[r.src.srctag].max 
		    	 && ((r.src.srctype != 2 && r.tgt.tgttype != 2) || globalShowVirtuals == 1));
		});
		return frameRoutes;	
	
	}

	var nomnomMakeFrame = function(filter, title, routeData){

		var frameRoutes = filterFrameRoutes(routeData, filter);

		if (frameRoutes.length > 0 || globalShowFreeSlots == 1) {
			mkumlRender.frameStart(title);

			frameRoutes.forEach(function(r){
				mkumlRender.elementBox(r, 0, selectedToggle, 0, '->');
				mkumlRender.renderPipeline(r, renderObject, selectedToggle);
				mkumlRender.elementBox(r, 1, selectedToggle, 0, '\r\n');
			});

			if ( globalShowFreeSlots == 1 ){
				unusedPorts().forEach(function(p){		
					if ( p.id >= inputsE[p.tag].min && p.id <= inputsE[p.tag].max && (p.tag.indexOf("cable") == -1 || filter != "jackithru")) {
						mkumlRender.elementBox(p, 1, selectedToggle, 1, '\r\n');
					}
				});
			}

			mkumlRender.genericEnd();
			var frm = mkumlRender.popFrame();
			frames[filter] = umlHeader + frm;
		}
	}

	var clearAllCanvas = function(){

		const context = inputsE['cablein'].canvas.getContext('2d');
		context.clearRect(0, 0,  inputsE['cablein'].canvas.width, inputsE['cablein'].canvas.height);

		const context1 = inputsE['jackin'].canvas.getContext('2d');
		context1.clearRect(0, 0,  inputsE['jackin'].canvas.width, inputsE['jackin'].canvas.height);

		const context2 = inputsE['jackithru'].canvas.getContext('2d');
		context2.clearRect(0, 0,  inputsE['jackithru'].canvas.width, inputsE['jackithru'].canvas.height);

		const context3 = inputsE['virtualin'].canvas.getContext('2d');
		context3.clearRect(0, 0,  inputsE['virtualin'].canvas.width, inputsE['virtualin'].canvas.height);
	
	}

	var drawUML = function(){
	
		var hideIthru = $("#hideIthru").is(":checked");

		refreshPipelineSlotPositions();

		frames = {};

		if (inputsE['cablein'].min > -1) {
			$("#target-canvas-cable").removeClass("d-none");
			nomnomMakeFrame('cablein','Cable Input', renderObject.routes); 
		} else {
			$("#target-canvas-cable").addClass("d-none");
		}

		if (inputsE['jackin'].min > -1 ) {
			$("#target-canvas-jack").removeClass("d-none");
			 nomnomMakeFrame('jackin','Jack Input', renderObject.routes);
		} else {
			$("#target-canvas-jack").addClass("d-none");
		}

		if (inputsE['virtualin'].min > -1 && globalShowVirtuals == 1 ) {
			$("#target-canvas-virtual").removeClass("d-none");			
			nomnomMakeFrame('virtualin','Virtual Input', renderObject.routes);
		} else {
			$("#target-canvas-virtual").addClass("d-none");
		}

		if (inputsE['jackithru'].min > -1 && !hideIthru==true) {
			$("#target-canvas-jackithru").removeClass("d-none");			
			nomnomMakeFrame('jackithru','Jack Intellithru', renderObject.intelliRoutes);
		} else {
			$("#target-canvas-jackithru").addClass("d-none");

		}

		if (renderObject.routes.length > 10){
			clearAllCanvas();
			Object.keys(frames).forEach(function(key) {
			  nomnoml.draw(inputsE[key].canvas, frames[key]);	
			});
		}

		if (activeRuntime != "webmidi") {
			if ($("#sentsysex").val().indexOf("Ready") == -1) $("#sentsysex").val($("#sentsysex").val() + " - Ready");
			$("#sentsysex").css('color','darkgreen');
		}
	
	}

	/* Sysex */

	var sendSysex = function(sysex, cmdid, logClear){
	
		render = false;
		sysexRecords = [];

		$("#sysex_received").val("");

		if (!logClear || !logClear.clear == "dont"){
			$("#sentsysex").val("");
			$("#sentsysex").css('color','red');
		}

		var outport = $("#midiOutputSelect").val();

		if (activeRuntime == "webmidi" && outport != null){    
			output = WebMidi.getOutputByName(outport);
			output.sendSysex(0x77, sysex.webmidi);	
		} 

		if (activeRuntime == "raspigpio"){
			serverCommand(sysex.full, cmdid);
		}

	}

	var sendCommand = function(){

		var commandID = $("#commandSelect").val();
		
		$("#sentsysex").val("");
		$("#sentsysex").css('color','red');

		switch(commandID) {
		  case "0":
		    sendRefresh();
		    break;
		  case "1":
		    sendReset();
		    break;
		  case "2":
		    sendResetIThru();
		    break;
		  case "3":
		    sendHWReset();
		    break;
		  case "4":
		    sendBootSerial();
		    break;
		  case "5":
		    enableBus();
		    break;
		  case "6":
		    disableBus();
		    break;
		}

	}

	/* Sysex Server Commands */

	var serverCommand = function(sysex, cmdid){
		
		ajaxPost('api/command', { socketIdentity, sysex, cmdid }, function(reply){
			$("#sentsysex").val($("#sentsysex").val() + " " + reply.message + ": " + convertToReadableSysex(reply.s.data) + " - Please wait");
		});
	
	}

	var serverFullDump = function(sysex, cmdid){
		
		if (Object.keys(socketIdentity).length > 0)
		ajaxPost('api/requestfulldump', { socketIdentity }, function(reply){
			$("#sentsysex").val($("#sentsysex").val() + " " + reply.message + ": " + convertToReadableSysex(reply.s.data) + " - Please wait");
		});
	
	}

	/* Sysex Server Commandlets */

	var sendRefresh = function(clearCanvass){
		
		clearRenderObject();
		
		if (clearCanvass == true){
			clearAllCanvas();
		}

		if (activeRuntime == "webmidi"){
			sendSysex(sxMaker.sxFullDump(), 'full_dump', { clear: "dont" });
		} 

		if (activeRuntime == "raspigpio"){
			serverFullDump();
		}

	}

	var sendReset = function(){

		sendSysex(sxMaker.sxResetRoutes(), 'reset_routes');		
		sendRefresh(true);
	
	}

	var sendResetIThru = function(){
		sendSysex(sxMaker.sxResetIThru(), 'reset_ithru');
		sendRefresh(true);
	
	}

	var sendHWReset = function(){
		sendSysex(sxMaker.sxHwReset(), 'hw_reset');
		sendRefresh(true);
	
	}

	var sendBootSerial = function(){
		sendSysex(sxMaker.sxBootSerial(), 'boot_serial');
		sendRefresh(true);
	
	}

	var enableBus = function(){
	    sendSysex(sxMaker.sxEnableBus(), 'enable_bus');
	    sendRefresh();
	
	}

	var disableBus = function(){
	    sendSysex(sxMaker.sxDisableBus(), 'disable_bus');
	    sendRefresh();
	
	}

	var attachPipeline = function(){

		var portType = $("#fromType").val();
		var portID = $("#fromID").val();
		var pipelineID = $("#pipelineID").val();

		var sx = sxMaker.sxPipeline(pipelineID).attachPort().portType(portType).portID(portID);

	    sendSysex(sx, 'attach_pipeline');
	    sendRefresh();

	}

	var detachPipeline = function(){

		var portType = $("#fromType").val();
		var portID = $("#fromID").val();

	    var sx = sxMaker.sxPipeline().clearPort().portType(portType).portID(portID);

	    sendSysex(sx, 'detach_pipeline');
	    sendRefresh();

	}

	var addPipe = function(){

		var pp1, pp2, pp3, pp4;
		
		var pipelineID = $("#pipelineID").val();
		var pipeID = $("#pipeID").val();

		pp1 = $("#pp1").val();	

		var checkhidden = $("#pp2cb").hasClass("d-none");

		if (checkhidden==false) {
			pp2 = bitmaskValue();
		}
		else { 
			pp2 = $("#pp2").val(); 
		}

		pp3 = $("#pp3").val(); 
		pp4 = $("#pp4").val();
		
		var sx = sxMaker.sxAddPipe(pipelineID).pipeID(pipeID).parms(pp1, pp2, pp3, pp4);

	    sendSysex(sx, 'add_pipe');
	    sendRefresh();

	}

	var insertPipe = function(){

		var pp1, pp2, pp3, pp4;

		var pipelineID = $("#pipelineID").val();
		var slotID = $("#pipelineSlotIdx").val();
		var pipeID = $("#pipeID").val();

     	pp1 = $("#pp1").val();	

     	var checkhidden = $("#pp2cb").hasClass("d-none");

		if (checkhidden==false) {
			pp2 = bitmaskValue();
		}
		else { 
			pp2 = $("#pp2").val(); 
		}

     	pp3 = $("#pp3").val(); 
     	pp4 = $("#pp4").val();

	    var sx = sxMaker.sxInsertPipe(pipelineID).slotID(slotID).pipeID(pipeID).parms(pp1, pp2, pp3, pp4);

	    sendSysex(sx, 'insert_pipe');
	    sendRefresh();

	}
	
	var replacePipe = function(){

		var pp1, pp2, pp3, pp4;

		var pipelineID = $("#pipelineID").val();
		var slotID = $("#pipelineSlotIdx").val();
		var pipeID = $("#pipeID").val();

		pp1 = $("#pp1").val();	

		var checkhidden = $("#pp2cb").hasClass("d-none");

		if (checkhidden==false) {
			pp2 = bitmaskValue();
		}
		else { 
			pp2 = $("#pp2").val(); 
		}

		pp3 = $("#pp3").val(); 
		pp4 = $("#pp4").val();
		
		var sx = sxMaker.sxReplacePipe(pipelineID).slotID(slotID).pipeID(pipeID).parms(pp1, pp2, pp3, pp4);

	    sendSysex(sx, 'replace_pipe');
	    sendRefresh();

	}

	var clearPipe = function(){

		var pipelineID = $("#pipelineID").val();
		var slotID = $("#pipelineSlotIdx").val();

	    var sx = sxMaker.sxClearPipe(pipelineID).slotID(slotID);

	    sendSysex(sx, 'clear_pipe');
	    sendRefresh();

	}

	var clearPipes = function(callback){

		var pipelineID = $("#pipelineID").val();
		var slotID = $("#pipelineSlotIdx").val();

		for (var pipline=1;pipline<9;pipline++){
			for (var pipslot=0;pipslot<8;pipslot++){
				var sx = sxMaker.sxClearPipe(pipline).slotID(0);
				sendSysex(sx, 'clear_pipe');
			}
		}

		callback();
	}

	var bypassPipe = function(){

		var pipelineID = $("#pipelineID").val();
		var slotID = $("#pipelineSlotIdx").val();

	    var sx = sxMaker.sxBypassPipe(pipelineID).slotID(slotID);

	    sendSysex(sx, 'bypass_pipe');
	    sendRefresh();

	}

	var releaseBypassPipe = function(){

		var pipelineID = $("#pipelineID").val();
		var slotID = $("#pipelineSlotIdx").val();

	    var sx = sxMaker.sxReleaseBypass(pipelineID).slotID(slotID);

	    sendSysex(sx, 'release_bypass_pipe');
	    sendRefresh();

	}

	var setBusID = function(){

		var deviceID = $("#deviceID").val();
	    var sx = sxMaker.sxSetBusID([~~deviceID]);

	    sendSysex(sx, 'set_busid');
	    sendRefresh(true);

	}

	var toggle = function(routeObj){

		var srctype = $("#fromType").val();
		var srcid = $("#fromID").val();
		var tgttype = $("#toType").val();
		var tgtID = $("#toID").val();

		var targetArray = [];
		var	bmt = 0;
		var sx = "";

		routeObj.forEach(function(route){
			if (route.src.srctype == srctype && route.src.srcid == srcid && route.tgt.tgttype == tgttype){
				bmt ^= (1 << route.tgt.tgtid)
			}
		});

		bmt ^= (1 << tgtID)

	    for (i=0;i<=15;i++){
	      if (bmt & (1 << i)){
	          targetArray.push(i);
	      }
	    }

	    if (routeObj == renderObject.routes){
	    	sx = sxMaker.sxRoute().srcType(srctype).srcID(srcid).tgtType(tgttype).tgtIDs(targetArray);
	    } else {
	    	sx = sxMaker.sxIntelliRoute().srcID(srcid).tgtType(tgttype).tgtIDs(targetArray);
	    }

	    sendSysex(sx, 'toggle');
	    sendRefresh();

	}

	var toggleBit = function(){

		toggle(renderObject.routes);

	}

	var toggleBitIThru = function(){

		toggle(renderObject.intelliRoutes);

	}

	/* Scenes Management */

	var setUserCookie = function(e){

		user = $("#userinfo").val();
		$.cookie('mkusername', user, { expires: 999 });

		loadSceneList();
	
	}

	var loadSceneList = function(){

		$("#scenelist").empty();

		ajaxPost('api/findscenes', { user }, function(scenes){
			scenes.message.forEach((scene)=>{
				$("#scenelist").append($("<option />").val(scene).text(scene));
			}); 
		});

	}

	var saveScene = function(e){

		scenetxt = $("#sysex_received").val();
		user = $("#userinfo").val();
		scene = $("#sceneName").val();

		$("#scenelist").addClass("red");

		ajaxPost('api/deletescene', { user, scene }, function(obj){	
			ajaxPost('api/createsysexrecords', { user, scene, sysex: sysexRecords }, function(obj){

				if (obj.status == "SUCCESS"){
					$("#scenelist").empty();
					obj.message.forEach((scene)=>{
						$("#scenelist").append($("<option />").val(scene.scene).text(scene.scene));
					}); 
					$("#scenelist").removeClass("red");
				}

			});
		});

	}

	var loadScene = function(e){

		user = $("#userinfo").val();
		scene = $("#scenelist").val();
		
		clearPipes(function(){
			ajaxPost('api/findscenerecords', { user, scene }, function(records){
				records.message[0].sysex.forEach((sysex)=>{
					var webmidi = JSON.parse(JSON.stringify(sysex)).slice(2);
					webmidi.pop();
					var full = JSON.parse(JSON.stringify(sysex));
					sendSysex({ webmidi, full });
				});
				sendRefresh(true);
			});
		});
		
	}

	/* Socket Client Stuff */

	var socketConnect = function(data){
		
		console.log("socket/connect");

	    var mkid = $("#userinfo").val();

	    socket.emit('register', { app: 'mkuml', mkid: mkid });

	    socket.on('registered', function(data){	
	    	console.log("socket/registered", JSON.stringify(data)); 
	    	socketIdentity = data; 
	    	sendRefresh(true);
	   	});

	    socket.on('refreshpush', function(){ 
	    	console.log("socket/refreshpush"); 
	    	sendRefresh();
	    });

	    socket.on('disconnect', function(){ 
	    	console.log("socket/disconnect"); 
	    	socketIdentity = null; 
	    });

	    socket.on('sysexdata', function(sxData){

			console.log("socket/sysexdata");

	    	sxData2 = sxData.map(sysex => Uint8Array.from(toByteArray(sysex)));
	    	
	    	sxData2.forEach((sysex) => {
	    		if (sysex.length != 1) {
	    			processSysex(sysex);
	    		}
	    	});

	    });

		socket.on('remotetoggleroute', function(data){

			console.log("socket/remotetoggleroute");

			var srctype = data.srctype;
			var srcid = data.srcid;
			var tgttype = data.tgttype;
			var tgtID = data.tgtID
			
			var targetArray = [];
			var	bmt = 0;

			renderObject.routes.forEach(function(route){
				if (route.src.srctype == srctype && route.src.srcid == srcid && route.tgt.tgttype == tgttype){
					bmt ^= (1 << route.tgt.tgtid)
				}
			});

			bmt ^= (1 << tgtID)

		    for (i=0;i<=15;i++){
		      if (bmt & (1 << i)){
		          targetArray.push(i);
		      }
		    }

		    var sx = sxMaker.route().srcTtype(srctype).srcID(srcid).tgtType(tgttype).targetIDs(targetArray);

		    sendSysex(sx);
		    sendRefresh();
		});


	}

	/* UI Handling */
	var toggleMenu = function(item){

		if ( $("._" + item.target.id + "_").hasClass('d-none') ){
			$("._" + item.target.id + "_").removeClass('d-none');
		} else {
			$("._" + item.target.id + "_").addClass('d-none');
		}
		
	}

	var cssShow = function(control){

		$("#" + control).removeClass("d-none");

	}

	var cssHide = function(control){

		$("#" + control).addClass("d-none");

	}

	var checkSerialStatus = function(callback){

		ajaxPost('api/sysinfo', {}, function(reply){
			callback(reply);            
		});
		
	}

	var checkRuntimeAvailability = function(){
		
		var requestedRuntime = $("#midiRuntimeSelect").val();

		$("#sentsysex").val("");
		$("#sentsysex").css('color','red');

			if (requestedRuntime == "webmidi"){

				if(socket) socket.emit('disconnectmepls');

				if (webmidiConnected == true){

					cssShow("webmidi_connected");

					cssHide("webmidi_unavailable");
					cssHide("apiserver_connected");
					cssHide("apiserver_unavailable");

					$("#midiInputSelect").removeClass("d-disabled");
					$("#midiOutputSelect").removeClass("d-disabled");		

					activeRuntime = "webmidi";

					refreshInputOutputLists();					
					sendRefresh(true);

				} else {
	
					cssShow("webmidi_unavailable");

					cssHide("webmidi_connected");
					cssHide("apiserver_connected");
					cssHide("apiserver_unavailable");		

					$("#midiInputSelect").addClass("d-disabled");
					$("#midiOutputSelect").addClass("d-disabled");		

					activeRuntime = "none";			
				}	

			}

			if (requestedRuntime == "raspigpio"){

				$("#midiOutputSelect").empty();
				$("#midiInputSelect").empty();

				$("#midiInputSelect").addClass("d-disabled");
				$("#midiOutputSelect").addClass("d-disabled");	

				cssShow("apiserver_connected");

                cssHide("apiserver_unavailable");		                					
				cssHide("webmidi_connected");
				cssHide("webmidi_unavailable");

				$("#midiInputSelect").addClass("d-disabled");
				$("#midiOutputSelect").addClass("d-disabled");

				checkSerialStatus(function(reply){

					if (reply.status == "SUCCESS"){

		                cssShow("apiserver_connected");

		                cssHide("apiserver_unavailable");		                					
		                cssHide("webmidi_connected");
		                cssHide("webmidi_unavailable");

		                $("#apiserver_connected").html("Using API Server (" + reply.message + ")");

		                $("#sentsysex").val("");
						$("#sentsysex").css('color','red');

						activeRuntime = "raspigpio";

						socket = io();
						socketIdentity = {};						
						socket.on('connect', socketConnect);

					} else {

		                cssShow("apiserver_unavailable");	

						cssHide("apiserver_connected");
		           		cssHide("webmidi_connected");		          
		                cssHide("webmidi_unavailable");

		                activeRuntime = "none";

					}

				});

			}

	}

	/* Input Change Events */

	var pipeIDChanged = function(){
		refreshParameterUI(true, true, true, true);
	}

	var pp1Changed = function(){
		refreshParameterUI(false, true, true, true);
	}

	var pp2Changed = function(){
		refreshParameterUI(false, false, false, false);
	}

	var pp3Changed = function(){
		refreshParameterUI(false, false, false, true);
	}

	var pp4Changed = function(){
		refreshParameterUI(false, false, false, false);
	}

	var hideIthruChange = function(){
		drawUML();
	}

	var toggleSelectionsChanged = function(e){

		var tdp = $("#checkToggle").is(":checked") ? 1 : 0;
		var srctype = $("#fromType").val();
		var srcid = $("#fromID").val();
		var tgttype = $("#toType").val();
		var tgtid = $("#toID").val();

		if (srctype != 1 || tgttype == 0){
			$("#toggleBitIThru").prop('disabled', true);
		} else {
			$("#toggleBitIThru").prop('disabled', false);
		}

		selectedToggle = tdp == 0 ? {} : { srctype, srcid, tgttype, tgtid };

		if (renderObject.routes) drawUML();

	}

	var uioptionChanged = function(){

		var uioption = $("#uioption").val();

		if (uioption == "diagram"){
			$("#sysex").addClass("d-none");
			$("#diagram").removeClass("d-none");
		} else if (uioption == "sysex"){
			$("#sysex").removeClass("d-none");
			$("#diagram").addClass("d-none");
		}

	}

	var inputChanged = function(e){

		var inport = $("#midiInputSelect").val();

		if (activeRuntime == "webmidi"  && inport != null){
			var input = WebMidi.getInputByName(inport);
			input.addListener("sysex", "all", onSysex);		
		}
	
	}

	var pipelineIDChanged = function(){

		refreshPipelineSlotPositions();
			
	}

	/* Main */

	$.ajax({
	  url: './json/ports.json',
	  async: false,
	  dataType: 'json',
	  success: function (response) { PORTS = response; }
	});

	$.ajax({
	  url: './json/pipes.json',
	  async: false,
	  dataType: 'json',
	  success: function (response) { PIPEDEF = response; }
	});

	$.ajax({
	  url: './json/enums.json',
	  async: false,
	  dataType: 'json',
	  success: function (response) { ENUMS = response; }
	});
	
	updateNomnomHeader();
	refreshParameterUI(true,true,true,true);
	loadSceneList();
	checkRuntimeAvailability();
	inputChanged();
	toggleSelectionsChanged();

	$("#toggleBit").on("click", toggleBit);
	$("#toggleBitIThru").on("click", toggleBitIThru);
	$("#attachPipeline").on("click", attachPipeline);
	$("#detachPipeline").on("click", detachPipeline);
	$("#saveScene").on("click", saveScene);
	$("#loadScene").on("click", loadScene);
	$("#setUserCookie").on("click", setUserCookie);
	$("#addPipe").on("click", addPipe);
	$("#insertPipe").on("click", insertPipe);
	$("#replacePipe").on("click", replacePipe);
	$("#clearPipe").on("click", clearPipe);
	$("#bypassPipe").on("click", bypassPipe);
	$("#releaseBypassPipe").on("click", releaseBypassPipe);
	$("#setDeviceID").on("click", setBusID);
	$("#execute").on("click", sendCommand);

	$("#menu_interface").on("click", toggleMenu);
	$("#menu_routing").on("click", toggleMenu);
	$("#menu_pipelines").on("click", toggleMenu);
	$("#menu_pipes").on("click", toggleMenu);
	$("#menu_scenes").on("click", toggleMenu);
	$("#menu_options").on("click", toggleMenu);
	$("#menu_ui").on("click", toggleMenu);

	$("#uioption").on("change", uioptionChanged);
	$("#midiInputSelect").on("change", inputChanged);
	$("#fromType").on("change", toggleSelectionsChanged);
	$("#fromID").on("change", toggleSelectionsChanged);
	$("#toType").on("change", toggleSelectionsChanged);
	$("#toID").on("change", toggleSelectionsChanged);
	$("#togglepointerDisplay").on("change", toggleSelectionsChanged);
	$("#checkToggle").on("change", toggleSelectionsChanged);
	$("#pipelineID").on("change", pipelineIDChanged);
	$("#pipeID").on("change", pipeIDChanged);
	$("#pp1").on("change", pp1Changed);
	$("#pp2").on("change", pp2Changed);
	$("#pp3").on("change", pp3Changed);
	$("#pp4").on("change", pp4Changed);
	$("#midiRuntimeSelect").on("change", checkRuntimeAvailability);
	$("#hideIthru").on("change", hideIthruChange);


	var slider_v1 = document.getElementById("myRange_v1");
	var slider_v2 = document.getElementById("myRange_v2");
	var slider_s = document.getElementById("myRange_s");
	var slider_e = document.getElementById("myRange_e");
	var slider_s2 = document.getElementById("myRange_s2");
	var slider_e2 = document.getElementById("myRange_e2");
	var slider_padding = document.getElementById("myRange_padding");
	var slider_spacing = document.getElementById("myRange_spacing");
	var slider_fontsize = document.getElementById("myRange_fontsize");
	var slider_edgemargin = document.getElementById("myRange_edgemargin");
	var slider_direction = document.getElementById("myRange_direction");
	var slider_ranker = document.getElementById("myRange_ranker");
	var slider_showfreeslots = document.getElementById("myRange_showfreeslots");
	var slider_showvirtuals = document.getElementById("myRange_showvirtuals");
	var slider_loopbackdisplay = document.getElementById("myRange_loopbackdisplay");
	var slider_showparmdetails = document.getElementById("myRange_showparmdetails");
	var slider_zoom = document.getElementById("myRange_zoom");

	slider_s.oninput = function() {
	  inputsE['cablein'].min = this.value;
	  inputsE['cableout'].min = this.value;
	  drawUML();
	}

	slider_e.oninput = function() {
	  inputsE['cablein'].max = this.value;
	  inputsE['cableout'].max = this.value;
	  drawUML();
	}
	
	slider_s2.oninput = function() {
	  inputsE['jackin'].min = this.value;
	  inputsE['jackout'].min = this.value;
	  inputsE['jackithru'].min = this.value;
	  drawUML();
	}

	slider_e2.oninput = function() {
	  inputsE['jackin'].max = this.value;
	  inputsE['jackout'].max = this.value;
	  inputsE['jackithru'].max = this.value;
	  drawUML();
	}

	slider_v1.oninput = function() {
	  inputsE['virtualin'].min = this.value;
	  drawUML();
	}

	slider_v2.oninput = function() {
	  inputsE['virtualin'].max = this.value;
	  drawUML();
	}

	slider_padding.oninput = function() {
	  globalPadding = this.value;
	  updateNomnomHeader();
	  drawUML();
	}

	slider_spacing.oninput = function() {
	  globalSpacing = this.value;
	  updateNomnomHeader();
	  drawUML();
	}

	slider_fontsize.oninput = function() {
	  globalFontsize = this.value;
	  updateNomnomHeader();
	  drawUML();
	}

	slider_direction.oninput = function() {
	  globalDirectionVal = this.value;
	  updateNomnomHeader();
	  drawUML();
	}

	slider_ranker.oninput = function() {
	  globalRankerVal = this.value;
	  updateNomnomHeader();
	  drawUML();
	}

	slider_edgemargin.oninput = function() {
	  globalBendSize = this.value;
	  updateNomnomHeader();
	  drawUML();
	}

	slider_showfreeslots.oninput = function() {
	  globalShowFreeSlots = this.value;
	  drawUML();
	}

	slider_showvirtuals.oninput = function() {
	  globalShowVirtuals = this.value;
	  drawUML();
	}

	slider_showparmdetails.oninput = function() {
	  globalShowParmDetails = this.value;
	  drawUML();
	}

	slider_zoom.oninput = function() {
	  globalZoom = this.value;
	  updateNomnomHeader();
	  drawUML();
	}

}, true);
