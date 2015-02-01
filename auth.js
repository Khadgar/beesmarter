module.exports = function (passport, LocalStrategy, Teams) {

	passport.use(new LocalStrategy(
			function (username, password, done) {
			process.nextTick(function () {
				Teams.findOne({
					'TeamID' : username
				},
					function (err, user) {
					if (err) {
						console.log('Error');
						return done(err);
					}
					if (!user) {
						return done(null, false);
					}
					if (user.TeamID != username) {
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

	passport.serializeUser(function (user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function (id, done) {
		Teams.findById(id, function (err, user) {
			done(err, user);
		});
	});

}
