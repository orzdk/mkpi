# mkpi
 
![Screenshot](https://github.com/orzdk/mkpi/blob/master/doc/screenshot.png)

THIS IS A BETA. BACKUP ANY IMPORTANT ROUTING TABLES.

Now with raspi gpio API !

## Intro
MKPI is a frontend for USBMidiKliK - https://github.com/TheKikGen/USBMidiKliK4x4
To familiarize yourself with the priciples of routing and transformation applied in the UI, please refer to the USBMidiKliK4x4 sysex documentation first. 

## Users, logins

MKPI is a loginless solution. When you load the page, a unique userid will be created for you, and will be visible in the webpage header. Starts with "MK". This is now your login, and all saved scenes will be attached to this ID. 

IF you choose to save any scenes, BE SURE to click the "Set" button before !!! This will save the ID in a cookie and thereby ensure that a new ID is NOT generated the next time you load the page. 

IMPORTANT: If you save important route settings, please make a note of the MK number, IF YOU CLEAR YOUR COOKIES YOUR UNIQUE ID WILL BE LOST !!

If you wish to start over, just clear the MK number (it's actually a textbox), click "Set", reload the page and click Set again. Now you have a new fresh ID. You can use as many IDs as you wish.

## Usage
The UI has two main section. The upper section is for manipulating and configuring the USBMidiKliK settings, and the bottom section is a visual representation of the routes and transformations that are currently applied in your USBMidiKlik.

<b>Refresh:</b> Will request configuration from your unit and refresh the UI
<br><b>Reset routes:</b> Will request your unit to reset all routing settings
<br><b>Reset ithru:</b> Will request your unit to reset all intellithru routing settings
<br><b>HWReset:</b> Will hardware reset your unit
<br><b>Boot Serial:</b> Will boot your unit in serial configuration mode (please refer to documentation)
<br><b>Enable Bus: </b>Will set the unit in BUS mode
<br><b>Set Bus ID:</b> Will set the bus id of the unit (04 = master, 05-08 = slaves)

### Toggle Route
To toggle a route on/off select a source, sourceid, target, targetid and click Toggle. 
To toggle an intelliroute on/off select a source, sourceid, target, targetid and click Toggle Ithru. 

The currently selected route will be marked in the routechart as yellow. If you find this more annoying than informative, it can be disabled by selecting "Hide" in the togglepointer listbox.

## Attach pipeline
To attach a transformation pipeline to a source, select the appropriate pipeline id in the listbox, and click "Attach pipeline". The pipeline will be attached to the source selected in the "fromtype" & "fromid" listboxes.

## Attach pipe
To attach a pipe to a pipeline, select the pipe in the "pipe" listbox, select an operation in the box next to it, and fill out all nescessary (non-gray) parameters. The select a pipeline slot, and if you just want to attach at the first available position, leave the pipeline slot unchanged, and click "Add pipe". The pipe will be attached to the first available slot. If you want to attach the pipe in a specific position, select the position and click "Insert pipe" if its free, or "Replace pipe" if its occupied.

## Save configuration
Supply a name in the "scenename" textbox and click save. The "scene" listbox will go red while saving, and when the red turns off, the scene is saved. To reload the scene, select in the "scene" listbox and click load. Screen will flicker and load your scene. Please observe to use new names, saving with same name as existing is not checked and will cause undefined behaviour. 

IMPORTANT: Please refer to usermanagement/login section in the beginning of this document for correct and safe operation of this function. 

## UI Operation
A number of sliders has been provided for configuring the UI. First 4 controls the min/max visible window of input/output channel ID's, second pair is padding and spacing in the chart, and the third pair controls font size and "bendsize" (arrow bend tightness in chart)

Next pair controls if you want to see the chart horizontally or vertically aligned, and the pathfinding rank algorithm used in the chart. If you have few routes and no pipes configured, you will see very few differences. If you have huge complex setup, you may need to adjust these for optimal experience. 

The lonely slider (awww) controls if unused in/outputs are visible. Last pair controls if parameter 1 (command) of a pipe in a pipeline is displayed, and finally a global zoom. 


# API:

## Global Functions

/api/resethardware  
/api/idrequest  
/api/acktoggle  
/api/factorysettings  
/api/saveflash  
/api/bootserial  
/api/fulldump  
/api/resetall  

## USB Device Settings

/api/setprodstring/:prodstring  
/api/setprodstring/:vendID/:prodID  

## MIDI Clock Settings

/api/clockdisable/:clockid  
/api/clockenable/:clockid  
/api/mtcdisable/:clockid  
/api/mtcenable/:clockid  
/api/setclockbpm/:clockid/:bpm  

## IntelliThru
/api/resetroutingithru  
/api/disableallithru  
/api/resetroutingithru/:usbidle  
/api/toggleiroute/:srcID/:tgtType/:tgtIDs  


## Routes
/api/resetrouting  
/api/route/:srcType/:srcID/:tgtType/:tgtIDs  


## Bus Mode
/api/enablebus  
/api/disablebus  
/api/setdeviceid/:busID  

## Transformations - Pipelines
/api/attachpipeline/:pipelineID/:portType/:portID  
/api/detachpipeline/:portType/:portID  

## Transformations - Pipes
/api/addpipe/:pipelineID/:pipeID/:pp1/:pp2/:pp3/:pp4  
/api/insertpipe/:pipelineID/:pipelineSlotID/:pipeID/:pp1/:pp2/:pp3/:pp4  
/api/replacepipe/:pipelineID/:pipelineSlotID/:pipeID/:pp1/:pp2/:pp3/:pp4  
/api/clearpipe/:pipelineID/:pipelineSlotID  
/api/bypasspipe/:pipelineID/:pipelineSlotID  
/api/releasebypasspipe/:pipelineID/:pipelineSlotID  

## Scenes
/deletescene {user, scene}  
/findscenerecords {user, scene}  
/findscenes {user}  
/createsysexrecords {user, scene, [sysex]}  


# Module (sysexmaker.js)

## Global Functions  
sxMaker.sxHwReset()   
sxMaker.sxIDRequest()   
sxMaker.sxAckToggle()  
sxMaker.sxFactorySettings()   
sxMaker.sxSaveFlash()  
sxMaker.sxBootSerial()  
sxMaker.sxFullDump()  
sxMaker.sxResetAll()  

## USB Device Settings
sxMaker.sxSetProdString(prodstring)  
sxMaker.sxSetVendProdID().vendID(vendID).prodID(prodID)  

## MIDI Clock Settings
sxMaker.sxClock(clockid).disable()  
sxMaker.sxClock(clockid).enable()  
sxMaker.sxClock(clockid).disableMTC()  
sxMaker.sxClock(clockid).enableMTC()  
sxMaker.sxClock(clockid).setBPM(bpm)  

## IntelliThru
sxMaker.sxResetIThru()  
sxMaker.sxDisableAllIThru()   
sxMaker.sxSetUSBIdle()  
sxMaker.sxIntelliRoute().srcID(srcID).tgtType(tgtType).tgtIDs([tgtIDs])  

## Routes
sxMaker.sxResetRoutes()  
sxMaker.sxRoute().srcType(srcType).srcID(srcID).tgtType(tgtType).tgtIDs([tgtIDs])   

## Bus Mode
sxMaker.sxEnableBus()  
sxMaker.sxDisableBus()  
sxMaker.sxSetBusID(busID)  

## Transformations - Pipelines
sxMaker.sxPipeline().clearPort(portID)  
sxMaker.sxPipeline(pipeLineID).copyTo(pipeLineDestID)  
sxMaker.sxPipeline(pipeLineID).clearPort().portType(portType).portID(portID)  
sxMaker.sxPipeline(pipeLineID).attachPort().portType(portType).portID(portID)  

## Transformations - Pipes
sxMaker.sxAddPipe(pipelineID).pipeID(pipeID).parms(pp1, pp2, pp3, pp4);  
sxMaker.sxInsertPipe(pipelineID).slotID(slotID).pipeID(pipeID).parms(pp1, pp2, pp3, pp4);  
sxMaker.sxReplacePipe(pipelineID).slotID(slotID).pipeID(pipeID).parms(pp1, pp2, pp3, pp4);  
sxMaker.sxClearPipe(pipelineID).slotID(slotID);  
sxMaker.sxBypassPipe(pipelineID).slotID(slotID);  
sxMaker.sxReleaseBypassPipe(pipelineID).slotID(slotID);  


USBMidikliK, USB MIDI Router, MIDI Router, MIDI Transformer, MIDI Interface, MIDI Modifier, MIDI Message Modifier, MIDI Merge, MIDI Change
