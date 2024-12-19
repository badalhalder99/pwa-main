import  { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

interface Label {
  div: HTMLDivElement;
  point: THREE.Vector3;
}

export const ARMeasure = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isARSupported, setIsARSupported] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let camera: THREE.PerspectiveCamera;
    let scene: THREE.Scene;
    let renderer: THREE.WebGLRenderer;
    let controller: THREE.XRTargetRaySpace;
    let reticle: THREE.Mesh;
    let hitTestSource: XRHitTestSource | null = null;
    const hitTestSourceRequested = false;
    let currentLine: THREE.Line | null = null;
    const measurements: THREE.Vector3[] = [];
    const labels: Label[] = [];

    const init = async () => {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
      light.position.set(0.5, 1, 0.25);
      scene.add(light);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;

      if (containerRef.current) {
        containerRef.current.appendChild(renderer.domElement);
      }

      const button = ARButton.createButton(renderer, {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: containerRef.current as HTMLElement },
      });

      document.body.appendChild(button);

      controller = renderer.xr.getController(0);
      controller.addEventListener('select', onSelect);
      scene.add(controller);

      reticle = createReticle();
      scene.add(reticle);

      window.addEventListener('resize', onWindowResize, false);

      setIsARSupported(true);
      animate();
    };

    const createReticle = () => {
      const ring = new THREE.RingGeometry(0.045, 0.05, 32).rotateX(-Math.PI / 2);
      const dot = new THREE.CircleGeometry(0.005, 32).rotateX(-Math.PI / 2);
      const reticleMesh = new THREE.Mesh(
        mergeGeometries([ring, dot]),
        new THREE.MeshBasicMaterial()
      );
      reticleMesh.matrixAutoUpdate = false;
      reticleMesh.visible = false;
      return reticleMesh;
    };

    const createLine = (point: THREE.Vector3) => {
      const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 5,
        linecap: 'round',
      });

      const geometry = new THREE.BufferGeometry().setFromPoints([point, point]);
      return new THREE.Line(geometry, material);
    };

    const updateLine = (matrix: THREE.Matrix4) => {
      if (!currentLine) return;
      const positions = currentLine.geometry.attributes.position.array as Float32Array;
      positions[3] = matrix.elements[12];
      positions[4] = matrix.elements[13];
      positions[5] = matrix.elements[14];
      currentLine.geometry.attributes.position.needsUpdate = true;
      currentLine.geometry.computeBoundingSphere();
    };

    const onSelect = () => {
      if (!reticle.visible || !containerRef.current) return;

      const point = new THREE.Vector3();
      point.setFromMatrixPosition(reticle.matrix);
      measurements.push(point);

      if (measurements.length === 2) {
        const distance = Math.round(measurements[0].distanceTo(measurements[1]) * 100);
        const centerPoint = new THREE.Vector3().addVectors(measurements[0], measurements[1]).multiplyScalar(0.5);

        const label = document.createElement('div');
        label.className = 'label';
        label.textContent = `${distance} cm`;
        containerRef.current.appendChild(label);

        labels.push({ div: label, point: centerPoint });

        measurements.length = 0;
        currentLine = null;
      } else {
        currentLine = createLine(measurements[0]);
        scene.add(currentLine);
      }
    };

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const animate = () => {
      renderer.setAnimationLoop(render);
    };

    const render = (timestamp: number | null, frame: XRFrame | null) => {
      console.log(timestamp);

      if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const session: any = renderer.xr.getSession();

        if (session && !hitTestSourceRequested) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          session.requestReferenceSpace('viewer').then((refSpace: any) => {

            session
              .requestHitTestSource({ space: refSpace })
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .then((source: any) => {
                hitTestSource = source;
              })
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .catch((err: any) => console.error('Error requesting hit test source:', err));
          });
        }

        if (hitTestSource) {
          const hitTestResults = frame.getHitTestResults(hitTestSource);

          if (hitTestResults.length) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace!);

            if (pose) {
              reticle.visible = true;
              reticle.matrix.fromArray(pose.transform.matrix);
            }
          } else {
            reticle.visible = false;
          }

          if (currentLine) {
            updateLine(reticle.matrix);
          }
        }

        labels.forEach((label) => {
          const camera3D = renderer.xr.getCamera();
          const pos = label.point.clone().project(camera3D);
          const x = (pos.x + 1) * window.innerWidth / 2;
          const y = (-pos.y + 1) * window.innerHeight / 2;
          label.div.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
        });
      }

      renderer.render(scene, camera);
    };

    init();

    return () => {
      renderer?.dispose();
      scene?.clear();
      labels.forEach((label) => label.div.remove());
      const button = document.querySelector('button');
      button?.remove();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-screen relative">
      {!isARSupported && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 text-white text-center p-4">
          <p className="text-xl">WebXR is not supported on your device</p>
        </div>
      )}
    </div>
  );
};
