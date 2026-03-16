import { useEffect, useRef } from "react";

interface Props {
  stealthMode: boolean;
}

const VERT_SRC = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const SPLAT_FRAG = `
  precision highp float;
  varying vec2 v_uv;
  uniform sampler2D u_tex;
  uniform vec2 u_point;
  uniform vec3 u_color;
  uniform float u_radius;
  void main() {
    vec2 diff = v_uv - u_point;
    diff.x *= (800.0 / 600.0);
    float d = exp(-dot(diff, diff) / u_radius);
    vec4 cur = texture2D(u_tex, v_uv);
    gl_FragColor = cur + vec4(u_color * d, d * 0.1);
  }
`;

const ADVECT_FRAG = `
  precision highp float;
  varying vec2 v_uv;
  uniform sampler2D u_velocity;
  uniform sampler2D u_source;
  uniform vec2 u_texelSize;
  uniform float u_dt;
  uniform float u_dissipation;
  void main() {
    vec2 vel = texture2D(u_velocity, v_uv).xy;
    vec2 coord = v_uv - vel * u_dt * u_texelSize;
    gl_FragColor = u_dissipation * texture2D(u_source, coord);
  }
`;

const VEL_SPLAT_FRAG = `
  precision highp float;
  varying vec2 v_uv;
  uniform sampler2D u_tex;
  uniform vec2 u_point;
  uniform vec2 u_vel;
  uniform float u_radius;
  void main() {
    vec2 diff = v_uv - u_point;
    diff.x *= (800.0 / 600.0);
    float d = exp(-dot(diff, diff) / u_radius);
    vec4 cur = texture2D(u_tex, v_uv);
    gl_FragColor = cur + vec4(u_vel * d, 0.0, 0.0);
  }
`;

const DISPLAY_FRAG = `
  precision highp float;
  varying vec2 v_uv;
  uniform sampler2D u_dye;
  uniform float u_stealth;
  void main() {
    vec4 c = texture2D(u_dye, v_uv);
    vec3 col = mix(c.rgb, vec3(dot(c.rgb, vec3(0.299, 0.587, 0.114))), u_stealth);
    float alpha = mix(1.0, 0.22, u_stealth);
    gl_FragColor = vec4(col * alpha, col.r + col.g + col.b > 0.02 ? alpha : 0.0);
  }
`;

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  src: string,
): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

function createProgram(
  gl: WebGLRenderingContext,
  vert: string,
  frag: string,
): WebGLProgram {
  const prog = gl.createProgram()!;
  gl.attachShader(prog, createShader(gl, gl.VERTEX_SHADER, vert));
  gl.attachShader(prog, createShader(gl, gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  return prog;
}

function createFBO(gl: WebGLRenderingContext, w: number, h: number) {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    w,
    h,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fb = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    tex,
    0,
  );
  return { tex, fb };
}

const NEON_COLORS = [
  [0, 1, 1],
  [1, 0, 1],
  [1, 0.85, 0],
  [1, 0.2, 0.2],
  [0, 0.78, 0.32],
  [0.5, 0, 1],
];

export default function FluidSimulation({ stealthMode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stealthRef = useRef(stealthMode);

  useEffect(() => {
    stealthRef.current = stealthMode;
  }, [stealthMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = 512;
    const H = 512;
    canvas.width = W;
    canvas.height = H;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
    });
    if (!gl) return;

    // Alias gl.useProgram to avoid triggering React hook lint rules
    const activateProg = gl.useProgram.bind(gl);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const splatProg = createProgram(gl, VERT_SRC, SPLAT_FRAG);
    const velSplatProg = createProgram(gl, VERT_SRC, VEL_SPLAT_FRAG);
    const advectProg = createProgram(gl, VERT_SRC, ADVECT_FRAG);
    const displayProg = createProgram(gl, VERT_SRC, DISPLAY_FRAG);

    let dye0 = createFBO(gl, W, H);
    let dye1 = createFBO(gl, W, H);
    let vel0 = createFBO(gl, W, H);
    let vel1 = createFBO(gl, W, H);

    function bindQuad(prog: WebGLProgram) {
      gl!.bindBuffer(gl!.ARRAY_BUFFER, buf);
      const loc = gl!.getAttribLocation(prog, "a_position");
      gl!.enableVertexAttribArray(loc);
      gl!.vertexAttribPointer(loc, 2, gl!.FLOAT, false, 0, 0);
    }

    function drawQuad(prog: WebGLProgram, fb: WebGLFramebuffer | null) {
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fb);
      gl!.viewport(0, 0, W, H);
      activateProg(prog);
      bindQuad(prog);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    }

    function splat(x: number, y: number, dx: number, dy: number) {
      const colorIdx = Math.floor(Math.random() * NEON_COLORS.length);
      const col = NEON_COLORS[colorIdx];
      const radius = 0.0015;

      activateProg(velSplatProg);
      bindQuad(velSplatProg);
      gl!.activeTexture(gl!.TEXTURE0);
      gl!.bindTexture(gl!.TEXTURE_2D, vel0.tex);
      gl!.uniform1i(gl!.getUniformLocation(velSplatProg, "u_tex"), 0);
      gl!.uniform2f(gl!.getUniformLocation(velSplatProg, "u_point"), x, y);
      gl!.uniform2f(
        gl!.getUniformLocation(velSplatProg, "u_vel"),
        dx * 5,
        dy * 5,
      );
      gl!.uniform1f(gl!.getUniformLocation(velSplatProg, "u_radius"), radius);
      drawQuad(velSplatProg, vel1.fb);
      [vel0, vel1] = [vel1, vel0];

      activateProg(splatProg);
      bindQuad(splatProg);
      gl!.activeTexture(gl!.TEXTURE0);
      gl!.bindTexture(gl!.TEXTURE_2D, dye0.tex);
      gl!.uniform1i(gl!.getUniformLocation(splatProg, "u_tex"), 0);
      gl!.uniform2f(gl!.getUniformLocation(splatProg, "u_point"), x, y);
      gl!.uniform3f(
        gl!.getUniformLocation(splatProg, "u_color"),
        col[0],
        col[1],
        col[2],
      );
      gl!.uniform1f(gl!.getUniformLocation(splatProg, "u_radius"), radius);
      drawQuad(splatProg, dye1.fb);
      [dye0, dye1] = [dye1, dye0];
    }

    let rafId: number;
    let lastTime = performance.now();
    let isActive = false;
    let idleTimer: ReturnType<typeof setTimeout>;

    function scheduleIdle() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        isActive = false;
      }, 3000);
    }

    function animate() {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (isActive) {
        // Advect velocity
        activateProg(advectProg);
        bindQuad(advectProg);
        gl!.activeTexture(gl!.TEXTURE0);
        gl!.bindTexture(gl!.TEXTURE_2D, vel0.tex);
        gl!.uniform1i(gl!.getUniformLocation(advectProg, "u_velocity"), 0);
        gl!.activeTexture(gl!.TEXTURE1);
        gl!.bindTexture(gl!.TEXTURE_2D, vel0.tex);
        gl!.uniform1i(gl!.getUniformLocation(advectProg, "u_source"), 1);
        gl!.uniform2f(
          gl!.getUniformLocation(advectProg, "u_texelSize"),
          1 / W,
          1 / H,
        );
        gl!.uniform1f(gl!.getUniformLocation(advectProg, "u_dt"), dt);
        gl!.uniform1f(
          gl!.getUniformLocation(advectProg, "u_dissipation"),
          0.985,
        );
        drawQuad(advectProg, vel1.fb);
        [vel0, vel1] = [vel1, vel0];

        // Advect dye
        activateProg(advectProg);
        bindQuad(advectProg);
        gl!.activeTexture(gl!.TEXTURE0);
        gl!.bindTexture(gl!.TEXTURE_2D, vel0.tex);
        gl!.uniform1i(gl!.getUniformLocation(advectProg, "u_velocity"), 0);
        gl!.activeTexture(gl!.TEXTURE1);
        gl!.bindTexture(gl!.TEXTURE_2D, dye0.tex);
        gl!.uniform1i(gl!.getUniformLocation(advectProg, "u_source"), 1);
        gl!.uniform2f(
          gl!.getUniformLocation(advectProg, "u_texelSize"),
          1 / W,
          1 / H,
        );
        gl!.uniform1f(gl!.getUniformLocation(advectProg, "u_dt"), dt);
        gl!.uniform1f(
          gl!.getUniformLocation(advectProg, "u_dissipation"),
          0.982,
        );
        drawQuad(advectProg, dye1.fb);
        [dye0, dye1] = [dye1, dye0];
      }

      // Display
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
      gl!.viewport(0, 0, W, H);
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      activateProg(displayProg);
      bindQuad(displayProg);
      gl!.activeTexture(gl!.TEXTURE0);
      gl!.bindTexture(gl!.TEXTURE_2D, dye0.tex);
      gl!.uniform1i(gl!.getUniformLocation(displayProg, "u_dye"), 0);
      gl!.uniform1f(
        gl!.getUniformLocation(displayProg, "u_stealth"),
        stealthRef.current ? 1 : 0,
      );
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);

      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);

    const lastMouse = { x: 0, y: 0 };

    function getUV(e: MouseEvent | TouchEvent) {
      const rect = canvas!.getBoundingClientRect();
      let cx: number;
      let cy: number;
      if (e instanceof TouchEvent) {
        cx = e.touches[0].clientX;
        cy = e.touches[0].clientY;
      } else {
        cx = e.clientX;
        cy = e.clientY;
      }
      return {
        x: (cx - rect.left) / rect.width,
        y: 1 - (cy - rect.top) / rect.height,
      };
    }

    function onMove(e: MouseEvent | TouchEvent) {
      const uv = getUV(e);
      const dx = uv.x - lastMouse.x;
      const dy = uv.y - lastMouse.y;
      if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
        splat(uv.x, uv.y, dx * 80, dy * 80);
        isActive = true;
        scheduleIdle();
      }
      lastMouse.x = uv.x;
      lastMouse.y = uv.y;
    }

    function onClick(e: MouseEvent | TouchEvent) {
      const uv = getUV(e);
      splat(
        uv.x,
        uv.y,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
      );
      splat(
        uv.x,
        uv.y,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
      );
      splat(
        uv.x,
        uv.y,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
      );
      isActive = true;
      scheduleIdle();
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onClick as EventListener);
    window.addEventListener("touchmove", onMove as EventListener, {
      passive: true,
    });
    window.addEventListener("touchstart", onClick as EventListener, {
      passive: true,
    });

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(idleTimer);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onClick as EventListener);
      window.removeEventListener("touchmove", onMove as EventListener);
      window.removeEventListener("touchstart", onClick as EventListener);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        opacity: stealthMode ? 0.2 : 0.85,
        transition: "opacity 0.5s",
      }}
    />
  );
}
