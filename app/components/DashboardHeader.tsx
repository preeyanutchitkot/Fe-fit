import React from "react";

interface DashboardHeaderProps {
  role: string;
  user?: {
    name: string;
    picture?: string;
  };
}


const getInitials = (nameOrRole: string) => {
  if (!nameOrRole) return "";
  return nameOrRole
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};


const DashboardHeader: React.FC<DashboardHeaderProps> = ({ role, user }) => {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const displayName = user?.name || role.charAt(0).toUpperCase() + role.slice(1);
  const displayImage = user?.picture;

  const handleSignOut = () => {
    if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-violet-100 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/Logo_FitAddicttest.png" alt="FitAddict Logo" className="h-12 w-12 rounded-xl shadow-lg" />
            <h1 className="text-3xl bg-linear-to-r from-orange-500 via-pink-500 to-violet-600 bg-clip-text text-transparent font-extrabold">
              FitAddict
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm">Hi, {displayName}</p>
              <p className="text-xs text-gray-500">{formattedDate}</p>
            </div>
            {displayImage ? (
              <img
                src={displayImage}
                alt={displayName}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                onError={(e) => { e.currentTarget.src = '/user (4).png'; }}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg bg-gradient-to-br from-[#A18CD1] to-[#FBC2EB] border-2 border-white shadow" style={{ minWidth: 48, minHeight: 48 }}>
                {getInitials(displayName)}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="ml-4 px-4 py-1.5 bg-white text-violet-600 font-bold border-none rounded-2xl shadow-md hover:scale-105 transition-transform text-sm cursor-pointer"
              style={{ boxShadow: '0 2px 12px #a855f733' }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
