(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (document.readyState === 'complete' ||
    document.readyState === 'interactive') {
    window.setTimeout(_boot, 0);
} else {
    document.addEventListener('DOMContentLoaded', _boot, false);
    window.addEventListener('load', _boot, false);
}

function _boot() {
    if (!document.body) {
        window.setTimeout(_boot, 20);
    } else {
        document.removeEventListener('DOMContentLoaded', _boot);
        window.removeEventListener('load', _boot);

        window.log = console.log.bind(console);

        var riverrun = require('./riverrun.js');
        riverrun();
    }
};

},{"./riverrun.js":4}],2:[function(require,module,exports){
/*! qwest 1.5.1 (https://github.com/pyrsmk/qwest) */

;(function(context,name,definition){
	if(typeof module!='undefined' && module.exports){
		module.exports=definition;
	}
	else if(typeof define=='function' && define.amd){
		define(definition);
	}
	else{
		context[name]=definition;
	}
}(this,'qwest',function(){

	var win=window,
		doc=document,
		before,
		// Variables for limit mechanism
		limit=null,
		requests=0,
		request_stack=[],
		// Get XMLHttpRequest object
		getXHR=function(){
				return win.XMLHttpRequest?
						new XMLHttpRequest():
						new ActiveXObject('Microsoft.XMLHTTP');
			},
		// Guess XHR version
		xhr2=(getXHR().responseType===''),

	// Core function
	qwest=function(method,url,data,options,before){

		// Format
		method=method.toUpperCase();
		data=data || null;
		options=options || {};

		// Define variables
		var nativeResponseParsing=false,
			crossOrigin,
			xhr,
			xdr=false,
			timeoutInterval,
			aborted=false,
			retries=0,
			headers={},
			mimeTypes={
				text: '*/*',
				xml: 'text/xml',
				json: 'application/json',
				arraybuffer: null,
				formdata: null,
				document: null,
				file: null,
				blob: null
			},
			contentType='Content-Type',
			vars='',
			i,j,
			serialized,
			then_stack=[],
			catch_stack=[],
			complete_stack=[],
			response,
			success,
			error,
			func,

		// Define promises
		promises={
			then:function(func){
				if(options.async){
					then_stack.push(func);
				}
				else if(success){
					func.call(xhr,response);
				}
				return promises;
			},
			'catch':function(func){
				if(options.async){
					catch_stack.push(func);
				}
				else if(error){
					func.call(xhr,response);
				}
				return promises;
			},
			complete:function(func){
				if(options.async){
					complete_stack.push(func);
				}
				else{
					func.call(xhr);
				}
				return promises;
			}
		},
		promises_limit={
			then:function(func){
				request_stack[request_stack.length-1].then.push(func);
				return promises_limit;
			},
			'catch':function(func){
				request_stack[request_stack.length-1]['catch'].push(func);
				return promises_limit;
			},
			complete:function(func){
				request_stack[request_stack.length-1].complete.push(func);
				return promises_limit;
			}
		},

		// Handle the response
		handleResponse=function(){
			// Verify request's state
			// --- https://stackoverflow.com/questions/7287706/ie-9-javascript-error-c00c023f
			if(aborted){
				return;
			}
			// Prepare
			var i,req,p,responseType;
			--requests;
			// Clear the timeout
			clearInterval(timeoutInterval);
			// Launch next stacked request
			if(request_stack.length){
				req=request_stack.shift();
				p=qwest(req.method,req.url,req.data,req.options,req.before);
				for(i=0;func=req.then[i];++i){
					p.then(func);
				}
				for(i=0;func=req['catch'][i];++i){
					p['catch'](func);
				}
				for(i=0;func=req.complete[i];++i){
					p.complete(func);
				}
			}
			// Handle response
			try{
				// Verify status code
				// --- https://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
				if('status' in xhr && !/^2|1223/.test(xhr.status)){
					throw xhr.status+' ('+xhr.statusText+')';
				}
				// Init
				var responseText='responseText',
					responseXML='responseXML',
					parseError='parseError';
				// Process response
				if(nativeResponseParsing && 'response' in xhr && xhr.response!==null){
					response=xhr.response;
				}
				else if(options.responseType=='document'){
					var frame=doc.createElement('iframe');
					frame.style.display='none';
					doc.body.appendChild(frame);
					frame.contentDocument.open();
					frame.contentDocument.write(xhr.response);
					frame.contentDocument.close();
					response=frame.contentDocument;
					doc.body.removeChild(frame);
				}
				else{
					// Guess response type
					responseType=options.responseType;
					if(responseType=='auto'){
						switch(xhr.getResponseHeader(contentType)){
							case mimeTypes.json:
								responseType='json';
								break;
							case mimeTypes.xml:
								responseType='xml';
								break;
							default:
								responseType='text';
						}
					}
					// Handle response type
					switch(responseType){
						case 'json':
							try{
								if('JSON' in win){
									response=JSON.parse(xhr[responseText]);
								}
								else{
									response=eval('('+xhr[responseText]+')');
								}
							}
							catch(e){
								throw "Error while parsing JSON body : "+e;
							}
							break;
						case 'xml':
							// Based on jQuery's parseXML() function
							try{
								// Standard
								if(win.DOMParser){
									response=(new DOMParser()).parseFromString(xhr[responseText],'text/xml');
								}
								// IE<9
								else{
									response=new ActiveXObject('Microsoft.XMLDOM');
									response.async='false';
									response.loadXML(xhr[responseText]);
								}
							}
							catch(e){
								response=undefined;
							}
							if(!response || !response.documentElement || response.getElementsByTagName('parsererror').length){
								throw 'Invalid XML';
							}
							break;
						default:
							response=xhr[responseText];
					}
				}
				// Execute 'then' stack
				success=true;
				p=response;
				if(options.async){
					for(i=0;func=then_stack[i];++i){
						p=func.call(xhr,p);
					}
				}
			}
			catch(e){
				error=true;
				// Execute 'catch' stack
				if(options.async){
					for(i=0;func=catch_stack[i];++i){
						func.call(xhr,e+' ('+url+')');
					}
				}
			}
			// Execute complete stack
			if(options.async){
				for(i=0;func=complete_stack[i];++i){
					func.call(xhr);
				}
			}
		},

		// Recursively build the query string
		buildData=function(data,key){
			var res=[],
				enc=encodeURIComponent,
				p;
			if(typeof data==='object' && data!=null) {
				for(p in data) {
					if(data.hasOwnProperty(p)) {
						res=res.concat(buildData(data[p],key?key+'['+p+']':p));
					}
				}
			}
			else if(data!=null && key!=null){
				res.push(enc(key)+'='+enc(data));
			}
			return res.join('&');
		};

		// New request
		++requests;

		// Normalize options
		options.async='async' in options?!!options.async:true;
		options.cache='cache' in options?!!options.cache:(method!='GET');
		options.dataType='dataType' in options?options.dataType.toLowerCase():'post';
		options.responseType='responseType' in options?options.responseType.toLowerCase():'auto';
		options.user=options.user || '';
		options.password=options.password || '';
		options.withCredentials=!!options.withCredentials;
		options.timeout=options.timeout?parseInt(options.timeout,10):3000;
		options.retries=options.retries?parseInt(options.retries,10):3;

		// Guess if we're dealing with a cross-origin request
		i=url.match(/\/\/(.+?)\//);
		crossOrigin=i && i[1]?i[1]!=location.host:false;

		// Prepare data
		if('ArrayBuffer' in win && data instanceof ArrayBuffer){
			options.dataType='arraybuffer';
		}
		else if('Blob' in win && data instanceof Blob){
			options.dataType='blob';
		}
		else if('Document' in win && data instanceof Document){
			options.dataType='document';
		}
		else if('FormData' in win && data instanceof FormData){
			options.dataType='formdata';
		}
		switch(options.dataType){
			case 'json':
				data=JSON.stringify(data);
				break;
			case 'post':
				data=buildData(data);
		}

		// Prepare headers
		if(options.headers){
			var format=function(match,p1,p2){
				return p1+p2.toUpperCase();
			};
			for(i in options.headers){
				headers[i.replace(/(^|-)([^-])/g,format)]=options.headers[i];
			}
		}
		if(!headers[contentType] && method!='GET'){
			if(options.dataType in mimeTypes){
				if(mimeTypes[options.dataType]){
					headers[contentType]=mimeTypes[options.dataType];
				}
			}
			else{
				headers[contentType]='application/x-www-form-urlencoded';
			}
		}
		if(!headers.Accept){
			headers.Accept=(options.responseType in mimeTypes)?mimeTypes[options.responseType]:'*/*';
		}
		if(!crossOrigin && !headers['X-Requested-With']){ // because that header breaks in legacy browsers with CORS
			headers['X-Requested-With']='XMLHttpRequest';
		}

		// Prepare URL
		if(method=='GET'){
			vars+=data;
		}
		if(!options.cache){
			if(vars){
				vars+='&';
			}
			vars+='__t='+(+new Date());
		}
		if(vars){
			url+=(/\?/.test(url)?'&':'?')+vars;
		}

		// The limit has been reached, stock the request
		if(limit && requests==limit){
			request_stack.push({
				method	: method,
				url		: url,
				data	: data,
				options	: options,
				before	: before,
				then	: [],
				'catch'	: [],
				complete: []
			});
			return promises_limit;
		}

		// Send the request
		var send=function(){
			// Get XHR object
			xhr=getXHR();
			if(crossOrigin){
				if(!('withCredentials' in xhr) && win.XDomainRequest){
					xhr=new XDomainRequest(); // CORS with IE8/9
					xdr=true;
					if(method!='GET' && method!='POST'){
						method='POST';
					}
				}
			}
			// Open connection
			if(xdr){
				xhr.open(method,url);
			}
			else{
				xhr.open(method,url,options.async,options.user,options.password);
				if(xhr2 && options.async){
					xhr.withCredentials=options.withCredentials;
				}
			}
			// Set headers
			if(!xdr){
				for(var i in headers){
					xhr.setRequestHeader(i,headers[i]);
				}
			}
			// Verify if the response type is supported by the current browser
			if(xhr2 && options.responseType!='document'){ // Don't verify for 'document' since we're using an internal routine
				try{
					xhr.responseType=options.responseType;
					nativeResponseParsing=(xhr.responseType==options.responseType);
				}
				catch(e){}
			}
			// Plug response handler
			if(xhr2 || xdr){
				xhr.onload=handleResponse;
			}
			else{
				xhr.onreadystatechange=function(){
					if(xhr.readyState==4){
						handleResponse();
					}
				};
			}
			// Override mime type to ensure the response is well parsed
			if(options.responseType!=='auto' && 'overrideMimeType' in xhr){
				xhr.overrideMimeType(mimeTypes[options.responseType]);
			}
			// Run 'before' callback
			if(before){
				before.call(xhr);
			}
			// Send request
			if(xdr){
				setTimeout(function(){ // https://developer.mozilla.org/en-US/docs/Web/API/XDomainRequest
					xhr.send();
				},0);
			}
			else{
				xhr.send(method!='GET'?data:null);
			}
		};

		// Timeout/retries
		var timeout=function(){
			timeoutInterval=setTimeout(function(){
				aborted=true;
				xhr.abort();
				if(!options.retries || ++retries!=options.retries){
					aborted=false;
					timeout();
					send();
				}
				else{
					aborted=false;
					error=true;
					response='Timeout ('+url+')';
					if(options.async){
						for(i=0;func=catch_stack[i];++i){
							func.call(xhr,response);
						}
					}
				}
			},options.timeout);
		};

		// Start the request
		timeout();
		send();

		// Return promises
		return promises;

	};

	// Return external qwest object
	var create=function(method){
			return function(url,data,options){
				var b=before;
				before=null;
				return qwest(method,url,data,options,b);
			};
		},
		obj={
			before: function(callback){
				before=callback;
				return obj;
			},
			get: create('GET'),
			post: create('POST'),
			put: create('PUT'),
			'delete': create('DELETE'),
			xhr2: xhr2,
			limit: function(by){
				limit=by;
			}
		};
	return obj;

}()));
},{}],3:[function(require,module,exports){

// Config loads and prepares the config file. The modules that does the
// actual transformations of the dataset are located in transforms/config.

var type    = require('./utils/type.js');
var config  = null;
var qwest   = require('qwest');

module.exports = {
    // Pass a list of string arguments as the full path for the object
    // you're looking for. E.g.: 'tilesets', 'space', 'tiles' for the
    // tile settings for the space tileset.
    get: function() {
        var args = Array.prototype.slice.call(arguments);
        if (args.length === 0) {
            return null;
        }
        return crawl(args);
    },

    load: function(callback) {
        var cb = function(value) {
            if (!type(callback).is_undefined) {
                callback(value);
            }
        };

        // TODO: both name of config file and port number should
        // be inserted by Yeoman(?). Maybe the settings can be
        // stored in package.json?
        qwest.get('http://localhost:5000/config.json')
            .then(function(response) {
                config = response;

                // var pipeline = require('transforms/pipeline');
                // var transforms = require('transforms/config/index');

                // pipeline(config)
                //     .pipe(transforms.tileset_index_range)
                //     .pipe(transforms.tile_settings);

                cb(true);
            })
            .catch(function(message) {
                console.error(message);
                cb(false);
            });
    }
};

function crawl(args) {
    var arg = '';
    var obj = config;

    // TODO: Use Array foreach instead

    for (var i=0, j=args.length; i<j; i++) {
        arg = args[i];
        obj = obj[arg];
        if (type(obj).is_undefined) {
            console.warn('Config cannot find '+args.join('.'));
            return null;
        }
    }
    return obj;
}

},{"./utils/type.js":9,"qwest":2}],4:[function(require,module,exports){
var config      = require('./config.js');
var dom         = require('./utils/dom.js');
var game_config = null;

// TODO: Add new states via Yeoman. This list needs to be dynamically
// recreated.

var boot        = require('./states/boot.js');
var preloader   = require('./states/preloader.js');
var game_state  = require('./states/game.js');

module.exports = function() {
    config.load(function() {
        game_config = config.get('game');
        dom.add_game_node();

        var game = new Phaser.Game(game_config.width, game_config.height,
                                   Phaser.CANVAS,
                                   game_config.dom_element_id,
                                   null, false, false);

        game.state.add('Boot',      boot);
        game.state.add('Preloader', preloader);
        game.state.add('Game',      game_state);

        game.state.start('Boot');
    });
}

},{"./config.js":3,"./states/boot.js":5,"./states/game.js":6,"./states/preloader.js":7,"./utils/dom.js":8}],5:[function(require,module,exports){
var config = require('./../config.js');

module.exports = new Phaser.State();

module.exports.create = function() {
    var game_config = config.get('game');
    var game = this.game;
    var scale = game.scale;

    game.input.maxPointers = 1;
    game.antialias = false;
    Phaser.Canvas.setSmoothingEnabled(game.context, false);

    game.stage.scaleMode = Phaser.ScaleManager.NO_SCALE;
    scale.maxWidth = game_config.width;
    scale.maxHeight = game_config.height;
    scale.forceLandscape = true;
    scale.pageAlignHorizontally = true;
    scale.pageAlignVertically = true;
    scale.setScreenSize(true);

    // TODO: Doesn't work in Chrome. Get's reset
    game.context.imageSmoothingEnabled = false;
    game.context.mozImageSmoothingEnabled = false;
    game.context.oImageSmoothingEnabled = false;
    game.context.webkitImageSmoothingEnabled = false;
    game.context.msImageSmoothingEnabled = false;

    game.state.start('Preloader');
};

},{"./../config.js":3}],6:[function(require,module,exports){
module.exports = new Phaser.State();

var config = require('./../config.js');

function Point(x, y) {
    this.x = x;
    this.y = y;
}

var river_joints = [];
var graphics = null;
var cursors = null;
var game = null;
var input = false;
var dir = 0;
var speed = 0.005;
var head = new Point(0, 0);
var break_point = 0.1;
var river_width = 1;

module.exports.create = function() {
    var game_config = config.get('game');
    game = this.game;

    cursors = game.input.keyboard.createCursorKeys();
    game.stage.backgroundColor = game_config.background_color;

    graphics = game.add.graphics(0, 0);

    river_joints.push(new Point(0, -1));
    river_joints.push(new Point(0, 0));
};

module.exports.update = function() {
    input = false;
    dir = 0;

    if (cursors.left.isDown ||
        cursors.right.isDown) {
        input = true;
        dir = cursors.left.isDown ? -1 : 1;
    }

    river_joints.forEach(function(joint) {
        joint.y -= speed;
    });

    for (var i=river_joints.length-1; i>=0; i--) {
        var joint = river_joints[i];
        if (joint.y < -1) {
            river_joints.shift();
        }
    }

    head.x = input ? head.x + (0.005 * dir) : head.x * 0.99;

    if (distance(head, river_joints[river_joints.length-1]) > break_point) {
        river_joints.push(new Point(head.x, head.y));
    }

    graphics.beginFill(0x000000, 1);
    graphics.lineStyle(river_width, 0xff0000, 1);

    graphics.drawRect(0,0,game.width,game.height);

    river_width = cursors.up.isDown ? 20 : 1;
    previous = null;
    river_joints.forEach(function(joint) {
        if (previous) {
            var p = screenCoordsToPixels(previous);
            var c = screenCoordsToPixels(joint);
            graphics.moveTo(p.x, p.y);
            graphics.lineTo(c.x, c.y);
        }
        previous = joint;
    });

    var h = screenCoordsToPixels(head);
    graphics.drawCircle(h.x, h.y, 3);
    graphics.endFill();
};

function distance(point_a, point_b) {
    return Math.sqrt(Math.pow(point_b.x - point_a.x, 2) + Math.pow(point_b.y - point_a.y, 2));
    // return Math.sqrt((point_a * point_a) + (point_b * point_b));
}

function screenCoordsToPixels(point) {
    return new Point(((point.x + 1) / 2) * game.width,
                     game.height - (((point.y + 1) / 2) * game.height));
}

},{"./../config.js":3}],7:[function(require,module,exports){
var config = require('./../config.js');

module.exports = new Phaser.State();

module.exports.preload = function() {
    var assets = config.get('preload');
    Object.keys(assets).forEach(function(type) {
        Object.keys(assets[type]).forEach(function(id) {
            this.game.load[type].apply(this.game.load,
                                       [id].concat(assets[type][id]));
        }.bind(this));
    }.bind(this));
};

module.exports.update = function() {
    if (this.game.load.hasLoaded) {
        this.game.state.start('Game');
    }
};

},{"./../config.js":3}],8:[function(require,module,exports){
var config  = require('./../config.js');
var type_of = require('./type.js');

var tools_node = null;
var game_node = null;

function append_to_head(element) {
    document.getElementsByTagName('head')[0].appendChild(element);
};

function create_script(path) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = path;
    return script;
};

function create_node(id, parent_id) {
    var parent = document.body.nextSibling;
    if (!type_of(parent_id).is_undefined) {
        parent = document.getElementById(parent_id);
    }
    var div = document.createElement('div');
    div.setAttribute('id', id);
    document.body.insertBefore(div, parent);
    return div;
};

module.exports.add_game_node = function() {
    if (document) {
        game_node = create_node(config.get('game').dom_element_id);
        return game_node;
    }
    return null;
};

module.exports.inject_script = function(path, callback) {
    var script = create_script(config.get('game').host + path);
    script.onload = function() {
        if (!type_of(callback).is_undefined) {
            callback();
        }
    }
    append_to_head(script);
};

module.exports.inject_css = function(path, callback) {
    var link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('type', 'text/css')
    link.setAttribute('href', config.get('game').host + path);
    append_to_head(link);
    if (!type_of(callback).is_undefined) {
        callback();
    }
};

Object.defineProperty(module.exports, 'game_node', {
    get: function() { return game_node; }
});

},{"./../config.js":3,"./type.js":9}],9:[function(require,module,exports){
var type = '';

module.exports = function(element) {
    type = Object.prototype.toString.call(element);
    return module.exports;
};

Object.defineProperty(module.exports, 'is_object', {
    get: function() { return type === '[object Object]'; }
});
Object.defineProperty(module.exports, 'is_array', {
    get: function() { return type === '[object Array]'; }
});
Object.defineProperty(module.exports, 'is_string', {
    get: function() { return type === '[object String]'; }
});
Object.defineProperty(module.exports, 'is_date', {
    get: function() { return type === '[object Date]'; }
});
Object.defineProperty(module.exports, 'is_number', {
    get: function() { return type === '[object Number]'; }
});
Object.defineProperty(module.exports, 'is_num', {
    get: function() { return type === '[object Number]'; }
});
Object.defineProperty(module.exports, 'is_function', {
    get: function() { return type === '[object Function]'; }
});
Object.defineProperty(module.exports, 'is_fn', {
    get: function() { return type === '[object Function]'; }
});
Object.defineProperty(module.exports, 'is_regexp', {
    get: function() { return type === '[object RegExp]'; }
});
Object.defineProperty(module.exports, 'is_boolean', {
    get: function() { return type === '[object Boolean]'; }
});
Object.defineProperty(module.exports, 'is_bool', {
    get: function() { return type === '[object Boolean]'; }
});
Object.defineProperty(module.exports, 'is_null', {
    get: function() { return type === '[object Null]'; }
});
Object.defineProperty(module.exports, 'is_undefined', {
    get: function() { return type === '[object Undefined]'; }
});

},{}]},{},[1]);
