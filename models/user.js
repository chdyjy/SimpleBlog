var mongodb = require('./db');

function User(user){
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
};

module.exports = User;
//用户信息储存
User.prototype.save = function(callback){
	var user = {
		name: this.name,
		password: this.password,
		email: this.email
	};

	mongodb.open(function (err,db){
		if(err){
			return callback(err);
		}
		//读取users集合
		db.collection('users',function(err,collection){
			if(err){
				mongodb.close();//出错，关闭mongodb，返回err信息
				return callback(err);
			}
			//将用户数据插入users集合
			collection.insert(user,{
				safe: true
			},function(err,user){
				mongodb.close();//无论是否错误都关闭mongodb
				if(err){
					return callback(err);
				}
				callback(null,user[0]);
			});
		});
	});
};

//用户信息读取
User.get = function(name,callback){
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//读取users集合
		db.collection('users',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.findOne({
				name: name
			},function(err,user){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,user);
			});
		});
	});
};