const { ipcRenderer } = require("electron");
const path = require("path");
const fs = require("fs");

/**
 * to prevent get-selected-content-link event from being called multiple times at once.
 * prevId2 is to use inside open-link-in-default-window handler.
 * needed to use 2 separate variables.
 */
let prevId, prevId2, prevId3;

const addIpcInstanceEvents = (webViewItem, atom, TranquilBrowser) => {
  const webviewId = webViewItem?.model.id;
  webViewItem.htmlv[0].addEventListener("ipc-message", (event) => {
    switch (event?.channel) {
      case "open-link-in-new-tab": {
        const args = event?.args?.[0];
        const linkToOpen = args?.link ? args.link : args?.text;
        if (linkToOpen) {
          atom.workspace.open(linkToOpen, { activateItem: false });
        }
        break;
      }
      case "open-link-in-default-browser": {
        const args = event?.args?.[0];
        if (prevId2 && prevId2 === args.id) return;
        prevId2 = args.id;
        const linkToOpen = args?.link ? args.link : args?.text;
        if (linkToOpen) require("shell").openExternal(linkToOpen);
        break;
      }
      case "open-link-in-new-window": {
        const args = event?.args?.[0];
        if (prevId3 && prevId3 === args.id) return;
        prevId3 = args.id;
        const linkToOpen = args?.link ? args.link : args?.text;
        console.log("linkToOpen", linkToOpen);
        const packagesPath = path.resolve(
          `${__dirname}/../resources/sample.url`
        );
        fs.writeFileSync(packagesPath, `[InternetShortcut]\nURL=${linkToOpen}`);
        atom.open({ pathsToOpen: [packagesPath], newWindow: true });
        break;
      }
      case "add-link-to-treeview": {
        const args = event?.args?.[0];
        const linkToOpen = args?.link ? args.link : args?.text;
        if (linkToOpen) {
          TranquilBrowser.addToTreeView(linkToOpen); //getActivePane().saveActiveItem();
        }
        break;
      }
      case "zoom-in": {
        const args = event?.args?.[0];
        const webView = webViewItem?.htmlv?.[0];
        if (webviewId === parseInt(args?.modelId)) {
          webView.setZoomFactor(webView.getZoomFactor() + 0.1);
        }
        break;
      }
      case "zoom-out": {
        const args = event?.args?.[0];
        const webView = webViewItem?.htmlv?.[0];
        if (webviewId === parseInt(args?.modelId)) {
          webView.setZoomFactor(webView.getZoomFactor() - 0.1);
        }
        break;
      }
      case "toggle-dev-tool": {
        webViewItem.toggleDevTool();
        break;
      }
      case "webview-key-events": {
        const args = event?.args?.[0];
        const w_event = args?.w_event;
        const getActivePaneItem = atom.workspace.getActivePaneItem();
        getActivePaneItem?.view?.keyHandler(w_event);
        break;
      }
      case "on-find": {
        document.getElementsByClassName("find-and-replace")[0].style[
          "display"
        ] = "none";
        break;
      }
      case "close-find": {
        document.getElementsByClassName("find-and-replace")[0].style[
          "display"
        ] = "block";
        break;
      }
      default: {
        // code block
      }
    }
  });

  webViewItem.htmlv[0].addEventListener("dom-ready", (event) => {
    // [FIX] Input cursor invisible after navigation in webview
    webViewItem.htmlv[0].blur();
    webViewItem.htmlv[0].focus();
  });

  // ipcRenderer.on("get-selected-image-link", (event, args) => {
  //   const getActivePaneItem = atom.workspace.getActivePaneItem();
  //   const webView = getActivePaneItem?.view?.htmlv?.[0];
  //   webView?.send("get-selected-image-link", args);
  // });

  ipcRenderer.on("tab-focus", function (event, obj) {
    const getActivePaneItem = atom.workspace.getActivePaneItem();
    const urlInput = getActivePaneItem?.view?.urlbar[0]?.querySelector("#url");
    urlInput.select();
  });
};

const addUrlChangeInstanceEvent = (webViewItem, url) => {
  const webviewId = webViewItem?.model.id;
  ipcRenderer.send("webview-url-change", { webViewId: webviewId, url });
};

const isUrlBlocked = (url, blockedUrlList) => {
  return blockedUrlList.some((listItem) => url.includes(listItem));
};

module.exports = {
  addIpcInstanceEvents,
  addUrlChangeInstanceEvent,
  isUrlBlocked,
};
