exports.stringify = function stringify(o) {
    return JSON.stringify(o);
}

exports.toStars = function toStars(args) { 
    var s=""; 
    for (var i = 0; i < args*1 || 0; i++) {s+='★';}; 
    return s; 
}