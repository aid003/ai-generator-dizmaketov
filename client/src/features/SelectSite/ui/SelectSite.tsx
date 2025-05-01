"use client";
import scraperSocket from "@/shared/socket-scraper/socket";
import { ScraperServerToClientEvents } from "@/shared/socket-scraper/types/types";
import styles from "./SelectSite.module.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SelectSite = () => {
  const [sites, setSites] = useState<string[]>([]);

  const router = useRouter();

  useEffect(() => {
    scraperSocket.emit("availableSites");

    const handleSites: ScraperServerToClientEvents["availableSites"] = (
      sites
    ) => {
      setSites(sites);
    };

    scraperSocket.on("availableSites", handleSites);

    return () => {
      scraperSocket.off("availableSites", handleSites);
    };
  }, []);

  const handleClick = (url: string) => {
    router.push(`/chat?url=${url}`);
  };

  return (
    <div className={styles.selectContainer}>
      {sites.length === 0 ? (
        <p className={styles.notFound}>Сайты не найдены</p>
      ) : (
        <>
          <h2 className={styles.heading}>📁 Доступные сайты</h2>
          <ul className={styles.listContainer}>
            {sites.map((url) => (
              <li
                key={url}
                className={styles.itemContainer}
                onClick={() => handleClick(url)}
              >
                {url}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default SelectSite;
