import React from "react";

export default function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 animate-fadeIn">
      {children}
    </div>
  );
}


