import { useHasPin, useVerifyPin } from "@/hooks/useQueries";
import { Delete } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

interface Props {
  onSuccess: () => void;
  onClose: () => void;
}

export default function PinModal({ onSuccess, onClose }: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const { data: hasPin, isLoading } = useHasPin();
  const verifyPin = useVerifyPin();

  useEffect(() => {
    if (!isLoading && hasPin === false) {
      onSuccess();
    }
  }, [hasPin, isLoading, onSuccess]);

  const checkPin = useCallback(
    (p: string) => {
      if (p.length === 4 && hasPin) {
        verifyPin.mutate(p, {
          onSuccess: (valid) => {
            if (valid) {
              onSuccess();
            } else {
              setError(true);
              setTimeout(() => {
                setPin("");
                setError(false);
              }, 600);
            }
          },
        });
      }
    },
    [hasPin, onSuccess, verifyPin.mutate],
  );

  const handleKey = (k: string) => {
    if (pin.length < 4) {
      const next = `${pin}${k}`;
      setPin(next);
      checkPin(next);
    }
  };

  const handleDelete = () => setPin((p) => p.slice(0, -1));

  if (isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)" }}
      data-ocid="pin.modal"
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        className="vault-card rounded-3xl p-8 flex flex-col items-center gap-6 w-72"
      >
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: "oklch(0.18 0.03 210)" }}
          >
            <span className="text-2xl">🔐</span>
          </div>
          <h2 className="text-white font-display font-semibold text-lg">
            Enter PIN
          </h2>
          <p className="text-[oklch(0.50_0.02_210)] text-sm font-body mt-1">
            Access secret vault
          </p>
        </div>

        {/* Dots */}
        <div className="flex gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`pin-dot ${i < pin.length ? "filled" : ""} ${
                error ? "!border-red-500 !bg-red-500" : ""
              }`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKey(k)}
              className="pin-key"
              data-ocid="pin.button"
            >
              {k}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleKey("0")}
            className="pin-key"
            data-ocid="pin.button"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="pin-key"
            data-ocid="pin.delete_button"
          >
            <Delete size={18} />
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-[oklch(0.45_0.02_210)] text-sm font-body hover:text-[oklch(0.65_0.03_210)] transition-colors"
          data-ocid="pin.cancel_button"
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}
