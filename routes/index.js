
/*
 * simple blog with express & mongoDB
 */
var crypto = require('crypto'),
	User = require('../models/user.js');

module.exports = function (app){
	app.get('/',function(req,res){
		res.render('index',{
			title:'主页',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.get('/reg',checkNotLogin);
	app.get('/reg',function(req,res){
		res.render('reg',{
			title:'注册',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/reg',checkNotLogin);
	app.post('/reg',function(req,res){
		var name = req.body.name,
			password = req.body.password,
			//使用req.body.password-repeat均可，两种方法
			password_re = req.body['password-repeat'];//使用req.body.password-repeat均可，两种方法

		if(password_re != password){
			req.flash('error','Twice different password input!');
		}

		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		var newUser = new User({
			name: req.body.name,
			password: password,
			email: req.body.email
		});

		User.get(newUser.name, function(err,user){
			if(user){
				req.flash('error','The user has already exists.');
				return res.redirect('/reg');
			}

			newUser.save(function(err,user){
				if(err){
					req.flash('error',err);
					return res.redirect('/reg');
				}
				req.session.user = user;
				req.flash('success','success registed!');
				res.redirect('/');
			});
		});
	});

	app.get('/login',checkNotLogin);
	app.get('/login',function(req,res){
		res.render('login',{
			title:'登录',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/login',checkNotLogin);
	app.post('/login',function(req,res){
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');

		User.get(req.body.name,function(err,user){
			if(!user){
				req.flash('error','User not exists.');
				return res.redirect('/login');
			}
			if(user.password != password){
				req.flash('error','password is not correct.');
				return res.redirect('/login');
			}
			req.session.user = user;
			req.flash('success','Login success.');
			res.redirect('/');
		});
	});

	app.get('/post',checkLogin);
	app.get('/post',function(req,res){
		res.render('post',{title:'发布'});
	});

	app.post('/post',checkLogin);
	app.post('/post',function(req,res){
	});

	app.get('/login',checkLogin);
	app.get('/logout',function(req,res){
		req.session.user = null;
		req.flash('success','Logout success.');
		res.redirect('/');
	});

	//权限检查并控制
	function checkLogin(req, res, next){
		if(!req.session.user){
			req.flash('error','Not logged in')；
			res.redirect('/login');
		}
		next();
	}
	function checkNotLogin(req, res, next){
		if(req.session.user){
			req.flash('error','Already logged in')；
			res.redirect('back');
		}
		next();
	}

}