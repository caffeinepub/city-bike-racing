import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useHasPin, useSetPin, useVerifyPin } from "@/hooks/useQueries";
import { Eye, EyeOff, Shield, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AppLockTab() {
  const { data: hasPin, isLoading } = useHasPin();
  const setPin = useSetPin();
  const verifyPin = useVerifyPin();

  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [oldPin, setOldPin] = useState("");
  const [showChange, setShowChange] = useState(false);
  const [showPins, setShowPins] = useState(false);

  const handleSetPin = () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast.error("PIN must be 4 digits");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("PINs do not match");
      return;
    }
    setPin.mutate(newPin, {
      onSuccess: () => {
        setNewPin("");
        setConfirmPin("");
        toast.success("PIN set successfully");
      },
      onError: () => toast.error("Failed to set PIN"),
    });
  };

  const handleChangePin = () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast.error("PIN must be 4 digits");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("PINs do not match");
      return;
    }
    verifyPin.mutate(oldPin, {
      onSuccess: (valid) => {
        if (!valid) {
          toast.error("Incorrect current PIN");
          return;
        }
        setPin.mutate(newPin, {
          onSuccess: () => {
            setOldPin("");
            setNewPin("");
            setConfirmPin("");
            setShowChange(false);
            toast.success("PIN changed successfully");
          },
        });
      },
    });
  };

  const handleRemovePin = () => {
    verifyPin.mutate(oldPin, {
      onSuccess: (valid) => {
        if (!valid) {
          toast.error("Incorrect current PIN");
          return;
        }
        setPin.mutate("", {
          onSuccess: () => {
            setOldPin("");
            setShowChange(false);
            toast.success("PIN removed");
          },
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4" data-ocid="applock.loading_state">
        <Skeleton
          className="h-20 w-full rounded-xl"
          style={{ background: "oklch(0.18 0.02 210)" }}
        />
      </div>
    );
  }

  const inputStyle = {
    background: "oklch(0.15 0.02 210)",
    border: "1px solid oklch(0.25 0.02 210)",
    color: "oklch(0.90 0 0)",
  };

  return (
    <div className="p-5 space-y-5">
      <div className="vault-card rounded-2xl p-4 flex items-center gap-3">
        {hasPin ? (
          <ShieldCheck size={28} style={{ color: "oklch(0.72 0.18 195)" }} />
        ) : (
          <Shield size={28} style={{ color: "oklch(0.45 0.03 210)" }} />
        )}
        <div>
          <p className="text-white font-display font-medium text-sm">
            {hasPin ? "PIN Protection Active" : "No PIN Set"}
          </p>
          <p
            className="font-body text-xs mt-0.5"
            style={{ color: "oklch(0.50 0.03 210)" }}
          >
            {hasPin ? "Vault is protected" : "Anyone can open the vault"}
          </p>
        </div>
      </div>

      {!hasPin && (
        <div className="vault-card rounded-2xl p-4 space-y-4">
          <h3 className="text-white font-display font-semibold text-sm">
            Set a 4-digit PIN
          </h3>
          <div className="space-y-3">
            <div>
              <Label
                className="font-body text-xs mb-1 block"
                style={{ color: "oklch(0.60 0.03 210)" }}
              >
                New PIN
              </Label>
              <div className="relative">
                <Input
                  type={showPins ? "text" : "password"}
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  style={inputStyle}
                  className="font-display tracking-widest pr-10"
                  data-ocid="applock.input"
                />
                <button
                  type="button"
                  className="absolute right-3 top-2.5"
                  onClick={() => setShowPins((p) => !p)}
                  data-ocid="applock.toggle"
                >
                  {showPins ? (
                    <EyeOff
                      size={16}
                      style={{ color: "oklch(0.50 0.03 210)" }}
                    />
                  ) : (
                    <Eye size={16} style={{ color: "oklch(0.50 0.03 210)" }} />
                  )}
                </button>
              </div>
            </div>
            <div>
              <Label
                className="font-body text-xs mb-1 block"
                style={{ color: "oklch(0.60 0.03 210)" }}
              >
                Confirm PIN
              </Label>
              <Input
                type={showPins ? "text" : "password"}
                maxLength={4}
                value={confirmPin}
                onChange={(e) =>
                  setConfirmPin(e.target.value.replace(/\D/g, ""))
                }
                placeholder="••••"
                style={inputStyle}
                className="font-display tracking-widest"
                data-ocid="applock.input"
              />
            </div>
            <Button
              onClick={handleSetPin}
              disabled={setPin.isPending}
              className="w-full font-body"
              style={{
                background: "oklch(0.72 0.18 195)",
                color: "oklch(0.06 0 0)",
              }}
              data-ocid="applock.submit_button"
            >
              {setPin.isPending ? "Saving..." : "Set PIN"}
            </Button>
          </div>
        </div>
      )}

      {hasPin && !showChange && (
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full font-body"
            style={{
              borderColor: "oklch(0.30 0.03 210)",
              color: "oklch(0.75 0 0)",
            }}
            onClick={() => setShowChange(true)}
            data-ocid="applock.edit_button"
          >
            Change PIN
          </Button>
        </div>
      )}

      {hasPin && showChange && (
        <div className="vault-card rounded-2xl p-4 space-y-4">
          <h3 className="text-white font-display font-semibold text-sm">
            Change PIN
          </h3>
          <div className="space-y-3">
            <div>
              <Label
                className="font-body text-xs mb-1 block"
                style={{ color: "oklch(0.60 0.03 210)" }}
              >
                Current PIN
              </Label>
              <Input
                type={showPins ? "text" : "password"}
                maxLength={4}
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                style={inputStyle}
                className="font-display tracking-widest"
                data-ocid="applock.input"
              />
            </div>
            <div>
              <Label
                className="font-body text-xs mb-1 block"
                style={{ color: "oklch(0.60 0.03 210)" }}
              >
                New PIN
              </Label>
              <div className="relative">
                <Input
                  type={showPins ? "text" : "password"}
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  style={inputStyle}
                  className="font-display tracking-widest pr-10"
                  data-ocid="applock.input"
                />
                <button
                  type="button"
                  className="absolute right-3 top-2.5"
                  onClick={() => setShowPins((p) => !p)}
                  data-ocid="applock.toggle"
                >
                  {showPins ? (
                    <EyeOff
                      size={16}
                      style={{ color: "oklch(0.50 0.03 210)" }}
                    />
                  ) : (
                    <Eye size={16} style={{ color: "oklch(0.50 0.03 210)" }} />
                  )}
                </button>
              </div>
            </div>
            <div>
              <Label
                className="font-body text-xs mb-1 block"
                style={{ color: "oklch(0.60 0.03 210)" }}
              >
                Confirm New PIN
              </Label>
              <Input
                type={showPins ? "text" : "password"}
                maxLength={4}
                value={confirmPin}
                onChange={(e) =>
                  setConfirmPin(e.target.value.replace(/\D/g, ""))
                }
                placeholder="••••"
                style={inputStyle}
                className="font-display tracking-widest"
                data-ocid="applock.input"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleChangePin}
                disabled={setPin.isPending || verifyPin.isPending}
                className="flex-1 font-body"
                style={{
                  background: "oklch(0.72 0.18 195)",
                  color: "oklch(0.06 0 0)",
                }}
                data-ocid="applock.submit_button"
              >
                Save
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowChange(false);
                  setOldPin("");
                  setNewPin("");
                  setConfirmPin("");
                }}
                className="flex-1 font-body"
                style={{ color: "oklch(0.50 0.03 210)" }}
                data-ocid="applock.cancel_button"
              >
                Cancel
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={handleRemovePin}
              disabled={verifyPin.isPending}
              className="w-full font-body text-red-400 hover:text-red-300"
              data-ocid="applock.delete_button"
            >
              Remove PIN
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
