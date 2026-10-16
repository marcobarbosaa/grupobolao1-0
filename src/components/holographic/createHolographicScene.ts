import * as THREE from "three";
import type { LoadedPlayerAsset } from "./usePlayerAssets";

export interface HolographicScene {
  setAsset: (asset: LoadedPlayerAsset) => void;
  setHovered: (hovered: boolean) => void;
  setPointer: (x: number, y: number) => void;
  dispose: () => void;
}

/** Real 3D stage + camera-facing, silhouette-shaped image mesh (not a body model). */
export function createHolographicScene(
  host: HTMLDivElement,
  onFailure: () => void,
): HolographicScene {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
    failIfMajorPerformanceCaveat: true,
  });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  const geometry = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Map<string, THREE.Texture>();
  let frame = 0;
  let disposed = false;
  let visible = true;
  let hovered = false;
  let pointerX = 0;
  let pointerY = 0;
  let emphasis = 0;
  let lastFrame = 0;
  let elapsed = 0;
  let resize: ResizeObserver | undefined;
  let intersection: IntersectionObserver | undefined;
  const actor = new THREE.Group();
  const actorMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false });
  const projectionMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { time: { value: 0 }, emphasis: { value: 0 } },
    vertexShader: `varying float height; void main() {
      height = position.y;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
    fragmentShader: `varying float height; uniform float time; uniform float emphasis;
      void main() {
        float lines = smoothstep(0.92, 1.0, sin(height * 185.0));
        float sweep = 1.0 - smoothstep(0.0, 0.055, abs(height - mod(time * 0.28, 3.6)));
        gl_FragColor = vec4(0.48, 0.72, 0.74, lines * 0.025 + sweep * (0.035 + emphasis * 0.06));
      }`,
  });
  const edgeMaterial = new THREE.MeshBasicMaterial({
    color: "#73b6be",
    transparent: true,
    opacity: 0.06,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  materials.add(actorMaterial);
  materials.add(projectionMaterial);
  materials.add(edgeMaterial);
  let body: THREE.Mesh | undefined;
  let edge: THREE.Mesh | undefined;
  let projection: THREE.Mesh | undefined;
  const trackMesh = <G extends THREE.BufferGeometry, M extends THREE.Material>(g: G, m: M) => {
    geometry.add(g);
    materials.add(m);
    return new THREE.Mesh(g, m);
  };
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
  };
  const contextLost = (event: Event) => {
    event.preventDefault();
    stop();
    onFailure();
  };
  const visibility = () => {
    if (document.hidden) stop();
    else start();
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    stop();
    resize?.disconnect();
    intersection?.disconnect();
    document.removeEventListener("visibilitychange", visibility);
    renderer.domElement.removeEventListener("webglcontextlost", contextLost);
    geometry.forEach((item) => item.dispose());
    materials.forEach((item) => item.dispose());
    textures.forEach((item) => item.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
  function start() {
    if (!frame && !disposed && visible && !document.hidden) {
      lastFrame = 0;
      frame = requestAnimationFrame(render);
    }
  }
  let rim: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  function render(now: number) {
    if (disposed || !visible || document.hidden) {
      frame = 0;
      return;
    }
    frame = requestAnimationFrame(render);
    if (lastFrame && now - lastFrame < 1000 / 30) return;
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) : 1 / 30;
    lastFrame = now;
    elapsed += dt;
    projectionMaterial.uniforms.time.value = elapsed;
    projectionMaterial.uniforms.emphasis.value = emphasis;
    emphasis = THREE.MathUtils.damp(emphasis, hovered ? 1 : 0, 6, dt);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointerX * 0.22, 3, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 2.65 + pointerY * 0.08, 3, dt);
    camera.lookAt(0, 1.76, 0);
    actor.rotation.y = Math.atan2(camera.position.x, camera.position.z);
    actor.position.y = 0.17 + Math.sin(elapsed * 0.95) * 0.009;
    edgeMaterial.opacity = 0.035 + emphasis * 0.2;
    rim.material.opacity = 0.64 + Math.sin(elapsed * 1.2) * 0.09 + emphasis * 0.18;
    try {
      renderer.render(scene, camera);
    } catch {
      stop();
      onFailure();
    }
  }
  try {
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, host.clientWidth < 600 ? 1.25 : 1.75),
    );
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    camera.position.set(0, 2.65, 8.4);
    camera.lookAt(0, 1.76, 0);
    scene.fog = new THREE.FogExp2("#0b0d11", 0.045);
    scene.add(new THREE.HemisphereLight("#c7d0dd", "#121318", 2.4));
    const key = new THREE.SpotLight("#efdbcb", 65, 18, 0.6, 0.8, 2);
    key.position.set(-2, 6, 3);
    scene.add(key);
    const red = new THREE.PointLight("#e34b3d", 12, 7, 2);
    red.position.set(0, 0.7, -1.1);
    scene.add(red);
    const platform = trackMesh(
      new THREE.CylinderGeometry(1.35, 1.42, 0.16, 96),
      new THREE.MeshStandardMaterial({ color: "#252930", roughness: 0.55, metalness: 0.7 }),
    );
    platform.position.y = 0.06;
    scene.add(platform);
    const top = trackMesh(
      new THREE.CircleGeometry(1.27, 96),
      new THREE.MeshStandardMaterial({ color: "#15191e", roughness: 0.72, metalness: 0.35 }),
    );
    top.rotation.x = -Math.PI / 2;
    top.position.y = 0.145;
    scene.add(top);
    rim = trackMesh(
      new THREE.TorusGeometry(1.35, 0.012, 8, 96),
      new THREE.MeshBasicMaterial({ color: "#e34b3d", transparent: true, opacity: 0.8 }),
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.105;
    scene.add(rim);
    for (const radius of [1.19, 1.62, 2.25, 3.4]) {
      const ring = trackMesh(
        new THREE.RingGeometry(radius, radius + 0.008, 96),
        new THREE.MeshBasicMaterial({
          color: radius < 1.3 ? "#64636a" : "#393c43",
          transparent: true,
          opacity: 0.48,
          side: THREE.DoubleSide,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = radius < 1.3 ? 0.15 : -0.03;
      scene.add(ring);
    }
    const tickGeometry = new THREE.BoxGeometry(0.008, 0.005, 0.06);
    geometry.add(tickGeometry);
    const tickMaterial = new THREE.MeshBasicMaterial({ color: "#5a5050" });
    materials.add(tickMaterial);
    for (let i = 0; i < 60; i++) {
      const theta = (i / 60) * Math.PI * 2;
      const tick = new THREE.Mesh(tickGeometry, tickMaterial);
      tick.position.set(Math.sin(theta) * 1.53, -0.02, Math.cos(theta) * 1.53);
      tick.rotation.y = theta;
      scene.add(tick);
    }
    // Sparse, fixed stage lights. No particle system or postprocessing passes.
    for (const x of [-2.7, 2.7]) {
      const light = trackMesh(
        new THREE.BoxGeometry(0.012, 3.3, 0.012),
        new THREE.MeshBasicMaterial({ color: "#e34b3d", transparent: true, opacity: 0.17 }),
      );
      light.position.set(x, 1.65, -1.7);
      scene.add(light);
    }
    const shadow = trackMesh(
      new THREE.CircleGeometry(0.65, 48),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        vertexShader: `varying vec2 point; void main() { point = uv - 0.5;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `varying vec2 point; void main() {
        gl_FragColor = vec4(0.015, 0.018, 0.025, (1.0 - smoothstep(0.05, 0.5, length(point))) * 0.5); }`,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.y = 0.5;
    shadow.position.set(0, 0.152, 0.04);
    scene.add(shadow);
    scene.add(actor);
    resize = new ResizeObserver(() => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      // Keep the whole platform inside narrow phones without shrinking the athlete excessively.
      camera.position.z = camera.aspect < 0.75 ? 9.1 : 8.4;
      camera.updateProjectionMatrix();
    });
    resize.observe(host);
    intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    intersection.observe(host);
    document.addEventListener("visibilitychange", visibility);
    start();
    return {
      setAsset(asset) {
        if (disposed || !asset.view) return;
        const view = asset.view;
        let texture = textures.get(asset.src);
        if (!texture) {
          texture = new THREE.Texture(asset.image);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.needsUpdate = true;
          texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
          textures.set(asset.src, texture);
        }
        const scale = 3.4 / (view.bottom - view.top);
        const shape = new THREE.Shape(
          view.outline.map(
            ([x, y]) => new THREE.Vector2((x - view.center) * scale, (view.bottom - y) * scale),
          ),
        );
        const meshGeometry = new THREE.ShapeGeometry(shape);
        const positions = meshGeometry.getAttribute("position");
        const uv = meshGeometry.getAttribute("uv");
        for (let i = 0; i < positions.count; i++) {
          uv.setXY(
            i,
            (positions.getX(i) / scale + view.center) / view.width,
            1 - (view.bottom - positions.getY(i) / scale) / view.height,
          );
        }
        uv.needsUpdate = true;
        geometry.add(meshGeometry);
        if (body) {
          actor.remove(body);
          geometry.delete(body.geometry);
          body.geometry.dispose();
        }
        if (edge) actor.remove(edge);
        if (projection) actor.remove(projection);
        actorMaterial.map = texture;
        actorMaterial.needsUpdate = true;
        body = new THREE.Mesh(meshGeometry, actorMaterial);
        edge = new THREE.Mesh(meshGeometry, edgeMaterial);
        edge.scale.set(1.025, 1.005, 1);
        edge.position.z = -0.018;
        projection = new THREE.Mesh(meshGeometry, projectionMaterial);
        projection.position.z = 0.003;
        actor.add(edge, body, projection);
      },
      setHovered(value) {
        hovered = value;
      },
      setPointer(x, y) {
        pointerX = x;
        pointerY = y;
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
