(function() {
"use strict";


var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 30;

var renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var controls = new THREE.OrbitControls( camera );
controls.target.set( 0, 0, 0 );
controls.update();

var skeletonHelper;
var createMesh = function(bones) {

	var geometry = new THREE.Geometry();

	var mesh = new THREE.SkinnedMesh( geometry );

	var skeleton = new THREE.Skeleton( bones );

	mesh.add( skeleton.bones[0] );

	mesh.bind( skeleton );

	skeletonHelper = new THREE.SkeletonHelper( skeleton.bones[0] );
	skeletonHelper.material.linewidth = 2;
	scene.add( skeletonHelper );

	return mesh;

};


var mixer;
var mesh;

var asfLoader = new THREE.ASFLoader();
asfLoader.load('priman.asf', function (bones) {
	mesh = createMesh(bones);
	scene.add(mesh);
	//renderer.render(scene, camera);

	mixer = new THREE.AnimationMixer(mesh);

	var amcLoader = new THREE.AMCLoader(bones, 'priman.amc');
	amcLoader.load('priman.amc', function (animation) {
		console.log(animation);
		mixer.addAction(new THREE.AnimationAction(animation));
	});
});

var stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
document.body.appendChild( stats.domElement );

var clock = new THREE.Clock();
var render = function () {
	var delta = clock.getDelta();
	
	if (mixer) {
		mixer.update(delta);
		skeletonHelper.update();
	}

	renderer.render(scene, camera);

	stats.update();

	requestAnimationFrame(render);
};
render();

})();