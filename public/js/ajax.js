/* Generic AJAX */

ajaxPost = function(url, data, callback){

	$.ajax({
	  	type: "POST",
	  	url: url,	  	
	  	data: data,
	  	success: function(data){
	  		if (callback) callback(data);
	  	}, 
	  	error: function(err){
	  		if (callback) callback(err);
	  	}
	});

}
