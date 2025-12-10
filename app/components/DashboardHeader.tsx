import React from "react";

interface DashboardHeaderProps {
  role: string;
}


const getInitials = (role: string) => {
  if (!role) return "";
  return role
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();
};


const DashboardHeader: React.FC<DashboardHeaderProps> = ({ role }) => {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
              <p className="text-sm">Hi, {role.charAt(0).toUpperCase() + role.slice(1)}</p>
              <p className="text-xs text-gray-500">{formattedDate}</p>
            </div>
            <span className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg bg-gradient-to-br from-[#A18CD1] to-[#FBC2EB] border-2 border-white shadow" style={{minWidth:48,minHeight:48}}>
              {getInitials(role)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
