const originForm = document.querySelector("#origin-form");
const originInput = document.querySelector("#service-origin");
const connectButton = document.querySelector("#connect");
const disconnectButton = document.querySelector("#disconnect");
const connectionState = document.querySelector("#connection-state");
const libraryLink = document.querySelector("#library");
const statusElement = document.querySelector("#status");

function renderStatus(status) {
  if (!status) {
    statusElement.textContent = "No activity yet.";
    delete statusElement.dataset.kind;
    return;
  }
  statusElement.textContent = status.message;
  statusElement.dataset.kind = status.kind;
}

function renderState(state) {
  originInput.value = state.origin;
  libraryLink.href = state.origin;
  connectionState.textContent = state.connected
    ? "This browser is connected to NOD."
    : "This browser is not connected to NOD.";
  connectButton.hidden = state.connected;
  disconnectButton.hidden = !state.connected;
  renderStatus(state.status);
}

async function send(message) {
  const response = await chrome.runtime.sendMessage(message);
  if (response?.error) throw new Error(response.error);
  return response;
}

async function refresh() {
  renderState(await send({ type: "get-state" }));
}

function setBusy(button, busy) {
  button.disabled = busy;
  button.dataset.label ||= button.textContent;
  button.textContent = busy ? "Please wait…" : button.dataset.label;
}

originForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = originForm.querySelector("button");
  setBusy(button, true);
  try {
    await send({ type: "configure-origin", origin: originInput.value });
  } catch (error) {
    renderStatus({ kind: "error", message: error.message });
  } finally {
    setBusy(button, false);
    await refresh();
  }
});

connectButton.addEventListener("click", async () => {
  setBusy(connectButton, true);
  try {
    await send({ type: "connect" });
  } catch (error) {
    renderStatus({ kind: "error", message: error.message });
  } finally {
    setBusy(connectButton, false);
    await refresh();
  }
});

disconnectButton.addEventListener("click", async () => {
  setBusy(disconnectButton, true);
  try {
    await send({ type: "disconnect" });
  } catch (error) {
    renderStatus({ kind: "error", message: error.message });
  } finally {
    setBusy(disconnectButton, false);
    await refresh();
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.lastResult) renderStatus(changes.lastResult.newValue);
});

void refresh().catch((error) => renderStatus({ kind: "error", message: error.message }));
