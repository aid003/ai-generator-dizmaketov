"use client";
import { useEffect, useState } from "react";
import styles from "./GuideTip.module.css";

type Step = {
  title: string;
  description: string;
  extra?: React.ReactNode;
};

type GuideTipProps = {
  id: string; // уникальный ID подсказки
  steps: Step[];
  onFinish?: () => void;
};

const GuideTip = ({ id, steps, onFinish }: GuideTipProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [wasAlreadyShown, setWasAlreadyShown] = useState(false);

  const storageKey = `guideTipShown:${id}`;
  const isLastStep = currentStep === steps.length - 1;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const shown = localStorage.getItem(storageKey);
      if (shown === "true") {
        setWasAlreadyShown(true);
      }
    }
  }, [storageKey]);

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep((prev) => prev + 1);
    } else {
      localStorage.setItem(storageKey, "true");
      if (onFinish) onFinish();
    }
  };

  if (wasAlreadyShown) return null;

  const { title, description, extra } = steps[currentStep];

  return (
    <div className={styles.overlay}>
      <div className={styles.tipBox}>
        <div className={styles.stepIndicator}>
          Шаг {currentStep + 1} из {steps.length}
        </div>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
        {extra && <div className={styles.extra}>{extra}</div>}
        <button className={styles.button} onClick={handleNext}>
          {isLastStep ? "Понятно" : "Далее"}
        </button>
      </div>
    </div>
  );
};

export default GuideTip;
