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
        this.panSpeed = 0.01; // Pan speed for right-click drag
        
        // Zoom limits
        this.minDistance = 5; // Minimum zoom distance
        this.maxDistance = 200; // Maximum zoom distance
        
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
        
        if (this.mouseButton === 0 || this.mouseButton === 1) { // Left click or middle click - Orbit
            this.sphericalDelta.theta -= delta.x * 0.002;
            this.sphericalDelta.phi -= delta.y * 0.002;
        }
        else if (this.mouseButton === 2) { // Right click - Pan (Figma-like drag)
            const deltaX = delta.x * this.panSpeed;
            const deltaY = delta.y * this.panSpeed;
            
            // Get right and up vectors from camera
            const right = new THREE.Vector3();
            const up = new THREE.Vector3(0, 1, 0);
            right.crossVectors(this.camera.up, this.camera.getWorldDirection(new THREE.Vector3()));
            right.normalize();
            
            // Calculate movement vectors
            const moveRight = right.clone().multiplyScalar(-deltaX);
            const moveUp = up.clone().multiplyScalar(deltaY);
            
            // Apply movement to both camera and target
            this.currentPosition.add(moveRight).add(moveUp);
            this.target.add(moveRight).add(moveUp);
            
            // Update spherical coordinates after panning
            this.updateSpherical();
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
        
        // Calculate new distance after zooming
        const distanceToTarget = this.currentPosition.distanceTo(this.target);
        const newDistance = distanceToTarget - zoomAmount; // Fix: use zoomAmount directly
        
        // Apply zoom only if within limits
        if (newDistance >= this.minDistance && newDistance <= this.maxDistance) {
            this.currentPosition.add(forward);
            // Only move target a little bit
            this.target.add(forward.clone().multiplyScalar(0.1));
            
            // Update spherical coordinates after zooming
            this.updateSpherical();
        }
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
            
            // Check if movement would exceed distance limits
            const distanceToTarget = this.currentPosition.distanceTo(this.target);
            const newPos = this.currentPosition.clone().add(movement);
            const newDistance = newPos.distanceTo(this.target);
            
            if (newDistance >= this.minDistance && newDistance <= this.maxDistance) {
                this.currentPosition.add(movement);
                this.target.add(movement);
            }
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
        
        // Enforce distance limits
        this.spherical.radius = THREE.MathUtils.clamp(
            this.spherical.radius,
            this.minDistance,
            this.maxDistance
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
    
    // Set zoom limits
    setZoomLimits(min, max) {
        this.minDistance = min;
        this.maxDistance = max;
        
        // Enforce limits on current position if needed
        const currentDist = this.currentPosition.distanceTo(this.target);
        if (currentDist < min) {
            // Too close, move back
            const dir = new THREE.Vector3().subVectors(this.currentPosition, this.target).normalize();
            this.currentPosition.copy(this.target).add(dir.multiplyScalar(min));
        } else if (currentDist > max) {
            // Too far, move closer
            const dir = new THREE.Vector3().subVectors(this.currentPosition, this.target).normalize();
            this.currentPosition.copy(this.target).add(dir.multiplyScalar(max));
        }
        
        // Update spherical coordinates
        this.updateSpherical();
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
    
    // Set the panning speed
    setPanSpeed(speed) {
        this.panSpeed = speed;
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