"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ClientPortalProps {
  children: React.ReactNode;
  selector?: string;
}

/**
 * ClientPortal
 * ------------
 * Un wrapper seguro para Portals que evita errores de hidratación y SSR.
 * Asegura que el contenido solo se renderice en el cliente.
 */
export function ClientPortal({ children, selector = "body" }: ClientPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const target = document.querySelector(selector);
  if (!target) return null;

  return createPortal(children, target);
}
