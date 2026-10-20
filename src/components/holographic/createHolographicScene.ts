import * as THREE from "three";
import { chamberEase, chamberSlot, CHAMBER_MOTION } from "../../lib/chamber-layout";
import type { LoadedPlayerAsset } from "./usePlayerAssets";
import { createChamberAthlete, createChamberResources } from "./createChamberAthlete";

export interface HolographicScene {
  setRoster: (ids: string[], selectedIndex: number) => void;
  setAsset: (id: string, asset: LoadedPlayerAsset) => void;
  setHovered: (hovered: boolean) => void;
  setOpening: (opening: boolean) => void;
  setPointer: (x: number, y: number) => void;
  inspect: () => {
    selectedId: string;
    camera: number[];
    nodes: { id: string; position: number[] }[];
  };
  dispose: () => void;
}

/** One persistent environment, real spatial slots, and fixed photographic silhouettes. */
export function createHolographicScene(
  host: HTMLDivElement,
  onFailure: () => void,
  hitTarget: HTMLAnchorElement,
): HolographicScene {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
    failIfMajorPerformanceCaveat: true,
  });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 70);
  const resources = createChamberResources(renderer);
  const nodes = new Map<string, ReturnType<typeof createChamberAthlete>>();
  let ids: string[] = [];
  let selectedIndex = 0;
  let frame = 0,
    lastFrame = 0,
    elapsed = 0,
    transition = 0;
  let disposed = false,
    visible = true,
    hovered = false,
    opening = false;
  let pointerX = 0,
    pointerY = 0,
    openingAmount = 0,
    travelDirection = 0;
  let resize: ResizeObserver | undefined;
  let intersection: IntersectionObserver | undefined;
  const projected = new THREE.Vector3();
  const look = new THREE.Vector3(0, 1.92, 0);
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
    resources.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    nodes.clear();
  };
  function start() {
    if (!frame && !disposed && visible && !document.hidden) {
      lastFrame = 0;
      frame = requestAnimationFrame(render);
    }
  }
  // Project the actual concave silhouette into the native link's clip path. Browser
  // hit testing excludes the empty space between legs/arms, even while the camera moves.
  function alignHitTarget() {
    const node = nodes.get(ids[selectedIndex]);
    if (!node?.contour.length) return;
    const points = node.contour.map((point) => {
      projected.copy(point).applyMatrix4(node.actor.matrixWorld).project(camera);
      return [
        (projected.x * 0.5 + 0.5) * host.clientWidth,
        (0.5 - projected.y * 0.5) * host.clientHeight,
      ];
    });
    const left = Math.min(...points.map(([x]) => x));
    const top = Math.min(...points.map(([, y]) => y));
    const width = Math.max(...points.map(([x]) => x)) - left;
    const height = Math.max(...points.map(([, y]) => y)) - top;
    hitTarget.style.inset = "auto";
    hitTarget.style.left = `${left}px`;
    hitTarget.style.top = `${top}px`;
    hitTarget.style.width = `${width}px`;
    hitTarget.style.height = `${height}px`;
    hitTarget.style.clipPath = `polygon(${points.map(([x, y]) => `${x - left}px ${y - top}px`).join(",")})`;
  }
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
    transition += dt;
    const entrance = chamberEase(elapsed / CHAMBER_MOTION.entrance);
    const progress = chamberEase(transition / CHAMBER_MOTION.selection);
    openingAmount = THREE.MathUtils.damp(openingAmount, opening ? 1 : 0, 12, dt);
    nodes.forEach((node, id) => {
      node.group.position.lerpVectors(node.from, node.destination, progress);
      node.emphasis = THREE.MathUtils.damp(
        node.emphasis,
        id === ids[selectedIndex] ? (hovered ? 1 : 0.4) : 0,
        8,
        dt,
      );
      node.update(node.emphasis, elapsed / CHAMBER_MOTION.entrance);
    });
    // Limited lateral travel exposes the room's perspective without orbiting a flat body.
    const cameraTravel =
      Math.sin(Math.min(1, transition / CHAMBER_MOTION.selection) * Math.PI) *
      travelDirection *
      0.48;
    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      pointerX * 0.52 + cameraTravel + (1 - entrance) * 0.7,
      5,
      dt,
    );
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      2.35 + pointerY * 0.14 + (1 - entrance) * 0.25,
      5,
      dt,
    );
    const distance = camera.aspect < 0.65 ? 8.15 : 7.35;
    camera.position.z = distance + (1 - entrance) * 1.15 - openingAmount * 0.65;
    look.set(cameraTravel * 0.2, 1.92 + openingAmount * 0.12, 0);
    camera.lookAt(look);
    try {
      renderer.render(scene, camera);
      alignHitTarget();
    } catch {
      stop();
      onFailure();
    }
  }
  try {
    renderer.setClearColor(0x0b0d11, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    camera.position.set(0.7, 2.6, 8.5);
    camera.lookAt(look);
    scene.fog = new THREE.FogExp2("#0b0d11", 0.048);
    scene.add(new THREE.HemisphereLight("#d4d0cb", "#13161c", 1.6));
    const key = new THREE.SpotLight("#f1e4d3", 100, 22, 0.65, 0.85, 2);
    key.position.set(-3, 7, 4);
    scene.add(key);
    const fill = new THREE.PointLight("#c7a66a", 22, 12, 2);
    fill.position.set(3, 4, -2);
    scene.add(fill);
    const red = new THREE.PointLight("#e34b3d", 3, 8, 2);
    red.position.set(-3, 0.6, -1);
    scene.add(red);
    const floor = resources.mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ color: "#101319", roughness: 0.75, metalness: 0.48 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.03;
    scene.add(floor);
    for (const radius of [1.65, 2.45, 5.6, 8.5]) {
      const ring = resources.mesh(
        new THREE.RingGeometry(radius, radius + 0.009, 120),
        new THREE.MeshBasicMaterial({
          color: "#78716a",
          transparent: true,
          opacity: radius < 3 ? 0.23 : 0.12,
          side: THREE.DoubleSide,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.018;
      scene.add(ring);
    }
    // Arena terraces, dark structural bays and overhead light strips establish scale.
    const metal = new THREE.MeshStandardMaterial({
      color: "#20242c",
      roughness: 0.6,
      metalness: 0.6,
    });
    for (let row = 0; row < 4; row++) {
      const tier = resources.mesh(new THREE.BoxGeometry(30, 0.23, 0.85), metal);
      tier.position.set(0, row * 0.24, -5.4 - row * 1.05);
      scene.add(tier);
      const line = resources.mesh(
        new THREE.BoxGeometry(30, 0.012, 0.015),
        new THREE.MeshBasicMaterial({ color: "#c7a66a", transparent: true, opacity: 0.09 }),
      );
      line.position.set(0, row * 0.24 + 0.12, -4.97 - row * 1.05);
      scene.add(line);
    }
    for (const x of [-9, -6, -3.6, 3.6, 6, 9]) {
      const column = resources.mesh(new THREE.BoxGeometry(0.18, 7, 0.35), metal);
      column.position.set(x, 3.5, -6.5);
      scene.add(column);
      const light = resources.mesh(
        new THREE.BoxGeometry(0.025, 3.4, 0.025),
        new THREE.MeshBasicMaterial({ color: "#b4b6b6", transparent: true, opacity: 0.28 }),
      );
      light.position.set(x - Math.sign(x) * 0.11, 3.8, -6.3);
      scene.add(light);
    }
    for (const side of [-1, 1]) {
      const rail = resources.mesh(new THREE.BoxGeometry(0.07, 0.06, 15), metal);
      rail.position.set(side * 3.8, 4.6, -2.5);
      scene.add(rail);
      for (let i = 0; i < 3; i++) {
        const strip = resources.mesh(
          new THREE.BoxGeometry(1.8, 0.035, 0.14),
          new THREE.MeshBasicMaterial({
            color: "#f1efe9",
            transparent: true,
            opacity: 0.65 - i * 0.12,
          }),
        );
        strip.position.set(side * 3.1, 4.4, -1.5 - i * 2.6);
        scene.add(strip);
      }
      const lane = resources.mesh(
        new THREE.BoxGeometry(0.035, 0.004, 12),
        new THREE.MeshBasicMaterial({ color: "#e34b3d", transparent: true, opacity: 0.16 }),
      );
      lane.position.set(side * 3.4, -0.015, 0);
      scene.add(lane);
    }
    resize = new ResizeObserver(() => {
      const width = host.clientWidth,
        height = host.clientHeight;
      if (!width || !height) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 600 ? 1.25 : 1.75));
      renderer.setSize(width, height);
      camera.aspect = width / height;
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
      setRoster(nextIds, nextIndex) {
        if (disposed) return;
        if (
          selectedIndex === nextIndex &&
          ids.length === nextIds.length &&
          ids.every((id, i) => id === nextIds[i])
        )
          return;
        const initial = ids.length === 0;
        travelDirection = Math.sign(nextIndex - selectedIndex);
        ids = [...nextIds];
        selectedIndex = nextIndex;
        transition = 0;
        nodes.forEach((node, id) => {
          if (!ids.includes(id)) {
            scene.remove(node.group);
            nodes.delete(id);
          }
        });
        ids.forEach((id, index) => {
          let node = nodes.get(id);
          const slot = chamberSlot(index, selectedIndex);
          if (!node) {
            node = createChamberAthlete(id, resources);
            node.group.position.set(
              slot.x + (initial ? 0.8 : 0),
              slot.y,
              slot.z - (initial ? 1.3 : 0),
            );
            nodes.set(id, node);
            scene.add(node.group);
          }
          node.from.copy(node.group.position);
          node.destination.set(slot.x, slot.y, slot.z);
        });
      },
      setAsset(id, asset) {
        if (!disposed) nodes.get(id)?.setAsset(asset);
      },
      setHovered(value) {
        hovered = value;
      },
      setOpening(value) {
        opening = value;
      },
      setPointer(x, y) {
        pointerX = THREE.MathUtils.clamp(x, -1, 1);
        pointerY = THREE.MathUtils.clamp(y, -1, 1);
      },
      inspect() {
        return {
          selectedId: ids[selectedIndex],
          camera: camera.position.toArray(),
          nodes: [...nodes.values()].map((node) => ({
            id: node.id,
            position: node.group.position.toArray(),
          })),
        };
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
