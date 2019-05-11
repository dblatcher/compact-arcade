fs = require("fs");

function saveJson(fileName, path, data) {
	return new Promise ( function (resolve,reject){
		var dest = path + '/' + fileName ;
		var content = JSON.stringify(data);
		fs.writeFile(dest, content, 'utf8', function(err){
			if (err) {reject(err)};
			resolve('saved:'+path+'/'+fileName);
		});
	});
};

module.exports = saveJson;