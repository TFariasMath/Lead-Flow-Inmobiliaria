"use client";

import { useEffect, useRef } from "react";
import { useFormikContext } from "formik";
import { debounce } from "lodash";

interface FormikPersistProps {
  name: string;
  debounceMs?: number;
}

export const FormikPersist = ({ name, debounceMs = 500 }: FormikPersistProps) => {
  const { values, setValues } = useFormikContext<any>();
  const isFirstRender = useRef(true);

  // Cargar datos al montar
  useEffect(() => {
    const savedValues = localStorage.getItem(name);
    if (savedValues) {
      try {
        const parsed = JSON.parse(savedValues);
        setValues({ ...values, ...parsed });
      } catch (e) {
        console.error("Error parsing saved form data", e);
      }
    }
    isFirstRender.current = false;
  }, []);

  // Guardar datos al cambiar (con debounce para no saturar el storage)
  const saveValues = useRef(
    debounce((data: any) => {
      localStorage.setItem(name, JSON.stringify(data));
    }, debounceMs)
  ).current;

  useEffect(() => {
    if (!isFirstRender.current) {
      saveValues(values);
    }
  }, [values, saveValues]);

  return null;
};
