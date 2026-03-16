import { useEffect, useRef } from "react";
import * as THREE from "three";

interface HeroCubeProps {
  glitching: boolean;
}

export default function HeroCube({ glitching }: HeroCubeProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const glitchingRef = useRef(glitching);

  useEffect(() => {
    glitchingRef.current = glitching;
  }, [glitching]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const handleResize = () => {
      if (!mount) return;
      const size = mount.clientWidth;
      renderer.setSize(size, size);
      camera.updateProjectionMatrix();
    };
    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);

    // Geometry
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x003333,
      metalness: 0.8,
      roughness: 0.2,
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Wireframe edges
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6,
    });
    const wireframe = new THREE.LineSegments(edges, lineMat);
    cube.add(wireframe);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x050a30, 2);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x00ffff, 10, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);
    const pointLight2 = new THREE.PointLight(0x0044ff, 5, 30);
    pointLight2.position.set(-5, -3, 3);
    scene.add(pointLight2);

    // Mouse tilt
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      const half = rect.width / 2;
      mouseX = ((e.clientX - rect.left - half) / half) * 0.4;
      mouseY = ((e.clientY - rect.top - half) / half) * 0.4;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Animation
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      if (glitchingRef.current) {
        material.color.setHex(0xff0040);
        material.emissive.setHex(0x330010);
        lineMat.color.setHex(0xff0040);
        cube.position.x = (Math.random() - 0.5) * 0.25;
        cube.position.y = (Math.random() - 0.5) * 0.25;
        cube.position.z = (Math.random() - 0.5) * 0.1;
      } else {
        // Iridescent: cycle Purple(~300°) → Blue(~240°) → Cyan(~180°)
        const t = Date.now() * 0.001;
        const hue = 0.5 + 0.17 * Math.sin(t * 0.3); // 0.33..0.67 → Cyan to Purple
        material.color.setHSL(hue, 1.0, 0.55);
        material.emissive.setHSL(hue, 0.8, 0.08);
        lineMat.color.setHSL(hue, 1.0, 0.65);
        cube.position.x *= 0.9;
        cube.position.y *= 0.9;
        cube.position.z = 0;
        // 60 BPM pulse: Math.PI*2 rad/s ≈ 1s cycle
        const pulse = 1.0 + 0.03 * Math.sin(t * Math.PI * 2);
        cube.scale.set(pulse, pulse, pulse);
      }

      cube.rotation.y += 0.008 + mouseX * 0.008;
      cube.rotation.x += 0.004 + mouseY * 0.005;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", handleMouseMove);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      edges.dispose();
      lineMat.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-ocid="hero.cube.canvas"
      style={{
        width: "100%",
        maxWidth: 480,
        aspectRatio: "1",
        minHeight: 300,
        margin: "0 auto",
      }}
      className={glitching ? "glitch-active" : ""}
    />
  );
}
