var http = require('http');
var mysql = require('mysql');

function addProduct(db, APIdata, callback) {
    var query = 'INSERT INTO ean_product VALUES (?,?,?,NULL,NULL,NOW())';
    var sub = [APIdata.product.EAN13, APIdata.product.UPCA, APIdata.product.UPCE];
    console.log('INSERT FUN TIME');
    query = mysql.format(query, sub);
    console.log(query);
    db.query(query, function(err, res) {
        if (err) {
            console.log(err);
            callback(err);
        } else {
            query = 'INSERT INTO attr_product VALUES (?,?,NOW())';
            sub = [APIdata.product.EAN13, APIdata.product.attributes.product];
            query = mysql.format(query, sub);
            db.query(query, function(e2, r2) {
                if (e2) {
                    console.log(e2);
                    callback(e2);
                } else {
                    callback(null, [APIdata.product.attributes.product]);
                }
            });
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
        //var resData = '';
        res.setEncoding('utf8');
        res.on('data', function(data) {
            console.log('API DATA READ');
            console.log(data);
            //resData += data;

            try {
                var parsed = JSON.parse(data);
            } catch (e) {
                console.log('JSON parse error.');
                console.log(e);
                return callback(e, null);
            }

            console.log(parsed);
            // Insert parsed into DB
            
            if (parsed.status.code == '200') {
                addProduct(db, parsed, callback);
                //callback(null, parsed);
            } else {
                callback(parsed.status.message, null);
            }
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