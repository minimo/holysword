/*
 *  main.js
 */

phina.globalize();

const SCREEN_WIDTH = 576;
const SCREEN_HEIGHT = 324;
const SCREEN_WIDTH_HALF = SCREEN_WIDTH * 0.5;
const SCREEN_HEIGHT_HALF = SCREEN_HEIGHT * 0.5;

const SCREEN_OFFSET_X = 0;
const SCREEN_OFFSET_Y = 0;

let phina_app;

window.onload = function() {
  phina_app = Application();
  phina_app.replaceScene(FirstSceneFlow({}));
  phina_app.run();
};

//スクロール禁止
// document.addEventListener('touchmove', function(e) {
//  e.preventDefault();
// }, { passive: false });

//Androidブラウザバックボタン制御
// document.addEventListener("backbutton", function(e){
//   e.preventDefault();
// }, false);
phina.namespace(function() {

  phina.define("Application", {
    superClass: "phina.display.CanvasApp",

    quality: 1.0,
  
    init: function() {
      this.superInit({
        fps: 60,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        fit: true,
      });
  
      //シーンの幅、高さの基本を設定
      phina.display.DisplayScene.defaults.$extend({
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
      });
  
      phina.input.Input.quality = this.quality;
      phina.display.DisplayScene.quality = this.quality;

      //ゲームパッド管理
      this.gamepadManager = phina.input.GamepadManager();
      this.gamepad = this.gamepadManager.get(0);
      this.controller = {};

      this.setupEvents();
      this.setupSound();
      this.setupMouseWheel();

      this.on("changescene", () => {
        //シーンを離れる際、ボタン同時押しフラグを解除する
        Button.actionTarget = null;
      });

      //パッド情報を更新
      this.on('enterframe', function() {
        this.gamepadManager.update();
        this.updateController();
      });
    },
  
    //マウスのホールイベント関連
    setupMouseWheel: function() {
      this.wheelDeltaY = 0;
      this.domElement.addEventListener("mousewheel", function(e) {
        e.stopPropagation();
        e.preventDefault();
        this.wheelDeltaY = e.deltaY;
      }.bind(this), false);
  
      this.on("enterframe", function() {
        this.pointer.wheelDeltaY = this.wheelDeltaY;
        this.wheelDeltaY = 0;
      });
    },

    //アプリケーション全体のイベントフック
    setupEvents: function() {},
  
    setupSound: function() {},

    updateController: function() {
      var before = this.controller;
      before.before = null;

      var gp = this.gamepad;
      var kb = this.keyboard;
      var angle1 = gp.getKeyAngle();
      var angle2 = kb.getKeyAngle();
      this.controller = {
          angle: angle1 !== null? angle1: angle2,

          up: gp.getKey("up") || kb.getKey("up"),
          down: gp.getKey("down") || kb.getKey("down"),
          left: gp.getKey("left") || kb.getKey("left"),
          right: gp.getKey("right") || kb.getKey("right"),

          attack: gp.getKey("X") || kb.getKey("Z"),
          jump:   gp.getKey("up") || gp.getKey("A") || kb.getKey("up") || kb.getKey("X"),
          change: gp.getKey("B") || kb.getKey("C"),
          menu:   gp.getKey("start") || kb.getKey("escape"),

          a: gp.getKey("A") || kb.getKey("Z"),
          b: gp.getKey("B") || kb.getKey("X"),
          x: gp.getKey("X") || kb.getKey("C"),
          y: gp.getKey("Y") || kb.getKey("V"),

          ok: gp.getKey("A") || kb.getKey("Z") || kb.getKey("space") || kb.getKey("return"),
          cancel: gp.getKey("B") || kb.getKey("X") || kb.getKey("escape"),

          start: gp.getKey("start") || kb.getKey("return"),
          select: gp.getKey("select"),

          pause: gp.getKey("start") || kb.getKey("escape"),

          analog1: gp.getStickDirection(0),
          analog2: gp.getStickDirection(1),

          //前フレーム情報
          before: before,
      };
  },
});
  
});
/*
 *  AssetList.js
 */

phina.namespace(function() {

  phina.define("AssetList", {
    _static: {
      loaded: [],
      isLoaded: function(assetType) {
        return AssetList.loaded[assetType]? true: false;
      },
      get: function(assetType) {
        AssetList.loaded[assetType] = true;
        switch (assetType) {
          case "preload":
            return {
              image: {
                "actor": "assets/textures/actor4.png",
              },
            };
            case "common":
            return {
              image: {
              },
            };

          default:
            throw "invalid assetType: " + options.assetType;
        }
      },
    },
  });

});

/*
 *  MainScene.js
 *  2018/10/26
 */

phina.namespace(function() {

  phina.define("BaseScene", {
    superClass: 'DisplayScene',

    //廃棄エレメント
    disposeElements: null,

    init: function(options) {
      options = (options || {}).$safe({
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        backgroundColor: 'transparent',
      });
      this.superInit(options);

      //シーン離脱時canvasメモリ解放
      this.disposeElements = [];
      this.one('destroy', () => {
        this.disposeElements.forEach(e => {
          if (e.destroyCanvas) {
            e.destroyCanvas();
          } else if (e instanceof Canvas) {
            e.setSize(0, 0);
          }
        });
      });

      this.app = phina_app;

      //別シーンへの移行時にキャンバスを破棄
      this.one('exit', () => {
        this.destroy();
        this.canvas.destroy();
        this.flare('destroy');
        console.log("Exit scene.");
      });
    },

    destroy: function() {},

    fadeIn: function(options) {
      options = (options || {}).$safe({
        color: "white",
        millisecond: 500,
      });
      return new Promise(resolve => {
        const mask = RectangleShape({
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
          fill: options.color,
          strokeWidth: 0,
        }).setPosition(SCREEN_WIDTH * 0.5, SCREEN_HEIGHT * 0.5).addChildTo(this);
        mask.tweener.clear()
          .fadeOut(options.millisecond)
          .call(() => {
            resolve();
            this.app.one('enterframe', () => mask.destroyCanvas());
          });
      });
    },

    fadeOut: function(options) {
      options = (options || {}).$safe({
        color: "white",
        millisecond: 500,
      });
      return new Promise(resolve => {
        const mask = RectangleShape({
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
          fill: options.color,
          strokeWidth: 0,
        }).setPosition(SCREEN_WIDTH * 0.5, SCREEN_HEIGHT * 0.5).addChildTo(this);
        mask.alpha = 0;
        mask.tweener.clear()
          .fadeIn(options.millisecond)
          .call(() => {
            resolve();
            this.app.one('enterframe', () => mask.destroyCanvas());
          });
      });
    },

    //シーン離脱時に破棄するShapeを登録
    registDispose: function(element) {
      this.disposeElements.push(element);
    },
  });

});
/*
 *  FirstSceneFlow.js
 */

phina.namespace(function() {

  phina.define("FirstSceneFlow", {
    superClass: "ManagerScene",

    init: function(options) {
      options = options || {};
      startLabel = options.startLabel || "title";
      this.superInit({
        startLabel: startLabel,
        scenes: [
          {
            label: "title",
            className: "TitleScene",
            nextLabel: "home",
          },
          {
            label: "main",
            className: "MainScene",
          },
        ],
      });
    }
  });

});
phina.namespace(function() {

  phina.define('MainScene', {
    superClass: 'BaseScene',

    init: function(options) {
      this.superInit();
      this.setup();
    },

    setup: function() {
      const back = RectangleShape({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, fill: "black" })
        .setPosition(SCREEN_WIDTH_HALF, SCREEN_HEIGHT_HALF)
        .addChildTo(this);
      this.registDispose(back);

      this.world = World().addChildTo(this);
    },

    update: function() {
    },

  });

});

/*
 *  TitleScene.js
 */

phina.namespace(function() {

  phina.define('TitleScene', {
    superClass: 'BaseScene',

    _static: {
      isAssetLoad: false,
    },

    init: function(options) {
      this.superInit();

      this.unlock = false;
      this.loadcomplete = false;
      this.progress = 0;

      //ロード済みならアセットロードをしない
      if (TitleScene.isAssetLoad) {
        this.setup();
      } else {
        //preload asset
        const assets = AssetList.get("preload")
        this.loader = phina.asset.AssetLoader();
        this.loader.load(assets);
        this.loader.on('load', () => this.setup());
        TitleScene.isAssetLoad = true;
      }
    },

    setup: function() {
      const back = RectangleShape({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, fill: "black" })
        .setPosition(SCREEN_WIDTH_HALF, SCREEN_HEIGHT_HALF)
        .addChildTo(this);
      this.registDispose(back);

      const label = Label({ text: "TitleScene", fill: "white" })
        .setPosition(SCREEN_WIDTH_HALF, SCREEN_HEIGHT_HALF)
        .addChildTo(this);
      this.registDispose(label);

      //テクスチャ編集
      new Promise(resolve => {
        const tex = phina.asset.AssetManager.get("image", "unit");
        let trans = null;
        tex.filter((pixel, index, x, y, bitmap) => {
            var data = bitmap.data;
            //左上のピクセルの色をを透過色とする
            if (x == 0 && y == 0) {
              trans = data;
              data[index + 3] = 0;
              return;
            }
            if (trans[0] == pixel[0] && trans[1] == pixel[1] && trans[2] == pixel[2]) {
              data[index + 3] = 0;
            }
        });
        // phina.asset.AssetManager.set("image", name+"White", tex);

        back.setInteractive(true);
        back.on('pointend', () => this.exit("main"));
        resolve();
      })

    },

    update: function() {
    },

  });

});

phina.namespace(function() {

  phina.define('Actor', {
    superClass: 'DisplayElement',

    init: function(options) {
      this.superInit();
    },

  });

});

phina.namespace(function() {

  phina.define('World', {
    superClass: 'DisplayElement',

    mapSizeW: 20,
    mapSizeH: 20,
    mapChipSize: 32,

    init: function(options) {
      this.superInit();
      this.setup();
    },

    setup: function() {
      this.mapBase = DisplayElement()
        .setPosition(SCREEN_WIDTH_HALF, SCREEN_HEIGHT_HALF)
        .addChildTo(this);
    },

    update: function() {
    },

  });

});

phina.define("Button", {
  superClass: "Accessory",

  lognpressTime: 500,
  doLongpress: false,

  //長押しで連打モード
  longpressBarrage: false,

  init: function() {
    this.superInit();

    this.on("attached", () => {
      this.target.interactive = true;
      this.target.clickSound = Button.defaults.clickSound;

      //ボタン押し時用
      this.target.scaleTweener = Tweener().attachTo(this.target);

      //長押し用
      this.target.twLongpress = Tweener().attachTo(this.target);

      //長押し中特殊対応用
      this.target.twLongpressing = Tweener().attachTo(this.target);

      this.target.on("pointstart", (e) => {

        //イベント貫通にしておく
        e.pass = true;

        //ボタンの同時押しを制限
        if (Button.actionTarget !== null) return;

        //リストビューの子供だった場合はviewportとのあたり判定をする
        const listView = Button.findListView(e.target);
        if (listView && !listView.viewport.hitTest(e.pointer.x, e.pointer.y)) return;

        if (listView) {
          //ポインタが移動した場合は長押しキャンセル（listView内版）
          listView.inner.$watch('y', (v1, v2) => {
            if (this.target !== Button.actionTarget) return;
            if (Math.abs(v1 - v2) < 10) return;

            Button.actionTarget = null;
            this.target.twLongpress.clear();
            this.target.scaleTweener.clear().to({
              scaleX: 1.0 * this.sx,
              scaleY: 1.0 * this.sy
            }, 50);
          });
        }

        //ボタンの処理を実行しても問題ない場合のみ貫通を停止する
        e.pass = false;
        Button.actionTarget = this.target;

        //反転しているボタン用に保持する
        this.sx = (this.target.scaleX > 0) ? 1 : -1;
        this.sy = (this.target.scaleY > 0) ? 1 : -1;

        this.target.scaleTweener.clear()
          .to({
            scaleX: 0.95 * this.sx,
            scaleY: 0.95 * this.sy
          }, 50);

        this.doLongpress = false;
        this.target.twLongpress.clear()
          .wait(this.lognpressTime)
          .call(() => {
            if (!this.longpressBarrage) {
              Button.actionTarget = null;
              this.target.scaleTweener.clear()
                .to({
                  scaleX: 1.0 * this.sx,
                  scaleY: 1.0 * this.sy
                }, 50)
              this.target.flare("longpress")
            } else {
              this.target.flare("clickSound");
              this.target.twLongpressing.clear()
                .wait(5)
                .call(() => this.target.flare("clicked", {
                  longpress: true
                }))
                .call(() => this.target.flare("longpressing"))
                .setLoop(true);
            }
          });
      });

      this.target.on("pointend", (e) => {
        //イベント貫通にしておく
        e.pass = true;

        //
        this.target.twLongpress.clear();
        this.target.twLongpressing.clear();

        //ターゲットがnullかpointstartで保持したターゲットと違う場合はスルーする
        if (Button.actionTarget === null) return;
        if (Button.actionTarget !== this.target) return;

        //ボタンの処理を実行しても問題ない場合のみ貫通を停止する
        e.pass = false;

        //押した位置からある程度移動している場合はクリックイベントを発生させない
        const isMove = e.pointer.startPosition.sub(e.pointer.position).length() > 50;
        const hitTest = this.target.hitTest(e.pointer.x, e.pointer.y);
        if (hitTest && !isMove) this.target.flare("clickSound");

        this.target.scaleTweener.clear()
          .to({
            scaleX: 1.0 * this.sx,
            scaleY: 1.0 * this.sy
          }, 50)
          .call(() => {
            Button.actionTarget = null;
            if (!hitTest || isMove || this.doLongpress) return;
            this.target.flare("clicked", {
              pointer: e.pointer
            });
          });
      });

      //アニメーションの最中に削除された場合に備えてremovedイベント時にフラグを元に戻しておく
      this.target.one("removed", () => {
        if (Button.actionTarget === this.target) {
          Button.actionTarget = null;
        }
      });

      this.target.on("clickSound", () => {
        if (!this.target.clickSound || this.target.clickSound == "") return;
        phina.asset.SoundManager.play(this.target.clickSound);
      });

    });
  },

  //長押しの強制キャンセル
  longpressCancel: function() {
    this.target.twLongpress.clear();
    this.target.twLongpressing.clear();
  },

  _static: {
    //ボタン同時押しを制御するためにstatusはstaticにする
    status: 0,
    actionTarget: null,
    //基本設定
    defaults: {
      clickSound: "common/sounds/se/button",
    },

    //親をたどってListViewを探す
    findListView: function(element, p) {
      //リストビューを持っている場合
      if (element.ListView != null) return element.ListView;
      //親がなければ終了
      if (element.parent == null) return null;
      //親をたどる
      return this.findListView(element.parent);
    }

  }

});

/**
 * 親スプライトのテクスチャを切り抜いて自分のテクスチャとするスプライト
 * 親スプライトの切り抜かれた部分は、切り抜き範囲の左上のピクセルの色で塗りつぶされる
 * 
 * 親要素の拡縮・回転は考慮しない
 */
phina.define("ClipSprite", {
  superClass: "Accessory",

  init: function() {
    this.superInit();
    this.on("attached", () => {
      this.target.one("added", () => {
        this.setup();
      });
    });
  },

  setup: function() {
    const target = this.target;
    const parent = target.parent;
    if (parent instanceof phina.display.Sprite) {
      const x = parent.width * parent.origin.x + target.x - target.width * target.origin.x;
      const y = parent.height * parent.origin.y + target.y - target.height * target.origin.y;
      const w = target.width;
      const h = target.height;

      const parentTexture = parent.image;
      const canvas = phina.graphics.Canvas().setSize(w, h);
      canvas.context.drawImage(parentTexture.domElement, x, y, w, h, 0, 0, w, h);
      if (parentTexture instanceof phina.graphics.Canvas) {
        // クローンしてそっちを使う
        const parentTextureClone = phina.graphics.Canvas().setSize(parentTexture.width, parentTexture.height);
        parentTextureClone.context.drawImage(parentTexture.domElement, 0, 0);
        parent.image = parentTextureClone;

        const data = parentTextureClone.context.getImageData(x, y, 1, 1).data;
        parentTextureClone.context.clearRect(x, y, w, h);
        if (data[3] > 0) {
          parentTextureClone.context.globalAlpha = 1;
          parentTextureClone.context.fillStyle = `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`;
          parentTextureClone.context.fillRect(x - 1, y - 1, w + 2, h + 2);
        }
      }

      const sprite = phina.display.Sprite(canvas);
      sprite.setOrigin(target.origin.x, target.origin.y);
      target.addChildAt(sprite, 0);
    }
  },
});

phina.define("Gauge", {
  superClass: "RectangleClip",

  _min: 0,
  _max: 1.0,
  _value: 1.0, //min ~ max

  direction: "horizontal", // horizontal or vertical

  init: function() {
    this.superInit();
    this.on("attached", () => {
      this._width = this.width;
      this._height = this.width;

      this.target.accessor("Gauge.min", {
        "get": () => this.min,
        "set": (v) => this.min = v,
      });

      this.target.accessor("Gauge.max", {
        "get": () => this.max,
        "set": (v) => this.max = v,
      });

      this.target.accessor("Gauge.value", {
        "get": () => this.value,
        "set": (v) => this.value = v,
      });

      this.target.accessor("Gauge.progress", {
        "get": () => this.progress,
        "set": (v) => this.progress = v,
      });
    });
  },

  _refresh: function() {
    if (this.direction !== "vertical") {
      this.width = this.target.width * this.progress;
      this.height = this.target.height;
    } else {
      this.width = this.target.width;
      this.height = this.target.height * this.progress;
    }
  },

  _accessor: {
    progress: {
      get: function() {
        const p = (this.value - this.min) / (this.max - this.min);
        return (isNaN(p)) ? 0.0 : p;
      },
      set: function(v) {
        this.value = this.max * v;
      }
    },

    max: {
      get: function() {
        return this._max;
      },
      set: function(v) {
        this._max = v;
        this._refresh();
      }
    },

    min: {
      get: function() {
        return this._min;
      },
      set: function(v) {
        this._min = v;
        this._refresh();
      }
    },

    value: {
      get: function() {
        return this._value;
      },
      set: function(v) {
        this._value = v;
        this._refresh();
      }
    },
  }

});

phina.define("Grayscale", {
  superClass: "Accessory",

  grayTextureName: null,

  init: function(options) {
    this.superInit();
    this.on("attached", () => {
      this.grayTextureName = options.grayTextureName;
      this.normal = this.target.image;
    });
  },

  toGrayscale: function() {
    this.target.image = this.grayTextureName;
  },

  toNormal: function() {
    this.target.image = this.normal;
  },

});

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

phina.namespace(function() {
  //マウス追従
  phina.define("MouseChaser", {
    superClass: "Accessory",

    init: function() {
      this.superInit();
    },

    onattached: function() {
      let px = 0;
      let py = 0;
      console.log("#MouseChaser", "onattached");
      this.tweener = Tweener().attachTo(this.target);
      this.target.on("enterframe", (e) => {
        const p = e.app.pointer;
        if (py == p.x && py == p.y) return;
        px = p.x;
        py = p.y;
        const x = p.x - SCREEN_WIDTH_HALF;
        const y = p.y - SCREEN_HEIGHT_HALF;
        this.tweener.clear().to({ x, y }, 2000, "easeOutQuad")
      });

    },

    ondetached: function() {
      console.log("#MouseChaser", "ondetached");
      this.tweener.remove();
    }

  });
});

phina.namespace(function() {

  phina.define("PieClip", {
    superClass: "Accessory",

    init: function(options) {
      options = ({}).$safe(options, PieClip.defaults)
      this.superInit(options);

      this.pivotX = options.pivotX;
      this.pivotY = options.pivotY;
      this.angleMin = options.angleMin;
      this.angleMax = options.angleMax;
      this.radius = options.radius;
      this.anticlockwise = options.anticlockwise;
    },

    onattached: function() {
      this.target.clip = (canvas) => {
        const angleMin = this.angleMin * Math.DEG_TO_RAD;
        const angleMax = this.angleMax * Math.DEG_TO_RAD;
        const ctx = canvas.context;
        ctx.beginPath();
        ctx.moveTo(this.pivotX, this.pivotY);
        ctx.lineTo(this.pivotX + Math.cos(angleMin) * this.radius, this.pivotY + Math.sin(angleMin) * this.radius);
        ctx.arc(this.pivotX, this.pivotY, this.radius, angleMin, angleMax, this.anticlockwise);
        ctx.closePath();
      };
    },

    _static: {
      defaults: {
        pivotX: 32,
        pivotY: 32,
        angleMin: 0,
        angleMax: 360,
        radius: 64,
        anticlockwise: false,
      },
    },

  });
});

phina.define("RectangleClip", {
  superClass: "Accessory",

  x: 0,
  y: 0,
  width: 0,
  height: 0,

  _enable: true,

  init: function() {
    this.superInit();
    this._init();
  },

  _init: function() {
    this.on("attached", () => {

      this.target.accessor("RectangleClip.width", {
        "get": () => this.width,
        "set": (v) => this.width = v,
      });

      this.target.accessor("RectangleClip.height", {
        "get": () => this.height,
        "set": (v) => this.height = v,
      });

      this.target.accessor("RectangleClip.x", {
        "get": () => this.x,
        "set": (v) => this.x = v,
      });

      this.target.accessor("RectangleClip.y", {
        "get": () => this.y,
        "set": (v) => this.y = v,
      });

      this.x = 0;
      this.y = 0;
      this.width = this.target.width;
      this.height = this.target.height;

      this.target.clip = (c) => this._clip(c);
    });
  },

  _clip: function(canvas) {
    const x = this.x - (this.width * this.target.originX);
    const y = this.y - (this.height * this.target.originY);

    canvas.beginPath();
    canvas.rect(x, y, this.width, this.height);
    canvas.closePath();
  },

  setEnable: function(enable) {
    this._enable = enable;
    if (this._enable) {
      this.target.clip = (c) => this._clip(c);
    } else {
      this.target.clip = null;
    }
  },

  _accessor: {
    enable: {
      set: function(v) {
        this.setEnable(v);
      },
      get: function() {
        return this._enable;
      }
    }
  },

});

phina.define("Toggle", {
  superClass: "Accessory",

  init: function(isOn) {
    this.superInit();
    this._init(isOn);
  },

  _init: function(isOn) {
    this.isOn = isOn || false;
  },

  setStatus: function(status) {
    this.isOn = status;
    this.target.flare((this.isOn) ? "switchOn" : "switchOff");
  },

  switchOn: function() {
    if (this.isOn) return;
    this.setStatus(true);
  },

  switchOff: function() {
    if (!this.isOn) return;
    this.setStatus(false);
  },

  switch: function() {
    this.isOn = !this.isOn;
    this.setStatus(this.isOn);
  },

  _accessor: {
    status: {
      "get": function() {
        return this.isOn;
      },
      "set": function(v) {
        return setStatus(v);
      },
    },
  },

});

phina.asset.AssetLoader.prototype.load = function(params) {
  var self = this;
  var loadAssets = [];
  var counter = 0;
  var length = 0;
  var maxConnectionCount = 2;

  params.forIn(function(type, assets) {
    length += Object.keys(assets).length;
  });

  if (length == 0) {
    return phina.util.Flow.resolve().then(function() {
      self.flare('load');
    });
  }

  params.forIn(function(type, assets) {
    assets.forIn(function(key, value) {
      loadAssets.push({
        "func": phina.asset.AssetLoader.assetLoadFunctions[type],
        "key": key,
        "value": value,
        "type": type,
      });
    });
  });

  if (self.cache) {
    self.on('progress', function(e) {
      if (e.progress >= 1.0) {
        params.forIn(function(type, assets) {
          assets.forIn(function(key, value) {
            var asset = phina.asset.AssetManager.get(type, key);
            if (asset.loadError) {
              var dummy = phina.asset.AssetManager.get(type, 'dummy');
              if (dummy) {
                if (dummy.loadError) {
                  dummy.loadDummy();
                  dummy.loadError = false;
                }
                phina.asset.AssetManager.set(type, key, dummy);
              } else {
                asset.loadDummy();
              }
            }
          });
        });
      }
    });
  }

  var loadAssetsArray = [];

  while (loadAssets.length > 0) {
    loadAssetsArray.push(loadAssets.splice(0, maxConnectionCount));
  }

  var flow = phina.util.Flow.resolve();

  loadAssetsArray.forEach(function(loadAssets) {
    flow = flow.then(function() {
      var flows = [];
      loadAssets.forEach(function(loadAsset) {
        var f = loadAsset.func(loadAsset.key, loadAsset.value);
        f.then(function(asset) {
          if (self.cache) {
            phina.asset.AssetManager.set(loadAsset.type, loadAsset.key, asset);
          }
          self.flare('progress', {
            key: loadAsset.key,
            asset: asset,
            progress: (++counter / length),
          });
        });
        flows.push(f);
      });
      return phina.util.Flow.all(flows);
    });
  });

  return flow.then(function(args) {
    self.flare('load');
  });
}

phina.namespace(function() {

  phina.app.BaseApp.prototype.$method("replaceScene", function(scene) {
    this.flare('replace');
    this.flare('changescene');

    while (this._scenes.length > 0) {
      const scene = this._scenes.pop();
      scene.flare("destroy");
    }

    this._sceneIndex = 0;

    if (this.currentScene) {
      this.currentScene.app = null;
    }

    this.currentScene = scene;
    this.currentScene.app = this;
    this.currentScene.flare('enter', {
      app: this,
    });

    return this;
  });

  phina.app.BaseApp.prototype.$method("popScene", function() {
    this.flare('pop');
    this.flare('changescene');

    var scene = this._scenes.pop();
    --this._sceneIndex;

    scene.flare('exit', {
      app: this,
    });
    scene.flare('destroy');
    scene.app = null;

    this.flare('poped');

    // 
    this.currentScene.flare('resume', {
      app: this,
      prevScene: scene,
    });

    return scene;
  });

});

phina.namespace(function() {

  phina.graphics.Canvas.prototype.$method("init", function(canvas) {
    this.isCreateCanvas = false;
    if (typeof canvas === 'string') {
      this.canvas = document.querySelector(canvas);
    } else {
      if (canvas) {
        this.canvas = canvas;
      } else {
        this.canvas = document.createElement('canvas');
        this.isCreateCanvas = true;
        // console.log('#### create canvas ####');
      }
    }

    this.domElement = this.canvas;
    this.context = this.canvas.getContext('2d');
    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';
  });

  phina.graphics.Canvas.prototype.$method('destroy', function(canvas) {
    if (!this.isCreateCanvas) return;
    // console.log(`#### delete canvas ${this.canvas.width} x ${this.canvas.height} ####`);
    this.setSize(0, 0);
    delete this.canvas;
    delete this.domElement;
  });

});

phina.namespace(() => {

  var qualityScale = phina.geom.Matrix33();

  phina.display.CanvasRenderer.prototype.$method("render", function(scene, quality) {
    this.canvas.clear();
    if (scene.backgroundColor) {
      this.canvas.clearColor(scene.backgroundColor);
    }

    this._context.save();
    this.renderChildren(scene, quality);
    this._context.restore();
  });

  phina.display.CanvasRenderer.prototype.$method("renderChildren", function(obj, quality) {
    // 子供たちも実行
    if (obj.children.length > 0) {
      var tempChildren = obj.children.slice();
      for (var i = 0, len = tempChildren.length; i < len; ++i) {
        this.renderObject(tempChildren[i], quality);
      }
    }
  });

  phina.display.CanvasRenderer.prototype.$method("renderObject", function(obj, quality) {
    if (obj.visible === false && !obj.interactive) return;

    obj._calcWorldMatrix && obj._calcWorldMatrix();

    if (obj.visible === false) return;

    obj._calcWorldAlpha && obj._calcWorldAlpha();

    var context = this.canvas.context;

    context.globalAlpha = obj._worldAlpha;
    context.globalCompositeOperation = obj.blendMode;

    if (obj._worldMatrix) {

      qualityScale.identity();

      qualityScale.m00 = quality || 1.0;
      qualityScale.m11 = quality || 1.0;

      var m = qualityScale.multiply(obj._worldMatrix);
      context.setTransform(m.m00, m.m10, m.m01, m.m11, m.m02, m.m12);

    }

    if (obj.clip) {

      context.save();

      obj.clip(this.canvas);
      context.clip();

      if (obj.draw) obj.draw(this.canvas);

      // 子供たちも実行
      if (obj.renderChildBySelf === false && obj.children.length > 0) {
        var tempChildren = obj.children.slice();
        for (var i = 0, len = tempChildren.length; i < len; ++i) {
          this.renderObject(tempChildren[i], quality);
        }
      }

      context.restore();
    } else {
      if (obj.draw) obj.draw(this.canvas);

      // 子供たちも実行
      if (obj.renderChildBySelf === false && obj.children.length > 0) {
        var tempChildren = obj.children.slice();
        for (var i = 0, len = tempChildren.length; i < len; ++i) {
          this.renderObject(tempChildren[i], quality);
        }
      }

    }
  });

});

phina.namespace(() => {
  //ユーザーエージェントからブラウザタイプの判別を行う
  phina.$method('checkBrowser', function() {
    const result = {};
    const agent = window.navigator.userAgent.toLowerCase();;

    result.isChrome = (agent.indexOf('chrome') !== -1) && (agent.indexOf('edge') === -1) && (agent.indexOf('opr') === -1);
    result.isEdge = (agent.indexOf('edge') !== -1);
    result.isIe11 = (agent.indexOf('trident/7') !== -1);
    result.isFirefox = (agent.indexOf('firefox') !== -1);
    result.isSafari = (agent.indexOf('safari') !== -1) && (agent.indexOf('chrome') === -1);
    result.isElectron = (agent.indexOf('electron') !== -1);

    result.isWindows = (agent.indexOf('windows') !== -1);
    result.isMac = (agent.indexOf('mac os x') !== -1);

    return result;
  });
});

//==================================================
//  Extension phina.display.DisplayElement
//==================================================
phina.namespace(() => {
  phina.display.DisplayElement.prototype.$method("enable", function() {
    this.show().wakeUp();
    return this;
  });

  phina.display.DisplayElement.prototype.$method("disable", function() {
    this.hide().sleep();
    return this;
  });
});

phina.namespace(() => {
  phina.display.DisplayScene.quality = 1.0;
  phina.display.DisplayScene.prototype.$method("init", function(params) {
    this.superInit();
    var quality = phina.display.DisplayScene.quality;

    params = ({}).$safe(params, phina.display.DisplayScene.defaults);
    this.canvas = phina.graphics.Canvas();
    this.canvas.setSize(params.width * quality, params.height * quality);
    this.renderer = phina.display.CanvasRenderer(this.canvas);
    this.backgroundColor = (params.backgroundColor) ? params.backgroundColor : null;

    this.width = params.width;
    this.height = params.height;
    this.gridX = phina.util.Grid(params.width, 16);
    this.gridY = phina.util.Grid(params.height, 16);

    this.interactive = true;
    this.setInteractive = function(flag) {
      this.interactive = flag;
    };
    this._overFlags = {};
    this._touchFlags = {};
  });

});

phina.namespace(function() {

  // audio要素で音声を再生する。主にIE用
  phina.define("phina.asset.DomAudioSound", {
    superClass: "phina.asset.Asset",

    domElement: null,
    emptySound: false,

    init: function() {
      this.superInit();
    },

    _load: function(resolve) {
      this.domElement = document.createElement("audio");
      if (this.domElement.canPlayType("audio/mpeg")) {
        setTimeout(function readystateCheck() {
          if (this.domElement.readyState < 4) {
            setTimeout(readystateCheck.bind(this), 10);
          } else {
            this.emptySound = false;
            console.log("end load ", this.src);
            resolve(this)
          }
        }.bind(this), 10);
        this.domElement.onerror = function(e) {
          console.error("オーディオのロードに失敗", e);
        };
        this.domElement.src = this.src;
        console.log("begin load ", this.src);
        this.domElement.load();
        this.domElement.autoplay = false;
        this.domElement.addEventListener("ended", function() {
          this.flare("ended");
        }.bind(this));
      } else {
        console.log("mp3は再生できません");
        this.emptySound = true;
        resolve(this);
      }
    },

    play: function() {
      if (this.emptySound) return;
      this.domElement.pause();
      this.domElement.currentTime = 0;
      this.domElement.play();
    },

    stop: function() {
      if (this.emptySound) return;
      this.domElement.pause();
      this.domElement.currentTime = 0;
    },

    pause: function() {
      if (this.emptySound) return;
      this.domElement.pause();
    },

    resume: function() {
      if (this.emptySound) return;
      this.domElement.play();
    },

    setLoop: function(v) {
      if (this.emptySound) return;
      this.domElement.loop = v;
    },

    _accessor: {
      volume: {
        get: function() {
          if (this.emptySound) return 0;
          return this.domElement.volume;
        },
        set: function(v) {
          if (this.emptySound) return;
          this.domElement.volume = v;
        },
      },
      loop: {
        get: function() {
          if (this.emptySound) return false;
          return this.domElement.loop;
        },
        set: function(v) {
          if (this.emptySound) return;
          this.setLoop(v);
        },
      },

    },
  });

  // IE11の場合のみ音声アセットはDomAudioSoundで再生する
  var ua = window.navigator.userAgent.toLowerCase();
  if (ua.indexOf('trident/7') !== -1) {
    phina.asset.AssetLoader.register("sound", function(key, path) {
      var asset = phina.asset.DomAudioSound();
      return asset.load(path);
    });
  }

});

phina.namespace(() => {

  phina.app.Element.prototype.$method("findById", function(id) {
    if (this.id === id) {
      return this;
    } else {
      for (let i = 0; i < this.children.length; i++) {
        if (this.children[i].findById(id)) {
          return this.children[i];
        }
      }
      return null;
    }
  });

  //指定された子オブジェクトを最前面に移動する
  phina.app.Element.prototype.$method("moveFront", function(child) {
    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i] == child) {
        this.children.splice(i, 1);
        break;
      }
    }
    this.children.push(child);
    return this;
  });

  phina.app.Element.prototype.$method("destroyChild", function() {
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].flare('destroy');
    }
    return this;
  });

});

phina.namespace(() => {

  phina.input.Input.quality = 1.0;

  phina.input.Input.prototype.$method("_move", function(x, y) {
    this._tempPosition.x = x;
    this._tempPosition.y = y;

    // adjust scale
    var elm = this.domElement;
    var rect = elm.getBoundingClientRect();

    var w = elm.width / phina.input.Input.quality;
    var h = elm.height / phina.input.Input.quality;

    if (rect.width) {
      this._tempPosition.x *= w / rect.width;
    }

    if (rect.height) {
      this._tempPosition.y *= h / rect.height;
    }

  });

});

phina.namespace(() => {
  phina.display.Label.prototype.$method("init", function(options) {
    if (typeof arguments[0] !== 'object') {
      options = { text: arguments[0], };
    } else {
      options = arguments[0];
    }

    options = ({}).$safe(options, phina.display.Label.defaults);
    this.superInit(options);

    this.text = (options.text) ? options.text : "";
    this.fontSize = options.fontSize;
    this.fontWeight = options.fontWeight;
    this.fontFamily = options.fontFamily;
    this.align = options.align;
    this.baseline = options.baseline;
    this.lineHeight = options.lineHeight;
  });

});

phina.namespace(() => {
  phina.input.Mouse.prototype.init = function(domElement) {
    this.superInit(domElement);

    this.id = 0;

    var self = this;
    this.domElement.addEventListener('mousedown', function(e) {
      self._start(e.pointX, e.pointY, 1 << e.button);
      e.preventDefault();
      e.stopPropagation();
    });

    this.domElement.addEventListener('mouseup', function(e) {
      self._end(1 << e.button);
      e.preventDefault();
      e.stopPropagation();
    });
    this.domElement.addEventListener('mousemove', function(e) {
      self._move(e.pointX, e.pointY);
      e.preventDefault();
      e.stopPropagation();
    });

    // マウスがキャンバス要素の外に出た場合の対応
    this.domElement.addEventListener('mouseout', function(e) {
      self._end(1);
    });
  }
});

//==================================================
//  Extension phina.app.Object2D
//==================================================

phina.namespace(() => {
  phina.app.Object2D.prototype.$method("setOrigin", function(x, y, reposition) {
    if (!reposition) {
      this.origin.x = x;
      this.origin.y = y;
      return this;
    }

    //変更された基準点に移動させる
    const _originX = this.originX;
    const _originY = this.originY;
    const _addX = (x - _originX) * this.width;
    const _addY = (y - _originY) * this.height;

    this.x += _addX;
    this.y += _addY;
    this.originX = x;
    this.originY = y;

    this.children.forEach(child => {
      child.x -= _addX;
      child.y -= _addY;
    });
    return this;
  });

  phina.app.Object2D.prototype.$method("hitTestElement", function(elm) {
    const rect0 = this.calcGlobalRect();
    const rect1 = elm.calcGlobalRect();
    return (rect0.left < rect1.right) && (rect0.right > rect1.left) &&
      (rect0.top < rect1.bottom) && (rect0.bottom > rect1.top);
  });

  phina.app.Object2D.prototype.$method("calcGlobalRect", function() {
    const left = this._worldMatrix.m02 - this.originX * this.width;
    const top = this._worldMatrix.m12 - this.originY * this.height;
    return Rect(left, top, this.width, this.height);
  });

  phina.app.Object2D.prototype.$method("calcGlobalRect", function() {
    const left = this._worldMatrix.m02 - this.originX * this.width;
    const top = this._worldMatrix.m12 - this.originY * this.height;
    return Rect(left, top, this.width, this.height);
  });

});

phina.namespace(function() {

  phina.display.PlainElement.prototype.$method("destroyCanvas", function() {
    if (!this.canvas) return;
    this.canvas.destroy();
    delete this.canvas;
  });

});

//==================================================
//  Extension phina.display.Shape
//==================================================
phina.display.Shape.prototype.render = function(canvas) {
  if (!canvas) {
    console.log("canvas null");
    return;
  }
  var context = canvas.context;
  // リサイズ
  var size = this.calcCanvasSize();
  canvas.setSize(size.width, size.height);
  // クリアカラー
  canvas.clearColor(this.backgroundColor);
  // 中心に座標を移動
  canvas.transformCenter();

  // 描画前処理
  this.prerender(this.canvas);

  // ストローク描画
  if (this.isStrokable()) {
    context.strokeStyle = this.stroke;
    context.lineWidth = this.strokeWidth;
    context.lineJoin = "round";
    context.shadowBlur = 0;
    this.renderStroke(canvas);
  }

  // 塗りつぶし描画
  if (this.fill) {
    context.fillStyle = this.fill;
    // shadow の on/off
    if (this.shadow) {
      context.shadowColor = this.shadow;
      context.shadowBlur = this.shadowBlur;
      context.shadowOffsetX = this.shadowOffsetX || 0;
      context.shadowOffsetY = this.shadowOffsetY || 0;
    } else {
      context.shadowBlur = 0;
    }
    this.renderFill(canvas);
  }

  // 描画後処理
  this.postrender(this.canvas);

  return this;
};

phina.namespace(function() {

  phina.asset.Sound.prototype.$method("_load", function(resolve) {
    if (/^data:/.test(this.src)) {
      this._loadFromURIScheme(resolve);
    } else {
      this._loadFromFile(resolve);
    }
  });

  phina.asset.Sound.prototype.$method("_loadFromFile", function(resolve) {
    // console.log(this.src);
    var self = this;
    var xml = new XMLHttpRequest();
    xml.open('GET', this.src);
    xml.onreadystatechange = function() {
      if (xml.readyState === 4) {
        if ([200, 201, 0].indexOf(xml.status) !== -1) {
          // 音楽バイナリーデータ
          var data = xml.response;
          // webaudio 用に変換
          // console.log(data)
          self.context.decodeAudioData(data, function(buffer) {
            self.loadFromBuffer(buffer);
            resolve(self);
          }, function() {
            console.warn("音声ファイルのデコードに失敗しました。(" + self.src + ")");
            resolve(self);
            self.flare('decodeerror');
          });
        } else if (xml.status === 404) {
          // not found
          self.loadError = true;
          self.notFound = true;
          resolve(self);
          self.flare('loaderror');
          self.flare('notfound');
        } else {
          // サーバーエラー
          self.loadError = true;
          self.serverError = true;
          resolve(self);
          self.flare('loaderror');
          self.flare('servererror');
        }
        xml.onreadystatechange = null;
      }
    };

    xml.responseType = 'arraybuffer';

    xml.send(null);
  });

  phina.asset.Sound.prototype.$method("play", function(when, offset, duration) {
    when = when ? when + this.context.currentTime : 0;
    offset = offset || 0;

    var source = this.source = this.context.createBufferSource();
    var buffer = source.buffer = this.buffer;
    source.loop = this._loop;
    source.loopStart = this._loopStart;
    source.loopEnd = this._loopEnd;
    source.playbackRate.value = this._playbackRate;

    // connect
    source.connect(this.gainNode);
    this.gainNode.connect(phina.asset.Sound.getMasterGain());
    // play
    if (duration !== undefined) {
      source.start(when, offset, duration);
    } else {
      source.start(when, offset);
    }

    source.onended = function() {
      if (!source) {
        this.flare('ended');
        return;
      }
      source.onended = null;
      source.disconnect();
      source.buffer = null;
      source = null;
      this.flare('ended');
    }.bind(this);

    return this;
  });

  phina.asset.Sound.prototype.$method("stop", function() {
    // stop
    if (this.source) {
      // stop すると source.endedも発火する
      this.source.stop && this.source.stop(0);
      this.flare('stop');
    }

    return this;
  });

});

//==================================================
//  Extension phina.asset.SoundManager
//==================================================
SoundManager.$method("getVolume", function() {
  return !this.isMute() ? this.volume : 0;
});

SoundManager.$method("getVolumeMusic", function() {
  return !this.isMute() ? this.musicVolume : 0;
});

SoundManager.$method("setVolumeMusic", function(volume) {
  this.musicVolume = volume;
  if (!this.isMute() && this.currentMusic) {
    this.currentMusic.volume = volume;
  }
  return this;
});

SoundManager.$method("playMusic", function(name, fadeTime, loop, when, offset, duration) {
  // const res = phina.checkBrowser();
  // if (res.isIe11) return null;

  loop = (loop !== undefined) ? loop : true;

  if (this.currentMusic) {
    this.stopMusic(fadeTime);
  }

  var music = null;
  if (name instanceof phina.asset.Sound || name instanceof phina.asset.DomAudioSound) {
    music = name;
  } else {
    music = phina.asset.AssetManager.get('sound', name);
  }

  if (!music) {
    console.error("Sound not found: ", name);
    return null;
  }

  music.setLoop(loop);
  music.play(when, offset, duration);

  if (fadeTime > 0) {
    var count = 32;
    var counter = 0;
    var unitTime = fadeTime / count;
    var volume = this.getVolumeMusic();

    music.volume = 0;
    var id = setInterval(function() {
      counter += 1;
      var rate = counter / count;
      music.volume = rate * volume;

      if (rate >= 1) {
        clearInterval(id);
        return false;
      }

      return true;
    }, unitTime);
  } else {
    music.volume = this.getVolumeMusic();
  }

  this.currentMusic = music;

  return this.currentMusic;
});

//==================================================
// ボイス用の音量設定、再生メソッド拡張
SoundManager.$method("getVolumeVoice", function() {
  return !this.isMute() ? this.voiceVolume : 0;
});

SoundManager.$method("setVolumeVoice", function(volume) {
  this.voiceVolume = volume;
  return this;
});

SoundManager.$method("playVoice", function(name) {
  var sound = phina.asset.AssetManager.get('sound', name);
  sound.volume = this.getVolumeVoice();
  sound.play();
  return sound;
});

//スプライト機能拡張
phina.namespace(function() {

  phina.display.Sprite.prototype.setFrameTrimming = function(x, y, width, height) {
    this._frameTrimX = x || 0;
    this._frameTrimY = y || 0;
    this._frameTrimWidth = width || this.image.domElement.width - this._frameTrimX;
    this._frameTrimHeight = height || this.image.domElement.height - this._frameTrimY;
    return this;
  }

  phina.display.Sprite.prototype.setFrameIndex = function(index, width, height) {
    var sx = this._frameTrimX || 0;
    var sy = this._frameTrimY || 0;
    var sw = this._frameTrimWidth  || (this.image.domElement.width-sx);
    var sh = this._frameTrimHeight || (this.image.domElement.height-sy);

    var tw  = width || this.width;      // tw
    var th  = height || this.height;    // th
    var row = ~~(sw / tw);
    var col = ~~(sh / th);
    var maxIndex = row*col;
    index = index%maxIndex;

    var x   = index%row;
    var y   = ~~(index/row);
    this.srcRect.x = sx+x*tw;
    this.srcRect.y = sy+y*th;
    this.srcRect.width  = tw;
    this.srcRect.height = th;

    this._frameIndex = index;

    return this;
  }

});
phina.namespace(function() {
  // 文字列から数値を抽出する
  // レイアウトファイルから作業する場合に利用したくなる
  // hoge_0 hoge_1などから数字だけ抽出
  // 0100_hoge_9999 => ["0100" , "9999"]になる
  // hoge0.0とかはどうすかな？
  // 抽出後にparseIntするかは検討中
  String.prototype.$method("matchInt", function() {
    return this.match(/[0-9]+/g);
  });
});

phina.namespace(function() {

  phina.asset.Texture.prototype.$method("_load", function(resolve) {
    this.domElement = new Image();

    var isLocal = (location.protocol == 'file:');
    if (!(/^data:/.test(this.src))) {
      this.domElement.crossOrigin = 'anonymous'; // クロスオリジン解除
    }

    var self = this;
    this.domElement.onload = function(e) {
      self.loaded = true;
      e.target.onload = null;
      e.target.onerror = null;
      resolve(self);
    };

    this.domElement.onerror = function(e) {
      e.target.onload = null;
      e.target.onerror = null;
      console.error("phina.asset.Texture _load onError ", this.src);
    };

    this.domElement.src = this.src;
  });

});

phina.namespace(function() {

  phina.accessory.Tweener.prototype.$method("_updateTween", function(app) {
    //※これないとpauseがうごかない
    if (!this.playing) return;

    var tween = this._tween;
    var time = this._getUnitTime(app);

    tween.forward(time);
    this.flare('tween');

    if (tween.time >= tween.duration) {
      delete this._tween;
      this._tween = null;
      this._update = this._updateTask;
    }
  });

  phina.accessory.Tweener.prototype.$method("_updateWait", function(app) {
    //※これないとpauseがうごかない
    if (!this.playing) return;

    var wait = this._wait;
    var time = this._getUnitTime(app);
    wait.time += time;

    if (wait.time >= wait.limit) {
      delete this._wait;
      this._wait = null;
      this._update = this._updateTask;
    }
  });

});

phina.define("Buttonize", {
  init: function() {},
  _static: {
    STATUS: {
      NONE: 0,
      START: 1,
      END: 2,
    },
    status: 0,
    rect: function(element) {
      element.boundingType = "rect";
      this._common(element);
      return element;
    },
    circle: function(element) {
      element.radius = Math.max(element.width, element.height) * 0.5;
      element.boundingType = "circle";
      this._common(element);
      return element;
    },
    _common: function(element) {
      //TODO:エディターできるまでの暫定対応
      element.setOrigin(0.5, 0.5, true);

      element.interactive = true;
      element.clickSound = "se/clickButton";

      //TODO:ボタンの同時押下は実機で調整する
      element.on("pointstart", e => {
        if (this.status != this.STATUS.NONE) return;
        this.status = this.STATUS.START;
        element.tweener.clear()
          .to({
            scaleX: 0.9,
            scaleY: 0.9
          }, 100);
      });

      element.on("pointend", (e) => {
        if (this.status != this.STATUS.START) return;
        const hitTest = element.hitTest(e.pointer.x, e.pointer.y);
        this.status = this.STATUS.END;
        if (hitTest) element.flare("clickSound");

        element.tweener.clear()
          .to({
            scaleX: 1.0,
            scaleY: 1.0
          }, 100)
          .call(() => {
            this.status = this.STATUS.NONE;
            if (!hitTest) return;
            element.flare("clicked", {
              pointer: e.pointer
            });
          });
      });

      //アニメーションの最中に削除された場合に備えてremovedイベント時にフラグを元に戻しておく
      element.one("removed", () => {
        this.status = this.STATUS.NONE;
      });

      element.on("clickSound", function() {
        if (!element.clickSound) return;
        //phina.asset.SoundManager.play(element.clickSound);
      });
    },
  },
});

phina.namespace(function() {

  /**
   * テクスチャ関係のユーティリティ
   */
  phina.define("TextureUtil", {

    _static: {

      /**
       * RGB各要素に実数を積算する
       */
      multiplyColor: function(texture, red, green, blue) {
        if (typeof(texture) === "string") {
          texture = AssetManager.get("image", texture);
        }

        const width = texture.domElement.width;
        const height = texture.domElement.height;

        const result = Canvas().setSize(width, height);
        const context = result.context;

        context.drawImage(texture.domElement, 0, 0);
        const imageData = context.getImageData(0, 0, width, height);
        for (let i = 0; i < imageData.data.length; i += 4) {
          imageData.data[i + 0] = Math.floor(imageData.data[i + 0] * red);
          imageData.data[i + 1] = Math.floor(imageData.data[i + 1] * green);
          imageData.data[i + 2] = Math.floor(imageData.data[i + 2] * blue);
        }
        context.putImageData(imageData, 0, 0);

        return result;
      },

      /**
       * 色相・彩度・明度を操作する
       */
      editByHsl: function(texture, h, s, l) {
        if (typeof(texture) === "string") {
          texture = AssetManager.get("image", texture);
        }

        const width = texture.domElement.width;
        const height = texture.domElement.height;

        const result = Canvas().setSize(width, height);
        const context = result.context;

        context.drawImage(texture.domElement, 0, 0);
        const imageData = context.getImageData(0, 0, width, height);
        for (let i = 0; i < imageData.data.length; i += 4) {
          const r = imageData.data[i + 0];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];

          const hsl = phina.util.Color.RGBtoHSL(r, g, b);
          const newRgb = phina.util.Color.HSLtoRGB(hsl[0] + h, Math.clamp(hsl[1] + s, 0, 100), Math.clamp(hsl[2] + l, 0, 100));

          imageData.data[i + 0] = newRgb[0];
          imageData.data[i + 1] = newRgb[1];
          imageData.data[i + 2] = newRgb[2];
        }
        context.putImageData(imageData, 0, 0);

        return result;
      },

    },

    init: function() {},
  });

});

/*
 *  phina.tiledmap.js
 *  2016/9/10
 *  @auther minimo  
 *  This Program is MIT license.
 *
 */

phina.namespace(function() {

  phina.define("phina.asset.TiledMap", {
    superClass: "phina.asset.Asset",

    image: null,

    tilesets: null,
    layers: null,

    init: function() {
        this.superInit();
    },

    _load: function(resolve) {
      //パス抜き出し
      this.path = "";
      const last = this.src.lastIndexOf("/");
      if (last > 0) {
          this.path = this.src.substring(0, last+1);
      }

      //終了関数保存
      this._resolve = resolve;

      // load
      const self = this;
      const xml = new XMLHttpRequest();
      xml.open('GET', this.src);
      xml.onreadystatechange = function() {
        if (xml.readyState === 4) {
          if ([200, 201, 0].indexOf(xml.status) !== -1) {
            var data = xml.responseText;
            data = (new DOMParser()).parseFromString(data, "text/xml");
            self.dataType = "xml";
            self.data = data;
            self._parse(data);
          }
        }
      };
      xml.send(null);
    },

    //マップイメージ取得
    getImage: function(layerName) {
      if (layerName === undefined) {
        return this.image;
      } else {
        return this._generateImage(layerName);
      }
    },

    //指定マップレイヤーを配列として取得
    getMapData: function(layerName) {
      //レイヤー検索
      for(var i = 0; i < this.layers.length; i++) {
        if (this.layers[i].name == layerName) {
          //コピーを返す
          return this.layers[i].data.concat();
        }
      }
      return null;
    },

    //オブジェクトグループを取得（指定が無い場合、全レイヤーを配列にして返す）
    getObjectGroup: function(groupName) {
      groupName = groupName || null;
      var ls = [];
      var len = this.layers.length;
      for (var i = 0; i < len; i++) {
        if (this.layers[i].type == "objectgroup") {
          if (groupName == null || groupName == this.layers[i].name) {
            //レイヤー情報をクローンする
            const obj = this._cloneObjectLayer(this.layers[i]);
            if (groupName !== null) return obj;
          }
          ls.push(obj);
        }
      }
      return ls;
    },

    //オブジェクトレイヤーをクローンして返す
    _cloneObjectLayer: function(srcLayer) {
      const result = {}.$safe(srcLayer);
      result.objects = [];
      //レイヤー内オブジェクトのコピー
      srcLayer.objects.forEach(function(obj){
        const resObj = {
          properties: {}.$safe(obj.properties),
        }.$extend(obj);
        if (obj.ellipse) resObj.ellipse = obj.ellipse;
        if (obj.gid) resObj.gid = obj.gid;
        if (obj.polygon) resObj.polygon = obj.polygon.clone();
        if (obj.polyline) resObj.polyline = obj.polyline.clone();
        result.objects.push(resObj);
      });
      return result;
    },

    _parse: function(data) {
      //タイル属性情報取得
      var map = data.getElementsByTagName('map')[0];
      var attr = this._attrToJSON(map);
      this.$extend(attr);
      this.properties = this._propertiesToJSON(map);

      //タイルセット取得
      this.tilesets = this._parseTilesets(data);

      //タイルセット情報補完
      var defaultAttr = {
        tilewidth: 32,
        tileheight: 32,
        spacing: 0,
        margin: 0,
      };
      this.tilesets.chips = [];
      for (var i = 0; i < this.tilesets.length; i++) {
        //タイルセット属性情報取得
        var attr = this._attrToJSON(data.getElementsByTagName('tileset')[i]);
        attr.$safe(defaultAttr);
        attr.firstgid--;
        this.tilesets[i].$extend(attr);

        //マップチップリスト作成
        var t = this.tilesets[i];
        this.tilesets[i].mapChip = [];
        for (var r = attr.firstgid; r < attr.firstgid+attr.tilecount; r++) {
          var chip = {
            image: t.image,
            x: ((r - attr.firstgid) % t.columns) * (t.tilewidth + t.spacing) + t.margin,
            y: Math.floor((r - attr.firstgid) / t.columns) * (t.tileheight + t.spacing) + t.margin,
          }.$safe(attr);
          this.tilesets.chips[r] = chip;
        }
      }

      //レイヤー取得
      this.layers = this._parseLayers(data);

      //イメージデータ読み込み
      this._checkImage();
    },

    //アセットに無いイメージデータを読み込み
    _checkImage: function() {
      var that = this;
      var imageSource = [];
      var loadImage = [];

      //一覧作成
      for (var i = 0; i < this.tilesets.length; i++) {
        var obj = {
          image: this.tilesets[i].image,
          transR: this.tilesets[i].transR,
          transG: this.tilesets[i].transG,
          transB: this.tilesets[i].transB,
        };
        imageSource.push(obj);
      }
      for (var i = 0; i < this.layers.length; i++) {
        if (this.layers[i].image) {
          var obj = {
            image: this.layers[i].image.source
          };
          imageSource.push(obj);
        }
      }

      //アセットにあるか確認
      for (var i = 0; i < imageSource.length; i++) {
        var image = phina.asset.AssetManager.get('image', imageSource[i].image);
        if (image) {
          //アセットにある
        } else {
          //なかったのでロードリストに追加
          loadImage.push(imageSource[i]);
        }
      }

      //一括ロード
      //ロードリスト作成
      var assets = {
        image: []
      };
      for (var i = 0; i < loadImage.length; i++) {
        //イメージのパスをマップと同じにする
        assets.image[imageSource[i].image] = this.path+imageSource[i].image;
      }
      if (loadImage.length) {
        var loader = phina.asset.AssetLoader();
        loader.load(assets);
        loader.on('load', function(e) {
          //透過色設定反映
          loadImage.forEach(function(elm) {
            var image = phina.asset.AssetManager.get('image', elm.image);
            if (elm.transR !== undefined) {
              var r = elm.transR, g = elm.transG, b = elm.transB;
              image.filter(function(pixel, index, x, y, bitmap) {
                var data = bitmap.data;
                if (pixel[0] == r && pixel[1] == g && pixel[2] == b) {
                    data[index+3] = 0;
                }
              });
            }
          });
          //マップイメージ生成
          that.image = that._generateImage();
          //読み込み終了
          that._resolve(that);
        }.bind(this));
      } else {
        //マップイメージ生成
        this.image = that._generateImage();
        //読み込み終了
        this._resolve(that);
      }
    },

    //マップイメージ作成
    _generateImage: function(layerName) {
      var numLayer = 0;
      for (var i = 0; i < this.layers.length; i++) {
        if (this.layers[i].type == "layer" || this.layers[i].type == "imagelayer") numLayer++;
      }
      if (numLayer == 0) return null;

      var width = this.width * this.tilewidth;
      var height = this.height * this.tileheight;
      var canvas = phina.graphics.Canvas().setSize(width, height);

      for (var i = 0; i < this.layers.length; i++) {
        //マップレイヤー
        if (this.layers[i].type == "layer" && this.layers[i].visible != "0") {
          if (layerName === undefined || layerName === this.layers[i].name) {
            var layer = this.layers[i];
            var mapdata = layer.data;
            var width = layer.width;
            var height = layer.height;
            var opacity = layer.opacity || 1.0;
            var count = 0;
            for (var y = 0; y < height; y++) {
              for (var x = 0; x < width; x++) {
                var index = mapdata[count];
                if (index !== -1) {
                  //マップチップを配置
                  this._setMapChip(canvas, index, x * this.tilewidth, y * this.tileheight, opacity);
                }
                count++;
              }
            }
          }
        }
        //オブジェクトグループ
        if (this.layers[i].type == "objectgroup" && this.layers[i].visible != "0") {
          if (layerName === undefined || layerName === this.layers[i].name) {
            var layer = this.layers[i];
            var opacity = layer.opacity || 1.0;
            layer.objects.forEach(function(e) {
              if (e.gid) {
                this._setMapChip(canvas, e.gid, e.x, e.y, opacity);
              }
            }.bind(this));
          }
        }
        //イメージレイヤー
        if (this.layers[i].type == "imagelayer" && this.layers[i].visible != "0") {
          if (layerName === undefined || layerName === this.layers[i].name) {
            var len = this.layers[i];
            var image = phina.asset.AssetManager.get('image', this.layers[i].image.source);
            canvas.context.drawImage(image.domElement, this.layers[i].x, this.layers[i].y);
          }
        }
      }

      var texture = phina.asset.Texture();
      texture.domElement = canvas.domElement;
      return texture;
    },

    //キャンバスの指定した座標にマップチップのイメージをコピーする
    _setMapChip: function(canvas, index, x, y, opacity) {
      //タイルセットからマップチップを取得
      var chip = this.tilesets.chips[index];
      var image = phina.asset.AssetManager.get('image', chip.image);
      canvas.context.drawImage(
        image.domElement,
        chip.x + chip.margin, chip.y + chip.margin,
        chip.tilewidth, chip.tileheight,
        x, y,
        chip.tilewidth, chip.tileheight);
    },

    //XMLプロパティをJSONに変換
    _propertiesToJSON: function(elm) {
      var properties = elm.getElementsByTagName("properties")[0];
      var obj = {};
      if (properties === undefined) return obj;

      for (var k = 0; k < properties.childNodes.length; k++) {
        var p = properties.childNodes[k];
        if (p.tagName === "property") {
          //propertyにtype指定があったら変換
          var type = p.getAttribute('type');
          var value = p.getAttribute('value');
          if (!value) value = p.textContent;
          if (type == "int") {
            obj[p.getAttribute('name')] = parseInt(value, 10);
          } else if (type == "float") {
            obj[p.getAttribute('name')] = parseFloat(value);
          } else if (type == "bool" ) {
            if (value == "true") obj[p.getAttribute('name')] = true;
            else obj[p.getAttribute('name')] = false;
          } else {
            obj[p.getAttribute('name')] = value;
          }
        }
      }
      return obj;
    },

    //XML属性をJSONに変換
    _attrToJSON: function(source) {
      var obj = {};
      for (var i = 0; i < source.attributes.length; i++) {
        var val = source.attributes[i].value;
        val = isNaN(parseFloat(val))? val: parseFloat(val);
        obj[source.attributes[i].name] = val;
      }
      return obj;
    },

    //XML属性をJSONに変換（Stringで返す）
    _attrToJSON_str: function(source) {
      var obj = {};
      for (var i = 0; i < source.attributes.length; i++) {
        var val = source.attributes[i].value;
        obj[source.attributes[i].name] = val;
      }
      return obj;
    },

    //タイルセットのパース
    _parseTilesets: function(xml) {
      var each = Array.prototype.forEach;
      var self = this;
      var data = [];
      var tilesets = xml.getElementsByTagName('tileset');
      each.call(tilesets, function(tileset) {
        var t = {};
        var props = self._propertiesToJSON(tileset);
        if (props.src) {
          t.image = props.src;
        } else {
          t.image = tileset.getElementsByTagName('image')[0].getAttribute('source');
        }
        //透過色設定取得
        t.trans = tileset.getElementsByTagName('image')[0].getAttribute('trans');
        if (t.trans) {
          t.transR = parseInt(t.trans.substring(0, 2), 16);
          t.transG = parseInt(t.trans.substring(2, 4), 16);
          t.transB = parseInt(t.trans.substring(4, 6), 16);
        }

        data.push(t);
      });
      return data;
    },

    //レイヤー情報のパース
    _parseLayers: function(xml) {
      var each = Array.prototype.forEach;
      var data = [];

      var map = xml.getElementsByTagName("map")[0];
      var layers = [];
      each.call(map.childNodes, function(elm) {
        if (elm.tagName == "layer" || elm.tagName == "objectgroup" || elm.tagName == "imagelayer") {
          layers.push(elm);
        }
      });

      layers.each(function(layer) {
        switch (layer.tagName) {
          case "layer":
            //通常レイヤー
            var d = layer.getElementsByTagName('data')[0];
            var encoding = d.getAttribute("encoding");
            var l = {
                type: "layer",
                name: layer.getAttribute("name"),
            };

            if (encoding == "csv") {
                l.data = this._parseCSV(d.textContent);
            } else if (encoding == "base64") {
                l.data = this._parseBase64(d.textContent);
            }

            var attr = this._attrToJSON(layer);
            l.$extend(attr);
            l.properties = this._propertiesToJSON(layer);

            data.push(l);
            break;

          //オブジェクトレイヤー
          case "objectgroup":
            var l = {
              type: "objectgroup",
              objects: [],
              name: layer.getAttribute("name"),
              x: parseFloat(layer.getAttribute("offsetx")) || 0,
              y: parseFloat(layer.getAttribute("offsety")) || 0,
              alpha: layer.getAttribute("opacity") || 1,
              color: layer.getAttribute("color") || null,
              draworder: layer.getAttribute("draworder") || null,
            };
            each.call(layer.childNodes, function(elm) {
              if (elm.nodeType == 3) return;
              var d = this._attrToJSON(elm);
              d.properties = this._propertiesToJSON(elm);
              //子要素の解析
              if (elm.childNodes.length) {
                elm.childNodes.forEach(function(e) {
                  if (e.nodeType == 3) return;
                  //楕円
                  if (e.nodeName == 'ellipse') {
                    d.ellipse = true;
                  }
                  //多角形
                  if (e.nodeName == 'polygon') {
                    d.polygon = [];
                    var attr = this._attrToJSON_str(e);
                    var pl = attr.points.split(" ");
                    pl.forEach(function(str) {
                      var pts = str.split(",");
                      d.polygon.push({x: parseFloat(pts[0]), y: parseFloat(pts[1])});
                    });
                  }
                  //線分
                  if (e.nodeName == 'polyline') {
                    d.polyline = [];
                    var attr = this._attrToJSON_str(e);
                    var pl = attr.points.split(" ");
                    pl.forEach(function(str) {
                      var pts = str.split(",");
                      d.polyline.push({x: parseFloat(pts[0]), y: parseFloat(pts[1])});
                    });
                  }
                }.bind(this));
              }
              l.objects.push(d);
            }.bind(this));
            l.properties = this._propertiesToJSON(layer);

            data.push(l);
            break;

          //イメージレイヤー
          case "imagelayer":
              var l = {
                type: "imagelayer",
                name: layer.getAttribute("name"),
                x: parseFloat(layer.getAttribute("offsetx")) || 0,
                y: parseFloat(layer.getAttribute("offsety")) || 0,
                alpha: layer.getAttribute("opacity") || 1,
                visible: (layer.getAttribute("visible") === undefined || layer.getAttribute("visible") != 0),
              };
              var imageElm = layer.getElementsByTagName("image")[0];
              l.image = {source: imageElm.getAttribute("source")};

              data.push(l);
              break;
        }
      }.bind(this));
      return data;
    },

    //CSVパース
    _parseCSV: function(data) {
      var dataList = data.split(',');
      var layer = [];

      dataList.each(function(elm, i) {
        var num = parseInt(elm, 10) - 1;
        layer.push(num);
      });

      return layer;
    },

    /**
     * BASE64パース
     * http://thekannon-server.appspot.com/herpity-derpity.appspot.com/pastebin.com/75Kks0WH
     * @private
     */
    _parseBase64: function(data) {
      var dataList = atob(data.trim());
      var rst = [];

      dataList = dataList.split('').map(function(e) {
        return e.charCodeAt(0);
      });

      for (var i = 0, len = dataList.length / 4; i < len; ++i) {
        var n = dataList[i*4];
        rst[i] = parseInt(n, 10) - 1;
      }

      return rst;
    },
  });

  //ローダーに追加
  phina.asset.AssetLoader.assetLoadFunctions.tmx = function(key, path) {
    var tmx = phina.asset.TiledMap();
    return tmx.load(path);
  };

});
//
// 汎用関数群
//
phina.define("Util", {
  _static: {

    //指定されたオブジェクトをルートとして目的のidを走査する
    findById: function(id, obj) {
      if (obj.id === id) return obj;
      const children = Object.keys(obj.children || {}).map(key => obj.children[key]);
      for (let i = 0; i < children.length; i++) {
        const hit = this.findById(id, children[i]);
        if (hit) return hit;
      }
      return null;
    },

    //TODO:ここじゃない感があるのですが、一旦実装
    //指定されたAとBのassetsの連想配列を新規のオブジェクトにマージする
    mergeAssets: function(assetsA, assetsB) {
      const result = {};
      assetsA.forIn((typeKey, typeValue) => {
        if (!result.$has(typeKey)) result[typeKey] = {};
        typeValue.forIn((assetKey, assetPath) => {
          result[typeKey][assetKey] = assetPath;
        });
      });
      assetsB.forIn((typeKey, typeValue) => {
        if (!result.$has(typeKey)) result[typeKey] = {};
        typeValue.forIn((assetKey, assetPath) => {
          result[typeKey][assetKey] = assetPath;
        });
      });
      return result;
    },

    //現在時間から指定時間までどのくらいかかるかを返却する
    //
    // output : { 
    //   totalDate:0 , 
    //   totalHour:0 , 
    //   totalMinutes:0 , 
    //   totalSeconds:0 ,
    //   date:0 , 
    //   hour:0 , 
    //   minutes:0 , 
    //   seconds:0 
    // }
    //

    calcRemainingTime: function(finish) {
      const now = new Date();
      const result = {
        "totalDate": 0,
        "totalHour": 0,
        "totalMinutes": 0,
        "totalSeconds": 0,
        "date": 0,
        "hour": 0,
        "minutes": 0,
        "seconds": 0,
      }

      finish = (finish instanceof Date) ? finish : new Date(finish);
      let diff = finish - now;
      if (diff === 0) return result;

      const sign = (diff < 0) ? -1 : 1;

      //TODO:この辺りもう少し綺麗に書けないか検討
      //単位別 1未満は0
      result["totalDate"] = parseInt(diff / 1000 / 60 / 60 / 24);
      result["totalHour"] = parseInt(diff / 1000 / 60 / 60);
      result["totalMinutes"] = parseInt(diff / 1000 / 60);
      result["totalSeconds"] = parseInt(diff / 1000);

      diff -= result["totalDate"] * 86400000;
      result["hour"] = parseInt(diff / 1000 / 60 / 60);

      diff -= result["hour"] * 3600000;
      result["minutes"] = parseInt(diff / 1000 / 60);

      diff -= result["minutes"] * 60000;
      result["seconds"] = parseInt(diff / 1000);

      return result;

    },

    //レイアウトエディターではSprite全てAtalsSpriteになってしまうため、
    //Spriteに差し替えられるようにする

    //AtlasSprite自身に単発のImageをセットできるようにする？
    //あとでなにかしら対策しないとだめだが３月納品では一旦これで
    replaceAtlasSpriteToSprite: function(parent, atlasSprite, sprite) {
      const index = parent.getChildIndex(atlasSprite);
      sprite.setOrigin(atlasSprite.originX, atlasSprite.originY);
      sprite.setPosition(atlasSprite.x, atlasSprite.y);
      parent.addChildAt(sprite, index);
      atlasSprite.remove();
      return sprite;
    },
  }
});

//
// 基礎シーンクラス
//
phina.define("BaseScene", {
  superClass: "DisplayScene",

  footer: null,

  init: function(options) {
    // console.log("#BaseScene" , "init");

    this.superInit();
    this.backgroundColor = "white";

    if (!phina.isMobile()) this.on("enterframe", (e) => this.flare("mousemove", { app: e.app }));

    this.one('destroy', () => this.canvas.destroy());
  },

  onenter: function(e) {
    // console.log("#BaseScene" , "onenter");
    this._playBgm();
    this._setupFooter();
    this.flare("ready", { app: e.app });
    this._addFooter();
  },

  //シーン開始エフェクト 
  begin: function(type, options) {
    options = ({}).$safe(options, {
      color: "white",
      time: 100
    });
    const effect = this._setup(type, options);
    return Promise.resolve()
      .then(effect.begin())
  },

  //シーン終了エフェクト
  finish: function(type, options) {
    options = ({}).$safe(options, {
      color: "white",
      time: 100
    });
    const effect = this._setup(type, options);
    return effect.finish();
  },

  _setup: function(type, options) {
    options = options || {};
    switch (type) {
      case "fade":
        return SceneEffectFade(options).addChildTo(this);
      default:
        return SceneEffectNone(options).addChildTo(this);
    }
  },

  // ================================================================
  // Promiseを用いたウェイト処理
  playWait: function(wait) {
    return new Promise(resolve => {
      const twWait = Tweener().attachTo(this);
      twWait.wait(wait).call(() => {
        this.detach(twWait);
        resolve();
      });
    });
  },

  _render: function() {
    this.renderer.render(this, 1.0);
  },

});

//
// シーンエフェクトの基礎クラス
//
phina.define("SceneEffectBase", {
  superClass: "InputIntercept",

  init: function() {
    this.superInit();
    this.enable();
  },

});

//
// シーンエフェクト：複数の円でフェードインアウト
//
phina.define("SceneEffectCircleFade", {
  superClass: "SceneEffectBase",

  init: function(options) {
    this.options = ({}).$safe(options, SceneEffectCircleFade.defaults);

    this.superInit();
  },

  _createCircle: function() {
    const num = 5;
    const width = SCREEN_WIDTH / num;
    return Array.range((SCREEN_HEIGHT / width) + 1).map(y => {
      return Array.range(num + 1).map(x => {
        return this.addChild(CircleShape({
          x: x * width,
          y: y * width,
          fill: this.options.color,
          stroke: null,
          radius: width * 0.5,
        }));
      });
    });
  },

  begin: function() {
    const circles = this._createCircle();
    const tasks = [];
    circles.forEach((xLine, y) => {
      xLine.forEach((circle, x) => {
        circle.scaleX = 0;
        circle.scaleY = 0;
        tasks.push(new Promise(resolve => {
          circle.tweener.clear()
            .to({
              scaleX: 1.5,
              scaleY: 1.5
            }, 500, "easeOutQuad")
            .call(() => {
              circle.remove();
              circle.destroyCanvas();
              this.children.clear();
              this.disable();
              resolve()
            });
        }));
      });
    });
    return Promise.all(tasks);
  },

  finish: function() {
    this.children.clear();

    const circles = this._createCircle();
    const tasks = [];
    circles.forEach(xLine => {
      xLine.forEach(circle => {
        circle.scaleX = 1.5;
        circle.scaleY = 1.5;
        tasks.push(new Promise(resolve => {
          circle.tweener.clear()
            .to({
              scaleX: 0,
              scaleY: 0
            }, 500, "easeOutQuad")
            .call(() => {
              circle.remove();
              circle.destroyCanvas();
              this.children.clear();
              this.disable();
              resolve();
            });
        }));
      });
    });
    return Promise.all(tasks);
  },

  _static: {
    defaults: {
      color: "white",
    }
  }

});

//
// シーンエフェクト：フェードインアウト
//
phina.define("SceneEffectFade", {
  superClass: "SceneEffectBase",

  init: function(options) {
    this.options = ({}).$safe(options, {
      color: "black",
      time: 500,
    });

    this.superInit();
    this.fromJSON({
      children: {
        fade: {
          className: "RectangleShape",
          arguments: {
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
            fill: this.options.color,
            stroke: null,
            padding: 0,
          },
          x: SCREEN_WIDTH * 0.5,
          y: SCREEN_HEIGHT * 0.5,
        },
      }
    });
  },

  stay: function() {
    const fade = this.fade;
    fade.alpha = 1.0;
    return Promise.resolve();
  },

  begin: function() {
    return new Promise(resolve => {
      const fade = this.fade;
      fade.alpha = 1.0;
      fade.tweener.clear()
        .fadeOut(this.options.time)
        .call(() => {
          //1Frame描画されてしまってちらつくのでenterframeで削除
          this.one("enterframe", () => {
            this.fade.remove();
            this.fade.destroyCanvas();
            this.remove()
          });
          resolve();
        });
    });
  },

  finish: function() {
    return new Promise(resolve => {
      const fade = this.fade;
      fade.alpha = 0.0;
      fade.tweener.clear()
        .fadeIn(this.options.time)
        .call(() => {
          this.flare("finish");
          //1Frame描画されてしまってちらつくのでenterframeで削除
          this.one("enterframe", () => {
            this.fade.remove();
            this.fade.destroyCanvas();
            this.remove()
          });
          resolve();
        });
    });
  },

  _static: {
    defaults: {
      color: "black",
    }
  }

});

//
// シーンエフェクト：なにもしない
//
phina.define("SceneEffectNone", {
  superClass: "SceneEffectBase",

  init: function() {
    this.superInit();
  },

  begin: function() {
    return new Promise(resolve => {
      this.one("enterframe", () => this.remove());
      resolve();
    });
  },

  finish: function() {
    return new Promise(resolve => {
      this.one("enterframe", () => this.remove());
      resolve();
    });
  }

});

//
// シーンエフェクト：タイルフェード
//
phina.define("SceneEffectTileFade", {
  superClass: "SceneEffectBase",

  tiles: null,
  num: 15,
  speed: 50,

  init: function(options) {
    this.superInit();
    this.options = ({}).$safe(options, {
      color: "black",
      width: 768,
      height: 1024,
    });

    this.tiles = this._createTiles();
  },

  _createTiles: function() {
    const width = Math.floor(this.options.width / this.num);

    return Array.range((this.options.height / width) + 1).map(y => {
      return Array.range(this.num + 1).map(x => {
        return this.addChild(RectangleShape({
          width: width + 2,
          height: width + 2,
          x: x * width,
          y: y * width,
          fill: this.options.color,
          stroke: null,
          strokeWidth: 0,
        }));
      });
    });
  },

  stay: function() {
    this.tiles.forEach((xline, y) => {
      xline.forEach((tile, x) => {
        tile.scaleX = 1.0;
        tile.scaleY = 1.0;
      });
    });
    return Promise.resolve();
  },

  begin: function() {
    const tasks = [];
    this.tiles.forEach((xline, y) => {
      const w = Math.randfloat(0, 1) * this.speed;
      xline.forEach((tile, x) => {
        tile.scaleX = 1.0;
        tile.scaleY = 1.0;
        tasks.push(new Promise(resolve => {
          tile.tweener.clear()
            .wait(x * this.speed + w)
            .to({
              scaleX: 0,
              scaleY: 0
            }, 500, "easeOutQuad")
            .call(() => {
              tile.remove();
              tile.destroyCanvas();
              resolve()
            });
        }));
      });
    });
    return Promise.all(tasks)
  },

  finish: function() {
    const tasks = [];
    this.tiles.forEach((xline, y) => {
      const w = Math.randfloat(0, 1) * this.speed;
      xline.forEach((tile, x) => {
        tile.scaleX = 0.0;
        tile.scaleY = 0.0;
        tasks.push(new Promise(resolve => {
          tile.tweener.clear()
            .wait((xline.length - x) * this.speed + w)
            .to({
              scaleX: 1,
              scaleY: 1
            }, 500, "easeOutQuad")
            .call(() => {
              tile.remove();
              tile.destroyCanvas();
              resolve()
            });
        }));
      });
    });
    return Promise.all(tasks)
  },

  _static: {
    defaults: {
      color: "black",
    }
  }

});

//
// APIリクエスト時やなにか時間のかかる処理用のプログレス画面（仮）
//
phina.define("ConnectionProgress", {
  superClass: "Modal",
  init: function(options) {
    this.superInit();
    this.options = ({}).$safe(options || {}, ConnectionProgress.defaults);

    this.setup();
  },

  setup: function() {
    this.layout = AssetManager.get("layout", "connectionProgress").build().addChildTo(this);
    this.alpha = 0;
    this.setupLoadingAnimation();
  },

  setupLoadingAnimation: function() {
    const loading = this.layout.ref["loading"];

    const task = Array.range(0, 13).map(i => {
      const key = "c" + i;
      const oy = loading[key].y;
      return new Promise(resolve => {
        loading[key].tweener.clear()
          .wait(i * 150)
          .to({
            y: oy - 10
          }, 150, "easeInQuad")
          .to({
            y: oy
          }, 150, "easeOutQuad")
          .call(() => resolve());
      });
    });

    Promise.all(task)
      .then(() => {
        this.setupLoadingAnimation();
      })
  },

  //表示アニメーション
  openAnimation: function() {
    return new Promise(resolve => {
      this.alpha = 0;
      this.tweener.clear()
        .fadeIn(250)
        .call(() => resolve());
    });
  },

  //非表示アニメーション
  closeAnimation: function() {
    return new Promise(resolve => {
      this.alpha = 1;
      this.tweener.clear()
        .fadeOut(250)
        .call(() => {
          this.remove();
          resolve();
        });
    });
  },

  //待機アニメーション
  //TODO:デザインがないのでとりあえず...
  idleAnimation: function() {
    return new Promise(resolve => {
      // this.label.dotCount = 0;
      // this.label.tweener.clear()
      //   .to({ dotCount: 5 }, 2000)
      //   .wait(200)
      //   .set({ dotCount: 0 })
      //   .setLoop(true);
      // this.label.on("enterframe", () => {
      //   this.label.text = this.options.text + Array.range(Math.floor(this.label.dotCount)).map(() => ".").join("");
      // });
      resolve();
    });
  },

  _static: {

    instance: null,

    open: function(scene) {
      //シーンが存在しない場合は即座に完了にする
      if (!scene) {
        return Promise.resolve();
      }

      //すでにインスタンスが存在する場合には閉じておく
      if (this.instance) {
        this.instance.close();
        this.instance = null;
      }
      //新しく追加して表示
      this.instance = ConnectionProgress().addChildTo(scene);
      return this.instance.open().then(this.instance.idleAnimation());
    },

    close: function() {
      if (!this.instance) return Promise.resolve();
      return this.instance.close().then(() => this.instance = null);
    },

    defaults: {
      text: "読み込み中",
    },
  }

});

phina.namespace(function() {

  const PADDING = 20;

  phina.define("Dialog", {
    superClass: "Modal",

    init: function(options) {
      this.superInit();
      options = options || {};
      this.size = options.size || Dialog.SIZE.S;

      console.log("size:" + this.size);

      this.fromJSON({
        children: {
          background: {
            className: "RectangleShape",
            arguments: {
              width: SCREEN_WIDTH,
              height: SCREEN_HEIGHT,
              stroke: null,
              fill: "#00000099"
            },
            x: SCREEN_WIDTH * 0.5,
            y: SCREEN_HEIGHT * 0.5,
          },
        }
      });

      // this.layout = AssetManager.get("layout", `dialog_${this.size}`)
      this.layout = AssetManager.get("layout", "dialog_frame")
        .build()
        .addChildTo(this);

      this.updateSize();
      this.setupButtons();
    },

    updateSize: function() {
      const dialog = this.layout.dialog;
      Dialog.SIZE.forIn((size) => {
        dialog[Dialog.SIZE[size]].sleep().hide()
      })
      this.dialog.wakeUp().show();
    },

    setupButtons: function() {
      const buttonLayout = AssetManager.get("layout", "dialog_buttons").build();
      const data = buttonLayout.layoutAsset.data;
      this._buttonJSONs = buttonLayout.layoutAsset.data.root.children;
    },

    setTitle: function(title) {
      this.title.text = title;
    },

    addButton: function(label, color, options) {
      options = options || {};

      this.buttons.fromJSON({
        children: [this._buttonJSONs[`${color}_m`]],
      });

      const button = this.buttons.children.last;

      button.Button = Button().attachTo(button);
      button.label.text = button.label_2.text = label;
      button.label.fontSize = button.label_2.fontSize = (!options.fontSize) ? button.label.fontSize : options.fontSize;
      button.position = Vector2(0, 0);
      button.hogeId = this.buttons.children.length;

      let width = this.buttons.children.reduce((w, elm) => {
        return w += elm.width + PADDING;
      }, 0);

      let left = (this.buttons.width - width) * 0.5 - (this.buttons.width * 0.5);

      this.buttons.children.forEach((elm) => {
        elm.x = left + (elm.width + PADDING) * 0.5;
        left = elm.right + PADDING * 0.5;
      });

      //this.buttons.children.forEach(e => console.log(e.position));

      return button;
    },

    //===================================
    //表示
    open: function() {
      return this.openAnimation();
    },

    //===================================
    //非表示
    close: function() {
      return this.closeAnimation();
    },

    //===================================
    //表示アニメーション
    openAnimation: function() {
      return Promise.all([
        new Promise(resolve => {
          this.background.alpha = 0;
          this.background.tweener.clear()
            .fadeIn(250)
            .call(() => resolve());
        }),
        new Promise(resolve => {
          this.layout.dialog.scaleX = 0.0;
          this.layout.dialog.scaleY = 0.0;
          this.layout.dialog.tweener.clear()
            .to({
              scaleX: 1.0,
              scaleY: 1.0
            }, 250, "easeInOutQuad")
            .call(() => {
              this.flare("opened", {
                dialog: this
              });
              resolve();
            });
        })
      ]);
    },

    //===================================
    //非表示アニメーション
    closeAnimation: function() {
      return Promise.all([
        new Promise(resolve => {
          this.background.alpha = 1;
          this.background.tweener.clear()
            .fadeOut(250)
            .call(() => resolve());
        }),
        new Promise(resolve => {
          this.layout.dialog.scaleX = 1.0;
          this.layout.dialog.scaleY = 1.0;
          this.layout.dialog.tweener.clear()
            .to({
              scaleX: 0.0,
              scaleY: 0.0
            }, 250, "easeInOutQuad")
            .call(() => {
              this.flare("closed", {
                dialog: this
              });
              resolve();
            });
        })
      ]).then(() => {
        this.remove();
        this.layout.destroy();
        delete this.layout;
        this.flare("destroy");
      });
    },

    _accessor: {
      contents: {
        get: function() {
          return this.layout.ref["contents"];
        }
      },
      dialog: {
        get: function() {
          return this.layout.dialog[this.size];
        }
      },
      title: {
        // get: function() { return this.layout.ref["title"].label; }
        get: function() {
          return this.dialog.label;
        }
      },
      buttons: {
        // get: function() { return this.layout.ref["buttons"]; }
        get: function() {
          return this.dialog.buttons;
        }
      },
    },

    _static: {
      SIZE: {
        XS: "xs", //486x307  
        S: "s", //486x396  
        M: "m", //486x466  
        L: "l", //486x586  
        XL: "xl", //546x596  
        XXL: "xxl", //546x726  
        XXXL: "xxxl" //546x956  
      },
      BUTTON_COLOR: {
        RED: "red",
        // GREEN: "green",
        BLUE: "blue",
        WHITE: "white",
      },

      open: function(scene, size, setupFunction) {
        const dialog = Dialog({
          size
        }).addChildTo(scene);

        setupFunction(dialog);
        dialog.open();

        // こうしたいが、1Frame遅れてちらつく
        // Promise.resolve()
        //   .then(() => setupFunction(dialog))
        //   .then(() => dialog.open())

        return dialog;
      },

    }
  });
});

/**
 * DomButton
 * elementにかぶせる形でDOMボタンを作成します。
 * 
 * Paramater
 * app      CanvasApp
 * element  かぶせる対象element
 * func     クリックされた時に実行される関数
 */

phina.namespace(() => {
  phina.define("DomButton", {
    superClass: "DisplayElement",

    init: function(app, element) {
      this.superInit();

      this.app = app;

      this.btn = null;
      this.setup(element);
    },

    setup: function(element) {
      if (this.btn) {
        document.body.removeChild(this.btn);
        // this.btn.remove();
      }

      this.btn = document.createElement("button");
      this.btn.id = "btn"
      this.btn.style.position = "absolute";
      this.btn.style.display = "none";
      this.btn.style.padding = "0px";
      this.btn.style.borderWidth = "0px";

      this.btn.style.filter = 'alpha(opacity=0)';
      this.btn.style.MozOpacity = 0.0;
      this.btn.style.opacity = 0.0;

      document.body.appendChild(this.btn);

      this.btn.onclick = () => {
        element.flare('clicked');
        this.flare('clicked');
      };

      this.on('enterframe', () => {
        if (!this.btn) return;
        const scale = parseInt(this.app.domElement.style.width) / this.app.domElement.width * this.app.quality;
        const width = element.width * scale;
        const height = element.height * scale;

        let canvasLeft = parseInt(this.app.domElement.style.left);
        let canvasTop = parseInt(this.app.domElement.style.top);
        //自身のグローバル座標に合わせる
        canvasLeft += element._worldMatrix.m02 * scale;
        canvasTop += element._worldMatrix.m12 * scale;
        canvasLeft += -element.originX * width;
        canvasTop += -element.originY * height;

        this.btn.style.display = "";
        this.btn.style.width = `${width}px`;
        this.btn.style.height = `${height}px`;
        this.btn.style.left = `${canvasLeft}px`;
        this.btn.style.top = `${canvasTop}px`;
      });

    },

    onremoved: function() {
      if (!this.btn) return;
      document.body.removeChild(this.btn);
      // this.btn.remove();
      this.btn = null;
    },

  });
});

phina.namespace(() => {
  phina.define("DomVideo", {
    superClass: "DisplayElement",

    init: function(app, element) {
      this.superInit();
      this.app = app;
      this.video = null;
      this.setup(element);
    },

    setup: function(element) {
      if (this.video) {
        document.body.removeChild(this.video);
        // this.video.remove();
      }

      const video = this.video = document.createElement("video");
      video.id = "video";
      video.muted = true;

      video.style.position = "absolute";

      document.body.appendChild(video);

      this.on('enterframe', () => {
        if (!video) return;
        const scale = parseInt(this.app.domElement.style.width) / this.app.domElement.width * this.app.quality;
        const width = element.width * element.scaleX * scale;
        const height = element.height * element.scaleX * scale;

        let canvasLeft = parseInt(this.app.domElement.style.left);
        let canvasTop = parseInt(this.app.domElement.style.top);

        canvasLeft += element._worldMatrix.m02 * scale;
        canvasTop += element._worldMatrix.m12 * scale;
        canvasLeft += -element.originX * width;
        canvasTop += -element.originY * height;

        // video.style.display = "";
        video.style.width = `${width}px`;
        video.style.height = `${height}px`;
        video.style.left = `${canvasLeft}px`;
        video.style.top = `${canvasTop}px`;
      });
    },

    load: function(src) {
      this.video.src = src;
      this.video.onloadedmetadata = (() => {
        this.isLoaded = true;
        this.flare("loaded");
      });
      return this;
    },

    play: function() {
      this.video.currentTime = 0;
      this.video.play();
      this.flare("play")
    },

    onremoved: function() {
      if (!this.video) return;
      document.body.removeChild(this.video);
      // this.video.remove();
      this.video = null;
    },

  });
});

phina.namespace(function() {
  phina.define("DownloadProgress", {
    superClass: "Modal",
    assets: null,

    init: function(options) {
      this.superInit();
      this.assets = options.assets;
      this.setup();
    },

    setup: function() {
      this.gaugeFrame = RectangleShape({
        fill: "white",
        stroke: null,
        cornerRadius: 12,
        width: 512,
        height: 32,
        padding: 0,
        x: SCREEN_WIDTH * 0.5,
        y: 24
      }).addChildTo(this);

      console.log(this.gaugeFrame.originX, this.gaugeFrame.originY)

      this.gauge = RectangleShape({
        fill: "orange",
        stroke: null,
        cornerRadius: 12,
        width: 506,
        height: 26,
        padding: 0,
        x: -this.gaugeFrame.width * 0.5 + 3,
        y: 0,
      }).addChildTo(this.gaugeFrame);

      this.gauge.setOrigin(0, 0.5);

      this.gauge.Gauge = Gauge().attachTo(this.gauge);
      this.gauge.Gauge.min = 0.0;
      this.gauge.Gauge.max = 1.0;
      this.setProgress(0.0);
    },

    setProgress: function(progress) {
      this.gauge.Gauge.value = progress;
    },

    //表示アニメーション
    openAnimation: function() {
      return new Promise(resolve => {
        this.alpha = 0;
        this.tweener.clear()
          .fadeIn(250)
          .wait(250)
          .call(() => resolve());
      });
    },

    //非表示アニメーション
    closeAnimation: function() {
      return new Promise(resolve => {
        this.alpha = 1;
        this.tweener.clear()
          .wait(250)
          .fadeOut(250)
          .call(() => {
            this.remove();
            resolve();
          });
      });
    },

    //追加でアセットを読み込む
    startLoadAssets: function() {
      if (!this.assets) return Promise.resolve();
      return new Promise(resolve => {
        const loader = AssetLoader();
        loader.onload = () => resolve();
        loader.onprogress = (e) => this.setProgress(e.progress);
        loader.load(this.assets);
      });
    },

    _static: {

      instance: null,

      open: function(scene, pathPref, assets) {

        assets = DownloadProgress.yetLoadedAssets(
          Root.LoadingScene.combineAssetsPath(assets, pathPref)
        );

        //シーンが存在しない場合は即座に完了にする
        if (!scene || !assets) {
          return Promise.resolve();
        }

        //すでにインスタンスが存在する場合には閉じておく
        if (this.instance) {
          this.instance.close();
          this.instance = null;
        }

        //新しく追加して表示
        this.instance = DownloadProgress({ assets }).addChildTo(scene);
        return this.instance.open()
          .then(() => this.instance.startLoadAssets())
          .then(() => {
            this.instance.close()
            this.instance = null;
          })
      },

      yetLoadedAssets: function(assets) {
        if (!assets) return null;
        const yet = {};
        assets.forIn((type, data) => {
          data.forIn((key, value) => {
            if (!phina.asset.AssetManager.get(type, key)) {
              yet[type] = yet[type] || {};
              yet[type][key] = value;
            }
          });
        });
        return (Object.keys(yet).length > 0) ? yet : null;
      }

    }

  });
});

phina.namespace(() => {
  phina.define("InputField", {
    superClass: "DisplayElement",

    domElement: null,

    init: function(options) {
      this.options = ({}).$safe(options, InputField.defaults);
      this.superInit(options);

      this.domElement = document.createElement("input");
      this.domElement.type = "text";
      this.domElement.value = this.options.text;

      this.domElement.style.position = "absolute";
      this.domElement.style.display = "none";
      this.domElement.style.padding = "0px";
      this.domElement.style.borderWidth = "0px";
      document.body.appendChild(this.domElement);

      this.domElement.addEventListener("focus", () => {
        this.flare("focus");
      });

      this.domElement.addEventListener("focusout", () => {
        this.flare("focusout");
      });

      this.domElement.addEventListener("keyup", () => {
        this.flare("change");
      });

      //TODO:appの参照方法で他に良い方法があれば変更する
      this.one("enterframe", (e) => {
        this.app = e.app;
        this.setup();
      });
    },

    setup: function() {
      this.on("enterframe", () => {
        const scale = parseInt(this.app.domElement.style.width) / this.app.domElement.width * this.app.quality;

        let fontSize = (this.options.fontSize * scale).round();
        //キャンバスの左上に合わせる
        let width = this.width * scale;
        let height = this.height * scale;
        let canvasLeft = parseInt(this.app.domElement.style.left);
        let canvasTop = parseInt(this.app.domElement.style.top);

        //自身のグローバル座標に合わせる
        canvasLeft += this._worldMatrix.m02 * scale;
        canvasTop += this._worldMatrix.m12 * scale;
        //originの調整
        canvasLeft += -this.originX * width;
        canvasTop += -this.originY * height;

        this.domElement.style.display = "";
        this.domElement.style.width = `${width}px`;
        this.domElement.style.height = `${height}px`;
        this.domElement.style.left = `${canvasLeft}px`;
        this.domElement.style.top = `${canvasTop}px`;
        this.domElement.style.fontSize = `${fontSize}px`;
        this.domElement.style.fontFamiliy = "Main-Bold";
      });
    },

    setVisible: function(flag) {
      this.visible = flag;
      if (this.domElement) {
        this.domElement.style.display = (flag) ? "" : "none";
      }
      return this;
    },

    show: function() {
      this.setVisible(true);
      return this;
    },

    hide: function() {
      this.setVisible(false);
      return this;
    },

    addCSS: function(css) {
      if (css instanceof Array) {
        css.forEach((c) => {
          this.domElement.classList.add(c);
        });
      } else {
        if (this.domElement) {
          this.domElement.classList.add(css);
        }
      }
      return this;
    },

    removeCSS: function(css) {
      if (css instanceof Array) {
        css.forEach((c) => {
          this.domElement.classList.remove(c);
        });
      } else {
        if (this.domElement) {
          this.domElement.classList.remove(css);
        }
      }
      return this;
    },

    onremoved: function() {
      if (this.domElement) {
        this.domElement.remove();
      }
    },

    _accessor: {
      text: {
        "get": function() {
          return (this.domElement) ? this.domElement.value : "";
        },
        "set": function(v) {
          if (!this.domElement) return;
          this.domElement.value = v;
        }
      }
    },

    _static: {
      defaults: {
        width: 200,
        height: 40,
        fontSize: 20,
        text: "",
      }
    },
  });
});

//
// クリックやタッチをインターセプトする
//
phina.define("InputIntercept", {
  superClass: "DisplayElement",

  init: function() {
    this.superInit();

    this.on("added", () => {
      //親に対して覆いかぶせる
      this.width = this.parent.width;
      this.height = this.parent.height;
      this.originX = this.parent.originX || 0;
      this.originY = this.parent.originY || 0;
      this.x = 0;
      this.y = 0;
    });
    this.disable();
  },

  enable: function() {
    this.setInteractive(true);
  },

  disable: function() {
    this.setInteractive(false);
  },

});

phina.define("Modal", {
  superClass: "InputIntercept",

  init: function() {
    this.superInit();
    this.enable();
  },
  //===================================
  //表示アニメーション
  // アニメーションについては継承元で再定義
  openAnimation: function() {
    return Promise.resolve();
  },

  //===================================
  //非表示アニメーション
  // アニメーションについては継承元で再定義
  closeAnimation: function() {
    return Promise.resolve();
  },

  //===================================
  //表示
  open: function() {
    return this.openAnimation();
  },

  //===================================
  //非表示
  close: function() {
    return this.closeAnimation();
  }

});

phina.namespace(function() {

  let dummyTexture = null;

  phina.define("SpriteLabel", {
    superClass: "DisplayElement",

    _text: null,
    table: null,
    fixWidth: 0,

    sprites: null,

    init: function(options) {
      if (!dummyTexture) {
        dummyTexture = Canvas().setSize(1, 1);
      }

      this.superInit(options);
      this.table = options.table;
      this.fixWidth = options.fixWidth || 0;

      this.sprites = [];

      this.setText("");
    },

    setText: function(text) {
      this._text = text;

      const chars = this.text.split("");

      if (this.sprites.length < chars.length) {
        Array.range(0, this.sprites.length - chars.length).forEach(() => {
          this.sprites.push(Sprite(dummyTexture));
        });
      } else {
        Array.range(0, chars.length - this.sprites.length).forEach(() => {
          this.sprites.last.remove();
          this.sprites.length -= 1;
        });
      }

      this._text.split("").map((c, i) => {
        this.sprites[i]
          .setImage(this.table[c])
          .setOrigin(this.originX, this.originY)
          .addChildTo(this);
      });

      const totalWidth = this.sprites.reduce((w, s) => w + (this.fixWidth || s.width), 0);
      const totalHeight = this.sprites.map(_ => _.height).sort().last;

      let x = totalWidth * -this.originX;
      this.sprites.forEach((s) => {
        const width = this.fixWidth || s.width;
        s.x = x + width * s.originX;
        x += width;
      });

      return this;
    },

    _accessor: {
      text: {
        get: function() {
          return this._text;
        },
        set: function(v) {
          this.setText(v);
        },
      },
    },

  });

});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCIwMTBfYXBwbGljYXRpb24vQXBwbGljYXRpb24uanMiLCIwMTBfYXBwbGljYXRpb24vQXNzZXRMaXN0LmpzIiwiMDEwX2FwcGxpY2F0aW9uL0Jhc2VTY2VuZS5qcyIsIjAxMF9hcHBsaWNhdGlvbi9GaXJzdFNjZW5lRmxvdy5qcyIsIjAyMF9zY2VuZS9NYWluU2NlbmUuanMiLCIwMjBfc2NlbmUvVGl0bGVTY2VuZS5qcyIsIjAzMF9lbGVtZW50L0FjdG9yLmpzIiwiMDMwX2VsZW1lbnQvV29ybGQuanMiLCIwMDBfY29tbW9uL2FjY2Vzc29yeS9CdXR0b24uanMiLCIwMDBfY29tbW9uL2FjY2Vzc29yeS9DbGlwU3ByaXRlLmpzIiwiMDAwX2NvbW1vbi9hY2Nlc3NvcnkvR2F1Z2UuanMiLCIwMDBfY29tbW9uL2FjY2Vzc29yeS9HcmF5c2NhbGUuanMiLCIwMDBfY29tbW9uL2FjY2Vzc29yeS9MaXN0Vmlldy5qcyIsIjAwMF9jb21tb24vYWNjZXNzb3J5L01vdXNlQ2hhc2VyLmpzIiwiMDAwX2NvbW1vbi9hY2Nlc3NvcnkvUGllQ2xpcC5qcyIsIjAwMF9jb21tb24vYWNjZXNzb3J5L1JlY3RhbmdsZUNsaXAuanMiLCIwMDBfY29tbW9uL2FjY2Vzc29yeS9Ub2dnbGUuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvQXNzZXRMb2FkZXIuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvQmFzZUFwcC5qcyIsIjAwMF9jb21tb24vZXh0ZW5zaW9ucy9DYW52YXMuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvQ2FudmFzUmVuZGVyZXIuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvQ2hlY2tCcm93c2VyLmpzIiwiMDAwX2NvbW1vbi9leHRlbnNpb25zL0Rpc3BsYXlFbGVtZW50LmpzIiwiMDAwX2NvbW1vbi9leHRlbnNpb25zL0Rpc3BsYXlTY2VuZS5qcyIsIjAwMF9jb21tb24vZXh0ZW5zaW9ucy9Eb21BdWRpb1NvdW5kLmpzIiwiMDAwX2NvbW1vbi9leHRlbnNpb25zL0VsZW1lbnQuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvSW5wdXQuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvTGFiZWwuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvTW91c2UuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvT2JqZWN0MkQuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvUGxhaW5FbGVtZW50LmpzIiwiMDAwX2NvbW1vbi9leHRlbnNpb25zL1NoYXBlLmpzIiwiMDAwX2NvbW1vbi9leHRlbnNpb25zL1NvdW5kLmpzIiwiMDAwX2NvbW1vbi9leHRlbnNpb25zL1NvdW5kTWFuYWdlci5qcyIsIjAwMF9jb21tb24vZXh0ZW5zaW9ucy9TcHJpdGUuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvU3RyaW5nLmpzIiwiMDAwX2NvbW1vbi9leHRlbnNpb25zL1RleHR1cmUuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvVHdlZW5lci5qcyIsIjAwMF9jb21tb24vdXRpbC9CdXR0b25pemUuanMiLCIwMDBfY29tbW9uL3V0aWwvVGV4dHVyZVV0aWwuanMiLCIwMDBfY29tbW9uL3V0aWwvVGlsZWRtYXAuanMiLCIwMDBfY29tbW9uL3V0aWwvVXRpbC5qcyIsIjAwMF9jb21tb24vZWxlbWVudHMvc2NlbmUvQmFzZVNjZW5lLmpzIiwiMDAwX2NvbW1vbi9lbGVtZW50cy9zY2VuZUVmZmVjdHMvU2NlbmVFZmZlY3RCYXNlLmpzIiwiMDAwX2NvbW1vbi9lbGVtZW50cy9zY2VuZUVmZmVjdHMvU2NlbmVFZmZlY3RDaXJjbGVGYWRlLmpzIiwiMDAwX2NvbW1vbi9lbGVtZW50cy9zY2VuZUVmZmVjdHMvU2NlbmVFZmZlY3RGYWRlLmpzIiwiMDAwX2NvbW1vbi9lbGVtZW50cy9zY2VuZUVmZmVjdHMvU2NlbmVFZmZlY3ROb25lLmpzIiwiMDAwX2NvbW1vbi9lbGVtZW50cy9zY2VuZUVmZmVjdHMvU2NlbmVFZmZlY3RUaWxlRmFkZS5qcyIsIjAwMF9jb21tb24vZWxlbWVudHMvdWkvQ29ubmVjdGlvblByb2dyZXNzLmpzIiwiMDAwX2NvbW1vbi9lbGVtZW50cy91aS9EaWFsb2cuanMiLCIwMDBfY29tbW9uL2VsZW1lbnRzL3VpL0RvbUJ1dHRvbi5qcyIsIjAwMF9jb21tb24vZWxlbWVudHMvdWkvRG9tVmlkZW8uanMiLCIwMDBfY29tbW9uL2VsZW1lbnRzL3VpL0Rvd25sb2FkUHJvZ3Jlc3MuanMiLCIwMDBfY29tbW9uL2VsZW1lbnRzL3VpL0lucHV0RmllbGQuanMiLCIwMDBfY29tbW9uL2VsZW1lbnRzL3VpL0lucHV0SW50ZXJjZXB0LmpzIiwiMDAwX2NvbW1vbi9lbGVtZW50cy91aS9Nb2RhbC5qcyIsIjAwMF9jb21tb24vZWxlbWVudHMvdWkvU3ByaXRlTGFiZWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9kQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2poQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqICBtYWluLmpzXG4gKi9cblxucGhpbmEuZ2xvYmFsaXplKCk7XG5cbmNvbnN0IFNDUkVFTl9XSURUSCA9IDU3NjtcbmNvbnN0IFNDUkVFTl9IRUlHSFQgPSAzMjQ7XG5jb25zdCBTQ1JFRU5fV0lEVEhfSEFMRiA9IFNDUkVFTl9XSURUSCAqIDAuNTtcbmNvbnN0IFNDUkVFTl9IRUlHSFRfSEFMRiA9IFNDUkVFTl9IRUlHSFQgKiAwLjU7XG5cbmNvbnN0IFNDUkVFTl9PRkZTRVRfWCA9IDA7XG5jb25zdCBTQ1JFRU5fT0ZGU0VUX1kgPSAwO1xuXG5sZXQgcGhpbmFfYXBwO1xuXG53aW5kb3cub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gIHBoaW5hX2FwcCA9IEFwcGxpY2F0aW9uKCk7XG4gIHBoaW5hX2FwcC5yZXBsYWNlU2NlbmUoRmlyc3RTY2VuZUZsb3coe30pKTtcbiAgcGhpbmFfYXBwLnJ1bigpO1xufTtcblxuLy/jgrnjgq/jg63jg7zjg6vnpoHmraJcbi8vIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIGZ1bmN0aW9uKGUpIHtcbi8vICBlLnByZXZlbnREZWZhdWx0KCk7XG4vLyB9LCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xuXG4vL0FuZHJvaWTjg5bjg6njgqbjgrbjg5Djg4Pjgq/jg5zjgr/jg7PliLblvqFcbi8vIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJiYWNrYnV0dG9uXCIsIGZ1bmN0aW9uKGUpe1xuLy8gICBlLnByZXZlbnREZWZhdWx0KCk7XG4vLyB9LCBmYWxzZSk7IiwicGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuXG4gIHBoaW5hLmRlZmluZShcIkFwcGxpY2F0aW9uXCIsIHtcbiAgICBzdXBlckNsYXNzOiBcInBoaW5hLmRpc3BsYXkuQ2FudmFzQXBwXCIsXG5cbiAgICBxdWFsaXR5OiAxLjAsXG4gIFxuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5zdXBlckluaXQoe1xuICAgICAgICBmcHM6IDYwLFxuICAgICAgICB3aWR0aDogU0NSRUVOX1dJRFRILFxuICAgICAgICBoZWlnaHQ6IFNDUkVFTl9IRUlHSFQsXG4gICAgICAgIGZpdDogdHJ1ZSxcbiAgICAgIH0pO1xuICBcbiAgICAgIC8v44K344O844Oz44Gu5bmF44CB6auY44GV44Gu5Z+65pys44KS6Kit5a6aXG4gICAgICBwaGluYS5kaXNwbGF5LkRpc3BsYXlTY2VuZS5kZWZhdWx0cy4kZXh0ZW5kKHtcbiAgICAgICAgd2lkdGg6IFNDUkVFTl9XSURUSCxcbiAgICAgICAgaGVpZ2h0OiBTQ1JFRU5fSEVJR0hULFxuICAgICAgfSk7XG4gIFxuICAgICAgcGhpbmEuaW5wdXQuSW5wdXQucXVhbGl0eSA9IHRoaXMucXVhbGl0eTtcbiAgICAgIHBoaW5hLmRpc3BsYXkuRGlzcGxheVNjZW5lLnF1YWxpdHkgPSB0aGlzLnF1YWxpdHk7XG5cbiAgICAgIC8v44Ky44O844Og44OR44OD44OJ566h55CGXG4gICAgICB0aGlzLmdhbWVwYWRNYW5hZ2VyID0gcGhpbmEuaW5wdXQuR2FtZXBhZE1hbmFnZXIoKTtcbiAgICAgIHRoaXMuZ2FtZXBhZCA9IHRoaXMuZ2FtZXBhZE1hbmFnZXIuZ2V0KDApO1xuICAgICAgdGhpcy5jb250cm9sbGVyID0ge307XG5cbiAgICAgIHRoaXMuc2V0dXBFdmVudHMoKTtcbiAgICAgIHRoaXMuc2V0dXBTb3VuZCgpO1xuICAgICAgdGhpcy5zZXR1cE1vdXNlV2hlZWwoKTtcblxuICAgICAgdGhpcy5vbihcImNoYW5nZXNjZW5lXCIsICgpID0+IHtcbiAgICAgICAgLy/jgrfjg7zjg7PjgpLpm6LjgozjgovpmpvjgIHjg5zjgr/jg7PlkIzmmYLmirzjgZfjg5Xjg6njgrDjgpLop6PpmaTjgZnjgotcbiAgICAgICAgQnV0dG9uLmFjdGlvblRhcmdldCA9IG51bGw7XG4gICAgICB9KTtcblxuICAgICAgLy/jg5Hjg4Pjg4nmg4XloLHjgpLmm7TmlrBcbiAgICAgIHRoaXMub24oJ2VudGVyZnJhbWUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5nYW1lcGFkTWFuYWdlci51cGRhdGUoKTtcbiAgICAgICAgdGhpcy51cGRhdGVDb250cm9sbGVyKCk7XG4gICAgICB9KTtcbiAgICB9LFxuICBcbiAgICAvL+ODnuOCpuOCueOBruODm+ODvOODq+OCpOODmeODs+ODiOmWoumAo1xuICAgIHNldHVwTW91c2VXaGVlbDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLndoZWVsRGVsdGFZID0gMDtcbiAgICAgIHRoaXMuZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2V3aGVlbFwiLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy53aGVlbERlbHRhWSA9IGUuZGVsdGFZO1xuICAgICAgfS5iaW5kKHRoaXMpLCBmYWxzZSk7XG4gIFxuICAgICAgdGhpcy5vbihcImVudGVyZnJhbWVcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucG9pbnRlci53aGVlbERlbHRhWSA9IHRoaXMud2hlZWxEZWx0YVk7XG4gICAgICAgIHRoaXMud2hlZWxEZWx0YVkgPSAwO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8v44Ki44OX44Oq44Kx44O844K344On44Oz5YWo5L2T44Gu44Kk44OZ44Oz44OI44OV44OD44KvXG4gICAgc2V0dXBFdmVudHM6IGZ1bmN0aW9uKCkge30sXG4gIFxuICAgIHNldHVwU291bmQ6IGZ1bmN0aW9uKCkge30sXG5cbiAgICB1cGRhdGVDb250cm9sbGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBiZWZvcmUgPSB0aGlzLmNvbnRyb2xsZXI7XG4gICAgICBiZWZvcmUuYmVmb3JlID0gbnVsbDtcblxuICAgICAgdmFyIGdwID0gdGhpcy5nYW1lcGFkO1xuICAgICAgdmFyIGtiID0gdGhpcy5rZXlib2FyZDtcbiAgICAgIHZhciBhbmdsZTEgPSBncC5nZXRLZXlBbmdsZSgpO1xuICAgICAgdmFyIGFuZ2xlMiA9IGtiLmdldEtleUFuZ2xlKCk7XG4gICAgICB0aGlzLmNvbnRyb2xsZXIgPSB7XG4gICAgICAgICAgYW5nbGU6IGFuZ2xlMSAhPT0gbnVsbD8gYW5nbGUxOiBhbmdsZTIsXG5cbiAgICAgICAgICB1cDogZ3AuZ2V0S2V5KFwidXBcIikgfHwga2IuZ2V0S2V5KFwidXBcIiksXG4gICAgICAgICAgZG93bjogZ3AuZ2V0S2V5KFwiZG93blwiKSB8fCBrYi5nZXRLZXkoXCJkb3duXCIpLFxuICAgICAgICAgIGxlZnQ6IGdwLmdldEtleShcImxlZnRcIikgfHwga2IuZ2V0S2V5KFwibGVmdFwiKSxcbiAgICAgICAgICByaWdodDogZ3AuZ2V0S2V5KFwicmlnaHRcIikgfHwga2IuZ2V0S2V5KFwicmlnaHRcIiksXG5cbiAgICAgICAgICBhdHRhY2s6IGdwLmdldEtleShcIlhcIikgfHwga2IuZ2V0S2V5KFwiWlwiKSxcbiAgICAgICAgICBqdW1wOiAgIGdwLmdldEtleShcInVwXCIpIHx8IGdwLmdldEtleShcIkFcIikgfHwga2IuZ2V0S2V5KFwidXBcIikgfHwga2IuZ2V0S2V5KFwiWFwiKSxcbiAgICAgICAgICBjaGFuZ2U6IGdwLmdldEtleShcIkJcIikgfHwga2IuZ2V0S2V5KFwiQ1wiKSxcbiAgICAgICAgICBtZW51OiAgIGdwLmdldEtleShcInN0YXJ0XCIpIHx8IGtiLmdldEtleShcImVzY2FwZVwiKSxcblxuICAgICAgICAgIGE6IGdwLmdldEtleShcIkFcIikgfHwga2IuZ2V0S2V5KFwiWlwiKSxcbiAgICAgICAgICBiOiBncC5nZXRLZXkoXCJCXCIpIHx8IGtiLmdldEtleShcIlhcIiksXG4gICAgICAgICAgeDogZ3AuZ2V0S2V5KFwiWFwiKSB8fCBrYi5nZXRLZXkoXCJDXCIpLFxuICAgICAgICAgIHk6IGdwLmdldEtleShcIllcIikgfHwga2IuZ2V0S2V5KFwiVlwiKSxcblxuICAgICAgICAgIG9rOiBncC5nZXRLZXkoXCJBXCIpIHx8IGtiLmdldEtleShcIlpcIikgfHwga2IuZ2V0S2V5KFwic3BhY2VcIikgfHwga2IuZ2V0S2V5KFwicmV0dXJuXCIpLFxuICAgICAgICAgIGNhbmNlbDogZ3AuZ2V0S2V5KFwiQlwiKSB8fCBrYi5nZXRLZXkoXCJYXCIpIHx8IGtiLmdldEtleShcImVzY2FwZVwiKSxcblxuICAgICAgICAgIHN0YXJ0OiBncC5nZXRLZXkoXCJzdGFydFwiKSB8fCBrYi5nZXRLZXkoXCJyZXR1cm5cIiksXG4gICAgICAgICAgc2VsZWN0OiBncC5nZXRLZXkoXCJzZWxlY3RcIiksXG5cbiAgICAgICAgICBwYXVzZTogZ3AuZ2V0S2V5KFwic3RhcnRcIikgfHwga2IuZ2V0S2V5KFwiZXNjYXBlXCIpLFxuXG4gICAgICAgICAgYW5hbG9nMTogZ3AuZ2V0U3RpY2tEaXJlY3Rpb24oMCksXG4gICAgICAgICAgYW5hbG9nMjogZ3AuZ2V0U3RpY2tEaXJlY3Rpb24oMSksXG5cbiAgICAgICAgICAvL+WJjeODleODrOODvOODoOaDheWgsVxuICAgICAgICAgIGJlZm9yZTogYmVmb3JlLFxuICAgICAgfTtcbiAgfSxcbn0pO1xuICBcbn0pOyIsIi8qXG4gKiAgQXNzZXRMaXN0LmpzXG4gKi9cblxucGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuXG4gIHBoaW5hLmRlZmluZShcIkFzc2V0TGlzdFwiLCB7XG4gICAgX3N0YXRpYzoge1xuICAgICAgbG9hZGVkOiBbXSxcbiAgICAgIGlzTG9hZGVkOiBmdW5jdGlvbihhc3NldFR5cGUpIHtcbiAgICAgICAgcmV0dXJuIEFzc2V0TGlzdC5sb2FkZWRbYXNzZXRUeXBlXT8gdHJ1ZTogZmFsc2U7XG4gICAgICB9LFxuICAgICAgZ2V0OiBmdW5jdGlvbihhc3NldFR5cGUpIHtcbiAgICAgICAgQXNzZXRMaXN0LmxvYWRlZFthc3NldFR5cGVdID0gdHJ1ZTtcbiAgICAgICAgc3dpdGNoIChhc3NldFR5cGUpIHtcbiAgICAgICAgICBjYXNlIFwicHJlbG9hZFwiOlxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgaW1hZ2U6IHtcbiAgICAgICAgICAgICAgICBcImFjdG9yXCI6IFwiYXNzZXRzL3RleHR1cmVzL2FjdG9yNC5wbmdcIixcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjYXNlIFwiY29tbW9uXCI6XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBpbWFnZToge1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBcImludmFsaWQgYXNzZXRUeXBlOiBcIiArIG9wdGlvbnMuYXNzZXRUeXBlO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0sXG4gIH0pO1xuXG59KTtcbiIsIi8qXG4gKiAgTWFpblNjZW5lLmpzXG4gKiAgMjAxOC8xMC8yNlxuICovXG5cbnBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcblxuICBwaGluYS5kZWZpbmUoXCJCYXNlU2NlbmVcIiwge1xuICAgIHN1cGVyQ2xhc3M6ICdEaXNwbGF5U2NlbmUnLFxuXG4gICAgLy/lu4Pmo4Tjgqjjg6zjg6Hjg7Pjg4hcbiAgICBkaXNwb3NlRWxlbWVudHM6IG51bGwsXG5cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0gKG9wdGlvbnMgfHwge30pLiRzYWZlKHtcbiAgICAgICAgd2lkdGg6IFNDUkVFTl9XSURUSCxcbiAgICAgICAgaGVpZ2h0OiBTQ1JFRU5fSEVJR0hULFxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICd0cmFuc3BhcmVudCcsXG4gICAgICB9KTtcbiAgICAgIHRoaXMuc3VwZXJJbml0KG9wdGlvbnMpO1xuXG4gICAgICAvL+OCt+ODvOODs+mbouiEseaZgmNhbnZhc+ODoeODouODquino+aUvlxuICAgICAgdGhpcy5kaXNwb3NlRWxlbWVudHMgPSBbXTtcbiAgICAgIHRoaXMub25lKCdkZXN0cm95JywgKCkgPT4ge1xuICAgICAgICB0aGlzLmRpc3Bvc2VFbGVtZW50cy5mb3JFYWNoKGUgPT4ge1xuICAgICAgICAgIGlmIChlLmRlc3Ryb3lDYW52YXMpIHtcbiAgICAgICAgICAgIGUuZGVzdHJveUNhbnZhcygpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZSBpbnN0YW5jZW9mIENhbnZhcykge1xuICAgICAgICAgICAgZS5zZXRTaXplKDAsIDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5hcHAgPSBwaGluYV9hcHA7XG5cbiAgICAgIC8v5Yil44K344O844Oz44G444Gu56e76KGM5pmC44Gr44Kt44Oj44Oz44OQ44K544KS56C05qOEXG4gICAgICB0aGlzLm9uZSgnZXhpdCcsICgpID0+IHtcbiAgICAgICAgdGhpcy5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuY2FudmFzLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5mbGFyZSgnZGVzdHJveScpO1xuICAgICAgICBjb25zb2xlLmxvZyhcIkV4aXQgc2NlbmUuXCIpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge30sXG5cbiAgICBmYWRlSW46IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSAob3B0aW9ucyB8fCB7fSkuJHNhZmUoe1xuICAgICAgICBjb2xvcjogXCJ3aGl0ZVwiLFxuICAgICAgICBtaWxsaXNlY29uZDogNTAwLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIGNvbnN0IG1hc2sgPSBSZWN0YW5nbGVTaGFwZSh7XG4gICAgICAgICAgd2lkdGg6IFNDUkVFTl9XSURUSCxcbiAgICAgICAgICBoZWlnaHQ6IFNDUkVFTl9IRUlHSFQsXG4gICAgICAgICAgZmlsbDogb3B0aW9ucy5jb2xvcixcbiAgICAgICAgICBzdHJva2VXaWR0aDogMCxcbiAgICAgICAgfSkuc2V0UG9zaXRpb24oU0NSRUVOX1dJRFRIICogMC41LCBTQ1JFRU5fSEVJR0hUICogMC41KS5hZGRDaGlsZFRvKHRoaXMpO1xuICAgICAgICBtYXNrLnR3ZWVuZXIuY2xlYXIoKVxuICAgICAgICAgIC5mYWRlT3V0KG9wdGlvbnMubWlsbGlzZWNvbmQpXG4gICAgICAgICAgLmNhbGwoKCkgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgdGhpcy5hcHAub25lKCdlbnRlcmZyYW1lJywgKCkgPT4gbWFzay5kZXN0cm95Q2FudmFzKCkpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIGZhZGVPdXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSAob3B0aW9ucyB8fCB7fSkuJHNhZmUoe1xuICAgICAgICBjb2xvcjogXCJ3aGl0ZVwiLFxuICAgICAgICBtaWxsaXNlY29uZDogNTAwLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIGNvbnN0IG1hc2sgPSBSZWN0YW5nbGVTaGFwZSh7XG4gICAgICAgICAgd2lkdGg6IFNDUkVFTl9XSURUSCxcbiAgICAgICAgICBoZWlnaHQ6IFNDUkVFTl9IRUlHSFQsXG4gICAgICAgICAgZmlsbDogb3B0aW9ucy5jb2xvcixcbiAgICAgICAgICBzdHJva2VXaWR0aDogMCxcbiAgICAgICAgfSkuc2V0UG9zaXRpb24oU0NSRUVOX1dJRFRIICogMC41LCBTQ1JFRU5fSEVJR0hUICogMC41KS5hZGRDaGlsZFRvKHRoaXMpO1xuICAgICAgICBtYXNrLmFscGhhID0gMDtcbiAgICAgICAgbWFzay50d2VlbmVyLmNsZWFyKClcbiAgICAgICAgICAuZmFkZUluKG9wdGlvbnMubWlsbGlzZWNvbmQpXG4gICAgICAgICAgLmNhbGwoKCkgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgdGhpcy5hcHAub25lKCdlbnRlcmZyYW1lJywgKCkgPT4gbWFzay5kZXN0cm95Q2FudmFzKCkpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8v44K344O844Oz6Zui6ISx5pmC44Gr56C05qOE44GZ44KLU2hhcGXjgpLnmbvpjLJcbiAgICByZWdpc3REaXNwb3NlOiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICB0aGlzLmRpc3Bvc2VFbGVtZW50cy5wdXNoKGVsZW1lbnQpO1xuICAgIH0sXG4gIH0pO1xuXG59KTsiLCIvKlxuICogIEZpcnN0U2NlbmVGbG93LmpzXG4gKi9cblxucGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuXG4gIHBoaW5hLmRlZmluZShcIkZpcnN0U2NlbmVGbG93XCIsIHtcbiAgICBzdXBlckNsYXNzOiBcIk1hbmFnZXJTY2VuZVwiLFxuXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICBzdGFydExhYmVsID0gb3B0aW9ucy5zdGFydExhYmVsIHx8IFwidGl0bGVcIjtcbiAgICAgIHRoaXMuc3VwZXJJbml0KHtcbiAgICAgICAgc3RhcnRMYWJlbDogc3RhcnRMYWJlbCxcbiAgICAgICAgc2NlbmVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6IFwidGl0bGVcIixcbiAgICAgICAgICAgIGNsYXNzTmFtZTogXCJUaXRsZVNjZW5lXCIsXG4gICAgICAgICAgICBuZXh0TGFiZWw6IFwiaG9tZVwiLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6IFwibWFpblwiLFxuICAgICAgICAgICAgY2xhc3NOYW1lOiBcIk1haW5TY2VuZVwiLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG59KTsiLCJwaGluYS5uYW1lc3BhY2UoZnVuY3Rpb24oKSB7XG5cbiAgcGhpbmEuZGVmaW5lKCdNYWluU2NlbmUnLCB7XG4gICAgc3VwZXJDbGFzczogJ0Jhc2VTY2VuZScsXG5cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLnN1cGVySW5pdCgpO1xuICAgICAgdGhpcy5zZXR1cCgpO1xuICAgIH0sXG5cbiAgICBzZXR1cDogZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCBiYWNrID0gUmVjdGFuZ2xlU2hhcGUoeyB3aWR0aDogU0NSRUVOX1dJRFRILCBoZWlnaHQ6IFNDUkVFTl9IRUlHSFQsIGZpbGw6IFwiYmxhY2tcIiB9KVxuICAgICAgICAuc2V0UG9zaXRpb24oU0NSRUVOX1dJRFRIX0hBTEYsIFNDUkVFTl9IRUlHSFRfSEFMRilcbiAgICAgICAgLmFkZENoaWxkVG8odGhpcyk7XG4gICAgICB0aGlzLnJlZ2lzdERpc3Bvc2UoYmFjayk7XG5cbiAgICAgIHRoaXMud29ybGQgPSBXb3JsZCgpLmFkZENoaWxkVG8odGhpcyk7XG4gICAgfSxcblxuICAgIHVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgfSxcblxuICB9KTtcblxufSk7XG4iLCIvKlxuICogIFRpdGxlU2NlbmUuanNcbiAqL1xuXG5waGluYS5uYW1lc3BhY2UoZnVuY3Rpb24oKSB7XG5cbiAgcGhpbmEuZGVmaW5lKCdUaXRsZVNjZW5lJywge1xuICAgIHN1cGVyQ2xhc3M6ICdCYXNlU2NlbmUnLFxuXG4gICAgX3N0YXRpYzoge1xuICAgICAgaXNBc3NldExvYWQ6IGZhbHNlLFxuICAgIH0sXG5cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLnN1cGVySW5pdCgpO1xuXG4gICAgICB0aGlzLnVubG9jayA9IGZhbHNlO1xuICAgICAgdGhpcy5sb2FkY29tcGxldGUgPSBmYWxzZTtcbiAgICAgIHRoaXMucHJvZ3Jlc3MgPSAwO1xuXG4gICAgICAvL+ODreODvOODiea4iOOBv+OBquOCieOCouOCu+ODg+ODiOODreODvOODieOCkuOBl+OBquOBhFxuICAgICAgaWYgKFRpdGxlU2NlbmUuaXNBc3NldExvYWQpIHtcbiAgICAgICAgdGhpcy5zZXR1cCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy9wcmVsb2FkIGFzc2V0XG4gICAgICAgIGNvbnN0IGFzc2V0cyA9IEFzc2V0TGlzdC5nZXQoXCJwcmVsb2FkXCIpXG4gICAgICAgIHRoaXMubG9hZGVyID0gcGhpbmEuYXNzZXQuQXNzZXRMb2FkZXIoKTtcbiAgICAgICAgdGhpcy5sb2FkZXIubG9hZChhc3NldHMpO1xuICAgICAgICB0aGlzLmxvYWRlci5vbignbG9hZCcsICgpID0+IHRoaXMuc2V0dXAoKSk7XG4gICAgICAgIFRpdGxlU2NlbmUuaXNBc3NldExvYWQgPSB0cnVlO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBzZXR1cDogZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCBiYWNrID0gUmVjdGFuZ2xlU2hhcGUoeyB3aWR0aDogU0NSRUVOX1dJRFRILCBoZWlnaHQ6IFNDUkVFTl9IRUlHSFQsIGZpbGw6IFwiYmxhY2tcIiB9KVxuICAgICAgICAuc2V0UG9zaXRpb24oU0NSRUVOX1dJRFRIX0hBTEYsIFNDUkVFTl9IRUlHSFRfSEFMRilcbiAgICAgICAgLmFkZENoaWxkVG8odGhpcyk7XG4gICAgICB0aGlzLnJlZ2lzdERpc3Bvc2UoYmFjayk7XG5cbiAgICAgIGNvbnN0IGxhYmVsID0gTGFiZWwoeyB0ZXh0OiBcIlRpdGxlU2NlbmVcIiwgZmlsbDogXCJ3aGl0ZVwiIH0pXG4gICAgICAgIC5zZXRQb3NpdGlvbihTQ1JFRU5fV0lEVEhfSEFMRiwgU0NSRUVOX0hFSUdIVF9IQUxGKVxuICAgICAgICAuYWRkQ2hpbGRUbyh0aGlzKTtcbiAgICAgIHRoaXMucmVnaXN0RGlzcG9zZShsYWJlbCk7XG5cbiAgICAgIC8v44OG44Kv44K544OB44Oj57eo6ZuGXG4gICAgICBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgY29uc3QgdGV4ID0gcGhpbmEuYXNzZXQuQXNzZXRNYW5hZ2VyLmdldChcImltYWdlXCIsIFwidW5pdFwiKTtcbiAgICAgICAgbGV0IHRyYW5zID0gbnVsbDtcbiAgICAgICAgdGV4LmZpbHRlcigocGl4ZWwsIGluZGV4LCB4LCB5LCBiaXRtYXApID0+IHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gYml0bWFwLmRhdGE7XG4gICAgICAgICAgICAvL+W3puS4iuOBruODlOOCr+OCu+ODq+OBruiJsuOCkuOCkumAj+mBjuiJsuOBqOOBmeOCi1xuICAgICAgICAgICAgaWYgKHggPT0gMCAmJiB5ID09IDApIHtcbiAgICAgICAgICAgICAgdHJhbnMgPSBkYXRhO1xuICAgICAgICAgICAgICBkYXRhW2luZGV4ICsgM10gPSAwO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHJhbnNbMF0gPT0gcGl4ZWxbMF0gJiYgdHJhbnNbMV0gPT0gcGl4ZWxbMV0gJiYgdHJhbnNbMl0gPT0gcGl4ZWxbMl0pIHtcbiAgICAgICAgICAgICAgZGF0YVtpbmRleCArIDNdID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHBoaW5hLmFzc2V0LkFzc2V0TWFuYWdlci5zZXQoXCJpbWFnZVwiLCBuYW1lK1wiV2hpdGVcIiwgdGV4KTtcblxuICAgICAgICBiYWNrLnNldEludGVyYWN0aXZlKHRydWUpO1xuICAgICAgICBiYWNrLm9uKCdwb2ludGVuZCcsICgpID0+IHRoaXMuZXhpdChcIm1haW5cIikpO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9KVxuXG4gICAgfSxcblxuICAgIHVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgfSxcblxuICB9KTtcblxufSk7XG4iLCJwaGluYS5uYW1lc3BhY2UoZnVuY3Rpb24oKSB7XG5cbiAgcGhpbmEuZGVmaW5lKCdBY3RvcicsIHtcbiAgICBzdXBlckNsYXNzOiAnRGlzcGxheUVsZW1lbnQnLFxuXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdGhpcy5zdXBlckluaXQoKTtcbiAgICB9LFxuXG4gIH0pO1xuXG59KTtcbiIsInBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcblxuICBwaGluYS5kZWZpbmUoJ1dvcmxkJywge1xuICAgIHN1cGVyQ2xhc3M6ICdEaXNwbGF5RWxlbWVudCcsXG5cbiAgICBtYXBTaXplVzogMjAsXG4gICAgbWFwU2l6ZUg6IDIwLFxuICAgIG1hcENoaXBTaXplOiAzMixcblxuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMuc3VwZXJJbml0KCk7XG4gICAgICB0aGlzLnNldHVwKCk7XG4gICAgfSxcblxuICAgIHNldHVwOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMubWFwQmFzZSA9IERpc3BsYXlFbGVtZW50KClcbiAgICAgICAgLnNldFBvc2l0aW9uKFNDUkVFTl9XSURUSF9IQUxGLCBTQ1JFRU5fSEVJR0hUX0hBTEYpXG4gICAgICAgIC5hZGRDaGlsZFRvKHRoaXMpO1xuICAgIH0sXG5cbiAgICB1cGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgIH0sXG5cbiAgfSk7XG5cbn0pO1xuIiwicGhpbmEuZGVmaW5lKFwiQnV0dG9uXCIsIHtcbiAgc3VwZXJDbGFzczogXCJBY2Nlc3NvcnlcIixcblxuICBsb2ducHJlc3NUaW1lOiA1MDAsXG4gIGRvTG9uZ3ByZXNzOiBmYWxzZSxcblxuICAvL+mVt+aKvOOBl+OBp+mAo+aJk+ODouODvOODiVxuICBsb25ncHJlc3NCYXJyYWdlOiBmYWxzZSxcblxuICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnN1cGVySW5pdCgpO1xuXG4gICAgdGhpcy5vbihcImF0dGFjaGVkXCIsICgpID0+IHtcbiAgICAgIHRoaXMudGFyZ2V0LmludGVyYWN0aXZlID0gdHJ1ZTtcbiAgICAgIHRoaXMudGFyZ2V0LmNsaWNrU291bmQgPSBCdXR0b24uZGVmYXVsdHMuY2xpY2tTb3VuZDtcblxuICAgICAgLy/jg5zjgr/jg7PmirzjgZfmmYLnlKhcbiAgICAgIHRoaXMudGFyZ2V0LnNjYWxlVHdlZW5lciA9IFR3ZWVuZXIoKS5hdHRhY2hUbyh0aGlzLnRhcmdldCk7XG5cbiAgICAgIC8v6ZW35oq844GX55SoXG4gICAgICB0aGlzLnRhcmdldC50d0xvbmdwcmVzcyA9IFR3ZWVuZXIoKS5hdHRhY2hUbyh0aGlzLnRhcmdldCk7XG5cbiAgICAgIC8v6ZW35oq844GX5Lit54m55q6K5a++5b+c55SoXG4gICAgICB0aGlzLnRhcmdldC50d0xvbmdwcmVzc2luZyA9IFR3ZWVuZXIoKS5hdHRhY2hUbyh0aGlzLnRhcmdldCk7XG5cbiAgICAgIHRoaXMudGFyZ2V0Lm9uKFwicG9pbnRzdGFydFwiLCAoZSkgPT4ge1xuXG4gICAgICAgIC8v44Kk44OZ44Oz44OI6LKr6YCa44Gr44GX44Gm44GK44GPXG4gICAgICAgIGUucGFzcyA9IHRydWU7XG5cbiAgICAgICAgLy/jg5zjgr/jg7Pjga7lkIzmmYLmirzjgZfjgpLliLbpmZBcbiAgICAgICAgaWYgKEJ1dHRvbi5hY3Rpb25UYXJnZXQgIT09IG51bGwpIHJldHVybjtcblxuICAgICAgICAvL+ODquOCueODiOODk+ODpeODvOOBruWtkOS+m+OBoOOBo+OBn+WgtOWQiOOBr3ZpZXdwb3J044Go44Gu44GC44Gf44KK5Yik5a6a44KS44GZ44KLXG4gICAgICAgIGNvbnN0IGxpc3RWaWV3ID0gQnV0dG9uLmZpbmRMaXN0VmlldyhlLnRhcmdldCk7XG4gICAgICAgIGlmIChsaXN0VmlldyAmJiAhbGlzdFZpZXcudmlld3BvcnQuaGl0VGVzdChlLnBvaW50ZXIueCwgZS5wb2ludGVyLnkpKSByZXR1cm47XG5cbiAgICAgICAgaWYgKGxpc3RWaWV3KSB7XG4gICAgICAgICAgLy/jg53jgqTjg7Pjgr/jgYznp7vli5XjgZfjgZ/loLTlkIjjga/plbfmirzjgZfjgq3jg6Pjg7Pjgrvjg6vvvIhsaXN0Vmlld+WGheeJiO+8iVxuICAgICAgICAgIGxpc3RWaWV3LmlubmVyLiR3YXRjaCgneScsICh2MSwgdjIpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnRhcmdldCAhPT0gQnV0dG9uLmFjdGlvblRhcmdldCkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKE1hdGguYWJzKHYxIC0gdjIpIDwgMTApIHJldHVybjtcblxuICAgICAgICAgICAgQnV0dG9uLmFjdGlvblRhcmdldCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnRhcmdldC50d0xvbmdwcmVzcy5jbGVhcigpO1xuICAgICAgICAgICAgdGhpcy50YXJnZXQuc2NhbGVUd2VlbmVyLmNsZWFyKCkudG8oe1xuICAgICAgICAgICAgICBzY2FsZVg6IDEuMCAqIHRoaXMuc3gsXG4gICAgICAgICAgICAgIHNjYWxlWTogMS4wICogdGhpcy5zeVxuICAgICAgICAgICAgfSwgNTApO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy/jg5zjgr/jg7Pjga7lh6bnkIbjgpLlrp/ooYzjgZfjgabjgoLllY/poYzjgarjgYTloLTlkIjjga7jgb/osqvpgJrjgpLlgZzmraLjgZnjgotcbiAgICAgICAgZS5wYXNzID0gZmFsc2U7XG4gICAgICAgIEJ1dHRvbi5hY3Rpb25UYXJnZXQgPSB0aGlzLnRhcmdldDtcblxuICAgICAgICAvL+WPjei7ouOBl+OBpuOBhOOCi+ODnOOCv+ODs+eUqOOBq+S/neaMgeOBmeOCi1xuICAgICAgICB0aGlzLnN4ID0gKHRoaXMudGFyZ2V0LnNjYWxlWCA+IDApID8gMSA6IC0xO1xuICAgICAgICB0aGlzLnN5ID0gKHRoaXMudGFyZ2V0LnNjYWxlWSA+IDApID8gMSA6IC0xO1xuXG4gICAgICAgIHRoaXMudGFyZ2V0LnNjYWxlVHdlZW5lci5jbGVhcigpXG4gICAgICAgICAgLnRvKHtcbiAgICAgICAgICAgIHNjYWxlWDogMC45NSAqIHRoaXMuc3gsXG4gICAgICAgICAgICBzY2FsZVk6IDAuOTUgKiB0aGlzLnN5XG4gICAgICAgICAgfSwgNTApO1xuXG4gICAgICAgIHRoaXMuZG9Mb25ncHJlc3MgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50YXJnZXQudHdMb25ncHJlc3MuY2xlYXIoKVxuICAgICAgICAgIC53YWl0KHRoaXMubG9nbnByZXNzVGltZSlcbiAgICAgICAgICAuY2FsbCgoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMubG9uZ3ByZXNzQmFycmFnZSkge1xuICAgICAgICAgICAgICBCdXR0b24uYWN0aW9uVGFyZ2V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgdGhpcy50YXJnZXQuc2NhbGVUd2VlbmVyLmNsZWFyKClcbiAgICAgICAgICAgICAgICAudG8oe1xuICAgICAgICAgICAgICAgICAgc2NhbGVYOiAxLjAgKiB0aGlzLnN4LFxuICAgICAgICAgICAgICAgICAgc2NhbGVZOiAxLjAgKiB0aGlzLnN5XG4gICAgICAgICAgICAgICAgfSwgNTApXG4gICAgICAgICAgICAgIHRoaXMudGFyZ2V0LmZsYXJlKFwibG9uZ3ByZXNzXCIpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aGlzLnRhcmdldC5mbGFyZShcImNsaWNrU291bmRcIik7XG4gICAgICAgICAgICAgIHRoaXMudGFyZ2V0LnR3TG9uZ3ByZXNzaW5nLmNsZWFyKClcbiAgICAgICAgICAgICAgICAud2FpdCg1KVxuICAgICAgICAgICAgICAgIC5jYWxsKCgpID0+IHRoaXMudGFyZ2V0LmZsYXJlKFwiY2xpY2tlZFwiLCB7XG4gICAgICAgICAgICAgICAgICBsb25ncHJlc3M6IHRydWVcbiAgICAgICAgICAgICAgICB9KSlcbiAgICAgICAgICAgICAgICAuY2FsbCgoKSA9PiB0aGlzLnRhcmdldC5mbGFyZShcImxvbmdwcmVzc2luZ1wiKSlcbiAgICAgICAgICAgICAgICAuc2V0TG9vcCh0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLnRhcmdldC5vbihcInBvaW50ZW5kXCIsIChlKSA9PiB7XG4gICAgICAgIC8v44Kk44OZ44Oz44OI6LKr6YCa44Gr44GX44Gm44GK44GPXG4gICAgICAgIGUucGFzcyA9IHRydWU7XG5cbiAgICAgICAgLy9cbiAgICAgICAgdGhpcy50YXJnZXQudHdMb25ncHJlc3MuY2xlYXIoKTtcbiAgICAgICAgdGhpcy50YXJnZXQudHdMb25ncHJlc3NpbmcuY2xlYXIoKTtcblxuICAgICAgICAvL+OCv+ODvOOCsuODg+ODiOOBjG51bGzjgYtwb2ludHN0YXJ044Gn5L+d5oyB44GX44Gf44K/44O844Ky44OD44OI44Go6YGV44GG5aC05ZCI44Gv44K544Or44O844GZ44KLXG4gICAgICAgIGlmIChCdXR0b24uYWN0aW9uVGFyZ2V0ID09PSBudWxsKSByZXR1cm47XG4gICAgICAgIGlmIChCdXR0b24uYWN0aW9uVGFyZ2V0ICE9PSB0aGlzLnRhcmdldCkgcmV0dXJuO1xuXG4gICAgICAgIC8v44Oc44K/44Oz44Gu5Yem55CG44KS5a6f6KGM44GX44Gm44KC5ZWP6aGM44Gq44GE5aC05ZCI44Gu44G/6LKr6YCa44KS5YGc5q2i44GZ44KLXG4gICAgICAgIGUucGFzcyA9IGZhbHNlO1xuXG4gICAgICAgIC8v5oq844GX44Gf5L2N572u44GL44KJ44GC44KL56iL5bqm56e75YuV44GX44Gm44GE44KL5aC05ZCI44Gv44Kv44Oq44OD44Kv44Kk44OZ44Oz44OI44KS55m655Sf44GV44Gb44Gq44GEXG4gICAgICAgIGNvbnN0IGlzTW92ZSA9IGUucG9pbnRlci5zdGFydFBvc2l0aW9uLnN1YihlLnBvaW50ZXIucG9zaXRpb24pLmxlbmd0aCgpID4gNTA7XG4gICAgICAgIGNvbnN0IGhpdFRlc3QgPSB0aGlzLnRhcmdldC5oaXRUZXN0KGUucG9pbnRlci54LCBlLnBvaW50ZXIueSk7XG4gICAgICAgIGlmIChoaXRUZXN0ICYmICFpc01vdmUpIHRoaXMudGFyZ2V0LmZsYXJlKFwiY2xpY2tTb3VuZFwiKTtcblxuICAgICAgICB0aGlzLnRhcmdldC5zY2FsZVR3ZWVuZXIuY2xlYXIoKVxuICAgICAgICAgIC50byh7XG4gICAgICAgICAgICBzY2FsZVg6IDEuMCAqIHRoaXMuc3gsXG4gICAgICAgICAgICBzY2FsZVk6IDEuMCAqIHRoaXMuc3lcbiAgICAgICAgICB9LCA1MClcbiAgICAgICAgICAuY2FsbCgoKSA9PiB7XG4gICAgICAgICAgICBCdXR0b24uYWN0aW9uVGFyZ2V0ID0gbnVsbDtcbiAgICAgICAgICAgIGlmICghaGl0VGVzdCB8fCBpc01vdmUgfHwgdGhpcy5kb0xvbmdwcmVzcykgcmV0dXJuO1xuICAgICAgICAgICAgdGhpcy50YXJnZXQuZmxhcmUoXCJjbGlja2VkXCIsIHtcbiAgICAgICAgICAgICAgcG9pbnRlcjogZS5wb2ludGVyXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvL+OCouODi+ODoeODvOOCt+ODp+ODs+OBruacgOS4reOBq+WJiumZpOOBleOCjOOBn+WgtOWQiOOBq+WCmeOBiOOBpnJlbW92ZWTjgqTjg5njg7Pjg4jmmYLjgavjg5Xjg6njgrDjgpLlhYPjgavmiLvjgZfjgabjgYrjgY9cbiAgICAgIHRoaXMudGFyZ2V0Lm9uZShcInJlbW92ZWRcIiwgKCkgPT4ge1xuICAgICAgICBpZiAoQnV0dG9uLmFjdGlvblRhcmdldCA9PT0gdGhpcy50YXJnZXQpIHtcbiAgICAgICAgICBCdXR0b24uYWN0aW9uVGFyZ2V0ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMudGFyZ2V0Lm9uKFwiY2xpY2tTb3VuZFwiLCAoKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy50YXJnZXQuY2xpY2tTb3VuZCB8fCB0aGlzLnRhcmdldC5jbGlja1NvdW5kID09IFwiXCIpIHJldHVybjtcbiAgICAgICAgcGhpbmEuYXNzZXQuU291bmRNYW5hZ2VyLnBsYXkodGhpcy50YXJnZXQuY2xpY2tTb3VuZCk7XG4gICAgICB9KTtcblxuICAgIH0pO1xuICB9LFxuXG4gIC8v6ZW35oq844GX44Gu5by35Yi244Kt44Oj44Oz44K744OrXG4gIGxvbmdwcmVzc0NhbmNlbDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy50YXJnZXQudHdMb25ncHJlc3MuY2xlYXIoKTtcbiAgICB0aGlzLnRhcmdldC50d0xvbmdwcmVzc2luZy5jbGVhcigpO1xuICB9LFxuXG4gIF9zdGF0aWM6IHtcbiAgICAvL+ODnOOCv+ODs+WQjOaZguaKvOOBl+OCkuWItuW+oeOBmeOCi+OBn+OCgeOBq3N0YXR1c+OBr3N0YXRpY+OBq+OBmeOCi1xuICAgIHN0YXR1czogMCxcbiAgICBhY3Rpb25UYXJnZXQ6IG51bGwsXG4gICAgLy/ln7rmnKzoqK3lrppcbiAgICBkZWZhdWx0czoge1xuICAgICAgY2xpY2tTb3VuZDogXCJjb21tb24vc291bmRzL3NlL2J1dHRvblwiLFxuICAgIH0sXG5cbiAgICAvL+imquOCkuOBn+OBqeOBo+OBpkxpc3RWaWV344KS5o6i44GZXG4gICAgZmluZExpc3RWaWV3OiBmdW5jdGlvbihlbGVtZW50LCBwKSB7XG4gICAgICAvL+ODquOCueODiOODk+ODpeODvOOCkuaMgeOBo+OBpuOBhOOCi+WgtOWQiFxuICAgICAgaWYgKGVsZW1lbnQuTGlzdFZpZXcgIT0gbnVsbCkgcmV0dXJuIGVsZW1lbnQuTGlzdFZpZXc7XG4gICAgICAvL+imquOBjOOBquOBkeOCjOOBsOe1guS6hlxuICAgICAgaWYgKGVsZW1lbnQucGFyZW50ID09IG51bGwpIHJldHVybiBudWxsO1xuICAgICAgLy/opqrjgpLjgZ/jganjgotcbiAgICAgIHJldHVybiB0aGlzLmZpbmRMaXN0VmlldyhlbGVtZW50LnBhcmVudCk7XG4gICAgfVxuXG4gIH1cblxufSk7XG4iLCIvKipcclxuICog6Kaq44K544OX44Op44Kk44OI44Gu44OG44Kv44K544OB44Oj44KS5YiH44KK5oqc44GE44Gm6Ieq5YiG44Gu44OG44Kv44K544OB44Oj44Go44GZ44KL44K544OX44Op44Kk44OIXHJcbiAqIOimquOCueODl+ODqeOCpOODiOOBruWIh+OCiuaKnOOBi+OCjOOBn+mDqOWIhuOBr+OAgeWIh+OCiuaKnOOBjeevhOWbsuOBruW3puS4iuOBruODlOOCr+OCu+ODq+OBruiJsuOBp+Whl+OCiuOBpOOBtuOBleOCjOOCi1xyXG4gKiBcclxuICog6Kaq6KaB57Sg44Gu5ouh57iu44O75Zue6Lui44Gv6ICD5oWu44GX44Gq44GEXHJcbiAqL1xyXG5waGluYS5kZWZpbmUoXCJDbGlwU3ByaXRlXCIsIHtcclxuICBzdXBlckNsYXNzOiBcIkFjY2Vzc29yeVwiLFxyXG5cclxuICBpbml0OiBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuc3VwZXJJbml0KCk7XHJcbiAgICB0aGlzLm9uKFwiYXR0YWNoZWRcIiwgKCkgPT4ge1xyXG4gICAgICB0aGlzLnRhcmdldC5vbmUoXCJhZGRlZFwiLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5zZXR1cCgpO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIHNldHVwOiBmdW5jdGlvbigpIHtcclxuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMudGFyZ2V0O1xyXG4gICAgY29uc3QgcGFyZW50ID0gdGFyZ2V0LnBhcmVudDtcclxuICAgIGlmIChwYXJlbnQgaW5zdGFuY2VvZiBwaGluYS5kaXNwbGF5LlNwcml0ZSkge1xyXG4gICAgICBjb25zdCB4ID0gcGFyZW50LndpZHRoICogcGFyZW50Lm9yaWdpbi54ICsgdGFyZ2V0LnggLSB0YXJnZXQud2lkdGggKiB0YXJnZXQub3JpZ2luLng7XHJcbiAgICAgIGNvbnN0IHkgPSBwYXJlbnQuaGVpZ2h0ICogcGFyZW50Lm9yaWdpbi55ICsgdGFyZ2V0LnkgLSB0YXJnZXQuaGVpZ2h0ICogdGFyZ2V0Lm9yaWdpbi55O1xyXG4gICAgICBjb25zdCB3ID0gdGFyZ2V0LndpZHRoO1xyXG4gICAgICBjb25zdCBoID0gdGFyZ2V0LmhlaWdodDtcclxuXHJcbiAgICAgIGNvbnN0IHBhcmVudFRleHR1cmUgPSBwYXJlbnQuaW1hZ2U7XHJcbiAgICAgIGNvbnN0IGNhbnZhcyA9IHBoaW5hLmdyYXBoaWNzLkNhbnZhcygpLnNldFNpemUodywgaCk7XHJcbiAgICAgIGNhbnZhcy5jb250ZXh0LmRyYXdJbWFnZShwYXJlbnRUZXh0dXJlLmRvbUVsZW1lbnQsIHgsIHksIHcsIGgsIDAsIDAsIHcsIGgpO1xyXG4gICAgICBpZiAocGFyZW50VGV4dHVyZSBpbnN0YW5jZW9mIHBoaW5hLmdyYXBoaWNzLkNhbnZhcykge1xyXG4gICAgICAgIC8vIOOCr+ODreODvOODs+OBl+OBpuOBneOBo+OBoeOCkuS9v+OBhlxyXG4gICAgICAgIGNvbnN0IHBhcmVudFRleHR1cmVDbG9uZSA9IHBoaW5hLmdyYXBoaWNzLkNhbnZhcygpLnNldFNpemUocGFyZW50VGV4dHVyZS53aWR0aCwgcGFyZW50VGV4dHVyZS5oZWlnaHQpO1xyXG4gICAgICAgIHBhcmVudFRleHR1cmVDbG9uZS5jb250ZXh0LmRyYXdJbWFnZShwYXJlbnRUZXh0dXJlLmRvbUVsZW1lbnQsIDAsIDApO1xyXG4gICAgICAgIHBhcmVudC5pbWFnZSA9IHBhcmVudFRleHR1cmVDbG9uZTtcclxuXHJcbiAgICAgICAgY29uc3QgZGF0YSA9IHBhcmVudFRleHR1cmVDbG9uZS5jb250ZXh0LmdldEltYWdlRGF0YSh4LCB5LCAxLCAxKS5kYXRhO1xyXG4gICAgICAgIHBhcmVudFRleHR1cmVDbG9uZS5jb250ZXh0LmNsZWFyUmVjdCh4LCB5LCB3LCBoKTtcclxuICAgICAgICBpZiAoZGF0YVszXSA+IDApIHtcclxuICAgICAgICAgIHBhcmVudFRleHR1cmVDbG9uZS5jb250ZXh0Lmdsb2JhbEFscGhhID0gMTtcclxuICAgICAgICAgIHBhcmVudFRleHR1cmVDbG9uZS5jb250ZXh0LmZpbGxTdHlsZSA9IGByZ2JhKCR7ZGF0YVswXX0sICR7ZGF0YVsxXX0sICR7ZGF0YVsyXX0sICR7ZGF0YVszXSAvIDI1NX0pYDtcclxuICAgICAgICAgIHBhcmVudFRleHR1cmVDbG9uZS5jb250ZXh0LmZpbGxSZWN0KHggLSAxLCB5IC0gMSwgdyArIDIsIGggKyAyKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHNwcml0ZSA9IHBoaW5hLmRpc3BsYXkuU3ByaXRlKGNhbnZhcyk7XHJcbiAgICAgIHNwcml0ZS5zZXRPcmlnaW4odGFyZ2V0Lm9yaWdpbi54LCB0YXJnZXQub3JpZ2luLnkpO1xyXG4gICAgICB0YXJnZXQuYWRkQ2hpbGRBdChzcHJpdGUsIDApO1xyXG4gICAgfVxyXG4gIH0sXHJcbn0pO1xyXG4iLCJwaGluYS5kZWZpbmUoXCJHYXVnZVwiLCB7XG4gIHN1cGVyQ2xhc3M6IFwiUmVjdGFuZ2xlQ2xpcFwiLFxuXG4gIF9taW46IDAsXG4gIF9tYXg6IDEuMCxcbiAgX3ZhbHVlOiAxLjAsIC8vbWluIH4gbWF4XG5cbiAgZGlyZWN0aW9uOiBcImhvcml6b250YWxcIiwgLy8gaG9yaXpvbnRhbCBvciB2ZXJ0aWNhbFxuXG4gIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3VwZXJJbml0KCk7XG4gICAgdGhpcy5vbihcImF0dGFjaGVkXCIsICgpID0+IHtcbiAgICAgIHRoaXMuX3dpZHRoID0gdGhpcy53aWR0aDtcbiAgICAgIHRoaXMuX2hlaWdodCA9IHRoaXMud2lkdGg7XG5cbiAgICAgIHRoaXMudGFyZ2V0LmFjY2Vzc29yKFwiR2F1Z2UubWluXCIsIHtcbiAgICAgICAgXCJnZXRcIjogKCkgPT4gdGhpcy5taW4sXG4gICAgICAgIFwic2V0XCI6ICh2KSA9PiB0aGlzLm1pbiA9IHYsXG4gICAgICB9KTtcblxuICAgICAgdGhpcy50YXJnZXQuYWNjZXNzb3IoXCJHYXVnZS5tYXhcIiwge1xuICAgICAgICBcImdldFwiOiAoKSA9PiB0aGlzLm1heCxcbiAgICAgICAgXCJzZXRcIjogKHYpID0+IHRoaXMubWF4ID0gdixcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLnRhcmdldC5hY2Nlc3NvcihcIkdhdWdlLnZhbHVlXCIsIHtcbiAgICAgICAgXCJnZXRcIjogKCkgPT4gdGhpcy52YWx1ZSxcbiAgICAgICAgXCJzZXRcIjogKHYpID0+IHRoaXMudmFsdWUgPSB2LFxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMudGFyZ2V0LmFjY2Vzc29yKFwiR2F1Z2UucHJvZ3Jlc3NcIiwge1xuICAgICAgICBcImdldFwiOiAoKSA9PiB0aGlzLnByb2dyZXNzLFxuICAgICAgICBcInNldFwiOiAodikgPT4gdGhpcy5wcm9ncmVzcyA9IHYsXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcblxuICBfcmVmcmVzaDogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuZGlyZWN0aW9uICE9PSBcInZlcnRpY2FsXCIpIHtcbiAgICAgIHRoaXMud2lkdGggPSB0aGlzLnRhcmdldC53aWR0aCAqIHRoaXMucHJvZ3Jlc3M7XG4gICAgICB0aGlzLmhlaWdodCA9IHRoaXMudGFyZ2V0LmhlaWdodDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy53aWR0aCA9IHRoaXMudGFyZ2V0LndpZHRoO1xuICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLnRhcmdldC5oZWlnaHQgKiB0aGlzLnByb2dyZXNzO1xuICAgIH1cbiAgfSxcblxuICBfYWNjZXNzb3I6IHtcbiAgICBwcm9ncmVzczoge1xuICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgcCA9ICh0aGlzLnZhbHVlIC0gdGhpcy5taW4pIC8gKHRoaXMubWF4IC0gdGhpcy5taW4pO1xuICAgICAgICByZXR1cm4gKGlzTmFOKHApKSA/IDAuMCA6IHA7XG4gICAgICB9LFxuICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLm1heCAqIHY7XG4gICAgICB9XG4gICAgfSxcblxuICAgIG1heDoge1xuICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21heDtcbiAgICAgIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgdGhpcy5fbWF4ID0gdjtcbiAgICAgICAgdGhpcy5fcmVmcmVzaCgpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBtaW46IHtcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9taW47XG4gICAgICB9LFxuICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XG4gICAgICAgIHRoaXMuX21pbiA9IHY7XG4gICAgICAgIHRoaXMuX3JlZnJlc2goKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgdmFsdWU6IHtcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgICAgIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2O1xuICAgICAgICB0aGlzLl9yZWZyZXNoKCk7XG4gICAgICB9XG4gICAgfSxcbiAgfVxuXG59KTtcbiIsInBoaW5hLmRlZmluZShcIkdyYXlzY2FsZVwiLCB7XG4gIHN1cGVyQ2xhc3M6IFwiQWNjZXNzb3J5XCIsXG5cbiAgZ3JheVRleHR1cmVOYW1lOiBudWxsLFxuXG4gIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICB0aGlzLnN1cGVySW5pdCgpO1xuICAgIHRoaXMub24oXCJhdHRhY2hlZFwiLCAoKSA9PiB7XG4gICAgICB0aGlzLmdyYXlUZXh0dXJlTmFtZSA9IG9wdGlvbnMuZ3JheVRleHR1cmVOYW1lO1xuICAgICAgdGhpcy5ub3JtYWwgPSB0aGlzLnRhcmdldC5pbWFnZTtcbiAgICB9KTtcbiAgfSxcblxuICB0b0dyYXlzY2FsZTogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy50YXJnZXQuaW1hZ2UgPSB0aGlzLmdyYXlUZXh0dXJlTmFtZTtcbiAgfSxcblxuICB0b05vcm1hbDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy50YXJnZXQuaW1hZ2UgPSB0aGlzLm5vcm1hbDtcbiAgfSxcblxufSk7XG4iLCJwaGluYS5uYW1lc3BhY2UoKCkgPT4ge1xuXG4gIHBoaW5hLmRlZmluZShcIkxpc3RWaWV3XCIsIHtcbiAgICBzdXBlckNsYXNzOiBcIkFjY2Vzc29yeVwiLFxuXG4gICAgc2Nyb2xsVHlwZTogbnVsbCxcblxuICAgIGl0ZW1zOiBudWxsLFxuXG4gICAgZ2V0Vmlld0lkOiBudWxsLCAvLyBpdGVt44GL44KJ5a++5b+c44GZ44KLdmlld+OBrkpTT07jgpLpgbjliKUgKGl0ZW0pID0+IGpzb25cbiAgICBiaW5kOiBudWxsLCAvLyBpdGVt44Gu5oOF5aCx44KSdmlld+OBq+WPjeaYoCAodmlldywgaXRlbSwgbGlzdFZpZXcpID0+IHZvaWQsXG5cbiAgICB2aWV3SlNPTnM6IG51bGwsXG5cbiAgICBzY3JvbGxCYXI6IG51bGwsXG4gICAgc2Nyb2xsQmFySGFuZGxlOiBudWxsLFxuICAgIHZpZXdwb3J0OiBudWxsLFxuICAgIGlubmVyOiBudWxsLFxuXG4gICAgc2Nyb2xsOiAwLFxuICAgIHNjcm9sbExvY2s6IGZhbHNlLFxuXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdGhpcy5zdXBlckluaXQob3B0aW9ucyk7XG5cbiAgICAgIG9wdGlvbnMgPSAoe30pLiRzYWZlKG9wdGlvbnMsIExpc3RWaWV3LmRlZmF1bHRzKTtcblxuICAgICAgdGhpcy5pdGVtcyA9IFtdO1xuXG4gICAgICB0aGlzLmdldFZpZXdJZCA9IChpdGVtKSA9PiBudWxsO1xuICAgICAgdGhpcy5iaW5kID0gKHZpZXcsIGl0ZW0sIGxpc3RWaWV3KSA9PiB7fTtcblxuICAgICAgdGhpcy5pdGVtTWFyZ2luTGVmdCA9IG9wdGlvbnMuaXRlbU1hcmdpbkxlZnQ7XG4gICAgICB0aGlzLml0ZW1NYXJnaW5Ub3AgPSBvcHRpb25zLml0ZW1NYXJnaW5Ub3A7XG5cbiAgICAgIHRoaXMub24oXCJhdHRhY2hlZFwiLCAoKSA9PiB7XG4gICAgICAgIHRoaXMudGFyZ2V0Lm9uZShcInJlYWR5XCIsICgpID0+IHtcbiAgICAgICAgICB0aGlzLnNldHVwKG9wdGlvbnMpXG4gICAgICAgIH0pO1xuICAgICAgICAvLyBpZiAodGhpcy50YXJnZXQucGFyZW50KSB7XG4gICAgICAgIC8vICAgdGhpcy5zZXR1cChvcHRpb25zKTtcbiAgICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgLy8gICB0aGlzLnRhcmdldC5vbmUoXCJhZGRlZFwiLCAoKSA9PiB7XG4gICAgICAgIC8vICAgICB0aGlzLnNldHVwKG9wdGlvbnMpO1xuICAgICAgICAvLyAgIH0pO1xuICAgICAgICAvLyB9XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgc2V0dXA6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIGNvbnN0IGZpbmRMYXlvdXRSb290ID0gKGVsZW1lbnQpID0+IHtcbiAgICAgICAgaWYgKGVsZW1lbnQubGF5b3V0QXNzZXQpIHtcbiAgICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICAgICAgfSBlbHNlIGlmIChlbGVtZW50LnBhcmVudCkge1xuICAgICAgICAgIHJldHVybiBmaW5kTGF5b3V0Um9vdChlbGVtZW50LnBhcmVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGxheW91dFJvb3QgPSBmaW5kTGF5b3V0Um9vdCh0aGlzLnRhcmdldCk7XG4gICAgICBjb25zdCBhc3NldCA9IGxheW91dFJvb3QubGF5b3V0QXNzZXQ7XG5cbiAgICAgIHRoaXMuc2Nyb2xsVHlwZSA9IG9wdGlvbnMuc2Nyb2xsVHlwZTtcblxuICAgICAgdGhpcy52aWV3cG9ydCA9IHRoaXMuX2NyZWF0ZVZpZXdwb3J0KG9wdGlvbnMpLmFkZENoaWxkVG8odGhpcy50YXJnZXQpO1xuICAgICAgdGhpcy5pbm5lciA9IHRoaXMuX2NyZWF0ZUlubmVyKG9wdGlvbnMsIHRoaXMudmlld3BvcnQpLmFkZENoaWxkVG8odGhpcy52aWV3cG9ydCk7XG4gICAgICB0aGlzLmZyb250ID0gdGhpcy5fY3JlYXRlRnJvbnQob3B0aW9ucywgdGhpcy52aWV3cG9ydCwgdGhpcy5pbm5lcikuYWRkQ2hpbGRUbyh0aGlzLnRhcmdldCk7XG4gICAgICB0aGlzLl9zZXR1cFNjcm9sbEJhcihvcHRpb25zLCB0aGlzLnZpZXdwb3J0LCB0aGlzLmlubmVyKTtcblxuICAgICAgdGhpcy5fc2V0dXBXaGVlbENvbnRyb2wob3B0aW9ucywgdGhpcy52aWV3cG9ydCwgdGhpcy5pbm5lciwgdGhpcy5mcm9udCk7XG4gICAgICB0aGlzLl9zZXR1cFRvdWNoQ29udHJvbChvcHRpb25zLCB0aGlzLnZpZXdwb3J0LCB0aGlzLmlubmVyLCB0aGlzLmZyb250KTtcblxuICAgICAgY29uc3QgZmluZEJ5SWQgPSAoaWQsIGVsZW1lbnQpID0+IHtcbiAgICAgICAgaWYgKGVsZW1lbnQuaWQgPT09IGlkKSB7XG4gICAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgY2hpbGRyZW4gPSBPYmplY3Qua2V5cyhlbGVtZW50LmNoaWxkcmVuIHx8IHt9KS5tYXAoa2V5ID0+IGVsZW1lbnQuY2hpbGRyZW5ba2V5XSk7XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgaGl0ID0gZmluZEJ5SWQoaWQsIGNoaWxkcmVuW2ldKTtcbiAgICAgICAgICAgIGlmIChoaXQpIHJldHVybiBoaXQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgY29uc3Qgdmlld0lkcyA9IG9wdGlvbnMuaXRlbS5zcGxpdChcIixcIikubWFwKF8gPT4gXy50cmltKCkpO1xuICAgICAgdGhpcy52aWV3SlNPTnMgPSB2aWV3SWRzXG4gICAgICAgIC5tYXAoaWQgPT4gZmluZEJ5SWQoaWQsIGFzc2V0LmRhdGEucm9vdCkpXG4gICAgICAgIC5yZWR1Y2UoKG9iaiwgdmlldykgPT4ge1xuICAgICAgICAgIG9ialt2aWV3LmlkXSA9IHZpZXc7XG4gICAgICAgICAgcmV0dXJuIG9iajtcbiAgICAgICAgfSwge30pO1xuICAgICAgdGhpcy5nZXRWaWV3SWQgPSAoaXRlbSkgPT4gdmlld0lkc1swXTtcblxuICAgICAgLy8g5a6f5L2T5YyW44GV44KM44Gf44OT44Ol44O844KS5LiA5pem5YmK6Zmk44GZ44KLXG4gICAgICB2aWV3SWRzLmZvckVhY2goaWQgPT4gbGF5b3V0Um9vdC5yZWZbaWRdLnJlbW92ZSgpKTtcblxuICAgICAgdGhpcy5zY3JvbGxCYXIgPSBsYXlvdXRSb290LnJlZltvcHRpb25zLnNjcm9sbEJhcl07XG4gICAgICB0aGlzLnNjcm9sbEJhckhhbmRsZSA9IGxheW91dFJvb3QucmVmW29wdGlvbnMuc2Nyb2xsQmFySGFuZGxlXTtcblxuICAgIH0sXG5cbiAgICBfY3JlYXRlVmlld3BvcnQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIGNvbnN0IHZpZXdwb3J0ID0gRGlzcGxheUVsZW1lbnQoKTtcblxuICAgICAgdmlld3BvcnQueCA9IG9wdGlvbnMuc2Nyb2xsUmVjdC54O1xuICAgICAgdmlld3BvcnQueSA9IG9wdGlvbnMuc2Nyb2xsUmVjdC55O1xuICAgICAgdmlld3BvcnQud2lkdGggPSBvcHRpb25zLnNjcm9sbFJlY3Qud2lkdGg7XG4gICAgICB2aWV3cG9ydC5oZWlnaHQgPSBvcHRpb25zLnNjcm9sbFJlY3QuaGVpZ2h0O1xuICAgICAgdmlld3BvcnQuY2xpcCA9IChjYW52YXMpID0+IHtcbiAgICAgICAgY29uc3QgdyA9IHZpZXdwb3J0LndpZHRoO1xuICAgICAgICBjb25zdCBoID0gdmlld3BvcnQuaGVpZ2h0O1xuXG4gICAgICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5jb250ZXh0O1xuICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIGN0eC5tb3ZlVG8odyAqIC0wLjUsIGggKiAtMC41KTtcbiAgICAgICAgY3R4LmxpbmVUbyh3ICogKzAuNSwgaCAqIC0wLjUpO1xuICAgICAgICBjdHgubGluZVRvKHcgKiArMC41LCBoICogKzAuNSk7XG4gICAgICAgIGN0eC5saW5lVG8odyAqIC0wLjUsIGggKiArMC41KTtcbiAgICAgICAgY3R4LmNsb3NlUGF0aCgpO1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIHZpZXdwb3J0O1xuICAgIH0sXG5cbiAgICBfY3JlYXRlSW5uZXI6IGZ1bmN0aW9uKG9wdGlvbnMsIHZpZXdwb3J0KSB7XG4gICAgICBpZiAob3B0aW9ucy5pbm5lcikge1xuICAgICAgICAvLyBUT0RPXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBpbm5lciA9IERpc3BsYXlFbGVtZW50KCk7XG5cbiAgICAgICAgaW5uZXIueCA9IC12aWV3cG9ydC53aWR0aCAqIHZpZXdwb3J0Lm9yaWdpblg7XG4gICAgICAgIGlubmVyLnkgPSAtdmlld3BvcnQuaGVpZ2h0ICogdmlld3BvcnQub3JpZ2luWTtcbiAgICAgICAgaW5uZXIub3JpZ2luWCA9IDA7XG4gICAgICAgIGlubmVyLm9yaWdpblkgPSAwO1xuXG4gICAgICAgIHJldHVybiBpbm5lcjtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgX2NyZWF0ZUZyb250OiBmdW5jdGlvbihvcHRpb25zLCB2aWV3cG9ydCwgaW5uZXIpIHtcbiAgICAgIGNvbnN0IGZyb250ID0gRGlzcGxheUVsZW1lbnQoKTtcblxuICAgICAgZnJvbnQueCA9IG9wdGlvbnMuc2Nyb2xsUmVjdC54O1xuICAgICAgZnJvbnQueSA9IG9wdGlvbnMuc2Nyb2xsUmVjdC55O1xuICAgICAgZnJvbnQud2lkdGggPSBvcHRpb25zLnNjcm9sbFJlY3Qud2lkdGg7XG4gICAgICBmcm9udC5oZWlnaHQgPSBvcHRpb25zLnNjcm9sbFJlY3QuaGVpZ2h0O1xuICAgICAgZnJvbnQuaW50ZXJhY3RpdmUgPSB0cnVlO1xuXG4gICAgICByZXR1cm4gZnJvbnQ7XG4gICAgfSxcblxuICAgIF9zZXR1cFNjcm9sbEJhcjogZnVuY3Rpb24ob3B0aW9ucywgdmlld3BvcnQsIGlubmVyKSB7XG4gICAgICB0aGlzLnRhcmdldC5vbihcImVudGVyZnJhbWVcIiwgKCkgPT4ge1xuICAgICAgICBpZiAoIXRoaXMuc2Nyb2xsQmFyICYmICF0aGlzLnNjcm9sbEJhckhhbmRsZSkgcmV0dXJuO1xuXG4gICAgICAgIGlmICh0aGlzLnNjcm9sbFR5cGUgIT09IFwiaG9yaXpvbnRhbFwiKSB7XG4gICAgICAgICAgY29uc3QgdG9wID0gdmlld3BvcnQuaGVpZ2h0ICogLXZpZXdwb3J0Lm9yaWdpblk7XG4gICAgICAgICAgY29uc3QgYm90dG9tID0gdmlld3BvcnQuaGVpZ2h0ICogKDEgLSB2aWV3cG9ydC5vcmlnaW5ZKTtcbiAgICAgICAgICBjb25zdCBzY3JvbGxNaW4gPSB0b3A7XG4gICAgICAgICAgY29uc3Qgc2Nyb2xsTWF4ID0gYm90dG9tIC0gaW5uZXIuaGVpZ2h0O1xuICAgICAgICAgIGNvbnN0IHNjcm9sbFZhbHVlID0gTWF0aC5jbGFtcCgoaW5uZXIudG9wIC0gc2Nyb2xsTWluKSAvIChzY3JvbGxNYXggLSBzY3JvbGxNaW4pLCAwLCAxKTtcblxuICAgICAgICAgIGNvbnN0IHlNaW4gPSB0aGlzLnNjcm9sbEJhci5oZWlnaHQgKiAtdGhpcy5zY3JvbGxCYXIub3JpZ2luWSArIHRoaXMuc2Nyb2xsQmFySGFuZGxlLmhlaWdodCAqIHRoaXMuc2Nyb2xsQmFySGFuZGxlLm9yaWdpblkgKyB0aGlzLnNjcm9sbEJhci55O1xuICAgICAgICAgIGNvbnN0IHlNYXggPSB0aGlzLnNjcm9sbEJhci5oZWlnaHQgKiAoMSAtIHRoaXMuc2Nyb2xsQmFyLm9yaWdpblkpIC0gdGhpcy5zY3JvbGxCYXJIYW5kbGUuaGVpZ2h0ICogKDEgLSB0aGlzLnNjcm9sbEJhckhhbmRsZS5vcmlnaW5ZKSArIHRoaXMuc2Nyb2xsQmFyLnk7XG4gICAgICAgICAgaWYgKGlubmVyLmhlaWdodCA8PSB2aWV3cG9ydC5oZWlnaHQpIHtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsQmFySGFuZGxlLnkgPSB5TWluO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbEJhckhhbmRsZS55ID0geU1pbiArICh5TWF4IC0geU1pbikgKiBzY3JvbGxWYWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgbGVmdCA9IHZpZXdwb3J0LndpZHRoICogLXZpZXdwb3J0Lm9yaWdpblk7XG4gICAgICAgICAgY29uc3QgcmlnaHQgPSB2aWV3cG9ydC5oZWlnaHQgKiAoMSAtIHZpZXdwb3J0Lm9yaWdpblkpO1xuICAgICAgICAgIGNvbnN0IHNjcm9sbE1pbiA9IGxlZnQ7XG4gICAgICAgICAgY29uc3Qgc2Nyb2xsTWF4ID0gcmlnaHQgLSBpbm5lci5oZWlnaHQ7XG4gICAgICAgICAgY29uc3Qgc2Nyb2xsVmFsdWUgPSBNYXRoLmNsYW1wKChpbm5lci5sZWZ0IC0gc2Nyb2xsTWluKSAvIChzY3JvbGxNYXggLSBzY3JvbGxNaW4pLCAwLCAxKTtcblxuICAgICAgICAgIGNvbnN0IHlNaW4gPSB0aGlzLnNjcm9sbEJhci5oZWlnaHQgKiAtdGhpcy5zY3JvbGxCYXIub3JpZ2luWSArIHRoaXMuc2Nyb2xsQmFySGFuZGxlLmhlaWdodCAqIHRoaXMuc2Nyb2xsQmFySGFuZGxlLm9yaWdpblkgKyB0aGlzLnNjcm9sbEJhci55O1xuICAgICAgICAgIGNvbnN0IHlNYXggPSB0aGlzLnNjcm9sbEJhci5oZWlnaHQgKiAoMSAtIHRoaXMuc2Nyb2xsQmFyLm9yaWdpblkpIC0gdGhpcy5zY3JvbGxCYXJIYW5kbGUuaGVpZ2h0ICogKDEgLSB0aGlzLnNjcm9sbEJhckhhbmRsZS5vcmlnaW5ZKSArIHRoaXMuc2Nyb2xsQmFyLnk7XG4gICAgICAgICAgaWYgKGlubmVyLmhlaWdodCA8PSB2aWV3cG9ydC5oZWlnaHQpIHtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsQmFySGFuZGxlLnkgPSB5TWluO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbEJhckhhbmRsZS55ID0geU1pbiArICh5TWF4IC0geU1pbikgKiBzY3JvbGxWYWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfc2V0dXBXaGVlbENvbnRyb2w6IGZ1bmN0aW9uKG9wdGlvbnMsIHZpZXdwb3J0LCBpbm5lciwgZnJvbnQpIHtcbiAgICAgIGlmICh0aGlzLnNjcm9sbFR5cGUgIT09IFwiaG9yaXpvbnRhbFwiKSB7XG4gICAgICAgIHRoaXMudGFyZ2V0Lm9uKFwiZW50ZXJmcmFtZVwiLCAoZSkgPT4ge1xuICAgICAgICAgIGlmIChpbm5lci5oZWlnaHQgPD0gdmlld3BvcnQuaGVpZ2h0KSByZXR1cm47XG4gICAgICAgICAgaWYgKHRoaXMuc2Nyb2xsTG9jaykgcmV0dXJuO1xuXG4gICAgICAgICAgY29uc3QgcCA9IGUuYXBwLnBvaW50ZXI7XG4gICAgICAgICAgY29uc3QgZGVsdGEgPSBwLndoZWVsRGVsdGFZO1xuICAgICAgICAgIGlmIChkZWx0YSAmJiBmcm9udC5oaXRUZXN0KHAueCwgcC55KSkge1xuICAgICAgICAgICAgdGhpcy5zY3JvbGwgKz0gZGVsdGEgLyBpbm5lci5oZWlnaHQgKiAwLjg7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudGFyZ2V0Lm9uKFwiZW50ZXJmcmFtZVwiLCAoZSkgPT4ge1xuICAgICAgICAgIGlmIChpbm5lci53aWR0aCA8PSB2aWV3cG9ydC53aWR0aCkgcmV0dXJuO1xuICAgICAgICAgIGlmICh0aGlzLnNjcm9sbExvY2spIHJldHVybjtcblxuICAgICAgICAgIGNvbnN0IHAgPSBlLmFwcC5wb2ludGVyO1xuICAgICAgICAgIGNvbnN0IGRlbHRhID0gcC53aGVlbERlbHRhWTtcbiAgICAgICAgICBpZiAoZGVsdGEgJiYgZnJvbnQuaGl0VGVzdChwLngsIHAueSkpIHtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsICs9IGRlbHRhIC8gaW5uZXIud2lkdGggKiAwLjg7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgX3NldHVwVG91Y2hDb250cm9sOiBmdW5jdGlvbihvcHRpb25zLCB2aWV3cG9ydCwgaW5uZXIsIGZyb250KSB7XG4gICAgICBjb25zdCB0d2VlbmVyID0gVHdlZW5lcigpLmF0dGFjaFRvKGlubmVyKTtcbiAgICAgIGNvbnN0IHZlbG9jaXR5ID0gVmVjdG9yMigwLCAwKTtcblxuICAgICAgbGV0IGRyYWdnaW5nID0gZmFsc2U7XG4gICAgICBmcm9udC5vbigncG9pbnRzdGFydCcsIChlKSA9PiB7XG4gICAgICAgIGUucGFzcyA9IHRydWU7XG5cbiAgICAgICAgaWYgKGlubmVyLmhlaWdodCA8PSB2aWV3cG9ydC5oZWlnaHQpIHJldHVybjtcblxuICAgICAgICBkcmFnZ2luZyA9IHRydWU7XG4gICAgICAgIHZlbG9jaXR5LnNldCgwLCAwKTtcbiAgICAgICAgdHdlZW5lci5zdG9wKCk7XG4gICAgICB9KTtcbiAgICAgIGZyb250Lm9uKCdwb2ludHN0YXknLCAoZSkgPT4ge1xuICAgICAgICBpZiAoIWRyYWdnaW5nKSByZXR1cm47XG4gICAgICAgIHZlbG9jaXR5LnNldChlLnBvaW50ZXIuZHgsIGUucG9pbnRlci5keSk7XG5cbiAgICAgICAgaWYgKHRoaXMuc2Nyb2xsVHlwZSAhPT0gXCJob3Jpem9udGFsXCIpIHtcbiAgICAgICAgICBjb25zdCB0b3AgPSAtdmlld3BvcnQuaGVpZ2h0ICogdmlld3BvcnQub3JpZ2luWTtcbiAgICAgICAgICBjb25zdCBib3R0b20gPSB2aWV3cG9ydC5oZWlnaHQgKiAoMSAtIHZpZXdwb3J0Lm9yaWdpblkpO1xuICAgICAgICAgIGxldCBvdmVyZGlzdGFuY2UgPSAwO1xuICAgICAgICAgIGlmICh0b3AgPCBpbm5lci50b3ApIHtcbiAgICAgICAgICAgIG92ZXJkaXN0YW5jZSA9IHRvcCAtIGlubmVyLnRvcDtcbiAgICAgICAgICB9IGVsc2UgaWYgKGlubmVyLnRvcCA8IGJvdHRvbSAtIGlubmVyLmhlaWdodCkge1xuICAgICAgICAgICAgb3ZlcmRpc3RhbmNlID0gaW5uZXIudG9wIC0gKGJvdHRvbSAtIGlubmVyLmhlaWdodCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZlbG9jaXR5Lm11bCgxLjAgLSBNYXRoLmFicyhvdmVyZGlzdGFuY2UpIC8gMjAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBsZWZ0ID0gLXZpZXdwb3J0LndpZHRoICogdmlld3BvcnQub3JpZ2luWTtcbiAgICAgICAgICBjb25zdCByaWdodCA9IHZpZXdwb3J0LndpZHRoICogKDEgLSB2aWV3cG9ydC5vcmlnaW5ZKTtcbiAgICAgICAgICBsZXQgb3ZlcmRpc3RhbmNlID0gMDtcbiAgICAgICAgICBpZiAobGVmdCA8IGlubmVyLmxlZnQpIHtcbiAgICAgICAgICAgIG92ZXJkaXN0YW5jZSA9IGxlZnQgLSBpbm5lci5sZWZ0O1xuICAgICAgICAgIH0gZWxzZSBpZiAoaW5uZXIubGVmdCA8IHJpZ2h0IC0gaW5uZXIud2lkdGgpIHtcbiAgICAgICAgICAgIG92ZXJkaXN0YW5jZSA9IGlubmVyLmxlZnQgLSAocmlnaHQgLSBpbm5lci53aWR0aCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZlbG9jaXR5Lm11bCgxLjAgLSBNYXRoLmFicyhvdmVyZGlzdGFuY2UpIC8gMjAwKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBmcm9udC5vbigncG9pbnRlbmQnLCAoZSkgPT4ge1xuICAgICAgICBlLnBhc3MgPSB0cnVlO1xuICAgICAgICBlLnZlbG9jaXR5ID0gdmVsb2NpdHk7XG4gICAgICAgIGRyYWdnaW5nID0gZmFsc2U7XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5vbihcInZpZXdzdG9wXCIsIChlKSA9PiB7XG4gICAgICAgIHZlbG9jaXR5LnNldCgwLCAwKTtcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLnRhcmdldC5vbihcImVudGVyZnJhbWVcIiwgKGUpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuc2Nyb2xsVHlwZSAhPT0gXCJob3Jpem9udGFsXCIpIHtcbiAgICAgICAgICBpZiAoaW5uZXIuaGVpZ2h0IDw9IHZpZXdwb3J0LmhlaWdodCkgcmV0dXJuO1xuICAgICAgICAgIGlubmVyLnRvcCArPSB2ZWxvY2l0eS55O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChpbm5lci53aWR0aCA8PSB2aWV3cG9ydC53aWR0aCkgcmV0dXJuO1xuICAgICAgICAgIGlubmVyLmxlZnQgKz0gdmVsb2NpdHkueDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkcmFnZ2luZykgcmV0dXJuO1xuXG4gICAgICAgIGlmICghdHdlZW5lci5wbGF5aW5nKSB7XG4gICAgICAgICAgdmVsb2NpdHkubXVsKDAuOSk7XG4gICAgICAgICAgaWYgKE1hdGguYWJzKHZlbG9jaXR5LngpIDwgMC4xICYmIE1hdGguYWJzKHZlbG9jaXR5LnkpIDwgMC4xKSB7XG4gICAgICAgICAgICB2ZWxvY2l0eS5zZXQoMCwgMCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHRoaXMuc2Nyb2xsVHlwZSAhPT0gXCJob3Jpem9udGFsXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IHRvcCA9IC12aWV3cG9ydC5oZWlnaHQgKiB2aWV3cG9ydC5vcmlnaW5ZO1xuICAgICAgICAgICAgY29uc3QgYm90dG9tID0gdmlld3BvcnQuaGVpZ2h0ICogKDEgLSB2aWV3cG9ydC5vcmlnaW5ZKTtcbiAgICAgICAgICAgIGlmICh0b3AgPCBpbm5lci50b3ApIHtcbiAgICAgICAgICAgICAgdmVsb2NpdHkuc2V0KDAsIDApO1xuICAgICAgICAgICAgICB0d2VlbmVyLmNsZWFyKCkudG8oe1xuICAgICAgICAgICAgICAgIHk6IHRvcFxuICAgICAgICAgICAgICB9LCAxMDAsIFwiZWFzZUluUXVhZFwiKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5uZXIudG9wIDwgYm90dG9tIC0gaW5uZXIuaGVpZ2h0KSB7XG4gICAgICAgICAgICAgIHZlbG9jaXR5LnNldCgwLCAwKTtcbiAgICAgICAgICAgICAgdHdlZW5lci5jbGVhcigpLnRvKHtcbiAgICAgICAgICAgICAgICB5OiBib3R0b20gLSBpbm5lci5oZWlnaHRcbiAgICAgICAgICAgICAgfSwgMTAwLCBcImVhc2VJblF1YWRcIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0d2VlbmVyLnN0b3AoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgbGVmdCA9IC12aWV3cG9ydC5oZWlnaHQgKiB2aWV3cG9ydC5vcmlnaW5ZO1xuICAgICAgICAgICAgY29uc3QgcmlnaHQgPSB2aWV3cG9ydC5oZWlnaHQgKiAoMSAtIHZpZXdwb3J0Lm9yaWdpblkpO1xuICAgICAgICAgICAgaWYgKGxlZnQgPCBpbm5lci5sZWZ0KSB7XG4gICAgICAgICAgICAgIHZlbG9jaXR5LnNldCgwLCAwKTtcbiAgICAgICAgICAgICAgdHdlZW5lci5jbGVhcigpLnRvKHtcbiAgICAgICAgICAgICAgICB5OiBsZWZ0XG4gICAgICAgICAgICAgIH0sIDEwMCwgXCJlYXNlSW5RdWFkXCIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpbm5lci5sZWZ0IDwgcmlnaHQgLSBpbm5lci5oZWlnaHQpIHtcbiAgICAgICAgICAgICAgdmVsb2NpdHkuc2V0KDAsIDApO1xuICAgICAgICAgICAgICB0d2VlbmVyLmNsZWFyKCkudG8oe1xuICAgICAgICAgICAgICAgIHk6IHJpZ2h0IC0gaW5uZXIuaGVpZ2h0XG4gICAgICAgICAgICAgIH0sIDEwMCwgXCJlYXNlSW5RdWFkXCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdHdlZW5lci5zdG9wKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgY3JlYXRlVmlldzogZnVuY3Rpb24oaXRlbSkge1xuICAgICAgY29uc3Qgdmlld0pTT04gPSB0aGlzLnZpZXdKU09Oc1t0aGlzLmdldFZpZXdJZChpdGVtKV07XG4gICAgICAvLyBjb25zb2xlLmxvZyh2aWV3SlNPTik7XG4gICAgICB0aGlzLmlubmVyLmZyb21KU09OKHtcbiAgICAgICAgY2hpbGRyZW46IFt2aWV3SlNPTl0sXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLmlubmVyLmNoaWxkcmVuLmxhc3Q7XG4gICAgICByZXR1cm4gdmlldztcbiAgICB9LFxuXG4gICAgYWRkSXRlbTogZnVuY3Rpb24oaXRlbSkge1xuICAgICAgdGhpcy5pdGVtcy5wdXNoKGl0ZW0pO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGFkZEl0ZW1zOiBmdW5jdGlvbihpdGVtcykge1xuICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkodGhpcy5pdGVtcywgaXRlbXMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIHJlbW92ZUl0ZW06IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIHRoaXMuaXRlbXMuZXJhc2UoaXRlbSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgY2xlYXJJdGVtOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuaXRlbXMuY2xlYXIoKTtcbiAgICAgIHRoaXMuc2Nyb2xsID0gMDtcbiAgICAgIHRoaXMuZmxhcmUoJ3ZpZXdzdG9wJyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgaW52YWxpZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmlubmVyLmNoaWxkcmVuLmNsb25lKCkuZm9yRWFjaCgoY2hpbGQpID0+IGNoaWxkLnJlbW92ZSgpKTtcblxuICAgICAgbGV0IHkgPSAwO1xuICAgICAgbGV0IHggPSAwO1xuXG4gICAgICB0aGlzLmlubmVyLmhlaWdodCA9IDE7XG5cbiAgICAgIHRoaXMuaXRlbXMuZm9yRWFjaCgoaXRlbSwgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc3QgdmlldyA9IHRoaXMuY3JlYXRlVmlldyhpdGVtKTtcbiAgICAgICAgdmlldy5fbGlzdFZpZXcgPSB0aGlzO1xuICAgICAgICB0aGlzLmJpbmQodmlldywgaXRlbSwgdGhpcyk7XG5cbiAgICAgICAgaWYgKHRoaXMuc2Nyb2xsVHlwZSAhPT0gXCJob3Jpem9udGFsXCIpIHtcbiAgICAgICAgICB2aWV3LmxlZnQgPSB4ICsgdGhpcy5pdGVtTWFyZ2luTGVmdDtcbiAgICAgICAgICB2aWV3LnRvcCA9IHkgKyB0aGlzLml0ZW1NYXJnaW5Ub3A7XG5cbiAgICAgICAgICBpZiAoKHZpZXcucmlnaHQgKyB2aWV3LndpZHRoICsgdGhpcy5pdGVtTWFyZ2luTGVmdCkgPCB0aGlzLnZpZXdwb3J0LndpZHRoKSB7XG4gICAgICAgICAgICB4ID0gdmlldy5yaWdodDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgeCA9IDA7XG4gICAgICAgICAgICB5ID0gdmlldy5ib3R0b207XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5pbm5lci5oZWlnaHQgPSBNYXRoLm1heCh0aGlzLnZpZXdwb3J0LmhlaWdodCwgdmlldy50b3AgKyB2aWV3LmhlaWdodCArIHRoaXMuaXRlbU1hcmdpblRvcCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gVE9ET1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy/jgYroqabjgZflrp/oo4VcbiAgICAgIGlmICh0aGlzLnVwZGF0ZUZ1bmMpIHRoaXMudGFyZ2V0Lm9mZihcImVudGVyZnJhbWVcIiwgdGhpcy51cGRhdGVGdW5jKTtcblxuICAgICAgaWYgKCF0aGlzLnVwZGF0ZUZ1bmMpIHtcbiAgICAgICAgdGhpcy51cGRhdGVGdW5jID0gKCkgPT4ge1xuICAgICAgICAgIGxldCB5ID0gMDtcbiAgICAgICAgICBsZXQgeCA9IDA7XG4gICAgICAgICAgdGhpcy5pbm5lci5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCwgaSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuc2Nyb2xsVHlwZSAhPT0gXCJob3Jpem9udGFsXCIpIHtcbiAgICAgICAgICAgICAgY2hpbGQubGVmdCA9IHggKyB0aGlzLml0ZW1NYXJnaW5MZWZ0O1xuICAgICAgICAgICAgICBjaGlsZC50b3AgPSB5ICsgdGhpcy5pdGVtTWFyZ2luVG9wO1xuXG4gICAgICAgICAgICAgIGlmICgoY2hpbGQucmlnaHQgKyBjaGlsZC53aWR0aCArIHRoaXMuaXRlbU1hcmdpbkxlZnQpIDwgdGhpcy52aWV3cG9ydC53aWR0aCkge1xuICAgICAgICAgICAgICAgIHggPSBjaGlsZC5yaWdodDtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB4ID0gMDtcbiAgICAgICAgICAgICAgICB5ID0gY2hpbGQuYm90dG9tO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgdGhpcy5pbm5lci5oZWlnaHQgPSBNYXRoLm1heCh0aGlzLnZpZXdwb3J0LmhlaWdodCwgY2hpbGQudG9wICsgY2hpbGQuaGVpZ2h0ICsgdGhpcy5pdGVtTWFyZ2luVG9wKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIFRPRE9cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgLy9lbnRlcmZyYW1l44Gn44Gv44Gq44GP44Gmd2F0Y2jjgadoZWlnaHTjgb/jgabjgoLjgYTjgYTjgYvjgapcbiAgICAgIHRoaXMudGFyZ2V0Lm9uKFwiZW50ZXJmcmFtZVwiLCB0aGlzLnVwZGF0ZUZ1bmMpO1xuICAgIH0sXG5cbiAgICAvLyByZXR1cm4gMC4w772eMS4wXG4gICAgZ2V0U2Nyb2xsOiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IHZpZXdwb3J0ID0gdGhpcy52aWV3cG9ydDtcbiAgICAgIGNvbnN0IGlubmVyID0gdGhpcy5pbm5lcjtcblxuICAgICAgaWYgKHRoaXMuc2Nyb2xsVHlwZSAhPT0gXCJob3Jpem9udGFsXCIpIHtcbiAgICAgICAgY29uc3QgdG9wID0gdmlld3BvcnQuaGVpZ2h0ICogLXZpZXdwb3J0Lm9yaWdpblk7XG4gICAgICAgIGNvbnN0IGJvdHRvbSA9IHZpZXdwb3J0LmhlaWdodCAqICgxIC0gdmlld3BvcnQub3JpZ2luWSk7XG4gICAgICAgIGNvbnN0IG1pbiA9IHRvcDtcbiAgICAgICAgY29uc3QgbWF4ID0gYm90dG9tIC0gaW5uZXIuaGVpZ2h0O1xuXG4gICAgICAgIHJldHVybiAoaW5uZXIudG9wIC0gbWluKSAvIChtYXggLSBtaW4pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVE9PRFxuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gdjogMC4w772eMS4wXG4gICAgc2V0U2Nyb2xsOiBmdW5jdGlvbih2KSB7XG4gICAgICB2ID0gTWF0aC5jbGFtcCh2LCAwLCAxKTtcblxuICAgICAgY29uc3Qgdmlld3BvcnQgPSB0aGlzLnZpZXdwb3J0O1xuICAgICAgY29uc3QgaW5uZXIgPSB0aGlzLmlubmVyO1xuXG4gICAgICBpZiAodGhpcy5zY3JvbGxUeXBlICE9PSBcImhvcml6b250YWxcIikge1xuICAgICAgICBpZiAoaW5uZXIuaGVpZ2h0IDw9IHZpZXdwb3J0LmhlaWdodCkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHRvcCA9IHZpZXdwb3J0LmhlaWdodCAqIC12aWV3cG9ydC5vcmlnaW5ZO1xuICAgICAgICBjb25zdCBib3R0b20gPSB2aWV3cG9ydC5oZWlnaHQgKiAoMSAtIHZpZXdwb3J0Lm9yaWdpblkpO1xuICAgICAgICBjb25zdCBtaW4gPSB0b3A7XG4gICAgICAgIGNvbnN0IG1heCA9IGJvdHRvbSAtIGlubmVyLmhlaWdodDtcblxuICAgICAgICBpbm5lci50b3AgPSBtaW4gKyAobWF4IC0gbWluKSAqIHY7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUT09EXG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBfYWNjZXNzb3I6IHtcbiAgICAgIGVsZW1lbnRzOiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaW5uZXIuY2hpbGRyZW47XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgc2Nyb2xsOiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U2Nyb2xsKCk7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24odikge1xuICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsKHYpO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuXG4gICAgX3N0YXRpYzoge1xuICAgICAgZGVmYXVsdHM6IHtcbiAgICAgICAgc2Nyb2xsVHlwZTogXCJ2ZXJ0aWNhbFwiLFxuICAgICAgICBpdGVtTWFyZ2luTGVmdDogMCxcbiAgICAgICAgaXRlbU1hcmdpblRvcDogMCxcbiAgICAgIH0sXG4gICAgfSxcblxuICB9KTtcblxufSk7XG4iLCJwaGluYS5uYW1lc3BhY2UoZnVuY3Rpb24oKSB7XG4gIC8v44Oe44Km44K56L+95b6TXG4gIHBoaW5hLmRlZmluZShcIk1vdXNlQ2hhc2VyXCIsIHtcbiAgICBzdXBlckNsYXNzOiBcIkFjY2Vzc29yeVwiLFxuXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnN1cGVySW5pdCgpO1xuICAgIH0sXG5cbiAgICBvbmF0dGFjaGVkOiBmdW5jdGlvbigpIHtcbiAgICAgIGxldCBweCA9IDA7XG4gICAgICBsZXQgcHkgPSAwO1xuICAgICAgY29uc29sZS5sb2coXCIjTW91c2VDaGFzZXJcIiwgXCJvbmF0dGFjaGVkXCIpO1xuICAgICAgdGhpcy50d2VlbmVyID0gVHdlZW5lcigpLmF0dGFjaFRvKHRoaXMudGFyZ2V0KTtcbiAgICAgIHRoaXMudGFyZ2V0Lm9uKFwiZW50ZXJmcmFtZVwiLCAoZSkgPT4ge1xuICAgICAgICBjb25zdCBwID0gZS5hcHAucG9pbnRlcjtcbiAgICAgICAgaWYgKHB5ID09IHAueCAmJiBweSA9PSBwLnkpIHJldHVybjtcbiAgICAgICAgcHggPSBwLng7XG4gICAgICAgIHB5ID0gcC55O1xuICAgICAgICBjb25zdCB4ID0gcC54IC0gU0NSRUVOX1dJRFRIX0hBTEY7XG4gICAgICAgIGNvbnN0IHkgPSBwLnkgLSBTQ1JFRU5fSEVJR0hUX0hBTEY7XG4gICAgICAgIHRoaXMudHdlZW5lci5jbGVhcigpLnRvKHsgeCwgeSB9LCAyMDAwLCBcImVhc2VPdXRRdWFkXCIpXG4gICAgICB9KTtcblxuICAgIH0sXG5cbiAgICBvbmRldGFjaGVkOiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiI01vdXNlQ2hhc2VyXCIsIFwib25kZXRhY2hlZFwiKTtcbiAgICAgIHRoaXMudHdlZW5lci5yZW1vdmUoKTtcbiAgICB9XG5cbiAgfSk7XG59KTtcbiIsInBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcblxuICBwaGluYS5kZWZpbmUoXCJQaWVDbGlwXCIsIHtcbiAgICBzdXBlckNsYXNzOiBcIkFjY2Vzc29yeVwiLFxuXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9ICh7fSkuJHNhZmUob3B0aW9ucywgUGllQ2xpcC5kZWZhdWx0cylcbiAgICAgIHRoaXMuc3VwZXJJbml0KG9wdGlvbnMpO1xuXG4gICAgICB0aGlzLnBpdm90WCA9IG9wdGlvbnMucGl2b3RYO1xuICAgICAgdGhpcy5waXZvdFkgPSBvcHRpb25zLnBpdm90WTtcbiAgICAgIHRoaXMuYW5nbGVNaW4gPSBvcHRpb25zLmFuZ2xlTWluO1xuICAgICAgdGhpcy5hbmdsZU1heCA9IG9wdGlvbnMuYW5nbGVNYXg7XG4gICAgICB0aGlzLnJhZGl1cyA9IG9wdGlvbnMucmFkaXVzO1xuICAgICAgdGhpcy5hbnRpY2xvY2t3aXNlID0gb3B0aW9ucy5hbnRpY2xvY2t3aXNlO1xuICAgIH0sXG5cbiAgICBvbmF0dGFjaGVkOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMudGFyZ2V0LmNsaXAgPSAoY2FudmFzKSA9PiB7XG4gICAgICAgIGNvbnN0IGFuZ2xlTWluID0gdGhpcy5hbmdsZU1pbiAqIE1hdGguREVHX1RPX1JBRDtcbiAgICAgICAgY29uc3QgYW5nbGVNYXggPSB0aGlzLmFuZ2xlTWF4ICogTWF0aC5ERUdfVE9fUkFEO1xuICAgICAgICBjb25zdCBjdHggPSBjYW52YXMuY29udGV4dDtcbiAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICBjdHgubW92ZVRvKHRoaXMucGl2b3RYLCB0aGlzLnBpdm90WSk7XG4gICAgICAgIGN0eC5saW5lVG8odGhpcy5waXZvdFggKyBNYXRoLmNvcyhhbmdsZU1pbikgKiB0aGlzLnJhZGl1cywgdGhpcy5waXZvdFkgKyBNYXRoLnNpbihhbmdsZU1pbikgKiB0aGlzLnJhZGl1cyk7XG4gICAgICAgIGN0eC5hcmModGhpcy5waXZvdFgsIHRoaXMucGl2b3RZLCB0aGlzLnJhZGl1cywgYW5nbGVNaW4sIGFuZ2xlTWF4LCB0aGlzLmFudGljbG9ja3dpc2UpO1xuICAgICAgICBjdHguY2xvc2VQYXRoKCk7XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBfc3RhdGljOiB7XG4gICAgICBkZWZhdWx0czoge1xuICAgICAgICBwaXZvdFg6IDMyLFxuICAgICAgICBwaXZvdFk6IDMyLFxuICAgICAgICBhbmdsZU1pbjogMCxcbiAgICAgICAgYW5nbGVNYXg6IDM2MCxcbiAgICAgICAgcmFkaXVzOiA2NCxcbiAgICAgICAgYW50aWNsb2Nrd2lzZTogZmFsc2UsXG4gICAgICB9LFxuICAgIH0sXG5cbiAgfSk7XG59KTtcbiIsInBoaW5hLmRlZmluZShcIlJlY3RhbmdsZUNsaXBcIiwge1xuICBzdXBlckNsYXNzOiBcIkFjY2Vzc29yeVwiLFxuXG4gIHg6IDAsXG4gIHk6IDAsXG4gIHdpZHRoOiAwLFxuICBoZWlnaHQ6IDAsXG5cbiAgX2VuYWJsZTogdHJ1ZSxcblxuICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnN1cGVySW5pdCgpO1xuICAgIHRoaXMuX2luaXQoKTtcbiAgfSxcblxuICBfaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5vbihcImF0dGFjaGVkXCIsICgpID0+IHtcblxuICAgICAgdGhpcy50YXJnZXQuYWNjZXNzb3IoXCJSZWN0YW5nbGVDbGlwLndpZHRoXCIsIHtcbiAgICAgICAgXCJnZXRcIjogKCkgPT4gdGhpcy53aWR0aCxcbiAgICAgICAgXCJzZXRcIjogKHYpID0+IHRoaXMud2lkdGggPSB2LFxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMudGFyZ2V0LmFjY2Vzc29yKFwiUmVjdGFuZ2xlQ2xpcC5oZWlnaHRcIiwge1xuICAgICAgICBcImdldFwiOiAoKSA9PiB0aGlzLmhlaWdodCxcbiAgICAgICAgXCJzZXRcIjogKHYpID0+IHRoaXMuaGVpZ2h0ID0gdixcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLnRhcmdldC5hY2Nlc3NvcihcIlJlY3RhbmdsZUNsaXAueFwiLCB7XG4gICAgICAgIFwiZ2V0XCI6ICgpID0+IHRoaXMueCxcbiAgICAgICAgXCJzZXRcIjogKHYpID0+IHRoaXMueCA9IHYsXG4gICAgICB9KTtcblxuICAgICAgdGhpcy50YXJnZXQuYWNjZXNzb3IoXCJSZWN0YW5nbGVDbGlwLnlcIiwge1xuICAgICAgICBcImdldFwiOiAoKSA9PiB0aGlzLnksXG4gICAgICAgIFwic2V0XCI6ICh2KSA9PiB0aGlzLnkgPSB2LFxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMueCA9IDA7XG4gICAgICB0aGlzLnkgPSAwO1xuICAgICAgdGhpcy53aWR0aCA9IHRoaXMudGFyZ2V0LndpZHRoO1xuICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLnRhcmdldC5oZWlnaHQ7XG5cbiAgICAgIHRoaXMudGFyZ2V0LmNsaXAgPSAoYykgPT4gdGhpcy5fY2xpcChjKTtcbiAgICB9KTtcbiAgfSxcblxuICBfY2xpcDogZnVuY3Rpb24oY2FudmFzKSB7XG4gICAgY29uc3QgeCA9IHRoaXMueCAtICh0aGlzLndpZHRoICogdGhpcy50YXJnZXQub3JpZ2luWCk7XG4gICAgY29uc3QgeSA9IHRoaXMueSAtICh0aGlzLmhlaWdodCAqIHRoaXMudGFyZ2V0Lm9yaWdpblkpO1xuXG4gICAgY2FudmFzLmJlZ2luUGF0aCgpO1xuICAgIGNhbnZhcy5yZWN0KHgsIHksIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgICBjYW52YXMuY2xvc2VQYXRoKCk7XG4gIH0sXG5cbiAgc2V0RW5hYmxlOiBmdW5jdGlvbihlbmFibGUpIHtcbiAgICB0aGlzLl9lbmFibGUgPSBlbmFibGU7XG4gICAgaWYgKHRoaXMuX2VuYWJsZSkge1xuICAgICAgdGhpcy50YXJnZXQuY2xpcCA9IChjKSA9PiB0aGlzLl9jbGlwKGMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnRhcmdldC5jbGlwID0gbnVsbDtcbiAgICB9XG4gIH0sXG5cbiAgX2FjY2Vzc29yOiB7XG4gICAgZW5hYmxlOiB7XG4gICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgdGhpcy5zZXRFbmFibGUodik7XG4gICAgICB9LFxuICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VuYWJsZTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbn0pO1xuIiwicGhpbmEuZGVmaW5lKFwiVG9nZ2xlXCIsIHtcbiAgc3VwZXJDbGFzczogXCJBY2Nlc3NvcnlcIixcblxuICBpbml0OiBmdW5jdGlvbihpc09uKSB7XG4gICAgdGhpcy5zdXBlckluaXQoKTtcbiAgICB0aGlzLl9pbml0KGlzT24pO1xuICB9LFxuXG4gIF9pbml0OiBmdW5jdGlvbihpc09uKSB7XG4gICAgdGhpcy5pc09uID0gaXNPbiB8fCBmYWxzZTtcbiAgfSxcblxuICBzZXRTdGF0dXM6IGZ1bmN0aW9uKHN0YXR1cykge1xuICAgIHRoaXMuaXNPbiA9IHN0YXR1cztcbiAgICB0aGlzLnRhcmdldC5mbGFyZSgodGhpcy5pc09uKSA/IFwic3dpdGNoT25cIiA6IFwic3dpdGNoT2ZmXCIpO1xuICB9LFxuXG4gIHN3aXRjaE9uOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5pc09uKSByZXR1cm47XG4gICAgdGhpcy5zZXRTdGF0dXModHJ1ZSk7XG4gIH0sXG5cbiAgc3dpdGNoT2ZmOiBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuaXNPbikgcmV0dXJuO1xuICAgIHRoaXMuc2V0U3RhdHVzKGZhbHNlKTtcbiAgfSxcblxuICBzd2l0Y2g6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaXNPbiA9ICF0aGlzLmlzT247XG4gICAgdGhpcy5zZXRTdGF0dXModGhpcy5pc09uKTtcbiAgfSxcblxuICBfYWNjZXNzb3I6IHtcbiAgICBzdGF0dXM6IHtcbiAgICAgIFwiZ2V0XCI6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc09uO1xuICAgICAgfSxcbiAgICAgIFwic2V0XCI6IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgcmV0dXJuIHNldFN0YXR1cyh2KTtcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcblxufSk7XG4iLCJwaGluYS5hc3NldC5Bc3NldExvYWRlci5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uKHBhcmFtcykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciBsb2FkQXNzZXRzID0gW107XG4gIHZhciBjb3VudGVyID0gMDtcbiAgdmFyIGxlbmd0aCA9IDA7XG4gIHZhciBtYXhDb25uZWN0aW9uQ291bnQgPSAyO1xuXG4gIHBhcmFtcy5mb3JJbihmdW5jdGlvbih0eXBlLCBhc3NldHMpIHtcbiAgICBsZW5ndGggKz0gT2JqZWN0LmtleXMoYXNzZXRzKS5sZW5ndGg7XG4gIH0pO1xuXG4gIGlmIChsZW5ndGggPT0gMCkge1xuICAgIHJldHVybiBwaGluYS51dGlsLkZsb3cucmVzb2x2ZSgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLmZsYXJlKCdsb2FkJyk7XG4gICAgfSk7XG4gIH1cblxuICBwYXJhbXMuZm9ySW4oZnVuY3Rpb24odHlwZSwgYXNzZXRzKSB7XG4gICAgYXNzZXRzLmZvckluKGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICAgIGxvYWRBc3NldHMucHVzaCh7XG4gICAgICAgIFwiZnVuY1wiOiBwaGluYS5hc3NldC5Bc3NldExvYWRlci5hc3NldExvYWRGdW5jdGlvbnNbdHlwZV0sXG4gICAgICAgIFwia2V5XCI6IGtleSxcbiAgICAgICAgXCJ2YWx1ZVwiOiB2YWx1ZSxcbiAgICAgICAgXCJ0eXBlXCI6IHR5cGUsXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgaWYgKHNlbGYuY2FjaGUpIHtcbiAgICBzZWxmLm9uKCdwcm9ncmVzcycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmIChlLnByb2dyZXNzID49IDEuMCkge1xuICAgICAgICBwYXJhbXMuZm9ySW4oZnVuY3Rpb24odHlwZSwgYXNzZXRzKSB7XG4gICAgICAgICAgYXNzZXRzLmZvckluKGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBhc3NldCA9IHBoaW5hLmFzc2V0LkFzc2V0TWFuYWdlci5nZXQodHlwZSwga2V5KTtcbiAgICAgICAgICAgIGlmIChhc3NldC5sb2FkRXJyb3IpIHtcbiAgICAgICAgICAgICAgdmFyIGR1bW15ID0gcGhpbmEuYXNzZXQuQXNzZXRNYW5hZ2VyLmdldCh0eXBlLCAnZHVtbXknKTtcbiAgICAgICAgICAgICAgaWYgKGR1bW15KSB7XG4gICAgICAgICAgICAgICAgaWYgKGR1bW15LmxvYWRFcnJvcikge1xuICAgICAgICAgICAgICAgICAgZHVtbXkubG9hZER1bW15KCk7XG4gICAgICAgICAgICAgICAgICBkdW1teS5sb2FkRXJyb3IgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGhpbmEuYXNzZXQuQXNzZXRNYW5hZ2VyLnNldCh0eXBlLCBrZXksIGR1bW15KTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhc3NldC5sb2FkRHVtbXkoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHZhciBsb2FkQXNzZXRzQXJyYXkgPSBbXTtcblxuICB3aGlsZSAobG9hZEFzc2V0cy5sZW5ndGggPiAwKSB7XG4gICAgbG9hZEFzc2V0c0FycmF5LnB1c2gobG9hZEFzc2V0cy5zcGxpY2UoMCwgbWF4Q29ubmVjdGlvbkNvdW50KSk7XG4gIH1cblxuICB2YXIgZmxvdyA9IHBoaW5hLnV0aWwuRmxvdy5yZXNvbHZlKCk7XG5cbiAgbG9hZEFzc2V0c0FycmF5LmZvckVhY2goZnVuY3Rpb24obG9hZEFzc2V0cykge1xuICAgIGZsb3cgPSBmbG93LnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZmxvd3MgPSBbXTtcbiAgICAgIGxvYWRBc3NldHMuZm9yRWFjaChmdW5jdGlvbihsb2FkQXNzZXQpIHtcbiAgICAgICAgdmFyIGYgPSBsb2FkQXNzZXQuZnVuYyhsb2FkQXNzZXQua2V5LCBsb2FkQXNzZXQudmFsdWUpO1xuICAgICAgICBmLnRoZW4oZnVuY3Rpb24oYXNzZXQpIHtcbiAgICAgICAgICBpZiAoc2VsZi5jYWNoZSkge1xuICAgICAgICAgICAgcGhpbmEuYXNzZXQuQXNzZXRNYW5hZ2VyLnNldChsb2FkQXNzZXQudHlwZSwgbG9hZEFzc2V0LmtleSwgYXNzZXQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzZWxmLmZsYXJlKCdwcm9ncmVzcycsIHtcbiAgICAgICAgICAgIGtleTogbG9hZEFzc2V0LmtleSxcbiAgICAgICAgICAgIGFzc2V0OiBhc3NldCxcbiAgICAgICAgICAgIHByb2dyZXNzOiAoKytjb3VudGVyIC8gbGVuZ3RoKSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGZsb3dzLnB1c2goZik7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBwaGluYS51dGlsLkZsb3cuYWxsKGZsb3dzKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIGZsb3cudGhlbihmdW5jdGlvbihhcmdzKSB7XG4gICAgc2VsZi5mbGFyZSgnbG9hZCcpO1xuICB9KTtcbn1cbiIsInBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcblxuICBwaGluYS5hcHAuQmFzZUFwcC5wcm90b3R5cGUuJG1ldGhvZChcInJlcGxhY2VTY2VuZVwiLCBmdW5jdGlvbihzY2VuZSkge1xuICAgIHRoaXMuZmxhcmUoJ3JlcGxhY2UnKTtcbiAgICB0aGlzLmZsYXJlKCdjaGFuZ2VzY2VuZScpO1xuXG4gICAgd2hpbGUgKHRoaXMuX3NjZW5lcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBzY2VuZSA9IHRoaXMuX3NjZW5lcy5wb3AoKTtcbiAgICAgIHNjZW5lLmZsYXJlKFwiZGVzdHJveVwiKTtcbiAgICB9XG5cbiAgICB0aGlzLl9zY2VuZUluZGV4ID0gMDtcblxuICAgIGlmICh0aGlzLmN1cnJlbnRTY2VuZSkge1xuICAgICAgdGhpcy5jdXJyZW50U2NlbmUuYXBwID0gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLmN1cnJlbnRTY2VuZSA9IHNjZW5lO1xuICAgIHRoaXMuY3VycmVudFNjZW5lLmFwcCA9IHRoaXM7XG4gICAgdGhpcy5jdXJyZW50U2NlbmUuZmxhcmUoJ2VudGVyJywge1xuICAgICAgYXBwOiB0aGlzLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0pO1xuXG4gIHBoaW5hLmFwcC5CYXNlQXBwLnByb3RvdHlwZS4kbWV0aG9kKFwicG9wU2NlbmVcIiwgZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5mbGFyZSgncG9wJyk7XG4gICAgdGhpcy5mbGFyZSgnY2hhbmdlc2NlbmUnKTtcblxuICAgIHZhciBzY2VuZSA9IHRoaXMuX3NjZW5lcy5wb3AoKTtcbiAgICAtLXRoaXMuX3NjZW5lSW5kZXg7XG5cbiAgICBzY2VuZS5mbGFyZSgnZXhpdCcsIHtcbiAgICAgIGFwcDogdGhpcyxcbiAgICB9KTtcbiAgICBzY2VuZS5mbGFyZSgnZGVzdHJveScpO1xuICAgIHNjZW5lLmFwcCA9IG51bGw7XG5cbiAgICB0aGlzLmZsYXJlKCdwb3BlZCcpO1xuXG4gICAgLy8gXG4gICAgdGhpcy5jdXJyZW50U2NlbmUuZmxhcmUoJ3Jlc3VtZScsIHtcbiAgICAgIGFwcDogdGhpcyxcbiAgICAgIHByZXZTY2VuZTogc2NlbmUsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gc2NlbmU7XG4gIH0pO1xuXG59KTtcbiIsInBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcblxuICBwaGluYS5ncmFwaGljcy5DYW52YXMucHJvdG90eXBlLiRtZXRob2QoXCJpbml0XCIsIGZ1bmN0aW9uKGNhbnZhcykge1xuICAgIHRoaXMuaXNDcmVhdGVDYW52YXMgPSBmYWxzZTtcbiAgICBpZiAodHlwZW9mIGNhbnZhcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihjYW52YXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoY2FudmFzKSB7XG4gICAgICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgdGhpcy5pc0NyZWF0ZUNhbnZhcyA9IHRydWU7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCcjIyMjIGNyZWF0ZSBjYW52YXMgIyMjIycpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuZG9tRWxlbWVudCA9IHRoaXMuY2FudmFzO1xuICAgIHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgdGhpcy5jb250ZXh0LmxpbmVDYXAgPSAncm91bmQnO1xuICAgIHRoaXMuY29udGV4dC5saW5lSm9pbiA9ICdyb3VuZCc7XG4gIH0pO1xuXG4gIHBoaW5hLmdyYXBoaWNzLkNhbnZhcy5wcm90b3R5cGUuJG1ldGhvZCgnZGVzdHJveScsIGZ1bmN0aW9uKGNhbnZhcykge1xuICAgIGlmICghdGhpcy5pc0NyZWF0ZUNhbnZhcykgcmV0dXJuO1xuICAgIC8vIGNvbnNvbGUubG9nKGAjIyMjIGRlbGV0ZSBjYW52YXMgJHt0aGlzLmNhbnZhcy53aWR0aH0geCAke3RoaXMuY2FudmFzLmhlaWdodH0gIyMjI2ApO1xuICAgIHRoaXMuc2V0U2l6ZSgwLCAwKTtcbiAgICBkZWxldGUgdGhpcy5jYW52YXM7XG4gICAgZGVsZXRlIHRoaXMuZG9tRWxlbWVudDtcbiAgfSk7XG5cbn0pO1xuIiwicGhpbmEubmFtZXNwYWNlKCgpID0+IHtcblxuICB2YXIgcXVhbGl0eVNjYWxlID0gcGhpbmEuZ2VvbS5NYXRyaXgzMygpO1xuXG4gIHBoaW5hLmRpc3BsYXkuQ2FudmFzUmVuZGVyZXIucHJvdG90eXBlLiRtZXRob2QoXCJyZW5kZXJcIiwgZnVuY3Rpb24oc2NlbmUsIHF1YWxpdHkpIHtcbiAgICB0aGlzLmNhbnZhcy5jbGVhcigpO1xuICAgIGlmIChzY2VuZS5iYWNrZ3JvdW5kQ29sb3IpIHtcbiAgICAgIHRoaXMuY2FudmFzLmNsZWFyQ29sb3Ioc2NlbmUuYmFja2dyb3VuZENvbG9yKTtcbiAgICB9XG5cbiAgICB0aGlzLl9jb250ZXh0LnNhdmUoKTtcbiAgICB0aGlzLnJlbmRlckNoaWxkcmVuKHNjZW5lLCBxdWFsaXR5KTtcbiAgICB0aGlzLl9jb250ZXh0LnJlc3RvcmUoKTtcbiAgfSk7XG5cbiAgcGhpbmEuZGlzcGxheS5DYW52YXNSZW5kZXJlci5wcm90b3R5cGUuJG1ldGhvZChcInJlbmRlckNoaWxkcmVuXCIsIGZ1bmN0aW9uKG9iaiwgcXVhbGl0eSkge1xuICAgIC8vIOWtkOS+m+OBn+OBoeOCguWun+ihjFxuICAgIGlmIChvYmouY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgdmFyIHRlbXBDaGlsZHJlbiA9IG9iai5jaGlsZHJlbi5zbGljZSgpO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRlbXBDaGlsZHJlbi5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgICB0aGlzLnJlbmRlck9iamVjdCh0ZW1wQ2hpbGRyZW5baV0sIHF1YWxpdHkpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgcGhpbmEuZGlzcGxheS5DYW52YXNSZW5kZXJlci5wcm90b3R5cGUuJG1ldGhvZChcInJlbmRlck9iamVjdFwiLCBmdW5jdGlvbihvYmosIHF1YWxpdHkpIHtcbiAgICBpZiAob2JqLnZpc2libGUgPT09IGZhbHNlICYmICFvYmouaW50ZXJhY3RpdmUpIHJldHVybjtcblxuICAgIG9iai5fY2FsY1dvcmxkTWF0cml4ICYmIG9iai5fY2FsY1dvcmxkTWF0cml4KCk7XG5cbiAgICBpZiAob2JqLnZpc2libGUgPT09IGZhbHNlKSByZXR1cm47XG5cbiAgICBvYmouX2NhbGNXb3JsZEFscGhhICYmIG9iai5fY2FsY1dvcmxkQWxwaGEoKTtcblxuICAgIHZhciBjb250ZXh0ID0gdGhpcy5jYW52YXMuY29udGV4dDtcblxuICAgIGNvbnRleHQuZ2xvYmFsQWxwaGEgPSBvYmouX3dvcmxkQWxwaGE7XG4gICAgY29udGV4dC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBvYmouYmxlbmRNb2RlO1xuXG4gICAgaWYgKG9iai5fd29ybGRNYXRyaXgpIHtcblxuICAgICAgcXVhbGl0eVNjYWxlLmlkZW50aXR5KCk7XG5cbiAgICAgIHF1YWxpdHlTY2FsZS5tMDAgPSBxdWFsaXR5IHx8IDEuMDtcbiAgICAgIHF1YWxpdHlTY2FsZS5tMTEgPSBxdWFsaXR5IHx8IDEuMDtcblxuICAgICAgdmFyIG0gPSBxdWFsaXR5U2NhbGUubXVsdGlwbHkob2JqLl93b3JsZE1hdHJpeCk7XG4gICAgICBjb250ZXh0LnNldFRyYW5zZm9ybShtLm0wMCwgbS5tMTAsIG0ubTAxLCBtLm0xMSwgbS5tMDIsIG0ubTEyKTtcblxuICAgIH1cblxuICAgIGlmIChvYmouY2xpcCkge1xuXG4gICAgICBjb250ZXh0LnNhdmUoKTtcblxuICAgICAgb2JqLmNsaXAodGhpcy5jYW52YXMpO1xuICAgICAgY29udGV4dC5jbGlwKCk7XG5cbiAgICAgIGlmIChvYmouZHJhdykgb2JqLmRyYXcodGhpcy5jYW52YXMpO1xuXG4gICAgICAvLyDlrZDkvpvjgZ/jgaHjgoLlrp/ooYxcbiAgICAgIGlmIChvYmoucmVuZGVyQ2hpbGRCeVNlbGYgPT09IGZhbHNlICYmIG9iai5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciB0ZW1wQ2hpbGRyZW4gPSBvYmouY2hpbGRyZW4uc2xpY2UoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRlbXBDaGlsZHJlbi5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgICAgIHRoaXMucmVuZGVyT2JqZWN0KHRlbXBDaGlsZHJlbltpXSwgcXVhbGl0eSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29udGV4dC5yZXN0b3JlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChvYmouZHJhdykgb2JqLmRyYXcodGhpcy5jYW52YXMpO1xuXG4gICAgICAvLyDlrZDkvpvjgZ/jgaHjgoLlrp/ooYxcbiAgICAgIGlmIChvYmoucmVuZGVyQ2hpbGRCeVNlbGYgPT09IGZhbHNlICYmIG9iai5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciB0ZW1wQ2hpbGRyZW4gPSBvYmouY2hpbGRyZW4uc2xpY2UoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRlbXBDaGlsZHJlbi5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgICAgIHRoaXMucmVuZGVyT2JqZWN0KHRlbXBDaGlsZHJlbltpXSwgcXVhbGl0eSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgIH1cbiAgfSk7XG5cbn0pO1xuIiwicGhpbmEubmFtZXNwYWNlKCgpID0+IHtcbiAgLy/jg6bjg7zjgrbjg7zjgqjjg7zjgrjjgqfjg7Pjg4jjgYvjgonjg5bjg6njgqbjgrbjgr/jgqTjg5fjga7liKTliKXjgpLooYzjgYZcbiAgcGhpbmEuJG1ldGhvZCgnY2hlY2tCcm93c2VyJywgZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgY29uc3QgYWdlbnQgPSB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpOztcblxuICAgIHJlc3VsdC5pc0Nocm9tZSA9IChhZ2VudC5pbmRleE9mKCdjaHJvbWUnKSAhPT0gLTEpICYmIChhZ2VudC5pbmRleE9mKCdlZGdlJykgPT09IC0xKSAmJiAoYWdlbnQuaW5kZXhPZignb3ByJykgPT09IC0xKTtcbiAgICByZXN1bHQuaXNFZGdlID0gKGFnZW50LmluZGV4T2YoJ2VkZ2UnKSAhPT0gLTEpO1xuICAgIHJlc3VsdC5pc0llMTEgPSAoYWdlbnQuaW5kZXhPZigndHJpZGVudC83JykgIT09IC0xKTtcbiAgICByZXN1bHQuaXNGaXJlZm94ID0gKGFnZW50LmluZGV4T2YoJ2ZpcmVmb3gnKSAhPT0gLTEpO1xuICAgIHJlc3VsdC5pc1NhZmFyaSA9IChhZ2VudC5pbmRleE9mKCdzYWZhcmknKSAhPT0gLTEpICYmIChhZ2VudC5pbmRleE9mKCdjaHJvbWUnKSA9PT0gLTEpO1xuICAgIHJlc3VsdC5pc0VsZWN0cm9uID0gKGFnZW50LmluZGV4T2YoJ2VsZWN0cm9uJykgIT09IC0xKTtcblxuICAgIHJlc3VsdC5pc1dpbmRvd3MgPSAoYWdlbnQuaW5kZXhPZignd2luZG93cycpICE9PSAtMSk7XG4gICAgcmVzdWx0LmlzTWFjID0gKGFnZW50LmluZGV4T2YoJ21hYyBvcyB4JykgIT09IC0xKTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0pO1xufSk7XG4iLCIvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyAgRXh0ZW5zaW9uIHBoaW5hLmRpc3BsYXkuRGlzcGxheUVsZW1lbnRcbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnBoaW5hLm5hbWVzcGFjZSgoKSA9PiB7XG4gIHBoaW5hLmRpc3BsYXkuRGlzcGxheUVsZW1lbnQucHJvdG90eXBlLiRtZXRob2QoXCJlbmFibGVcIiwgZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zaG93KCkud2FrZVVwKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0pO1xuXG4gIHBoaW5hLmRpc3BsYXkuRGlzcGxheUVsZW1lbnQucHJvdG90eXBlLiRtZXRob2QoXCJkaXNhYmxlXCIsIGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaGlkZSgpLnNsZWVwKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0pO1xufSk7XG4iLCJwaGluYS5uYW1lc3BhY2UoKCkgPT4ge1xuICBwaGluYS5kaXNwbGF5LkRpc3BsYXlTY2VuZS5xdWFsaXR5ID0gMS4wO1xuICBwaGluYS5kaXNwbGF5LkRpc3BsYXlTY2VuZS5wcm90b3R5cGUuJG1ldGhvZChcImluaXRcIiwgZnVuY3Rpb24ocGFyYW1zKSB7XG4gICAgdGhpcy5zdXBlckluaXQoKTtcbiAgICB2YXIgcXVhbGl0eSA9IHBoaW5hLmRpc3BsYXkuRGlzcGxheVNjZW5lLnF1YWxpdHk7XG5cbiAgICBwYXJhbXMgPSAoe30pLiRzYWZlKHBhcmFtcywgcGhpbmEuZGlzcGxheS5EaXNwbGF5U2NlbmUuZGVmYXVsdHMpO1xuICAgIHRoaXMuY2FudmFzID0gcGhpbmEuZ3JhcGhpY3MuQ2FudmFzKCk7XG4gICAgdGhpcy5jYW52YXMuc2V0U2l6ZShwYXJhbXMud2lkdGggKiBxdWFsaXR5LCBwYXJhbXMuaGVpZ2h0ICogcXVhbGl0eSk7XG4gICAgdGhpcy5yZW5kZXJlciA9IHBoaW5hLmRpc3BsYXkuQ2FudmFzUmVuZGVyZXIodGhpcy5jYW52YXMpO1xuICAgIHRoaXMuYmFja2dyb3VuZENvbG9yID0gKHBhcmFtcy5iYWNrZ3JvdW5kQ29sb3IpID8gcGFyYW1zLmJhY2tncm91bmRDb2xvciA6IG51bGw7XG5cbiAgICB0aGlzLndpZHRoID0gcGFyYW1zLndpZHRoO1xuICAgIHRoaXMuaGVpZ2h0ID0gcGFyYW1zLmhlaWdodDtcbiAgICB0aGlzLmdyaWRYID0gcGhpbmEudXRpbC5HcmlkKHBhcmFtcy53aWR0aCwgMTYpO1xuICAgIHRoaXMuZ3JpZFkgPSBwaGluYS51dGlsLkdyaWQocGFyYW1zLmhlaWdodCwgMTYpO1xuXG4gICAgdGhpcy5pbnRlcmFjdGl2ZSA9IHRydWU7XG4gICAgdGhpcy5zZXRJbnRlcmFjdGl2ZSA9IGZ1bmN0aW9uKGZsYWcpIHtcbiAgICAgIHRoaXMuaW50ZXJhY3RpdmUgPSBmbGFnO1xuICAgIH07XG4gICAgdGhpcy5fb3ZlckZsYWdzID0ge307XG4gICAgdGhpcy5fdG91Y2hGbGFncyA9IHt9O1xuICB9KTtcblxufSk7XG4iLCJwaGluYS5uYW1lc3BhY2UoZnVuY3Rpb24oKSB7XHJcblxyXG4gIC8vIGF1ZGlv6KaB57Sg44Gn6Z+z5aOw44KS5YaN55Sf44GZ44KL44CC5Li744GrSUXnlKhcclxuICBwaGluYS5kZWZpbmUoXCJwaGluYS5hc3NldC5Eb21BdWRpb1NvdW5kXCIsIHtcclxuICAgIHN1cGVyQ2xhc3M6IFwicGhpbmEuYXNzZXQuQXNzZXRcIixcclxuXHJcbiAgICBkb21FbGVtZW50OiBudWxsLFxyXG4gICAgZW1wdHlTb3VuZDogZmFsc2UsXHJcblxyXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuc3VwZXJJbml0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9sb2FkOiBmdW5jdGlvbihyZXNvbHZlKSB7XHJcbiAgICAgIHRoaXMuZG9tRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhdWRpb1wiKTtcclxuICAgICAgaWYgKHRoaXMuZG9tRWxlbWVudC5jYW5QbGF5VHlwZShcImF1ZGlvL21wZWdcIikpIHtcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uIHJlYWR5c3RhdGVDaGVjaygpIHtcclxuICAgICAgICAgIGlmICh0aGlzLmRvbUVsZW1lbnQucmVhZHlTdGF0ZSA8IDQpIHtcclxuICAgICAgICAgICAgc2V0VGltZW91dChyZWFkeXN0YXRlQ2hlY2suYmluZCh0aGlzKSwgMTApO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5lbXB0eVNvdW5kID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZW5kIGxvYWQgXCIsIHRoaXMuc3JjKTtcclxuICAgICAgICAgICAgcmVzb2x2ZSh0aGlzKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0uYmluZCh0aGlzKSwgMTApO1xyXG4gICAgICAgIHRoaXMuZG9tRWxlbWVudC5vbmVycm9yID0gZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIuOCquODvOODh+OCo+OCquOBruODreODvOODieOBq+WkseaVl1wiLCBlKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuZG9tRWxlbWVudC5zcmMgPSB0aGlzLnNyYztcclxuICAgICAgICBjb25zb2xlLmxvZyhcImJlZ2luIGxvYWQgXCIsIHRoaXMuc3JjKTtcclxuICAgICAgICB0aGlzLmRvbUVsZW1lbnQubG9hZCgpO1xyXG4gICAgICAgIHRoaXMuZG9tRWxlbWVudC5hdXRvcGxheSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiZW5kZWRcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICB0aGlzLmZsYXJlKFwiZW5kZWRcIik7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIm1wM+OBr+WGjeeUn+OBp+OBjeOBvuOBm+OCk1wiKTtcclxuICAgICAgICB0aGlzLmVtcHR5U291bmQgPSB0cnVlO1xyXG4gICAgICAgIHJlc29sdmUodGhpcyk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgcGxheTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIGlmICh0aGlzLmVtcHR5U291bmQpIHJldHVybjtcclxuICAgICAgdGhpcy5kb21FbGVtZW50LnBhdXNlKCk7XHJcbiAgICAgIHRoaXMuZG9tRWxlbWVudC5jdXJyZW50VGltZSA9IDA7XHJcbiAgICAgIHRoaXMuZG9tRWxlbWVudC5wbGF5KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHN0b3A6IGZ1bmN0aW9uKCkge1xyXG4gICAgICBpZiAodGhpcy5lbXB0eVNvdW5kKSByZXR1cm47XHJcbiAgICAgIHRoaXMuZG9tRWxlbWVudC5wYXVzZSgpO1xyXG4gICAgICB0aGlzLmRvbUVsZW1lbnQuY3VycmVudFRpbWUgPSAwO1xyXG4gICAgfSxcclxuXHJcbiAgICBwYXVzZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIGlmICh0aGlzLmVtcHR5U291bmQpIHJldHVybjtcclxuICAgICAgdGhpcy5kb21FbGVtZW50LnBhdXNlKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlc3VtZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIGlmICh0aGlzLmVtcHR5U291bmQpIHJldHVybjtcclxuICAgICAgdGhpcy5kb21FbGVtZW50LnBsYXkoKTtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0TG9vcDogZnVuY3Rpb24odikge1xyXG4gICAgICBpZiAodGhpcy5lbXB0eVNvdW5kKSByZXR1cm47XHJcbiAgICAgIHRoaXMuZG9tRWxlbWVudC5sb29wID0gdjtcclxuICAgIH0sXHJcblxyXG4gICAgX2FjY2Vzc29yOiB7XHJcbiAgICAgIHZvbHVtZToge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBpZiAodGhpcy5lbXB0eVNvdW5kKSByZXR1cm4gMDtcclxuICAgICAgICAgIHJldHVybiB0aGlzLmRvbUVsZW1lbnQudm9sdW1lO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgICBpZiAodGhpcy5lbXB0eVNvdW5kKSByZXR1cm47XHJcbiAgICAgICAgICB0aGlzLmRvbUVsZW1lbnQudm9sdW1lID0gdjtcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBsb29wOiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmICh0aGlzLmVtcHR5U291bmQpIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgIHJldHVybiB0aGlzLmRvbUVsZW1lbnQubG9vcDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24odikge1xyXG4gICAgICAgICAgaWYgKHRoaXMuZW1wdHlTb3VuZCkgcmV0dXJuO1xyXG4gICAgICAgICAgdGhpcy5zZXRMb29wKHYpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcblxyXG4gICAgfSxcclxuICB9KTtcclxuXHJcbiAgLy8gSUUxMeOBruWgtOWQiOOBruOBv+mfs+WjsOOCouOCu+ODg+ODiOOBr0RvbUF1ZGlvU291bmTjgaflho3nlJ/jgZnjgotcclxuICB2YXIgdWEgPSB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpO1xyXG4gIGlmICh1YS5pbmRleE9mKCd0cmlkZW50LzcnKSAhPT0gLTEpIHtcclxuICAgIHBoaW5hLmFzc2V0LkFzc2V0TG9hZGVyLnJlZ2lzdGVyKFwic291bmRcIiwgZnVuY3Rpb24oa2V5LCBwYXRoKSB7XHJcbiAgICAgIHZhciBhc3NldCA9IHBoaW5hLmFzc2V0LkRvbUF1ZGlvU291bmQoKTtcclxuICAgICAgcmV0dXJuIGFzc2V0LmxvYWQocGF0aCk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG59KTtcclxuIiwicGhpbmEubmFtZXNwYWNlKCgpID0+IHtcblxuICBwaGluYS5hcHAuRWxlbWVudC5wcm90b3R5cGUuJG1ldGhvZChcImZpbmRCeUlkXCIsIGZ1bmN0aW9uKGlkKSB7XG4gICAgaWYgKHRoaXMuaWQgPT09IGlkKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0aGlzLmNoaWxkcmVuW2ldLmZpbmRCeUlkKGlkKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNoaWxkcmVuW2ldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH0pO1xuXG4gIC8v5oyH5a6a44GV44KM44Gf5a2Q44Kq44OW44K444Kn44Kv44OI44KS5pyA5YmN6Z2i44Gr56e75YuV44GZ44KLXG4gIHBoaW5hLmFwcC5FbGVtZW50LnByb3RvdHlwZS4kbWV0aG9kKFwibW92ZUZyb250XCIsIGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy5jaGlsZHJlbltpXSA9PSBjaGlsZCkge1xuICAgICAgICB0aGlzLmNoaWxkcmVuLnNwbGljZShpLCAxKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuY2hpbGRyZW4ucHVzaChjaGlsZCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0pO1xuXG4gIHBoaW5hLmFwcC5FbGVtZW50LnByb3RvdHlwZS4kbWV0aG9kKFwiZGVzdHJveUNoaWxkXCIsIGZ1bmN0aW9uKCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5jaGlsZHJlbltpXS5mbGFyZSgnZGVzdHJveScpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSk7XG5cbn0pO1xuIiwicGhpbmEubmFtZXNwYWNlKCgpID0+IHtcblxuICBwaGluYS5pbnB1dC5JbnB1dC5xdWFsaXR5ID0gMS4wO1xuXG4gIHBoaW5hLmlucHV0LklucHV0LnByb3RvdHlwZS4kbWV0aG9kKFwiX21vdmVcIiwgZnVuY3Rpb24oeCwgeSkge1xuICAgIHRoaXMuX3RlbXBQb3NpdGlvbi54ID0geDtcbiAgICB0aGlzLl90ZW1wUG9zaXRpb24ueSA9IHk7XG5cbiAgICAvLyBhZGp1c3Qgc2NhbGVcbiAgICB2YXIgZWxtID0gdGhpcy5kb21FbGVtZW50O1xuICAgIHZhciByZWN0ID0gZWxtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgdmFyIHcgPSBlbG0ud2lkdGggLyBwaGluYS5pbnB1dC5JbnB1dC5xdWFsaXR5O1xuICAgIHZhciBoID0gZWxtLmhlaWdodCAvIHBoaW5hLmlucHV0LklucHV0LnF1YWxpdHk7XG5cbiAgICBpZiAocmVjdC53aWR0aCkge1xuICAgICAgdGhpcy5fdGVtcFBvc2l0aW9uLnggKj0gdyAvIHJlY3Qud2lkdGg7XG4gICAgfVxuXG4gICAgaWYgKHJlY3QuaGVpZ2h0KSB7XG4gICAgICB0aGlzLl90ZW1wUG9zaXRpb24ueSAqPSBoIC8gcmVjdC5oZWlnaHQ7XG4gICAgfVxuXG4gIH0pO1xuXG59KTtcbiIsInBoaW5hLm5hbWVzcGFjZSgoKSA9PiB7XG4gIHBoaW5hLmRpc3BsYXkuTGFiZWwucHJvdG90eXBlLiRtZXRob2QoXCJpbml0XCIsIGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIGFyZ3VtZW50c1swXSAhPT0gJ29iamVjdCcpIHtcbiAgICAgIG9wdGlvbnMgPSB7IHRleHQ6IGFyZ3VtZW50c1swXSwgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3B0aW9ucyA9IGFyZ3VtZW50c1swXTtcbiAgICB9XG5cbiAgICBvcHRpb25zID0gKHt9KS4kc2FmZShvcHRpb25zLCBwaGluYS5kaXNwbGF5LkxhYmVsLmRlZmF1bHRzKTtcbiAgICB0aGlzLnN1cGVySW5pdChvcHRpb25zKTtcblxuICAgIHRoaXMudGV4dCA9IChvcHRpb25zLnRleHQpID8gb3B0aW9ucy50ZXh0IDogXCJcIjtcbiAgICB0aGlzLmZvbnRTaXplID0gb3B0aW9ucy5mb250U2l6ZTtcbiAgICB0aGlzLmZvbnRXZWlnaHQgPSBvcHRpb25zLmZvbnRXZWlnaHQ7XG4gICAgdGhpcy5mb250RmFtaWx5ID0gb3B0aW9ucy5mb250RmFtaWx5O1xuICAgIHRoaXMuYWxpZ24gPSBvcHRpb25zLmFsaWduO1xuICAgIHRoaXMuYmFzZWxpbmUgPSBvcHRpb25zLmJhc2VsaW5lO1xuICAgIHRoaXMubGluZUhlaWdodCA9IG9wdGlvbnMubGluZUhlaWdodDtcbiAgfSk7XG5cbn0pO1xuIiwicGhpbmEubmFtZXNwYWNlKCgpID0+IHtcbiAgcGhpbmEuaW5wdXQuTW91c2UucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbihkb21FbGVtZW50KSB7XG4gICAgdGhpcy5zdXBlckluaXQoZG9tRWxlbWVudCk7XG5cbiAgICB0aGlzLmlkID0gMDtcblxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLmRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZnVuY3Rpb24oZSkge1xuICAgICAgc2VsZi5fc3RhcnQoZS5wb2ludFgsIGUucG9pbnRZLCAxIDw8IGUuYnV0dG9uKTtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHNlbGYuX2VuZCgxIDw8IGUuYnV0dG9uKTtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSk7XG4gICAgdGhpcy5kb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHNlbGYuX21vdmUoZS5wb2ludFgsIGUucG9pbnRZKTtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSk7XG5cbiAgICAvLyDjg57jgqbjgrnjgYzjgq3jg6Pjg7Pjg5DjgrnopoHntKDjga7lpJbjgavlh7rjgZ/loLTlkIjjga7lr77lv5xcbiAgICB0aGlzLmRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdXQnLCBmdW5jdGlvbihlKSB7XG4gICAgICBzZWxmLl9lbmQoMSk7XG4gICAgfSk7XG4gIH1cbn0pO1xuIiwiLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gIEV4dGVuc2lvbiBwaGluYS5hcHAuT2JqZWN0MkRcbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxucGhpbmEubmFtZXNwYWNlKCgpID0+IHtcbiAgcGhpbmEuYXBwLk9iamVjdDJELnByb3RvdHlwZS4kbWV0aG9kKFwic2V0T3JpZ2luXCIsIGZ1bmN0aW9uKHgsIHksIHJlcG9zaXRpb24pIHtcbiAgICBpZiAoIXJlcG9zaXRpb24pIHtcbiAgICAgIHRoaXMub3JpZ2luLnggPSB4O1xuICAgICAgdGhpcy5vcmlnaW4ueSA9IHk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvL+WkieabtOOBleOCjOOBn+Wfuua6lueCueOBq+enu+WLleOBleOBm+OCi1xuICAgIGNvbnN0IF9vcmlnaW5YID0gdGhpcy5vcmlnaW5YO1xuICAgIGNvbnN0IF9vcmlnaW5ZID0gdGhpcy5vcmlnaW5ZO1xuICAgIGNvbnN0IF9hZGRYID0gKHggLSBfb3JpZ2luWCkgKiB0aGlzLndpZHRoO1xuICAgIGNvbnN0IF9hZGRZID0gKHkgLSBfb3JpZ2luWSkgKiB0aGlzLmhlaWdodDtcblxuICAgIHRoaXMueCArPSBfYWRkWDtcbiAgICB0aGlzLnkgKz0gX2FkZFk7XG4gICAgdGhpcy5vcmlnaW5YID0geDtcbiAgICB0aGlzLm9yaWdpblkgPSB5O1xuXG4gICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKGNoaWxkID0+IHtcbiAgICAgIGNoaWxkLnggLT0gX2FkZFg7XG4gICAgICBjaGlsZC55IC09IF9hZGRZO1xuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9KTtcblxuICBwaGluYS5hcHAuT2JqZWN0MkQucHJvdG90eXBlLiRtZXRob2QoXCJoaXRUZXN0RWxlbWVudFwiLCBmdW5jdGlvbihlbG0pIHtcbiAgICBjb25zdCByZWN0MCA9IHRoaXMuY2FsY0dsb2JhbFJlY3QoKTtcbiAgICBjb25zdCByZWN0MSA9IGVsbS5jYWxjR2xvYmFsUmVjdCgpO1xuICAgIHJldHVybiAocmVjdDAubGVmdCA8IHJlY3QxLnJpZ2h0KSAmJiAocmVjdDAucmlnaHQgPiByZWN0MS5sZWZ0KSAmJlxuICAgICAgKHJlY3QwLnRvcCA8IHJlY3QxLmJvdHRvbSkgJiYgKHJlY3QwLmJvdHRvbSA+IHJlY3QxLnRvcCk7XG4gIH0pO1xuXG4gIHBoaW5hLmFwcC5PYmplY3QyRC5wcm90b3R5cGUuJG1ldGhvZChcImNhbGNHbG9iYWxSZWN0XCIsIGZ1bmN0aW9uKCkge1xuICAgIGNvbnN0IGxlZnQgPSB0aGlzLl93b3JsZE1hdHJpeC5tMDIgLSB0aGlzLm9yaWdpblggKiB0aGlzLndpZHRoO1xuICAgIGNvbnN0IHRvcCA9IHRoaXMuX3dvcmxkTWF0cml4Lm0xMiAtIHRoaXMub3JpZ2luWSAqIHRoaXMuaGVpZ2h0O1xuICAgIHJldHVybiBSZWN0KGxlZnQsIHRvcCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICB9KTtcblxuICBwaGluYS5hcHAuT2JqZWN0MkQucHJvdG90eXBlLiRtZXRob2QoXCJjYWxjR2xvYmFsUmVjdFwiLCBmdW5jdGlvbigpIHtcbiAgICBjb25zdCBsZWZ0ID0gdGhpcy5fd29ybGRNYXRyaXgubTAyIC0gdGhpcy5vcmlnaW5YICogdGhpcy53aWR0aDtcbiAgICBjb25zdCB0b3AgPSB0aGlzLl93b3JsZE1hdHJpeC5tMTIgLSB0aGlzLm9yaWdpblkgKiB0aGlzLmhlaWdodDtcbiAgICByZXR1cm4gUmVjdChsZWZ0LCB0b3AsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgfSk7XG5cbn0pO1xuIiwicGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuXG4gIHBoaW5hLmRpc3BsYXkuUGxhaW5FbGVtZW50LnByb3RvdHlwZS4kbWV0aG9kKFwiZGVzdHJveUNhbnZhc1wiLCBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuY2FudmFzKSByZXR1cm47XG4gICAgdGhpcy5jYW52YXMuZGVzdHJveSgpO1xuICAgIGRlbGV0ZSB0aGlzLmNhbnZhcztcbiAgfSk7XG5cbn0pO1xuIiwiLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gIEV4dGVuc2lvbiBwaGluYS5kaXNwbGF5LlNoYXBlXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5waGluYS5kaXNwbGF5LlNoYXBlLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihjYW52YXMpIHtcbiAgaWYgKCFjYW52YXMpIHtcbiAgICBjb25zb2xlLmxvZyhcImNhbnZhcyBudWxsXCIpO1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgY29udGV4dCA9IGNhbnZhcy5jb250ZXh0O1xuICAvLyDjg6rjgrXjgqTjgrpcbiAgdmFyIHNpemUgPSB0aGlzLmNhbGNDYW52YXNTaXplKCk7XG4gIGNhbnZhcy5zZXRTaXplKHNpemUud2lkdGgsIHNpemUuaGVpZ2h0KTtcbiAgLy8g44Kv44Oq44Ki44Kr44Op44O8XG4gIGNhbnZhcy5jbGVhckNvbG9yKHRoaXMuYmFja2dyb3VuZENvbG9yKTtcbiAgLy8g5Lit5b+D44Gr5bqn5qiZ44KS56e75YuVXG4gIGNhbnZhcy50cmFuc2Zvcm1DZW50ZXIoKTtcblxuICAvLyDmj4/nlLvliY3lh6bnkIZcbiAgdGhpcy5wcmVyZW5kZXIodGhpcy5jYW52YXMpO1xuXG4gIC8vIOOCueODiOODreODvOOCr+aPj+eUu1xuICBpZiAodGhpcy5pc1N0cm9rYWJsZSgpKSB7XG4gICAgY29udGV4dC5zdHJva2VTdHlsZSA9IHRoaXMuc3Ryb2tlO1xuICAgIGNvbnRleHQubGluZVdpZHRoID0gdGhpcy5zdHJva2VXaWR0aDtcbiAgICBjb250ZXh0LmxpbmVKb2luID0gXCJyb3VuZFwiO1xuICAgIGNvbnRleHQuc2hhZG93Qmx1ciA9IDA7XG4gICAgdGhpcy5yZW5kZXJTdHJva2UoY2FudmFzKTtcbiAgfVxuXG4gIC8vIOWhl+OCiuOBpOOBtuOBl+aPj+eUu1xuICBpZiAodGhpcy5maWxsKSB7XG4gICAgY29udGV4dC5maWxsU3R5bGUgPSB0aGlzLmZpbGw7XG4gICAgLy8gc2hhZG93IOOBriBvbi9vZmZcbiAgICBpZiAodGhpcy5zaGFkb3cpIHtcbiAgICAgIGNvbnRleHQuc2hhZG93Q29sb3IgPSB0aGlzLnNoYWRvdztcbiAgICAgIGNvbnRleHQuc2hhZG93Qmx1ciA9IHRoaXMuc2hhZG93Qmx1cjtcbiAgICAgIGNvbnRleHQuc2hhZG93T2Zmc2V0WCA9IHRoaXMuc2hhZG93T2Zmc2V0WCB8fCAwO1xuICAgICAgY29udGV4dC5zaGFkb3dPZmZzZXRZID0gdGhpcy5zaGFkb3dPZmZzZXRZIHx8IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHQuc2hhZG93Qmx1ciA9IDA7XG4gICAgfVxuICAgIHRoaXMucmVuZGVyRmlsbChjYW52YXMpO1xuICB9XG5cbiAgLy8g5o+P55S75b6M5Yem55CGXG4gIHRoaXMucG9zdHJlbmRlcih0aGlzLmNhbnZhcyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuIiwicGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuXG4gIHBoaW5hLmFzc2V0LlNvdW5kLnByb3RvdHlwZS4kbWV0aG9kKFwiX2xvYWRcIiwgZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgIGlmICgvXmRhdGE6Ly50ZXN0KHRoaXMuc3JjKSkge1xuICAgICAgdGhpcy5fbG9hZEZyb21VUklTY2hlbWUocmVzb2x2ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2xvYWRGcm9tRmlsZShyZXNvbHZlKTtcbiAgICB9XG4gIH0pO1xuXG4gIHBoaW5hLmFzc2V0LlNvdW5kLnByb3RvdHlwZS4kbWV0aG9kKFwiX2xvYWRGcm9tRmlsZVwiLCBmdW5jdGlvbihyZXNvbHZlKSB7XG4gICAgLy8gY29uc29sZS5sb2codGhpcy5zcmMpO1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgeG1sID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgeG1sLm9wZW4oJ0dFVCcsIHRoaXMuc3JjKTtcbiAgICB4bWwub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoeG1sLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgaWYgKFsyMDAsIDIwMSwgMF0uaW5kZXhPZih4bWwuc3RhdHVzKSAhPT0gLTEpIHtcbiAgICAgICAgICAvLyDpn7Pmpb3jg5DjgqTjg4rjg6rjg7zjg4fjg7zjgr9cbiAgICAgICAgICB2YXIgZGF0YSA9IHhtbC5yZXNwb25zZTtcbiAgICAgICAgICAvLyB3ZWJhdWRpbyDnlKjjgavlpInmj5tcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICAgIHNlbGYuY29udGV4dC5kZWNvZGVBdWRpb0RhdGEoZGF0YSwgZnVuY3Rpb24oYnVmZmVyKSB7XG4gICAgICAgICAgICBzZWxmLmxvYWRGcm9tQnVmZmVyKGJ1ZmZlcik7XG4gICAgICAgICAgICByZXNvbHZlKHNlbGYpO1xuICAgICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi6Z+z5aOw44OV44Kh44Kk44Or44Gu44OH44Kz44O844OJ44Gr5aSx5pWX44GX44G+44GX44Gf44CCKFwiICsgc2VsZi5zcmMgKyBcIilcIik7XG4gICAgICAgICAgICByZXNvbHZlKHNlbGYpO1xuICAgICAgICAgICAgc2VsZi5mbGFyZSgnZGVjb2RlZXJyb3InKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmICh4bWwuc3RhdHVzID09PSA0MDQpIHtcbiAgICAgICAgICAvLyBub3QgZm91bmRcbiAgICAgICAgICBzZWxmLmxvYWRFcnJvciA9IHRydWU7XG4gICAgICAgICAgc2VsZi5ub3RGb3VuZCA9IHRydWU7XG4gICAgICAgICAgcmVzb2x2ZShzZWxmKTtcbiAgICAgICAgICBzZWxmLmZsYXJlKCdsb2FkZXJyb3InKTtcbiAgICAgICAgICBzZWxmLmZsYXJlKCdub3Rmb3VuZCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIOOCteODvOODkOODvOOCqOODqeODvFxuICAgICAgICAgIHNlbGYubG9hZEVycm9yID0gdHJ1ZTtcbiAgICAgICAgICBzZWxmLnNlcnZlckVycm9yID0gdHJ1ZTtcbiAgICAgICAgICByZXNvbHZlKHNlbGYpO1xuICAgICAgICAgIHNlbGYuZmxhcmUoJ2xvYWRlcnJvcicpO1xuICAgICAgICAgIHNlbGYuZmxhcmUoJ3NlcnZlcmVycm9yJyk7XG4gICAgICAgIH1cbiAgICAgICAgeG1sLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGw7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHhtbC5yZXNwb25zZVR5cGUgPSAnYXJyYXlidWZmZXInO1xuXG4gICAgeG1sLnNlbmQobnVsbCk7XG4gIH0pO1xuXG4gIHBoaW5hLmFzc2V0LlNvdW5kLnByb3RvdHlwZS4kbWV0aG9kKFwicGxheVwiLCBmdW5jdGlvbih3aGVuLCBvZmZzZXQsIGR1cmF0aW9uKSB7XG4gICAgd2hlbiA9IHdoZW4gPyB3aGVuICsgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lIDogMDtcbiAgICBvZmZzZXQgPSBvZmZzZXQgfHwgMDtcblxuICAgIHZhciBzb3VyY2UgPSB0aGlzLnNvdXJjZSA9IHRoaXMuY29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcbiAgICB2YXIgYnVmZmVyID0gc291cmNlLmJ1ZmZlciA9IHRoaXMuYnVmZmVyO1xuICAgIHNvdXJjZS5sb29wID0gdGhpcy5fbG9vcDtcbiAgICBzb3VyY2UubG9vcFN0YXJ0ID0gdGhpcy5fbG9vcFN0YXJ0O1xuICAgIHNvdXJjZS5sb29wRW5kID0gdGhpcy5fbG9vcEVuZDtcbiAgICBzb3VyY2UucGxheWJhY2tSYXRlLnZhbHVlID0gdGhpcy5fcGxheWJhY2tSYXRlO1xuXG4gICAgLy8gY29ubmVjdFxuICAgIHNvdXJjZS5jb25uZWN0KHRoaXMuZ2Fpbk5vZGUpO1xuICAgIHRoaXMuZ2Fpbk5vZGUuY29ubmVjdChwaGluYS5hc3NldC5Tb3VuZC5nZXRNYXN0ZXJHYWluKCkpO1xuICAgIC8vIHBsYXlcbiAgICBpZiAoZHVyYXRpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgc291cmNlLnN0YXJ0KHdoZW4sIG9mZnNldCwgZHVyYXRpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICBzb3VyY2Uuc3RhcnQod2hlbiwgb2Zmc2V0KTtcbiAgICB9XG5cbiAgICBzb3VyY2Uub25lbmRlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCFzb3VyY2UpIHtcbiAgICAgICAgdGhpcy5mbGFyZSgnZW5kZWQnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgc291cmNlLm9uZW5kZWQgPSBudWxsO1xuICAgICAgc291cmNlLmRpc2Nvbm5lY3QoKTtcbiAgICAgIHNvdXJjZS5idWZmZXIgPSBudWxsO1xuICAgICAgc291cmNlID0gbnVsbDtcbiAgICAgIHRoaXMuZmxhcmUoJ2VuZGVkJyk7XG4gICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0pO1xuXG4gIHBoaW5hLmFzc2V0LlNvdW5kLnByb3RvdHlwZS4kbWV0aG9kKFwic3RvcFwiLCBmdW5jdGlvbigpIHtcbiAgICAvLyBzdG9wXG4gICAgaWYgKHRoaXMuc291cmNlKSB7XG4gICAgICAvLyBzdG9wIOOBmeOCi+OBqCBzb3VyY2UuZW5kZWTjgoLnmbrngavjgZnjgotcbiAgICAgIHRoaXMuc291cmNlLnN0b3AgJiYgdGhpcy5zb3VyY2Uuc3RvcCgwKTtcbiAgICAgIHRoaXMuZmxhcmUoJ3N0b3AnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSk7XG5cbn0pO1xuIiwiLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gIEV4dGVuc2lvbiBwaGluYS5hc3NldC5Tb3VuZE1hbmFnZXJcbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblNvdW5kTWFuYWdlci4kbWV0aG9kKFwiZ2V0Vm9sdW1lXCIsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4gIXRoaXMuaXNNdXRlKCkgPyB0aGlzLnZvbHVtZSA6IDA7XG59KTtcblxuU291bmRNYW5hZ2VyLiRtZXRob2QoXCJnZXRWb2x1bWVNdXNpY1wiLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICF0aGlzLmlzTXV0ZSgpID8gdGhpcy5tdXNpY1ZvbHVtZSA6IDA7XG59KTtcblxuU291bmRNYW5hZ2VyLiRtZXRob2QoXCJzZXRWb2x1bWVNdXNpY1wiLCBmdW5jdGlvbih2b2x1bWUpIHtcbiAgdGhpcy5tdXNpY1ZvbHVtZSA9IHZvbHVtZTtcbiAgaWYgKCF0aGlzLmlzTXV0ZSgpICYmIHRoaXMuY3VycmVudE11c2ljKSB7XG4gICAgdGhpcy5jdXJyZW50TXVzaWMudm9sdW1lID0gdm9sdW1lO1xuICB9XG4gIHJldHVybiB0aGlzO1xufSk7XG5cblNvdW5kTWFuYWdlci4kbWV0aG9kKFwicGxheU11c2ljXCIsIGZ1bmN0aW9uKG5hbWUsIGZhZGVUaW1lLCBsb29wLCB3aGVuLCBvZmZzZXQsIGR1cmF0aW9uKSB7XG4gIC8vIGNvbnN0IHJlcyA9IHBoaW5hLmNoZWNrQnJvd3NlcigpO1xuICAvLyBpZiAocmVzLmlzSWUxMSkgcmV0dXJuIG51bGw7XG5cbiAgbG9vcCA9IChsb29wICE9PSB1bmRlZmluZWQpID8gbG9vcCA6IHRydWU7XG5cbiAgaWYgKHRoaXMuY3VycmVudE11c2ljKSB7XG4gICAgdGhpcy5zdG9wTXVzaWMoZmFkZVRpbWUpO1xuICB9XG5cbiAgdmFyIG11c2ljID0gbnVsbDtcbiAgaWYgKG5hbWUgaW5zdGFuY2VvZiBwaGluYS5hc3NldC5Tb3VuZCB8fCBuYW1lIGluc3RhbmNlb2YgcGhpbmEuYXNzZXQuRG9tQXVkaW9Tb3VuZCkge1xuICAgIG11c2ljID0gbmFtZTtcbiAgfSBlbHNlIHtcbiAgICBtdXNpYyA9IHBoaW5hLmFzc2V0LkFzc2V0TWFuYWdlci5nZXQoJ3NvdW5kJywgbmFtZSk7XG4gIH1cblxuICBpZiAoIW11c2ljKSB7XG4gICAgY29uc29sZS5lcnJvcihcIlNvdW5kIG5vdCBmb3VuZDogXCIsIG5hbWUpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgbXVzaWMuc2V0TG9vcChsb29wKTtcbiAgbXVzaWMucGxheSh3aGVuLCBvZmZzZXQsIGR1cmF0aW9uKTtcblxuICBpZiAoZmFkZVRpbWUgPiAwKSB7XG4gICAgdmFyIGNvdW50ID0gMzI7XG4gICAgdmFyIGNvdW50ZXIgPSAwO1xuICAgIHZhciB1bml0VGltZSA9IGZhZGVUaW1lIC8gY291bnQ7XG4gICAgdmFyIHZvbHVtZSA9IHRoaXMuZ2V0Vm9sdW1lTXVzaWMoKTtcblxuICAgIG11c2ljLnZvbHVtZSA9IDA7XG4gICAgdmFyIGlkID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICBjb3VudGVyICs9IDE7XG4gICAgICB2YXIgcmF0ZSA9IGNvdW50ZXIgLyBjb3VudDtcbiAgICAgIG11c2ljLnZvbHVtZSA9IHJhdGUgKiB2b2x1bWU7XG5cbiAgICAgIGlmIChyYXRlID49IDEpIHtcbiAgICAgICAgY2xlYXJJbnRlcnZhbChpZCk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSwgdW5pdFRpbWUpO1xuICB9IGVsc2Uge1xuICAgIG11c2ljLnZvbHVtZSA9IHRoaXMuZ2V0Vm9sdW1lTXVzaWMoKTtcbiAgfVxuXG4gIHRoaXMuY3VycmVudE11c2ljID0gbXVzaWM7XG5cbiAgcmV0dXJuIHRoaXMuY3VycmVudE11c2ljO1xufSk7XG5cbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIOODnOOCpOOCueeUqOOBrumfs+mHj+ioreWumuOAgeWGjeeUn+ODoeOCveODg+ODieaLoeW8tVxuU291bmRNYW5hZ2VyLiRtZXRob2QoXCJnZXRWb2x1bWVWb2ljZVwiLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICF0aGlzLmlzTXV0ZSgpID8gdGhpcy52b2ljZVZvbHVtZSA6IDA7XG59KTtcblxuU291bmRNYW5hZ2VyLiRtZXRob2QoXCJzZXRWb2x1bWVWb2ljZVwiLCBmdW5jdGlvbih2b2x1bWUpIHtcbiAgdGhpcy52b2ljZVZvbHVtZSA9IHZvbHVtZTtcbiAgcmV0dXJuIHRoaXM7XG59KTtcblxuU291bmRNYW5hZ2VyLiRtZXRob2QoXCJwbGF5Vm9pY2VcIiwgZnVuY3Rpb24obmFtZSkge1xuICB2YXIgc291bmQgPSBwaGluYS5hc3NldC5Bc3NldE1hbmFnZXIuZ2V0KCdzb3VuZCcsIG5hbWUpO1xuICBzb3VuZC52b2x1bWUgPSB0aGlzLmdldFZvbHVtZVZvaWNlKCk7XG4gIHNvdW5kLnBsYXkoKTtcbiAgcmV0dXJuIHNvdW5kO1xufSk7XG4iLCIvL+OCueODl+ODqeOCpOODiOapn+iDveaLoeW8tVxucGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuXG4gIHBoaW5hLmRpc3BsYXkuU3ByaXRlLnByb3RvdHlwZS5zZXRGcmFtZVRyaW1taW5nID0gZnVuY3Rpb24oeCwgeSwgd2lkdGgsIGhlaWdodCkge1xuICAgIHRoaXMuX2ZyYW1lVHJpbVggPSB4IHx8IDA7XG4gICAgdGhpcy5fZnJhbWVUcmltWSA9IHkgfHwgMDtcbiAgICB0aGlzLl9mcmFtZVRyaW1XaWR0aCA9IHdpZHRoIHx8IHRoaXMuaW1hZ2UuZG9tRWxlbWVudC53aWR0aCAtIHRoaXMuX2ZyYW1lVHJpbVg7XG4gICAgdGhpcy5fZnJhbWVUcmltSGVpZ2h0ID0gaGVpZ2h0IHx8IHRoaXMuaW1hZ2UuZG9tRWxlbWVudC5oZWlnaHQgLSB0aGlzLl9mcmFtZVRyaW1ZO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcGhpbmEuZGlzcGxheS5TcHJpdGUucHJvdG90eXBlLnNldEZyYW1lSW5kZXggPSBmdW5jdGlvbihpbmRleCwgd2lkdGgsIGhlaWdodCkge1xuICAgIHZhciBzeCA9IHRoaXMuX2ZyYW1lVHJpbVggfHwgMDtcbiAgICB2YXIgc3kgPSB0aGlzLl9mcmFtZVRyaW1ZIHx8IDA7XG4gICAgdmFyIHN3ID0gdGhpcy5fZnJhbWVUcmltV2lkdGggIHx8ICh0aGlzLmltYWdlLmRvbUVsZW1lbnQud2lkdGgtc3gpO1xuICAgIHZhciBzaCA9IHRoaXMuX2ZyYW1lVHJpbUhlaWdodCB8fCAodGhpcy5pbWFnZS5kb21FbGVtZW50LmhlaWdodC1zeSk7XG5cbiAgICB2YXIgdHcgID0gd2lkdGggfHwgdGhpcy53aWR0aDsgICAgICAvLyB0d1xuICAgIHZhciB0aCAgPSBoZWlnaHQgfHwgdGhpcy5oZWlnaHQ7ICAgIC8vIHRoXG4gICAgdmFyIHJvdyA9IH5+KHN3IC8gdHcpO1xuICAgIHZhciBjb2wgPSB+fihzaCAvIHRoKTtcbiAgICB2YXIgbWF4SW5kZXggPSByb3cqY29sO1xuICAgIGluZGV4ID0gaW5kZXglbWF4SW5kZXg7XG5cbiAgICB2YXIgeCAgID0gaW5kZXglcm93O1xuICAgIHZhciB5ICAgPSB+fihpbmRleC9yb3cpO1xuICAgIHRoaXMuc3JjUmVjdC54ID0gc3greCp0dztcbiAgICB0aGlzLnNyY1JlY3QueSA9IHN5K3kqdGg7XG4gICAgdGhpcy5zcmNSZWN0LndpZHRoICA9IHR3O1xuICAgIHRoaXMuc3JjUmVjdC5oZWlnaHQgPSB0aDtcblxuICAgIHRoaXMuX2ZyYW1lSW5kZXggPSBpbmRleDtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbn0pOyIsInBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcbiAgLy8g5paH5a2X5YiX44GL44KJ5pWw5YCk44KS5oq95Ye644GZ44KLXG4gIC8vIOODrOOCpOOCouOCpuODiOODleOCoeOCpOODq+OBi+OCieS9nOalreOBmeOCi+WgtOWQiOOBq+WIqeeUqOOBl+OBn+OBj+OBquOCi1xuICAvLyBob2dlXzAgaG9nZV8x44Gq44Gp44GL44KJ5pWw5a2X44Gg44GR5oq95Ye6XG4gIC8vIDAxMDBfaG9nZV85OTk5ID0+IFtcIjAxMDBcIiAsIFwiOTk5OVwiXeOBq+OBquOCi1xuICAvLyBob2dlMC4w44Go44GL44Gv44Gp44GG44GZ44GL44Gq77yfXG4gIC8vIOaKveWHuuW+jOOBq3BhcnNlSW5044GZ44KL44GL44Gv5qSc6KiO5LitXG4gIFN0cmluZy5wcm90b3R5cGUuJG1ldGhvZChcIm1hdGNoSW50XCIsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLm1hdGNoKC9bMC05XSsvZyk7XG4gIH0pO1xufSk7XG4iLCJwaGluYS5uYW1lc3BhY2UoZnVuY3Rpb24oKSB7XG5cbiAgcGhpbmEuYXNzZXQuVGV4dHVyZS5wcm90b3R5cGUuJG1ldGhvZChcIl9sb2FkXCIsIGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICB0aGlzLmRvbUVsZW1lbnQgPSBuZXcgSW1hZ2UoKTtcblxuICAgIHZhciBpc0xvY2FsID0gKGxvY2F0aW9uLnByb3RvY29sID09ICdmaWxlOicpO1xuICAgIGlmICghKC9eZGF0YTovLnRlc3QodGhpcy5zcmMpKSkge1xuICAgICAgdGhpcy5kb21FbGVtZW50LmNyb3NzT3JpZ2luID0gJ2Fub255bW91cyc7IC8vIOOCr+ODreOCueOCquODquOCuOODs+ino+mZpFxuICAgIH1cblxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLmRvbUVsZW1lbnQub25sb2FkID0gZnVuY3Rpb24oZSkge1xuICAgICAgc2VsZi5sb2FkZWQgPSB0cnVlO1xuICAgICAgZS50YXJnZXQub25sb2FkID0gbnVsbDtcbiAgICAgIGUudGFyZ2V0Lm9uZXJyb3IgPSBudWxsO1xuICAgICAgcmVzb2x2ZShzZWxmKTtcbiAgICB9O1xuXG4gICAgdGhpcy5kb21FbGVtZW50Lm9uZXJyb3IgPSBmdW5jdGlvbihlKSB7XG4gICAgICBlLnRhcmdldC5vbmxvYWQgPSBudWxsO1xuICAgICAgZS50YXJnZXQub25lcnJvciA9IG51bGw7XG4gICAgICBjb25zb2xlLmVycm9yKFwicGhpbmEuYXNzZXQuVGV4dHVyZSBfbG9hZCBvbkVycm9yIFwiLCB0aGlzLnNyYyk7XG4gICAgfTtcblxuICAgIHRoaXMuZG9tRWxlbWVudC5zcmMgPSB0aGlzLnNyYztcbiAgfSk7XG5cbn0pO1xuIiwicGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuXG4gIHBoaW5hLmFjY2Vzc29yeS5Ud2VlbmVyLnByb3RvdHlwZS4kbWV0aG9kKFwiX3VwZGF0ZVR3ZWVuXCIsIGZ1bmN0aW9uKGFwcCkge1xuICAgIC8v4oC744GT44KM44Gq44GE44GocGF1c2XjgYzjgYbjgZTjgYvjgarjgYRcbiAgICBpZiAoIXRoaXMucGxheWluZykgcmV0dXJuO1xuXG4gICAgdmFyIHR3ZWVuID0gdGhpcy5fdHdlZW47XG4gICAgdmFyIHRpbWUgPSB0aGlzLl9nZXRVbml0VGltZShhcHApO1xuXG4gICAgdHdlZW4uZm9yd2FyZCh0aW1lKTtcbiAgICB0aGlzLmZsYXJlKCd0d2VlbicpO1xuXG4gICAgaWYgKHR3ZWVuLnRpbWUgPj0gdHdlZW4uZHVyYXRpb24pIHtcbiAgICAgIGRlbGV0ZSB0aGlzLl90d2VlbjtcbiAgICAgIHRoaXMuX3R3ZWVuID0gbnVsbDtcbiAgICAgIHRoaXMuX3VwZGF0ZSA9IHRoaXMuX3VwZGF0ZVRhc2s7XG4gICAgfVxuICB9KTtcblxuICBwaGluYS5hY2Nlc3NvcnkuVHdlZW5lci5wcm90b3R5cGUuJG1ldGhvZChcIl91cGRhdGVXYWl0XCIsIGZ1bmN0aW9uKGFwcCkge1xuICAgIC8v4oC744GT44KM44Gq44GE44GocGF1c2XjgYzjgYbjgZTjgYvjgarjgYRcbiAgICBpZiAoIXRoaXMucGxheWluZykgcmV0dXJuO1xuXG4gICAgdmFyIHdhaXQgPSB0aGlzLl93YWl0O1xuICAgIHZhciB0aW1lID0gdGhpcy5fZ2V0VW5pdFRpbWUoYXBwKTtcbiAgICB3YWl0LnRpbWUgKz0gdGltZTtcblxuICAgIGlmICh3YWl0LnRpbWUgPj0gd2FpdC5saW1pdCkge1xuICAgICAgZGVsZXRlIHRoaXMuX3dhaXQ7XG4gICAgICB0aGlzLl93YWl0ID0gbnVsbDtcbiAgICAgIHRoaXMuX3VwZGF0ZSA9IHRoaXMuX3VwZGF0ZVRhc2s7XG4gICAgfVxuICB9KTtcblxufSk7XG4iLCJwaGluYS5kZWZpbmUoXCJCdXR0b25pemVcIiwge1xuICBpbml0OiBmdW5jdGlvbigpIHt9LFxuICBfc3RhdGljOiB7XG4gICAgU1RBVFVTOiB7XG4gICAgICBOT05FOiAwLFxuICAgICAgU1RBUlQ6IDEsXG4gICAgICBFTkQ6IDIsXG4gICAgfSxcbiAgICBzdGF0dXM6IDAsXG4gICAgcmVjdDogZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgZWxlbWVudC5ib3VuZGluZ1R5cGUgPSBcInJlY3RcIjtcbiAgICAgIHRoaXMuX2NvbW1vbihlbGVtZW50KTtcbiAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH0sXG4gICAgY2lyY2xlOiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICBlbGVtZW50LnJhZGl1cyA9IE1hdGgubWF4KGVsZW1lbnQud2lkdGgsIGVsZW1lbnQuaGVpZ2h0KSAqIDAuNTtcbiAgICAgIGVsZW1lbnQuYm91bmRpbmdUeXBlID0gXCJjaXJjbGVcIjtcbiAgICAgIHRoaXMuX2NvbW1vbihlbGVtZW50KTtcbiAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH0sXG4gICAgX2NvbW1vbjogZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgLy9UT0RPOuOCqOODh+OCo+OCv+ODvOOBp+OBjeOCi+OBvuOBp+OBruaaq+WumuWvvuW/nFxuICAgICAgZWxlbWVudC5zZXRPcmlnaW4oMC41LCAwLjUsIHRydWUpO1xuXG4gICAgICBlbGVtZW50LmludGVyYWN0aXZlID0gdHJ1ZTtcbiAgICAgIGVsZW1lbnQuY2xpY2tTb3VuZCA9IFwic2UvY2xpY2tCdXR0b25cIjtcblxuICAgICAgLy9UT0RPOuODnOOCv+ODs+OBruWQjOaZguaKvOS4i+OBr+Wun+apn+OBp+iqv+aVtOOBmeOCi1xuICAgICAgZWxlbWVudC5vbihcInBvaW50c3RhcnRcIiwgZSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnN0YXR1cyAhPSB0aGlzLlNUQVRVUy5OT05FKSByZXR1cm47XG4gICAgICAgIHRoaXMuc3RhdHVzID0gdGhpcy5TVEFUVVMuU1RBUlQ7XG4gICAgICAgIGVsZW1lbnQudHdlZW5lci5jbGVhcigpXG4gICAgICAgICAgLnRvKHtcbiAgICAgICAgICAgIHNjYWxlWDogMC45LFxuICAgICAgICAgICAgc2NhbGVZOiAwLjlcbiAgICAgICAgICB9LCAxMDApO1xuICAgICAgfSk7XG5cbiAgICAgIGVsZW1lbnQub24oXCJwb2ludGVuZFwiLCAoZSkgPT4ge1xuICAgICAgICBpZiAodGhpcy5zdGF0dXMgIT0gdGhpcy5TVEFUVVMuU1RBUlQpIHJldHVybjtcbiAgICAgICAgY29uc3QgaGl0VGVzdCA9IGVsZW1lbnQuaGl0VGVzdChlLnBvaW50ZXIueCwgZS5wb2ludGVyLnkpO1xuICAgICAgICB0aGlzLnN0YXR1cyA9IHRoaXMuU1RBVFVTLkVORDtcbiAgICAgICAgaWYgKGhpdFRlc3QpIGVsZW1lbnQuZmxhcmUoXCJjbGlja1NvdW5kXCIpO1xuXG4gICAgICAgIGVsZW1lbnQudHdlZW5lci5jbGVhcigpXG4gICAgICAgICAgLnRvKHtcbiAgICAgICAgICAgIHNjYWxlWDogMS4wLFxuICAgICAgICAgICAgc2NhbGVZOiAxLjBcbiAgICAgICAgICB9LCAxMDApXG4gICAgICAgICAgLmNhbGwoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zdGF0dXMgPSB0aGlzLlNUQVRVUy5OT05FO1xuICAgICAgICAgICAgaWYgKCFoaXRUZXN0KSByZXR1cm47XG4gICAgICAgICAgICBlbGVtZW50LmZsYXJlKFwiY2xpY2tlZFwiLCB7XG4gICAgICAgICAgICAgIHBvaW50ZXI6IGUucG9pbnRlclxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgLy/jgqLjg4vjg6Hjg7zjgrfjg6fjg7Pjga7mnIDkuK3jgavliYrpmaTjgZXjgozjgZ/loLTlkIjjgavlgpnjgYjjgaZyZW1vdmVk44Kk44OZ44Oz44OI5pmC44Gr44OV44Op44Kw44KS5YWD44Gr5oi744GX44Gm44GK44GPXG4gICAgICBlbGVtZW50Lm9uZShcInJlbW92ZWRcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLnN0YXR1cyA9IHRoaXMuU1RBVFVTLk5PTkU7XG4gICAgICB9KTtcblxuICAgICAgZWxlbWVudC5vbihcImNsaWNrU291bmRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghZWxlbWVudC5jbGlja1NvdW5kKSByZXR1cm47XG4gICAgICAgIC8vcGhpbmEuYXNzZXQuU291bmRNYW5hZ2VyLnBsYXkoZWxlbWVudC5jbGlja1NvdW5kKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gIH0sXG59KTtcbiIsInBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcblxuICAvKipcbiAgICog44OG44Kv44K544OB44Oj6Zai5L+C44Gu44Om44O844OG44Kj44Oq44OG44KjXG4gICAqL1xuICBwaGluYS5kZWZpbmUoXCJUZXh0dXJlVXRpbFwiLCB7XG5cbiAgICBfc3RhdGljOiB7XG5cbiAgICAgIC8qKlxuICAgICAgICogUkdC5ZCE6KaB57Sg44Gr5a6f5pWw44KS56mN566X44GZ44KLXG4gICAgICAgKi9cbiAgICAgIG11bHRpcGx5Q29sb3I6IGZ1bmN0aW9uKHRleHR1cmUsIHJlZCwgZ3JlZW4sIGJsdWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZih0ZXh0dXJlKSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIHRleHR1cmUgPSBBc3NldE1hbmFnZXIuZ2V0KFwiaW1hZ2VcIiwgdGV4dHVyZSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB3aWR0aCA9IHRleHR1cmUuZG9tRWxlbWVudC53aWR0aDtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gdGV4dHVyZS5kb21FbGVtZW50LmhlaWdodDtcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBDYW52YXMoKS5zZXRTaXplKHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICBjb25zdCBjb250ZXh0ID0gcmVzdWx0LmNvbnRleHQ7XG5cbiAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UodGV4dHVyZS5kb21FbGVtZW50LCAwLCAwKTtcbiAgICAgICAgY29uc3QgaW1hZ2VEYXRhID0gY29udGV4dC5nZXRJbWFnZURhdGEoMCwgMCwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW1hZ2VEYXRhLmRhdGEubGVuZ3RoOyBpICs9IDQpIHtcbiAgICAgICAgICBpbWFnZURhdGEuZGF0YVtpICsgMF0gPSBNYXRoLmZsb29yKGltYWdlRGF0YS5kYXRhW2kgKyAwXSAqIHJlZCk7XG4gICAgICAgICAgaW1hZ2VEYXRhLmRhdGFbaSArIDFdID0gTWF0aC5mbG9vcihpbWFnZURhdGEuZGF0YVtpICsgMV0gKiBncmVlbik7XG4gICAgICAgICAgaW1hZ2VEYXRhLmRhdGFbaSArIDJdID0gTWF0aC5mbG9vcihpbWFnZURhdGEuZGF0YVtpICsgMl0gKiBibHVlKTtcbiAgICAgICAgfVxuICAgICAgICBjb250ZXh0LnB1dEltYWdlRGF0YShpbWFnZURhdGEsIDAsIDApO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIOiJsuebuOODu+W9qeW6puODu+aYjuW6puOCkuaTjeS9nOOBmeOCi1xuICAgICAgICovXG4gICAgICBlZGl0QnlIc2w6IGZ1bmN0aW9uKHRleHR1cmUsIGgsIHMsIGwpIHtcbiAgICAgICAgaWYgKHR5cGVvZih0ZXh0dXJlKSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIHRleHR1cmUgPSBBc3NldE1hbmFnZXIuZ2V0KFwiaW1hZ2VcIiwgdGV4dHVyZSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB3aWR0aCA9IHRleHR1cmUuZG9tRWxlbWVudC53aWR0aDtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gdGV4dHVyZS5kb21FbGVtZW50LmhlaWdodDtcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBDYW52YXMoKS5zZXRTaXplKHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICBjb25zdCBjb250ZXh0ID0gcmVzdWx0LmNvbnRleHQ7XG5cbiAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UodGV4dHVyZS5kb21FbGVtZW50LCAwLCAwKTtcbiAgICAgICAgY29uc3QgaW1hZ2VEYXRhID0gY29udGV4dC5nZXRJbWFnZURhdGEoMCwgMCwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW1hZ2VEYXRhLmRhdGEubGVuZ3RoOyBpICs9IDQpIHtcbiAgICAgICAgICBjb25zdCByID0gaW1hZ2VEYXRhLmRhdGFbaSArIDBdO1xuICAgICAgICAgIGNvbnN0IGcgPSBpbWFnZURhdGEuZGF0YVtpICsgMV07XG4gICAgICAgICAgY29uc3QgYiA9IGltYWdlRGF0YS5kYXRhW2kgKyAyXTtcblxuICAgICAgICAgIGNvbnN0IGhzbCA9IHBoaW5hLnV0aWwuQ29sb3IuUkdCdG9IU0wociwgZywgYik7XG4gICAgICAgICAgY29uc3QgbmV3UmdiID0gcGhpbmEudXRpbC5Db2xvci5IU0x0b1JHQihoc2xbMF0gKyBoLCBNYXRoLmNsYW1wKGhzbFsxXSArIHMsIDAsIDEwMCksIE1hdGguY2xhbXAoaHNsWzJdICsgbCwgMCwgMTAwKSk7XG5cbiAgICAgICAgICBpbWFnZURhdGEuZGF0YVtpICsgMF0gPSBuZXdSZ2JbMF07XG4gICAgICAgICAgaW1hZ2VEYXRhLmRhdGFbaSArIDFdID0gbmV3UmdiWzFdO1xuICAgICAgICAgIGltYWdlRGF0YS5kYXRhW2kgKyAyXSA9IG5ld1JnYlsyXTtcbiAgICAgICAgfVxuICAgICAgICBjb250ZXh0LnB1dEltYWdlRGF0YShpbWFnZURhdGEsIDAsIDApO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9LFxuXG4gICAgfSxcblxuICAgIGluaXQ6IGZ1bmN0aW9uKCkge30sXG4gIH0pO1xuXG59KTtcbiIsIi8qXG4gKiAgcGhpbmEudGlsZWRtYXAuanNcbiAqICAyMDE2LzkvMTBcbiAqICBAYXV0aGVyIG1pbmltbyAgXG4gKiAgVGhpcyBQcm9ncmFtIGlzIE1JVCBsaWNlbnNlLlxuICpcbiAqL1xuXG5waGluYS5uYW1lc3BhY2UoZnVuY3Rpb24oKSB7XG5cbiAgcGhpbmEuZGVmaW5lKFwicGhpbmEuYXNzZXQuVGlsZWRNYXBcIiwge1xuICAgIHN1cGVyQ2xhc3M6IFwicGhpbmEuYXNzZXQuQXNzZXRcIixcblxuICAgIGltYWdlOiBudWxsLFxuXG4gICAgdGlsZXNldHM6IG51bGwsXG4gICAgbGF5ZXJzOiBudWxsLFxuXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc3VwZXJJbml0KCk7XG4gICAgfSxcblxuICAgIF9sb2FkOiBmdW5jdGlvbihyZXNvbHZlKSB7XG4gICAgICAvL+ODkeOCueaKnOOBjeWHuuOBl1xuICAgICAgdGhpcy5wYXRoID0gXCJcIjtcbiAgICAgIGNvbnN0IGxhc3QgPSB0aGlzLnNyYy5sYXN0SW5kZXhPZihcIi9cIik7XG4gICAgICBpZiAobGFzdCA+IDApIHtcbiAgICAgICAgICB0aGlzLnBhdGggPSB0aGlzLnNyYy5zdWJzdHJpbmcoMCwgbGFzdCsxKTtcbiAgICAgIH1cblxuICAgICAgLy/ntYLkuobplqLmlbDkv53lrZhcbiAgICAgIHRoaXMuX3Jlc29sdmUgPSByZXNvbHZlO1xuXG4gICAgICAvLyBsb2FkXG4gICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgIGNvbnN0IHhtbCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgeG1sLm9wZW4oJ0dFVCcsIHRoaXMuc3JjKTtcbiAgICAgIHhtbC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHhtbC5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgaWYgKFsyMDAsIDIwMSwgMF0uaW5kZXhPZih4bWwuc3RhdHVzKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0geG1sLnJlc3BvbnNlVGV4dDtcbiAgICAgICAgICAgIGRhdGEgPSAobmV3IERPTVBhcnNlcigpKS5wYXJzZUZyb21TdHJpbmcoZGF0YSwgXCJ0ZXh0L3htbFwiKTtcbiAgICAgICAgICAgIHNlbGYuZGF0YVR5cGUgPSBcInhtbFwiO1xuICAgICAgICAgICAgc2VsZi5kYXRhID0gZGF0YTtcbiAgICAgICAgICAgIHNlbGYuX3BhcnNlKGRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHhtbC5zZW5kKG51bGwpO1xuICAgIH0sXG5cbiAgICAvL+ODnuODg+ODl+OCpOODoeODvOOCuOWPluW+l1xuICAgIGdldEltYWdlOiBmdW5jdGlvbihsYXllck5hbWUpIHtcbiAgICAgIGlmIChsYXllck5hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbWFnZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZW5lcmF0ZUltYWdlKGxheWVyTmFtZSk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8v5oyH5a6a44Oe44OD44OX44Os44Kk44Ok44O844KS6YWN5YiX44Go44GX44Gm5Y+W5b6XXG4gICAgZ2V0TWFwRGF0YTogZnVuY3Rpb24obGF5ZXJOYW1lKSB7XG4gICAgICAvL+ODrOOCpOODpOODvOaknOe0olxuICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMubGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0aGlzLmxheWVyc1tpXS5uYW1lID09IGxheWVyTmFtZSkge1xuICAgICAgICAgIC8v44Kz44OU44O844KS6L+U44GZXG4gICAgICAgICAgcmV0dXJuIHRoaXMubGF5ZXJzW2ldLmRhdGEuY29uY2F0KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG5cbiAgICAvL+OCquODluOCuOOCp+OCr+ODiOOCsOODq+ODvOODl+OCkuWPluW+l++8iOaMh+WumuOBjOeEoeOBhOWgtOWQiOOAgeWFqOODrOOCpOODpOODvOOCkumFjeWIl+OBq+OBl+OBpui/lOOBme+8iVxuICAgIGdldE9iamVjdEdyb3VwOiBmdW5jdGlvbihncm91cE5hbWUpIHtcbiAgICAgIGdyb3VwTmFtZSA9IGdyb3VwTmFtZSB8fCBudWxsO1xuICAgICAgdmFyIGxzID0gW107XG4gICAgICB2YXIgbGVuID0gdGhpcy5sYXllcnMubGVuZ3RoO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBpZiAodGhpcy5sYXllcnNbaV0udHlwZSA9PSBcIm9iamVjdGdyb3VwXCIpIHtcbiAgICAgICAgICBpZiAoZ3JvdXBOYW1lID09IG51bGwgfHwgZ3JvdXBOYW1lID09IHRoaXMubGF5ZXJzW2ldLm5hbWUpIHtcbiAgICAgICAgICAgIC8v44Os44Kk44Ok44O85oOF5aCx44KS44Kv44Ot44O844Oz44GZ44KLXG4gICAgICAgICAgICBjb25zdCBvYmogPSB0aGlzLl9jbG9uZU9iamVjdExheWVyKHRoaXMubGF5ZXJzW2ldKTtcbiAgICAgICAgICAgIGlmIChncm91cE5hbWUgIT09IG51bGwpIHJldHVybiBvYmo7XG4gICAgICAgICAgfVxuICAgICAgICAgIGxzLnB1c2gob2JqKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGxzO1xuICAgIH0sXG5cbiAgICAvL+OCquODluOCuOOCp+OCr+ODiOODrOOCpOODpOODvOOCkuOCr+ODreODvOODs+OBl+OBpui/lOOBmVxuICAgIF9jbG9uZU9iamVjdExheWVyOiBmdW5jdGlvbihzcmNMYXllcikge1xuICAgICAgY29uc3QgcmVzdWx0ID0ge30uJHNhZmUoc3JjTGF5ZXIpO1xuICAgICAgcmVzdWx0Lm9iamVjdHMgPSBbXTtcbiAgICAgIC8v44Os44Kk44Ok44O85YaF44Kq44OW44K444Kn44Kv44OI44Gu44Kz44OU44O8XG4gICAgICBzcmNMYXllci5vYmplY3RzLmZvckVhY2goZnVuY3Rpb24ob2JqKXtcbiAgICAgICAgY29uc3QgcmVzT2JqID0ge1xuICAgICAgICAgIHByb3BlcnRpZXM6IHt9LiRzYWZlKG9iai5wcm9wZXJ0aWVzKSxcbiAgICAgICAgfS4kZXh0ZW5kKG9iaik7XG4gICAgICAgIGlmIChvYmouZWxsaXBzZSkgcmVzT2JqLmVsbGlwc2UgPSBvYmouZWxsaXBzZTtcbiAgICAgICAgaWYgKG9iai5naWQpIHJlc09iai5naWQgPSBvYmouZ2lkO1xuICAgICAgICBpZiAob2JqLnBvbHlnb24pIHJlc09iai5wb2x5Z29uID0gb2JqLnBvbHlnb24uY2xvbmUoKTtcbiAgICAgICAgaWYgKG9iai5wb2x5bGluZSkgcmVzT2JqLnBvbHlsaW5lID0gb2JqLnBvbHlsaW5lLmNsb25lKCk7XG4gICAgICAgIHJlc3VsdC5vYmplY3RzLnB1c2gocmVzT2JqKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgX3BhcnNlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAvL+OCv+OCpOODq+WxnuaAp+aDheWgseWPluW+l1xuICAgICAgdmFyIG1hcCA9IGRhdGEuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ21hcCcpWzBdO1xuICAgICAgdmFyIGF0dHIgPSB0aGlzLl9hdHRyVG9KU09OKG1hcCk7XG4gICAgICB0aGlzLiRleHRlbmQoYXR0cik7XG4gICAgICB0aGlzLnByb3BlcnRpZXMgPSB0aGlzLl9wcm9wZXJ0aWVzVG9KU09OKG1hcCk7XG5cbiAgICAgIC8v44K/44Kk44Or44K744OD44OI5Y+W5b6XXG4gICAgICB0aGlzLnRpbGVzZXRzID0gdGhpcy5fcGFyc2VUaWxlc2V0cyhkYXRhKTtcblxuICAgICAgLy/jgr/jgqTjg6vjgrvjg4Pjg4jmg4XloLHoo5zlroxcbiAgICAgIHZhciBkZWZhdWx0QXR0ciA9IHtcbiAgICAgICAgdGlsZXdpZHRoOiAzMixcbiAgICAgICAgdGlsZWhlaWdodDogMzIsXG4gICAgICAgIHNwYWNpbmc6IDAsXG4gICAgICAgIG1hcmdpbjogMCxcbiAgICAgIH07XG4gICAgICB0aGlzLnRpbGVzZXRzLmNoaXBzID0gW107XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudGlsZXNldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgLy/jgr/jgqTjg6vjgrvjg4Pjg4jlsZ7mgKfmg4XloLHlj5blvpdcbiAgICAgICAgdmFyIGF0dHIgPSB0aGlzLl9hdHRyVG9KU09OKGRhdGEuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3RpbGVzZXQnKVtpXSk7XG4gICAgICAgIGF0dHIuJHNhZmUoZGVmYXVsdEF0dHIpO1xuICAgICAgICBhdHRyLmZpcnN0Z2lkLS07XG4gICAgICAgIHRoaXMudGlsZXNldHNbaV0uJGV4dGVuZChhdHRyKTtcblxuICAgICAgICAvL+ODnuODg+ODl+ODgeODg+ODl+ODquOCueODiOS9nOaIkFxuICAgICAgICB2YXIgdCA9IHRoaXMudGlsZXNldHNbaV07XG4gICAgICAgIHRoaXMudGlsZXNldHNbaV0ubWFwQ2hpcCA9IFtdO1xuICAgICAgICBmb3IgKHZhciByID0gYXR0ci5maXJzdGdpZDsgciA8IGF0dHIuZmlyc3RnaWQrYXR0ci50aWxlY291bnQ7IHIrKykge1xuICAgICAgICAgIHZhciBjaGlwID0ge1xuICAgICAgICAgICAgaW1hZ2U6IHQuaW1hZ2UsXG4gICAgICAgICAgICB4OiAoKHIgLSBhdHRyLmZpcnN0Z2lkKSAlIHQuY29sdW1ucykgKiAodC50aWxld2lkdGggKyB0LnNwYWNpbmcpICsgdC5tYXJnaW4sXG4gICAgICAgICAgICB5OiBNYXRoLmZsb29yKChyIC0gYXR0ci5maXJzdGdpZCkgLyB0LmNvbHVtbnMpICogKHQudGlsZWhlaWdodCArIHQuc3BhY2luZykgKyB0Lm1hcmdpbixcbiAgICAgICAgICB9LiRzYWZlKGF0dHIpO1xuICAgICAgICAgIHRoaXMudGlsZXNldHMuY2hpcHNbcl0gPSBjaGlwO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8v44Os44Kk44Ok44O85Y+W5b6XXG4gICAgICB0aGlzLmxheWVycyA9IHRoaXMuX3BhcnNlTGF5ZXJzKGRhdGEpO1xuXG4gICAgICAvL+OCpOODoeODvOOCuOODh+ODvOOCv+iqreOBv+i+vOOBv1xuICAgICAgdGhpcy5fY2hlY2tJbWFnZSgpO1xuICAgIH0sXG5cbiAgICAvL+OCouOCu+ODg+ODiOOBq+eEoeOBhOOCpOODoeODvOOCuOODh+ODvOOCv+OCkuiqreOBv+i+vOOBv1xuICAgIF9jaGVja0ltYWdlOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgIHZhciBpbWFnZVNvdXJjZSA9IFtdO1xuICAgICAgdmFyIGxvYWRJbWFnZSA9IFtdO1xuXG4gICAgICAvL+S4gOimp+S9nOaIkFxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnRpbGVzZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBvYmogPSB7XG4gICAgICAgICAgaW1hZ2U6IHRoaXMudGlsZXNldHNbaV0uaW1hZ2UsXG4gICAgICAgICAgdHJhbnNSOiB0aGlzLnRpbGVzZXRzW2ldLnRyYW5zUixcbiAgICAgICAgICB0cmFuc0c6IHRoaXMudGlsZXNldHNbaV0udHJhbnNHLFxuICAgICAgICAgIHRyYW5zQjogdGhpcy50aWxlc2V0c1tpXS50cmFuc0IsXG4gICAgICAgIH07XG4gICAgICAgIGltYWdlU291cmNlLnB1c2gob2JqKTtcbiAgICAgIH1cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sYXllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHRoaXMubGF5ZXJzW2ldLmltYWdlKSB7XG4gICAgICAgICAgdmFyIG9iaiA9IHtcbiAgICAgICAgICAgIGltYWdlOiB0aGlzLmxheWVyc1tpXS5pbWFnZS5zb3VyY2VcbiAgICAgICAgICB9O1xuICAgICAgICAgIGltYWdlU291cmNlLnB1c2gob2JqKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvL+OCouOCu+ODg+ODiOOBq+OBguOCi+OBi+eiuuiqjVxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbWFnZVNvdXJjZS5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgaW1hZ2UgPSBwaGluYS5hc3NldC5Bc3NldE1hbmFnZXIuZ2V0KCdpbWFnZScsIGltYWdlU291cmNlW2ldLmltYWdlKTtcbiAgICAgICAgaWYgKGltYWdlKSB7XG4gICAgICAgICAgLy/jgqLjgrvjg4Pjg4jjgavjgYLjgotcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvL+OBquOBi+OBo+OBn+OBruOBp+ODreODvOODieODquOCueODiOOBq+i/veWKoFxuICAgICAgICAgIGxvYWRJbWFnZS5wdXNoKGltYWdlU291cmNlW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvL+S4gOaLrOODreODvOODiVxuICAgICAgLy/jg63jg7zjg4njg6rjgrnjg4jkvZzmiJBcbiAgICAgIHZhciBhc3NldHMgPSB7XG4gICAgICAgIGltYWdlOiBbXVxuICAgICAgfTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbG9hZEltYWdlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIC8v44Kk44Oh44O844K444Gu44OR44K544KS44Oe44OD44OX44Go5ZCM44GY44Gr44GZ44KLXG4gICAgICAgIGFzc2V0cy5pbWFnZVtpbWFnZVNvdXJjZVtpXS5pbWFnZV0gPSB0aGlzLnBhdGgraW1hZ2VTb3VyY2VbaV0uaW1hZ2U7XG4gICAgICB9XG4gICAgICBpZiAobG9hZEltYWdlLmxlbmd0aCkge1xuICAgICAgICB2YXIgbG9hZGVyID0gcGhpbmEuYXNzZXQuQXNzZXRMb2FkZXIoKTtcbiAgICAgICAgbG9hZGVyLmxvYWQoYXNzZXRzKTtcbiAgICAgICAgbG9hZGVyLm9uKCdsb2FkJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgIC8v6YCP6YGO6Imy6Kit5a6a5Y+N5pigXG4gICAgICAgICAgbG9hZEltYWdlLmZvckVhY2goZnVuY3Rpb24oZWxtKSB7XG4gICAgICAgICAgICB2YXIgaW1hZ2UgPSBwaGluYS5hc3NldC5Bc3NldE1hbmFnZXIuZ2V0KCdpbWFnZScsIGVsbS5pbWFnZSk7XG4gICAgICAgICAgICBpZiAoZWxtLnRyYW5zUiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgIHZhciByID0gZWxtLnRyYW5zUiwgZyA9IGVsbS50cmFuc0csIGIgPSBlbG0udHJhbnNCO1xuICAgICAgICAgICAgICBpbWFnZS5maWx0ZXIoZnVuY3Rpb24ocGl4ZWwsIGluZGV4LCB4LCB5LCBiaXRtYXApIHtcbiAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IGJpdG1hcC5kYXRhO1xuICAgICAgICAgICAgICAgIGlmIChwaXhlbFswXSA9PSByICYmIHBpeGVsWzFdID09IGcgJiYgcGl4ZWxbMl0gPT0gYikge1xuICAgICAgICAgICAgICAgICAgICBkYXRhW2luZGV4KzNdID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIC8v44Oe44OD44OX44Kk44Oh44O844K455Sf5oiQXG4gICAgICAgICAgdGhhdC5pbWFnZSA9IHRoYXQuX2dlbmVyYXRlSW1hZ2UoKTtcbiAgICAgICAgICAvL+iqreOBv+i+vOOBv+e1guS6hlxuICAgICAgICAgIHRoYXQuX3Jlc29sdmUodGhhdCk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL+ODnuODg+ODl+OCpOODoeODvOOCuOeUn+aIkFxuICAgICAgICB0aGlzLmltYWdlID0gdGhhdC5fZ2VuZXJhdGVJbWFnZSgpO1xuICAgICAgICAvL+iqreOBv+i+vOOBv+e1guS6hlxuICAgICAgICB0aGlzLl9yZXNvbHZlKHRoYXQpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAvL+ODnuODg+ODl+OCpOODoeODvOOCuOS9nOaIkFxuICAgIF9nZW5lcmF0ZUltYWdlOiBmdW5jdGlvbihsYXllck5hbWUpIHtcbiAgICAgIHZhciBudW1MYXllciA9IDA7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0aGlzLmxheWVyc1tpXS50eXBlID09IFwibGF5ZXJcIiB8fCB0aGlzLmxheWVyc1tpXS50eXBlID09IFwiaW1hZ2VsYXllclwiKSBudW1MYXllcisrO1xuICAgICAgfVxuICAgICAgaWYgKG51bUxheWVyID09IDApIHJldHVybiBudWxsO1xuXG4gICAgICB2YXIgd2lkdGggPSB0aGlzLndpZHRoICogdGhpcy50aWxld2lkdGg7XG4gICAgICB2YXIgaGVpZ2h0ID0gdGhpcy5oZWlnaHQgKiB0aGlzLnRpbGVoZWlnaHQ7XG4gICAgICB2YXIgY2FudmFzID0gcGhpbmEuZ3JhcGhpY3MuQ2FudmFzKCkuc2V0U2l6ZSh3aWR0aCwgaGVpZ2h0KTtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAvL+ODnuODg+ODl+ODrOOCpOODpOODvFxuICAgICAgICBpZiAodGhpcy5sYXllcnNbaV0udHlwZSA9PSBcImxheWVyXCIgJiYgdGhpcy5sYXllcnNbaV0udmlzaWJsZSAhPSBcIjBcIikge1xuICAgICAgICAgIGlmIChsYXllck5hbWUgPT09IHVuZGVmaW5lZCB8fCBsYXllck5hbWUgPT09IHRoaXMubGF5ZXJzW2ldLm5hbWUpIHtcbiAgICAgICAgICAgIHZhciBsYXllciA9IHRoaXMubGF5ZXJzW2ldO1xuICAgICAgICAgICAgdmFyIG1hcGRhdGEgPSBsYXllci5kYXRhO1xuICAgICAgICAgICAgdmFyIHdpZHRoID0gbGF5ZXIud2lkdGg7XG4gICAgICAgICAgICB2YXIgaGVpZ2h0ID0gbGF5ZXIuaGVpZ2h0O1xuICAgICAgICAgICAgdmFyIG9wYWNpdHkgPSBsYXllci5vcGFjaXR5IHx8IDEuMDtcbiAgICAgICAgICAgIHZhciBjb3VudCA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciB5ID0gMDsgeSA8IGhlaWdodDsgeSsrKSB7XG4gICAgICAgICAgICAgIGZvciAodmFyIHggPSAwOyB4IDwgd2lkdGg7IHgrKykge1xuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IG1hcGRhdGFbY291bnRdO1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgIC8v44Oe44OD44OX44OB44OD44OX44KS6YWN572uXG4gICAgICAgICAgICAgICAgICB0aGlzLl9zZXRNYXBDaGlwKGNhbnZhcywgaW5kZXgsIHggKiB0aGlzLnRpbGV3aWR0aCwgeSAqIHRoaXMudGlsZWhlaWdodCwgb3BhY2l0eSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy/jgqrjg5bjgrjjgqfjgq/jg4jjgrDjg6vjg7zjg5dcbiAgICAgICAgaWYgKHRoaXMubGF5ZXJzW2ldLnR5cGUgPT0gXCJvYmplY3Rncm91cFwiICYmIHRoaXMubGF5ZXJzW2ldLnZpc2libGUgIT0gXCIwXCIpIHtcbiAgICAgICAgICBpZiAobGF5ZXJOYW1lID09PSB1bmRlZmluZWQgfHwgbGF5ZXJOYW1lID09PSB0aGlzLmxheWVyc1tpXS5uYW1lKSB7XG4gICAgICAgICAgICB2YXIgbGF5ZXIgPSB0aGlzLmxheWVyc1tpXTtcbiAgICAgICAgICAgIHZhciBvcGFjaXR5ID0gbGF5ZXIub3BhY2l0eSB8fCAxLjA7XG4gICAgICAgICAgICBsYXllci5vYmplY3RzLmZvckVhY2goZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICBpZiAoZS5naWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRNYXBDaGlwKGNhbnZhcywgZS5naWQsIGUueCwgZS55LCBvcGFjaXR5KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy/jgqTjg6Hjg7zjgrjjg6zjgqTjg6Tjg7xcbiAgICAgICAgaWYgKHRoaXMubGF5ZXJzW2ldLnR5cGUgPT0gXCJpbWFnZWxheWVyXCIgJiYgdGhpcy5sYXllcnNbaV0udmlzaWJsZSAhPSBcIjBcIikge1xuICAgICAgICAgIGlmIChsYXllck5hbWUgPT09IHVuZGVmaW5lZCB8fCBsYXllck5hbWUgPT09IHRoaXMubGF5ZXJzW2ldLm5hbWUpIHtcbiAgICAgICAgICAgIHZhciBsZW4gPSB0aGlzLmxheWVyc1tpXTtcbiAgICAgICAgICAgIHZhciBpbWFnZSA9IHBoaW5hLmFzc2V0LkFzc2V0TWFuYWdlci5nZXQoJ2ltYWdlJywgdGhpcy5sYXllcnNbaV0uaW1hZ2Uuc291cmNlKTtcbiAgICAgICAgICAgIGNhbnZhcy5jb250ZXh0LmRyYXdJbWFnZShpbWFnZS5kb21FbGVtZW50LCB0aGlzLmxheWVyc1tpXS54LCB0aGlzLmxheWVyc1tpXS55KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIHRleHR1cmUgPSBwaGluYS5hc3NldC5UZXh0dXJlKCk7XG4gICAgICB0ZXh0dXJlLmRvbUVsZW1lbnQgPSBjYW52YXMuZG9tRWxlbWVudDtcbiAgICAgIHJldHVybiB0ZXh0dXJlO1xuICAgIH0sXG5cbiAgICAvL+OCreODo+ODs+ODkOOCueOBruaMh+WumuOBl+OBn+W6p+aomeOBq+ODnuODg+ODl+ODgeODg+ODl+OBruOCpOODoeODvOOCuOOCkuOCs+ODlOODvOOBmeOCi1xuICAgIF9zZXRNYXBDaGlwOiBmdW5jdGlvbihjYW52YXMsIGluZGV4LCB4LCB5LCBvcGFjaXR5KSB7XG4gICAgICAvL+OCv+OCpOODq+OCu+ODg+ODiOOBi+OCieODnuODg+ODl+ODgeODg+ODl+OCkuWPluW+l1xuICAgICAgdmFyIGNoaXAgPSB0aGlzLnRpbGVzZXRzLmNoaXBzW2luZGV4XTtcbiAgICAgIHZhciBpbWFnZSA9IHBoaW5hLmFzc2V0LkFzc2V0TWFuYWdlci5nZXQoJ2ltYWdlJywgY2hpcC5pbWFnZSk7XG4gICAgICBjYW52YXMuY29udGV4dC5kcmF3SW1hZ2UoXG4gICAgICAgIGltYWdlLmRvbUVsZW1lbnQsXG4gICAgICAgIGNoaXAueCArIGNoaXAubWFyZ2luLCBjaGlwLnkgKyBjaGlwLm1hcmdpbixcbiAgICAgICAgY2hpcC50aWxld2lkdGgsIGNoaXAudGlsZWhlaWdodCxcbiAgICAgICAgeCwgeSxcbiAgICAgICAgY2hpcC50aWxld2lkdGgsIGNoaXAudGlsZWhlaWdodCk7XG4gICAgfSxcblxuICAgIC8vWE1M44OX44Ot44OR44OG44Kj44KSSlNPTuOBq+WkieaPm1xuICAgIF9wcm9wZXJ0aWVzVG9KU09OOiBmdW5jdGlvbihlbG0pIHtcbiAgICAgIHZhciBwcm9wZXJ0aWVzID0gZWxtLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicHJvcGVydGllc1wiKVswXTtcbiAgICAgIHZhciBvYmogPSB7fTtcbiAgICAgIGlmIChwcm9wZXJ0aWVzID09PSB1bmRlZmluZWQpIHJldHVybiBvYmo7XG5cbiAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgcHJvcGVydGllcy5jaGlsZE5vZGVzLmxlbmd0aDsgaysrKSB7XG4gICAgICAgIHZhciBwID0gcHJvcGVydGllcy5jaGlsZE5vZGVzW2tdO1xuICAgICAgICBpZiAocC50YWdOYW1lID09PSBcInByb3BlcnR5XCIpIHtcbiAgICAgICAgICAvL3Byb3BlcnR544GrdHlwZeaMh+WumuOBjOOBguOBo+OBn+OCieWkieaPm1xuICAgICAgICAgIHZhciB0eXBlID0gcC5nZXRBdHRyaWJ1dGUoJ3R5cGUnKTtcbiAgICAgICAgICB2YXIgdmFsdWUgPSBwLmdldEF0dHJpYnV0ZSgndmFsdWUnKTtcbiAgICAgICAgICBpZiAoIXZhbHVlKSB2YWx1ZSA9IHAudGV4dENvbnRlbnQ7XG4gICAgICAgICAgaWYgKHR5cGUgPT0gXCJpbnRcIikge1xuICAgICAgICAgICAgb2JqW3AuZ2V0QXR0cmlidXRlKCduYW1lJyldID0gcGFyc2VJbnQodmFsdWUsIDEwKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT0gXCJmbG9hdFwiKSB7XG4gICAgICAgICAgICBvYmpbcC5nZXRBdHRyaWJ1dGUoJ25hbWUnKV0gPSBwYXJzZUZsb2F0KHZhbHVlKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT0gXCJib29sXCIgKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJ0cnVlXCIpIG9ialtwLmdldEF0dHJpYnV0ZSgnbmFtZScpXSA9IHRydWU7XG4gICAgICAgICAgICBlbHNlIG9ialtwLmdldEF0dHJpYnV0ZSgnbmFtZScpXSA9IGZhbHNlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvYmpbcC5nZXRBdHRyaWJ1dGUoJ25hbWUnKV0gPSB2YWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBvYmo7XG4gICAgfSxcblxuICAgIC8vWE1M5bGe5oCn44KSSlNPTuOBq+WkieaPm1xuICAgIF9hdHRyVG9KU09OOiBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAgIHZhciBvYmogPSB7fTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc291cmNlLmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHZhbCA9IHNvdXJjZS5hdHRyaWJ1dGVzW2ldLnZhbHVlO1xuICAgICAgICB2YWwgPSBpc05hTihwYXJzZUZsb2F0KHZhbCkpPyB2YWw6IHBhcnNlRmxvYXQodmFsKTtcbiAgICAgICAgb2JqW3NvdXJjZS5hdHRyaWJ1dGVzW2ldLm5hbWVdID0gdmFsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG9iajtcbiAgICB9LFxuXG4gICAgLy9YTUzlsZ7mgKfjgpJKU09O44Gr5aSJ5o+b77yIU3RyaW5n44Gn6L+U44GZ77yJXG4gICAgX2F0dHJUb0pTT05fc3RyOiBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAgIHZhciBvYmogPSB7fTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc291cmNlLmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHZhbCA9IHNvdXJjZS5hdHRyaWJ1dGVzW2ldLnZhbHVlO1xuICAgICAgICBvYmpbc291cmNlLmF0dHJpYnV0ZXNbaV0ubmFtZV0gPSB2YWw7XG4gICAgICB9XG4gICAgICByZXR1cm4gb2JqO1xuICAgIH0sXG5cbiAgICAvL+OCv+OCpOODq+OCu+ODg+ODiOOBruODkeODvOOCuVxuICAgIF9wYXJzZVRpbGVzZXRzOiBmdW5jdGlvbih4bWwpIHtcbiAgICAgIHZhciBlYWNoID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2g7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgZGF0YSA9IFtdO1xuICAgICAgdmFyIHRpbGVzZXRzID0geG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKCd0aWxlc2V0Jyk7XG4gICAgICBlYWNoLmNhbGwodGlsZXNldHMsIGZ1bmN0aW9uKHRpbGVzZXQpIHtcbiAgICAgICAgdmFyIHQgPSB7fTtcbiAgICAgICAgdmFyIHByb3BzID0gc2VsZi5fcHJvcGVydGllc1RvSlNPTih0aWxlc2V0KTtcbiAgICAgICAgaWYgKHByb3BzLnNyYykge1xuICAgICAgICAgIHQuaW1hZ2UgPSBwcm9wcy5zcmM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdC5pbWFnZSA9IHRpbGVzZXQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2ltYWdlJylbMF0uZ2V0QXR0cmlidXRlKCdzb3VyY2UnKTtcbiAgICAgICAgfVxuICAgICAgICAvL+mAj+mBjuiJsuioreWumuWPluW+l1xuICAgICAgICB0LnRyYW5zID0gdGlsZXNldC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW1hZ2UnKVswXS5nZXRBdHRyaWJ1dGUoJ3RyYW5zJyk7XG4gICAgICAgIGlmICh0LnRyYW5zKSB7XG4gICAgICAgICAgdC50cmFuc1IgPSBwYXJzZUludCh0LnRyYW5zLnN1YnN0cmluZygwLCAyKSwgMTYpO1xuICAgICAgICAgIHQudHJhbnNHID0gcGFyc2VJbnQodC50cmFucy5zdWJzdHJpbmcoMiwgNCksIDE2KTtcbiAgICAgICAgICB0LnRyYW5zQiA9IHBhcnNlSW50KHQudHJhbnMuc3Vic3RyaW5nKDQsIDYpLCAxNik7XG4gICAgICAgIH1cblxuICAgICAgICBkYXRhLnB1c2godCk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBkYXRhO1xuICAgIH0sXG5cbiAgICAvL+ODrOOCpOODpOODvOaDheWgseOBruODkeODvOOCuVxuICAgIF9wYXJzZUxheWVyczogZnVuY3Rpb24oeG1sKSB7XG4gICAgICB2YXIgZWFjaCA9IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoO1xuICAgICAgdmFyIGRhdGEgPSBbXTtcblxuICAgICAgdmFyIG1hcCA9IHhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcIm1hcFwiKVswXTtcbiAgICAgIHZhciBsYXllcnMgPSBbXTtcbiAgICAgIGVhY2guY2FsbChtYXAuY2hpbGROb2RlcywgZnVuY3Rpb24oZWxtKSB7XG4gICAgICAgIGlmIChlbG0udGFnTmFtZSA9PSBcImxheWVyXCIgfHwgZWxtLnRhZ05hbWUgPT0gXCJvYmplY3Rncm91cFwiIHx8IGVsbS50YWdOYW1lID09IFwiaW1hZ2VsYXllclwiKSB7XG4gICAgICAgICAgbGF5ZXJzLnB1c2goZWxtKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGxheWVycy5lYWNoKGZ1bmN0aW9uKGxheWVyKSB7XG4gICAgICAgIHN3aXRjaCAobGF5ZXIudGFnTmFtZSkge1xuICAgICAgICAgIGNhc2UgXCJsYXllclwiOlxuICAgICAgICAgICAgLy/pgJrluLjjg6zjgqTjg6Tjg7xcbiAgICAgICAgICAgIHZhciBkID0gbGF5ZXIuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2RhdGEnKVswXTtcbiAgICAgICAgICAgIHZhciBlbmNvZGluZyA9IGQuZ2V0QXR0cmlidXRlKFwiZW5jb2RpbmdcIik7XG4gICAgICAgICAgICB2YXIgbCA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcImxheWVyXCIsXG4gICAgICAgICAgICAgICAgbmFtZTogbGF5ZXIuZ2V0QXR0cmlidXRlKFwibmFtZVwiKSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChlbmNvZGluZyA9PSBcImNzdlwiKSB7XG4gICAgICAgICAgICAgICAgbC5kYXRhID0gdGhpcy5fcGFyc2VDU1YoZC50ZXh0Q29udGVudCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGVuY29kaW5nID09IFwiYmFzZTY0XCIpIHtcbiAgICAgICAgICAgICAgICBsLmRhdGEgPSB0aGlzLl9wYXJzZUJhc2U2NChkLnRleHRDb250ZW50KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGF0dHIgPSB0aGlzLl9hdHRyVG9KU09OKGxheWVyKTtcbiAgICAgICAgICAgIGwuJGV4dGVuZChhdHRyKTtcbiAgICAgICAgICAgIGwucHJvcGVydGllcyA9IHRoaXMuX3Byb3BlcnRpZXNUb0pTT04obGF5ZXIpO1xuXG4gICAgICAgICAgICBkYXRhLnB1c2gobCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIC8v44Kq44OW44K444Kn44Kv44OI44Os44Kk44Ok44O8XG4gICAgICAgICAgY2FzZSBcIm9iamVjdGdyb3VwXCI6XG4gICAgICAgICAgICB2YXIgbCA9IHtcbiAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3Rncm91cFwiLFxuICAgICAgICAgICAgICBvYmplY3RzOiBbXSxcbiAgICAgICAgICAgICAgbmFtZTogbGF5ZXIuZ2V0QXR0cmlidXRlKFwibmFtZVwiKSxcbiAgICAgICAgICAgICAgeDogcGFyc2VGbG9hdChsYXllci5nZXRBdHRyaWJ1dGUoXCJvZmZzZXR4XCIpKSB8fCAwLFxuICAgICAgICAgICAgICB5OiBwYXJzZUZsb2F0KGxheWVyLmdldEF0dHJpYnV0ZShcIm9mZnNldHlcIikpIHx8IDAsXG4gICAgICAgICAgICAgIGFscGhhOiBsYXllci5nZXRBdHRyaWJ1dGUoXCJvcGFjaXR5XCIpIHx8IDEsXG4gICAgICAgICAgICAgIGNvbG9yOiBsYXllci5nZXRBdHRyaWJ1dGUoXCJjb2xvclwiKSB8fCBudWxsLFxuICAgICAgICAgICAgICBkcmF3b3JkZXI6IGxheWVyLmdldEF0dHJpYnV0ZShcImRyYXdvcmRlclwiKSB8fCBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGVhY2guY2FsbChsYXllci5jaGlsZE5vZGVzLCBmdW5jdGlvbihlbG0pIHtcbiAgICAgICAgICAgICAgaWYgKGVsbS5ub2RlVHlwZSA9PSAzKSByZXR1cm47XG4gICAgICAgICAgICAgIHZhciBkID0gdGhpcy5fYXR0clRvSlNPTihlbG0pO1xuICAgICAgICAgICAgICBkLnByb3BlcnRpZXMgPSB0aGlzLl9wcm9wZXJ0aWVzVG9KU09OKGVsbSk7XG4gICAgICAgICAgICAgIC8v5a2Q6KaB57Sg44Gu6Kej5p6QXG4gICAgICAgICAgICAgIGlmIChlbG0uY2hpbGROb2Rlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBlbG0uY2hpbGROb2Rlcy5mb3JFYWNoKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChlLm5vZGVUeXBlID09IDMpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgIC8v5qWV5YaGXG4gICAgICAgICAgICAgICAgICBpZiAoZS5ub2RlTmFtZSA9PSAnZWxsaXBzZScpIHtcbiAgICAgICAgICAgICAgICAgICAgZC5lbGxpcHNlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIC8v5aSa6KeS5b2iXG4gICAgICAgICAgICAgICAgICBpZiAoZS5ub2RlTmFtZSA9PSAncG9seWdvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgZC5wb2x5Z29uID0gW107XG4gICAgICAgICAgICAgICAgICAgIHZhciBhdHRyID0gdGhpcy5fYXR0clRvSlNPTl9zdHIoZSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwbCA9IGF0dHIucG9pbnRzLnNwbGl0KFwiIFwiKTtcbiAgICAgICAgICAgICAgICAgICAgcGwuZm9yRWFjaChmdW5jdGlvbihzdHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICB2YXIgcHRzID0gc3RyLnNwbGl0KFwiLFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICBkLnBvbHlnb24ucHVzaCh7eDogcGFyc2VGbG9hdChwdHNbMF0pLCB5OiBwYXJzZUZsb2F0KHB0c1sxXSl9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAvL+e3muWIhlxuICAgICAgICAgICAgICAgICAgaWYgKGUubm9kZU5hbWUgPT0gJ3BvbHlsaW5lJykge1xuICAgICAgICAgICAgICAgICAgICBkLnBvbHlsaW5lID0gW107XG4gICAgICAgICAgICAgICAgICAgIHZhciBhdHRyID0gdGhpcy5fYXR0clRvSlNPTl9zdHIoZSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwbCA9IGF0dHIucG9pbnRzLnNwbGl0KFwiIFwiKTtcbiAgICAgICAgICAgICAgICAgICAgcGwuZm9yRWFjaChmdW5jdGlvbihzdHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICB2YXIgcHRzID0gc3RyLnNwbGl0KFwiLFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICBkLnBvbHlsaW5lLnB1c2goe3g6IHBhcnNlRmxvYXQocHRzWzBdKSwgeTogcGFyc2VGbG9hdChwdHNbMV0pfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgbC5vYmplY3RzLnB1c2goZCk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICAgICAgbC5wcm9wZXJ0aWVzID0gdGhpcy5fcHJvcGVydGllc1RvSlNPTihsYXllcik7XG5cbiAgICAgICAgICAgIGRhdGEucHVzaChsKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgLy/jgqTjg6Hjg7zjgrjjg6zjgqTjg6Tjg7xcbiAgICAgICAgICBjYXNlIFwiaW1hZ2VsYXllclwiOlxuICAgICAgICAgICAgICB2YXIgbCA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcImltYWdlbGF5ZXJcIixcbiAgICAgICAgICAgICAgICBuYW1lOiBsYXllci5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpLFxuICAgICAgICAgICAgICAgIHg6IHBhcnNlRmxvYXQobGF5ZXIuZ2V0QXR0cmlidXRlKFwib2Zmc2V0eFwiKSkgfHwgMCxcbiAgICAgICAgICAgICAgICB5OiBwYXJzZUZsb2F0KGxheWVyLmdldEF0dHJpYnV0ZShcIm9mZnNldHlcIikpIHx8IDAsXG4gICAgICAgICAgICAgICAgYWxwaGE6IGxheWVyLmdldEF0dHJpYnV0ZShcIm9wYWNpdHlcIikgfHwgMSxcbiAgICAgICAgICAgICAgICB2aXNpYmxlOiAobGF5ZXIuZ2V0QXR0cmlidXRlKFwidmlzaWJsZVwiKSA9PT0gdW5kZWZpbmVkIHx8IGxheWVyLmdldEF0dHJpYnV0ZShcInZpc2libGVcIikgIT0gMCksXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIHZhciBpbWFnZUVsbSA9IGxheWVyLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaW1hZ2VcIilbMF07XG4gICAgICAgICAgICAgIGwuaW1hZ2UgPSB7c291cmNlOiBpbWFnZUVsbS5nZXRBdHRyaWJ1dGUoXCJzb3VyY2VcIil9O1xuXG4gICAgICAgICAgICAgIGRhdGEucHVzaChsKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICByZXR1cm4gZGF0YTtcbiAgICB9LFxuXG4gICAgLy9DU1bjg5Hjg7zjgrlcbiAgICBfcGFyc2VDU1Y6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHZhciBkYXRhTGlzdCA9IGRhdGEuc3BsaXQoJywnKTtcbiAgICAgIHZhciBsYXllciA9IFtdO1xuXG4gICAgICBkYXRhTGlzdC5lYWNoKGZ1bmN0aW9uKGVsbSwgaSkge1xuICAgICAgICB2YXIgbnVtID0gcGFyc2VJbnQoZWxtLCAxMCkgLSAxO1xuICAgICAgICBsYXllci5wdXNoKG51bSk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGxheWVyO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBCQVNFNjTjg5Hjg7zjgrlcbiAgICAgKiBodHRwOi8vdGhla2Fubm9uLXNlcnZlci5hcHBzcG90LmNvbS9oZXJwaXR5LWRlcnBpdHkuYXBwc3BvdC5jb20vcGFzdGViaW4uY29tLzc1S2tzMFdIXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcGFyc2VCYXNlNjQ6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHZhciBkYXRhTGlzdCA9IGF0b2IoZGF0YS50cmltKCkpO1xuICAgICAgdmFyIHJzdCA9IFtdO1xuXG4gICAgICBkYXRhTGlzdCA9IGRhdGFMaXN0LnNwbGl0KCcnKS5tYXAoZnVuY3Rpb24oZSkge1xuICAgICAgICByZXR1cm4gZS5jaGFyQ29kZUF0KDApO1xuICAgICAgfSk7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBkYXRhTGlzdC5sZW5ndGggLyA0OyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgdmFyIG4gPSBkYXRhTGlzdFtpKjRdO1xuICAgICAgICByc3RbaV0gPSBwYXJzZUludChuLCAxMCkgLSAxO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcnN0O1xuICAgIH0sXG4gIH0pO1xuXG4gIC8v44Ot44O844OA44O844Gr6L+95YqgXG4gIHBoaW5hLmFzc2V0LkFzc2V0TG9hZGVyLmFzc2V0TG9hZEZ1bmN0aW9ucy50bXggPSBmdW5jdGlvbihrZXksIHBhdGgpIHtcbiAgICB2YXIgdG14ID0gcGhpbmEuYXNzZXQuVGlsZWRNYXAoKTtcbiAgICByZXR1cm4gdG14LmxvYWQocGF0aCk7XG4gIH07XG5cbn0pOyIsIi8vXG4vLyDmsY7nlKjplqLmlbDnvqRcbi8vXG5waGluYS5kZWZpbmUoXCJVdGlsXCIsIHtcbiAgX3N0YXRpYzoge1xuXG4gICAgLy/mjIflrprjgZXjgozjgZ/jgqrjg5bjgrjjgqfjgq/jg4jjgpLjg6vjg7zjg4jjgajjgZfjgabnm67nmoTjga5pZOOCkui1sOafu+OBmeOCi1xuICAgIGZpbmRCeUlkOiBmdW5jdGlvbihpZCwgb2JqKSB7XG4gICAgICBpZiAob2JqLmlkID09PSBpZCkgcmV0dXJuIG9iajtcbiAgICAgIGNvbnN0IGNoaWxkcmVuID0gT2JqZWN0LmtleXMob2JqLmNoaWxkcmVuIHx8IHt9KS5tYXAoa2V5ID0+IG9iai5jaGlsZHJlbltrZXldKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgaGl0ID0gdGhpcy5maW5kQnlJZChpZCwgY2hpbGRyZW5baV0pO1xuICAgICAgICBpZiAoaGl0KSByZXR1cm4gaGl0O1xuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcblxuICAgIC8vVE9ETzrjgZPjgZPjgZjjgoPjgarjgYTmhJ/jgYzjgYLjgovjga7jgafjgZnjgYzjgIHkuIDml6blrp/oo4VcbiAgICAvL+aMh+WumuOBleOCjOOBn0HjgahC44GuYXNzZXRz44Gu6YCj5oOz6YWN5YiX44KS5paw6KaP44Gu44Kq44OW44K444Kn44Kv44OI44Gr44Oe44O844K444GZ44KLXG4gICAgbWVyZ2VBc3NldHM6IGZ1bmN0aW9uKGFzc2V0c0EsIGFzc2V0c0IpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgICAgYXNzZXRzQS5mb3JJbigodHlwZUtleSwgdHlwZVZhbHVlKSA9PiB7XG4gICAgICAgIGlmICghcmVzdWx0LiRoYXModHlwZUtleSkpIHJlc3VsdFt0eXBlS2V5XSA9IHt9O1xuICAgICAgICB0eXBlVmFsdWUuZm9ySW4oKGFzc2V0S2V5LCBhc3NldFBhdGgpID0+IHtcbiAgICAgICAgICByZXN1bHRbdHlwZUtleV1bYXNzZXRLZXldID0gYXNzZXRQYXRoO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgYXNzZXRzQi5mb3JJbigodHlwZUtleSwgdHlwZVZhbHVlKSA9PiB7XG4gICAgICAgIGlmICghcmVzdWx0LiRoYXModHlwZUtleSkpIHJlc3VsdFt0eXBlS2V5XSA9IHt9O1xuICAgICAgICB0eXBlVmFsdWUuZm9ySW4oKGFzc2V0S2V5LCBhc3NldFBhdGgpID0+IHtcbiAgICAgICAgICByZXN1bHRbdHlwZUtleV1bYXNzZXRLZXldID0gYXNzZXRQYXRoO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgLy/nj77lnKjmmYLplpPjgYvjgonmjIflrprmmYLplpPjgb7jgafjganjga7jgY/jgonjgYTjgYvjgYvjgovjgYvjgpLov5TljbTjgZnjgotcbiAgICAvL1xuICAgIC8vIG91dHB1dCA6IHsgXG4gICAgLy8gICB0b3RhbERhdGU6MCAsIFxuICAgIC8vICAgdG90YWxIb3VyOjAgLCBcbiAgICAvLyAgIHRvdGFsTWludXRlczowICwgXG4gICAgLy8gICB0b3RhbFNlY29uZHM6MCAsXG4gICAgLy8gICBkYXRlOjAgLCBcbiAgICAvLyAgIGhvdXI6MCAsIFxuICAgIC8vICAgbWludXRlczowICwgXG4gICAgLy8gICBzZWNvbmRzOjAgXG4gICAgLy8gfVxuICAgIC8vXG5cbiAgICBjYWxjUmVtYWluaW5nVGltZTogZnVuY3Rpb24oZmluaXNoKSB7XG4gICAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgICBcInRvdGFsRGF0ZVwiOiAwLFxuICAgICAgICBcInRvdGFsSG91clwiOiAwLFxuICAgICAgICBcInRvdGFsTWludXRlc1wiOiAwLFxuICAgICAgICBcInRvdGFsU2Vjb25kc1wiOiAwLFxuICAgICAgICBcImRhdGVcIjogMCxcbiAgICAgICAgXCJob3VyXCI6IDAsXG4gICAgICAgIFwibWludXRlc1wiOiAwLFxuICAgICAgICBcInNlY29uZHNcIjogMCxcbiAgICAgIH1cblxuICAgICAgZmluaXNoID0gKGZpbmlzaCBpbnN0YW5jZW9mIERhdGUpID8gZmluaXNoIDogbmV3IERhdGUoZmluaXNoKTtcbiAgICAgIGxldCBkaWZmID0gZmluaXNoIC0gbm93O1xuICAgICAgaWYgKGRpZmYgPT09IDApIHJldHVybiByZXN1bHQ7XG5cbiAgICAgIGNvbnN0IHNpZ24gPSAoZGlmZiA8IDApID8gLTEgOiAxO1xuXG4gICAgICAvL1RPRE8644GT44Gu6L6644KK44KC44GG5bCR44GX57a66bqX44Gr5pu444GR44Gq44GE44GL5qSc6KiOXG4gICAgICAvL+WNmOS9jeWIpSAx5pyq5rqA44GvMFxuICAgICAgcmVzdWx0W1widG90YWxEYXRlXCJdID0gcGFyc2VJbnQoZGlmZiAvIDEwMDAgLyA2MCAvIDYwIC8gMjQpO1xuICAgICAgcmVzdWx0W1widG90YWxIb3VyXCJdID0gcGFyc2VJbnQoZGlmZiAvIDEwMDAgLyA2MCAvIDYwKTtcbiAgICAgIHJlc3VsdFtcInRvdGFsTWludXRlc1wiXSA9IHBhcnNlSW50KGRpZmYgLyAxMDAwIC8gNjApO1xuICAgICAgcmVzdWx0W1widG90YWxTZWNvbmRzXCJdID0gcGFyc2VJbnQoZGlmZiAvIDEwMDApO1xuXG4gICAgICBkaWZmIC09IHJlc3VsdFtcInRvdGFsRGF0ZVwiXSAqIDg2NDAwMDAwO1xuICAgICAgcmVzdWx0W1wiaG91clwiXSA9IHBhcnNlSW50KGRpZmYgLyAxMDAwIC8gNjAgLyA2MCk7XG5cbiAgICAgIGRpZmYgLT0gcmVzdWx0W1wiaG91clwiXSAqIDM2MDAwMDA7XG4gICAgICByZXN1bHRbXCJtaW51dGVzXCJdID0gcGFyc2VJbnQoZGlmZiAvIDEwMDAgLyA2MCk7XG5cbiAgICAgIGRpZmYgLT0gcmVzdWx0W1wibWludXRlc1wiXSAqIDYwMDAwO1xuICAgICAgcmVzdWx0W1wic2Vjb25kc1wiXSA9IHBhcnNlSW50KGRpZmYgLyAxMDAwKTtcblxuICAgICAgcmV0dXJuIHJlc3VsdDtcblxuICAgIH0sXG5cbiAgICAvL+ODrOOCpOOCouOCpuODiOOCqOODh+OCo+OCv+ODvOOBp+OBr1Nwcml0ZeWFqOOBpkF0YWxzU3ByaXRl44Gr44Gq44Gj44Gm44GX44G+44GG44Gf44KB44CBXG4gICAgLy9TcHJpdGXjgavlt67jgZfmm7/jgYjjgonjgozjgovjgojjgYbjgavjgZnjgotcblxuICAgIC8vQXRsYXNTcHJpdGXoh6rouqvjgavljZjnmbrjga5JbWFnZeOCkuOCu+ODg+ODiOOBp+OBjeOCi+OCiOOBhuOBq+OBmeOCi++8n1xuICAgIC8v44GC44Go44Gn44Gq44Gr44GL44GX44KJ5a++562W44GX44Gq44GE44Go44Gg44KB44Gg44GM77yT5pyI57SN5ZOB44Gn44Gv5LiA5pem44GT44KM44GnXG4gICAgcmVwbGFjZUF0bGFzU3ByaXRlVG9TcHJpdGU6IGZ1bmN0aW9uKHBhcmVudCwgYXRsYXNTcHJpdGUsIHNwcml0ZSkge1xuICAgICAgY29uc3QgaW5kZXggPSBwYXJlbnQuZ2V0Q2hpbGRJbmRleChhdGxhc1Nwcml0ZSk7XG4gICAgICBzcHJpdGUuc2V0T3JpZ2luKGF0bGFzU3ByaXRlLm9yaWdpblgsIGF0bGFzU3ByaXRlLm9yaWdpblkpO1xuICAgICAgc3ByaXRlLnNldFBvc2l0aW9uKGF0bGFzU3ByaXRlLngsIGF0bGFzU3ByaXRlLnkpO1xuICAgICAgcGFyZW50LmFkZENoaWxkQXQoc3ByaXRlLCBpbmRleCk7XG4gICAgICBhdGxhc1Nwcml0ZS5yZW1vdmUoKTtcbiAgICAgIHJldHVybiBzcHJpdGU7XG4gICAgfSxcbiAgfVxufSk7XG4iLCIvL1xuLy8g5Z+656SO44K344O844Oz44Kv44Op44K5XG4vL1xucGhpbmEuZGVmaW5lKFwiQmFzZVNjZW5lXCIsIHtcbiAgc3VwZXJDbGFzczogXCJEaXNwbGF5U2NlbmVcIixcblxuICBmb290ZXI6IG51bGwsXG5cbiAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIC8vIGNvbnNvbGUubG9nKFwiI0Jhc2VTY2VuZVwiICwgXCJpbml0XCIpO1xuXG4gICAgdGhpcy5zdXBlckluaXQoKTtcbiAgICB0aGlzLmJhY2tncm91bmRDb2xvciA9IFwid2hpdGVcIjtcblxuICAgIGlmICghcGhpbmEuaXNNb2JpbGUoKSkgdGhpcy5vbihcImVudGVyZnJhbWVcIiwgKGUpID0+IHRoaXMuZmxhcmUoXCJtb3VzZW1vdmVcIiwgeyBhcHA6IGUuYXBwIH0pKTtcblxuICAgIHRoaXMub25lKCdkZXN0cm95JywgKCkgPT4gdGhpcy5jYW52YXMuZGVzdHJveSgpKTtcbiAgfSxcblxuICBvbmVudGVyOiBmdW5jdGlvbihlKSB7XG4gICAgLy8gY29uc29sZS5sb2coXCIjQmFzZVNjZW5lXCIgLCBcIm9uZW50ZXJcIik7XG4gICAgdGhpcy5fcGxheUJnbSgpO1xuICAgIHRoaXMuX3NldHVwRm9vdGVyKCk7XG4gICAgdGhpcy5mbGFyZShcInJlYWR5XCIsIHsgYXBwOiBlLmFwcCB9KTtcbiAgICB0aGlzLl9hZGRGb290ZXIoKTtcbiAgfSxcblxuICAvL+OCt+ODvOODs+mWi+Wni+OCqOODleOCp+OCr+ODiCBcbiAgYmVnaW46IGZ1bmN0aW9uKHR5cGUsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gKHt9KS4kc2FmZShvcHRpb25zLCB7XG4gICAgICBjb2xvcjogXCJ3aGl0ZVwiLFxuICAgICAgdGltZTogMTAwXG4gICAgfSk7XG4gICAgY29uc3QgZWZmZWN0ID0gdGhpcy5fc2V0dXAodHlwZSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgICAudGhlbihlZmZlY3QuYmVnaW4oKSlcbiAgfSxcblxuICAvL+OCt+ODvOODs+e1guS6huOCqOODleOCp+OCr+ODiFxuICBmaW5pc2g6IGZ1bmN0aW9uKHR5cGUsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gKHt9KS4kc2FmZShvcHRpb25zLCB7XG4gICAgICBjb2xvcjogXCJ3aGl0ZVwiLFxuICAgICAgdGltZTogMTAwXG4gICAgfSk7XG4gICAgY29uc3QgZWZmZWN0ID0gdGhpcy5fc2V0dXAodHlwZSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIGVmZmVjdC5maW5pc2goKTtcbiAgfSxcblxuICBfc2V0dXA6IGZ1bmN0aW9uKHR5cGUsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgXCJmYWRlXCI6XG4gICAgICAgIHJldHVybiBTY2VuZUVmZmVjdEZhZGUob3B0aW9ucykuYWRkQ2hpbGRUbyh0aGlzKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBTY2VuZUVmZmVjdE5vbmUob3B0aW9ucykuYWRkQ2hpbGRUbyh0aGlzKTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyBQcm9taXNl44KS55So44GE44Gf44Km44Kn44Kk44OI5Yem55CGXG4gIHBsYXlXYWl0OiBmdW5jdGlvbih3YWl0KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgY29uc3QgdHdXYWl0ID0gVHdlZW5lcigpLmF0dGFjaFRvKHRoaXMpO1xuICAgICAgdHdXYWl0LndhaXQod2FpdCkuY2FsbCgoKSA9PiB7XG4gICAgICAgIHRoaXMuZGV0YWNoKHR3V2FpdCk7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9LFxuXG4gIF9yZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMucmVuZGVyZXIucmVuZGVyKHRoaXMsIDEuMCk7XG4gIH0sXG5cbn0pO1xuIiwiLy9cbi8vIOOCt+ODvOODs+OCqOODleOCp+OCr+ODiOOBruWfuuekjuOCr+ODqeOCuVxuLy9cbnBoaW5hLmRlZmluZShcIlNjZW5lRWZmZWN0QmFzZVwiLCB7XG4gIHN1cGVyQ2xhc3M6IFwiSW5wdXRJbnRlcmNlcHRcIixcblxuICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnN1cGVySW5pdCgpO1xuICAgIHRoaXMuZW5hYmxlKCk7XG4gIH0sXG5cbn0pO1xuIiwiLy9cbi8vIOOCt+ODvOODs+OCqOODleOCp+OCr+ODiO+8muikh+aVsOOBruWGhuOBp+ODleOCp+ODvOODieOCpOODs+OCouOCpuODiFxuLy9cbnBoaW5hLmRlZmluZShcIlNjZW5lRWZmZWN0Q2lyY2xlRmFkZVwiLCB7XG4gIHN1cGVyQ2xhc3M6IFwiU2NlbmVFZmZlY3RCYXNlXCIsXG5cbiAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9ICh7fSkuJHNhZmUob3B0aW9ucywgU2NlbmVFZmZlY3RDaXJjbGVGYWRlLmRlZmF1bHRzKTtcblxuICAgIHRoaXMuc3VwZXJJbml0KCk7XG4gIH0sXG5cbiAgX2NyZWF0ZUNpcmNsZTogZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgbnVtID0gNTtcbiAgICBjb25zdCB3aWR0aCA9IFNDUkVFTl9XSURUSCAvIG51bTtcbiAgICByZXR1cm4gQXJyYXkucmFuZ2UoKFNDUkVFTl9IRUlHSFQgLyB3aWR0aCkgKyAxKS5tYXAoeSA9PiB7XG4gICAgICByZXR1cm4gQXJyYXkucmFuZ2UobnVtICsgMSkubWFwKHggPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5hZGRDaGlsZChDaXJjbGVTaGFwZSh7XG4gICAgICAgICAgeDogeCAqIHdpZHRoLFxuICAgICAgICAgIHk6IHkgKiB3aWR0aCxcbiAgICAgICAgICBmaWxsOiB0aGlzLm9wdGlvbnMuY29sb3IsXG4gICAgICAgICAgc3Ryb2tlOiBudWxsLFxuICAgICAgICAgIHJhZGl1czogd2lkdGggKiAwLjUsXG4gICAgICAgIH0pKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9LFxuXG4gIGJlZ2luOiBmdW5jdGlvbigpIHtcbiAgICBjb25zdCBjaXJjbGVzID0gdGhpcy5fY3JlYXRlQ2lyY2xlKCk7XG4gICAgY29uc3QgdGFza3MgPSBbXTtcbiAgICBjaXJjbGVzLmZvckVhY2goKHhMaW5lLCB5KSA9PiB7XG4gICAgICB4TGluZS5mb3JFYWNoKChjaXJjbGUsIHgpID0+IHtcbiAgICAgICAgY2lyY2xlLnNjYWxlWCA9IDA7XG4gICAgICAgIGNpcmNsZS5zY2FsZVkgPSAwO1xuICAgICAgICB0YXNrcy5wdXNoKG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgIGNpcmNsZS50d2VlbmVyLmNsZWFyKClcbiAgICAgICAgICAgIC50byh7XG4gICAgICAgICAgICAgIHNjYWxlWDogMS41LFxuICAgICAgICAgICAgICBzY2FsZVk6IDEuNVxuICAgICAgICAgICAgfSwgNTAwLCBcImVhc2VPdXRRdWFkXCIpXG4gICAgICAgICAgICAuY2FsbCgoKSA9PiB7XG4gICAgICAgICAgICAgIGNpcmNsZS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgY2lyY2xlLmRlc3Ryb3lDYW52YXMoKTtcbiAgICAgICAgICAgICAgdGhpcy5jaGlsZHJlbi5jbGVhcigpO1xuICAgICAgICAgICAgICB0aGlzLmRpc2FibGUoKTtcbiAgICAgICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHRhc2tzKTtcbiAgfSxcblxuICBmaW5pc2g6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY2hpbGRyZW4uY2xlYXIoKTtcblxuICAgIGNvbnN0IGNpcmNsZXMgPSB0aGlzLl9jcmVhdGVDaXJjbGUoKTtcbiAgICBjb25zdCB0YXNrcyA9IFtdO1xuICAgIGNpcmNsZXMuZm9yRWFjaCh4TGluZSA9PiB7XG4gICAgICB4TGluZS5mb3JFYWNoKGNpcmNsZSA9PiB7XG4gICAgICAgIGNpcmNsZS5zY2FsZVggPSAxLjU7XG4gICAgICAgIGNpcmNsZS5zY2FsZVkgPSAxLjU7XG4gICAgICAgIHRhc2tzLnB1c2gobmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgY2lyY2xlLnR3ZWVuZXIuY2xlYXIoKVxuICAgICAgICAgICAgLnRvKHtcbiAgICAgICAgICAgICAgc2NhbGVYOiAwLFxuICAgICAgICAgICAgICBzY2FsZVk6IDBcbiAgICAgICAgICAgIH0sIDUwMCwgXCJlYXNlT3V0UXVhZFwiKVxuICAgICAgICAgICAgLmNhbGwoKCkgPT4ge1xuICAgICAgICAgICAgICBjaXJjbGUucmVtb3ZlKCk7XG4gICAgICAgICAgICAgIGNpcmNsZS5kZXN0cm95Q2FudmFzKCk7XG4gICAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4uY2xlYXIoKTtcbiAgICAgICAgICAgICAgdGhpcy5kaXNhYmxlKCk7XG4gICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwodGFza3MpO1xuICB9LFxuXG4gIF9zdGF0aWM6IHtcbiAgICBkZWZhdWx0czoge1xuICAgICAgY29sb3I6IFwid2hpdGVcIixcbiAgICB9XG4gIH1cblxufSk7XG4iLCIvL1xuLy8g44K344O844Oz44Ko44OV44Kn44Kv44OI77ya44OV44Kn44O844OJ44Kk44Oz44Ki44Km44OIXG4vL1xucGhpbmEuZGVmaW5lKFwiU2NlbmVFZmZlY3RGYWRlXCIsIHtcbiAgc3VwZXJDbGFzczogXCJTY2VuZUVmZmVjdEJhc2VcIixcblxuICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gKHt9KS4kc2FmZShvcHRpb25zLCB7XG4gICAgICBjb2xvcjogXCJibGFja1wiLFxuICAgICAgdGltZTogNTAwLFxuICAgIH0pO1xuXG4gICAgdGhpcy5zdXBlckluaXQoKTtcbiAgICB0aGlzLmZyb21KU09OKHtcbiAgICAgIGNoaWxkcmVuOiB7XG4gICAgICAgIGZhZGU6IHtcbiAgICAgICAgICBjbGFzc05hbWU6IFwiUmVjdGFuZ2xlU2hhcGVcIixcbiAgICAgICAgICBhcmd1bWVudHM6IHtcbiAgICAgICAgICAgIHdpZHRoOiBTQ1JFRU5fV0lEVEgsXG4gICAgICAgICAgICBoZWlnaHQ6IFNDUkVFTl9IRUlHSFQsXG4gICAgICAgICAgICBmaWxsOiB0aGlzLm9wdGlvbnMuY29sb3IsXG4gICAgICAgICAgICBzdHJva2U6IG51bGwsXG4gICAgICAgICAgICBwYWRkaW5nOiAwLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgeDogU0NSRUVOX1dJRFRIICogMC41LFxuICAgICAgICAgIHk6IFNDUkVFTl9IRUlHSFQgKiAwLjUsXG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG5cbiAgc3RheTogZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgZmFkZSA9IHRoaXMuZmFkZTtcbiAgICBmYWRlLmFscGhhID0gMS4wO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfSxcblxuICBiZWdpbjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgY29uc3QgZmFkZSA9IHRoaXMuZmFkZTtcbiAgICAgIGZhZGUuYWxwaGEgPSAxLjA7XG4gICAgICBmYWRlLnR3ZWVuZXIuY2xlYXIoKVxuICAgICAgICAuZmFkZU91dCh0aGlzLm9wdGlvbnMudGltZSlcbiAgICAgICAgLmNhbGwoKCkgPT4ge1xuICAgICAgICAgIC8vMUZyYW1l5o+P55S744GV44KM44Gm44GX44G+44Gj44Gm44Gh44KJ44Gk44GP44Gu44GnZW50ZXJmcmFtZeOBp+WJiumZpFxuICAgICAgICAgIHRoaXMub25lKFwiZW50ZXJmcmFtZVwiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmZhZGUucmVtb3ZlKCk7XG4gICAgICAgICAgICB0aGlzLmZhZGUuZGVzdHJveUNhbnZhcygpO1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUoKVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgZmluaXNoOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICBjb25zdCBmYWRlID0gdGhpcy5mYWRlO1xuICAgICAgZmFkZS5hbHBoYSA9IDAuMDtcbiAgICAgIGZhZGUudHdlZW5lci5jbGVhcigpXG4gICAgICAgIC5mYWRlSW4odGhpcy5vcHRpb25zLnRpbWUpXG4gICAgICAgIC5jYWxsKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZsYXJlKFwiZmluaXNoXCIpO1xuICAgICAgICAgIC8vMUZyYW1l5o+P55S744GV44KM44Gm44GX44G+44Gj44Gm44Gh44KJ44Gk44GP44Gu44GnZW50ZXJmcmFtZeOBp+WJiumZpFxuICAgICAgICAgIHRoaXMub25lKFwiZW50ZXJmcmFtZVwiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmZhZGUucmVtb3ZlKCk7XG4gICAgICAgICAgICB0aGlzLmZhZGUuZGVzdHJveUNhbnZhcygpO1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUoKVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgX3N0YXRpYzoge1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICBjb2xvcjogXCJibGFja1wiLFxuICAgIH1cbiAgfVxuXG59KTtcbiIsIi8vXG4vLyDjgrfjg7zjg7Pjgqjjg5Xjgqfjgq/jg4jvvJrjgarjgavjgoLjgZfjgarjgYRcbi8vXG5waGluYS5kZWZpbmUoXCJTY2VuZUVmZmVjdE5vbmVcIiwge1xuICBzdXBlckNsYXNzOiBcIlNjZW5lRWZmZWN0QmFzZVwiLFxuXG4gIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3VwZXJJbml0KCk7XG4gIH0sXG5cbiAgYmVnaW46IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIHRoaXMub25lKFwiZW50ZXJmcmFtZVwiLCAoKSA9PiB0aGlzLnJlbW92ZSgpKTtcbiAgICAgIHJlc29sdmUoKTtcbiAgICB9KTtcbiAgfSxcblxuICBmaW5pc2g6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIHRoaXMub25lKFwiZW50ZXJmcmFtZVwiLCAoKSA9PiB0aGlzLnJlbW92ZSgpKTtcbiAgICAgIHJlc29sdmUoKTtcbiAgICB9KTtcbiAgfVxuXG59KTtcbiIsIi8vXG4vLyDjgrfjg7zjg7Pjgqjjg5Xjgqfjgq/jg4jvvJrjgr/jgqTjg6vjg5Xjgqfjg7zjg4lcbi8vXG5waGluYS5kZWZpbmUoXCJTY2VuZUVmZmVjdFRpbGVGYWRlXCIsIHtcbiAgc3VwZXJDbGFzczogXCJTY2VuZUVmZmVjdEJhc2VcIixcblxuICB0aWxlczogbnVsbCxcbiAgbnVtOiAxNSxcbiAgc3BlZWQ6IDUwLFxuXG4gIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICB0aGlzLnN1cGVySW5pdCgpO1xuICAgIHRoaXMub3B0aW9ucyA9ICh7fSkuJHNhZmUob3B0aW9ucywge1xuICAgICAgY29sb3I6IFwiYmxhY2tcIixcbiAgICAgIHdpZHRoOiA3NjgsXG4gICAgICBoZWlnaHQ6IDEwMjQsXG4gICAgfSk7XG5cbiAgICB0aGlzLnRpbGVzID0gdGhpcy5fY3JlYXRlVGlsZXMoKTtcbiAgfSxcblxuICBfY3JlYXRlVGlsZXM6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnN0IHdpZHRoID0gTWF0aC5mbG9vcih0aGlzLm9wdGlvbnMud2lkdGggLyB0aGlzLm51bSk7XG5cbiAgICByZXR1cm4gQXJyYXkucmFuZ2UoKHRoaXMub3B0aW9ucy5oZWlnaHQgLyB3aWR0aCkgKyAxKS5tYXAoeSA9PiB7XG4gICAgICByZXR1cm4gQXJyYXkucmFuZ2UodGhpcy5udW0gKyAxKS5tYXAoeCA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZENoaWxkKFJlY3RhbmdsZVNoYXBlKHtcbiAgICAgICAgICB3aWR0aDogd2lkdGggKyAyLFxuICAgICAgICAgIGhlaWdodDogd2lkdGggKyAyLFxuICAgICAgICAgIHg6IHggKiB3aWR0aCxcbiAgICAgICAgICB5OiB5ICogd2lkdGgsXG4gICAgICAgICAgZmlsbDogdGhpcy5vcHRpb25zLmNvbG9yLFxuICAgICAgICAgIHN0cm9rZTogbnVsbCxcbiAgICAgICAgICBzdHJva2VXaWR0aDogMCxcbiAgICAgICAgfSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgc3RheTogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy50aWxlcy5mb3JFYWNoKCh4bGluZSwgeSkgPT4ge1xuICAgICAgeGxpbmUuZm9yRWFjaCgodGlsZSwgeCkgPT4ge1xuICAgICAgICB0aWxlLnNjYWxlWCA9IDEuMDtcbiAgICAgICAgdGlsZS5zY2FsZVkgPSAxLjA7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH0sXG5cbiAgYmVnaW46IGZ1bmN0aW9uKCkge1xuICAgIGNvbnN0IHRhc2tzID0gW107XG4gICAgdGhpcy50aWxlcy5mb3JFYWNoKCh4bGluZSwgeSkgPT4ge1xuICAgICAgY29uc3QgdyA9IE1hdGgucmFuZGZsb2F0KDAsIDEpICogdGhpcy5zcGVlZDtcbiAgICAgIHhsaW5lLmZvckVhY2goKHRpbGUsIHgpID0+IHtcbiAgICAgICAgdGlsZS5zY2FsZVggPSAxLjA7XG4gICAgICAgIHRpbGUuc2NhbGVZID0gMS4wO1xuICAgICAgICB0YXNrcy5wdXNoKG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgIHRpbGUudHdlZW5lci5jbGVhcigpXG4gICAgICAgICAgICAud2FpdCh4ICogdGhpcy5zcGVlZCArIHcpXG4gICAgICAgICAgICAudG8oe1xuICAgICAgICAgICAgICBzY2FsZVg6IDAsXG4gICAgICAgICAgICAgIHNjYWxlWTogMFxuICAgICAgICAgICAgfSwgNTAwLCBcImVhc2VPdXRRdWFkXCIpXG4gICAgICAgICAgICAuY2FsbCgoKSA9PiB7XG4gICAgICAgICAgICAgIHRpbGUucmVtb3ZlKCk7XG4gICAgICAgICAgICAgIHRpbGUuZGVzdHJveUNhbnZhcygpO1xuICAgICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwodGFza3MpXG4gIH0sXG5cbiAgZmluaXNoOiBmdW5jdGlvbigpIHtcbiAgICBjb25zdCB0YXNrcyA9IFtdO1xuICAgIHRoaXMudGlsZXMuZm9yRWFjaCgoeGxpbmUsIHkpID0+IHtcbiAgICAgIGNvbnN0IHcgPSBNYXRoLnJhbmRmbG9hdCgwLCAxKSAqIHRoaXMuc3BlZWQ7XG4gICAgICB4bGluZS5mb3JFYWNoKCh0aWxlLCB4KSA9PiB7XG4gICAgICAgIHRpbGUuc2NhbGVYID0gMC4wO1xuICAgICAgICB0aWxlLnNjYWxlWSA9IDAuMDtcbiAgICAgICAgdGFza3MucHVzaChuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICB0aWxlLnR3ZWVuZXIuY2xlYXIoKVxuICAgICAgICAgICAgLndhaXQoKHhsaW5lLmxlbmd0aCAtIHgpICogdGhpcy5zcGVlZCArIHcpXG4gICAgICAgICAgICAudG8oe1xuICAgICAgICAgICAgICBzY2FsZVg6IDEsXG4gICAgICAgICAgICAgIHNjYWxlWTogMVxuICAgICAgICAgICAgfSwgNTAwLCBcImVhc2VPdXRRdWFkXCIpXG4gICAgICAgICAgICAuY2FsbCgoKSA9PiB7XG4gICAgICAgICAgICAgIHRpbGUucmVtb3ZlKCk7XG4gICAgICAgICAgICAgIHRpbGUuZGVzdHJveUNhbnZhcygpO1xuICAgICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwodGFza3MpXG4gIH0sXG5cbiAgX3N0YXRpYzoge1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICBjb2xvcjogXCJibGFja1wiLFxuICAgIH1cbiAgfVxuXG59KTtcbiIsIi8vXG4vLyBBUEnjg6rjgq/jgqjjgrnjg4jmmYLjgoTjgarjgavjgYvmmYLplpPjga7jgYvjgYvjgovlh6bnkIbnlKjjga7jg5fjg63jgrDjg6zjgrnnlLvpnaLvvIjku67vvIlcbi8vXG5waGluYS5kZWZpbmUoXCJDb25uZWN0aW9uUHJvZ3Jlc3NcIiwge1xuICBzdXBlckNsYXNzOiBcIk1vZGFsXCIsXG4gIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICB0aGlzLnN1cGVySW5pdCgpO1xuICAgIHRoaXMub3B0aW9ucyA9ICh7fSkuJHNhZmUob3B0aW9ucyB8fCB7fSwgQ29ubmVjdGlvblByb2dyZXNzLmRlZmF1bHRzKTtcblxuICAgIHRoaXMuc2V0dXAoKTtcbiAgfSxcblxuICBzZXR1cDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5sYXlvdXQgPSBBc3NldE1hbmFnZXIuZ2V0KFwibGF5b3V0XCIsIFwiY29ubmVjdGlvblByb2dyZXNzXCIpLmJ1aWxkKCkuYWRkQ2hpbGRUbyh0aGlzKTtcbiAgICB0aGlzLmFscGhhID0gMDtcbiAgICB0aGlzLnNldHVwTG9hZGluZ0FuaW1hdGlvbigpO1xuICB9LFxuXG4gIHNldHVwTG9hZGluZ0FuaW1hdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgbG9hZGluZyA9IHRoaXMubGF5b3V0LnJlZltcImxvYWRpbmdcIl07XG5cbiAgICBjb25zdCB0YXNrID0gQXJyYXkucmFuZ2UoMCwgMTMpLm1hcChpID0+IHtcbiAgICAgIGNvbnN0IGtleSA9IFwiY1wiICsgaTtcbiAgICAgIGNvbnN0IG95ID0gbG9hZGluZ1trZXldLnk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIGxvYWRpbmdba2V5XS50d2VlbmVyLmNsZWFyKClcbiAgICAgICAgICAud2FpdChpICogMTUwKVxuICAgICAgICAgIC50byh7XG4gICAgICAgICAgICB5OiBveSAtIDEwXG4gICAgICAgICAgfSwgMTUwLCBcImVhc2VJblF1YWRcIilcbiAgICAgICAgICAudG8oe1xuICAgICAgICAgICAgeTogb3lcbiAgICAgICAgICB9LCAxNTAsIFwiZWFzZU91dFF1YWRcIilcbiAgICAgICAgICAuY2FsbCgoKSA9PiByZXNvbHZlKCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBQcm9taXNlLmFsbCh0YXNrKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLnNldHVwTG9hZGluZ0FuaW1hdGlvbigpO1xuICAgICAgfSlcbiAgfSxcblxuICAvL+ihqOekuuOCouODi+ODoeODvOOCt+ODp+ODs1xuICBvcGVuQW5pbWF0aW9uOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICB0aGlzLmFscGhhID0gMDtcbiAgICAgIHRoaXMudHdlZW5lci5jbGVhcigpXG4gICAgICAgIC5mYWRlSW4oMjUwKVxuICAgICAgICAuY2FsbCgoKSA9PiByZXNvbHZlKCkpO1xuICAgIH0pO1xuICB9LFxuXG4gIC8v6Z2e6KGo56S644Ki44OL44Oh44O844K344On44OzXG4gIGNsb3NlQW5pbWF0aW9uOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICB0aGlzLmFscGhhID0gMTtcbiAgICAgIHRoaXMudHdlZW5lci5jbGVhcigpXG4gICAgICAgIC5mYWRlT3V0KDI1MClcbiAgICAgICAgLmNhbGwoKCkgPT4ge1xuICAgICAgICAgIHRoaXMucmVtb3ZlKCk7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfSxcblxuICAvL+W+heapn+OCouODi+ODoeODvOOCt+ODp+ODs1xuICAvL1RPRE8644OH44K244Kk44Oz44GM44Gq44GE44Gu44Gn44Go44KK44GC44GI44GaLi4uXG4gIGlkbGVBbmltYXRpb246IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIC8vIHRoaXMubGFiZWwuZG90Q291bnQgPSAwO1xuICAgICAgLy8gdGhpcy5sYWJlbC50d2VlbmVyLmNsZWFyKClcbiAgICAgIC8vICAgLnRvKHsgZG90Q291bnQ6IDUgfSwgMjAwMClcbiAgICAgIC8vICAgLndhaXQoMjAwKVxuICAgICAgLy8gICAuc2V0KHsgZG90Q291bnQ6IDAgfSlcbiAgICAgIC8vICAgLnNldExvb3AodHJ1ZSk7XG4gICAgICAvLyB0aGlzLmxhYmVsLm9uKFwiZW50ZXJmcmFtZVwiLCAoKSA9PiB7XG4gICAgICAvLyAgIHRoaXMubGFiZWwudGV4dCA9IHRoaXMub3B0aW9ucy50ZXh0ICsgQXJyYXkucmFuZ2UoTWF0aC5mbG9vcih0aGlzLmxhYmVsLmRvdENvdW50KSkubWFwKCgpID0+IFwiLlwiKS5qb2luKFwiXCIpO1xuICAgICAgLy8gfSk7XG4gICAgICByZXNvbHZlKCk7XG4gICAgfSk7XG4gIH0sXG5cbiAgX3N0YXRpYzoge1xuXG4gICAgaW5zdGFuY2U6IG51bGwsXG5cbiAgICBvcGVuOiBmdW5jdGlvbihzY2VuZSkge1xuICAgICAgLy/jgrfjg7zjg7PjgYzlrZjlnKjjgZfjgarjgYTloLTlkIjjga/ljbPluqfjgavlrozkuobjgavjgZnjgotcbiAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfVxuXG4gICAgICAvL+OBmeOBp+OBq+OCpOODs+OCueOCv+ODs+OCueOBjOWtmOWcqOOBmeOCi+WgtOWQiOOBq+OBr+mWieOBmOOBpuOBiuOBj1xuICAgICAgaWYgKHRoaXMuaW5zdGFuY2UpIHtcbiAgICAgICAgdGhpcy5pbnN0YW5jZS5jbG9zZSgpO1xuICAgICAgICB0aGlzLmluc3RhbmNlID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIC8v5paw44GX44GP6L+95Yqg44GX44Gm6KGo56S6XG4gICAgICB0aGlzLmluc3RhbmNlID0gQ29ubmVjdGlvblByb2dyZXNzKCkuYWRkQ2hpbGRUbyhzY2VuZSk7XG4gICAgICByZXR1cm4gdGhpcy5pbnN0YW5jZS5vcGVuKCkudGhlbih0aGlzLmluc3RhbmNlLmlkbGVBbmltYXRpb24oKSk7XG4gICAgfSxcblxuICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghdGhpcy5pbnN0YW5jZSkgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgcmV0dXJuIHRoaXMuaW5zdGFuY2UuY2xvc2UoKS50aGVuKCgpID0+IHRoaXMuaW5zdGFuY2UgPSBudWxsKTtcbiAgICB9LFxuXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgIHRleHQ6IFwi6Kqt44G/6L6844G/5LitXCIsXG4gICAgfSxcbiAgfVxuXG59KTtcbiIsInBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcblxuICBjb25zdCBQQURESU5HID0gMjA7XG5cbiAgcGhpbmEuZGVmaW5lKFwiRGlhbG9nXCIsIHtcbiAgICBzdXBlckNsYXNzOiBcIk1vZGFsXCIsXG5cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLnN1cGVySW5pdCgpO1xuICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICB0aGlzLnNpemUgPSBvcHRpb25zLnNpemUgfHwgRGlhbG9nLlNJWkUuUztcblxuICAgICAgY29uc29sZS5sb2coXCJzaXplOlwiICsgdGhpcy5zaXplKTtcblxuICAgICAgdGhpcy5mcm9tSlNPTih7XG4gICAgICAgIGNoaWxkcmVuOiB7XG4gICAgICAgICAgYmFja2dyb3VuZDoge1xuICAgICAgICAgICAgY2xhc3NOYW1lOiBcIlJlY3RhbmdsZVNoYXBlXCIsXG4gICAgICAgICAgICBhcmd1bWVudHM6IHtcbiAgICAgICAgICAgICAgd2lkdGg6IFNDUkVFTl9XSURUSCxcbiAgICAgICAgICAgICAgaGVpZ2h0OiBTQ1JFRU5fSEVJR0hULFxuICAgICAgICAgICAgICBzdHJva2U6IG51bGwsXG4gICAgICAgICAgICAgIGZpbGw6IFwiIzAwMDAwMDk5XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB4OiBTQ1JFRU5fV0lEVEggKiAwLjUsXG4gICAgICAgICAgICB5OiBTQ1JFRU5fSEVJR0hUICogMC41LFxuICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyB0aGlzLmxheW91dCA9IEFzc2V0TWFuYWdlci5nZXQoXCJsYXlvdXRcIiwgYGRpYWxvZ18ke3RoaXMuc2l6ZX1gKVxuICAgICAgdGhpcy5sYXlvdXQgPSBBc3NldE1hbmFnZXIuZ2V0KFwibGF5b3V0XCIsIFwiZGlhbG9nX2ZyYW1lXCIpXG4gICAgICAgIC5idWlsZCgpXG4gICAgICAgIC5hZGRDaGlsZFRvKHRoaXMpO1xuXG4gICAgICB0aGlzLnVwZGF0ZVNpemUoKTtcbiAgICAgIHRoaXMuc2V0dXBCdXR0b25zKCk7XG4gICAgfSxcblxuICAgIHVwZGF0ZVNpemU6IGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3QgZGlhbG9nID0gdGhpcy5sYXlvdXQuZGlhbG9nO1xuICAgICAgRGlhbG9nLlNJWkUuZm9ySW4oKHNpemUpID0+IHtcbiAgICAgICAgZGlhbG9nW0RpYWxvZy5TSVpFW3NpemVdXS5zbGVlcCgpLmhpZGUoKVxuICAgICAgfSlcbiAgICAgIHRoaXMuZGlhbG9nLndha2VVcCgpLnNob3coKTtcbiAgICB9LFxuXG4gICAgc2V0dXBCdXR0b25zOiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IGJ1dHRvbkxheW91dCA9IEFzc2V0TWFuYWdlci5nZXQoXCJsYXlvdXRcIiwgXCJkaWFsb2dfYnV0dG9uc1wiKS5idWlsZCgpO1xuICAgICAgY29uc3QgZGF0YSA9IGJ1dHRvbkxheW91dC5sYXlvdXRBc3NldC5kYXRhO1xuICAgICAgdGhpcy5fYnV0dG9uSlNPTnMgPSBidXR0b25MYXlvdXQubGF5b3V0QXNzZXQuZGF0YS5yb290LmNoaWxkcmVuO1xuICAgIH0sXG5cbiAgICBzZXRUaXRsZTogZnVuY3Rpb24odGl0bGUpIHtcbiAgICAgIHRoaXMudGl0bGUudGV4dCA9IHRpdGxlO1xuICAgIH0sXG5cbiAgICBhZGRCdXR0b246IGZ1bmN0aW9uKGxhYmVsLCBjb2xvciwgb3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgIHRoaXMuYnV0dG9ucy5mcm9tSlNPTih7XG4gICAgICAgIGNoaWxkcmVuOiBbdGhpcy5fYnV0dG9uSlNPTnNbYCR7Y29sb3J9X21gXV0sXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgYnV0dG9uID0gdGhpcy5idXR0b25zLmNoaWxkcmVuLmxhc3Q7XG5cbiAgICAgIGJ1dHRvbi5CdXR0b24gPSBCdXR0b24oKS5hdHRhY2hUbyhidXR0b24pO1xuICAgICAgYnV0dG9uLmxhYmVsLnRleHQgPSBidXR0b24ubGFiZWxfMi50ZXh0ID0gbGFiZWw7XG4gICAgICBidXR0b24ubGFiZWwuZm9udFNpemUgPSBidXR0b24ubGFiZWxfMi5mb250U2l6ZSA9ICghb3B0aW9ucy5mb250U2l6ZSkgPyBidXR0b24ubGFiZWwuZm9udFNpemUgOiBvcHRpb25zLmZvbnRTaXplO1xuICAgICAgYnV0dG9uLnBvc2l0aW9uID0gVmVjdG9yMigwLCAwKTtcbiAgICAgIGJ1dHRvbi5ob2dlSWQgPSB0aGlzLmJ1dHRvbnMuY2hpbGRyZW4ubGVuZ3RoO1xuXG4gICAgICBsZXQgd2lkdGggPSB0aGlzLmJ1dHRvbnMuY2hpbGRyZW4ucmVkdWNlKCh3LCBlbG0pID0+IHtcbiAgICAgICAgcmV0dXJuIHcgKz0gZWxtLndpZHRoICsgUEFERElORztcbiAgICAgIH0sIDApO1xuXG4gICAgICBsZXQgbGVmdCA9ICh0aGlzLmJ1dHRvbnMud2lkdGggLSB3aWR0aCkgKiAwLjUgLSAodGhpcy5idXR0b25zLndpZHRoICogMC41KTtcblxuICAgICAgdGhpcy5idXR0b25zLmNoaWxkcmVuLmZvckVhY2goKGVsbSkgPT4ge1xuICAgICAgICBlbG0ueCA9IGxlZnQgKyAoZWxtLndpZHRoICsgUEFERElORykgKiAwLjU7XG4gICAgICAgIGxlZnQgPSBlbG0ucmlnaHQgKyBQQURESU5HICogMC41O1xuICAgICAgfSk7XG5cbiAgICAgIC8vdGhpcy5idXR0b25zLmNoaWxkcmVuLmZvckVhY2goZSA9PiBjb25zb2xlLmxvZyhlLnBvc2l0aW9uKSk7XG5cbiAgICAgIHJldHVybiBidXR0b247XG4gICAgfSxcblxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvL+ihqOekulxuICAgIG9wZW46IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMub3BlbkFuaW1hdGlvbigpO1xuICAgIH0sXG5cbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy/pnZ7ooajnpLpcbiAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5jbG9zZUFuaW1hdGlvbigpO1xuICAgIH0sXG5cbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy/ooajnpLrjgqLjg4vjg6Hjg7zjgrfjg6fjg7NcbiAgICBvcGVuQW5pbWF0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgICAgIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgIHRoaXMuYmFja2dyb3VuZC5hbHBoYSA9IDA7XG4gICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kLnR3ZWVuZXIuY2xlYXIoKVxuICAgICAgICAgICAgLmZhZGVJbigyNTApXG4gICAgICAgICAgICAuY2FsbCgoKSA9PiByZXNvbHZlKCkpO1xuICAgICAgICB9KSxcbiAgICAgICAgbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgdGhpcy5sYXlvdXQuZGlhbG9nLnNjYWxlWCA9IDAuMDtcbiAgICAgICAgICB0aGlzLmxheW91dC5kaWFsb2cuc2NhbGVZID0gMC4wO1xuICAgICAgICAgIHRoaXMubGF5b3V0LmRpYWxvZy50d2VlbmVyLmNsZWFyKClcbiAgICAgICAgICAgIC50byh7XG4gICAgICAgICAgICAgIHNjYWxlWDogMS4wLFxuICAgICAgICAgICAgICBzY2FsZVk6IDEuMFxuICAgICAgICAgICAgfSwgMjUwLCBcImVhc2VJbk91dFF1YWRcIilcbiAgICAgICAgICAgIC5jYWxsKCgpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5mbGFyZShcIm9wZW5lZFwiLCB7XG4gICAgICAgICAgICAgICAgZGlhbG9nOiB0aGlzXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgIF0pO1xuICAgIH0sXG5cbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy/pnZ7ooajnpLrjgqLjg4vjg6Hjg7zjgrfjg6fjg7NcbiAgICBjbG9zZUFuaW1hdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xuICAgICAgICBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICB0aGlzLmJhY2tncm91bmQuYWxwaGEgPSAxO1xuICAgICAgICAgIHRoaXMuYmFja2dyb3VuZC50d2VlbmVyLmNsZWFyKClcbiAgICAgICAgICAgIC5mYWRlT3V0KDI1MClcbiAgICAgICAgICAgIC5jYWxsKCgpID0+IHJlc29sdmUoKSk7XG4gICAgICAgIH0pLFxuICAgICAgICBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICB0aGlzLmxheW91dC5kaWFsb2cuc2NhbGVYID0gMS4wO1xuICAgICAgICAgIHRoaXMubGF5b3V0LmRpYWxvZy5zY2FsZVkgPSAxLjA7XG4gICAgICAgICAgdGhpcy5sYXlvdXQuZGlhbG9nLnR3ZWVuZXIuY2xlYXIoKVxuICAgICAgICAgICAgLnRvKHtcbiAgICAgICAgICAgICAgc2NhbGVYOiAwLjAsXG4gICAgICAgICAgICAgIHNjYWxlWTogMC4wXG4gICAgICAgICAgICB9LCAyNTAsIFwiZWFzZUluT3V0UXVhZFwiKVxuICAgICAgICAgICAgLmNhbGwoKCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLmZsYXJlKFwiY2xvc2VkXCIsIHtcbiAgICAgICAgICAgICAgICBkaWFsb2c6IHRoaXNcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgXSkudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMucmVtb3ZlKCk7XG4gICAgICAgIHRoaXMubGF5b3V0LmRlc3Ryb3koKTtcbiAgICAgICAgZGVsZXRlIHRoaXMubGF5b3V0O1xuICAgICAgICB0aGlzLmZsYXJlKFwiZGVzdHJveVwiKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfYWNjZXNzb3I6IHtcbiAgICAgIGNvbnRlbnRzOiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0LnJlZltcImNvbnRlbnRzXCJdO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZGlhbG9nOiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0LmRpYWxvZ1t0aGlzLnNpemVdO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgdGl0bGU6IHtcbiAgICAgICAgLy8gZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMubGF5b3V0LnJlZltcInRpdGxlXCJdLmxhYmVsOyB9XG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuZGlhbG9nLmxhYmVsO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgYnV0dG9uczoge1xuICAgICAgICAvLyBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5sYXlvdXQucmVmW1wiYnV0dG9uc1wiXTsgfVxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmRpYWxvZy5idXR0b25zO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0sXG5cbiAgICBfc3RhdGljOiB7XG4gICAgICBTSVpFOiB7XG4gICAgICAgIFhTOiBcInhzXCIsIC8vNDg2eDMwNyAgXG4gICAgICAgIFM6IFwic1wiLCAvLzQ4NngzOTYgIFxuICAgICAgICBNOiBcIm1cIiwgLy80ODZ4NDY2ICBcbiAgICAgICAgTDogXCJsXCIsIC8vNDg2eDU4NiAgXG4gICAgICAgIFhMOiBcInhsXCIsIC8vNTQ2eDU5NiAgXG4gICAgICAgIFhYTDogXCJ4eGxcIiwgLy81NDZ4NzI2ICBcbiAgICAgICAgWFhYTDogXCJ4eHhsXCIgLy81NDZ4OTU2ICBcbiAgICAgIH0sXG4gICAgICBCVVRUT05fQ09MT1I6IHtcbiAgICAgICAgUkVEOiBcInJlZFwiLFxuICAgICAgICAvLyBHUkVFTjogXCJncmVlblwiLFxuICAgICAgICBCTFVFOiBcImJsdWVcIixcbiAgICAgICAgV0hJVEU6IFwid2hpdGVcIixcbiAgICAgIH0sXG5cbiAgICAgIG9wZW46IGZ1bmN0aW9uKHNjZW5lLCBzaXplLCBzZXR1cEZ1bmN0aW9uKSB7XG4gICAgICAgIGNvbnN0IGRpYWxvZyA9IERpYWxvZyh7XG4gICAgICAgICAgc2l6ZVxuICAgICAgICB9KS5hZGRDaGlsZFRvKHNjZW5lKTtcblxuICAgICAgICBzZXR1cEZ1bmN0aW9uKGRpYWxvZyk7XG4gICAgICAgIGRpYWxvZy5vcGVuKCk7XG5cbiAgICAgICAgLy8g44GT44GG44GX44Gf44GE44GM44CBMUZyYW1l6YGF44KM44Gm44Gh44KJ44Gk44GPXG4gICAgICAgIC8vIFByb21pc2UucmVzb2x2ZSgpXG4gICAgICAgIC8vICAgLnRoZW4oKCkgPT4gc2V0dXBGdW5jdGlvbihkaWFsb2cpKVxuICAgICAgICAvLyAgIC50aGVuKCgpID0+IGRpYWxvZy5vcGVuKCkpXG5cbiAgICAgICAgcmV0dXJuIGRpYWxvZztcbiAgICAgIH0sXG5cbiAgICB9XG4gIH0pO1xufSk7XG4iLCIvKipcbiAqIERvbUJ1dHRvblxuICogZWxlbWVudOOBq+OBi+OBtuOBm+OCi+W9ouOBp0RPTeODnOOCv+ODs+OCkuS9nOaIkOOBl+OBvuOBmeOAglxuICogXG4gKiBQYXJhbWF0ZXJcbiAqIGFwcCAgICAgIENhbnZhc0FwcFxuICogZWxlbWVudCAg44GL44G244Gb44KL5a++6LGhZWxlbWVudFxuICogZnVuYyAgICAg44Kv44Oq44OD44Kv44GV44KM44Gf5pmC44Gr5a6f6KGM44GV44KM44KL6Zai5pWwXG4gKi9cblxucGhpbmEubmFtZXNwYWNlKCgpID0+IHtcbiAgcGhpbmEuZGVmaW5lKFwiRG9tQnV0dG9uXCIsIHtcbiAgICBzdXBlckNsYXNzOiBcIkRpc3BsYXlFbGVtZW50XCIsXG5cbiAgICBpbml0OiBmdW5jdGlvbihhcHAsIGVsZW1lbnQpIHtcbiAgICAgIHRoaXMuc3VwZXJJbml0KCk7XG5cbiAgICAgIHRoaXMuYXBwID0gYXBwO1xuXG4gICAgICB0aGlzLmJ0biA9IG51bGw7XG4gICAgICB0aGlzLnNldHVwKGVsZW1lbnQpO1xuICAgIH0sXG5cbiAgICBzZXR1cDogZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgaWYgKHRoaXMuYnRuKSB7XG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQodGhpcy5idG4pO1xuICAgICAgICAvLyB0aGlzLmJ0bi5yZW1vdmUoKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5idG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgICAgdGhpcy5idG4uaWQgPSBcImJ0blwiXG4gICAgICB0aGlzLmJ0bi5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgIHRoaXMuYnRuLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgIHRoaXMuYnRuLnN0eWxlLnBhZGRpbmcgPSBcIjBweFwiO1xuICAgICAgdGhpcy5idG4uc3R5bGUuYm9yZGVyV2lkdGggPSBcIjBweFwiO1xuXG4gICAgICB0aGlzLmJ0bi5zdHlsZS5maWx0ZXIgPSAnYWxwaGEob3BhY2l0eT0wKSc7XG4gICAgICB0aGlzLmJ0bi5zdHlsZS5Nb3pPcGFjaXR5ID0gMC4wO1xuICAgICAgdGhpcy5idG4uc3R5bGUub3BhY2l0eSA9IDAuMDtcblxuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmJ0bik7XG5cbiAgICAgIHRoaXMuYnRuLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIGVsZW1lbnQuZmxhcmUoJ2NsaWNrZWQnKTtcbiAgICAgICAgdGhpcy5mbGFyZSgnY2xpY2tlZCcpO1xuICAgICAgfTtcblxuICAgICAgdGhpcy5vbignZW50ZXJmcmFtZScsICgpID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLmJ0bikgcmV0dXJuO1xuICAgICAgICBjb25zdCBzY2FsZSA9IHBhcnNlSW50KHRoaXMuYXBwLmRvbUVsZW1lbnQuc3R5bGUud2lkdGgpIC8gdGhpcy5hcHAuZG9tRWxlbWVudC53aWR0aCAqIHRoaXMuYXBwLnF1YWxpdHk7XG4gICAgICAgIGNvbnN0IHdpZHRoID0gZWxlbWVudC53aWR0aCAqIHNjYWxlO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBlbGVtZW50LmhlaWdodCAqIHNjYWxlO1xuXG4gICAgICAgIGxldCBjYW52YXNMZWZ0ID0gcGFyc2VJbnQodGhpcy5hcHAuZG9tRWxlbWVudC5zdHlsZS5sZWZ0KTtcbiAgICAgICAgbGV0IGNhbnZhc1RvcCA9IHBhcnNlSW50KHRoaXMuYXBwLmRvbUVsZW1lbnQuc3R5bGUudG9wKTtcbiAgICAgICAgLy/oh6rouqvjga7jgrDjg63jg7zjg5Djg6vluqfmqJnjgavlkIjjgo/jgZvjgotcbiAgICAgICAgY2FudmFzTGVmdCArPSBlbGVtZW50Ll93b3JsZE1hdHJpeC5tMDIgKiBzY2FsZTtcbiAgICAgICAgY2FudmFzVG9wICs9IGVsZW1lbnQuX3dvcmxkTWF0cml4Lm0xMiAqIHNjYWxlO1xuICAgICAgICBjYW52YXNMZWZ0ICs9IC1lbGVtZW50Lm9yaWdpblggKiB3aWR0aDtcbiAgICAgICAgY2FudmFzVG9wICs9IC1lbGVtZW50Lm9yaWdpblkgKiBoZWlnaHQ7XG5cbiAgICAgICAgdGhpcy5idG4uc3R5bGUuZGlzcGxheSA9IFwiXCI7XG4gICAgICAgIHRoaXMuYnRuLnN0eWxlLndpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgICB0aGlzLmJ0bi5zdHlsZS5oZWlnaHQgPSBgJHtoZWlnaHR9cHhgO1xuICAgICAgICB0aGlzLmJ0bi5zdHlsZS5sZWZ0ID0gYCR7Y2FudmFzTGVmdH1weGA7XG4gICAgICAgIHRoaXMuYnRuLnN0eWxlLnRvcCA9IGAke2NhbnZhc1RvcH1weGA7XG4gICAgICB9KTtcblxuICAgIH0sXG5cbiAgICBvbnJlbW92ZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCF0aGlzLmJ0bikgcmV0dXJuO1xuICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCh0aGlzLmJ0bik7XG4gICAgICAvLyB0aGlzLmJ0bi5yZW1vdmUoKTtcbiAgICAgIHRoaXMuYnRuID0gbnVsbDtcbiAgICB9LFxuXG4gIH0pO1xufSk7XG4iLCJwaGluYS5uYW1lc3BhY2UoKCkgPT4ge1xuICBwaGluYS5kZWZpbmUoXCJEb21WaWRlb1wiLCB7XG4gICAgc3VwZXJDbGFzczogXCJEaXNwbGF5RWxlbWVudFwiLFxuXG4gICAgaW5pdDogZnVuY3Rpb24oYXBwLCBlbGVtZW50KSB7XG4gICAgICB0aGlzLnN1cGVySW5pdCgpO1xuICAgICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgICB0aGlzLnZpZGVvID0gbnVsbDtcbiAgICAgIHRoaXMuc2V0dXAoZWxlbWVudCk7XG4gICAgfSxcblxuICAgIHNldHVwOiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICBpZiAodGhpcy52aWRlbykge1xuICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRoaXMudmlkZW8pO1xuICAgICAgICAvLyB0aGlzLnZpZGVvLnJlbW92ZSgpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB2aWRlbyA9IHRoaXMudmlkZW8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidmlkZW9cIik7XG4gICAgICB2aWRlby5pZCA9IFwidmlkZW9cIjtcbiAgICAgIHZpZGVvLm11dGVkID0gdHJ1ZTtcblxuICAgICAgdmlkZW8uc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG5cbiAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodmlkZW8pO1xuXG4gICAgICB0aGlzLm9uKCdlbnRlcmZyYW1lJywgKCkgPT4ge1xuICAgICAgICBpZiAoIXZpZGVvKSByZXR1cm47XG4gICAgICAgIGNvbnN0IHNjYWxlID0gcGFyc2VJbnQodGhpcy5hcHAuZG9tRWxlbWVudC5zdHlsZS53aWR0aCkgLyB0aGlzLmFwcC5kb21FbGVtZW50LndpZHRoICogdGhpcy5hcHAucXVhbGl0eTtcbiAgICAgICAgY29uc3Qgd2lkdGggPSBlbGVtZW50LndpZHRoICogZWxlbWVudC5zY2FsZVggKiBzY2FsZTtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gZWxlbWVudC5oZWlnaHQgKiBlbGVtZW50LnNjYWxlWCAqIHNjYWxlO1xuXG4gICAgICAgIGxldCBjYW52YXNMZWZ0ID0gcGFyc2VJbnQodGhpcy5hcHAuZG9tRWxlbWVudC5zdHlsZS5sZWZ0KTtcbiAgICAgICAgbGV0IGNhbnZhc1RvcCA9IHBhcnNlSW50KHRoaXMuYXBwLmRvbUVsZW1lbnQuc3R5bGUudG9wKTtcblxuICAgICAgICBjYW52YXNMZWZ0ICs9IGVsZW1lbnQuX3dvcmxkTWF0cml4Lm0wMiAqIHNjYWxlO1xuICAgICAgICBjYW52YXNUb3AgKz0gZWxlbWVudC5fd29ybGRNYXRyaXgubTEyICogc2NhbGU7XG4gICAgICAgIGNhbnZhc0xlZnQgKz0gLWVsZW1lbnQub3JpZ2luWCAqIHdpZHRoO1xuICAgICAgICBjYW52YXNUb3AgKz0gLWVsZW1lbnQub3JpZ2luWSAqIGhlaWdodDtcblxuICAgICAgICAvLyB2aWRlby5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgICAgICAgdmlkZW8uc3R5bGUud2lkdGggPSBgJHt3aWR0aH1weGA7XG4gICAgICAgIHZpZGVvLnN0eWxlLmhlaWdodCA9IGAke2hlaWdodH1weGA7XG4gICAgICAgIHZpZGVvLnN0eWxlLmxlZnQgPSBgJHtjYW52YXNMZWZ0fXB4YDtcbiAgICAgICAgdmlkZW8uc3R5bGUudG9wID0gYCR7Y2FudmFzVG9wfXB4YDtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBsb2FkOiBmdW5jdGlvbihzcmMpIHtcbiAgICAgIHRoaXMudmlkZW8uc3JjID0gc3JjO1xuICAgICAgdGhpcy52aWRlby5vbmxvYWRlZG1ldGFkYXRhID0gKCgpID0+IHtcbiAgICAgICAgdGhpcy5pc0xvYWRlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuZmxhcmUoXCJsb2FkZWRcIik7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBwbGF5OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMudmlkZW8uY3VycmVudFRpbWUgPSAwO1xuICAgICAgdGhpcy52aWRlby5wbGF5KCk7XG4gICAgICB0aGlzLmZsYXJlKFwicGxheVwiKVxuICAgIH0sXG5cbiAgICBvbnJlbW92ZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCF0aGlzLnZpZGVvKSByZXR1cm47XG4gICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRoaXMudmlkZW8pO1xuICAgICAgLy8gdGhpcy52aWRlby5yZW1vdmUoKTtcbiAgICAgIHRoaXMudmlkZW8gPSBudWxsO1xuICAgIH0sXG5cbiAgfSk7XG59KTtcbiIsInBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcbiAgcGhpbmEuZGVmaW5lKFwiRG93bmxvYWRQcm9ncmVzc1wiLCB7XG4gICAgc3VwZXJDbGFzczogXCJNb2RhbFwiLFxuICAgIGFzc2V0czogbnVsbCxcblxuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMuc3VwZXJJbml0KCk7XG4gICAgICB0aGlzLmFzc2V0cyA9IG9wdGlvbnMuYXNzZXRzO1xuICAgICAgdGhpcy5zZXR1cCgpO1xuICAgIH0sXG5cbiAgICBzZXR1cDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmdhdWdlRnJhbWUgPSBSZWN0YW5nbGVTaGFwZSh7XG4gICAgICAgIGZpbGw6IFwid2hpdGVcIixcbiAgICAgICAgc3Ryb2tlOiBudWxsLFxuICAgICAgICBjb3JuZXJSYWRpdXM6IDEyLFxuICAgICAgICB3aWR0aDogNTEyLFxuICAgICAgICBoZWlnaHQ6IDMyLFxuICAgICAgICBwYWRkaW5nOiAwLFxuICAgICAgICB4OiBTQ1JFRU5fV0lEVEggKiAwLjUsXG4gICAgICAgIHk6IDI0XG4gICAgICB9KS5hZGRDaGlsZFRvKHRoaXMpO1xuXG4gICAgICBjb25zb2xlLmxvZyh0aGlzLmdhdWdlRnJhbWUub3JpZ2luWCwgdGhpcy5nYXVnZUZyYW1lLm9yaWdpblkpXG5cbiAgICAgIHRoaXMuZ2F1Z2UgPSBSZWN0YW5nbGVTaGFwZSh7XG4gICAgICAgIGZpbGw6IFwib3JhbmdlXCIsXG4gICAgICAgIHN0cm9rZTogbnVsbCxcbiAgICAgICAgY29ybmVyUmFkaXVzOiAxMixcbiAgICAgICAgd2lkdGg6IDUwNixcbiAgICAgICAgaGVpZ2h0OiAyNixcbiAgICAgICAgcGFkZGluZzogMCxcbiAgICAgICAgeDogLXRoaXMuZ2F1Z2VGcmFtZS53aWR0aCAqIDAuNSArIDMsXG4gICAgICAgIHk6IDAsXG4gICAgICB9KS5hZGRDaGlsZFRvKHRoaXMuZ2F1Z2VGcmFtZSk7XG5cbiAgICAgIHRoaXMuZ2F1Z2Uuc2V0T3JpZ2luKDAsIDAuNSk7XG5cbiAgICAgIHRoaXMuZ2F1Z2UuR2F1Z2UgPSBHYXVnZSgpLmF0dGFjaFRvKHRoaXMuZ2F1Z2UpO1xuICAgICAgdGhpcy5nYXVnZS5HYXVnZS5taW4gPSAwLjA7XG4gICAgICB0aGlzLmdhdWdlLkdhdWdlLm1heCA9IDEuMDtcbiAgICAgIHRoaXMuc2V0UHJvZ3Jlc3MoMC4wKTtcbiAgICB9LFxuXG4gICAgc2V0UHJvZ3Jlc3M6IGZ1bmN0aW9uKHByb2dyZXNzKSB7XG4gICAgICB0aGlzLmdhdWdlLkdhdWdlLnZhbHVlID0gcHJvZ3Jlc3M7XG4gICAgfSxcblxuICAgIC8v6KGo56S644Ki44OL44Oh44O844K344On44OzXG4gICAgb3BlbkFuaW1hdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIHRoaXMuYWxwaGEgPSAwO1xuICAgICAgICB0aGlzLnR3ZWVuZXIuY2xlYXIoKVxuICAgICAgICAgIC5mYWRlSW4oMjUwKVxuICAgICAgICAgIC53YWl0KDI1MClcbiAgICAgICAgICAuY2FsbCgoKSA9PiByZXNvbHZlKCkpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8v6Z2e6KGo56S644Ki44OL44Oh44O844K344On44OzXG4gICAgY2xvc2VBbmltYXRpb246IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICB0aGlzLmFscGhhID0gMTtcbiAgICAgICAgdGhpcy50d2VlbmVyLmNsZWFyKClcbiAgICAgICAgICAud2FpdCgyNTApXG4gICAgICAgICAgLmZhZGVPdXQoMjUwKVxuICAgICAgICAgIC5jYWxsKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKCk7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgLy/ov73liqDjgafjgqLjgrvjg4Pjg4jjgpLoqq3jgb/ovrzjgoBcbiAgICBzdGFydExvYWRBc3NldHM6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCF0aGlzLmFzc2V0cykgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICBjb25zdCBsb2FkZXIgPSBBc3NldExvYWRlcigpO1xuICAgICAgICBsb2FkZXIub25sb2FkID0gKCkgPT4gcmVzb2x2ZSgpO1xuICAgICAgICBsb2FkZXIub25wcm9ncmVzcyA9IChlKSA9PiB0aGlzLnNldFByb2dyZXNzKGUucHJvZ3Jlc3MpO1xuICAgICAgICBsb2FkZXIubG9hZCh0aGlzLmFzc2V0cyk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgX3N0YXRpYzoge1xuXG4gICAgICBpbnN0YW5jZTogbnVsbCxcblxuICAgICAgb3BlbjogZnVuY3Rpb24oc2NlbmUsIHBhdGhQcmVmLCBhc3NldHMpIHtcblxuICAgICAgICBhc3NldHMgPSBEb3dubG9hZFByb2dyZXNzLnlldExvYWRlZEFzc2V0cyhcbiAgICAgICAgICBSb290LkxvYWRpbmdTY2VuZS5jb21iaW5lQXNzZXRzUGF0aChhc3NldHMsIHBhdGhQcmVmKVxuICAgICAgICApO1xuXG4gICAgICAgIC8v44K344O844Oz44GM5a2Y5Zyo44GX44Gq44GE5aC05ZCI44Gv5Y2z5bqn44Gr5a6M5LqG44Gr44GZ44KLXG4gICAgICAgIGlmICghc2NlbmUgfHwgIWFzc2V0cykge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8v44GZ44Gn44Gr44Kk44Oz44K544K/44Oz44K544GM5a2Y5Zyo44GZ44KL5aC05ZCI44Gr44Gv6ZaJ44GY44Gm44GK44GPXG4gICAgICAgIGlmICh0aGlzLmluc3RhbmNlKSB7XG4gICAgICAgICAgdGhpcy5pbnN0YW5jZS5jbG9zZSgpO1xuICAgICAgICAgIHRoaXMuaW5zdGFuY2UgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy/mlrDjgZfjgY/ov73liqDjgZfjgabooajnpLpcbiAgICAgICAgdGhpcy5pbnN0YW5jZSA9IERvd25sb2FkUHJvZ3Jlc3MoeyBhc3NldHMgfSkuYWRkQ2hpbGRUbyhzY2VuZSk7XG4gICAgICAgIHJldHVybiB0aGlzLmluc3RhbmNlLm9wZW4oKVxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuaW5zdGFuY2Uuc3RhcnRMb2FkQXNzZXRzKCkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5pbnN0YW5jZS5jbG9zZSgpXG4gICAgICAgICAgICB0aGlzLmluc3RhbmNlID0gbnVsbDtcbiAgICAgICAgICB9KVxuICAgICAgfSxcblxuICAgICAgeWV0TG9hZGVkQXNzZXRzOiBmdW5jdGlvbihhc3NldHMpIHtcbiAgICAgICAgaWYgKCFhc3NldHMpIHJldHVybiBudWxsO1xuICAgICAgICBjb25zdCB5ZXQgPSB7fTtcbiAgICAgICAgYXNzZXRzLmZvckluKCh0eXBlLCBkYXRhKSA9PiB7XG4gICAgICAgICAgZGF0YS5mb3JJbigoa2V5LCB2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFwaGluYS5hc3NldC5Bc3NldE1hbmFnZXIuZ2V0KHR5cGUsIGtleSkpIHtcbiAgICAgICAgICAgICAgeWV0W3R5cGVdID0geWV0W3R5cGVdIHx8IHt9O1xuICAgICAgICAgICAgICB5ZXRbdHlwZV1ba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIChPYmplY3Qua2V5cyh5ZXQpLmxlbmd0aCA+IDApID8geWV0IDogbnVsbDtcbiAgICAgIH1cblxuICAgIH1cblxuICB9KTtcbn0pO1xuIiwicGhpbmEubmFtZXNwYWNlKCgpID0+IHtcbiAgcGhpbmEuZGVmaW5lKFwiSW5wdXRGaWVsZFwiLCB7XG4gICAgc3VwZXJDbGFzczogXCJEaXNwbGF5RWxlbWVudFwiLFxuXG4gICAgZG9tRWxlbWVudDogbnVsbCxcblxuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMub3B0aW9ucyA9ICh7fSkuJHNhZmUob3B0aW9ucywgSW5wdXRGaWVsZC5kZWZhdWx0cyk7XG4gICAgICB0aGlzLnN1cGVySW5pdChvcHRpb25zKTtcblxuICAgICAgdGhpcy5kb21FbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlucHV0XCIpO1xuICAgICAgdGhpcy5kb21FbGVtZW50LnR5cGUgPSBcInRleHRcIjtcbiAgICAgIHRoaXMuZG9tRWxlbWVudC52YWx1ZSA9IHRoaXMub3B0aW9ucy50ZXh0O1xuXG4gICAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgdGhpcy5kb21FbGVtZW50LnN0eWxlLnBhZGRpbmcgPSBcIjBweFwiO1xuICAgICAgdGhpcy5kb21FbGVtZW50LnN0eWxlLmJvcmRlcldpZHRoID0gXCIwcHhcIjtcbiAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5kb21FbGVtZW50KTtcblxuICAgICAgdGhpcy5kb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJmb2N1c1wiLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuZmxhcmUoXCJmb2N1c1wiKTtcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLmRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImZvY3Vzb3V0XCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5mbGFyZShcImZvY3Vzb3V0XCIpO1xuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLmZsYXJlKFwiY2hhbmdlXCIpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vVE9ETzphcHDjga7lj4Lnhafmlrnms5Xjgafku5bjgavoia/jgYTmlrnms5XjgYzjgYLjgozjgbDlpInmm7TjgZnjgotcbiAgICAgIHRoaXMub25lKFwiZW50ZXJmcmFtZVwiLCAoZSkgPT4ge1xuICAgICAgICB0aGlzLmFwcCA9IGUuYXBwO1xuICAgICAgICB0aGlzLnNldHVwKCk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgc2V0dXA6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5vbihcImVudGVyZnJhbWVcIiwgKCkgPT4ge1xuICAgICAgICBjb25zdCBzY2FsZSA9IHBhcnNlSW50KHRoaXMuYXBwLmRvbUVsZW1lbnQuc3R5bGUud2lkdGgpIC8gdGhpcy5hcHAuZG9tRWxlbWVudC53aWR0aCAqIHRoaXMuYXBwLnF1YWxpdHk7XG5cbiAgICAgICAgbGV0IGZvbnRTaXplID0gKHRoaXMub3B0aW9ucy5mb250U2l6ZSAqIHNjYWxlKS5yb3VuZCgpO1xuICAgICAgICAvL+OCreODo+ODs+ODkOOCueOBruW3puS4iuOBq+WQiOOCj+OBm+OCi1xuICAgICAgICBsZXQgd2lkdGggPSB0aGlzLndpZHRoICogc2NhbGU7XG4gICAgICAgIGxldCBoZWlnaHQgPSB0aGlzLmhlaWdodCAqIHNjYWxlO1xuICAgICAgICBsZXQgY2FudmFzTGVmdCA9IHBhcnNlSW50KHRoaXMuYXBwLmRvbUVsZW1lbnQuc3R5bGUubGVmdCk7XG4gICAgICAgIGxldCBjYW52YXNUb3AgPSBwYXJzZUludCh0aGlzLmFwcC5kb21FbGVtZW50LnN0eWxlLnRvcCk7XG5cbiAgICAgICAgLy/oh6rouqvjga7jgrDjg63jg7zjg5Djg6vluqfmqJnjgavlkIjjgo/jgZvjgotcbiAgICAgICAgY2FudmFzTGVmdCArPSB0aGlzLl93b3JsZE1hdHJpeC5tMDIgKiBzY2FsZTtcbiAgICAgICAgY2FudmFzVG9wICs9IHRoaXMuX3dvcmxkTWF0cml4Lm0xMiAqIHNjYWxlO1xuICAgICAgICAvL29yaWdpbuOBruiqv+aVtFxuICAgICAgICBjYW52YXNMZWZ0ICs9IC10aGlzLm9yaWdpblggKiB3aWR0aDtcbiAgICAgICAgY2FudmFzVG9wICs9IC10aGlzLm9yaWdpblkgKiBoZWlnaHQ7XG5cbiAgICAgICAgdGhpcy5kb21FbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUud2lkdGggPSBgJHt3aWR0aH1weGA7XG4gICAgICAgIHRoaXMuZG9tRWxlbWVudC5zdHlsZS5oZWlnaHQgPSBgJHtoZWlnaHR9cHhgO1xuICAgICAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUubGVmdCA9IGAke2NhbnZhc0xlZnR9cHhgO1xuICAgICAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUudG9wID0gYCR7Y2FudmFzVG9wfXB4YDtcbiAgICAgICAgdGhpcy5kb21FbGVtZW50LnN0eWxlLmZvbnRTaXplID0gYCR7Zm9udFNpemV9cHhgO1xuICAgICAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUuZm9udEZhbWlsaXkgPSBcIk1haW4tQm9sZFwiO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIHNldFZpc2libGU6IGZ1bmN0aW9uKGZsYWcpIHtcbiAgICAgIHRoaXMudmlzaWJsZSA9IGZsYWc7XG4gICAgICBpZiAodGhpcy5kb21FbGVtZW50KSB7XG4gICAgICAgIHRoaXMuZG9tRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gKGZsYWcpID8gXCJcIiA6IFwibm9uZVwiO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIHNob3c6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5zZXRWaXNpYmxlKHRydWUpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGhpZGU6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5zZXRWaXNpYmxlKGZhbHNlKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBhZGRDU1M6IGZ1bmN0aW9uKGNzcykge1xuICAgICAgaWYgKGNzcyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIGNzcy5mb3JFYWNoKChjKSA9PiB7XG4gICAgICAgICAgdGhpcy5kb21FbGVtZW50LmNsYXNzTGlzdC5hZGQoYyk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMuZG9tRWxlbWVudCkge1xuICAgICAgICAgIHRoaXMuZG9tRWxlbWVudC5jbGFzc0xpc3QuYWRkKGNzcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICByZW1vdmVDU1M6IGZ1bmN0aW9uKGNzcykge1xuICAgICAgaWYgKGNzcyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIGNzcy5mb3JFYWNoKChjKSA9PiB7XG4gICAgICAgICAgdGhpcy5kb21FbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoYyk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMuZG9tRWxlbWVudCkge1xuICAgICAgICAgIHRoaXMuZG9tRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKGNzcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBvbnJlbW92ZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuZG9tRWxlbWVudCkge1xuICAgICAgICB0aGlzLmRvbUVsZW1lbnQucmVtb3ZlKCk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIF9hY2Nlc3Nvcjoge1xuICAgICAgdGV4dDoge1xuICAgICAgICBcImdldFwiOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gKHRoaXMuZG9tRWxlbWVudCkgPyB0aGlzLmRvbUVsZW1lbnQudmFsdWUgOiBcIlwiO1xuICAgICAgICB9LFxuICAgICAgICBcInNldFwiOiBmdW5jdGlvbih2KSB7XG4gICAgICAgICAgaWYgKCF0aGlzLmRvbUVsZW1lbnQpIHJldHVybjtcbiAgICAgICAgICB0aGlzLmRvbUVsZW1lbnQudmFsdWUgPSB2O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcblxuICAgIF9zdGF0aWM6IHtcbiAgICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIHdpZHRoOiAyMDAsXG4gICAgICAgIGhlaWdodDogNDAsXG4gICAgICAgIGZvbnRTaXplOiAyMCxcbiAgICAgICAgdGV4dDogXCJcIixcbiAgICAgIH1cbiAgICB9LFxuICB9KTtcbn0pO1xuIiwiLy9cbi8vIOOCr+ODquODg+OCr+OChOOCv+ODg+ODgeOCkuOCpOODs+OCv+ODvOOCu+ODl+ODiOOBmeOCi1xuLy9cbnBoaW5hLmRlZmluZShcIklucHV0SW50ZXJjZXB0XCIsIHtcbiAgc3VwZXJDbGFzczogXCJEaXNwbGF5RWxlbWVudFwiLFxuXG4gIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3VwZXJJbml0KCk7XG5cbiAgICB0aGlzLm9uKFwiYWRkZWRcIiwgKCkgPT4ge1xuICAgICAgLy/opqrjgavlr77jgZfjgabopobjgYTjgYvjgbbjgZvjgotcbiAgICAgIHRoaXMud2lkdGggPSB0aGlzLnBhcmVudC53aWR0aDtcbiAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy5wYXJlbnQuaGVpZ2h0O1xuICAgICAgdGhpcy5vcmlnaW5YID0gdGhpcy5wYXJlbnQub3JpZ2luWCB8fCAwO1xuICAgICAgdGhpcy5vcmlnaW5ZID0gdGhpcy5wYXJlbnQub3JpZ2luWSB8fCAwO1xuICAgICAgdGhpcy54ID0gMDtcbiAgICAgIHRoaXMueSA9IDA7XG4gICAgfSk7XG4gICAgdGhpcy5kaXNhYmxlKCk7XG4gIH0sXG5cbiAgZW5hYmxlOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNldEludGVyYWN0aXZlKHRydWUpO1xuICB9LFxuXG4gIGRpc2FibGU6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2V0SW50ZXJhY3RpdmUoZmFsc2UpO1xuICB9LFxuXG59KTtcbiIsInBoaW5hLmRlZmluZShcIk1vZGFsXCIsIHtcbiAgc3VwZXJDbGFzczogXCJJbnB1dEludGVyY2VwdFwiLFxuXG4gIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3VwZXJJbml0KCk7XG4gICAgdGhpcy5lbmFibGUoKTtcbiAgfSxcbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvL+ihqOekuuOCouODi+ODoeODvOOCt+ODp+ODs1xuICAvLyDjgqLjg4vjg6Hjg7zjgrfjg6fjg7PjgavjgaTjgYTjgabjga/ntpnmib/lhYPjgaflho3lrprnvqlcbiAgb3BlbkFuaW1hdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9LFxuXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy/pnZ7ooajnpLrjgqLjg4vjg6Hjg7zjgrfjg6fjg7NcbiAgLy8g44Ki44OL44Oh44O844K344On44Oz44Gr44Gk44GE44Gm44Gv57aZ5om/5YWD44Gn5YaN5a6a576pXG4gIGNsb3NlQW5pbWF0aW9uOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH0sXG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvL+ihqOekulxuICBvcGVuOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5vcGVuQW5pbWF0aW9uKCk7XG4gIH0sXG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvL+mdnuihqOekulxuICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuY2xvc2VBbmltYXRpb24oKTtcbiAgfVxuXG59KTtcbiIsInBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcblxuICBsZXQgZHVtbXlUZXh0dXJlID0gbnVsbDtcblxuICBwaGluYS5kZWZpbmUoXCJTcHJpdGVMYWJlbFwiLCB7XG4gICAgc3VwZXJDbGFzczogXCJEaXNwbGF5RWxlbWVudFwiLFxuXG4gICAgX3RleHQ6IG51bGwsXG4gICAgdGFibGU6IG51bGwsXG4gICAgZml4V2lkdGg6IDAsXG5cbiAgICBzcHJpdGVzOiBudWxsLFxuXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgaWYgKCFkdW1teVRleHR1cmUpIHtcbiAgICAgICAgZHVtbXlUZXh0dXJlID0gQ2FudmFzKCkuc2V0U2l6ZSgxLCAxKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zdXBlckluaXQob3B0aW9ucyk7XG4gICAgICB0aGlzLnRhYmxlID0gb3B0aW9ucy50YWJsZTtcbiAgICAgIHRoaXMuZml4V2lkdGggPSBvcHRpb25zLmZpeFdpZHRoIHx8IDA7XG5cbiAgICAgIHRoaXMuc3ByaXRlcyA9IFtdO1xuXG4gICAgICB0aGlzLnNldFRleHQoXCJcIik7XG4gICAgfSxcblxuICAgIHNldFRleHQ6IGZ1bmN0aW9uKHRleHQpIHtcbiAgICAgIHRoaXMuX3RleHQgPSB0ZXh0O1xuXG4gICAgICBjb25zdCBjaGFycyA9IHRoaXMudGV4dC5zcGxpdChcIlwiKTtcblxuICAgICAgaWYgKHRoaXMuc3ByaXRlcy5sZW5ndGggPCBjaGFycy5sZW5ndGgpIHtcbiAgICAgICAgQXJyYXkucmFuZ2UoMCwgdGhpcy5zcHJpdGVzLmxlbmd0aCAtIGNoYXJzLmxlbmd0aCkuZm9yRWFjaCgoKSA9PiB7XG4gICAgICAgICAgdGhpcy5zcHJpdGVzLnB1c2goU3ByaXRlKGR1bW15VGV4dHVyZSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIEFycmF5LnJhbmdlKDAsIGNoYXJzLmxlbmd0aCAtIHRoaXMuc3ByaXRlcy5sZW5ndGgpLmZvckVhY2goKCkgPT4ge1xuICAgICAgICAgIHRoaXMuc3ByaXRlcy5sYXN0LnJlbW92ZSgpO1xuICAgICAgICAgIHRoaXMuc3ByaXRlcy5sZW5ndGggLT0gMTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3RleHQuc3BsaXQoXCJcIikubWFwKChjLCBpKSA9PiB7XG4gICAgICAgIHRoaXMuc3ByaXRlc1tpXVxuICAgICAgICAgIC5zZXRJbWFnZSh0aGlzLnRhYmxlW2NdKVxuICAgICAgICAgIC5zZXRPcmlnaW4odGhpcy5vcmlnaW5YLCB0aGlzLm9yaWdpblkpXG4gICAgICAgICAgLmFkZENoaWxkVG8odGhpcyk7XG4gICAgICB9KTtcblxuICAgICAgY29uc3QgdG90YWxXaWR0aCA9IHRoaXMuc3ByaXRlcy5yZWR1Y2UoKHcsIHMpID0+IHcgKyAodGhpcy5maXhXaWR0aCB8fCBzLndpZHRoKSwgMCk7XG4gICAgICBjb25zdCB0b3RhbEhlaWdodCA9IHRoaXMuc3ByaXRlcy5tYXAoXyA9PiBfLmhlaWdodCkuc29ydCgpLmxhc3Q7XG5cbiAgICAgIGxldCB4ID0gdG90YWxXaWR0aCAqIC10aGlzLm9yaWdpblg7XG4gICAgICB0aGlzLnNwcml0ZXMuZm9yRWFjaCgocykgPT4ge1xuICAgICAgICBjb25zdCB3aWR0aCA9IHRoaXMuZml4V2lkdGggfHwgcy53aWR0aDtcbiAgICAgICAgcy54ID0geCArIHdpZHRoICogcy5vcmlnaW5YO1xuICAgICAgICB4ICs9IHdpZHRoO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBfYWNjZXNzb3I6IHtcbiAgICAgIHRleHQ6IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fdGV4dDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XG4gICAgICAgICAgdGhpcy5zZXRUZXh0KHYpO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuXG4gIH0pO1xuXG59KTtcbiJdfQ==
