import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { BikeConfig } from "../BikeRacingGame";

// ─── Constants ────────────────────────────────────────────────────────────────
const RACE_DISTANCE = 1000;
const ROAD_WIDTH = 18;
const LANES = [-6, 0, 6];
const GEAR_MAX_SPEED_MS = [0, 8.3, 16.7, 25, 33.3, 41.7, 50];
const TOTAL_BIKES = 6;
const LATERAL_SPEED = 8;

interface Controls {
  up: boolean;
  down: boolean;
  gearUp: boolean;
  gearDown: boolean;
  left: boolean;
  right: boolean;
}

interface AiState {
  id: number;
  z: number;
  x: number;
  velZ: number;
  targetSpeed: number;
  color: string;
  laneChangeTimer: number;
  targetX: number;
}

interface GameRef {
  playerZ: number;
  playerX: number;
  playerVelZ: number;
  gear: number;
  gearCooldown: number;
  aiStates: AiState[];
  finished: boolean;
  startTime: number;
  wheelRot: number;
  hudTimer: number;
  raceStarted: boolean;
}

interface HudData {
  speedKmh: number;
  gear: number;
  position: number;
  distRemaining: number;
}

const AI_COLORS = ["#e74c3c", "#3498db", "#2ecc71", "#9b59b6", "#f39c12"];

// ─── 3D Components ────────────────────────────────────────────────────────────

function Road() {
  const length = RACE_DISTANCE + 100;
  const dashPositions = Array.from({ length: 50 }, (_, i) => i * 20 + 10);
  return (
    <group>
      {/* Asphalt surface */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, RACE_DISTANCE / 2]}
      >
        <planeGeometry args={[ROAD_WIDTH, length]} />
        <meshStandardMaterial color="#1c1c1c" roughness={0.95} metalness={0} />
      </mesh>
      {/* Shoulder lines */}
      {[-9, 9].map((x) => (
        <mesh
          key={`shoulder-${x}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, 0.015, RACE_DISTANCE / 2]}
        >
          <planeGeometry args={[0.18, length]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} metalness={0} />
        </mesh>
      ))}
      {/* Lane dashes */}
      {[-3, 3].map((x) =>
        dashPositions.map((z) => (
          <mesh
            key={`dash-${x}-${z}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[x, 0.015, z]}
          >
            <planeGeometry args={[0.12, 8]} />
            <meshStandardMaterial
              color="#ffffff"
              roughness={0.7}
              metalness={0}
              opacity={0.55}
              transparent
            />
          </mesh>
        )),
      )}
      {/* Start line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 2]}>
        <planeGeometry args={[ROAD_WIDTH, 0.8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} metalness={0} />
      </mesh>
      {/* Finish line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, RACE_DISTANCE]}>
        <planeGeometry args={[ROAD_WIDTH, 1.5]} />
        <meshStandardMaterial color="#ffff00" roughness={0.8} metalness={0} />
      </mesh>
      {/* Grass */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, RACE_DISTANCE / 2]}
      >
        <planeGeometry args={[200, length + 100]} />
        <meshStandardMaterial color="#1a3a1a" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

function seededRand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function Buildings() {
  const buildings: React.ReactElement[] = [];
  const count = 35;
  for (let i = 0; i < count; i++) {
    const z = i * 30 - 10;
    const lwL = 8 + seededRand(i * 7 + 1) * 8;
    const hL = 6 + seededRand(i * 7 + 2) * 20;
    const cL = `hsl(${Math.floor(seededRand(i * 7 + 3) * 40 + 200)}, 15%, ${Math.floor(seededRand(i * 7 + 4) * 15 + 20)}%)`;
    buildings.push(
      <mesh key={`building-left-${i}`} position={[-14 - lwL / 2, hL / 2, z]}>
        <boxGeometry args={[lwL, hL, 25]} />
        <meshLambertMaterial color={cL} />
      </mesh>,
    );
    const lwR = 8 + seededRand(i * 7 + 5) * 8;
    const hR = 6 + seededRand(i * 7 + 6) * 20;
    const cR = `hsl(${Math.floor(seededRand(i * 7) * 40 + 20)}, 12%, ${Math.floor(seededRand(i * 7 + 4) * 15 + 18)}%)`;
    buildings.push(
      <mesh key={`building-right-${i}`} position={[14 + lwR / 2, hR / 2, z]}>
        <boxGeometry args={[lwR, hR, 25]} />
        <meshLambertMaterial color={cR} />
      </mesh>,
    );
    for (let w = 0; w < 3; w++) {
      const wx = -14 - lwL / 2 + (seededRand(i * 21 + w) - 0.5) * (lwL - 2);
      const wy = 2 + seededRand(i * 21 + w + 3) * (hL - 4);
      buildings.push(
        <mesh key={`window-${i}-${w}`} position={[wx, wy, z - 12.4]}>
          <planeGeometry args={[0.8, 1.2]} />
          <meshBasicMaterial color="#ffe066" />
        </mesh>,
      );
    }
  }
  return <group>{buildings}</group>;
}

// ─── Wheel Component ──────────────────────────────────────────────────────────
function Wheel({ posZ, wheelRot }: { posZ: number; wheelRot: number }) {
  const spokes = [0, 1, 2, 3, 4, 5];
  return (
    <group position={[0, 0.42, posZ]}>
      {/* Tire */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.42, 0.42, 0.22, 20]} />
        <meshStandardMaterial
          color="#111111"
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>
      {/* Rim */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.31, 0.31, 0.19, 20]} />
        <meshStandardMaterial
          color="#c0c0c0"
          roughness={0.15}
          metalness={1.0}
        />
      </mesh>
      {/* Hub */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 0.24, 10]} />
        <meshStandardMaterial
          color="#aaaaaa"
          roughness={0.2}
          metalness={0.95}
        />
      </mesh>
      {/* Spokes */}
      {spokes.map((s) => (
        <mesh key={s} rotation={[wheelRot + (s * Math.PI) / 3, 0, Math.PI / 2]}>
          <boxGeometry args={[0.03, 0.62, 0.025]} />
          <meshStandardMaterial
            color="#bbbbbb"
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Rider Component ──────────────────────────────────────────────────────────
function Rider({ color }: { color: string }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Torso - hunched forward */}
      <mesh position={[0, 1.55, 0.15]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.38, 0.55, 0.28]} />
        <meshStandardMaterial color="#222222" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Head / Helmet */}
      <mesh position={[0, 1.97, 0.05]}>
        <sphereGeometry args={[0.175, 12, 10]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Helmet visor */}
      <mesh position={[0, 1.95, -0.14]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[0.25, 0.1, 0.04]} />
        <meshStandardMaterial
          color="#1a1a2e"
          roughness={0}
          metalness={0.2}
          opacity={0.85}
          transparent
          emissive="#000011"
        />
      </mesh>
      {/* Left upper arm */}
      <mesh position={[-0.25, 1.6, -0.05]} rotation={[0.5, 0, 0.2]}>
        <boxGeometry args={[0.1, 0.35, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Right upper arm */}
      <mesh position={[0.25, 1.6, -0.05]} rotation={[0.5, 0, -0.2]}>
        <boxGeometry args={[0.1, 0.35, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} metalness={0.1} />
      </mesh>
    </group>
  );
}

// ─── Bike Model ───────────────────────────────────────────────────────────────
function BikeModel({
  position,
  color,
  wheelRot,
}: { position: [number, number, number]; color: string; wheelRot: number }) {
  return (
    <group position={position}>
      {/* ── Main fairing / body – multi-part swooping shape ── */}
      {/* Nose / front fairing */}
      <mesh position={[0, 0.72, -1.05]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[0.62, 0.38, 0.7]} />
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.8}
          emissive={color}
          emissiveIntensity={0.06}
        />
      </mesh>
      {/* Mid body */}
      <mesh position={[0, 0.78, 0.1]}>
        <boxGeometry args={[0.72, 0.48, 1.1]} />
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.8}
          emissive={color}
          emissiveIntensity={0.06}
        />
      </mesh>
      {/* Tail section */}
      <mesh position={[0, 0.72, 1.0]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[0.55, 0.36, 0.75]} />
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.8}
          emissive={color}
          emissiveIntensity={0.06}
        />
      </mesh>
      {/* Belly pan */}
      <mesh position={[0, 0.38, -0.15]}>
        <boxGeometry args={[0.6, 0.14, 1.6]} />
        <meshStandardMaterial
          color={color}
          roughness={0.35}
          metalness={0.75}
          emissive={color}
          emissiveIntensity={0.04}
        />
      </mesh>

      {/* ── Gas tank hump ── */}
      <mesh position={[0, 1.1, 0.05]}>
        <boxGeometry args={[0.48, 0.22, 0.72]} />
        <meshStandardMaterial
          color={color}
          roughness={0.25}
          metalness={0.85}
          emissive={color}
          emissiveIntensity={0.08}
        />
      </mesh>

      {/* ── Seat section ── */}
      <mesh position={[0, 1.12, 0.72]}>
        <boxGeometry args={[0.32, 0.14, 0.55]} />
        <meshStandardMaterial
          color="#1a1a1a"
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      {/* ── Fairing side panels ── */}
      <mesh position={[-0.38, 0.72, -0.1]}>
        <boxGeometry args={[0.06, 0.42, 1.4]} />
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.8}
          emissive={color}
          emissiveIntensity={0.04}
        />
      </mesh>
      <mesh position={[0.38, 0.72, -0.1]}>
        <boxGeometry args={[0.06, 0.42, 1.4]} />
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.8}
          emissive={color}
          emissiveIntensity={0.04}
        />
      </mesh>

      {/* ── Front fork – two angled cylinders ── */}
      <mesh position={[-0.1, 0.75, -1.1]} rotation={[0.18, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.85, 8]} />
        <meshStandardMaterial color="#c0c0c0" roughness={0.1} metalness={1.0} />
      </mesh>
      <mesh position={[0.1, 0.75, -1.1]} rotation={[0.18, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.85, 8]} />
        <meshStandardMaterial color="#c0c0c0" roughness={0.1} metalness={1.0} />
      </mesh>

      {/* ── Handlebars ── */}
      <mesh position={[0, 1.05, -0.85]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.75, 8]} />
        <meshStandardMaterial color="#c0c0c0" roughness={0.1} metalness={1.0} />
      </mesh>

      {/* ── Rear swingarm ── */}
      <mesh position={[0, 0.45, 0.85]} rotation={[-0.12, 0, 0]}>
        <boxGeometry args={[0.12, 0.1, 0.7]} />
        <meshStandardMaterial color="#333333" roughness={0.5} metalness={0.7} />
      </mesh>

      {/* ── Exhaust pipe ── */}
      <mesh position={[0.44, 0.32, 0.5]} rotation={[0.05, 0, 0]}>
        <cylinderGeometry args={[0.065, 0.05, 1.3, 8]} />
        <meshStandardMaterial color="#c0c0c0" roughness={0.1} metalness={1.0} />
      </mesh>
      {/* Exhaust tip */}
      <mesh position={[0.44, 0.32, 1.15]}>
        <cylinderGeometry args={[0.07, 0.07, 0.12, 8]} />
        <meshStandardMaterial
          color="#888888"
          roughness={0.2}
          metalness={0.95}
        />
      </mesh>

      {/* ── Windscreen ── */}
      <mesh position={[0, 1.1, -1.0]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[0.5, 0.28, 0.06]} />
        <meshStandardMaterial
          color="#4488cc"
          roughness={0}
          metalness={0.2}
          opacity={0.55}
          transparent
        />
      </mesh>

      {/* ── Headlight ── */}
      <mesh position={[0, 0.78, -1.42]}>
        <boxGeometry args={[0.32, 0.18, 0.06]} />
        <meshStandardMaterial
          color="#fffbe0"
          roughness={0}
          metalness={0.1}
          emissive="#fffbe0"
          emissiveIntensity={1.2}
        />
      </mesh>

      {/* ── Tail light ── */}
      <mesh position={[0, 0.82, 1.42]}>
        <boxGeometry args={[0.28, 0.1, 0.05]} />
        <meshStandardMaterial
          color="#ff2200"
          roughness={0}
          metalness={0.1}
          emissive="#ff2200"
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* ── Wheels ── */}
      <Wheel posZ={-1.18} wheelRot={wheelRot} />
      <Wheel posZ={1.12} wheelRot={wheelRot} />

      {/* ── Rider ── */}
      <Rider color={color} />
    </group>
  );
}

interface Scene3DProps {
  gameRef: React.MutableRefObject<GameRef>;
  isPausedRef: React.MutableRefObject<boolean>;
  onHudUpdate: (data: HudData) => void;
  onRaceEnd: (pos: number, timeMs: number) => void;
  selectedBike: BikeConfig;
  controlsRef: React.MutableRefObject<Controls>;
}

function Scene3D({
  gameRef,
  isPausedRef,
  onHudUpdate,
  onRaceEnd,
  selectedBike,
  controlsRef,
}: Scene3DProps) {
  const { camera } = useThree();
  const playerMeshRef = useRef<THREE.Group>(null);
  const aiMeshRefs = useRef<(THREE.Group | null)[]>([]);
  const prevGearUp = useRef(false);
  const prevGearDown = useRef(false);
  const leanAngle = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const g = gameRef.current;
    const ctrl = controlsRef.current;

    if (isPausedRef.current || g.finished) return;

    if (!g.raceStarted) {
      g.raceStarted = true;
      g.startTime = performance.now();
    }

    if (ctrl.gearUp && !prevGearUp.current && g.gearCooldown <= 0) {
      g.gear = Math.min(6, g.gear + 1);
      g.gearCooldown = 0.3;
    }
    if (ctrl.gearDown && !prevGearDown.current && g.gearCooldown <= 0) {
      g.gear = Math.max(1, g.gear - 1);
      g.gearCooldown = 0.3;
    }
    prevGearUp.current = ctrl.gearUp;
    prevGearDown.current = ctrl.gearDown;
    if (g.gearCooldown > 0) g.gearCooldown -= dt;

    const maxSpeed = Math.min(
      GEAR_MAX_SPEED_MS[g.gear],
      selectedBike.maxSpeedMs,
    );
    if (ctrl.up) {
      const accel = selectedBike.accelRate * (g.gear * 0.15 + 0.7);
      g.playerVelZ += accel * dt;
    } else {
      g.playerVelZ = Math.max(0, g.playerVelZ - 4 * dt);
    }
    if (ctrl.down) {
      g.playerVelZ = Math.max(0, g.playerVelZ - 20 * dt);
    }
    g.playerVelZ = Math.min(g.playerVelZ, maxSpeed);
    g.playerZ += g.playerVelZ * dt;
    g.wheelRot += g.playerVelZ * dt * 2;

    // Lateral movement
    if (ctrl.left) g.playerX -= LATERAL_SPEED * dt;
    if (ctrl.right) g.playerX += LATERAL_SPEED * dt;
    g.playerX = Math.max(-8, Math.min(8, g.playerX));

    // Lean animation
    const targetLean = ctrl.left ? 0.15 : ctrl.right ? -0.15 : 0;
    leanAngle.current += (targetLean - leanAngle.current) * 10 * dt;

    for (const ai of g.aiStates) {
      const diff = ai.targetSpeed - ai.velZ;
      ai.velZ += diff * 1.2 * dt;
      ai.velZ = Math.max(0, ai.velZ);
      ai.z += ai.velZ * dt;
      ai.laneChangeTimer -= dt;
      if (ai.laneChangeTimer <= 0) {
        ai.laneChangeTimer = 2 + Math.random() * 3;
        ai.targetX = LANES[Math.floor(Math.random() * 3)];
      }
      ai.x += (ai.targetX - ai.x) * 2 * dt;
    }

    const allZ = [g.playerZ, ...g.aiStates.map((a) => a.z)];
    allZ.sort((a, b) => b - a);
    const position = allZ.indexOf(g.playerZ) + 1;

    g.hudTimer += dt;
    if (g.hudTimer >= 0.08) {
      g.hudTimer = 0;
      onHudUpdate({
        speedKmh: Math.round(g.playerVelZ * 3.6),
        gear: g.gear,
        position,
        distRemaining: Math.max(0, Math.round(RACE_DISTANCE - g.playerZ)),
      });
    }

    if (g.playerZ >= RACE_DISTANCE && !g.finished) {
      g.finished = true;
      onRaceEnd(position, performance.now() - g.startTime);
    }
    for (const ai of g.aiStates) {
      if (ai.z > RACE_DISTANCE + 50) ai.velZ = 0;
    }

    if (playerMeshRef.current) {
      playerMeshRef.current.position.set(g.playerX, 0, g.playerZ);
      playerMeshRef.current.rotation.z = leanAngle.current;
    }
    for (let i = 0; i < g.aiStates.length; i++) {
      const mesh = aiMeshRefs.current[i];
      if (mesh) mesh.position.set(g.aiStates[i].x, 0, g.aiStates[i].z);
    }

    const camTarget = new THREE.Vector3(g.playerX, 4.5, g.playerZ - 10);
    camera.position.lerp(camTarget, 0.12);
    const lookX = g.playerX + (ctrl.right ? 1 : ctrl.left ? -1 : 0);
    camera.lookAt(new THREE.Vector3(lookX, 1.5, g.playerZ + 20));
  });

  return (
    <>
      <ambientLight intensity={0.55} />
      {/* Main sun directional light */}
      <directionalLight position={[20, 40, 20]} intensity={1.8} castShadow />
      {/* Fill light from opposite angle for depth */}
      <directionalLight
        position={[-15, 20, -10]}
        intensity={0.5}
        color="#a8c8ff"
      />
      <hemisphereLight args={["#87ceeb", "#1a3a1a", 0.4]} />
      {/* Headlight glow ahead of player */}
      <pointLight
        position={[gameRef.current.playerX, 1.2, gameRef.current.playerZ - 8]}
        color="#fffbe0"
        intensity={3}
        distance={15}
      />
      {/* Tail light glow behind player */}
      <pointLight
        position={[gameRef.current.playerX, 1.0, gameRef.current.playerZ + 3]}
        color="#ff2200"
        intensity={2}
        distance={8}
      />
      <color attach="background" args={["#87ceeb"]} />
      <fog attach="fog" args={["#b0d8f0", 80, 280]} />
      <Road />
      <Buildings />
      <group ref={playerMeshRef}>
        <BikeModel
          position={[0, 0, 0]}
          color={selectedBike.color}
          wheelRot={gameRef.current.wheelRot}
        />
      </group>
      {gameRef.current.aiStates.map((ai) => (
        <group
          key={`ai-bike-${ai.id}`}
          ref={(el) => {
            aiMeshRefs.current[ai.id] = el;
          }}
        >
          <BikeModel position={[0, 0, 0]} color={ai.color} wheelRot={0} />
        </group>
      ))}
    </>
  );
}

// ─── HUD ──────────────────────────────────────────────────────────────────────
function HUD({
  data,
  onPause,
  onGearUp,
  onGearDown,
  onBrakeStart,
  onBrakeEnd,
  onAccelStart,
  onAccelEnd,
  onLeftStart,
  onLeftEnd,
  onRightStart,
  onRightEnd,
}: {
  data: HudData;
  onPause: () => void;
  onGearUp: () => void;
  onGearDown: () => void;
  onBrakeStart: () => void;
  onBrakeEnd: () => void;
  onAccelStart: () => void;
  onAccelEnd: () => void;
  onLeftStart: () => void;
  onLeftEnd: () => void;
  onRightStart: () => void;
  onRightEnd: () => void;
}) {
  const ordinals = ["1st", "2nd", "3rd", "4th", "5th", "6th"];
  const gearNames = ["", "1", "2", "3", "4", "5", "6"];
  const gearBars = [1, 2, 3, 4, 5, 6];

  const steerBtnStyle = {
    background: "oklch(0.2 0.03 240 / 0.85)",
    backdropFilter: "blur(8px)",
    color: "oklch(0.9 0 0)",
    border: "2px solid oklch(0.4 0.05 240 / 0.5)",
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ fontFamily: "Outfit, sans-serif" }}
    >
      {/* Progress bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: "oklch(0.15 0 0)" }}
      >
        <div
          className="h-full transition-all duration-100"
          style={{
            width: `${Math.max(0, Math.min(100, ((RACE_DISTANCE - data.distRemaining) / RACE_DISTANCE) * 100))}%`,
            background: "oklch(0.72 0.19 55)",
          }}
        />
      </div>

      {/* Top bar */}
      <div className="absolute top-2 left-0 right-0 flex items-start justify-between px-3 pt-1">
        <div
          className="rounded-xl px-4 py-2 flex gap-4 items-end"
          style={{
            background: "oklch(0.06 0 0 / 0.75)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div>
            <div
              className="text-3xl font-bold leading-none"
              style={{ color: "oklch(0.95 0 0)" }}
            >
              {data.speedKmh}
            </div>
            <div className="text-xs" style={{ color: "oklch(0.5 0 0)" }}>
              km/h
            </div>
          </div>
          <div className="text-center">
            <div
              className="text-3xl font-bold leading-none"
              style={{ color: "oklch(0.72 0.19 55)" }}
            >
              {gearNames[data.gear]}
            </div>
            <div className="text-xs" style={{ color: "oklch(0.5 0 0)" }}>
              GEAR
            </div>
          </div>
        </div>

        <div
          className="rounded-xl px-4 py-2 text-center"
          style={{
            background: "oklch(0.06 0 0 / 0.75)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            className="text-2xl font-bold"
            style={{ color: "oklch(0.95 0 0)" }}
          >
            {ordinals[data.position - 1] ?? `${data.position}th`}
          </div>
          <div className="text-xs" style={{ color: "oklch(0.5 0 0)" }}>
            / {TOTAL_BIKES}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            data-ocid="game.pause_button"
            className="pointer-events-auto rounded-xl px-4 py-2 font-bold text-sm transition-all duration-100 active:scale-95"
            style={{
              background: "oklch(0.06 0 0 / 0.75)",
              backdropFilter: "blur(8px)",
              color: "oklch(0.95 0 0)",
            }}
            onClick={onPause}
          >
            ⏸ PAUSE
          </button>
          <div
            className="rounded-xl px-3 py-1.5 text-center"
            style={{
              background: "oklch(0.06 0 0 / 0.75)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div
              className="text-sm font-bold"
              style={{ color: "oklch(0.72 0.19 55)" }}
            >
              {data.distRemaining}m
            </div>
            <div className="text-xs" style={{ color: "oklch(0.5 0 0)" }}>
              to finish
            </div>
          </div>
        </div>
      </div>

      {/* Gear indicator */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 flex gap-1">
        {gearBars.map((g) => (
          <div
            key={g}
            className="w-6 h-1.5 rounded-sm transition-all duration-150"
            style={{
              background:
                g <= data.gear
                  ? "oklch(0.72 0.19 55)"
                  : "oklch(0.25 0 0 / 0.6)",
            }}
          />
        ))}
      </div>

      {/* Mobile Controls */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-4 pointer-events-auto">
        {/* BRAKE - far left */}
        <button
          type="button"
          data-ocid="game.brake_button"
          className="w-20 h-20 rounded-full font-bold text-sm flex flex-col items-center justify-center gap-0.5 transition-all duration-75 active:scale-90 select-none"
          style={{
            background: "oklch(0.55 0.21 25 / 0.85)",
            backdropFilter: "blur(8px)",
            color: "oklch(0.95 0 0)",
            border: "2px solid oklch(0.7 0.2 25 / 0.5)",
          }}
          onTouchStart={onBrakeStart}
          onTouchEnd={onBrakeEnd}
          onMouseDown={onBrakeStart}
          onMouseUp={onBrakeEnd}
          onMouseLeave={onBrakeEnd}
        >
          🛑<span className="text-xs">BRAKE</span>
        </button>

        {/* Center controls: LEFT / GEAR DOWN / GEAR UP / RIGHT */}
        <div className="flex gap-2 items-end pb-2">
          <button
            type="button"
            data-ocid="game.steer_left_button"
            className="w-14 h-14 rounded-full font-bold text-xl flex flex-col items-center justify-center gap-0 transition-all duration-75 active:scale-90 select-none"
            style={steerBtnStyle}
            onTouchStart={onLeftStart}
            onTouchEnd={onLeftEnd}
            onMouseDown={onLeftStart}
            onMouseUp={onLeftEnd}
            onMouseLeave={onLeftEnd}
          >
            ◀
          </button>
          <button
            type="button"
            data-ocid="game.gear_down_button"
            className="w-14 h-14 rounded-full font-bold text-lg flex flex-col items-center justify-center gap-0.5 transition-all duration-75 active:scale-90 select-none"
            style={{
              background: "oklch(0.2 0 0 / 0.85)",
              backdropFilter: "blur(8px)",
              color: "oklch(0.8 0 0)",
              border: "2px solid oklch(0.35 0 0 / 0.5)",
            }}
            onTouchStart={onGearDown}
            onMouseDown={onGearDown}
          >
            ▼<span className="text-xs">DN</span>
          </button>
          <button
            type="button"
            data-ocid="game.gear_up_button"
            className="w-14 h-14 rounded-full font-bold text-lg flex flex-col items-center justify-center gap-0.5 transition-all duration-75 active:scale-90 select-none"
            style={{
              background: "oklch(0.2 0 0 / 0.85)",
              backdropFilter: "blur(8px)",
              color: "oklch(0.8 0 0)",
              border: "2px solid oklch(0.35 0 0 / 0.5)",
            }}
            onTouchStart={onGearUp}
            onMouseDown={onGearUp}
          >
            ▲<span className="text-xs">UP</span>
          </button>
          <button
            type="button"
            data-ocid="game.steer_right_button"
            className="w-14 h-14 rounded-full font-bold text-xl flex flex-col items-center justify-center gap-0 transition-all duration-75 active:scale-90 select-none"
            style={steerBtnStyle}
            onTouchStart={onRightStart}
            onTouchEnd={onRightEnd}
            onMouseDown={onRightStart}
            onMouseUp={onRightEnd}
            onMouseLeave={onRightEnd}
          >
            ▶
          </button>
        </div>

        {/* ACCELERATE - far right */}
        <button
          type="button"
          data-ocid="game.accelerate_button"
          className="w-20 h-20 rounded-full font-bold text-sm flex flex-col items-center justify-center gap-0.5 transition-all duration-75 active:scale-90 select-none"
          style={{
            background: "oklch(0.55 0.2 145 / 0.85)",
            backdropFilter: "blur(8px)",
            color: "oklch(0.06 0 0)",
            border: "2px solid oklch(0.7 0.2 145 / 0.5)",
          }}
          onTouchStart={onAccelStart}
          onTouchEnd={onAccelEnd}
          onMouseDown={onAccelStart}
          onMouseUp={onAccelEnd}
          onMouseLeave={onAccelEnd}
        >
          🏍️
          <span className="text-xs">GO!</span>
        </button>
      </div>
    </div>
  );
}

// ─── Pause Modal ──────────────────────────────────────────────────────────────
function PauseModal({
  onResume,
  onQuit,
}: { onResume: () => void; onQuit: () => void }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: "oklch(0 0 0 / 0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="rounded-2xl p-8 text-center w-72"
        style={{
          background: "oklch(0.1 0.01 240)",
          border: "1px solid oklch(0.2 0.01 240)",
        }}
      >
        <div className="text-5xl mb-4">⏸️</div>
        <h2
          className="text-2xl font-bold mb-1"
          style={{ color: "oklch(0.95 0 0)", fontFamily: "Outfit" }}
        >
          Paused
        </h2>
        <p
          className="text-sm mb-8"
          style={{ color: "oklch(0.5 0 0)", fontFamily: "Outfit" }}
        >
          রেস পজ করা হয়েছে
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            data-ocid="pause.resume_button"
            className="w-full py-3 rounded-xl font-bold text-lg transition-all duration-100 active:scale-95"
            style={{
              background: "oklch(0.72 0.19 55)",
              color: "oklch(0.06 0 0)",
              fontFamily: "Outfit",
            }}
            onClick={onResume}
          >
            ▶ Resume
          </button>
          <button
            type="button"
            data-ocid="pause.cancel_button"
            className="w-full py-3 rounded-xl font-bold text-lg transition-all duration-100 active:scale-95"
            style={{
              background: "oklch(0.18 0.01 240)",
              color: "oklch(0.8 0 0)",
              fontFamily: "Outfit",
            }}
            onClick={onQuit}
          >
            ✕ Quit to Menu
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main GameScene ────────────────────────────────────────────────────────────
export default function GameScene({
  selectedBike,
  onQuit,
  onRaceEnd,
}: {
  selectedBike: BikeConfig;
  onQuit: () => void;
  onRaceEnd: (result: {
    position: number;
    timeMs: number;
    totalBikes: number;
  }) => void;
}) {
  const [isPaused, setIsPaused] = useState(false);
  const [hudData, setHudData] = useState<HudData>({
    speedKmh: 0,
    gear: 1,
    position: 1,
    distRemaining: RACE_DISTANCE,
  });

  const isPausedRef = useRef(false);
  const controlsRef = useRef<Controls>({
    up: false,
    down: false,
    gearUp: false,
    gearDown: false,
    left: false,
    right: false,
  });

  const initialAi: AiState[] = AI_COLORS.map((color, i) => ({
    id: i,
    z: -(i * 3 + 3),
    x: LANES[i % 3],
    velZ: 0,
    targetSpeed: 10 + (i + 1) * 3.5 + Math.random() * 2,
    color,
    laneChangeTimer: 2 + i,
    targetX: LANES[i % 3],
  }));

  const gameRef = useRef<GameRef>({
    playerZ: 0,
    playerX: 0,
    playerVelZ: 0,
    gear: 1,
    gearCooldown: 0,
    aiStates: initialAi,
    finished: false,
    startTime: 0,
    wheelRot: 0,
    hudTimer: 0,
    raceStarted: false,
  });

  const togglePause = useCallback(() => {
    setIsPaused((p) => {
      isPausedRef.current = !p;
      return !p;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        controlsRef.current.up = true;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        controlsRef.current.down = true;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        controlsRef.current.left = true;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        controlsRef.current.right = true;
      }
      if (e.key === "z" || e.key === "Z") controlsRef.current.gearUp = true;
      if (e.key === "x" || e.key === "X") controlsRef.current.gearDown = true;
      if (e.key === "p" || e.key === "P") togglePause();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") controlsRef.current.up = false;
      if (e.key === "ArrowDown") controlsRef.current.down = false;
      if (e.key === "ArrowLeft") controlsRef.current.left = false;
      if (e.key === "ArrowRight") controlsRef.current.right = false;
      if (e.key === "z" || e.key === "Z") controlsRef.current.gearUp = false;
      if (e.key === "x" || e.key === "X") controlsRef.current.gearDown = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [togglePause]);

  const handleRaceEnd = useCallback(
    (position: number, timeMs: number) => {
      onRaceEnd({ position, timeMs, totalBikes: TOTAL_BIKES });
    },
    [onRaceEnd],
  );

  return (
    <div
      className="w-full h-screen relative overflow-hidden"
      style={{ background: "#87ceeb" }}
    >
      <Canvas
        gl={{ antialias: true }}
        camera={{ fov: 75, near: 0.1, far: 500, position: [0, 4.5, -10] }}
        style={{ width: "100%", height: "100%" }}
      >
        <Scene3D
          gameRef={gameRef}
          isPausedRef={isPausedRef}
          onHudUpdate={setHudData}
          onRaceEnd={handleRaceEnd}
          selectedBike={selectedBike}
          controlsRef={controlsRef}
        />
      </Canvas>

      <HUD
        data={hudData}
        onPause={togglePause}
        onGearUp={() => {
          controlsRef.current.gearUp = true;
          setTimeout(() => {
            controlsRef.current.gearUp = false;
          }, 150);
        }}
        onGearDown={() => {
          controlsRef.current.gearDown = true;
          setTimeout(() => {
            controlsRef.current.gearDown = false;
          }, 150);
        }}
        onBrakeStart={() => {
          controlsRef.current.down = true;
        }}
        onBrakeEnd={() => {
          controlsRef.current.down = false;
        }}
        onAccelStart={() => {
          controlsRef.current.up = true;
        }}
        onAccelEnd={() => {
          controlsRef.current.up = false;
        }}
        onLeftStart={() => {
          controlsRef.current.left = true;
        }}
        onLeftEnd={() => {
          controlsRef.current.left = false;
        }}
        onRightStart={() => {
          controlsRef.current.right = true;
        }}
        onRightEnd={() => {
          controlsRef.current.right = false;
        }}
      />

      {isPaused && <PauseModal onResume={togglePause} onQuit={onQuit} />}
    </div>
  );
}
