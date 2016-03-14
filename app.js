
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var MongoStore = require('connect-mongo')(express);
var settings = require('./settings');
var flash = require('connect-flash');

var bodyParser = require('body-parser');
var methodOverride = require('method-override');

var app = express();

var passport = require('passport'),
	GithubStrategy = require('passport-github').Strategy;

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(flash());
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(bodyParser());
app.use(methodOverride());//connect内建的中间件，协助处理POST请求，伪装PUT/DELETE等其他HTTP方法
app.use(express.cookieParser());
app.use(express.session({
	secret: settings.cookieSecret,
	key: settings.db,
	cookie: {maxAge: 1000*60*60*24*7},
	store: new MongoStore({
		//db: settings.db
		url: 'mongodb://localhost/db'//上面的写法可能导致错误
	})
}));
app.use(passport.initialize());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

passport.use(new GithubStrategy({
	clientID: "dettac",
	clientSecret: "123456",
	callbackURL: "http://ohao.ren/"
},function(accessToken, refreshToken, profile, done){
	done(null, profile);
}));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

routes(app);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
