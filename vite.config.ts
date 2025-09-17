import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react'; // Importa o plugin React

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()], // USA o plugin React
      
      base: './', // Adiciona a base para caminhos relativos, crucial para itch.io

      define: {
        // Removi a exposição da sua chave de API por segurança
      },
      resolve: {
        alias: {
          '@': path.resolve('.'),
        }
      },
      build: {
        outDir: 'dist',
      }
    };
});