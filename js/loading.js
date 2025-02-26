// loading.js - Creates a loading animation with "Homara" text filling up

export class LoadingAnimation {
    constructor() {
        this.loadingContainer = null;
        this.loadingText = null;
        this.onComplete = null;
        this.loadingProgress = 0;
        this.animationStarted = false;
        this.animationComplete = false;
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
        
        // Append elements
        this.loadingContainer.appendChild(this.loadingText);
        document.body.appendChild(this.loadingContainer);
        
        // Start the animation
        this.startAnimation();
    }

    // Start the loading animation
    startAnimation() {
        if (this.animationStarted) return;
        this.animationStarted = true;
        
        // Animate loading progress
        const animateLoading = () => {
            if (this.loadingProgress >= 100) {
                this.completeAnimation();
                return;
            }
            
            // Calculate progress - smoother, slightly faster fill
            const increment = 0.8; // Fixed increment for smoother animation
            this.loadingProgress = Math.min(this.loadingProgress + increment, 100);
            
            // Update loading text fill
            this.loadingText.style.background = 
                `linear-gradient(to top, #ffffff ${this.loadingProgress}%, transparent ${this.loadingProgress}%)`;
            this.loadingText.style.webkitBackgroundClip = 'text';
            this.loadingText.style.backgroundClip = 'text';
            
            // Schedule next frame
            if (this.loadingProgress < 100) {
                requestAnimationFrame(animateLoading);
            } else {
                setTimeout(() => this.completeAnimation(), 500);
            }
        };
        
        requestAnimationFrame(animateLoading);
    }

    // Complete the animation and transition to the main content
    completeAnimation() {
        if (this.animationComplete) return;
        this.animationComplete = true;
        
        // Fill the text completely
        this.loadingText.style.background = 'linear-gradient(to top, #ffffff 100%, transparent 100%)';
        this.loadingText.style.webkitBackgroundClip = 'text';
        this.loadingText.style.backgroundClip = 'text';
        
        // Fade out the loading container
        setTimeout(() => {
            this.loadingContainer.style.opacity = '0';
            
            // Remove the loading container after fade out
            setTimeout(() => {
                document.body.removeChild(this.loadingContainer);
                
                // Trigger the completion callback
                if (typeof this.onComplete === 'function') {
                    this.onComplete();
                }
            }, 1200);
        }, 800);
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