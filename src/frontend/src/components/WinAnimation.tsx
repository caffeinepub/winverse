import { useEffect, useRef } from "react";

interface Props {
  type: "win" | "loss";
  amount?: number;
  onClose: () => void;
}

export default function WinAnimation({ type, amount, onClose }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onClose, 3000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onClose]);

  const confettiItems = Array.from({ length: 20 }, (_, i) => i);

  return (
    <button
      type="button"
      className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer w-full h-full"
      style={{
        background: type === "win" ? "rgba(0,0,0,0.85)" : "rgba(200,0,0,0.2)",
        backdropFilter: "blur(8px)",
        border: "none",
      }}
      onClick={onClose}
    >
      {type === "win" &&
        confettiItems.map((i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-confetti"
            style={{
              left: `${(i * 47 + 13) % 100}%`,
              top: "-10px",
              animationDelay: `${(i * 0.15) % 1.5}s`,
              animationDuration: `${2 + (i % 3) * 0.5}s`,
              background: ["#9cff93", "#00cffc", "#ff7162", "#FFD700"][i % 4],
            }}
          />
        ))}

      <div className="text-center animate-win-appear px-8">
        {type === "win" ? (
          <>
            <div className="text-7xl mb-4">🎉</div>
            <h1
              className="text-5xl font-black mb-2 animate-neon-pulse"
              style={{
                fontFamily: "Plus Jakarta Sans",
                color: "#9cff93",
                textShadow: "0 0 30px rgba(0,255,65,0.8)",
              }}
            >
              YOU WON!
            </h1>
            {amount !== undefined && (
              <p
                className="text-3xl font-bold"
                style={{
                  color: "#9cff93",
                  textShadow: "0 0 15px rgba(0,255,65,0.5)",
                }}
              >
                +₹{amount.toFixed(2)}
              </p>
            )}
            <p className="mt-4 text-sm" style={{ color: "#adaaaa" }}>
              Tap to continue
            </p>
          </>
        ) : (
          <>
            <div className="text-7xl mb-4">😞</div>
            <h1
              className="text-4xl font-black mb-2"
              style={{ fontFamily: "Plus Jakarta Sans", color: "#ff7162" }}
            >
              Better Luck
              <br />
              Next Time
            </h1>
            <p className="mt-4 text-sm" style={{ color: "#adaaaa" }}>
              Tap to continue
            </p>
          </>
        )}
      </div>
    </button>
  );
}
