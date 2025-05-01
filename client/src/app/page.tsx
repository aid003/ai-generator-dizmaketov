import styles from "../shared/Styles/page.module.css";
import Scraper from "@/widgets/Scraper/ui/Scraper";

export default function Home() {
  return (
    <div className={styles.mainContainer}>
      <Scraper />
    </div>
  );
}
