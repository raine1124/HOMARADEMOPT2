import * as THREE from "three"

class CameraController {
  constructor(camera, domElement, initialPosition = new THREE.Vector3(0, 10, 20)) {
    this.camera = camera
    this.domElement = domElement

    // Store initial position for reset functionality
    this.initialPosition = initialPosition.clone()
    this.initialTarget = new THREE.Vector3(0, 0, 0)

    // Camera properties
    this.currentPosition = new THREE.Vector3()

    // First-person camera properties
    this.pitch = 0 // Up/down rotation (in radians)
    this.yaw = 0 // Left/right rotation (in radians)
    this.distance = 20 // Distance from camera to look-at point

    // Movement settings
    this.moveSpeed = 0.25
    this.rotateSpeed = 0.002 // Reduced for smoother rotation
    this.dragSpeed = 0.25
    this.panSpeed = 0.01 // Pan speed for right-click drag
    this.zoomSpeed = 2.0 // Speed for zoom

    // Zoom limits
    this.minDistance = 5 // Minimum zoom distance
    this.maxDistance = 200 // Maximum zoom distance

    // Mouse state
    this.isMouseDown = false
    this.mouseButton = -1
    this.mousePosition = new THREE.Vector2()
    this.previousMousePosition = new THREE.Vector2()

    // Key state
    this.keys = {
      KeyW: false,
      KeyS: false,
      KeyA: false,
      KeyD: false,
      KeyQ: false,
      KeyE: false,
      Space: false,
      ShiftLeft: false,
    }

    // Set initial camera position and calculate target
    this.currentPosition.copy(this.camera.position)
    this.distance = this.initialPosition.length()

    // Calculate initial pitch and yaw from camera position
    this.calculateInitialRotation()

    // Calculate initial target based on direction
    this.target = this.calculateTarget()

    this.setupEventListeners()
  }

  calculateInitialRotation() {
    // Calculate initial direction vector from origin to camera (since we're looking at origin by default)
    const direction = this.currentPosition.clone().normalize().negate()

    // Calculate initial yaw (horizontal rotation)
    this.yaw = Math.atan2(direction.x, direction.z)

    // Calculate initial pitch (vertical rotation)
    const horizontalDistance = Math.sqrt(direction.x * direction.x + direction.z * direction.z)
    this.pitch = Math.atan2(direction.y, horizontalDistance)
  }

  calculateTarget() {
    // Calculate the look direction based on pitch and yaw
    const direction = new THREE.Vector3()
    direction.x = Math.sin(this.yaw) * Math.cos(this.pitch)
    direction.y = Math.sin(this.pitch)
    direction.z = Math.cos(this.yaw) * Math.cos(this.pitch)

    // Calculate target position based on camera position and direction
    return this.currentPosition.clone().add(direction.multiplyScalar(this.distance))
  }

  setupEventListeners() {
    // Use bind to create bound methods that maintain 'this' context
    this._boundMouseDown = this.onMouseDown.bind(this)
    this._boundMouseMove = this.onMouseMove.bind(this)
    this._boundMouseUp = this.onMouseUp.bind(this)
    this._boundWheel = this.onMouseWheel.bind(this)
    this._boundKeyDown = this.onKeyDown.bind(this)
    this._boundKeyUp = this.onKeyUp.bind(this)
    this._boundContextMenu = (e) => e.preventDefault()

    // Add listeners with bound methods
    this.domElement.addEventListener("mousedown", this._boundMouseDown, false)
    document.addEventListener("mousemove", this._boundMouseMove, false)
    document.addEventListener("mouseup", this._boundMouseUp, false)
    this.domElement.addEventListener("wheel", this._boundWheel, { passive: false })
    document.addEventListener("keydown", this._boundKeyDown, false)
    document.addEventListener("keyup", this._boundKeyUp, false)
    this.domElement.addEventListener("contextmenu", this._boundContextMenu, false)
  }

  onMouseDown(event) {
    // If another button is already pressed, ignore new button presses
    if (this.isMouseDown) return

    this.isMouseDown = true
    this.mouseButton = event.button
    this.mousePosition.set(event.clientX, event.clientY)
  }

  onMouseMove(event) {
    // Get mouse movement delta
    const newMousePosition = new THREE.Vector2(event.clientX, event.clientY)
    const delta = new THREE.Vector2().subVectors(newMousePosition, this.mousePosition)
    this.mousePosition.copy(newMousePosition)

    if (!this.isMouseDown) return

    // Use delta magnitude to prevent large jumps
    const maxDelta = 20 // Max pixels of movement to consider per frame
    if (delta.length() > maxDelta) {
      delta.normalize().multiplyScalar(maxDelta)
    }

    if (this.mouseButton === 0 || this.mouseButton === 1) {
      // Left click or middle click - First-person camera rotation
      // Update yaw (left/right rotation)
      this.yaw -= delta.x * this.rotateSpeed

      // Update pitch (up/down rotation) with limits to prevent flipping
      this.pitch -= delta.y * this.rotateSpeed
      this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch))

      // Update camera direction based on pitch and yaw
      this.updateCameraDirection()
    } else if (this.mouseButton === 2) {
      // Right click - Pan
      // Scale pan amount by distance to target for consistent speed
      const panScale = Math.max(0.01, this.distance * 0.0005)

      // Get right and up vectors from camera
      const right = new THREE.Vector3()
      const up = new THREE.Vector3(0, 1, 0)
      right.crossVectors(this.camera.up, this.camera.getWorldDirection(new THREE.Vector3()))
      right.normalize()

      // Calculate movement vectors with scaled pan amount - INVERTED
      const moveRight = right.clone().multiplyScalar(delta.x * panScale)
      const moveUp = up.clone().multiplyScalar(-delta.y * panScale)

      // Apply movement
      this.currentPosition.add(moveRight).add(moveUp)

      // Update target based on new position and current direction
      this.target = this.calculateTarget()
    }
  }

  updateCameraDirection() {
    // Update the target based on the new direction
    this.target = this.calculateTarget()

    // Update the camera to look at the target
    this.camera.lookAt(this.target)
  }

  onMouseUp(event) {
    // Only clear mouse state if the released button matches the tracked button
    if (event.button === this.mouseButton) {
      this.isMouseDown = false
      this.mouseButton = -1
    }
  }

  onMouseWheel(event) {
    event.preventDefault()

    // Determine zoom direction (in or out)
    const zoomDirection = event.deltaY > 0 ? -1 : 1

    // Calculate new distance with the zoom speed
    const newDistance = this.distance + zoomDirection * -this.zoomSpeed

    // Apply zoom only if within limits
    if (newDistance >= this.minDistance && newDistance <= this.maxDistance) {
      this.distance = newDistance

      // Get direction from camera to target
      const direction = new THREE.Vector3()
      direction.x = Math.sin(this.yaw) * Math.cos(this.pitch)
      direction.y = Math.sin(this.pitch)
      direction.z = Math.cos(this.yaw) * Math.cos(this.pitch)

      // Update target based on new distance
      this.target = this.currentPosition.clone().add(direction.multiplyScalar(this.distance))
    }
  }

  onKeyDown(event) {
    if (this.keys.hasOwnProperty(event.code)) {
      this.keys[event.code] = true
    }
  }

  onKeyUp(event) {
    if (this.keys.hasOwnProperty(event.code)) {
      this.keys[event.code] = false
    }
  }

  update() {
    // Handle keyboard movement
    const movement = new THREE.Vector3()

    if (this.keys.KeyW) movement.z -= this.moveSpeed
    if (this.keys.KeyS) movement.z += this.moveSpeed
    if (this.keys.KeyA) movement.x -= this.moveSpeed
    if (this.keys.KeyD) movement.x += this.moveSpeed
    if (this.keys.Space) movement.y += this.moveSpeed
    if (this.keys.ShiftLeft) movement.y -= this.moveSpeed

    // Apply movement in camera's local space
    if (movement.lengthSq() > 0) {
      // Create a quaternion based on the camera's current rotation
      const quaternion = new THREE.Quaternion()
      quaternion.setFromEuler(this.camera.rotation)

      // Apply the quaternion to the movement vector
      movement.applyQuaternion(quaternion)

      // Apply the movement to the camera position
      this.currentPosition.add(movement)

      // Update the target based on the new position
      this.target = this.calculateTarget()
    }

    // Handle Q/E rotation around Y axis
    if (this.keys.KeyQ) {
      this.yaw += 0.02
      this.updateCameraDirection()
    }
    if (this.keys.KeyE) {
      this.yaw -= 0.02
      this.updateCameraDirection()
    }

    // Update camera position
    this.camera.position.copy(this.currentPosition)
    this.camera.lookAt(this.target)
  }

  // Set zoom limits
  setZoomLimits(min, max) {
    this.minDistance = min
    this.maxDistance = max

    // Enforce limits on current distance if needed
    this.distance = THREE.MathUtils.clamp(this.distance, min, max)

    // Update target based on new distance constraints
    this.target = this.calculateTarget()
  }

  // Add reset method
  reset() {
    // Reset camera position to initial values
    this.camera.position.copy(this.initialPosition)
    this.currentPosition.copy(this.initialPosition)
    this.distance = this.initialPosition.length()

    // Reset rotation values
    this.calculateInitialRotation()

    // Update target based on reset position and rotation
    this.target = this.calculateTarget()

    // Update camera
    this.camera.lookAt(this.target)

    console.log("Camera reset to position:", this.initialPosition)
  }

  // Set a new initial position (useful when changing default position)
  setInitialPosition(position, target = new THREE.Vector3(0, 0, 0)) {
    this.initialPosition.copy(position)
    this.initialTarget.copy(target)
  }

  // Set the panning speed
  setPanSpeed(speed) {
    this.panSpeed = speed
  }

  dispose() {
    // Remove event listeners using stored bound methods
    this.domElement.removeEventListener("mousedown", this._boundMouseDown)
    document.removeEventListener("mousemove", this._boundMouseMove)
    document.removeEventListener("mouseup", this._boundMouseUp)
    this.domElement.removeEventListener("wheel", this._boundWheel)
    document.removeEventListener("keydown", this._boundKeyDown)
    document.removeEventListener("keyup", this._boundKeyUp)
    this.domElement.removeEventListener("contextmenu", this._boundContextMenu)
  }
}

export { CameraController }

