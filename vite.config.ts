import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Vite 构建配置。
 *
 * @returns Vite 配置对象
 */
export default defineConfig({
  plugins: [react()],
});
