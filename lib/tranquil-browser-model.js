const { Disposable, Emitter } = require("atom");
const { Model } = require("theorist");
const { blockedUrlList } = require("./constants");
const path = require("path");
const { isUrlBlocked } = require("./utils");

class HTMLEditor extends Model {
  constructor({ tranquilBrowser, url, opt }) {
    super();
    this.tranquilBrowser =
      typeof tranquilBrowser === "string"
        ? JSON.parse(tranquilBrowser)
        : tranquilBrowser;
    this.url = url;
    this.opt = opt || {};
    this.disposable = new Disposable();
    this.emitter = new Emitter();
    this.src = this.opt.src;
    this.orgURI = this.opt.orgURI;
    this._id = this.opt._id;

    if (this.tranquilBrowser && !this.tranquilBrowser.setContextMenu) {
      this.tranquilBrowser.setContextMenu = true;
      atom.contextMenu.itemSets.forEach((menu) => {
        if (menu.selector === "atom-pane") {
          menu.items.forEach((item) => {
            item.shouldDisplay = (evt) =>
              !(evt.target?.constructor?.name === "webview");
          });
        }
      });
    }
  }

  getViewClass() {
    return require("./tranquil-browser-view");
  }

  setText(src) {
    this.src = src;
    if (this.src) {
      this.view.setSrc(this.src);
    }
  }

  refresh(url) {
    return this.view.refreshPage(url);
  }

  destroyed() {
    return this.emitter.emit("did-destroy");
  }

  onDidDestroy(cb) {
    return this.emitter.on("did-destroy", cb);
  }

  getTitle() {
    if (this.title?.length > 20) {
      this.title = this.title.slice(0, 20) + "...";
    }
    return this.title || path.basename(this.url);
  }

  getIconName() {
    return this.iconName;
  }

  getURI() {
    // if (this.url !== "tranquil-browser://blank") {
    // return this.url;
    // }
  }

  getURL() {
    return this.url;
  }

  getGrammar() {}

  setTitle(title) {
    this.title = title;
    return this.emit("title-changed");
  }

  updateIcon(favIcon) {
    this.favIcon = favIcon;
    return this.emit("icon-changed");
  }

  serialize() {
    return {
      data: {
        // tranquilBrowser: this.tranquilBrowser
        //   ? JSON.stringify(this.tranquilBrowser)
        //   : null,
        tranquilBrowser: null,
        url: this.url,
        opt: {
          src: this.src,
          iconName: this.iconName,
          title: this.title,
        },
      },
      deserializer: "HTMLEditor",
    };
  }

  static deserialize(data) {
    return new HTMLEditor(data);
  }

  static checkUrl(url) {
    if (isUrlBlocked(url, blockedUrlList)) {
      atom.notifications.addSuccess(
        `${url} is not supported in Tranquil, so it has been opened in your default browser.`
      );
      require("shell").openExternal(url);
      return false;
    }
    return true;
  }

  static getEditorForURI(url, sameWindow) {
    const a = document.createElement("a");
    a.href = url;
    if (
      !url.startsWith("file:///") &&
      !sameWindow &&
      atom.config
        .get("tranquil-browser.openInSameWindow")
        .some((h) => h === a.hostname)
    ) {
      for (const paneItem of atom.workspace.getPaneItems()) {
        const i = document.createElement("a");
        i.href = paneItem.getURI();
        if (i.hostname === a.hostname) {
          return paneItem;
        }
      }
    }
    return false;
  }
}

module.exports = HTMLEditor;
