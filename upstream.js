var http = require('http');
var mysql = require('mysql');

function addProduct(db, APIdata, callback) {
    var query = 'INSERT INTO `products` VALUES (?,?,?,NULL,?,NOW())';

    // Replace n/a values with NULLs
    if (APIdata.product.UPCA === 'n/a') {
        APIdata.product.UPCA = null;
    }
    if (APIdata.product.UPCE === 'n/a') {
        APIdata.product.UPCE = null;
    }
    if (APIdata.product.attributes.product.trim() == '') {
        APIdata.product.attributes.product = null;
    }

    var sub = [APIdata.product.EAN13, APIdata.product.UPCA, APIdata.product.UPCE, APIdata.product.attributes.product];

    console.log('INSERT FUN TIME');
    query = mysql.format(query, sub);
    console.log(query);
    return db.query(query, function(err, res) {
        if (err) {
            console.log(err);
            return callback(err);
        } else {
            console.log('FINISHED INSERTING LIKE A BAWSE');
            return callback(null, [APIdata.product.attributes.product]);
        }
    });
}

module.exports.tryFromAPI = function(EAN13, db, callback) {
    var options = {
        hostname: 'eandata.com',
        port: 80,
        path: '/feed/?v=3&keycode=D0B45D215311B7B7&mode=json&find='+EAN13+'&get=EAN13,UPCA,UPCE,product,company',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    };

    var req = http.request(options, function(res) {
        var resData = '';
        res.setEncoding('utf8');
        res.on('data', function(data) {
            console.log('API DATA READ');
            //console.log(data);
            resData += data;

        });
        res.on('end', function() {
            console.log('API Data end.');
            try {
                var parsed = JSON.parse(resData);
            } catch (e) {
                console.log('JSON parse error.');
                console.log(e);
                return callback(e, null);
            }

            console.log(parsed);
            // Insert parsed into DB
            
            if (parsed.status.code == '200') {
                console.log('Got API data, sending to DB.');
                return addProduct(db, parsed, callback);
            } else {
                return callback(parsed.status.message, null);
            }
        });
    });
    req.on('error', function(err) {
        console.log(err);
        return callback(err);
    });
    req.end();
};

//module.exports.tryFromAPI('0000000001151');

module.exports.routes = function(app) {
    
}
