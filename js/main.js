import * as THREE from 'three';
import { TreePointCloud } from './TreePointCloud.js';
import { CameraController } from './CameraController.js';

// Create scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111); // Slightly lighter background to see if rendering works

// Camera and renderer setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add axes helper for debugging
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// Add grid helper for reference
const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

// Add ambient and directional light for better visibility
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Camera positioning
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Initialize camera controller
const cameraController = new CameraController(camera, renderer.domElement);

// Add a simple sphere as a reference point to make sure rendering works
const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
sphere.position.set(0, 0, 0);
scene.add(sphere);

// Create tree point cloud with interactive points
const tree = new TreePointCloud({
    height: 5,
    radiusBase: 0.5,
    branchLevels: 5,
    pointsPerLevel: 2000,
    colorVariation: 0.3,
    baseColor: 0x2E8B57,
    modelPath: 'models/tree.obj', // Make sure this path is correct
    potentialPointsCount: 150,     // Number of potential interactive points
    activatedPointsCount: 5,       // Number of activated (red) points
    activatedPointColor: 0xFF0000, // Red color for activated points
    potentialPointColor: 0x00FF00, // Green color for potential points
    normalPointSize: 0.03,         // Size of regular tree points
    interactivePointSize: 0.08,    // Size of interactive points
    hoverPointSize: 0.12           // Size when hovering over a point
});

// Add event listener to log when tree model loads
const originalLoadMethod = tree.loadTreeModel;
tree.loadTreeModel = function() {
    console.log("Starting to load tree model...");
    return originalLoadMethod.apply(this, arguments);
};

scene.add(tree.points);

// Debug info
console.log("Scene children count:", scene.children.length);
console.log("Tree points added to scene:", tree.points);

// Reset camera button functionality
document.getElementById('resetCamera').addEventListener('click', () => {
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    if (cameraController.reset) {
        cameraController.reset();
    }
});

// Add info button to toggle helpful information about interactive points
const infoButton = document.createElement('button');
infoButton.id = 'infoButton';
infoButton.textContent = 'Show Interactive Points Info';
infoButton.addEventListener('click', toggleInfoPanel);
document.getElementById('ui-container').appendChild(infoButton);

// Create info panel
const infoPanel = document.createElement('div');
infoPanel.id = 'info-panel';
infoPanel.style = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 15px;
    border-radius: 5px;
    max-width: 300px;
    display: none;
    z-index: 100;
`;
infoPanel.innerHTML = `
    <h3>Interactive Tree Points</h3>
    <p>Green points: Potential interaction points (${tree.params.potentialPointsCount})</p>
    <p>Red points: Activated points (${tree.params.activatedPointsCount}) - click to navigate</p>
    <p>Hover over any red point to see interaction frame.</p>
    <button id="close-info">Close</button>
`;
document.body.appendChild(infoPanel);

// Close button for info panel
document.getElementById('close-info').addEventListener('click', () => {
    infoPanel.style.display = 'none';
});

function toggleInfoPanel() {
    if (infoPanel.style.display === 'none') {
        infoPanel.style.display = 'block';
        infoButton.textContent = 'Hide Interactive Points Info';
    } else {
        infoPanel.style.display = 'none';
        infoButton.textContent = 'Show Interactive Points Info';
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Only animate tree if it's fully loaded
    if (tree.points.children.length > 0) {
        // Call the new update method that handles both animation and interaction
        tree.update(camera);
    }
    
    // Make the sphere pulsate slightly to check if animation is running
    sphere.scale.x = 1 + 0.1 * Math.sin(Date.now() * 0.001);
    sphere.scale.y = 1 + 0.1 * Math.sin(Date.now() * 0.001);
    sphere.scale.z = 1 + 0.1 * Math.sin(Date.now() * 0.001);
    
    cameraController.update();
    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});