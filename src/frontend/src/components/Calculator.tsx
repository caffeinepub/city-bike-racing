import { AnimatePresence } from "motion/react";
import { useCallback, useRef, useState } from "react";
import HiddenVault from "./HiddenVault";
import PinModal from "./PinModal";

type CalcOp = "+" | "-" | "×" | "÷" | null;

function formatDisplay(value: string): string {
  if (value.length > 12) return Number.parseFloat(value).toExponential(4);
  return value;
}

function calculate(a: string, b: string, operation: CalcOp): string {
  const fa = Number.parseFloat(a);
  const fb = Number.parseFloat(b);
  let result: number;
  switch (operation) {
    case "+":
      result = fa + fb;
      break;
    case "-":
      result = fa - fb;
      break;
    case "×":
      result = fa * fb;
      break;
    case "÷":
      result = fb === 0 ? 0 : fa / fb;
      break;
    default:
      result = fb;
  }
  const str = String(result);
  if (str.includes(".") && str.split(".")[1].length > 10) {
    return Number.parseFloat(result.toFixed(10)).toString();
  }
  return str;
}

export default function Calculator() {
  const [display, setDisplay] = useState("0");
  const [prevValue, setPrevValue] = useState<string | null>(null);
  const [op, setOp] = useState<CalcOp>(null);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDigit = useCallback(
    (d: string) => {
      if (waitingForNext) {
        setDisplay(d === "." ? "0." : d);
        setWaitingForNext(false);
      } else {
        if (d === "." && display.includes(".")) return;
        setDisplay((prev) => (prev === "0" && d !== "." ? d : prev + d));
      }
    },
    [display, waitingForNext],
  );

  const handleOp = useCallback(
    (nextOp: CalcOp) => {
      if (prevValue !== null && op && !waitingForNext) {
        const result = calculate(prevValue, display, op);
        setDisplay(result);
        setPrevValue(result);
      } else {
        setPrevValue(display);
      }
      setOp(nextOp);
      setWaitingForNext(true);
    },
    [prevValue, display, op, waitingForNext],
  );

  const handleEquals = useCallback(() => {
    if (!op || prevValue === null) return;
    const result = calculate(prevValue, display, op);
    setDisplay(result);
    setPrevValue(null);
    setOp(null);
    setWaitingForNext(true);
  }, [op, prevValue, display]);

  const handleClear = useCallback(() => {
    setDisplay("0");
    setPrevValue(null);
    setOp(null);
    setWaitingForNext(false);
  }, []);

  const handlePercent = useCallback(() => {
    setDisplay((prev) => String(Number.parseFloat(prev) / 100));
  }, []);

  const handleToggleSign = useCallback(() => {
    setDisplay((prev) =>
      prev.startsWith("-") ? prev.slice(1) : prev === "0" ? "0" : `-${prev}`,
    );
  }, []);

  const startLongPress = () => {
    longPressTimer.current = setTimeout(() => {
      setShowPinModal(true);
    }, 1500);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    setShowVault(true);
  };

  const buttons: Array<{
    label: string;
    type: "number" | "op" | "function";
    action: () => void;
  }> = [
    { label: "C", type: "function", action: handleClear },
    { label: "+/-", type: "function", action: handleToggleSign },
    { label: "%", type: "function", action: handlePercent },
    { label: "÷", type: "op", action: () => handleOp("÷") },
    { label: "7", type: "number", action: () => handleDigit("7") },
    { label: "8", type: "number", action: () => handleDigit("8") },
    { label: "9", type: "number", action: () => handleDigit("9") },
    { label: "×", type: "op", action: () => handleOp("×") },
    { label: "4", type: "number", action: () => handleDigit("4") },
    { label: "5", type: "number", action: () => handleDigit("5") },
    { label: "6", type: "number", action: () => handleDigit("6") },
    { label: "-", type: "op", action: () => handleOp("-") },
    { label: "1", type: "number", action: () => handleDigit("1") },
    { label: "2", type: "number", action: () => handleDigit("2") },
    { label: "3", type: "number", action: () => handleDigit("3") },
    { label: "+", type: "op", action: () => handleOp("+") },
  ];

  const isOpActive = (label: string) => {
    const opMap: Record<string, CalcOp> = {
      "÷": "÷",
      "×": "×",
      "-": "-",
      "+": "+",
    };
    return op === opMap[label] && waitingForNext;
  };

  return (
    <>
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-xs">
          {/* Display */}
          <div
            className="px-6 pb-4 pt-12 flex flex-col items-end cursor-pointer select-none"
            onMouseDown={startLongPress}
            onMouseUp={cancelLongPress}
            onMouseLeave={cancelLongPress}
            onTouchStart={startLongPress}
            onTouchEnd={cancelLongPress}
            data-ocid="calculator.canvas_target"
            title="Hold to access secret vault"
          >
            <div className="text-[oklch(0.55_0_0)] text-base font-display min-h-6">
              {prevValue && op ? `${formatDisplay(prevValue)} ${op}` : ""}
            </div>
            <div
              className="text-white font-display font-light leading-none"
              style={{
                fontSize:
                  display.length > 9
                    ? "2.5rem"
                    : display.length > 6
                      ? "3.5rem"
                      : "5rem",
              }}
            >
              {formatDisplay(display)}
            </div>
          </div>

          {/* Buttons grid */}
          <div className="grid grid-cols-4 gap-3 px-2">
            {buttons.map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={btn.action}
                className={`calc-btn h-20 text-2xl ${
                  btn.type === "op"
                    ? isOpActive(btn.label)
                      ? "bg-white text-[oklch(0.72_0.19_55)]"
                      : "calc-btn-op"
                    : btn.type === "function"
                      ? "calc-btn-function"
                      : "calc-btn-number"
                }`}
                data-ocid="calculator.button"
              >
                {btn.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleDigit("0")}
              className="calc-btn col-span-2 h-20 text-2xl calc-btn-number justify-start pl-7"
              data-ocid="calculator.button"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleDigit(".")}
              className="calc-btn h-20 text-2xl calc-btn-number"
              data-ocid="calculator.button"
            >
              .
            </button>
            <button
              type="button"
              onClick={handleEquals}
              className="calc-btn h-20 text-2xl calc-btn-op"
              data-ocid="calculator.primary_button"
            >
              =
            </button>
          </div>

          <p className="text-center text-[oklch(0.25_0_0)] text-xs mt-8 font-body">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              className="underline hover:text-[oklch(0.4_0_0)] transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>

      <AnimatePresence>
        {showPinModal && (
          <PinModal
            onSuccess={handlePinSuccess}
            onClose={() => setShowPinModal(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVault && <HiddenVault onClose={() => setShowVault(false)} />}
      </AnimatePresence>
    </>
  );
}
