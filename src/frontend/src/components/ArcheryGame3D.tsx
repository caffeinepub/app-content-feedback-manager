import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const HIGH_SCORE_KEY = "archery3d_hs";

function getHighScore(): number {
  return Number.parseInt(localStorage.getItem(HIGH_SCORE_KEY) ?? "0", 10);
}

function saveHighScore(score: number) {
  const current = getHighScore();
  if (score > current) {
    localStorage.setItem(HIGH_SCORE_KEY, String(score));
  }
}

function buildFitaTarget(scale: number): THREE.Group {
  const group = new THREE.Group();

  // Wooden post
  const postGeo = new THREE.CylinderGeometry(
    0.06 * scale,
    0.08 * scale,
    3.5 * scale,
    8,
  );
  const postMat = new THREE.MeshStandardMaterial({
    color: "#7a5c3a",
    roughness: 0.9,
  });
  const post = new THREE.Mesh(postGeo, postMat);
  post.position.y = -(1.6 * scale);
  post.castShadow = true;
  group.add(post);

  // Backing disc
  const discGeo = new THREE.CylinderGeometry(
    1.3 * scale,
    1.3 * scale,
    0.06 * scale,
    32,
  );
  const discMat = new THREE.MeshStandardMaterial({
    color: "#d4b896",
    roughness: 0.85,
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.rotation.x = Math.PI / 2;
  disc.position.z = -0.04 * scale;
  group.add(disc);

  // FITA color rings: white, black, blue, red, yellow from outer to inner
  const ringDefs = [
    { r: 1.18 * scale, tube: 0.075 * scale, color: "#ffffff" },
    { r: 0.96 * scale, tube: 0.07 * scale, color: "#111111" },
    { r: 0.74 * scale, tube: 0.07 * scale, color: "#1a5fc8" },
    { r: 0.52 * scale, tube: 0.065 * scale, color: "#d92b2b" },
    { r: 0.2 * scale, tube: 0.065 * scale, color: "#f5d020" },
  ];

  for (const rd of ringDefs) {
    const geo = new THREE.TorusGeometry(rd.r, rd.tube, 8, 36);
    const mat = new THREE.MeshStandardMaterial({
      color: rd.color,
      roughness: 0.55,
      metalness: 0.1,
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.castShadow = true;
    group.add(ring);
  }

  return group;
}

function buildFloodlightPole(x: number, z: number): THREE.Group {
  const group = new THREE.Group();

  // Pole
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 8, 8);
  const poleMat = new THREE.MeshStandardMaterial({
    color: "#888888",
    roughness: 0.7,
    metalness: 0.4,
  });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 4;
  pole.castShadow = true;
  group.add(pole);

  // Lamp head
  const lampGeo = new THREE.BoxGeometry(1.2, 0.25, 0.45);
  const lampMat = new THREE.MeshStandardMaterial({
    color: "#ffffcc",
    emissive: "#ffffa0",
    emissiveIntensity: 0.6,
    roughness: 0.3,
    metalness: 0.5,
  });
  const lamp = new THREE.Mesh(lampGeo, lampMat);
  lamp.position.y = 8.15;
  group.add(lamp);

  group.position.set(x, 0, z);
  return group;
}

export default function ArcheryGame3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    frameId: number;
    target: THREE.Group;
    arrows: Array<{
      mesh: THREE.Mesh;
      velocity: THREE.Vector3;
      active: boolean;
      trail: THREE.Points;
      trailPositions: number[];
    }>;
    startTime: number;
  } | null>(null);

  const [score, setScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [highScore, setHighScore] = useState(getHighScore);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [hitText, setHitText] = useState<{ text: string; id: number } | null>(
    null,
  );

  const scoreRef = useRef(0);
  const timeRef = useRef(60);
  const gameActiveRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playerName = localStorage.getItem("playerName") || "TERRY";

  const startGame = () => {
    scoreRef.current = 0;
    timeRef.current = 60;
    setScore(0);
    setAiScore(0);
    setTimeLeft(60);
    setGameOver(false);
    setGameStarted(true);
    gameActiveRef.current = true;

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      timeRef.current -= 1;
      setTimeLeft(timeRef.current);
      if (timeRef.current <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        if (aiTimerRef.current) clearInterval(aiTimerRef.current);
        gameActiveRef.current = false;
        setGameOver(true);
        saveHighScore(scoreRef.current);
        setHighScore(getHighScore());
      }
    }, 1000);

    // AI opponent scoring
    if (aiTimerRef.current) clearInterval(aiTimerRef.current);
    const scheduleAiShot = () => {
      const delay = 2000 + Math.random() * 2000;
      aiTimerRef.current = setTimeout(() => {
        if (!gameActiveRef.current) return;
        const pts = Math.floor(Math.random() * 61) + 10; // 10–70
        setAiScore((prev) => prev + pts);
        if (gameActiveRef.current) scheduleAiShot();
      }, delay) as unknown as ReturnType<typeof setInterval>;
    };
    scheduleAiShot();
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Scene — sky blue background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#87CEEB");

    // Camera — first-person-ish shooter angle
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
    camera.position.set(0, 1.6, 7);
    camera.lookAt(0, 1, -4);

    // ---- LIGHTING: stadium sun + ambient sky ----
    const hemi = new THREE.HemisphereLight("#87CEEB", "#3a8f4a", 0.8);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight("#ffffff", 1.2);
    sun.position.set(10, 20, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 80;
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    scene.add(sun);

    // ---- GROUND: green grass ----
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({
      color: "#3a8f4a",
      roughness: 0.9,
      metalness: 0.0,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    // ---- FLOODLIGHT POLES ----
    const pole1 = buildFloodlightPole(-8, -10);
    const pole2 = buildFloodlightPole(8, -10);
    scene.add(pole1);
    scene.add(pole2);

    // Floodlight fill lights
    const flood1 = new THREE.SpotLight("#fff8e0", 0.7, 30, Math.PI / 5, 0.3);
    flood1.position.set(-8, 8.2, -10);
    flood1.target.position.set(0, 0, -12);
    scene.add(flood1);
    scene.add(flood1.target);

    const flood2 = new THREE.SpotLight("#fff8e0", 0.7, 30, Math.PI / 5, 0.3);
    flood2.position.set(8, 8.2, -10);
    flood2.target.position.set(0, 0, -12);
    scene.add(flood2);
    scene.add(flood2.target);

    // ---- FITA TARGETS ----
    // Close interactive target (z=-6, scale 1.0)
    const targetGroup = buildFitaTarget(1.0);
    targetGroup.position.set(0, 1.4, -6);
    scene.add(targetGroup);

    // Mid scenery target (z=-14, scale 0.7)
    const midTarget = buildFitaTarget(0.7);
    midTarget.position.set(-2.5, 1.0, -14);
    scene.add(midTarget);

    // Far scenery target (z=-20, scale 0.4)
    const farTarget = buildFitaTarget(0.4);
    farTarget.position.set(2, 0.8, -20);
    scene.add(farTarget);

    // ---- BOW (decorative, left side) ----
    const bowGroup = new THREE.Group();
    const bowArcGeo = new THREE.TorusGeometry(0.55, 0.025, 8, 24, Math.PI);
    const bowMat = new THREE.MeshStandardMaterial({
      color: "#4a2f1a",
      roughness: 0.7,
      metalness: 0.2,
    });
    const bowArc = new THREE.Mesh(bowArcGeo, bowMat);
    bowGroup.add(bowArc);
    const strPoints = [
      new THREE.Vector3(0, -0.55, 0),
      new THREE.Vector3(-0.1, 0, 0),
      new THREE.Vector3(0, 0.55, 0),
    ];
    const strGeo = new THREE.BufferGeometry().setFromPoints(strPoints);
    const strMat = new THREE.LineBasicMaterial({ color: "#cccccc" });
    const bowString = new THREE.Line(strGeo, strMat);
    bowGroup.add(bowString);
    bowGroup.position.set(-3.2, 1.4, 5);
    bowGroup.rotation.z = Math.PI / 2;
    scene.add(bowGroup);

    // Arrow template geometries
    const arrowShaftGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.9, 6);
    const arrowHeadGeo = new THREE.ConeGeometry(0.045, 0.18, 6);
    const arrowMat = new THREE.MeshStandardMaterial({
      color: "#cc3300",
      emissive: "#aa2200",
      emissiveIntensity: 0.4,
    });

    const arrows: typeof sceneRef.current extends { arrows: infer A } | null
      ? A
      : never[] = [];

    sceneRef.current = {
      renderer,
      scene,
      camera,
      frameId: 0,
      target: targetGroup,
      arrows,
      startTime: Date.now(),
    };

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    resizeObserver.observe(container);
    {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    // Click / shoot handler
    const handleShoot = (clientX: number, clientY: number) => {
      if (!gameActiveRef.current) return;
      const ref = sceneRef.current;
      if (!ref) return;

      const rect = container.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;

      // Arrow shaft
      const shaftMesh = new THREE.Mesh(arrowShaftGeo.clone(), arrowMat.clone());
      const headMesh = new THREE.Mesh(arrowHeadGeo.clone(), arrowMat.clone());
      headMesh.position.y = 0.54;
      const arrowGroup = new THREE.Group() as unknown as THREE.Mesh;
      (arrowGroup as unknown as THREE.Group).add(shaftMesh);
      (arrowGroup as unknown as THREE.Group).add(headMesh);

      arrowGroup.position.set(-3.2, 1.4, 5);
      scene.add(arrowGroup);

      const targetWorldPos = new THREE.Vector3(0, 1.4, -6);
      const aimPos = new THREE.Vector3(
        targetWorldPos.x + x * 2.5,
        targetWorldPos.y + y * 1.5,
        targetWorldPos.z,
      );
      const dir = aimPos.clone().sub(arrowGroup.position).normalize();
      arrowGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

      // Trail
      const trailGeo = new THREE.BufferGeometry();
      const trailPositions = new Float32Array(60 * 3);
      trailGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(trailPositions, 3),
      );
      const trailMat = new THREE.PointsMaterial({
        color: "#ff6600",
        size: 0.06,
        transparent: true,
        opacity: 0.75,
      });
      const trail = new THREE.Points(trailGeo, trailMat);
      scene.add(trail);

      arrows.push({
        mesh: arrowGroup as unknown as THREE.Mesh,
        velocity: dir.multiplyScalar(0.35),
        active: true,
        trail,
        trailPositions: [],
      });
    };

    const handleClick = (e: MouseEvent) => handleShoot(e.clientX, e.clientY);
    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      if (t) handleShoot(t.clientX, t.clientY);
    };
    container.addEventListener("click", handleClick);
    container.addEventListener("touchstart", handleTouch, { passive: false });

    // Animation loop
    let prevTime = Date.now();
    const animate = () => {
      const ref = sceneRef.current;
      if (!ref) return;
      ref.frameId = requestAnimationFrame(animate);

      const now = Date.now();
      const dt = (now - prevTime) / 1000;
      prevTime = now;
      const t = (now - ref.startTime) / 1000;

      // Oscillate close target
      const speed = 0.4 + Math.min(scoreRef.current / 500, 0.9);
      ref.target.position.x = Math.sin(t * speed) * 2.2;

      // Bow bob
      bowGroup.position.y = 1.4 + Math.sin(t * 1.5) * 0.07;

      // Move arrows
      for (const arrow of ref.arrows) {
        if (!arrow.active) continue;

        arrow.trailPositions.unshift(
          arrow.mesh.position.x,
          arrow.mesh.position.y,
          arrow.mesh.position.z,
        );
        if (arrow.trailPositions.length > 180)
          arrow.trailPositions.length = 180;

        const posAttr = arrow.trail.geometry.getAttribute(
          "position",
        ) as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        const count = Math.min(arrow.trailPositions.length / 3, 60);
        for (let i = 0; i < count * 3; i++)
          arr[i] = arrow.trailPositions[i] ?? 0;
        posAttr.needsUpdate = true;
        (arrow.trail.geometry as THREE.BufferGeometry).setDrawRange(0, count);

        arrow.mesh.position.addScaledVector(arrow.velocity, 1);
        arrow.velocity.y -= 0.004;

        // Hit detection on close target
        const dist = arrow.mesh.position.distanceTo(ref.target.position);
        if (dist < 1.5 && arrow.mesh.position.z < ref.target.position.z + 0.5) {
          arrow.active = false;
          const dx = arrow.mesh.position.x - ref.target.position.x;
          const dy = arrow.mesh.position.y - ref.target.position.y;
          const radialDist = Math.sqrt(dx * dx + dy * dy);

          let pts = 0;
          let label = "";
          if (radialDist < 0.22) {
            pts = 100;
            label = "💫 BULLSEYE! +100";
          } else if (radialDist < 0.5) {
            pts = 70;
            label = "⭐ GREAT! +70";
          } else if (radialDist < 0.78) {
            pts = 40;
            label = "👍 GOOD +40";
          } else if (radialDist < 1.05) {
            pts = 20;
            label = "OK +20";
          } else {
            pts = 10;
            label = "+10";
          }

          scoreRef.current += pts;
          setScore(scoreRef.current);
          setHitText({ text: label, id: Date.now() });
          setTimeout(() => setHitText(null), 1000);
        }

        if (
          arrow.mesh.position.z < -25 ||
          arrow.mesh.position.y < -3 ||
          Math.abs(arrow.mesh.position.x) > 12
        ) {
          arrow.active = false;
          scene.remove(arrow.mesh);
          scene.remove(arrow.trail);
        }
      }

      for (const arrow of ref.arrows) {
        if (arrow.trail.material instanceof THREE.PointsMaterial) {
          arrow.trail.material.opacity = Math.max(
            0,
            arrow.trail.material.opacity - dt * 0.5,
          );
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      const ref = sceneRef.current;
      if (ref) cancelAnimationFrame(ref.frameId);
      resizeObserver.disconnect();
      container.removeEventListener("click", handleClick);
      container.removeEventListener("touchstart", handleTouch);
      renderer.dispose();
      if (container.contains(renderer.domElement))
        container.removeChild(renderer.domElement);
      sceneRef.current = null;
    };
  }, []);

  // Cleanup AI timer on unmount
  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearInterval(aiTimerRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Section title */}
      <div className="text-center">
        <h2
          style={{
            fontStyle: "italic",
            fontWeight: 900,
            color: "#00FFFF",
            letterSpacing: "0.12em",
            fontSize: "clamp(1.1rem, 3vw, 1.6rem)",
            textShadow: "0 0 24px rgba(0,255,255,0.5)",
          }}
        >
          PRECISION ARCHERY PRO 3D
        </h2>
        <p
          style={{
            color: "#888",
            fontStyle: "italic",
            fontSize: 13,
            marginTop: 4,
          }}
        >
          Click or tap to shoot — hit the bullseye for max points!
        </p>
      </div>

      {/* Game wrapper */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 1200,
          margin: "0 auto",
          aspectRatio: "16/9",
          background: "#87CEEB",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 0 40px rgba(0,255,255,0.15)",
          border: "1px solid rgba(0,255,255,0.2)",
        }}
      >
        {/* Three.js canvas container */}
        <div
          ref={containerRef}
          data-ocid="archery.canvas_target"
          style={{
            width: "100%",
            height: "100%",
            cursor: gameStarted && !gameOver ? "crosshair" : "default",
          }}
        />

        {/* ---- VS Mode overlay ---- */}
        {gameStarted && !gameOver && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              padding: "10px 14px",
              pointerEvents: "none",
            }}
          >
            {/* P1 */}
            <div
              style={{
                background: "rgba(0,10,30,0.72)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(0,255,255,0.3)",
                borderRadius: 10,
                padding: "8px 14px",
                minWidth: 90,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: "#00FFFF",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                }}
              >
                P1
              </div>
              <div
                style={{
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  marginTop: 1,
                }}
              >
                {playerName.toUpperCase()}
              </div>
              <div
                style={{
                  color: "#fff",
                  fontSize: 26,
                  fontWeight: 900,
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1.1,
                  marginTop: 2,
                }}
              >
                {String(score).padStart(4, "0")}
              </div>
            </div>

            {/* Center VS + timer */}
            <div style={{ textAlign: "center", paddingTop: 6 }}>
              <div
                style={{
                  color: "#FFD700",
                  fontSize: "clamp(1.4rem, 4vw, 2.2rem)",
                  fontWeight: 900,
                  fontStyle: "italic",
                  textShadow: "0 0 18px rgba(255,215,0,0.7)",
                  lineHeight: 1,
                }}
              >
                ✕
              </div>
              <div
                style={{
                  marginTop: 4,
                  background: "rgba(0,0,0,0.6)",
                  borderRadius: 6,
                  padding: "3px 10px",
                  color: timeLeft <= 10 ? "#FF003C" : "#fff",
                  fontSize: 14,
                  fontWeight: 900,
                  transition: "color 0.3s",
                }}
              >
                {timeLeft}s
              </div>
            </div>

            {/* P2 */}
            <div
              style={{
                background: "rgba(30,0,10,0.72)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,60,60,0.3)",
                borderRadius: 10,
                padding: "8px 14px",
                minWidth: 90,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: "#ff6b6b",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                }}
              >
                P2
              </div>
              <div
                style={{
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  marginTop: 1,
                }}
              >
                JENNIFER
              </div>
              <div
                style={{
                  color: "#fff",
                  fontSize: 26,
                  fontWeight: 900,
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1.1,
                  marginTop: 2,
                }}
              >
                {String(aiScore).padStart(4, "0")}
              </div>
            </div>
          </div>
        )}

        {/* Hit text popup */}
        {hitText && (
          <div
            key={hitText.id}
            style={{
              position: "absolute",
              top: "40%",
              left: "50%",
              transform: "translateX(-50%)",
              pointerEvents: "none",
              color: "#FFD700",
              fontSize: 20,
              fontWeight: 900,
              fontStyle: "italic",
              textShadow: "0 0 20px rgba(255,215,0,0.8)",
              animation: "floatUp 1s ease-out forwards",
            }}
          >
            {hitText.text}
          </div>
        )}

        {/* Start screen */}
        {!gameStarted && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(4px)",
              gap: 18,
            }}
          >
            <div
              style={{
                color: "#00FFFF",
                fontSize: "clamp(1.4rem, 5vw, 2.2rem)",
                fontWeight: 900,
                fontStyle: "italic",
                textShadow: "0 0 30px rgba(0,255,255,0.6)",
              }}
            >
              🎯 ARCHERY KING
            </div>
            <div
              style={{
                display: "flex",
                gap: 32,
                alignItems: "center",
                background: "rgba(0,0,0,0.5)",
                borderRadius: 12,
                padding: "14px 28px",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    color: "#00FFFF",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                  }}
                >
                  P1
                </div>
                <div
                  style={{
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 800,
                    marginTop: 2,
                  }}
                >
                  {playerName.toUpperCase()}
                </div>
              </div>
              <div
                style={{
                  color: "#FFD700",
                  fontSize: 24,
                  fontWeight: 900,
                  fontStyle: "italic",
                }}
              >
                VS
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    color: "#ff6b6b",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                  }}
                >
                  P2
                </div>
                <div
                  style={{
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 800,
                    marginTop: 2,
                  }}
                >
                  JENNIFER
                </div>
              </div>
            </div>
            <div
              style={{
                color: "#ccc",
                fontSize: 13,
                textAlign: "center",
                maxWidth: 280,
              }}
            >
              Click anywhere to shoot arrows at the moving FITA target.
              <br />
              Bullseye = 100 points! Best of luck!
            </div>
            <button
              type="button"
              onClick={startGame}
              data-ocid="archery.primary_button"
              style={{
                background: "linear-gradient(135deg, #00FFFF, #0088cc)",
                color: "#000",
                border: "none",
                borderRadius: 10,
                padding: "12px 40px",
                fontWeight: 900,
                fontSize: 15,
                cursor: "pointer",
                fontStyle: "italic",
                letterSpacing: "0.06em",
                boxShadow: "0 0 24px rgba(0,255,255,0.4)",
              }}
            >
              START MATCH
            </button>
          </div>
        )}

        {/* Game Over screen */}
        {gameOver && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.82)",
              backdropFilter: "blur(6px)",
              gap: 14,
            }}
          >
            <div
              style={{
                color: "#FFD700",
                fontSize: "clamp(1.3rem, 4vw, 2rem)",
                fontWeight: 900,
                fontStyle: "italic",
                textShadow: "0 0 24px rgba(255,215,0,0.6)",
              }}
            >
              MATCH OVER
            </div>

            {/* Final scores */}
            <div
              style={{
                display: "flex",
                gap: 32,
                alignItems: "center",
                background: "rgba(0,0,0,0.5)",
                borderRadius: 14,
                padding: "16px 32px",
                border: "1px solid rgba(255,215,0,0.25)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    color: "#00FFFF",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                  }}
                >
                  P1 — {playerName.toUpperCase()}
                </div>
                <div
                  style={{
                    color: "#00FFFF",
                    fontSize: 40,
                    fontWeight: 900,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {String(score).padStart(4, "0")}
                </div>
              </div>
              <div
                style={{
                  color: "#FFD700",
                  fontSize: 22,
                  fontWeight: 900,
                  fontStyle: "italic",
                }}
              >
                ✕
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    color: "#ff6b6b",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                  }}
                >
                  P2 — JENNIFER
                </div>
                <div
                  style={{
                    color: "#ff6b6b",
                    fontSize: 40,
                    fontWeight: 900,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {String(aiScore).padStart(4, "0")}
                </div>
              </div>
            </div>

            <div
              style={{
                color:
                  score > aiScore
                    ? "#50C878"
                    : score < aiScore
                      ? "#FF5F7A"
                      : "#ccc",
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              {score > aiScore
                ? "🏆 YOU WIN!"
                : score < aiScore
                  ? "😤 JENNIFER WINS!"
                  : "🤝 IT'S A DRAW!"}
            </div>

            <div
              style={{ color: "#888", fontSize: 11, letterSpacing: "0.1em" }}
            >
              PERSONAL BEST: {highScore}
            </div>
            {score >= highScore && score > 0 && (
              <div
                style={{
                  color: "#50C878",
                  fontSize: 13,
                  fontWeight: 700,
                  textShadow: "0 0 12px rgba(80,200,120,0.6)",
                }}
              >
                🎯 NEW HIGH SCORE!
              </div>
            )}

            <button
              type="button"
              onClick={startGame}
              data-ocid="archery.primary_button"
              style={{
                background: "linear-gradient(135deg, #50C878, #00aa44)",
                color: "#000",
                border: "none",
                borderRadius: 10,
                padding: "12px 40px",
                fontWeight: 900,
                fontSize: 15,
                cursor: "pointer",
                fontStyle: "italic",
                letterSpacing: "0.06em",
                boxShadow: "0 0 24px rgba(80,200,120,0.4)",
                marginTop: 4,
              }}
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>

      {/* Score stats below game */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 40,
          paddingTop: 8,
        }}
      >
        {(
          [
            {
              label: "YOUR SCORE",
              value: String(score).padStart(4, "0"),
              color: "#00FFFF",
            },
            {
              label: "BEST",
              value: String(highScore).padStart(4, "0"),
              color: "#FFD700",
            },
            {
              label: "TIME",
              value: `${timeLeft}s`,
              color: timeLeft <= 10 ? "#FF003C" : "#50C878",
            },
            {
              label: "AI SCORE",
              value: String(aiScore).padStart(4, "0"),
              color: "#ff6b6b",
            },
          ] as const
        ).map((item) => (
          <div key={item.label} style={{ textAlign: "center" }}>
            <div
              style={{
                color: item.color,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                color: "#fff",
                fontSize: 20,
                fontWeight: 900,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-60px); }
        }
      `}</style>
    </div>
  );
}
