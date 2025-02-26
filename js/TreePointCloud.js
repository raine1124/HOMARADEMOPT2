import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'; 

export class TreePointCloud {
    constructor(params = {}) {
        this.params = {
            height: params.height || 10,
            radiusBase: params.radiusBase || 1,
            branchLevels: params.branchLevels || 4,
            pointsPerLevel: params.pointsPerLevel || 1000,
            colorVariation: params.colorVariation || 0.2,
            baseColor: new THREE.Color(params.baseColor || 0x228B22),
            modelPath: params.modelPath || 'path/to/your/tree.obj',
            // Interactive points params
            pointSize: params.pointSize || 0.1,
            // Custom point positions
            customPointPositions: params.customPointPositions || [
                { x: 1.2, y: 3.5, z: 0.5 },    // Point 1
                { x: -1.5, y: 4.2, z: 1.1 },   // Point 2
                { x: 0.3, y: 5.0, z: -0.8 },   // Point 3
                { x: 2.0, y: 3.8, z: -1.2 },   // Point 4
                { x: -0.8, y: 4.5, z: -2.0 }   // Point 5
            ]
        };

        this.points = new THREE.Group();
        
        // Create raycaster for interactions
        this.raycaster = new THREE.Raycaster();
        this.raycaster.params.Points.threshold = 0.2; // Larger threshold for easier selection
        this.mouse = new THREE.Vector2();
        
        // Track current hovered point
        this.hoveredPoint = null;
        
        // Create array to store the 5 interactive points
        this.interactivePoints = [];
        
        // Create hover frame
        this.hoverFrame = null;
        this.createHoverFrame();
        
        this.loadTreeModel();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        window.addEventListener('mousemove', (event) => {
            // Update mouse position for raycasting
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });
        
        window.addEventListener('click', (event) => {
            if (this.hoveredPoint) {
                const index = this.hoveredPoint.userData.index;
                console.log(`Clicked on point ${index}`);
                
                // Open the corresponding HTML page
                window.open(`point${index + 1}.html`, '_blank');
            }
        });
    }

    loadTreeModel() {
        console.log("Loading tree model from:", this.params.modelPath);
        
        const loader = new OBJLoader();
        loader.load(
            this.params.modelPath,
            (object) => {
                console.log("Model loaded successfully");
                
                if (object.children && object.children.length > 0) {
                    // Process the geometry and create colored points
                    this.createColoredPointCloud(object);
                } else {
                    console.error("Loaded object has no children. Using fallback geometry.");
                    this.createFallbackTree();
                }
                
                // Add the interactive points after creating the tree
                this.createInteractivePoints();
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.error('Error loading model:', error);
                this.createFallbackTree();
                this.createInteractivePoints();
            }
        );
    }
    
    createColoredPointCloud(object) {
        // Extract positions from the loaded model
        const modelGeometry = object.children[0].geometry;
        const positions = modelGeometry.attributes.position;
        
        // Create a new buffer geometry for our colored point cloud
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const colors = [];
        
        // Define colors for trunk/branches and leaves
        const trunkColor = new THREE.Color(0x8B4513); // Brown
        const leafColor = new THREE.Color(0x228B22);  // Green
        
        // Height threshold - points below this are considered trunk/branches
        // Adjust this based on your model's dimensions
        const heightThreshold = 15;
        const maxHeight = 40; // Approximate max height of the tree
        
        // Calculate the bounding box of the original model
        const bbox = new THREE.Box3();
        const tempGeometry = new THREE.BufferGeometry();
        const tempPositions = [];
        
        for (let i = 0; i < positions.count; i++) {
            tempPositions.push(new THREE.Vector3(
                positions.getX(i), 
                positions.getY(i), 
                positions.getZ(i)
            ));
        }
        
        tempGeometry.setFromPoints(tempPositions);
        bbox.setFromBufferAttribute(tempGeometry.getAttribute('position'));
        
        // Process all vertices from the original model
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            
            vertices.push(x, y, z);
            
            // Determine if this point is part of the trunk/branches or leaves
            // Based on height and distance from central axis
            const distanceFromCenter = Math.sqrt(x*x + z*z);
            const normalizedHeight = y / maxHeight;
            
            // Color variation factors
            const colorVariation = this.params.colorVariation;
            let r, g, b;
            
            if (y < heightThreshold || (distanceFromCenter < 2 && y < maxHeight * 0.7)) {
                // Trunk or branches - various shades of brown
                const brownVariation = 0.7 + Math.random() * 0.3;
                // Create variety in the browns
                if (Math.random() > 0.6) {
                    // Darker brown
                    r = trunkColor.r * brownVariation * 0.8;
                    g = trunkColor.g * brownVariation * 0.7;
                    b = trunkColor.b * brownVariation * 0.5;
                } else {
                    // Regular brown
                    r = trunkColor.r * brownVariation;
                    g = trunkColor.g * brownVariation;
                    b = trunkColor.b * brownVariation;
                }
            } else {
                // Leaves - various shades of green
                const greenVariation = 0.8 + Math.random() * 0.4;
                
                // Create more variety in the greens
                if (Math.random() > 0.7) {
                    // Lighter green (toward the outside or top)
                    r = leafColor.r * greenVariation * 1.2;
                    g = leafColor.g * greenVariation * 1.1;
                    b = leafColor.b * greenVariation * 0.8;
                } else {
                    // Regular green
                    r = leafColor.r * greenVariation;
                    g = leafColor.g * greenVariation;
                    b = leafColor.b * greenVariation;
                }
            }
            
            colors.push(r, g, b);
        }
        
        // Add more points to fill in the shape, but strictly follow the original model
        this.addDensityPoints(vertices, colors, maxHeight, bbox);
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.08,
            vertexColors: true
        });
        
        const pointCloud = new THREE.Points(geometry, material);
        pointCloud.name = "treePoints";
        this.points.add(pointCloud);
    }
    
    addDensityPoints(vertices, colors, maxHeight, bbox) {
        // Add additional points to fill in the tree shape
        const extraPoints = 15000; // Number of extra points to add
        const trunkColor = new THREE.Color(0x8B4513); // Brown
        const leafColor = new THREE.Color(0x228B22);  // Green
        
        // Height threshold - points below this are considered trunk/branches
        const heightThreshold = 15;
        
        // Create an OctTree or similar structure to check proximity to existing points
        // For simplicity, we'll store existing points in an array and check distances
        const existingPoints = [];
        for (let i = 0; i < vertices.length; i += 3) {
            existingPoints.push(new THREE.Vector3(vertices[i], vertices[i+1], vertices[i+2]));
        }
        
        // Helper function to check if a point is close to any existing points
        const isCloseToExistingPoint = (point, threshold = 0.5) => {
            for (let i = 0; i < existingPoints.length; i++) {
                if (point.distanceTo(existingPoints[i]) < threshold) {
                    return true;
                }
            }
            return false;
        };
        
        // Calculate model dimensions for constraining points
        const modelWidth = bbox.max.x - bbox.min.x;
        const modelDepth = bbox.max.z - bbox.min.z;
        const modelCenter = new THREE.Vector3();
        bbox.getCenter(modelCenter);
        
        // Calculate trunk radius at different heights
        const getTrunkRadiusAtHeight = (height) => {
            // Base of tree has wider radius that narrows toward top
            if (height < 5) {
                return 1.0; // Base trunk radius
            } else if (height < 15) {
                return 0.8; // Middle trunk radius
            } else {
                // Radius increases again for leaf area, but follows model shape
                return Math.max(0.5, 3.0 * (1 - height / maxHeight));
            }
        };
        
        // Add points constrained to actual model shape
        const pointsAdded = new Set(); // Track added points to avoid duplicates
        let attempts = 0;
        const maxAttempts = extraPoints * 3; // Allow for some failed attempts
        let addedCount = 0;
        
        while (addedCount < extraPoints && attempts < maxAttempts) {
            attempts++;
            
            // Select a random existing point to generate a new one nearby
            const basePointIndex = Math.floor(Math.random() * existingPoints.length);
            const basePoint = existingPoints[basePointIndex];
            
            // Generate a point nearby with some jitter
            const jitterAmount = 0.3;
            const newPoint = new THREE.Vector3(
                basePoint.x + (Math.random() - 0.5) * jitterAmount,
                basePoint.y + (Math.random() - 0.5) * jitterAmount,
                basePoint.z + (Math.random() - 0.5) * jitterAmount
            );
            
            // Calculate distance from central axis
            const distanceFromCenter = Math.sqrt(newPoint.x * newPoint.x + newPoint.z * newPoint.z);
            
            // Determine if this point is valid based on model shape and height
            const heightRatio = newPoint.y / maxHeight;
            let isValid = false;
            
            if (newPoint.y < heightThreshold) {
                // Bottom trunk area - keep points very close to center
                isValid = distanceFromCenter < getTrunkRadiusAtHeight(newPoint.y);
            } else if (newPoint.y > maxHeight * 0.85) {
                // Top of tree - cone shape that gets narrower
                const topRadius = modelWidth * 0.2 * (1 - (newPoint.y - maxHeight * 0.85) / (maxHeight * 0.15));
                isValid = distanceFromCenter < topRadius;
            } else {
                // Middle of tree - follow the model shape more closely
                // Calculate a radius that follows the model shape at this height
                // This constrains new points to be near existing ones
                const nearbyPoints = existingPoints.filter(p => 
                    Math.abs(p.y - newPoint.y) < 2.0
                );
                
                if (nearbyPoints.length > 0) {
                    // Find average distance from center for points at this height
                    let avgDistFromCenter = 0;
                    nearbyPoints.forEach(p => {
                        avgDistFromCenter += Math.sqrt(p.x * p.x + p.z * p.z);
                    });
                    avgDistFromCenter /= nearbyPoints.length;
                    
                    // Allow points to be within a certain range of this average
                    isValid = distanceFromCenter < avgDistFromCenter * 1.2;
                } else {
                    // If no nearby points at this height, use default formula
                    isValid = distanceFromCenter < modelWidth * 0.25 * (1 - Math.abs(heightRatio - 0.6));
                }
            }
            
            // Skip if not valid or too close to existing points
            if (!isValid || isCloseToExistingPoint(newPoint, 0.2)) {
                continue;
            }
            
            // Point passes all checks, add it
            const pointKey = `${Math.round(newPoint.x*10)},${Math.round(newPoint.y*10)},${Math.round(newPoint.z*10)}`;
            if (pointsAdded.has(pointKey)) {
                continue; // Skip duplicates
            }
            
            pointsAdded.add(pointKey);
            vertices.push(newPoint.x, newPoint.y, newPoint.z);
            existingPoints.push(newPoint);
            addedCount++;
            
            // Determine color based on height and distance from central axis
            let r, g, b;
            
            if (newPoint.y < heightThreshold || (distanceFromCenter < 1.0 && newPoint.y < maxHeight * 0.7)) {
                // Trunk or branches - various shades of brown
                const brownVariation = 0.7 + Math.random() * 0.3;
                if (Math.random() > 0.6) {
                    // Darker brown
                    r = trunkColor.r * brownVariation * 0.8;
                    g = trunkColor.g * brownVariation * 0.7;
                    b = trunkColor.b * brownVariation * 0.5;
                } else {
                    // Regular brown
                    r = trunkColor.r * brownVariation;
                    g = trunkColor.g * brownVariation;
                    b = trunkColor.b * brownVariation;
                }
            } else {
                // Leaves - various shades of green
                const greenVariation = 0.8 + Math.random() * 0.4;
                if (Math.random() > 0.7) {
                    // Lighter green
                    r = leafColor.r * greenVariation * 1.2;
                    g = leafColor.g * greenVariation * 1.1;
                    b = leafColor.b * greenVariation * 0.8;
                } else {
                    // Regular green
                    r = leafColor.r * greenVariation;
                    g = leafColor.g * greenVariation;
                    b = leafColor.b * greenVariation;
                }
            }
            
            colors.push(r, g, b);
        }
        
        console.log(`Added ${addedCount} density points after ${attempts} attempts`);
    }
    
    createFallbackTree() {
        const height = this.params.height;
        const radiusBottom = this.params.radiusBase;
        
        // Create tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(radiusBottom/3, radiusBottom/2, height/3, 8);
        const trunkMaterial = new THREE.MeshBasicMaterial({color: 0x8B4513});
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = height/6;
        
        // Create foliage (cone)
        const foliageGeometry = new THREE.ConeGeometry(radiusBottom*2, height*2/3, 8);
        const foliageMaterial = new THREE.MeshBasicMaterial({color: this.params.baseColor});
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = height/2 + height/6;
        
        // Convert to points with proper colors
        const trunkPoints = this.meshToPoints(trunk, 0x8B4513);
        const foliagePoints = this.meshToPoints(foliage, this.params.baseColor);
        
        this.points.add(trunkPoints);
        this.points.add(foliagePoints);
        
        console.log("Fallback tree created");
    }
    
    meshToPoints(mesh, color) {
        const geometry = mesh.geometry;
        const positions = geometry.attributes.position;
        
        const pointsGeometry = new THREE.BufferGeometry();
        const vertices = [];
        const colors = [];
        const baseColor = new THREE.Color(color);
        
        for (let i = 0; i < positions.count; i++) {
            vertices.push(
                positions.getX(i) + mesh.position.x,
                positions.getY(i) + mesh.position.y,
                positions.getZ(i) + mesh.position.z
            );
            
            const colorVariation = this.params.colorVariation;
            colors.push(
                baseColor.r * (1 - colorVariation/2 + Math.random() * colorVariation),
                baseColor.g * (1 - colorVariation/2 + Math.random() * colorVariation),
                baseColor.b * (1 - colorVariation/2 + Math.random() * colorVariation)
            );
        }
        
        // Add more random points inside the mesh for density
        const bbox = new THREE.Box3().setFromObject(mesh);
        for (let i = 0; i < 1000; i++) {
            const x = bbox.min.x + Math.random() * (bbox.max.x - bbox.min.x);
            const y = bbox.min.y + Math.random() * (bbox.max.y - bbox.min.y);
            const z = bbox.min.z + Math.random() * (bbox.max.z - bbox.min.z);
            
            vertices.push(x, y, z);
            colors.push(
                baseColor.r * (1 - colorVariation/2 + Math.random() * colorVariation),
                baseColor.g * (1 - colorVariation/2 + Math.random() * colorVariation),
                baseColor.b * (1 - colorVariation/2 + Math.random() * colorVariation)
            );
        }
        
        pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        pointsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const pointsMaterial = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true
        });
        
        return new THREE.Points(pointsGeometry, pointsMaterial);
    }

    // Rest of the code remains the same...
    
    createPointCloud(geometry) {
        const material = new THREE.PointsMaterial({
            size: 0.03,
            vertexColors: true
        });

        const pointCloud = new THREE.Points(geometry, material);
        this.points.add(pointCloud); 
    }
    
    createHoverFrame() {
        // Create a frame that will be displayed when hovering over a point
        const geometry = new THREE.PlaneGeometry(0.6, 0.4);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        
        this.hoverFrame = new THREE.Mesh(geometry, material);
        this.hoverFrame.visible = false;
        
        // Create a canvas texture for the frame
        this.updateFrameTexture("Point Content");
        
        // Add to scene
        this.points.add(this.hoverFrame);
    }
    
    updateFrameTexture(content) {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400;
        const context = canvas.getContext('2d');
        
        // Background
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Border
        context.strokeStyle = '#000000';
        context.lineWidth = 10;
        context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
        
        // Header
        context.fillStyle = '#ff0000';
        context.fillRect(5, 5, canvas.width - 10, 60);
        
        // Title
        context.font = 'bold 36px Arial';
        context.fillStyle = '#ffffff';
        context.textAlign = 'center';
        context.fillText(`Point Preview`, canvas.width/2, 45);
        
        // Content
        context.fillStyle = '#000000';
        context.font = '28px Arial';
        context.fillText(content, canvas.width/2, canvas.height/2);
        context.font = '20px Arial';
        context.fillText('Click to view full content', canvas.width/2, canvas.height - 40);
        
        // Create texture
        if (this.hoverFrame.material.map) {
            this.hoverFrame.material.map.dispose();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        this.hoverFrame.material.map = texture;
        this.hoverFrame.material.needsUpdate = true;
    }
    
    createInteractivePoints() {
        // Create points at custom positions defined in params
        
        // Create a geometry for the interactive points
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const colors = [];
        
        // Add the points at custom positions
        for (let i = 0; i < this.params.customPointPositions.length; i++) {
            const point = this.params.customPointPositions[i];
            
            vertices.push(
                point.x,
                point.y,
                point.z
            );
            
            // Red color for interactive points
            colors.push(1.0, 0.0, 0.0);
            
            // Store point data for later use
            this.interactivePoints.push({
                position: new THREE.Vector3(point.x, point.y, point.z),
                index: i
            });
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        // Create larger points for better visibility and interaction
        const material = new THREE.PointsMaterial({
            size: this.params.pointSize,
            vertexColors: true
        });
        
        const interactivePointsObject = new THREE.Points(geometry, material);
        interactivePointsObject.name = "interactivePoints";
        
        // Add user data to the points object for raycasting
        interactivePointsObject.userData.isInteractive = true;
        
        // Add the interactive points to the scene
        this.points.add(interactivePointsObject);
        
        console.log(`Added ${this.interactivePoints.length} interactive points at custom positions`);
    }
    
    checkHover(camera) {
        // Update the picking ray
        this.raycaster.setFromCamera(this.mouse, camera);
        
        // Get all points objects in our group
        const pointsObjects = [];
        this.points.traverse(child => {
            if (child instanceof THREE.Points && child.name === "interactivePoints") {
                pointsObjects.push(child);
            }
        });
        
        if (pointsObjects.length === 0) {
            return; // No points to interact with yet
        }
        
        // Check for intersections
        const intersects = this.raycaster.intersectObjects(pointsObjects);
        
        // Hide hover frame if no longer hovering
        if (this.hoveredPoint && intersects.length === 0) {
            // Reset the material of previously hovered point
            const points = pointsObjects[0];
            const colors = points.geometry.attributes.color;
            
            // Reset to red
            colors.setXYZ(this.hoveredPoint.index, 1.0, 0.0, 0.0);
            colors.needsUpdate = true;
            
            // Hide frame
            this.hoverFrame.visible = false;
            
            // Remove tooltip if it exists
            const existingTooltip = document.getElementById('point-tooltip');
            if (existingTooltip) {
                existingTooltip.style.display = 'none';
            }
            
            this.hoveredPoint = null;
        }
        
        // Handle new hover
        if (intersects.length > 0) {
            const intersection = intersects[0];
            const index = intersection.index;
            
            // If hovering over a different point than before
            if (!this.hoveredPoint || this.hoveredPoint.index !== index) {
                // Reset previous point if exists
                if (this.hoveredPoint) {
                    const points = pointsObjects[0];
                    const colors = points.geometry.attributes.color;
                    colors.setXYZ(this.hoveredPoint.index, 1.0, 0.0, 0.0);
                }
                
                // Set hovered point
                this.hoveredPoint = {
                    object: intersection.object,
                    index: index,
                    position: new THREE.Vector3().fromBufferAttribute(
                        intersection.object.geometry.attributes.position, index
                    ),
                    userData: { index: index }
                };
                
                // Change color to bright yellow for hover state
                const points = pointsObjects[0];
                const colors = points.geometry.attributes.color;
                colors.setXYZ(index, 1.0, 1.0, 0.0);
                colors.needsUpdate = true;
                
                // Update and show hover frame
                this.updateFrameTexture(`Point ${index + 1} Content`);
                
                // Position the frame above the point
                const pointPosition = new THREE.Vector3().fromBufferAttribute(
                    intersection.object.geometry.attributes.position, index
                );
                
                this.hoverFrame.position.copy(pointPosition);
                this.hoverFrame.position.y += 0.4; // Position above the point
                this.hoverFrame.lookAt(camera.position); // Face the camera
                this.hoverFrame.visible = true;
                
                // Show tooltip with point info
                let tooltip = document.getElementById('point-tooltip');
                if (!tooltip) {
                    tooltip = document.createElement('div');
                    tooltip.id = 'point-tooltip';
                    tooltip.style.position = 'fixed';
                    tooltip.style.backgroundColor = 'rgba(0,0,0,0.8)';
                    tooltip.style.color = 'white';
                    tooltip.style.padding = '8px 12px';
                    tooltip.style.borderRadius = '4px';
                    tooltip.style.zIndex = '1000';
                    tooltip.style.pointerEvents = 'none';
                    document.body.appendChild(tooltip);
                }
                
                // Set tooltip content and position
                tooltip.textContent = `Point ${index + 1} - Click to open`;
                tooltip.style.display = 'block';
                
                // Position near mouse
                const x = (this.mouse.x + 1) / 2 * window.innerWidth;
                const y = (-this.mouse.y + 1) / 2 * window.innerHeight;
                tooltip.style.left = `${x + 15}px`;
                tooltip.style.top = `${y - 15}px`;
            }
        }
    }

    // Call this in the animation loop to handle hovering
    update(camera) {
        this.checkHover(camera);
        this.animate();
    }

    animate() {
        // Only animate the interactive points - no tree sway animation
        
        // Pulse animation for interactive points
        this.points.traverse(child => {
            if (child instanceof THREE.Points && child.name === "interactivePoints") {
                // Pulse size animation
                const pulseFactor = 1.0 + 0.3 * Math.sin(Date.now() * 0.002);
                child.material.size = this.params.pointSize * pulseFactor;
                child.material.needsUpdate = true;
            }
        });
        
        // Rotate hover frame slightly if visible
        if (this.hoverFrame && this.hoverFrame.visible) {
            this.hoverFrame.rotation.z += 0.005;
        }
    }
}