// loading.js - Optimized loading animation with "Homara" text filling up then transforming to starfield

export class LoadingAnimation {
    constructor() {
        this.loadingContainer = null;
        this.loadingText = null;
        this.pointsContainer = null;
        this.onComplete = null;
        this.loadingProgress = 0;
        this.animationStarted = false;
        this.animationComplete = false;
        this.textPoints = [];
        this.canvasContext = null;
        this.starfieldPoints = [];
        this.passedPointsCount = 0;
        this.totalTextPoints = 0;
        this.requestID = null;
    }

    // Initialize the loading screen
    init() {
        // Create loading container
        this.loadingContainer = document.createElement('div');
        this.loadingContainer.id = 'loading-container';
        this.loadingContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #111111;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            opacity: 1;
            transition: opacity .8s ease-out;
            perspective: 800px;
            overflow: hidden;
        `;

        // Create loading text
        this.loadingText = document.createElement('h1');
        this.loadingText.id = 'loading-text';
        this.loadingText.textContent = 'HOMARA';
        this.loadingText.style.cssText = `
            font-family: Arial, sans-serif;
            font-size: 7rem;
            font-weight: bold;
            color: transparent;
            letter-spacing: 5px;
            position: relative;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            background: linear-gradient(to top, #ffffff 0%, transparent 0%);
            -webkit-background-clip: text;
            background-clip: text;
            transition: all 0.5s ease-out;
        `;
        
        // Create container for the points effect
        this.pointsContainer = document.createElement('div');
        this.pointsContainer.id = 'points-container';
        this.pointsContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            pointer-events: none;
            transform-style: preserve-3d;
        `;
        
        // Append elements
        this.loadingContainer.appendChild(this.loadingText);
        this.loadingContainer.appendChild(this.pointsContainer);
        document.body.appendChild(this.loadingContainer);
        
        // Start the animation
        this.startAnimation();
    }

    // Start the loading animation
    startAnimation() {
        if (this.animationStarted) return;
        this.animationStarted = true;
        
        // Use timestamp for smoother animation
        let lastTime = performance.now();
        
        // Animate loading progress with fixed time step for consistent speed
        const animateLoading = (timestamp) => {
            // Calculate delta time but with minimum to avoid jumps at start
            const deltaTime = Math.min(16, Math.max(5, timestamp - lastTime));
            lastTime = timestamp;
            
            if (this.loadingProgress >= 100) {
                this.startTextToPointsTransition();
                return;
            }
            
            // Even slower, consistent increment for smoother fill
            const increment = 0.03 * deltaTime;
            this.loadingProgress = Math.min(this.loadingProgress + increment, 100);
            
            // Update loading text fill
            this.loadingText.style.background = 
                `linear-gradient(to top, #ffffff ${this.loadingProgress}%, transparent ${this.loadingProgress}%)`;
            this.loadingText.style.webkitBackgroundClip = 'text';
            this.loadingText.style.backgroundClip = 'text';
            
            // Schedule next frame
            if (this.loadingProgress < 100) {
                this.requestID = requestAnimationFrame(animateLoading);
            } else {
                // Start transition immediately when filled
                this.startTextToPointsTransition();
            }
        };
        
        this.requestID = requestAnimationFrame(animateLoading);
    }

    // Start the text-to-points transition
    startTextToPointsTransition() {
        // Cancel any existing animation frame
        if (this.requestID) {
            cancelAnimationFrame(this.requestID);
            this.requestID = null;
        }
        
        // Create a canvas to analyze the text pixels
        this.createTextCanvas();
        
        // Create points based on the text shape
        this.createTextPoints();
        this.totalTextPoints = this.textPoints.length;
        
        // Fade out the text while fading in the points
        this.loadingText.style.opacity = '0';
        this.pointsContainer.style.opacity = '1';
        
        // Create background starfield
        this.createStarfieldPoints();
        
        // Start animating the points
        this.animatePointsMovement();
    }
    
    // Create a canvas to analyze text pixels
    createTextCanvas() {
        // Get the text bounding rect
        const textRect = this.loadingText.getBoundingClientRect();
        
        // Create a canvas element
        const canvas = document.createElement('canvas');
        canvas.width = textRect.width;
        canvas.height = textRect.height;
        this.canvasContext = canvas.getContext('2d');
        
        // Clear canvas with transparent background
        this.canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        
        // Fill with text
        this.canvasContext.font = 'bold 7rem Arial';
        this.canvasContext.fillStyle = 'white';
        this.canvasContext.textAlign = 'center';
        this.canvasContext.textBaseline = 'middle';
        this.canvasContext.fillText('HOMARA', canvas.width/2, canvas.height/2);
    }
    
    // Create points from text
    createTextPoints() {
        // Get the text bounding rect
        const textRect = this.loadingText.getBoundingClientRect();
        
        // Analyze the pixel data
        const imageData = this.canvasContext.getImageData(0, 0, 
            this.canvasContext.canvas.width, 
            this.canvasContext.canvas.height);
        const pixels = imageData.data;
        
        // Sample pixels and create points where text exists
        const textPointCount = 1200; // Density of points
        const validPixels = [];
        
        // Create a map of text pixels
        const samplingStep = 1; // Check every pixel for more accuracy
        for (let y = 0; y < this.canvasContext.canvas.height; y += samplingStep) {
            for (let x = 0; x < this.canvasContext.canvas.width; x += samplingStep) {
                const pixelIndex = (y * this.canvasContext.canvas.width + x) * 4;
                if (pixels[pixelIndex + 3] > 50) { // Check alpha channel
                    validPixels.push({x, y});
                }
            }
        }
        
        // Sample from valid pixels
        const pointsToCreate = Math.min(textPointCount, validPixels.length);
        const selectedIndices = new Set();
        let pointsCreated = 0;
        
        // Distribute points evenly across the text
        while (pointsCreated < pointsToCreate && selectedIndices.size < validPixels.length) {
            const randomIndex = Math.floor(Math.random() * validPixels.length);
            
            if (!selectedIndices.has(randomIndex)) {
                selectedIndices.add(randomIndex);
                const pixel = validPixels[randomIndex];
                
                // Convert canvas coordinates to screen coordinates
                const screenX = textRect.left + pixel.x;
                const screenY = textRect.top + pixel.y;
                
                this.createTextPoint(screenX, screenY);
                pointsCreated++;
            }
        }
    }
    
    // Create a single text point
    createTextPoint(x, y) {
        const point = document.createElement('div');
        point.className = 'text-point';
        
        // Simple, small points matching the image style
        const size = 1 + Math.random() * 0.5;
        
        point.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background-color: rgb(220, 230, 220); 
            border-radius: 50%;
            left: ${x}px;
            top: ${y}px;
            opacity: 0.7;
            transform: translate(-50%, -50%) translateZ(0px);
            will-change: transform, left, top, opacity;
        `;
        
        this.pointsContainer.appendChild(point);
        
        // Random direction vector for movement
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.5; // Reduced for smoother motion
        
        this.textPoints.push({
            element: point,
            x: x,
            y: y,
            z: 0,
            originalX: x,
            originalY: y,
            // Movement vector with forward bias
            speedX: Math.cos(angle) * speed * 0.5,
            speedY: Math.sin(angle) * speed * 0.5,
            speedZ: 3 + Math.random() * 7, // Adjusted for smoother motion
            size: size,
            passed: false,
            // Very short initial delay for staggered start
            delay: Math.random() * 50
        });
    }
    
    // Create background starfield points
    createStarfieldPoints() {
        const starCount = 1000; // Fewer points for better performance
        
        for (let i = 0; i < starCount; i++) {
            this.createSingleStarPoint(false);
        }
    }
    
    // Create a single star point
    createSingleStarPoint(isReplacement = false) {
        const point = document.createElement('div');
        point.className = 'star-point';
        
        // Position within viewport but far away
        const viewWidth = window.innerWidth;
        const viewHeight = window.innerHeight;
        
        // Use tunnel distribution
        const distFromCenter = 0.2 + Math.random() * 0.8;
        const angle = Math.random() * Math.PI * 2;
        
        // Convert to screen coordinates
        const x = viewWidth/2 + Math.cos(angle) * (viewWidth/2) * distFromCenter;
        const y = viewHeight/2 + Math.sin(angle) * (viewHeight/2) * distFromCenter;
        
        // Z-position (depth)
        const z = isReplacement ? -2000 - Math.random() * 1000 : (-800 - Math.random() * 1200);
        
        // Simple small points
        const size = 1 + Math.random() * 0.5;
        
        // Star colors matching image style
        let starColor;
        const colorRandom = Math.random();
        if (colorRandom > 0.85) {
            starColor = `rgb(180, 230, 180)`;
        } else if (colorRandom > 0.7) {
            starColor = `rgb(240, 250, 240)`;
        } else {
            starColor = `rgb(200, 220, 200)`;
        }
        
        point.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background-color: ${starColor};
            border-radius: 50%;
            left: ${x}px;
            top: ${y}px;
            opacity: ${isReplacement ? 0 : 0.7};
            transform: translate(-50%, -50%) translateZ(${z}px);
            will-change: transform, left, top;
        `;
        
        this.pointsContainer.appendChild(point);
        
        // Movement speed
        const speedVariation = 0.7 + (distFromCenter * 0.5);
        const baseSpeed = 5 + Math.random() * 10; // Reduced for smoother motion
        
        this.starfieldPoints.push({
            element: point,
            x: x,
            y: y,
            z: z,
            speed: baseSpeed * speedVariation,
            size: size,
            color: starColor,
            active: true,
            dirX: (viewWidth/2 - x) * 0.00005,
            dirY: (viewHeight/2 - y) * 0.00005
        });
        
        return this.starfieldPoints.length - 1;
    }
    
    // Animate text points moving toward viewer
    animatePointsMovement() {
        let lastTime = performance.now();
        const targetZ = 2000; // Z-position when points "pass" the viewer
        
        const animate = (timestamp) => {
            // Calculate delta time for smoother animation
            const deltaTime = Math.min(32, timestamp - lastTime); // Cap at 32ms (30fps) to avoid jumps
            const timeScale = deltaTime / 16.67; // Scale relative to 60fps
            lastTime = timestamp;
            
            // Move all text points
            for (let i = 0; i < this.textPoints.length; i++) {
                const point = this.textPoints[i];
                
                // Skip if point has already passed and been counted
                if (point.passed) continue;
                
                // Start after individual delay
                if (timestamp - this.startTime > point.delay) {
                    // Move points with consistent speed scaled by deltaTime
                    point.x += point.speedX * timeScale;
                    point.y += point.speedY * timeScale;
                    point.z += point.speedZ * timeScale;
                    
                    // Apply position changes
                    point.element.style.transform = `translate(-50%, -50%) translateZ(${point.z}px)`;
                    point.element.style.left = `${point.x}px`;
                    point.element.style.top = `${point.y}px`;
                    
                    // Check if point reached viewer
                    if (point.z > targetZ) {
                        // Mark as passed and count it
                        point.passed = true;
                        this.passedPointsCount++;
                        
                        // Hide the point once it passes
                        point.element.style.opacity = '0';
                    }
                }
            }
            
            // Move background starfield points
            for (let i = 0; i < this.starfieldPoints.length; i++) {
                const star = this.starfieldPoints[i];
                
                if (!star.active) continue;
                
                // Move star with consistent speed scaled by deltaTime
                star.z += star.speed * timeScale;
                
                // Gentle curve toward center
                const viewWidth = window.innerWidth;
                const viewHeight = window.innerHeight;
                const curveStrength = 0.0001 * star.z;
                
                star.x += (viewWidth/2 - star.x) * curveStrength * timeScale;
                star.y += (viewHeight/2 - star.y) * curveStrength * timeScale;
                
                // Update position
                star.element.style.left = `${star.x}px`;
                star.element.style.top = `${star.y}px`;
                star.element.style.transform = `translate(-50%, -50%) translateZ(${star.z}px)`;
                
                // Reset if passed viewer
                if (star.z > 900) {
                    this.resetStar(i);
                }
            }
            
            // Check if all text points have passed
            if (this.passedPointsCount >= this.totalTextPoints * 0.3) { // Further reduced threshold
                // Cancel animation and start transition sequence
                cancelAnimationFrame(this.requestID);
                this.requestID = null;
                this.startFinalTransition();
                return;
            }
            
            this.requestID = requestAnimationFrame(animate);
        };
        
        this.startTime = performance.now();
        this.requestID = requestAnimationFrame(animate);
    }
    
    // Start final transition sequence
    startFinalTransition() {
        // Start transition immediately after points pass
        this.triggerFadeTransition(800);
    }
    
    // Simple fade transition to next screen - now instant
    triggerFadeTransition(duration) {
        // Skip fade animation and complete immediately
        this.completeAnimation();
    }
    
    // Reset a star that's passed by the viewer
    resetStar(index) {
        const star = this.starfieldPoints[index];
        
        // Get viewport dimensions
        const viewWidth = window.innerWidth;
        const viewHeight = window.innerHeight;
        
        // Position randomly on screen, but far away
        const distanceFromCenter = Math.random() * 0.95;
        const angle = Math.random() * Math.PI * 2;
        
        star.x = viewWidth/2 + Math.cos(angle) * (viewWidth/2) * distanceFromCenter;
        star.y = viewHeight/2 + Math.sin(angle) * (viewHeight/2) * distanceFromCenter;
        star.z = -2000 - Math.random() * 1000;
        
        // Adjust direction vector
        star.dirX = (viewWidth/2 - star.x) * 0.00005;
        star.dirY = (viewHeight/2 - star.y) * 0.00005;
        
        // Reset element style
        star.element.style.left = `${star.x}px`;
        star.element.style.top = `${star.y}px`;
        star.element.style.transform = `translate(-50%, -50%) translateZ(${star.z}px)`;
        star.element.style.opacity = '0.7';
    }

    // Complete the animation and transition to main content
    completeAnimation() {
        if (this.animationComplete) return;
        this.animationComplete = true;
        
        // Fade out the loading container
        this.loadingContainer.style.opacity = '0';
        
        // Clean up
        if (this.requestID) {
            cancelAnimationFrame(this.requestID);
            this.requestID = null;
        }
        
        // Remove the loading container after fade out
        setTimeout(() => {
            document.body.removeChild(this.loadingContainer);
            
            // Trigger the completion callback
            if (typeof this.onComplete === 'function') {
                this.onComplete();
            }
        }, 1000);
    }

    // Set a callback to be called when animation completes
    setOnComplete(callback) {
        this.onComplete = callback;
    }

    // Update loading progress directly
    updateProgress(progress) {
        this.loadingProgress = progress;
    }
}
