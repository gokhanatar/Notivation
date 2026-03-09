import { createRoot } from "react-dom/client";
import { SplashScreen } from "@capacitor/splash-screen";
import { isNative } from "@/lib/capacitor";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Hide splash screen after app renders (native only)
if (isNative) {
  SplashScreen.hide();
}
