/**
 * This little promise function must be replaced
 * @return {[type]} [description]
 */
var promise = function(){
		this.on = null;
	};
promise.prototype.solve = function(){
	if(this.on instanceof Function){
		this.on();
	}
};

promise.prototype.reject = function(err){
	err = err || 'generic error';
	if(this.on instanceof Function){
		this.on(err);
	}
};

describe("Router suite.", function() {
	it("Check that Router exists and is a Function", function() {
  		Router.should.be.ok;
	});

	var router;

	describe('Testing simple route',function(){
		var p,bp,
			href ='#/user/jhon';

		beforeEach(function(){
			router = new Router();
		});

		describe("Once router is instantiated,",function(){
			it('it is defined',function(){
		  		router.should.be.an.instanceOf(Router);
			});
			it("it has ['redirect','setLocation','add','get','addRoute','play','pause'] methods",function(){
				['redirect','add','get','addRoute','play','pause','setLocation'].forEach(function(prop){
					router.should.have.property(prop);
				});
			});		
		});

		describe("Navigating to #/user/jhon",function(){
			beforeEach(function(){
				p = new promise();
				bp = new promise();
				router = null;
				router = new Router()
					.before(function(req,next){
						req.should.have.property('href');
						bp.solve();
						next();
					})
					.add('/user/:username',function(req,next){
						req.should.have.property('href','#/user/jhon');
						req.params.should.have.property('username','jhon');
						p.solve();
					})
					.run('#/');
			});
			it('it runs "befores"',function(done){
				bp.on=done;
				window.document.location.href = href;
			});
			it('it reachs /user/:username route, and :username is "jhon"',function(done){
				p.on=done;
				window.document.location.href = href;			
			});
		});
	});	
  
});