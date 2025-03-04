/**
 * Rain Animation for Point1
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get rain canvas
    const rainCanvas = document.getElementById('rain-canvas');
    const rainCtx = rainCanvas.getContext('2d');
    
    // Set canvas size to window size
    rainCanvas.width = window.innerWidth;
    rainCanvas.height = window.innerHeight;
    
    // Get video frame position
    const videoFrame = document.querySelector('.video-border');
    const frameRect = videoFrame.getBoundingClientRect();
    
    // Rain properties
    const raindrops = [];
    const splashes = [];
    const RAINDROP_COUNT = 100;
    const SPLASH_PARTICLES = 4;
    
    // Resize canvas when window is resized
    window.addEventListener('resize', function() {
        rainCanvas.width = window.innerWidth;
        rainCanvas.height = window.innerHeight;
        
        // Update video frame position
        const updatedFrameRect = videoFrame.getBoundingClientRect();
        frameRect.top = updatedFrameRect.top;
        frameRect.left = updatedFrameRect.left;
        frameRect.right = updatedFrameRect.right;
        frameRect.bottom = updatedFrameRect.bottom;
    });
    
    // Raindrop class
    class Raindrop {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = Math.random() * rainCanvas.width;
            this.y = Math.random() * -100; // Start above the canvas
            this.length = Math.random() * 20 + 10;
            this.speed = Math.random() * 5 + 10;
            this.thickness = Math.random() * 1.5 + 0.5;
            this.opacity = Math.random() * 0.4 + 0.1;
            
            // Make sure raindrops don't start over the video frame
            this.checkAndRepositionIfOverVideo();
        }
        
        // Make sure raindrop isn't over the video
        checkAndRepositionIfOverVideo() {
            if (this.x >= frameRect.left && this.x <= frameRect.right) {
                // If over the video horizontally, move to either left or right side
                if (Math.random() < 0.5) {
                    this.x = frameRect.left - Math.random() * 50; // Left side
                } else {
                    this.x = frameRect.right + Math.random() * 50; // Right side
                }
            }
        }
        
        update() {
            this.y += this.speed;
            
            // Check if raindrop is approaching video frame horizontally
            if (this.x >= frameRect.left - 5 && this.x <= frameRect.right + 5) {
                
                // If above video, check for top collision
                if (this.y + this.length >= frameRect.top && this.y < frameRect.top) {
                    // Create splash effect at top of video
                    for (let i = 0; i < SPLASH_PARTICLES; i++) {
                        splashes.push(new Splash(this.x, frameRect.top));
                    }
                    this.reset();
                    return;
                }
                
                // If about to enter video area from sides, redirect
                if (this.y >= frameRect.top && this.y <= frameRect.bottom) {
                    this.reset();
                    return;
                }
            }
            
            // If raindrop hits ground level, create splash and reset
            if (this.y > rainCanvas.height) {
                // Create splash effect
                for (let i = 0; i < SPLASH_PARTICLES; i++) {
                    splashes.push(new Splash(this.x, rainCanvas.height));
                }
                this.reset();
            }
        }
        
        draw() {
            // Don't draw over video area
            if (this.x >= frameRect.left && this.x <= frameRect.right &&
                this.y + this.length >= frameRect.top && this.y <= frameRect.bottom) {
                return;
            }
            
            rainCtx.beginPath();
            rainCtx.moveTo(this.x, this.y);
            rainCtx.lineTo(this.x, this.y + this.length);
            rainCtx.strokeStyle = `rgba(120, 150, 255, ${this.opacity})`;
            rainCtx.lineWidth = this.thickness;
            rainCtx.stroke();
        }
    }
    
    // Splash particle class
    class Splash {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = Math.random() * 1.5 + 0.5;
            this.speedX = Math.random() * 6 - 3;
            this.speedY = Math.random() * -3 - 1; // Always go up
            this.opacity = 0.6;
            this.gravity = 0.1;
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.speedY += this.gravity;
            this.opacity -= 0.03;
        }
        
        draw() {
            if (this.opacity <= 0) return;
            
            // Don't draw over video area
            if (this.x >= frameRect.left && this.x <= frameRect.right &&
                this.y >= frameRect.top && this.y <= frameRect.bottom) {
                return;
            }
            
            rainCtx.beginPath();
            rainCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            rainCtx.fillStyle = `rgba(200, 230, 255, ${this.opacity})`;
            rainCtx.fill();
        }
    }
    
    // Initialize raindrops
    for (let i = 0; i < RAINDROP_COUNT; i++) {
        raindrops.push(new Raindrop());
        raindrops[i].y = Math.random() * rainCanvas.height; // Distribute initial positions
        raindrops[i].checkAndRepositionIfOverVideo(); // Make sure they're not over the video
    }
    
    // Main animation loop
    function animate() {
        // Clear canvas
        rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
        
        // Update and draw raindrops
        raindrops.forEach(drop => {
            drop.update();
            drop.draw();
        });
        
        // Update and draw splashes
        for (let i = splashes.length - 1; i >= 0; i--) {
            splashes[i].update();
            splashes[i].draw();
            
            // Remove faded splashes
            if (splashes[i].opacity <= 0) {
                splashes.splice(i, 1);
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    // Start animation
    animate();
});
