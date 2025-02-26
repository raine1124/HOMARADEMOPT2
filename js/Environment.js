import * as THREE from 'three';

export class Environment {
    constructor() {
        this.group = new THREE.Group();
        
        // Lighting objects
        this.lights = {
            ambient: null,
            sunLight: null,
            blueLight: null,
            warmBacklight: null,
            lightHaze: null
        };
        
        // Create ground plane
        this.createGround();
        
        // Create lighting environment
        this.createLighting();
    }
    
    createGround() {
        // Create a disc-shaped pointcloud for the ground in grayscale
        const radius = 100;
        const points = 10000;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        
        for (let i = 0; i < points; i++) {
            // Random position within a disc
            const r = radius * Math.sqrt(Math.random());
            const theta = Math.random() * Math.PI * 2;
            
            const x = r * Math.cos(theta);
            // Slight undulation in the y (height) to make it look natural
            const y = -1 + Math.random() * 0.5;
            const z = r * Math.sin(theta);
            
            positions.push(x, y, z);
            
            // Grayscale colors
            const shade = 0.3 + Math.random() * 0.3; // Varying shades of gray
            colors.push(shade, shade, shade);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        const groundPoints = new THREE.Points(geometry, material);
        groundPoints.name = "ground";
        this.group.add(groundPoints);
    }
    
    createLighting() {
        // Ambient light for global illumination (reduced for more dramatic light beams)
        this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.2);
        this.group.add(this.lights.ambient);
        
        // Main directional light simulating cathedral window light
        this.lights.sunLight = new THREE.DirectionalLight(0xffffcc, 1.0);
        this.lights.sunLight.position.set(0, 80, 0); // Light from directly above
        this.lights.sunLight.castShadow = true;
        
        // Add subtle blue light for fill
        this.lights.blueLight = new THREE.DirectionalLight(0x8080ff, 0.15);
        this.lights.blueLight.position.set(-20, 60, -10);
        
        // Add subtle warm side light
        this.lights.warmBacklight = new THREE.DirectionalLight(0xff8030, 0.2);
        this.lights.warmBacklight.position.set(30, 40, -20);
        
        this.group.add(this.lights.sunLight);
        this.group.add(this.lights.blueLight);
        this.group.add(this.lights.warmBacklight);
        
        // Create light beams like in a cathedral
        this.createLightBeams();
    }
    
    createLightBeams() {
        // Create cathedral-like light beams
        const beamCount = 5; // Number of light beams
        this.lightBeams = [];
        
        for (let i = 0; i < beamCount; i++) {
            // Create beam geometry
            const beamGeometry = new THREE.BufferGeometry();
            const positions = [];
            const colors = [];
            
            // Random position for this beam
            const beamX = -30 + Math.random() * 60;
            const beamZ = -30 + Math.random() * 60;
            const beamTop = 80; // Height of the beam top
            const beamBottom = -2; // Where the beam hits the ground
            
            // Beam width parameters
            const widthTop = 3 + Math.random() * 5;
            const widthBottom = 8 + Math.random() * 10;
            const pointsPerBeam = 2000;
            
            // Create points for this beam
            for (let j = 0; j < pointsPerBeam; j++) {
                // Randomize height within the beam
                const height = beamBottom + Math.random() * (beamTop - beamBottom);
                
                // Calculate width at this height 
                const t = (height - beamBottom) / (beamTop - beamBottom);
                const width = widthBottom * (1 - t) + widthTop * t;
                
                // Random position within the cone
                const r = width * Math.sqrt(Math.random()) * 0.5;
                const theta = Math.random() * Math.PI * 2;
                
                const x = beamX + r * Math.cos(theta);
                const y = height;
                const z = beamZ + r * Math.sin(theta);
                
                positions.push(x, y, z);
                
                // Calculate color based on height
                // More transparent near the top, more dense near the bottom
                const opacity = 0.1 + 0.4 * (1 - t);
                const brightness = 0.8 + Math.random() * 0.2;
                
                colors.push(
                    brightness, 
                    brightness * 0.9, 
                    brightness * 0.7,
                    opacity
                );
            }
            
            beamGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            beamGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
            
            const material = new THREE.PointsMaterial({
                size: 0.15 + Math.random() * 0.1,
                vertexColors: true,
                transparent: true,
                opacity: 0.5,
                blending: THREE.AdditiveBlending,
                depthWrite: false // Important for proper transparency
            });
            
            const beam = new THREE.Points(beamGeometry, material);
            beam.name = `lightBeam${i}`;
            this.group.add(beam);
            this.lightBeams.push(beam);
        }
        
        // Create a central, more prominent beam
        const centralBeamGeometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        
        // Position over the tree
        const beamX = 0;
        const beamZ = 0;
        const beamTop = 90;
        const beamBottom = -1; 
        
        // Central beam is wider
        const widthTop = 8;
        const widthBottom = 15;
        const pointsPerBeam = 3000;
        
        for (let j = 0; j < pointsPerBeam; j++) {
            const height = beamBottom + Math.random() * (beamTop - beamBottom);
            const t = (height - beamBottom) / (beamTop - beamBottom);
            const width = widthBottom * (1 - t) + widthTop * t;
            
            const r = width * Math.sqrt(Math.random()) * 0.5;
            const theta = Math.random() * Math.PI * 2;
            
            const x = beamX + r * Math.cos(theta);
            const y = height;
            const z = beamZ + r * Math.sin(theta);
            
            positions.push(x, y, z);
            
            // Central beam is brighter
            const opacity = 0.15 + 0.45 * (1 - t);
            const brightness = 0.9 + Math.random() * 0.1;
            
            colors.push(
                brightness, 
                brightness * 0.95, 
                brightness * 0.8,
                opacity
            );
        }
        
        centralBeamGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        centralBeamGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
        
        const centralMaterial = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const centralBeam = new THREE.Points(centralBeamGeometry, centralMaterial);
        centralBeam.name = "centralLightBeam";
        this.group.add(centralBeam);
        this.lightBeams.push(centralBeam);
    }
    
    // Toggle to night mode
    setNightTime() {
        // Reduce ambient light
        this.lights.ambient.intensity = 0.05;
        
        // Change main light to moonlight (blue-white, less intense)
        this.lights.sunLight.color.set(0xaaaaff);
        this.lights.sunLight.intensity = 0.3;
        
        // Keep beam position but change color
        this.lights.sunLight.position.set(0, 80, 0);
        
        // Adjust other lights for night ambiance
        this.lights.blueLight.intensity = 0.2;
        this.lights.blueLight.color.set(0x4040ff);
        
        // Reduce warm backlight
        this.lights.warmBacklight.intensity = 0.1;
        
        // Update light beams for night
        if (this.lightBeams) {
            this.lightBeams.forEach(beam => {
                // Make beams blue-tinted and more transparent for night
                beam.material.opacity *= 0.6;
                
                if (beam.geometry.attributes.color) {
                    const colors = beam.geometry.attributes.color;
                    for (let i = 0; i < colors.count; i += 4) {
                        const brightness = 0.5 + Math.random() * 0.3;
                        // Bluish tint for night
                        colors.setXYZ(i, 
                            brightness * 0.6, 
                            brightness * 0.8, 
                            brightness * 1.0
                        );
                    }
                    colors.needsUpdate = true;
                }
            });
        }
        
        // Darken the ground
        this.group.children.forEach(child => {
            if (child.name === "ground") {
                if (child.geometry.attributes.color) {
                    const colors = child.geometry.attributes.color;
                    for (let i = 0; i < colors.count; i += 3) {
                        const shade = 0.1 + Math.random() * 0.15; // Darker grayscale for night
                        colors.setXYZ(i, shade, shade, shade + 0.05);
                    }
                    colors.needsUpdate = true;
                }
            }
        });
    }
    
    // Toggle to day mode
    setDayTime() {
        // Restore default lighting
        this.lights.ambient.intensity = 0.2;
        
        // Restore sunlight
        this.lights.sunLight.color.set(0xffffcc);
        this.lights.sunLight.intensity = 1.0;
        this.lights.sunLight.position.set(0, 80, 0);
        
        // Restore other lights
        this.lights.blueLight.intensity = 0.15;
        this.lights.blueLight.color.set(0x8080ff);
        this.lights.warmBacklight.intensity = 0.2;
        
        // Restore light beams
        if (this.lightBeams) {
            this.lightBeams.forEach(beam => {
                // Restore original beam appearance
                beam.material.opacity = beam.name === "centralLightBeam" ? 0.6 : 0.5;
                
                if (beam.geometry.attributes.color) {
                    const colors = beam.geometry.attributes.color;
                    for (let i = 0; i < colors.count; i += 4) {
                        const brightness = 0.8 + Math.random() * 0.2;
                        // Warm light color for day
                        colors.setXYZ(i, 
                            brightness, 
                            brightness * 0.95, 
                            brightness * 0.8
                        );
                    }
                    colors.needsUpdate = true;
                }
            });
        }
        
        // Restore ground
        this.group.children.forEach(child => {
            if (child.name === "ground") {
                if (child.geometry.attributes.color) {
                    const colors = child.geometry.attributes.color;
                    for (let i = 0; i < colors.count; i += 3) {
                        const shade = 0.3 + Math.random() * 0.3; // Original grayscale for day
                        colors.setXYZ(i, shade, shade, shade);
                    }
                    colors.needsUpdate = true;
                }
            }
        });
    }
    
    // Animation update method
    update() {
        // Subtle dust particle movement in the light beams
        if (this.lightBeams) {
            this.lightBeams.forEach(beam => {
                if (beam.geometry.attributes.position) {
                    const positions = beam.geometry.attributes.position;
                    
                    // Only update some particles each frame for efficiency
                    const updateCount = Math.floor(positions.count * 0.02); 
                    const startIdx = Math.floor(Math.random() * (positions.count - updateCount));
                    
                    for (let i = startIdx; i < startIdx + updateCount; i++) {
                        if (i >= positions.count) break;
                        
                        // Add subtle downward drift to simulate dust in light
                        const x = positions.getX(i);
                        const y = positions.getY(i);
                        const z = positions.getZ(i);
                        
                        // Move down slightly
                        const newY = y - 0.01;
                        
                        // If dust particle reaches bottom, reset to top
                        if (newY < -2) {
                            // Reset to somewhere near the top of the beam
                            const beamWidth = 5 + Math.random() * 5;
                            const r = beamWidth * Math.sqrt(Math.random()) * 0.5;
                            const theta = Math.random() * Math.PI * 2;
                            
                            positions.setXYZ(i,
                                beam.name === "centralLightBeam" ? (r * Math.cos(theta)) : (x + 0.05 * (Math.random() - 0.5)),
                                70 + Math.random() * 10, // Top of beam
                                beam.name === "centralLightBeam" ? (r * Math.sin(theta)) : (z + 0.05 * (Math.random() - 0.5))
                            );
                        } else {
                            // Add slight horizontal drift
                            positions.setXYZ(i,
                                x + 0.005 * (Math.random() - 0.5),
                                newY,
                                z + 0.005 * (Math.random() - 0.5)
                            );
                        }
                    }
                    
                    positions.needsUpdate = true;
                    
                    // Subtle size animation
                    const pulseFactor = 1.0 + 0.05 * Math.sin(Date.now() * 0.001);
                    beam.material.size = beam.material.size * 0.99 + (beam.name === "centralLightBeam" ? 0.2 : 0.15) * 0.01 * pulseFactor;
                }
            });
        }
    }
}