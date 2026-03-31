import { useEffect, useRef } from "react";
import * as THREE from "three";

interface DragonBackgroundProps {
  isMuted: boolean;
}

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
  alive: boolean;
}

export default function DragonBackground({ isMuted }: DragonBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    isMutedRef.current = isMuted;
    // masterGain is set in audio setup effect
  }, [isMuted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ─── Renderer ───────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04010f);
    scene.fog = new THREE.FogExp2(0x04010f, 0.003);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000,
    );
    camera.position.set(0, 0, 100);

    // ─── Ambient light ──────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0x110022, 1.0);
    scene.add(ambientLight);

    // ─── Sky gradient ───────────────────────────────────────────────────────
    const skyGeo = new THREE.PlaneGeometry(400, 200);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        void main() {
          vec3 top = vec3(0.016, 0.004, 0.059);
          vec3 bot = vec3(0.039, 0.0, 0.125);
          gl_FragColor = vec4(mix(bot, top, vUv.y), 1.0);
        }
      `,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    sky.position.set(0, 0, -100);
    scene.add(sky);

    // ─── Aurora ─────────────────────────────────────────────────────────────
    const auroraColors = [0x5500aa, 0x00ccaa, 0x5500aa, 0x00ccaa];
    const auroraOpacities = [0.1, 0.12, 0.08, 0.15];
    const auroras: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const geo = new THREE.PlaneGeometry(300, 15, 80, 1);
      const mat = new THREE.MeshBasicMaterial({
        color: auroraColors[i],
        transparent: true,
        opacity: auroraOpacities[i],
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, 30 + i * 8, -90);
      scene.add(mesh);
      auroras.push(mesh);
    }

    // ─── Mountains ──────────────────────────────────────────────────────────
    function makeJaggedMountain(
      color: number,
      zPos: number,
      yBase: number,
      seed: number,
    ) {
      const width = 320;
      const count = 60;
      const shape = new THREE.Shape();
      shape.moveTo(-width / 2, yBase - 30);
      for (let i = 0; i <= count; i++) {
        const x = -width / 2 + (width * i) / count;
        const nx = x * 0.03 + seed;
        const y =
          yBase +
          Math.sin(nx * 1.3) * 12 +
          Math.sin(nx * 2.7 + 1.1) * 7 +
          Math.sin(nx * 5.1 + seed) * 4 +
          Math.sin(nx * 9.3) * 2;
        if (i === 0) shape.lineTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.lineTo(width / 2, yBase - 30);
      shape.closePath();

      const geo = new THREE.ShapeGeometry(shape);
      const mat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, 0, zPos);
      scene.add(mesh);

      // Neon peak glow
      const peakCount = 20;
      const peakPos = new Float32Array(peakCount * 3);
      for (let i = 0; i < peakCount; i++) {
        const x = -width / 2 + (width * i) / peakCount;
        const nx = x * 0.03 + seed;
        const y =
          yBase +
          Math.sin(nx * 1.3) * 12 +
          Math.sin(nx * 2.7 + 1.1) * 7 +
          Math.sin(nx * 5.1 + seed) * 4 +
          Math.sin(nx * 9.3) * 2;
        peakPos[i * 3] = x;
        peakPos[i * 3 + 1] = y;
        peakPos[i * 3 + 2] = 0;
      }
      const peakGeo = new THREE.BufferGeometry();
      peakGeo.setAttribute("position", new THREE.BufferAttribute(peakPos, 3));
      const peakMat = new THREE.PointsMaterial({
        color: 0xaa44ff,
        size: 1.5,
        transparent: true,
        opacity: 0.3,
      });
      const peakPoints = new THREE.Points(peakGeo, peakMat);
      peakPoints.position.set(0, 0, zPos + 0.1);
      scene.add(peakPoints);
    }

    makeJaggedMountain(0x080010, -80, -30, 0.0);
    makeJaggedMountain(0x0d0018, -60, -28, 5.3);
    makeJaggedMountain(0x04000e, -40, -25, 11.7);

    // ─── Fog planes ─────────────────────────────────────────────────────────
    const fogMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.04,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const fog1 = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 15),
      fogMat.clone(),
    );
    fog1.position.set(0, -18, -35);
    scene.add(fog1);
    const fog2 = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 15),
      fogMat.clone(),
    );
    fog2.position.set(0, -18, -30);
    scene.add(fog2);

    // ─── Forest ─────────────────────────────────────────────────────────────────────────────────
    const TREE_COUNT = 180;
    const treeGroup = new THREE.Group();
    scene.add(treeGroup);

    const pineMat = new THREE.MeshStandardMaterial({
      color: 0x0a1a08,
      roughness: 0.95,
    });
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x1a0f08,
      roughness: 1.0,
    });

    for (let i = 0; i < TREE_COUNT; i++) {
      const xPos = Math.random() * 280 - 140;
      const zPos = -15 - Math.random() * 30;
      const heightScale = 0.6 + Math.random() * 0.9;
      const baseH = 7 * heightScale;

      const trunkGeo = new THREE.CylinderGeometry(
        0.15,
        0.25,
        2 * heightScale,
        5,
      );
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(xPos, -30 + heightScale, zPos);
      treeGroup.add(trunk);

      const tiers = 2 + Math.floor(Math.random() * 2);
      for (let t = 0; t < tiers; t++) {
        const tierScale = 1 - t * 0.28;
        const coneH = baseH * tierScale;
        const coneR = 3 * heightScale * tierScale;
        const coneGeo = new THREE.ConeGeometry(coneR, coneH, 6);
        const cone = new THREE.Mesh(coneGeo, pineMat);
        cone.position.set(
          xPos,
          -30 + heightScale * 1.5 + coneH / 2 + t * (baseH * 0.38 * tierScale),
          zPos,
        );
        treeGroup.add(cone);
      }
    }

    // ─── Falling embers ─────────────────────────────────────────────────────
    const EMBER_COUNT = 200;
    const emberPositions = new Float32Array(EMBER_COUNT * 3);
    const emberVx = new Float32Array(EMBER_COUNT);
    const emberVy = new Float32Array(EMBER_COUNT);
    for (let i = 0; i < EMBER_COUNT; i++) {
      emberPositions[i * 3] = Math.random() * 240 - 120;
      emberPositions[i * 3 + 1] = Math.random() * 100 - 20;
      emberPositions[i * 3 + 2] = Math.random() * 40 - 20;
      emberVx[i] = -(Math.random() * 0.1 + 0.05);
      emberVy[i] = -(Math.random() * 0.07 + 0.05);
    }
    const emberGeo = new THREE.BufferGeometry();
    emberGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(emberPositions, 3),
    );
    const emberMat = new THREE.PointsMaterial({
      color: 0xff3300,
      size: 1.0,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });
    const embers = new THREE.Points(emberGeo, emberMat);
    scene.add(embers);

    // ─── Dragon ──────────────────────────────────────────────────────────────
    const dragonGroup = new THREE.Group();
    scene.add(dragonGroup);

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a1008,
      emissive: new THREE.Color(0x330800),
      emissiveIntensity: 0.3,
      roughness: 0.9,
      metalness: 0.1,
    });

    // Body
    const bodyCap = new THREE.CapsuleGeometry(3, 12, 8, 16);
    const body = new THREE.Mesh(bodyCap, bodyMat);
    body.rotation.x = Math.PI / 2;
    dragonGroup.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(2.5, 12, 10);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.scale.set(1.2, 0.9, 1.4);
    head.position.set(0, 1, 8);
    dragonGroup.add(head);

    // Horns
    const hornMat = new THREE.MeshStandardMaterial({ color: 0x222218 });
    const hornGeo = new THREE.ConeGeometry(0.3, 3, 6);
    const hornL = new THREE.Mesh(hornGeo, hornMat);
    hornL.position.set(-1.2, 3.5, 8);
    hornL.rotation.z = -0.3;
    dragonGroup.add(hornL);
    const hornR = new THREE.Mesh(hornGeo, hornMat);
    hornR.position.set(1.2, 3.5, 8);
    hornR.rotation.z = 0.3;
    dragonGroup.add(hornR);

    // Eyes
    const eyeMat = new THREE.MeshStandardMaterial({
      emissive: new THREE.Color(0xff8800),
      emissiveIntensity: 3.0,
      color: 0x000000,
    });
    const eyeGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-1.0, 1.3, 11.5);
    dragonGroup.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(1.0, 1.3, 11.5);
    dragonGroup.add(eyeR);

    // Wings
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x1a0508,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      emissive: new THREE.Color(0x220000),
      emissiveIntensity: 0.2,
    });

    const WING_SEG_X = 8;
    const WING_SEG_Y = 6;

    const wingLGeo = new THREE.PlaneGeometry(18, 10, WING_SEG_X, WING_SEG_Y);
    const wingL = new THREE.Mesh(wingLGeo, wingMat);
    wingL.position.set(-10, 0, 0);
    wingL.rotation.y = 0.4;
    dragonGroup.add(wingL);

    const wingRGeo = new THREE.PlaneGeometry(18, 10, WING_SEG_X, WING_SEG_Y);
    const wingR = new THREE.Mesh(wingRGeo, wingMat);
    wingR.position.set(10, 0, 0);
    wingR.rotation.y = -0.4;
    dragonGroup.add(wingR);

    // Store original wing vertex y positions
    const wingLOrigY = new Float32Array(
      wingLGeo.attributes.position.array.length / 3,
    );
    const wingROrigY = new Float32Array(
      wingRGeo.attributes.position.array.length / 3,
    );
    for (let i = 0; i < wingLOrigY.length; i++) {
      wingLOrigY[i] = wingLGeo.attributes.position.getY(i);
      wingROrigY[i] = wingRGeo.attributes.position.getY(i);
    }

    // ─── Fire PointLight ────────────────────────────────────────────────────
    const fireLight = new THREE.PointLight(0xff6600, 0, 30);
    scene.add(fireLight);

    // ─── Fire particle pools ─────────────────────────────────────────────────
    const POOL_SIZE = 150;

    function makeParticlePool(
      color: number,
      size: number,
    ): {
      points: THREE.Points;
      particles: Particle[];
      positions: Float32Array;
      sizes: Float32Array;
      opacities: Float32Array;
    } {
      const particles: Particle[] = [];
      const positions = new Float32Array(POOL_SIZE * 3);
      const sizes = new Float32Array(POOL_SIZE);
      const opacities = new Float32Array(POOL_SIZE);

      for (let i = 0; i < POOL_SIZE; i++) {
        particles.push({
          position: new THREE.Vector3(0, 0, -9999),
          velocity: new THREE.Vector3(),
          life: 1.0,
          maxLife: 1.0,
          size,
          opacity: 0,
          alive: false,
        });
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = -9999;
        sizes[i] = size;
        opacities[i] = 0;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

      const mat = new THREE.PointsMaterial({
        color,
        size,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
        depthWrite: false,
      });

      const points = new THREE.Points(geo, mat);
      scene.add(points);
      return { points, particles, positions, sizes, opacities };
    }

    const corePool = makeParticlePool(0xfff5cc, 0.8);
    const midPool = makeParticlePool(0xff8800, 1.5);
    const outerPool = makeParticlePool(0xcc1100, 2.5);
    const smokePool = makeParticlePool(0x222222, 4.0);

    let fireActive = false;
    let fireDuration = 0;
    let fireTimer = 0;
    let nextFireIn = 6 + Math.random() * 4;
    const fireDirection = new THREE.Vector3();

    function spawnFireParticle(
      pool: ReturnType<typeof makeParticlePool>,
      jawPos: THREE.Vector3,
      spread: number,
      speed: number,
      maxLife: number,
      isSmoke: boolean,
    ) {
      // find a dead particle
      for (let i = 0; i < POOL_SIZE; i++) {
        const p = pool.particles[i];
        if (!p.alive) {
          p.alive = true;
          p.life = 0;
          p.maxLife = maxLife;
          p.position.copy(jawPos);
          const sx = (Math.random() - 0.5) * spread;
          const sy = (Math.random() - 0.5) * spread;
          const dir = fireDirection.clone().normalize();
          dir.x += sx;
          dir.y += sy;
          dir.normalize();
          p.velocity
            .copy(dir)
            .multiplyScalar(speed * (0.8 + Math.random() * 0.4));
          if (isSmoke) {
            p.velocity.multiplyScalar(0.3);
            p.size = 4.0;
            p.opacity = 0.15;
          } else {
            p.size = pool.sizes[i];
            p.opacity = 0.8 + Math.random() * 0.2;
          }
          break;
        }
      }
    }

    // ─── Audio ───────────────────────────────────────────────────────────────
    let audioCtx: AudioContext | null = null;
    let masterGain: GainNode | null = null;
    let crackleSource: AudioBufferSourceNode | null = null;
    let audioInitialized = false;
    let lastWingThud = 0;
    let wingPhaseWasUp = false;

    function initAudio() {
      if (audioInitialized) return;
      audioInitialized = true;

      audioCtx = new AudioContext();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = isMutedRef.current ? 0 : 1;
      masterGain.connect(audioCtx.destination);

      // Crackle: white noise → lowpass → LFO gain
      const crackleBuffer = audioCtx.createBuffer(1, 22050 * 2, 22050);
      const data = crackleBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      crackleSource = audioCtx.createBufferSource();
      crackleSource.buffer = crackleBuffer;
      crackleSource.loop = true;

      const lowpass = audioCtx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 800;

      const crackleGain = audioCtx.createGain();
      crackleGain.gain.value = 0.08;

      const lfo = audioCtx.createOscillator();
      lfo.frequency.value = 0.3;
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 0.07;
      lfo.connect(lfoGain);
      lfoGain.connect(crackleGain.gain);
      lfo.start();

      crackleSource.connect(lowpass);
      lowpass.connect(crackleGain);
      crackleGain.connect(masterGain);
      crackleSource.start();
    }

    function triggerRoar() {
      if (!audioCtx || !masterGain) return;
      const now = audioCtx.currentTime;

      // Procedural impulse for reverb
      const irLen = audioCtx.sampleRate * 0.5;
      const irBuf = audioCtx.createBuffer(2, irLen, audioCtx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = irBuf.getChannelData(c);
        for (let i = 0; i < irLen; i++)
          d[i] = (Math.random() * 2 - 1) * (1 - i / irLen) ** 2;
      }
      const convolver = audioCtx.createConvolver();
      convolver.buffer = irBuf;

      const compressor = audioCtx.createDynamicsCompressor();
      const roarGain = audioCtx.createGain();
      roarGain.gain.setValueAtTime(0, now);
      roarGain.gain.linearRampToValueAtTime(0.4, now + 0.2);
      roarGain.gain.linearRampToValueAtTime(0.4, now + 1.2);
      roarGain.gain.linearRampToValueAtTime(0, now + 1.6);

      const osc1 = audioCtx.createOscillator();
      osc1.frequency.setValueAtTime(80, now);
      osc1.frequency.linearRampToValueAtTime(30, now + 1.5);
      osc1.type = "sawtooth";

      const osc2 = audioCtx.createOscillator();
      osc2.frequency.setValueAtTime(160, now);
      osc2.detune.value = 20;
      osc2.type = "sawtooth";

      osc1.connect(convolver);
      osc2.connect(convolver);
      convolver.connect(compressor);
      compressor.connect(roarGain);
      roarGain.connect(masterGain);

      osc1.start(now);
      osc1.stop(now + 2);
      osc2.start(now);
      osc2.stop(now + 2);
    }

    function triggerWingThud() {
      if (!audioCtx || !masterGain) return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      osc.frequency.setValueAtTime(55, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.3);

      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.3, now);
      g.gain.linearRampToValueAtTime(0.3, now + 0.01);
      g.gain.linearRampToValueAtTime(0, now + 0.35);

      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.4);
    }

    const handleInteraction = () => {
      initAudio();
      if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    };
    window.addEventListener("click", handleInteraction, { once: false });
    window.addEventListener("touchstart", handleInteraction, { once: false });

    // ─── Animation loop ───────────────────────────────────────────────────────
    let rafId: number;
    let lastTime = performance.now();
    const clock = new THREE.Clock();
    const prevDragonPos = new THREE.Vector3();
    let firstFrame = true;

    function animate() {
      rafId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const elapsed = clock.getElapsedTime();

      // Mute master gain sync
      if (masterGain) {
        const target = isMutedRef.current ? 0 : 1;
        masterGain.gain.value = target;
      }

      // ── Auroras ──
      for (let i = 0; i < auroras.length; i++) {
        auroras[i].position.x = Math.sin(elapsed * 0.1 + i) * 20;
        auroras[i].position.y =
          30 + i * 8 + Math.sin(elapsed * 0.05 + i * 1.3) * 3;
      }

      // ── Fog scroll ──
      fog1.position.x -= 0.05;
      if (fog1.position.x < -160) fog1.position.x = 160;
      fog2.position.x -= 0.03;
      if (fog2.position.x < -160) fog2.position.x = 160;

      // ── Embers ──
      const ePos = emberGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < EMBER_COUNT; i++) {
        let x = ePos.getX(i) + emberVx[i];
        let y = ePos.getY(i) + emberVy[i];
        if (y < -30 || x < -140) {
          x = Math.random() * 240 - 120;
          y = 80;
        }
        ePos.setXYZ(i, x, y, ePos.getZ(i));
      }
      ePos.needsUpdate = true;

      // ── Forest wind sway ──
      for (let treeIdx = 0; treeIdx < treeGroup.children.length; treeIdx++) {
        const child = treeGroup.children[treeIdx];
        if (child instanceof THREE.Mesh) {
          child.rotation.z = Math.sin(elapsed * 0.8 + treeIdx * 1.3) * 0.03;
        }
      }

      // ── Dragon flight ──
      const t = elapsed;
      dragonGroup.position.x = 60 * Math.cos(t * 0.15);
      dragonGroup.position.y = 25 + 10 * Math.sin(t * 0.2);
      dragonGroup.position.z = -20 + 15 * Math.sin(t * 0.15);

      if (!firstFrame) {
        const vel = dragonGroup.position.clone().sub(prevDragonPos);
        if (vel.length() > 0.001) {
          const lookTarget = dragonGroup.position.clone().add(vel);
          dragonGroup.lookAt(lookTarget);
        }
      }
      prevDragonPos.copy(dragonGroup.position);
      firstFrame = false;

      // ── Wing flap ──
      const wingPhase = Math.sin(elapsed * 1.2);
      const isLowest = wingPhase < -0.95;
      if (isLowest && !wingPhaseWasUp && audioInitialized) {
        const nowMs = performance.now();
        if (nowMs - lastWingThud > 1200) {
          triggerWingThud();
          lastWingThud = nowMs;
        }
      }
      wingPhaseWasUp = wingPhase > 0;

      const posLArr = wingLGeo.attributes.position as THREE.BufferAttribute;
      const posRArr = wingRGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < wingLOrigY.length; i++) {
        const origY = wingLOrigY[i];
        const x = posLArr.getX(i);
        const deform = Math.sin(elapsed * 1.2 + x * 0.2) * 2.5;
        posLArr.setY(i, origY + deform);
        posRArr.setY(i, wingROrigY[i] + deform);
      }
      posLArr.needsUpdate = true;
      posRArr.needsUpdate = true;

      // ── Fire breath timing ──
      fireTimer += dt;
      if (!fireActive && fireTimer >= nextFireIn) {
        fireActive = true;
        fireDuration = 0;
        fireTimer = 0;
        nextFireIn = 6 + Math.random() * 4;
        if (audioInitialized && !isMutedRef.current) triggerRoar();
      }
      if (fireActive) {
        fireDuration += dt;
        if (fireDuration > 2.0) {
          fireActive = false;
          fireLight.intensity = 0;
        }
      }

      // ── Dragon jaw/fire position ──
      const jawLocal = new THREE.Vector3(0, 0, 13);
      const jawWorld = jawLocal.applyMatrix4(dragonGroup.matrixWorld);

      // Compute fire direction (dragon forward in world)
      fireDirection.set(0, 0, 1).applyQuaternion(dragonGroup.quaternion);

      // ── Update fire particles ──
      function updatePool(
        pool: ReturnType<typeof makeParticlePool>,
        spread: number,
        speed: number,
        maxLife: number,
        isSmoke: boolean,
      ) {
        const pPos = pool.points.geometry.attributes
          .position as THREE.BufferAttribute;
        if (fireActive) {
          const spawnCount = isSmoke ? 2 : 5;
          for (let s = 0; s < spawnCount; s++) {
            spawnFireParticle(pool, jawWorld, spread, speed, maxLife, isSmoke);
          }
        }
        for (let i = 0; i < POOL_SIZE; i++) {
          const p = pool.particles[i];
          if (!p.alive) {
            pPos.setXYZ(i, 0, 0, -9999);
            continue;
          }
          p.velocity.x += (Math.random() - 0.5) * 0.04;
          p.velocity.y += 0.008;
          p.position.addScaledVector(p.velocity, dt * 30);
          p.life += dt / p.maxLife;
          p.opacity = Math.max(0, 1 - p.life);
          p.size *= 1.002;
          if (p.life >= 1) {
            p.alive = false;
            pPos.setXYZ(i, 0, 0, -9999);
          } else {
            pPos.setXYZ(i, p.position.x, p.position.y, p.position.z);
          }
        }
        pPos.needsUpdate = true;
      }

      if (fireActive) {
        fireLight.position.copy(jawWorld);
        fireLight.intensity = 2.0 + Math.random() * 2.5;
        updatePool(corePool, 0.09, 2.2, 0.5, false);
        updatePool(midPool, 0.27, 1.5, 0.7, false);
        updatePool(outerPool, 0.45, 0.9, 0.9, false);
        updatePool(smokePool, 0.6, 0.5, 1.5, true);
      } else {
        fireLight.intensity = 0;
        // still update existing particles so they die naturally
        updatePool(corePool, 0, 0, 0.5, false);
        updatePool(midPool, 0, 0, 0.7, false);
        updatePool(outerPool, 0, 0, 0.9, false);
        updatePool(smokePool, 0, 0, 1.5, true);
      }

      renderer.render(scene, camera);
    }

    animate();

    // ─── Visibility API ───────────────────────────────────────────────────────
    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        lastTime = performance.now();
        animate();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // ─── Resize ───────────────────────────────────────────────────────────────
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // ─── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);

      if (crackleSource) {
        try {
          crackleSource.stop();
        } catch (_) {}
      }
      if (audioCtx) audioCtx.close();

      // dispose geometries & materials
      for (const g of [
        bodyCap,
        headGeo,
        hornGeo,
        eyeGeo,
        wingLGeo,
        wingRGeo,
        skyGeo,
        emberGeo,
      ])
        g.dispose();
      for (const m of [
        bodyMat,
        hornMat,
        eyeMat,
        wingMat,
        skyMat,
        fogMat,
        emberMat,
      ])
        m.dispose();
      for (const pool of [corePool, midPool, outerPool, smokePool]) {
        pool.points.geometry.dispose();
        (pool.points.material as THREE.Material).dispose();
      }
      // dispose forest meshes
      for (const child of treeGroup.children) {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
        }
      }
      (pineMat as THREE.Material).dispose();
      (trunkMat as THREE.Material).dispose();

      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        display: "block",
      }}
    />
  );
}
