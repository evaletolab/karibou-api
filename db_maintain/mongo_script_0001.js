exports.execute = function(callback){
	console.log("execute dummy-script 0001");
	return callback(null, "0001 was done");
}