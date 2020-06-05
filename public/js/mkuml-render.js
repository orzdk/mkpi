(function() {

	var buffer = "";
	var cableJackE = { 0: "cable", 1: "jack", 2: "virtual" };


	var getPortPipelineSlot = function(srctypeid, srcid, renderObject){
		var rv = -1;
      	renderObject.pipes.pipeLines.forEach(function(pipeline){

			pipeline.attachedTo.forEach(function(aTo){
				if (aTo[0] == srctypeid && aTo[1] == srcid){
					rv = pipeline.slotid;
				}
			});

		});

		return rv;
	
	}

	var renderPipeline = function(r, renderObject, selectedToggle){

		var pipelineID = getPortPipelineSlot(r.src.srctype, r.src.srcid, renderObject);

		if (pipelineID != -1){

			pipes = renderObject.pipes.pipeSlots.filter(function(slot){
			  	return slot.slotid == pipelineID;
			});

			var pathIsBlocked = false;
			var ext = "";

			mkumlRender.pipelineBegin(pipelineID, r.src.srcuid);
			
			for (p=0;p<pipes.length;p++){

				var pipeid = pipes[p].pipeid;
				var pipeTitle = p + ' ' + (PIPEDEF[pipeid] ? PIPEDEF[pipeid].title : "");
				var	nextPipeParms = "";

				if (pipes[p+1]) nextPipeParms = (p+1) + ' ' + PIPEDEF[pipes[p+1].pipeid].title;				

				var pipep2 = pipes[p].p2;
				var pipep3 = pipes[p].p3;

				var pipeCommand = cableJackE[pipes[p].p1];
				
                var pipeParms = pipes[p].p1 + ',' + pipes[p].p2 + ',' + pipes[p].p3 + ',' + pipes[p].p4;

                var pipeParm1Text;

                if (PIPEDEF[pipeid].p1.parmdef.enum){
					pipeParm1Text = globalShowParmDetails == 0 ? "" : '|' + PIPEDEF[pipeid].p1.parmdef.enum[pipes[p].p1];
				} else {
					pipeParm1Text = globalShowParmDetails == 0 ? "" : '|' + PIPEDEF[pipeid].p1.title;
				}

				var pt = mkumlRender.pipeTagCode(pathIsBlocked,pipes[p]);

				if (p < pipes.length-1){
					mkumlRender.pipeBoxRouted(pt.boxTag, pipeTitle, pipeParm1Text, pipeParms, pt.arrow, nextPipeParms);
				} else {
					mkumlRender.pipeBox(pt.boxTag, pipeTitle, pipeParm1Text, pipeParms);
				}

				if (pipeid == 6 && !pipes[p].bypass){
					if (globalLoopbackDisplay == 1 || globalLoopbackDisplay == 3) {
						mkumlRender.pipeLoopback1(pipeTitle, pipeCommand, pipep3);
					}
					else if (globalLoopbackDisplay == 2 || globalLoopbackDisplay == 3){
					    ext = '[<' + pipeCommand + 'in>' +  r.src.srcuid + '] -> [<' + pipeCommand + 'in>' + pipeCommand + pipep2 + 'in]\r\n';
					}
					
					pathIsBlocked = true;
				} 		

			}

			mkumlRender.literal(ext);
			mkumlRender.genericEnd();
			mkumlRender.pipelineLink(pipelineID, r, ext, selectedToggle);
		}

	}

	var elementBox = function(route, sourceOrTarget, selectedToggle, unused, arrow){

		var toggleID;
		var toggleType;	
		var toggleID2;
		var toggleType2;	
		var rtType;
		var uid;
		var COLORTAG = "";

		if (unused==1){

			toggleID =  selectedToggle.srcid;
			toggleType = selectedToggle.srctype;
			toggleID2 =  selectedToggle.tgtid;
			toggleType2 = selectedToggle.tgttype;

			rtType = route.type;
			rtid = route.id;
			rtuid = route.uid;
			COLORTAG = route.tag;

			if ((rtType == toggleType && rtid == toggleID) || (rtType == toggleType2 && rtid == toggleID2)) COLORTAG = "selected";

		} else {
			if (sourceOrTarget == 0){
				toggleID =  selectedToggle.srcid;
				toggleType = selectedToggle.srctype;
				rtType = route.src.srctype;
				rtid = route.src.srcid;			
				rtuid = route.src.srcuid;
				COLORTAG = route.src.srctag;

			} else {
				toggleID =  selectedToggle.tgtid;
				toggleType =  selectedToggle.tgttype;
				rtType = route.tgt.tgttype;
				rtid = route.tgt.tgtid;			
				rtuid = route.tgt.tgtuid;
				COLORTAG = route.tgt.tgttag;
			}

			if ((rtType == toggleType && rtid == toggleID) || (rtType == toggleType2 && rtid == toggleID2)) COLORTAG = "selected";
			
		}

		var R_OBJ_TEXT = "[<" + COLORTAG + ">" + rtuid + "]" + arrow;	
		buffer += R_OBJ_TEXT;
	
	}

	var literal = function(l){

		buffer += l;

	}

	var frameStart = function(title){

		buffer += "[<frame>" + title + '|';

	}

	var genericEnd = function(){

		buffer += "]\r\n";

	}

	var pipelineBegin = function(pipelineID, srcuid){
		
		buffer += "[Pipeline " + pipelineID + " (" + srcuid + ")|";
	
	}

	var pipeBoxRouted = function(boxtag, pipeTitle, pipeParm1Text, pipeParms, arrow, nextPipeParms){

		buffer += '[' + boxtag + pipeTitle + pipeParm1Text + '|' + pipeParms + '] ' + arrow + ' [' + boxtag + nextPipeParms + ']\r\n';
	
	}

	var pipeBox = function(boxtag, pipeTitle, pipeParm1Text, pipeParms){

		buffer += '[' + boxtag + pipeTitle + pipeParm1Text + '|' + pipeParms + ']\r\n';
	
	}

	var pipelineLink = function(pipelineID, route, ext){

		toggleID =  selectedToggle.tgtid;
		toggleType =  selectedToggle.tgttype;
		rtType = route.tgt.tgttype;
		rtid = route.tgt.tgtid;			
		rtuid = route.tgt.tgtuid;
		COLORTAG = route.tgt.tgttag;

		if (rtType == toggleType && rtid == toggleID) COLORTAG = "selected";

		buffer += '[Pipeline ' + pipelineID + ' (' + route.src.srcuid + ')]->[' + "<" + COLORTAG + ">" + route.tgt.tgtuid + ']\r\n' + ext;
	
	}

	var pipeLoopback1 = function(pipeTitle, boxtag, p2){

		buffer += '[' + pipeTitle + '] -> [<' + boxtag + 'in>' + boxtag + p2 + 'in]\r\n';
	
	}

	var pipeTagCode = function(pathIsBlocked, pipe){

		var boxTag = "";
		var arrow = "->";

		if (pathIsBlocked == true) {
			boxTag = "<blocked>";
		} else {
			if (pipe.bypass == true){
				boxTag = "<bypass>";
			}  
			else if (pipe.pipeid == 6){
				boxTag = "<loopback>";
				arrow = "-->";
			} else {
				boxTag = "";
			}								
		}
		return {boxTag,arrow}
	
	}

	var popFrame = function(){
		var buf = buffer;
		buffer = "";
		return buf;
	
	}

	window.mkumlRender = {
		renderPipeline:renderPipeline,
		elementBox: elementBox, 
		frameStart: frameStart,
		genericEnd: genericEnd,
		buffer: buffer,
		pipelineBegin:pipelineBegin,
		pipeBoxRouted:pipeBoxRouted,
		pipeBox:pipeBox,
		pipelineLink:pipelineLink,
		pipeLoopback1:pipeLoopback1,
		pipeTagCode:pipeTagCode,
		popFrame:popFrame,
		literal:literal

	}

})();



