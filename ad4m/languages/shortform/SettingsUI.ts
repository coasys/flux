import type { SettingsUI } from "@perspect3vism/ad4m";
import SettingsIcon from "./build/SettingsIcon.js";

export class JuntoSettingsUI implements SettingsUI {
  settingsIcon(): string {
    return SettingsIcon;
  }
}
