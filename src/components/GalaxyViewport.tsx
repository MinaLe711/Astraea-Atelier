import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {
  CameraPreset,
  ModelPose,
  OutfitConfig,
  PetReaction,
  PetState,
  SparkleBurstEvent,
} from '../types/atelier';
import {
  buildCosmicPetRig,
  buildFashionModelRig,
  buildGalaxyStageRig,
  CosmicPetRig,
  createBurstParticlePool,
  FashionModelRig,
  MODEL_BURST_ORIGIN,
  PET_BURST_ORIGIN,
  RUNWAY_FLASH_ORIGIN,
} from '../three/models';
import { createAmbientSparkleField, createGalaxySkyboxMaterial } from '../three/shaders';

interface GalaxyViewportProps {
  outfit: OutfitConfig;
  pet: PetState;
  pose: ModelPose;
  cameraPreset: CameraPreset;
  runwayProgress: number;
  petReactionSignal: { id: number; reaction: PetReaction } | null;
  sparkleBurstSignal: SparkleBurstEvent | null;
  onModelClick: () => void;
  onPetClick: () => void;
  onRegisterSnapshot?: (captureFn: () => string | null) => void;
}

const CAMERA_TARGETS: Record<CameraPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
  'studio-center': { pos: [0.15, 1.48, 3.65], target: [-0.22, 0.96, 0.08] },
  'studio-offset': { pos: [0.58, 1.44, 4.15], target: [-0.95, 0.92, 0.1] },
  'closeup-face': { pos: [0.08, 1.64, 1.08], target: [0, 1.58, 0.04] },
  'closeup-garment': { pos: [0.12, 1.32, 2.1], target: [0, 1.12, 0] },
  'closeup-pet': { pos: [-0.6, 0.78, 1.85], target: [-1.12, 0.36, 0.42] },
  'runway-low': { pos: [1.35, 0.92, 4.15], target: [-0.1, 1.05, 0.35] },
};

const _rayMouse = new THREE.Vector2();
const _targetCamPos = new THREE.Vector3();
const _targetCamLook = new THREE.Vector3();

export const GalaxyViewport: React.FC<GalaxyViewportProps> = ({
  outfit,
  pet,
  pose,
  cameraPreset,
  runwayProgress,
  petReactionSignal,
  sparkleBurstSignal,
  onModelClick,
  onPetClick,
  onRegisterSnapshot,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  // Mutable refs so React updates never rebuild the WebGL scene
  const poseRef = useRef<ModelPose>(pose);
  const runwayProgressRef = useRef<number>(runwayProgress);
  const outfitRef = useRef<OutfitConfig>(outfit);
  const petRef = useRef<PetState>(pet);
  const cameraPresetRef = useRef<CameraPreset>(cameraPreset);
  const transitioningCamRef = useRef<boolean>(true);
  const callbacksRef = useRef({ onModelClick, onPetClick });
  const snapshotRegisterRef = useRef(onRegisterSnapshot);
  snapshotRegisterRef.current = onRegisterSnapshot;

  const modelRigRef = useRef<FashionModelRig | null>(null);
  const petRigRef = useRef<CosmicPetRig | null>(null);
  const burstPoolRef = useRef<ReturnType<typeof createBurstParticlePool> | null>(null);
  const sparkleUniformRef = useRef<{ uIntensity: { value: number } } | null>(null);
  const maxAnisotropyRef = useRef<number>(1);

  useEffect(() => {
    poseRef.current = pose;
  }, [pose]);

  useEffect(() => {
    runwayProgressRef.current = runwayProgress;
  }, [runwayProgress]);

  useEffect(() => {
    callbacksRef.current = { onModelClick, onPetClick };
  }, [onModelClick, onPetClick]);

  useEffect(() => {
    cameraPresetRef.current = cameraPreset;
    transitioningCamRef.current = true;
  }, [cameraPreset]);

  useEffect(() => {
    outfitRef.current = outfit;
    if (modelRigRef.current) {
      modelRigRef.current.updateOutfit(outfit, maxAnisotropyRef.current);
    }
    if (sparkleUniformRef.current) {
      sparkleUniformRef.current.uIntensity.value = 0.45 + outfit.sparkleIntensity * 0.9;
    }
  }, [outfit]);

  useEffect(() => {
    petRef.current = pet;
    if (petRigRef.current) {
      petRigRef.current.updatePetState(pet);
    }
  }, [pet]);

  useEffect(() => {
    if (!petReactionSignal || !petRigRef.current) return;
    petRigRef.current.triggerReaction(petReactionSignal.reaction);
  }, [petReactionSignal]);

  useEffect(() => {
    if (!sparkleBurstSignal || !burstPoolRef.current) return;
    const origin =
      sparkleBurstSignal.target === 'pet'
        ? PET_BURST_ORIGIN
        : sparkleBurstSignal.target === 'runway'
          ? RUNWAY_FLASH_ORIGIN
          : MODEL_BURST_ORIGIN;
    burstPoolRef.current.emitBurst(origin, sparkleBurstSignal.colorHex, sparkleBurstSignal.count);
  }, [sparkleBurstSignal]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    maxAnisotropyRef.current = renderer.capabilities.getMaxAnisotropy();

    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglFailed(true);
    };
    const handleContextRestored = () => {
      setWebglFailed(false);
    };
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070516);
    scene.fog = new THREE.FogExp2(0x070516, 0.036);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);
    const initialCam = CAMERA_TARGETS[cameraPresetRef.current];
    camera.position.set(...initialCam.pos);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(...initialCam.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.5;
    controls.maxDistance = 7.5;
    controls.minPolarAngle = 0.28;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.enablePan = false;
    controls.addEventListener('start', () => {
      // Never fight manual user camera drag
      transitioningCamRef.current = false;
    });
    controls.update();

    // 3-Point Warm/Cool Studio Rig + Softboxes
    const hemiLight = new THREE.HemisphereLight(0xc4b5fd, 0x1e1b4b, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.1);
    keyLight.position.set(3.2, 5.2, 4.2);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 16;
    const d = 3.5;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xe879f9, 1.45);
    rimLight.position.set(-3.4, 3.0, -3.6);
    scene.add(rimLight);

    const cyanFill = new THREE.PointLight(0x38bdf8, 1.35, 10, 1.8);
    cyanFill.position.set(-2.4, 1.8, 2.0);
    scene.add(cyanFill);

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softboxA = new THREE.RectAreaLight(0xfde68a, 2.2, 1.6, 3.2);
      softboxA.position.set(2.8, 2.1, 2.2);
      softboxA.lookAt(0, 1.0, 0);
      scene.add(softboxA);
    }

    // Galaxy Skybox Dome
    const skyMat = createGalaxySkyboxMaterial();
    const skyDome = new THREE.Mesh(new THREE.SphereGeometry(42, 32, 24), skyMat);
    scene.add(skyDome);

    // Stage, Model, Pet, Ambient Sparkles & Burst Pool
    const stageRig = buildGalaxyStageRig(maxAnisotropyRef.current);
    scene.add(stageRig.root);

    const modelRig = buildFashionModelRig(isSoftwareGl);
    modelRig.updateOutfit(outfitRef.current, maxAnisotropyRef.current);
    modelRigRef.current = modelRig;
    scene.add(modelRig.root);

    const petRig = buildCosmicPetRig();
    petRig.updatePetState(petRef.current);
    petRigRef.current = petRig;
    scene.add(petRig.root);

    const sparkleField = createAmbientSparkleField(280);
    sparkleUniformRef.current = sparkleField.material.uniforms as { uIntensity: { value: number } };
    sparkleField.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    scene.add(sparkleField.points);

    const burstPool = createBurstParticlePool(320);
    burstPoolRef.current = burstPool;
    scene.add(burstPool.points);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycasting for direct clicks on 3D Model & Cosmic Pet
    const raycaster = new THREE.Raycaster();
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 6) return; // Was a drag/orbit, not a click

      const rect = canvas.getBoundingClientRect();
      _rayMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _rayMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(_rayMouse, camera);

      const targets = [...petRig.clickableTargets, ...modelRig.clickableTargets];
      const hits = raycaster.intersectObjects(targets, false);
      if (hits.length > 0) {
        const type = hits[0].object.userData.interactType;
        if (type === 'pet') {
          callbacksRef.current.onPetClick();
        } else if (type === 'model') {
          callbacksRef.current.onModelClick();
        }
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);

    // Resize listener
    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop with software-GL afterDraw pacing
    let frameId = 0;
    let disposed = false;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const rawDt = clock.getDelta();
      const dt = Math.min(rawDt, 0.05);
      const elapsed = clock.elapsedTime;

      skyMat.uniforms.uTime.value = elapsed;
      sparkleField.material.uniforms.uTime.value = elapsed;
      stageRig.update(dt, elapsed);
      modelRig.updateAnimation(dt, elapsed, poseRef.current, runwayProgressRef.current);
      petRig.updateAnimation(dt, elapsed);
      burstPool.update(dt);

      if (transitioningCamRef.current) {
        const preset = CAMERA_TARGETS[cameraPresetRef.current];
        _targetCamPos.set(...preset.pos);
        _targetCamLook.set(...preset.target);

        camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCamPos.x, 5.5, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCamPos.y, 5.5, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCamPos.z, 5.5, dt);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetCamLook.x, 5.5, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetCamLook.y, 5.5, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetCamLook.z, 5.5, dt);

        if (
          camera.position.distanceTo(_targetCamPos) < 0.015 &&
          controls.target.distanceTo(_targetCamLook) < 0.015
        ) {
          transitioningCamRef.current = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    snapshotRegisterRef.current?.(() => {
      if (disposed) return null;
      renderer.render(scene, camera);
      try {
        return canvas.toDataURL('image/png');
      } catch {
        return null;
      }
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);

      controls.dispose();
      modelRig.dispose();
      petRig.dispose();
      stageRig.dispose();
      sparkleField.dispose();
      burstPool.dispose();
      skyDome.geometry.dispose();
      skyMat.dispose();
      renderer.dispose();

      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }
    };
  }, []);

  if (webglFailed) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#070516] text-violet-100 p-8">
        <div className="max-w-md border border-violet-400/25 bg-[#0f0b24] rounded-2xl p-6 text-center space-y-2">
          <p className="font-display text-2xl text-amber-200">Astraea Atelier</p>
          <p className="text-sm text-violet-200/80">
            WebGL 3D rendering is paused in this browser context. You can still use the Design Sketchpad, Body Analyzer, Fashion Academy, and AI Coach.
          </p>
        </div>
      </div>
    );
  }

  return <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
};
