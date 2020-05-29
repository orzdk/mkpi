(function() {

	/*
	USAGE :
	------------------------------------------------------------------------------------------------------------------------
	sxMaker.sxFullDump();
	sxMaker.sxReset();
	sxMaker.sxResetIThru();
	sxMaker.sxHwReset();
	sxMaker.sxBootSerial();
	
	sxMaker.sxEnableBus();
	sxMaker.sxDisableBus();
	sxMaker.setBusID(busID);

	sxMaker.attachPipeline(pipelineID).srcType(srctype).srcID(srcid);
	sxMaker.detachPipeline().srcType(srctype).srcID(srcid);

	sxMaker.addPipeToPipeline(pipelineID).pipeID(pipeID).parameters(pp1, pp2, pp3, pp4);
	sxMaker.insertPipeToPipeline(pipelineID).pipelineSlotID(pipelineSlotID).pipeID(pipeID).parameters(pp1, pp2, pp3, pp4);
	sxMaker.replacePipeInPipeline(pipelineID).pipelineSlotID(pipelineSlotID).pipeID(pipeID).parameters(pp1, pp2, pp3, pp4);

	sxMaker.clearPipelineSlot(pipelineID).pipelineSlotID(pipelineSlotID);
	sxMaker.bypassPipelineSlot(pipelineID).pipelineSlotID(pipelineSlotID);
	sxMaker.releaseBypassPipelineSlot(pipelineID).pipelineSlotID(pipelineSlotID);
    
    sxMaker.route().srcTtype(srcType).srcID(srcID).tgtType(tgtType).tgtIDs(tgtIDs);
    sxMaker.intelliRoute().srcID(srcID).tgtType(tgtType).tgtIDs(tgtIDs);
	*/

	var sysexLib = {
		config_request:    [ 0xF0, 0x77, 0x77, 0x78, 0x05, 0x7F, 0x0, 0x0, 0x0 ],
		id_request:        [ 0xF0, 0x77, 0x77, 0x78, 0x06, 0x01 ],
		hw_reset:          [ 0xF0, 0x77, 0x77, 0x78, 0x0A ],
		boot_serial:       [ 0xF0, 0x77, 0x77, 0x78, 0x08 ],
		route_reset:       [ 0xF0, 0x77, 0x77, 0x78, 0x0F, 0x00 ],
		route_reset_ithru: [ 0xF0, 0x77, 0x77, 0x78, 0x0E, 0x00 ],
		route_set:         [ 0xF0, 0x77, 0x77, 0x78, 0x0F, 0x01 ],
		route_set_ithru:   [ 0xF0, 0x77, 0x77, 0x78, 0x0E, 0x03 ],
		slot_attach:       [ 0xF0, 0x77, 0x77, 0x78, 0x11, 0x00, 0x02 ],
		add_pipe:          [ 0xF0, 0x77, 0x77, 0x78, 0x11, 0x01, 0x00 ],
		insert_pipe:       [ 0xF0, 0x77, 0x77, 0x78, 0x11, 0x01, 0x01 ],
		replace_pipe:      [ 0xF0, 0x77, 0x77, 0x78, 0x11, 0x01, 0x02 ],
		clear_pipe:        [ 0xF0, 0x77, 0x77, 0x78, 0x11, 0x01, 0x03 ],
		bypass_pipe:       [ 0xF0, 0x77, 0x77, 0x78, 0x11, 0x01, 0x05 ],
		enable_bus:        [ 0xF0, 0x77, 0x77, 0x78, 0x10, 0x00, 0x00 ],
		disable_bus:       [ 0xF0, 0x77, 0x77, 0x78, 0x10, 0x00, 0x00 ],
		set_busid:         [ 0xF0, 0x77, 0x77, 0x78, 0x10, 0x01 ]
	};

	class sxMaker {

		constructor(){}

		formatter(sysex) { 
			var webmidi = JSON.parse(JSON.stringify(sysex)).slice(2);
			var full = JSON.parse(JSON.stringify(sysex));
			full.push(247); 
			return { webmidi, full }
		}

		/*Utilities*/

		sxFullDump() 	{ return this.formatter(sysexLib.config_request) 	};
		sxReset() 		{ return this.formatter(sysexLib.route_reset) 		};
		sxResetIThru() 	{ return this.formatter(sysexLib.route_reset_ithru) };
		sxHwReset() 	{ return this.formatter(sysexLib.hw_reset) 			};
		sxBootSerial() 	{ return this.formatter(sysexLib.config_request) 	};
		sxEnableBus() 	{ return this.formatter(sysexLib.enable_bus) 		};
		sxDisableBus() 	{ return this.formatter(sysexLib.disable_bus) 		};

		/* Routes */

	    route() {
	        return {
	            srcType : (srcType) => {
	            	return {
	            		srcID : (srcID) => {
	            			return {
			                    tgtType : (tgtType) => {
					                return {
					                    tgtIDs : (tgtIDs) => {
								    		return this.formatter(
									    		sysexLib.route_set
								    			.concat([
								    				~~srcType, ~~srcID, ~~tgtType
								    			])
								    			.concat(tgtIDs)
							    			);
					                    }
					                }
					            }
					        }
			            }
	            	}
	       		}	
	        }
	    }

	    intelliRoute() {
        	return {
        		srcID : (srcID) => {
        			return {
	                    tgtType : (tgtType) => {
			                return {
			                    tgtIDs : (tgtIDs) => {
						    		return this.formatter(
							    		sysexLib.route_set_ithru
						    			.concat([
						    				~~srcID, ~~tgtType
						    			])
						    			.concat(tgtIDs)
					    			);
			                    }
			                }
			            }
			        }
	            }
        	}	        
	    }

	    /* Pipelines */

	    attachPipeline(pipelineID) {
	        return {
	            srcType : (srcType) => {
	                return {
	                    srcID : (srcID) => {
				    		return this.formatter(sysexLib.slot_attach
				    		.concat([
								~~srcType, ~~srcID, ~~pipelineID
				    		]));
	                    }
	                };
	            }
	        };
	    }

	    detachPipeline() {
	        return {
	            srcType : (srcType) => {
	                return {
	                    srcID : (srcID) => {
				    		return this.formatter(sysexLib.slot_attach
				    		.concat([
								~~srcType, ~~srcID, 0
				    		]));
	                    }
	                };
	            }
	        };
	    }


	    /* Pipes */

	    addPipeToPipeline(pipelineID) {
	        return {
	            pipeID : (pipeID) => {
	                return {
	                    parameters : (p1,p2,p3,p4) => {
				    		return this.formatter(sysexLib.add_pipe
			    			.concat([
			    				~~pipelineID, ~~pipeID
			    			])
			    			.concat([
			    				~~p1, ~~p2, ~~p3, ~~p4 
			    			]));
	                    }
	                };
	            }
	        };
	    }

	    insertPipeToPipeline(pipelineID) {
	        return {
	            pipelineSlotID : (pipelineSlotID) => {
	            	return {
	            		pipeID : (pipeID) => {
			                return {
			                    parameters : (p1,p2,p3,p4) => {
						    		return this.formatter(
							    		sysexLib.insert_pipe
						    			.concat([
						    				~~pipelineID, ~~pipelineSlotID, ~~pipeID
						    			])
						    			.concat([
						    				~~p1, ~~p2, ~~p3, ~~p4 
						    			])
					    			);
			                    }
			                }
			            }
	            	}
	       		}	
	        }
	    }

	    replacePipeInPipeline(pipelineID) {
	        return {
	            pipelineSlotID : (pipelineSlotID) => {
	            	return {
	            		pipeID : (pipeID) => {
			                return {
			                    parameters : (p1,p2,p3,p4) => {
						    		return this.formatter(
							    		sysexLib.replace_pipe
						    			.concat([
						    				~~pipelineID, ~~pipelineSlotID, ~~pipeID
						    			])
						    			.concat([
						    				~~p1, ~~p2, ~~p3, ~~p4 
						    			])
					    			);
			                    }
			                }
			            }
	            	}
	       		}	
	        }
	    }

	    clearPipelineSlot(pipelineID) {
	        return {
	            pipelineSlotID : (pipelineSlotID) => {

		    		return this.formatter(
			    		sysexLib.clear_pipe
		    			.concat([
		    				~~pipelineID, ~~pipelineSlotID
		    			])
	    			);

	           	}
	    	}	
	    }
	    
	    bypassPipelineSlot(pipelineID) {
	        return {
	            pipelineSlotID : (pipelineSlotID) => {

		    		return this.formatter(
			    		sysexLib.bypass_pipe
		    			.concat([
		    				~~pipelineID, ~~pipelineSlotID, 1
		    			])
	    			);

	           	}
	    	}	
	    }

	    releaseBypassPipelineSlot(pipelineID) {
	        return {
	            pipelineSlotID : (pipelineSlotID) => {

		    		return this.formatter(
			    		sysexLib.bypass_pipe
		    			.concat([
		    				~~pipelineID, ~~pipelineSlotID, 0
		    			])
	    			);

	           	}
	    	}	
	    }

	    /* Bus */

	    setBusID(busID) {
    		return this.formatter(sysexLib.set_busid
    		.concat([
				~~busID
    		]));
	    }

	}


	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined'){
       	module.exports.sysexMaker = {
			sxMaker: sxMaker
		}
    }
    else {
        window.sysexMaker = {
			sxMaker: sxMaker
		}
    }    

})();



