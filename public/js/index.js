
var cableJackE = { 0: "cable", 1: "jack", 2: "virtual" };
var directionE = { 0: "down", 1: "right" };
var rankerE = 	 { 0: "network-simplex", 1: "tight-tree", 2: "longest-path" };

var inputsE = {
	'cablein': { min: 0, max: 5, canvas: cableCanvas },
	'jackin': { min: 0, max: 5, canvas: jackCanvas },
	'jackithru': { min: 0, max: 5, canvas: jackithruCanvas },
	'cableout': { min: 0, max: 5 },
	'jackout': { min: 0, max: 5 },
	'virtualin': { min: 0, max: 5 },
	'virtualout': { min: 0, max: 5 }
};

var sxMaker = new sysexMaker.sxMaker();
var selectedToggle = { srctype:0, srcid:0, tgttype: 1, tgtid: 0 };
var pipelinePositionsBlank = ["1:","2:","3:","4:","5:","6:","7:","8:"];

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

var umlHeader = "";
var allPorts = [];
var intelliInputs = {};
var frames = {};	
var PIPEDEF3 = {};
var ENUMS3 = {};
var sysexRecords = [];
var renderObject = {};
var user = "";
var render = false;

var runtime = "webmidi";
var webmidiAvailable = false;

var summary = {
	'cablein': [],
	'jackin': [],
	'jackithru': []
};

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

		$.each(WebMidi.inputs, function(i,o) {
			$inputs.append($("<option />").val(o.name).text(o.name));
		});

		$.each(WebMidi.outputs, function(i,o) {
			$outputs.append($("<option />").val(o.name).text(o.name));
		});

	}

	if (err) {
		console.log("WebMidi could not be enabled.", err);
		runtime = "raspigpio";

	} else {
		console.log("WebMidi enabled!");
		webmidiAvailable = true;
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

	var clearPipelineSlotPositions = function(){

		pipelinePositions = JSON.parse(JSON.stringify(pipelinePositionsBlank));

	}

	var refreshPipelineSlotPositions = function(){

		var $ppos = $("#pipelineSlotIdx");

		$ppos.empty();
		for (i=0;i<8;i++){
			$ppos.append($("<option />").val(i).text(pipelinePositions[i]));
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

	var refreshParameterUI1234 = function(parameterID){
		
		var placeholder = "";
		var selectedPipeID = $("#pipeID").val();
		var selectedPipeDefinition = PIPEDEF3[selectedPipeID];	

		var pfield = "p" + parameterID;
		var pselect = "#pp" + parameterID; 
		var ptext = "#pp" + parameterID + "t";
		var plabel = "#p" + parameterID + "l";

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

					Object.keys(ENUMS3[enumKey]).forEach(function(key,val) {
					  $("#pp" + parameterID).append($("<option />").val(key).text(ENUMS3[enumKey][key]));
					});

				}
				
			}

		} else {

			$(pselect).addClass("d-none"); $(ptext).addClass("d-none"); $(plabel).addClass("d-none");

			if (selectedPipeDefinition[pfield])
			if (Object.keys(selectedPipeDefinition[pfield]).length > 0){

				var p1val, p3val;

				if (selectedPipeDefinition.p1){
					if (selectedPipeDefinition.p1.parmdef){
						p1val = selectedPipeDefinition.p1.parmdef.enum ? $("#pp1").val() : selectedPipeDefinition.p1.parmdef.range ? $("#pp1t").val() : "";	
					}
				}

				if (selectedPipeDefinition.p3){
					if (selectedPipeDefinition.p3.parmdef){
						p3val = selectedPipeDefinition.p3.parmdef.enum ? $("#pp3").val() : selectedPipeDefinition.p3.parmdef.range ? $("#pp3t").val() : "";	
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

							if (parameterID == 3 || parameterID == 4){
								if (enumKey.indexOf("0x") > -1){
									enumKey += "-" + parameterID;
								}
							}

							Object.keys(ENUMS3[enumKey]).forEach(function(key,val) {
							  $("#pp" + parameterID).append($("<option />").val(key).text(ENUMS3[enumKey][key]));
							});

						}
						
					}
				} else {
					$(plabel).addClass("d-none"); 
				}


			}

		}

	}

	var refreshParameterUI = function(refreshP1, refreshP2, refreshP3, refreshP4){

		$("#pipedescription").text(PIPEDEF3[$("#pipeID").val()].description || "");

		if (refreshP1) refreshParameterUI1234(1);
		if (refreshP2) refreshParameterUI1234(2); 
		if (refreshP3) refreshParameterUI1234(3); 
		if (refreshP4) refreshParameterUI1234(4); 

	}

	var unusedPorts = function(){

		var unused = [];
		
		unused = allPorts.filter(function(ap) { 
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
						pipelinePositions[r.pipeSlot.pipeidx] = (r.pipeSlot.pipeidx+1) + ": " + PIPEDEF3[r.pipeSlot.pipeid].title;
					} 
					
					refreshPipelineSlotPositions();

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

		mkumlRender.frameStart(title);
		summary[filter] = [];

		frameRoutes.forEach(function(r){
			mkumlRender.elementBox(r, 0, selectedToggle, 0, '->');
			mkumlRender.renderPipeline(r, renderObject, selectedToggle);
			mkumlRender.elementBox(r, 1, selectedToggle, 0, '\r\n');

			summary[filter].push("<a style='font-size: 11px;padding:7px; margin: 5px;border:3px solid black;display:inline-block'>" + r.src.srcuid + " routed to " + r.tgt.tgtuid + "</a>");			
		});

		$("#summarytxt").html("<br>CableIN<hr>" + summary['cablein'].join("<br>") + "<br><br>JackIN<hr>" + summary['jackin'].join("<br>") + "<br><br>JackINThru<hr>" + summary['jackithru'].join("<br>"));

		if (globalShowFreeSlots == 1 ){
			unusedPorts().forEach(function(p){		
				if ( p.id >= inputsE[p.tag].min && p.id <= inputsE[p.tag].max && (p.tag.indexOf("cable") == -1 || filter != "jackithru")) {
					mkumlRender.elementBox(p, 1, selectedToggle, 1, '\r\n');
				}
			});
		}

		mkumlRender.genericEnd();
		frames[filter] = umlHeader + mkumlRender.popFrame();
	
	}

	var clearAllCanvas = function(){

		const context = inputsE['cablein'].canvas.getContext('2d');
		context.clearRect(0, 0,  inputsE['cablein'].canvas.width, inputsE['cablein'].canvas.height);

		const context1 = inputsE['jackin'].canvas.getContext('2d');
		context1.clearRect(0, 0,  inputsE['jackin'].canvas.width, inputsE['jackin'].canvas.height);

		const context2 = inputsE['jackithru'].canvas.getContext('2d');
		context2.clearRect(0, 0,  inputsE['jackithru'].canvas.width, inputsE['jackithru'].canvas.height);
	
	}

	var drawUML = function(){
	
		frames = {};

		summary = {
			'cablein': [],
			'jackin': [],
			'jackithru': []
		};

		if (inputsE['cablein'].min > -1) nomnomMakeFrame('cablein','Cable Input', renderObject.routes); 
		if (inputsE['jackin'].min > -1 ) nomnomMakeFrame('jackin','Jack Input', renderObject.routes);
		if (inputsE['jackin'].min > -1 ) nomnomMakeFrame('jackithru','Jack Intellithru', renderObject.intelliRoutes);

		if (renderObject.routes.length > 10){
			clearAllCanvas();
			Object.keys(frames).forEach(function(key) {
			  nomnoml.draw(inputsE[key].canvas, frames[key]);	
			});
		}

		if (runtime != "webmidi") {
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

		if (runtime == "webmidi"){
	        var outport = $("#midiOutputSelect").val();
			output = WebMidi.getOutputByName(outport);
			output.sendSysex(0x77, sysex.webmidi);	
		} else {
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

	var sendRefresh = function(){

		clearRenderObject();

		if (runtime == "webmidi" && webmidiAvailable == true){
			sendSysex(sxMaker.sxFullDump(), 'full_dump', { clear: "dont" });
		} else{
			serverFullDump();
		}

	}

	var sendReset = function(){
		sendSysex(sxMaker.sxResetRoutes(), 'reset_routes');
		sendRefresh();
	
	}

	var sendResetIThru = function(){
		sendSysex(sxMaker.sxResetIThru(), 'reset_ithru');
		sendRefresh();
	
	}

	var sendHWReset = function(){
		sendSysex(sxMaker.sxHwReset(), 'hw_reset');
		sendRefresh();
	
	}

	var sendBootSerial = function(){
		sendSysex(sxMaker.sxBootSerial(), 'boot_serial');
		sendRefresh();
	
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

		var srcType = $("#fromType").val();
		var srcID = $("#fromID").val();
		var pipelineID = $("#pipelineID").val();

	    var sx = sxMaker.sxAttachPipeline(pipelineID).srcType(srcType).srcID(srcID);

	    sendSysex(sx, 'attach_pipeline');
	    sendRefresh();

	}

	var detachPipeline = function(){

		var srcType = $("#fromType").val();
		var srcID = $("#fromID").val();
		var pipelineID = 0;

	    var sx = sxMaker.sxDetachPipeline().srcType(srcType).srcID(srcID);

	    sendSysex(sx, 'detach_pipeline');
	    sendRefresh();

	}

	var addPipe = function(){

		var pipelineID = $("#pipelineID").val();
		var pipeID = $("#pipeID").val();
		var pp1 = $("#pp1").val();	var pp2 = $("#pp2").val(); var pp3 = $("#pp3").val(); var pp4 = $("#pp4").val();
		
		var sx = sxMaker.sxAddPipeToPipeline(pipelineID).pipeID(pipeID).parameters(pp1, pp2, pp3, pp4);

	    sendSysex(sx, 'add_pipe');
	    sendRefresh();

	}

	var insertPipe = function(){

		var pipelineID = $("#pipelineID").val();
		var pipelineSlotID = $("#pipelineSlotIdx").val();
		var pipeID = $("#pipeID").val();
     	var pp1 = $("#pp1").val();	var pp2 = $("#pp2").val(); var pp3 = $("#pp3").val(); var pp4 = $("#pp4").val();

	    var sx = sxMaker.sxInsertPipeToPipeline(pipelineID).pipelineSlotID(pipelineSlotID).pipeID(pipeID).parameters(pp1, pp2, pp3, pp4);

	    sendSysex(sx, 'insert_pipe');
	    sendRefresh();

	}
	
	var replacePipe = function(){

		var pipelineID = $("#pipelineID").val();
		var pipelineSlotID = $("#pipelineSlotIdx").val();
		var pipeID = $("#pipeID").val();
		var pp1 = $("#pp1").val();	var pp2 = $("#pp2").val(); var pp3 = $("#pp3").val(); var pp4 = $("#pp4").val();
		
		var sx = sxMaker.sxReplacePipeInPipeline(pipelineID).pipelineSlotID(pipelineSlotID).pipeID(pipeID).parameters(pp1, pp2, pp3, pp4);

	    sendSysex(sx, 'replace_pipe');
	    sendRefresh();

	}

	var clearPipe = function(){

		var pipelineID = $("#pipelineID").val();
		var pipelineSlotID = $("#pipelineSlotIdx").val();

	    var sx = sxMaker.sxClearPipelineSlot(pipelineID).pipelineSlotID(pipelineSlotID);

	    sendSysex(sx, 'clear_pipe');
	    sendRefresh();

	}

	var bypassPipe = function(){

		var pipelineID = $("#pipelineID").val();
		var pipelineSlotID = $("#pipelineSlotIdx").val();

	    var sx = sxMaker.sxBypassPipelineSlot(pipelineID).pipelineSlotID(pipelineSlotID);

	    sendSysex(sx, 'bypass_pipe');
	    sendRefresh();

	}

	var releaseBypassPipe = function(){

		var pipeline = $("#pipelineID").val();
		var pipelineSlotID = $("#pipelineSlotIdx").val();

	    var sx = sxMaker.sxReleaseBypassPipelineSlot(pipelineID).pipelineSlotID(pipelineSlotID);

	    sendSysex(sx, 'release_bypass_pipe');
	    sendRefresh();

	}

	var setDeviceID = function(){

		var deviceID = $("#deviceID").val();
	    var sysexSetdeviceID = [~~deviceID];

	    var sx = sxMaker.sxSetBusID(deviceID);

	    sendSysex(sx, 'set_busid');
	    sendRefresh();

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
			$("#scenelist").removeClass("red");
		});

	}

	var saveScene = function(e){

		scenetxt = $("#sysex_received").val();
		user = $("#userinfo").val();
		scene = $("#sceneName").val();

		ajaxPost('api/deletescene', { user, scene }, function(obj){

			sysexRecords.forEach((sysexRecord)=>{

				ajaxPost('api/createsysexrecords', { user, scene, sysex:sysexRecord }, function(obj){

				});
			});

		});

		$("#scenelist").addClass("red");
		loadSceneList();

	}

	var loadScene = function(e){

		user = $("#userinfo").val();
		scene = $("#scenelist").val();

		ajaxPost('api/findscenerecords', { user, scene }, function(records){
			
			var sr = records.message.map((record)=>{
				return record.sysex;
			}); 

			sr.forEach((sysex)=>{

				var webmidi = JSON.parse(JSON.stringify(sysex)).slice(2);
				webmidi.pop();

				var full = JSON.parse(JSON.stringify(sysex));

				sendSysex({ webmidi, full });
			});

			init();
			clearAllCanvas();
			sendRefresh();

		});

	}

	/* Socket Client Stuff */

	var socket = io();
	var socketIdentity = {};

	socket.on('connect', function(data){
		
		console.log("socket/connect");

	    var mkid = $("#userinfo").val();

	    socket.emit('register', { app: 'mkuml', mkid: mkid });

	    socket.on('registered', function(data){	
	    	console.log("socket/registered", JSON.stringify(data)); 
	    	socketIdentity = data; 

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

	});


	/* Input Change Events */

	var toggleMenu = function(item){

		if ( $("._" + item.target.id + "_").hasClass('d-none') ){
			$("._" + item.target.id + "_").removeClass('d-none');
		} else {
			$("._" + item.target.id + "_").addClass('d-none');
		}
		
	}

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
			$("#summary").addClass("d-none");
			$("#diagram").removeClass("d-none");
		} else if (uioption == "summary"){
			$("#sysex").addClass("d-none");
			$("#summary").removeClass("d-none");
			$("#diagram").addClass("d-none");
		} else if (uioption == "sysex"){
			$("#sysex").removeClass("d-none");
			$("#summary").addClass("d-none");
			$("#diagram").addClass("d-none");
		}

	}

	var inputChanged = function(e){

		if (runtime == "webmidi"){
			var midiInputSelect = $("#midiInputSelect").val();
			var input = WebMidi.getInputByName(midiInputSelect);

			input.addListener("sysex", "all", onSysex);		
		}
	}

	var pipelineIDChanged = function(){

		clearPipelineSlotPositions();

		renderObject.pipes.pipeSlots.forEach((slot)=>{
			if (slot.slotid == $("#pipelineID").val()){
				pipelinePositions[slot.pipeidx] = (slot.pipeidx+1) + ": " + PIPEDEF3[slot.pipeid].title;
			} 
		});

		refreshPipelineSlotPositions();
			
	}

	var midiRuntimeSelectChanged = function(){
		
		runtime = $("#midiRuntimeSelect").val();

		clearRenderObject();
		clearAllCanvas();

		$("#sentsysex").val("");
		$("#sentsysex").css('color','red');

			if (runtime == "webmidi"){

				if (webmidiAvailable == false){
					$("#apiserverdisabled").addClass("d-none");
					$("#apiserverenabled").addClass("d-none");
					$("#webmidiunavailable").removeClass("d-none");

				} else {

					$("#apiserverdisabled").removeClass("d-none");
					$("#apiserverenabled").addClass("d-none");
					$("#webmidiunavailable").addClass("d-none");
					$("#midiInputSelect").removeClass("d-disabled");
					$("#midiOutputSelect").removeClass("d-disabled");

					refreshInputOutputLists();
					sendRefresh();							
				}	



			} else {

				$("#midiOutputSelect").empty();
				$("#midiInputSelect").empty();

				$("#apiserverdisabled").addClass("d-none");
				$("#apiserverenabled").removeClass("d-none");
				$("#webmidiunavailable").addClass("d-none");
				$("#midiInputSelect").addClass("d-disabled");
				$("#midiOutputSelect").addClass("d-disabled");

				ajaxPost('api/sysinfo', {}, function(reply){

					if (reply.status == "SUCCESS"){
		                $("#apiserverdisabled").addClass("d-none");
		                $("#apiserverenabled").removeClass("d-none");
		                $("#webmidiunavailable").addClass("d-none");
		                $("#apiserverunavailable").addClass("d-none");
		                $("#apiserverenabled").html("Using API Server (" + reply.message + ")");

		                $("#sentsysex").val("");
						$("#sentsysex").css('color','red');

		                sendRefresh();
		            } else {
		           		$("#apiserverdisabled").addClass("d-none");
		                $("#apiserverenabled").addClass("d-none");
		                $("#webmidiunavailable").addClass("d-none");
		                $("#apiserverunavailable").removeClass("d-none");
		            }
		            
				});

			}	
	}

	/* Main */

	if (runtime == "webmidi"){
		var midiInputSelect = $("#midiInputSelect").val();
		var input = WebMidi.getInputByName(midiInputSelect);

		input.addListener("sysex", "all", onSysex);		
	}

	$.ajax({
	  url: './json/pipes.json',
	  async: false,
	  dataType: 'json',
	  success: function (response) { PIPEDEF3 = response; }
	});

	$.ajax({
	  url: './json/enums.json',
	  async: false,
	  dataType: 'json',
	  success: function (response) { ENUMS3 = response; }
	});

	$.ajax({
	  url: './json/ports.json',
	  async: false,
	  dataType: 'json',
	  success: function (response) { allPorts = response; }
	});

	clearPipelineSlotPositions();
	clearRenderObject();
	updateNomnomHeader();
	refreshParameterUI(true,true,true,true);
	loadSceneList();
	midiRuntimeSelectChanged();
	sendRefresh();

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
	$("#setDeviceID").on("click", setDeviceID);
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
	$("#midiRuntimeSelect").on("change", midiRuntimeSelectChanged);

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