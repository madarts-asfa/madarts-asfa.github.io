export function setupKioskOpener() {
  const cartels = document.querySelectorAll("#kiosk .cartel");
  const button = document.querySelector("#close-display");

  for (const cartel of cartels) {
    cartel.addEventListener("click", (e) => {
      const element = e.currentTarget as HTMLElement;
      openInInFrame(element.dataset.url);
    });
  }

  button?.addEventListener("click", () => {
    const frame = document.querySelector<HTMLIFrameElement>("#display");
    frame?.classList.remove("show");
    button?.classList.remove("show");
    frame?.setAttribute("src", "");
  });
}

function openInInFrame(url: string | undefined) {
  if (!url) return;

  const frame = document.querySelector<HTMLIFrameElement>("#display");
  frame?.addEventListener("load", function displayOnLoad() {
    frame.classList.add("show");
    frame.removeEventListener("load", displayOnLoad);
  });
  frame?.setAttribute("src", url);

  const button = document.querySelector("#close-display");
  button?.classList.add("show");
}
