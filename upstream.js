var http = require('http');

module.exports.tryFromAPI = function(EAN13, callback) {
    var options = {
        hostname: 'eandata.com',
        port: 80,
        path: '/feed/?v=3&keycode=D0B45D215311B7B7&mode=json&find='+EAN13+'&get=UPCA,UPCE,product,company',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    };

    var req = http.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(data) {
            console.log(JSON.parse(data));
            callback(null, JSON.parse(data));
        });
    });
    req.on('error', function(err) {
        console.log(err);
        callback(err);
    });
    req.end();
};

//module.exports.tryFromAPI('0000000001151');

module.exports.routes = function(app) {
    
}