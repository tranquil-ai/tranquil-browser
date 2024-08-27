const { View, SelectListView } = require('atom-space-pen-views');
const $ = require('jquery');

class FavView extends SelectListView {
  initialize(items) {
    super.initialize();
    this.items = items;
    this.addClass('overlay from-top');
    this.setItems(this.items);
    if (!this.panel) {
      this.panel = atom.workspace.addModalPanel({ item: this });
    }
    this.panel.show();
    this.focusFilterEditor();
  }

  viewForItem(item) {
    if (!item.favIcon) {
      item.favIcon = window.bp.js.get('bp.favIcon')[item.url];
    }
    return `<li><img src='${
      item.favIcon
    }' width='20' height='20'>    ${item.title.slice(0, 31)}</li>`;
  }

  confirmed(item) {
    atom.workspace.open(item.url, { split: 'left', searchAllPanes: true });
    this.parent().remove();
  }

  cancelled() {
    this.parent().remove();
  }

  getFilterKey() {
    return 'title';
  }
}

module.exports = FavView;
