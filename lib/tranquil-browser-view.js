const { CompositeDisposable } = require("atom");
const ref = require("atom-space-pen-views");
const jQ = require("jquery");
require("jquery-ui/autocomplete");
const path = require("path");
require("JSON2");
const fs = require("fs");
require("jstorage");
const { addIpcInstanceEvents, addUrlChangeInstanceEvent } = require("./utils");
const TranquilBrowser = require("./tranquil-browser");

const View = ref.View;
const $ = ref.$;
window.bp = {};
window.bp.js = $.extend({}, window.$.jStorage);

RegExp.escape = function (s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
};
const crypto = require("crypto");

const decodePassword = (password, ivCipher) => {
  const rawPassword = Buffer.from(password, "base64");
  const rawKey = Buffer.from("5dBJWAPezu6p7eq7vImQiw==", "base64");
  const iv = Buffer.from(ivCipher, "base64");

  const decipher = crypto.createDecipheriv("aes-128-cbc", rawKey, iv);
  let decrypted = decipher.update(rawPassword);
  decrypted += decipher.final("utf8");
  return decrypted.toString();
};
const extend = function (child, parent) {
  Object.keys(parent).forEach((key) => {
    child[key] = parent[key];
  });

  function ctor() {
    this.constructor = child;
  }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
  child.__super__ = parent.prototype;
  return child;
};

const TranquilBrowserView = (function (superClass) {
  extend(TranquilBrowserView, superClass);

  function TranquilBrowserView(model) {
    this.model = model;
    this.subscriptions = new CompositeDisposable();
    this.model.view = this;
    this.model.onDidDestroy(() => {
      this.subscriptions.dispose();
      if (typeof jQ(this.url).autocomplete === "function") {
        jQ(this.url).autocomplete("destroy");
      }
    });
    atom.notifications.onDidAddNotification(function (notification) {
      if (notification.type === "info") {
        return setTimeout(function () {
          return notification.dismiss();
        }, 1000);
      }
    });
    // this.subscriptions.add(
    //   atom.commands.add('atom-workspace', {
    //     'tranquil-browser:add-to-tree-view': (function (_this) {
    //       return function () {
    //         console.log({ hehe: _this });
    //         console.log({ hehe2: _this.model });
    //         console.log({ hehe3: _this.model.view });
    //         console.log({ hehe4: _this.model.url });
    //       };
    //     })(this),
    //   })
    // );
    TranquilBrowserView.__super__.constructor.apply(this, arguments);
  }
  TranquilBrowserView.content = function (params) {
    let url = params.url;
    let spinnerClass = "fa fa-spinner";
    let hideURLBar = "";
    if (params.opt && params.opt.hideURLBar) {
      hideURLBar = "hideURLBar";
    }
    if (params.opt && params.opt.src) {
      params.src = TranquilBrowserView.checkBase(params.opt.src, params.url);
      params.src = params.src.replace(/"/g, "'");
      if (!params.src.startsWith("data:text/html,")) {
        params.src = "data:text/html," + params.src;
      }
      url = params.src;
    }
    if (params.url && params.url.startsWith("tranquil-browser://")) {
      url =
        params.tranquilBrowser &&
        params.tranquilBrowser.getTranquilBrowserUrl(url);
      spinnerClass += " fa-custom";
    }

    this.div({ class: "tranquil-browser" }, () => {
      this.div(
        { class: `url-bc native-key-bindings ${hideURLBar}`, outlet: "urlbar" },
        () => {
          this.div({ class: "nav-btns-left-bc" }, () => {
            this.span({
              id: "back",
              class: "mega-octicon octicon-arrow-left",
              outlet: "back",
            });
            this.span({
              id: "forward",
              class: "mega-octicon octicon-arrow-right",
              outlet: "forward",
            });
            this.span({ class: "apm-browser-icon-divider" }, "");
            this.span(
              {
                id: "refresh",
                class: "apm-browser-icon-wrapper",
                outlet: "refresh",
              },
              () => {
                this.img({
                  class: "apm-browser-icon",
                  src: "https://i.ibb.co/WBC9pgN/hub-v2-browser-refresh.png",
                });
              }
            );
            this.a({ class: spinnerClass, outlet: "spinner" });
          });

          this.div({ class: "nav-btns-bc" }, () => {
            this.div({ class: "nav-btns-right-bc" }, () => {
              this.span(
                {
                  id: "newTab",
                  class: "apm-browser-icon-wrapper",
                  outlet: "newTab",
                },
                () => {
                  this.img({
                    class: "apm-browser-icon",
                    src: "https://i.ibb.co/QFMz30h/hub-v2-tranquil-browser.png",
                  });
                }
              );
              this.span({
                id: "fav",
                class: "mega-octicon octicon-star",
                outlet: "fav",
              });
              // this.span(
              //   {
              //     id: 'favList',
              //     class: 'apm-browser-icon-wrapper',
              //     outlet: 'favList',
              //   },
              //   () => {
              //     this.img({
              //       class: 'apm-browser-icon',
              //       src: 'https://i.ibb.co/DGTr34Z/hub-v2-browser-bookmark.png',
              //     });
              //   }
              // );
              this.span({ class: "apm-browser-icon-divider" }, "");
              this.span(
                {
                  id: "history",
                  class: "apm-browser-icon-wrapper",
                  outlet: "history",
                },
                () => {
                  this.img({
                    class: "apm-browser-icon",
                    src: "https://i.ibb.co/6W0XmND/hub-v2-browser-history.png",
                  });
                }
              );
              this.span({ class: "apm-browser-icon-divider" }, "");
              this.span(
                {
                  id: "print",
                  class: "apm-browser-icon-wrapper",
                  outlet: "print",
                },
                () => {
                  this.img({
                    class: "apm-browser-icon",
                    src: "https://i.ibb.co/FgnvsQh/hub-v2-browser-print.png",
                  });
                }
              );
              this.span({
                id: "remember",
                class: "mega-octicon octicon-pin",
                outlet: "remember",
              });
              this.span({
                id: "live",
                class: "mega-octicon octicon-zap",
                outlet: "live",
              });
              this.span(
                {
                  id: "devtool",
                  class: "apm-browser-icon-wrapper",
                  outlet: "devtool",
                },
                () => {
                  this.img({
                    class: "apm-browser-icon",
                    src: "https://i.ibb.co/c8Qghsh/hub-v2-browser-dev-tool.png",
                  });
                }
              );
            });

            this.div({ class: "input-url-bc" }, () => {
              this.input({
                class: "native-key-bindings-removed", // changing class native-key-bindings-->native-key-bindings-removed since it imapacts native key bindings
                type: "text",
                id: "url",
                outlet: "url",
                value: `${params.url}`,
              });
            });
            this.input({
              id: "find",
              class: "find-bc find-hide-bc",
              outlet: "find",
            });
          });
        }
      );
      this.tag("webview", {
        class: "native-key-bindings",
        outlet: "htmlv",
        preload: `file:///${params.tranquilBrowser.resources}/tb-client.js`,
        plugins: "on",
        src: `${url}`,
        // disablewebsecurity: "on",
        allowfileaccessfromfiles: "on",
        allowPointerLock: "on",
        nodeIntegration: "on",
        contextIsolation: "on",
        // partition: "persist:partitionName",
      });
    });
  };

  TranquilBrowserView.prototype.toggleURLBar = function () {
    return this.urlbar.toggle();
  };

  TranquilBrowserView.prototype.initialize = function () {
    var base1,
      ref1,
      ref2,
      ref3,
      ref4,
      ref5,
      ref6,
      ref7,
      ref8,
      ref9,
      select,
      src;
    src = (function (_this) {
      return function (req, res) {
        var _, fav, pattern, searchUrl, urls;
        _ = require("lodash");
        pattern = RegExp("" + RegExp.escape(req.term), "i");
        fav = _.filter(window.bp.js.get("bp.fav"), function (fav) {
          return fav.url.match(pattern) || fav.title.match(pattern);
        });
        urls = _.pluck(fav, "url");
        res(urls);
        searchUrl = "http://api.bing.com/osjson.aspx";
        return (function () {
          return jQ.ajax({
            url: searchUrl,
            dataType: "json",
            data: {
              query: req.term,
              "web.count": 10,
            },
            success: (function (_this) {
              return function (data) {
                var dat, i, len, ref1, search;
                urls = urls.slice(0, 11);
                search = "https://duckduckgo.com/?q=";
                ref1 = data[1].slice(0, 11);
                for (i = 0, len = ref1.length; i < len; i++) {
                  dat = ref1[i];
                  urls.push({
                    label: dat,
                    value: search + dat,
                  });
                }
                return res(urls);
              };
            })(this),
          });
        })();
      };
    })(this);
    select = (function (_this) {
      return function (event, ui) {
        return _this.goToUrl(ui.item.value);
      };
    })(this);
    if (typeof (base1 = jQ(this.url)).autocomplete === "function") {
      base1.autocomplete({
        source: src,
        minLength: 2,
        select: select,
      });
    }

    this.subscriptions.add(
      atom.tooltips.add(this.back, {
        title: "Back",
      })
    );
    this.subscriptions.add(
      atom.tooltips.add(this.forward, {
        title: "Forward",
      })
    );
    this.subscriptions.add(
      atom.tooltips.add(this.refresh, {
        title: "Refresh-f5/ctrl-f5",
      })
    );
    this.subscriptions.add(
      atom.tooltips.add(this.print, {
        title: "Print",
      })
    );
    this.subscriptions.add(
      atom.tooltips.add(this.history, {
        title: "History",
      })
    );
    // this.subscriptions.add(
    //   atom.tooltips.add(this.favList, {
    //     title: 'View Favorites',
    //   })
    // );
    this.subscriptions.add(
      atom.tooltips.add(this.fav, {
        // title: "Favoritize",
        title: "Add URL to Treeview",
      })
    );
    this.subscriptions.add(
      atom.tooltips.add(this.live, {
        title: "Live",
      })
    );
    this.subscriptions.add(
      atom.tooltips.add(this.remember, {
        title: "Remember Position",
      })
    );
    this.subscriptions.add(
      atom.tooltips.add(this.newTab, {
        title: "New Tab",
      })
    );
    this.subscriptions.add(
      atom.tooltips.add(this.devtool, {
        title: "Dev Tools-f12",
      })
    );
    this.subscriptions.add(
      atom.commands.add(".tranquil-browser webview", {
        "tranquil-browser-view:goBack": (function (_this) {
          return function () {
            return _this.goBack();
          };
        })(this),
      })
    );
    this.subscriptions.add(
      atom.commands.add(".tranquil-browser webview", {
        "tranquil-browser-view:goForward": (function (_this) {
          return function () {
            return _this.goForward();
          };
        })(this),
      })
    );
    this.subscriptions.add(
      atom.commands.add(".tranquil-browser", {
        "tranquil-browser-view:toggleURLBar": (function (_this) {
          return function () {
            return _this.toggleURLBar();
          };
        })(this),
      })
    );
    addIpcInstanceEvents(this, atom, TranquilBrowser);
    this.liveOn = false;
    // this.element.onkeydown = (function (_this) {
    //   return function () {
    //     return _this.keyHandler(arguments);
    //   };
    // })(this);
    if (this.model.url.indexOf("file:///") >= 0) {
      this.checkFav();
    }
    if ((ref1 = this.htmlv[0]) != null) {
      ref1.addEventListener("permissionrequest", function (e) {
        return e.request.allow();
      });
    }
    if ((ref2 = this.htmlv[0]) != null) {
      ref2.addEventListener(
        "console-message",
        (function (_this) {
          return function (e) {
            var base2,
              base3,
              base4,
              base5,
              base6,
              css,
              csss,
              data,
              i,
              indx,
              init,
              inits,
              j,
              js,
              jss,
              k,
              l,
              left,
              len,
              len1,
              len2,
              len3,
              menu,
              menus,
              ref10,
              ref11,
              ref12,
              ref13,
              ref14,
              ref15,
              ref16,
              ref17,
              ref18,
              ref19,
              ref3,
              ref4,
              ref5,
              ref6,
              ref7,
              ref8,
              ref9,
              top;
            if (
              e.message.includes("~tranquil-browser-position~") &&
              _this.rememberOn
            ) {
              data = e.message.replace("~tranquil-browser-position~", "");
              indx = data.indexOf(",");
              top = data.substr(0, indx);
              left = data.substr(indx + 1);
              _this.curPos = {
                top: top,
                left: left,
              };
              _this.href = _this.url.val();
            }
            if (
              e.message.includes("~tranquil-browser-jquery~") ||
              e.message.includes("~tranquil-browser-menu~")
            ) {
              if (e.message.includes("~tranquil-browser-jquery~")) {
                if ((base2 = _this.model.tranquilBrowser).jQueryJS == null) {
                  base2.jQueryJS = TranquilBrowserView.getJQuery.call(_this);
                }
                if ((ref3 = _this.htmlv[0]) != null) {
                  // ref3.executeJavaScript(_this.model.tranquilBrowser.jQueryJS);
                }
              }
              if (_this.rememberOn) {
                if (_this.model.hashurl) {
                  _this.model.url = _this.model.hashurl;
                  _this.model.hashurl = void 0;
                  _this.url.val(_this.model.url);
                  if ((ref4 = _this.htmlv[0]) != null) {
                    ref4.executeJavaScript(
                      "location.href = '" + _this.model.url + "'"
                    );
                  }
                }
                if (_this.rememberOn && _this.model.url === _this.href) {
                  if ((ref5 = _this.htmlv[0]) != null) {
                    // ref5.executeJavaScript(
                    //   'jQuery(window).scrollTop(' +
                    //     _this.curPos.top +
                    //     ');\njQuery(window).scrollLeft(' +
                    //     _this.curPos.left +
                    //     ');'
                    // );
                  }
                }
              }
              if ((base3 = _this.model.tranquilBrowser).jStorageJS == null) {
                base3.jStorageJS = TranquilBrowserView.getJStorage.call(_this);
              }
              if ((ref6 = _this.htmlv[0]) != null) {
                // ref6.executeJavaScript(_this.model.tranquilBrowser.jStorageJS);
              }
              if ((base4 = _this.model.tranquilBrowser).watchjs == null) {
                base4.watchjs = TranquilBrowserView.getWatchjs.call(_this);
              }
              if ((ref7 = _this.htmlv[0]) != null) {
                // ref7.executeJavaScript(_this.model.tranquilBrowser.watchjs);
              }
              if ((base5 = _this.model.tranquilBrowser).hotKeys == null) {
                base5.hotKeys = TranquilBrowserView.getHotKeys.call(_this);
              }
              if ((ref8 = _this.htmlv[0]) != null) {
                // ref8.executeJavaScript(_this.model.tranquilBrowser.hotKeys);
              }
              if ((base6 = _this.model.tranquilBrowser).notifyBar == null) {
                base6.notifyBar = TranquilBrowserView.getNotifyBar.call(_this);
              }
              if ((ref9 = _this.htmlv[0]) != null) {
                // ref9.executeJavaScript(_this.model.tranquilBrowser.notifyBar);
              }
              if (
                (inits =
                  (ref10 = _this.model.tranquilBrowser.plugins) != null
                    ? ref10.onInit
                    : void 0)
              ) {
                for (i = 0, len = inits.length; i < len; i++) {
                  init = inits[i];
                  if ((ref11 = _this.htmlv[0]) != null) {
                    ref11.executeJavaScript(init);
                  }
                }
              }
              if (
                (jss =
                  (ref12 = _this.model.tranquilBrowser.plugins) != null
                    ? ref12.jss
                    : void 0)
              ) {
                for (j = 0, len1 = jss.length; j < len1; j++) {
                  js = jss[j];
                  if ((ref13 = _this.htmlv[0]) != null) {
                    // ref13.executeJavaScript(TranquilBrowserView.loadJS.call(_this, js, true));
                  }
                }
              }
              if (
                (csss =
                  (ref14 = _this.model.tranquilBrowser.plugins) != null
                    ? ref14.csss
                    : void 0)
              ) {
                for (k = 0, len2 = csss.length; k < len2; k++) {
                  css = csss[k];
                  if ((ref15 = _this.htmlv[0]) != null) {
                    // ref15.executeJavaScript(TranquilBrowserView.loadCSS.call(_this, css, true));
                  }
                }
              }
              if (
                (menus =
                  (ref16 = _this.model.tranquilBrowser.plugins) != null
                    ? ref16.menus
                    : void 0)
              ) {
                for (l = 0, len3 = menus.length; l < len3; l++) {
                  menu = menus[l];
                  if (menu.fn) {
                    menu.fn = menu.fn.toString();
                  }
                  if (menu.selectorFilter) {
                    menu.selectorFilter = menu.selectorFilter.toString();
                  }
                  if ((ref17 = _this.htmlv[0]) != null) {
                    ref17.executeJavaScript(
                      "tranquilBrowser.menu(" + JSON.stringify(menu) + ")"
                    );
                  }
                }
              }

              // if ((ref18 = _this.htmlv[0]) != null) {
              //   console.log(_this, _this.htmlv);
              //   try {

              //     ref18.executeJavaScript(TranquilBrowserView.loadCSS.call(_this, '/bp-style.css'));
              //   } catch (e) {
              //     console.log(e)
              //   }
              // }
              // return (ref19 = _this.htmlv[0]) != null
              //   ? ref19.executeJavaScript(TranquilBrowserView.loadCSS.call(_this, '/jquery.notifyBar.css'))
              //   : void 0;
            }
          };
        })(this)
      );
    }
    if ((ref3 = this.htmlv[0]) != null) {
      ref3.addEventListener(
        "page-favicon-updated",
        (function (_this) {
          return function (e) {
            var _, fav, favIcon, favr, style, uri;
            _ = require("lodash");
            favr = window.bp.js.get("bp.fav");
            if (
              (fav = _.find(favr, {
                url: _this.model.url,
              }))
            ) {
              fav.favIcon = e.favicons[0];
              window.bp.js.set("bp.fav", favr);
            }
            _this.model.iconName = Math.floor(Math.random() * 10000).toString();
            _this.model.favIcon = e.favicons[0];
            _this.model.updateIcon(e.favicons[0]);
            favIcon = window.bp.js.get("bp.favIcon");
            uri = _this.htmlv[0].getURL();
            if (!uri) {
              return;
            }
            favIcon[uri] = e.favicons[0];
            window.bp.js.set("bp.favIcon", favIcon);
            _this.model.updateIcon();
            style = document.createElement("style");
            style.type = "text/css";
            style.innerHTML =
              ".title.icon.icon-" +
              _this.model.iconName +
              " {\n  background-size: 16px 16px;\n  background-repeat: no-repeat;\n  padding-left: 20px;\n  background-image: url('" +
              e.favicons[0] +
              "');\n  background-position-y: 50%;\n}";
            return document.getElementsByTagName("head")[0].appendChild(style);
          };
        })(this)
      );
    }
    if ((ref4 = this.htmlv[0]) != null) {
      ref4.addEventListener(
        "did-navigate-in-page",
        (function (_this) {
          return function (evt) {
            if (evt.isMainFrame) return _this.updatePageUrl(evt);
          };
        })(this)
      );
    }
    if ((ref5 = this.htmlv[0]) != null) {
      ref5.addEventListener(
        "did-navigate",
        (function (_this) {
          return function (evt) {
            return _this.updatePageUrl(evt);
          };
        })(this)
      );
    }
    if ((ref6 = this.htmlv[0]) != null) {
      ref6.addEventListener(
        "page-title-set",
        (function (_this) {
          return function (e) {
            var _, fav, favr, title, uri;
            _ = require("lodash");
            favr = window.bp.js.get("bp.fav");
            title = window.bp.js.get("bp.title");
            uri = _this.htmlv[0].getURL();
            if (!uri) {
              return;
            }
            title[uri] = e.title;
            window.bp.js.set("bp.title", title);
            if (
              (fav = _.find(favr, {
                url: _this.model.url,
              }))
            ) {
              fav.title = e.title;
              window.bp.js.set("bp.fav", favr);
            }
            return _this.model.setTitle(e.title);
          };
        })(this)
      );
    }
    this.devtool.on(
      "click",
      (function (_this) {
        return function (evt) {
          return _this.toggleDevTool();
        };
      })(this)
    );
    this.spinner.on(
      "click",
      (function (_this) {
        return function (evt) {
          var ref7;
          return (ref7 = _this.htmlv[0]) != null ? ref7.stop() : void 0;
        };
      })(this)
    );
    this.remember.on(
      "click",
      (function (_this) {
        return function (evt) {
          _this.rememberOn = !_this.rememberOn;
          return _this.remember.toggleClass("active", _this.rememberOn);
        };
      })(this)
    );
    this.print.on(
      "click",
      (function (_this) {
        return function (evt) {
          var ref7;
          return (ref7 = _this.htmlv[0]) != null ? ref7.print() : void 0;
        };
      })(this)
    );
    this.newTab.on(
      "click",
      (function (_this) {
        return function (evt) {
          atom.workspace.open("tranquil-browser://blank");
          return _this.spinner.removeClass("fa-custom");
        };
      })(this)
    );
    this.history.on(
      "click",
      (function (_this) {
        return function (evt) {
          return atom.workspace.open("tranquil-browser://history", {
            split: "left",
            searchAllPanes: true,
          });
        };
      })(this)
    );
    this.live.on(
      "click",
      (function (_this) {
        return function (evt) {
          _this.liveOn = !_this.liveOn;
          _this.live.toggleClass("active", _this.liveOn);
          if (_this.liveOn) {
            _this.refreshPage();
            _this.liveSubscription = new CompositeDisposable();
            _this.liveSubscription.add(
              atom.workspace.observeTextEditors(function (editor) {
                return _this.liveSubscription.add(
                  editor.onDidSave(function () {
                    var timeout;
                    timeout = atom.config.get("tranquil-browser.live");
                    return setTimeout(function () {
                      return _this.refreshPage();
                    }, timeout);
                  })
                );
              })
            );
            return _this.model.onDidDestroy(function () {
              return _this.liveSubscription.dispose();
            });
          } else {
            return _this.liveSubscription.dispose();
          }
        };
      })(this)
    );
    this.fav.on(
      "click",
      (function (_this) {
        return function (event) {
          //   var data, delCount, favs;
          //   favs = window.bp.js.get('bp.fav');
          //   if (_this.fav.hasClass('active')) {
          //     _this.removeFav(_this.model);
          //   } else {
          //     if (_this.model.orgURI) {
          //       return;
          //     }
          //     data = {
          //       url: _this.model.url,
          //       title: _this.model.title || _this.model.url,
          //       favIcon: _this.model.favIcon,
          //     };
          //     favs.push(data);
          //     delCount = favs.length - atom.config.get('tranquil-browser.fav');
          //     if (delCount > 0) {
          //       favs.splice(0, delCount);
          //     }
          //     window.bp.js.set('bp.fav', favs);
          //   }
          //   return _this.fav.toggleClass('active');
          // };
          // console.log({ hehe2: TranquilBrowser.model?.getURI() });
          const target =
            event.target.tagName === "LI"
              ? event.target
              : event.target.parentElement;
          if (target && target.item) {
            TranquilBrowser.addToTreeView(target.item.url);
          } else {
            const url = TranquilBrowser.model?.getURL();
            if (url) {
              TranquilBrowser.addToTreeView(url);
            }
          }
        };
      })(this)
    );
    if ((ref7 = this.htmlv[0]) != null) {
      ref7.addEventListener("new-window", async function (e) {
        console.log("new window triggered ", e.url);
        return atom.workspace.open(e.url, {
          split: "left",
          searchAllPanes: true,
          openInSameWindow: false,
        });
      });
    }
    if ((ref8 = this.htmlv[0]) != null) {
      ref8.addEventListener(
        "did-start-loading",
        (function (_this) {
          return function () {
            var ref9;
            _this.spinner.removeClass("fa-custom");
            return (ref9 = _this.htmlv[0]) != null
              ? (ref9.shadowRoot.firstChild.style.height = "95%")
              : void 0;
          };
        })(this)
      );
    }
    if ((ref9 = this.htmlv[0]) != null) {
      ref9.addEventListener(
        "did-stop-loading",
        (function (_this) {
          return function () {
            (async () => {
              _this?.htmlv[0]?.executeJavaScript(
                `sessionStorage.setItem("modelId", "${_this.model.id}");`
              );
            })();
            return _this.spinner.addClass("fa-custom");
          };
        })(this)
      );
    }
    this.back.on(
      "click",
      (function (_this) {
        return function (evt) {
          var ref10, ref11;
          if (
            ((ref10 = _this.htmlv[0]) != null ? ref10.canGoBack() : void 0) &&
            $(this).hasClass("active")
          ) {
            return (ref11 = _this.htmlv[0]) != null ? ref11.goBack() : void 0;
          }
        };
      })(this)
    );
    // this.favList.on(
    //   'click',
    //   (function (_this) {
    //     return function (evt) {
    //       var favList;
    //       favList = require('./fav-view');
    //       return new favList(window.bp.js.get('bp.fav'));
    //     };
    //   })(this)
    // );
    this.forward.on(
      "click",
      (function (_this) {
        return function (evt) {
          var ref10, ref11;
          if (
            ((ref10 = _this.htmlv[0]) != null
              ? ref10.canGoForward()
              : void 0) &&
            $(this).hasClass("active")
          ) {
            return (ref11 = _this.htmlv[0]) != null
              ? ref11.goForward()
              : void 0;
          }
        };
      })(this)
    );
    this.url.on(
      "click",
      (function (_this) {
        return function (evt) {
          return _this.url.select();
        };
      })(this)
    );
    this.url.on(
      "keypress",
      (function (_this) {
        return function (evt) {
          var URL, localhostPattern, ref10, url, urls;
          URL = require("url");
          if (evt.which === 13) {
            _this.url.blur();
            urls = URL.parse(this.value.trim());
            url = this.value.trim();
            if (!url.startsWith("tranquil-browser://")) {
              if (url.indexOf(" ") >= 0) {
                url = "https://duckduckgo.com/?q=" + url;
              } else {
                localhostPattern = /^(http:\/\/)?localhost/i;
                if (url.search(localhostPattern) < 0 && url.indexOf(".") < 0) {
                  url = "https://duckduckgo.com/?q=" + url;
                } else {
                  if (
                    (ref10 = urls.protocol) === "http" ||
                    ref10 === "https" ||
                    ref10 === "file:"
                  ) {
                    if (urls.protocol === "file:") {
                      url = url.replace(/\\/g, "/");
                    } else {
                      url = URL.format(urls);
                    }
                  } else {
                    urls.protocol = "http";
                    url = URL.format(urls);
                  }
                }
              }
            }
            return _this.goToUrl(url);
          }
        };
      })(this)
    );
    return this.refresh.on(
      "click",
      (function (_this) {
        return function (evt) {
          return _this.refreshPage();
        };
      })(this)
    );
  };

  TranquilBrowserView.prototype.updatePageUrl = function (evt) {
    const TranquilBrowserModel = require("./tranquil-browser-model");
    const url = evt.url;
    addUrlChangeInstanceEvent(this, url);
    if (!TranquilBrowserModel.checkUrl(url)) {
      const homepage =
        atom.config.get("tranquil-browser.homepage") ||
        "https://duckduckgo.com";
      atom.notifications.addSuccess("Redirecting to " + homepage);
      this.htmlv[0]?.executeJavaScript("location.href = '" + homepage + "'");
      return;
    }

    if (
      url &&
      url !== this.model.url &&
      !this.url.val()?.startsWith("tranquil-browser://")
    ) {
      this.url.val(url);
      this.model.url = url;
    }

    const title = this.htmlv[0]?.getTitle() || url;
    if (title !== this.model.getTitle()) {
      this.model.setTitle(title);
    }

    this.live.toggleClass("active", this.liveOn);
    if (!this.liveOn && this.liveSubscription) {
      this.liveSubscription.dispose();
    }

    this.checkNav();
    this.checkFav();
    return this.addHistory();
  };

  TranquilBrowserView.prototype.refreshPage = function (url, ignorecache) {
    try {
      if (this.rememberOn && this.htmlv[0]) {
        // this.htmlv[0].executeJavaScript('var left, top;\ncurTop = jQuery(window).scrollTop();\ncurLeft = jQuery(window).scrollLeft();\nconsole.log(`~tranquil-browser-position~${curTop},${curLeft}`);');
      }
      if (this.model.orgURI && atom.packages.getActivePackage("pp")) {
        return atom.packages
          .getActivePackage("pp")
          .mainModule.compilePath(this.model.orgURI, this.model._id);
      } else {
        if (url) {
          this.model.url = url;
          this.url.val(url);
          if (this.htmlv[0]) {
            this.htmlv[0].src = url;
          }
        } else {
          if (this.ultraLiveOn && this.model.src && this.htmlv[0]) {
            this.htmlv[0].src = this.model.src;
          }

          if (ignorecache) {
            if (this.htmlv[0]) {
              this.htmlv[0].reloadIgnoringCache();
            }
          } else {
            try {
              if (this.htmlv[0]) {
                this.htmlv[0].reload();
              }
            } catch (e) {
              console.log(e);
            }
          }
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  TranquilBrowserView.prototype.goToUrl = function (url) {
    var TranquilBrowserModel, base1, base2, ref1;
    TranquilBrowserModel = require("./tranquil-browser-model");
    addUrlChangeInstanceEvent(this, url);
    if (!TranquilBrowserModel.checkUrl(url)) {
      return;
    }
    if (typeof (base1 = jQ(this.url)).autocomplete === "function") {
      base1.autocomplete("close");
    }
    this.liveOn = false;
    this.live.toggleClass("active", this.liveOn);
    if (!this.liveOn) {
      if ((ref1 = this.liveSubscription) != null) {
        ref1.dispose();
      }
    }
    this.url.val(url);
    this.model.url = url;
    delete this.model.title;
    delete this.model.iconName;
    delete this.model.favIcon;
    this.model.setTitle(null);
    this.model.updateIcon(null);
    if (url.startsWith("tranquil-browser://")) {
      url =
        typeof (base2 = this.model.tranquilBrowser).getTranquilBrowserUrl ===
        "function"
          ? base2.getTranquilBrowserUrl(url)
          : void 0;
    }
    return this.htmlv.attr("src", url);
  };

  TranquilBrowserView.prototype.keyHandler = function (evt) {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    switch (evt.key) {
      case "F12":
        return this.toggleDevTool();
      case "F5":
        if (evt.ctrlKey || (isMac && evt.metaKey)) {
          return this.refreshPage(void 0, true);
        } else {
          return this.refreshPage();
        }
        break;
      case "F10":
        return this.toggleURLBar();
      case "t":
        if (evt.ctrlKey || (isMac && evt.metaKey)) {
          return TranquilBrowser.open();
        }
        break;
      case "l":
        if (evt.ctrlKey || (isMac && evt.metaKey)) {
          this?.urlbar[0]?.querySelector("#url")?.focus();
          return this?.urlbar[0]?.querySelector("#url")?.select();
        }
        break;
      case "p":
        if (evt.ctrlKey || (isMac && evt.metaKey)) {
          try {
            return this?.htmlv[0]?.print();
          } catch (e) {
            console.log(e);
          }
        }
        break;
      case "d":
        if (evt.altKey) {
          this?.urlbar[0]?.querySelector("#url")?.focus();
          return this?.urlbar[0]?.querySelector("#url")?.select();
        }
        break;
      case "ArrowLeft":
        if (evt.altKey) {
          return this.goBack();
        }
        break;
      case "ArrowRight":
        if (evt.altKey) {
          return this.goForward();
        }
        break;
      case "+":
        if (evt.ctrlKey || (isMac && evt.metaKey)) {
          const webView = this?.htmlv?.[0];
          if (webView) {
            return webView.setZoomFactor(webView.getZoomFactor() + 0.1);
          }
        }
        break;
      case "-":
        if (evt.ctrlKey || (isMac && evt.metaKey)) {
          const webView = this?.htmlv?.[0];
          if (webView) {
            return webView.setZoomFactor(webView.getZoomFactor() - 0.1);
          }
        }
        break;
      case "f":
        if (evt.ctrlKey || (isMac && evt.metaKey)) {
          const webView = this?.htmlv?.[0];
          if (webView) {
            webView.send("close-find", {});
            webView.send("on-find", {});
            return;
          }
        }
    }
  };

  TranquilBrowserView.prototype.removeFav = function (favorite) {
    var favr, favrs, i, idx, len;
    favrs = window.bp.js.get("bp.fav");
    for (idx = i = 0, len = favrs.length; i < len; idx = ++i) {
      favr = favrs[idx];
      if (favr.url === favorite.url) {
        favrs.splice(idx, 1);
        window.bp.js.set("bp.fav", favrs);
        return;
      }
    }
  };

  TranquilBrowserView.prototype.setSrc = function (text) {
    var ref1, url;
    url = this.model.orgURI || this.model.url;
    text = TranquilBrowserView.checkBase(text, url);
    this.model.src = "data:text/html," + text;
    return (ref1 = this.htmlv[0]) != null
      ? (ref1.src = this.model.src)
      : void 0;
  };

  TranquilBrowserView.checkBase = function (text, url) {
    var $html, base, basePath, cheerio;
    cheerio = require("cheerio");
    $html = cheerio.load(text);
    basePath = path.dirname(url) + "/";
    if ($html("base").length) {
      return text;
    } else {
      if ($html("head").length) {
        base = "<base href='" + basePath + "' target='_blank'>";
        $html("head").prepend(base);
      } else {
        base = "<head><base href='" + basePath + "' target='_blank'></head>";
        $html("html").prepend(base);
      }
      return $html.html();
    }
  };

  TranquilBrowserView.prototype.checkFav = function () {
    var favr, favrs, i, len, results;
    this.fav.removeClass("active");
    favrs = window.bp.js.get("bp.fav");
    results = [];
    for (i = 0, len = favrs.length; i < len; i++) {
      favr = favrs[i];
      if (favr.url === this.model.url) {
        results.push(this.fav.addClass("active"));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  TranquilBrowserView.prototype.toggleDevTool = function () {
    var open, ref1, ref2, ref3;
    open = (ref1 = this.htmlv[0]) != null ? ref1.isDevToolsOpened() : void 0;
    if (open) {
      if ((ref2 = this.htmlv[0]) != null) {
        ref2.closeDevTools();
      }
    } else {
      if ((ref3 = this.htmlv[0]) != null) {
        ref3.openDevTools();
      }
    }
    return $(this.devtool).toggleClass("active", !open);
  };

  TranquilBrowserView.prototype.checkNav = function () {
    var ref1, ref2, ref3;
    $(this.forward).toggleClass(
      "active",
      (ref1 = this.htmlv[0]) != null ? ref1.canGoForward() : void 0
    );
    $(this.back).toggleClass(
      "active",
      (ref2 = this.htmlv[0]) != null ? ref2.canGoBack() : void 0
    );
    if ((ref3 = this.htmlv[0]) != null ? ref3.canGoForward() : void 0) {
      if (this.clearForward) {
        $(this.forward).toggleClass("active", false);
        return (this.clearForward = false);
      } else {
        return $(this.forward).toggleClass("active", true);
      }
    }
  };

  TranquilBrowserView.prototype.goBack = function () {
    return this.back.click();
  };

  TranquilBrowserView.prototype.goForward = function () {
    return this.forward.click();
  };

  TranquilBrowserView.prototype.addHistory = function () {
    var histToday, history, historyURL, obj, today, todayObj, url, yyyymmdd;
    url = this.htmlv[0].getURL().replace(/\\/g, "/");
    if (!url) {
      return;
    }
    historyURL = (
      "file://" +
      this.model.tranquilBrowser.resources +
      "/history.html"
    ).replace(/\\/g, "/");
    if (
      url.startsWith("tranquil-browser://") ||
      url.startsWith("data:text/html,") ||
      url.startsWith(historyURL)
    ) {
      return;
    }
    yyyymmdd = function () {
      var date, dd, mm, yyyy;
      date = new Date();
      yyyy = date.getFullYear().toString();
      mm = (date.getMonth() + 1).toString();
      dd = date.getDate().toString();
      return yyyy + (mm[1] ? mm : "0" + mm[0]) + (dd[1] ? dd : "0" + dd[0]);
    };
    today = yyyymmdd();
    history = window.bp.js.get("bp.history") || [];
    todayObj = history.find(function (ele, idx, arr) {
      if (ele[today]) {
        return true;
      }
    });
    if (!todayObj) {
      obj = {};
      histToday = [];
      obj[today] = histToday;
      history.unshift(obj);
    } else {
      histToday = todayObj[today];
    }
    histToday.unshift({
      date: new Date().toString(),
      uri: url,
    });
    return window.bp.js.set("bp.history", history);
  };

  TranquilBrowserView.prototype.getTitle = function () {
    return this;
  };

  TranquilBrowserView.prototype.getUrl = function () {
    return this.model.url();
  };

  TranquilBrowserView.prototype.serialize = function () {};

  TranquilBrowserView.prototype.destroy = function () {
    var base1;
    if (typeof (base1 = jQ(this.url)).autocomplete === "function") {
      base1.autocomplete("destroy");
    }
    return this.subscriptions.dispose();
  };

  TranquilBrowserView.getJQuery = function () {
    return fs.readFileSync(
      this.model.tranquilBrowser.resources + "/jquery-2.1.4.min.js",
      "utf-8"
    );
  };

  TranquilBrowserView.getEval = function () {
    return fs.readFileSync(
      this.model.tranquilBrowser.resources + "/eval.js",
      "utf-8"
    );
  };

  TranquilBrowserView.getJStorage = function () {
    return fs.readFileSync(
      this.model.tranquilBrowser.resources + "/jstorage.min.js",
      "utf-8"
    );
  };

  TranquilBrowserView.getWatchjs = function () {
    return fs.readFileSync(
      this.model.tranquilBrowser.resources + "/watch.js",
      "utf-8"
    );
  };

  TranquilBrowserView.getNotifyBar = function () {
    return fs.readFileSync(
      this.model.tranquilBrowser.resources + "/jquery.notifyBar.js",
      "utf-8"
    );
  };

  TranquilBrowserView.getHotKeys = function () {
    return fs.readFileSync(
      this.model.tranquilBrowser.resources + "/jquery.hotkeys.min.js",
      "utf-8"
    );
  };

  TranquilBrowserView.loadCSS = function (filename, fullpath) {
    var fpath;
    if (fullpath == null) {
      fullpath = false;
    }
    if (!fullpath) {
      fpath =
        "file:///" + this.model.tranquilBrowser.resources.replace(/\\/g, "/");
      filename = "" + fpath + filename;
    }
    return (
      'jQuery(\'head\').append(jQuery(\'<link type="text/css" rel="stylesheet" href="' +
      filename +
      "\">'))"
    );
  };

  TranquilBrowserView.loadJS = function (filename, fullpath) {
    var fpath;
    if (fullpath == null) {
      fullpath = false;
    }
    if (!fullpath) {
      fpath =
        "file:///" + this.model.tranquilBrowser.resources.replace(/\\/g, "/");
      filename = "" + fpath + filename;
    }
    return (
      "jQuery('head').append(jQuery('<script type=\"text/javascript\" src=\"" +
      filename +
      "\">'))"
    );
  };

  return TranquilBrowserView;
})(View);
module.exports = TranquilBrowserView;
