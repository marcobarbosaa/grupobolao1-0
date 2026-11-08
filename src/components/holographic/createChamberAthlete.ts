import * as THREE from "three";
import type { LoadedPlayerAsset } from "./usePlayerAssets";

export function createChamberResources(renderer: THREE.WebGLRenderer) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Map<string, THREE.Texture>();
  return {
    mesh<G extends THREE.BufferGeometry, M extends THREE.Material>(geometry: G, material: M) {
      geometries.add(geometry);
      materials.add(material);
      return new THREE.Mesh(geometry, material);
    },
    release(geometry: THREE.BufferGeometry) {
      geometries.delete(geometry);
      geometry.dispose();
    },
    texture(asset: LoadedPlayerAsset) {
      let texture = textures.get(asset.src);
      if (!texture) {
        texture = new THREE.Texture(asset.image);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        textures.set(asset.src, texture);
      }
      return texture;
    },
    dispose() {
      geometries.forEach((item) => item.dispose());
      materials.forEach((item) => item.dispose());
      textures.forEach((item) => item.dispose());
      geometries.clear();
      materials.clear();
      textures.clear();
    },
  };
}
export type ChamberResources = ReturnType<typeof createChamberResources>;

/** A reusable, physical podium; the actor and its podium travel as one world-space node. */
export function createChamberPlatform(resources: ChamberResources) {
  const group = new THREE.Group();
  const base = resources.mesh(
    new THREE.CylinderGeometry(1.29, 1.39, 0.22, 80),
    new THREE.MeshStandardMaterial({ color: "#242830", roughness: 0.48, metalness: 0.75 }),
  );
  base.position.y = 0.11;
  const top = resources.mesh(
    new THREE.CylinderGeometry(1.26, 1.28, 0.035, 80),
    new THREE.MeshStandardMaterial({ color: "#15191f", roughness: 0.7, metalness: 0.3 }),
  );
  top.position.y = 0.235;
  const rim = resources.mesh(
    new THREE.TorusGeometry(1.32, 0.009, 6, 80),
    new THREE.MeshBasicMaterial({ color: "#c7a66a", transparent: true, opacity: 0.35 }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.16;
  group.add(base, top, rim);
  for (const angle of [-Math.PI / 2, Math.PI / 2, Math.PI]) {
    const inset = resources.mesh(
      new THREE.TorusGeometry(1.345, 0.014, 6, 24, 0.34),
      new THREE.MeshBasicMaterial({ color: "#e34b3d" }),
    );
    inset.rotation.set(Math.PI / 2, 0, angle);
    inset.position.y = 0.08;
    group.add(inset);
  }
  const shadow = resources.mesh(
    new THREE.CircleGeometry(0.65, 40),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexShader: `varying vec2 point; void main() { point = uv - 0.5;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec2 point; void main() {
        gl_FragColor = vec4(0.0, 0.0, 0.0, (1.0 - smoothstep(0.05, 0.5, length(point))) * 0.8); }`,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.y = 0.55;
  shadow.position.set(0, 0.257, 0.05);
  group.add(shadow);
  return { group, rim };
}

export function createChamberAthlete(id: string, resources: ChamberResources) {
  const platform = createChamberPlatform(resources);
  const group = platform.group;
  group.name = `athlete-${id}`;
  const actor = new THREE.Group();
  actor.position.y = 0.26;
  group.add(actor);
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false });
  const edgeMaterial = new THREE.MeshBasicMaterial({
    color: "#c7a66a",
    transparent: true,
    opacity: 0.03,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const projectionMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { time: { value: 0 }, emphasis: { value: 0 } },
    vertexShader: `varying float height; void main() { height = position.y;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying float height; uniform float time; uniform float emphasis;
      void main() {
        float sweep = 1.0 - smoothstep(0.0, 0.035, abs(height - time * 3.4));
        gl_FragColor = vec4(0.65, 0.8, 0.8, sweep * 0.035 * emphasis);
      }`,
  });
  let body: THREE.Mesh | undefined;
  let loaded: LoadedPlayerAsset | undefined;
  const contour: THREE.Vector3[] = [];
  return {
    id,
    group,
    actor,
    contour,
    from: new THREE.Vector3(),
    destination: new THREE.Vector3(),
    emphasis: 0,
    setAsset(asset: LoadedPlayerAsset) {
      if (!asset.view || loaded === asset) return;
      loaded = asset;
      const view = asset.view;
      const scale = 3.4 / (view.bottom - view.top);
      const points = view.outline.map(
        ([x, y]) => new THREE.Vector2((x - view.center) * scale, (view.bottom - y) * scale),
      );
      const geometry = new THREE.ShapeGeometry(new THREE.Shape(points));
      const positions = geometry.getAttribute("position");
      const uv = geometry.getAttribute("uv");
      for (let i = 0; i < positions.count; i++) {
        uv.setXY(
          i,
          (positions.getX(i) / scale + view.center) / view.width,
          1 - (view.bottom - positions.getY(i) / scale) / view.height,
        );
      }
      uv.needsUpdate = true;
      if (body) resources.release(body.geometry);
      actor.clear();
      material.map = resources.texture(asset);
      material.needsUpdate = true;
      body = resources.mesh(geometry, material);
      const edge = resources.mesh(geometry, edgeMaterial);
      edge.scale.set(1.012, 1.002, 1);
      edge.position.z = -0.012;
      const projection = resources.mesh(geometry, projectionMaterial);
      projection.position.z = 0.003;
      actor.add(edge, body, projection);
      contour.length = 0;
      points.forEach((point) => contour.push(new THREE.Vector3(point.x, point.y, 0)));
    },
    update(emphasis: number, entrance: number) {
      platform.rim.material.opacity = 0.24 + emphasis * 0.38;
      edgeMaterial.opacity = 0.02 + emphasis * 0.09;
      projectionMaterial.uniforms.emphasis.value = emphasis;
      projectionMaterial.uniforms.time.value = entrance;
    },
  };
}
