// src/components/CountdownTimer.jsx
import { useState, useEffect } from "react";
import { FiClock } from "react-icons/fi";

/**
 * Affiche un compte à rebours jusqu'à dateFin.
 * Quand le temps est écoulé, appelle onExpired() si fourni.
 */
export default function CountdownTimer({ dateFin, onExpired }) {
  const calcSecondes = () =>
    Math.max(0, Math.floor((new Date(dateFin) - new Date()) / 1000));

  const [secondes, setSecondes] = useState(calcSecondes);

  useEffect(() => {
    if (secondes <= 0) {
      onExpired?.();
      return;
    }
    const timer = setInterval(() => {
      const s = calcSecondes();
      setSecondes(s);
      if (s <= 0) {
        clearInterval(timer);
        onExpired?.();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [dateFin]);

  const h   = Math.floor(secondes / 3600);
  const m   = Math.floor((secondes % 3600) / 60);
  const s   = secondes % 60;
  const pad = (n) => String(n).padStart(2, "0");

  const isUrgent   = secondes > 0 && secondes <= 300;  // < 5 min
  const isExpired  = secondes === 0;

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm font-bold px-4 py-2 rounded-xl">
        <FiClock size={14} />
        Temps écoulé — dépouillement en cours…
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl border transition-all ${
      isUrgent
        ? "bg-red-50 border-red-200 text-red-600 animate-pulse"
        : "bg-indigo-50 border-indigo-100 text-indigo-700"
    }`}>
      <FiClock size={14} />
      <span>
        {h > 0 && `${pad(h)}h `}{pad(m)}m {pad(s)}s
      </span>
      <span className={`text-xs font-medium ${isUrgent ? "text-red-400" : "text-indigo-400"}`}>
        restant{isUrgent ? " — dépêchez-vous !" : "s"}
      </span>
    </div>
  );
}
