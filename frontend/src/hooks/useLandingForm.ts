import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";

export const useLandingForm = (onSubmit: (values: any) => Promise<void>) => {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const validationSchema = Yup.object({
    first_name: Yup.string().required('Ingresa tu nombre'),
    last_name: Yup.string().required('Ingresa tu apellido'),
    email: Yup.string().email('Email inválido').required('El email es obligatorio'),
    phone: Yup.string().min(8, 'El teléfono debe tener al menos 8 dígitos').required('El teléfono es obligatorio'),
    investment_goal: Yup.string().required('Selecciona un objetivo'),
    investment_capacity: Yup.string().required('Selecciona un rango'),
  });

  const formik = useFormik({
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone_code: "+56",
      phone: "",
      investment_goal: "",
      investment_capacity: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      const finalPhone = `${values.phone_code}${values.phone.replace(/\s+/g, '')}`;
      const { phone_code, ...rest } = values;
      await onSubmit({ ...rest, phone: finalPhone });
    },
  });

  const nextStep = () => {
    if (step === 1) {
      if (formik.values.first_name && formik.values.last_name) setStep(2);
      else { 
        formik.setFieldTouched('first_name', true); 
        formik.setFieldTouched('last_name', true); 
      }
    } else if (step === 2) {
      if (formik.values.investment_goal && formik.values.investment_capacity) setStep(3);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return {
    formik,
    step,
    setStep,
    nextStep,
    prevStep,
    totalSteps
  };
};
