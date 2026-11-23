import * as THREE from 'three';
import {
  HairStyle,
  HosieryStyle,
  MakeupStyle,
  ModelPose,
  OutfitConfig,
  PetReaction,
  PetState,
  ShoeStyle,
} from '../types/atelier';
import {
  createBlushTexture,
  createCasualCrownTeeTexture,
  createContactShadowTexture,
  createGalaxyFabricTexture,
  createHosieryTexture,
  createLaceTrimTexture,
  createNikkiEyeTexture,
  createRunwayFloorTexture,
  createSequinTexture,
  createSparkleSpriteTexture,
} from './proceduralTextures';

const _vec3A = new THREE.Vector3();
const _colorA = new THREE.Color();

export interface FashionModelRig {
  root: THREE.Group;
  clickableTargets: THREE.Object3D[];
  updateOutfit: (config: OutfitConfig, maxAnisotropy: number) => void;
  updateAnimation: (dt: number, elapsed: number, pose: ModelPose, runwayProgress: number) => void;
  dispose: () => void;
}

function createAnimeHeadGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.118, 40, 32);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Normalize y in [-0.118, 0.118]
    const ny = y / 0.118;

    if (ny < 0) {
      // Taper lower cheeks & jawline into a delicate anime V-chin
      const t = Math.min(1, -ny);
      const jawNarrow = 1 - Math.pow(t, 1.35) * 0.42;
      x *= jawNarrow;
      if (z > 0) {
        z *= 1 - Math.pow(t, 1.8) * 0.14;
      } else {
        z *= 1 - Math.pow(t, 1.2) * 0.35;
      }
      // Subtle chin tip extension
      y -= Math.pow(t, 2.2) * 0.012 * Math.max(0, z / 0.1);
    } else {
      // Soft rounded cranium
      x *= 0.94;
      z *= 0.96;
    }

    // Gentle flattening of eye sockets on upper-front face so eye domes hug smoothly
    if (z > 0.06 && ny > -0.25 && ny < 0.25 && Math.abs(x) > 0.015 && Math.abs(x) < 0.072) {
      z -= 0.008;
    }

    // Soft fuller lower-cheeks
    if (z > 0.03 && ny > -0.45 && ny < -0.1 && Math.abs(x) > 0.03) {
      x *= 1.04;
      z += 0.004;
    }

    // Tiny sculpted anime nose bridge / button tip
    if (z > 0.08 && Math.abs(x) < 0.014 && ny > -0.4 && ny < -0.12) {
      const noseAmt = Math.exp(-Math.pow(x / 0.009, 2)) * Math.exp(-Math.pow((ny + 0.26) / 0.1, 2));
      z += noseAmt * 0.013;
    }

    pos.setXYZ(i, x, y, z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function createTaperedStrandGeometry(
  points: THREE.Vector3[],
  baseRadius: number,
  tipRadius: number,
  tubularSegments = 22,
  radialSegments = 8
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points);
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    const pt = curve.getPointAt(t);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    // Swell slightly near upper-mid, taper smoothly to crisp anime point at tip
    const profile =
      t < 0.25
        ? THREE.MathUtils.lerp(baseRadius * 0.85, baseRadius * 1.15, t / 0.25)
        : THREE.MathUtils.lerp(baseRadius * 1.15, tipRadius, Math.pow((t - 0.25) / 0.75, 1.35));

    for (let j = 0; j <= radialSegments; j++) {
      const v = (j / radialSegments) * Math.PI * 2;
      const sin = Math.sin(v);
      const cos = -Math.cos(v);
      // Slightly flattened ribbon cross-section (1.25 width, 0.78 thickness)
      const rx = profile * 1.25;
      const ry = profile * 0.78;
      const vx = pt.x + (cos * N.x * rx + sin * B.x * ry);
      const vy = pt.y + (cos * N.y * rx + sin * B.y * ry);
      const vz = pt.z + (cos * N.z * rx + sin * B.z * ry);
      positions.push(vx, vy, vz);
      uvs.push(j / radialSegments, t);
    }
  }

  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = (radialSegments + 1) * i + j;
      const b = (radialSegments + 1) * (i + 1) + j;
      const c = (radialSegments + 1) * (i + 1) + (j + 1);
      const d = (radialSegments + 1) * i + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createSculptedBow(
  ribbonMat: THREE.Material,
  centerMat: THREE.Material,
  scale = 1
): THREE.Group {
  const bow = new THREE.Group();
  bow.scale.setScalar(scale);

  const loopShape = new THREE.Shape();
  loopShape.moveTo(0, 0);
  loopShape.bezierCurveTo(0.05, 0.06, 0.14, 0.055, 0.135, 0.0);
  loopShape.bezierCurveTo(0.14, -0.055, 0.05, -0.06, 0, 0);
  const loopGeo = new THREE.ExtrudeGeometry(loopShape, {
    depth: 0.018,
    bevelEnabled: true,
    bevelSize: 0.005,
    bevelThickness: 0.005,
    bevelSegments: 2,
  });
  loopGeo.center();

  [-1, 1].forEach((side) => {
    const wing = new THREE.Mesh(loopGeo.clone(), ribbonMat);
    wing.position.set(side * 0.068, 0.01, 0);
    wing.rotation.z = side * 0.22;
    wing.rotation.y = side * -0.25;
    wing.castShadow = true;
    bow.add(wing);

    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.012, -0.005, 0),
      new THREE.Vector3(side * 0.055, -0.1, 0.015),
      new THREE.Vector3(side * 0.085, -0.22, -0.01),
    ]);
    const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 14, 0.014, 8, false), ribbonMat);
    tail.scale.set(1.3, 1, 0.38);
    bow.add(tail);
  });

  loopGeo.dispose();

  const knot = new THREE.Mesh(new THREE.OctahedronGeometry(0.022, 1), centerMat);
  knot.scale.set(1.1, 1.25, 0.85);
  knot.position.z = 0.008;
  bow.add(knot);

  return bow;
}

export function buildFashionModelRig(isSoftwareGl: boolean): FashionModelRig {
  const root = new THREE.Group();
  root.name = 'FashionModelRoot';

  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  // Soft contact shadow grounded at y=0.006
  const shadowTex = createContactShadowTexture();
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.45, 1.45),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.52,
    })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.006;
  root.add(contactShadow);

  // Nikki-style Porcelain BJD Skin & Stylized Materials
  const skinMat = new THREE.MeshPhysicalMaterial({
    color: '#FFEAE2',
    roughness: 0.42,
    metalness: 0.0,
    sheen: 0.48,
    sheenColor: new THREE.Color('#FFC8D8'),
    sheenRoughness: 0.52,
    clearcoat: 0.06,
    clearcoatRoughness: 0.45,
  });

  const hairMat = new THREE.MeshPhysicalMaterial({
    color: '#FF91AA',
    roughness: 0.34,
    metalness: 0.06,
    iridescence: 0.32,
    iridescenceIOR: 1.35,
    sheen: 0.92,
    sheenRoughness: 0.32,
    sheenColor: new THREE.Color('#FFF1F8'),
    clearcoat: 0.16,
    side: THREE.DoubleSide,
  });

  const lashMat = new THREE.MeshStandardMaterial({
    color: '#2B1522',
    roughness: 0.35,
    metalness: 0.05,
  });

  const browMat = new THREE.MeshStandardMaterial({
    color: '#9F4D68',
    roughness: 0.45,
  });

  const blushTex = createBlushTexture();
  const blushMat = new THREE.MeshBasicMaterial({
    map: blushTex,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });

  const lipMat = new THREE.MeshPhysicalMaterial({
    color: '#FB7185',
    roughness: 0.16,
    clearcoat: 0.95,
    clearcoatRoughness: 0.08,
  });

  let activeEyeTex = createNikkiEyeTexture('#7C4A3A', 4);
  const eyePatchMat = new THREE.MeshPhysicalMaterial({
    map: activeEyeTex,
    roughness: 0.08,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });

  const goldMetalMat = new THREE.MeshPhysicalMaterial({
    color: '#FDE68A',
    metalness: 0.92,
    roughness: 0.16,
    anisotropy: 0.7,
    clearcoat: 0.45,
  });

  const pearlMat = new THREE.MeshPhysicalMaterial({
    color: '#FFF8FA',
    roughness: 0.14,
    metalness: 0.08,
    iridescence: 0.85,
    clearcoat: 0.9,
  });

  const crystalGemMat = new THREE.MeshPhysicalMaterial({
    color: '#E0F2FE',
    emissive: '#A855F7',
    emissiveIntensity: 0.48,
    metalness: 0.1,
    roughness: 0.06,
    transmission: isSoftwareGl ? 0 : 0.78,
    transparent: true,
    opacity: isSoftwareGl ? 0.68 : 1,
    ior: 1.85,
    clearcoat: 1.0,
  });

  const primaryFabricMat = new THREE.MeshPhysicalMaterial({
    color: '#3B1D8E',
    roughness: 0.25,
    metalness: 0.22,
    iridescence: 0.85,
    iridescenceIOR: 1.35,
    sheen: 0.95,
    sheenRoughness: 0.32,
    sheenColor: new THREE.Color('#F0ABFC'),
    clearcoat: 0.28,
    side: THREE.DoubleSide,
  });

  const secondaryFabricMat = new THREE.MeshPhysicalMaterial({
    color: '#C026D3',
    roughness: 0.32,
    metalness: 0.14,
    iridescence: 0.78,
    sheen: 0.85,
    sheenColor: new THREE.Color('#67E8F9'),
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  });

  let activeTeeTex: THREE.Texture | null = createCasualCrownTeeTexture('#FFFFFF', '#F9A8D4', '#475569', 4);
  const casualTeeMat = new THREE.MeshPhysicalMaterial({
    map: activeTeeTex,
    color: '#FFFFFF',
    roughness: 0.74,
    metalness: 0.0,
    sheen: 0.45,
    sheenColor: new THREE.Color('#F8FAFC'),
    side: THREE.DoubleSide,
  });

  let activeHosieryTex: THREE.Texture | null = null;
  const hosieryMat = new THREE.MeshPhysicalMaterial({
    transparent: true,
    opacity: 0.85,
    roughness: 0.55,
    metalness: 0.05,
    sheen: 0.7,
    side: THREE.DoubleSide,
  });

  let activeLaceTex: THREE.Texture | null = createLaceTrimTexture('#FDE68A', 4);
  const laceTrimMat = new THREE.MeshPhysicalMaterial({
    map: activeLaceTex,
    transparent: true,
    alphaTest: 0.08,
    roughness: 0.38,
    sheen: 0.8,
    side: THREE.DoubleSide,
  });

  // Pelvis / Hip Pivot at y = 0.96
  const pelvisPivot = new THREE.Group();
  pelvisPivot.position.set(0, 0.96, 0);
  bodyGroup.add(pelvisPivot);

  const pelvisMesh = new THREE.Mesh(new THREE.SphereGeometry(0.132, 26, 20), skinMat);
  pelvisMesh.scale.set(1.06, 0.76, 0.84);
  pelvisMesh.castShadow = true;
  pelvisPivot.add(pelvisMesh);

  // Waist & Slender BJD Torso
  const torsoPivot = new THREE.Group();
  torsoPivot.position.set(0, 0.05, 0);
  pelvisPivot.add(torsoPivot);

  const torsoProfile = [
    new THREE.Vector2(0.102, 0.0),
    new THREE.Vector2(0.080, 0.13), // slender corset waist
    new THREE.Vector2(0.118, 0.28), // delicate bust contour
    new THREE.Vector2(0.124, 0.38), // upper chest
    new THREE.Vector2(0.042, 0.45), // swan neck base
  ];
  const torsoGeo = new THREE.LatheGeometry(torsoProfile, 30);
  const torsoMesh = new THREE.Mesh(torsoGeo, skinMat);
  torsoMesh.scale.set(1.12, 1.0, 0.74);
  torsoMesh.castShadow = true;
  torsoPivot.add(torsoMesh);

  // Soft sculpted bust cups for natural couture fit
  [-0.044, 0.044].forEach((bx) => {
    const bustCup = new THREE.Mesh(new THREE.SphereGeometry(0.048, 16, 14), skinMat);
    bustCup.scale.set(0.95, 0.92, 0.75);
    bustCup.position.set(bx, 0.275, 0.062);
    torsoPivot.add(bustCup);
  });

  // Delicate Collarbone Shoulder Bar
  const shoulderMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.032, 0.22, 8, 16), skinMat);
  shoulderMesh.rotation.z = Math.PI / 2;
  shoulderMesh.position.set(0, 0.388, 0);
  torsoPivot.add(shoulderMesh);

  // Subtle collarbone contour curve
  [-1, 1].forEach((side) => {
    const clav = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * 0.02, 0.405, 0.045),
          new THREE.Vector3(side * 0.075, 0.408, 0.035),
          new THREE.Vector3(side * 0.125, 0.398, 0.008),
        ]),
        10,
        0.0055,
        6,
        false
      ),
      skinMat
    );
    torsoPivot.add(clav);
  });

  // Swan Neck + Nikki Anime Head Pivot
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.445, 0);
  torsoPivot.add(headPivot);

  const neckProfile = [
    new THREE.Vector2(0.040, 0.0),
    new THREE.Vector2(0.032, 0.06),
    new THREE.Vector2(0.034, 0.115),
  ];
  const neckMesh = new THREE.Mesh(new THREE.LatheGeometry(neckProfile, 20), skinMat);
  headPivot.add(neckMesh);

  const headCenterY = 0.21;
  const headMesh = new THREE.Mesh(createAnimeHeadGeometry(), skinMat);
  headMesh.position.y = headCenterY;
  headMesh.castShadow = true;
  headPivot.add(headMesh);

  // Cute Anime Ears
  [-1, 1].forEach((side) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), skinMat);
    ear.scale.set(0.45, 0.92, 0.65);
    ear.position.set(side * 0.108, headCenterY - 0.012, -0.004);
    ear.rotation.z = side * -0.15;
    headPivot.add(ear);
  });

  // Expressive Starry Nikki Anime Eyes (with Blink Groups)
  const blinkGroups: THREE.Group[] = [];
  [-1, 1].forEach((side) => {
    const eyeSocket = new THREE.Group();
    eyeSocket.position.set(side * 0.043, headCenterY - 0.008, 0.095);
    eyeSocket.rotation.y = side * 0.21;
    eyeSocket.rotation.z = side * -0.05;
    headPivot.add(eyeSocket);

    const blinkGroup = new THREE.Group();
    eyeSocket.add(blinkGroup);
    blinkGroups.push(blinkGroup);

    // Curved front eye patch textured with multi-layered anime iris + star catchlights
    const eyeSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.026, 20, 18, Math.PI * 0.18, Math.PI * 0.64, Math.PI * 0.2, Math.PI * 0.6),
      eyePatchMat
    );
    eyeSphere.rotation.y = -Math.PI / 2;
    eyeSphere.scale.set(0.55, 1.05, 0.96);
    blinkGroup.add(eyeSphere);

    // Sweeping Thick Upper Eyelash Line + Outer Cat-Eye Flick
    const upperLashCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-side * 0.022, 0.011, 0.009),
      new THREE.Vector3(0, 0.024, 0.015),
      new THREE.Vector3(side * 0.023, 0.014, 0.009),
      new THREE.Vector3(side * 0.031, 0.021, 0.003),
    ]);
    const upperLash = new THREE.Mesh(
      new THREE.TubeGeometry(upperLashCurve, 16, 0.0032, 6, false),
      lashMat
    );
    blinkGroup.add(upperLash);

    // Subtle delicate lower lash accent
    const lowerLashCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-side * 0.01, -0.021, 0.011),
      new THREE.Vector3(side * 0.016, -0.018, 0.01),
    ]);
    const lowerLash = new THREE.Mesh(
      new THREE.TubeGeometry(lowerLashCurve, 8, 0.0014, 5, false),
      lashMat
    );
    blinkGroup.add(lowerLash);

    // Thin arched Nikki Eyebrow
    const browCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-side * 0.02, 0.038, 0.012),
      new THREE.Vector3(0, 0.044, 0.015),
      new THREE.Vector3(side * 0.024, 0.037, 0.009),
    ]);
    const brow = new THREE.Mesh(new THREE.TubeGeometry(browCurve, 10, 0.0018, 5, false), browMat);
    eyeSocket.add(brow);
  });

  // Soft Rosy Cheek Blush
  [-1, 1].forEach((side) => {
    const blush = new THREE.Mesh(new THREE.PlaneGeometry(0.038, 0.022), blushMat);
    blush.position.set(side * 0.058, headCenterY - 0.038, 0.091);
    blush.rotation.y = side * 0.38;
    headPivot.add(blush);
  });

  // Glossy Petal Lips (sweet subtle idol smile)
  const upperLip = new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 10), lipMat);
  upperLip.scale.set(1.45, 0.42, 0.55);
  upperLip.position.set(0, headCenterY - 0.064, 0.097);
  headPivot.add(upperLip);

  const lowerLip = new THREE.Mesh(new THREE.SphereGeometry(0.010, 12, 10), lipMat);
  lowerLip.scale.set(1.25, 0.48, 0.62);
  lowerLip.position.set(0, headCenterY - 0.070, 0.096);
  headPivot.add(lowerLip);

  // Dynamic Hair Container + Swaying Locks Group
  const hairGroup = new THREE.Group();
  hairGroup.position.y = headCenterY;
  headPivot.add(hairGroup);

  const hairSwayGroup = new THREE.Group();
  hairGroup.add(hairSwayGroup);

  const headAccessoryGroup = new THREE.Group();
  headAccessoryGroup.position.y = headCenterY;
  headPivot.add(headAccessoryGroup);

  // Sculpted Articulated Arms + Graceful Anime Hands
  const createArm = (side: -1 | 1) => {
    const shoulderJoint = new THREE.Group();
    shoulderJoint.position.set(side * 0.146, 0.385, 0);
    torsoPivot.add(shoulderJoint);

    const upperArmGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.030, 0.0),
        new THREE.Vector2(0.028, -0.09),
        new THREE.Vector2(0.023, -0.22),
      ],
      14
    );
    const upperArm = new THREE.Mesh(upperArmGeo, skinMat);
    upperArm.castShadow = true;
    shoulderJoint.add(upperArm);

    const elbowJoint = new THREE.Group();
    elbowJoint.position.set(0, -0.22, 0);
    shoulderJoint.add(elbowJoint);

    const forearmGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.023, 0.0),
        new THREE.Vector2(0.021, -0.08),
        new THREE.Vector2(0.016, -0.21),
      ],
      14
    );
    const forearm = new THREE.Mesh(forearmGeo, skinMat);
    forearm.castShadow = true;
    elbowJoint.add(forearm);

    // Delicate Hand Group (palm + graceful finger taper + thumb)
    const handGroup = new THREE.Group();
    handGroup.position.set(0, -0.21, 0);
    handGroup.rotation.z = side * -0.08;
    elbowJoint.add(handGroup);

    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), skinMat);
    palm.scale.set(0.62, 1.15, 0.9);
    palm.position.y = -0.018;
    handGroup.add(palm);

    // Slender finger cluster
    [-0.008, -0.0025, 0.003, 0.0085].forEach((fz, idx) => {
      const len = idx === 1 ? 0.036 : idx === 2 ? 0.034 : 0.029;
      const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.0032, len, 4, 8), skinMat);
      finger.position.set(side * -0.002, -0.038 - len * 0.35, fz);
      finger.rotation.z = side * 0.08;
      handGroup.add(finger);
    });

    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.0034, 0.018, 4, 8), skinMat);
    thumb.position.set(side * -0.008, -0.024, 0.015);
    thumb.rotation.x = 0.45;
    handGroup.add(thumb);

    return { shoulderJoint, elbowJoint };
  };

  const leftArm = createArm(-1);
  const rightArm = createArm(1);

  // Sculpted Long Slender Legs + Dynamic Hosiery & Shoes/Barefoot (Bottom flush at y=0)
  const createLeg = (side: -1 | 1) => {
    const hipJoint = new THREE.Group();
    hipJoint.position.set(side * 0.078, -0.02, 0);
    pelvisPivot.add(hipJoint);

    const thighGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.056, 0.0),
        new THREE.Vector2(0.052, -0.14),
        new THREE.Vector2(0.041, -0.32),
        new THREE.Vector2(0.034, -0.43),
      ],
      18
    );
    const thigh = new THREE.Mesh(thighGeo, skinMat);
    thigh.castShadow = true;
    hipJoint.add(thigh);

    const thighHosieryGroup = new THREE.Group();
    hipJoint.add(thighHosieryGroup);

    const kneeJoint = new THREE.Group();
    kneeJoint.position.set(0, -0.43, 0);
    hipJoint.add(kneeJoint);

    const calfGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.034, 0.0),
        new THREE.Vector2(0.041, -0.13),
        new THREE.Vector2(0.030, -0.28),
        new THREE.Vector2(0.021, -0.43),
      ],
      18
    );
    const calf = new THREE.Mesh(calfGeo, skinMat);
    calf.castShadow = true;
    kneeJoint.add(calf);

    const calfHosieryGroup = new THREE.Group();
    kneeJoint.add(calfHosieryGroup);

    const shoeGroup = new THREE.Group();
    shoeGroup.position.set(0, -0.43, 0.012);
    kneeJoint.add(shoeGroup);

    return { hipJoint, kneeJoint, thighHosieryGroup, calfHosieryGroup, shoeGroup };
  };

  const leftLeg = createLeg(-1);
  const rightLeg = createLeg(1);

  // Dynamic Garment Containers
  const bodiceGroup = new THREE.Group();
  torsoPivot.add(bodiceGroup);

  const skirtGroup = new THREE.Group();
  pelvisPivot.add(skirtGroup);

  const sleevesGroup = new THREE.Group();
  torsoPivot.add(sleevesGroup);

  const accessoryGroup = new THREE.Group();
  torsoPivot.add(accessoryGroup);

  // Invisible simplified proxy collider for responsive click raycasting
  const clickProxy = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.45, 1.88, 12),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  clickProxy.position.y = 0.96;
  clickProxy.userData.interactType = 'model';
  root.add(clickProxy);

  // Texture tracking for cleanup
  let activeColorTex: THREE.Texture | null = null;
  const textureLoader = new THREE.TextureLoader();

  const clearGroup = (grp: THREE.Group) => {
    while (grp.children.length > 0) {
      const child = grp.children[0];
      grp.remove(child);
      child.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          (obj as THREE.Mesh).geometry.dispose();
        }
      });
    }
  };

  const rebuildHairstyle = (style: HairStyle, hairHex: string) => {
    hairMat.color.set(hairHex);
    _colorA.set(hairHex);
    hairMat.sheenColor.copy(_colorA).lerp(new THREE.Color('#FFFFFF'), 0.65);
    browMat.color.copy(_colorA).lerp(new THREE.Color('#2E1065'), 0.45);

    clearGroup(hairGroup);
    hairGroup.add(hairSwayGroup);
    clearGroup(hairSwayGroup);

    // 1. Cranial Hair Cap (hugging back/top of sculpted anime head)
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.123, 28, 22, 0, Math.PI * 2, 0, Math.PI * 0.64),
      hairMat
    );
    cap.scale.set(0.98, 1.02, 1.02);
    cap.position.set(0, 0.008, -0.01);
    cap.rotation.x = -0.22;
    cap.castShadow = true;
    hairGroup.add(cap);

    // Back scalp coverage
    const backCap = new THREE.Mesh(new THREE.SphereGeometry(0.121, 24, 18), hairMat);
    backCap.scale.set(0.96, 1.0, 0.85);
    backCap.position.set(0, -0.005, -0.025);
    hairGroup.add(backCap);

    // 2. Signature Airy Anime Bangs (curved tapered locks framing forehead)
    const bangConfigs: Array<{ pts: [number, number, number][]; r: number }> = [
      {
        pts: [
          [0.0, 0.115, 0.04],
          [-0.012, 0.075, 0.112],
          [-0.018, 0.022, 0.116],
        ],
        r: 0.019,
      },
      {
        pts: [
          [0.012, 0.116, 0.042],
          [0.024, 0.076, 0.11],
          [0.016, 0.024, 0.115],
        ],
        r: 0.018,
      },
      {
        pts: [
          [-0.028, 0.11, 0.032],
          [-0.052, 0.068, 0.102],
          [-0.048, 0.016, 0.104],
        ],
        r: 0.018,
      },
      {
        pts: [
          [0.032, 0.11, 0.032],
          [0.058, 0.066, 0.098],
          [0.052, 0.016, 0.102],
        ],
        r: 0.018,
      },
      {
        pts: [
          [-0.055, 0.096, 0.01],
          [-0.088, 0.045, 0.075],
          [-0.084, -0.02, 0.082],
        ],
        r: 0.016,
      },
      {
        pts: [
          [0.055, 0.096, 0.01],
          [0.088, 0.045, 0.075],
          [0.084, -0.02, 0.082],
        ],
        r: 0.016,
      },
    ];
    bangConfigs.forEach((b) => {
      const geo = createTaperedStrandGeometry(
        b.pts.map((p) => new THREE.Vector3(...p)),
        b.r,
        0.002,
        14,
        8
      );
      const lock = new THREE.Mesh(geo, hairMat);
      lock.castShadow = true;
      hairGroup.add(lock);
    });

    // 3. Long Cheek-Framing Hime Side Locks (every Nikki hairstyle loves soft face-framing locks!)
    [-1, 1].forEach((side) => {
      const sidePts = [
        new THREE.Vector3(side * 0.082, 0.06, 0.025),
        new THREE.Vector3(side * 0.112, -0.04, 0.055),
        new THREE.Vector3(side * 0.106, -0.17, 0.068),
        new THREE.Vector3(side * 0.085, -0.29, 0.06),
      ];
      const sideLock = new THREE.Mesh(
        createTaperedStrandGeometry(sidePts, 0.021, 0.0025, 18, 8),
        hairMat
      );
      sideLock.castShadow = true;
      hairSwayGroup.add(sideLock);
    });

    // 4. Style-Specific Volume Locks & Ribbons
    if (style === 'nikki-long-pink') {
      // Classic Love Nikki long silky hair: full straight anime bangs + waist-length flowing strands with gentle curved tips
      [-0.072, -0.052, -0.032, -0.012, 0.012, 0.032, 0.052, 0.072].forEach((bx) => {
        const pts = [
          new THREE.Vector3(bx * 0.65, 0.116, 0.042),
          new THREE.Vector3(bx * 0.95, 0.078, 0.112),
          new THREE.Vector3(bx, 0.028, 0.116),
        ];
        const fringe = new THREE.Mesh(
          createTaperedStrandGeometry(pts, 0.018, 0.004, 12, 8),
          hairMat
        );
        fringe.castShadow = true;
        hairGroup.add(fringe);
      });

      // Flowing chest-hugging front wisps curling softly inward over shoulders
      [-1, 1].forEach((side) => {
        const frontWisp = [
          new THREE.Vector3(side * 0.095, 0.05, -0.01),
          new THREE.Vector3(side * 0.135, -0.14, 0.035),
          new THREE.Vector3(side * 0.145, -0.34, 0.072),
          new THREE.Vector3(side * 0.115, -0.52, 0.095),
          new THREE.Vector3(side * 0.138, -0.62, 0.075),
        ];
        const wMesh = new THREE.Mesh(
          createTaperedStrandGeometry(frontWisp, 0.028, 0.003, 22, 9),
          hairMat
        );
        wMesh.castShadow = true;
        hairSwayGroup.add(wMesh);
      });

      // Multi-layered waist-length back hair veil with wispy curved anime tips
      [-0.105, -0.068, -0.034, 0, 0.034, 0.068, 0.105].forEach((ox, idx) => {
        const zOff = -0.078 - (idx % 2) * 0.018;
        const flare = idx % 2 === 0 ? 1.48 : 1.25;
        const pts = [
          new THREE.Vector3(ox * 0.72, 0.06, -0.072),
          new THREE.Vector3(ox * 1.12, -0.14, zOff - 0.03),
          new THREE.Vector3(ox * flare, -0.38, zOff - 0.045),
          new THREE.Vector3(ox * (flare + 0.18), -0.64, zOff - 0.02),
          new THREE.Vector3(ox * (flare + 0.05) + (idx % 2 === 0 ? 0.022 : -0.022), -0.84, zOff + 0.02),
        ];
        const strand = new THREE.Mesh(
          createTaperedStrandGeometry(pts, 0.040, 0.004, 24, 9),
          hairMat
        );
        strand.castShadow = true;
        hairSwayGroup.add(strand);
      });
    } else if (style === 'nikki-twintails') {
      [-1, 1].forEach((side) => {
        // Bouncy Twin-Tail Hair Tie Ribbon Bow
        const tieBow = createSculptedBow(secondaryFabricMat, goldMetalMat, 0.62);
        tieBow.position.set(side * 0.125, 0.08, -0.03);
        tieBow.rotation.y = side * 0.45;
        tieBow.rotation.z = side * -0.28;
        hairGroup.add(tieBow);

        // Multi-strand flowing S-curve Twin-Tail (main curl + outer highlight wisp)
        const mainTailPts = [
          new THREE.Vector3(side * 0.115, 0.075, -0.03),
          new THREE.Vector3(side * 0.21, 0.01, -0.06),
          new THREE.Vector3(side * 0.26, -0.18, -0.07),
          new THREE.Vector3(side * 0.22, -0.42, -0.04),
          new THREE.Vector3(side * 0.28, -0.66, -0.08),
          new THREE.Vector3(side * 0.23, -0.82, -0.04),
        ];
        const mainTail = new THREE.Mesh(
          createTaperedStrandGeometry(mainTailPts, 0.048, 0.004, 28, 10),
          hairMat
        );
        mainTail.castShadow = true;
        hairSwayGroup.add(mainTail);

        const wispPts = [
          new THREE.Vector3(side * 0.12, 0.07, -0.02),
          new THREE.Vector3(side * 0.24, -0.03, -0.02),
          new THREE.Vector3(side * 0.31, -0.26, -0.04),
          new THREE.Vector3(side * 0.27, -0.54, 0.01),
        ];
        const wisp = new THREE.Mesh(
          createTaperedStrandGeometry(wispPts, 0.025, 0.003, 20, 8),
          hairMat
        );
        hairSwayGroup.add(wisp);
      });
    } else if (style === 'starlight-waves') {
      // Lush waist-length back wavy hair curtain (5 layered flowing ribbons)
      [-0.085, -0.042, 0, 0.042, 0.085].forEach((ox, idx) => {
        const zDepth = -0.085 - (idx % 2) * 0.02;
        const pts = [
          new THREE.Vector3(ox * 0.7, 0.04, -0.08),
          new THREE.Vector3(ox * 1.15, -0.12, zDepth - 0.03),
          new THREE.Vector3(ox * 1.35 + (idx % 2 === 0 ? 0.02 : -0.02), -0.34, zDepth - 0.04),
          new THREE.Vector3(ox * 1.45, -0.58, zDepth - 0.01),
          new THREE.Vector3(ox * 1.35, -0.78, zDepth + 0.02),
        ];
        const lock = new THREE.Mesh(
          createTaperedStrandGeometry(pts, 0.046, 0.005, 24, 9),
          hairMat
        );
        lock.castShadow = true;
        hairSwayGroup.add(lock);
      });

      // Crescent pearl clip on side
      const clip = new THREE.Mesh(new THREE.OctahedronGeometry(0.018, 0), crystalGemMat);
      clip.position.set(0.088, 0.055, 0.068);
      hairGroup.add(clip);
    } else if (style === 'celestial-updo') {
      // Braided crown + High Empress Chignon Bun + spiral curls
      const braidHalo = new THREE.Mesh(new THREE.TorusGeometry(0.112, 0.016, 8, 28), hairMat);
      braidHalo.rotation.x = Math.PI / 2 - 0.35;
      braidHalo.position.set(0, 0.095, -0.01);
      hairGroup.add(braidHalo);

      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.078, 22, 18), hairMat);
      bun.scale.set(1.0, 0.92, 0.92);
      bun.position.set(0, 0.145, -0.07);
      bun.castShadow = true;
      hairGroup.add(bun);

      const bunBow = createSculptedBow(goldMetalMat, crystalGemMat, 0.52);
      bunBow.position.set(0, 0.095, -0.125);
      bunBow.rotation.y = Math.PI;
      hairGroup.add(bunBow);

      // Twin neck ringlets
      [-1, 1].forEach((side) => {
        const ringletPts = [
          new THREE.Vector3(side * 0.06, -0.03, -0.09),
          new THREE.Vector3(side * 0.085, -0.16, -0.11),
          new THREE.Vector3(side * 0.065, -0.29, -0.07),
        ];
        const ringlet = new THREE.Mesh(
          createTaperedStrandGeometry(ringletPts, 0.024, 0.003, 16, 8),
          hairMat
        );
        hairSwayGroup.add(ringlet);
      });
    } else {
      // idol-bob: Sleek inward-curled anime idol pageboy bob
      [-0.08, -0.04, 0, 0.04, 0.08].forEach((ox) => {
        const pts = [
          new THREE.Vector3(ox * 0.85, 0.04, -0.07),
          new THREE.Vector3(ox * 1.25, -0.09, -0.115),
          new THREE.Vector3(ox * 1.15, -0.22, -0.075),
        ];
        const lock = new THREE.Mesh(
          createTaperedStrandGeometry(pts, 0.042, 0.006, 16, 8),
          hairMat
        );
        lock.castShadow = true;
        hairGroup.add(lock);
      });

      const starPin = new THREE.Mesh(new THREE.OctahedronGeometry(0.017, 0), goldMetalMat);
      starPin.position.set(-0.082, 0.055, 0.066);
      hairGroup.add(starPin);
    }
  };

  let currentShoeStyle: ShoeStyle = 'pink-pumps';

  const rebuildHosiery = (style: HosieryStyle, accentHex: string, maxAnisotropy: number) => {
    clearGroup(leftLeg.thighHosieryGroup);
    clearGroup(rightLeg.thighHosieryGroup);
    clearGroup(leftLeg.calfHosieryGroup);
    clearGroup(rightLeg.calfHosieryGroup);

    if (activeHosieryTex) {
      activeHosieryTex.dispose();
      activeHosieryTex = null;
    }
    if (style === 'bare') return;

    activeHosieryTex = createHosieryTexture(style, accentHex, maxAnisotropy);
    hosieryMat.map = activeHosieryTex;
    hosieryMat.needsUpdate = true;

    const addSleeve = (leg: typeof leftLeg, includeUpperThigh: boolean) => {
      if (includeUpperThigh) {
        const thighCover = new THREE.Mesh(
          new THREE.LatheGeometry(
            [
              new THREE.Vector2(0.054, -0.09),
              new THREE.Vector2(0.043, -0.32),
              new THREE.Vector2(0.036, -0.43),
            ],
            16
          ),
          hosieryMat
        );
        leg.thighHosieryGroup.add(thighCover);
      }

      const calfCover = new THREE.Mesh(
        new THREE.LatheGeometry(
          [
            new THREE.Vector2(0.036, 0.0),
            new THREE.Vector2(0.043, -0.13),
            new THREE.Vector2(0.032, -0.28),
            new THREE.Vector2(0.023, -0.43),
          ],
          16
        ),
        hosieryMat
      );
      leg.calfHosieryGroup.add(calfCover);
    };

    const fullLength = style === 'galaxy-stockings' || style === 'lace-thighhigh';
    addSleeve(leftLeg, fullLength);
    addSleeve(rightLeg, fullLength);
  };

  const rebuildShoes = (style: ShoeStyle) => {
    currentShoeStyle = style;
    [leftLeg.shoeGroup, rightLeg.shoeGroup].forEach((grp, idx) => {
      clearGroup(grp);
      const side = idx === 0 ? -1 : 1;

      if (style === 'barefoot') {
        // Delicate anime barefoot foot & five sculpted toes flush at local y = -0.022
        const ankle = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), skinMat);
        ankle.position.set(0, -0.002, -0.01);
        grp.add(ankle);

        const footBridge = new THREE.Mesh(new THREE.SphereGeometry(0.023, 14, 12), skinMat);
        footBridge.scale.set(0.95, 0.56, 1.95);
        footBridge.position.set(0, -0.011, 0.034);
        footBridge.rotation.x = 0.08;
        footBridge.castShadow = true;
        grp.add(footBridge);

        for (let t = 0; t < 5; t++) {
          const toeScale = 1 - t * 0.13;
          const toe = new THREE.Mesh(new THREE.SphereGeometry(0.0052 * toeScale, 8, 8), skinMat);
          const xOff = side * (0.014 - t * 0.0072);
          toe.scale.set(0.9, 0.85, 1.35);
          toe.position.set(xOff, -0.017, 0.082 - t * 0.003);
          grp.add(toe);
        }
        return;
      }

      if (style === 'star-boots') {
        const bootShaft = new THREE.Mesh(
          new THREE.CylinderGeometry(0.041, 0.028, 0.27, 16),
          primaryFabricMat
        );
        bootShaft.position.set(0, 0.12, -0.008);
        bootShaft.castShadow = true;
        grp.add(bootShaft);

        const bootRim = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.006, 8, 20), goldMetalMat);
        bootRim.rotation.x = Math.PI / 2;
        bootRim.position.set(0, 0.255, -0.008);
        grp.add(bootRim);
      }

      // Heels / Pumps / Boots footbed (sole & stiletto bottom touch y = -0.08)
      const shoeMat = style === 'pink-pumps' ? secondaryFabricMat : primaryFabricMat;
      const footArchCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.012, -0.026),
        new THREE.Vector3(0, -0.036, 0.015),
        new THREE.Vector3(0, -0.068, 0.068),
        new THREE.Vector3(0, -0.070, 0.112),
      ]);
      const sole = new THREE.Mesh(new THREE.TubeGeometry(footArchCurve, 14, 0.024, 8, false), shoeMat);
      sole.scale.set(1.15, 0.45, 1);
      grp.add(sole);

      const stiletto = new THREE.Mesh(
        new THREE.CylinderGeometry(0.007, 0.004, 0.068, 10),
        goldMetalMat
      );
      stiletto.position.set(0, -0.046, -0.026);
      grp.add(stiletto);

      const vamp = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 10), shoeMat);
      vamp.scale.set(0.95, 0.55, 1.35);
      vamp.position.set(0, -0.056, 0.085);
      grp.add(vamp);

      if (style === 'pink-pumps') {
        const toeBow = createSculptedBow(shoeMat, pearlMat, 0.28);
        toeBow.position.set(0, -0.042, 0.095);
        grp.add(toeBow);
      } else {
        const ankleStrap = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.004, 6, 18), goldMetalMat);
        ankleStrap.rotation.x = Math.PI / 2;
        ankleStrap.position.set(0, 0.008, -0.01);
        grp.add(ankleStrap);

        const shoeGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.01, 0), crystalGemMat);
        shoeGem.position.set(0, -0.044, 0.088);
        grp.add(shoeGem);
      }
    });
  };

  const applyMakeup = (style: MakeupStyle) => {
    switch (style) {
      case 'sakura-blush':
        blushMat.opacity = 0.95;
        lipMat.color.set('#F472B6');
        lashMat.color.set('#3B1D36');
        break;
      case 'galaxy-glam':
        blushMat.opacity = 0.65;
        lipMat.color.set('#D946EF');
        lashMat.color.set('#14082E');
        break;
      case 'editorial-rose':
        blushMat.opacity = 0.58;
        lipMat.color.set('#BE123C');
        lashMat.color.set('#1F122B');
        break;
      default:
        // nikki-sweet
        blushMat.opacity = 0.72;
        lipMat.color.set('#FB7185');
        lashMat.color.set('#2B1522');
        break;
    }
  };

  const updateOutfit = (config: OutfitConfig, maxAnisotropy: number) => {
    // 1. Apply body proportion scaling
    const { bust, waist, hip, shoulder, height } = config.bodyScale;
    bodyGroup.scale.set(1, height, 1);
    torsoMesh.scale.set(1.12 * bust, 1.0, 0.74 * bust);
    shoulderMesh.scale.set(1, shoulder, 1);
    leftArm.shoulderJoint.position.x = -0.146 * shoulder;
    rightArm.shoulderJoint.position.x = 0.146 * shoulder;
    pelvisMesh.scale.set(1.06 * hip, 0.76, 0.84 * hip);
    bodiceGroup.scale.set(waist * 0.5 + bust * 0.5, 1, waist * 0.5 + bust * 0.5);
    skirtGroup.scale.set(hip, 1, hip);

    // 2. Update Nikki Eyes, Makeup & Hair
    const eyeHex = config.eyeColor || '#7C4A3A';
    const nextEyeTex = createNikkiEyeTexture(eyeHex, maxAnisotropy);
    eyePatchMat.map = nextEyeTex;
    eyePatchMat.needsUpdate = true;
    activeEyeTex.dispose();
    activeEyeTex = nextEyeTex;

    applyMakeup(config.makeup || 'nikki-sweet');
    rebuildHairstyle(config.hairStyle || 'nikki-long-pink', config.hairColor || '#FF91AA');

    // Update Lace Trim Texture
    const nextLaceTex = createLaceTrimTexture(config.accentColor, maxAnisotropy);
    laceTrimMat.map = nextLaceTex;
    laceTrimMat.needsUpdate = true;
    if (activeLaceTex) activeLaceTex.dispose();
    activeLaceTex = nextLaceTex;

    // Update Casual Crown Tee Texture
    const teeBase = config.bodice === 'nikki-tee' ? config.primaryColor : '#FFFFFF';
    const nextTeeTex = createCasualCrownTeeTexture(
      teeBase,
      config.secondaryColor,
      config.accentColor,
      maxAnisotropy
    );
    casualTeeMat.map = nextTeeTex;
    casualTeeMat.needsUpdate = true;
    if (activeTeeTex) activeTeeTex.dispose();
    activeTeeTex = nextTeeTex;

    // 3. Update fabric materials & procedural galaxy texture
    if (activeColorTex) {
      activeColorTex.dispose();
      activeColorTex = null;
    }

    const applyFabricProperties = (tex: THREE.Texture | null) => {
      primaryFabricMat.map = tex;
      primaryFabricMat.color.set(tex ? '#FFFFFF' : config.primaryColor);
      secondaryFabricMat.color.set(config.secondaryColor);
      goldMetalMat.color.set(config.accentColor);
      crystalGemMat.emissive.set(config.secondaryColor);

      switch (config.fabric) {
        case 'galaxy-silk':
          primaryFabricMat.roughness = 0.22;
          primaryFabricMat.metalness = 0.22;
          primaryFabricMat.iridescence = 0.85;
          primaryFabricMat.sheen = 0.98;
          primaryFabricMat.clearcoat = 0.28;
          break;
        case 'holographic-sequin':
          primaryFabricMat.roughness = 0.15;
          primaryFabricMat.metalness = 0.72;
          primaryFabricMat.iridescence = 1.0;
          primaryFabricMat.clearcoat = 0.92;
          break;
        case 'midnight-velvet':
          primaryFabricMat.roughness = 0.82;
          primaryFabricMat.metalness = 0.05;
          primaryFabricMat.iridescence = 0.2;
          primaryFabricMat.sheen = 1.0;
          primaryFabricMat.sheenRoughness = 0.58;
          primaryFabricMat.clearcoat = 0.0;
          break;
        case 'iridescent-organza':
          primaryFabricMat.roughness = 0.26;
          primaryFabricMat.metalness = 0.12;
          primaryFabricMat.iridescence = 0.96;
          primaryFabricMat.clearcoat = 0.58;
          break;
        case 'liquid-metal':
          primaryFabricMat.roughness = 0.12;
          primaryFabricMat.metalness = 0.94;
          primaryFabricMat.iridescence = 0.62;
          primaryFabricMat.clearcoat = 0.88;
          break;
      }
      primaryFabricMat.emissive.set(config.primaryColor);
      primaryFabricMat.emissiveIntensity = 0.12 + config.sparkleIntensity * 0.22;
      primaryFabricMat.needsUpdate = true;
    };

    if (config.sketchTextureDataUrl) {
      textureLoader.load(config.sketchTextureDataUrl, (loaded) => {
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.anisotropy = maxAnisotropy;
        activeColorTex = loaded;
        applyFabricProperties(loaded);
      });
    } else if (config.fabric === 'holographic-sequin') {
      activeColorTex = createSequinTexture(
        config.primaryColor,
        config.secondaryColor,
        config.accentColor,
        maxAnisotropy
      );
      applyFabricProperties(activeColorTex);
    } else {
      activeColorTex = createGalaxyFabricTexture(
        config.primaryColor,
        config.secondaryColor,
        config.accentColor,
        config.sparkleIntensity,
        maxAnisotropy
      );
      applyFabricProperties(activeColorTex);
    }

    // 4. Rebuild Couture Bodice or Miracle Nikki Loose Tee
    clearGroup(bodiceGroup);
    if (config.bodice === 'nikki-tee') {
      // Relaxed oversized boyfriend tee (longer tunic-tee when skirt === 'none', cropped tuck when paired with a skirt)
      const isTeeDress = config.skirt === 'none';
      const teePts = isTeeDress
        ? [
            new THREE.Vector2(0.185, -0.26), // mid-thigh relaxed hem
            new THREE.Vector2(0.165, -0.06), // gentle hip drape
            new THREE.Vector2(0.145, 0.13),  // loose waist
            new THREE.Vector2(0.142, 0.30),  // chest
            new THREE.Vector2(0.128, 0.40),  // shoulders
            new THREE.Vector2(0.068, 0.43),  // soft scoop neckline
          ]
        : [
            new THREE.Vector2(0.118, -0.01),
            new THREE.Vector2(0.128, 0.14),
            new THREE.Vector2(0.140, 0.30),
            new THREE.Vector2(0.126, 0.40),
            new THREE.Vector2(0.068, 0.43),
          ];
      const teeMesh = new THREE.Mesh(new THREE.LatheGeometry(teePts, 32), casualTeeMat);
      teeMesh.scale.set(1.16, 1, 0.84);
      // Rotate PI so u=0.5 front graphic sits dead-center on chest
      teeMesh.rotation.y = Math.PI;
      teeMesh.castShadow = true;
      bodiceGroup.add(teeMesh);

      // Soft tee crew neck rib trim
      const ribCollar = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.008, 8, 28), casualTeeMat);
      ribCollar.rotation.x = Math.PI / 2;
      ribCollar.scale.set(1.12, 0.84, 1);
      ribCollar.position.y = 0.428;
      bodiceGroup.add(ribCollar);

      // Relaxed short sleeves over upper arms
      [-1, 1].forEach((side) => {
        const capSleeve = new THREE.Mesh(
          new THREE.CylinderGeometry(0.044, 0.056, 0.145, 18),
          casualTeeMat
        );
        capSleeve.position.set(side * 0.175, 0.338, 0);
        capSleeve.rotation.z = side * -0.42;
        capSleeve.castShadow = true;
        bodiceGroup.add(capSleeve);
      });
    } else if (config.bodice === 'corset') {
      const corsetPts = [
        new THREE.Vector2(0.106, -0.02),
        new THREE.Vector2(0.084, 0.13),
        new THREE.Vector2(0.128, 0.28),
        new THREE.Vector2(0.114, 0.33),
      ];
      const corsetMesh = new THREE.Mesh(new THREE.LatheGeometry(corsetPts, 30), primaryFabricMat);
      corsetMesh.scale.set(1.14, 1, 0.78);
      corsetMesh.castShadow = true;
      bodiceGroup.add(corsetMesh);

      const trimRing = new THREE.Mesh(new THREE.TorusGeometry(0.116, 0.007, 10, 28), goldMetalMat);
      trimRing.rotation.x = Math.PI / 2;
      trimRing.scale.set(1.1, 0.76, 1);
      trimRing.position.y = 0.325;
      bodiceGroup.add(trimRing);

      const laceCollar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.116, 0.128, 0.05, 28, 1, true),
        laceTrimMat
      );
      laceCollar.scale.set(1.12, 1, 0.78);
      laceCollar.position.y = 0.34;
      bodiceGroup.add(laceCollar);

      const chestBow = createSculptedBow(secondaryFabricMat, crystalGemMat, 0.56);
      chestBow.position.set(0, 0.305, 0.095);
      bodiceGroup.add(chestBow);
    } else if (config.bodice === 'blazer') {
      const jacketPts = [
        new THREE.Vector2(0.122, -0.05),
        new THREE.Vector2(0.098, 0.13),
        new THREE.Vector2(0.136, 0.33),
        new THREE.Vector2(0.138, 0.41),
      ];
      const jacketMesh = new THREE.Mesh(new THREE.LatheGeometry(jacketPts, 28), primaryFabricMat);
      jacketMesh.scale.set(1.16, 1, 0.82);
      jacketMesh.castShadow = true;
      bodiceGroup.add(jacketMesh);

      const lapelShape = new THREE.Shape();
      lapelShape.moveTo(0, 0);
      lapelShape.lineTo(0.055, 0.21);
      lapelShape.lineTo(0.018, 0.25);
      lapelShape.lineTo(-0.01, 0.04);
      lapelShape.closePath();
      const lapelGeo = new THREE.ExtrudeGeometry(lapelShape, {
        depth: 0.01,
        bevelEnabled: true,
        bevelSize: 0.003,
        bevelThickness: 0.003,
      });
      [-1, 1].forEach((side) => {
        const lapel = new THREE.Mesh(lapelGeo.clone(), secondaryFabricMat);
        lapel.position.set(side * 0.022, 0.15, 0.102);
        lapel.scale.x = side;
        lapel.rotation.y = side * 0.15;
        bodiceGroup.add(lapel);
      });
      lapelGeo.dispose();

      [0.08, 0.14, 0.2].forEach((by) => {
        const btn = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 10), goldMetalMat);
        btn.position.set(0.02, by, 0.098);
        bodiceGroup.add(btn);
      });
    } else if (config.bodice === 'halter') {
      const topPts = [
        new THREE.Vector2(0.105, 0.0),
        new THREE.Vector2(0.084, 0.13),
        new THREE.Vector2(0.126, 0.30),
        new THREE.Vector2(0.056, 0.43),
      ];
      const topMesh = new THREE.Mesh(new THREE.LatheGeometry(topPts, 28), primaryFabricMat);
      topMesh.scale.set(1.14, 1, 0.77);
      topMesh.castShadow = true;
      bodiceGroup.add(topMesh);

      const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.009, 10, 24), goldMetalMat);
      collarRing.rotation.x = Math.PI / 2;
      collarRing.position.y = 0.43;
      bodiceGroup.add(collarRing);

      const chestGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.018, 0), crystalGemMat);
      chestGem.position.set(0, 0.31, 0.098);
      bodiceGroup.add(chestGem);
    } else {
      // asym-drape
      const drapePts = [
        new THREE.Vector2(0.108, -0.02),
        new THREE.Vector2(0.085, 0.14),
        new THREE.Vector2(0.128, 0.30),
        new THREE.Vector2(0.114, 0.37),
      ];
      const drapeMesh = new THREE.Mesh(new THREE.LatheGeometry(drapePts, 28), primaryFabricMat);
      drapeMesh.scale.set(1.15, 1, 0.78);
      drapeMesh.castShadow = true;
      bodiceGroup.add(drapeMesh);

      const sashCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.11, 0.04, 0.10),
        new THREE.Vector3(0.02, 0.21, 0.118),
        new THREE.Vector3(0.12, 0.40, 0.03),
        new THREE.Vector3(0.04, 0.35, -0.10),
      ]);
      const sashMesh = new THREE.Mesh(
        new THREE.TubeGeometry(sashCurve, 24, 0.024, 10, false),
        secondaryFabricMat
      );
      bodiceGroup.add(sashMesh);

      const shoulderBow = createSculptedBow(secondaryFabricMat, goldMetalMat, 0.58);
      shoulderBow.position.set(0.118, 0.39, 0.035);
      shoulderBow.rotation.z = -0.35;
      bodiceGroup.add(shoulderBow);
    }

    // 5. Rebuild Multi-Layered Nikki Couture Skirt / Bottom / None
    clearGroup(skirtGroup);
    if (config.skirt === 'none') {
      // Clean tunic/base tee silhouette with unobstructed legs
    } else if (config.skirt === 'ballgown') {
      const gownPts = [
        new THREE.Vector2(0.105, 0.05),
        new THREE.Vector2(0.24, -0.07),
        new THREE.Vector2(0.43, -0.36),
        new THREE.Vector2(0.58, -0.74),
        new THREE.Vector2(0.65, -0.91),
      ];
      const gownMesh = new THREE.Mesh(new THREE.LatheGeometry(gownPts, 40), primaryFabricMat);
      gownMesh.castShadow = true;
      gownMesh.receiveShadow = true;
      skirtGroup.add(gownMesh);

      const laceHem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.60, 0.68, 0.14, 36, 1, true),
        laceTrimMat
      );
      laceHem.position.y = -0.86;
      skirtGroup.add(laceHem);

      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const petal = new THREE.Mesh(
          new THREE.LatheGeometry(
            [
              new THREE.Vector2(0.115, 0.052),
              new THREE.Vector2(0.28, -0.10),
              new THREE.Vector2(0.44, -0.38),
              new THREE.Vector2(0.50, -0.52),
            ],
            14,
            ang,
            (Math.PI * 2) / 6.3
          ),
          secondaryFabricMat
        );
        skirtGroup.add(petal);
      }

      const pearlRing = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.007, 8, 28), pearlMat);
      pearlRing.rotation.x = Math.PI / 2;
      pearlRing.position.y = 0.055;
      skirtGroup.add(pearlRing);

      const backBow = createSculptedBow(secondaryFabricMat, crystalGemMat, 1.35);
      backBow.position.set(0, 0.05, -0.14);
      backBow.rotation.y = Math.PI;
      backBow.rotation.x = 0.18;
      skirtGroup.add(backBow);
    } else if (config.skirt === 'mermaid') {
      const mermaidPts = [
        new THREE.Vector2(0.106, 0.05),
        new THREE.Vector2(0.155, -0.12),
        new THREE.Vector2(0.138, -0.45),
        new THREE.Vector2(0.24, -0.68),
        new THREE.Vector2(0.47, -0.92),
      ];
      const mermaidMesh = new THREE.Mesh(new THREE.LatheGeometry(mermaidPts, 36), primaryFabricMat);
      mermaidMesh.scale.set(1.06, 1, 0.92);
      mermaidMesh.castShadow = true;
      skirtGroup.add(mermaidMesh);

      const hemLace = new THREE.Mesh(
        new THREE.CylinderGeometry(0.36, 0.49, 0.14, 32, 1, true),
        laceTrimMat
      );
      hemLace.position.y = -0.86;
      skirtGroup.add(hemLace);

      const hemRuffle = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.028, 12, 32), secondaryFabricMat);
      hemRuffle.rotation.x = Math.PI / 2;
      hemRuffle.position.y = -0.90;
      skirtGroup.add(hemRuffle);

      const hipBow = createSculptedBow(secondaryFabricMat, goldMetalMat, 0.85);
      hipBow.position.set(0.13, 0.02, 0.06);
      hipBow.rotation.y = 0.7;
      skirtGroup.add(hipBow);
    } else if (config.skirt === 'mini-pleat') {
      const miniPts = [
        new THREE.Vector2(0.106, 0.05),
        new THREE.Vector2(0.21, -0.14),
        new THREE.Vector2(0.27, -0.31),
      ];
      const miniMesh = new THREE.Mesh(new THREE.LatheGeometry(miniPts, 20), primaryFabricMat);
      miniMesh.castShadow = true;
      skirtGroup.add(miniMesh);

      const underLace = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.29, 0.09, 28, 1, true),
        laceTrimMat
      );
      underLace.position.y = -0.32;
      skirtGroup.add(underLace);

      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.34, 0.055), secondaryFabricMat);
        fin.position.set(Math.cos(angle) * 0.20, -0.15, Math.sin(angle) * 0.20);
        fin.rotation.y = -angle;
        fin.rotation.z = 0.28;
        skirtGroup.add(fin);
      }

      const waistBow = createSculptedBow(secondaryFabricMat, crystalGemMat, 0.78);
      waistBow.position.set(-0.1, 0.04, 0.09);
      waistBow.rotation.y = -0.4;
      skirtGroup.add(waistBow);
    } else {
      // tailored-pants
      [-0.082, 0.082].forEach((px) => {
        const pantLeg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.068, 0.112, 0.88, 20),
          primaryFabricMat
        );
        pantLeg.position.set(px, -0.43, 0);
        pantLeg.castShadow = true;
        skirtGroup.add(pantLeg);
      });

      const sashBow = createSculptedBow(secondaryFabricMat, goldMetalMat, 0.72);
      sashBow.position.set(0.08, 0.04, 0.095);
      sashBow.rotation.y = 0.35;
      skirtGroup.add(sashBow);
    }

    // 5b. Rebuild Hosiery & Shoes / Barefoot
    rebuildHosiery(config.hosiery || 'bare', config.accentColor, maxAnisotropy);
    rebuildShoes(config.shoes || 'pink-pumps');

    // 6. Rebuild Sleeves / Cape / Fairy Wings
    clearGroup(sleevesGroup);
    if (config.sleeves === 'celestial-cape') {
      const capePts = [
        new THREE.Vector2(0.13, 0.41),
        new THREE.Vector2(0.32, 0.04),
        new THREE.Vector2(0.54, -0.62),
        new THREE.Vector2(0.68, -1.22),
      ];
      const capeGeo = new THREE.LatheGeometry(capePts, 28, Math.PI * 0.62, Math.PI * 0.76);
      const capeMesh = new THREE.Mesh(capeGeo, secondaryFabricMat);
      capeMesh.castShadow = true;
      sleevesGroup.add(capeMesh);

      [-1, 1].forEach((side) => {
        const clasp = new THREE.Mesh(new THREE.OctahedronGeometry(0.02, 0), goldMetalMat);
        clasp.position.set(side * 0.125, 0.405, 0.03);
        sleevesGroup.add(clasp);
      });
    } else if (config.sleeves === 'puff-sleeves') {
      [-1, 1].forEach((side) => {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.098, 20, 16), secondaryFabricMat);
        puff.scale.set(1.0, 1.15, 1.0);
        puff.position.set(side * 0.19, 0.355, 0);
        puff.castShadow = true;
        sleevesGroup.add(puff);

        const cuffRing = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.007, 8, 20), laceTrimMat);
        cuffRing.rotation.x = Math.PI / 2;
        cuffRing.position.set(side * 0.185, 0.255, 0);
        sleevesGroup.add(cuffRing);
      });
    } else if (config.sleeves === 'wing-drape') {
      [-1, 1].forEach((side) => {
        // Upper butterfly wing
        const upperWing = new THREE.Shape();
        upperWing.moveTo(0, 0);
        upperWing.bezierCurveTo(side * 0.26, 0.34, side * 0.56, 0.22, side * 0.48, -0.18);
        upperWing.bezierCurveTo(side * 0.28, -0.12, side * 0.12, -0.08, 0, -0.1);
        const upperGeo = new THREE.ExtrudeGeometry(upperWing, {
          depth: 0.006,
          bevelEnabled: true,
          bevelSize: 0.003,
          bevelThickness: 0.003,
        });
        const uMesh = new THREE.Mesh(upperGeo, secondaryFabricMat);
        uMesh.position.set(side * 0.06, 0.33, -0.085);
        uMesh.rotation.y = side * -0.35;
        sleevesGroup.add(uMesh);

        // Lower wing
        const lowerWing = new THREE.Shape();
        lowerWing.moveTo(0, -0.08);
        lowerWing.bezierCurveTo(side * 0.22, -0.12, side * 0.38, -0.44, side * 0.18, -0.52);
        lowerWing.bezierCurveTo(side * 0.08, -0.44, side * 0.04, -0.25, 0, -0.18);
        const lowerGeo = new THREE.ExtrudeGeometry(lowerWing, {
          depth: 0.005,
          bevelEnabled: true,
          bevelSize: 0.002,
          bevelThickness: 0.002,
        });
        const lMesh = new THREE.Mesh(lowerGeo, laceTrimMat);
        lMesh.position.set(side * 0.06, 0.33, -0.09);
        lMesh.rotation.y = side * -0.38;
        sleevesGroup.add(lMesh);
      });
    }

    // 7. Rebuild Crown Tiara, Choker, Waist Belt & Celestial Halo Regalia
    clearGroup(accessoryGroup);
    clearGroup(headAccessoryGroup);
    const hasTiara = config.accessory === 'tiara' || config.accessory === 'full-regalia';
    const hasChoker = config.accessory === 'choker' || config.accessory === 'full-regalia';
    const hasBelt = config.accessory === 'belt' || config.accessory === 'full-regalia';

    if (hasTiara) {
      const tiaraBase = new THREE.Mesh(
        new THREE.TorusGeometry(0.094, 0.006, 8, 28, Math.PI * 1.25),
        goldMetalMat
      );
      tiaraBase.position.set(0, 0.098, 0.015);
      tiaraBase.rotation.x = Math.PI / 2 - 0.25;
      tiaraBase.rotation.z = -Math.PI * 0.12;
      headAccessoryGroup.add(tiaraBase);

      for (let i = -3; i <= 3; i++) {
        const spikeH = i === 0 ? 0.072 : 0.048 - Math.abs(i) * 0.009;
        const spire = new THREE.Mesh(new THREE.ConeGeometry(0.008, spikeH, 4), goldMetalMat);
        const ang = i * 0.26;
        spire.position.set(Math.sin(ang) * 0.092, 0.118 + spikeH * 0.4, Math.cos(ang) * 0.092);
        headAccessoryGroup.add(spire);
      }

      const centerGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.018, 0), crystalGemMat);
      centerGem.position.set(0, 0.138, 0.102);
      headAccessoryGroup.add(centerGem);
    }

    if (hasChoker) {
      const choker = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.0055, 8, 24), goldMetalMat);
      choker.rotation.x = Math.PI / 2;
      choker.position.set(0, 0.49, 0.002);
      accessoryGroup.add(choker);

      const pendant = new THREE.Mesh(new THREE.OctahedronGeometry(0.016, 0), crystalGemMat);
      pendant.position.set(0, 0.472, 0.046);
      accessoryGroup.add(pendant);
    }

    if (hasBelt) {
      const belt = new THREE.Mesh(new THREE.TorusGeometry(0.094, 0.011, 10, 28), goldMetalMat);
      belt.rotation.x = Math.PI / 2;
      belt.scale.set(1.14, 0.78, 1);
      belt.position.set(0, 0.13, 0);
      accessoryGroup.add(belt);

      const buckle = new THREE.Mesh(new THREE.OctahedronGeometry(0.022, 0), crystalGemMat);
      buckle.scale.set(1, 1.3, 0.5);
      buckle.position.set(0, 0.13, 0.086);
      accessoryGroup.add(buckle);
    }

    if (config.accessory === 'full-regalia') {
      const haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.005, 8, 42), goldMetalMat);
      haloRing.position.set(0, 0.64, -0.075);
      haloRing.rotation.x = 0.15;
      accessoryGroup.add(haloRing);

      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const starOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.016, 0), crystalGemMat);
        starOrb.position.set(Math.cos(a) * 0.28, 0.64 + Math.sin(a) * 0.28, -0.075);
        accessoryGroup.add(starOrb);
      }
    }
  };

  // Animation state
  let curHipTilt = 0;
  let curPelvisY = 0.96;
  let curRootY = 0;
  let curTorsoTwist = 0;
  let curModelYaw = 0;
  let nextBlinkAt = 2.4;

  const updateAnimation = (dt: number, elapsed: number, pose: ModelPose, runwayProgress: number) => {
    const k = 1 - Math.exp(-7.5 * dt);

    // Natural Nikki anime eye blink every ~3.5-4.5s
    let eyeOpen = 1;
    const blinkDur = 0.15;
    if (elapsed >= nextBlinkAt) {
      const bT = (elapsed - nextBlinkAt) / blinkDur;
      if (bT >= 1) {
        nextBlinkAt = elapsed + 2.8 + (Math.sin(elapsed * 13.7) * 0.5 + 0.5) * 2.2;
      } else {
        eyeOpen = Math.max(0.08, 1 - Math.sin(bT * Math.PI) * 0.92);
      }
    }
    for (let i = 0; i < blinkGroups.length; i++) {
      blinkGroups[i].scale.y = eyeOpen;
    }

    const basePelvisY = currentShoeStyle === 'barefoot' ? 0.902 : 0.96;
    let targetPelvisY = basePelvisY;
    const targetRootY = 0;
    let targetHipTilt = 0;
    let targetTorsoTwist = 0;
    let targetLeftHipX = 0;
    let targetRightHipX = 0;
    let targetLeftHipZ = 0;
    let targetRightHipZ = 0;
    let targetLeftKneeX = 0;
    let targetRightKneeX = 0;
    let targetLeftArmZ = 0.18;
    let targetRightArmZ = -0.18;
    let targetLeftArmX = 0;
    let targetRightArmX = 0;
    let targetLeftElbowX = -0.25;
    let targetRightElbowX = -0.25;
    let targetHeadX = 0;
    let targetHeadZ = 0;
    let targetGentleYaw = 0;
    let targetModelYaw = 0;

    if (pose === 'nikki-grace') {
      // Iconic Love Nikki crossed-ankle gentle contrapposto with softly lifted dainty hands
      targetHipTilt = 0.055;
      targetTorsoTwist = -0.06 + Math.sin(elapsed * 0.8) * 0.02;
      targetGentleYaw = 0.09;
      targetLeftArmZ = 0.23 + Math.sin(elapsed * 1.1) * 0.02;
      targetRightArmZ = -0.25 - Math.sin(elapsed * 1.1) * 0.02;
      targetLeftElbowX = -0.18;
      targetRightElbowX = -0.22;
      targetLeftHipZ = 0.03;
      targetRightHipX = -0.06;
      targetRightHipZ = 0.095;
      targetRightKneeX = 0.17;
      targetHeadX = 0.015;
      targetHeadZ = -0.045 + Math.sin(elapsed * 0.85) * 0.02;
    } else if (pose === 'editorial-idle') {
      targetHipTilt = 0.065;
      targetTorsoTwist = Math.sin(elapsed * 0.9) * 0.05;
      targetLeftArmZ = 0.16 + Math.sin(elapsed * 1.1) * 0.03;
      targetRightArmZ = -0.24;
      targetRightElbowX = -0.48;
      targetLeftHipX = -0.03;
      targetRightHipX = 0.05;
      targetHeadZ = Math.sin(elapsed * 0.85) * 0.04;
    } else if (pose === 'runway-walk') {
      const stride = elapsed * 4.6;
      const s = Math.sin(stride);
      const c = Math.cos(stride);
      targetPelvisY = basePelvisY + Math.abs(c) * 0.025;
      targetHipTilt = s * 0.12;
      targetTorsoTwist = -s * 0.1;
      targetLeftHipX = s * 0.42;
      targetRightHipX = -s * 0.42;
      targetLeftKneeX = Math.max(0, -c * 0.42);
      targetRightKneeX = Math.max(0, c * 0.42);
      targetLeftArmX = -s * 0.28;
      targetRightArmX = s * 0.28;
      targetLeftArmZ = 0.14;
      targetRightArmZ = -0.14;
      root.position.z = Math.sin(runwayProgress * Math.PI) * 1.1;
    } else if (pose === 'hip-pop') {
      targetHipTilt = 0.18;
      targetTorsoTwist = -0.18;
      targetLeftArmZ = 0.55;
      targetLeftElbowX = -1.2;
      targetRightArmZ = -0.32;
      targetRightArmX = -0.22;
      targetLeftHipX = -0.16;
      targetLeftKneeX = 0.24;
      targetHeadX = -0.04;
      targetHeadZ = 0.09;
    } else if (pose === 'supermodel-turn') {
      targetModelYaw = (elapsed * 1.4) % (Math.PI * 2);
      targetHipTilt = 0.1;
      targetLeftArmZ = 0.35;
      targetRightArmZ = -0.35;
      targetLeftElbowX = -0.6;
      targetRightElbowX = -0.6;
    } else if (pose === 'workout-sculpt') {
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * 2.8);
      targetPelvisY = basePelvisY - pulse * 0.22;
      targetLeftHipX = -pulse * 0.62;
      targetRightHipX = -pulse * 0.62;
      targetLeftKneeX = pulse * 1.15;
      targetRightKneeX = pulse * 1.15;
      targetLeftArmX = -pulse * 1.1;
      targetRightArmX = -pulse * 1.1;
      targetLeftArmZ = 0.12;
      targetRightArmZ = -0.12;
    } else if (pose === 'workout-posture') {
      const lift = 0.5 + 0.5 * Math.sin(elapsed * 1.8);
      targetLeftArmZ = 0.9 + lift * 1.45;
      targetRightArmZ = -(0.9 + lift * 1.45);
      targetLeftElbowX = -1.2;
      targetRightElbowX = -1.2;
      targetHeadX = -0.06;
    }

    if (pose !== 'runway-walk') {
      root.position.z = THREE.MathUtils.damp(root.position.z, 0, 5, dt);
    }

    curHipTilt += (targetHipTilt - curHipTilt) * k;
    curPelvisY += (targetPelvisY - curPelvisY) * k;
    curTorsoTwist += (targetTorsoTwist - curTorsoTwist) * k;
    curRootY += (targetRootY - curRootY) * k;

    if (pose === 'supermodel-turn') {
      curModelYaw = targetModelYaw;
      bodyGroup.rotation.y = curModelYaw;
    } else {
      bodyGroup.rotation.y = THREE.MathUtils.damp(bodyGroup.rotation.y, targetGentleYaw, 6, dt);
    }

    // Secondary hair float & sway during breathing / catwalk / turn
    const swayBoost = pose === 'runway-walk' || pose === 'supermodel-turn' ? 0.08 : 0.03;
    hairSwayGroup.rotation.x = THREE.MathUtils.damp(
      hairSwayGroup.rotation.x,
      0.04 + Math.sin(elapsed * 2.4) * swayBoost + (pose === 'runway-walk' ? 0.08 : 0),
      6,
      dt
    );
    hairSwayGroup.rotation.z = THREE.MathUtils.damp(
      hairSwayGroup.rotation.z,
      -curHipTilt * 0.45 + Math.cos(elapsed * 1.7) * 0.025,
      6,
      dt
    );

    pelvisPivot.position.y = curPelvisY;
    pelvisPivot.rotation.z = curHipTilt;
    torsoPivot.rotation.z = -curHipTilt * 0.7;
    torsoPivot.rotation.y = curTorsoTwist;
    headPivot.rotation.x = THREE.MathUtils.damp(headPivot.rotation.x, targetHeadX, 6, dt);
    headPivot.rotation.z = THREE.MathUtils.damp(headPivot.rotation.z, targetHeadZ, 6, dt);

    leftLeg.hipJoint.rotation.x = THREE.MathUtils.damp(leftLeg.hipJoint.rotation.x, targetLeftHipX, 8, dt);
    rightLeg.hipJoint.rotation.x = THREE.MathUtils.damp(rightLeg.hipJoint.rotation.x, targetRightHipX, 8, dt);
    leftLeg.hipJoint.rotation.z = THREE.MathUtils.damp(leftLeg.hipJoint.rotation.z, targetLeftHipZ, 8, dt);
    rightLeg.hipJoint.rotation.z = THREE.MathUtils.damp(rightLeg.hipJoint.rotation.z, targetRightHipZ, 8, dt);
    leftLeg.kneeJoint.rotation.x = THREE.MathUtils.damp(leftLeg.kneeJoint.rotation.x, targetLeftKneeX, 8, dt);
    rightLeg.kneeJoint.rotation.x = THREE.MathUtils.damp(rightLeg.kneeJoint.rotation.x, targetRightKneeX, 8, dt);

    leftArm.shoulderJoint.rotation.z = THREE.MathUtils.damp(leftArm.shoulderJoint.rotation.z, targetLeftArmZ, 8, dt);
    rightArm.shoulderJoint.rotation.z = THREE.MathUtils.damp(rightArm.shoulderJoint.rotation.z, targetRightArmZ, 8, dt);
    leftArm.shoulderJoint.rotation.x = THREE.MathUtils.damp(leftArm.shoulderJoint.rotation.x, targetLeftArmX, 8, dt);
    rightArm.shoulderJoint.rotation.x = THREE.MathUtils.damp(rightArm.shoulderJoint.rotation.x, targetRightArmX, 8, dt);
    leftArm.elbowJoint.rotation.x = THREE.MathUtils.damp(leftArm.elbowJoint.rotation.x, targetLeftElbowX, 8, dt);
    rightArm.elbowJoint.rotation.x = THREE.MathUtils.damp(rightArm.elbowJoint.rotation.x, targetRightElbowX, 8, dt);
  };

  return {
    root,
    clickableTargets: [clickProxy],
    updateOutfit,
    updateAnimation,
    dispose: () => {
      shadowTex.dispose();
      blushTex.dispose();
      activeEyeTex.dispose();
      if (activeLaceTex) activeLaceTex.dispose();
      if (activeTeeTex) activeTeeTex.dispose();
      if (activeHosieryTex) activeHosieryTex.dispose();
      if (activeColorTex) activeColorTex.dispose();
      root.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry.dispose();
        }
      });
      skinMat.dispose();
      hairMat.dispose();
      lashMat.dispose();
      browMat.dispose();
      blushMat.dispose();
      eyePatchMat.dispose();
      goldMetalMat.dispose();
      pearlMat.dispose();
      crystalGemMat.dispose();
      lipMat.dispose();
      primaryFabricMat.dispose();
      secondaryFabricMat.dispose();
      casualTeeMat.dispose();
      hosieryMat.dispose();
      laceTrimMat.dispose();
    },
  };
}

export interface CosmicPetRig {
  root: THREE.Group;
  clickableTargets: THREE.Object3D[];
  updatePetState: (state: PetState) => void;
  triggerReaction: (reaction: PetReaction) => void;
  updateAnimation: (dt: number, elapsed: number) => void;
  dispose: () => void;
}

export function buildCosmicPetRig(): CosmicPetRig {
  const root = new THREE.Group();
  root.name = 'CosmicPetRoot';
  root.position.set(-1.12, 0, 0.42);
  root.rotation.y = 0.35;

  const shadowTex = createContactShadowTexture();
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.75, 0.75),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.48,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.006;
  root.add(shadow);

  const actorGroup = new THREE.Group();
  root.add(actorGroup);

  const furMat = new THREE.MeshPhysicalMaterial({
    color: '#A78BFA',
    roughness: 0.72,
    metalness: 0.05,
    sheen: 0.9,
    sheenColor: new THREE.Color('#F0ABFC'),
  });

  const bellyMat = new THREE.MeshPhysicalMaterial({
    color: '#F5F3FF',
    roughness: 0.62,
    metalness: 0.05,
    sheen: 0.6,
  });

  const innerEarMat = new THREE.MeshStandardMaterial({
    color: '#F472B6',
    emissive: '#C026D3',
    emissiveIntensity: 0.35,
    roughness: 0.4,
  });

  const eyeGlossMat = new THREE.MeshPhysicalMaterial({
    color: '#0F0A2A',
    roughness: 0.06,
    metalness: 0.1,
    clearcoat: 1.0,
  });

  const catchlightMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });

  const goldTrimMat = new THREE.MeshPhysicalMaterial({
    color: '#FDE68A',
    metalness: 0.92,
    roughness: 0.18,
    clearcoat: 0.5,
  });

  const auraMat = new THREE.MeshStandardMaterial({
    color: '#67E8F9',
    emissive: '#38BDF8',
    emissiveIntensity: 0.85,
    roughness: 0.2,
    transparent: true,
    opacity: 0.85,
  });

  // Body
  const bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.19, 22, 18), furMat);
  bodyMesh.scale.set(0.95, 1.08, 1.12);
  bodyMesh.position.set(0, 0.24, 0);
  bodyMesh.castShadow = true;
  actorGroup.add(bodyMesh);

  const bellyPatch = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 14), bellyMat);
  bellyPatch.scale.set(0.85, 0.95, 0.55);
  bellyPatch.position.set(0, 0.24, 0.12);
  actorGroup.add(bellyPatch);

  // Chest star badge
  const chestStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.036, 0), auraMat);
  chestStar.position.set(0, 0.28, 0.195);
  actorGroup.add(chestStar);

  // 4 Grounded Paws
  const pawPositions: Array<[number, number, number]> = [
    [-0.095, 0.055, 0.11],
    [0.095, 0.055, 0.11],
    [-0.1, 0.055, -0.1],
    [0.1, 0.055, -0.1],
  ];
  pawPositions.forEach(([x, y, z]) => {
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 12), bellyMat);
    paw.scale.set(0.9, 0.72, 1.1);
    paw.position.set(x, y, z);
    paw.castShadow = true;
    actorGroup.add(paw);
  });

  // Head group
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.48, 0.08);
  actorGroup.add(headGroup);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.165, 24, 20), furMat);
  headMesh.scale.set(1.08, 0.94, 0.96);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Eyes + Sparkle Catchlights
  [-0.062, 0.062].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 14, 14), eyeGlossMat);
    eye.position.set(ex, 0.015, 0.142);
    headGroup.add(eye);

    const catchLight = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), catchlightMat);
    catchLight.position.set(ex + 0.008, 0.025, 0.166);
    headGroup.add(catchLight);
  });

  // Nose & Blush
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 10), innerEarMat);
  nose.scale.set(1.2, 0.8, 0.8);
  nose.position.set(0, -0.018, 0.162);
  headGroup.add(nose);

  [-0.095, 0.095].forEach((bx) => {
    const blush = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 10), innerEarMat);
    blush.scale.set(1.2, 0.65, 0.4);
    blush.position.set(bx, -0.022, 0.13);
    headGroup.add(blush);
  });

  // Dynamic Species Ears & Tail & Accessories Groups
  const earsGroup = new THREE.Group();
  headGroup.add(earsGroup);

  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0.18, -0.18);
  actorGroup.add(tailPivot);

  const accessoryGroup = new THREE.Group();
  actorGroup.add(accessoryGroup);

  const headAccessoryGroup = new THREE.Group();
  headGroup.add(headAccessoryGroup);

  // Orbiting starlight ring when reacting
  const reactionOrbitRing = new THREE.Group();
  reactionOrbitRing.position.set(0, 0.36, 0);
  reactionOrbitRing.visible = false;
  actorGroup.add(reactionOrbitRing);

  for (let i = 0; i < 6; i++) {
    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.025, 0), goldTrimMat);
    const a = (i / 6) * Math.PI * 2;
    orb.position.set(Math.cos(a) * 0.34, 0, Math.sin(a) * 0.34);
    reactionOrbitRing.add(orb);
  }

  // Click proxy
  const clickProxy = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 12, 12),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  clickProxy.position.y = 0.36;
  clickProxy.userData.interactType = 'pet';
  root.add(clickProxy);

  const clearGroup = (g: THREE.Group) => {
    while (g.children.length > 0) {
      const c = g.children[0];
      g.remove(c);
      c.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).geometry.dispose();
      });
    }
  };

  const updatePetState = (state: PetState) => {
    furMat.color.set(state.coatColor);
    auraMat.color.set(state.auraColor);
    auraMat.emissive.set(state.auraColor);

    // Rebuild Species Ears
    clearGroup(earsGroup);
    clearGroup(tailPivot);

    if (state.species === 'nebula-cat') {
      [-1, 1].forEach((side) => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.058, 0.13, 12), furMat);
        ear.position.set(side * 0.1, 0.145, 0.0);
        ear.rotation.z = side * -0.28;
        earsGroup.add(ear);

        const inner = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.085, 10), innerEarMat);
        inner.position.set(side * 0.1, 0.14, 0.024);
        inner.rotation.z = side * -0.28;
        earsGroup.add(inner);
      });

      const tailCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0.1, -0.14),
        new THREE.Vector3(0.04, 0.26, -0.12),
      ]);
      const tailMesh = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 16, 0.032, 10, false), furMat);
      tailPivot.add(tailMesh);
      const tipStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.038, 0), auraMat);
      tipStar.position.set(0.04, 0.27, -0.12);
      tailPivot.add(tipStar);
    } else if (state.species === 'astral-fox') {
      [-1, 1].forEach((side) => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.068, 0.17, 12), furMat);
        ear.position.set(side * 0.108, 0.16, 0.0);
        ear.rotation.z = side * -0.35;
        earsGroup.add(ear);

        const inner = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.11, 10), innerEarMat);
        inner.position.set(side * 0.108, 0.155, 0.025);
        inner.rotation.z = side * -0.35;
        earsGroup.add(inner);
      });

      const foxTail = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 14), furMat);
      foxTail.scale.set(0.85, 1.55, 0.95);
      foxTail.position.set(0, 0.1, -0.08);
      foxTail.rotation.x = -0.45;
      tailPivot.add(foxTail);

      const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 12), bellyMat);
      tailTip.position.set(0, 0.22, -0.15);
      tailPivot.add(tailTip);
    } else {
      // starlight-bunny
      [-1, 1].forEach((side) => {
        const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.038, 0.19, 8, 12), furMat);
        ear.position.set(side * 0.078, 0.21, -0.02);
        ear.rotation.z = side * -0.15;
        ear.rotation.x = -0.1;
        earsGroup.add(ear);

        const inner = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.13, 6, 10), innerEarMat);
        inner.position.set(side * 0.078, 0.205, 0.004);
        inner.rotation.z = side * -0.15;
        inner.rotation.x = -0.1;
        earsGroup.add(inner);
      });

      const pomTail = new THREE.Mesh(new THREE.SphereGeometry(0.078, 14, 14), bellyMat);
      pomTail.position.set(0, 0.02, -0.02);
      tailPivot.add(pomTail);
    }

    // Rebuild Accessories
    clearGroup(accessoryGroup);
    clearGroup(headAccessoryGroup);
    if (state.accessory === 'star-collar') {
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.018, 10, 24), goldTrimMat);
      collar.rotation.x = Math.PI / 2;
      collar.position.set(0, 0.355, 0.04);
      accessoryGroup.add(collar);
      const bell = new THREE.Mesh(new THREE.OctahedronGeometry(0.032, 0), auraMat);
      bell.position.set(0, 0.33, 0.19);
      accessoryGroup.add(bell);
    } else if (state.accessory === 'galaxy-bow') {
      [-1, 1].forEach((side) => {
        const loop = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.08, 10), innerEarMat);
        loop.rotation.z = side * Math.PI / 2;
        loop.position.set(side * 0.045, 0.16, 0.06);
        headAccessoryGroup.add(loop);
      });
      const knot = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 10), goldTrimMat);
      knot.position.set(0, 0.16, 0.065);
      headAccessoryGroup.add(knot);
    } else if (state.accessory === 'celestial-halo') {
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 10, 28), goldTrimMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.set(0, 0.26, 0);
      headAccessoryGroup.add(halo);
    } else if (state.accessory === 'angel-wings') {
      [-1, 1].forEach((side) => {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.11, 0.02), bellyMat);
        wing.position.set(side * 0.19, 0.3, -0.08);
        wing.rotation.y = side * -0.45;
        wing.rotation.z = side * 0.32;
        accessoryGroup.add(wing);
      });
    }
  };

  let activeReaction: PetReaction = 'idle';
  let reactionTimer = 0;

  const triggerReaction = (reaction: PetReaction) => {
    activeReaction = reaction;
    reactionTimer = 1.6;
  };

  const updateAnimation = (dt: number, elapsed: number) => {
    // Gentle cosmic breathing & tail sway
    const breath = Math.sin(elapsed * 2.4) * 0.02;
    tailPivot.rotation.y = Math.sin(elapsed * 4.2) * 0.35;
    headGroup.rotation.z = Math.sin(elapsed * 1.5) * 0.05;

    if (reactionTimer > 0) {
      reactionTimer = Math.max(0, reactionTimer - dt);
      const t = 1 - reactionTimer / 1.6;
      reactionOrbitRing.visible = true;
      reactionOrbitRing.rotation.y += dt * 4.5;

      if (activeReaction === 'play' || activeReaction === 'feed') {
        const hop = Math.abs(Math.sin(t * Math.PI * 3)) * 0.24;
        actorGroup.position.y = hop;
        const squash = 1 + Math.sin(t * Math.PI * 6) * 0.09;
        actorGroup.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
      } else if (activeReaction === 'groom' || activeReaction === 'bath') {
        actorGroup.rotation.y = t * Math.PI * 2;
        actorGroup.position.y = Math.sin(t * Math.PI) * 0.12;
      } else {
        actorGroup.position.y = Math.abs(Math.sin(t * Math.PI * 2)) * 0.15;
        headGroup.rotation.x = -0.15;
      }
    } else {
      reactionOrbitRing.visible = false;
      actorGroup.position.y = THREE.MathUtils.damp(actorGroup.position.y, breath * 0.4, 8, dt);
      actorGroup.rotation.y = THREE.MathUtils.damp(actorGroup.rotation.y, 0, 8, dt);
      actorGroup.scale.x = THREE.MathUtils.damp(actorGroup.scale.x, 1, 8, dt);
      actorGroup.scale.y = THREE.MathUtils.damp(actorGroup.scale.y, 1, 8, dt);
      actorGroup.scale.z = THREE.MathUtils.damp(actorGroup.scale.z, 1, 8, dt);
      headGroup.rotation.x = THREE.MathUtils.damp(headGroup.rotation.x, 0, 8, dt);
    }
  };

  return {
    root,
    clickableTargets: [clickProxy],
    updatePetState,
    triggerReaction,
    updateAnimation,
    dispose: () => {
      shadowTex.dispose();
      root.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).geometry.dispose();
      });
      furMat.dispose();
      bellyMat.dispose();
      innerEarMat.dispose();
      eyeGlossMat.dispose();
      catchlightMat.dispose();
      goldTrimMat.dispose();
      auraMat.dispose();
    },
  };
}

export interface GalaxyStageRig {
  root: THREE.Group;
  update: (dt: number, elapsed: number) => void;
  dispose: () => void;
}

export function buildGalaxyStageRig(maxAnisotropy: number): GalaxyStageRig {
  const root = new THREE.Group();
  const floorTex = createRunwayFloorTexture(maxAnisotropy);

  // Main cosmic runway turntable pedestal (top at y=0)
  const pedestalMat = new THREE.MeshPhysicalMaterial({
    map: floorTex,
    roughness: 0.18,
    metalness: 0.35,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
  });
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.35, 0.24, 64), pedestalMat);
  pedestal.position.y = -0.12;
  pedestal.receiveShadow = true;
  root.add(pedestal);

  // Gold bezel rim around pedestal
  const rimMat = new THREE.MeshPhysicalMaterial({
    color: '#FDE68A',
    metalness: 0.94,
    roughness: 0.18,
    emissive: '#A855F7',
    emissiveIntensity: 0.22,
  });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.16, 0.028, 12, 64), rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = -0.01;
  root.add(rim);

  // Extended Catwalk Strip
  const runwayMat = new THREE.MeshPhysicalMaterial({
    color: '#0D0824',
    roughness: 0.14,
    metalness: 0.45,
    clearcoat: 0.95,
  });
  const runwayStrip = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.16, 6.2), runwayMat);
  runwayStrip.position.set(0, -0.1, 3.6);
  runwayStrip.receiveShadow = true;
  root.add(runwayStrip);

  const edgeGlowMat = new THREE.MeshStandardMaterial({
    color: '#E879F9',
    emissive: '#C026D3',
    emissiveIntensity: 1.35,
    roughness: 0.2,
  });
  [-0.89, 0.89].forEach((ex) => {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 6.2), edgeGlowMat);
    strip.position.set(ex, -0.01, 3.6);
    root.add(strip);
  });

  // Outer Deep Space Horizon Plane
  const voidFloor = new THREE.Mesh(
    new THREE.CircleGeometry(28, 48),
    new THREE.MeshStandardMaterial({
      color: '#060414',
      roughness: 0.65,
      metalness: 0.2,
    })
  );
  voidFloor.rotation.x = -Math.PI / 2;
  voidFloor.position.y = -0.25;
  voidFloor.receiveShadow = true;
  root.add(voidFloor);

  // Rotating Constellation Rings
  const ringA = new THREE.Mesh(new THREE.TorusGeometry(3.15, 0.012, 8, 96), rimMat);
  ringA.rotation.x = Math.PI / 2 + 0.12;
  ringA.position.y = 0.45;
  root.add(ringA);

  const ringB = new THREE.Mesh(new THREE.TorusGeometry(3.8, 0.009, 8, 96), edgeGlowMat);
  ringB.rotation.x = Math.PI / 2 - 0.14;
  ringB.position.y = 1.15;
  root.add(ringB);

  // Instanced floating diamond crystals around the cosmic studio
  const crystalCount = 72;
  const crystalGeo = new THREE.OctahedronGeometry(0.055, 0);
  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: '#E0F2FE',
    emissive: '#A855F7',
    emissiveIntensity: 0.6,
    metalness: 0.5,
    roughness: 0.12,
  });
  const crystalInstanced = new THREE.InstancedMesh(crystalGeo, crystalMat, crystalCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < crystalCount; i++) {
    const ang = (i / crystalCount) * Math.PI * 2;
    const rad = 2.9 + (i % 5) * 0.72;
    const y = 0.25 + ((i * 19) % 10) * 0.28;
    dummy.position.set(Math.cos(ang) * rad, y, Math.sin(ang) * rad);
    const sc = 0.55 + (i % 4) * 0.28;
    dummy.scale.setScalar(sc);
    dummy.rotation.set(i * 0.5, i * 0.8, 0);
    dummy.updateMatrix();
    crystalInstanced.setMatrixAt(i, dummy.matrix);
    _colorA.set(i % 3 === 0 ? '#FDE68A' : i % 3 === 1 ? '#F0ABFC' : '#67E8F9');
    crystalInstanced.setColorAt(i, _colorA);
  }
  crystalInstanced.instanceMatrix.needsUpdate = true;
  if (crystalInstanced.instanceColor) crystalInstanced.instanceColor.needsUpdate = true;
  crystalInstanced.computeBoundingSphere();
  root.add(crystalInstanced);

  return {
    root,
    update: (dt: number, elapsed: number) => {
      ringA.rotation.z += dt * 0.18;
      ringB.rotation.z -= dt * 0.14;
      crystalInstanced.rotation.y = elapsed * 0.04;
    },
    dispose: () => {
      floorTex.dispose();
      pedestalMat.dispose();
      rimMat.dispose();
      runwayMat.dispose();
      edgeGlowMat.dispose();
      crystalGeo.dispose();
      crystalMat.dispose();
      root.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).geometry.dispose();
      });
    },
  };
}

export interface BurstParticlePool {
  points: THREE.Points;
  emitBurst: (origin: THREE.Vector3, colorHex: string, count: number) => void;
  update: (dt: number) => void;
  dispose: () => void;
}

export function createBurstParticlePool(maxParticles = 320): BurstParticlePool {
  const positions = new Float32Array(maxParticles * 3);
  const velocities = new Float32Array(maxParticles * 3);
  const colors = new Float32Array(maxParticles * 3);
  const ages = new Float32Array(maxParticles);
  const lifetimes = new Float32Array(maxParticles);

  for (let i = 0; i < maxParticles; i++) {
    positions[i * 3 + 1] = -999;
    ages[i] = 999;
    lifetimes[i] = 1;
  }

  const geo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(positions, 3);
  const colAttr = new THREE.BufferAttribute(colors, 3);
  geo.setAttribute('position', posAttr);
  geo.setAttribute('color', colAttr);

  const spriteTex = createSparkleSpriteTexture();
  const mat = new THREE.PointsMaterial({
    size: 0.22,
    map: spriteTex,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;

  let cursor = 0;

  const emitBurst = (origin: THREE.Vector3, colorHex: string, count: number) => {
    _colorA.set(colorHex);
    for (let i = 0; i < count; i++) {
      const idx = cursor;
      cursor = (cursor + 1) % maxParticles;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 0.8 + Math.random() * 2.1;

      positions[idx * 3] = origin.x + (Math.random() - 0.5) * 0.35;
      positions[idx * 3 + 1] = origin.y + (Math.random() - 0.5) * 0.35;
      positions[idx * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.35;

      velocities[idx * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[idx * 3 + 1] = Math.abs(Math.cos(phi)) * speed + 0.65;
      velocities[idx * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;

      const mixGold = i % 3 === 0;
      colors[idx * 3] = mixGold ? 1.0 : _colorA.r;
      colors[idx * 3 + 1] = mixGold ? 0.92 : _colorA.g;
      colors[idx * 3 + 2] = mixGold ? 0.65 : _colorA.b;

      ages[idx] = 0;
      lifetimes[idx] = 0.9 + Math.random() * 0.7;
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  };

  const update = (dt: number) => {
    let anyActive = false;
    for (let i = 0; i < maxParticles; i++) {
      if (ages[i] < lifetimes[i]) {
        anyActive = true;
        ages[i] += dt;
        const p = i * 3;
        velocities[p + 1] -= 1.2 * dt; // gentle cosmic float gravity
        positions[p] += velocities[p] * dt;
        positions[p + 1] += velocities[p + 1] * dt;
        positions[p + 2] += velocities[p + 2] * dt;
        if (ages[i] >= lifetimes[i]) {
          positions[p + 1] = -999;
        }
      }
    }
    if (anyActive) {
      posAttr.needsUpdate = true;
    }
  };

  return {
    points,
    emitBurst,
    update,
    dispose: () => {
      geo.dispose();
      mat.dispose();
      spriteTex.dispose();
    },
  };
}

export const MODEL_BURST_ORIGIN = new THREE.Vector3(0, 1.05, 0);
export const PET_BURST_ORIGIN = new THREE.Vector3(-1.12, 0.45, 0.42);
export const RUNWAY_FLASH_ORIGIN = _vec3A.set(0, 1.4, 0.8);
