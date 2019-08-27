phina.namespace(() => {

  phina.define("ListView", {
    superClass: "Accessory",

    scrollType: null,

    items: null,

    getViewId: null, // itemから対応するviewのJSONを選別 (item) => json
    bind: null, // itemの情報をviewに反映 (view, item, listView) => void,

    viewJSONs: null,

    scrollBar: null,
    scrollBarHandle: null,
    viewport: null,
    inner: null,

    scroll: 0,
    scrollLock: false,

    init: function(options) {
      this.superInit(options);

      options = ({}).$safe(options, ListView.defaults);

      this.items = [];

      this.getViewId = (item) => null;
      this.bind = (view, item, listView) => {};

      this.itemMarginLeft = options.itemMarginLeft;
      this.itemMarginTop = options.itemMarginTop;

      this.on("attached", () => {
        this.target.one("ready", () => {
          this.setup(options)
        });
        // if (this.target.parent) {
        //   this.setup(options);
        // } else {
        //   this.target.one("added", () => {
        //     this.setup(options);
        //   });
        // }
      });
    },

    setup: function(options) {
      const findLayoutRoot = (element) => {
        if (element.layoutAsset) {
          return element;
        } else if (element.parent) {
          return findLayoutRoot(element.parent);
        } else {
          return null;
        }
      };

      const layoutRoot = findLayoutRoot(this.target);
      const asset = layoutRoot.layoutAsset;

      this.scrollType = options.scrollType;

      this.viewport = this._createViewport(options).addChildTo(this.target);
      this.inner = this._createInner(options, this.viewport).addChildTo(this.viewport);
      this.front = this._createFront(options, this.viewport, this.inner).addChildTo(this.target);
      this._setupScrollBar(options, this.viewport, this.inner);

      this._setupWheelControl(options, this.viewport, this.inner, this.front);
      this._setupTouchControl(options, this.viewport, this.inner, this.front);

      const findById = (id, element) => {
        if (element.id === id) {
          return element;
        } else {
          const children = Object.keys(element.children || {}).map(key => element.children[key]);
          for (let i = 0; i < children.length; i++) {
            const hit = findById(id, children[i]);
            if (hit) return hit;
          }
          return null;
        }
      };
      const viewIds = options.item.split(",").map(_ => _.trim());
      this.viewJSONs = viewIds
        .map(id => findById(id, asset.data.root))
        .reduce((obj, view) => {
          obj[view.id] = view;
          return obj;
        }, {});
      this.getViewId = (item) => viewIds[0];

      // 実体化されたビューを一旦削除する
      viewIds.forEach(id => layoutRoot.ref[id].remove());

      this.scrollBar = layoutRoot.ref[options.scrollBar];
      this.scrollBarHandle = layoutRoot.ref[options.scrollBarHandle];

    },

    _createViewport: function(options) {
      const viewport = DisplayElement();

      viewport.x = options.scrollRect.x;
      viewport.y = options.scrollRect.y;
      viewport.width = options.scrollRect.width;
      viewport.height = options.scrollRect.height;
      viewport.clip = (canvas) => {
        const w = viewport.width;
        const h = viewport.height;

        const ctx = canvas.context;
        ctx.beginPath();
        ctx.moveTo(w * -0.5, h * -0.5);
        ctx.lineTo(w * +0.5, h * -0.5);
        ctx.lineTo(w * +0.5, h * +0.5);
        ctx.lineTo(w * -0.5, h * +0.5);
        ctx.closePath();
      };

      return viewport;
    },

    _createInner: function(options, viewport) {
      if (options.inner) {
        // TODO
      } else {
        const inner = DisplayElement();

        inner.x = -viewport.width * viewport.originX;
        inner.y = -viewport.height * viewport.originY;
        inner.originX = 0;
        inner.originY = 0;

        return inner;
      }
    },

    _createFront: function(options, viewport, inner) {
      const front = DisplayElement();

      front.x = options.scrollRect.x;
      front.y = options.scrollRect.y;
      front.width = options.scrollRect.width;
      front.height = options.scrollRect.height;
      front.interactive = true;

      return front;
    },

    _setupScrollBar: function(options, viewport, inner) {
      this.target.on("enterframe", () => {
        if (!this.scrollBar && !this.scrollBarHandle) return;

        if (this.scrollType !== "horizontal") {
          const top = viewport.height * -viewport.originY;
          const bottom = viewport.height * (1 - viewport.originY);
          const scrollMin = top;
          const scrollMax = bottom - inner.height;
          const scrollValue = Math.clamp((inner.top - scrollMin) / (scrollMax - scrollMin), 0, 1);

          const yMin = this.scrollBar.height * -this.scrollBar.originY + this.scrollBarHandle.height * this.scrollBarHandle.originY + this.scrollBar.y;
          const yMax = this.scrollBar.height * (1 - this.scrollBar.originY) - this.scrollBarHandle.height * (1 - this.scrollBarHandle.originY) + this.scrollBar.y;
          if (inner.height <= viewport.height) {
            this.scrollBarHandle.y = yMin;
          } else {
            this.scrollBarHandle.y = yMin + (yMax - yMin) * scrollValue;
          }
        } else {
          const left = viewport.width * -viewport.originY;
          const right = viewport.height * (1 - viewport.originY);
          const scrollMin = left;
          const scrollMax = right - inner.height;
          const scrollValue = Math.clamp((inner.left - scrollMin) / (scrollMax - scrollMin), 0, 1);

          const yMin = this.scrollBar.height * -this.scrollBar.originY + this.scrollBarHandle.height * this.scrollBarHandle.originY + this.scrollBar.y;
          const yMax = this.scrollBar.height * (1 - this.scrollBar.originY) - this.scrollBarHandle.height * (1 - this.scrollBarHandle.originY) + this.scrollBar.y;
          if (inner.height <= viewport.height) {
            this.scrollBarHandle.y = yMin;
          } else {
            this.scrollBarHandle.y = yMin + (yMax - yMin) * scrollValue;
          }
        }
      });
    },

    _setupWheelControl: function(options, viewport, inner, front) {
      if (this.scrollType !== "horizontal") {
        this.target.on("enterframe", (e) => {
          if (inner.height <= viewport.height) return;
          if (this.scrollLock) return;

          const p = e.app.pointer;
          const delta = p.wheelDeltaY;
          if (delta && front.hitTest(p.x, p.y)) {
            this.scroll += delta / inner.height * 0.8;
          }
        });
      } else {
        this.target.on("enterframe", (e) => {
          if (inner.width <= viewport.width) return;
          if (this.scrollLock) return;

          const p = e.app.pointer;
          const delta = p.wheelDeltaY;
          if (delta && front.hitTest(p.x, p.y)) {
            this.scroll += delta / inner.width * 0.8;
          }
        });
      }
    },

    _setupTouchControl: function(options, viewport, inner, front) {
      const tweener = Tweener().attachTo(inner);
      const velocity = Vector2(0, 0);

      let dragging = false;
      front.on('pointstart', (e) => {
        e.pass = true;

        if (inner.height <= viewport.height) return;

        dragging = true;
        velocity.set(0, 0);
        tweener.stop();
      });
      front.on('pointstay', (e) => {
        if (!dragging) return;
        velocity.set(e.pointer.dx, e.pointer.dy);

        if (this.scrollType !== "horizontal") {
          const top = -viewport.height * viewport.originY;
          const bottom = viewport.height * (1 - viewport.originY);
          let overdistance = 0;
          if (top < inner.top) {
            overdistance = top - inner.top;
          } else if (inner.top < bottom - inner.height) {
            overdistance = inner.top - (bottom - inner.height);
          }
          velocity.mul(1.0 - Math.abs(overdistance) / 200);
        } else {
          const left = -viewport.width * viewport.originY;
          const right = viewport.width * (1 - viewport.originY);
          let overdistance = 0;
          if (left < inner.left) {
            overdistance = left - inner.left;
          } else if (inner.left < right - inner.width) {
            overdistance = inner.left - (right - inner.width);
          }
          velocity.mul(1.0 - Math.abs(overdistance) / 200);
        }
      });
      front.on('pointend', (e) => {
        e.pass = true;
        e.velocity = velocity;
        dragging = false;
      });

      this.on("viewstop", (e) => {
        velocity.set(0, 0);
      });

      this.target.on("enterframe", (e) => {
        if (this.scrollType !== "horizontal") {
          if (inner.height <= viewport.height) return;
          inner.top += velocity.y;
        } else {
          if (inner.width <= viewport.width) return;
          inner.left += velocity.x;
        }

        if (dragging) return;

        if (!tweener.playing) {
          velocity.mul(0.9);
          if (Math.abs(velocity.x) < 0.1 && Math.abs(velocity.y) < 0.1) {
            velocity.set(0, 0);
          }

          if (this.scrollType !== "horizontal") {
            const top = -viewport.height * viewport.originY;
            const bottom = viewport.height * (1 - viewport.originY);
            if (top < inner.top) {
              velocity.set(0, 0);
              tweener.clear().to({
                y: top
              }, 100, "easeInQuad");
            } else if (inner.top < bottom - inner.height) {
              velocity.set(0, 0);
              tweener.clear().to({
                y: bottom - inner.height
              }, 100, "easeInQuad");
            } else {
              tweener.stop();
            }
          } else {
            const left = -viewport.height * viewport.originY;
            const right = viewport.height * (1 - viewport.originY);
            if (left < inner.left) {
              velocity.set(0, 0);
              tweener.clear().to({
                y: left
              }, 100, "easeInQuad");
            } else if (inner.left < right - inner.height) {
              velocity.set(0, 0);
              tweener.clear().to({
                y: right - inner.height
              }, 100, "easeInQuad");
            } else {
              tweener.stop();
            }
          }
        }
      });
    },

    createView: function(item) {
      const viewJSON = this.viewJSONs[this.getViewId(item)];
      // console.log(viewJSON);
      this.inner.fromJSON({
        children: [viewJSON],
      });
      const view = this.inner.children.last;
      return view;
    },

    addItem: function(item) {
      this.items.push(item);
      return this;
    },

    addItems: function(items) {
      Array.prototype.push.apply(this.items, items);
      return this;
    },

    removeItem: function(item) {
      this.items.erase(item);
      return this;
    },

    clearItem: function() {
      this.items.clear();
      this.scroll = 0;
      this.flare('viewstop');
      return this;
    },

    invalidate: function() {
      this.inner.children.clone().forEach((child) => child.remove());

      let y = 0;
      let x = 0;

      this.inner.height = 1;

      this.items.forEach((item, index) => {
        const view = this.createView(item);
        view._listView = this;
        this.bind(view, item, this);

        if (this.scrollType !== "horizontal") {
          view.left = x + this.itemMarginLeft;
          view.top = y + this.itemMarginTop;

          if ((view.right + view.width + this.itemMarginLeft) < this.viewport.width) {
            x = view.right;
          } else {
            x = 0;
            y = view.bottom;
          }

          this.inner.height = Math.max(this.viewport.height, view.top + view.height + this.itemMarginTop);
        } else {
          // TODO
        }
      });

      //お試し実装
      if (this.updateFunc) this.target.off("enterframe", this.updateFunc);

      if (!this.updateFunc) {
        this.updateFunc = () => {
          let y = 0;
          let x = 0;
          this.inner.children.forEach((child, i) => {
            if (this.scrollType !== "horizontal") {
              child.left = x + this.itemMarginLeft;
              child.top = y + this.itemMarginTop;

              if ((child.right + child.width + this.itemMarginLeft) < this.viewport.width) {
                x = child.right;
              } else {
                x = 0;
                y = child.bottom;
              }

              this.inner.height = Math.max(this.viewport.height, child.top + child.height + this.itemMarginTop);
            } else {
              // TODO
            }
          });
        };
      }

      //enterframeではなくてwatchでheightみてもいいかな
      this.target.on("enterframe", this.updateFunc);
    },

    // return 0.0～1.0
    getScroll: function() {
      const viewport = this.viewport;
      const inner = this.inner;

      if (this.scrollType !== "horizontal") {
        const top = viewport.height * -viewport.originY;
        const bottom = viewport.height * (1 - viewport.originY);
        const min = top;
        const max = bottom - inner.height;

        return (inner.top - min) / (max - min);
      } else {
        // TOOD
        return 0;
      }
    },

    // v: 0.0～1.0
    setScroll: function(v) {
      v = Math.clamp(v, 0, 1);

      const viewport = this.viewport;
      const inner = this.inner;

      if (this.scrollType !== "horizontal") {
        if (inner.height <= viewport.height) return;

        const top = viewport.height * -viewport.originY;
        const bottom = viewport.height * (1 - viewport.originY);
        const min = top;
        const max = bottom - inner.height;

        inner.top = min + (max - min) * v;
      } else {
        // TOOD
      }

      return this;
    },

    _accessor: {
      elements: {
        get: function() {
          return this.inner.children;
        },
      },
      scroll: {
        get: function() {
          return this.getScroll();
        },
        set: function(v) {
          this.setScroll(v);
        },
      },
    },

    _static: {
      defaults: {
        scrollType: "vertical",
        itemMarginLeft: 0,
        itemMarginTop: 0,
      },
    },

  });

});
