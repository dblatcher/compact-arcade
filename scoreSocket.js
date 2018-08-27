var socket = io();


socket.on('news', function (data) {
	console.log(data);
});

socket.on('highScoreTransmit', function (data) {
	document.getElementById("scoreOverlay").innerHTML = listFormat(data,10);
});

socket.on('errorWithDB', function (data) {
	console.log(data);
	if (data.errorCameFrom === 'highScoreTransmit') {
		document.getElementById("scoreOverlay").innerHTML = '(highscore not available)';
	};
	if (data.errorCameFrom === 'highScoreUpdate') {
		alert('Didn\'t save highscore. Are you offline?');
	};
});


function listFormat (data, numberOfEntries, filterFunction) {
	if (typeof(data.length) !== 'number') {return 'error'}
	if (typeof(filterFunction) !== 'function') {filterFunction = function(){return 1==1} }
	var filteredData = data.filter(filterFunction);
	
	if (typeof(numberOfEntries) !== 'number' || numberOfEntries<1) {numberOfEntries=filteredData.length}

	filteredData.sort(function(a,b){return b.score - a.score});

	var markedupScores = '<ol>';	
	for (p=0;p<numberOfEntries;p++){
		if (p<filteredData.length) {
			markedupScores += '<li>';
			markedupScores += filteredData[p].name + ': ' + filteredData[p].score + ' points';
			markedupScores += '</li>';
		}
	}
	markedupScores += '</ol>';	
	return markedupScores;
}