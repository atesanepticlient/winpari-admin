"use client";

import { useState, useEffect } from "react";
import { DollarSign, X, Loader } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DollarRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DollarRateModal({
  isOpen,
  onClose,
  onSuccess,
}: DollarRateModalProps) {
  const [rates, setRates] = useState({
    bdt: "",
    pkr: "",
    inr: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [initialRates, setInitialRates] = useState({
    bdt: "",
    pkr: "",
    inr: "",
  });

  // Fetch current rates when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCurrentRates();
    }
  }, [isOpen]);

  const fetchCurrentRates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/exchange");
      if (response.ok) {
        const data = await response.json();
        setInitialRates({
          bdt: data.bdt.toString(),
          pkr: data.pkr.toString(),
          inr: data.inr.toString(),
        });
        setRates({
          bdt: data.bdt.toString(),
          pkr: data.pkr.toString(),
          inr: data.inr.toString(),
        });
      }
    } catch (err) {
      setError("Failed to fetch current rates");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    currency: "bdt" | "pkr" | "inr",
    value: string,
  ) => {
    setRates((prev) => ({ ...prev, [currency]: value }));
    setError(null);
  };

  const validateRates = () => {
    if (!rates.bdt || !rates.pkr || !rates.inr) {
      setError("All rates are required");
      return false;
    }

    const bdtNum = parseFloat(rates.bdt);
    const pkrNum = parseFloat(rates.pkr);
    const inrNum = parseFloat(rates.inr);

    if (isNaN(bdtNum) || isNaN(pkrNum) || isNaN(inrNum)) {
      setError("All rates must be valid numbers");
      return false;
    }

    if (bdtNum <= 0 || pkrNum <= 0 || inrNum <= 0) {
      setError("All rates must be greater than 0");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setError(null);

    if (!validateRates()) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/exchange", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bdt: parseFloat(rates.bdt),
          pkr: parseFloat(rates.pkr),
          inr: parseFloat(rates.inr),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update rates");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update rates");
    } finally {
      setLoading(false);
    }
  };

  const resetRates = () => {
    setRates(initialRates);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0  z-[80000000000000000] flex items-center justify-center  p-4">
        <Card className="bg-slate-800 border-slate-700 max-w-md w-full shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-500" />
              Update Exchange Rates
            </CardTitle>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-lg">
                  <p className="text-emerald-300 text-sm">
                    ✓ Exchange rates updated successfully!
                  </p>
                </div>
              )}

              {/* Current Rates Info */}
              <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                <p className="text-xs text-slate-400 mb-2">
                  Exchange rate to USD (1 = how many USD)
                </p>
              </div>

              {/* BDT Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  BDT to USD
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500">
                    ৳
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={rates.bdt}
                    onChange={(e) => handleInputChange("bdt", e.target.value)}
                    disabled={loading}
                    className="w-full pl-8 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="120.00"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Current: {initialRates.bdt}
                </p>
              </div>

              {/* PKR Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  PKR to USD
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500">
                    ₨
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={rates.pkr}
                    onChange={(e) => handleInputChange("pkr", e.target.value)}
                    disabled={loading}
                    className="w-full pl-8 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="280.00"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Current: {initialRates.pkr}
                </p>
              </div>

              {/* INR Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  INR to USD
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={rates.inr}
                    onChange={(e) => handleInputChange("inr", e.target.value)}
                    disabled={loading}
                    className="w-full pl-8 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="94.00"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Current: {initialRates.inr}
                </p>
              </div>

              {/* Conversion Preview */}
              <div className="bg-slate-700/30 p-3 rounded-lg space-y-2">
                <p className="text-xs text-slate-400 font-semibold">
                  Conversion Preview:
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500">100 BDT =</p>
                    <p className="text-emerald-400 font-semibold">
                      $
                      {rates.bdt
                        ? (100 / parseFloat(rates.bdt)).toFixed(2)
                        : "0.00"}{" "}
                      USD
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">100 PKR =</p>
                    <p className="text-emerald-400 font-semibold">
                      $
                      {rates.pkr
                        ? (100 / parseFloat(rates.pkr)).toFixed(2)
                        : "0.00"}{" "}
                      USD
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">100 INR =</p>
                    <p className="text-emerald-400 font-semibold">
                      $
                      {rates.inr
                        ? (100 / parseFloat(rates.inr)).toFixed(2)
                        : "0.00"}{" "}
                      USD
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={resetRates}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || success}
                  className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4" />
                      Update Rates
                    </>
                  )}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
