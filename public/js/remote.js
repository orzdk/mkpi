/* Socket Handling */

var socket = io();

socket.on('connect', function(data){

	var mkid = $("#mkid").val();

	if (mkid != "")
		
    socket.emit('register', { type: 'remotecontrol', mkid });

	socket.on('event', function(data){
	    console.log("event");
	    console.log(data);
	});

	socket.on('disconnect', function(){
	    console.log("disconnect");    
	});

	/* Route Toggle */

	var toggleRouteBit = function(){
		var srctype = $("#fromType").val();
		var srcid = $("#fromID").val();
		var tgttype = $("#toType").val();
		var tgtID = $("#toID").val();
		var mkid = $("#mkid").val();

		$.cookie('mkid', mkid, { expires: 999 });

		socket.emit('toggleroute', { type: "routerequest", mkid, srctype, srcid, tgttype, tgtID });
	}

	$("#sendroute").on("click", toggleRouteBit);

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


});