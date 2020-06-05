(function() {


	var process16 = function(msgdata, len){
		return { process: 16, code: msgdata[2] };
	
	}

	var process11 = function(msgdata, len){
		globalIdentity = new TextDecoder("utf-8").decode(msgdata.slice(1,msgdata.length));
		return { process: 11, globalIdentity };
	
	}

	var process12 = function(msgdata, len){
		id1 = ConvertBase.dec2hex(msgdata[1]) + ConvertBase.dec2hex(msgdata[2]) + ConvertBase.dec2hex(msgdata[3])+ ConvertBase.dec2hex(msgdata[4]);
		id2 = ConvertBase.dec2hex(msgdata[5]) + ConvertBase.dec2hex(msgdata[6]) + ConvertBase.dec2hex(msgdata[7])+ ConvertBase.dec2hex(msgdata[8]);
		globalVendorProduct = id1 + '/' + id2;
		return { process: 12, globalVendorProduct };
	
	}

	var process14 = function(msgdata, sysexlength){
		
		var rvObj = [];
		var subfunccode = msgdata[1];

		if (subfunccode == 3){ 
			
			var targets = msgdata.slice(4, sysexlength);

			if (targets.length == 0) return;

			var srcid = msgdata[2];
			var srcuid = 'jack' + srcid + 'in';

			var tgttype = msgdata[3];
			var tgttypetxt = tgttype == 2 ? 'virtual' : 'jack';

			for (i=0;i<targets.length;i++){

				var tgtid = targets[i];
				var tgttag = tgttypetxt + 'out';
				var tgtuid = tgttypetxt + tgtid + 'out';

				var intelliRouteObj = { 
					src: {  srctype: 1, srcid, srcuid, srctag: 'jackithru' }, 
					tgt: {  tgttype, tgtid, tgtuid, tgttag } 
				};
	
				rvObj.push(intelliRouteObj);
			}

			var inputTargetID = "I1" + srcid.toString() + tgttype.toString();

			return { process: 14, subfunc:3, newObjects: rvObj, portUID: inputTargetID, tgttype }; 
		}
	
		return;
	
	}

	var process15 = function(msgdata, len){
		
		var rvObj = [];
		var targets = msgdata.slice(5,len);
		var subfunccode = msgdata[1];

		var srctype = msgdata[2];
		var srctypetxt = cableJackE[srctype];

		var srcid = msgdata[3];		
		var srcuid = srctypetxt + srcid + 'in';		
		var srctag = srctypetxt + 'in';

		var tgttype = msgdata[4];
		var tgttypetxt = cableJackE[tgttype];

		if (subfunccode == 1){ 

			for (i=0;i<targets.length;i++){

				var tgtid = targets[i];
				var tgttag = tgttypetxt + 'out';
				var tgtuid = tgttypetxt + tgtid + 'out';

				var routeObj = { 
					src: { srctype, srcid, srcuid, srctag }, 
					tgt: { tgttype, tgtid, tgtuid, tgttag } 
				};

				rvObj.push(routeObj);
			}

			var inputTargetID = srctype.toString() + srcid.toString() + tgttype.toString();

			return { process: 15, subfunc: 1, newObjects: rvObj, portUID: inputTargetID }
		}
		
		return;
	
	}

	var process17 = function(msgdata, len){
		
		var subfunccode = msgdata[1];
		var command = msgdata[2];

		if (subfunccode == 0){ //slot operation
			if (command == 2){ //attach

				var porttype = msgdata[3];
				var portid = msgdata[4];
				var slotid = msgdata[5];
				var attachment = [porttype, portid];

				if (slotid > 0){
					var rObj = { process: 17, subfunc: 0, command: 2, slotid, attachment }
					return rObj;
				}; 

			}
		}
		else if (subfunccode == 1){ //pipe operation
			 if (command == 1){ //insert pipe at

				var slotid = msgdata[3];
				var pipeidx = msgdata[4];
				var pipeid = msgdata[5];
				var p1 = msgdata[6];
				var p2 = msgdata[7];
				var p3 = msgdata[8];
				var p4 = msgdata[9];

				var pipeSlot = { slotid, pipeidx, pipeid, p1, p2, p3, p4, bypass:false }
	
				if (pipeid != 127) return { process: 17, subfunc: 1, command: 1, pipeSlot }

			} else if (command == 5) { //bypass

				var slotid = msgdata[3];
				var pipeidx = msgdata[4];
				var bypass = msgdata[5];

				return { process: 17, subfunc: 1, command: 5, slotid, pipeidx, bypass }
			}
		}
	
	}

	window.mkumlProcessors = {
		16: process16, 
		11: process11, 
		12: process12, 
		14: process14, 
		15: process15, 
		17: process17 
	}

})();



