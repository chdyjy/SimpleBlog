
/*
 * simple blog with express & mongoDB
 */
var crypto = require('crypto'),
	Post = require('../models/post.js'),
	User = require('../models/user.js'),
	Comment = require('../models/comment.js'),
	PAGE_LIMIT = require('../settings').PAGE_LIMIT,
	passport = require('passport');

module.exports = function (app){
	app.get('/',function(req,res){
		var page = req.query.p ? parseInt(req.query.p) : 1;

		Post.getAll(null, page,function(err,posts,total){
			if(err){
				posts = [];
			}
			res.render('index',{
				title:'Index',
				page: page,
				isFirstPage: (page - 1) == 0,
				isLastPage: (page - 1) * PAGE_LIMIT + posts.length == total,
				user: req.session.user,
				posts: posts,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.get('/reg',checkNotLogin);
	app.get('/reg',function(req,res){
		res.render('reg',{
			title:'register',
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
			title:'Login',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.get('/login/github',passport.authenticate("github",{session:false}));
	app.get('/login/github/callback',passport.authenticate("github",{
		session:false,
		failureRedirect: '/login',
		successFlash: 'Login by GitHub Passport successful.'
	}),function(req,res){
		req.session.user = {name:req.user.username};
		res.redirect('/');
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
		res.render('post',{
			title:'Post',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/post',checkLogin);
	app.post('/post',function(req,res){
		var currentUser = req.session.user,
			post = new Post(currentUser.name,req.body.title,req.body.post);
		post.save(function(err){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			req.flash('success','success post.');
			res.redirect('/');
		});
	});

	app.get('/login',checkLogin);
	app.get('/logout',function(req,res){
		req.session.user = null;
		req.flash('success','Logout success.');
		res.redirect('/');
	});

	app.get('/archive',function(req, res){
		Post.getArchive(function(err,posts){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('archive',{
				title: 'Archives',
				posts: posts,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.get('/u/:name',function(req,res){
		var page = req.query.p ? parseInt(req.query.p) : 1;
		User.get(req.params.name,function(err,user){
			if(!user){
				req.flash('error','user not exists.');
				return res.redirect('/');
			}
			Post.getAll(user.name, page, function(err,posts,total){
				if(err){
					req.flash('error',err);
					return res.redirect('/');
				}
				res.render('user',{
					title: user.name,
					posts: posts,
					page: page,
					isFirstPage: (page - 1) == 0,
					isLastPage: (page - 1) * PAGE_LIMIT + posts.length == total,
					user: req.session.user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			});
		});
	});

	app.get('/u/:name/:day/:title',function(req, res){
		Post.getOne(req.params.name, req.params.day, req.params.title, function(err,post){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('article',{
				title: req.params.title,
				post: post,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.post('/u/:name/:day/:title',checkLogin);
	app.post('/u/:name/:day/:title',function(req,res){
		var date = new Date(),
			website = "/u/" + req.session.user.name,
			time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " 
			     + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) ;

		var comment = {
			name: req.session.user.name,
			time: time,
			email: req.session.user.email,
			website: website,
			content: req.body.content
		};
		var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
		newComment.save(function(err){
			if(err){
				req.flash('error',err);
				return res.redirect('back');
			}
			req.flash('success','Reply success.');
			res.redirect('back');
		});
	});

	app.get('/edit/:name/:day/:title',checkLogin);
	app.get('/edit/:name/:day/:title',function(req, res){
		var currentUser = req.session.user;
		Post.edit(currentUser.name, req.params.day, req.params.title, function(err,post){
			if(err){
				req.flash('error',err);
				return res.redirect('back');
			}
			res.render('edit',{
				title: 'edit',
				post: post,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.post('/edit/:name/:day/:title',checkLogin);
	app.post('/edit/:name/:day/:title',function(req, res){
		var currentUser = req.session.user;
		Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function(err){
			var url = '/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title;
			if(err){
				req.flash('error',err);
				return res.redirect(url);
			}
			req.flash('success','success update.');
			res.redirect(url);
		});
	});

	app.get('/remove/:name/:day/:title',checkLogin);
	app.get('/remove/:name/:day/:title',function(req, res){
		var currentUser = req.session.user;
		Post.remove(currentUser.name, req.params.day, req.params.title, function(err){
			if(err){
				req.flash('error',err);
				return res.redirect('back');
			}
			req.flash('success','delete this post succeed.');
			res.redirect('/');
		});
	});

	//权限检查并控制
	function checkLogin(req, res, next){
		if(!req.session.user){
			req.flash('error','Not logged in');
			res.redirect('/login');
		}
		next();
	}
	function checkNotLogin(req, res, next){
		if(req.session.user){
			req.flash('error','Already logged in');
			res.redirect('back');
		}
		next();
	}

}