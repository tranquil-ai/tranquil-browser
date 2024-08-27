const { contextBridge, ipcRenderer, remote } = require("electron");
const { FindInPage } = require("./electron-find/index.js");
require("./ctxmenu.js");

console.log("tb-client loaded");
contextBridge.exposeInMainWorld("electron", {
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  sendToHost: (channel, data) => {
    ipcRenderer.sendToHost(channel, data);
  },
  sendSync: (channel, data) => {
    ipcRenderer.sendSync(channel, data);
  },
  receive: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
  invoke: async (channel, data) => {
    try {
      const result = await ipcRenderer.invoke(channel, data);
      return result;
    } catch (error) {
      console.error(`Error invoking ${channel}:`, error);
      throw error; // Rethrow the error for the caller to handle
    }
  },
});

document.addEventListener("DOMContentLoaded", function () {
  var menuDefinition = [
    {
      text: "Copy link address",
      action: (e, selectedElement) => {
        const link = getSelectionLink(selectedElement);
        navigator.clipboard.writeText(link);
      },
    },
    { isDivider: true },
    {
      text: "Open link in new tab",
      action: (e, selectedElement) => {
        const link = getSelectionLink(selectedElement);
        const text = getSelectionText(selectedElement);
        ipcRenderer.sendToHost("open-link-in-new-tab", {
          link,
          id: Date.now(),
          text: getTextLink(text),
        });
      },
    },
    { isDivider: true },
    {
      text: "Open link in default browser",
      action: (e, selectedElement) => {
        const link = getSelectionLink(selectedElement);
        const text = getSelectionText(selectedElement);
        ipcRenderer.sendToHost("open-link-in-default-browser", {
          link,
          id: Date.now(),
          text: getTextLink(text),
        });
      },
    },
    { isDivider: true },
    {
      text: "Open link in new window",
      action: (e, selectedElement) => {
        const link = getSelectionLink(selectedElement);
        const text = getSelectionText(selectedElement);
        ipcRenderer.sendToHost("open-link-in-new-window", {
          link,
          id: Date.now(),
          text: getTextLink(text),
        });
      },
    },
    { isDivider: true },
    {
      text: "Save link to Treeview",
      action: (e, selectedElement) => {
        const link = getSelectionLink(selectedElement);
        const text = getSelectionText(selectedElement);
        ipcRenderer.sendToHost("add-link-to-treeview", {
          link,
          id: Date.now(),
          text: getTextLink(text),
        });
      },
    },
    { isDivider: true },
    {
      text: "Cut",
      action: (e, selectedElement) => {
        document.execCommand("cut");
      },
    },
    { isDivider: true },
    {
      text: "Copy",
      action: (e, selectedElement) => {
        document.execCommand("copy");
      },
    },
    { isDivider: true },
    {
      text: "Paste",
      action: async (e, selectedElement) => {
        document.execCommand("paste");
      },
    },
    { isDivider: true },
    {
      text: "Select all",
      action: async (e, selectedElement) => {
        document.execCommand("selectAll");
      },
    },
    { isDivider: true },
    {
      text: "Zoom in",
      action: async (e, selectedElement) => {
        ipcRenderer.sendToHost("zoom-in", {
          modelId: sessionStorage.getItem("modelId"),
        });
      },
    },
    { isDivider: true },
    {
      text: "Zoom out",
      action: async (e, selectedElement) => {
        ipcRenderer.sendToHost("zoom-out", {
          modelId: sessionStorage.getItem("modelId"),
        });
      },
    },
    { isDivider: true },
    {
      text: "Inspect",
      action: async (e, selectedElement) => {
        ipcRenderer.sendToHost("toggle-dev-tool", {});
      },
    },
  ];
  window.ctxmenu.attach("body", menuDefinition, {});
});

function getTextLink(text) {
  let textLink;
  if (isValidHttpUrl(text)) {
    textLink = text;
  } else if (text) {
    textLink = "https://duckduckgo.com/?q=" + text;
  }
  return textLink;
}

function getSelectionLink(activeEl) {
  const activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
  if (activeElTagName === "a") {
    const linkType = activeEl.dataset.linkType;
    if (linkType === "history") {
      return activeEl.dataset.link;
    }
    return activeEl.href;
  }
  return null;
}

function getSelectionText(activeEl) {
  var text = "";
  // var activeEl = document.activeElement;
  var activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
  if (
    activeElTagName == "textarea" ||
    (activeElTagName == "input" &&
      /^(?:text|search|password|tel|url)$/i.test(activeEl.type) &&
      typeof activeEl.selectionStart == "number")
  ) {
    text = activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd);
  } else if (window.getSelection) {
    text = window.getSelection().toString();
  }
  return text?.trim();
}

function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

// function isImage(link) {
//   const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];
//   const ext = link.split('.').pop();
//   return imageExtensions.includes(ext);
// }

// ipcRenderer.on('get-selected-image-link', () => {
//   if (window.rightClickedElement.tagName.toLowerCase() === 'img') {
//     ipcRenderer.send('add-link-to-treeview', {
//       link: window.rightClickedElement.src,
//     });
//   }

//   const activeEl = document.activeElement;
//   if (activeEl && activeEl.tagName.toLowerCase() === 'a') {
//     if (isImage(activeEl.href)) {
//       ipcRenderer.send('add-link-to-treeview', {
//         link: activeEl.href,
//       });
//     } else {
//       const imgTag = activeEl.querySelector('img');
//       if (imgTag) {
//         ipcRenderer.send('add-link-to-treeview', {
//           link: imgTag.src,
//         });
//       }
//     }
//   }
// });

let findInPage;
ipcRenderer.on("on-find", (e, args) => {
  findInPage = new FindInPage(remote.getCurrentWebContents(), {
    preload: true,
    offsetTop: 6,
    offsetRight: 10,
  });
  findInPage.openFindWindow();
  ipcRenderer.sendToHost("on-find", {});
  console.log("on-find");
});

ipcRenderer.on("close-find", (e, args) => {
  findInPage.destroy();
  ipcRenderer.sendToHost("close-find", {});
  console.log("close-find");
});

window.addEventListener("keydown", (e) => {
  const { keyIdentifier, ctrlKey, altKey, key, code, keyCode, charCode } = e;
  ipcRenderer.sendToHost("webview-key-events", {
    w_event: { keyIdentifier, ctrlKey, altKey, key, code, keyCode, charCode },
  });
});
