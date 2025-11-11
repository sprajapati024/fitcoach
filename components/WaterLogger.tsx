"use client";

import { useState } from "react";
import { X, Droplet, Loader2 } from "lucide-react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useLogWater } from "@/lib/query/hooks";

interface WaterLoggerProps {
  onClose: () => void;
  onWaterLogged: () => void;
  initialDate?: string;
}

const QUICK_AMOUNTS = [250, 500, 750, 1000];

export function WaterLogger({ onClose, onWaterLogged, initialDate }: WaterLoggerProps) {
  const [customAmount, setCustomAmount] = useState("");
  const [error, setError] = useState("");

  const logWaterMutation = useLogWater();
  const today = initialDate || new Date().toISOString().split("T")[0];

  const handleLogWater = async (amountMl: number) => {
    setError("");

    try {
      await logWaterMutation.mutateAsync({
        userId: "", // Will be filled by the hook
        logDate: today,
        amountMl,
      });

      onWaterLogged();
      onClose();
    } catch (err) {
      console.error("Error logging water:", err);
      setError("Failed to log water. Please try again.");
    }
  };

  const handleCustomSubmit = () => {
    const amount = parseInt(customAmount);
    if (isNaN(amount) || amount <= 0 || amount > 5000) {
      setError("Please enter a valid amount (1-5000 ml)");
      return;
    }
    handleLogWater(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-border rounded-lg max-w-md w-full">
        <div className="p-4 border-b border-border flex items-center justify-between bg-gray-900">
          <div className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-cyan-400" />
            <h2 className="text-xl font-semibold">Log Water</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-1 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Amounts */}
          <div>
            <label className="block text-sm font-medium mb-3">Quick Log</label>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleLogWater(amount)}
                  disabled={logWaterMutation.isPending}
                  className="flex flex-col items-center justify-center p-4 bg-surface-1 border border-border hover:border-cyan-400 rounded-lg transition-all disabled:opacity-50 group"
                >
                  <Droplet className="h-8 w-8 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-lg font-semibold">{amount} ml</span>
                  <span className="text-xs text-neutral-400">
                    {(amount / 1000).toFixed(2)}L
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <label className="block text-sm font-medium mb-3">Custom Amount</label>
            <div className="flex gap-3">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter ml"
                className="flex-1 px-4 py-3 bg-surface-1 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                min="1"
                max="5000"
              />
              <PrimaryButton
                onClick={handleCustomSubmit}
                disabled={logWaterMutation.isPending || !customAmount}
                className="px-6"
              >
                {logWaterMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Log"
                )}
              </PrimaryButton>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Enter amount in milliliters (1-5000 ml)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Info */}
          <div className="p-4 bg-cyan-900/10 border border-cyan-500/20 rounded-lg">
            <p className="text-sm text-cyan-300">
              💡 Tip: Aim for 2-3 liters per day (about 8-12 glasses)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
