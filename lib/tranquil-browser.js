const { CompositeDisposable } = require("atom");
const TranquilBrowserModel = require("./tranquil-browser-model");
require("JSON2");
const uuid = require("node-uuid");
const path = require("path");
const { ipcRenderer } = require("electron");
const fs = require("fs");

const TranquilBrowser = {
  tranquilBrowserView: null,
  subscriptions: null,
  model: null,
  config: {
    fav: {
      title: "No of Favorites",
      type: "number",
      default: 10,
    },
    homepage: {
      title: "HomePage",
      type: "string",
      default: "tranquil-browser://blank",
    },
    live: {
      title: "Live Refresh in ",
      type: "number",
      default: 500,
    },
    currentFile: {
      title: "Show Current File",
      type: "boolean",
      default: true,
    },
    openInSameWindow: {
      title: "Open URLs in Same Window",
      type: "array",
      default: [
        "www.google.com",
        "www.stackoverflow.com",
        "google.com",
        "stackoverflow.com",
      ],
    },
  },
  activate: function (state) {
    atom.workspace.onDidOpen((event) => {
      try {
        if (event.uri.includes("sample.url")) {
          const packagesPath = path.resolve(
            `${__dirname}/../resources/sample.url`
          );
          const fileContent = fs.readFileSync(packagesPath, "utf8");
          const match = fileContent.match(/^URL=(.*)$/m);
          if (match && match[1]) {
            event.pane.destroyItem(event.item);
            atom.workspace.open(match[1]);
          }
        } else if (event.uri.includes(".url")) {
          const packagesPath = path.resolve(event.uri);
          const fileContent = fs.readFileSync(packagesPath, "utf8");
          const match = fileContent.match(/^URL=(.*)$/m);
          if (match && match[1]) {
            event.pane.destroyItem(event.item);
            atom.workspace.open(match[1]);
          }
        }
      } catch (e) {
        console.log(e);
      }
    });
    var $;
    if (!state.noReset) {
      state.favIcon = {};
      state.title = {};
      state.fav = [];
    }
    this.resources = path.resolve(`${__dirname}/../resources/`);
    require("jstorage");
    window.bp = {};
    $ = require("jquery");
    window.bp.js = $.extend({}, window.$.jStorage);
    if (!window.bp.js.get("bp.fav")) {
      window.bp.js.set("bp.fav", []);
    }
    if (!window.bp.js.get("bp.history")) {
      window.bp.js.set("bp.history", []);
    }
    if (!window.bp.js.get("bp.favIcon")) {
      window.bp.js.set("bp.favIcon", {});
    }
    if (!window.bp.js.get("bp.title")) {
      window.bp.js.set("bp.title", {});
    }
    atom.workspace.addOpener(
      (function (_this) {
        return function (url, opt) {
          try {
            var editor, localhostPattern, pane, path;
            if (opt == null) {
              opt = {};
            }
            path = require("path");
            if (
              url.indexOf("http:") === 0 ||
              url.indexOf("https:") === 0 ||
              url.indexOf("localhost") === 0 ||
              url.indexOf("file:") === 0 ||
              url.indexOf("tranquil-browser:") === 0 ||
              url.indexOf("tranquil-browser~") === 0
            ) {
              localhostPattern = /^(http:\/\/)?localhost/i;
              if (!TranquilBrowserModel.checkUrl(url)) {
                return false;
              }
              if (
                !(
                  url === "tranquil-browser://blank" ||
                  url.startsWith("file:///") ||
                  !opt.openInSameWindow
                )
              ) {
                editor = TranquilBrowserModel.getEditorForURI(
                  url,
                  opt.openInSameWindow
                );
                if (editor) {
                  editor.setText(opt.src);
                  if (!opt.src) {
                    editor.refresh(url);
                  }
                  pane = atom.workspace.paneForItem(editor);
                  pane.activateItem(editor);
                  return editor;
                }
              }
              if (url === "tranquil-browser://blank") {
                const historyURL = (
                  "file://" +
                  path.resolve(`${__dirname}/../resources/`) +
                  "/home.html"
                ).replace(/\\/g, "/");
                const model = new TranquilBrowserModel({
                  tranquilBrowser: _this,
                  url: historyURL,
                  opt: opt,
                });
                _this.model = model;
                return model;
              }

              const model = new TranquilBrowserModel({
                tranquilBrowser: _this,
                url: url,
                opt: opt,
              });
              _this.model = model;
              return model;
            }
          } catch (e) {
            console.log(e);
          }
        };
      })(this)
    );
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "tranquil-browser:open": (function (_this) {
          return function () {
            return _this.open();
          };
        })(this),
      })
    );
    this.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "tranquil-browser:focus-url": (function (_this) {
          return function () {
            _this?.model?.view?.urlbar[0]?.querySelector("#url")?.focus();
            _this?.model?.view?.urlbar[0]?.querySelector("#url")?.select();
            // document.querySelector('#url')?.focus();
          };
        })(this),
      })
    );
    this.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "tranquil-browser:add-to-tree-view": (function (_this) {
          return function (event) {
            const target =
              event.target.tagName === "LI"
                ? event.target
                : event.target.parentElement;
            if (target && target.item) {
              _this.addToTreeView(target.item.url);
            } else {
              const url = _this.model?.getURL();
              if (url) {
                _this.addToTreeView(url);
              }
            }
          };
        })(this),
      })
    );
    this.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "tranquil-browser:open-link-in-new-window": (function (_this) {
          return function (event) {
            const target =
              event.target.tagName === "LI"
                ? event.target
                : event.target.parentElement;
            if (target && target.item) {
              _this.openLinkInNewWindow(target.item.url);
            } else {
              const url = _this.model?.getURL();
              if (url) {
                _this.openLinkInNewWindow(url);
              }
            }
          };
        })(this),
      })
    );
    this.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "tranquil-browser:open-link-in-default-browser": (function (_this) {
          return function (event) {
            const target =
              event.target.tagName === "LI"
                ? event.target
                : event.target.parentElement;
            if (target && target.item) {
              _this.openLinkInDefaultBrowser(target.item.url);
            } else {
              const url = _this.model?.getURL();
              if (url) {
                _this.openLinkInDefaultBrowser(url);
              }
            }
          };
        })(this),
      })
    );

    this.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "tranquil-browser:openCurrent": (function (_this) {
          return function () {
            return _this.open(true);
          };
        })(this),
      })
    );
    this.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "tranquil-browser:history": (function (_this) {
          return function () {
            return _this.history(true);
          };
        })(this),
      })
    );
    this.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "tranquil-browser:deleteHistory": (function (_this) {
          return function () {
            return _this["delete"](true);
          };
        })(this),
      })
    );
    return this.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "tranquil-browser:fav": (function (_this) {
          return function () {
            console.log("fav click");
            return _this.favr();
          };
        })(this),
      })
    );
  },
  favr: function () {
    var favList;
    favList = require("./fav-view");
    return new favList(window.bp.js.get("bp.fav"));
  },
  delete: function () {
    return window.bp.js.set("bp.history", []);
  },
  history: function () {
    return atom.workspace.open("tranquil-browser://history", {
      split: "left",
      searchAllPanes: true,
    });
  },
  open: function (url, opt) {
    var editor, ref;
    if (opt == null) {
      opt = {};
    }
    if (!url && atom.config.get("tranquil-browser.currentFile")) {
      editor = atom.workspace.getActiveTextEditor();
      if (
        (url =
          editor != null
            ? (ref = editor.buffer) != null
              ? ref.getUri()
              : void 0
            : void 0)
      ) {
        url = "file:///" + url;
      }
    }
    if (!url) {
      url = atom.config.get("tranquil-browser.homepage");
    }
    if (!opt.split) {
      opt.split = this.getPosition();
    }
    return atom.workspace.open("tranquil-browser://blank", opt);
  },
  getPosition: function () {
    var activePane, orientation, paneAxis, paneIndex, ref;
    activePane = atom.workspace.paneForItem(
      atom.workspace.getActiveTextEditor()
    );
    if (!activePane) {
      return;
    }
    paneAxis = activePane.getParent();
    if (!paneAxis) {
      return;
    }
    paneIndex = paneAxis.getPanes().indexOf(activePane);
    orientation = (ref = paneAxis.orientation) != null ? ref : "horizontal";
    if (orientation === "horizontal") {
      if (paneIndex === 0) {
        return "right";
      } else {
        return "left";
      }
    } else {
      if (paneIndex === 0) {
        return "down";
      } else {
        return "up";
      }
    }
  },
  deactivate: function () {
    var ref;
    if ((ref = this.tranquilBrowserView) != null) {
      if (typeof ref.destroy === "function") {
        ref.destroy();
      }
    }
    return this.subscriptions.dispose();
  },
  serialize: function () {
    return {
      noReset: true,
    };
  },
  getTranquilBrowserUrl: function (url) {
    if (url.startsWith("tranquil-browser://history")) {
      return (url = this.resources + "/history.html");
    } else {
      return (url = "");
    }
  },
  openLinkInNewWindow: function (url) {
    console.log("openLinkInNewWindow", url);
    return ipcRenderer.send("application:new-window-open-url", { url });
  },
  openLinkInDefaultBrowser: function (url) {
    console.log("openLinkInDefaultBrowser", url);
    if (url) {
      require("shell").openExternal(url);
    }
  },
  addPlugin: function (requires) {
    var error, key, menu, pkg, pkgPath, pkgs, results, script, val;
    if (this.plugins == null) {
      this.plugins = {};
    }
    results = [];
    for (key in requires) {
      val = requires[key];
      try {
        switch (key) {
          case "onInit" || "onExit":
            results.push(
              (this.plugins[key] = (this.plugins[key] || []).concat(
                "(" + val.toString() + ")()"
              ))
            );
            break;
          case "js" || "css":
            if (!pkgPath) {
              pkgs = Object.keys(atom.packages.activatingPackages).sort();
              pkg = pkgs[pkgs.length - 1];
              pkgPath = atom.packages.activatingPackages[pkg].path + "/";
            }
            if (Array.isArray(val)) {
              results.push(
                function () {
                  var i, len, results1;
                  results1 = [];
                  for (i = 0, len = val.length; i < len; i++) {
                    script = val[i];
                    if (!script.startsWith("http")) {
                      results1.push(
                        (this.plugins[key + "s"] = (
                          this.plugins[key] || []
                        ).concat(
                          "file:///" +
                            atom.packages.activatingPackages[pkg].path.replace(
                              /\\/g,
                              "/"
                            ) +
                            "/" +
                            script
                        ))
                      );
                    } else {
                      results1.push(void 0);
                    }
                  }
                  return results1;
                }.call(this)
              );
            } else {
              if (!val.startsWith("http")) {
                results.push(
                  (this.plugins[key + "s"] = (this.plugins[key] || []).concat(
                    "file:///" +
                      atom.packages.activatingPackages[pkg].path.replace(
                        /\\/g,
                        "/"
                      ) +
                      "/" +
                      val
                  ))
                );
              } else {
                results.push(void 0);
              }
            }
            break;
          case "menus":
            if (Array.isArray(val)) {
              results.push(
                function () {
                  var i, len, results1;
                  results1 = [];
                  for (i = 0, len = val.length; i < len; i++) {
                    menu = val[i];
                    menu._id = uuid.v1();
                    results1.push(
                      (this.plugins[key] = (this.plugins[key] || []).concat(
                        menu
                      ))
                    );
                  }
                  return results1;
                }.call(this)
              );
            } else {
              val._id = uuid.v1();
              results.push(
                (this.plugins[key] = (this.plugins[key] || []).concat(val))
              );
            }
            break;
          default:
            results.push(void 0);
        }
      } catch (error1) {
        error = error1;
      }
    }
    return results;
  },
  provideService: function () {
    return {
      model: require("./tranquil-browser-model"),
      addPlugin: this.addPlugin.bind(this),
    };
  },
  addToTreeView: function (url) {
    try {
      const selectedDirectoryPath = document
        ?.getElementsByClassName("tree-view")?.[0]
        ?.querySelectorAll(".selected")?.[0]
        ?.getPath();
      const rootPath = document
        ?.getElementsByClassName("tree-view")?.[0]
        ?.querySelectorAll(".project-root")?.[0]
        ?.getPath();
      const urlObject = new URL(url);
      const packagesPath = path.resolve(
        `${selectedDirectoryPath || rootPath}/${urlObject.hostname}.url`
      );
      const content = `[InternetShortcut]\nURL=${url}`;
      fs.writeFileSync(packagesPath, content);
      return;
    } catch (error) {
      console.error(`Error saving url file: ${error.message}`);
    }
  },
  handleURI(parsedUri) {
    atom.workspace.open(parsedUri.path.slice(1));
  },
};

module.exports = TranquilBrowser;
