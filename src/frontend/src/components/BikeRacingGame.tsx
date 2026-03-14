import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import GameScene from "./game/GameScene";

export interface BikeConfig {
  id: number;
  name: string;
  speed: number;
  accel: number;
  handling: number;
  color: string;
  maxSpeedMs: number;
  accelRate: number;
}

const BIKES: BikeConfig[] = [
  {
    id: 1,
    name: "Street Racer",
    speed: 3,
    accel: 4,
    handling: 5,
    color: "#e74c3c",
    maxSpeedMs: 44,
    accelRate: 10,
  },
  {
    id: 2,
    name: "Speed Demon",
    speed: 5,
    accel: 3,
    handling: 3,
    color: "#3498db",
    maxSpeedMs: 55,
    accelRate: 7,
  },
  {
    id: 3,
    name: "City Cruiser",
    speed: 2,
    accel: 5,
    handling: 4,
    color: "#2ecc71",
    maxSpeedMs: 38,
    accelRate: 13,
  },
  {
    id: 4,
    name: "Night Rider",
    speed: 4,
    accel: 4,
    handling: 3,
    color: "#9b59b6",
    maxSpeedMs: 50,
    accelRate: 10,
  },
  {
    id: 5,
    name: "Thunder Bolt",
    speed: 5,
    accel: 5,
    handling: 2,
    color: "#f39c12",
    maxSpeedMs: 55,
    accelRate: 13,
  },
  {
    id: 6,
    name: "Iron Horse",
    speed: 3,
    accel: 2,
    handling: 5,
    color: "#1abc9c",
    maxSpeedMs: 44,
    accelRate: 5,
  },
];

type Screen = "menu" | "racing" | "result";

interface RaceResult {
  position: number;
  timeMs: number;
  totalBikes: number;
}

function StatBar({ value, max = 5 }: { value: number; max?: number }) {
  const bars = Array.from({ length: max }, (_, i) => i);
  return (
    <div className="flex gap-1">
      {bars.map((bar) => (
        <div
          key={bar}
          className="h-2 w-5 rounded-sm"
          style={{
            background: bar < value ? "oklch(0.75 0.2 55)" : "oklch(0.25 0 0)",
          }}
        />
      ))}
    </div>
  );
}

function MenuScreen({ onStart }: { onStart: (bike: BikeConfig) => void }) {
  const [selected, setSelected] = useState<BikeConfig>(BIKES[0]);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start overflow-y-auto"
      style={{ background: "oklch(0.08 0.02 240)" }}
    >
      {/* Header */}
      <div className="w-full py-10 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at 50% 100%, oklch(0.6 0.25 55) 0%, transparent 70%)",
          }}
        />
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p
            className="text-sm font-body tracking-[0.3em] uppercase mb-2"
            style={{ color: "oklch(0.72 0.19 55)" }}
          >
            🏍️ শহরের রাস্তায়
          </p>
          <h1
            className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tight"
            style={{
              color: "oklch(0.96 0 0)",
              textShadow: "0 0 40px oklch(0.72 0.19 55 / 0.5)",
            }}
          >
            City Bike
          </h1>
          <h1
            className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tight"
            style={{
              color: "oklch(0.72 0.19 55)",
              textShadow: "0 0 40px oklch(0.72 0.19 55 / 0.8)",
            }}
          >
            Racing
          </h1>
        </motion.div>
      </div>

      {/* Bike Selection */}
      <div className="w-full max-w-5xl px-4 pb-8">
        <p
          className="text-center text-sm font-body tracking-widest uppercase mb-6"
          style={{ color: "oklch(0.55 0 0)" }}
        >
          আপনার বাইক বেছে নিন
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {BIKES.map((bike, idx) => (
            <motion.div
              key={bike.id}
              data-ocid={`bike_select.card.${idx + 1}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: idx * 0.08,
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
              }}
              onClick={() => setSelected(bike)}
              className="relative cursor-pointer rounded-xl p-4 transition-all duration-200"
              style={{
                background:
                  selected.id === bike.id
                    ? "oklch(0.16 0.04 240)"
                    : "oklch(0.12 0.01 240)",
                border:
                  selected.id === bike.id
                    ? `2px solid ${bike.color}`
                    : "2px solid oklch(0.2 0.01 240)",
                boxShadow:
                  selected.id === bike.id ? `0 0 24px ${bike.color}33` : "none",
              }}
            >
              {selected.id === bike.id && (
                <div
                  className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                  style={{ background: bike.color }}
                >
                  ✓
                </div>
              )}
              <div className="flex items-center justify-center mb-3">
                <div className="relative">
                  <div
                    className="w-16 h-7 rounded-md"
                    style={{ background: bike.color }}
                  />
                  <div
                    className="absolute -bottom-2 left-1 w-5 h-5 rounded-full border-2"
                    style={{
                      borderColor: "oklch(0.3 0 0)",
                      background: "oklch(0.15 0 0)",
                    }}
                  />
                  <div
                    className="absolute -bottom-2 right-1 w-5 h-5 rounded-full border-2"
                    style={{
                      borderColor: "oklch(0.3 0 0)",
                      background: "oklch(0.15 0 0)",
                    }}
                  />
                </div>
              </div>
              <h3
                className="font-display font-bold text-sm text-center mb-3"
                style={{ color: "oklch(0.95 0 0)" }}
              >
                {bike.name}
              </h3>
              <div className="space-y-1.5">
                {(
                  [
                    ["Speed", bike.speed],
                    ["Accel", bike.accel],
                    ["Handle", bike.handling],
                  ] as [string, number][]
                ).map(([label, val]) => (
                  <div
                    key={label}
                    className="flex justify-between items-center"
                  >
                    <span
                      className="text-xs font-body"
                      style={{ color: "oklch(0.5 0 0)" }}
                    >
                      {label}
                    </span>
                    <StatBar value={val} />
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Controls hint */}
        <div
          className="mt-6 rounded-xl p-4"
          style={{ background: "oklch(0.12 0.01 240)" }}
        >
          <p
            className="text-xs font-body text-center mb-2"
            style={{ color: "oklch(0.55 0 0)" }}
          >
            কীবোর্ড কন্ট্রোল
          </p>
          <div
            className="flex flex-wrap justify-center gap-4 text-xs font-body"
            style={{ color: "oklch(0.65 0 0)" }}
          >
            {(
              [
                ["↑", "Accelerate"],
                ["↓", "Brake"],
                ["Z", "Gear Up"],
                ["X", "Gear Down"],
                ["P", "Pause"],
              ] as [string, string][]
            ).map(([key, label]) => (
              <span key={label}>
                <kbd
                  className="px-1.5 py-0.5 rounded text-xs"
                  style={{
                    background: "oklch(0.2 0 0)",
                    color: "oklch(0.9 0 0)",
                  }}
                >
                  {key}
                </kbd>{" "}
                {label}
              </span>
            ))}
          </div>
        </div>

        <motion.button
          type="button"
          data-ocid="bike_select.primary_button"
          className="mt-6 w-full py-5 rounded-xl font-display font-bold text-xl uppercase tracking-widest transition-all duration-200"
          style={{
            background: selected.color,
            color: "oklch(0.06 0 0)",
            boxShadow: `0 8px 32px ${selected.color}55`,
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onStart(selected)}
        >
          🏁 START RACE
        </motion.button>
      </div>

      <footer className="w-full py-4 text-center">
        <p className="text-xs font-body" style={{ color: "oklch(0.35 0 0)" }}>
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            className="underline"
            style={{ color: "oklch(0.5 0 0)" }}
            target="_blank"
            rel="noreferrer"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

function ResultScreen({
  result,
  bikeName,
  bikeColor,
  onPlayAgain,
  onMenu,
}: {
  result: RaceResult;
  bikeName: string;
  bikeColor: string;
  onPlayAgain: () => void;
  onMenu: () => void;
}) {
  const minutes = Math.floor(result.timeMs / 60000);
  const seconds = Math.floor((result.timeMs % 60000) / 1000);
  const ms = Math.floor((result.timeMs % 1000) / 10);
  const timeStr = `${minutes}:${String(seconds).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
  const ordinals = ["১ম", "২য়", "৩য়", "৪র্থ", "৫ম", "৬ষ্ঠ"];
  const isWin = result.position === 1;

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center"
      style={{ background: "oklch(0.08 0.02 240)" }}
    >
      <motion.div
        className="text-center px-6 max-w-md w-full"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="text-7xl mb-4">{isWin ? "🏆" : "🏁"}</div>
        <h1
          className="text-4xl font-display font-bold mb-2"
          style={{ color: isWin ? "oklch(0.85 0.2 80)" : "oklch(0.7 0 0)" }}
        >
          {isWin ? "জিতেছেন!" : "রেস শেষ!"}
        </h1>
        <p className="font-body mb-8" style={{ color: "oklch(0.55 0 0)" }}>
          {bikeName}
        </p>

        <div
          className="rounded-2xl p-6 mb-8 space-y-4"
          style={{ background: "oklch(0.12 0.01 240)" }}
        >
          {(
            [
              [
                "অবস্থান",
                ordinals[result.position - 1] ?? `${result.position}th`,
                bikeColor,
              ],
              ["সময়", timeStr, "oklch(0.85 0 0)"],
              ["মোট প্রতিযোগী", String(result.totalBikes), "oklch(0.85 0 0)"],
            ] as [string, string, string][]
          ).map(([label, val, color]) => (
            <div key={label} className="flex justify-between items-center">
              <span
                className="font-body text-sm"
                style={{ color: "oklch(0.5 0 0)" }}
              >
                {label}
              </span>
              <span
                className="font-display font-bold text-xl"
                style={{ color }}
              >
                {val}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            data-ocid="result.primary_button"
            className="w-full py-4 rounded-xl font-display font-bold text-lg uppercase tracking-widest transition-all duration-200 active:scale-95"
            style={{ background: bikeColor, color: "oklch(0.06 0 0)" }}
            onClick={onPlayAgain}
          >
            আবার খেলো
          </button>
          <button
            type="button"
            data-ocid="result.secondary_button"
            className="w-full py-4 rounded-xl font-display font-bold text-lg uppercase tracking-widest transition-all duration-200 active:scale-95"
            style={{
              background: "oklch(0.18 0.01 240)",
              color: "oklch(0.8 0 0)",
            }}
            onClick={onMenu}
          >
            মেনুতে ফিরুন
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function BikeRacingGame() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [selectedBike, setSelectedBike] = useState<BikeConfig>(BIKES[0]);
  const [raceResult, setRaceResult] = useState<RaceResult | null>(null);

  const handleStart = (bike: BikeConfig) => {
    setSelectedBike(bike);
    setScreen("racing");
  };

  const handleRaceEnd = (result: RaceResult) => {
    setRaceResult(result);
    setScreen("result");
  };

  return (
    <AnimatePresence mode="wait">
      {screen === "menu" && (
        <motion.div
          key="menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <MenuScreen onStart={handleStart} />
        </motion.div>
      )}
      {screen === "racing" && (
        <motion.div
          key="racing"
          className="w-full h-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <GameScene
            selectedBike={selectedBike}
            onQuit={() => setScreen("menu")}
            onRaceEnd={handleRaceEnd}
          />
        </motion.div>
      )}
      {screen === "result" && raceResult && (
        <motion.div
          key="result"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ResultScreen
            result={raceResult}
            bikeName={selectedBike.name}
            bikeColor={selectedBike.color}
            onPlayAgain={() => setScreen("racing")}
            onMenu={() => setScreen("menu")}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
