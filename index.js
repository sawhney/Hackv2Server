var express = require('express');
var app = express();
var mysql = require('mysql');
var dbCFG = require('./db_settings.json');
var connPool = mysql.createPool(dbCFG);
var bcrypt = require('bcrypt-nodejs');
 
app.listen(3000);
app.use(express.bodyParser());

app.get('/hello', function(request, response) {
    response.send({res:true, msg:"yoyoyo"});
});

app.get('/', function(req, res) {
    return res.send({
        res: false,
        err: {
            code: 998,
            msg: 'Hackv2 API SERVER\n'
        }
    });
});

// Root callback - show req
app.post('/', function(req, res) {
    console.log(req);
    return res.send({
        'res': false,
        'err': {
            'code': 999,
            'msg': 'Hackv2 API SERVER\n'
        }
    });
});

app.post('/register', function(req, res) {
    console.log(req);
});
    

function getProductInfo(id, callback) {
    var query = "SELECT `product` FROM `attr_product` WHERE `EAN13` LIKE ?";
    var sub = ['%'+id];
    query = mysql.format(query, sub);
    console.log(query);
    connPool.getConnection(function(connErr, conn) {
        if (connErr) {
            return callback('Database error', false);
        }

        conn.query(query, function(err, res) {
            if (err) {
                console.log(err.code);
                callback(err, null);
            } else {
                callback(null, res);
            }
        });

        conn.release();
    });
}

app.get('/lookup/:id', function(req, res) {
    var id = req.params.id
    console.log(id);
    getProductInfo(id, function(err, result) {
        if (err) {
            res.send({
                'res': false,
                'err': {
                    'code': 2,
                    'msg': 'Error on the server'
                }
            });
        } else if (result.length === 0 ) {
            res.send({
                'res': false,
                'err': {
                    'code': 3,
                    'msg': 'Product not found'
                }
            });
        } else {
            res.send({
                'res': true,
                'data': result[0]
            });
        }
    });
      
});

function register(user, password, callback) {
    bcrypt.hash(password, null, null, function(err, hash) {
	if (err) {
	    console.log('Failed to hash password.');
	    console.log(err);
	    callback(err, null);
	} else {
	    addNewUser(user, hash, callback);
	}
    });
}

function getUserHash(username, hash, callback) {
    var query = "SELECT `hash` FROM USERS WHERE `username`=?";
    var sub = [username];
    query = mysql.format(query, sub);

    connPool.getConnection(function(connErr, conn) {
        if (connErr) {
            return callback('Database error', false);
        }

        conn.query(query, function(err, res) {
            if (err) {
                console.log(err.code);
                callback(err, null);
            } else {
                callback(null, res);
            }
        });

        conn.release();
    });
}

function localVerify(username, password, done) {
    console.log("Verifying user: " + username);
    var passHash = getUserHash(username, function(err, results) {
	if (err) {
	    console.log(err);
	    return done(err, null, null);
	}
        if(results.length < 1) {
            // No user
            return done(null, null, null);
        }
        var hash = results[0].hash;
        if (hash === null) {
            // No user
	    return done(null, null, null);
	} else {
	    bcrypt.compare(password, hash, function(hErr, correct) {
		if (hErr) {
		    return done(null, hErr, null);
		} else {
		    return done(null, null, correct);
		}
	    });
	}
    });
}

function addNewUser(username, hash, callback) {
    var query = "INSERT INTO `users` VALUES (null, ?, ?)";
    var sub = [username, hash];
    query = mysql.format(query, sub);

    connPool.getConnection(function(connErr, conn) {
        if (connErr) {
            return callback('Database error', false);
        }

        conn.query(query, function(err, res) {
            if (err) {
                console.log(err.code);
                callback(err, null);
            } else {
                callback(null, res);
            }
        });

        conn.release();
    });
}

    app.post('/register', function(req, res) {
	if (req.body.email && req.body.pass) {
	    var name = req.body.name;
	    var pass = req.body.pass;
            if (!(name && pass)) {
		// Details of user are invalid.
		res.send({'res':false, 'err':{'code':1, 'msg':'User details are invalid!'}});
	    } else {
		register(user, pass, function(err, id) {
		    if (err) {
			// Registration failed, notify api.
			console.log('Registration failed:');
			console.log(err);
			res.send({'res':false, 'err':{'code':2, 'msg':'Registration failed.'}});
		    }
                    else {
                        res.send({'res': true});
                    }
               });
	    }
        } else {
	    res.send({'res':false, 'err':{'code':3, 'msg':'Invalid request.'}});
	}
    });

    // Login callback - user auth
    app.post('/login', function(req, res) {
        // Get the user/pass from req
        // Check with db
        // In callback check with bcrypt
        var username = req.body.username;
        var password = req.body.password;
        localVerify(username, password, function(dberr, bcerr, correct) {
            // If dbErr, database broken
            // If bcerr, weird hash
            // if all null, no user
            // correct = password matches?
            if(dberr || bcerr) {
                res.send({'res':false, 'err':{'code':2, 'msg':'Internal Server Error'}});
            } else if(correct) {
                res.send({'res':true});
            } else {
                res.send({'res':false, 'err':{'code':3, 'msg':'Invalid username or password'}});
            }
        });
    });