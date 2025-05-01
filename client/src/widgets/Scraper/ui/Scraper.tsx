"use client";
import { useEffect, useState } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import ScrapeSite from "@/features/ScrapeSite/ui/ScrapeSite";
import SelectSite from "@/features/SelectSite/ui/SelectSite";
import scraperSocket from "@/shared/socket-scraper/socket";
import { FaArrowLeft } from "react-icons/fa6";
import styles from "./Scraper.module.css";
import GuideTip from "@/shared/GuideTip/ui/GuideTip";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "cyrillic-ext"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});

const Scraper = () => {
  const [selected, setSelected] = useState<"upload" | "select" | null>(null);
  const [showTip, setShowTip] = useState(true);

  useEffect(() => {
    scraperSocket.connect();

    return () => {
      scraperSocket.disconnect()
    }
  }, []);

  const renderContent = () => {
    if (selected === "upload") {
      return (
        <>
          <button
            className={`${styles.backButton} ${plusJakarta.className}`}
            onClick={() => setSelected(null)}
          >
            <FaArrowLeft style={{ color: "white", fontSize: "1.1rem" }} />
          </button>
          <ScrapeSite />
        </>
      );
    } else if (selected === "select") {
      return (
        <>
          <button
            className={`${styles.backButton} ${plusJakarta.className}`}
            onClick={() => setSelected(null)}
          >
            <FaArrowLeft style={{ color: "white", fontSize: "1.1rem" }} />
          </button>
          <SelectSite />
        </>
      );
    }

    return (
      <>
        <h1 className={`${styles.header} ${plusJakarta.className}`}>
          Загрузите сайт донора или выберите существующий
        </h1>
        <div className={styles.changeContainer}>
          <div className={styles.loadContainer}>
            <button
              className={`${styles.loadButton} ${plusJakarta.className}`}
              onClick={() => setSelected("upload")}
            >
              Загрузить сайт
            </button>
          </div>
          <div className={styles.choseContainer}>
            <button
              className={`${styles.choseButton} ${plusJakarta.className}`}
              onClick={() => setSelected("select")}
            >
              Выбрать существующий
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <div className={styles.scraperContainer}>{renderContent()}</div>;
      {showTip && (
        <GuideTip
          id="onboarding-001"
          steps={[
            {
              title: "Добро пожаловать!",
              description:
                "Наш проект помогает загружать и модифицировать сайты.",
            },
            {
              title: "Загрузка сайта",
              description:
                "Вы можете загрузить шаблон сайта и позже его изменить.",
            },
            {
              title: "Настройки при загрузке сайта",
              description:
                "Мы продумали гибкие настройки, ничего страшного если что-то не понятно. Мы заранее установили оптимальные настройки.",
            },
            {
              title: "Выбор шаблона сайта",
              description:
                "Мы загрузили базовые шаблоны для вашего сайта, просто выберите лучший и доработайте его под себя.",
            },
            {
              title: "Готово!",
              description:
                "Поздравляем, вы завершили обучение.",
            },
          ]}
          onFinish={() => setShowTip(false)}
        />
      )}
    </>
  );
};

export default Scraper;
