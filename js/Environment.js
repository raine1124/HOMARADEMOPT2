import * as THREE from 'three';

export class Environment {
    constructor() {
        this.group = new THREE.Group();
        
        this.createGround();
        this.createForest();
        this.createLighting();
    }
    
    createGround() {
        const radius = 100;
        const points = 10000;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        
        for (let i = 0; i < points; i++) {
            const r = radius * Math.sqrt(Math.random());
            const theta = Math.random() * Math.PI * 2;
            
            const x = r * Math.cos(theta);
            const y = -1 + Math.random() * 0.5;
            const z = r * Math.sin(theta);
            
            positions.push(x, y, z);
            
            // Grayscale floor
            const shade = 0.15 + Math.random() * 0.2; 
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
    
    createForest() {
        const forestGeometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        
        // Forest parameters
        const radius = 180;
        const maxHeight = 400;
        const thickness = 60;
        const totalPoints = 400000; // Increased for extended depth
        
        // Generate tree archetypes with varied characteristics
        const treeArchetypes = [];
        for (let i = 0; i < 12; i++) { // More archetypes
            treeArchetypes.push({
                branchDensity: 0.6 + Math.random() * 0.4,
                branchLength: 15 + Math.random() * 30,
                branchDroop: 1 + Math.random() * 3,
                branchSpacing: Math.random() * 0.5,
                trunkWidth: 2 + Math.random() * 3,
                branchVariation: 0.5 + Math.random() * 1.5
            });
        }
        
        // Create tree clusters (primary forest)
        const clusters = [];
        const clusterCount = 130; // More tree clusters
        
        // Outer ring of trees
        for (let i = 0; i < clusterCount; i++) {
            // Random angle with uneven spacing
            const angleVariation = Math.random() * 0.6 - 0.3;
            const angle = (i / clusterCount) * Math.PI * 2 + angleVariation;
            
            // Random distance from center
            const dist = radius + (Math.random() * 40 - 20);
            
            // Apply one of the tree archetypes with variations
            const archetype = treeArchetypes[Math.floor(Math.random() * treeArchetypes.length)];
            
            clusters.push({
                x: dist * Math.cos(angle),
                z: dist * Math.sin(angle),
                trunkHeight: 180 + Math.random() * 220,
                trunkWidth: archetype.trunkWidth * (0.8 + Math.random() * 0.4),
                branchCount: 30 + Math.floor(Math.random() * 40),
                branchDensity: archetype.branchDensity * (0.8 + Math.random() * 0.4),
                branchLengthFactor: archetype.branchLength * (0.7 + Math.random() * 0.6),
                branchDroopFactor: archetype.branchDroop * (0.7 + Math.random() * 0.6),
                branchSpacingFactor: archetype.branchSpacing * (0.7 + Math.random() * 0.6),
                branchVariation: archetype.branchVariation * (0.7 + Math.random() * 0.6),
                verticalSkew: Math.random() * 0.2 - 0.1,
                denseBottom: Math.random() > 0.7,
                sparseTop: Math.random() > 0.4,
                thinTrunk: Math.random() > 0.7
            });
        }
        
        // Inner clusters with more variation
        for (let i = 0; i < 70; i++) { // More inner trees
            const angle = Math.random() * Math.PI * 2;
            const dist = radius * (0.5 + Math.random() * 0.4) + (Math.random() * 40 - 20);
            
            // Apply one of the tree archetypes with more extreme variations
            const archetype = treeArchetypes[Math.floor(Math.random() * treeArchetypes.length)];
            
            clusters.push({
                x: dist * Math.cos(angle),
                z: dist * Math.sin(angle),
                trunkHeight: 160 + Math.random() * 240,
                trunkWidth: archetype.trunkWidth * (0.7 + Math.random() * 0.6),
                branchCount: 25 + Math.floor(Math.random() * 45),
                branchDensity: archetype.branchDensity * (0.6 + Math.random() * 0.8),
                branchLengthFactor: archetype.branchLength * (0.6 + Math.random() * 0.8),
                branchDroopFactor: archetype.branchDroop * (0.5 + Math.random() * 1),
                branchSpacingFactor: archetype.branchSpacing * (0.5 + Math.random() * 1),
                branchVariation: archetype.branchVariation * (0.5 + Math.random() * 1),
                verticalSkew: Math.random() * 0.3 - 0.15,
                denseBottom: Math.random() > 0.5,
                sparseTop: Math.random() > 0.3,
                thinTrunk: Math.random() > 0.6
            });
        }
        
        // DISTANT TREES - Create several layers of trees that fade into darkness
        const distantTreeLayers = 5;
        const treesPerLayer = 150;
        const maxDistantRadius = 450; // Much further back
        
        for (let layer = 0; layer < distantTreeLayers; layer++) {
            const layerDistance = radius + 50 + (layer * (maxDistantRadius - radius - 50) / distantTreeLayers);
            const brightnessFactor = 1 - (layer / distantTreeLayers) * 0.95; // Darken with distance
            
            for (let i = 0; i < treesPerLayer; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = layerDistance + (Math.random() * 40 - 20);
                
                // Simplified distant trees - less detail needed
                clusters.push({
                    x: dist * Math.cos(angle),
                    z: dist * Math.sin(angle),
                    trunkHeight: 180 + Math.random() * 220,
                    trunkWidth: 2 + Math.random() * 3,
                    branchCount: 20 + Math.floor(Math.random() * 30),
                    branchDensity: 0.6 + Math.random() * 0.4,
                    branchLengthFactor: 15 + Math.random() * 20,
                    branchDroopFactor: 1 + Math.random() * 2,
                    branchSpacingFactor: Math.random() * 0.5,
                    branchVariation: 0.7 + Math.random() * 1.2,
                    verticalSkew: Math.random() * 0.2 - 0.1,
                    denseBottom: Math.random() > 0.6,
                    sparseTop: Math.random() > 0.4,
                    thinTrunk: Math.random() > 0.6,
                    isDistant: true,
                    distanceDarkness: brightnessFactor // Apply progressive darkening
                });
            }
        }
        
        // TRUNK POINTS - 20% of total
        const trunkPoints = Math.floor(totalPoints * 0.2);
        
        for (let i = 0; i < trunkPoints; i++) {
            const cluster = clusters[Math.floor(Math.random() * clusters.length)];
            
            // Apply trunk skew
            const heightPercent = Math.random();
            const skewAmount = cluster.verticalSkew * heightPercent * 20;
            
            // Calculate trunk thickness - thinner at top
            const trunkThicknessFactor = cluster.thinTrunk ? 0.6 : 1.0;
            const trunkThickness = cluster.trunkWidth * trunkThicknessFactor * (1 - heightPercent * 0.6);
            
            // Random point within trunk cylinder with varied thickness
            const trunkR = trunkThickness * Math.pow(Math.random(), 0.7) * 0.5;
            const trunkTheta = Math.random() * Math.PI * 2;
            const trunkHeight = heightPercent * cluster.trunkHeight;
            
            // Apply skew to trunk
            const x = cluster.x + skewAmount + trunkR * Math.cos(trunkTheta);
            const y = trunkHeight;
            const z = cluster.z + trunkR * Math.sin(trunkTheta);
            
            // Distance-based shading
            const dist = Math.sqrt(x*x + z*z);
            const factor = Math.max(0.3, 1 - (dist / 250));
            
            // Apply distance darkness for far trees
            let distanceFactor = 1.0;
            if (cluster.isDistant) {
                distanceFactor = cluster.distanceDarkness;
            }
            
            // Vary trunk shades
            const baseTrunkShade = 0.08 + Math.random() * 0.07;
            const grayValue = baseTrunkShade * factor * distanceFactor;
            
            // Only add if visible
            if (grayValue > 0.01) {
                positions.push(x, y, z);
                colors.push(grayValue, grayValue, grayValue);
            }
        }
        
        // BRANCH POINTS - 70% of total, with higher density
        const branchPoints = Math.floor(totalPoints * 0.7);
        
        for (let i = 0; i < branchPoints; i++) {
            const cluster = clusters[Math.floor(Math.random() * clusters.length)];
            
            // Apply branch variations based on tree characteristics
            // Height distribution changes based on tree characteristics
            let heightRatio;
            if (cluster.denseBottom && Math.random() < 0.7) {
                heightRatio = Math.pow(Math.random(), 1.5) * 0.6;
            } else if (cluster.sparseTop && Math.random() < 0.7) {
                heightRatio = Math.random() * 0.8;
            } else {
                heightRatio = Math.pow(Math.random(), 0.7 + Math.random() * 0.6);
            }
            
            // Branch starting height with variation
            const branchStartHeight = heightRatio * cluster.trunkHeight * 0.95;
            
            // Unique branching pattern per tree - avoid regular angles
            // Instead of fixed intervals, use noise-like distribution
            const branchingNoise = Math.sin(heightRatio * 20) * Math.cos(heightRatio * 15) * 0.5 + 0.5;
            const branchAngle = (branchingNoise * Math.PI * 2) + Math.random() * cluster.branchVariation;
            
            // Branch length with height-dependent variation
            const lengthVariation = 0.5 + Math.random() * 1;
            const maxLength = cluster.branchLengthFactor * lengthVariation;
            const branchLength = maxLength * (1 - Math.pow(heightRatio, 0.4 + Math.random() * 0.8));
            
            // Branch vertical angle with high variation
            let branchVerticalAngle;
            
            if (heightRatio < 0.3) {
                branchVerticalAngle = -Math.PI/6 - Math.random() * Math.PI/4;
            } else if (heightRatio > 0.8) {
                branchVerticalAngle = -Math.PI/20 + Math.random() * Math.PI/4;
            } else {
                branchVerticalAngle = -Math.PI/6 + Math.random() * Math.PI/3;
            }
            
            // Vary the distribution of points along branch
            const branchT = Math.pow(Math.random(), 0.5 + Math.random() * 1.5);
            
            // Variable droop factor per branch
            const droopFactor = cluster.branchDroopFactor * (0.5 + Math.random() * 1);
            const droop = branchT * branchT * droopFactor * (0.5 + Math.random() * 1.5);
            
            // Apply skew to branch position
            const skewAmount = cluster.verticalSkew * heightRatio * 20;
            
            // Calculate branch point position
            const x = cluster.x + skewAmount + branchT * branchLength * Math.cos(branchAngle);
            const y = branchStartHeight + branchT * branchLength * Math.sin(branchVerticalAngle) - droop;
            const z = cluster.z + branchT * branchLength * Math.sin(branchAngle);
            
            // Add small variation - needles and twigs with high variation
            let finalX = x, finalY = y, finalZ = z;
            
            // Reduce detail for distant trees
            if (!cluster.isDistant && branchT > 0.3) {
                // Needle size varies by position and tree
                const needleSize = (0.3 + branchT * 2) * (0.5 + Math.random() * 1.5);
                
                // More chaotic needle distribution
                finalX += (Math.random() - 0.5) * needleSize * (1 + Math.random());
                finalY += (Math.random() - 0.5) * needleSize * (1 + Math.random() * 0.5);
                finalZ += (Math.random() - 0.5) * needleSize * (1 + Math.random());
            }
            
            // Distance-based shading
            const dist = Math.sqrt(finalX*finalX + finalZ*finalZ);
            const distanceFactor = Math.max(0.3, 1 - (dist / 250));
            
            // Height-based fade to black effect
            const heightFade = 1 - Math.pow(finalY / maxHeight, 1.5 + Math.random() * 0.5);
            
            // Apply distance darkness for far trees
            let distantDarkness = 1.0;
            if (cluster.isDistant) {
                distantDarkness = cluster.distanceDarkness;
            }
            
            // Variable brightness based on position and random factors
            let grayValue;
            
            if (branchT > 0.7) {
                // Branch tips and needles - varied brightness
                grayValue = (0.2 + Math.random() * 0.25) * distanceFactor * heightFade * distantDarkness;
            } else if (branchT > 0.3) {
                // Mid branch - medium brightness with variation
                grayValue = (0.15 + Math.random() * 0.2) * distanceFactor * heightFade * distantDarkness;
            } else {
                // Near trunk - darker with variation
                grayValue = (0.1 + Math.random() * 0.15) * distanceFactor * heightFade * distantDarkness;
            }
            
            // Random brightness variation
            grayValue *= 0.7 + Math.random() * 0.6;
            
            // Only add points that will be visible
            if (finalY >= 0 && grayValue > 0.01) {
                positions.push(finalX, finalY, finalZ);
                colors.push(grayValue, grayValue, grayValue);
            }
        }
        
        // GENERAL FILL - 10% of total
        const fillPoints = Math.floor(totalPoints * 0.1);
        
        for (let i = 0; i < fillPoints; i++) {
            // Random distribution with more variation
            const angle = Math.random() * Math.PI * 2;
            // Extend fill points to distant layers
            const r = radius + (Math.random() * maxDistantRadius * 0.6);
            
            const x = r * Math.cos(angle);
            const y = Math.random() * maxHeight;
            const z = r * Math.sin(angle);
            
            // Distance-based shading
            const dist = Math.sqrt(x*x + z*z);
            const factor = Math.max(0.3, 1 - (dist / 250));
            
            // Height-based fade with variation
            const heightFade = 1 - Math.pow(y / maxHeight, 1.2 + Math.random() * 1);
            
            // Darker for distant points
            const distanceDarkness = Math.max(0.05, 1 - (dist / maxDistantRadius));
            
            const grayValue = (0.08 + Math.random() * 0.12) * factor * heightFade * distanceDarkness;
            
            if (grayValue > 0.01) {
                positions.push(x, y, z);
                colors.push(grayValue, grayValue, grayValue);
            }
        }
        
        // Add forest floor details
        const floorPoints = 25000;
        
        for (let i = 0; i < floorPoints; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = 20 + Math.random() * (radius + thickness - 20);
            
            const x = r * Math.cos(angle);
            const y = Math.random() * 5 - 1;
            const z = r * Math.sin(angle);
            
            positions.push(x, y, z);
            
            // Distance-based shading
            const dist = Math.sqrt(x*x + z*z);
            const factor = Math.max(0.2, 1 - (dist / 250));
            
            // Random type of undergrowth
            const grayVal = (0.1 + Math.random() * 0.15) * factor;
            colors.push(grayVal, grayVal, grayVal);
        }
        
        forestGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        forestGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.35,
            vertexColors: true,
            transparent: true,
            opacity: 0.9
        });
        
        const forestPoints = new THREE.Points(forestGeometry, material);
        this.group.add(forestPoints);
    }
    
    createLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0xffffff, 0.12);
        this.group.add(ambient);
        
        // Main directional light
        const sun = new THREE.DirectionalLight(0xffffcc, 0.7);
        sun.position.set(0, 100, 0);
        sun.castShadow = true;
        this.group.add(sun);
        
        // Fill lights
        const blueLight = new THREE.DirectionalLight(0x8080ff, 0.1);
        blueLight.position.set(-20, 60, -10);
        this.group.add(blueLight);
        
        const warmLight = new THREE.DirectionalLight(0xff8030, 0.12);
        warmLight.position.set(30, 40, -20);
        this.group.add(warmLight);
    }
}
