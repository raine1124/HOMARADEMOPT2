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
            modelPath: params.modelPath || 'path/to/your/tree.obj', // Path to your .obj file
            potentialPointsCount: params.potentialPointsCount || 150, // Number of potential interactive points
            activatedPointsCount: params.activatedPointsCount || 5, // Number of currently activated points
            activatedPointColor: new THREE.Color(params.activatedPointColor || 0xFF0000), // Red color for activated points
            potentialPointColor: new THREE.Color(params.potentialPointColor || 0x00FF00), // Green color for potential points
            normalPointSize: params.normalPointSize || 0.03,
            interactivePointSize: params.interactivePointSize || 0.08,
            hoverPointSize: params.hoverPointSize || 0.12
        };

        this.points = new THREE.Group();
        this.interactivePoints = new THREE.Group(); // Group specifically for interactive points
        this.points.add(this.interactivePoints);
        
        this.raycaster = new THREE.Raycaster();
        this.raycaster.params.Points.threshold = 0.1; // Adjust based on your needs
        
        this.mouse = new THREE.Vector2(1, 1); // Initialize off-screen
        this.hoveredPoint = null;
        this.hoverFrame = null;
        
        // URLs and usernames for activated points
        this.activatedPointData = [
            { url: 'page1.html', username: 'User1', frameContent: 'Whiteboard 1' },
            { url: 'page2.html', username: 'User2', frameContent: 'Whiteboard 2' },
            { url: 'page3.html', username: 'User3', frameContent: 'Whiteboard 3' },
            { url: 'page4.html', username: 'User4', frameContent: 'Whiteboard 4' },
            { url: 'page5.html', username: 'User5', frameContent: 'Whiteboard 5' }
        ];
        
        // Store information about interactive points
        this.potentialPoints = [];
        this.activatedPoints = [];
        
        this.loadTreeModel();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add mousemove listener to track mouse position for hover effects
        window.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });
        
        // Add click listener for point interaction
        window.addEventListener('click', (event) => {
            // Check if we're hovering over a point
            if (this.hoveredPoint) {
                const pointData = this.hoveredPoint.userData;
                
                if (pointData.isActivated) {
                    // Navigate to the linked page
                    window.open(pointData.url, '_blank');
                }
                // You could add code here to activate a potential point if needed
            }
        });
    }

    loadTreeModel() {
        console.log("Loading tree model from:", this.params.modelPath);
        
        const loader = new OBJLoader();
        loader.load(
            this.params.modelPath,
            (object) => {
                console.log("Model loaded successfully:", object);
                
                // Check if the object has children
                if (object.children && object.children.length > 0) {
                    // Assuming the main tree model is the first child
                    const geometry = object.children[0].geometry;
                    this.createPointCloud(geometry);
                } else {
                    console.error("Loaded object has no children. Using fallback geometry.");
                    this.createFallbackTree();
                }
                
                // After creating the regular tree points, create interactive points
                this.createInteractivePoints();
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.error('Error loading model:', error);
                console.log("Using fallback tree visualization");
                this.createFallbackTree();
                
                // Create interactive points even with fallback tree
                this.createInteractivePoints();
            }
        );
    }
    
    createFallbackTree() {
        // Create a simple cone as a fallback tree
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
        
        // Convert to points
        const trunkPoints = this.meshToPoints(trunk, 0x8B4513);
        const foliagePoints = this.meshToPoints(foliage, this.params.baseColor);
        
        this.points.add(trunkPoints);
        this.points.add(foliagePoints);
        
        console.log("Fallback tree created");
    }
    
    meshToPoints(mesh, color) {
        // Convert a mesh to points
        const geometry = mesh.geometry;
        const positions = geometry.attributes.position;
        
        // Create a geometry for the points
        const pointsGeometry = new THREE.BufferGeometry();
        const vertices = [];
        const colors = [];
        const baseColor = new THREE.Color(color);
        
        // Sample points from the mesh vertices
        for (let i = 0; i < positions.count; i++) {
            vertices.push(
                positions.getX(i) + mesh.position.x,
                positions.getY(i) + mesh.position.y,
                positions.getZ(i) + mesh.position.z
            );
            
            // Add some color variation
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
            size: this.params.normalPointSize,
            vertexColors: true
        });
        
        return new THREE.Points(pointsGeometry, pointsMaterial);
    }

    createPointCloud(geometry) {
        const material = new THREE.PointsMaterial({
            size: this.params.normalPointSize,
            vertexColors: true // Use vertex colors if available in the model
        });

        const pointCloud = new THREE.Points(geometry, material);
        this.points.add(pointCloud); 
    }

    createInteractivePoints() {
        // Get the bounding box of the tree to place points within its volume
        const bbox = new THREE.Box3().setFromObject(this.points);
        
        // Create potential interactive points geometry
        const potentialGeometry = new THREE.BufferGeometry();
        const potentialVertices = [];
        const potentialColors = [];
        
        // Create activated points geometry
        const activatedGeometry = new THREE.BufferGeometry();
        const activatedVertices = [];
        const activatedColors = [];
        
        // Create potential points randomly within the tree volume
        for (let i = 0; i < this.params.potentialPointsCount; i++) {
            // Generate random position within the bounding box
            // Weight it more toward the foliage area
            const x = bbox.min.x + Math.random() * (bbox.max.x - bbox.min.x);
            // For y, weight toward upper half of tree
            const yWeight = 0.3 + Math.random() * 0.7; // 0.3-1.0 range to stay in upper portion
            const y = bbox.min.y + yWeight * (bbox.max.y - bbox.min.y);
            const z = bbox.min.z + Math.random() * (bbox.max.z - bbox.min.z);
            
            const position = new THREE.Vector3(x, y, z);
            
            // Store position for potential point
            potentialVertices.push(x, y, z);
            
            // Color (yellow for potential points)
            potentialColors.push(
                this.params.potentialPointColor.r,
                this.params.potentialPointColor.g,
                this.params.potentialPointColor.b
            );
            
            // Store point data for interaction
            this.potentialPoints.push({
                id: i,
                position: position,
                isActivated: false
            });
        }
        
        // Select a subset of potential points to be activated
        const activatedIndices = [];
        while (activatedIndices.length < this.params.activatedPointsCount) {
            const randomIndex = Math.floor(Math.random() * this.params.potentialPointsCount);
            if (!activatedIndices.includes(randomIndex)) {
                activatedIndices.push(randomIndex);
            }
        }
        
                        // Create activated points
        activatedIndices.forEach((index, i) => {
            const point = this.potentialPoints[index];
            point.isActivated = true;
            const dataIndex = i % this.activatedPointData.length;
            point.url = this.activatedPointData[dataIndex].url;
            point.username = this.activatedPointData[dataIndex].username;
            point.frameContent = this.activatedPointData[dataIndex].frameContent;
            point.dataIndex = dataIndex;
            
            activatedVertices.push(
                point.position.x,
                point.position.y,
                point.position.z
            );
            
            activatedColors.push(
                this.params.activatedPointColor.r,
                this.params.activatedPointColor.g,
                this.params.activatedPointColor.b
            );
            
            this.activatedPoints.push(point);
        });
        
        // Set attributes for potential points
        potentialGeometry.setAttribute('position', new THREE.Float32BufferAttribute(potentialVertices, 3));
        potentialGeometry.setAttribute('color', new THREE.Float32BufferAttribute(potentialColors, 3));
        
        // Set attributes for activated points
        activatedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(activatedVertices, 3));
        activatedGeometry.setAttribute('color', new THREE.Float32BufferAttribute(activatedColors, 3));
        
        // Create materials
        const potentialMaterial = new THREE.PointsMaterial({
            size: this.params.interactivePointSize,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        const activatedMaterial = new THREE.PointsMaterial({
            size: this.params.interactivePointSize,
            vertexColors: true,
            transparent: true,
            opacity: 1
        });
        
        // Create point clouds
        const potentialPointCloud = new THREE.Points(potentialGeometry, potentialMaterial);
        potentialPointCloud.userData.isInteractive = true;
        potentialPointCloud.userData.isPotential = true;
        
        const activatedPointCloud = new THREE.Points(activatedGeometry, activatedMaterial);
        activatedPointCloud.userData.isInteractive = true;
        activatedPointCloud.userData.isActivated = true;
        
        // Add user data to individual points
        for (let i = 0; i < potentialPointCloud.geometry.attributes.position.count; i++) {
            // Store index to reference back to our potentialPoints array
            potentialPointCloud.userData[`point_${i}`] = {
                index: i,
                isActivated: false
            };
        }
        
        for (let i = 0; i < activatedPointCloud.geometry.attributes.position.count; i++) {
            // Store activated point data
            const pointData = this.activatedPoints[i];
            activatedPointCloud.userData[`point_${i}`] = {
                index: pointData.id,
                isActivated: true,
                url: pointData.url,
                username: pointData.username,
                frameContent: pointData.frameContent,
                dataIndex: pointData.dataIndex
            };
        }
        
        // Add points to the interactive group
        this.interactivePoints.add(potentialPointCloud);
        this.interactivePoints.add(activatedPointCloud);
        
        // Create hover frame (initially invisible)
        this.createHoverFrame();
        
        console.log(`Created ${this.params.potentialPointsCount} potential points and ${this.params.activatedPointsCount} activated points`);
    }
    
    createHoverFrame() {
        // Create a frame that will appear when hovering over interactive points
        const frameGeometry = new THREE.PlaneGeometry(0.8, 0.6);
        const frameMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        
        this.hoverFrame = new THREE.Mesh(frameGeometry, frameMaterial);
        this.hoverFrame.visible = false;
        
        // Create default frame appearance
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 384;
        const context = canvas.getContext('2d');
        
        // Draw white background with border
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = '#000000';
        context.lineWidth = 8;
        context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
        
        // Add default text
        context.font = 'Bold 36px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = '#000000';
        context.fillText('Whiteboard Preview', canvas.width/2, canvas.height/2);
        
        const texture = new THREE.CanvasTexture(canvas);
        this.hoverFrame.material.map = texture;
        this.hoverFrame.material.needsUpdate = true;
        
        // Add the frame to the scene
        this.points.add(this.hoverFrame);
    }

    checkPointIntersection(camera) {
        // Update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, camera);
        
        // Calculate objects intersecting the picking ray
        const intersects = this.raycaster.intersectObjects(this.interactivePoints.children);
        
        // Reset hover state without affecting other points
        if (this.hoveredPoint) {
            // Only reset the size of the previously hovered point
            const pointCloud = this.hoveredPoint.object;
            const index = this.hoveredPoint.index;
            
            // Get the position of this specific point
            const position = new THREE.Vector3();
            position.fromBufferAttribute(pointCloud.geometry.attributes.position, index);
            
            // Only reset the specific point's appearance
            if (pointCloud.userData.isActivated) {
                // Just hide the frame
                this.hoverFrame.visible = false;
                
                // Update tooltip
                const tooltip = document.getElementById('point-tooltip');
                tooltip.style.display = 'none';
            }
            
            this.hoveredPoint = null;
        }
        
        // Check for new intersections
        if (intersects.length > 0) {
            const intersection = intersects[0];
            const pointCloud = intersection.object;
            const index = intersection.index;
            
            // Get point data
            const pointKey = `point_${index}`;
            const pointData = pointCloud.userData[pointKey] || { isActivated: false };
            
            // Update hover state
            this.hoveredPoint = {
                object: pointCloud,
                index: index,
                userData: pointData
            };
            
            // If it's an activated point, show the hover frame and username
            if (pointData.isActivated) {
                // Find the original data for this point
                const activatedPointInfo = this.activatedPoints.find(p => p.id === pointData.index);
                const pointInfo = this.activatedPointData[pointData.dataIndex];
                
                if (pointInfo) {
                    // Update frame content to show the whiteboard preview
                    this.updateHoverFrame(pointInfo.username, pointInfo.frameContent);
                    
                    // Update frame position
                    const position = new THREE.Vector3();
                    position.fromBufferAttribute(pointCloud.geometry.attributes.position, index);
                    
                    // Convert position from local to world space
                    pointCloud.localToWorld(position);
                    
                    // Position the frame slightly in front of the point
                    this.hoverFrame.position.copy(position);
                    this.hoverFrame.position.y += 0.3; // Position slightly above the point
                    
                    // Make the frame always face the camera
                    this.hoverFrame.lookAt(camera.position);
                    
                    // Scale the frame based on distance from camera
                    const distance = camera.position.distanceTo(position);
                    const scale = Math.max(0.5, Math.min(1.5, distance * 0.1));
                    this.hoverFrame.scale.set(scale, scale, scale);
                    
                    // Make frame visible
                    this.hoverFrame.visible = true;
                    
                    // Update tooltip with username
                    const tooltip = document.getElementById('point-tooltip');
                    tooltip.textContent = pointInfo.username;
                    tooltip.style.display = 'block';
                    
                    // Position tooltip near mouse
                    const x = (this.mouse.x + 1) / 2 * window.innerWidth;
                    const y = (-this.mouse.y + 1) / 2 * window.innerHeight;
                    tooltip.style.left = `${x + 15}px`;
                    tooltip.style.top = `${y - 15}px`;
                }
            }
        } else {
            // Hide tooltip when not hovering over any point
            const tooltip = document.getElementById('point-tooltip');
            tooltip.style.display = 'none';
        }
    }
    
    updateHoverFrame(username, frameContent) {
        // Update the hover frame to show username and whiteboard preview
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        
        // Draw frame background
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw border
        context.strokeStyle = '#000000';
        context.lineWidth = 4;
        context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
        
        // Draw username header
        context.fillStyle = '#2C3E50';
        context.fillRect(4, 4, canvas.width - 8, 40);
        
        // Add username text
        context.font = 'Bold 20px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = '#FFFFFF';
        context.fillText(username, canvas.width/2, 24);
        
        // Draw whiteboard preview content
        context.fillStyle = '#000000';
        context.font = '16px Arial';
        context.fillText(frameContent, canvas.width/2, canvas.height/2);
        context.fillText('Click to view whiteboard', canvas.width/2, canvas.height - 30);
        
        // Update texture
        if (this.hoverFrame.material.map) {
            this.hoverFrame.material.map.dispose();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        this.hoverFrame.material.map = texture;
        this.hoverFrame.material.needsUpdate = true;
    }

    animate() {
        // Animate regular tree points
        this.points.children.forEach((points, i) => {
            // Skip the interactive points group and hover frame
            if (points === this.interactivePoints || points === this.hoverFrame) return;
            
            if (points.geometry && points.geometry.attributes && points.geometry.attributes.position) {
                const positions = points.geometry.attributes.position.array;
                for (let j = 0; j < positions.length; j += 3) {
                    positions[j] += Math.sin(Date.now() * 0.001 + i) * 0.001;
                    positions[j + 2] += Math.cos(Date.now() * 0.001 + i) * 0.001;
                }
                points.geometry.attributes.position.needsUpdate = true;
            }
        });
        
        // Animate interactive points - make them pulse slightly
        this.interactivePoints.children.forEach((points) => {
            if (points !== this.hoveredPoint?.object) {
                const pulseFactor = 1 + 0.2 * Math.sin(Date.now() * 0.002);
                const baseSize = points.userData.isActivated ? 
                    this.params.interactivePointSize * 1.2 : // Activated points are slightly larger
                    this.params.interactivePointSize;
                    
                points.material.size = baseSize * pulseFactor;
                points.material.needsUpdate = true;
            }
        });
        
        // Animate hover frame - rotate slightly
        if (this.hoverFrame && this.hoverFrame.visible) {
            this.hoverFrame.rotation.z += 0.01;
        }
    }
    
    update(camera) {
        // This method should be called in your main animation loop
        this.checkPointIntersection(camera);
        this.animate();
    }
}