var canvas = document.getElementById('quakeCanvas');
var planet = planetaryjs.planet();
planet.loadPlugin(autocenter());
planet.loadPlugin(autoscale());
planet.loadPlugin(autorotate(3));
planet.loadPlugin(planetaryjs.plugins.earth({
	topojson: {
		file: 'json/world-110m-withlakes.json'
	},
	oceans: {
		fill: 'rgba(156,155,255,0.2)',
	},
	land: {
		fill: 'rgba(255,255,255,0.4)',
		stroke: 'rgba(255,255,255,0.4)'
	},
	borders: {
		stroke: 'rgba(255,255,255,0.4)'
	}
}));
planet.loadPlugin(lakes({
	fill: 'rgba(156,155,255,0.2)'
}));
planet.loadPlugin(planetaryjs.plugins.pings());
//缩放
planet.loadPlugin(planetaryjs.plugins.zoom({
	scaleExtent: [50, 1000]
}));

//拖拽
planet.loadPlugin(planetaryjs.plugins.drag({
	onDragStart: function() {
		this.plugins.autorotate.pause();
	},
	onDragEnd: function() {
		this.plugins.autorotate.resume();
	}
}));

planet.draw(canvas);

var colors = [
'#eb7c7c',
'#52bdbd', 
'#FFB88C',
'#EBD77C', 
'#99d2fd',
'#a9e87d',
'#bd8cff', 
'#fd9be9',
'#45cbc0'];
var ttls = d3.scale.log()
	.domain([0, 1])
	.range([0.5, 30]);
var angles = d3.scale.log();
d3.json('json/year_myjouney.json', function(err, data) {
	setInterval(function() {
		var lat = 39;
		var lng = 116;
		var color = colors[Math.floor(Math.random() * colors.length)];

		for (var i = 0; i < data.length; i++) {
			var ping = data[i]
			planet.plugins.pings.add(ping.lng, ping.lat, {
				color: colors[i],
				ttl: ttls(ping.time/10),
			    angle: angles(ping.time+1),
			});
		}
	}, 150);
});
//自动居中
function autocenter(options) {
	options = options || {};
	var needsCentering = false;
	var globe = null;

	var resize = function() {

		var width = window.innerWidth + (options.extraWidth || 0);
		//var height = window.innerHeight + (options.extraHeight || 0);
		var height=window.innerHeight ;
		globe.canvas.width = width;
		globe.canvas.height = height;
		globe.projection.translate([width / 2, height / 2]);
	};

	return function(planet) {
		globe = planet;
		planet.onInit(function() {
			needsCentering = true;
			d3.select(window).on('resize', function() {
				needsCentering = true;
			});
		});

		planet.onDraw(function() {
			if (needsCentering) {
				resize();
				needsCentering = false;
			}
		});
	};
};
//自动缩放
function autoscale(options) {
	options = options || {};
	return function(planet) {
		planet.onInit(function() {
			var width = window.innerWidth + (options.extraWidth || 0);
			var height = window.innerHeight + (options.extraHeight || 0);
			planet.projection.scale(Math.min(width, height) / 2);
		});
	};
};

//旋转
function autorotate(degPerSec) {
	return function(planet) {
		var lastTick = null;
		var paused = false;
		planet.plugins.autorotate = {
			pause: function() {
				paused = true;
			},
			resume: function() {
				paused = false;
			}
		};
		planet.onDraw(function() {
			if (paused || !lastTick) {
				lastTick = new Date();
			} else {
				var now = new Date();
				var delta = now - lastTick;
				// This plugin uses the built-in projection (provided by D3)
				// to rotate the globe each time we draw it.
				var rotation = planet.projection.rotate();
				rotation[0] += degPerSec * delta / 1000;
				if (rotation[0] >= 180) rotation[0] -= 360;
				planet.projection.rotate(rotation);
				lastTick = now;
			}
		});
	};
};

//湖泊
function lakes(options) {
	options = options || {};
	var lakes = null;

	return function(planet) {
		planet.onInit(function() {
			var world = planet.plugins.topojson.world;
			lakes = topojson.feature(world, world.objects.ne_110m_lakes);
		});

		planet.onDraw(function() {
			planet.withSavedContext(function(context) {
				context.beginPath();
				planet.path.context(context)(lakes);
				context.fillStyle = options.fill || 'black';
				context.fill();
			});
		});
	};
};