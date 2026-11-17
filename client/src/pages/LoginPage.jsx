import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  Store,
  Layers,
  Barcode,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid username or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-950 select-none">
      {/* ======================================================== */}
      {/* LEFT COLUMN: BRANDING, SYSTEM NAME & OVERVIEW            */}
      {/* ======================================================== */}
      <div className="lg:w-[54%] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white flex flex-col justify-between p-5 sm:p-12 lg:p-16 relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header: Standalone Logo with Clean Division Indicator */}
        <div className="relative z-10">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl inline-flex backdrop-blur-md">
              <img
                src="/website_logo.png"
                alt="Chawnah Foods Inc."
                className="h-12 sm:h-14 w-auto object-contain filter drop-shadow-md"
              />
            </div>
            <div className="border-l border-slate-800/80 pl-4 py-1">
              <span className="text-xs font-semibold text-emerald-400 tracking-wide block uppercase">
                IT & Asset Custody Portal
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Equipment Accountability & Inventory Control
              </span>
            </div>
          </div>
        </div>

        {/* Middle Content: Main System Title, Description & Feature Highlights */}
        <div className="relative z-10 py-10 lg:py-16 space-y-8 max-w-xl">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official Asset Management Portal</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Equipment & Asset Accountability System
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Centralized platform for equipment issuance, chain-of-custody tracking, and property compliance across all 44 Chawnah Foods Inc. retail branch stores, manufacturing plants, and headquarters.
            </p>
          </div>

          {/* Three Feature Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-900/70 border border-slate-800/90 p-4 rounded-2xl space-y-1.5 backdrop-blur-xs hover:border-slate-700 transition">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-white">44 Retail Outlets</h4>
              <p className="text-[11px] text-slate-400 leading-snug">
                Store group accountability & supervisor responsibility logs.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/90 p-4 rounded-2xl space-y-1.5 backdrop-blur-xs hover:border-slate-700 transition">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-white">Audit Custody Trail</h4>
              <p className="text-[11px] text-slate-400 leading-snug">
                Full lifecycle handover history, returns & inspection notes.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/90 p-4 rounded-2xl space-y-1.5 backdrop-blur-xs hover:border-slate-700 transition">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Barcode className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-white">Thermal Barcodes</h4>
              <p className="text-[11px] text-slate-400 leading-snug">
                Code 128 label sticker printing with active custodian details.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Policy Footer */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
          <span>&copy; {new Date().getFullYear()} Chawnah Foods Inc. All rights reserved.</span>
          <span className="text-[11px] font-mono text-emerald-400 font-semibold">
            System v2.5 &bull; ISO / HACCP Compliant
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT COLUMN: MODERN DARK GLASSMORPHIC LOGIN PORTAL      */}
      {/* ======================================================== */}
      <div className="lg:w-[46%] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 sm:p-10 lg:p-14 relative overflow-hidden">
        {/* Soft Ambient Glow Elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.06),transparent_60%)] pointer-events-none" />

        <div className="w-full max-w-md space-y-5 relative z-10">
          {/* Main Dark Glassmorphic Card */}
          <div className="bg-slate-900/85 backdrop-blur-2xl rounded-3xl p-5 sm:p-9 shadow-2xl shadow-black/80 border border-slate-800 space-y-6 relative overflow-hidden">
            {/* Top illuminated emerald accent line */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

            {/* Card Header */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>IT Portal Access</span>
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Sign In to Portal
                </h2>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Enter your authorized IT credentials to access custody records.
                </p>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start space-x-2.5 animate-in fade-in duration-150">
                <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="font-semibold leading-relaxed">{error}</div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Username / Email */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300 text-xs">
                  Username or Corporate Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    autoComplete="username"
                    placeholder="e.g. it.admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 bg-slate-950/70 hover:bg-slate-950/90 focus:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300 text-xs">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-slate-950/70 hover:bg-slate-950/90 focus:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Security Status */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500/20"
                  />
                  <span className="text-slate-300 text-xs font-medium">
                    Remember this workstation
                  </span>
                </label>

                <span className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>256-Bit SSL Secured</span>
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:via-emerald-300 hover:to-teal-300 active:scale-[0.99] text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/35 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 text-xs uppercase tracking-wider group"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying Session...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Admin Portal</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Subtle Card Footer Metadata */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Role-Based Access (IT Admin)</span>
              </span>
              <span className="font-mono text-[10px]">CFI-SEC-v2.5</span>
            </div>
          </div>

          {/* Compliance & Authorization Footer */}
          <div className="text-center text-[11px] text-slate-500 space-y-1">
            <p className="font-medium text-slate-400">
              Authorized Chawnah Foods Inc. IT & Management Personnel Only
            </p>
            <p className="text-[10px] text-slate-500">
              System access is logged and audited according to corporate IT & asset control policies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
