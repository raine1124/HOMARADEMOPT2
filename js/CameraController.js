import * as THREE from 'three';

class CameraController {
    constructor(camera, domElement, initialPosition = new THREE.Vector3(0, 10, 20)) {
        this.camera = camera;
        this.domElement = domElement;
        
        // Store initial position for reset functionality
        this.initialPosition = initialPosition.clone();
        this.initialTarget = new THREE.Vector3(0, 0, 0);
        
        // Camera properties
        this.target = new THREE.Vector3(0, 0, 0);
        this.currentPosition = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        
        // Movement settings
        this.moveSpeed = 0.25;
        this.rotateSpeed = 0.05;
        this.dragSpeed = 0.25;
        
        // Spherical coordinates for orbital movement
        this.spherical = new THREE.Spherical();
        this.sphericalDelta = new THREE.Spherical();
        
        // Mouse state
        this.isMouseDown = false;
        this.mouseButton = -1;
        this.mousePosition = new THREE.Vector2();
        this.previousMousePosition = new THREE.Vector2();
        
        // Key state
        this.keys = {
            KeyW: false,
            KeyS: false,
            KeyA: false,
            KeyD: false,
            KeyQ: false,
            KeyE: false,
            Space: false,
            ShiftLeft: false
        };
        
        // Set initial camera position
        this.currentPosition.copy(this.camera.position);
        this.updateSpherical();
        
        this.setupEventListeners();
    }
    
    updateSpherical() {
        this.spherical.setFromVector3(this.currentPosition.clone().sub(this.target));
    }
    
    setupEventListeners() {
        this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.domElement.addEventListener('wheel', this.onMouseWheel.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    onMouseDown(event) {
        this.isMouseDown = true;
        this.mouseButton = event.button;
        this.mousePosition.set(event.clientX, event.clientY);
        this.previousMousePosition.copy(this.mousePosition);
    }
    
    onMouseMove(event) {
        this.previousMousePosition.copy(this.mousePosition);
        this.mousePosition.set(event.clientX, event.clientY);
        
        if (!this.isMouseDown) return;
        
        const delta = new THREE.Vector2()
            .subVectors(this.mousePosition, this.previousMousePosition);
        
        if (this.mouseButton === 0) { // Left click - Orbit
            this.sphericalDelta.theta -= delta.x * 0.002;
            this.sphericalDelta.phi -= delta.y * 0.002;
        }
        if (this.mouseButton === 1) { // Left click - Orbit
            this.sphericalDelta.theta -= delta.x * 0.002;
            this.sphericalDelta.phi -= delta.y * 0.002;
        }
        else if (this.mouseButton === 2) { // Right click - Forward/backward
            const forward = new THREE.Vector3(0, 0, -delta.y)
                .applyQuaternion(this.camera.quaternion)
                .multiplyScalar(this.dragSpeed);
            
            this.currentPosition.add(forward);
            this.target.add(forward);
        }
    }
    
    onMouseUp() {
        this.isMouseDown = false;
        this.mouseButton = -1;
    }
    
    onMouseWheel(event) {
        const zoomAmount = -event.deltaY * 0.1;
        const forward = new THREE.Vector3(0, 0, -1)
            .applyQuaternion(this.camera.quaternion)
            .multiplyScalar(zoomAmount);
        
        this.currentPosition.add(forward);
        this.target.add(forward.multiplyScalar(0.5));
    }
    
    onKeyDown(event) {
        if (this.keys.hasOwnProperty(event.code)) {
            this.keys[event.code] = true;
        }
    }
    
    onKeyUp(event) {
        if (this.keys.hasOwnProperty(event.code)) {
            this.keys[event.code] = false;
        }
    }
    
    update() {
        // Handle keyboard movement
        const movement = new THREE.Vector3();
        
        if (this.keys.KeyW) movement.z -= this.moveSpeed;
        if (this.keys.KeyS) movement.z += this.moveSpeed;
        if (this.keys.KeyA) movement.x -= this.moveSpeed;
        if (this.keys.KeyD) movement.x += this.moveSpeed;
        if (this.keys.Space) movement.y += this.moveSpeed;
        if (this.keys.ShiftLeft) movement.y -= this.moveSpeed;
        
        // Apply movement in camera's local space
        if (movement.lengthSq() > 0) {
            movement.applyQuaternion(this.camera.quaternion);
            this.currentPosition.add(movement);
            this.target.add(movement);
        }
        
        // Apply orbital rotation
        this.spherical.theta += this.sphericalDelta.theta;
        this.spherical.phi += this.sphericalDelta.phi;
        
        // Wrap theta around 360 degrees
        this.spherical.theta %= (2 * Math.PI);
        
        // Allow near-complete vertical rotation while preventing exact poles
        this.spherical.phi = THREE.MathUtils.clamp(
            this.spherical.phi,
            Number.EPSILON,
            Math.PI - Number.EPSILON
        );
        
        // Reset deltas
        this.sphericalDelta.set(0, 0, 0);
        
        // Convert spherical to cartesian coordinates
        const offset = new THREE.Vector3();
        offset.setFromSpherical(this.spherical);
        
        // Update camera position and look at
        this.camera.position.copy(this.target).add(offset);
        this.camera.lookAt(this.target);
        
        // Handle Q/E rotation around target
        if (this.keys.KeyQ) {
            this.spherical.theta += 0.02;
        }
        if (this.keys.KeyE) {
            this.spherical.theta -= 0.02;
        }
    }
    
    // Add reset method
    reset() {
        // Reset camera position and target to initial values
        this.camera.position.copy(this.initialPosition);
        this.target.copy(this.initialTarget);
        this.currentPosition.copy(this.initialPosition);
        
        // Update spherical coordinates
        this.updateSpherical();
        
        // Reset camera orientation
        this.camera.lookAt(this.target);
        
        console.log("Camera reset to position:", this.initialPosition);
    }
    
    // Set a new initial position (useful when changing default position)
    setInitialPosition(position, target = new THREE.Vector3(0, 0, 0)) {
        this.initialPosition.copy(position);
        this.initialTarget.copy(target);
    }
    
    dispose() {
        this.domElement.removeEventListener('mousedown', this.onMouseDown.bind(this));
        document.removeEventListener('mousemove', this.onMouseMove.bind(this));
        document.removeEventListener('mouseup', this.onMouseUp.bind(this));
        this.domElement.removeEventListener('wheel', this.onMouseWheel.bind(this));
        document.removeEventListener('keydown', this.onKeyDown.bind(this));
        document.removeEventListener('keyup', this.onKeyUp.bind(this));
    }
}

export { CameraController };