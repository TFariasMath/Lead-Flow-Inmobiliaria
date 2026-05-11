import React from "react";

export const AestheticCursor: React.FC = () => {
  return (
    <>
      <div id="custom-cursor" className="hidden lg:block" />
      <div id="cursor-follower" className="hidden lg:block" />
      <div className="noise-overlay" />
      <div className="fixed inset-0 dot-grid opacity-40 pointer-events-none -z-10" />
      
      {/* Aurora Layers (Global Atmosphere) */}
      <div className="aurora-layer">
          <div className="aurora-blob bg-blue-600/20 top-[-10%] left-[-10%]" />
          <div className="aurora-blob bg-purple-600/20 bottom-[-10%] right-[-10%]" />
          <div className="aurora-blob bg-blue-400/10 top-[40%] right-[20%]" />
      </div>
    </>
  );
};
