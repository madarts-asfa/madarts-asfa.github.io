export function setupFullscreenToggle() {
  const button = document.querySelector("#enter-fullscreen");
  button?.addEventListener("click", () => {
    window.document.body.requestFullscreen();
  });
}
