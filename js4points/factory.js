/**
 * Optimized Factory Animation for Point1
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get factory container
    const factoryContainer = document.getElementById('factory-container');
    if (!factoryContainer) {
        console.error('Factory container not found');
        return;
    }

    // Create main canvas
    const factoryCanvas = document.createElement('canvas');
    factoryCanvas.width = 400;
    factoryCanvas.height = 300;
    factoryContainer.appendChild(factoryCanvas);
    const factoryCtx = factoryCanvas.getContext('2d');
    
    // Create static background canvas (drawn only once)
    const staticCanvas = document.createElement('canvas');
    staticCanvas.width = factoryCanvas.width;
    staticCanvas.height = factoryCanvas.height;
    const staticCtx = staticCanvas.getContext('2d');
    
    // Smoke particles
    const smokeParticles = [];
    const MAX_PARTICLES = 15; // Reduced for performance
    
    // Colors
    const colors = {
        steel: '#a0a0a0',
        darkSteel: '#707070',
        veryDarkSteel: '#505050',
        lightSteel: '#d0d0d0',
        pipe: '#909090',
        pipeLight: '#b0b0b0',
        pipeShadow: '#606060',
        shadow: '#404040',
        sign: '#303030',
        signText: '#ffdd00'
    };
    
    // Factory structures
    const smokestacks = [
        {x: 70, y: 0, width: 20, height: 280, capWidth: 24},
        {x: 160, y: 10, width: 30, height: 270, capWidth: 36},
        {x: 240, y: 40, width: 15, height: 240, capWidth: 18},
        {x: 290, y: 20, width: 25, height: 260, capWidth: 30},
        {x: 350, y: 60, width: 18, height: 220, capWidth: 22}
    ];
    
    const silos = [
        {x: 210, y: 130, width: 40, height: 170},
        {x: 265, y: 150, width: 44, height: 150},
        {x: 110, y: 140, width: 36, height: 160},
        {x: 40, y: 160, width: 30, height: 140}
    ];
    
    // Smoke generator positions (using smokestack data)
    const smokeGenerators = smokestacks.map(stack => ({
        x: stack.x + stack.width / 2,
        y: stack.y - 5
    }));
    
    // Draw the static factory elements (called only once)
    function drawStaticFactory() {
        // Draw smokestacks
        smokestacks.forEach(stack => {
            // Smokestack body
            staticCtx.fillStyle = colors.darkSteel;
            staticCtx.fillRect(stack.x, stack.y, stack.width, stack.height);
            
            // Smokestack cap
            staticCtx.fillStyle = colors.steel;
            staticCtx.fillRect(stack.x - (stack.capWidth - stack.width)/2, stack.y, stack.capWidth, 10);
            
            // Horizontal detail lines on smokestack
            staticCtx.strokeStyle = colors.veryDarkSteel;
            staticCtx.lineWidth = 1;
            for (let y = stack.y + 20; y < stack.y + stack.height; y += 30) {
                staticCtx.beginPath();
                staticCtx.moveTo(stack.x, y);
                staticCtx.lineTo(stack.x + stack.width, y);
                staticCtx.stroke();
            }
            
            // Add pipe frameworks on smokestacks
            if (stack.width > 20) {
                // Add side pipes 
                staticCtx.fillStyle = colors.pipe;
                staticCtx.fillRect(stack.x - 8, stack.y + 20, 4, stack.height - 30);
                staticCtx.fillRect(stack.x + stack.width + 4, stack.y + 20, 4, stack.height - 30);
                
                // Horizontal connectors
                for (let y = stack.y + 40; y < stack.y + stack.height - 20; y += 50) {
                    staticCtx.fillRect(stack.x - 8, y, stack.width + 16, 4);
                }
            }
            
            // Add ladder structures on tall smokestacks
            if (stack.height > 220) {
                const ladderX = stack.x + stack.width + 2;
                
                // Vertical rails
                staticCtx.strokeStyle = colors.steel;
                staticCtx.beginPath();
                staticCtx.moveTo(ladderX, stack.y + 20);
                staticCtx.lineTo(ladderX, stack.y + stack.height);
                staticCtx.stroke();
                
                staticCtx.beginPath();
                staticCtx.moveTo(ladderX + 6, stack.y + 20);
                staticCtx.lineTo(ladderX + 6, stack.y + stack.height);
                staticCtx.stroke();
                
                // Rungs
                staticCtx.strokeStyle = colors.darkSteel;
                for (let y = stack.y + 30; y < stack.y + stack.height; y += 15) {
                    staticCtx.beginPath();
                    staticCtx.moveTo(ladderX, y);
                    staticCtx.lineTo(ladderX + 6, y);
                    staticCtx.stroke();
                }
            }
        });
        
        // Add a maintenance platform at the top of first smokestack
        const maintenanceStack = smokestacks[0];
        staticCtx.fillStyle = colors.steel;
        staticCtx.fillRect(maintenanceStack.x - 15, maintenanceStack.y + 10, maintenanceStack.width + 30, 5);
        
        // Platform railings
        staticCtx.strokeStyle = colors.steel;
        staticCtx.beginPath();
        staticCtx.moveTo(maintenanceStack.x - 15, maintenanceStack.y + 10);
        staticCtx.lineTo(maintenanceStack.x - 15, maintenanceStack.y);
        staticCtx.stroke();
        
        staticCtx.beginPath();
        staticCtx.moveTo(maintenanceStack.x + maintenanceStack.width + 15, maintenanceStack.y + 10);
        staticCtx.lineTo(maintenanceStack.x + maintenanceStack.width + 15, maintenanceStack.y);
        staticCtx.stroke();
        
        staticCtx.beginPath();
        staticCtx.moveTo(maintenanceStack.x - 15, maintenanceStack.y);
        staticCtx.lineTo(maintenanceStack.x + maintenanceStack.width + 15, maintenanceStack.y);
        staticCtx.stroke();
        
        // Draw pipe frameworks
        drawPipeFramework(90, 120, 80, 130, 4, 3);
        drawPipeFramework(230, 130, 70, 120, 3, 2);
        
        // Main horizontal pipes
        staticCtx.fillStyle = colors.pipe;
        staticCtx.fillRect(40, 200, 340, 9);
        staticCtx.fillRect(60, 230, 310, 7);
        staticCtx.fillRect(80, 170, 280, 8);
        staticCtx.fillRect(100, 140, 200, 6);
        staticCtx.fillRect(120, 110, 160, 7);
        staticCtx.fillRect(220, 160, 140, 8);
        
        // Highlights on pipes
        staticCtx.strokeStyle = colors.pipeLight;
        staticCtx.lineWidth = 1;
        staticCtx.beginPath();
        staticCtx.moveTo(40, 200);
        staticCtx.lineTo(380, 200);
        staticCtx.stroke();
        
        // Add diagonal connecting pipes
        drawDiagonalPipe(100, 160, 150, 120, 6);
        drawDiagonalPipe(220, 180, 270, 140, 6);
        drawDiagonalPipe(180, 200, 230, 150, 5);
        
        // Draw silos
        silos.forEach(silo => {
            // Draw the silo body
            staticCtx.fillStyle = colors.lightSteel;
            staticCtx.fillRect(silo.x, silo.y, silo.width, silo.height);
            
            // Left shadow
            staticCtx.fillStyle = colors.shadow;
            staticCtx.fillRect(silo.x, silo.y, 2, silo.height);
            
            // Right highlight  
            staticCtx.fillStyle = '#ffffff';
            staticCtx.fillRect(silo.x + silo.width - 2, silo.y, 2, silo.height);
            
            // Top curve
            staticCtx.fillStyle = colors.lightSteel;
            staticCtx.beginPath();
            staticCtx.arc(silo.x + silo.width/2, silo.y, silo.width/2, 0, Math.PI, true);
            staticCtx.fill();
            
            // Bottom curve
            staticCtx.beginPath();
            staticCtx.arc(silo.x + silo.width/2, silo.y + silo.height, silo.width/2, 0, Math.PI, false);
            staticCtx.fill();
            
            // Add horizontal bands around silos
            staticCtx.strokeStyle = colors.pipe;
            staticCtx.lineWidth = 1;
            for (let y = silo.y + 20; y < silo.y + silo.height; y += 30) {
                staticCtx.beginPath();
                staticCtx.moveTo(silo.x, y);
                staticCtx.lineTo(silo.x + silo.width, y);
                staticCtx.stroke();
            }
            
            // Add pipes to silos
            staticCtx.fillStyle = colors.pipe;
            staticCtx.fillRect(silo.x + silo.width/4, silo.y - 40, 5, 40);
            staticCtx.fillRect(silo.x - 20, silo.y + silo.height/3, 20, 6);
            staticCtx.fillRect(silo.x + silo.width, silo.y + silo.height*2/3, 25, 6);
        });
        
        // Add factory base with door for bulldozer
        staticCtx.fillStyle = colors.veryDarkSteel;
        staticCtx.fillRect(10, 260, 380, 40); // Base
        
        staticCtx.fillStyle = colors.darkSteel;
        staticCtx.fillRect(30, 260, 60, 30); // Bulldozer exit
        
        // Add grating and industrial details to base
        for (let x = 20; x < 380; x += 40) {
            staticCtx.fillStyle = colors.pipe;
            staticCtx.fillRect(x, 260, 3, 40);
        }
        
        for (let y = 270; y < 300; y += 15) {
            staticCtx.fillStyle = colors.pipe;
            staticCtx.fillRect(10, y, 380, 2);
        }
        
        // Add processing units
        const processingUnits = [
            {x: 120, y: 200, width: 30, height: 60},
            {x: 170, y: 190, width: 40, height: 70},
            {x: 240, y: 195, width: 35, height: 65},
            {x: 290, y: 190, width: 25, height: 70},
            {x: 75, y: 195, width: 35, height: 65}
        ];
        
        processingUnits.forEach(unit => {
            staticCtx.fillStyle = colors.steel;
            staticCtx.fillRect(unit.x, unit.y, unit.width, unit.height);
            
            // Add detail lines
            staticCtx.strokeStyle = colors.darkSteel;
            for (let y = unit.y + 10; y < unit.y + unit.height; y += 15) {
                staticCtx.beginPath();
                staticCtx.moveTo(unit.x, y);
                staticCtx.lineTo(unit.x + unit.width, y);
                staticCtx.stroke();
            }
            
            // Add vertical pipes on top
            staticCtx.fillStyle = colors.pipe;
            staticCtx.fillRect(unit.x + unit.width/4, unit.y - 30, 6, 30);
            staticCtx.fillRect(unit.x + unit.width*3/4, unit.y - 40, 6, 40);
        });
        
        // "R4INE INC" sign on second smokestack
        const tallestStack = smokestacks[1]; 
        
        // Draw sign box
        staticCtx.fillStyle = '#1a1a1a';
        staticCtx.fillRect(tallestStack.x - 50, tallestStack.y + 50, 130, 30);
        
        // Draw sign text
        staticCtx.fillStyle = colors.signText;
        
        // Using a bitmap approach for the text
        const letterPatterns = {
            R: [
                [1, 1, 1, 0, 0],
                [1, 0, 0, 1, 0],
                [1, 1, 1, 0, 0],
                [1, 0, 1, 0, 0],
                [1, 0, 0, 1, 0]
            ],
            4: [
                [1, 0, 0, 1, 0],
                [1, 0, 0, 1, 0],
                [1, 1, 1, 1, 0],
                [0, 0, 0, 1, 0],
                [0, 0, 0, 1, 0]
            ],
            I: [
                [1, 1, 1, 0, 0],
                [0, 1, 0, 0, 0],
                [0, 1, 0, 0, 0],
                [0, 1, 0, 0, 0],
                [1, 1, 1, 0, 0]
            ],
            N: [
                [1, 0, 0, 0, 1],
                [1, 1, 0, 0, 1],
                [1, 0, 1, 0, 1],
                [1, 0, 0, 1, 1],
                [1, 0, 0, 0, 1]
            ],
            E: [
                [1, 1, 1, 1, 0],
                [1, 0, 0, 0, 0],
                [1, 1, 1, 0, 0],
                [1, 0, 0, 0, 0],
                [1, 1, 1, 1, 0]
            ],
            C: [
                [1, 1, 1, 1, 0],
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0],
                [1, 1, 1, 1, 0]
            ]
        };
        
        // Draw each letter
        const text = "R4INE INC";
        let xPos = tallestStack.x - 40;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === ' ') {
                xPos += 8; // Space
                continue;
            }
            
            // Get the bitmap pattern for this character
            const pattern = letterPatterns[char];
            if (pattern) {
                for (let y = 0; y < pattern.length; y++) {
                    for (let x = 0; x < pattern[y].length; x++) {
                        if (pattern[y][x]) {
                            staticCtx.fillRect(xPos + x*2, tallestStack.y + 55 + y*2, 2, 2);
                        }
                    }
                }
            }
            xPos += 10;
        }
        
        // Add valve and gauge details at various connection points
        const pipeDetails = [
            {x: 120, y: 140, size: 8},
            {x: 180, y: 160, size: 10},
            {x: 230, y: 130, size: 9},
            {x: 280, y: 170, size: 8},
            {x: 320, y: 150, size: 10},
            {x: 150, y: 200, size: 7},
            {x: 200, y: 180, size: 9},
            {x: 250, y: 210, size: 8},
            {x: 300, y: 190, size: 7},
            {x: 350, y: 220, size: 9}
        ];
        
        pipeDetails.forEach(detail => {
            // Draw valve wheel or gauge (alternating)
            if (detail.x % 20 < 10) { // Deterministic instead of random
                // Valve wheel
                staticCtx.fillStyle = colors.steel;
                staticCtx.beginPath();
                staticCtx.arc(detail.x, detail.y, detail.size/2, 0, Math.PI * 2);
                staticCtx.fill();
                
                staticCtx.fillStyle = colors.darkSteel;
                staticCtx.beginPath();
                staticCtx.arc(detail.x, detail.y, detail.size/4, 0, Math.PI * 2);
                staticCtx.fill();
                
                // Valve spokes
                staticCtx.strokeStyle = colors.lightSteel;
                staticCtx.beginPath();
                staticCtx.moveTo(detail.x - detail.size/2, detail.y);
                staticCtx.lineTo(detail.x + detail.size/2, detail.y);
                staticCtx.stroke();
                
                staticCtx.beginPath();
                staticCtx.moveTo(detail.x, detail.y - detail.size/2);
                staticCtx.lineTo(detail.x, detail.y + detail.size/2);
                staticCtx.stroke();
            } else {
                // Gauge
                staticCtx.fillStyle = colors.darkSteel;
                staticCtx.beginPath();
                staticCtx.arc(detail.x, detail.y, detail.size/2, 0, Math.PI * 2);
                staticCtx.fill();
                
                staticCtx.fillStyle = colors.steel;
                staticCtx.beginPath();
                staticCtx.arc(detail.x, detail.y, detail.size/3, 0, Math.PI * 2);
                staticCtx.fill();
                
                // Gauge needle
                const angle = (detail.x * detail.y) % 314 / 100; // Deterministic angle
                const needleLength = detail.size/3;
                const endX = detail.x + Math.cos(angle) * needleLength;
                const endY = detail.y + Math.sin(angle) * needleLength;
                
                staticCtx.strokeStyle = colors.signText;
                staticCtx.beginPath();
                staticCtx.moveTo(detail.x, detail.y);
                staticCtx.lineTo(endX, endY);
                staticCtx.stroke();
            }
        });
    }
    
    // Draw a pipe framework grid
    function drawPipeFramework(x, y, width, height, rows, columns) {
        const rowHeight = height / rows;
        const colWidth = width / columns;
        
        // Horizontal pipes
        staticCtx.fillStyle = colors.pipe;
        for (let i = 0; i <= rows; i++) {
            staticCtx.fillRect(x, y + i * rowHeight, width, 4);
        }
        
        // Vertical pipes
        for (let i = 0; i <= columns; i++) {
            staticCtx.fillRect(x + i * colWidth, y, 4, height);
        }
        
        // Add pipe connectors at intersections
        for (let r = 0; r <= rows; r++) {
            for (let c = 0; c <= columns; c++) {
                staticCtx.beginPath();
                staticCtx.arc(x + c * colWidth + 2, y + r * rowHeight + 2, 3, 0, Math.PI * 2);
                staticCtx.fill();
            }
        }
    }
    
    // Draw a diagonal pipe
    function drawDiagonalPipe(x1, y1, x2, y2, width) {
        staticCtx.save();
        
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const length = Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
        
        staticCtx.translate(x1, y1);
        staticCtx.rotate(angle);
        
        // Main pipe
        staticCtx.fillStyle = colors.pipe;
        staticCtx.fillRect(0, -width/2, length, width);
        
        // Highlight
        staticCtx.strokeStyle = colors.pipeLight;
        staticCtx.beginPath();
        staticCtx.moveTo(0, -width/2);
        staticCtx.lineTo(length, -width/2);
        staticCtx.stroke();
        
        // Shadow
        staticCtx.strokeStyle = colors.pipeShadow;
        staticCtx.beginPath();
        staticCtx.moveTo(0, width/2);
        staticCtx.lineTo(length, width/2);
        staticCtx.stroke();
        
        staticCtx.restore();
    }
    
    // Generate a new smoke particle
    function generateSmoke() {
        if (smokeParticles.length >= MAX_PARTICLES) return;
        
        if (Math.random() < 0.2) {
            const generator = smokeGenerators[Math.floor(Math.random() * smokeGenerators.length)];
            smokeParticles.push({
                x: generator.x,
                y: generator.y,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: -0.5 - Math.random() * 0.3,
                life: 0,
                maxLife: 120 + Math.random() * 60,
                size: 5 + Math.random() * 5
            });
        }
    }
    
    // Update and draw smoke particles
    function updateSmoke() {
        factoryCtx.clearRect(0, 0, factoryCanvas.width, factoryCanvas.height);
        factoryCtx.drawImage(staticCanvas, 0, 0);
        
        for (let i = smokeParticles.length - 1; i >= 0; i--) {
            const particle = smokeParticles[i];
            
            // Move the particle
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            // Add slight wind effect
            if (particle.life > 30) {
                particle.speedX = Math.max(particle.speedX + 0.001, 0.05);
            }
            
            // Increase life
            particle.life++;
            
            // Remove if past maxLife
            if (particle.life > particle.maxLife) {
                smokeParticles.splice(i, 1);
                continue;
            }
            
            // Draw the particle
            const opacity = Math.max(0, 0.7 - particle.life / particle.maxLife);
            const radius = particle.size * (1 + 0.7 * (particle.life / particle.maxLife));
            
            factoryCtx.fillStyle = `rgba(220, 220, 220, ${opacity})`;
            factoryCtx.beginPath();
            factoryCtx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
            factoryCtx.fill();
        }
    }
    
    // Animation frame throttling
    let lastFrameTime = 0;
    const FPS = 30; // Limit to 30 FPS for better performance
    const frameInterval = 1000 / FPS;
    
    // Main animation loop with throttling
    function animate(timestamp) {
        const elapsed = timestamp - lastFrameTime;
        
        if (elapsed > frameInterval) {
            lastFrameTime = timestamp - (elapsed % frameInterval);
            
            // Generate and update smoke
            generateSmoke();
            updateSmoke();
        }
        
        requestAnimationFrame(animate);
    }
    
    // Initial setup
    drawStaticFactory();
    requestAnimationFrame(animate);
});
