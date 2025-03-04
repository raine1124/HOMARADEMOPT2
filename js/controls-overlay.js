// controls-overlay.js - Simple overlay that shows controls briefly after loading completes

export class ControlsOverlay {
    constructor() {
      this.overlay = null;
      this.timer = null;
    }
  
    /**
     * Show the controls overlay for a specified duration
     * @param {number} duration Time in milliseconds to show the overlay
     */
    show(duration = 8000) {
      // Create overlay if it doesn't exist
      if (!this.overlay) {
        this.create();
      }
  
      // Add to document
      document.body.appendChild(this.overlay);
      
      // Fade in
      setTimeout(() => {
        this.overlay.style.opacity = '1';
      }, 10);
  
      // Set timeout to remove
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.hide();
      }, duration);
    }
  
    /**
     * Hide the controls overlay
     */
    hide() {
      if (!this.overlay) return;
      
      // Fade out
      this.overlay.style.opacity = '0';
      
      // Remove from DOM after animation
      setTimeout(() => {
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
      }, 300);
    }
  
    /**
     * Create the controls overlay
     */
    create() {
      this.overlay = document.createElement('div');
      this.overlay.className = 'controls-overlay';
      this.overlay.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 15px;
        border-radius: 5px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
        max-width: 300px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      `;
  
      // Create content with controls info
      const content = document.createElement('div');
      content.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <div style="margin-right: 10px;">
            <div style="display: inline-block; border: 1px solid white; padding: 4px; width: 20px; height: 20px; text-align: center; margin: 2px;">W</div>
            <div style="display: flex;">
              <div style="border: 1px solid white; padding: 4px; width: 20px; height: 20px; text-align: center; margin: 2px;">A</div>
              <div style="border: 1px solid white; padding: 4px; width: 20px; height: 20px; text-align: center; margin: 2px;">S</div>
              <div style="border: 1px solid white; padding: 4px; width: 20px; height: 20px; text-align: center; margin: 2px;">D</div>
            </div>
          </div>
          <div>Movement</div>
        </div>
        
        <div style="display: flex; align-items: center;">
          <div style="margin-right: 10px;">
            <div style="display: inline-block; border: 1px solid white; width: 30px; height: 40px; border-radius: 15px; margin: 2px; position: relative;">
              <div style="width: 4px; height: 10px; background: white; position: absolute; top: 8px; left: 13px;"></div>
            </div>
          </div>
          <div>Look around</div>
        </div>
      `;
  
      this.overlay.appendChild(content);
    }
  }
  
 
