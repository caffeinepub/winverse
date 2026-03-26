import type { Tab } from "../App";

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "referral", label: "Referral", icon: "🤝" },
  { id: "wallet", label: "Wallet", icon: "💰" },
  { id: "account", label: "Account", icon: "👤" },
];

export default function BottomNav({ activeTab, onTabChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex"
      style={{
        background: "rgba(26,25,25,0.95)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        maxWidth: "430px",
        margin: "0 auto",
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            type="button"
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all"
            style={{ color: isActive ? "#9cff93" : "#adaaaa" }}
          >
            <span className="text-xl">{tab.icon}</span>
            <span
              className="text-xs font-medium"
              style={{ fontFamily: "Inter" }}
            >
              {tab.label}
            </span>
            {isActive && (
              <span
                className="absolute bottom-0 w-8 h-0.5 rounded-full"
                style={{ background: "#9cff93", boxShadow: "0 0 8px #00FF41" }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
