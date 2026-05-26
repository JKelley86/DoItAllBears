import { spendTokens } from './economy.js';

const scene = new THREE.Scene();

scene.fog = new THREE.Fog(0x000000, 10, 120);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth/window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer({
    antialias:true
});

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

const controls = new THREE.PointerLockControls(
    camera,
    document.body
);

document.body.onclick = () => {
    controls.lock();
};

camera.position.set(0,2,10);

/////////////////////////////////////////////////////
// LIGHTING
/////////////////////////////////////////////////////

const ambient = new THREE.AmbientLight(0x555555);
scene.add(ambient);

const neon1 = new THREE.PointLight(0x00ffff, 100, 40);
neon1.position.set(0,8,0);
scene.add(neon1);

const neon2 = new THREE.PointLight(0xff00ff, 100, 40);
neon2.position.set(20,8,20);
scene.add(neon2);

/////////////////////////////////////////////////////
// FLOOR
/////////////////////////////////////////////////////

const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(200,200),
    new THREE.MeshStandardMaterial({
        color:0x111111,
        metalness:0.9,
        roughness:0.2
    })
);

floor.rotation.x = -Math.PI/2;

scene.add(floor);

/////////////////////////////////////////////////////
// CABINETS
/////////////////////////////////////////////////////

const games = [
    {
        name:'wheel',
        x:-12,
        z:-10,
        color:0x00ffff,
        cost:5
    },
    {
        name:'pinball',
        x:-4,
        z:-10,
        color:0xff00ff,
        cost:10
    },
    {
        name:'skeeball',
        x:4,
        z:-10,
        color:0x00ff99,
        cost:8
    },
    {
        name:'airhockey',
        x:12,
        z:-10,
        color:0xffaa00,
        cost:12
    }
];

const cabinetMeshes = [];

games.forEach(game => {

    const cabinet = new THREE.Mesh(
        new THREE.BoxGeometry(4,7,4),
        new THREE.MeshStandardMaterial({
            color:0x222222,
            emissive:game.color,
            emissiveIntensity:0.6
        })
    );

    cabinet.position.set(game.x,3.5,game.z);

    cabinet.userData = game;

    scene.add(cabinet);

    cabinetMeshes.push(cabinet);

    const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(2.5,2),
        new THREE.MeshBasicMaterial({
            color:game.color
        })
    );

    screen.position.z = 2.01;
    screen.position.y = 1;

    cabinet.add(screen);
});

/////////////////////////////////////////////////////
// MOVEMENT
/////////////////////////////////////////////////////

const keys = {};

window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});

/////////////////////////////////////////////////////
// CLICK GAME
/////////////////////////////////////////////////////

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', () => {

    raycaster.setFromCamera(
        new THREE.Vector2(0,0),
        camera
    );

    const hits = raycaster.intersectObjects(cabinetMeshes);

    if(hits.length){

        const game = hits[0].object.userData;

        if(spendTokens(game.cost)){

            window.arcadeGames[game.name]();
        }
    }
});

/////////////////////////////////////////////////////
// ANIMATION
/////////////////////////////////////////////////////

function animate(){

    requestAnimationFrame(animate);

    const speed = 0.15;

    if(keys['w']) controls.moveForward(speed);
    if(keys['s']) controls.moveForward(-speed);
    if(keys['a']) controls.moveRight(-speed);
    if(keys['d']) controls.moveRight(speed);

    cabinetMeshes.forEach(cabinet => {

        cabinet.rotation.y += 0.003;
    });

    renderer.render(scene,camera);
}

animate();

window.addEventListener('resize', () => {

    camera.aspect = window.innerWidth/window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
});

export function initArcadeRoom(){}
