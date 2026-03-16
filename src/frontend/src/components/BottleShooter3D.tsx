import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface Shard {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  life: number;
}

interface MissSpark {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
}

interface LaserBeam {
  line: THREE.Line;
  life: number;
}

interface OrbitalBottle {
  mesh: THREE.Mesh;
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  orbitType: number; // 0=circle, 1=figure-8
  orbitCenterX: number;
  orbitCenterZ: number;
}

export default function BottleShooter3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<number>(
    Number.parseInt(localStorage.getItem("bottleScore") ?? "0") || 0,
  );
  const levelRef = useRef<number>(
    Number.parseInt(localStorage.getItem("bottleLevel") ?? "1") || 1,
  );

  const [score, setScore] = useState(scoreRef.current);
  const [level, setLevel] = useState(levelRef.current);
  const [scorePing, setScorePing] = useState(false);

  const triggerPing = useCallback(() => {
    setScorePing(true);
    setTimeout(() => setScorePing(false), 220);
  }, []);

  const addScore = useCallback(
    (pts: number) => {
      scoreRef.current += pts;
      const newLevel = Math.floor(scoreRef.current / 500) + 1;
      if (newLevel !== levelRef.current) {
        levelRef.current = newLevel;
        setLevel(newLevel);
      }
      localStorage.setItem("bottleScore", String(scoreRef.current));
      localStorage.setItem("bottleLevel", String(levelRef.current));
      setScore(scoreRef.current);
      triggerPing();
    },
    [triggerPing],
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Renderer ──────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x02040f);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    // ── Scene + Camera ────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02040f, 0.04);

    const camera = new THREE.PerspectiveCamera(
      75,
      mount.clientWidth / mount.clientHeight,
      0.1,
      200,
    );
    camera.position.set(0, 1.6, 0);

    // ── Lights ────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x0a1428, 2));
    const neonLight = new THREE.PointLight(0x00ffff, 15, 30);
    neonLight.position.set(0, 5, -4);
    scene.add(neonLight);
    const fillLight = new THREE.PointLight(0x0044ff, 8, 20);
    fillLight.position.set(-5, 3, -6);
    scene.add(fillLight);

    // ── Floor ─────────────────────────────────────────────────────
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x050a1e,
      metalness: 0.4,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Neon grid on floor
    const gridHelper = new THREE.GridHelper(60, 30, 0x00ffff, 0x001122);
    (gridHelper.material as THREE.LineBasicMaterial).opacity = 0.3;
    (gridHelper.material as THREE.LineBasicMaterial).transparent = true;
    scene.add(gridHelper);

    // ── Bottles ───────────────────────────────────────────────────
    const orbitalBottles: OrbitalBottle[] = [];
    const shards: Shard[] = [];
    const missSparkRef: MissSpark[] = [];
    const lasers: LaserBeam[] = [];
    let waveActive = true;

    const createOrbitalBottle = (
      cx: number,
      cz: number,
      radius: number,
      startAngle: number,
      speed: number,
      orbitType: number,
    ): OrbitalBottle => {
      const geo = new THREE.CylinderGeometry(0.15, 0.28, 1.5, 8);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x00cccc,
        emissive: 0x002222,
        metalness: 0.6,
        roughness: 0.3,
        transparent: true,
        opacity: 0.85,
      });
      const bottle = new THREE.Mesh(geo, mat);
      bottle.position.set(
        cx + Math.cos(startAngle) * radius,
        0.75,
        cz + Math.sin(startAngle) * radius,
      );
      bottle.castShadow = true;
      scene.add(bottle);

      // Glow light
      const glow = new THREE.PointLight(0x00ffff, 2, 3);
      bottle.add(glow);

      return {
        mesh: bottle,
        orbitRadius: radius,
        orbitAngle: startAngle,
        orbitSpeed: speed,
        orbitType,
        orbitCenterX: cx,
        orbitCenterZ: cz,
      };
    };

    const spawnWave = () => {
      // Clear old bottles
      for (const ob of orbitalBottles) {
        scene.remove(ob.mesh);
        (ob.mesh.geometry as THREE.CylinderGeometry).dispose();
        (ob.mesh.material as THREE.MeshStandardMaterial).dispose();
      }
      orbitalBottles.length = 0;

      const count = Math.min(5 + levelRef.current, 10);
      const baseZ = -10 - (levelRef.current - 1) * 1.5;

      for (let i = 0; i < count; i++) {
        const cx = (i - count / 2) * 3.5;
        const radius = 1.5 + Math.random() * 1.5;
        const startAngle = (Math.PI * 2 * i) / count;
        const speed =
          (0.008 + Math.random() * 0.006) * (Math.random() < 0.5 ? 1 : -1);
        const orbitType = Math.random() < 0.4 ? 1 : 0;
        orbitalBottles.push(
          createOrbitalBottle(cx, baseZ, radius, startAngle, speed, orbitType),
        );
      }
      waveActive = true;
    };

    spawnWave();

    // ── Resize ────────────────────────────────────────────────────
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);

    // ── Camera shake ──────────────────────────────────────────────
    let shakeIntensity = 0;
    const originalCamY = camera.position.y;

    // ── Raycaster + click ─────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const shatterBottle = (bottle: THREE.Mesh, hitPoint: THREE.Vector3) => {
      const idx = orbitalBottles.findIndex((ob) => ob.mesh === bottle);
      if (idx === -1) return;
      orbitalBottles.splice(idx, 1);
      scene.remove(bottle);

      // Create 32 shards - mix of tetrahedra and spheres
      for (let i = 0; i < 32; i++) {
        const isSmall = i > 20;
        const shardGeo = isSmall
          ? new THREE.SphereGeometry(0.05 + Math.random() * 0.04, 4, 4)
          : new THREE.TetrahedronGeometry(0.1 + Math.random() * 0.12);
        const glowColor = Math.random() < 0.5 ? 0x00ffff : 0xffffff;
        const shardMat = new THREE.MeshStandardMaterial({
          color: glowColor,
          emissive: glowColor,
          emissiveIntensity: 1.2,
          transparent: true,
          opacity: 1,
          metalness: 0.7,
          roughness: 0.1,
        });
        const shard = new THREE.Mesh(shardGeo, shardMat);
        shard.position.copy(hitPoint);
        scene.add(shard);

        shards.push({
          mesh: shard,
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.45,
            Math.random() * 0.35 + 0.1,
            (Math.random() - 0.5) * 0.45,
          ),
          angularVelocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.25,
            (Math.random() - 0.5) * 0.25,
            (Math.random() - 0.5) * 0.25,
          ),
          life: 1.0,
        });
      }

      // Trigger score add
      const pts = 100;
      addScoreRef.current(pts);

      // Camera shake
      shakeIntensity = 0.15;

      // Check wave complete
      if (orbitalBottles.length === 0 && waveActive) {
        waveActive = false;
        setTimeout(spawnWave, 1500);
      }
    };

    const addScoreRef = { current: addScore };

    const handleClick = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const bottleMeshes = orbitalBottles.map((ob) => ob.mesh);
      const intersects = raycaster.intersectObjects(bottleMeshes);

      // Laser end point
      const laserEnd = intersects.length
        ? intersects[0].point
        : raycaster.ray.origin
            .clone()
            .add(raycaster.ray.direction.clone().multiplyScalar(30));

      // Laser tracer - full opacity, slow fade
      const laserGeo = new THREE.BufferGeometry().setFromPoints([
        camera.position.clone(),
        laserEnd,
      ]);
      const laserMat = new THREE.LineBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 1.0,
      });
      const laserLine = new THREE.Line(laserGeo, laserMat);
      scene.add(laserLine);
      lasers.push({ line: laserLine, life: 1.0 });

      if (intersects.length > 0 && intersects[0].object instanceof THREE.Mesh) {
        shatterBottle(intersects[0].object, intersects[0].point);
      } else {
        // Miss sparks - cast against floor plane y=0
        const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const missPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(floorPlane, missPoint);
        if (missPoint) {
          for (let i = 0; i < 10; i++) {
            const sparkGeo = new THREE.SphereGeometry(0.05, 4, 4);
            const sparkColor = Math.random() < 0.6 ? 0x0088ff : 0xffffff;
            const sparkMat = new THREE.MeshStandardMaterial({
              color: sparkColor,
              emissive: sparkColor,
              emissiveIntensity: 2.0,
              transparent: true,
              opacity: 1.0,
            });
            const spark = new THREE.Mesh(sparkGeo, sparkMat);
            spark.position.copy(missPoint);
            spark.position.y += 0.05;
            scene.add(spark);
            missSparkRef.push({
              mesh: spark,
              velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                Math.random() * 0.15,
                (Math.random() - 0.5) * 0.3,
              ),
              life: 1.0,
            });
          }
        }
      }
    };

    mount.addEventListener("click", handleClick);

    // ── Bottle sway ───────────────────────────────────────────────
    // time variable removed - bottles use orbital math now

    // ── Animation Loop ────────────────────────────────────────────
    let frameId: number;

    const animate = () => {
      frameId = requestAnimationFrame(animate);

      // Orbital bottle movement
      for (const ob of orbitalBottles) {
        ob.orbitAngle += ob.orbitSpeed * levelRef.current;
        if (ob.orbitType === 1) {
          // figure-8
          ob.mesh.position.x =
            ob.orbitCenterX + Math.cos(ob.orbitAngle) * ob.orbitRadius;
          ob.mesh.position.z =
            ob.orbitCenterZ +
            Math.sin(2 * ob.orbitAngle) * ob.orbitRadius * 0.5;
        } else {
          // circle
          ob.mesh.position.x =
            ob.orbitCenterX + Math.cos(ob.orbitAngle) * ob.orbitRadius;
          ob.mesh.position.z =
            ob.orbitCenterZ + Math.sin(ob.orbitAngle) * ob.orbitRadius;
        }
        // Spin on own Y axis
        ob.mesh.rotation.y += 0.025;
      }

      // Update shards
      for (let i = shards.length - 1; i >= 0; i--) {
        const s = shards[i];
        s.life -= 0.025;
        if (s.life <= 0) {
          scene.remove(s.mesh);
          s.mesh.geometry.dispose();
          (s.mesh.material as THREE.MeshStandardMaterial).dispose();
          shards.splice(i, 1);
          continue;
        }
        s.mesh.position.add(s.velocity);
        s.velocity.y -= 0.005; // gravity
        s.mesh.rotation.x += s.angularVelocity.x;
        s.mesh.rotation.y += s.angularVelocity.y;
        s.mesh.rotation.z += s.angularVelocity.z;
        (s.mesh.material as THREE.MeshStandardMaterial).opacity = s.life;
      }

      // Update miss sparks
      for (let i = missSparkRef.length - 1; i >= 0; i--) {
        const sp = missSparkRef[i];
        sp.life -= 0.04; // fade over ~0.5s at 60fps
        if (sp.life <= 0) {
          scene.remove(sp.mesh);
          sp.mesh.geometry.dispose();
          (sp.mesh.material as THREE.MeshStandardMaterial).dispose();
          missSparkRef.splice(i, 1);
          continue;
        }
        sp.mesh.position.add(sp.velocity);
        sp.velocity.y -= 0.004;
        (sp.mesh.material as THREE.MeshStandardMaterial).opacity = sp.life;
      }

      // Update lasers
      for (let i = lasers.length - 1; i >= 0; i--) {
        const l = lasers[i];
        l.life -= 0.04;
        if (l.life <= 0) {
          scene.remove(l.line);
          l.line.geometry.dispose();
          (l.line.material as THREE.LineBasicMaterial).dispose();
          lasers.splice(i, 1);
          continue;
        }
        (l.line.material as THREE.LineBasicMaterial).opacity = l.life;
      }

      // Camera shake
      if (shakeIntensity > 0.001) {
        camera.position.x = (Math.random() - 0.5) * shakeIntensity;
        camera.position.y =
          originalCamY + (Math.random() - 0.5) * shakeIntensity;
        shakeIntensity *= 0.75;
      } else {
        camera.position.x = 0;
        camera.position.y = originalCamY;
        shakeIntensity = 0;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      mount.removeEventListener("click", handleClick);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [addScore]);

  const toggleFullscreen = () => {
    const el = mountRef.current?.parentElement;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <div className="animate-fadeInUp">
      <h2
        style={{
          fontStyle: "italic",
          fontWeight: 900,
          color: "#00FFFF",
          letterSpacing: "2px",
          textAlign: "center",
          marginBottom: "1.5rem",
          fontSize: "1.2rem",
          textShadow: "0 0 20px rgba(0,255,255,0.6)",
          textTransform: "uppercase",
        }}
      >
        ⚡ 3D Neon Bottle Shatter ⚡
      </h2>

      <div style={{ position: "relative" }}>
        <div
          ref={mountRef}
          data-ocid="game.canvas"
          className="game-container"
        />

        {/* HUD */}
        <div className="game-hud">
          <span>ACTOR: GUEST_OPERATOR</span>
          <span className={`game-hud-score${scorePing ? " ping" : ""}`}>
            SCORE: {String(score).padStart(6, "0")}
          </span>
          <span>LEVEL: {level}</span>
        </div>

        {/* Fullscreen button */}
        <button
          type="button"
          data-ocid="game.fullscreen.button"
          onClick={toggleFullscreen}
          style={{
            position: "absolute",
            bottom: 12,
            right: 14,
            background: "rgba(0,255,255,0.1)",
            border: "1px solid rgba(0,255,255,0.4)",
            color: "#00FFFF",
            borderRadius: "0.4rem",
            padding: "4px 10px",
            fontSize: "0.7rem",
            cursor: "pointer",
            fontFamily: "Geist Mono, monospace",
            letterSpacing: "0.05em",
          }}
        >
          ⛶ FULLSCREEN
        </button>

        {/* Click hint */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 14,
            color: "rgba(0,255,255,0.5)",
            fontSize: "0.65rem",
            fontFamily: "Geist Mono, monospace",
            pointerEvents: "none",
          }}
        >
          CLICK TO SHOOT
        </div>
      </div>

      <p
        style={{
          textAlign: "center",
          color: "rgba(224,224,224,0.4)",
          fontSize: "0.7rem",
          marginTop: "0.75rem",
          fontFamily: "Geist Mono, monospace",
        }}
      >
        Click bottles to shatter them · Score persists across sessions
      </p>
    </div>
  );
}
