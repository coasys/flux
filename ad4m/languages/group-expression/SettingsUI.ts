import type { SettingsUI } from "@perspect3vism/ad4m/Language";
import SettingsIcon from './build/SettingsIcon.js';

export class JuntoSettingsUI implements SettingsUI {
    settingsIcon(): string {
        return SettingsIcon
    }
}