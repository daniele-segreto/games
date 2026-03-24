/**
 * Project: 3D Environment - Dr. Gem Engine
 * Module: Dual-Input Control System (Mouse & Keyboard)
 * Lead Developer: Prof. Daniele Segreto
 */

$(document).ready(function() {
    // --- 1. SETUP AMBIENTALE (FORESTA + NEBBIA) ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7fb3d5); 
    scene.fog = new THREE.Fog(0x7fb3d5, 45, 160); 

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    $('#game-container').empty().append(renderer.domElement);

    // --- 2. LUCI E TERRENO ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(100, 120, 50);
    sun.castShadow = true;
    scene.add(sun);

    const playAreaRadius = 30; 
    const worldSize = 2000; 

    // Terreno Esterno (Marrone)
    const earthFloor = new THREE.Mesh(new THREE.PlaneGeometry(worldSize, worldSize), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
    earthFloor.rotation.x = -Math.PI / 2;
    earthFloor.receiveShadow = true;
    scene.add(earthFloor);

    // Piattaforma Principale (Verde)
    const internalFloor = new THREE.Mesh(new THREE.CircleGeometry(playAreaRadius, 64), new THREE.MeshStandardMaterial({ color: 0x2ecc71 }));
    internalFloor.rotation.x = -Math.PI / 2;
    internalFloor.position.y = 0.03; 
    internalFloor.receiveShadow = true;
    scene.add(internalFloor);

    // --- 3. RECINTO E VEGETAZIONE ---
    function createWildTree(x, z, type, isInternal = false) {
        const treeGroup = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2, 8), new THREE.MeshStandardMaterial({ color: 0x3d2b1f }));
        trunk.position.y = 1;
        
        // Se interno, gli alberi sono leggermente più piccoli
        const scale = isInternal ? 0.7 : 1.0;
        const leavesGeo = type === 'tall' ? new THREE.ConeGeometry(1.6 * scale, 4.5 * scale, 8) : new THREE.DodecahedronGeometry(1.6 * scale, 1);
        const leaves = new THREE.Mesh(leavesGeo, new THREE.MeshStandardMaterial({ color: type === 'tall' ? 0x1a3318 : 0x244220 }));
        leaves.position.y = (type === 'tall' ? 4.2 : 3.2) * scale;
        
        treeGroup.add(trunk, leaves);
        treeGroup.position.set(x, 0, z);
        treeGroup.traverse(n => { if(n.isMesh) n.castShadow = true; });
        scene.add(treeGroup);
    }

    // Vegetazione Esterna
    for (let i = 0; i < 220; i++) {
        let angle = Math.random() * Math.PI * 2, dist = playAreaRadius + 12 + Math.random() * 160;
        createWildTree(Math.cos(angle) * dist, Math.sin(angle) * dist, Math.random() > 0.5 ? 'tall' : 'small');
    }

    // Alberelli Interni (Nuovi)
    for (let i = 0; i < 8; i++) {
        let angle = Math.random() * Math.PI * 2, dist = 5 + Math.random() * (playAreaRadius - 10);
        createWildTree(Math.cos(angle) * dist, Math.sin(angle) * dist, 'small', true);
    }

    // Recinto (Nuovo)
    const fenceGroup = new THREE.Group();
    for (let i = 0; i < 85; i++) {
        const angle = (i / 85) * Math.PI * 2;
        const post = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 2.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x3d2b1f })
        );
        post.position.set(Math.cos(angle) * (playAreaRadius - 0.5), 1.1, Math.sin(angle) * (playAreaRadius - 0.5));
        post.castShadow = true;
        fenceGroup.add(post);
    }
    scene.add(fenceGroup);

    // --- 4. STATO E MODELLO ---
    let player = null, playerLoaded = false, walkCycle = 0, baseScale = 2;
    let verticalVelocity = 0, gravity = -0.015, jumpStrength = 0.4, isGrounded = true;
    let isAttacking = false, attackTimer = 0, lightningBolt = null;
    let isCrouching = false, isAiming = false;

    const loader = new THREE.GLTFLoader();
    loader.load('assets/models/pikachu_style.glb', function(gltf) {
        player = gltf.scene;
        player.scale.set(baseScale, baseScale, baseScale);
        player.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
        scene.add(player);
        playerLoaded = true;
    });

    // --- 5. SISTEMA DI INPUT IBRIDO ---
    const keys = {};
    $(document).keydown(e => {
        keys[e.code] = true;
        if (!playerLoaded) return;
        if (e.code === 'Space' && isGrounded) { verticalVelocity = jumpStrength; isGrounded = false; }
        if (e.code === 'ControlLeft' || e.code === 'KeyC') isCrouching = true;
        if (e.code === 'KeyQ') isAiming = true; 
        if (e.code === 'KeyR' && !isAttacking) startThunderShock();
        if (e.code === 'Escape') alert("Pausa Dr. Gem Engine");
    });

    $(document).keyup(e => {
        keys[e.code] = false;
        if (e.code === 'ControlLeft' || e.code === 'KeyC') isCrouching = false;
        if (e.code === 'KeyQ') isAiming = false;
    });

    $(document).mousedown(e => {
        if (!playerLoaded) return;
        if (e.button === 0 && !isAttacking) startThunderShock();
        if (e.button === 2) isAiming = true;
    });
    $(document).mouseup(e => { if (e.button === 2) isAiming = false; });
    $(document).on('contextmenu', e => e.preventDefault());

    function startThunderShock() {
        isAttacking = true;
        attackTimer = 22;
        const mat = new THREE.LineBasicMaterial({ color: 0xffff00 });
        const pts = []; for(let i=0; i<14; i++) pts.push(new THREE.Vector3(0,0,0));
        lightningBolt = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
        scene.add(lightningBolt);
    }

    // --- 6. AGGIORNAMENTO ---
    function update() {
        if (!playerLoaded) return;

        let currentSpeed = keys['ShiftLeft'] ? 0.40 : (isCrouching ? 0.10 : 0.22);
        let moved = false;
        let targetRot = player.rotation.y;

        if (keys['KeyW'] || keys['ArrowUp']) { player.position.z -= currentSpeed; targetRot = Math.PI; moved = true; }
        if (keys['KeyS'] || keys['ArrowDown']) { player.position.z += currentSpeed; targetRot = 0; moved = true; }
        if (keys['KeyA'] || keys['ArrowLeft']) { player.position.x -= currentSpeed; targetRot = -Math.PI/2; moved = true; }
        if (keys['KeyD'] || keys['ArrowRight']) { player.position.x += currentSpeed; targetRot = Math.PI/2; moved = true; }
        
        const targetScaleY = isCrouching ? baseScale * 0.6 : baseScale;
        player.scale.y = THREE.MathUtils.lerp(player.scale.y, targetScaleY, 0.2);

        // Limiti del recinto
        const d = Math.sqrt(player.position.x**2 + player.position.z**2);
        if (d > 28.5) {
            const a = Math.atan2(player.position.z, player.position.x);
            player.position.x = Math.cos(a) * 28.5; player.position.z = Math.sin(a) * 28.5;
        }

        player.position.y += verticalVelocity;
        verticalVelocity += gravity;

        if (moved && isGrounded) {
            walkCycle += currentSpeed * 1.2;
            player.rotation.z = Math.sin(walkCycle) * 0.08;
            let diff = targetRot - player.rotation.y;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            player.rotation.y += diff * 0.15;
        }

        const bbox = new THREE.Box3().setFromObject(player);
        if (bbox.min.y <= 0) { player.position.y -= bbox.min.y; verticalVelocity = 0; isGrounded = true; } 
        else { isGrounded = false; }

        if (isAttacking && lightningBolt) {
            const start = player.position.clone().add(new THREE.Vector3(0, 1.2, 0));
            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
            const end = start.clone().add(dir.multiplyScalar(14));
            const pts = [];
            for (let i = 0; i <= 14; i++) {
                const p = start.clone().lerp(end, i / 14);
                if (i > 0 && i < 14) p.add(new THREE.Vector3((Math.random()-0.5)*0.9, (Math.random()-0.5)*0.9, (Math.random()-0.5)*0.9));
                pts.push(p);
            }
            lightningBolt.geometry.setFromPoints(pts);
            attackTimer--;
            if (attackTimer <= 0) { scene.remove(lightningBolt); lightningBolt = null; isAttacking = false; }
        }

        const camDist = isAiming ? 8 : 14;
        camera.position.lerp(new THREE.Vector3(player.position.x, player.position.y + 7, player.position.z + camDist), 0.08);
        camera.lookAt(player.position.x, player.position.y + 1, player.position.z);
    }

    function animate() { requestAnimationFrame(animate); update(); renderer.render(scene, camera); }
    animate();

    $(window).on('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});