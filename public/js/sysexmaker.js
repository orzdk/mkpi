(function() {


	var sysexLib = {

		config_request:    [ 0xF0, 0x77, 0x77, 0x78, 0x05, 0x7F, 0x0, 0x0, 0x0 ],

		hw_reset:          [ 0xF0, 0x77, 0x77, 0x78, 0x06, 0x0A ],
		id_request:        [ 0xF0, 0x77, 0x77, 0x78, 0x06, 0x01 ],
		ack_toggle:        [ 0xF0, 0x77, 0x77, 0x78, 0x06, 0x02 ],
		factory_settings:  [ 0xF0, 0x77, 0x77, 0x78, 0x06, 0x04 ],
		reset_all: 		   [ 0xF0, 0x77, 0x77, 0x78, 0x06, 0x05 ],	
		save_flash: 	   [ 0xF0, 0x77, 0x77, 0x78, 0x06, 0x06 ],	
		boot_serial:       [ 0xF0, 0x77, 0x77, 0x78, 0x06, 0x08 ],

		usb_prod_string:   [ 0xF0, 0x77, 0x77, 0x78, 0x0B, 0x00 ],
		vend_prod_id:      [ 0xF0, 0x77, 0x77, 0x78, 0x0B, 0x01 ],

		clock_toggle:      [ 0xF0, 0x77, 0x77, 0x78, 0x0C, 0x00 ],
		clock_bpm:         [ 0xF0, 0x77, 0x77, 0x78, 0x0C, 0x01 ],
		mtc_toggle:        [ 0xF0, 0x77, 0x77, 0x78, 0x0C, 0x02 ],

		ithru_reset: 	   [ 0xF0, 0x77, 0x77, 0x78, 0x0E, 0x00 ],
		ithru_disable_all: [ 0xF0, 0x77, 0x77, 0x78, 0x0E, 0x01 ],
		ithru_set_usbidle: [ 0xF0, 0x77, 0x77, 0x78, 0x0E, 0x02 ],
		ithru_route:       [ 0xF0, 0x77, 0x77, 0x78, 0x0E, 0x03 ], 	

		route_reset:       [ 0xF0, 0x77, 0x77, 0x78, 0x0F, 0x00 ],
		route_set:         [ 0xF0, 0x77, 0x77, 0x78, 0x0F, 0x01 ],

		enable_bus:        [ 0xF0, 0x77, 0x77, 0x78, 0x10, 0x00, 0x01 ],
		disable_bus:       [ 0xF0, 0x77, 0x77, 0x78, 0x10, 0x00, 0x00 ],
		set_busid:         [ 0xF0, 0x77, 0x77, 0x78, 0x10, 0x01 ],

		pipeline_copy:     [ 0xF0, 0x77, 0x77, 0x78, 0x11, 0x00, 0x00 ],
		pipeline_clear:    [ 0xF0, 0x77, 0x77, 0x78, 0x11, 0x00, 0x01 ],
		pipeline_attach:   [ 0xF0, 0x77, 0x77, 0x78, 0x11, 0x00, 0x02 ],

		add_pipe:          [ 0xF0, 0x77, 0x77, 0x78, 0x11, 0x01, 0x00 ],
		insert_pipe:       [ 0xF0, 0x77, 0x77, 0x78, 0x11, 0x01, 0x01 ],
		replace_pipe:      [ 0xF0, 0x77, 0x77, 0x78, 0x11, 0x01, 0x02 ],
		clear_pipe:        [ 0xF0, 0x77, 0x77, 0x78, 0x11, 0x01, 0x03 ],
		clear_first_pipe:  [ 0xF0, 0x77, 0x77, 0x78, 0x11, 0x01, 0x04 ],
		bypass_pipe:       [ 0xF0, 0x77, 0x77, 0x78, 0x11, 0x01, 0x05 ]

	};

	class sxMaker {

		constructor(){}

		formatter(sysex) { 
			var webmidi = JSON.parse(JSON.stringify(sysex)).slice(2);
			var full = JSON.parse(JSON.stringify(sysex));
			full.push(247); 
			return { webmidi, full }
		}

		/* Global Functions */

		sxHwReset() 		{ return this.formatter(sysexLib.hw_reset) };
		sxIDRequest() 		{ return this.formatter(sysexLib.id_request) };
		sxAckToggle() 		{ return this.formatter(sysexLib.ack_toggle) };
		sxFactorySettings() { return this.formatter(sysexLib.factory_settings) };	
		sxSaveFlash() 		{ return this.formatter(sysexLib.save_flash) };
		sxBootSerial() 		{ return this.formatter(sysexLib.boot_serial) };
		sxFullDump() 		{ return this.formatter(sysexLib.config_request) };
		sxResetAll() 		{ return this.formatter(sysexLib.reset_all) };

		/* USB Device Settings */

	    sxSetProdString(prodstring) {
    		return this.formatter(sysexLib.usb_prod_string
    		.concat([
				~~prodstring
    		]));
	    }

	    sxSetVendProdID() {
	        return {
	            vendID : (vendID) => {
	                return {
	                    prodID : (prodID) => {
				    		return this.formatter(sysexLib.vend_prod_id
				    		.concat([
								~~vendID, ~~prodID
				    		]));
	                    }
	                };
	            }
	        };
	    }

		/* MIDI Clock Settings */

	    sxClock(clockid) {

            return {
                disable : () => {
		    		return this.formatter(sysexLib.clock_toggle
		    		.concat([
						~~clockid, 0
		    		]));
                }, 
                enable : () => {
		    		return this.formatter(sysexLib.clock_toggle
		    		.concat([
						~~clockid, 1
		    		]));
                },
                setBPM : (bpm) => {
		    		return this.formatter(sysexLib.clock_bpm
		    		.concat([
						~~clockid,~~bpm
		    		]));
                },
                disableMTC : () => {
		    		return this.formatter(sysexLib.mtc_toggle
		    		.concat([
						~~clockid, 0
		    		]));
                }, 
                enableMTC : () => {
		    		return this.formatter(sysexLib.mtc_toggle
		    		.concat([
						~~clockid, 1
		    		]));
                },

            }
	    }

		/* IntelliThru */

		sxResetIThru()      { return this.formatter(sysexLib.ithru_reset) };
		sxDisableAllIThru() { return this.formatter(sysexLib.ithru_disable_all) };
		sxSetUSBIdle()      { return this.formatter(sysexLib.ithru_set_usbidle) };
	    sxIntelliRoute()    {
        	return {
        		srcID : (srcID) => {
        			return {
	                    tgtType : (tgtType) => {
			                return {
			                    tgtIDs : (tgtIDs) => {
						    		return this.formatter(
							    		sysexLib.ithru_route
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

		/* Routes */

		sxResetRoutes() { return this.formatter(sysexLib.route_reset) };
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

	    /* Bus Mode */

		sxEnableBus() 	{ return this.formatter(sysexLib.enable_bus) };
		sxDisableBus() 	{ return this.formatter(sysexLib.disable_bus) };
	    sxSetBusID(busID) {
    		return this.formatter(sysexLib.set_busid
    		.concat([
				~~busID
    		]));
	    }

	    sxPipeline(pipelineID){

	        return {

                copyTo : (pipelineDestID) => {
		    		return this.formatter(sysexLib.pipeline_copy
		    		.concat([
						~~pipelineID, ~~pipelineDestID
		    		]));
                }, 
                clear : () => {
		    		return this.formatter(sysexLib.pipeline_clear
		    		.concat([
						~~pipelineID, 1
		    		]));
                }, 
                attachPort : () => {
                	return  {
			            portType : (portType) => {
			                return {
			                    portID : (portID) => {
						    		return this.formatter(sysexLib.pipeline_attach
						    		.concat([
										~~portType, ~~portID, ~~pipelineID
						    		]));
			                    }
			                };
			            }
					}
                },
                clearPort : () => {
                	return  {
			            portType : (portType) => {
			                return {
			                    portID : (portID) => {
						    		return this.formatter(sysexLib.pipeline_attach
						    		.concat([
										~~portType, ~~portID, 0
						    		]));
			                    }
			                };
			            }
					}
                }
            }
	    }


	    /* Transformations - Pipes */

	    sxAddPipe(pipelineID) {
	        return {
	            pipeID : (pipeID) => {
	                return {
	                    parms : (p1,p2,p3,p4) => {
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

	    sxInsertPipe(pipelineID) {
	        return {
	            slotID : (slotID) => {
	            	return {
	            		pipeID : (pipeID) => {
			                return {
			                    parms : (p1,p2,p3,p4) => {
						    		return this.formatter(
							    		sysexLib.insert_pipe
						    			.concat([
						    				~~pipelineID, ~~slotID, ~~pipeID
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

	    sxReplacePipe(pipelineID) {
	        return {
	            slotID : (slotID) => {
	            	return {
	            		pipeID : (pipeID) => {
			                return {
			                    parms : (p1,p2,p3,p4) => {
						    		return this.formatter(
							    		sysexLib.replace_pipe
						    			.concat([
						    				~~pipelineID, ~~slotID, ~~pipeID
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

	    sxClearPipe(pipelineID) {
	        return {
	            slotID : (slotID) => {

		    		return this.formatter(
			    		sysexLib.clear_pipe
		    			.concat([
		    				~~pipelineID, ~~slotID
		    			])
	    			);

	           	}
	    	}	
	    }
	    
	    sxBypassPipe(pipelineID) {
	        return {
	            slotID : (slotID) => {

		    		return this.formatter(
			    		sysexLib.bypass_pipe
		    			.concat([
		    				~~pipelineID, ~~slotID, 1
		    			])
	    			);

	           	}
	    	}	
	    }

	    sxReleaseBypass(pipelineID) {
	        return {
	            slotID : (slotID) => {
		    		return this.formatter(
			    		sysexLib.bypass_pipe
		    			.concat([
		    				~~pipelineID, ~~slotID, 0
		    			])
	    			);

	           	}
	    	}	
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



