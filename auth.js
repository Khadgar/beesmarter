module.exports = function(passport, LocalStrategy, Users) {

	passport.use(new LocalStrategy(
		function(username, password, done) {
			process.nextTick(function() {
				Users.findOne({
						'ID': username
					},
					function(err, user) {
						if (err) {
							console.log('Error');
							return done(err);
						}
						if (!user) {
							return done(null, false);
						}
						if (user.ID != username) {
							console.log('Error in username');
							return done(null, false);
						}
						if (user.Password != password) {
							console.log('Error in password');
							return done(null, false);
						}
						return done(null, user);

					});
			});
		}));

	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
		Users.findById(id, function(err, user) {
			done(err, user);
		});
	});

};