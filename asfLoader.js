/**
 * @author sam@bailey.geek.nz
 */

(function () {
"use strict";

THREE.ASFLoader = function ( manager ) {

	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

};

THREE.ASFLoader.prototype = {

	constructor: THREE.ASFLoader,

	load: function ( url, onLoad, onProgress, onError ) {
		console.log("loading "+url)

		var scope = this;

		var loader = new THREE.XHRLoader( scope.manager );
		loader.setCrossOrigin( this.crossOrigin );
		loader.load( url, function ( text ) {

			onLoad( scope.parse( text ) );

		}, onProgress, onError );

	},

	setCrossOrigin: function ( value ) {

		this.crossOrigin = value;

	},

	parse: function ( text ) {

		var lines = text.split('\n');
		var lineNum = 0;

		var parseKeyValueMap = function () {
			var map = {};
			while (true) {
				var line = lines[lineNum].trim();
				
				if (line.startsWith('end') || line.startsWith(':')) break;
				lineNum++;


				var indexOfSpaceChar = line.indexOf(' ');
				if (indexOfSpaceChar === -1) continue;
				map[line.slice(0, indexOfSpaceChar)] = line.slice(indexOfSpaceChar+1)
				
			}
			lineNum--;
			return map;
		};

		var parseBeginEnd = function () {
			++lineNum;
			return parseKeyValueMap();
		};

		var parseBoneData = function () {
			var bones = [];
			while (true) {
				var line = lines[lineNum].trim();
				if (line.startsWith(':')) break;
				
				bones.push(parseBeginEnd());
				lineNum++;
			}
			lineNum--;
			return bones;
		};

		var parseDocumentation = function () {
			var documentation = [];
			while (true) {
				var line = lines[lineNum].trim();
				if (line.startsWith(':')) break;
				lineNum++;
				documentation.push(line);
			}
			lineNum--;
			return documentation.join('\n');
		};

		var skeleton = {};

		console.log('	parsing');

		for (; lineNum < lines.length; lineNum++) {

			var line = lines[lineNum].trim();
			if (!line.length || line.charAt(0) === '#') continue;

			if (line.startsWith(':version')) {
				skeleton.version = line.slice(line.indexOf(' ')+1);
				continue;
			}
			if (line.startsWith(':name')) {
				skeleton.name = line.slice(line.indexOf(' ')+1);
				continue;
			}
			if (line.startsWith(':units')) {
				lineNum++;
				skeleton.units = parseKeyValueMap();
				continue;
			}

			if (line.startsWith(':documentation')) {
				lineNum++;
				skeleton.documentation = parseDocumentation();
				continue;
			}

			if (line.startsWith(':root')) {
				lineNum++;
				skeleton.root = parseKeyValueMap();
				continue;
			}

			if (line.startsWith(':bonedata')) {
				lineNum++;
				skeleton.bonedata = parseBoneData();
				continue;
			}

			if (line.startsWith(':hierarchy')) {
				lineNum++;
				skeleton.hierarchy = parseBeginEnd();
				lineNum--;
				continue;
			}

		};

		console.log(skeleton)
		console.log('	creating bones')

		skeleton.bonedata.findByName = function (name) {
			for (var i = 0; i < skeleton.bonedata.length; i++)
				if (skeleton.bonedata[i].name == name) return skeleton.bonedata[i];
		};
		skeleton.hierarchy.findByName = function (name) {
			return skeleton.hierarchy[name];
		};

		var stringToVec3 = function (string) {
			var x = string.trim().split(' ');
			return new THREE.Vector3(x[0], x[1], x[2]);
		};

		var bones = [];
		var makeBone = function (name, position) {
			var bone = new THREE.Bone();
			if (name === 'rhipjoint') bone.visible = false;

			bone.name = name;
			bone.position.x = position.x;
			bone.position.y = position.y;
			bone.position.z = position.z;

			var data = skeleton.bonedata.findByName(name);
			bone.dof = data.dof;
			bone.axis = data.axis;

			var endOfBone = stringToVec3(data.direction).setLength(data.length);
			var childNames = skeleton.hierarchy.findByName(name);

			if (childNames) childNames.split(' ').forEach(function (childName) {
				bone.add(makeBone(childName, endOfBone));
			});

			bones.push(bone);
			return bone;
		};

		var makeRoot = function () {

			var bone = new THREE.Bone();
			bones.push(bone);

			var rootPosition = stringToVec3(skeleton.root.position);

			var childNames = skeleton.hierarchy.findByName("root");

			if (childNames) childNames.split(' ').forEach(function (childName) {
				bone.add(makeBone(childName, rootPosition));
			});
			return bone;
		};

		makeRoot();
		console.log('	finished')
		return bones;
	}

}

})();