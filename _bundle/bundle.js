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

      back.setInteractive(true);
      back.on('pointend', () => this.exit("main"));

    },

    update: function() {
    },

  });

});

phina.namespace(function() {

  phina.define('Player', {
    superClass: 'Actor',

    init: function(options) {
      this.superInit();

      this.sprite = Sprite("actor4", 32, 32)
        .setFrameIndex(0)
        .addChildTo(this);

      this.nowAnimation = "stand";
    },

    update: function() {
      const app = phina_app;
      const ctrl = app.controller;
      if (ctrl.up) {
        this.y -= 2;
        if (ctrl.left) {
          this.x -= 2;
          this.setAnimation("upleft");
        } else if (ctrl.right) {
          this.x += 2;
          this.setAnimation("upright");
        } else {
          this.setAnimation("up");
        }
      } else if (ctrl.down) {
        this.y += 2;
        if (ctrl.left) {
          this.x -= 2;
          this.setAnimation("downleft");
        } else if (ctrl.right) {
          this.x += 2;
          this.setAnimation("downright");
        } else {
          this.setAnimation("down");
        }
      } else if (ctrl.left) {
        this.x -= 2;
        this.setAnimation("left");
      } else if (ctrl.right) {
        this.x += 2;
        this.setAnimation("right");
      }

      if (ctrl.jump) {
        if (!this.isJump) {
          this.isJump = true;
          this.sprite.tweener.clear()
            .by({ y: -32 }, 200, "easeOutSine")
            .by({ y: 32 }, 200, "easeInSine")
            .call(() => this.isJump = false)
          }
      }
    },

    setupAnimation: function() {
      this.spcialAnimation = false;
      this.frame = [];
      this.frame["stand"] = [13, 14];
      this.frame["jump"] = [36, "stop"];

      this.frame["up"] =   [ 9, 10, 11, 10];
      this.frame["down"] = [ 0,  1,  2,  1];
      this.frame["left"] = [ 3,  4,  5,  4];
      this.frame["right"] = [ 6,  7,  8,  7];
      this.frame["downleft"] = [ 48,  49,  50,  49];
      this.frame["upleft"] = [ 51,  52,  53,  52];
      this.frame["downright"] = [ 54,  55,  56,  55];
      this.frame["upright"] = [ 57,  58,  59,  58];


      this.frame["attack"] = [ 41, 42, 43, 44, "stop"];
      this.frame["defense"] = [ 41, 42, 43, 44, "stop"];
      this.frame["damage"] = [ 18, 19, 20];
      this.frame["drop"] = [18, 19, 20];
      this.frame["dead"] = [18, 19, 20, 33, 34, 35, "stop"];
      this.frame["clear"] = [24, 25, 26];
      this.frame["stun"] = [ 18, 19, 20];
      this.index = -1;
      return this;
    },

  });

});

phina.namespace(function() {

  phina.define('World', {
    superClass: 'DisplayElement',

    init: function(options) {
      this.superInit();
      this.setup();
    },

    setup: function() {
      this.mapBase = DisplayElement()
        .setPosition(SCREEN_WIDTH_HALF, SCREEN_HEIGHT_HALF)
        .addChildTo(this);

      this.player = Player().addChildTo(this.mapBase);
    },

    update: function() {
      
    },

  });

});

phina.namespace(function() {

  phina.define('Actor', {
    superClass: 'DisplayElement',

    sprite: null,
    animationInterval: 10,

    isJump: false,

    init: function(options) {
      this.superInit();

      this.setupAnimation();

      this.on('enterframe', () => {
        //アニメーション
        if (this.sprite && this.time % this.animationInterval == 0) {
          this.index = (this.index+1) % this.frame[this.nowAnimation].length;
          //次フレーム番号が特殊指定の場合
          var next = this.frame[this.nowAnimation][this.index];
          if (next == "stop") {
              //停止
              this.index--;
          } else if (next == "remove") {
              //リムーブ
              this.remove();
          } else if (typeof next === "string") {
              //指定アニメーションへ変更
              this.setAnimation(next);
          } else {
              this.sprite.frameIndex = next;
          }
        }
        this.time++;
      });
      this.time = 0;
    },

    setShadow: function() {
      if (this.shadow) return this;
      this.shadow = Sprite("shadow")
        .setPosition(0, 32)
        .addChildTo(this);
      this.shadow.alpha = 0.5;

      return this;
    },

    setupAnimation: function() {
      return this;
    },

    setAnimation: function(animName) {
      if (!this.frame[animName]) return this;
      if (animName == this.nowAnimation) return this;
      this.nowAnimation = animName;
      this.index = -1;
      this.isChangeAnimation = true;
      return this;
    },

  });

});

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

          attack: gp.getKey("A") || kb.getKey("X"),
          jump:   gp.getKey("X") || kb.getKey("Z"),
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
                "actor4": "assets/textures/actor4.png",
                "shadow": "assets/textures/shadow.png",
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCIwMjBfc2NlbmUvTWFpblNjZW5lLmpzIiwiMDIwX3NjZW5lL1RpdGxlU2NlbmUuanMiLCIwNDBfZWxlbWVudC9QbGF5ZXIuanMiLCIwNDBfZWxlbWVudC9Xb3JsZC5qcyIsIjAzMF9iYXNlL0FjdG9yLmpzIiwiMDEwX2FwcGxpY2F0aW9uL0FwcGxpY2F0aW9uLmpzIiwiMDEwX2FwcGxpY2F0aW9uL0Fzc2V0TGlzdC5qcyIsIjAxMF9hcHBsaWNhdGlvbi9CYXNlU2NlbmUuanMiLCIwMTBfYXBwbGljYXRpb24vRmlyc3RTY2VuZUZsb3cuanMiLCIwMDBfY29tbW9uL2FjY2Vzc29yeS9CdXR0b24uanMiLCIwMDBfY29tbW9uL2FjY2Vzc29yeS9DbGlwU3ByaXRlLmpzIiwiMDAwX2NvbW1vbi9hY2Nlc3NvcnkvR2F1Z2UuanMiLCIwMDBfY29tbW9uL2FjY2Vzc29yeS9HcmF5c2NhbGUuanMiLCIwMDBfY29tbW9uL2FjY2Vzc29yeS9MaXN0Vmlldy5qcyIsIjAwMF9jb21tb24vYWNjZXNzb3J5L01vdXNlQ2hhc2VyLmpzIiwiMDAwX2NvbW1vbi9hY2Nlc3NvcnkvUGllQ2xpcC5qcyIsIjAwMF9jb21tb24vYWNjZXNzb3J5L1JlY3RhbmdsZUNsaXAuanMiLCIwMDBfY29tbW9uL2FjY2Vzc29yeS9Ub2dnbGUuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvQXNzZXRMb2FkZXIuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvQmFzZUFwcC5qcyIsIjAwMF9jb21tb24vZXh0ZW5zaW9ucy9DYW52YXMuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvQ2FudmFzUmVuZGVyZXIuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvQ2hlY2tCcm93c2VyLmpzIiwiMDAwX2NvbW1vbi9leHRlbnNpb25zL0Rpc3BsYXlFbGVtZW50LmpzIiwiMDAwX2NvbW1vbi9leHRlbnNpb25zL0Rpc3BsYXlTY2VuZS5qcyIsIjAwMF9jb21tb24vZXh0ZW5zaW9ucy9Eb21BdWRpb1NvdW5kLmpzIiwiMDAwX2NvbW1vbi9leHRlbnNpb25zL0VsZW1lbnQuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvSW5wdXQuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvTGFiZWwuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvTW91c2UuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvT2JqZWN0MkQuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvUGxhaW5FbGVtZW50LmpzIiwiMDAwX2NvbW1vbi9leHRlbnNpb25zL1NoYXBlLmpzIiwiMDAwX2NvbW1vbi9leHRlbnNpb25zL1NvdW5kLmpzIiwiMDAwX2NvbW1vbi9leHRlbnNpb25zL1NvdW5kTWFuYWdlci5qcyIsIjAwMF9jb21tb24vZXh0ZW5zaW9ucy9TcHJpdGUuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvU3RyaW5nLmpzIiwiMDAwX2NvbW1vbi9leHRlbnNpb25zL1RleHR1cmUuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvVHdlZW5lci5qcyIsIjAwMF9jb21tb24vdXRpbC9CdXR0b25pemUuanMiLCIwMDBfY29tbW9uL3V0aWwvVGV4dHVyZVV0aWwuanMiLCIwMDBfY29tbW9uL3V0aWwvVGlsZWRtYXAuanMiLCIwMDBfY29tbW9uL3V0aWwvVXRpbC5qcyIsIjAwMF9jb21tb24vZWxlbWVudHMvc2NlbmUvQmFzZVNjZW5lLmpzIiwiMDAwX2NvbW1vbi9lbGVtZW50cy9zY2VuZUVmZmVjdHMvU2NlbmVFZmZlY3RCYXNlLmpzIiwiMDAwX2NvbW1vbi9lbGVtZW50cy9zY2VuZUVmZmVjdHMvU2NlbmVFZmZlY3RDaXJjbGVGYWRlLmpzIiwiMDAwX2NvbW1vbi9lbGVtZW50cy9zY2VuZUVmZmVjdHMvU2NlbmVFZmZlY3RGYWRlLmpzIiwiMDAwX2NvbW1vbi9lbGVtZW50cy9zY2VuZUVmZmVjdHMvU2NlbmVFZmZlY3ROb25lLmpzIiwiMDAwX2NvbW1vbi9lbGVtZW50cy9zY2VuZUVmZmVjdHMvU2NlbmVFZmZlY3RUaWxlRmFkZS5qcyIsIjAwMF9jb21tb24vZWxlbWVudHMvdWkvQ29ubmVjdGlvblByb2dyZXNzLmpzIiwiMDAwX2NvbW1vbi9lbGVtZW50cy91aS9EaWFsb2cuanMiLCIwMDBfY29tbW9uL2VsZW1lbnRzL3VpL0RvbUJ1dHRvbi5qcyIsIjAwMF9jb21tb24vZWxlbWVudHMvdWkvRG9tVmlkZW8uanMiLCIwMDBfY29tbW9uL2VsZW1lbnRzL3VpL0Rvd25sb2FkUHJvZ3Jlc3MuanMiLCIwMDBfY29tbW9uL2VsZW1lbnRzL3VpL0lucHV0RmllbGQuanMiLCIwMDBfY29tbW9uL2VsZW1lbnRzL3VpL0lucHV0SW50ZXJjZXB0LmpzIiwiMDAwX2NvbW1vbi9lbGVtZW50cy91aS9Nb2RhbC5qcyIsIjAwMF9jb21tb24vZWxlbWVudHMvdWkvU3ByaXRlTGFiZWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9kQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2poQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqICBtYWluLmpzXG4gKi9cblxucGhpbmEuZ2xvYmFsaXplKCk7XG5cbmNvbnN0IFNDUkVFTl9XSURUSCA9IDU3NjtcbmNvbnN0IFNDUkVFTl9IRUlHSFQgPSAzMjQ7XG5jb25zdCBTQ1JFRU5fV0lEVEhfSEFMRiA9IFNDUkVFTl9XSURUSCAqIDAuNTtcbmNvbnN0IFNDUkVFTl9IRUlHSFRfSEFMRiA9IFNDUkVFTl9IRUlHSFQgKiAwLjU7XG5cbmNvbnN0IFNDUkVFTl9PRkZTRVRfWCA9IDA7XG5jb25zdCBTQ1JFRU5fT0ZGU0VUX1kgPSAwO1xuXG5sZXQgcGhpbmFfYXBwO1xuXG53aW5kb3cub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gIHBoaW5hX2FwcCA9IEFwcGxpY2F0aW9uKCk7XG4gIHBoaW5hX2FwcC5yZXBsYWNlU2NlbmUoRmlyc3RTY2VuZUZsb3coe30pKTtcbiAgcGhpbmFfYXBwLnJ1bigpO1xufTtcblxuLy/jgrnjgq/jg63jg7zjg6vnpoHmraJcbi8vIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIGZ1bmN0aW9uKGUpIHtcbi8vICBlLnByZXZlbnREZWZhdWx0KCk7XG4vLyB9LCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xuXG4vL0FuZHJvaWTjg5bjg6njgqbjgrbjg5Djg4Pjgq/jg5zjgr/jg7PliLblvqFcbi8vIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJiYWNrYnV0dG9uXCIsIGZ1bmN0aW9uKGUpe1xuLy8gICBlLnByZXZlbnREZWZhdWx0KCk7XG4vLyB9LCBmYWxzZSk7IiwicGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuXG4gIHBoaW5hLmRlZmluZSgnTWFpblNjZW5lJywge1xuICAgIHN1cGVyQ2xhc3M6ICdCYXNlU2NlbmUnLFxuXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdGhpcy5zdXBlckluaXQoKTtcbiAgICAgIHRoaXMuc2V0dXAoKTtcbiAgICB9LFxuXG4gICAgc2V0dXA6IGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3QgYmFjayA9IFJlY3RhbmdsZVNoYXBlKHsgd2lkdGg6IFNDUkVFTl9XSURUSCwgaGVpZ2h0OiBTQ1JFRU5fSEVJR0hULCBmaWxsOiBcImJsYWNrXCIgfSlcbiAgICAgICAgLnNldFBvc2l0aW9uKFNDUkVFTl9XSURUSF9IQUxGLCBTQ1JFRU5fSEVJR0hUX0hBTEYpXG4gICAgICAgIC5hZGRDaGlsZFRvKHRoaXMpO1xuICAgICAgdGhpcy5yZWdpc3REaXNwb3NlKGJhY2spO1xuXG4gICAgICB0aGlzLndvcmxkID0gV29ybGQoKS5hZGRDaGlsZFRvKHRoaXMpO1xuICAgIH0sXG5cbiAgICB1cGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgIH0sXG5cbiAgfSk7XG5cbn0pO1xuIiwiLypcbiAqICBUaXRsZVNjZW5lLmpzXG4gKi9cblxucGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuXG4gIHBoaW5hLmRlZmluZSgnVGl0bGVTY2VuZScsIHtcbiAgICBzdXBlckNsYXNzOiAnQmFzZVNjZW5lJyxcblxuICAgIF9zdGF0aWM6IHtcbiAgICAgIGlzQXNzZXRMb2FkOiBmYWxzZSxcbiAgICB9LFxuXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdGhpcy5zdXBlckluaXQoKTtcblxuICAgICAgdGhpcy51bmxvY2sgPSBmYWxzZTtcbiAgICAgIHRoaXMubG9hZGNvbXBsZXRlID0gZmFsc2U7XG4gICAgICB0aGlzLnByb2dyZXNzID0gMDtcblxuICAgICAgLy/jg63jg7zjg4nmuIjjgb/jgarjgonjgqLjgrvjg4Pjg4jjg63jg7zjg4njgpLjgZfjgarjgYRcbiAgICAgIGlmIChUaXRsZVNjZW5lLmlzQXNzZXRMb2FkKSB7XG4gICAgICAgIHRoaXMuc2V0dXAoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vcHJlbG9hZCBhc3NldFxuICAgICAgICBjb25zdCBhc3NldHMgPSBBc3NldExpc3QuZ2V0KFwicHJlbG9hZFwiKVxuICAgICAgICB0aGlzLmxvYWRlciA9IHBoaW5hLmFzc2V0LkFzc2V0TG9hZGVyKCk7XG4gICAgICAgIHRoaXMubG9hZGVyLmxvYWQoYXNzZXRzKTtcbiAgICAgICAgdGhpcy5sb2FkZXIub24oJ2xvYWQnLCAoKSA9PiB0aGlzLnNldHVwKCkpO1xuICAgICAgICBUaXRsZVNjZW5lLmlzQXNzZXRMb2FkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgc2V0dXA6IGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3QgYmFjayA9IFJlY3RhbmdsZVNoYXBlKHsgd2lkdGg6IFNDUkVFTl9XSURUSCwgaGVpZ2h0OiBTQ1JFRU5fSEVJR0hULCBmaWxsOiBcImJsYWNrXCIgfSlcbiAgICAgICAgLnNldFBvc2l0aW9uKFNDUkVFTl9XSURUSF9IQUxGLCBTQ1JFRU5fSEVJR0hUX0hBTEYpXG4gICAgICAgIC5hZGRDaGlsZFRvKHRoaXMpO1xuICAgICAgdGhpcy5yZWdpc3REaXNwb3NlKGJhY2spO1xuXG4gICAgICBjb25zdCBsYWJlbCA9IExhYmVsKHsgdGV4dDogXCJUaXRsZVNjZW5lXCIsIGZpbGw6IFwid2hpdGVcIiB9KVxuICAgICAgICAuc2V0UG9zaXRpb24oU0NSRUVOX1dJRFRIX0hBTEYsIFNDUkVFTl9IRUlHSFRfSEFMRilcbiAgICAgICAgLmFkZENoaWxkVG8odGhpcyk7XG4gICAgICB0aGlzLnJlZ2lzdERpc3Bvc2UobGFiZWwpO1xuXG4gICAgICBiYWNrLnNldEludGVyYWN0aXZlKHRydWUpO1xuICAgICAgYmFjay5vbigncG9pbnRlbmQnLCAoKSA9PiB0aGlzLmV4aXQoXCJtYWluXCIpKTtcblxuICAgIH0sXG5cbiAgICB1cGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgIH0sXG5cbiAgfSk7XG5cbn0pO1xuIiwicGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuXG4gIHBoaW5hLmRlZmluZSgnUGxheWVyJywge1xuICAgIHN1cGVyQ2xhc3M6ICdBY3RvcicsXG5cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLnN1cGVySW5pdCgpO1xuXG4gICAgICB0aGlzLnNwcml0ZSA9IFNwcml0ZShcImFjdG9yNFwiLCAzMiwgMzIpXG4gICAgICAgIC5zZXRGcmFtZUluZGV4KDApXG4gICAgICAgIC5hZGRDaGlsZFRvKHRoaXMpO1xuXG4gICAgICB0aGlzLm5vd0FuaW1hdGlvbiA9IFwic3RhbmRcIjtcbiAgICB9LFxuXG4gICAgdXBkYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IGFwcCA9IHBoaW5hX2FwcDtcbiAgICAgIGNvbnN0IGN0cmwgPSBhcHAuY29udHJvbGxlcjtcbiAgICAgIGlmIChjdHJsLnVwKSB7XG4gICAgICAgIHRoaXMueSAtPSAyO1xuICAgICAgICBpZiAoY3RybC5sZWZ0KSB7XG4gICAgICAgICAgdGhpcy54IC09IDI7XG4gICAgICAgICAgdGhpcy5zZXRBbmltYXRpb24oXCJ1cGxlZnRcIik7XG4gICAgICAgIH0gZWxzZSBpZiAoY3RybC5yaWdodCkge1xuICAgICAgICAgIHRoaXMueCArPSAyO1xuICAgICAgICAgIHRoaXMuc2V0QW5pbWF0aW9uKFwidXByaWdodFwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnNldEFuaW1hdGlvbihcInVwXCIpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGN0cmwuZG93bikge1xuICAgICAgICB0aGlzLnkgKz0gMjtcbiAgICAgICAgaWYgKGN0cmwubGVmdCkge1xuICAgICAgICAgIHRoaXMueCAtPSAyO1xuICAgICAgICAgIHRoaXMuc2V0QW5pbWF0aW9uKFwiZG93bmxlZnRcIik7XG4gICAgICAgIH0gZWxzZSBpZiAoY3RybC5yaWdodCkge1xuICAgICAgICAgIHRoaXMueCArPSAyO1xuICAgICAgICAgIHRoaXMuc2V0QW5pbWF0aW9uKFwiZG93bnJpZ2h0XCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuc2V0QW5pbWF0aW9uKFwiZG93blwiKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjdHJsLmxlZnQpIHtcbiAgICAgICAgdGhpcy54IC09IDI7XG4gICAgICAgIHRoaXMuc2V0QW5pbWF0aW9uKFwibGVmdFwiKTtcbiAgICAgIH0gZWxzZSBpZiAoY3RybC5yaWdodCkge1xuICAgICAgICB0aGlzLnggKz0gMjtcbiAgICAgICAgdGhpcy5zZXRBbmltYXRpb24oXCJyaWdodFwiKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGN0cmwuanVtcCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNKdW1wKSB7XG4gICAgICAgICAgdGhpcy5pc0p1bXAgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuc3ByaXRlLnR3ZWVuZXIuY2xlYXIoKVxuICAgICAgICAgICAgLmJ5KHsgeTogLTMyIH0sIDIwMCwgXCJlYXNlT3V0U2luZVwiKVxuICAgICAgICAgICAgLmJ5KHsgeTogMzIgfSwgMjAwLCBcImVhc2VJblNpbmVcIilcbiAgICAgICAgICAgIC5jYWxsKCgpID0+IHRoaXMuaXNKdW1wID0gZmFsc2UpXG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBzZXR1cEFuaW1hdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnNwY2lhbEFuaW1hdGlvbiA9IGZhbHNlO1xuICAgICAgdGhpcy5mcmFtZSA9IFtdO1xuICAgICAgdGhpcy5mcmFtZVtcInN0YW5kXCJdID0gWzEzLCAxNF07XG4gICAgICB0aGlzLmZyYW1lW1wianVtcFwiXSA9IFszNiwgXCJzdG9wXCJdO1xuXG4gICAgICB0aGlzLmZyYW1lW1widXBcIl0gPSAgIFsgOSwgMTAsIDExLCAxMF07XG4gICAgICB0aGlzLmZyYW1lW1wiZG93blwiXSA9IFsgMCwgIDEsICAyLCAgMV07XG4gICAgICB0aGlzLmZyYW1lW1wibGVmdFwiXSA9IFsgMywgIDQsICA1LCAgNF07XG4gICAgICB0aGlzLmZyYW1lW1wicmlnaHRcIl0gPSBbIDYsICA3LCAgOCwgIDddO1xuICAgICAgdGhpcy5mcmFtZVtcImRvd25sZWZ0XCJdID0gWyA0OCwgIDQ5LCAgNTAsICA0OV07XG4gICAgICB0aGlzLmZyYW1lW1widXBsZWZ0XCJdID0gWyA1MSwgIDUyLCAgNTMsICA1Ml07XG4gICAgICB0aGlzLmZyYW1lW1wiZG93bnJpZ2h0XCJdID0gWyA1NCwgIDU1LCAgNTYsICA1NV07XG4gICAgICB0aGlzLmZyYW1lW1widXByaWdodFwiXSA9IFsgNTcsICA1OCwgIDU5LCAgNThdO1xuXG5cbiAgICAgIHRoaXMuZnJhbWVbXCJhdHRhY2tcIl0gPSBbIDQxLCA0MiwgNDMsIDQ0LCBcInN0b3BcIl07XG4gICAgICB0aGlzLmZyYW1lW1wiZGVmZW5zZVwiXSA9IFsgNDEsIDQyLCA0MywgNDQsIFwic3RvcFwiXTtcbiAgICAgIHRoaXMuZnJhbWVbXCJkYW1hZ2VcIl0gPSBbIDE4LCAxOSwgMjBdO1xuICAgICAgdGhpcy5mcmFtZVtcImRyb3BcIl0gPSBbMTgsIDE5LCAyMF07XG4gICAgICB0aGlzLmZyYW1lW1wiZGVhZFwiXSA9IFsxOCwgMTksIDIwLCAzMywgMzQsIDM1LCBcInN0b3BcIl07XG4gICAgICB0aGlzLmZyYW1lW1wiY2xlYXJcIl0gPSBbMjQsIDI1LCAyNl07XG4gICAgICB0aGlzLmZyYW1lW1wic3R1blwiXSA9IFsgMTgsIDE5LCAyMF07XG4gICAgICB0aGlzLmluZGV4ID0gLTE7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gIH0pO1xuXG59KTtcbiIsInBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcblxuICBwaGluYS5kZWZpbmUoJ1dvcmxkJywge1xuICAgIHN1cGVyQ2xhc3M6ICdEaXNwbGF5RWxlbWVudCcsXG5cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLnN1cGVySW5pdCgpO1xuICAgICAgdGhpcy5zZXR1cCgpO1xuICAgIH0sXG5cbiAgICBzZXR1cDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLm1hcEJhc2UgPSBEaXNwbGF5RWxlbWVudCgpXG4gICAgICAgIC5zZXRQb3NpdGlvbihTQ1JFRU5fV0lEVEhfSEFMRiwgU0NSRUVOX0hFSUdIVF9IQUxGKVxuICAgICAgICAuYWRkQ2hpbGRUbyh0aGlzKTtcblxuICAgICAgdGhpcy5wbGF5ZXIgPSBQbGF5ZXIoKS5hZGRDaGlsZFRvKHRoaXMubWFwQmFzZSk7XG4gICAgfSxcblxuICAgIHVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICBcbiAgICB9LFxuXG4gIH0pO1xuXG59KTtcbiIsInBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcblxuICBwaGluYS5kZWZpbmUoJ0FjdG9yJywge1xuICAgIHN1cGVyQ2xhc3M6ICdEaXNwbGF5RWxlbWVudCcsXG5cbiAgICBzcHJpdGU6IG51bGwsXG4gICAgYW5pbWF0aW9uSW50ZXJ2YWw6IDEwLFxuXG4gICAgaXNKdW1wOiBmYWxzZSxcblxuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMuc3VwZXJJbml0KCk7XG5cbiAgICAgIHRoaXMuc2V0dXBBbmltYXRpb24oKTtcblxuICAgICAgdGhpcy5vbignZW50ZXJmcmFtZScsICgpID0+IHtcbiAgICAgICAgLy/jgqLjg4vjg6Hjg7zjgrfjg6fjg7NcbiAgICAgICAgaWYgKHRoaXMuc3ByaXRlICYmIHRoaXMudGltZSAlIHRoaXMuYW5pbWF0aW9uSW50ZXJ2YWwgPT0gMCkge1xuICAgICAgICAgIHRoaXMuaW5kZXggPSAodGhpcy5pbmRleCsxKSAlIHRoaXMuZnJhbWVbdGhpcy5ub3dBbmltYXRpb25dLmxlbmd0aDtcbiAgICAgICAgICAvL+asoeODleODrOODvOODoOeVquWPt+OBjOeJueauiuaMh+WumuOBruWgtOWQiFxuICAgICAgICAgIHZhciBuZXh0ID0gdGhpcy5mcmFtZVt0aGlzLm5vd0FuaW1hdGlvbl1bdGhpcy5pbmRleF07XG4gICAgICAgICAgaWYgKG5leHQgPT0gXCJzdG9wXCIpIHtcbiAgICAgICAgICAgICAgLy/lgZzmraJcbiAgICAgICAgICAgICAgdGhpcy5pbmRleC0tO1xuICAgICAgICAgIH0gZWxzZSBpZiAobmV4dCA9PSBcInJlbW92ZVwiKSB7XG4gICAgICAgICAgICAgIC8v44Oq44Og44O844OWXG4gICAgICAgICAgICAgIHRoaXMucmVtb3ZlKCk7XG4gICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgbmV4dCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAvL+aMh+WumuOCouODi+ODoeODvOOCt+ODp+ODs+OBuOWkieabtFxuICAgICAgICAgICAgICB0aGlzLnNldEFuaW1hdGlvbihuZXh0KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aGlzLnNwcml0ZS5mcmFtZUluZGV4ID0gbmV4dDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50aW1lKys7XG4gICAgICB9KTtcbiAgICAgIHRoaXMudGltZSA9IDA7XG4gICAgfSxcblxuICAgIHNldFNoYWRvdzogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy5zaGFkb3cpIHJldHVybiB0aGlzO1xuICAgICAgdGhpcy5zaGFkb3cgPSBTcHJpdGUoXCJzaGFkb3dcIilcbiAgICAgICAgLnNldFBvc2l0aW9uKDAsIDMyKVxuICAgICAgICAuYWRkQ2hpbGRUbyh0aGlzKTtcbiAgICAgIHRoaXMuc2hhZG93LmFscGhhID0gMC41O1xuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgc2V0dXBBbmltYXRpb246IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIHNldEFuaW1hdGlvbjogZnVuY3Rpb24oYW5pbU5hbWUpIHtcbiAgICAgIGlmICghdGhpcy5mcmFtZVthbmltTmFtZV0pIHJldHVybiB0aGlzO1xuICAgICAgaWYgKGFuaW1OYW1lID09IHRoaXMubm93QW5pbWF0aW9uKSByZXR1cm4gdGhpcztcbiAgICAgIHRoaXMubm93QW5pbWF0aW9uID0gYW5pbU5hbWU7XG4gICAgICB0aGlzLmluZGV4ID0gLTE7XG4gICAgICB0aGlzLmlzQ2hhbmdlQW5pbWF0aW9uID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgfSk7XG5cbn0pO1xuIiwicGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuXG4gIHBoaW5hLmRlZmluZShcIkFwcGxpY2F0aW9uXCIsIHtcbiAgICBzdXBlckNsYXNzOiBcInBoaW5hLmRpc3BsYXkuQ2FudmFzQXBwXCIsXG5cbiAgICBxdWFsaXR5OiAxLjAsXG4gIFxuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5zdXBlckluaXQoe1xuICAgICAgICBmcHM6IDYwLFxuICAgICAgICB3aWR0aDogU0NSRUVOX1dJRFRILFxuICAgICAgICBoZWlnaHQ6IFNDUkVFTl9IRUlHSFQsXG4gICAgICAgIGZpdDogdHJ1ZSxcbiAgICAgIH0pO1xuICBcbiAgICAgIC8v44K344O844Oz44Gu5bmF44CB6auY44GV44Gu5Z+65pys44KS6Kit5a6aXG4gICAgICBwaGluYS5kaXNwbGF5LkRpc3BsYXlTY2VuZS5kZWZhdWx0cy4kZXh0ZW5kKHtcbiAgICAgICAgd2lkdGg6IFNDUkVFTl9XSURUSCxcbiAgICAgICAgaGVpZ2h0OiBTQ1JFRU5fSEVJR0hULFxuICAgICAgfSk7XG4gIFxuICAgICAgcGhpbmEuaW5wdXQuSW5wdXQucXVhbGl0eSA9IHRoaXMucXVhbGl0eTtcbiAgICAgIHBoaW5hLmRpc3BsYXkuRGlzcGxheVNjZW5lLnF1YWxpdHkgPSB0aGlzLnF1YWxpdHk7XG5cbiAgICAgIC8v44Ky44O844Og44OR44OD44OJ566h55CGXG4gICAgICB0aGlzLmdhbWVwYWRNYW5hZ2VyID0gcGhpbmEuaW5wdXQuR2FtZXBhZE1hbmFnZXIoKTtcbiAgICAgIHRoaXMuZ2FtZXBhZCA9IHRoaXMuZ2FtZXBhZE1hbmFnZXIuZ2V0KDApO1xuICAgICAgdGhpcy5jb250cm9sbGVyID0ge307XG5cbiAgICAgIHRoaXMuc2V0dXBFdmVudHMoKTtcbiAgICAgIHRoaXMuc2V0dXBTb3VuZCgpO1xuICAgICAgdGhpcy5zZXR1cE1vdXNlV2hlZWwoKTtcblxuICAgICAgdGhpcy5vbihcImNoYW5nZXNjZW5lXCIsICgpID0+IHtcbiAgICAgICAgLy/jgrfjg7zjg7PjgpLpm6LjgozjgovpmpvjgIHjg5zjgr/jg7PlkIzmmYLmirzjgZfjg5Xjg6njgrDjgpLop6PpmaTjgZnjgotcbiAgICAgICAgQnV0dG9uLmFjdGlvblRhcmdldCA9IG51bGw7XG4gICAgICB9KTtcblxuICAgICAgLy/jg5Hjg4Pjg4nmg4XloLHjgpLmm7TmlrBcbiAgICAgIHRoaXMub24oJ2VudGVyZnJhbWUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5nYW1lcGFkTWFuYWdlci51cGRhdGUoKTtcbiAgICAgICAgdGhpcy51cGRhdGVDb250cm9sbGVyKCk7XG4gICAgICB9KTtcbiAgICB9LFxuICBcbiAgICAvL+ODnuOCpuOCueOBruODm+ODvOODq+OCpOODmeODs+ODiOmWoumAo1xuICAgIHNldHVwTW91c2VXaGVlbDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLndoZWVsRGVsdGFZID0gMDtcbiAgICAgIHRoaXMuZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2V3aGVlbFwiLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy53aGVlbERlbHRhWSA9IGUuZGVsdGFZO1xuICAgICAgfS5iaW5kKHRoaXMpLCBmYWxzZSk7XG4gIFxuICAgICAgdGhpcy5vbihcImVudGVyZnJhbWVcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucG9pbnRlci53aGVlbERlbHRhWSA9IHRoaXMud2hlZWxEZWx0YVk7XG4gICAgICAgIHRoaXMud2hlZWxEZWx0YVkgPSAwO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8v44Ki44OX44Oq44Kx44O844K344On44Oz5YWo5L2T44Gu44Kk44OZ44Oz44OI44OV44OD44KvXG4gICAgc2V0dXBFdmVudHM6IGZ1bmN0aW9uKCkge30sXG4gIFxuICAgIHNldHVwU291bmQ6IGZ1bmN0aW9uKCkge30sXG5cbiAgICB1cGRhdGVDb250cm9sbGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBiZWZvcmUgPSB0aGlzLmNvbnRyb2xsZXI7XG4gICAgICBiZWZvcmUuYmVmb3JlID0gbnVsbDtcblxuICAgICAgdmFyIGdwID0gdGhpcy5nYW1lcGFkO1xuICAgICAgdmFyIGtiID0gdGhpcy5rZXlib2FyZDtcbiAgICAgIHZhciBhbmdsZTEgPSBncC5nZXRLZXlBbmdsZSgpO1xuICAgICAgdmFyIGFuZ2xlMiA9IGtiLmdldEtleUFuZ2xlKCk7XG4gICAgICB0aGlzLmNvbnRyb2xsZXIgPSB7XG4gICAgICAgICAgYW5nbGU6IGFuZ2xlMSAhPT0gbnVsbD8gYW5nbGUxOiBhbmdsZTIsXG5cbiAgICAgICAgICB1cDogZ3AuZ2V0S2V5KFwidXBcIikgfHwga2IuZ2V0S2V5KFwidXBcIiksXG4gICAgICAgICAgZG93bjogZ3AuZ2V0S2V5KFwiZG93blwiKSB8fCBrYi5nZXRLZXkoXCJkb3duXCIpLFxuICAgICAgICAgIGxlZnQ6IGdwLmdldEtleShcImxlZnRcIikgfHwga2IuZ2V0S2V5KFwibGVmdFwiKSxcbiAgICAgICAgICByaWdodDogZ3AuZ2V0S2V5KFwicmlnaHRcIikgfHwga2IuZ2V0S2V5KFwicmlnaHRcIiksXG5cbiAgICAgICAgICBhdHRhY2s6IGdwLmdldEtleShcIkFcIikgfHwga2IuZ2V0S2V5KFwiWFwiKSxcbiAgICAgICAgICBqdW1wOiAgIGdwLmdldEtleShcIlhcIikgfHwga2IuZ2V0S2V5KFwiWlwiKSxcbiAgICAgICAgICBtZW51OiAgIGdwLmdldEtleShcInN0YXJ0XCIpIHx8IGtiLmdldEtleShcImVzY2FwZVwiKSxcblxuICAgICAgICAgIGE6IGdwLmdldEtleShcIkFcIikgfHwga2IuZ2V0S2V5KFwiWlwiKSxcbiAgICAgICAgICBiOiBncC5nZXRLZXkoXCJCXCIpIHx8IGtiLmdldEtleShcIlhcIiksXG4gICAgICAgICAgeDogZ3AuZ2V0S2V5KFwiWFwiKSB8fCBrYi5nZXRLZXkoXCJDXCIpLFxuICAgICAgICAgIHk6IGdwLmdldEtleShcIllcIikgfHwga2IuZ2V0S2V5KFwiVlwiKSxcblxuICAgICAgICAgIG9rOiBncC5nZXRLZXkoXCJBXCIpIHx8IGtiLmdldEtleShcIlpcIikgfHwga2IuZ2V0S2V5KFwic3BhY2VcIikgfHwga2IuZ2V0S2V5KFwicmV0dXJuXCIpLFxuICAgICAgICAgIGNhbmNlbDogZ3AuZ2V0S2V5KFwiQlwiKSB8fCBrYi5nZXRLZXkoXCJYXCIpIHx8IGtiLmdldEtleShcImVzY2FwZVwiKSxcblxuICAgICAgICAgIHN0YXJ0OiBncC5nZXRLZXkoXCJzdGFydFwiKSB8fCBrYi5nZXRLZXkoXCJyZXR1cm5cIiksXG4gICAgICAgICAgc2VsZWN0OiBncC5nZXRLZXkoXCJzZWxlY3RcIiksXG5cbiAgICAgICAgICBwYXVzZTogZ3AuZ2V0S2V5KFwic3RhcnRcIikgfHwga2IuZ2V0S2V5KFwiZXNjYXBlXCIpLFxuXG4gICAgICAgICAgYW5hbG9nMTogZ3AuZ2V0U3RpY2tEaXJlY3Rpb24oMCksXG4gICAgICAgICAgYW5hbG9nMjogZ3AuZ2V0U3RpY2tEaXJlY3Rpb24oMSksXG5cbiAgICAgICAgICAvL+WJjeODleODrOODvOODoOaDheWgsVxuICAgICAgICAgIGJlZm9yZTogYmVmb3JlLFxuICAgICAgfTtcbiAgfSxcbn0pO1xuICBcbn0pOyIsIi8qXG4gKiAgQXNzZXRMaXN0LmpzXG4gKi9cblxucGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuXG4gIHBoaW5hLmRlZmluZShcIkFzc2V0TGlzdFwiLCB7XG4gICAgX3N0YXRpYzoge1xuICAgICAgbG9hZGVkOiBbXSxcbiAgICAgIGlzTG9hZGVkOiBmdW5jdGlvbihhc3NldFR5cGUpIHtcbiAgICAgICAgcmV0dXJuIEFzc2V0TGlzdC5sb2FkZWRbYXNzZXRUeXBlXT8gdHJ1ZTogZmFsc2U7XG4gICAgICB9LFxuICAgICAgZ2V0OiBmdW5jdGlvbihhc3NldFR5cGUpIHtcbiAgICAgICAgQXNzZXRMaXN0LmxvYWRlZFthc3NldFR5cGVdID0gdHJ1ZTtcbiAgICAgICAgc3dpdGNoIChhc3NldFR5cGUpIHtcbiAgICAgICAgICBjYXNlIFwicHJlbG9hZFwiOlxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgaW1hZ2U6IHtcbiAgICAgICAgICAgICAgICBcImFjdG9yNFwiOiBcImFzc2V0cy90ZXh0dXJlcy9hY3RvcjQucG5nXCIsXG4gICAgICAgICAgICAgICAgXCJzaGFkb3dcIjogXCJhc3NldHMvdGV4dHVyZXMvc2hhZG93LnBuZ1wiLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNhc2UgXCJjb21tb25cIjpcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIGltYWdlOiB7XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93IFwiaW52YWxpZCBhc3NldFR5cGU6IFwiICsgb3B0aW9ucy5hc3NldFR5cGU7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSxcbiAgfSk7XG5cbn0pO1xuIiwiLypcbiAqICBNYWluU2NlbmUuanNcbiAqICAyMDE4LzEwLzI2XG4gKi9cblxucGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuXG4gIHBoaW5hLmRlZmluZShcIkJhc2VTY2VuZVwiLCB7XG4gICAgc3VwZXJDbGFzczogJ0Rpc3BsYXlTY2VuZScsXG5cbiAgICAvL+W7g+ajhOOCqOODrOODoeODs+ODiFxuICAgIGRpc3Bvc2VFbGVtZW50czogbnVsbCxcblxuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSAob3B0aW9ucyB8fCB7fSkuJHNhZmUoe1xuICAgICAgICB3aWR0aDogU0NSRUVOX1dJRFRILFxuICAgICAgICBoZWlnaHQ6IFNDUkVFTl9IRUlHSFQsXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3RyYW5zcGFyZW50JyxcbiAgICAgIH0pO1xuICAgICAgdGhpcy5zdXBlckluaXQob3B0aW9ucyk7XG5cbiAgICAgIC8v44K344O844Oz6Zui6ISx5pmCY2FudmFz44Oh44Oi44Oq6Kej5pS+XG4gICAgICB0aGlzLmRpc3Bvc2VFbGVtZW50cyA9IFtdO1xuICAgICAgdGhpcy5vbmUoJ2Rlc3Ryb3knLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuZGlzcG9zZUVsZW1lbnRzLmZvckVhY2goZSA9PiB7XG4gICAgICAgICAgaWYgKGUuZGVzdHJveUNhbnZhcykge1xuICAgICAgICAgICAgZS5kZXN0cm95Q2FudmFzKCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChlIGluc3RhbmNlb2YgQ2FudmFzKSB7XG4gICAgICAgICAgICBlLnNldFNpemUoMCwgMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLmFwcCA9IHBoaW5hX2FwcDtcblxuICAgICAgLy/liKXjgrfjg7zjg7Pjgbjjga7np7vooYzmmYLjgavjgq3jg6Pjg7Pjg5DjgrnjgpLnoLTmo4RcbiAgICAgIHRoaXMub25lKCdleGl0JywgKCkgPT4ge1xuICAgICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5jYW52YXMuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLmZsYXJlKCdkZXN0cm95Jyk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiRXhpdCBzY2VuZS5cIik7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7fSxcblxuICAgIGZhZGVJbjogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IChvcHRpb25zIHx8IHt9KS4kc2FmZSh7XG4gICAgICAgIGNvbG9yOiBcIndoaXRlXCIsXG4gICAgICAgIG1pbGxpc2Vjb25kOiA1MDAsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgY29uc3QgbWFzayA9IFJlY3RhbmdsZVNoYXBlKHtcbiAgICAgICAgICB3aWR0aDogU0NSRUVOX1dJRFRILFxuICAgICAgICAgIGhlaWdodDogU0NSRUVOX0hFSUdIVCxcbiAgICAgICAgICBmaWxsOiBvcHRpb25zLmNvbG9yLFxuICAgICAgICAgIHN0cm9rZVdpZHRoOiAwLFxuICAgICAgICB9KS5zZXRQb3NpdGlvbihTQ1JFRU5fV0lEVEggKiAwLjUsIFNDUkVFTl9IRUlHSFQgKiAwLjUpLmFkZENoaWxkVG8odGhpcyk7XG4gICAgICAgIG1hc2sudHdlZW5lci5jbGVhcigpXG4gICAgICAgICAgLmZhZGVPdXQob3B0aW9ucy5taWxsaXNlY29uZClcbiAgICAgICAgICAuY2FsbCgoKSA9PiB7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB0aGlzLmFwcC5vbmUoJ2VudGVyZnJhbWUnLCAoKSA9PiBtYXNrLmRlc3Ryb3lDYW52YXMoKSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgZmFkZU91dDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IChvcHRpb25zIHx8IHt9KS4kc2FmZSh7XG4gICAgICAgIGNvbG9yOiBcIndoaXRlXCIsXG4gICAgICAgIG1pbGxpc2Vjb25kOiA1MDAsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgY29uc3QgbWFzayA9IFJlY3RhbmdsZVNoYXBlKHtcbiAgICAgICAgICB3aWR0aDogU0NSRUVOX1dJRFRILFxuICAgICAgICAgIGhlaWdodDogU0NSRUVOX0hFSUdIVCxcbiAgICAgICAgICBmaWxsOiBvcHRpb25zLmNvbG9yLFxuICAgICAgICAgIHN0cm9rZVdpZHRoOiAwLFxuICAgICAgICB9KS5zZXRQb3NpdGlvbihTQ1JFRU5fV0lEVEggKiAwLjUsIFNDUkVFTl9IRUlHSFQgKiAwLjUpLmFkZENoaWxkVG8odGhpcyk7XG4gICAgICAgIG1hc2suYWxwaGEgPSAwO1xuICAgICAgICBtYXNrLnR3ZWVuZXIuY2xlYXIoKVxuICAgICAgICAgIC5mYWRlSW4ob3B0aW9ucy5taWxsaXNlY29uZClcbiAgICAgICAgICAuY2FsbCgoKSA9PiB7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB0aGlzLmFwcC5vbmUoJ2VudGVyZnJhbWUnLCAoKSA9PiBtYXNrLmRlc3Ryb3lDYW52YXMoKSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgLy/jgrfjg7zjg7Ppm6LohLHmmYLjgavnoLTmo4TjgZnjgotTaGFwZeOCkueZu+mMslxuICAgIHJlZ2lzdERpc3Bvc2U6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgIHRoaXMuZGlzcG9zZUVsZW1lbnRzLnB1c2goZWxlbWVudCk7XG4gICAgfSxcbiAgfSk7XG5cbn0pOyIsIi8qXG4gKiAgRmlyc3RTY2VuZUZsb3cuanNcbiAqL1xuXG5waGluYS5uYW1lc3BhY2UoZnVuY3Rpb24oKSB7XG5cbiAgcGhpbmEuZGVmaW5lKFwiRmlyc3RTY2VuZUZsb3dcIiwge1xuICAgIHN1cGVyQ2xhc3M6IFwiTWFuYWdlclNjZW5lXCIsXG5cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgIHN0YXJ0TGFiZWwgPSBvcHRpb25zLnN0YXJ0TGFiZWwgfHwgXCJ0aXRsZVwiO1xuICAgICAgdGhpcy5zdXBlckluaXQoe1xuICAgICAgICBzdGFydExhYmVsOiBzdGFydExhYmVsLFxuICAgICAgICBzY2VuZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogXCJ0aXRsZVwiLFxuICAgICAgICAgICAgY2xhc3NOYW1lOiBcIlRpdGxlU2NlbmVcIixcbiAgICAgICAgICAgIG5leHRMYWJlbDogXCJob21lXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogXCJtYWluXCIsXG4gICAgICAgICAgICBjbGFzc05hbWU6IFwiTWFpblNjZW5lXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cbn0pOyIsInBoaW5hLmRlZmluZShcIkJ1dHRvblwiLCB7XG4gIHN1cGVyQ2xhc3M6IFwiQWNjZXNzb3J5XCIsXG5cbiAgbG9nbnByZXNzVGltZTogNTAwLFxuICBkb0xvbmdwcmVzczogZmFsc2UsXG5cbiAgLy/plbfmirzjgZfjgafpgKPmiZPjg6Ljg7zjg4lcbiAgbG9uZ3ByZXNzQmFycmFnZTogZmFsc2UsXG5cbiAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zdXBlckluaXQoKTtcblxuICAgIHRoaXMub24oXCJhdHRhY2hlZFwiLCAoKSA9PiB7XG4gICAgICB0aGlzLnRhcmdldC5pbnRlcmFjdGl2ZSA9IHRydWU7XG4gICAgICB0aGlzLnRhcmdldC5jbGlja1NvdW5kID0gQnV0dG9uLmRlZmF1bHRzLmNsaWNrU291bmQ7XG5cbiAgICAgIC8v44Oc44K/44Oz5oq844GX5pmC55SoXG4gICAgICB0aGlzLnRhcmdldC5zY2FsZVR3ZWVuZXIgPSBUd2VlbmVyKCkuYXR0YWNoVG8odGhpcy50YXJnZXQpO1xuXG4gICAgICAvL+mVt+aKvOOBl+eUqFxuICAgICAgdGhpcy50YXJnZXQudHdMb25ncHJlc3MgPSBUd2VlbmVyKCkuYXR0YWNoVG8odGhpcy50YXJnZXQpO1xuXG4gICAgICAvL+mVt+aKvOOBl+S4reeJueauiuWvvuW/nOeUqFxuICAgICAgdGhpcy50YXJnZXQudHdMb25ncHJlc3NpbmcgPSBUd2VlbmVyKCkuYXR0YWNoVG8odGhpcy50YXJnZXQpO1xuXG4gICAgICB0aGlzLnRhcmdldC5vbihcInBvaW50c3RhcnRcIiwgKGUpID0+IHtcblxuICAgICAgICAvL+OCpOODmeODs+ODiOiyq+mAmuOBq+OBl+OBpuOBiuOBj1xuICAgICAgICBlLnBhc3MgPSB0cnVlO1xuXG4gICAgICAgIC8v44Oc44K/44Oz44Gu5ZCM5pmC5oq844GX44KS5Yi26ZmQXG4gICAgICAgIGlmIChCdXR0b24uYWN0aW9uVGFyZ2V0ICE9PSBudWxsKSByZXR1cm47XG5cbiAgICAgICAgLy/jg6rjgrnjg4jjg5Pjg6Xjg7zjga7lrZDkvpvjgaDjgaPjgZ/loLTlkIjjga92aWV3cG9ydOOBqOOBruOBguOBn+OCiuWIpOWumuOCkuOBmeOCi1xuICAgICAgICBjb25zdCBsaXN0VmlldyA9IEJ1dHRvbi5maW5kTGlzdFZpZXcoZS50YXJnZXQpO1xuICAgICAgICBpZiAobGlzdFZpZXcgJiYgIWxpc3RWaWV3LnZpZXdwb3J0LmhpdFRlc3QoZS5wb2ludGVyLngsIGUucG9pbnRlci55KSkgcmV0dXJuO1xuXG4gICAgICAgIGlmIChsaXN0Vmlldykge1xuICAgICAgICAgIC8v44Od44Kk44Oz44K/44GM56e75YuV44GX44Gf5aC05ZCI44Gv6ZW35oq844GX44Kt44Oj44Oz44K744Or77yIbGlzdFZpZXflhoXniYjvvIlcbiAgICAgICAgICBsaXN0Vmlldy5pbm5lci4kd2F0Y2goJ3knLCAodjEsIHYyKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy50YXJnZXQgIT09IEJ1dHRvbi5hY3Rpb25UYXJnZXQpIHJldHVybjtcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyh2MSAtIHYyKSA8IDEwKSByZXR1cm47XG5cbiAgICAgICAgICAgIEJ1dHRvbi5hY3Rpb25UYXJnZXQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy50YXJnZXQudHdMb25ncHJlc3MuY2xlYXIoKTtcbiAgICAgICAgICAgIHRoaXMudGFyZ2V0LnNjYWxlVHdlZW5lci5jbGVhcigpLnRvKHtcbiAgICAgICAgICAgICAgc2NhbGVYOiAxLjAgKiB0aGlzLnN4LFxuICAgICAgICAgICAgICBzY2FsZVk6IDEuMCAqIHRoaXMuc3lcbiAgICAgICAgICAgIH0sIDUwKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8v44Oc44K/44Oz44Gu5Yem55CG44KS5a6f6KGM44GX44Gm44KC5ZWP6aGM44Gq44GE5aC05ZCI44Gu44G/6LKr6YCa44KS5YGc5q2i44GZ44KLXG4gICAgICAgIGUucGFzcyA9IGZhbHNlO1xuICAgICAgICBCdXR0b24uYWN0aW9uVGFyZ2V0ID0gdGhpcy50YXJnZXQ7XG5cbiAgICAgICAgLy/lj43ou6LjgZfjgabjgYTjgovjg5zjgr/jg7PnlKjjgavkv53mjIHjgZnjgotcbiAgICAgICAgdGhpcy5zeCA9ICh0aGlzLnRhcmdldC5zY2FsZVggPiAwKSA/IDEgOiAtMTtcbiAgICAgICAgdGhpcy5zeSA9ICh0aGlzLnRhcmdldC5zY2FsZVkgPiAwKSA/IDEgOiAtMTtcblxuICAgICAgICB0aGlzLnRhcmdldC5zY2FsZVR3ZWVuZXIuY2xlYXIoKVxuICAgICAgICAgIC50byh7XG4gICAgICAgICAgICBzY2FsZVg6IDAuOTUgKiB0aGlzLnN4LFxuICAgICAgICAgICAgc2NhbGVZOiAwLjk1ICogdGhpcy5zeVxuICAgICAgICAgIH0sIDUwKTtcblxuICAgICAgICB0aGlzLmRvTG9uZ3ByZXNzID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGFyZ2V0LnR3TG9uZ3ByZXNzLmNsZWFyKClcbiAgICAgICAgICAud2FpdCh0aGlzLmxvZ25wcmVzc1RpbWUpXG4gICAgICAgICAgLmNhbGwoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmxvbmdwcmVzc0JhcnJhZ2UpIHtcbiAgICAgICAgICAgICAgQnV0dG9uLmFjdGlvblRhcmdldCA9IG51bGw7XG4gICAgICAgICAgICAgIHRoaXMudGFyZ2V0LnNjYWxlVHdlZW5lci5jbGVhcigpXG4gICAgICAgICAgICAgICAgLnRvKHtcbiAgICAgICAgICAgICAgICAgIHNjYWxlWDogMS4wICogdGhpcy5zeCxcbiAgICAgICAgICAgICAgICAgIHNjYWxlWTogMS4wICogdGhpcy5zeVxuICAgICAgICAgICAgICAgIH0sIDUwKVxuICAgICAgICAgICAgICB0aGlzLnRhcmdldC5mbGFyZShcImxvbmdwcmVzc1wiKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy50YXJnZXQuZmxhcmUoXCJjbGlja1NvdW5kXCIpO1xuICAgICAgICAgICAgICB0aGlzLnRhcmdldC50d0xvbmdwcmVzc2luZy5jbGVhcigpXG4gICAgICAgICAgICAgICAgLndhaXQoNSlcbiAgICAgICAgICAgICAgICAuY2FsbCgoKSA9PiB0aGlzLnRhcmdldC5mbGFyZShcImNsaWNrZWRcIiwge1xuICAgICAgICAgICAgICAgICAgbG9uZ3ByZXNzOiB0cnVlXG4gICAgICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAgICAgLmNhbGwoKCkgPT4gdGhpcy50YXJnZXQuZmxhcmUoXCJsb25ncHJlc3NpbmdcIikpXG4gICAgICAgICAgICAgICAgLnNldExvb3AodHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgdGhpcy50YXJnZXQub24oXCJwb2ludGVuZFwiLCAoZSkgPT4ge1xuICAgICAgICAvL+OCpOODmeODs+ODiOiyq+mAmuOBq+OBl+OBpuOBiuOBj1xuICAgICAgICBlLnBhc3MgPSB0cnVlO1xuXG4gICAgICAgIC8vXG4gICAgICAgIHRoaXMudGFyZ2V0LnR3TG9uZ3ByZXNzLmNsZWFyKCk7XG4gICAgICAgIHRoaXMudGFyZ2V0LnR3TG9uZ3ByZXNzaW5nLmNsZWFyKCk7XG5cbiAgICAgICAgLy/jgr/jg7zjgrLjg4Pjg4jjgYxudWxs44GLcG9pbnRzdGFydOOBp+S/neaMgeOBl+OBn+OCv+ODvOOCsuODg+ODiOOBqOmBleOBhuWgtOWQiOOBr+OCueODq+ODvOOBmeOCi1xuICAgICAgICBpZiAoQnV0dG9uLmFjdGlvblRhcmdldCA9PT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICBpZiAoQnV0dG9uLmFjdGlvblRhcmdldCAhPT0gdGhpcy50YXJnZXQpIHJldHVybjtcblxuICAgICAgICAvL+ODnOOCv+ODs+OBruWHpueQhuOCkuWun+ihjOOBl+OBpuOCguWVj+mhjOOBquOBhOWgtOWQiOOBruOBv+iyq+mAmuOCkuWBnOatouOBmeOCi1xuICAgICAgICBlLnBhc3MgPSBmYWxzZTtcblxuICAgICAgICAvL+aKvOOBl+OBn+S9jee9ruOBi+OCieOBguOCi+eoi+W6puenu+WLleOBl+OBpuOBhOOCi+WgtOWQiOOBr+OCr+ODquODg+OCr+OCpOODmeODs+ODiOOCkueZuueUn+OBleOBm+OBquOBhFxuICAgICAgICBjb25zdCBpc01vdmUgPSBlLnBvaW50ZXIuc3RhcnRQb3NpdGlvbi5zdWIoZS5wb2ludGVyLnBvc2l0aW9uKS5sZW5ndGgoKSA+IDUwO1xuICAgICAgICBjb25zdCBoaXRUZXN0ID0gdGhpcy50YXJnZXQuaGl0VGVzdChlLnBvaW50ZXIueCwgZS5wb2ludGVyLnkpO1xuICAgICAgICBpZiAoaGl0VGVzdCAmJiAhaXNNb3ZlKSB0aGlzLnRhcmdldC5mbGFyZShcImNsaWNrU291bmRcIik7XG5cbiAgICAgICAgdGhpcy50YXJnZXQuc2NhbGVUd2VlbmVyLmNsZWFyKClcbiAgICAgICAgICAudG8oe1xuICAgICAgICAgICAgc2NhbGVYOiAxLjAgKiB0aGlzLnN4LFxuICAgICAgICAgICAgc2NhbGVZOiAxLjAgKiB0aGlzLnN5XG4gICAgICAgICAgfSwgNTApXG4gICAgICAgICAgLmNhbGwoKCkgPT4ge1xuICAgICAgICAgICAgQnV0dG9uLmFjdGlvblRhcmdldCA9IG51bGw7XG4gICAgICAgICAgICBpZiAoIWhpdFRlc3QgfHwgaXNNb3ZlIHx8IHRoaXMuZG9Mb25ncHJlc3MpIHJldHVybjtcbiAgICAgICAgICAgIHRoaXMudGFyZ2V0LmZsYXJlKFwiY2xpY2tlZFwiLCB7XG4gICAgICAgICAgICAgIHBvaW50ZXI6IGUucG9pbnRlclxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgLy/jgqLjg4vjg6Hjg7zjgrfjg6fjg7Pjga7mnIDkuK3jgavliYrpmaTjgZXjgozjgZ/loLTlkIjjgavlgpnjgYjjgaZyZW1vdmVk44Kk44OZ44Oz44OI5pmC44Gr44OV44Op44Kw44KS5YWD44Gr5oi744GX44Gm44GK44GPXG4gICAgICB0aGlzLnRhcmdldC5vbmUoXCJyZW1vdmVkXCIsICgpID0+IHtcbiAgICAgICAgaWYgKEJ1dHRvbi5hY3Rpb25UYXJnZXQgPT09IHRoaXMudGFyZ2V0KSB7XG4gICAgICAgICAgQnV0dG9uLmFjdGlvblRhcmdldCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLnRhcmdldC5vbihcImNsaWNrU291bmRcIiwgKCkgPT4ge1xuICAgICAgICBpZiAoIXRoaXMudGFyZ2V0LmNsaWNrU291bmQgfHwgdGhpcy50YXJnZXQuY2xpY2tTb3VuZCA9PSBcIlwiKSByZXR1cm47XG4gICAgICAgIHBoaW5hLmFzc2V0LlNvdW5kTWFuYWdlci5wbGF5KHRoaXMudGFyZ2V0LmNsaWNrU291bmQpO1xuICAgICAgfSk7XG5cbiAgICB9KTtcbiAgfSxcblxuICAvL+mVt+aKvOOBl+OBruW8t+WItuOCreODo+ODs+OCu+ODq1xuICBsb25ncHJlc3NDYW5jZWw6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMudGFyZ2V0LnR3TG9uZ3ByZXNzLmNsZWFyKCk7XG4gICAgdGhpcy50YXJnZXQudHdMb25ncHJlc3NpbmcuY2xlYXIoKTtcbiAgfSxcblxuICBfc3RhdGljOiB7XG4gICAgLy/jg5zjgr/jg7PlkIzmmYLmirzjgZfjgpLliLblvqHjgZnjgovjgZ/jgoHjgatzdGF0dXPjga9zdGF0aWPjgavjgZnjgotcbiAgICBzdGF0dXM6IDAsXG4gICAgYWN0aW9uVGFyZ2V0OiBudWxsLFxuICAgIC8v5Z+65pys6Kit5a6aXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgIGNsaWNrU291bmQ6IFwiY29tbW9uL3NvdW5kcy9zZS9idXR0b25cIixcbiAgICB9LFxuXG4gICAgLy/opqrjgpLjgZ/jganjgaPjgaZMaXN0Vmlld+OCkuaOouOBmVxuICAgIGZpbmRMaXN0VmlldzogZnVuY3Rpb24oZWxlbWVudCwgcCkge1xuICAgICAgLy/jg6rjgrnjg4jjg5Pjg6Xjg7zjgpLmjIHjgaPjgabjgYTjgovloLTlkIhcbiAgICAgIGlmIChlbGVtZW50Lkxpc3RWaWV3ICE9IG51bGwpIHJldHVybiBlbGVtZW50Lkxpc3RWaWV3O1xuICAgICAgLy/opqrjgYzjgarjgZHjgozjgbDntYLkuoZcbiAgICAgIGlmIChlbGVtZW50LnBhcmVudCA9PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgICAgIC8v6Kaq44KS44Gf44Gp44KLXG4gICAgICByZXR1cm4gdGhpcy5maW5kTGlzdFZpZXcoZWxlbWVudC5wYXJlbnQpO1xuICAgIH1cblxuICB9XG5cbn0pO1xuIiwiLyoqXHJcbiAqIOimquOCueODl+ODqeOCpOODiOOBruODhuOCr+OCueODgeODo+OCkuWIh+OCiuaKnOOBhOOBpuiHquWIhuOBruODhuOCr+OCueODgeODo+OBqOOBmeOCi+OCueODl+ODqeOCpOODiFxyXG4gKiDopqrjgrnjg5fjg6njgqTjg4jjga7liIfjgormipzjgYvjgozjgZ/pg6jliIbjga/jgIHliIfjgormipzjgY3nr4Tlm7Ljga7lt6bkuIrjga7jg5Tjgq/jgrvjg6vjga7oibLjgafloZfjgorjgaTjgbbjgZXjgozjgotcclxuICogXHJcbiAqIOimquimgee0oOOBruaLoee4ruODu+Wbnui7ouOBr+iAg+aFruOBl+OBquOBhFxyXG4gKi9cclxucGhpbmEuZGVmaW5lKFwiQ2xpcFNwcml0ZVwiLCB7XHJcbiAgc3VwZXJDbGFzczogXCJBY2Nlc3NvcnlcIixcclxuXHJcbiAgaW5pdDogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnN1cGVySW5pdCgpO1xyXG4gICAgdGhpcy5vbihcImF0dGFjaGVkXCIsICgpID0+IHtcclxuICAgICAgdGhpcy50YXJnZXQub25lKFwiYWRkZWRcIiwgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuc2V0dXAoKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICBzZXR1cDogZnVuY3Rpb24oKSB7XHJcbiAgICBjb25zdCB0YXJnZXQgPSB0aGlzLnRhcmdldDtcclxuICAgIGNvbnN0IHBhcmVudCA9IHRhcmdldC5wYXJlbnQ7XHJcbiAgICBpZiAocGFyZW50IGluc3RhbmNlb2YgcGhpbmEuZGlzcGxheS5TcHJpdGUpIHtcclxuICAgICAgY29uc3QgeCA9IHBhcmVudC53aWR0aCAqIHBhcmVudC5vcmlnaW4ueCArIHRhcmdldC54IC0gdGFyZ2V0LndpZHRoICogdGFyZ2V0Lm9yaWdpbi54O1xyXG4gICAgICBjb25zdCB5ID0gcGFyZW50LmhlaWdodCAqIHBhcmVudC5vcmlnaW4ueSArIHRhcmdldC55IC0gdGFyZ2V0LmhlaWdodCAqIHRhcmdldC5vcmlnaW4ueTtcclxuICAgICAgY29uc3QgdyA9IHRhcmdldC53aWR0aDtcclxuICAgICAgY29uc3QgaCA9IHRhcmdldC5oZWlnaHQ7XHJcblxyXG4gICAgICBjb25zdCBwYXJlbnRUZXh0dXJlID0gcGFyZW50LmltYWdlO1xyXG4gICAgICBjb25zdCBjYW52YXMgPSBwaGluYS5ncmFwaGljcy5DYW52YXMoKS5zZXRTaXplKHcsIGgpO1xyXG4gICAgICBjYW52YXMuY29udGV4dC5kcmF3SW1hZ2UocGFyZW50VGV4dHVyZS5kb21FbGVtZW50LCB4LCB5LCB3LCBoLCAwLCAwLCB3LCBoKTtcclxuICAgICAgaWYgKHBhcmVudFRleHR1cmUgaW5zdGFuY2VvZiBwaGluYS5ncmFwaGljcy5DYW52YXMpIHtcclxuICAgICAgICAvLyDjgq/jg63jg7zjg7PjgZfjgabjgZ3jgaPjgaHjgpLkvb/jgYZcclxuICAgICAgICBjb25zdCBwYXJlbnRUZXh0dXJlQ2xvbmUgPSBwaGluYS5ncmFwaGljcy5DYW52YXMoKS5zZXRTaXplKHBhcmVudFRleHR1cmUud2lkdGgsIHBhcmVudFRleHR1cmUuaGVpZ2h0KTtcclxuICAgICAgICBwYXJlbnRUZXh0dXJlQ2xvbmUuY29udGV4dC5kcmF3SW1hZ2UocGFyZW50VGV4dHVyZS5kb21FbGVtZW50LCAwLCAwKTtcclxuICAgICAgICBwYXJlbnQuaW1hZ2UgPSBwYXJlbnRUZXh0dXJlQ2xvbmU7XHJcblxyXG4gICAgICAgIGNvbnN0IGRhdGEgPSBwYXJlbnRUZXh0dXJlQ2xvbmUuY29udGV4dC5nZXRJbWFnZURhdGEoeCwgeSwgMSwgMSkuZGF0YTtcclxuICAgICAgICBwYXJlbnRUZXh0dXJlQ2xvbmUuY29udGV4dC5jbGVhclJlY3QoeCwgeSwgdywgaCk7XHJcbiAgICAgICAgaWYgKGRhdGFbM10gPiAwKSB7XHJcbiAgICAgICAgICBwYXJlbnRUZXh0dXJlQ2xvbmUuY29udGV4dC5nbG9iYWxBbHBoYSA9IDE7XHJcbiAgICAgICAgICBwYXJlbnRUZXh0dXJlQ2xvbmUuY29udGV4dC5maWxsU3R5bGUgPSBgcmdiYSgke2RhdGFbMF19LCAke2RhdGFbMV19LCAke2RhdGFbMl19LCAke2RhdGFbM10gLyAyNTV9KWA7XHJcbiAgICAgICAgICBwYXJlbnRUZXh0dXJlQ2xvbmUuY29udGV4dC5maWxsUmVjdCh4IC0gMSwgeSAtIDEsIHcgKyAyLCBoICsgMik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBzcHJpdGUgPSBwaGluYS5kaXNwbGF5LlNwcml0ZShjYW52YXMpO1xyXG4gICAgICBzcHJpdGUuc2V0T3JpZ2luKHRhcmdldC5vcmlnaW4ueCwgdGFyZ2V0Lm9yaWdpbi55KTtcclxuICAgICAgdGFyZ2V0LmFkZENoaWxkQXQoc3ByaXRlLCAwKTtcclxuICAgIH1cclxuICB9LFxyXG59KTtcclxuIiwicGhpbmEuZGVmaW5lKFwiR2F1Z2VcIiwge1xuICBzdXBlckNsYXNzOiBcIlJlY3RhbmdsZUNsaXBcIixcblxuICBfbWluOiAwLFxuICBfbWF4OiAxLjAsXG4gIF92YWx1ZTogMS4wLCAvL21pbiB+IG1heFxuXG4gIGRpcmVjdGlvbjogXCJob3Jpem9udGFsXCIsIC8vIGhvcml6b250YWwgb3IgdmVydGljYWxcblxuICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnN1cGVySW5pdCgpO1xuICAgIHRoaXMub24oXCJhdHRhY2hlZFwiLCAoKSA9PiB7XG4gICAgICB0aGlzLl93aWR0aCA9IHRoaXMud2lkdGg7XG4gICAgICB0aGlzLl9oZWlnaHQgPSB0aGlzLndpZHRoO1xuXG4gICAgICB0aGlzLnRhcmdldC5hY2Nlc3NvcihcIkdhdWdlLm1pblwiLCB7XG4gICAgICAgIFwiZ2V0XCI6ICgpID0+IHRoaXMubWluLFxuICAgICAgICBcInNldFwiOiAodikgPT4gdGhpcy5taW4gPSB2LFxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMudGFyZ2V0LmFjY2Vzc29yKFwiR2F1Z2UubWF4XCIsIHtcbiAgICAgICAgXCJnZXRcIjogKCkgPT4gdGhpcy5tYXgsXG4gICAgICAgIFwic2V0XCI6ICh2KSA9PiB0aGlzLm1heCA9IHYsXG4gICAgICB9KTtcblxuICAgICAgdGhpcy50YXJnZXQuYWNjZXNzb3IoXCJHYXVnZS52YWx1ZVwiLCB7XG4gICAgICAgIFwiZ2V0XCI6ICgpID0+IHRoaXMudmFsdWUsXG4gICAgICAgIFwic2V0XCI6ICh2KSA9PiB0aGlzLnZhbHVlID0gdixcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLnRhcmdldC5hY2Nlc3NvcihcIkdhdWdlLnByb2dyZXNzXCIsIHtcbiAgICAgICAgXCJnZXRcIjogKCkgPT4gdGhpcy5wcm9ncmVzcyxcbiAgICAgICAgXCJzZXRcIjogKHYpID0+IHRoaXMucHJvZ3Jlc3MgPSB2LFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgX3JlZnJlc2g6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmRpcmVjdGlvbiAhPT0gXCJ2ZXJ0aWNhbFwiKSB7XG4gICAgICB0aGlzLndpZHRoID0gdGhpcy50YXJnZXQud2lkdGggKiB0aGlzLnByb2dyZXNzO1xuICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLnRhcmdldC5oZWlnaHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMud2lkdGggPSB0aGlzLnRhcmdldC53aWR0aDtcbiAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy50YXJnZXQuaGVpZ2h0ICogdGhpcy5wcm9ncmVzcztcbiAgICB9XG4gIH0sXG5cbiAgX2FjY2Vzc29yOiB7XG4gICAgcHJvZ3Jlc3M6IHtcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IHAgPSAodGhpcy52YWx1ZSAtIHRoaXMubWluKSAvICh0aGlzLm1heCAtIHRoaXMubWluKTtcbiAgICAgICAgcmV0dXJuIChpc05hTihwKSkgPyAwLjAgOiBwO1xuICAgICAgfSxcbiAgICAgIHNldDogZnVuY3Rpb24odikge1xuICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5tYXggKiB2O1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBtYXg6IHtcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXg7XG4gICAgICB9LFxuICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XG4gICAgICAgIHRoaXMuX21heCA9IHY7XG4gICAgICAgIHRoaXMuX3JlZnJlc2goKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgbWluOiB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWluO1xuICAgICAgfSxcbiAgICAgIHNldDogZnVuY3Rpb24odikge1xuICAgICAgICB0aGlzLl9taW4gPSB2O1xuICAgICAgICB0aGlzLl9yZWZyZXNoKCk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHZhbHVlOiB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gICAgICB9LFxuICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdjtcbiAgICAgICAgdGhpcy5fcmVmcmVzaCgpO1xuICAgICAgfVxuICAgIH0sXG4gIH1cblxufSk7XG4iLCJwaGluYS5kZWZpbmUoXCJHcmF5c2NhbGVcIiwge1xuICBzdXBlckNsYXNzOiBcIkFjY2Vzc29yeVwiLFxuXG4gIGdyYXlUZXh0dXJlTmFtZTogbnVsbCxcblxuICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdGhpcy5zdXBlckluaXQoKTtcbiAgICB0aGlzLm9uKFwiYXR0YWNoZWRcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5ncmF5VGV4dHVyZU5hbWUgPSBvcHRpb25zLmdyYXlUZXh0dXJlTmFtZTtcbiAgICAgIHRoaXMubm9ybWFsID0gdGhpcy50YXJnZXQuaW1hZ2U7XG4gICAgfSk7XG4gIH0sXG5cbiAgdG9HcmF5c2NhbGU6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMudGFyZ2V0LmltYWdlID0gdGhpcy5ncmF5VGV4dHVyZU5hbWU7XG4gIH0sXG5cbiAgdG9Ob3JtYWw6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMudGFyZ2V0LmltYWdlID0gdGhpcy5ub3JtYWw7XG4gIH0sXG5cbn0pO1xuIiwicGhpbmEubmFtZXNwYWNlKCgpID0+IHtcblxuICBwaGluYS5kZWZpbmUoXCJMaXN0Vmlld1wiLCB7XG4gICAgc3VwZXJDbGFzczogXCJBY2Nlc3NvcnlcIixcblxuICAgIHNjcm9sbFR5cGU6IG51bGwsXG5cbiAgICBpdGVtczogbnVsbCxcblxuICAgIGdldFZpZXdJZDogbnVsbCwgLy8gaXRlbeOBi+OCieWvvuW/nOOBmeOCi3ZpZXfjga5KU09O44KS6YG45YilIChpdGVtKSA9PiBqc29uXG4gICAgYmluZDogbnVsbCwgLy8gaXRlbeOBruaDheWgseOCknZpZXfjgavlj43mmKAgKHZpZXcsIGl0ZW0sIGxpc3RWaWV3KSA9PiB2b2lkLFxuXG4gICAgdmlld0pTT05zOiBudWxsLFxuXG4gICAgc2Nyb2xsQmFyOiBudWxsLFxuICAgIHNjcm9sbEJhckhhbmRsZTogbnVsbCxcbiAgICB2aWV3cG9ydDogbnVsbCxcbiAgICBpbm5lcjogbnVsbCxcblxuICAgIHNjcm9sbDogMCxcbiAgICBzY3JvbGxMb2NrOiBmYWxzZSxcblxuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMuc3VwZXJJbml0KG9wdGlvbnMpO1xuXG4gICAgICBvcHRpb25zID0gKHt9KS4kc2FmZShvcHRpb25zLCBMaXN0Vmlldy5kZWZhdWx0cyk7XG5cbiAgICAgIHRoaXMuaXRlbXMgPSBbXTtcblxuICAgICAgdGhpcy5nZXRWaWV3SWQgPSAoaXRlbSkgPT4gbnVsbDtcbiAgICAgIHRoaXMuYmluZCA9ICh2aWV3LCBpdGVtLCBsaXN0VmlldykgPT4ge307XG5cbiAgICAgIHRoaXMuaXRlbU1hcmdpbkxlZnQgPSBvcHRpb25zLml0ZW1NYXJnaW5MZWZ0O1xuICAgICAgdGhpcy5pdGVtTWFyZ2luVG9wID0gb3B0aW9ucy5pdGVtTWFyZ2luVG9wO1xuXG4gICAgICB0aGlzLm9uKFwiYXR0YWNoZWRcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLnRhcmdldC5vbmUoXCJyZWFkeVwiLCAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5zZXR1cChvcHRpb25zKVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gaWYgKHRoaXMudGFyZ2V0LnBhcmVudCkge1xuICAgICAgICAvLyAgIHRoaXMuc2V0dXAob3B0aW9ucyk7XG4gICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgIC8vICAgdGhpcy50YXJnZXQub25lKFwiYWRkZWRcIiwgKCkgPT4ge1xuICAgICAgICAvLyAgICAgdGhpcy5zZXR1cChvcHRpb25zKTtcbiAgICAgICAgLy8gICB9KTtcbiAgICAgICAgLy8gfVxuICAgICAgfSk7XG4gICAgfSxcblxuICAgIHNldHVwOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICBjb25zdCBmaW5kTGF5b3V0Um9vdCA9IChlbGVtZW50KSA9PiB7XG4gICAgICAgIGlmIChlbGVtZW50LmxheW91dEFzc2V0KSB7XG4gICAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgICAgIH0gZWxzZSBpZiAoZWxlbWVudC5wYXJlbnQpIHtcbiAgICAgICAgICByZXR1cm4gZmluZExheW91dFJvb3QoZWxlbWVudC5wYXJlbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCBsYXlvdXRSb290ID0gZmluZExheW91dFJvb3QodGhpcy50YXJnZXQpO1xuICAgICAgY29uc3QgYXNzZXQgPSBsYXlvdXRSb290LmxheW91dEFzc2V0O1xuXG4gICAgICB0aGlzLnNjcm9sbFR5cGUgPSBvcHRpb25zLnNjcm9sbFR5cGU7XG5cbiAgICAgIHRoaXMudmlld3BvcnQgPSB0aGlzLl9jcmVhdGVWaWV3cG9ydChvcHRpb25zKS5hZGRDaGlsZFRvKHRoaXMudGFyZ2V0KTtcbiAgICAgIHRoaXMuaW5uZXIgPSB0aGlzLl9jcmVhdGVJbm5lcihvcHRpb25zLCB0aGlzLnZpZXdwb3J0KS5hZGRDaGlsZFRvKHRoaXMudmlld3BvcnQpO1xuICAgICAgdGhpcy5mcm9udCA9IHRoaXMuX2NyZWF0ZUZyb250KG9wdGlvbnMsIHRoaXMudmlld3BvcnQsIHRoaXMuaW5uZXIpLmFkZENoaWxkVG8odGhpcy50YXJnZXQpO1xuICAgICAgdGhpcy5fc2V0dXBTY3JvbGxCYXIob3B0aW9ucywgdGhpcy52aWV3cG9ydCwgdGhpcy5pbm5lcik7XG5cbiAgICAgIHRoaXMuX3NldHVwV2hlZWxDb250cm9sKG9wdGlvbnMsIHRoaXMudmlld3BvcnQsIHRoaXMuaW5uZXIsIHRoaXMuZnJvbnQpO1xuICAgICAgdGhpcy5fc2V0dXBUb3VjaENvbnRyb2wob3B0aW9ucywgdGhpcy52aWV3cG9ydCwgdGhpcy5pbm5lciwgdGhpcy5mcm9udCk7XG5cbiAgICAgIGNvbnN0IGZpbmRCeUlkID0gKGlkLCBlbGVtZW50KSA9PiB7XG4gICAgICAgIGlmIChlbGVtZW50LmlkID09PSBpZCkge1xuICAgICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGNoaWxkcmVuID0gT2JqZWN0LmtleXMoZWxlbWVudC5jaGlsZHJlbiB8fCB7fSkubWFwKGtleSA9PiBlbGVtZW50LmNoaWxkcmVuW2tleV0pO1xuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGhpdCA9IGZpbmRCeUlkKGlkLCBjaGlsZHJlbltpXSk7XG4gICAgICAgICAgICBpZiAoaGl0KSByZXR1cm4gaGl0O1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGNvbnN0IHZpZXdJZHMgPSBvcHRpb25zLml0ZW0uc3BsaXQoXCIsXCIpLm1hcChfID0+IF8udHJpbSgpKTtcbiAgICAgIHRoaXMudmlld0pTT05zID0gdmlld0lkc1xuICAgICAgICAubWFwKGlkID0+IGZpbmRCeUlkKGlkLCBhc3NldC5kYXRhLnJvb3QpKVxuICAgICAgICAucmVkdWNlKChvYmosIHZpZXcpID0+IHtcbiAgICAgICAgICBvYmpbdmlldy5pZF0gPSB2aWV3O1xuICAgICAgICAgIHJldHVybiBvYmo7XG4gICAgICAgIH0sIHt9KTtcbiAgICAgIHRoaXMuZ2V0Vmlld0lkID0gKGl0ZW0pID0+IHZpZXdJZHNbMF07XG5cbiAgICAgIC8vIOWun+S9k+WMluOBleOCjOOBn+ODk+ODpeODvOOCkuS4gOaXpuWJiumZpOOBmeOCi1xuICAgICAgdmlld0lkcy5mb3JFYWNoKGlkID0+IGxheW91dFJvb3QucmVmW2lkXS5yZW1vdmUoKSk7XG5cbiAgICAgIHRoaXMuc2Nyb2xsQmFyID0gbGF5b3V0Um9vdC5yZWZbb3B0aW9ucy5zY3JvbGxCYXJdO1xuICAgICAgdGhpcy5zY3JvbGxCYXJIYW5kbGUgPSBsYXlvdXRSb290LnJlZltvcHRpb25zLnNjcm9sbEJhckhhbmRsZV07XG5cbiAgICB9LFxuXG4gICAgX2NyZWF0ZVZpZXdwb3J0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICBjb25zdCB2aWV3cG9ydCA9IERpc3BsYXlFbGVtZW50KCk7XG5cbiAgICAgIHZpZXdwb3J0LnggPSBvcHRpb25zLnNjcm9sbFJlY3QueDtcbiAgICAgIHZpZXdwb3J0LnkgPSBvcHRpb25zLnNjcm9sbFJlY3QueTtcbiAgICAgIHZpZXdwb3J0LndpZHRoID0gb3B0aW9ucy5zY3JvbGxSZWN0LndpZHRoO1xuICAgICAgdmlld3BvcnQuaGVpZ2h0ID0gb3B0aW9ucy5zY3JvbGxSZWN0LmhlaWdodDtcbiAgICAgIHZpZXdwb3J0LmNsaXAgPSAoY2FudmFzKSA9PiB7XG4gICAgICAgIGNvbnN0IHcgPSB2aWV3cG9ydC53aWR0aDtcbiAgICAgICAgY29uc3QgaCA9IHZpZXdwb3J0LmhlaWdodDtcblxuICAgICAgICBjb25zdCBjdHggPSBjYW52YXMuY29udGV4dDtcbiAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICBjdHgubW92ZVRvKHcgKiAtMC41LCBoICogLTAuNSk7XG4gICAgICAgIGN0eC5saW5lVG8odyAqICswLjUsIGggKiAtMC41KTtcbiAgICAgICAgY3R4LmxpbmVUbyh3ICogKzAuNSwgaCAqICswLjUpO1xuICAgICAgICBjdHgubGluZVRvKHcgKiAtMC41LCBoICogKzAuNSk7XG4gICAgICAgIGN0eC5jbG9zZVBhdGgoKTtcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiB2aWV3cG9ydDtcbiAgICB9LFxuXG4gICAgX2NyZWF0ZUlubmVyOiBmdW5jdGlvbihvcHRpb25zLCB2aWV3cG9ydCkge1xuICAgICAgaWYgKG9wdGlvbnMuaW5uZXIpIHtcbiAgICAgICAgLy8gVE9ET1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgaW5uZXIgPSBEaXNwbGF5RWxlbWVudCgpO1xuXG4gICAgICAgIGlubmVyLnggPSAtdmlld3BvcnQud2lkdGggKiB2aWV3cG9ydC5vcmlnaW5YO1xuICAgICAgICBpbm5lci55ID0gLXZpZXdwb3J0LmhlaWdodCAqIHZpZXdwb3J0Lm9yaWdpblk7XG4gICAgICAgIGlubmVyLm9yaWdpblggPSAwO1xuICAgICAgICBpbm5lci5vcmlnaW5ZID0gMDtcblxuICAgICAgICByZXR1cm4gaW5uZXI7XG4gICAgICB9XG4gICAgfSxcblxuICAgIF9jcmVhdGVGcm9udDogZnVuY3Rpb24ob3B0aW9ucywgdmlld3BvcnQsIGlubmVyKSB7XG4gICAgICBjb25zdCBmcm9udCA9IERpc3BsYXlFbGVtZW50KCk7XG5cbiAgICAgIGZyb250LnggPSBvcHRpb25zLnNjcm9sbFJlY3QueDtcbiAgICAgIGZyb250LnkgPSBvcHRpb25zLnNjcm9sbFJlY3QueTtcbiAgICAgIGZyb250LndpZHRoID0gb3B0aW9ucy5zY3JvbGxSZWN0LndpZHRoO1xuICAgICAgZnJvbnQuaGVpZ2h0ID0gb3B0aW9ucy5zY3JvbGxSZWN0LmhlaWdodDtcbiAgICAgIGZyb250LmludGVyYWN0aXZlID0gdHJ1ZTtcblxuICAgICAgcmV0dXJuIGZyb250O1xuICAgIH0sXG5cbiAgICBfc2V0dXBTY3JvbGxCYXI6IGZ1bmN0aW9uKG9wdGlvbnMsIHZpZXdwb3J0LCBpbm5lcikge1xuICAgICAgdGhpcy50YXJnZXQub24oXCJlbnRlcmZyYW1lXCIsICgpID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLnNjcm9sbEJhciAmJiAhdGhpcy5zY3JvbGxCYXJIYW5kbGUpIHJldHVybjtcblxuICAgICAgICBpZiAodGhpcy5zY3JvbGxUeXBlICE9PSBcImhvcml6b250YWxcIikge1xuICAgICAgICAgIGNvbnN0IHRvcCA9IHZpZXdwb3J0LmhlaWdodCAqIC12aWV3cG9ydC5vcmlnaW5ZO1xuICAgICAgICAgIGNvbnN0IGJvdHRvbSA9IHZpZXdwb3J0LmhlaWdodCAqICgxIC0gdmlld3BvcnQub3JpZ2luWSk7XG4gICAgICAgICAgY29uc3Qgc2Nyb2xsTWluID0gdG9wO1xuICAgICAgICAgIGNvbnN0IHNjcm9sbE1heCA9IGJvdHRvbSAtIGlubmVyLmhlaWdodDtcbiAgICAgICAgICBjb25zdCBzY3JvbGxWYWx1ZSA9IE1hdGguY2xhbXAoKGlubmVyLnRvcCAtIHNjcm9sbE1pbikgLyAoc2Nyb2xsTWF4IC0gc2Nyb2xsTWluKSwgMCwgMSk7XG5cbiAgICAgICAgICBjb25zdCB5TWluID0gdGhpcy5zY3JvbGxCYXIuaGVpZ2h0ICogLXRoaXMuc2Nyb2xsQmFyLm9yaWdpblkgKyB0aGlzLnNjcm9sbEJhckhhbmRsZS5oZWlnaHQgKiB0aGlzLnNjcm9sbEJhckhhbmRsZS5vcmlnaW5ZICsgdGhpcy5zY3JvbGxCYXIueTtcbiAgICAgICAgICBjb25zdCB5TWF4ID0gdGhpcy5zY3JvbGxCYXIuaGVpZ2h0ICogKDEgLSB0aGlzLnNjcm9sbEJhci5vcmlnaW5ZKSAtIHRoaXMuc2Nyb2xsQmFySGFuZGxlLmhlaWdodCAqICgxIC0gdGhpcy5zY3JvbGxCYXJIYW5kbGUub3JpZ2luWSkgKyB0aGlzLnNjcm9sbEJhci55O1xuICAgICAgICAgIGlmIChpbm5lci5oZWlnaHQgPD0gdmlld3BvcnQuaGVpZ2h0KSB7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbEJhckhhbmRsZS55ID0geU1pbjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxCYXJIYW5kbGUueSA9IHlNaW4gKyAoeU1heCAtIHlNaW4pICogc2Nyb2xsVmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGxlZnQgPSB2aWV3cG9ydC53aWR0aCAqIC12aWV3cG9ydC5vcmlnaW5ZO1xuICAgICAgICAgIGNvbnN0IHJpZ2h0ID0gdmlld3BvcnQuaGVpZ2h0ICogKDEgLSB2aWV3cG9ydC5vcmlnaW5ZKTtcbiAgICAgICAgICBjb25zdCBzY3JvbGxNaW4gPSBsZWZ0O1xuICAgICAgICAgIGNvbnN0IHNjcm9sbE1heCA9IHJpZ2h0IC0gaW5uZXIuaGVpZ2h0O1xuICAgICAgICAgIGNvbnN0IHNjcm9sbFZhbHVlID0gTWF0aC5jbGFtcCgoaW5uZXIubGVmdCAtIHNjcm9sbE1pbikgLyAoc2Nyb2xsTWF4IC0gc2Nyb2xsTWluKSwgMCwgMSk7XG5cbiAgICAgICAgICBjb25zdCB5TWluID0gdGhpcy5zY3JvbGxCYXIuaGVpZ2h0ICogLXRoaXMuc2Nyb2xsQmFyLm9yaWdpblkgKyB0aGlzLnNjcm9sbEJhckhhbmRsZS5oZWlnaHQgKiB0aGlzLnNjcm9sbEJhckhhbmRsZS5vcmlnaW5ZICsgdGhpcy5zY3JvbGxCYXIueTtcbiAgICAgICAgICBjb25zdCB5TWF4ID0gdGhpcy5zY3JvbGxCYXIuaGVpZ2h0ICogKDEgLSB0aGlzLnNjcm9sbEJhci5vcmlnaW5ZKSAtIHRoaXMuc2Nyb2xsQmFySGFuZGxlLmhlaWdodCAqICgxIC0gdGhpcy5zY3JvbGxCYXJIYW5kbGUub3JpZ2luWSkgKyB0aGlzLnNjcm9sbEJhci55O1xuICAgICAgICAgIGlmIChpbm5lci5oZWlnaHQgPD0gdmlld3BvcnQuaGVpZ2h0KSB7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbEJhckhhbmRsZS55ID0geU1pbjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxCYXJIYW5kbGUueSA9IHlNaW4gKyAoeU1heCAtIHlNaW4pICogc2Nyb2xsVmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgX3NldHVwV2hlZWxDb250cm9sOiBmdW5jdGlvbihvcHRpb25zLCB2aWV3cG9ydCwgaW5uZXIsIGZyb250KSB7XG4gICAgICBpZiAodGhpcy5zY3JvbGxUeXBlICE9PSBcImhvcml6b250YWxcIikge1xuICAgICAgICB0aGlzLnRhcmdldC5vbihcImVudGVyZnJhbWVcIiwgKGUpID0+IHtcbiAgICAgICAgICBpZiAoaW5uZXIuaGVpZ2h0IDw9IHZpZXdwb3J0LmhlaWdodCkgcmV0dXJuO1xuICAgICAgICAgIGlmICh0aGlzLnNjcm9sbExvY2spIHJldHVybjtcblxuICAgICAgICAgIGNvbnN0IHAgPSBlLmFwcC5wb2ludGVyO1xuICAgICAgICAgIGNvbnN0IGRlbHRhID0gcC53aGVlbERlbHRhWTtcbiAgICAgICAgICBpZiAoZGVsdGEgJiYgZnJvbnQuaGl0VGVzdChwLngsIHAueSkpIHtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsICs9IGRlbHRhIC8gaW5uZXIuaGVpZ2h0ICogMC44O1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnRhcmdldC5vbihcImVudGVyZnJhbWVcIiwgKGUpID0+IHtcbiAgICAgICAgICBpZiAoaW5uZXIud2lkdGggPD0gdmlld3BvcnQud2lkdGgpIHJldHVybjtcbiAgICAgICAgICBpZiAodGhpcy5zY3JvbGxMb2NrKSByZXR1cm47XG5cbiAgICAgICAgICBjb25zdCBwID0gZS5hcHAucG9pbnRlcjtcbiAgICAgICAgICBjb25zdCBkZWx0YSA9IHAud2hlZWxEZWx0YVk7XG4gICAgICAgICAgaWYgKGRlbHRhICYmIGZyb250LmhpdFRlc3QocC54LCBwLnkpKSB7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbCArPSBkZWx0YSAvIGlubmVyLndpZHRoICogMC44O1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIF9zZXR1cFRvdWNoQ29udHJvbDogZnVuY3Rpb24ob3B0aW9ucywgdmlld3BvcnQsIGlubmVyLCBmcm9udCkge1xuICAgICAgY29uc3QgdHdlZW5lciA9IFR3ZWVuZXIoKS5hdHRhY2hUbyhpbm5lcik7XG4gICAgICBjb25zdCB2ZWxvY2l0eSA9IFZlY3RvcjIoMCwgMCk7XG5cbiAgICAgIGxldCBkcmFnZ2luZyA9IGZhbHNlO1xuICAgICAgZnJvbnQub24oJ3BvaW50c3RhcnQnLCAoZSkgPT4ge1xuICAgICAgICBlLnBhc3MgPSB0cnVlO1xuXG4gICAgICAgIGlmIChpbm5lci5oZWlnaHQgPD0gdmlld3BvcnQuaGVpZ2h0KSByZXR1cm47XG5cbiAgICAgICAgZHJhZ2dpbmcgPSB0cnVlO1xuICAgICAgICB2ZWxvY2l0eS5zZXQoMCwgMCk7XG4gICAgICAgIHR3ZWVuZXIuc3RvcCgpO1xuICAgICAgfSk7XG4gICAgICBmcm9udC5vbigncG9pbnRzdGF5JywgKGUpID0+IHtcbiAgICAgICAgaWYgKCFkcmFnZ2luZykgcmV0dXJuO1xuICAgICAgICB2ZWxvY2l0eS5zZXQoZS5wb2ludGVyLmR4LCBlLnBvaW50ZXIuZHkpO1xuXG4gICAgICAgIGlmICh0aGlzLnNjcm9sbFR5cGUgIT09IFwiaG9yaXpvbnRhbFwiKSB7XG4gICAgICAgICAgY29uc3QgdG9wID0gLXZpZXdwb3J0LmhlaWdodCAqIHZpZXdwb3J0Lm9yaWdpblk7XG4gICAgICAgICAgY29uc3QgYm90dG9tID0gdmlld3BvcnQuaGVpZ2h0ICogKDEgLSB2aWV3cG9ydC5vcmlnaW5ZKTtcbiAgICAgICAgICBsZXQgb3ZlcmRpc3RhbmNlID0gMDtcbiAgICAgICAgICBpZiAodG9wIDwgaW5uZXIudG9wKSB7XG4gICAgICAgICAgICBvdmVyZGlzdGFuY2UgPSB0b3AgLSBpbm5lci50b3A7XG4gICAgICAgICAgfSBlbHNlIGlmIChpbm5lci50b3AgPCBib3R0b20gLSBpbm5lci5oZWlnaHQpIHtcbiAgICAgICAgICAgIG92ZXJkaXN0YW5jZSA9IGlubmVyLnRvcCAtIChib3R0b20gLSBpbm5lci5oZWlnaHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2ZWxvY2l0eS5tdWwoMS4wIC0gTWF0aC5hYnMob3ZlcmRpc3RhbmNlKSAvIDIwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgbGVmdCA9IC12aWV3cG9ydC53aWR0aCAqIHZpZXdwb3J0Lm9yaWdpblk7XG4gICAgICAgICAgY29uc3QgcmlnaHQgPSB2aWV3cG9ydC53aWR0aCAqICgxIC0gdmlld3BvcnQub3JpZ2luWSk7XG4gICAgICAgICAgbGV0IG92ZXJkaXN0YW5jZSA9IDA7XG4gICAgICAgICAgaWYgKGxlZnQgPCBpbm5lci5sZWZ0KSB7XG4gICAgICAgICAgICBvdmVyZGlzdGFuY2UgPSBsZWZ0IC0gaW5uZXIubGVmdDtcbiAgICAgICAgICB9IGVsc2UgaWYgKGlubmVyLmxlZnQgPCByaWdodCAtIGlubmVyLndpZHRoKSB7XG4gICAgICAgICAgICBvdmVyZGlzdGFuY2UgPSBpbm5lci5sZWZ0IC0gKHJpZ2h0IC0gaW5uZXIud2lkdGgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2ZWxvY2l0eS5tdWwoMS4wIC0gTWF0aC5hYnMob3ZlcmRpc3RhbmNlKSAvIDIwMCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgZnJvbnQub24oJ3BvaW50ZW5kJywgKGUpID0+IHtcbiAgICAgICAgZS5wYXNzID0gdHJ1ZTtcbiAgICAgICAgZS52ZWxvY2l0eSA9IHZlbG9jaXR5O1xuICAgICAgICBkcmFnZ2luZyA9IGZhbHNlO1xuICAgICAgfSk7XG5cbiAgICAgIHRoaXMub24oXCJ2aWV3c3RvcFwiLCAoZSkgPT4ge1xuICAgICAgICB2ZWxvY2l0eS5zZXQoMCwgMCk7XG4gICAgICB9KTtcblxuICAgICAgdGhpcy50YXJnZXQub24oXCJlbnRlcmZyYW1lXCIsIChlKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnNjcm9sbFR5cGUgIT09IFwiaG9yaXpvbnRhbFwiKSB7XG4gICAgICAgICAgaWYgKGlubmVyLmhlaWdodCA8PSB2aWV3cG9ydC5oZWlnaHQpIHJldHVybjtcbiAgICAgICAgICBpbm5lci50b3AgKz0gdmVsb2NpdHkueTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoaW5uZXIud2lkdGggPD0gdmlld3BvcnQud2lkdGgpIHJldHVybjtcbiAgICAgICAgICBpbm5lci5sZWZ0ICs9IHZlbG9jaXR5Lng7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZHJhZ2dpbmcpIHJldHVybjtcblxuICAgICAgICBpZiAoIXR3ZWVuZXIucGxheWluZykge1xuICAgICAgICAgIHZlbG9jaXR5Lm11bCgwLjkpO1xuICAgICAgICAgIGlmIChNYXRoLmFicyh2ZWxvY2l0eS54KSA8IDAuMSAmJiBNYXRoLmFicyh2ZWxvY2l0eS55KSA8IDAuMSkge1xuICAgICAgICAgICAgdmVsb2NpdHkuc2V0KDAsIDApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0aGlzLnNjcm9sbFR5cGUgIT09IFwiaG9yaXpvbnRhbFwiKSB7XG4gICAgICAgICAgICBjb25zdCB0b3AgPSAtdmlld3BvcnQuaGVpZ2h0ICogdmlld3BvcnQub3JpZ2luWTtcbiAgICAgICAgICAgIGNvbnN0IGJvdHRvbSA9IHZpZXdwb3J0LmhlaWdodCAqICgxIC0gdmlld3BvcnQub3JpZ2luWSk7XG4gICAgICAgICAgICBpZiAodG9wIDwgaW5uZXIudG9wKSB7XG4gICAgICAgICAgICAgIHZlbG9jaXR5LnNldCgwLCAwKTtcbiAgICAgICAgICAgICAgdHdlZW5lci5jbGVhcigpLnRvKHtcbiAgICAgICAgICAgICAgICB5OiB0b3BcbiAgICAgICAgICAgICAgfSwgMTAwLCBcImVhc2VJblF1YWRcIik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlubmVyLnRvcCA8IGJvdHRvbSAtIGlubmVyLmhlaWdodCkge1xuICAgICAgICAgICAgICB2ZWxvY2l0eS5zZXQoMCwgMCk7XG4gICAgICAgICAgICAgIHR3ZWVuZXIuY2xlYXIoKS50byh7XG4gICAgICAgICAgICAgICAgeTogYm90dG9tIC0gaW5uZXIuaGVpZ2h0XG4gICAgICAgICAgICAgIH0sIDEwMCwgXCJlYXNlSW5RdWFkXCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdHdlZW5lci5zdG9wKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGxlZnQgPSAtdmlld3BvcnQuaGVpZ2h0ICogdmlld3BvcnQub3JpZ2luWTtcbiAgICAgICAgICAgIGNvbnN0IHJpZ2h0ID0gdmlld3BvcnQuaGVpZ2h0ICogKDEgLSB2aWV3cG9ydC5vcmlnaW5ZKTtcbiAgICAgICAgICAgIGlmIChsZWZ0IDwgaW5uZXIubGVmdCkge1xuICAgICAgICAgICAgICB2ZWxvY2l0eS5zZXQoMCwgMCk7XG4gICAgICAgICAgICAgIHR3ZWVuZXIuY2xlYXIoKS50byh7XG4gICAgICAgICAgICAgICAgeTogbGVmdFxuICAgICAgICAgICAgICB9LCAxMDAsIFwiZWFzZUluUXVhZFwiKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5uZXIubGVmdCA8IHJpZ2h0IC0gaW5uZXIuaGVpZ2h0KSB7XG4gICAgICAgICAgICAgIHZlbG9jaXR5LnNldCgwLCAwKTtcbiAgICAgICAgICAgICAgdHdlZW5lci5jbGVhcigpLnRvKHtcbiAgICAgICAgICAgICAgICB5OiByaWdodCAtIGlubmVyLmhlaWdodFxuICAgICAgICAgICAgICB9LCAxMDAsIFwiZWFzZUluUXVhZFwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHR3ZWVuZXIuc3RvcCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcblxuICAgIGNyZWF0ZVZpZXc6IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIGNvbnN0IHZpZXdKU09OID0gdGhpcy52aWV3SlNPTnNbdGhpcy5nZXRWaWV3SWQoaXRlbSldO1xuICAgICAgLy8gY29uc29sZS5sb2codmlld0pTT04pO1xuICAgICAgdGhpcy5pbm5lci5mcm9tSlNPTih7XG4gICAgICAgIGNoaWxkcmVuOiBbdmlld0pTT05dLFxuICAgICAgfSk7XG4gICAgICBjb25zdCB2aWV3ID0gdGhpcy5pbm5lci5jaGlsZHJlbi5sYXN0O1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSxcblxuICAgIGFkZEl0ZW06IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIHRoaXMuaXRlbXMucHVzaChpdGVtKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBhZGRJdGVtczogZnVuY3Rpb24oaXRlbXMpIHtcbiAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KHRoaXMuaXRlbXMsIGl0ZW1zKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICByZW1vdmVJdGVtOiBmdW5jdGlvbihpdGVtKSB7XG4gICAgICB0aGlzLml0ZW1zLmVyYXNlKGl0ZW0pO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGNsZWFySXRlbTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLml0ZW1zLmNsZWFyKCk7XG4gICAgICB0aGlzLnNjcm9sbCA9IDA7XG4gICAgICB0aGlzLmZsYXJlKCd2aWV3c3RvcCcpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGludmFsaWRhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5pbm5lci5jaGlsZHJlbi5jbG9uZSgpLmZvckVhY2goKGNoaWxkKSA9PiBjaGlsZC5yZW1vdmUoKSk7XG5cbiAgICAgIGxldCB5ID0gMDtcbiAgICAgIGxldCB4ID0gMDtcblxuICAgICAgdGhpcy5pbm5lci5oZWlnaHQgPSAxO1xuXG4gICAgICB0aGlzLml0ZW1zLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLmNyZWF0ZVZpZXcoaXRlbSk7XG4gICAgICAgIHZpZXcuX2xpc3RWaWV3ID0gdGhpcztcbiAgICAgICAgdGhpcy5iaW5kKHZpZXcsIGl0ZW0sIHRoaXMpO1xuXG4gICAgICAgIGlmICh0aGlzLnNjcm9sbFR5cGUgIT09IFwiaG9yaXpvbnRhbFwiKSB7XG4gICAgICAgICAgdmlldy5sZWZ0ID0geCArIHRoaXMuaXRlbU1hcmdpbkxlZnQ7XG4gICAgICAgICAgdmlldy50b3AgPSB5ICsgdGhpcy5pdGVtTWFyZ2luVG9wO1xuXG4gICAgICAgICAgaWYgKCh2aWV3LnJpZ2h0ICsgdmlldy53aWR0aCArIHRoaXMuaXRlbU1hcmdpbkxlZnQpIDwgdGhpcy52aWV3cG9ydC53aWR0aCkge1xuICAgICAgICAgICAgeCA9IHZpZXcucmlnaHQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHggPSAwO1xuICAgICAgICAgICAgeSA9IHZpZXcuYm90dG9tO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuaW5uZXIuaGVpZ2h0ID0gTWF0aC5tYXgodGhpcy52aWV3cG9ydC5oZWlnaHQsIHZpZXcudG9wICsgdmlldy5oZWlnaHQgKyB0aGlzLml0ZW1NYXJnaW5Ub3ApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIFRPRE9cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8v44GK6Kmm44GX5a6f6KOFXG4gICAgICBpZiAodGhpcy51cGRhdGVGdW5jKSB0aGlzLnRhcmdldC5vZmYoXCJlbnRlcmZyYW1lXCIsIHRoaXMudXBkYXRlRnVuYyk7XG5cbiAgICAgIGlmICghdGhpcy51cGRhdGVGdW5jKSB7XG4gICAgICAgIHRoaXMudXBkYXRlRnVuYyA9ICgpID0+IHtcbiAgICAgICAgICBsZXQgeSA9IDA7XG4gICAgICAgICAgbGV0IHggPSAwO1xuICAgICAgICAgIHRoaXMuaW5uZXIuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQsIGkpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnNjcm9sbFR5cGUgIT09IFwiaG9yaXpvbnRhbFwiKSB7XG4gICAgICAgICAgICAgIGNoaWxkLmxlZnQgPSB4ICsgdGhpcy5pdGVtTWFyZ2luTGVmdDtcbiAgICAgICAgICAgICAgY2hpbGQudG9wID0geSArIHRoaXMuaXRlbU1hcmdpblRvcDtcblxuICAgICAgICAgICAgICBpZiAoKGNoaWxkLnJpZ2h0ICsgY2hpbGQud2lkdGggKyB0aGlzLml0ZW1NYXJnaW5MZWZ0KSA8IHRoaXMudmlld3BvcnQud2lkdGgpIHtcbiAgICAgICAgICAgICAgICB4ID0gY2hpbGQucmlnaHQ7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgeCA9IDA7XG4gICAgICAgICAgICAgICAgeSA9IGNoaWxkLmJvdHRvbTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHRoaXMuaW5uZXIuaGVpZ2h0ID0gTWF0aC5tYXgodGhpcy52aWV3cG9ydC5oZWlnaHQsIGNoaWxkLnRvcCArIGNoaWxkLmhlaWdodCArIHRoaXMuaXRlbU1hcmdpblRvcCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBUT0RPXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIC8vZW50ZXJmcmFtZeOBp+OBr+OBquOBj+OBpndhdGNo44GnaGVpZ2h044G/44Gm44KC44GE44GE44GL44GqXG4gICAgICB0aGlzLnRhcmdldC5vbihcImVudGVyZnJhbWVcIiwgdGhpcy51cGRhdGVGdW5jKTtcbiAgICB9LFxuXG4gICAgLy8gcmV0dXJuIDAuMO+9njEuMFxuICAgIGdldFNjcm9sbDogZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCB2aWV3cG9ydCA9IHRoaXMudmlld3BvcnQ7XG4gICAgICBjb25zdCBpbm5lciA9IHRoaXMuaW5uZXI7XG5cbiAgICAgIGlmICh0aGlzLnNjcm9sbFR5cGUgIT09IFwiaG9yaXpvbnRhbFwiKSB7XG4gICAgICAgIGNvbnN0IHRvcCA9IHZpZXdwb3J0LmhlaWdodCAqIC12aWV3cG9ydC5vcmlnaW5ZO1xuICAgICAgICBjb25zdCBib3R0b20gPSB2aWV3cG9ydC5oZWlnaHQgKiAoMSAtIHZpZXdwb3J0Lm9yaWdpblkpO1xuICAgICAgICBjb25zdCBtaW4gPSB0b3A7XG4gICAgICAgIGNvbnN0IG1heCA9IGJvdHRvbSAtIGlubmVyLmhlaWdodDtcblxuICAgICAgICByZXR1cm4gKGlubmVyLnRvcCAtIG1pbikgLyAobWF4IC0gbWluKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRPT0RcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8vIHY6IDAuMO+9njEuMFxuICAgIHNldFNjcm9sbDogZnVuY3Rpb24odikge1xuICAgICAgdiA9IE1hdGguY2xhbXAodiwgMCwgMSk7XG5cbiAgICAgIGNvbnN0IHZpZXdwb3J0ID0gdGhpcy52aWV3cG9ydDtcbiAgICAgIGNvbnN0IGlubmVyID0gdGhpcy5pbm5lcjtcblxuICAgICAgaWYgKHRoaXMuc2Nyb2xsVHlwZSAhPT0gXCJob3Jpem9udGFsXCIpIHtcbiAgICAgICAgaWYgKGlubmVyLmhlaWdodCA8PSB2aWV3cG9ydC5oZWlnaHQpIHJldHVybjtcblxuICAgICAgICBjb25zdCB0b3AgPSB2aWV3cG9ydC5oZWlnaHQgKiAtdmlld3BvcnQub3JpZ2luWTtcbiAgICAgICAgY29uc3QgYm90dG9tID0gdmlld3BvcnQuaGVpZ2h0ICogKDEgLSB2aWV3cG9ydC5vcmlnaW5ZKTtcbiAgICAgICAgY29uc3QgbWluID0gdG9wO1xuICAgICAgICBjb25zdCBtYXggPSBib3R0b20gLSBpbm5lci5oZWlnaHQ7XG5cbiAgICAgICAgaW5uZXIudG9wID0gbWluICsgKG1heCAtIG1pbikgKiB2O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVE9PRFxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgX2FjY2Vzc29yOiB7XG4gICAgICBlbGVtZW50czoge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmlubmVyLmNoaWxkcmVuO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHNjcm9sbDoge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmdldFNjcm9sbCgpO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICB0aGlzLnNldFNjcm9sbCh2KTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcblxuICAgIF9zdGF0aWM6IHtcbiAgICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIHNjcm9sbFR5cGU6IFwidmVydGljYWxcIixcbiAgICAgICAgaXRlbU1hcmdpbkxlZnQ6IDAsXG4gICAgICAgIGl0ZW1NYXJnaW5Ub3A6IDAsXG4gICAgICB9LFxuICAgIH0sXG5cbiAgfSk7XG5cbn0pO1xuIiwicGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuICAvL+ODnuOCpuOCuei/veW+k1xuICBwaGluYS5kZWZpbmUoXCJNb3VzZUNoYXNlclwiLCB7XG4gICAgc3VwZXJDbGFzczogXCJBY2Nlc3NvcnlcIixcblxuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5zdXBlckluaXQoKTtcbiAgICB9LFxuXG4gICAgb25hdHRhY2hlZDogZnVuY3Rpb24oKSB7XG4gICAgICBsZXQgcHggPSAwO1xuICAgICAgbGV0IHB5ID0gMDtcbiAgICAgIGNvbnNvbGUubG9nKFwiI01vdXNlQ2hhc2VyXCIsIFwib25hdHRhY2hlZFwiKTtcbiAgICAgIHRoaXMudHdlZW5lciA9IFR3ZWVuZXIoKS5hdHRhY2hUbyh0aGlzLnRhcmdldCk7XG4gICAgICB0aGlzLnRhcmdldC5vbihcImVudGVyZnJhbWVcIiwgKGUpID0+IHtcbiAgICAgICAgY29uc3QgcCA9IGUuYXBwLnBvaW50ZXI7XG4gICAgICAgIGlmIChweSA9PSBwLnggJiYgcHkgPT0gcC55KSByZXR1cm47XG4gICAgICAgIHB4ID0gcC54O1xuICAgICAgICBweSA9IHAueTtcbiAgICAgICAgY29uc3QgeCA9IHAueCAtIFNDUkVFTl9XSURUSF9IQUxGO1xuICAgICAgICBjb25zdCB5ID0gcC55IC0gU0NSRUVOX0hFSUdIVF9IQUxGO1xuICAgICAgICB0aGlzLnR3ZWVuZXIuY2xlYXIoKS50byh7IHgsIHkgfSwgMjAwMCwgXCJlYXNlT3V0UXVhZFwiKVxuICAgICAgfSk7XG5cbiAgICB9LFxuXG4gICAgb25kZXRhY2hlZDogZnVuY3Rpb24oKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIiNNb3VzZUNoYXNlclwiLCBcIm9uZGV0YWNoZWRcIik7XG4gICAgICB0aGlzLnR3ZWVuZXIucmVtb3ZlKCk7XG4gICAgfVxuXG4gIH0pO1xufSk7XG4iLCJwaGluYS5uYW1lc3BhY2UoZnVuY3Rpb24oKSB7XG5cbiAgcGhpbmEuZGVmaW5lKFwiUGllQ2xpcFwiLCB7XG4gICAgc3VwZXJDbGFzczogXCJBY2Nlc3NvcnlcIixcblxuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSAoe30pLiRzYWZlKG9wdGlvbnMsIFBpZUNsaXAuZGVmYXVsdHMpXG4gICAgICB0aGlzLnN1cGVySW5pdChvcHRpb25zKTtcblxuICAgICAgdGhpcy5waXZvdFggPSBvcHRpb25zLnBpdm90WDtcbiAgICAgIHRoaXMucGl2b3RZID0gb3B0aW9ucy5waXZvdFk7XG4gICAgICB0aGlzLmFuZ2xlTWluID0gb3B0aW9ucy5hbmdsZU1pbjtcbiAgICAgIHRoaXMuYW5nbGVNYXggPSBvcHRpb25zLmFuZ2xlTWF4O1xuICAgICAgdGhpcy5yYWRpdXMgPSBvcHRpb25zLnJhZGl1cztcbiAgICAgIHRoaXMuYW50aWNsb2Nrd2lzZSA9IG9wdGlvbnMuYW50aWNsb2Nrd2lzZTtcbiAgICB9LFxuXG4gICAgb25hdHRhY2hlZDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnRhcmdldC5jbGlwID0gKGNhbnZhcykgPT4ge1xuICAgICAgICBjb25zdCBhbmdsZU1pbiA9IHRoaXMuYW5nbGVNaW4gKiBNYXRoLkRFR19UT19SQUQ7XG4gICAgICAgIGNvbnN0IGFuZ2xlTWF4ID0gdGhpcy5hbmdsZU1heCAqIE1hdGguREVHX1RPX1JBRDtcbiAgICAgICAgY29uc3QgY3R4ID0gY2FudmFzLmNvbnRleHQ7XG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgY3R4Lm1vdmVUbyh0aGlzLnBpdm90WCwgdGhpcy5waXZvdFkpO1xuICAgICAgICBjdHgubGluZVRvKHRoaXMucGl2b3RYICsgTWF0aC5jb3MoYW5nbGVNaW4pICogdGhpcy5yYWRpdXMsIHRoaXMucGl2b3RZICsgTWF0aC5zaW4oYW5nbGVNaW4pICogdGhpcy5yYWRpdXMpO1xuICAgICAgICBjdHguYXJjKHRoaXMucGl2b3RYLCB0aGlzLnBpdm90WSwgdGhpcy5yYWRpdXMsIGFuZ2xlTWluLCBhbmdsZU1heCwgdGhpcy5hbnRpY2xvY2t3aXNlKTtcbiAgICAgICAgY3R4LmNsb3NlUGF0aCgpO1xuICAgICAgfTtcbiAgICB9LFxuXG4gICAgX3N0YXRpYzoge1xuICAgICAgZGVmYXVsdHM6IHtcbiAgICAgICAgcGl2b3RYOiAzMixcbiAgICAgICAgcGl2b3RZOiAzMixcbiAgICAgICAgYW5nbGVNaW46IDAsXG4gICAgICAgIGFuZ2xlTWF4OiAzNjAsXG4gICAgICAgIHJhZGl1czogNjQsXG4gICAgICAgIGFudGljbG9ja3dpc2U6IGZhbHNlLFxuICAgICAgfSxcbiAgICB9LFxuXG4gIH0pO1xufSk7XG4iLCJwaGluYS5kZWZpbmUoXCJSZWN0YW5nbGVDbGlwXCIsIHtcbiAgc3VwZXJDbGFzczogXCJBY2Nlc3NvcnlcIixcblxuICB4OiAwLFxuICB5OiAwLFxuICB3aWR0aDogMCxcbiAgaGVpZ2h0OiAwLFxuXG4gIF9lbmFibGU6IHRydWUsXG5cbiAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zdXBlckluaXQoKTtcbiAgICB0aGlzLl9pbml0KCk7XG4gIH0sXG5cbiAgX2luaXQ6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMub24oXCJhdHRhY2hlZFwiLCAoKSA9PiB7XG5cbiAgICAgIHRoaXMudGFyZ2V0LmFjY2Vzc29yKFwiUmVjdGFuZ2xlQ2xpcC53aWR0aFwiLCB7XG4gICAgICAgIFwiZ2V0XCI6ICgpID0+IHRoaXMud2lkdGgsXG4gICAgICAgIFwic2V0XCI6ICh2KSA9PiB0aGlzLndpZHRoID0gdixcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLnRhcmdldC5hY2Nlc3NvcihcIlJlY3RhbmdsZUNsaXAuaGVpZ2h0XCIsIHtcbiAgICAgICAgXCJnZXRcIjogKCkgPT4gdGhpcy5oZWlnaHQsXG4gICAgICAgIFwic2V0XCI6ICh2KSA9PiB0aGlzLmhlaWdodCA9IHYsXG4gICAgICB9KTtcblxuICAgICAgdGhpcy50YXJnZXQuYWNjZXNzb3IoXCJSZWN0YW5nbGVDbGlwLnhcIiwge1xuICAgICAgICBcImdldFwiOiAoKSA9PiB0aGlzLngsXG4gICAgICAgIFwic2V0XCI6ICh2KSA9PiB0aGlzLnggPSB2LFxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMudGFyZ2V0LmFjY2Vzc29yKFwiUmVjdGFuZ2xlQ2xpcC55XCIsIHtcbiAgICAgICAgXCJnZXRcIjogKCkgPT4gdGhpcy55LFxuICAgICAgICBcInNldFwiOiAodikgPT4gdGhpcy55ID0gdixcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLnggPSAwO1xuICAgICAgdGhpcy55ID0gMDtcbiAgICAgIHRoaXMud2lkdGggPSB0aGlzLnRhcmdldC53aWR0aDtcbiAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy50YXJnZXQuaGVpZ2h0O1xuXG4gICAgICB0aGlzLnRhcmdldC5jbGlwID0gKGMpID0+IHRoaXMuX2NsaXAoYyk7XG4gICAgfSk7XG4gIH0sXG5cbiAgX2NsaXA6IGZ1bmN0aW9uKGNhbnZhcykge1xuICAgIGNvbnN0IHggPSB0aGlzLnggLSAodGhpcy53aWR0aCAqIHRoaXMudGFyZ2V0Lm9yaWdpblgpO1xuICAgIGNvbnN0IHkgPSB0aGlzLnkgLSAodGhpcy5oZWlnaHQgKiB0aGlzLnRhcmdldC5vcmlnaW5ZKTtcblxuICAgIGNhbnZhcy5iZWdpblBhdGgoKTtcbiAgICBjYW52YXMucmVjdCh4LCB5LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgY2FudmFzLmNsb3NlUGF0aCgpO1xuICB9LFxuXG4gIHNldEVuYWJsZTogZnVuY3Rpb24oZW5hYmxlKSB7XG4gICAgdGhpcy5fZW5hYmxlID0gZW5hYmxlO1xuICAgIGlmICh0aGlzLl9lbmFibGUpIHtcbiAgICAgIHRoaXMudGFyZ2V0LmNsaXAgPSAoYykgPT4gdGhpcy5fY2xpcChjKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy50YXJnZXQuY2xpcCA9IG51bGw7XG4gICAgfVxuICB9LFxuXG4gIF9hY2Nlc3Nvcjoge1xuICAgIGVuYWJsZToge1xuICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XG4gICAgICAgIHRoaXMuc2V0RW5hYmxlKHYpO1xuICAgICAgfSxcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbmFibGU7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG59KTtcbiIsInBoaW5hLmRlZmluZShcIlRvZ2dsZVwiLCB7XG4gIHN1cGVyQ2xhc3M6IFwiQWNjZXNzb3J5XCIsXG5cbiAgaW5pdDogZnVuY3Rpb24oaXNPbikge1xuICAgIHRoaXMuc3VwZXJJbml0KCk7XG4gICAgdGhpcy5faW5pdChpc09uKTtcbiAgfSxcblxuICBfaW5pdDogZnVuY3Rpb24oaXNPbikge1xuICAgIHRoaXMuaXNPbiA9IGlzT24gfHwgZmFsc2U7XG4gIH0sXG5cbiAgc2V0U3RhdHVzOiBmdW5jdGlvbihzdGF0dXMpIHtcbiAgICB0aGlzLmlzT24gPSBzdGF0dXM7XG4gICAgdGhpcy50YXJnZXQuZmxhcmUoKHRoaXMuaXNPbikgPyBcInN3aXRjaE9uXCIgOiBcInN3aXRjaE9mZlwiKTtcbiAgfSxcblxuICBzd2l0Y2hPbjogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuaXNPbikgcmV0dXJuO1xuICAgIHRoaXMuc2V0U3RhdHVzKHRydWUpO1xuICB9LFxuXG4gIHN3aXRjaE9mZjogZnVuY3Rpb24oKSB7XG4gICAgaWYgKCF0aGlzLmlzT24pIHJldHVybjtcbiAgICB0aGlzLnNldFN0YXR1cyhmYWxzZSk7XG4gIH0sXG5cbiAgc3dpdGNoOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmlzT24gPSAhdGhpcy5pc09uO1xuICAgIHRoaXMuc2V0U3RhdHVzKHRoaXMuaXNPbik7XG4gIH0sXG5cbiAgX2FjY2Vzc29yOiB7XG4gICAgc3RhdHVzOiB7XG4gICAgICBcImdldFwiOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNPbjtcbiAgICAgIH0sXG4gICAgICBcInNldFwiOiBmdW5jdGlvbih2KSB7XG4gICAgICAgIHJldHVybiBzZXRTdGF0dXModik7XG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG5cbn0pO1xuIiwicGhpbmEuYXNzZXQuQXNzZXRMb2FkZXIucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbihwYXJhbXMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB2YXIgbG9hZEFzc2V0cyA9IFtdO1xuICB2YXIgY291bnRlciA9IDA7XG4gIHZhciBsZW5ndGggPSAwO1xuICB2YXIgbWF4Q29ubmVjdGlvbkNvdW50ID0gMjtcblxuICBwYXJhbXMuZm9ySW4oZnVuY3Rpb24odHlwZSwgYXNzZXRzKSB7XG4gICAgbGVuZ3RoICs9IE9iamVjdC5rZXlzKGFzc2V0cykubGVuZ3RoO1xuICB9KTtcblxuICBpZiAobGVuZ3RoID09IDApIHtcbiAgICByZXR1cm4gcGhpbmEudXRpbC5GbG93LnJlc29sdmUoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5mbGFyZSgnbG9hZCcpO1xuICAgIH0pO1xuICB9XG5cbiAgcGFyYW1zLmZvckluKGZ1bmN0aW9uKHR5cGUsIGFzc2V0cykge1xuICAgIGFzc2V0cy5mb3JJbihmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICBsb2FkQXNzZXRzLnB1c2goe1xuICAgICAgICBcImZ1bmNcIjogcGhpbmEuYXNzZXQuQXNzZXRMb2FkZXIuYXNzZXRMb2FkRnVuY3Rpb25zW3R5cGVdLFxuICAgICAgICBcImtleVwiOiBrZXksXG4gICAgICAgIFwidmFsdWVcIjogdmFsdWUsXG4gICAgICAgIFwidHlwZVwiOiB0eXBlLFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGlmIChzZWxmLmNhY2hlKSB7XG4gICAgc2VsZi5vbigncHJvZ3Jlc3MnLCBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoZS5wcm9ncmVzcyA+PSAxLjApIHtcbiAgICAgICAgcGFyYW1zLmZvckluKGZ1bmN0aW9uKHR5cGUsIGFzc2V0cykge1xuICAgICAgICAgIGFzc2V0cy5mb3JJbihmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgYXNzZXQgPSBwaGluYS5hc3NldC5Bc3NldE1hbmFnZXIuZ2V0KHR5cGUsIGtleSk7XG4gICAgICAgICAgICBpZiAoYXNzZXQubG9hZEVycm9yKSB7XG4gICAgICAgICAgICAgIHZhciBkdW1teSA9IHBoaW5hLmFzc2V0LkFzc2V0TWFuYWdlci5nZXQodHlwZSwgJ2R1bW15Jyk7XG4gICAgICAgICAgICAgIGlmIChkdW1teSkge1xuICAgICAgICAgICAgICAgIGlmIChkdW1teS5sb2FkRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgIGR1bW15LmxvYWREdW1teSgpO1xuICAgICAgICAgICAgICAgICAgZHVtbXkubG9hZEVycm9yID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBoaW5hLmFzc2V0LkFzc2V0TWFuYWdlci5zZXQodHlwZSwga2V5LCBkdW1teSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXNzZXQubG9hZER1bW15KCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICB2YXIgbG9hZEFzc2V0c0FycmF5ID0gW107XG5cbiAgd2hpbGUgKGxvYWRBc3NldHMubGVuZ3RoID4gMCkge1xuICAgIGxvYWRBc3NldHNBcnJheS5wdXNoKGxvYWRBc3NldHMuc3BsaWNlKDAsIG1heENvbm5lY3Rpb25Db3VudCkpO1xuICB9XG5cbiAgdmFyIGZsb3cgPSBwaGluYS51dGlsLkZsb3cucmVzb2x2ZSgpO1xuXG4gIGxvYWRBc3NldHNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGxvYWRBc3NldHMpIHtcbiAgICBmbG93ID0gZmxvdy50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGZsb3dzID0gW107XG4gICAgICBsb2FkQXNzZXRzLmZvckVhY2goZnVuY3Rpb24obG9hZEFzc2V0KSB7XG4gICAgICAgIHZhciBmID0gbG9hZEFzc2V0LmZ1bmMobG9hZEFzc2V0LmtleSwgbG9hZEFzc2V0LnZhbHVlKTtcbiAgICAgICAgZi50aGVuKGZ1bmN0aW9uKGFzc2V0KSB7XG4gICAgICAgICAgaWYgKHNlbGYuY2FjaGUpIHtcbiAgICAgICAgICAgIHBoaW5hLmFzc2V0LkFzc2V0TWFuYWdlci5zZXQobG9hZEFzc2V0LnR5cGUsIGxvYWRBc3NldC5rZXksIGFzc2V0KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc2VsZi5mbGFyZSgncHJvZ3Jlc3MnLCB7XG4gICAgICAgICAgICBrZXk6IGxvYWRBc3NldC5rZXksXG4gICAgICAgICAgICBhc3NldDogYXNzZXQsXG4gICAgICAgICAgICBwcm9ncmVzczogKCsrY291bnRlciAvIGxlbmd0aCksXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBmbG93cy5wdXNoKGYpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gcGhpbmEudXRpbC5GbG93LmFsbChmbG93cyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiBmbG93LnRoZW4oZnVuY3Rpb24oYXJncykge1xuICAgIHNlbGYuZmxhcmUoJ2xvYWQnKTtcbiAgfSk7XG59XG4iLCJwaGluYS5uYW1lc3BhY2UoZnVuY3Rpb24oKSB7XG5cbiAgcGhpbmEuYXBwLkJhc2VBcHAucHJvdG90eXBlLiRtZXRob2QoXCJyZXBsYWNlU2NlbmVcIiwgZnVuY3Rpb24oc2NlbmUpIHtcbiAgICB0aGlzLmZsYXJlKCdyZXBsYWNlJyk7XG4gICAgdGhpcy5mbGFyZSgnY2hhbmdlc2NlbmUnKTtcblxuICAgIHdoaWxlICh0aGlzLl9zY2VuZXMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3Qgc2NlbmUgPSB0aGlzLl9zY2VuZXMucG9wKCk7XG4gICAgICBzY2VuZS5mbGFyZShcImRlc3Ryb3lcIik7XG4gICAgfVxuXG4gICAgdGhpcy5fc2NlbmVJbmRleCA9IDA7XG5cbiAgICBpZiAodGhpcy5jdXJyZW50U2NlbmUpIHtcbiAgICAgIHRoaXMuY3VycmVudFNjZW5lLmFwcCA9IG51bGw7XG4gICAgfVxuXG4gICAgdGhpcy5jdXJyZW50U2NlbmUgPSBzY2VuZTtcbiAgICB0aGlzLmN1cnJlbnRTY2VuZS5hcHAgPSB0aGlzO1xuICAgIHRoaXMuY3VycmVudFNjZW5lLmZsYXJlKCdlbnRlcicsIHtcbiAgICAgIGFwcDogdGhpcyxcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9KTtcblxuICBwaGluYS5hcHAuQmFzZUFwcC5wcm90b3R5cGUuJG1ldGhvZChcInBvcFNjZW5lXCIsIGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZmxhcmUoJ3BvcCcpO1xuICAgIHRoaXMuZmxhcmUoJ2NoYW5nZXNjZW5lJyk7XG5cbiAgICB2YXIgc2NlbmUgPSB0aGlzLl9zY2VuZXMucG9wKCk7XG4gICAgLS10aGlzLl9zY2VuZUluZGV4O1xuXG4gICAgc2NlbmUuZmxhcmUoJ2V4aXQnLCB7XG4gICAgICBhcHA6IHRoaXMsXG4gICAgfSk7XG4gICAgc2NlbmUuZmxhcmUoJ2Rlc3Ryb3knKTtcbiAgICBzY2VuZS5hcHAgPSBudWxsO1xuXG4gICAgdGhpcy5mbGFyZSgncG9wZWQnKTtcblxuICAgIC8vIFxuICAgIHRoaXMuY3VycmVudFNjZW5lLmZsYXJlKCdyZXN1bWUnLCB7XG4gICAgICBhcHA6IHRoaXMsXG4gICAgICBwcmV2U2NlbmU6IHNjZW5lLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNjZW5lO1xuICB9KTtcblxufSk7XG4iLCJwaGluYS5uYW1lc3BhY2UoZnVuY3Rpb24oKSB7XG5cbiAgcGhpbmEuZ3JhcGhpY3MuQ2FudmFzLnByb3RvdHlwZS4kbWV0aG9kKFwiaW5pdFwiLCBmdW5jdGlvbihjYW52YXMpIHtcbiAgICB0aGlzLmlzQ3JlYXRlQ2FudmFzID0gZmFsc2U7XG4gICAgaWYgKHR5cGVvZiBjYW52YXMgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoY2FudmFzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGNhbnZhcykge1xuICAgICAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIHRoaXMuaXNDcmVhdGVDYW52YXMgPSB0cnVlO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnIyMjIyBjcmVhdGUgY2FudmFzICMjIyMnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmRvbUVsZW1lbnQgPSB0aGlzLmNhbnZhcztcbiAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIHRoaXMuY29udGV4dC5saW5lQ2FwID0gJ3JvdW5kJztcbiAgICB0aGlzLmNvbnRleHQubGluZUpvaW4gPSAncm91bmQnO1xuICB9KTtcblxuICBwaGluYS5ncmFwaGljcy5DYW52YXMucHJvdG90eXBlLiRtZXRob2QoJ2Rlc3Ryb3knLCBmdW5jdGlvbihjYW52YXMpIHtcbiAgICBpZiAoIXRoaXMuaXNDcmVhdGVDYW52YXMpIHJldHVybjtcbiAgICAvLyBjb25zb2xlLmxvZyhgIyMjIyBkZWxldGUgY2FudmFzICR7dGhpcy5jYW52YXMud2lkdGh9IHggJHt0aGlzLmNhbnZhcy5oZWlnaHR9ICMjIyNgKTtcbiAgICB0aGlzLnNldFNpemUoMCwgMCk7XG4gICAgZGVsZXRlIHRoaXMuY2FudmFzO1xuICAgIGRlbGV0ZSB0aGlzLmRvbUVsZW1lbnQ7XG4gIH0pO1xuXG59KTtcbiIsInBoaW5hLm5hbWVzcGFjZSgoKSA9PiB7XG5cbiAgdmFyIHF1YWxpdHlTY2FsZSA9IHBoaW5hLmdlb20uTWF0cml4MzMoKTtcblxuICBwaGluYS5kaXNwbGF5LkNhbnZhc1JlbmRlcmVyLnByb3RvdHlwZS4kbWV0aG9kKFwicmVuZGVyXCIsIGZ1bmN0aW9uKHNjZW5lLCBxdWFsaXR5KSB7XG4gICAgdGhpcy5jYW52YXMuY2xlYXIoKTtcbiAgICBpZiAoc2NlbmUuYmFja2dyb3VuZENvbG9yKSB7XG4gICAgICB0aGlzLmNhbnZhcy5jbGVhckNvbG9yKHNjZW5lLmJhY2tncm91bmRDb2xvcik7XG4gICAgfVxuXG4gICAgdGhpcy5fY29udGV4dC5zYXZlKCk7XG4gICAgdGhpcy5yZW5kZXJDaGlsZHJlbihzY2VuZSwgcXVhbGl0eSk7XG4gICAgdGhpcy5fY29udGV4dC5yZXN0b3JlKCk7XG4gIH0pO1xuXG4gIHBoaW5hLmRpc3BsYXkuQ2FudmFzUmVuZGVyZXIucHJvdG90eXBlLiRtZXRob2QoXCJyZW5kZXJDaGlsZHJlblwiLCBmdW5jdGlvbihvYmosIHF1YWxpdHkpIHtcbiAgICAvLyDlrZDkvpvjgZ/jgaHjgoLlrp/ooYxcbiAgICBpZiAob2JqLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgIHZhciB0ZW1wQ2hpbGRyZW4gPSBvYmouY2hpbGRyZW4uc2xpY2UoKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0ZW1wQ2hpbGRyZW4ubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJPYmplY3QodGVtcENoaWxkcmVuW2ldLCBxdWFsaXR5KTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIHBoaW5hLmRpc3BsYXkuQ2FudmFzUmVuZGVyZXIucHJvdG90eXBlLiRtZXRob2QoXCJyZW5kZXJPYmplY3RcIiwgZnVuY3Rpb24ob2JqLCBxdWFsaXR5KSB7XG4gICAgaWYgKG9iai52aXNpYmxlID09PSBmYWxzZSAmJiAhb2JqLmludGVyYWN0aXZlKSByZXR1cm47XG5cbiAgICBvYmouX2NhbGNXb3JsZE1hdHJpeCAmJiBvYmouX2NhbGNXb3JsZE1hdHJpeCgpO1xuXG4gICAgaWYgKG9iai52aXNpYmxlID09PSBmYWxzZSkgcmV0dXJuO1xuXG4gICAgb2JqLl9jYWxjV29ybGRBbHBoYSAmJiBvYmouX2NhbGNXb3JsZEFscGhhKCk7XG5cbiAgICB2YXIgY29udGV4dCA9IHRoaXMuY2FudmFzLmNvbnRleHQ7XG5cbiAgICBjb250ZXh0Lmdsb2JhbEFscGhhID0gb2JqLl93b3JsZEFscGhhO1xuICAgIGNvbnRleHQuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gb2JqLmJsZW5kTW9kZTtcblxuICAgIGlmIChvYmouX3dvcmxkTWF0cml4KSB7XG5cbiAgICAgIHF1YWxpdHlTY2FsZS5pZGVudGl0eSgpO1xuXG4gICAgICBxdWFsaXR5U2NhbGUubTAwID0gcXVhbGl0eSB8fCAxLjA7XG4gICAgICBxdWFsaXR5U2NhbGUubTExID0gcXVhbGl0eSB8fCAxLjA7XG5cbiAgICAgIHZhciBtID0gcXVhbGl0eVNjYWxlLm11bHRpcGx5KG9iai5fd29ybGRNYXRyaXgpO1xuICAgICAgY29udGV4dC5zZXRUcmFuc2Zvcm0obS5tMDAsIG0ubTEwLCBtLm0wMSwgbS5tMTEsIG0ubTAyLCBtLm0xMik7XG5cbiAgICB9XG5cbiAgICBpZiAob2JqLmNsaXApIHtcblxuICAgICAgY29udGV4dC5zYXZlKCk7XG5cbiAgICAgIG9iai5jbGlwKHRoaXMuY2FudmFzKTtcbiAgICAgIGNvbnRleHQuY2xpcCgpO1xuXG4gICAgICBpZiAob2JqLmRyYXcpIG9iai5kcmF3KHRoaXMuY2FudmFzKTtcblxuICAgICAgLy8g5a2Q5L6b44Gf44Gh44KC5a6f6KGMXG4gICAgICBpZiAob2JqLnJlbmRlckNoaWxkQnlTZWxmID09PSBmYWxzZSAmJiBvYmouY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgdGVtcENoaWxkcmVuID0gb2JqLmNoaWxkcmVuLnNsaWNlKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0ZW1wQ2hpbGRyZW4ubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgICB0aGlzLnJlbmRlck9iamVjdCh0ZW1wQ2hpbGRyZW5baV0sIHF1YWxpdHkpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnRleHQucmVzdG9yZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAob2JqLmRyYXcpIG9iai5kcmF3KHRoaXMuY2FudmFzKTtcblxuICAgICAgLy8g5a2Q5L6b44Gf44Gh44KC5a6f6KGMXG4gICAgICBpZiAob2JqLnJlbmRlckNoaWxkQnlTZWxmID09PSBmYWxzZSAmJiBvYmouY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgdGVtcENoaWxkcmVuID0gb2JqLmNoaWxkcmVuLnNsaWNlKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0ZW1wQ2hpbGRyZW4ubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgICB0aGlzLnJlbmRlck9iamVjdCh0ZW1wQ2hpbGRyZW5baV0sIHF1YWxpdHkpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICB9XG4gIH0pO1xuXG59KTtcbiIsInBoaW5hLm5hbWVzcGFjZSgoKSA9PiB7XG4gIC8v44Om44O844K244O844Ko44O844K444Kn44Oz44OI44GL44KJ44OW44Op44Km44K244K/44Kk44OX44Gu5Yik5Yil44KS6KGM44GGXG4gIHBoaW5hLiRtZXRob2QoJ2NoZWNrQnJvd3NlcicsIGZ1bmN0aW9uKCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGNvbnN0IGFnZW50ID0gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKTs7XG5cbiAgICByZXN1bHQuaXNDaHJvbWUgPSAoYWdlbnQuaW5kZXhPZignY2hyb21lJykgIT09IC0xKSAmJiAoYWdlbnQuaW5kZXhPZignZWRnZScpID09PSAtMSkgJiYgKGFnZW50LmluZGV4T2YoJ29wcicpID09PSAtMSk7XG4gICAgcmVzdWx0LmlzRWRnZSA9IChhZ2VudC5pbmRleE9mKCdlZGdlJykgIT09IC0xKTtcbiAgICByZXN1bHQuaXNJZTExID0gKGFnZW50LmluZGV4T2YoJ3RyaWRlbnQvNycpICE9PSAtMSk7XG4gICAgcmVzdWx0LmlzRmlyZWZveCA9IChhZ2VudC5pbmRleE9mKCdmaXJlZm94JykgIT09IC0xKTtcbiAgICByZXN1bHQuaXNTYWZhcmkgPSAoYWdlbnQuaW5kZXhPZignc2FmYXJpJykgIT09IC0xKSAmJiAoYWdlbnQuaW5kZXhPZignY2hyb21lJykgPT09IC0xKTtcbiAgICByZXN1bHQuaXNFbGVjdHJvbiA9IChhZ2VudC5pbmRleE9mKCdlbGVjdHJvbicpICE9PSAtMSk7XG5cbiAgICByZXN1bHQuaXNXaW5kb3dzID0gKGFnZW50LmluZGV4T2YoJ3dpbmRvd3MnKSAhPT0gLTEpO1xuICAgIHJlc3VsdC5pc01hYyA9IChhZ2VudC5pbmRleE9mKCdtYWMgb3MgeCcpICE9PSAtMSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9KTtcbn0pO1xuIiwiLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gIEV4dGVuc2lvbiBwaGluYS5kaXNwbGF5LkRpc3BsYXlFbGVtZW50XG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5waGluYS5uYW1lc3BhY2UoKCkgPT4ge1xuICBwaGluYS5kaXNwbGF5LkRpc3BsYXlFbGVtZW50LnByb3RvdHlwZS4kbWV0aG9kKFwiZW5hYmxlXCIsIGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2hvdygpLndha2VVcCgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9KTtcblxuICBwaGluYS5kaXNwbGF5LkRpc3BsYXlFbGVtZW50LnByb3RvdHlwZS4kbWV0aG9kKFwiZGlzYWJsZVwiLCBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmhpZGUoKS5zbGVlcCgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9KTtcbn0pO1xuIiwicGhpbmEubmFtZXNwYWNlKCgpID0+IHtcbiAgcGhpbmEuZGlzcGxheS5EaXNwbGF5U2NlbmUucXVhbGl0eSA9IDEuMDtcbiAgcGhpbmEuZGlzcGxheS5EaXNwbGF5U2NlbmUucHJvdG90eXBlLiRtZXRob2QoXCJpbml0XCIsIGZ1bmN0aW9uKHBhcmFtcykge1xuICAgIHRoaXMuc3VwZXJJbml0KCk7XG4gICAgdmFyIHF1YWxpdHkgPSBwaGluYS5kaXNwbGF5LkRpc3BsYXlTY2VuZS5xdWFsaXR5O1xuXG4gICAgcGFyYW1zID0gKHt9KS4kc2FmZShwYXJhbXMsIHBoaW5hLmRpc3BsYXkuRGlzcGxheVNjZW5lLmRlZmF1bHRzKTtcbiAgICB0aGlzLmNhbnZhcyA9IHBoaW5hLmdyYXBoaWNzLkNhbnZhcygpO1xuICAgIHRoaXMuY2FudmFzLnNldFNpemUocGFyYW1zLndpZHRoICogcXVhbGl0eSwgcGFyYW1zLmhlaWdodCAqIHF1YWxpdHkpO1xuICAgIHRoaXMucmVuZGVyZXIgPSBwaGluYS5kaXNwbGF5LkNhbnZhc1JlbmRlcmVyKHRoaXMuY2FudmFzKTtcbiAgICB0aGlzLmJhY2tncm91bmRDb2xvciA9IChwYXJhbXMuYmFja2dyb3VuZENvbG9yKSA/IHBhcmFtcy5iYWNrZ3JvdW5kQ29sb3IgOiBudWxsO1xuXG4gICAgdGhpcy53aWR0aCA9IHBhcmFtcy53aWR0aDtcbiAgICB0aGlzLmhlaWdodCA9IHBhcmFtcy5oZWlnaHQ7XG4gICAgdGhpcy5ncmlkWCA9IHBoaW5hLnV0aWwuR3JpZChwYXJhbXMud2lkdGgsIDE2KTtcbiAgICB0aGlzLmdyaWRZID0gcGhpbmEudXRpbC5HcmlkKHBhcmFtcy5oZWlnaHQsIDE2KTtcblxuICAgIHRoaXMuaW50ZXJhY3RpdmUgPSB0cnVlO1xuICAgIHRoaXMuc2V0SW50ZXJhY3RpdmUgPSBmdW5jdGlvbihmbGFnKSB7XG4gICAgICB0aGlzLmludGVyYWN0aXZlID0gZmxhZztcbiAgICB9O1xuICAgIHRoaXMuX292ZXJGbGFncyA9IHt9O1xuICAgIHRoaXMuX3RvdWNoRmxhZ3MgPSB7fTtcbiAgfSk7XG5cbn0pO1xuIiwicGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xyXG5cclxuICAvLyBhdWRpb+imgee0oOOBp+mfs+WjsOOCkuWGjeeUn+OBmeOCi+OAguS4u+OBq0lF55SoXHJcbiAgcGhpbmEuZGVmaW5lKFwicGhpbmEuYXNzZXQuRG9tQXVkaW9Tb3VuZFwiLCB7XHJcbiAgICBzdXBlckNsYXNzOiBcInBoaW5hLmFzc2V0LkFzc2V0XCIsXHJcblxyXG4gICAgZG9tRWxlbWVudDogbnVsbCxcclxuICAgIGVtcHR5U291bmQ6IGZhbHNlLFxyXG5cclxuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnN1cGVySW5pdCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfbG9hZDogZnVuY3Rpb24ocmVzb2x2ZSkge1xyXG4gICAgICB0aGlzLmRvbUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYXVkaW9cIik7XHJcbiAgICAgIGlmICh0aGlzLmRvbUVsZW1lbnQuY2FuUGxheVR5cGUoXCJhdWRpby9tcGVnXCIpKSB7XHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiByZWFkeXN0YXRlQ2hlY2soKSB7XHJcbiAgICAgICAgICBpZiAodGhpcy5kb21FbGVtZW50LnJlYWR5U3RhdGUgPCA0KSB7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQocmVhZHlzdGF0ZUNoZWNrLmJpbmQodGhpcyksIDEwKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW1wdHlTb3VuZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImVuZCBsb2FkIFwiLCB0aGlzLnNyYyk7XHJcbiAgICAgICAgICAgIHJlc29sdmUodGhpcylcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LmJpbmQodGhpcyksIDEwKTtcclxuICAgICAgICB0aGlzLmRvbUVsZW1lbnQub25lcnJvciA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLjgqrjg7zjg4fjgqPjgqrjga7jg63jg7zjg4njgavlpLHmlZdcIiwgZSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLmRvbUVsZW1lbnQuc3JjID0gdGhpcy5zcmM7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJiZWdpbiBsb2FkIFwiLCB0aGlzLnNyYyk7XHJcbiAgICAgICAgdGhpcy5kb21FbGVtZW50LmxvYWQoKTtcclxuICAgICAgICB0aGlzLmRvbUVsZW1lbnQuYXV0b3BsYXkgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImVuZGVkXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgdGhpcy5mbGFyZShcImVuZGVkXCIpO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJtcDPjga/lho3nlJ/jgafjgY3jgb7jgZvjgpNcIik7XHJcbiAgICAgICAgdGhpcy5lbXB0eVNvdW5kID0gdHJ1ZTtcclxuICAgICAgICByZXNvbHZlKHRoaXMpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHBsYXk6IGZ1bmN0aW9uKCkge1xyXG4gICAgICBpZiAodGhpcy5lbXB0eVNvdW5kKSByZXR1cm47XHJcbiAgICAgIHRoaXMuZG9tRWxlbWVudC5wYXVzZSgpO1xyXG4gICAgICB0aGlzLmRvbUVsZW1lbnQuY3VycmVudFRpbWUgPSAwO1xyXG4gICAgICB0aGlzLmRvbUVsZW1lbnQucGxheSgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzdG9wOiBmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKHRoaXMuZW1wdHlTb3VuZCkgcmV0dXJuO1xyXG4gICAgICB0aGlzLmRvbUVsZW1lbnQucGF1c2UoKTtcclxuICAgICAgdGhpcy5kb21FbGVtZW50LmN1cnJlbnRUaW1lID0gMDtcclxuICAgIH0sXHJcblxyXG4gICAgcGF1c2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgICBpZiAodGhpcy5lbXB0eVNvdW5kKSByZXR1cm47XHJcbiAgICAgIHRoaXMuZG9tRWxlbWVudC5wYXVzZSgpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZXN1bWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICBpZiAodGhpcy5lbXB0eVNvdW5kKSByZXR1cm47XHJcbiAgICAgIHRoaXMuZG9tRWxlbWVudC5wbGF5KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldExvb3A6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgaWYgKHRoaXMuZW1wdHlTb3VuZCkgcmV0dXJuO1xyXG4gICAgICB0aGlzLmRvbUVsZW1lbnQubG9vcCA9IHY7XHJcbiAgICB9LFxyXG5cclxuICAgIF9hY2Nlc3Nvcjoge1xyXG4gICAgICB2b2x1bWU6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgaWYgKHRoaXMuZW1wdHlTb3VuZCkgcmV0dXJuIDA7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5kb21FbGVtZW50LnZvbHVtZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24odikge1xyXG4gICAgICAgICAgaWYgKHRoaXMuZW1wdHlTb3VuZCkgcmV0dXJuO1xyXG4gICAgICAgICAgdGhpcy5kb21FbGVtZW50LnZvbHVtZSA9IHY7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgbG9vcDoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBpZiAodGhpcy5lbXB0eVNvdW5kKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5kb21FbGVtZW50Lmxvb3A7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgIGlmICh0aGlzLmVtcHR5U291bmQpIHJldHVybjtcclxuICAgICAgICAgIHRoaXMuc2V0TG9vcCh2KTtcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG5cclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIC8vIElFMTHjga7loLTlkIjjga7jgb/pn7Plo7DjgqLjgrvjg4Pjg4jjga9Eb21BdWRpb1NvdW5k44Gn5YaN55Sf44GZ44KLXHJcbiAgdmFyIHVhID0gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKTtcclxuICBpZiAodWEuaW5kZXhPZigndHJpZGVudC83JykgIT09IC0xKSB7XHJcbiAgICBwaGluYS5hc3NldC5Bc3NldExvYWRlci5yZWdpc3RlcihcInNvdW5kXCIsIGZ1bmN0aW9uKGtleSwgcGF0aCkge1xyXG4gICAgICB2YXIgYXNzZXQgPSBwaGluYS5hc3NldC5Eb21BdWRpb1NvdW5kKCk7XHJcbiAgICAgIHJldHVybiBhc3NldC5sb2FkKHBhdGgpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxufSk7XHJcbiIsInBoaW5hLm5hbWVzcGFjZSgoKSA9PiB7XG5cbiAgcGhpbmEuYXBwLkVsZW1lbnQucHJvdG90eXBlLiRtZXRob2QoXCJmaW5kQnlJZFwiLCBmdW5jdGlvbihpZCkge1xuICAgIGlmICh0aGlzLmlkID09PSBpZCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodGhpcy5jaGlsZHJlbltpXS5maW5kQnlJZChpZCkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5jaGlsZHJlbltpXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9KTtcblxuICAvL+aMh+WumuOBleOCjOOBn+WtkOOCquODluOCuOOCp+OCr+ODiOOCkuacgOWJjemdouOBq+enu+WLleOBmeOCi1xuICBwaGluYS5hcHAuRWxlbWVudC5wcm90b3R5cGUuJG1ldGhvZChcIm1vdmVGcm9udFwiLCBmdW5jdGlvbihjaGlsZCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMuY2hpbGRyZW5baV0gPT0gY2hpbGQpIHtcbiAgICAgICAgdGhpcy5jaGlsZHJlbi5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmNoaWxkcmVuLnB1c2goY2hpbGQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9KTtcblxuICBwaGluYS5hcHAuRWxlbWVudC5wcm90b3R5cGUuJG1ldGhvZChcImRlc3Ryb3lDaGlsZFwiLCBmdW5jdGlvbigpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuY2hpbGRyZW5baV0uZmxhcmUoJ2Rlc3Ryb3knKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0pO1xuXG59KTtcbiIsInBoaW5hLm5hbWVzcGFjZSgoKSA9PiB7XG5cbiAgcGhpbmEuaW5wdXQuSW5wdXQucXVhbGl0eSA9IDEuMDtcblxuICBwaGluYS5pbnB1dC5JbnB1dC5wcm90b3R5cGUuJG1ldGhvZChcIl9tb3ZlXCIsIGZ1bmN0aW9uKHgsIHkpIHtcbiAgICB0aGlzLl90ZW1wUG9zaXRpb24ueCA9IHg7XG4gICAgdGhpcy5fdGVtcFBvc2l0aW9uLnkgPSB5O1xuXG4gICAgLy8gYWRqdXN0IHNjYWxlXG4gICAgdmFyIGVsbSA9IHRoaXMuZG9tRWxlbWVudDtcbiAgICB2YXIgcmVjdCA9IGVsbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIHZhciB3ID0gZWxtLndpZHRoIC8gcGhpbmEuaW5wdXQuSW5wdXQucXVhbGl0eTtcbiAgICB2YXIgaCA9IGVsbS5oZWlnaHQgLyBwaGluYS5pbnB1dC5JbnB1dC5xdWFsaXR5O1xuXG4gICAgaWYgKHJlY3Qud2lkdGgpIHtcbiAgICAgIHRoaXMuX3RlbXBQb3NpdGlvbi54ICo9IHcgLyByZWN0LndpZHRoO1xuICAgIH1cblxuICAgIGlmIChyZWN0LmhlaWdodCkge1xuICAgICAgdGhpcy5fdGVtcFBvc2l0aW9uLnkgKj0gaCAvIHJlY3QuaGVpZ2h0O1xuICAgIH1cblxuICB9KTtcblxufSk7XG4iLCJwaGluYS5uYW1lc3BhY2UoKCkgPT4ge1xuICBwaGluYS5kaXNwbGF5LkxhYmVsLnByb3RvdHlwZS4kbWV0aG9kKFwiaW5pdFwiLCBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgaWYgKHR5cGVvZiBhcmd1bWVudHNbMF0gIT09ICdvYmplY3QnKSB7XG4gICAgICBvcHRpb25zID0geyB0ZXh0OiBhcmd1bWVudHNbMF0sIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdGlvbnMgPSBhcmd1bWVudHNbMF07XG4gICAgfVxuXG4gICAgb3B0aW9ucyA9ICh7fSkuJHNhZmUob3B0aW9ucywgcGhpbmEuZGlzcGxheS5MYWJlbC5kZWZhdWx0cyk7XG4gICAgdGhpcy5zdXBlckluaXQob3B0aW9ucyk7XG5cbiAgICB0aGlzLnRleHQgPSAob3B0aW9ucy50ZXh0KSA/IG9wdGlvbnMudGV4dCA6IFwiXCI7XG4gICAgdGhpcy5mb250U2l6ZSA9IG9wdGlvbnMuZm9udFNpemU7XG4gICAgdGhpcy5mb250V2VpZ2h0ID0gb3B0aW9ucy5mb250V2VpZ2h0O1xuICAgIHRoaXMuZm9udEZhbWlseSA9IG9wdGlvbnMuZm9udEZhbWlseTtcbiAgICB0aGlzLmFsaWduID0gb3B0aW9ucy5hbGlnbjtcbiAgICB0aGlzLmJhc2VsaW5lID0gb3B0aW9ucy5iYXNlbGluZTtcbiAgICB0aGlzLmxpbmVIZWlnaHQgPSBvcHRpb25zLmxpbmVIZWlnaHQ7XG4gIH0pO1xuXG59KTtcbiIsInBoaW5hLm5hbWVzcGFjZSgoKSA9PiB7XG4gIHBoaW5hLmlucHV0Lk1vdXNlLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24oZG9tRWxlbWVudCkge1xuICAgIHRoaXMuc3VwZXJJbml0KGRvbUVsZW1lbnQpO1xuXG4gICAgdGhpcy5pZCA9IDA7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5kb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHNlbGYuX3N0YXJ0KGUucG9pbnRYLCBlLnBvaW50WSwgMSA8PCBlLmJ1dHRvbik7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5kb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBmdW5jdGlvbihlKSB7XG4gICAgICBzZWxmLl9lbmQoMSA8PCBlLmJ1dHRvbik7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0pO1xuICAgIHRoaXMuZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBmdW5jdGlvbihlKSB7XG4gICAgICBzZWxmLl9tb3ZlKGUucG9pbnRYLCBlLnBvaW50WSk7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0pO1xuXG4gICAgLy8g44Oe44Km44K544GM44Kt44Oj44Oz44OQ44K56KaB57Sg44Gu5aSW44Gr5Ye644Gf5aC05ZCI44Gu5a++5b+cXG4gICAgdGhpcy5kb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3V0JywgZnVuY3Rpb24oZSkge1xuICAgICAgc2VsZi5fZW5kKDEpO1xuICAgIH0pO1xuICB9XG59KTtcbiIsIi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vICBFeHRlbnNpb24gcGhpbmEuYXBwLk9iamVjdDJEXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbnBoaW5hLm5hbWVzcGFjZSgoKSA9PiB7XG4gIHBoaW5hLmFwcC5PYmplY3QyRC5wcm90b3R5cGUuJG1ldGhvZChcInNldE9yaWdpblwiLCBmdW5jdGlvbih4LCB5LCByZXBvc2l0aW9uKSB7XG4gICAgaWYgKCFyZXBvc2l0aW9uKSB7XG4gICAgICB0aGlzLm9yaWdpbi54ID0geDtcbiAgICAgIHRoaXMub3JpZ2luLnkgPSB5O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLy/lpInmm7TjgZXjgozjgZ/ln7rmupbngrnjgavnp7vli5XjgZXjgZvjgotcbiAgICBjb25zdCBfb3JpZ2luWCA9IHRoaXMub3JpZ2luWDtcbiAgICBjb25zdCBfb3JpZ2luWSA9IHRoaXMub3JpZ2luWTtcbiAgICBjb25zdCBfYWRkWCA9ICh4IC0gX29yaWdpblgpICogdGhpcy53aWR0aDtcbiAgICBjb25zdCBfYWRkWSA9ICh5IC0gX29yaWdpblkpICogdGhpcy5oZWlnaHQ7XG5cbiAgICB0aGlzLnggKz0gX2FkZFg7XG4gICAgdGhpcy55ICs9IF9hZGRZO1xuICAgIHRoaXMub3JpZ2luWCA9IHg7XG4gICAgdGhpcy5vcmlnaW5ZID0geTtcblxuICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaChjaGlsZCA9PiB7XG4gICAgICBjaGlsZC54IC09IF9hZGRYO1xuICAgICAgY2hpbGQueSAtPSBfYWRkWTtcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSk7XG5cbiAgcGhpbmEuYXBwLk9iamVjdDJELnByb3RvdHlwZS4kbWV0aG9kKFwiaGl0VGVzdEVsZW1lbnRcIiwgZnVuY3Rpb24oZWxtKSB7XG4gICAgY29uc3QgcmVjdDAgPSB0aGlzLmNhbGNHbG9iYWxSZWN0KCk7XG4gICAgY29uc3QgcmVjdDEgPSBlbG0uY2FsY0dsb2JhbFJlY3QoKTtcbiAgICByZXR1cm4gKHJlY3QwLmxlZnQgPCByZWN0MS5yaWdodCkgJiYgKHJlY3QwLnJpZ2h0ID4gcmVjdDEubGVmdCkgJiZcbiAgICAgIChyZWN0MC50b3AgPCByZWN0MS5ib3R0b20pICYmIChyZWN0MC5ib3R0b20gPiByZWN0MS50b3ApO1xuICB9KTtcblxuICBwaGluYS5hcHAuT2JqZWN0MkQucHJvdG90eXBlLiRtZXRob2QoXCJjYWxjR2xvYmFsUmVjdFwiLCBmdW5jdGlvbigpIHtcbiAgICBjb25zdCBsZWZ0ID0gdGhpcy5fd29ybGRNYXRyaXgubTAyIC0gdGhpcy5vcmlnaW5YICogdGhpcy53aWR0aDtcbiAgICBjb25zdCB0b3AgPSB0aGlzLl93b3JsZE1hdHJpeC5tMTIgLSB0aGlzLm9yaWdpblkgKiB0aGlzLmhlaWdodDtcbiAgICByZXR1cm4gUmVjdChsZWZ0LCB0b3AsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgfSk7XG5cbiAgcGhpbmEuYXBwLk9iamVjdDJELnByb3RvdHlwZS4kbWV0aG9kKFwiY2FsY0dsb2JhbFJlY3RcIiwgZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgbGVmdCA9IHRoaXMuX3dvcmxkTWF0cml4Lm0wMiAtIHRoaXMub3JpZ2luWCAqIHRoaXMud2lkdGg7XG4gICAgY29uc3QgdG9wID0gdGhpcy5fd29ybGRNYXRyaXgubTEyIC0gdGhpcy5vcmlnaW5ZICogdGhpcy5oZWlnaHQ7XG4gICAgcmV0dXJuIFJlY3QobGVmdCwgdG9wLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gIH0pO1xuXG59KTtcbiIsInBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcblxuICBwaGluYS5kaXNwbGF5LlBsYWluRWxlbWVudC5wcm90b3R5cGUuJG1ldGhvZChcImRlc3Ryb3lDYW52YXNcIiwgZnVuY3Rpb24oKSB7XG4gICAgaWYgKCF0aGlzLmNhbnZhcykgcmV0dXJuO1xuICAgIHRoaXMuY2FudmFzLmRlc3Ryb3koKTtcbiAgICBkZWxldGUgdGhpcy5jYW52YXM7XG4gIH0pO1xuXG59KTtcbiIsIi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vICBFeHRlbnNpb24gcGhpbmEuZGlzcGxheS5TaGFwZVxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxucGhpbmEuZGlzcGxheS5TaGFwZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oY2FudmFzKSB7XG4gIGlmICghY2FudmFzKSB7XG4gICAgY29uc29sZS5sb2coXCJjYW52YXMgbnVsbFwiKTtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIGNvbnRleHQgPSBjYW52YXMuY29udGV4dDtcbiAgLy8g44Oq44K144Kk44K6XG4gIHZhciBzaXplID0gdGhpcy5jYWxjQ2FudmFzU2l6ZSgpO1xuICBjYW52YXMuc2V0U2l6ZShzaXplLndpZHRoLCBzaXplLmhlaWdodCk7XG4gIC8vIOOCr+ODquOCouOCq+ODqeODvFxuICBjYW52YXMuY2xlYXJDb2xvcih0aGlzLmJhY2tncm91bmRDb2xvcik7XG4gIC8vIOS4reW/g+OBq+W6p+aomeOCkuenu+WLlVxuICBjYW52YXMudHJhbnNmb3JtQ2VudGVyKCk7XG5cbiAgLy8g5o+P55S75YmN5Yem55CGXG4gIHRoaXMucHJlcmVuZGVyKHRoaXMuY2FudmFzKTtcblxuICAvLyDjgrnjg4jjg63jg7zjgq/mj4/nlLtcbiAgaWYgKHRoaXMuaXNTdHJva2FibGUoKSkge1xuICAgIGNvbnRleHQuc3Ryb2tlU3R5bGUgPSB0aGlzLnN0cm9rZTtcbiAgICBjb250ZXh0LmxpbmVXaWR0aCA9IHRoaXMuc3Ryb2tlV2lkdGg7XG4gICAgY29udGV4dC5saW5lSm9pbiA9IFwicm91bmRcIjtcbiAgICBjb250ZXh0LnNoYWRvd0JsdXIgPSAwO1xuICAgIHRoaXMucmVuZGVyU3Ryb2tlKGNhbnZhcyk7XG4gIH1cblxuICAvLyDloZfjgorjgaTjgbbjgZfmj4/nlLtcbiAgaWYgKHRoaXMuZmlsbCkge1xuICAgIGNvbnRleHQuZmlsbFN0eWxlID0gdGhpcy5maWxsO1xuICAgIC8vIHNoYWRvdyDjga4gb24vb2ZmXG4gICAgaWYgKHRoaXMuc2hhZG93KSB7XG4gICAgICBjb250ZXh0LnNoYWRvd0NvbG9yID0gdGhpcy5zaGFkb3c7XG4gICAgICBjb250ZXh0LnNoYWRvd0JsdXIgPSB0aGlzLnNoYWRvd0JsdXI7XG4gICAgICBjb250ZXh0LnNoYWRvd09mZnNldFggPSB0aGlzLnNoYWRvd09mZnNldFggfHwgMDtcbiAgICAgIGNvbnRleHQuc2hhZG93T2Zmc2V0WSA9IHRoaXMuc2hhZG93T2Zmc2V0WSB8fCAwO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0LnNoYWRvd0JsdXIgPSAwO1xuICAgIH1cbiAgICB0aGlzLnJlbmRlckZpbGwoY2FudmFzKTtcbiAgfVxuXG4gIC8vIOaPj+eUu+W+jOWHpueQhlxuICB0aGlzLnBvc3RyZW5kZXIodGhpcy5jYW52YXMpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcbiIsInBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcblxuICBwaGluYS5hc3NldC5Tb3VuZC5wcm90b3R5cGUuJG1ldGhvZChcIl9sb2FkXCIsIGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICBpZiAoL15kYXRhOi8udGVzdCh0aGlzLnNyYykpIHtcbiAgICAgIHRoaXMuX2xvYWRGcm9tVVJJU2NoZW1lKHJlc29sdmUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9sb2FkRnJvbUZpbGUocmVzb2x2ZSk7XG4gICAgfVxuICB9KTtcblxuICBwaGluYS5hc3NldC5Tb3VuZC5wcm90b3R5cGUuJG1ldGhvZChcIl9sb2FkRnJvbUZpbGVcIiwgZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuc3JjKTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIHhtbCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIHhtbC5vcGVuKCdHRVQnLCB0aGlzLnNyYyk7XG4gICAgeG1sLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHhtbC5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgIGlmIChbMjAwLCAyMDEsIDBdLmluZGV4T2YoeG1sLnN0YXR1cykgIT09IC0xKSB7XG4gICAgICAgICAgLy8g6Z+z5qW944OQ44Kk44OK44Oq44O844OH44O844K/XG4gICAgICAgICAgdmFyIGRhdGEgPSB4bWwucmVzcG9uc2U7XG4gICAgICAgICAgLy8gd2ViYXVkaW8g55So44Gr5aSJ5o+bXG4gICAgICAgICAgLy8gY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgICBzZWxmLmNvbnRleHQuZGVjb2RlQXVkaW9EYXRhKGRhdGEsIGZ1bmN0aW9uKGJ1ZmZlcikge1xuICAgICAgICAgICAgc2VsZi5sb2FkRnJvbUJ1ZmZlcihidWZmZXIpO1xuICAgICAgICAgICAgcmVzb2x2ZShzZWxmKTtcbiAgICAgICAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIumfs+WjsOODleOCoeOCpOODq+OBruODh+OCs+ODvOODieOBq+WkseaVl+OBl+OBvuOBl+OBn+OAgihcIiArIHNlbGYuc3JjICsgXCIpXCIpO1xuICAgICAgICAgICAgcmVzb2x2ZShzZWxmKTtcbiAgICAgICAgICAgIHNlbGYuZmxhcmUoJ2RlY29kZWVycm9yJyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoeG1sLnN0YXR1cyA9PT0gNDA0KSB7XG4gICAgICAgICAgLy8gbm90IGZvdW5kXG4gICAgICAgICAgc2VsZi5sb2FkRXJyb3IgPSB0cnVlO1xuICAgICAgICAgIHNlbGYubm90Rm91bmQgPSB0cnVlO1xuICAgICAgICAgIHJlc29sdmUoc2VsZik7XG4gICAgICAgICAgc2VsZi5mbGFyZSgnbG9hZGVycm9yJyk7XG4gICAgICAgICAgc2VsZi5mbGFyZSgnbm90Zm91bmQnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyDjgrXjg7zjg5Djg7zjgqjjg6njg7xcbiAgICAgICAgICBzZWxmLmxvYWRFcnJvciA9IHRydWU7XG4gICAgICAgICAgc2VsZi5zZXJ2ZXJFcnJvciA9IHRydWU7XG4gICAgICAgICAgcmVzb2x2ZShzZWxmKTtcbiAgICAgICAgICBzZWxmLmZsYXJlKCdsb2FkZXJyb3InKTtcbiAgICAgICAgICBzZWxmLmZsYXJlKCdzZXJ2ZXJlcnJvcicpO1xuICAgICAgICB9XG4gICAgICAgIHhtbC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBudWxsO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB4bWwucmVzcG9uc2VUeXBlID0gJ2FycmF5YnVmZmVyJztcblxuICAgIHhtbC5zZW5kKG51bGwpO1xuICB9KTtcblxuICBwaGluYS5hc3NldC5Tb3VuZC5wcm90b3R5cGUuJG1ldGhvZChcInBsYXlcIiwgZnVuY3Rpb24od2hlbiwgb2Zmc2V0LCBkdXJhdGlvbikge1xuICAgIHdoZW4gPSB3aGVuID8gd2hlbiArIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSA6IDA7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0IHx8IDA7XG5cbiAgICB2YXIgc291cmNlID0gdGhpcy5zb3VyY2UgPSB0aGlzLmNvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XG4gICAgdmFyIGJ1ZmZlciA9IHNvdXJjZS5idWZmZXIgPSB0aGlzLmJ1ZmZlcjtcbiAgICBzb3VyY2UubG9vcCA9IHRoaXMuX2xvb3A7XG4gICAgc291cmNlLmxvb3BTdGFydCA9IHRoaXMuX2xvb3BTdGFydDtcbiAgICBzb3VyY2UubG9vcEVuZCA9IHRoaXMuX2xvb3BFbmQ7XG4gICAgc291cmNlLnBsYXliYWNrUmF0ZS52YWx1ZSA9IHRoaXMuX3BsYXliYWNrUmF0ZTtcblxuICAgIC8vIGNvbm5lY3RcbiAgICBzb3VyY2UuY29ubmVjdCh0aGlzLmdhaW5Ob2RlKTtcbiAgICB0aGlzLmdhaW5Ob2RlLmNvbm5lY3QocGhpbmEuYXNzZXQuU291bmQuZ2V0TWFzdGVyR2FpbigpKTtcbiAgICAvLyBwbGF5XG4gICAgaWYgKGR1cmF0aW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHNvdXJjZS5zdGFydCh3aGVuLCBvZmZzZXQsIGR1cmF0aW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc291cmNlLnN0YXJ0KHdoZW4sIG9mZnNldCk7XG4gICAgfVxuXG4gICAgc291cmNlLm9uZW5kZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghc291cmNlKSB7XG4gICAgICAgIHRoaXMuZmxhcmUoJ2VuZGVkJyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHNvdXJjZS5vbmVuZGVkID0gbnVsbDtcbiAgICAgIHNvdXJjZS5kaXNjb25uZWN0KCk7XG4gICAgICBzb3VyY2UuYnVmZmVyID0gbnVsbDtcbiAgICAgIHNvdXJjZSA9IG51bGw7XG4gICAgICB0aGlzLmZsYXJlKCdlbmRlZCcpO1xuICAgIH0uYmluZCh0aGlzKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9KTtcblxuICBwaGluYS5hc3NldC5Tb3VuZC5wcm90b3R5cGUuJG1ldGhvZChcInN0b3BcIiwgZnVuY3Rpb24oKSB7XG4gICAgLy8gc3RvcFxuICAgIGlmICh0aGlzLnNvdXJjZSkge1xuICAgICAgLy8gc3RvcCDjgZnjgovjgaggc291cmNlLmVuZGVk44KC55m654Gr44GZ44KLXG4gICAgICB0aGlzLnNvdXJjZS5zdG9wICYmIHRoaXMuc291cmNlLnN0b3AoMCk7XG4gICAgICB0aGlzLmZsYXJlKCdzdG9wJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0pO1xuXG59KTtcbiIsIi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vICBFeHRlbnNpb24gcGhpbmEuYXNzZXQuU291bmRNYW5hZ2VyXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5Tb3VuZE1hbmFnZXIuJG1ldGhvZChcImdldFZvbHVtZVwiLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICF0aGlzLmlzTXV0ZSgpID8gdGhpcy52b2x1bWUgOiAwO1xufSk7XG5cblNvdW5kTWFuYWdlci4kbWV0aG9kKFwiZ2V0Vm9sdW1lTXVzaWNcIiwgZnVuY3Rpb24oKSB7XG4gIHJldHVybiAhdGhpcy5pc011dGUoKSA/IHRoaXMubXVzaWNWb2x1bWUgOiAwO1xufSk7XG5cblNvdW5kTWFuYWdlci4kbWV0aG9kKFwic2V0Vm9sdW1lTXVzaWNcIiwgZnVuY3Rpb24odm9sdW1lKSB7XG4gIHRoaXMubXVzaWNWb2x1bWUgPSB2b2x1bWU7XG4gIGlmICghdGhpcy5pc011dGUoKSAmJiB0aGlzLmN1cnJlbnRNdXNpYykge1xuICAgIHRoaXMuY3VycmVudE11c2ljLnZvbHVtZSA9IHZvbHVtZTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn0pO1xuXG5Tb3VuZE1hbmFnZXIuJG1ldGhvZChcInBsYXlNdXNpY1wiLCBmdW5jdGlvbihuYW1lLCBmYWRlVGltZSwgbG9vcCwgd2hlbiwgb2Zmc2V0LCBkdXJhdGlvbikge1xuICAvLyBjb25zdCByZXMgPSBwaGluYS5jaGVja0Jyb3dzZXIoKTtcbiAgLy8gaWYgKHJlcy5pc0llMTEpIHJldHVybiBudWxsO1xuXG4gIGxvb3AgPSAobG9vcCAhPT0gdW5kZWZpbmVkKSA/IGxvb3AgOiB0cnVlO1xuXG4gIGlmICh0aGlzLmN1cnJlbnRNdXNpYykge1xuICAgIHRoaXMuc3RvcE11c2ljKGZhZGVUaW1lKTtcbiAgfVxuXG4gIHZhciBtdXNpYyA9IG51bGw7XG4gIGlmIChuYW1lIGluc3RhbmNlb2YgcGhpbmEuYXNzZXQuU291bmQgfHwgbmFtZSBpbnN0YW5jZW9mIHBoaW5hLmFzc2V0LkRvbUF1ZGlvU291bmQpIHtcbiAgICBtdXNpYyA9IG5hbWU7XG4gIH0gZWxzZSB7XG4gICAgbXVzaWMgPSBwaGluYS5hc3NldC5Bc3NldE1hbmFnZXIuZ2V0KCdzb3VuZCcsIG5hbWUpO1xuICB9XG5cbiAgaWYgKCFtdXNpYykge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJTb3VuZCBub3QgZm91bmQ6IFwiLCBuYW1lKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIG11c2ljLnNldExvb3AobG9vcCk7XG4gIG11c2ljLnBsYXkod2hlbiwgb2Zmc2V0LCBkdXJhdGlvbik7XG5cbiAgaWYgKGZhZGVUaW1lID4gMCkge1xuICAgIHZhciBjb3VudCA9IDMyO1xuICAgIHZhciBjb3VudGVyID0gMDtcbiAgICB2YXIgdW5pdFRpbWUgPSBmYWRlVGltZSAvIGNvdW50O1xuICAgIHZhciB2b2x1bWUgPSB0aGlzLmdldFZvbHVtZU11c2ljKCk7XG5cbiAgICBtdXNpYy52b2x1bWUgPSAwO1xuICAgIHZhciBpZCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgY291bnRlciArPSAxO1xuICAgICAgdmFyIHJhdGUgPSBjb3VudGVyIC8gY291bnQ7XG4gICAgICBtdXNpYy52b2x1bWUgPSByYXRlICogdm9sdW1lO1xuXG4gICAgICBpZiAocmF0ZSA+PSAxKSB7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwoaWQpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sIHVuaXRUaW1lKTtcbiAgfSBlbHNlIHtcbiAgICBtdXNpYy52b2x1bWUgPSB0aGlzLmdldFZvbHVtZU11c2ljKCk7XG4gIH1cblxuICB0aGlzLmN1cnJlbnRNdXNpYyA9IG11c2ljO1xuXG4gIHJldHVybiB0aGlzLmN1cnJlbnRNdXNpYztcbn0pO1xuXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyDjg5zjgqTjgrnnlKjjga7pn7Pph4/oqK3lrprjgIHlho3nlJ/jg6Hjgr3jg4Pjg4nmi6HlvLVcblNvdW5kTWFuYWdlci4kbWV0aG9kKFwiZ2V0Vm9sdW1lVm9pY2VcIiwgZnVuY3Rpb24oKSB7XG4gIHJldHVybiAhdGhpcy5pc011dGUoKSA/IHRoaXMudm9pY2VWb2x1bWUgOiAwO1xufSk7XG5cblNvdW5kTWFuYWdlci4kbWV0aG9kKFwic2V0Vm9sdW1lVm9pY2VcIiwgZnVuY3Rpb24odm9sdW1lKSB7XG4gIHRoaXMudm9pY2VWb2x1bWUgPSB2b2x1bWU7XG4gIHJldHVybiB0aGlzO1xufSk7XG5cblNvdW5kTWFuYWdlci4kbWV0aG9kKFwicGxheVZvaWNlXCIsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgdmFyIHNvdW5kID0gcGhpbmEuYXNzZXQuQXNzZXRNYW5hZ2VyLmdldCgnc291bmQnLCBuYW1lKTtcbiAgc291bmQudm9sdW1lID0gdGhpcy5nZXRWb2x1bWVWb2ljZSgpO1xuICBzb3VuZC5wbGF5KCk7XG4gIHJldHVybiBzb3VuZDtcbn0pO1xuIiwiLy/jgrnjg5fjg6njgqTjg4jmqZ/og73mi6HlvLVcbnBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcblxuICBwaGluYS5kaXNwbGF5LlNwcml0ZS5wcm90b3R5cGUuc2V0RnJhbWVUcmltbWluZyA9IGZ1bmN0aW9uKHgsIHksIHdpZHRoLCBoZWlnaHQpIHtcbiAgICB0aGlzLl9mcmFtZVRyaW1YID0geCB8fCAwO1xuICAgIHRoaXMuX2ZyYW1lVHJpbVkgPSB5IHx8IDA7XG4gICAgdGhpcy5fZnJhbWVUcmltV2lkdGggPSB3aWR0aCB8fCB0aGlzLmltYWdlLmRvbUVsZW1lbnQud2lkdGggLSB0aGlzLl9mcmFtZVRyaW1YO1xuICAgIHRoaXMuX2ZyYW1lVHJpbUhlaWdodCA9IGhlaWdodCB8fCB0aGlzLmltYWdlLmRvbUVsZW1lbnQuaGVpZ2h0IC0gdGhpcy5fZnJhbWVUcmltWTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHBoaW5hLmRpc3BsYXkuU3ByaXRlLnByb3RvdHlwZS5zZXRGcmFtZUluZGV4ID0gZnVuY3Rpb24oaW5kZXgsIHdpZHRoLCBoZWlnaHQpIHtcbiAgICB2YXIgc3ggPSB0aGlzLl9mcmFtZVRyaW1YIHx8IDA7XG4gICAgdmFyIHN5ID0gdGhpcy5fZnJhbWVUcmltWSB8fCAwO1xuICAgIHZhciBzdyA9IHRoaXMuX2ZyYW1lVHJpbVdpZHRoICB8fCAodGhpcy5pbWFnZS5kb21FbGVtZW50LndpZHRoLXN4KTtcbiAgICB2YXIgc2ggPSB0aGlzLl9mcmFtZVRyaW1IZWlnaHQgfHwgKHRoaXMuaW1hZ2UuZG9tRWxlbWVudC5oZWlnaHQtc3kpO1xuXG4gICAgdmFyIHR3ICA9IHdpZHRoIHx8IHRoaXMud2lkdGg7ICAgICAgLy8gdHdcbiAgICB2YXIgdGggID0gaGVpZ2h0IHx8IHRoaXMuaGVpZ2h0OyAgICAvLyB0aFxuICAgIHZhciByb3cgPSB+fihzdyAvIHR3KTtcbiAgICB2YXIgY29sID0gfn4oc2ggLyB0aCk7XG4gICAgdmFyIG1heEluZGV4ID0gcm93KmNvbDtcbiAgICBpbmRleCA9IGluZGV4JW1heEluZGV4O1xuXG4gICAgdmFyIHggICA9IGluZGV4JXJvdztcbiAgICB2YXIgeSAgID0gfn4oaW5kZXgvcm93KTtcbiAgICB0aGlzLnNyY1JlY3QueCA9IHN4K3gqdHc7XG4gICAgdGhpcy5zcmNSZWN0LnkgPSBzeSt5KnRoO1xuICAgIHRoaXMuc3JjUmVjdC53aWR0aCAgPSB0dztcbiAgICB0aGlzLnNyY1JlY3QuaGVpZ2h0ID0gdGg7XG5cbiAgICB0aGlzLl9mcmFtZUluZGV4ID0gaW5kZXg7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59KTsiLCJwaGluYS5uYW1lc3BhY2UoZnVuY3Rpb24oKSB7XG4gIC8vIOaWh+Wtl+WIl+OBi+OCieaVsOWApOOCkuaKveWHuuOBmeOCi1xuICAvLyDjg6zjgqTjgqLjgqbjg4jjg5XjgqHjgqTjg6vjgYvjgonkvZzmpa3jgZnjgovloLTlkIjjgavliKnnlKjjgZfjgZ/jgY/jgarjgotcbiAgLy8gaG9nZV8wIGhvZ2VfMeOBquOBqeOBi+OCieaVsOWtl+OBoOOBkeaKveWHulxuICAvLyAwMTAwX2hvZ2VfOTk5OSA9PiBbXCIwMTAwXCIgLCBcIjk5OTlcIl3jgavjgarjgotcbiAgLy8gaG9nZTAuMOOBqOOBi+OBr+OBqeOBhuOBmeOBi+OBqu+8n1xuICAvLyDmir3lh7rlvozjgatwYXJzZUludOOBmeOCi+OBi+OBr+aknOiojuS4rVxuICBTdHJpbmcucHJvdG90eXBlLiRtZXRob2QoXCJtYXRjaEludFwiLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5tYXRjaCgvWzAtOV0rL2cpO1xuICB9KTtcbn0pO1xuIiwicGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuXG4gIHBoaW5hLmFzc2V0LlRleHR1cmUucHJvdG90eXBlLiRtZXRob2QoXCJfbG9hZFwiLCBmdW5jdGlvbihyZXNvbHZlKSB7XG4gICAgdGhpcy5kb21FbGVtZW50ID0gbmV3IEltYWdlKCk7XG5cbiAgICB2YXIgaXNMb2NhbCA9IChsb2NhdGlvbi5wcm90b2NvbCA9PSAnZmlsZTonKTtcbiAgICBpZiAoISgvXmRhdGE6Ly50ZXN0KHRoaXMuc3JjKSkpIHtcbiAgICAgIHRoaXMuZG9tRWxlbWVudC5jcm9zc09yaWdpbiA9ICdhbm9ueW1vdXMnOyAvLyDjgq/jg63jgrnjgqrjg6rjgrjjg7Pop6PpmaRcbiAgICB9XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5kb21FbGVtZW50Lm9ubG9hZCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIHNlbGYubG9hZGVkID0gdHJ1ZTtcbiAgICAgIGUudGFyZ2V0Lm9ubG9hZCA9IG51bGw7XG4gICAgICBlLnRhcmdldC5vbmVycm9yID0gbnVsbDtcbiAgICAgIHJlc29sdmUoc2VsZik7XG4gICAgfTtcblxuICAgIHRoaXMuZG9tRWxlbWVudC5vbmVycm9yID0gZnVuY3Rpb24oZSkge1xuICAgICAgZS50YXJnZXQub25sb2FkID0gbnVsbDtcbiAgICAgIGUudGFyZ2V0Lm9uZXJyb3IgPSBudWxsO1xuICAgICAgY29uc29sZS5lcnJvcihcInBoaW5hLmFzc2V0LlRleHR1cmUgX2xvYWQgb25FcnJvciBcIiwgdGhpcy5zcmMpO1xuICAgIH07XG5cbiAgICB0aGlzLmRvbUVsZW1lbnQuc3JjID0gdGhpcy5zcmM7XG4gIH0pO1xuXG59KTtcbiIsInBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcblxuICBwaGluYS5hY2Nlc3NvcnkuVHdlZW5lci5wcm90b3R5cGUuJG1ldGhvZChcIl91cGRhdGVUd2VlblwiLCBmdW5jdGlvbihhcHApIHtcbiAgICAvL+KAu+OBk+OCjOOBquOBhOOBqHBhdXNl44GM44GG44GU44GL44Gq44GEXG4gICAgaWYgKCF0aGlzLnBsYXlpbmcpIHJldHVybjtcblxuICAgIHZhciB0d2VlbiA9IHRoaXMuX3R3ZWVuO1xuICAgIHZhciB0aW1lID0gdGhpcy5fZ2V0VW5pdFRpbWUoYXBwKTtcblxuICAgIHR3ZWVuLmZvcndhcmQodGltZSk7XG4gICAgdGhpcy5mbGFyZSgndHdlZW4nKTtcblxuICAgIGlmICh0d2Vlbi50aW1lID49IHR3ZWVuLmR1cmF0aW9uKSB7XG4gICAgICBkZWxldGUgdGhpcy5fdHdlZW47XG4gICAgICB0aGlzLl90d2VlbiA9IG51bGw7XG4gICAgICB0aGlzLl91cGRhdGUgPSB0aGlzLl91cGRhdGVUYXNrO1xuICAgIH1cbiAgfSk7XG5cbiAgcGhpbmEuYWNjZXNzb3J5LlR3ZWVuZXIucHJvdG90eXBlLiRtZXRob2QoXCJfdXBkYXRlV2FpdFwiLCBmdW5jdGlvbihhcHApIHtcbiAgICAvL+KAu+OBk+OCjOOBquOBhOOBqHBhdXNl44GM44GG44GU44GL44Gq44GEXG4gICAgaWYgKCF0aGlzLnBsYXlpbmcpIHJldHVybjtcblxuICAgIHZhciB3YWl0ID0gdGhpcy5fd2FpdDtcbiAgICB2YXIgdGltZSA9IHRoaXMuX2dldFVuaXRUaW1lKGFwcCk7XG4gICAgd2FpdC50aW1lICs9IHRpbWU7XG5cbiAgICBpZiAod2FpdC50aW1lID49IHdhaXQubGltaXQpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLl93YWl0O1xuICAgICAgdGhpcy5fd2FpdCA9IG51bGw7XG4gICAgICB0aGlzLl91cGRhdGUgPSB0aGlzLl91cGRhdGVUYXNrO1xuICAgIH1cbiAgfSk7XG5cbn0pO1xuIiwicGhpbmEuZGVmaW5lKFwiQnV0dG9uaXplXCIsIHtcbiAgaW5pdDogZnVuY3Rpb24oKSB7fSxcbiAgX3N0YXRpYzoge1xuICAgIFNUQVRVUzoge1xuICAgICAgTk9ORTogMCxcbiAgICAgIFNUQVJUOiAxLFxuICAgICAgRU5EOiAyLFxuICAgIH0sXG4gICAgc3RhdHVzOiAwLFxuICAgIHJlY3Q6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgIGVsZW1lbnQuYm91bmRpbmdUeXBlID0gXCJyZWN0XCI7XG4gICAgICB0aGlzLl9jb21tb24oZWxlbWVudCk7XG4gICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9LFxuICAgIGNpcmNsZTogZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgZWxlbWVudC5yYWRpdXMgPSBNYXRoLm1heChlbGVtZW50LndpZHRoLCBlbGVtZW50LmhlaWdodCkgKiAwLjU7XG4gICAgICBlbGVtZW50LmJvdW5kaW5nVHlwZSA9IFwiY2lyY2xlXCI7XG4gICAgICB0aGlzLl9jb21tb24oZWxlbWVudCk7XG4gICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9LFxuICAgIF9jb21tb246IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgIC8vVE9ETzrjgqjjg4fjgqPjgr/jg7zjgafjgY3jgovjgb7jgafjga7mmqvlrprlr77lv5xcbiAgICAgIGVsZW1lbnQuc2V0T3JpZ2luKDAuNSwgMC41LCB0cnVlKTtcblxuICAgICAgZWxlbWVudC5pbnRlcmFjdGl2ZSA9IHRydWU7XG4gICAgICBlbGVtZW50LmNsaWNrU291bmQgPSBcInNlL2NsaWNrQnV0dG9uXCI7XG5cbiAgICAgIC8vVE9ETzrjg5zjgr/jg7Pjga7lkIzmmYLmirzkuIvjga/lrp/mqZ/jgafoqr/mlbTjgZnjgotcbiAgICAgIGVsZW1lbnQub24oXCJwb2ludHN0YXJ0XCIsIGUgPT4ge1xuICAgICAgICBpZiAodGhpcy5zdGF0dXMgIT0gdGhpcy5TVEFUVVMuTk9ORSkgcmV0dXJuO1xuICAgICAgICB0aGlzLnN0YXR1cyA9IHRoaXMuU1RBVFVTLlNUQVJUO1xuICAgICAgICBlbGVtZW50LnR3ZWVuZXIuY2xlYXIoKVxuICAgICAgICAgIC50byh7XG4gICAgICAgICAgICBzY2FsZVg6IDAuOSxcbiAgICAgICAgICAgIHNjYWxlWTogMC45XG4gICAgICAgICAgfSwgMTAwKTtcbiAgICAgIH0pO1xuXG4gICAgICBlbGVtZW50Lm9uKFwicG9pbnRlbmRcIiwgKGUpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzICE9IHRoaXMuU1RBVFVTLlNUQVJUKSByZXR1cm47XG4gICAgICAgIGNvbnN0IGhpdFRlc3QgPSBlbGVtZW50LmhpdFRlc3QoZS5wb2ludGVyLngsIGUucG9pbnRlci55KTtcbiAgICAgICAgdGhpcy5zdGF0dXMgPSB0aGlzLlNUQVRVUy5FTkQ7XG4gICAgICAgIGlmIChoaXRUZXN0KSBlbGVtZW50LmZsYXJlKFwiY2xpY2tTb3VuZFwiKTtcblxuICAgICAgICBlbGVtZW50LnR3ZWVuZXIuY2xlYXIoKVxuICAgICAgICAgIC50byh7XG4gICAgICAgICAgICBzY2FsZVg6IDEuMCxcbiAgICAgICAgICAgIHNjYWxlWTogMS4wXG4gICAgICAgICAgfSwgMTAwKVxuICAgICAgICAgIC5jYWxsKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3RhdHVzID0gdGhpcy5TVEFUVVMuTk9ORTtcbiAgICAgICAgICAgIGlmICghaGl0VGVzdCkgcmV0dXJuO1xuICAgICAgICAgICAgZWxlbWVudC5mbGFyZShcImNsaWNrZWRcIiwge1xuICAgICAgICAgICAgICBwb2ludGVyOiBlLnBvaW50ZXJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIC8v44Ki44OL44Oh44O844K344On44Oz44Gu5pyA5Lit44Gr5YmK6Zmk44GV44KM44Gf5aC05ZCI44Gr5YKZ44GI44GmcmVtb3ZlZOOCpOODmeODs+ODiOaZguOBq+ODleODqeOCsOOCkuWFg+OBq+aIu+OBl+OBpuOBiuOBj1xuICAgICAgZWxlbWVudC5vbmUoXCJyZW1vdmVkXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5zdGF0dXMgPSB0aGlzLlNUQVRVUy5OT05FO1xuICAgICAgfSk7XG5cbiAgICAgIGVsZW1lbnQub24oXCJjbGlja1NvdW5kXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIWVsZW1lbnQuY2xpY2tTb3VuZCkgcmV0dXJuO1xuICAgICAgICAvL3BoaW5hLmFzc2V0LlNvdW5kTWFuYWdlci5wbGF5KGVsZW1lbnQuY2xpY2tTb3VuZCk7XG4gICAgICB9KTtcbiAgICB9LFxuICB9LFxufSk7XG4iLCJwaGluYS5uYW1lc3BhY2UoZnVuY3Rpb24oKSB7XG5cbiAgLyoqXG4gICAqIOODhuOCr+OCueODgeODo+mWouS/guOBruODpuODvOODhuOCo+ODquODhuOCo1xuICAgKi9cbiAgcGhpbmEuZGVmaW5lKFwiVGV4dHVyZVV0aWxcIiwge1xuXG4gICAgX3N0YXRpYzoge1xuXG4gICAgICAvKipcbiAgICAgICAqIFJHQuWQhOimgee0oOOBq+Wun+aVsOOCkuepjeeul+OBmeOCi1xuICAgICAgICovXG4gICAgICBtdWx0aXBseUNvbG9yOiBmdW5jdGlvbih0ZXh0dXJlLCByZWQsIGdyZWVuLCBibHVlKSB7XG4gICAgICAgIGlmICh0eXBlb2YodGV4dHVyZSkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICB0ZXh0dXJlID0gQXNzZXRNYW5hZ2VyLmdldChcImltYWdlXCIsIHRleHR1cmUpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgd2lkdGggPSB0ZXh0dXJlLmRvbUVsZW1lbnQud2lkdGg7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IHRleHR1cmUuZG9tRWxlbWVudC5oZWlnaHQ7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gQ2FudmFzKCkuc2V0U2l6ZSh3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHJlc3VsdC5jb250ZXh0O1xuXG4gICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKHRleHR1cmUuZG9tRWxlbWVudCwgMCwgMCk7XG4gICAgICAgIGNvbnN0IGltYWdlRGF0YSA9IGNvbnRleHQuZ2V0SW1hZ2VEYXRhKDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGltYWdlRGF0YS5kYXRhLmxlbmd0aDsgaSArPSA0KSB7XG4gICAgICAgICAgaW1hZ2VEYXRhLmRhdGFbaSArIDBdID0gTWF0aC5mbG9vcihpbWFnZURhdGEuZGF0YVtpICsgMF0gKiByZWQpO1xuICAgICAgICAgIGltYWdlRGF0YS5kYXRhW2kgKyAxXSA9IE1hdGguZmxvb3IoaW1hZ2VEYXRhLmRhdGFbaSArIDFdICogZ3JlZW4pO1xuICAgICAgICAgIGltYWdlRGF0YS5kYXRhW2kgKyAyXSA9IE1hdGguZmxvb3IoaW1hZ2VEYXRhLmRhdGFbaSArIDJdICogYmx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29udGV4dC5wdXRJbWFnZURhdGEoaW1hZ2VEYXRhLCAwLCAwKTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiDoibLnm7jjg7vlvanluqbjg7vmmI7luqbjgpLmk43kvZzjgZnjgotcbiAgICAgICAqL1xuICAgICAgZWRpdEJ5SHNsOiBmdW5jdGlvbih0ZXh0dXJlLCBoLCBzLCBsKSB7XG4gICAgICAgIGlmICh0eXBlb2YodGV4dHVyZSkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICB0ZXh0dXJlID0gQXNzZXRNYW5hZ2VyLmdldChcImltYWdlXCIsIHRleHR1cmUpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgd2lkdGggPSB0ZXh0dXJlLmRvbUVsZW1lbnQud2lkdGg7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IHRleHR1cmUuZG9tRWxlbWVudC5oZWlnaHQ7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gQ2FudmFzKCkuc2V0U2l6ZSh3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHJlc3VsdC5jb250ZXh0O1xuXG4gICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKHRleHR1cmUuZG9tRWxlbWVudCwgMCwgMCk7XG4gICAgICAgIGNvbnN0IGltYWdlRGF0YSA9IGNvbnRleHQuZ2V0SW1hZ2VEYXRhKDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGltYWdlRGF0YS5kYXRhLmxlbmd0aDsgaSArPSA0KSB7XG4gICAgICAgICAgY29uc3QgciA9IGltYWdlRGF0YS5kYXRhW2kgKyAwXTtcbiAgICAgICAgICBjb25zdCBnID0gaW1hZ2VEYXRhLmRhdGFbaSArIDFdO1xuICAgICAgICAgIGNvbnN0IGIgPSBpbWFnZURhdGEuZGF0YVtpICsgMl07XG5cbiAgICAgICAgICBjb25zdCBoc2wgPSBwaGluYS51dGlsLkNvbG9yLlJHQnRvSFNMKHIsIGcsIGIpO1xuICAgICAgICAgIGNvbnN0IG5ld1JnYiA9IHBoaW5hLnV0aWwuQ29sb3IuSFNMdG9SR0IoaHNsWzBdICsgaCwgTWF0aC5jbGFtcChoc2xbMV0gKyBzLCAwLCAxMDApLCBNYXRoLmNsYW1wKGhzbFsyXSArIGwsIDAsIDEwMCkpO1xuXG4gICAgICAgICAgaW1hZ2VEYXRhLmRhdGFbaSArIDBdID0gbmV3UmdiWzBdO1xuICAgICAgICAgIGltYWdlRGF0YS5kYXRhW2kgKyAxXSA9IG5ld1JnYlsxXTtcbiAgICAgICAgICBpbWFnZURhdGEuZGF0YVtpICsgMl0gPSBuZXdSZ2JbMl07XG4gICAgICAgIH1cbiAgICAgICAgY29udGV4dC5wdXRJbWFnZURhdGEoaW1hZ2VEYXRhLCAwLCAwKTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSxcblxuICAgIH0sXG5cbiAgICBpbml0OiBmdW5jdGlvbigpIHt9LFxuICB9KTtcblxufSk7XG4iLCIvKlxuICogIHBoaW5hLnRpbGVkbWFwLmpzXG4gKiAgMjAxNi85LzEwXG4gKiAgQGF1dGhlciBtaW5pbW8gIFxuICogIFRoaXMgUHJvZ3JhbSBpcyBNSVQgbGljZW5zZS5cbiAqXG4gKi9cblxucGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuXG4gIHBoaW5hLmRlZmluZShcInBoaW5hLmFzc2V0LlRpbGVkTWFwXCIsIHtcbiAgICBzdXBlckNsYXNzOiBcInBoaW5hLmFzc2V0LkFzc2V0XCIsXG5cbiAgICBpbWFnZTogbnVsbCxcblxuICAgIHRpbGVzZXRzOiBudWxsLFxuICAgIGxheWVyczogbnVsbCxcblxuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnN1cGVySW5pdCgpO1xuICAgIH0sXG5cbiAgICBfbG9hZDogZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgICAgLy/jg5HjgrnmipzjgY3lh7rjgZdcbiAgICAgIHRoaXMucGF0aCA9IFwiXCI7XG4gICAgICBjb25zdCBsYXN0ID0gdGhpcy5zcmMubGFzdEluZGV4T2YoXCIvXCIpO1xuICAgICAgaWYgKGxhc3QgPiAwKSB7XG4gICAgICAgICAgdGhpcy5wYXRoID0gdGhpcy5zcmMuc3Vic3RyaW5nKDAsIGxhc3QrMSk7XG4gICAgICB9XG5cbiAgICAgIC8v57WC5LqG6Zai5pWw5L+d5a2YXG4gICAgICB0aGlzLl9yZXNvbHZlID0gcmVzb2x2ZTtcblxuICAgICAgLy8gbG9hZFxuICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICBjb25zdCB4bWwgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgIHhtbC5vcGVuKCdHRVQnLCB0aGlzLnNyYyk7XG4gICAgICB4bWwub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh4bWwucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgIGlmIChbMjAwLCAyMDEsIDBdLmluZGV4T2YoeG1sLnN0YXR1cykgIT09IC0xKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHhtbC5yZXNwb25zZVRleHQ7XG4gICAgICAgICAgICBkYXRhID0gKG5ldyBET01QYXJzZXIoKSkucGFyc2VGcm9tU3RyaW5nKGRhdGEsIFwidGV4dC94bWxcIik7XG4gICAgICAgICAgICBzZWxmLmRhdGFUeXBlID0gXCJ4bWxcIjtcbiAgICAgICAgICAgIHNlbGYuZGF0YSA9IGRhdGE7XG4gICAgICAgICAgICBzZWxmLl9wYXJzZShkYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICB4bWwuc2VuZChudWxsKTtcbiAgICB9LFxuXG4gICAgLy/jg57jg4Pjg5fjgqTjg6Hjg7zjgrjlj5blvpdcbiAgICBnZXRJbWFnZTogZnVuY3Rpb24obGF5ZXJOYW1lKSB7XG4gICAgICBpZiAobGF5ZXJOYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW1hZ2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2VuZXJhdGVJbWFnZShsYXllck5hbWUpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAvL+aMh+WumuODnuODg+ODl+ODrOOCpOODpOODvOOCkumFjeWIl+OBqOOBl+OBpuWPluW+l1xuICAgIGdldE1hcERhdGE6IGZ1bmN0aW9uKGxheWVyTmFtZSkge1xuICAgICAgLy/jg6zjgqTjg6Tjg7zmpJzntKJcbiAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodGhpcy5sYXllcnNbaV0ubmFtZSA9PSBsYXllck5hbWUpIHtcbiAgICAgICAgICAvL+OCs+ODlOODvOOCkui/lOOBmVxuICAgICAgICAgIHJldHVybiB0aGlzLmxheWVyc1tpXS5kYXRhLmNvbmNhdCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9LFxuXG4gICAgLy/jgqrjg5bjgrjjgqfjgq/jg4jjgrDjg6vjg7zjg5fjgpLlj5blvpfvvIjmjIflrprjgYznhKHjgYTloLTlkIjjgIHlhajjg6zjgqTjg6Tjg7zjgpLphY3liJfjgavjgZfjgabov5TjgZnvvIlcbiAgICBnZXRPYmplY3RHcm91cDogZnVuY3Rpb24oZ3JvdXBOYW1lKSB7XG4gICAgICBncm91cE5hbWUgPSBncm91cE5hbWUgfHwgbnVsbDtcbiAgICAgIHZhciBscyA9IFtdO1xuICAgICAgdmFyIGxlbiA9IHRoaXMubGF5ZXJzLmxlbmd0aDtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgaWYgKHRoaXMubGF5ZXJzW2ldLnR5cGUgPT0gXCJvYmplY3Rncm91cFwiKSB7XG4gICAgICAgICAgaWYgKGdyb3VwTmFtZSA9PSBudWxsIHx8IGdyb3VwTmFtZSA9PSB0aGlzLmxheWVyc1tpXS5uYW1lKSB7XG4gICAgICAgICAgICAvL+ODrOOCpOODpOODvOaDheWgseOCkuOCr+ODreODvOODs+OBmeOCi1xuICAgICAgICAgICAgY29uc3Qgb2JqID0gdGhpcy5fY2xvbmVPYmplY3RMYXllcih0aGlzLmxheWVyc1tpXSk7XG4gICAgICAgICAgICBpZiAoZ3JvdXBOYW1lICE9PSBudWxsKSByZXR1cm4gb2JqO1xuICAgICAgICAgIH1cbiAgICAgICAgICBscy5wdXNoKG9iaik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBscztcbiAgICB9LFxuXG4gICAgLy/jgqrjg5bjgrjjgqfjgq/jg4jjg6zjgqTjg6Tjg7zjgpLjgq/jg63jg7zjg7PjgZfjgabov5TjgZlcbiAgICBfY2xvbmVPYmplY3RMYXllcjogZnVuY3Rpb24oc3JjTGF5ZXIpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHt9LiRzYWZlKHNyY0xheWVyKTtcbiAgICAgIHJlc3VsdC5vYmplY3RzID0gW107XG4gICAgICAvL+ODrOOCpOODpOODvOWGheOCquODluOCuOOCp+OCr+ODiOOBruOCs+ODlOODvFxuICAgICAgc3JjTGF5ZXIub2JqZWN0cy5mb3JFYWNoKGZ1bmN0aW9uKG9iail7XG4gICAgICAgIGNvbnN0IHJlc09iaiA9IHtcbiAgICAgICAgICBwcm9wZXJ0aWVzOiB7fS4kc2FmZShvYmoucHJvcGVydGllcyksXG4gICAgICAgIH0uJGV4dGVuZChvYmopO1xuICAgICAgICBpZiAob2JqLmVsbGlwc2UpIHJlc09iai5lbGxpcHNlID0gb2JqLmVsbGlwc2U7XG4gICAgICAgIGlmIChvYmouZ2lkKSByZXNPYmouZ2lkID0gb2JqLmdpZDtcbiAgICAgICAgaWYgKG9iai5wb2x5Z29uKSByZXNPYmoucG9seWdvbiA9IG9iai5wb2x5Z29uLmNsb25lKCk7XG4gICAgICAgIGlmIChvYmoucG9seWxpbmUpIHJlc09iai5wb2x5bGluZSA9IG9iai5wb2x5bGluZS5jbG9uZSgpO1xuICAgICAgICByZXN1bHQub2JqZWN0cy5wdXNoKHJlc09iaik7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIF9wYXJzZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgLy/jgr/jgqTjg6vlsZ7mgKfmg4XloLHlj5blvpdcbiAgICAgIHZhciBtYXAgPSBkYXRhLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdtYXAnKVswXTtcbiAgICAgIHZhciBhdHRyID0gdGhpcy5fYXR0clRvSlNPTihtYXApO1xuICAgICAgdGhpcy4kZXh0ZW5kKGF0dHIpO1xuICAgICAgdGhpcy5wcm9wZXJ0aWVzID0gdGhpcy5fcHJvcGVydGllc1RvSlNPTihtYXApO1xuXG4gICAgICAvL+OCv+OCpOODq+OCu+ODg+ODiOWPluW+l1xuICAgICAgdGhpcy50aWxlc2V0cyA9IHRoaXMuX3BhcnNlVGlsZXNldHMoZGF0YSk7XG5cbiAgICAgIC8v44K/44Kk44Or44K744OD44OI5oOF5aCx6KOc5a6MXG4gICAgICB2YXIgZGVmYXVsdEF0dHIgPSB7XG4gICAgICAgIHRpbGV3aWR0aDogMzIsXG4gICAgICAgIHRpbGVoZWlnaHQ6IDMyLFxuICAgICAgICBzcGFjaW5nOiAwLFxuICAgICAgICBtYXJnaW46IDAsXG4gICAgICB9O1xuICAgICAgdGhpcy50aWxlc2V0cy5jaGlwcyA9IFtdO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnRpbGVzZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIC8v44K/44Kk44Or44K744OD44OI5bGe5oCn5oOF5aCx5Y+W5b6XXG4gICAgICAgIHZhciBhdHRyID0gdGhpcy5fYXR0clRvSlNPTihkYXRhLmdldEVsZW1lbnRzQnlUYWdOYW1lKCd0aWxlc2V0JylbaV0pO1xuICAgICAgICBhdHRyLiRzYWZlKGRlZmF1bHRBdHRyKTtcbiAgICAgICAgYXR0ci5maXJzdGdpZC0tO1xuICAgICAgICB0aGlzLnRpbGVzZXRzW2ldLiRleHRlbmQoYXR0cik7XG5cbiAgICAgICAgLy/jg57jg4Pjg5fjg4Hjg4Pjg5fjg6rjgrnjg4jkvZzmiJBcbiAgICAgICAgdmFyIHQgPSB0aGlzLnRpbGVzZXRzW2ldO1xuICAgICAgICB0aGlzLnRpbGVzZXRzW2ldLm1hcENoaXAgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgciA9IGF0dHIuZmlyc3RnaWQ7IHIgPCBhdHRyLmZpcnN0Z2lkK2F0dHIudGlsZWNvdW50OyByKyspIHtcbiAgICAgICAgICB2YXIgY2hpcCA9IHtcbiAgICAgICAgICAgIGltYWdlOiB0LmltYWdlLFxuICAgICAgICAgICAgeDogKChyIC0gYXR0ci5maXJzdGdpZCkgJSB0LmNvbHVtbnMpICogKHQudGlsZXdpZHRoICsgdC5zcGFjaW5nKSArIHQubWFyZ2luLFxuICAgICAgICAgICAgeTogTWF0aC5mbG9vcigociAtIGF0dHIuZmlyc3RnaWQpIC8gdC5jb2x1bW5zKSAqICh0LnRpbGVoZWlnaHQgKyB0LnNwYWNpbmcpICsgdC5tYXJnaW4sXG4gICAgICAgICAgfS4kc2FmZShhdHRyKTtcbiAgICAgICAgICB0aGlzLnRpbGVzZXRzLmNoaXBzW3JdID0gY2hpcDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvL+ODrOOCpOODpOODvOWPluW+l1xuICAgICAgdGhpcy5sYXllcnMgPSB0aGlzLl9wYXJzZUxheWVycyhkYXRhKTtcblxuICAgICAgLy/jgqTjg6Hjg7zjgrjjg4fjg7zjgr/oqq3jgb/ovrzjgb9cbiAgICAgIHRoaXMuX2NoZWNrSW1hZ2UoKTtcbiAgICB9LFxuXG4gICAgLy/jgqLjgrvjg4Pjg4jjgavnhKHjgYTjgqTjg6Hjg7zjgrjjg4fjg7zjgr/jgpLoqq3jgb/ovrzjgb9cbiAgICBfY2hlY2tJbWFnZTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICB2YXIgaW1hZ2VTb3VyY2UgPSBbXTtcbiAgICAgIHZhciBsb2FkSW1hZ2UgPSBbXTtcblxuICAgICAgLy/kuIDopqfkvZzmiJBcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy50aWxlc2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgb2JqID0ge1xuICAgICAgICAgIGltYWdlOiB0aGlzLnRpbGVzZXRzW2ldLmltYWdlLFxuICAgICAgICAgIHRyYW5zUjogdGhpcy50aWxlc2V0c1tpXS50cmFuc1IsXG4gICAgICAgICAgdHJhbnNHOiB0aGlzLnRpbGVzZXRzW2ldLnRyYW5zRyxcbiAgICAgICAgICB0cmFuc0I6IHRoaXMudGlsZXNldHNbaV0udHJhbnNCLFxuICAgICAgICB9O1xuICAgICAgICBpbWFnZVNvdXJjZS5wdXNoKG9iaik7XG4gICAgICB9XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0aGlzLmxheWVyc1tpXS5pbWFnZSkge1xuICAgICAgICAgIHZhciBvYmogPSB7XG4gICAgICAgICAgICBpbWFnZTogdGhpcy5sYXllcnNbaV0uaW1hZ2Uuc291cmNlXG4gICAgICAgICAgfTtcbiAgICAgICAgICBpbWFnZVNvdXJjZS5wdXNoKG9iaik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy/jgqLjgrvjg4Pjg4jjgavjgYLjgovjgYvnorroqo1cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW1hZ2VTb3VyY2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGltYWdlID0gcGhpbmEuYXNzZXQuQXNzZXRNYW5hZ2VyLmdldCgnaW1hZ2UnLCBpbWFnZVNvdXJjZVtpXS5pbWFnZSk7XG4gICAgICAgIGlmIChpbWFnZSkge1xuICAgICAgICAgIC8v44Ki44K744OD44OI44Gr44GC44KLXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy/jgarjgYvjgaPjgZ/jga7jgafjg63jg7zjg4njg6rjgrnjg4jjgavov73liqBcbiAgICAgICAgICBsb2FkSW1hZ2UucHVzaChpbWFnZVNvdXJjZVtpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy/kuIDmi6zjg63jg7zjg4lcbiAgICAgIC8v44Ot44O844OJ44Oq44K544OI5L2c5oiQXG4gICAgICB2YXIgYXNzZXRzID0ge1xuICAgICAgICBpbWFnZTogW11cbiAgICAgIH07XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxvYWRJbWFnZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAvL+OCpOODoeODvOOCuOOBruODkeOCueOCkuODnuODg+ODl+OBqOWQjOOBmOOBq+OBmeOCi1xuICAgICAgICBhc3NldHMuaW1hZ2VbaW1hZ2VTb3VyY2VbaV0uaW1hZ2VdID0gdGhpcy5wYXRoK2ltYWdlU291cmNlW2ldLmltYWdlO1xuICAgICAgfVxuICAgICAgaWYgKGxvYWRJbWFnZS5sZW5ndGgpIHtcbiAgICAgICAgdmFyIGxvYWRlciA9IHBoaW5hLmFzc2V0LkFzc2V0TG9hZGVyKCk7XG4gICAgICAgIGxvYWRlci5sb2FkKGFzc2V0cyk7XG4gICAgICAgIGxvYWRlci5vbignbG9hZCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAvL+mAj+mBjuiJsuioreWumuWPjeaYoFxuICAgICAgICAgIGxvYWRJbWFnZS5mb3JFYWNoKGZ1bmN0aW9uKGVsbSkge1xuICAgICAgICAgICAgdmFyIGltYWdlID0gcGhpbmEuYXNzZXQuQXNzZXRNYW5hZ2VyLmdldCgnaW1hZ2UnLCBlbG0uaW1hZ2UpO1xuICAgICAgICAgICAgaWYgKGVsbS50cmFuc1IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICB2YXIgciA9IGVsbS50cmFuc1IsIGcgPSBlbG0udHJhbnNHLCBiID0gZWxtLnRyYW5zQjtcbiAgICAgICAgICAgICAgaW1hZ2UuZmlsdGVyKGZ1bmN0aW9uKHBpeGVsLCBpbmRleCwgeCwgeSwgYml0bWFwKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBiaXRtYXAuZGF0YTtcbiAgICAgICAgICAgICAgICBpZiAocGl4ZWxbMF0gPT0gciAmJiBwaXhlbFsxXSA9PSBnICYmIHBpeGVsWzJdID09IGIpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YVtpbmRleCszXSA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICAvL+ODnuODg+ODl+OCpOODoeODvOOCuOeUn+aIkFxuICAgICAgICAgIHRoYXQuaW1hZ2UgPSB0aGF0Ll9nZW5lcmF0ZUltYWdlKCk7XG4gICAgICAgICAgLy/oqq3jgb/ovrzjgb/ntYLkuoZcbiAgICAgICAgICB0aGF0Ll9yZXNvbHZlKHRoYXQpO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy/jg57jg4Pjg5fjgqTjg6Hjg7zjgrjnlJ/miJBcbiAgICAgICAgdGhpcy5pbWFnZSA9IHRoYXQuX2dlbmVyYXRlSW1hZ2UoKTtcbiAgICAgICAgLy/oqq3jgb/ovrzjgb/ntYLkuoZcbiAgICAgICAgdGhpcy5fcmVzb2x2ZSh0aGF0KTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLy/jg57jg4Pjg5fjgqTjg6Hjg7zjgrjkvZzmiJBcbiAgICBfZ2VuZXJhdGVJbWFnZTogZnVuY3Rpb24obGF5ZXJOYW1lKSB7XG4gICAgICB2YXIgbnVtTGF5ZXIgPSAwO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodGhpcy5sYXllcnNbaV0udHlwZSA9PSBcImxheWVyXCIgfHwgdGhpcy5sYXllcnNbaV0udHlwZSA9PSBcImltYWdlbGF5ZXJcIikgbnVtTGF5ZXIrKztcbiAgICAgIH1cbiAgICAgIGlmIChudW1MYXllciA9PSAwKSByZXR1cm4gbnVsbDtcblxuICAgICAgdmFyIHdpZHRoID0gdGhpcy53aWR0aCAqIHRoaXMudGlsZXdpZHRoO1xuICAgICAgdmFyIGhlaWdodCA9IHRoaXMuaGVpZ2h0ICogdGhpcy50aWxlaGVpZ2h0O1xuICAgICAgdmFyIGNhbnZhcyA9IHBoaW5hLmdyYXBoaWNzLkNhbnZhcygpLnNldFNpemUod2lkdGgsIGhlaWdodCk7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sYXllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgLy/jg57jg4Pjg5fjg6zjgqTjg6Tjg7xcbiAgICAgICAgaWYgKHRoaXMubGF5ZXJzW2ldLnR5cGUgPT0gXCJsYXllclwiICYmIHRoaXMubGF5ZXJzW2ldLnZpc2libGUgIT0gXCIwXCIpIHtcbiAgICAgICAgICBpZiAobGF5ZXJOYW1lID09PSB1bmRlZmluZWQgfHwgbGF5ZXJOYW1lID09PSB0aGlzLmxheWVyc1tpXS5uYW1lKSB7XG4gICAgICAgICAgICB2YXIgbGF5ZXIgPSB0aGlzLmxheWVyc1tpXTtcbiAgICAgICAgICAgIHZhciBtYXBkYXRhID0gbGF5ZXIuZGF0YTtcbiAgICAgICAgICAgIHZhciB3aWR0aCA9IGxheWVyLndpZHRoO1xuICAgICAgICAgICAgdmFyIGhlaWdodCA9IGxheWVyLmhlaWdodDtcbiAgICAgICAgICAgIHZhciBvcGFjaXR5ID0gbGF5ZXIub3BhY2l0eSB8fCAxLjA7XG4gICAgICAgICAgICB2YXIgY291bnQgPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgeSA9IDA7IHkgPCBoZWlnaHQ7IHkrKykge1xuICAgICAgICAgICAgICBmb3IgKHZhciB4ID0gMDsgeCA8IHdpZHRoOyB4KyspIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBtYXBkYXRhW2NvdW50XTtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAvL+ODnuODg+ODl+ODgeODg+ODl+OCkumFjee9rlxuICAgICAgICAgICAgICAgICAgdGhpcy5fc2V0TWFwQ2hpcChjYW52YXMsIGluZGV4LCB4ICogdGhpcy50aWxld2lkdGgsIHkgKiB0aGlzLnRpbGVoZWlnaHQsIG9wYWNpdHkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8v44Kq44OW44K444Kn44Kv44OI44Kw44Or44O844OXXG4gICAgICAgIGlmICh0aGlzLmxheWVyc1tpXS50eXBlID09IFwib2JqZWN0Z3JvdXBcIiAmJiB0aGlzLmxheWVyc1tpXS52aXNpYmxlICE9IFwiMFwiKSB7XG4gICAgICAgICAgaWYgKGxheWVyTmFtZSA9PT0gdW5kZWZpbmVkIHx8IGxheWVyTmFtZSA9PT0gdGhpcy5sYXllcnNbaV0ubmFtZSkge1xuICAgICAgICAgICAgdmFyIGxheWVyID0gdGhpcy5sYXllcnNbaV07XG4gICAgICAgICAgICB2YXIgb3BhY2l0eSA9IGxheWVyLm9wYWNpdHkgfHwgMS4wO1xuICAgICAgICAgICAgbGF5ZXIub2JqZWN0cy5mb3JFYWNoKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgaWYgKGUuZ2lkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0TWFwQ2hpcChjYW52YXMsIGUuZ2lkLCBlLngsIGUueSwgb3BhY2l0eSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8v44Kk44Oh44O844K444Os44Kk44Ok44O8XG4gICAgICAgIGlmICh0aGlzLmxheWVyc1tpXS50eXBlID09IFwiaW1hZ2VsYXllclwiICYmIHRoaXMubGF5ZXJzW2ldLnZpc2libGUgIT0gXCIwXCIpIHtcbiAgICAgICAgICBpZiAobGF5ZXJOYW1lID09PSB1bmRlZmluZWQgfHwgbGF5ZXJOYW1lID09PSB0aGlzLmxheWVyc1tpXS5uYW1lKSB7XG4gICAgICAgICAgICB2YXIgbGVuID0gdGhpcy5sYXllcnNbaV07XG4gICAgICAgICAgICB2YXIgaW1hZ2UgPSBwaGluYS5hc3NldC5Bc3NldE1hbmFnZXIuZ2V0KCdpbWFnZScsIHRoaXMubGF5ZXJzW2ldLmltYWdlLnNvdXJjZSk7XG4gICAgICAgICAgICBjYW52YXMuY29udGV4dC5kcmF3SW1hZ2UoaW1hZ2UuZG9tRWxlbWVudCwgdGhpcy5sYXllcnNbaV0ueCwgdGhpcy5sYXllcnNbaV0ueSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciB0ZXh0dXJlID0gcGhpbmEuYXNzZXQuVGV4dHVyZSgpO1xuICAgICAgdGV4dHVyZS5kb21FbGVtZW50ID0gY2FudmFzLmRvbUVsZW1lbnQ7XG4gICAgICByZXR1cm4gdGV4dHVyZTtcbiAgICB9LFxuXG4gICAgLy/jgq3jg6Pjg7Pjg5Djgrnjga7mjIflrprjgZfjgZ/luqfmqJnjgavjg57jg4Pjg5fjg4Hjg4Pjg5fjga7jgqTjg6Hjg7zjgrjjgpLjgrPjg5Tjg7zjgZnjgotcbiAgICBfc2V0TWFwQ2hpcDogZnVuY3Rpb24oY2FudmFzLCBpbmRleCwgeCwgeSwgb3BhY2l0eSkge1xuICAgICAgLy/jgr/jgqTjg6vjgrvjg4Pjg4jjgYvjgonjg57jg4Pjg5fjg4Hjg4Pjg5fjgpLlj5blvpdcbiAgICAgIHZhciBjaGlwID0gdGhpcy50aWxlc2V0cy5jaGlwc1tpbmRleF07XG4gICAgICB2YXIgaW1hZ2UgPSBwaGluYS5hc3NldC5Bc3NldE1hbmFnZXIuZ2V0KCdpbWFnZScsIGNoaXAuaW1hZ2UpO1xuICAgICAgY2FudmFzLmNvbnRleHQuZHJhd0ltYWdlKFxuICAgICAgICBpbWFnZS5kb21FbGVtZW50LFxuICAgICAgICBjaGlwLnggKyBjaGlwLm1hcmdpbiwgY2hpcC55ICsgY2hpcC5tYXJnaW4sXG4gICAgICAgIGNoaXAudGlsZXdpZHRoLCBjaGlwLnRpbGVoZWlnaHQsXG4gICAgICAgIHgsIHksXG4gICAgICAgIGNoaXAudGlsZXdpZHRoLCBjaGlwLnRpbGVoZWlnaHQpO1xuICAgIH0sXG5cbiAgICAvL1hNTOODl+ODreODkeODhuOCo+OCkkpTT07jgavlpInmj5tcbiAgICBfcHJvcGVydGllc1RvSlNPTjogZnVuY3Rpb24oZWxtKSB7XG4gICAgICB2YXIgcHJvcGVydGllcyA9IGVsbS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInByb3BlcnRpZXNcIilbMF07XG4gICAgICB2YXIgb2JqID0ge307XG4gICAgICBpZiAocHJvcGVydGllcyA9PT0gdW5kZWZpbmVkKSByZXR1cm4gb2JqO1xuXG4gICAgICBmb3IgKHZhciBrID0gMDsgayA8IHByb3BlcnRpZXMuY2hpbGROb2Rlcy5sZW5ndGg7IGsrKykge1xuICAgICAgICB2YXIgcCA9IHByb3BlcnRpZXMuY2hpbGROb2Rlc1trXTtcbiAgICAgICAgaWYgKHAudGFnTmFtZSA9PT0gXCJwcm9wZXJ0eVwiKSB7XG4gICAgICAgICAgLy9wcm9wZXJ0eeOBq3R5cGXmjIflrprjgYzjgYLjgaPjgZ/jgonlpInmj5tcbiAgICAgICAgICB2YXIgdHlwZSA9IHAuZ2V0QXR0cmlidXRlKCd0eXBlJyk7XG4gICAgICAgICAgdmFyIHZhbHVlID0gcC5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJyk7XG4gICAgICAgICAgaWYgKCF2YWx1ZSkgdmFsdWUgPSBwLnRleHRDb250ZW50O1xuICAgICAgICAgIGlmICh0eXBlID09IFwiaW50XCIpIHtcbiAgICAgICAgICAgIG9ialtwLmdldEF0dHJpYnV0ZSgnbmFtZScpXSA9IHBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgfSBlbHNlIGlmICh0eXBlID09IFwiZmxvYXRcIikge1xuICAgICAgICAgICAgb2JqW3AuZ2V0QXR0cmlidXRlKCduYW1lJyldID0gcGFyc2VGbG9hdCh2YWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIGlmICh0eXBlID09IFwiYm9vbFwiICkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09IFwidHJ1ZVwiKSBvYmpbcC5nZXRBdHRyaWJ1dGUoJ25hbWUnKV0gPSB0cnVlO1xuICAgICAgICAgICAgZWxzZSBvYmpbcC5nZXRBdHRyaWJ1dGUoJ25hbWUnKV0gPSBmYWxzZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb2JqW3AuZ2V0QXR0cmlidXRlKCduYW1lJyldID0gdmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gb2JqO1xuICAgIH0sXG5cbiAgICAvL1hNTOWxnuaAp+OCkkpTT07jgavlpInmj5tcbiAgICBfYXR0clRvSlNPTjogZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICB2YXIgb2JqID0ge307XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNvdXJjZS5hdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciB2YWwgPSBzb3VyY2UuYXR0cmlidXRlc1tpXS52YWx1ZTtcbiAgICAgICAgdmFsID0gaXNOYU4ocGFyc2VGbG9hdCh2YWwpKT8gdmFsOiBwYXJzZUZsb2F0KHZhbCk7XG4gICAgICAgIG9ialtzb3VyY2UuYXR0cmlidXRlc1tpXS5uYW1lXSA9IHZhbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBvYmo7XG4gICAgfSxcblxuICAgIC8vWE1M5bGe5oCn44KSSlNPTuOBq+WkieaPm++8iFN0cmluZ+OBp+i/lOOBme+8iVxuICAgIF9hdHRyVG9KU09OX3N0cjogZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICB2YXIgb2JqID0ge307XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNvdXJjZS5hdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciB2YWwgPSBzb3VyY2UuYXR0cmlidXRlc1tpXS52YWx1ZTtcbiAgICAgICAgb2JqW3NvdXJjZS5hdHRyaWJ1dGVzW2ldLm5hbWVdID0gdmFsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG9iajtcbiAgICB9LFxuXG4gICAgLy/jgr/jgqTjg6vjgrvjg4Pjg4jjga7jg5Hjg7zjgrlcbiAgICBfcGFyc2VUaWxlc2V0czogZnVuY3Rpb24oeG1sKSB7XG4gICAgICB2YXIgZWFjaCA9IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoO1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIGRhdGEgPSBbXTtcbiAgICAgIHZhciB0aWxlc2V0cyA9IHhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZSgndGlsZXNldCcpO1xuICAgICAgZWFjaC5jYWxsKHRpbGVzZXRzLCBmdW5jdGlvbih0aWxlc2V0KSB7XG4gICAgICAgIHZhciB0ID0ge307XG4gICAgICAgIHZhciBwcm9wcyA9IHNlbGYuX3Byb3BlcnRpZXNUb0pTT04odGlsZXNldCk7XG4gICAgICAgIGlmIChwcm9wcy5zcmMpIHtcbiAgICAgICAgICB0LmltYWdlID0gcHJvcHMuc3JjO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHQuaW1hZ2UgPSB0aWxlc2V0LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbWFnZScpWzBdLmdldEF0dHJpYnV0ZSgnc291cmNlJyk7XG4gICAgICAgIH1cbiAgICAgICAgLy/pgI/pgY7oibLoqK3lrprlj5blvpdcbiAgICAgICAgdC50cmFucyA9IHRpbGVzZXQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2ltYWdlJylbMF0uZ2V0QXR0cmlidXRlKCd0cmFucycpO1xuICAgICAgICBpZiAodC50cmFucykge1xuICAgICAgICAgIHQudHJhbnNSID0gcGFyc2VJbnQodC50cmFucy5zdWJzdHJpbmcoMCwgMiksIDE2KTtcbiAgICAgICAgICB0LnRyYW5zRyA9IHBhcnNlSW50KHQudHJhbnMuc3Vic3RyaW5nKDIsIDQpLCAxNik7XG4gICAgICAgICAgdC50cmFuc0IgPSBwYXJzZUludCh0LnRyYW5zLnN1YnN0cmluZyg0LCA2KSwgMTYpO1xuICAgICAgICB9XG5cbiAgICAgICAgZGF0YS5wdXNoKHQpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gZGF0YTtcbiAgICB9LFxuXG4gICAgLy/jg6zjgqTjg6Tjg7zmg4XloLHjga7jg5Hjg7zjgrlcbiAgICBfcGFyc2VMYXllcnM6IGZ1bmN0aW9uKHhtbCkge1xuICAgICAgdmFyIGVhY2ggPSBBcnJheS5wcm90b3R5cGUuZm9yRWFjaDtcbiAgICAgIHZhciBkYXRhID0gW107XG5cbiAgICAgIHZhciBtYXAgPSB4bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJtYXBcIilbMF07XG4gICAgICB2YXIgbGF5ZXJzID0gW107XG4gICAgICBlYWNoLmNhbGwobWFwLmNoaWxkTm9kZXMsIGZ1bmN0aW9uKGVsbSkge1xuICAgICAgICBpZiAoZWxtLnRhZ05hbWUgPT0gXCJsYXllclwiIHx8IGVsbS50YWdOYW1lID09IFwib2JqZWN0Z3JvdXBcIiB8fCBlbG0udGFnTmFtZSA9PSBcImltYWdlbGF5ZXJcIikge1xuICAgICAgICAgIGxheWVycy5wdXNoKGVsbSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBsYXllcnMuZWFjaChmdW5jdGlvbihsYXllcikge1xuICAgICAgICBzd2l0Y2ggKGxheWVyLnRhZ05hbWUpIHtcbiAgICAgICAgICBjYXNlIFwibGF5ZXJcIjpcbiAgICAgICAgICAgIC8v6YCa5bi444Os44Kk44Ok44O8XG4gICAgICAgICAgICB2YXIgZCA9IGxheWVyLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdkYXRhJylbMF07XG4gICAgICAgICAgICB2YXIgZW5jb2RpbmcgPSBkLmdldEF0dHJpYnV0ZShcImVuY29kaW5nXCIpO1xuICAgICAgICAgICAgdmFyIGwgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJsYXllclwiLFxuICAgICAgICAgICAgICAgIG5hbWU6IGxheWVyLmdldEF0dHJpYnV0ZShcIm5hbWVcIiksXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoZW5jb2RpbmcgPT0gXCJjc3ZcIikge1xuICAgICAgICAgICAgICAgIGwuZGF0YSA9IHRoaXMuX3BhcnNlQ1NWKGQudGV4dENvbnRlbnQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChlbmNvZGluZyA9PSBcImJhc2U2NFwiKSB7XG4gICAgICAgICAgICAgICAgbC5kYXRhID0gdGhpcy5fcGFyc2VCYXNlNjQoZC50ZXh0Q29udGVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBhdHRyID0gdGhpcy5fYXR0clRvSlNPTihsYXllcik7XG4gICAgICAgICAgICBsLiRleHRlbmQoYXR0cik7XG4gICAgICAgICAgICBsLnByb3BlcnRpZXMgPSB0aGlzLl9wcm9wZXJ0aWVzVG9KU09OKGxheWVyKTtcblxuICAgICAgICAgICAgZGF0YS5wdXNoKGwpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAvL+OCquODluOCuOOCp+OCr+ODiOODrOOCpOODpOODvFxuICAgICAgICAgIGNhc2UgXCJvYmplY3Rncm91cFwiOlxuICAgICAgICAgICAgdmFyIGwgPSB7XG4gICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0Z3JvdXBcIixcbiAgICAgICAgICAgICAgb2JqZWN0czogW10sXG4gICAgICAgICAgICAgIG5hbWU6IGxheWVyLmdldEF0dHJpYnV0ZShcIm5hbWVcIiksXG4gICAgICAgICAgICAgIHg6IHBhcnNlRmxvYXQobGF5ZXIuZ2V0QXR0cmlidXRlKFwib2Zmc2V0eFwiKSkgfHwgMCxcbiAgICAgICAgICAgICAgeTogcGFyc2VGbG9hdChsYXllci5nZXRBdHRyaWJ1dGUoXCJvZmZzZXR5XCIpKSB8fCAwLFxuICAgICAgICAgICAgICBhbHBoYTogbGF5ZXIuZ2V0QXR0cmlidXRlKFwib3BhY2l0eVwiKSB8fCAxLFxuICAgICAgICAgICAgICBjb2xvcjogbGF5ZXIuZ2V0QXR0cmlidXRlKFwiY29sb3JcIikgfHwgbnVsbCxcbiAgICAgICAgICAgICAgZHJhd29yZGVyOiBsYXllci5nZXRBdHRyaWJ1dGUoXCJkcmF3b3JkZXJcIikgfHwgbnVsbCxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBlYWNoLmNhbGwobGF5ZXIuY2hpbGROb2RlcywgZnVuY3Rpb24oZWxtKSB7XG4gICAgICAgICAgICAgIGlmIChlbG0ubm9kZVR5cGUgPT0gMykgcmV0dXJuO1xuICAgICAgICAgICAgICB2YXIgZCA9IHRoaXMuX2F0dHJUb0pTT04oZWxtKTtcbiAgICAgICAgICAgICAgZC5wcm9wZXJ0aWVzID0gdGhpcy5fcHJvcGVydGllc1RvSlNPTihlbG0pO1xuICAgICAgICAgICAgICAvL+WtkOimgee0oOOBruino+aekFxuICAgICAgICAgICAgICBpZiAoZWxtLmNoaWxkTm9kZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZWxtLmNoaWxkTm9kZXMuZm9yRWFjaChmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoZS5ub2RlVHlwZSA9PSAzKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAvL+alleWGhlxuICAgICAgICAgICAgICAgICAgaWYgKGUubm9kZU5hbWUgPT0gJ2VsbGlwc2UnKSB7XG4gICAgICAgICAgICAgICAgICAgIGQuZWxsaXBzZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAvL+WkmuinkuW9olxuICAgICAgICAgICAgICAgICAgaWYgKGUubm9kZU5hbWUgPT0gJ3BvbHlnb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGQucG9seWdvbiA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXR0ciA9IHRoaXMuX2F0dHJUb0pTT05fc3RyKGUpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGwgPSBhdHRyLnBvaW50cy5zcGxpdChcIiBcIik7XG4gICAgICAgICAgICAgICAgICAgIHBsLmZvckVhY2goZnVuY3Rpb24oc3RyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdmFyIHB0cyA9IHN0ci5zcGxpdChcIixcIik7XG4gICAgICAgICAgICAgICAgICAgICAgZC5wb2x5Z29uLnB1c2goe3g6IHBhcnNlRmxvYXQocHRzWzBdKSwgeTogcGFyc2VGbG9hdChwdHNbMV0pfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgLy/nt5rliIZcbiAgICAgICAgICAgICAgICAgIGlmIChlLm5vZGVOYW1lID09ICdwb2x5bGluZScpIHtcbiAgICAgICAgICAgICAgICAgICAgZC5wb2x5bGluZSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXR0ciA9IHRoaXMuX2F0dHJUb0pTT05fc3RyKGUpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGwgPSBhdHRyLnBvaW50cy5zcGxpdChcIiBcIik7XG4gICAgICAgICAgICAgICAgICAgIHBsLmZvckVhY2goZnVuY3Rpb24oc3RyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdmFyIHB0cyA9IHN0ci5zcGxpdChcIixcIik7XG4gICAgICAgICAgICAgICAgICAgICAgZC5wb2x5bGluZS5wdXNoKHt4OiBwYXJzZUZsb2F0KHB0c1swXSksIHk6IHBhcnNlRmxvYXQocHRzWzFdKX0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGwub2JqZWN0cy5wdXNoKGQpO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgICAgIGwucHJvcGVydGllcyA9IHRoaXMuX3Byb3BlcnRpZXNUb0pTT04obGF5ZXIpO1xuXG4gICAgICAgICAgICBkYXRhLnB1c2gobCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIC8v44Kk44Oh44O844K444Os44Kk44Ok44O8XG4gICAgICAgICAgY2FzZSBcImltYWdlbGF5ZXJcIjpcbiAgICAgICAgICAgICAgdmFyIGwgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJpbWFnZWxheWVyXCIsXG4gICAgICAgICAgICAgICAgbmFtZTogbGF5ZXIuZ2V0QXR0cmlidXRlKFwibmFtZVwiKSxcbiAgICAgICAgICAgICAgICB4OiBwYXJzZUZsb2F0KGxheWVyLmdldEF0dHJpYnV0ZShcIm9mZnNldHhcIikpIHx8IDAsXG4gICAgICAgICAgICAgICAgeTogcGFyc2VGbG9hdChsYXllci5nZXRBdHRyaWJ1dGUoXCJvZmZzZXR5XCIpKSB8fCAwLFxuICAgICAgICAgICAgICAgIGFscGhhOiBsYXllci5nZXRBdHRyaWJ1dGUoXCJvcGFjaXR5XCIpIHx8IDEsXG4gICAgICAgICAgICAgICAgdmlzaWJsZTogKGxheWVyLmdldEF0dHJpYnV0ZShcInZpc2libGVcIikgPT09IHVuZGVmaW5lZCB8fCBsYXllci5nZXRBdHRyaWJ1dGUoXCJ2aXNpYmxlXCIpICE9IDApLFxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB2YXIgaW1hZ2VFbG0gPSBsYXllci5nZXRFbGVtZW50c0J5VGFnTmFtZShcImltYWdlXCIpWzBdO1xuICAgICAgICAgICAgICBsLmltYWdlID0ge3NvdXJjZTogaW1hZ2VFbG0uZ2V0QXR0cmlidXRlKFwic291cmNlXCIpfTtcblxuICAgICAgICAgICAgICBkYXRhLnB1c2gobCk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfSxcblxuICAgIC8vQ1NW44OR44O844K5XG4gICAgX3BhcnNlQ1NWOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICB2YXIgZGF0YUxpc3QgPSBkYXRhLnNwbGl0KCcsJyk7XG4gICAgICB2YXIgbGF5ZXIgPSBbXTtcblxuICAgICAgZGF0YUxpc3QuZWFjaChmdW5jdGlvbihlbG0sIGkpIHtcbiAgICAgICAgdmFyIG51bSA9IHBhcnNlSW50KGVsbSwgMTApIC0gMTtcbiAgICAgICAgbGF5ZXIucHVzaChudW0pO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBsYXllcjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQkFTRTY044OR44O844K5XG4gICAgICogaHR0cDovL3RoZWthbm5vbi1zZXJ2ZXIuYXBwc3BvdC5jb20vaGVycGl0eS1kZXJwaXR5LmFwcHNwb3QuY29tL3Bhc3RlYmluLmNvbS83NUtrczBXSFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3BhcnNlQmFzZTY0OiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICB2YXIgZGF0YUxpc3QgPSBhdG9iKGRhdGEudHJpbSgpKTtcbiAgICAgIHZhciByc3QgPSBbXTtcblxuICAgICAgZGF0YUxpc3QgPSBkYXRhTGlzdC5zcGxpdCgnJykubWFwKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgcmV0dXJuIGUuY2hhckNvZGVBdCgwKTtcbiAgICAgIH0pO1xuXG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gZGF0YUxpc3QubGVuZ3RoIC8gNDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgIHZhciBuID0gZGF0YUxpc3RbaSo0XTtcbiAgICAgICAgcnN0W2ldID0gcGFyc2VJbnQobiwgMTApIC0gMTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJzdDtcbiAgICB9LFxuICB9KTtcblxuICAvL+ODreODvOODgOODvOOBq+i/veWKoFxuICBwaGluYS5hc3NldC5Bc3NldExvYWRlci5hc3NldExvYWRGdW5jdGlvbnMudG14ID0gZnVuY3Rpb24oa2V5LCBwYXRoKSB7XG4gICAgdmFyIHRteCA9IHBoaW5hLmFzc2V0LlRpbGVkTWFwKCk7XG4gICAgcmV0dXJuIHRteC5sb2FkKHBhdGgpO1xuICB9O1xuXG59KTsiLCIvL1xuLy8g5rGO55So6Zai5pWw576kXG4vL1xucGhpbmEuZGVmaW5lKFwiVXRpbFwiLCB7XG4gIF9zdGF0aWM6IHtcblxuICAgIC8v5oyH5a6a44GV44KM44Gf44Kq44OW44K444Kn44Kv44OI44KS44Or44O844OI44Go44GX44Gm55uu55qE44GuaWTjgpLotbDmn7vjgZnjgotcbiAgICBmaW5kQnlJZDogZnVuY3Rpb24oaWQsIG9iaikge1xuICAgICAgaWYgKG9iai5pZCA9PT0gaWQpIHJldHVybiBvYmo7XG4gICAgICBjb25zdCBjaGlsZHJlbiA9IE9iamVjdC5rZXlzKG9iai5jaGlsZHJlbiB8fCB7fSkubWFwKGtleSA9PiBvYmouY2hpbGRyZW5ba2V5XSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGhpdCA9IHRoaXMuZmluZEJ5SWQoaWQsIGNoaWxkcmVuW2ldKTtcbiAgICAgICAgaWYgKGhpdCkgcmV0dXJuIGhpdDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG5cbiAgICAvL1RPRE8644GT44GT44GY44KD44Gq44GE5oSf44GM44GC44KL44Gu44Gn44GZ44GM44CB5LiA5pem5a6f6KOFXG4gICAgLy/mjIflrprjgZXjgozjgZ9B44GoQuOBrmFzc2V0c+OBrumAo+aDs+mFjeWIl+OCkuaWsOimj+OBruOCquODluOCuOOCp+OCr+ODiOOBq+ODnuODvOOCuOOBmeOCi1xuICAgIG1lcmdlQXNzZXRzOiBmdW5jdGlvbihhc3NldHNBLCBhc3NldHNCKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICAgIGFzc2V0c0EuZm9ySW4oKHR5cGVLZXksIHR5cGVWYWx1ZSkgPT4ge1xuICAgICAgICBpZiAoIXJlc3VsdC4kaGFzKHR5cGVLZXkpKSByZXN1bHRbdHlwZUtleV0gPSB7fTtcbiAgICAgICAgdHlwZVZhbHVlLmZvckluKChhc3NldEtleSwgYXNzZXRQYXRoKSA9PiB7XG4gICAgICAgICAgcmVzdWx0W3R5cGVLZXldW2Fzc2V0S2V5XSA9IGFzc2V0UGF0aDtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIGFzc2V0c0IuZm9ySW4oKHR5cGVLZXksIHR5cGVWYWx1ZSkgPT4ge1xuICAgICAgICBpZiAoIXJlc3VsdC4kaGFzKHR5cGVLZXkpKSByZXN1bHRbdHlwZUtleV0gPSB7fTtcbiAgICAgICAgdHlwZVZhbHVlLmZvckluKChhc3NldEtleSwgYXNzZXRQYXRoKSA9PiB7XG4gICAgICAgICAgcmVzdWx0W3R5cGVLZXldW2Fzc2V0S2V5XSA9IGFzc2V0UGF0aDtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIC8v54++5Zyo5pmC6ZaT44GL44KJ5oyH5a6a5pmC6ZaT44G+44Gn44Gp44Gu44GP44KJ44GE44GL44GL44KL44GL44KS6L+U5Y2044GZ44KLXG4gICAgLy9cbiAgICAvLyBvdXRwdXQgOiB7IFxuICAgIC8vICAgdG90YWxEYXRlOjAgLCBcbiAgICAvLyAgIHRvdGFsSG91cjowICwgXG4gICAgLy8gICB0b3RhbE1pbnV0ZXM6MCAsIFxuICAgIC8vICAgdG90YWxTZWNvbmRzOjAgLFxuICAgIC8vICAgZGF0ZTowICwgXG4gICAgLy8gICBob3VyOjAgLCBcbiAgICAvLyAgIG1pbnV0ZXM6MCAsIFxuICAgIC8vICAgc2Vjb25kczowIFxuICAgIC8vIH1cbiAgICAvL1xuXG4gICAgY2FsY1JlbWFpbmluZ1RpbWU6IGZ1bmN0aW9uKGZpbmlzaCkge1xuICAgICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHtcbiAgICAgICAgXCJ0b3RhbERhdGVcIjogMCxcbiAgICAgICAgXCJ0b3RhbEhvdXJcIjogMCxcbiAgICAgICAgXCJ0b3RhbE1pbnV0ZXNcIjogMCxcbiAgICAgICAgXCJ0b3RhbFNlY29uZHNcIjogMCxcbiAgICAgICAgXCJkYXRlXCI6IDAsXG4gICAgICAgIFwiaG91clwiOiAwLFxuICAgICAgICBcIm1pbnV0ZXNcIjogMCxcbiAgICAgICAgXCJzZWNvbmRzXCI6IDAsXG4gICAgICB9XG5cbiAgICAgIGZpbmlzaCA9IChmaW5pc2ggaW5zdGFuY2VvZiBEYXRlKSA/IGZpbmlzaCA6IG5ldyBEYXRlKGZpbmlzaCk7XG4gICAgICBsZXQgZGlmZiA9IGZpbmlzaCAtIG5vdztcbiAgICAgIGlmIChkaWZmID09PSAwKSByZXR1cm4gcmVzdWx0O1xuXG4gICAgICBjb25zdCBzaWduID0gKGRpZmYgPCAwKSA/IC0xIDogMTtcblxuICAgICAgLy9UT0RPOuOBk+OBrui+uuOCiuOCguOBhuWwkeOBl+e2uum6l+OBq+abuOOBkeOBquOBhOOBi+aknOiojlxuICAgICAgLy/ljZjkvY3liKUgMeacqua6gOOBrzBcbiAgICAgIHJlc3VsdFtcInRvdGFsRGF0ZVwiXSA9IHBhcnNlSW50KGRpZmYgLyAxMDAwIC8gNjAgLyA2MCAvIDI0KTtcbiAgICAgIHJlc3VsdFtcInRvdGFsSG91clwiXSA9IHBhcnNlSW50KGRpZmYgLyAxMDAwIC8gNjAgLyA2MCk7XG4gICAgICByZXN1bHRbXCJ0b3RhbE1pbnV0ZXNcIl0gPSBwYXJzZUludChkaWZmIC8gMTAwMCAvIDYwKTtcbiAgICAgIHJlc3VsdFtcInRvdGFsU2Vjb25kc1wiXSA9IHBhcnNlSW50KGRpZmYgLyAxMDAwKTtcblxuICAgICAgZGlmZiAtPSByZXN1bHRbXCJ0b3RhbERhdGVcIl0gKiA4NjQwMDAwMDtcbiAgICAgIHJlc3VsdFtcImhvdXJcIl0gPSBwYXJzZUludChkaWZmIC8gMTAwMCAvIDYwIC8gNjApO1xuXG4gICAgICBkaWZmIC09IHJlc3VsdFtcImhvdXJcIl0gKiAzNjAwMDAwO1xuICAgICAgcmVzdWx0W1wibWludXRlc1wiXSA9IHBhcnNlSW50KGRpZmYgLyAxMDAwIC8gNjApO1xuXG4gICAgICBkaWZmIC09IHJlc3VsdFtcIm1pbnV0ZXNcIl0gKiA2MDAwMDtcbiAgICAgIHJlc3VsdFtcInNlY29uZHNcIl0gPSBwYXJzZUludChkaWZmIC8gMTAwMCk7XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG5cbiAgICB9LFxuXG4gICAgLy/jg6zjgqTjgqLjgqbjg4jjgqjjg4fjgqPjgr/jg7zjgafjga9TcHJpdGXlhajjgaZBdGFsc1Nwcml0ZeOBq+OBquOBo+OBpuOBl+OBvuOBhuOBn+OCgeOAgVxuICAgIC8vU3ByaXRl44Gr5beu44GX5pu/44GI44KJ44KM44KL44KI44GG44Gr44GZ44KLXG5cbiAgICAvL0F0bGFzU3ByaXRl6Ieq6Lqr44Gr5Y2Y55m644GuSW1hZ2XjgpLjgrvjg4Pjg4jjgafjgY3jgovjgojjgYbjgavjgZnjgovvvJ9cbiAgICAvL+OBguOBqOOBp+OBquOBq+OBi+OBl+OCieWvvuetluOBl+OBquOBhOOBqOOBoOOCgeOBoOOBjO+8k+aciOe0jeWTgeOBp+OBr+S4gOaXpuOBk+OCjOOBp1xuICAgIHJlcGxhY2VBdGxhc1Nwcml0ZVRvU3ByaXRlOiBmdW5jdGlvbihwYXJlbnQsIGF0bGFzU3ByaXRlLCBzcHJpdGUpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gcGFyZW50LmdldENoaWxkSW5kZXgoYXRsYXNTcHJpdGUpO1xuICAgICAgc3ByaXRlLnNldE9yaWdpbihhdGxhc1Nwcml0ZS5vcmlnaW5YLCBhdGxhc1Nwcml0ZS5vcmlnaW5ZKTtcbiAgICAgIHNwcml0ZS5zZXRQb3NpdGlvbihhdGxhc1Nwcml0ZS54LCBhdGxhc1Nwcml0ZS55KTtcbiAgICAgIHBhcmVudC5hZGRDaGlsZEF0KHNwcml0ZSwgaW5kZXgpO1xuICAgICAgYXRsYXNTcHJpdGUucmVtb3ZlKCk7XG4gICAgICByZXR1cm4gc3ByaXRlO1xuICAgIH0sXG4gIH1cbn0pO1xuIiwiLy9cbi8vIOWfuuekjuOCt+ODvOODs+OCr+ODqeOCuVxuLy9cbnBoaW5hLmRlZmluZShcIkJhc2VTY2VuZVwiLCB7XG4gIHN1cGVyQ2xhc3M6IFwiRGlzcGxheVNjZW5lXCIsXG5cbiAgZm9vdGVyOiBudWxsLFxuXG4gIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAvLyBjb25zb2xlLmxvZyhcIiNCYXNlU2NlbmVcIiAsIFwiaW5pdFwiKTtcblxuICAgIHRoaXMuc3VwZXJJbml0KCk7XG4gICAgdGhpcy5iYWNrZ3JvdW5kQ29sb3IgPSBcIndoaXRlXCI7XG5cbiAgICBpZiAoIXBoaW5hLmlzTW9iaWxlKCkpIHRoaXMub24oXCJlbnRlcmZyYW1lXCIsIChlKSA9PiB0aGlzLmZsYXJlKFwibW91c2Vtb3ZlXCIsIHsgYXBwOiBlLmFwcCB9KSk7XG5cbiAgICB0aGlzLm9uZSgnZGVzdHJveScsICgpID0+IHRoaXMuY2FudmFzLmRlc3Ryb3koKSk7XG4gIH0sXG5cbiAgb25lbnRlcjogZnVuY3Rpb24oZSkge1xuICAgIC8vIGNvbnNvbGUubG9nKFwiI0Jhc2VTY2VuZVwiICwgXCJvbmVudGVyXCIpO1xuICAgIHRoaXMuX3BsYXlCZ20oKTtcbiAgICB0aGlzLl9zZXR1cEZvb3RlcigpO1xuICAgIHRoaXMuZmxhcmUoXCJyZWFkeVwiLCB7IGFwcDogZS5hcHAgfSk7XG4gICAgdGhpcy5fYWRkRm9vdGVyKCk7XG4gIH0sXG5cbiAgLy/jgrfjg7zjg7Pplovlp4vjgqjjg5Xjgqfjgq/jg4ggXG4gIGJlZ2luOiBmdW5jdGlvbih0eXBlLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9ICh7fSkuJHNhZmUob3B0aW9ucywge1xuICAgICAgY29sb3I6IFwid2hpdGVcIixcbiAgICAgIHRpbWU6IDEwMFxuICAgIH0pO1xuICAgIGNvbnN0IGVmZmVjdCA9IHRoaXMuX3NldHVwKHR5cGUsIG9wdGlvbnMpO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgLnRoZW4oZWZmZWN0LmJlZ2luKCkpXG4gIH0sXG5cbiAgLy/jgrfjg7zjg7PntYLkuobjgqjjg5Xjgqfjgq/jg4hcbiAgZmluaXNoOiBmdW5jdGlvbih0eXBlLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9ICh7fSkuJHNhZmUob3B0aW9ucywge1xuICAgICAgY29sb3I6IFwid2hpdGVcIixcbiAgICAgIHRpbWU6IDEwMFxuICAgIH0pO1xuICAgIGNvbnN0IGVmZmVjdCA9IHRoaXMuX3NldHVwKHR5cGUsIG9wdGlvbnMpO1xuICAgIHJldHVybiBlZmZlY3QuZmluaXNoKCk7XG4gIH0sXG5cbiAgX3NldHVwOiBmdW5jdGlvbih0eXBlLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlIFwiZmFkZVwiOlxuICAgICAgICByZXR1cm4gU2NlbmVFZmZlY3RGYWRlKG9wdGlvbnMpLmFkZENoaWxkVG8odGhpcyk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gU2NlbmVFZmZlY3ROb25lKG9wdGlvbnMpLmFkZENoaWxkVG8odGhpcyk7XG4gICAgfVxuICB9LFxuXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8gUHJvbWlzZeOCkueUqOOBhOOBn+OCpuOCp+OCpOODiOWHpueQhlxuICBwbGF5V2FpdDogZnVuY3Rpb24od2FpdCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIGNvbnN0IHR3V2FpdCA9IFR3ZWVuZXIoKS5hdHRhY2hUbyh0aGlzKTtcbiAgICAgIHR3V2FpdC53YWl0KHdhaXQpLmNhbGwoKCkgPT4ge1xuICAgICAgICB0aGlzLmRldGFjaCh0d1dhaXQpO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcblxuICBfcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnJlbmRlcmVyLnJlbmRlcih0aGlzLCAxLjApO1xuICB9LFxuXG59KTtcbiIsIi8vXG4vLyDjgrfjg7zjg7Pjgqjjg5Xjgqfjgq/jg4jjga7ln7rnpI7jgq/jg6njgrlcbi8vXG5waGluYS5kZWZpbmUoXCJTY2VuZUVmZmVjdEJhc2VcIiwge1xuICBzdXBlckNsYXNzOiBcIklucHV0SW50ZXJjZXB0XCIsXG5cbiAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zdXBlckluaXQoKTtcbiAgICB0aGlzLmVuYWJsZSgpO1xuICB9LFxuXG59KTtcbiIsIi8vXG4vLyDjgrfjg7zjg7Pjgqjjg5Xjgqfjgq/jg4jvvJropIfmlbDjga7lhobjgafjg5Xjgqfjg7zjg4njgqTjg7PjgqLjgqbjg4hcbi8vXG5waGluYS5kZWZpbmUoXCJTY2VuZUVmZmVjdENpcmNsZUZhZGVcIiwge1xuICBzdXBlckNsYXNzOiBcIlNjZW5lRWZmZWN0QmFzZVwiLFxuXG4gIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSAoe30pLiRzYWZlKG9wdGlvbnMsIFNjZW5lRWZmZWN0Q2lyY2xlRmFkZS5kZWZhdWx0cyk7XG5cbiAgICB0aGlzLnN1cGVySW5pdCgpO1xuICB9LFxuXG4gIF9jcmVhdGVDaXJjbGU6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnN0IG51bSA9IDU7XG4gICAgY29uc3Qgd2lkdGggPSBTQ1JFRU5fV0lEVEggLyBudW07XG4gICAgcmV0dXJuIEFycmF5LnJhbmdlKChTQ1JFRU5fSEVJR0hUIC8gd2lkdGgpICsgMSkubWFwKHkgPT4ge1xuICAgICAgcmV0dXJuIEFycmF5LnJhbmdlKG51bSArIDEpLm1hcCh4ID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkQ2hpbGQoQ2lyY2xlU2hhcGUoe1xuICAgICAgICAgIHg6IHggKiB3aWR0aCxcbiAgICAgICAgICB5OiB5ICogd2lkdGgsXG4gICAgICAgICAgZmlsbDogdGhpcy5vcHRpb25zLmNvbG9yLFxuICAgICAgICAgIHN0cm9rZTogbnVsbCxcbiAgICAgICAgICByYWRpdXM6IHdpZHRoICogMC41LFxuICAgICAgICB9KSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcblxuICBiZWdpbjogZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgY2lyY2xlcyA9IHRoaXMuX2NyZWF0ZUNpcmNsZSgpO1xuICAgIGNvbnN0IHRhc2tzID0gW107XG4gICAgY2lyY2xlcy5mb3JFYWNoKCh4TGluZSwgeSkgPT4ge1xuICAgICAgeExpbmUuZm9yRWFjaCgoY2lyY2xlLCB4KSA9PiB7XG4gICAgICAgIGNpcmNsZS5zY2FsZVggPSAwO1xuICAgICAgICBjaXJjbGUuc2NhbGVZID0gMDtcbiAgICAgICAgdGFza3MucHVzaChuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICBjaXJjbGUudHdlZW5lci5jbGVhcigpXG4gICAgICAgICAgICAudG8oe1xuICAgICAgICAgICAgICBzY2FsZVg6IDEuNSxcbiAgICAgICAgICAgICAgc2NhbGVZOiAxLjVcbiAgICAgICAgICAgIH0sIDUwMCwgXCJlYXNlT3V0UXVhZFwiKVxuICAgICAgICAgICAgLmNhbGwoKCkgPT4ge1xuICAgICAgICAgICAgICBjaXJjbGUucmVtb3ZlKCk7XG4gICAgICAgICAgICAgIGNpcmNsZS5kZXN0cm95Q2FudmFzKCk7XG4gICAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4uY2xlYXIoKTtcbiAgICAgICAgICAgICAgdGhpcy5kaXNhYmxlKCk7XG4gICAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiBQcm9taXNlLmFsbCh0YXNrcyk7XG4gIH0sXG5cbiAgZmluaXNoOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmNoaWxkcmVuLmNsZWFyKCk7XG5cbiAgICBjb25zdCBjaXJjbGVzID0gdGhpcy5fY3JlYXRlQ2lyY2xlKCk7XG4gICAgY29uc3QgdGFza3MgPSBbXTtcbiAgICBjaXJjbGVzLmZvckVhY2goeExpbmUgPT4ge1xuICAgICAgeExpbmUuZm9yRWFjaChjaXJjbGUgPT4ge1xuICAgICAgICBjaXJjbGUuc2NhbGVYID0gMS41O1xuICAgICAgICBjaXJjbGUuc2NhbGVZID0gMS41O1xuICAgICAgICB0YXNrcy5wdXNoKG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgIGNpcmNsZS50d2VlbmVyLmNsZWFyKClcbiAgICAgICAgICAgIC50byh7XG4gICAgICAgICAgICAgIHNjYWxlWDogMCxcbiAgICAgICAgICAgICAgc2NhbGVZOiAwXG4gICAgICAgICAgICB9LCA1MDAsIFwiZWFzZU91dFF1YWRcIilcbiAgICAgICAgICAgIC5jYWxsKCgpID0+IHtcbiAgICAgICAgICAgICAgY2lyY2xlLnJlbW92ZSgpO1xuICAgICAgICAgICAgICBjaXJjbGUuZGVzdHJveUNhbnZhcygpO1xuICAgICAgICAgICAgICB0aGlzLmNoaWxkcmVuLmNsZWFyKCk7XG4gICAgICAgICAgICAgIHRoaXMuZGlzYWJsZSgpO1xuICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHRhc2tzKTtcbiAgfSxcblxuICBfc3RhdGljOiB7XG4gICAgZGVmYXVsdHM6IHtcbiAgICAgIGNvbG9yOiBcIndoaXRlXCIsXG4gICAgfVxuICB9XG5cbn0pO1xuIiwiLy9cbi8vIOOCt+ODvOODs+OCqOODleOCp+OCr+ODiO+8muODleOCp+ODvOODieOCpOODs+OCouOCpuODiFxuLy9cbnBoaW5hLmRlZmluZShcIlNjZW5lRWZmZWN0RmFkZVwiLCB7XG4gIHN1cGVyQ2xhc3M6IFwiU2NlbmVFZmZlY3RCYXNlXCIsXG5cbiAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9ICh7fSkuJHNhZmUob3B0aW9ucywge1xuICAgICAgY29sb3I6IFwiYmxhY2tcIixcbiAgICAgIHRpbWU6IDUwMCxcbiAgICB9KTtcblxuICAgIHRoaXMuc3VwZXJJbml0KCk7XG4gICAgdGhpcy5mcm9tSlNPTih7XG4gICAgICBjaGlsZHJlbjoge1xuICAgICAgICBmYWRlOiB7XG4gICAgICAgICAgY2xhc3NOYW1lOiBcIlJlY3RhbmdsZVNoYXBlXCIsXG4gICAgICAgICAgYXJndW1lbnRzOiB7XG4gICAgICAgICAgICB3aWR0aDogU0NSRUVOX1dJRFRILFxuICAgICAgICAgICAgaGVpZ2h0OiBTQ1JFRU5fSEVJR0hULFxuICAgICAgICAgICAgZmlsbDogdGhpcy5vcHRpb25zLmNvbG9yLFxuICAgICAgICAgICAgc3Ryb2tlOiBudWxsLFxuICAgICAgICAgICAgcGFkZGluZzogMCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHg6IFNDUkVFTl9XSURUSCAqIDAuNSxcbiAgICAgICAgICB5OiBTQ1JFRU5fSEVJR0hUICogMC41LFxuICAgICAgICB9LFxuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIHN0YXk6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnN0IGZhZGUgPSB0aGlzLmZhZGU7XG4gICAgZmFkZS5hbHBoYSA9IDEuMDtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH0sXG5cbiAgYmVnaW46IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIGNvbnN0IGZhZGUgPSB0aGlzLmZhZGU7XG4gICAgICBmYWRlLmFscGhhID0gMS4wO1xuICAgICAgZmFkZS50d2VlbmVyLmNsZWFyKClcbiAgICAgICAgLmZhZGVPdXQodGhpcy5vcHRpb25zLnRpbWUpXG4gICAgICAgIC5jYWxsKCgpID0+IHtcbiAgICAgICAgICAvLzFGcmFtZeaPj+eUu+OBleOCjOOBpuOBl+OBvuOBo+OBpuOBoeOCieOBpOOBj+OBruOBp2VudGVyZnJhbWXjgafliYrpmaRcbiAgICAgICAgICB0aGlzLm9uZShcImVudGVyZnJhbWVcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5mYWRlLnJlbW92ZSgpO1xuICAgICAgICAgICAgdGhpcy5mYWRlLmRlc3Ryb3lDYW52YXMoKTtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKClcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9LFxuXG4gIGZpbmlzaDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgY29uc3QgZmFkZSA9IHRoaXMuZmFkZTtcbiAgICAgIGZhZGUuYWxwaGEgPSAwLjA7XG4gICAgICBmYWRlLnR3ZWVuZXIuY2xlYXIoKVxuICAgICAgICAuZmFkZUluKHRoaXMub3B0aW9ucy50aW1lKVxuICAgICAgICAuY2FsbCgoKSA9PiB7XG4gICAgICAgICAgdGhpcy5mbGFyZShcImZpbmlzaFwiKTtcbiAgICAgICAgICAvLzFGcmFtZeaPj+eUu+OBleOCjOOBpuOBl+OBvuOBo+OBpuOBoeOCieOBpOOBj+OBruOBp2VudGVyZnJhbWXjgafliYrpmaRcbiAgICAgICAgICB0aGlzLm9uZShcImVudGVyZnJhbWVcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5mYWRlLnJlbW92ZSgpO1xuICAgICAgICAgICAgdGhpcy5mYWRlLmRlc3Ryb3lDYW52YXMoKTtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKClcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9LFxuXG4gIF9zdGF0aWM6IHtcbiAgICBkZWZhdWx0czoge1xuICAgICAgY29sb3I6IFwiYmxhY2tcIixcbiAgICB9XG4gIH1cblxufSk7XG4iLCIvL1xuLy8g44K344O844Oz44Ko44OV44Kn44Kv44OI77ya44Gq44Gr44KC44GX44Gq44GEXG4vL1xucGhpbmEuZGVmaW5lKFwiU2NlbmVFZmZlY3ROb25lXCIsIHtcbiAgc3VwZXJDbGFzczogXCJTY2VuZUVmZmVjdEJhc2VcIixcblxuICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnN1cGVySW5pdCgpO1xuICB9LFxuXG4gIGJlZ2luOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICB0aGlzLm9uZShcImVudGVyZnJhbWVcIiwgKCkgPT4gdGhpcy5yZW1vdmUoKSk7XG4gICAgICByZXNvbHZlKCk7XG4gICAgfSk7XG4gIH0sXG5cbiAgZmluaXNoOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICB0aGlzLm9uZShcImVudGVyZnJhbWVcIiwgKCkgPT4gdGhpcy5yZW1vdmUoKSk7XG4gICAgICByZXNvbHZlKCk7XG4gICAgfSk7XG4gIH1cblxufSk7XG4iLCIvL1xuLy8g44K344O844Oz44Ko44OV44Kn44Kv44OI77ya44K/44Kk44Or44OV44Kn44O844OJXG4vL1xucGhpbmEuZGVmaW5lKFwiU2NlbmVFZmZlY3RUaWxlRmFkZVwiLCB7XG4gIHN1cGVyQ2xhc3M6IFwiU2NlbmVFZmZlY3RCYXNlXCIsXG5cbiAgdGlsZXM6IG51bGwsXG4gIG51bTogMTUsXG4gIHNwZWVkOiA1MCxcblxuICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdGhpcy5zdXBlckluaXQoKTtcbiAgICB0aGlzLm9wdGlvbnMgPSAoe30pLiRzYWZlKG9wdGlvbnMsIHtcbiAgICAgIGNvbG9yOiBcImJsYWNrXCIsXG4gICAgICB3aWR0aDogNzY4LFxuICAgICAgaGVpZ2h0OiAxMDI0LFxuICAgIH0pO1xuXG4gICAgdGhpcy50aWxlcyA9IHRoaXMuX2NyZWF0ZVRpbGVzKCk7XG4gIH0sXG5cbiAgX2NyZWF0ZVRpbGVzOiBmdW5jdGlvbigpIHtcbiAgICBjb25zdCB3aWR0aCA9IE1hdGguZmxvb3IodGhpcy5vcHRpb25zLndpZHRoIC8gdGhpcy5udW0pO1xuXG4gICAgcmV0dXJuIEFycmF5LnJhbmdlKCh0aGlzLm9wdGlvbnMuaGVpZ2h0IC8gd2lkdGgpICsgMSkubWFwKHkgPT4ge1xuICAgICAgcmV0dXJuIEFycmF5LnJhbmdlKHRoaXMubnVtICsgMSkubWFwKHggPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5hZGRDaGlsZChSZWN0YW5nbGVTaGFwZSh7XG4gICAgICAgICAgd2lkdGg6IHdpZHRoICsgMixcbiAgICAgICAgICBoZWlnaHQ6IHdpZHRoICsgMixcbiAgICAgICAgICB4OiB4ICogd2lkdGgsXG4gICAgICAgICAgeTogeSAqIHdpZHRoLFxuICAgICAgICAgIGZpbGw6IHRoaXMub3B0aW9ucy5jb2xvcixcbiAgICAgICAgICBzdHJva2U6IG51bGwsXG4gICAgICAgICAgc3Ryb2tlV2lkdGg6IDAsXG4gICAgICAgIH0pKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9LFxuXG4gIHN0YXk6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMudGlsZXMuZm9yRWFjaCgoeGxpbmUsIHkpID0+IHtcbiAgICAgIHhsaW5lLmZvckVhY2goKHRpbGUsIHgpID0+IHtcbiAgICAgICAgdGlsZS5zY2FsZVggPSAxLjA7XG4gICAgICAgIHRpbGUuc2NhbGVZID0gMS4wO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9LFxuXG4gIGJlZ2luOiBmdW5jdGlvbigpIHtcbiAgICBjb25zdCB0YXNrcyA9IFtdO1xuICAgIHRoaXMudGlsZXMuZm9yRWFjaCgoeGxpbmUsIHkpID0+IHtcbiAgICAgIGNvbnN0IHcgPSBNYXRoLnJhbmRmbG9hdCgwLCAxKSAqIHRoaXMuc3BlZWQ7XG4gICAgICB4bGluZS5mb3JFYWNoKCh0aWxlLCB4KSA9PiB7XG4gICAgICAgIHRpbGUuc2NhbGVYID0gMS4wO1xuICAgICAgICB0aWxlLnNjYWxlWSA9IDEuMDtcbiAgICAgICAgdGFza3MucHVzaChuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICB0aWxlLnR3ZWVuZXIuY2xlYXIoKVxuICAgICAgICAgICAgLndhaXQoeCAqIHRoaXMuc3BlZWQgKyB3KVxuICAgICAgICAgICAgLnRvKHtcbiAgICAgICAgICAgICAgc2NhbGVYOiAwLFxuICAgICAgICAgICAgICBzY2FsZVk6IDBcbiAgICAgICAgICAgIH0sIDUwMCwgXCJlYXNlT3V0UXVhZFwiKVxuICAgICAgICAgICAgLmNhbGwoKCkgPT4ge1xuICAgICAgICAgICAgICB0aWxlLnJlbW92ZSgpO1xuICAgICAgICAgICAgICB0aWxlLmRlc3Ryb3lDYW52YXMoKTtcbiAgICAgICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHRhc2tzKVxuICB9LFxuXG4gIGZpbmlzaDogZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgdGFza3MgPSBbXTtcbiAgICB0aGlzLnRpbGVzLmZvckVhY2goKHhsaW5lLCB5KSA9PiB7XG4gICAgICBjb25zdCB3ID0gTWF0aC5yYW5kZmxvYXQoMCwgMSkgKiB0aGlzLnNwZWVkO1xuICAgICAgeGxpbmUuZm9yRWFjaCgodGlsZSwgeCkgPT4ge1xuICAgICAgICB0aWxlLnNjYWxlWCA9IDAuMDtcbiAgICAgICAgdGlsZS5zY2FsZVkgPSAwLjA7XG4gICAgICAgIHRhc2tzLnB1c2gobmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgdGlsZS50d2VlbmVyLmNsZWFyKClcbiAgICAgICAgICAgIC53YWl0KCh4bGluZS5sZW5ndGggLSB4KSAqIHRoaXMuc3BlZWQgKyB3KVxuICAgICAgICAgICAgLnRvKHtcbiAgICAgICAgICAgICAgc2NhbGVYOiAxLFxuICAgICAgICAgICAgICBzY2FsZVk6IDFcbiAgICAgICAgICAgIH0sIDUwMCwgXCJlYXNlT3V0UXVhZFwiKVxuICAgICAgICAgICAgLmNhbGwoKCkgPT4ge1xuICAgICAgICAgICAgICB0aWxlLnJlbW92ZSgpO1xuICAgICAgICAgICAgICB0aWxlLmRlc3Ryb3lDYW52YXMoKTtcbiAgICAgICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHRhc2tzKVxuICB9LFxuXG4gIF9zdGF0aWM6IHtcbiAgICBkZWZhdWx0czoge1xuICAgICAgY29sb3I6IFwiYmxhY2tcIixcbiAgICB9XG4gIH1cblxufSk7XG4iLCIvL1xuLy8gQVBJ44Oq44Kv44Ko44K544OI5pmC44KE44Gq44Gr44GL5pmC6ZaT44Gu44GL44GL44KL5Yem55CG55So44Gu44OX44Ot44Kw44Os44K555S76Z2i77yI5Luu77yJXG4vL1xucGhpbmEuZGVmaW5lKFwiQ29ubmVjdGlvblByb2dyZXNzXCIsIHtcbiAgc3VwZXJDbGFzczogXCJNb2RhbFwiLFxuICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdGhpcy5zdXBlckluaXQoKTtcbiAgICB0aGlzLm9wdGlvbnMgPSAoe30pLiRzYWZlKG9wdGlvbnMgfHwge30sIENvbm5lY3Rpb25Qcm9ncmVzcy5kZWZhdWx0cyk7XG5cbiAgICB0aGlzLnNldHVwKCk7XG4gIH0sXG5cbiAgc2V0dXA6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMubGF5b3V0ID0gQXNzZXRNYW5hZ2VyLmdldChcImxheW91dFwiLCBcImNvbm5lY3Rpb25Qcm9ncmVzc1wiKS5idWlsZCgpLmFkZENoaWxkVG8odGhpcyk7XG4gICAgdGhpcy5hbHBoYSA9IDA7XG4gICAgdGhpcy5zZXR1cExvYWRpbmdBbmltYXRpb24oKTtcbiAgfSxcblxuICBzZXR1cExvYWRpbmdBbmltYXRpb246IGZ1bmN0aW9uKCkge1xuICAgIGNvbnN0IGxvYWRpbmcgPSB0aGlzLmxheW91dC5yZWZbXCJsb2FkaW5nXCJdO1xuXG4gICAgY29uc3QgdGFzayA9IEFycmF5LnJhbmdlKDAsIDEzKS5tYXAoaSA9PiB7XG4gICAgICBjb25zdCBrZXkgPSBcImNcIiArIGk7XG4gICAgICBjb25zdCBveSA9IGxvYWRpbmdba2V5XS55O1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICBsb2FkaW5nW2tleV0udHdlZW5lci5jbGVhcigpXG4gICAgICAgICAgLndhaXQoaSAqIDE1MClcbiAgICAgICAgICAudG8oe1xuICAgICAgICAgICAgeTogb3kgLSAxMFxuICAgICAgICAgIH0sIDE1MCwgXCJlYXNlSW5RdWFkXCIpXG4gICAgICAgICAgLnRvKHtcbiAgICAgICAgICAgIHk6IG95XG4gICAgICAgICAgfSwgMTUwLCBcImVhc2VPdXRRdWFkXCIpXG4gICAgICAgICAgLmNhbGwoKCkgPT4gcmVzb2x2ZSgpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgUHJvbWlzZS5hbGwodGFzaylcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5zZXR1cExvYWRpbmdBbmltYXRpb24oKTtcbiAgICAgIH0pXG4gIH0sXG5cbiAgLy/ooajnpLrjgqLjg4vjg6Hjg7zjgrfjg6fjg7NcbiAgb3BlbkFuaW1hdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgdGhpcy5hbHBoYSA9IDA7XG4gICAgICB0aGlzLnR3ZWVuZXIuY2xlYXIoKVxuICAgICAgICAuZmFkZUluKDI1MClcbiAgICAgICAgLmNhbGwoKCkgPT4gcmVzb2x2ZSgpKTtcbiAgICB9KTtcbiAgfSxcblxuICAvL+mdnuihqOekuuOCouODi+ODoeODvOOCt+ODp+ODs1xuICBjbG9zZUFuaW1hdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgdGhpcy5hbHBoYSA9IDE7XG4gICAgICB0aGlzLnR3ZWVuZXIuY2xlYXIoKVxuICAgICAgICAuZmFkZU91dCgyNTApXG4gICAgICAgIC5jYWxsKCgpID0+IHtcbiAgICAgICAgICB0aGlzLnJlbW92ZSgpO1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgLy/lvoXmqZ/jgqLjg4vjg6Hjg7zjgrfjg6fjg7NcbiAgLy9UT0RPOuODh+OCtuOCpOODs+OBjOOBquOBhOOBruOBp+OBqOOCiuOBguOBiOOBmi4uLlxuICBpZGxlQW5pbWF0aW9uOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAvLyB0aGlzLmxhYmVsLmRvdENvdW50ID0gMDtcbiAgICAgIC8vIHRoaXMubGFiZWwudHdlZW5lci5jbGVhcigpXG4gICAgICAvLyAgIC50byh7IGRvdENvdW50OiA1IH0sIDIwMDApXG4gICAgICAvLyAgIC53YWl0KDIwMClcbiAgICAgIC8vICAgLnNldCh7IGRvdENvdW50OiAwIH0pXG4gICAgICAvLyAgIC5zZXRMb29wKHRydWUpO1xuICAgICAgLy8gdGhpcy5sYWJlbC5vbihcImVudGVyZnJhbWVcIiwgKCkgPT4ge1xuICAgICAgLy8gICB0aGlzLmxhYmVsLnRleHQgPSB0aGlzLm9wdGlvbnMudGV4dCArIEFycmF5LnJhbmdlKE1hdGguZmxvb3IodGhpcy5sYWJlbC5kb3RDb3VudCkpLm1hcCgoKSA9PiBcIi5cIikuam9pbihcIlwiKTtcbiAgICAgIC8vIH0pO1xuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0pO1xuICB9LFxuXG4gIF9zdGF0aWM6IHtcblxuICAgIGluc3RhbmNlOiBudWxsLFxuXG4gICAgb3BlbjogZnVuY3Rpb24oc2NlbmUpIHtcbiAgICAgIC8v44K344O844Oz44GM5a2Y5Zyo44GX44Gq44GE5aC05ZCI44Gv5Y2z5bqn44Gr5a6M5LqG44Gr44GZ44KLXG4gICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH1cblxuICAgICAgLy/jgZnjgafjgavjgqTjg7Pjgrnjgr/jg7PjgrnjgYzlrZjlnKjjgZnjgovloLTlkIjjgavjga/plonjgZjjgabjgYrjgY9cbiAgICAgIGlmICh0aGlzLmluc3RhbmNlKSB7XG4gICAgICAgIHRoaXMuaW5zdGFuY2UuY2xvc2UoKTtcbiAgICAgICAgdGhpcy5pbnN0YW5jZSA9IG51bGw7XG4gICAgICB9XG4gICAgICAvL+aWsOOBl+OBj+i/veWKoOOBl+OBpuihqOekulxuICAgICAgdGhpcy5pbnN0YW5jZSA9IENvbm5lY3Rpb25Qcm9ncmVzcygpLmFkZENoaWxkVG8oc2NlbmUpO1xuICAgICAgcmV0dXJuIHRoaXMuaW5zdGFuY2Uub3BlbigpLnRoZW4odGhpcy5pbnN0YW5jZS5pZGxlQW5pbWF0aW9uKCkpO1xuICAgIH0sXG5cbiAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIXRoaXMuaW5zdGFuY2UpIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIHJldHVybiB0aGlzLmluc3RhbmNlLmNsb3NlKCkudGhlbigoKSA9PiB0aGlzLmluc3RhbmNlID0gbnVsbCk7XG4gICAgfSxcblxuICAgIGRlZmF1bHRzOiB7XG4gICAgICB0ZXh0OiBcIuiqreOBv+i+vOOBv+S4rVwiLFxuICAgIH0sXG4gIH1cblxufSk7XG4iLCJwaGluYS5uYW1lc3BhY2UoZnVuY3Rpb24oKSB7XG5cbiAgY29uc3QgUEFERElORyA9IDIwO1xuXG4gIHBoaW5hLmRlZmluZShcIkRpYWxvZ1wiLCB7XG4gICAgc3VwZXJDbGFzczogXCJNb2RhbFwiLFxuXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdGhpcy5zdXBlckluaXQoKTtcbiAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgdGhpcy5zaXplID0gb3B0aW9ucy5zaXplIHx8IERpYWxvZy5TSVpFLlM7XG5cbiAgICAgIGNvbnNvbGUubG9nKFwic2l6ZTpcIiArIHRoaXMuc2l6ZSk7XG5cbiAgICAgIHRoaXMuZnJvbUpTT04oe1xuICAgICAgICBjaGlsZHJlbjoge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHtcbiAgICAgICAgICAgIGNsYXNzTmFtZTogXCJSZWN0YW5nbGVTaGFwZVwiLFxuICAgICAgICAgICAgYXJndW1lbnRzOiB7XG4gICAgICAgICAgICAgIHdpZHRoOiBTQ1JFRU5fV0lEVEgsXG4gICAgICAgICAgICAgIGhlaWdodDogU0NSRUVOX0hFSUdIVCxcbiAgICAgICAgICAgICAgc3Ryb2tlOiBudWxsLFxuICAgICAgICAgICAgICBmaWxsOiBcIiMwMDAwMDA5OVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgeDogU0NSRUVOX1dJRFRIICogMC41LFxuICAgICAgICAgICAgeTogU0NSRUVOX0hFSUdIVCAqIDAuNSxcbiAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gdGhpcy5sYXlvdXQgPSBBc3NldE1hbmFnZXIuZ2V0KFwibGF5b3V0XCIsIGBkaWFsb2dfJHt0aGlzLnNpemV9YClcbiAgICAgIHRoaXMubGF5b3V0ID0gQXNzZXRNYW5hZ2VyLmdldChcImxheW91dFwiLCBcImRpYWxvZ19mcmFtZVwiKVxuICAgICAgICAuYnVpbGQoKVxuICAgICAgICAuYWRkQ2hpbGRUbyh0aGlzKTtcblxuICAgICAgdGhpcy51cGRhdGVTaXplKCk7XG4gICAgICB0aGlzLnNldHVwQnV0dG9ucygpO1xuICAgIH0sXG5cbiAgICB1cGRhdGVTaXplOiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IGRpYWxvZyA9IHRoaXMubGF5b3V0LmRpYWxvZztcbiAgICAgIERpYWxvZy5TSVpFLmZvckluKChzaXplKSA9PiB7XG4gICAgICAgIGRpYWxvZ1tEaWFsb2cuU0laRVtzaXplXV0uc2xlZXAoKS5oaWRlKClcbiAgICAgIH0pXG4gICAgICB0aGlzLmRpYWxvZy53YWtlVXAoKS5zaG93KCk7XG4gICAgfSxcblxuICAgIHNldHVwQnV0dG9uczogZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCBidXR0b25MYXlvdXQgPSBBc3NldE1hbmFnZXIuZ2V0KFwibGF5b3V0XCIsIFwiZGlhbG9nX2J1dHRvbnNcIikuYnVpbGQoKTtcbiAgICAgIGNvbnN0IGRhdGEgPSBidXR0b25MYXlvdXQubGF5b3V0QXNzZXQuZGF0YTtcbiAgICAgIHRoaXMuX2J1dHRvbkpTT05zID0gYnV0dG9uTGF5b3V0LmxheW91dEFzc2V0LmRhdGEucm9vdC5jaGlsZHJlbjtcbiAgICB9LFxuXG4gICAgc2V0VGl0bGU6IGZ1bmN0aW9uKHRpdGxlKSB7XG4gICAgICB0aGlzLnRpdGxlLnRleHQgPSB0aXRsZTtcbiAgICB9LFxuXG4gICAgYWRkQnV0dG9uOiBmdW5jdGlvbihsYWJlbCwgY29sb3IsIG9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICB0aGlzLmJ1dHRvbnMuZnJvbUpTT04oe1xuICAgICAgICBjaGlsZHJlbjogW3RoaXMuX2J1dHRvbkpTT05zW2Ake2NvbG9yfV9tYF1dLFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGJ1dHRvbiA9IHRoaXMuYnV0dG9ucy5jaGlsZHJlbi5sYXN0O1xuXG4gICAgICBidXR0b24uQnV0dG9uID0gQnV0dG9uKCkuYXR0YWNoVG8oYnV0dG9uKTtcbiAgICAgIGJ1dHRvbi5sYWJlbC50ZXh0ID0gYnV0dG9uLmxhYmVsXzIudGV4dCA9IGxhYmVsO1xuICAgICAgYnV0dG9uLmxhYmVsLmZvbnRTaXplID0gYnV0dG9uLmxhYmVsXzIuZm9udFNpemUgPSAoIW9wdGlvbnMuZm9udFNpemUpID8gYnV0dG9uLmxhYmVsLmZvbnRTaXplIDogb3B0aW9ucy5mb250U2l6ZTtcbiAgICAgIGJ1dHRvbi5wb3NpdGlvbiA9IFZlY3RvcjIoMCwgMCk7XG4gICAgICBidXR0b24uaG9nZUlkID0gdGhpcy5idXR0b25zLmNoaWxkcmVuLmxlbmd0aDtcblxuICAgICAgbGV0IHdpZHRoID0gdGhpcy5idXR0b25zLmNoaWxkcmVuLnJlZHVjZSgodywgZWxtKSA9PiB7XG4gICAgICAgIHJldHVybiB3ICs9IGVsbS53aWR0aCArIFBBRERJTkc7XG4gICAgICB9LCAwKTtcblxuICAgICAgbGV0IGxlZnQgPSAodGhpcy5idXR0b25zLndpZHRoIC0gd2lkdGgpICogMC41IC0gKHRoaXMuYnV0dG9ucy53aWR0aCAqIDAuNSk7XG5cbiAgICAgIHRoaXMuYnV0dG9ucy5jaGlsZHJlbi5mb3JFYWNoKChlbG0pID0+IHtcbiAgICAgICAgZWxtLnggPSBsZWZ0ICsgKGVsbS53aWR0aCArIFBBRERJTkcpICogMC41O1xuICAgICAgICBsZWZ0ID0gZWxtLnJpZ2h0ICsgUEFERElORyAqIDAuNTtcbiAgICAgIH0pO1xuXG4gICAgICAvL3RoaXMuYnV0dG9ucy5jaGlsZHJlbi5mb3JFYWNoKGUgPT4gY29uc29sZS5sb2coZS5wb3NpdGlvbikpO1xuXG4gICAgICByZXR1cm4gYnV0dG9uO1xuICAgIH0sXG5cbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy/ooajnpLpcbiAgICBvcGVuOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLm9wZW5BbmltYXRpb24oKTtcbiAgICB9LFxuXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8v6Z2e6KGo56S6XG4gICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuY2xvc2VBbmltYXRpb24oKTtcbiAgICB9LFxuXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8v6KGo56S644Ki44OL44Oh44O844K344On44OzXG4gICAgb3BlbkFuaW1hdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xuICAgICAgICBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICB0aGlzLmJhY2tncm91bmQuYWxwaGEgPSAwO1xuICAgICAgICAgIHRoaXMuYmFja2dyb3VuZC50d2VlbmVyLmNsZWFyKClcbiAgICAgICAgICAgIC5mYWRlSW4oMjUwKVxuICAgICAgICAgICAgLmNhbGwoKCkgPT4gcmVzb2x2ZSgpKTtcbiAgICAgICAgfSksXG4gICAgICAgIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgIHRoaXMubGF5b3V0LmRpYWxvZy5zY2FsZVggPSAwLjA7XG4gICAgICAgICAgdGhpcy5sYXlvdXQuZGlhbG9nLnNjYWxlWSA9IDAuMDtcbiAgICAgICAgICB0aGlzLmxheW91dC5kaWFsb2cudHdlZW5lci5jbGVhcigpXG4gICAgICAgICAgICAudG8oe1xuICAgICAgICAgICAgICBzY2FsZVg6IDEuMCxcbiAgICAgICAgICAgICAgc2NhbGVZOiAxLjBcbiAgICAgICAgICAgIH0sIDI1MCwgXCJlYXNlSW5PdXRRdWFkXCIpXG4gICAgICAgICAgICAuY2FsbCgoKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMuZmxhcmUoXCJvcGVuZWRcIiwge1xuICAgICAgICAgICAgICAgIGRpYWxvZzogdGhpc1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICBdKTtcbiAgICB9LFxuXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8v6Z2e6KGo56S644Ki44OL44Oh44O844K344On44OzXG4gICAgY2xvc2VBbmltYXRpb246IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFtcbiAgICAgICAgbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kLmFscGhhID0gMTtcbiAgICAgICAgICB0aGlzLmJhY2tncm91bmQudHdlZW5lci5jbGVhcigpXG4gICAgICAgICAgICAuZmFkZU91dCgyNTApXG4gICAgICAgICAgICAuY2FsbCgoKSA9PiByZXNvbHZlKCkpO1xuICAgICAgICB9KSxcbiAgICAgICAgbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgdGhpcy5sYXlvdXQuZGlhbG9nLnNjYWxlWCA9IDEuMDtcbiAgICAgICAgICB0aGlzLmxheW91dC5kaWFsb2cuc2NhbGVZID0gMS4wO1xuICAgICAgICAgIHRoaXMubGF5b3V0LmRpYWxvZy50d2VlbmVyLmNsZWFyKClcbiAgICAgICAgICAgIC50byh7XG4gICAgICAgICAgICAgIHNjYWxlWDogMC4wLFxuICAgICAgICAgICAgICBzY2FsZVk6IDAuMFxuICAgICAgICAgICAgfSwgMjUwLCBcImVhc2VJbk91dFF1YWRcIilcbiAgICAgICAgICAgIC5jYWxsKCgpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5mbGFyZShcImNsb3NlZFwiLCB7XG4gICAgICAgICAgICAgICAgZGlhbG9nOiB0aGlzXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgIF0pLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLnJlbW92ZSgpO1xuICAgICAgICB0aGlzLmxheW91dC5kZXN0cm95KCk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmxheW91dDtcbiAgICAgICAgdGhpcy5mbGFyZShcImRlc3Ryb3lcIik7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgX2FjY2Vzc29yOiB7XG4gICAgICBjb250ZW50czoge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmxheW91dC5yZWZbXCJjb250ZW50c1wiXTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGRpYWxvZzoge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmxheW91dC5kaWFsb2dbdGhpcy5zaXplXTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHRpdGxlOiB7XG4gICAgICAgIC8vIGdldDogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLmxheW91dC5yZWZbXCJ0aXRsZVwiXS5sYWJlbDsgfVxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmRpYWxvZy5sYWJlbDtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGJ1dHRvbnM6IHtcbiAgICAgICAgLy8gZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMubGF5b3V0LnJlZltcImJ1dHRvbnNcIl07IH1cbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5kaWFsb2cuYnV0dG9ucztcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuXG4gICAgX3N0YXRpYzoge1xuICAgICAgU0laRToge1xuICAgICAgICBYUzogXCJ4c1wiLCAvLzQ4NngzMDcgIFxuICAgICAgICBTOiBcInNcIiwgLy80ODZ4Mzk2ICBcbiAgICAgICAgTTogXCJtXCIsIC8vNDg2eDQ2NiAgXG4gICAgICAgIEw6IFwibFwiLCAvLzQ4Nng1ODYgIFxuICAgICAgICBYTDogXCJ4bFwiLCAvLzU0Nng1OTYgIFxuICAgICAgICBYWEw6IFwieHhsXCIsIC8vNTQ2eDcyNiAgXG4gICAgICAgIFhYWEw6IFwieHh4bFwiIC8vNTQ2eDk1NiAgXG4gICAgICB9LFxuICAgICAgQlVUVE9OX0NPTE9SOiB7XG4gICAgICAgIFJFRDogXCJyZWRcIixcbiAgICAgICAgLy8gR1JFRU46IFwiZ3JlZW5cIixcbiAgICAgICAgQkxVRTogXCJibHVlXCIsXG4gICAgICAgIFdISVRFOiBcIndoaXRlXCIsXG4gICAgICB9LFxuXG4gICAgICBvcGVuOiBmdW5jdGlvbihzY2VuZSwgc2l6ZSwgc2V0dXBGdW5jdGlvbikge1xuICAgICAgICBjb25zdCBkaWFsb2cgPSBEaWFsb2coe1xuICAgICAgICAgIHNpemVcbiAgICAgICAgfSkuYWRkQ2hpbGRUbyhzY2VuZSk7XG5cbiAgICAgICAgc2V0dXBGdW5jdGlvbihkaWFsb2cpO1xuICAgICAgICBkaWFsb2cub3BlbigpO1xuXG4gICAgICAgIC8vIOOBk+OBhuOBl+OBn+OBhOOBjOOAgTFGcmFtZemBheOCjOOBpuOBoeOCieOBpOOBj1xuICAgICAgICAvLyBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgICAvLyAgIC50aGVuKCgpID0+IHNldHVwRnVuY3Rpb24oZGlhbG9nKSlcbiAgICAgICAgLy8gICAudGhlbigoKSA9PiBkaWFsb2cub3BlbigpKVxuXG4gICAgICAgIHJldHVybiBkaWFsb2c7XG4gICAgICB9LFxuXG4gICAgfVxuICB9KTtcbn0pO1xuIiwiLyoqXG4gKiBEb21CdXR0b25cbiAqIGVsZW1lbnTjgavjgYvjgbbjgZvjgovlvaLjgadET03jg5zjgr/jg7PjgpLkvZzmiJDjgZfjgb7jgZnjgIJcbiAqIFxuICogUGFyYW1hdGVyXG4gKiBhcHAgICAgICBDYW52YXNBcHBcbiAqIGVsZW1lbnQgIOOBi+OBtuOBm+OCi+WvvuixoWVsZW1lbnRcbiAqIGZ1bmMgICAgIOOCr+ODquODg+OCr+OBleOCjOOBn+aZguOBq+Wun+ihjOOBleOCjOOCi+mWouaVsFxuICovXG5cbnBoaW5hLm5hbWVzcGFjZSgoKSA9PiB7XG4gIHBoaW5hLmRlZmluZShcIkRvbUJ1dHRvblwiLCB7XG4gICAgc3VwZXJDbGFzczogXCJEaXNwbGF5RWxlbWVudFwiLFxuXG4gICAgaW5pdDogZnVuY3Rpb24oYXBwLCBlbGVtZW50KSB7XG4gICAgICB0aGlzLnN1cGVySW5pdCgpO1xuXG4gICAgICB0aGlzLmFwcCA9IGFwcDtcblxuICAgICAgdGhpcy5idG4gPSBudWxsO1xuICAgICAgdGhpcy5zZXR1cChlbGVtZW50KTtcbiAgICB9LFxuXG4gICAgc2V0dXA6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgIGlmICh0aGlzLmJ0bikge1xuICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRoaXMuYnRuKTtcbiAgICAgICAgLy8gdGhpcy5idG4ucmVtb3ZlKCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgIHRoaXMuYnRuLmlkID0gXCJidG5cIlxuICAgICAgdGhpcy5idG4uc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICB0aGlzLmJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICB0aGlzLmJ0bi5zdHlsZS5wYWRkaW5nID0gXCIwcHhcIjtcbiAgICAgIHRoaXMuYnRuLnN0eWxlLmJvcmRlcldpZHRoID0gXCIwcHhcIjtcblxuICAgICAgdGhpcy5idG4uc3R5bGUuZmlsdGVyID0gJ2FscGhhKG9wYWNpdHk9MCknO1xuICAgICAgdGhpcy5idG4uc3R5bGUuTW96T3BhY2l0eSA9IDAuMDtcbiAgICAgIHRoaXMuYnRuLnN0eWxlLm9wYWNpdHkgPSAwLjA7XG5cbiAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5idG4pO1xuXG4gICAgICB0aGlzLmJ0bi5vbmNsaWNrID0gKCkgPT4ge1xuICAgICAgICBlbGVtZW50LmZsYXJlKCdjbGlja2VkJyk7XG4gICAgICAgIHRoaXMuZmxhcmUoJ2NsaWNrZWQnKTtcbiAgICAgIH07XG5cbiAgICAgIHRoaXMub24oJ2VudGVyZnJhbWUnLCAoKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5idG4pIHJldHVybjtcbiAgICAgICAgY29uc3Qgc2NhbGUgPSBwYXJzZUludCh0aGlzLmFwcC5kb21FbGVtZW50LnN0eWxlLndpZHRoKSAvIHRoaXMuYXBwLmRvbUVsZW1lbnQud2lkdGggKiB0aGlzLmFwcC5xdWFsaXR5O1xuICAgICAgICBjb25zdCB3aWR0aCA9IGVsZW1lbnQud2lkdGggKiBzY2FsZTtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gZWxlbWVudC5oZWlnaHQgKiBzY2FsZTtcblxuICAgICAgICBsZXQgY2FudmFzTGVmdCA9IHBhcnNlSW50KHRoaXMuYXBwLmRvbUVsZW1lbnQuc3R5bGUubGVmdCk7XG4gICAgICAgIGxldCBjYW52YXNUb3AgPSBwYXJzZUludCh0aGlzLmFwcC5kb21FbGVtZW50LnN0eWxlLnRvcCk7XG4gICAgICAgIC8v6Ieq6Lqr44Gu44Kw44Ot44O844OQ44Or5bqn5qiZ44Gr5ZCI44KP44Gb44KLXG4gICAgICAgIGNhbnZhc0xlZnQgKz0gZWxlbWVudC5fd29ybGRNYXRyaXgubTAyICogc2NhbGU7XG4gICAgICAgIGNhbnZhc1RvcCArPSBlbGVtZW50Ll93b3JsZE1hdHJpeC5tMTIgKiBzY2FsZTtcbiAgICAgICAgY2FudmFzTGVmdCArPSAtZWxlbWVudC5vcmlnaW5YICogd2lkdGg7XG4gICAgICAgIGNhbnZhc1RvcCArPSAtZWxlbWVudC5vcmlnaW5ZICogaGVpZ2h0O1xuXG4gICAgICAgIHRoaXMuYnRuLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgICB0aGlzLmJ0bi5zdHlsZS53aWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgICAgdGhpcy5idG4uc3R5bGUuaGVpZ2h0ID0gYCR7aGVpZ2h0fXB4YDtcbiAgICAgICAgdGhpcy5idG4uc3R5bGUubGVmdCA9IGAke2NhbnZhc0xlZnR9cHhgO1xuICAgICAgICB0aGlzLmJ0bi5zdHlsZS50b3AgPSBgJHtjYW52YXNUb3B9cHhgO1xuICAgICAgfSk7XG5cbiAgICB9LFxuXG4gICAgb25yZW1vdmVkOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghdGhpcy5idG4pIHJldHVybjtcbiAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQodGhpcy5idG4pO1xuICAgICAgLy8gdGhpcy5idG4ucmVtb3ZlKCk7XG4gICAgICB0aGlzLmJ0biA9IG51bGw7XG4gICAgfSxcblxuICB9KTtcbn0pO1xuIiwicGhpbmEubmFtZXNwYWNlKCgpID0+IHtcbiAgcGhpbmEuZGVmaW5lKFwiRG9tVmlkZW9cIiwge1xuICAgIHN1cGVyQ2xhc3M6IFwiRGlzcGxheUVsZW1lbnRcIixcblxuICAgIGluaXQ6IGZ1bmN0aW9uKGFwcCwgZWxlbWVudCkge1xuICAgICAgdGhpcy5zdXBlckluaXQoKTtcbiAgICAgIHRoaXMuYXBwID0gYXBwO1xuICAgICAgdGhpcy52aWRlbyA9IG51bGw7XG4gICAgICB0aGlzLnNldHVwKGVsZW1lbnQpO1xuICAgIH0sXG5cbiAgICBzZXR1cDogZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgaWYgKHRoaXMudmlkZW8pIHtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCh0aGlzLnZpZGVvKTtcbiAgICAgICAgLy8gdGhpcy52aWRlby5yZW1vdmUoKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdmlkZW8gPSB0aGlzLnZpZGVvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInZpZGVvXCIpO1xuICAgICAgdmlkZW8uaWQgPSBcInZpZGVvXCI7XG4gICAgICB2aWRlby5tdXRlZCA9IHRydWU7XG5cbiAgICAgIHZpZGVvLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuXG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHZpZGVvKTtcblxuICAgICAgdGhpcy5vbignZW50ZXJmcmFtZScsICgpID0+IHtcbiAgICAgICAgaWYgKCF2aWRlbykgcmV0dXJuO1xuICAgICAgICBjb25zdCBzY2FsZSA9IHBhcnNlSW50KHRoaXMuYXBwLmRvbUVsZW1lbnQuc3R5bGUud2lkdGgpIC8gdGhpcy5hcHAuZG9tRWxlbWVudC53aWR0aCAqIHRoaXMuYXBwLnF1YWxpdHk7XG4gICAgICAgIGNvbnN0IHdpZHRoID0gZWxlbWVudC53aWR0aCAqIGVsZW1lbnQuc2NhbGVYICogc2NhbGU7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IGVsZW1lbnQuaGVpZ2h0ICogZWxlbWVudC5zY2FsZVggKiBzY2FsZTtcblxuICAgICAgICBsZXQgY2FudmFzTGVmdCA9IHBhcnNlSW50KHRoaXMuYXBwLmRvbUVsZW1lbnQuc3R5bGUubGVmdCk7XG4gICAgICAgIGxldCBjYW52YXNUb3AgPSBwYXJzZUludCh0aGlzLmFwcC5kb21FbGVtZW50LnN0eWxlLnRvcCk7XG5cbiAgICAgICAgY2FudmFzTGVmdCArPSBlbGVtZW50Ll93b3JsZE1hdHJpeC5tMDIgKiBzY2FsZTtcbiAgICAgICAgY2FudmFzVG9wICs9IGVsZW1lbnQuX3dvcmxkTWF0cml4Lm0xMiAqIHNjYWxlO1xuICAgICAgICBjYW52YXNMZWZ0ICs9IC1lbGVtZW50Lm9yaWdpblggKiB3aWR0aDtcbiAgICAgICAgY2FudmFzVG9wICs9IC1lbGVtZW50Lm9yaWdpblkgKiBoZWlnaHQ7XG5cbiAgICAgICAgLy8gdmlkZW8uc3R5bGUuZGlzcGxheSA9IFwiXCI7XG4gICAgICAgIHZpZGVvLnN0eWxlLndpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgICB2aWRlby5zdHlsZS5oZWlnaHQgPSBgJHtoZWlnaHR9cHhgO1xuICAgICAgICB2aWRlby5zdHlsZS5sZWZ0ID0gYCR7Y2FudmFzTGVmdH1weGA7XG4gICAgICAgIHZpZGVvLnN0eWxlLnRvcCA9IGAke2NhbnZhc1RvcH1weGA7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgbG9hZDogZnVuY3Rpb24oc3JjKSB7XG4gICAgICB0aGlzLnZpZGVvLnNyYyA9IHNyYztcbiAgICAgIHRoaXMudmlkZW8ub25sb2FkZWRtZXRhZGF0YSA9ICgoKSA9PiB7XG4gICAgICAgIHRoaXMuaXNMb2FkZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLmZsYXJlKFwibG9hZGVkXCIpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgcGxheTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnZpZGVvLmN1cnJlbnRUaW1lID0gMDtcbiAgICAgIHRoaXMudmlkZW8ucGxheSgpO1xuICAgICAgdGhpcy5mbGFyZShcInBsYXlcIilcbiAgICB9LFxuXG4gICAgb25yZW1vdmVkOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghdGhpcy52aWRlbykgcmV0dXJuO1xuICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCh0aGlzLnZpZGVvKTtcbiAgICAgIC8vIHRoaXMudmlkZW8ucmVtb3ZlKCk7XG4gICAgICB0aGlzLnZpZGVvID0gbnVsbDtcbiAgICB9LFxuXG4gIH0pO1xufSk7XG4iLCJwaGluYS5uYW1lc3BhY2UoZnVuY3Rpb24oKSB7XG4gIHBoaW5hLmRlZmluZShcIkRvd25sb2FkUHJvZ3Jlc3NcIiwge1xuICAgIHN1cGVyQ2xhc3M6IFwiTW9kYWxcIixcbiAgICBhc3NldHM6IG51bGwsXG5cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLnN1cGVySW5pdCgpO1xuICAgICAgdGhpcy5hc3NldHMgPSBvcHRpb25zLmFzc2V0cztcbiAgICAgIHRoaXMuc2V0dXAoKTtcbiAgICB9LFxuXG4gICAgc2V0dXA6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5nYXVnZUZyYW1lID0gUmVjdGFuZ2xlU2hhcGUoe1xuICAgICAgICBmaWxsOiBcIndoaXRlXCIsXG4gICAgICAgIHN0cm9rZTogbnVsbCxcbiAgICAgICAgY29ybmVyUmFkaXVzOiAxMixcbiAgICAgICAgd2lkdGg6IDUxMixcbiAgICAgICAgaGVpZ2h0OiAzMixcbiAgICAgICAgcGFkZGluZzogMCxcbiAgICAgICAgeDogU0NSRUVOX1dJRFRIICogMC41LFxuICAgICAgICB5OiAyNFxuICAgICAgfSkuYWRkQ2hpbGRUbyh0aGlzKTtcblxuICAgICAgY29uc29sZS5sb2codGhpcy5nYXVnZUZyYW1lLm9yaWdpblgsIHRoaXMuZ2F1Z2VGcmFtZS5vcmlnaW5ZKVxuXG4gICAgICB0aGlzLmdhdWdlID0gUmVjdGFuZ2xlU2hhcGUoe1xuICAgICAgICBmaWxsOiBcIm9yYW5nZVwiLFxuICAgICAgICBzdHJva2U6IG51bGwsXG4gICAgICAgIGNvcm5lclJhZGl1czogMTIsXG4gICAgICAgIHdpZHRoOiA1MDYsXG4gICAgICAgIGhlaWdodDogMjYsXG4gICAgICAgIHBhZGRpbmc6IDAsXG4gICAgICAgIHg6IC10aGlzLmdhdWdlRnJhbWUud2lkdGggKiAwLjUgKyAzLFxuICAgICAgICB5OiAwLFxuICAgICAgfSkuYWRkQ2hpbGRUbyh0aGlzLmdhdWdlRnJhbWUpO1xuXG4gICAgICB0aGlzLmdhdWdlLnNldE9yaWdpbigwLCAwLjUpO1xuXG4gICAgICB0aGlzLmdhdWdlLkdhdWdlID0gR2F1Z2UoKS5hdHRhY2hUbyh0aGlzLmdhdWdlKTtcbiAgICAgIHRoaXMuZ2F1Z2UuR2F1Z2UubWluID0gMC4wO1xuICAgICAgdGhpcy5nYXVnZS5HYXVnZS5tYXggPSAxLjA7XG4gICAgICB0aGlzLnNldFByb2dyZXNzKDAuMCk7XG4gICAgfSxcblxuICAgIHNldFByb2dyZXNzOiBmdW5jdGlvbihwcm9ncmVzcykge1xuICAgICAgdGhpcy5nYXVnZS5HYXVnZS52YWx1ZSA9IHByb2dyZXNzO1xuICAgIH0sXG5cbiAgICAvL+ihqOekuuOCouODi+ODoeODvOOCt+ODp+ODs1xuICAgIG9wZW5BbmltYXRpb246IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICB0aGlzLmFscGhhID0gMDtcbiAgICAgICAgdGhpcy50d2VlbmVyLmNsZWFyKClcbiAgICAgICAgICAuZmFkZUluKDI1MClcbiAgICAgICAgICAud2FpdCgyNTApXG4gICAgICAgICAgLmNhbGwoKCkgPT4gcmVzb2x2ZSgpKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvL+mdnuihqOekuuOCouODi+ODoeODvOOCt+ODp+ODs1xuICAgIGNsb3NlQW5pbWF0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgdGhpcy5hbHBoYSA9IDE7XG4gICAgICAgIHRoaXMudHdlZW5lci5jbGVhcigpXG4gICAgICAgICAgLndhaXQoMjUwKVxuICAgICAgICAgIC5mYWRlT3V0KDI1MClcbiAgICAgICAgICAuY2FsbCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZSgpO1xuICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8v6L+95Yqg44Gn44Ki44K744OD44OI44KS6Kqt44G/6L6844KAXG4gICAgc3RhcnRMb2FkQXNzZXRzOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghdGhpcy5hc3NldHMpIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgY29uc3QgbG9hZGVyID0gQXNzZXRMb2FkZXIoKTtcbiAgICAgICAgbG9hZGVyLm9ubG9hZCA9ICgpID0+IHJlc29sdmUoKTtcbiAgICAgICAgbG9hZGVyLm9ucHJvZ3Jlc3MgPSAoZSkgPT4gdGhpcy5zZXRQcm9ncmVzcyhlLnByb2dyZXNzKTtcbiAgICAgICAgbG9hZGVyLmxvYWQodGhpcy5hc3NldHMpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9zdGF0aWM6IHtcblxuICAgICAgaW5zdGFuY2U6IG51bGwsXG5cbiAgICAgIG9wZW46IGZ1bmN0aW9uKHNjZW5lLCBwYXRoUHJlZiwgYXNzZXRzKSB7XG5cbiAgICAgICAgYXNzZXRzID0gRG93bmxvYWRQcm9ncmVzcy55ZXRMb2FkZWRBc3NldHMoXG4gICAgICAgICAgUm9vdC5Mb2FkaW5nU2NlbmUuY29tYmluZUFzc2V0c1BhdGgoYXNzZXRzLCBwYXRoUHJlZilcbiAgICAgICAgKTtcblxuICAgICAgICAvL+OCt+ODvOODs+OBjOWtmOWcqOOBl+OBquOBhOWgtOWQiOOBr+WNs+W6p+OBq+WujOS6huOBq+OBmeOCi1xuICAgICAgICBpZiAoIXNjZW5lIHx8ICFhc3NldHMpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvL+OBmeOBp+OBq+OCpOODs+OCueOCv+ODs+OCueOBjOWtmOWcqOOBmeOCi+WgtOWQiOOBq+OBr+mWieOBmOOBpuOBiuOBj1xuICAgICAgICBpZiAodGhpcy5pbnN0YW5jZSkge1xuICAgICAgICAgIHRoaXMuaW5zdGFuY2UuY2xvc2UoKTtcbiAgICAgICAgICB0aGlzLmluc3RhbmNlID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8v5paw44GX44GP6L+95Yqg44GX44Gm6KGo56S6XG4gICAgICAgIHRoaXMuaW5zdGFuY2UgPSBEb3dubG9hZFByb2dyZXNzKHsgYXNzZXRzIH0pLmFkZENoaWxkVG8oc2NlbmUpO1xuICAgICAgICByZXR1cm4gdGhpcy5pbnN0YW5jZS5vcGVuKClcbiAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLmluc3RhbmNlLnN0YXJ0TG9hZEFzc2V0cygpKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaW5zdGFuY2UuY2xvc2UoKVxuICAgICAgICAgICAgdGhpcy5pbnN0YW5jZSA9IG51bGw7XG4gICAgICAgICAgfSlcbiAgICAgIH0sXG5cbiAgICAgIHlldExvYWRlZEFzc2V0czogZnVuY3Rpb24oYXNzZXRzKSB7XG4gICAgICAgIGlmICghYXNzZXRzKSByZXR1cm4gbnVsbDtcbiAgICAgICAgY29uc3QgeWV0ID0ge307XG4gICAgICAgIGFzc2V0cy5mb3JJbigodHlwZSwgZGF0YSkgPT4ge1xuICAgICAgICAgIGRhdGEuZm9ySW4oKGtleSwgdmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICghcGhpbmEuYXNzZXQuQXNzZXRNYW5hZ2VyLmdldCh0eXBlLCBrZXkpKSB7XG4gICAgICAgICAgICAgIHlldFt0eXBlXSA9IHlldFt0eXBlXSB8fCB7fTtcbiAgICAgICAgICAgICAgeWV0W3R5cGVdW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiAoT2JqZWN0LmtleXMoeWV0KS5sZW5ndGggPiAwKSA/IHlldCA6IG51bGw7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgfSk7XG59KTtcbiIsInBoaW5hLm5hbWVzcGFjZSgoKSA9PiB7XG4gIHBoaW5hLmRlZmluZShcIklucHV0RmllbGRcIiwge1xuICAgIHN1cGVyQ2xhc3M6IFwiRGlzcGxheUVsZW1lbnRcIixcblxuICAgIGRvbUVsZW1lbnQ6IG51bGwsXG5cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLm9wdGlvbnMgPSAoe30pLiRzYWZlKG9wdGlvbnMsIElucHV0RmllbGQuZGVmYXVsdHMpO1xuICAgICAgdGhpcy5zdXBlckluaXQob3B0aW9ucyk7XG5cbiAgICAgIHRoaXMuZG9tRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgICAgIHRoaXMuZG9tRWxlbWVudC50eXBlID0gXCJ0ZXh0XCI7XG4gICAgICB0aGlzLmRvbUVsZW1lbnQudmFsdWUgPSB0aGlzLm9wdGlvbnMudGV4dDtcblxuICAgICAgdGhpcy5kb21FbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgdGhpcy5kb21FbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgIHRoaXMuZG9tRWxlbWVudC5zdHlsZS5wYWRkaW5nID0gXCIwcHhcIjtcbiAgICAgIHRoaXMuZG9tRWxlbWVudC5zdHlsZS5ib3JkZXJXaWR0aCA9IFwiMHB4XCI7XG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuZG9tRWxlbWVudCk7XG5cbiAgICAgIHRoaXMuZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiZm9jdXNcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLmZsYXJlKFwiZm9jdXNcIik7XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5kb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJmb2N1c291dFwiLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuZmxhcmUoXCJmb2N1c291dFwiKTtcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLmRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5mbGFyZShcImNoYW5nZVwiKTtcbiAgICAgIH0pO1xuXG4gICAgICAvL1RPRE86YXBw44Gu5Y+C54Wn5pa55rOV44Gn5LuW44Gr6Imv44GE5pa55rOV44GM44GC44KM44Gw5aSJ5pu044GZ44KLXG4gICAgICB0aGlzLm9uZShcImVudGVyZnJhbWVcIiwgKGUpID0+IHtcbiAgICAgICAgdGhpcy5hcHAgPSBlLmFwcDtcbiAgICAgICAgdGhpcy5zZXR1cCgpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIHNldHVwOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMub24oXCJlbnRlcmZyYW1lXCIsICgpID0+IHtcbiAgICAgICAgY29uc3Qgc2NhbGUgPSBwYXJzZUludCh0aGlzLmFwcC5kb21FbGVtZW50LnN0eWxlLndpZHRoKSAvIHRoaXMuYXBwLmRvbUVsZW1lbnQud2lkdGggKiB0aGlzLmFwcC5xdWFsaXR5O1xuXG4gICAgICAgIGxldCBmb250U2l6ZSA9ICh0aGlzLm9wdGlvbnMuZm9udFNpemUgKiBzY2FsZSkucm91bmQoKTtcbiAgICAgICAgLy/jgq3jg6Pjg7Pjg5Djgrnjga7lt6bkuIrjgavlkIjjgo/jgZvjgotcbiAgICAgICAgbGV0IHdpZHRoID0gdGhpcy53aWR0aCAqIHNjYWxlO1xuICAgICAgICBsZXQgaGVpZ2h0ID0gdGhpcy5oZWlnaHQgKiBzY2FsZTtcbiAgICAgICAgbGV0IGNhbnZhc0xlZnQgPSBwYXJzZUludCh0aGlzLmFwcC5kb21FbGVtZW50LnN0eWxlLmxlZnQpO1xuICAgICAgICBsZXQgY2FudmFzVG9wID0gcGFyc2VJbnQodGhpcy5hcHAuZG9tRWxlbWVudC5zdHlsZS50b3ApO1xuXG4gICAgICAgIC8v6Ieq6Lqr44Gu44Kw44Ot44O844OQ44Or5bqn5qiZ44Gr5ZCI44KP44Gb44KLXG4gICAgICAgIGNhbnZhc0xlZnQgKz0gdGhpcy5fd29ybGRNYXRyaXgubTAyICogc2NhbGU7XG4gICAgICAgIGNhbnZhc1RvcCArPSB0aGlzLl93b3JsZE1hdHJpeC5tMTIgKiBzY2FsZTtcbiAgICAgICAgLy9vcmlnaW7jga7oqr/mlbRcbiAgICAgICAgY2FudmFzTGVmdCArPSAtdGhpcy5vcmlnaW5YICogd2lkdGg7XG4gICAgICAgIGNhbnZhc1RvcCArPSAtdGhpcy5vcmlnaW5ZICogaGVpZ2h0O1xuXG4gICAgICAgIHRoaXMuZG9tRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgICAgICAgdGhpcy5kb21FbGVtZW50LnN0eWxlLndpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gYCR7aGVpZ2h0fXB4YDtcbiAgICAgICAgdGhpcy5kb21FbGVtZW50LnN0eWxlLmxlZnQgPSBgJHtjYW52YXNMZWZ0fXB4YDtcbiAgICAgICAgdGhpcy5kb21FbGVtZW50LnN0eWxlLnRvcCA9IGAke2NhbnZhc1RvcH1weGA7XG4gICAgICAgIHRoaXMuZG9tRWxlbWVudC5zdHlsZS5mb250U2l6ZSA9IGAke2ZvbnRTaXplfXB4YDtcbiAgICAgICAgdGhpcy5kb21FbGVtZW50LnN0eWxlLmZvbnRGYW1pbGl5ID0gXCJNYWluLUJvbGRcIjtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBzZXRWaXNpYmxlOiBmdW5jdGlvbihmbGFnKSB7XG4gICAgICB0aGlzLnZpc2libGUgPSBmbGFnO1xuICAgICAgaWYgKHRoaXMuZG9tRWxlbWVudCkge1xuICAgICAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IChmbGFnKSA/IFwiXCIgOiBcIm5vbmVcIjtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBzaG93OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuc2V0VmlzaWJsZSh0cnVlKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBoaWRlOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuc2V0VmlzaWJsZShmYWxzZSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgYWRkQ1NTOiBmdW5jdGlvbihjc3MpIHtcbiAgICAgIGlmIChjc3MgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICBjc3MuZm9yRWFjaCgoYykgPT4ge1xuICAgICAgICAgIHRoaXMuZG9tRWxlbWVudC5jbGFzc0xpc3QuYWRkKGMpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLmRvbUVsZW1lbnQpIHtcbiAgICAgICAgICB0aGlzLmRvbUVsZW1lbnQuY2xhc3NMaXN0LmFkZChjc3MpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgcmVtb3ZlQ1NTOiBmdW5jdGlvbihjc3MpIHtcbiAgICAgIGlmIChjc3MgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICBjc3MuZm9yRWFjaCgoYykgPT4ge1xuICAgICAgICAgIHRoaXMuZG9tRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKGMpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLmRvbUVsZW1lbnQpIHtcbiAgICAgICAgICB0aGlzLmRvbUVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShjc3MpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgb25yZW1vdmVkOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLmRvbUVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5kb21FbGVtZW50LnJlbW92ZSgpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBfYWNjZXNzb3I6IHtcbiAgICAgIHRleHQ6IHtcbiAgICAgICAgXCJnZXRcIjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuICh0aGlzLmRvbUVsZW1lbnQpID8gdGhpcy5kb21FbGVtZW50LnZhbHVlIDogXCJcIjtcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZXRcIjogZnVuY3Rpb24odikge1xuICAgICAgICAgIGlmICghdGhpcy5kb21FbGVtZW50KSByZXR1cm47XG4gICAgICAgICAgdGhpcy5kb21FbGVtZW50LnZhbHVlID0gdjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBfc3RhdGljOiB7XG4gICAgICBkZWZhdWx0czoge1xuICAgICAgICB3aWR0aDogMjAwLFxuICAgICAgICBoZWlnaHQ6IDQwLFxuICAgICAgICBmb250U2l6ZTogMjAsXG4gICAgICAgIHRleHQ6IFwiXCIsXG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG59KTtcbiIsIi8vXG4vLyDjgq/jg6rjg4Pjgq/jgoTjgr/jg4Pjg4HjgpLjgqTjg7Pjgr/jg7zjgrvjg5fjg4jjgZnjgotcbi8vXG5waGluYS5kZWZpbmUoXCJJbnB1dEludGVyY2VwdFwiLCB7XG4gIHN1cGVyQ2xhc3M6IFwiRGlzcGxheUVsZW1lbnRcIixcblxuICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnN1cGVySW5pdCgpO1xuXG4gICAgdGhpcy5vbihcImFkZGVkXCIsICgpID0+IHtcbiAgICAgIC8v6Kaq44Gr5a++44GX44Gm6KaG44GE44GL44G244Gb44KLXG4gICAgICB0aGlzLndpZHRoID0gdGhpcy5wYXJlbnQud2lkdGg7XG4gICAgICB0aGlzLmhlaWdodCA9IHRoaXMucGFyZW50LmhlaWdodDtcbiAgICAgIHRoaXMub3JpZ2luWCA9IHRoaXMucGFyZW50Lm9yaWdpblggfHwgMDtcbiAgICAgIHRoaXMub3JpZ2luWSA9IHRoaXMucGFyZW50Lm9yaWdpblkgfHwgMDtcbiAgICAgIHRoaXMueCA9IDA7XG4gICAgICB0aGlzLnkgPSAwO1xuICAgIH0pO1xuICAgIHRoaXMuZGlzYWJsZSgpO1xuICB9LFxuXG4gIGVuYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zZXRJbnRlcmFjdGl2ZSh0cnVlKTtcbiAgfSxcblxuICBkaXNhYmxlOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNldEludGVyYWN0aXZlKGZhbHNlKTtcbiAgfSxcblxufSk7XG4iLCJwaGluYS5kZWZpbmUoXCJNb2RhbFwiLCB7XG4gIHN1cGVyQ2xhc3M6IFwiSW5wdXRJbnRlcmNlcHRcIixcblxuICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnN1cGVySW5pdCgpO1xuICAgIHRoaXMuZW5hYmxlKCk7XG4gIH0sXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy/ooajnpLrjgqLjg4vjg6Hjg7zjgrfjg6fjg7NcbiAgLy8g44Ki44OL44Oh44O844K344On44Oz44Gr44Gk44GE44Gm44Gv57aZ5om/5YWD44Gn5YaN5a6a576pXG4gIG9wZW5BbmltYXRpb246IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfSxcblxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIC8v6Z2e6KGo56S644Ki44OL44Oh44O844K344On44OzXG4gIC8vIOOCouODi+ODoeODvOOCt+ODp+ODs+OBq+OBpOOBhOOBpuOBr+e2meaJv+WFg+OBp+WGjeWumue+qVxuICBjbG9zZUFuaW1hdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9LFxuXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy/ooajnpLpcbiAgb3BlbjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMub3BlbkFuaW1hdGlvbigpO1xuICB9LFxuXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy/pnZ7ooajnpLpcbiAgY2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmNsb3NlQW5pbWF0aW9uKCk7XG4gIH1cblxufSk7XG4iLCJwaGluYS5uYW1lc3BhY2UoZnVuY3Rpb24oKSB7XG5cbiAgbGV0IGR1bW15VGV4dHVyZSA9IG51bGw7XG5cbiAgcGhpbmEuZGVmaW5lKFwiU3ByaXRlTGFiZWxcIiwge1xuICAgIHN1cGVyQ2xhc3M6IFwiRGlzcGxheUVsZW1lbnRcIixcblxuICAgIF90ZXh0OiBudWxsLFxuICAgIHRhYmxlOiBudWxsLFxuICAgIGZpeFdpZHRoOiAwLFxuXG4gICAgc3ByaXRlczogbnVsbCxcblxuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIGlmICghZHVtbXlUZXh0dXJlKSB7XG4gICAgICAgIGR1bW15VGV4dHVyZSA9IENhbnZhcygpLnNldFNpemUoMSwgMSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3VwZXJJbml0KG9wdGlvbnMpO1xuICAgICAgdGhpcy50YWJsZSA9IG9wdGlvbnMudGFibGU7XG4gICAgICB0aGlzLmZpeFdpZHRoID0gb3B0aW9ucy5maXhXaWR0aCB8fCAwO1xuXG4gICAgICB0aGlzLnNwcml0ZXMgPSBbXTtcblxuICAgICAgdGhpcy5zZXRUZXh0KFwiXCIpO1xuICAgIH0sXG5cbiAgICBzZXRUZXh0OiBmdW5jdGlvbih0ZXh0KSB7XG4gICAgICB0aGlzLl90ZXh0ID0gdGV4dDtcblxuICAgICAgY29uc3QgY2hhcnMgPSB0aGlzLnRleHQuc3BsaXQoXCJcIik7XG5cbiAgICAgIGlmICh0aGlzLnNwcml0ZXMubGVuZ3RoIDwgY2hhcnMubGVuZ3RoKSB7XG4gICAgICAgIEFycmF5LnJhbmdlKDAsIHRoaXMuc3ByaXRlcy5sZW5ndGggLSBjaGFycy5sZW5ndGgpLmZvckVhY2goKCkgPT4ge1xuICAgICAgICAgIHRoaXMuc3ByaXRlcy5wdXNoKFNwcml0ZShkdW1teVRleHR1cmUpKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBBcnJheS5yYW5nZSgwLCBjaGFycy5sZW5ndGggLSB0aGlzLnNwcml0ZXMubGVuZ3RoKS5mb3JFYWNoKCgpID0+IHtcbiAgICAgICAgICB0aGlzLnNwcml0ZXMubGFzdC5yZW1vdmUoKTtcbiAgICAgICAgICB0aGlzLnNwcml0ZXMubGVuZ3RoIC09IDE7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl90ZXh0LnNwbGl0KFwiXCIpLm1hcCgoYywgaSkgPT4ge1xuICAgICAgICB0aGlzLnNwcml0ZXNbaV1cbiAgICAgICAgICAuc2V0SW1hZ2UodGhpcy50YWJsZVtjXSlcbiAgICAgICAgICAuc2V0T3JpZ2luKHRoaXMub3JpZ2luWCwgdGhpcy5vcmlnaW5ZKVxuICAgICAgICAgIC5hZGRDaGlsZFRvKHRoaXMpO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHRvdGFsV2lkdGggPSB0aGlzLnNwcml0ZXMucmVkdWNlKCh3LCBzKSA9PiB3ICsgKHRoaXMuZml4V2lkdGggfHwgcy53aWR0aCksIDApO1xuICAgICAgY29uc3QgdG90YWxIZWlnaHQgPSB0aGlzLnNwcml0ZXMubWFwKF8gPT4gXy5oZWlnaHQpLnNvcnQoKS5sYXN0O1xuXG4gICAgICBsZXQgeCA9IHRvdGFsV2lkdGggKiAtdGhpcy5vcmlnaW5YO1xuICAgICAgdGhpcy5zcHJpdGVzLmZvckVhY2goKHMpID0+IHtcbiAgICAgICAgY29uc3Qgd2lkdGggPSB0aGlzLmZpeFdpZHRoIHx8IHMud2lkdGg7XG4gICAgICAgIHMueCA9IHggKyB3aWR0aCAqIHMub3JpZ2luWDtcbiAgICAgICAgeCArPSB3aWR0aDtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgX2FjY2Vzc29yOiB7XG4gICAgICB0ZXh0OiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX3RleHQ7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24odikge1xuICAgICAgICAgIHRoaXMuc2V0VGV4dCh2KTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcblxuICB9KTtcblxufSk7XG4iXX0=
