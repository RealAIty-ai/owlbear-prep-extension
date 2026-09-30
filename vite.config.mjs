export default {
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    cors: {
      origin: "https://www.owlbear.rodeo"
    }
  },
  build: {
    rollupOptions: {
      input: { popover: "index.html", background: "background.html" }
    }
  }
};
