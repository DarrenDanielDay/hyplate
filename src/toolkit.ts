import type { Differ } from "./types.js";

export const alwaysDifferent: Differ = () => false;
