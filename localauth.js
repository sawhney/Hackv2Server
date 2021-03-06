var bcrypt = require('bcrypt-nodejs');
// callback(err, id)

function register(user, password, callback) {
    bcrypt.hash(password, null, null, function(err, hash) {
	if (err) {
	    console.log('Failed to hash password.');
	    console.log(err);
	    callback(err, null);
	} else {
	    db.addNewUser(user, hash, callback);
	}
    });
}

function compare(pass, hash) {
	return bcrypt.compareSync(pass, hash);
}

function localVerify(username, password, done) {
    console.log("Verifying user: " + username);
    var passHash = db.getUserHash(username, function(err, user, hash) {
	if (err) {
	    console.log(err);
	    return done(err, null);
	} else if (user === null || hash === null) {
	    return done('Unregistered user.', null);
	} else {
	    bcrypt.compare(password, hash, function(hErr, correct) {
		if (hErr) {
		    return done(hErr, null);
		} else if (correct) {
		    return done(null, user);
		} else {
		    return done(null, false);
		}
	    });
	}
    });
}

var StrategyOptions = Object.freeze({
    usernameField: 'email',
    passwordField: 'pass'
});

var BcryptLocalStrategy = new LocalStrategy(StrategyOptions, localVerify);

function authRoutes(app) {
    app.post('/register', function(req, res) {
	if (req.body.email && req.body.pass) {
	    var name = req.body.name;
	    var pass = req.body.pass;
            if (name && pass) {
                
            }
	    if (user.id === false) {
		// Details of user are invalid.
		res.send({'res':false, 'err':{'code':1, 'msg':'User details are invalid!'}});
	    } else {
		register(user, pass, function(err, id) {
		    if (err) {
			// Registration failed, notify api.
			console.log('Registration failed:');
			console.log(err);
			res.send({'res':false, 'err':{'code':2, 'msg':'Registration failed.'}});
		    } else {
			// Update id from DB insertion.
			user.id = id;
			console.log(['Registered user:',id,mail,pass,name,priv,grav].join(" "));
			res.send({'res':true, 'user':user});
			// Login the newly registered user.
			req.login(user, function(err) {
			    if (err) {
				// Login failed for some reason.
				console.log('Post registration login failed:')
				console.log(err);
			    }
			});
		    }
		});
	    }
	} else {
	    res.send({'res':false, 'err':{'code':3, 'msg':'Invalid request.'}});
	}
    });

    // Login callback - user auth
    app.post('/login', function(req, res, next) {
	passport.authenticate('local', function(err, user, info) {
	    if (err) {
		return next(err);
	    } else if (!user) {
		return res.send({'res':false, 'err':'No user'});
	    }
	    req.logIn(user, function(err) {
		if (err) {
		    return next(err);
		} else {
		    return res.send({'res':true, 'user':user});
		}
	    });
	})(req, res, next);
    });
}

module.exports = {LocalStrategy:BcryptLocalStrategy, register:register, compare:compare, authRoutes:authRoutes};
