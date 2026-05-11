import { useEffect } from "react";

export const useAestheticEffects = () => {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cursor = document.getElementById('custom-cursor');
      const follower = document.getElementById('cursor-follower');
      if (cursor && follower) {
        cursor.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`;
        follower.style.transform = `translate(${e.clientX - 20}px, ${e.clientY - 20}px)`;
      }

      // Reactive Light Global
      document.documentElement.style.setProperty('--mouse-x', `${(e.clientX / window.innerWidth) * 100}%`);
      document.documentElement.style.setProperty('--mouse-y', `${(e.clientY / window.innerHeight) * 100}%`);

      // Local tracking for cards
      const cards = document.querySelectorAll('.bento-card');
      cards.forEach(card => {
        const rect = (card as HTMLElement).getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        (card as HTMLElement).style.setProperty('--mouse-x', `${x}%`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${y}%`);
      });

      // Magnetic Button Effect
      const magneticBtns = document.querySelectorAll('.magnetic-btn');
      magneticBtns.forEach(btn => {
        const rect = (btn as HTMLElement).getBoundingClientRect();
        const btnX = rect.left + rect.width / 2;
        const btnY = rect.top + rect.height / 2;
        const distanceX = e.clientX - btnX;
        const distanceY = e.clientY - btnY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        if (distance < 150) {
          const pullX = distanceX * 0.15;
          const pullY = distanceY * 0.15;
          (btn as HTMLElement).style.transform = `translate(${pullX}px, ${pullY}px) scale(1.05)`;
        } else {
          (btn as HTMLElement).style.transform = `translate(0, 0) scale(1)`;
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
};
