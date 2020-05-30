(function() {


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
		sxResetRoutes() { return this.formatter(sysexLib.route_reset) 		};
		sxResetIThru() 	{ return this.formatter(sysexLib.route_reset_ithru) };
		sxHwReset() 	{ return this.formatter(sysexLib.hw_reset) 			};
		sxBootSerial() 	{ return this.formatter(sysexLib.config_request) 	};
		sxEnableBus() 	{ return this.formatter(sysexLib.enable_bus) 		};
		sxDisableBus() 	{ return this.formatter(sysexLib.disable_bus) 		};

		/* Routes */

	    sxRoute() {
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

	    sxIntelliRoute() {
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

	    sxAttachPipeline(pipelineID) {
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

	    sxDetachPipeline() {
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

	    sxAddPipeToPipeline(pipelineID) {
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

	    sxInsertPipeToPipeline(pipelineID) {
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

	    sxReplacePipeInPipeline(pipelineID) {
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

	    sxClearPipelineSlot(pipelineID) {
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
	    
	    sxBypassPipelineSlot(pipelineID) {
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

	    sxReleaseBypassPipelineSlot(pipelineID) {
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

	    sxSetBusID(busID) {
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



