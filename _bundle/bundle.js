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
phina.namespace(function() {

  phina.define('Player', {
    superClass: 'Actor',

    init: function(options) {
      this.superInit();

      this.setShadow();

      this.sprite = Sprite("actor4", 32, 32)
        .setFrameIndex(0)
        .addChildTo(this);

      this.nowAnimation = "down";
    },

    update: function() {
      this.isAnimation = false;
      const app = phina_app;
      const ctrl = app.controller;
      let animationName = ""
      if (ctrl.up) {
        this.y -= 2;
        animationName = "up";
      } else if (ctrl.down) {
        this.y += 2;
        animationName = "down";
      }
      if (ctrl.left) {
        this.x -= 2;
        animationName += "left";
      } else if (ctrl.right) {
        this.x += 2;
        animationName += "right";
      }

      if (ctrl.jump) {
        if (!this.isJump) {
          this.isJump = true;
          this.sprite.tweener.clear()
            .by({ y: -32 }, 250, "easeOutSine")
            .by({ y: 32 }, 250, "easeInSine")
            .call(() => this.isJump = false)
          }
      }

      if (ctrl.attack) {
        if (!this.isAttack) {
          this.isAttack = true;
        }
      }

      this.setAnimation(animationName);
      if (ctrl.up || ctrl.down || ctrl.left || ctrl.right || this.isJump || this.isAttack) this.isAnimation = true;
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

    isAnimation: false,
    nowAnimation: "",
    animationInterval: 10,

    isJump: false,
    isAttack: false,

    init: function(options) {
      this.superInit();

      this.setupAnimation();

      this.on('enterframe', () => {
        //アニメーション
        if (this.sprite && this.isAnimation && this.time % this.animationInterval == 0) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCIwMjBfc2NlbmUvTWFpblNjZW5lLmpzIiwiMDIwX3NjZW5lL1RpdGxlU2NlbmUuanMiLCIwMTBfYXBwbGljYXRpb24vQXBwbGljYXRpb24uanMiLCIwMTBfYXBwbGljYXRpb24vQXNzZXRMaXN0LmpzIiwiMDEwX2FwcGxpY2F0aW9uL0Jhc2VTY2VuZS5qcyIsIjAxMF9hcHBsaWNhdGlvbi9GaXJzdFNjZW5lRmxvdy5qcyIsIjA0MF9lbGVtZW50L1BsYXllci5qcyIsIjA0MF9lbGVtZW50L1dvcmxkLmpzIiwiMDMwX2Jhc2UvQWN0b3IuanMiLCIwMDBfY29tbW9uL2FjY2Vzc29yeS9CdXR0b24uanMiLCIwMDBfY29tbW9uL2FjY2Vzc29yeS9DbGlwU3ByaXRlLmpzIiwiMDAwX2NvbW1vbi9hY2Nlc3NvcnkvR2F1Z2UuanMiLCIwMDBfY29tbW9uL2FjY2Vzc29yeS9HcmF5c2NhbGUuanMiLCIwMDBfY29tbW9uL2FjY2Vzc29yeS9MaXN0Vmlldy5qcyIsIjAwMF9jb21tb24vYWNjZXNzb3J5L01vdXNlQ2hhc2VyLmpzIiwiMDAwX2NvbW1vbi9hY2Nlc3NvcnkvUGllQ2xpcC5qcyIsIjAwMF9jb21tb24vYWNjZXNzb3J5L1JlY3RhbmdsZUNsaXAuanMiLCIwMDBfY29tbW9uL2FjY2Vzc29yeS9Ub2dnbGUuanMiLCIwMDBfY29tbW9uL3V0aWwvQnV0dG9uaXplLmpzIiwiMDAwX2NvbW1vbi91dGlsL1RleHR1cmVVdGlsLmpzIiwiMDAwX2NvbW1vbi91dGlsL1RpbGVkbWFwLmpzIiwiMDAwX2NvbW1vbi91dGlsL1V0aWwuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvQXNzZXRMb2FkZXIuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvQmFzZUFwcC5qcyIsIjAwMF9jb21tb24vZXh0ZW5zaW9ucy9DYW52YXMuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvQ2FudmFzUmVuZGVyZXIuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvQ2hlY2tCcm93c2VyLmpzIiwiMDAwX2NvbW1vbi9leHRlbnNpb25zL0Rpc3BsYXlFbGVtZW50LmpzIiwiMDAwX2NvbW1vbi9leHRlbnNpb25zL0Rpc3BsYXlTY2VuZS5qcyIsIjAwMF9jb21tb24vZXh0ZW5zaW9ucy9Eb21BdWRpb1NvdW5kLmpzIiwiMDAwX2NvbW1vbi9leHRlbnNpb25zL0VsZW1lbnQuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvSW5wdXQuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvTGFiZWwuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvTW91c2UuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvT2JqZWN0MkQuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvUGxhaW5FbGVtZW50LmpzIiwiMDAwX2NvbW1vbi9leHRlbnNpb25zL1NoYXBlLmpzIiwiMDAwX2NvbW1vbi9leHRlbnNpb25zL1NvdW5kLmpzIiwiMDAwX2NvbW1vbi9leHRlbnNpb25zL1NvdW5kTWFuYWdlci5qcyIsIjAwMF9jb21tb24vZXh0ZW5zaW9ucy9TcHJpdGUuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvU3RyaW5nLmpzIiwiMDAwX2NvbW1vbi9leHRlbnNpb25zL1RleHR1cmUuanMiLCIwMDBfY29tbW9uL2V4dGVuc2lvbnMvVHdlZW5lci5qcyIsIjAwMF9jb21tb24vZWxlbWVudHMvc2NlbmUvQmFzZVNjZW5lLmpzIiwiMDAwX2NvbW1vbi9lbGVtZW50cy9zY2VuZUVmZmVjdHMvU2NlbmVFZmZlY3RCYXNlLmpzIiwiMDAwX2NvbW1vbi9lbGVtZW50cy9zY2VuZUVmZmVjdHMvU2NlbmVFZmZlY3RDaXJjbGVGYWRlLmpzIiwiMDAwX2NvbW1vbi9lbGVtZW50cy9zY2VuZUVmZmVjdHMvU2NlbmVFZmZlY3RGYWRlLmpzIiwiMDAwX2NvbW1vbi9lbGVtZW50cy9zY2VuZUVmZmVjdHMvU2NlbmVFZmZlY3ROb25lLmpzIiwiMDAwX2NvbW1vbi9lbGVtZW50cy9zY2VuZUVmZmVjdHMvU2NlbmVFZmZlY3RUaWxlRmFkZS5qcyIsIjAwMF9jb21tb24vZWxlbWVudHMvdWkvQ29ubmVjdGlvblByb2dyZXNzLmpzIiwiMDAwX2NvbW1vbi9lbGVtZW50cy91aS9EaWFsb2cuanMiLCIwMDBfY29tbW9uL2VsZW1lbnRzL3VpL0RvbUJ1dHRvbi5qcyIsIjAwMF9jb21tb24vZWxlbWVudHMvdWkvRG9tVmlkZW8uanMiLCIwMDBfY29tbW9uL2VsZW1lbnRzL3VpL0Rvd25sb2FkUHJvZ3Jlc3MuanMiLCIwMDBfY29tbW9uL2VsZW1lbnRzL3VpL0lucHV0RmllbGQuanMiLCIwMDBfY29tbW9uL2VsZW1lbnRzL3VpL0lucHV0SW50ZXJjZXB0LmpzIiwiMDAwX2NvbW1vbi9lbGVtZW50cy91aS9Nb2RhbC5qcyIsIjAwMF9jb21tb24vZWxlbWVudHMvdWkvU3ByaXRlTGFiZWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiAgbWFpbi5qc1xuICovXG5cbnBoaW5hLmdsb2JhbGl6ZSgpO1xuXG5jb25zdCBTQ1JFRU5fV0lEVEggPSA1NzY7XG5jb25zdCBTQ1JFRU5fSEVJR0hUID0gMzI0O1xuY29uc3QgU0NSRUVOX1dJRFRIX0hBTEYgPSBTQ1JFRU5fV0lEVEggKiAwLjU7XG5jb25zdCBTQ1JFRU5fSEVJR0hUX0hBTEYgPSBTQ1JFRU5fSEVJR0hUICogMC41O1xuXG5jb25zdCBTQ1JFRU5fT0ZGU0VUX1ggPSAwO1xuY29uc3QgU0NSRUVOX09GRlNFVF9ZID0gMDtcblxubGV0IHBoaW5hX2FwcDtcblxud2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICBwaGluYV9hcHAgPSBBcHBsaWNhdGlvbigpO1xuICBwaGluYV9hcHAucmVwbGFjZVNjZW5lKEZpcnN0U2NlbmVGbG93KHt9KSk7XG4gIHBoaW5hX2FwcC5ydW4oKTtcbn07XG5cbi8v44K544Kv44Ot44O844Or56aB5q2iXG4vLyBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBmdW5jdGlvbihlKSB7XG4vLyAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuLy8gfSwgeyBwYXNzaXZlOiBmYWxzZSB9KTtcblxuLy9BbmRyb2lk44OW44Op44Km44K244OQ44OD44Kv44Oc44K/44Oz5Yi25b6hXG4vLyBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiYmFja2J1dHRvblwiLCBmdW5jdGlvbihlKXtcbi8vICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuLy8gfSwgZmFsc2UpOyIsInBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcblxuICBwaGluYS5kZWZpbmUoJ01haW5TY2VuZScsIHtcbiAgICBzdXBlckNsYXNzOiAnQmFzZVNjZW5lJyxcblxuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMuc3VwZXJJbml0KCk7XG4gICAgICB0aGlzLnNldHVwKCk7XG4gICAgfSxcblxuICAgIHNldHVwOiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IGJhY2sgPSBSZWN0YW5nbGVTaGFwZSh7IHdpZHRoOiBTQ1JFRU5fV0lEVEgsIGhlaWdodDogU0NSRUVOX0hFSUdIVCwgZmlsbDogXCJibGFja1wiIH0pXG4gICAgICAgIC5zZXRQb3NpdGlvbihTQ1JFRU5fV0lEVEhfSEFMRiwgU0NSRUVOX0hFSUdIVF9IQUxGKVxuICAgICAgICAuYWRkQ2hpbGRUbyh0aGlzKTtcbiAgICAgIHRoaXMucmVnaXN0RGlzcG9zZShiYWNrKTtcblxuICAgICAgdGhpcy53b3JsZCA9IFdvcmxkKCkuYWRkQ2hpbGRUbyh0aGlzKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlOiBmdW5jdGlvbigpIHtcbiAgICB9LFxuXG4gIH0pO1xuXG59KTtcbiIsIi8qXG4gKiAgVGl0bGVTY2VuZS5qc1xuICovXG5cbnBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcblxuICBwaGluYS5kZWZpbmUoJ1RpdGxlU2NlbmUnLCB7XG4gICAgc3VwZXJDbGFzczogJ0Jhc2VTY2VuZScsXG5cbiAgICBfc3RhdGljOiB7XG4gICAgICBpc0Fzc2V0TG9hZDogZmFsc2UsXG4gICAgfSxcblxuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMuc3VwZXJJbml0KCk7XG5cbiAgICAgIHRoaXMudW5sb2NrID0gZmFsc2U7XG4gICAgICB0aGlzLmxvYWRjb21wbGV0ZSA9IGZhbHNlO1xuICAgICAgdGhpcy5wcm9ncmVzcyA9IDA7XG5cbiAgICAgIC8v44Ot44O844OJ5riI44G/44Gq44KJ44Ki44K744OD44OI44Ot44O844OJ44KS44GX44Gq44GEXG4gICAgICBpZiAoVGl0bGVTY2VuZS5pc0Fzc2V0TG9hZCkge1xuICAgICAgICB0aGlzLnNldHVwKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL3ByZWxvYWQgYXNzZXRcbiAgICAgICAgY29uc3QgYXNzZXRzID0gQXNzZXRMaXN0LmdldChcInByZWxvYWRcIilcbiAgICAgICAgdGhpcy5sb2FkZXIgPSBwaGluYS5hc3NldC5Bc3NldExvYWRlcigpO1xuICAgICAgICB0aGlzLmxvYWRlci5sb2FkKGFzc2V0cyk7XG4gICAgICAgIHRoaXMubG9hZGVyLm9uKCdsb2FkJywgKCkgPT4gdGhpcy5zZXR1cCgpKTtcbiAgICAgICAgVGl0bGVTY2VuZS5pc0Fzc2V0TG9hZCA9IHRydWU7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHNldHVwOiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IGJhY2sgPSBSZWN0YW5nbGVTaGFwZSh7IHdpZHRoOiBTQ1JFRU5fV0lEVEgsIGhlaWdodDogU0NSRUVOX0hFSUdIVCwgZmlsbDogXCJibGFja1wiIH0pXG4gICAgICAgIC5zZXRQb3NpdGlvbihTQ1JFRU5fV0lEVEhfSEFMRiwgU0NSRUVOX0hFSUdIVF9IQUxGKVxuICAgICAgICAuYWRkQ2hpbGRUbyh0aGlzKTtcbiAgICAgIHRoaXMucmVnaXN0RGlzcG9zZShiYWNrKTtcblxuICAgICAgY29uc3QgbGFiZWwgPSBMYWJlbCh7IHRleHQ6IFwiVGl0bGVTY2VuZVwiLCBmaWxsOiBcIndoaXRlXCIgfSlcbiAgICAgICAgLnNldFBvc2l0aW9uKFNDUkVFTl9XSURUSF9IQUxGLCBTQ1JFRU5fSEVJR0hUX0hBTEYpXG4gICAgICAgIC5hZGRDaGlsZFRvKHRoaXMpO1xuICAgICAgdGhpcy5yZWdpc3REaXNwb3NlKGxhYmVsKTtcblxuICAgICAgYmFjay5zZXRJbnRlcmFjdGl2ZSh0cnVlKTtcbiAgICAgIGJhY2sub24oJ3BvaW50ZW5kJywgKCkgPT4gdGhpcy5leGl0KFwibWFpblwiKSk7XG5cbiAgICB9LFxuXG4gICAgdXBkYXRlOiBmdW5jdGlvbigpIHtcbiAgICB9LFxuXG4gIH0pO1xuXG59KTtcbiIsInBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcblxuICBwaGluYS5kZWZpbmUoXCJBcHBsaWNhdGlvblwiLCB7XG4gICAgc3VwZXJDbGFzczogXCJwaGluYS5kaXNwbGF5LkNhbnZhc0FwcFwiLFxuXG4gICAgcXVhbGl0eTogMS4wLFxuICBcbiAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuc3VwZXJJbml0KHtcbiAgICAgICAgZnBzOiA2MCxcbiAgICAgICAgd2lkdGg6IFNDUkVFTl9XSURUSCxcbiAgICAgICAgaGVpZ2h0OiBTQ1JFRU5fSEVJR0hULFxuICAgICAgICBmaXQ6IHRydWUsXG4gICAgICB9KTtcbiAgXG4gICAgICAvL+OCt+ODvOODs+OBruW5heOAgemrmOOBleOBruWfuuacrOOCkuioreWumlxuICAgICAgcGhpbmEuZGlzcGxheS5EaXNwbGF5U2NlbmUuZGVmYXVsdHMuJGV4dGVuZCh7XG4gICAgICAgIHdpZHRoOiBTQ1JFRU5fV0lEVEgsXG4gICAgICAgIGhlaWdodDogU0NSRUVOX0hFSUdIVCxcbiAgICAgIH0pO1xuICBcbiAgICAgIHBoaW5hLmlucHV0LklucHV0LnF1YWxpdHkgPSB0aGlzLnF1YWxpdHk7XG4gICAgICBwaGluYS5kaXNwbGF5LkRpc3BsYXlTY2VuZS5xdWFsaXR5ID0gdGhpcy5xdWFsaXR5O1xuXG4gICAgICAvL+OCsuODvOODoOODkeODg+ODieeuoeeQhlxuICAgICAgdGhpcy5nYW1lcGFkTWFuYWdlciA9IHBoaW5hLmlucHV0LkdhbWVwYWRNYW5hZ2VyKCk7XG4gICAgICB0aGlzLmdhbWVwYWQgPSB0aGlzLmdhbWVwYWRNYW5hZ2VyLmdldCgwKTtcbiAgICAgIHRoaXMuY29udHJvbGxlciA9IHt9O1xuXG4gICAgICB0aGlzLnNldHVwRXZlbnRzKCk7XG4gICAgICB0aGlzLnNldHVwU291bmQoKTtcbiAgICAgIHRoaXMuc2V0dXBNb3VzZVdoZWVsKCk7XG5cbiAgICAgIHRoaXMub24oXCJjaGFuZ2VzY2VuZVwiLCAoKSA9PiB7XG4gICAgICAgIC8v44K344O844Oz44KS6Zui44KM44KL6Zqb44CB44Oc44K/44Oz5ZCM5pmC5oq844GX44OV44Op44Kw44KS6Kej6Zmk44GZ44KLXG4gICAgICAgIEJ1dHRvbi5hY3Rpb25UYXJnZXQgPSBudWxsO1xuICAgICAgfSk7XG5cbiAgICAgIC8v44OR44OD44OJ5oOF5aCx44KS5pu05pawXG4gICAgICB0aGlzLm9uKCdlbnRlcmZyYW1lJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZ2FtZXBhZE1hbmFnZXIudXBkYXRlKCk7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udHJvbGxlcigpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgXG4gICAgLy/jg57jgqbjgrnjga7jg5vjg7zjg6vjgqTjg5njg7Pjg4jplqLpgKNcbiAgICBzZXR1cE1vdXNlV2hlZWw6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy53aGVlbERlbHRhWSA9IDA7XG4gICAgICB0aGlzLmRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNld2hlZWxcIiwgZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMud2hlZWxEZWx0YVkgPSBlLmRlbHRhWTtcbiAgICAgIH0uYmluZCh0aGlzKSwgZmFsc2UpO1xuICBcbiAgICAgIHRoaXMub24oXCJlbnRlcmZyYW1lXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnBvaW50ZXIud2hlZWxEZWx0YVkgPSB0aGlzLndoZWVsRGVsdGFZO1xuICAgICAgICB0aGlzLndoZWVsRGVsdGFZID0gMDtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvL+OCouODl+ODquOCseODvOOCt+ODp+ODs+WFqOS9k+OBruOCpOODmeODs+ODiOODleODg+OCr1xuICAgIHNldHVwRXZlbnRzOiBmdW5jdGlvbigpIHt9LFxuICBcbiAgICBzZXR1cFNvdW5kOiBmdW5jdGlvbigpIHt9LFxuXG4gICAgdXBkYXRlQ29udHJvbGxlcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYmVmb3JlID0gdGhpcy5jb250cm9sbGVyO1xuICAgICAgYmVmb3JlLmJlZm9yZSA9IG51bGw7XG5cbiAgICAgIHZhciBncCA9IHRoaXMuZ2FtZXBhZDtcbiAgICAgIHZhciBrYiA9IHRoaXMua2V5Ym9hcmQ7XG4gICAgICB2YXIgYW5nbGUxID0gZ3AuZ2V0S2V5QW5nbGUoKTtcbiAgICAgIHZhciBhbmdsZTIgPSBrYi5nZXRLZXlBbmdsZSgpO1xuICAgICAgdGhpcy5jb250cm9sbGVyID0ge1xuICAgICAgICAgIGFuZ2xlOiBhbmdsZTEgIT09IG51bGw/IGFuZ2xlMTogYW5nbGUyLFxuXG4gICAgICAgICAgdXA6IGdwLmdldEtleShcInVwXCIpIHx8IGtiLmdldEtleShcInVwXCIpLFxuICAgICAgICAgIGRvd246IGdwLmdldEtleShcImRvd25cIikgfHwga2IuZ2V0S2V5KFwiZG93blwiKSxcbiAgICAgICAgICBsZWZ0OiBncC5nZXRLZXkoXCJsZWZ0XCIpIHx8IGtiLmdldEtleShcImxlZnRcIiksXG4gICAgICAgICAgcmlnaHQ6IGdwLmdldEtleShcInJpZ2h0XCIpIHx8IGtiLmdldEtleShcInJpZ2h0XCIpLFxuXG4gICAgICAgICAgYXR0YWNrOiBncC5nZXRLZXkoXCJBXCIpIHx8IGtiLmdldEtleShcIlhcIiksXG4gICAgICAgICAganVtcDogICBncC5nZXRLZXkoXCJYXCIpIHx8IGtiLmdldEtleShcIlpcIiksXG4gICAgICAgICAgbWVudTogICBncC5nZXRLZXkoXCJzdGFydFwiKSB8fCBrYi5nZXRLZXkoXCJlc2NhcGVcIiksXG5cbiAgICAgICAgICBhOiBncC5nZXRLZXkoXCJBXCIpIHx8IGtiLmdldEtleShcIlpcIiksXG4gICAgICAgICAgYjogZ3AuZ2V0S2V5KFwiQlwiKSB8fCBrYi5nZXRLZXkoXCJYXCIpLFxuICAgICAgICAgIHg6IGdwLmdldEtleShcIlhcIikgfHwga2IuZ2V0S2V5KFwiQ1wiKSxcbiAgICAgICAgICB5OiBncC5nZXRLZXkoXCJZXCIpIHx8IGtiLmdldEtleShcIlZcIiksXG5cbiAgICAgICAgICBvazogZ3AuZ2V0S2V5KFwiQVwiKSB8fCBrYi5nZXRLZXkoXCJaXCIpIHx8IGtiLmdldEtleShcInNwYWNlXCIpIHx8IGtiLmdldEtleShcInJldHVyblwiKSxcbiAgICAgICAgICBjYW5jZWw6IGdwLmdldEtleShcIkJcIikgfHwga2IuZ2V0S2V5KFwiWFwiKSB8fCBrYi5nZXRLZXkoXCJlc2NhcGVcIiksXG5cbiAgICAgICAgICBzdGFydDogZ3AuZ2V0S2V5KFwic3RhcnRcIikgfHwga2IuZ2V0S2V5KFwicmV0dXJuXCIpLFxuICAgICAgICAgIHNlbGVjdDogZ3AuZ2V0S2V5KFwic2VsZWN0XCIpLFxuXG4gICAgICAgICAgcGF1c2U6IGdwLmdldEtleShcInN0YXJ0XCIpIHx8IGtiLmdldEtleShcImVzY2FwZVwiKSxcblxuICAgICAgICAgIGFuYWxvZzE6IGdwLmdldFN0aWNrRGlyZWN0aW9uKDApLFxuICAgICAgICAgIGFuYWxvZzI6IGdwLmdldFN0aWNrRGlyZWN0aW9uKDEpLFxuXG4gICAgICAgICAgLy/liY3jg5Xjg6zjg7zjg6Dmg4XloLFcbiAgICAgICAgICBiZWZvcmU6IGJlZm9yZSxcbiAgICAgIH07XG4gIH0sXG59KTtcbiAgXG59KTsiLCIvKlxuICogIEFzc2V0TGlzdC5qc1xuICovXG5cbnBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcblxuICBwaGluYS5kZWZpbmUoXCJBc3NldExpc3RcIiwge1xuICAgIF9zdGF0aWM6IHtcbiAgICAgIGxvYWRlZDogW10sXG4gICAgICBpc0xvYWRlZDogZnVuY3Rpb24oYXNzZXRUeXBlKSB7XG4gICAgICAgIHJldHVybiBBc3NldExpc3QubG9hZGVkW2Fzc2V0VHlwZV0/IHRydWU6IGZhbHNlO1xuICAgICAgfSxcbiAgICAgIGdldDogZnVuY3Rpb24oYXNzZXRUeXBlKSB7XG4gICAgICAgIEFzc2V0TGlzdC5sb2FkZWRbYXNzZXRUeXBlXSA9IHRydWU7XG4gICAgICAgIHN3aXRjaCAoYXNzZXRUeXBlKSB7XG4gICAgICAgICAgY2FzZSBcInByZWxvYWRcIjpcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIGltYWdlOiB7XG4gICAgICAgICAgICAgICAgXCJhY3RvcjRcIjogXCJhc3NldHMvdGV4dHVyZXMvYWN0b3I0LnBuZ1wiLFxuICAgICAgICAgICAgICAgIFwic2hhZG93XCI6IFwiYXNzZXRzL3RleHR1cmVzL3NoYWRvdy5wbmdcIixcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjYXNlIFwiY29tbW9uXCI6XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBpbWFnZToge1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBcImludmFsaWQgYXNzZXRUeXBlOiBcIiArIG9wdGlvbnMuYXNzZXRUeXBlO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0sXG4gIH0pO1xuXG59KTtcbiIsIi8qXG4gKiAgTWFpblNjZW5lLmpzXG4gKiAgMjAxOC8xMC8yNlxuICovXG5cbnBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcblxuICBwaGluYS5kZWZpbmUoXCJCYXNlU2NlbmVcIiwge1xuICAgIHN1cGVyQ2xhc3M6ICdEaXNwbGF5U2NlbmUnLFxuXG4gICAgLy/lu4Pmo4Tjgqjjg6zjg6Hjg7Pjg4hcbiAgICBkaXNwb3NlRWxlbWVudHM6IG51bGwsXG5cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0gKG9wdGlvbnMgfHwge30pLiRzYWZlKHtcbiAgICAgICAgd2lkdGg6IFNDUkVFTl9XSURUSCxcbiAgICAgICAgaGVpZ2h0OiBTQ1JFRU5fSEVJR0hULFxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICd0cmFuc3BhcmVudCcsXG4gICAgICB9KTtcbiAgICAgIHRoaXMuc3VwZXJJbml0KG9wdGlvbnMpO1xuXG4gICAgICAvL+OCt+ODvOODs+mbouiEseaZgmNhbnZhc+ODoeODouODquino+aUvlxuICAgICAgdGhpcy5kaXNwb3NlRWxlbWVudHMgPSBbXTtcbiAgICAgIHRoaXMub25lKCdkZXN0cm95JywgKCkgPT4ge1xuICAgICAgICB0aGlzLmRpc3Bvc2VFbGVtZW50cy5mb3JFYWNoKGUgPT4ge1xuICAgICAgICAgIGlmIChlLmRlc3Ryb3lDYW52YXMpIHtcbiAgICAgICAgICAgIGUuZGVzdHJveUNhbnZhcygpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZSBpbnN0YW5jZW9mIENhbnZhcykge1xuICAgICAgICAgICAgZS5zZXRTaXplKDAsIDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5hcHAgPSBwaGluYV9hcHA7XG5cbiAgICAgIC8v5Yil44K344O844Oz44G444Gu56e76KGM5pmC44Gr44Kt44Oj44Oz44OQ44K544KS56C05qOEXG4gICAgICB0aGlzLm9uZSgnZXhpdCcsICgpID0+IHtcbiAgICAgICAgdGhpcy5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuY2FudmFzLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5mbGFyZSgnZGVzdHJveScpO1xuICAgICAgICBjb25zb2xlLmxvZyhcIkV4aXQgc2NlbmUuXCIpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge30sXG5cbiAgICBmYWRlSW46IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSAob3B0aW9ucyB8fCB7fSkuJHNhZmUoe1xuICAgICAgICBjb2xvcjogXCJ3aGl0ZVwiLFxuICAgICAgICBtaWxsaXNlY29uZDogNTAwLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIGNvbnN0IG1hc2sgPSBSZWN0YW5nbGVTaGFwZSh7XG4gICAgICAgICAgd2lkdGg6IFNDUkVFTl9XSURUSCxcbiAgICAgICAgICBoZWlnaHQ6IFNDUkVFTl9IRUlHSFQsXG4gICAgICAgICAgZmlsbDogb3B0aW9ucy5jb2xvcixcbiAgICAgICAgICBzdHJva2VXaWR0aDogMCxcbiAgICAgICAgfSkuc2V0UG9zaXRpb24oU0NSRUVOX1dJRFRIICogMC41LCBTQ1JFRU5fSEVJR0hUICogMC41KS5hZGRDaGlsZFRvKHRoaXMpO1xuICAgICAgICBtYXNrLnR3ZWVuZXIuY2xlYXIoKVxuICAgICAgICAgIC5mYWRlT3V0KG9wdGlvbnMubWlsbGlzZWNvbmQpXG4gICAgICAgICAgLmNhbGwoKCkgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgdGhpcy5hcHAub25lKCdlbnRlcmZyYW1lJywgKCkgPT4gbWFzay5kZXN0cm95Q2FudmFzKCkpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIGZhZGVPdXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSAob3B0aW9ucyB8fCB7fSkuJHNhZmUoe1xuICAgICAgICBjb2xvcjogXCJ3aGl0ZVwiLFxuICAgICAgICBtaWxsaXNlY29uZDogNTAwLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIGNvbnN0IG1hc2sgPSBSZWN0YW5nbGVTaGFwZSh7XG4gICAgICAgICAgd2lkdGg6IFNDUkVFTl9XSURUSCxcbiAgICAgICAgICBoZWlnaHQ6IFNDUkVFTl9IRUlHSFQsXG4gICAgICAgICAgZmlsbDogb3B0aW9ucy5jb2xvcixcbiAgICAgICAgICBzdHJva2VXaWR0aDogMCxcbiAgICAgICAgfSkuc2V0UG9zaXRpb24oU0NSRUVOX1dJRFRIICogMC41LCBTQ1JFRU5fSEVJR0hUICogMC41KS5hZGRDaGlsZFRvKHRoaXMpO1xuICAgICAgICBtYXNrLmFscGhhID0gMDtcbiAgICAgICAgbWFzay50d2VlbmVyLmNsZWFyKClcbiAgICAgICAgICAuZmFkZUluKG9wdGlvbnMubWlsbGlzZWNvbmQpXG4gICAgICAgICAgLmNhbGwoKCkgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgdGhpcy5hcHAub25lKCdlbnRlcmZyYW1lJywgKCkgPT4gbWFzay5kZXN0cm95Q2FudmFzKCkpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8v44K344O844Oz6Zui6ISx5pmC44Gr56C05qOE44GZ44KLU2hhcGXjgpLnmbvpjLJcbiAgICByZWdpc3REaXNwb3NlOiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICB0aGlzLmRpc3Bvc2VFbGVtZW50cy5wdXNoKGVsZW1lbnQpO1xuICAgIH0sXG4gIH0pO1xuXG59KTsiLCIvKlxuICogIEZpcnN0U2NlbmVGbG93LmpzXG4gKi9cblxucGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuXG4gIHBoaW5hLmRlZmluZShcIkZpcnN0U2NlbmVGbG93XCIsIHtcbiAgICBzdXBlckNsYXNzOiBcIk1hbmFnZXJTY2VuZVwiLFxuXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICBzdGFydExhYmVsID0gb3B0aW9ucy5zdGFydExhYmVsIHx8IFwidGl0bGVcIjtcbiAgICAgIHRoaXMuc3VwZXJJbml0KHtcbiAgICAgICAgc3RhcnRMYWJlbDogc3RhcnRMYWJlbCxcbiAgICAgICAgc2NlbmVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6IFwidGl0bGVcIixcbiAgICAgICAgICAgIGNsYXNzTmFtZTogXCJUaXRsZVNjZW5lXCIsXG4gICAgICAgICAgICBuZXh0TGFiZWw6IFwiaG9tZVwiLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6IFwibWFpblwiLFxuICAgICAgICAgICAgY2xhc3NOYW1lOiBcIk1haW5TY2VuZVwiLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG59KTsiLCJwaGluYS5uYW1lc3BhY2UoZnVuY3Rpb24oKSB7XG5cbiAgcGhpbmEuZGVmaW5lKCdQbGF5ZXInLCB7XG4gICAgc3VwZXJDbGFzczogJ0FjdG9yJyxcblxuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMuc3VwZXJJbml0KCk7XG5cbiAgICAgIHRoaXMuc2V0U2hhZG93KCk7XG5cbiAgICAgIHRoaXMuc3ByaXRlID0gU3ByaXRlKFwiYWN0b3I0XCIsIDMyLCAzMilcbiAgICAgICAgLnNldEZyYW1lSW5kZXgoMClcbiAgICAgICAgLmFkZENoaWxkVG8odGhpcyk7XG5cbiAgICAgIHRoaXMubm93QW5pbWF0aW9uID0gXCJkb3duXCI7XG4gICAgfSxcblxuICAgIHVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmlzQW5pbWF0aW9uID0gZmFsc2U7XG4gICAgICBjb25zdCBhcHAgPSBwaGluYV9hcHA7XG4gICAgICBjb25zdCBjdHJsID0gYXBwLmNvbnRyb2xsZXI7XG4gICAgICBsZXQgYW5pbWF0aW9uTmFtZSA9IFwiXCJcbiAgICAgIGlmIChjdHJsLnVwKSB7XG4gICAgICAgIHRoaXMueSAtPSAyO1xuICAgICAgICBhbmltYXRpb25OYW1lID0gXCJ1cFwiO1xuICAgICAgfSBlbHNlIGlmIChjdHJsLmRvd24pIHtcbiAgICAgICAgdGhpcy55ICs9IDI7XG4gICAgICAgIGFuaW1hdGlvbk5hbWUgPSBcImRvd25cIjtcbiAgICAgIH1cbiAgICAgIGlmIChjdHJsLmxlZnQpIHtcbiAgICAgICAgdGhpcy54IC09IDI7XG4gICAgICAgIGFuaW1hdGlvbk5hbWUgKz0gXCJsZWZ0XCI7XG4gICAgICB9IGVsc2UgaWYgKGN0cmwucmlnaHQpIHtcbiAgICAgICAgdGhpcy54ICs9IDI7XG4gICAgICAgIGFuaW1hdGlvbk5hbWUgKz0gXCJyaWdodFwiO1xuICAgICAgfVxuXG4gICAgICBpZiAoY3RybC5qdW1wKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0p1bXApIHtcbiAgICAgICAgICB0aGlzLmlzSnVtcCA9IHRydWU7XG4gICAgICAgICAgdGhpcy5zcHJpdGUudHdlZW5lci5jbGVhcigpXG4gICAgICAgICAgICAuYnkoeyB5OiAtMzIgfSwgMjUwLCBcImVhc2VPdXRTaW5lXCIpXG4gICAgICAgICAgICAuYnkoeyB5OiAzMiB9LCAyNTAsIFwiZWFzZUluU2luZVwiKVxuICAgICAgICAgICAgLmNhbGwoKCkgPT4gdGhpcy5pc0p1bXAgPSBmYWxzZSlcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjdHJsLmF0dGFjaykge1xuICAgICAgICBpZiAoIXRoaXMuaXNBdHRhY2spIHtcbiAgICAgICAgICB0aGlzLmlzQXR0YWNrID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLnNldEFuaW1hdGlvbihhbmltYXRpb25OYW1lKTtcbiAgICAgIGlmIChjdHJsLnVwIHx8IGN0cmwuZG93biB8fCBjdHJsLmxlZnQgfHwgY3RybC5yaWdodCB8fCB0aGlzLmlzSnVtcCB8fCB0aGlzLmlzQXR0YWNrKSB0aGlzLmlzQW5pbWF0aW9uID0gdHJ1ZTtcbiAgICB9LFxuXG4gICAgc2V0dXBBbmltYXRpb246IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5zcGNpYWxBbmltYXRpb24gPSBmYWxzZTtcbiAgICAgIHRoaXMuZnJhbWUgPSBbXTtcbiAgICAgIHRoaXMuZnJhbWVbXCJzdGFuZFwiXSA9IFsxMywgMTRdO1xuICAgICAgdGhpcy5mcmFtZVtcImp1bXBcIl0gPSBbMzYsIFwic3RvcFwiXTtcblxuICAgICAgdGhpcy5mcmFtZVtcInVwXCJdID0gICBbIDksIDEwLCAxMSwgMTBdO1xuICAgICAgdGhpcy5mcmFtZVtcImRvd25cIl0gPSBbIDAsICAxLCAgMiwgIDFdO1xuICAgICAgdGhpcy5mcmFtZVtcImxlZnRcIl0gPSBbIDMsICA0LCAgNSwgIDRdO1xuICAgICAgdGhpcy5mcmFtZVtcInJpZ2h0XCJdID0gWyA2LCAgNywgIDgsICA3XTtcbiAgICAgIHRoaXMuZnJhbWVbXCJkb3dubGVmdFwiXSA9IFsgNDgsICA0OSwgIDUwLCAgNDldO1xuICAgICAgdGhpcy5mcmFtZVtcInVwbGVmdFwiXSA9IFsgNTEsICA1MiwgIDUzLCAgNTJdO1xuICAgICAgdGhpcy5mcmFtZVtcImRvd25yaWdodFwiXSA9IFsgNTQsICA1NSwgIDU2LCAgNTVdO1xuICAgICAgdGhpcy5mcmFtZVtcInVwcmlnaHRcIl0gPSBbIDU3LCAgNTgsICA1OSwgIDU4XTtcblxuXG4gICAgICB0aGlzLmZyYW1lW1wiYXR0YWNrXCJdID0gWyA0MSwgNDIsIDQzLCA0NCwgXCJzdG9wXCJdO1xuICAgICAgdGhpcy5mcmFtZVtcImRlZmVuc2VcIl0gPSBbIDQxLCA0MiwgNDMsIDQ0LCBcInN0b3BcIl07XG4gICAgICB0aGlzLmZyYW1lW1wiZGFtYWdlXCJdID0gWyAxOCwgMTksIDIwXTtcbiAgICAgIHRoaXMuZnJhbWVbXCJkcm9wXCJdID0gWzE4LCAxOSwgMjBdO1xuICAgICAgdGhpcy5mcmFtZVtcImRlYWRcIl0gPSBbMTgsIDE5LCAyMCwgMzMsIDM0LCAzNSwgXCJzdG9wXCJdO1xuICAgICAgdGhpcy5mcmFtZVtcImNsZWFyXCJdID0gWzI0LCAyNSwgMjZdO1xuICAgICAgdGhpcy5mcmFtZVtcInN0dW5cIl0gPSBbIDE4LCAxOSwgMjBdO1xuICAgICAgdGhpcy5pbmRleCA9IC0xO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICB9KTtcblxufSk7XG4iLCJwaGluYS5uYW1lc3BhY2UoZnVuY3Rpb24oKSB7XG5cbiAgcGhpbmEuZGVmaW5lKCdXb3JsZCcsIHtcbiAgICBzdXBlckNsYXNzOiAnRGlzcGxheUVsZW1lbnQnLFxuXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdGhpcy5zdXBlckluaXQoKTtcbiAgICAgIHRoaXMuc2V0dXAoKTtcbiAgICB9LFxuXG4gICAgc2V0dXA6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5tYXBCYXNlID0gRGlzcGxheUVsZW1lbnQoKVxuICAgICAgICAuc2V0UG9zaXRpb24oU0NSRUVOX1dJRFRIX0hBTEYsIFNDUkVFTl9IRUlHSFRfSEFMRilcbiAgICAgICAgLmFkZENoaWxkVG8odGhpcyk7XG5cbiAgICAgIHRoaXMucGxheWVyID0gUGxheWVyKCkuYWRkQ2hpbGRUbyh0aGlzLm1hcEJhc2UpO1xuICAgIH0sXG5cbiAgICB1cGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgXG4gICAgfSxcblxuICB9KTtcblxufSk7XG4iLCJwaGluYS5uYW1lc3BhY2UoZnVuY3Rpb24oKSB7XG5cbiAgcGhpbmEuZGVmaW5lKCdBY3RvcicsIHtcbiAgICBzdXBlckNsYXNzOiAnRGlzcGxheUVsZW1lbnQnLFxuXG4gICAgc3ByaXRlOiBudWxsLFxuXG4gICAgaXNBbmltYXRpb246IGZhbHNlLFxuICAgIG5vd0FuaW1hdGlvbjogXCJcIixcbiAgICBhbmltYXRpb25JbnRlcnZhbDogMTAsXG5cbiAgICBpc0p1bXA6IGZhbHNlLFxuICAgIGlzQXR0YWNrOiBmYWxzZSxcblxuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMuc3VwZXJJbml0KCk7XG5cbiAgICAgIHRoaXMuc2V0dXBBbmltYXRpb24oKTtcblxuICAgICAgdGhpcy5vbignZW50ZXJmcmFtZScsICgpID0+IHtcbiAgICAgICAgLy/jgqLjg4vjg6Hjg7zjgrfjg6fjg7NcbiAgICAgICAgaWYgKHRoaXMuc3ByaXRlICYmIHRoaXMuaXNBbmltYXRpb24gJiYgdGhpcy50aW1lICUgdGhpcy5hbmltYXRpb25JbnRlcnZhbCA9PSAwKSB7XG4gICAgICAgICAgdGhpcy5pbmRleCA9ICh0aGlzLmluZGV4KzEpICUgdGhpcy5mcmFtZVt0aGlzLm5vd0FuaW1hdGlvbl0ubGVuZ3RoO1xuICAgICAgICAgIC8v5qyh44OV44Os44O844Og55Wq5Y+344GM54m55q6K5oyH5a6a44Gu5aC05ZCIXG4gICAgICAgICAgdmFyIG5leHQgPSB0aGlzLmZyYW1lW3RoaXMubm93QW5pbWF0aW9uXVt0aGlzLmluZGV4XTtcbiAgICAgICAgICBpZiAobmV4dCA9PSBcInN0b3BcIikge1xuICAgICAgICAgICAgICAvL+WBnOatolxuICAgICAgICAgICAgICB0aGlzLmluZGV4LS07XG4gICAgICAgICAgfSBlbHNlIGlmIChuZXh0ID09IFwicmVtb3ZlXCIpIHtcbiAgICAgICAgICAgICAgLy/jg6rjg6Djg7zjg5ZcbiAgICAgICAgICAgICAgdGhpcy5yZW1vdmUoKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBuZXh0ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgIC8v5oyH5a6a44Ki44OL44Oh44O844K344On44Oz44G45aSJ5pu0XG4gICAgICAgICAgICAgIHRoaXMuc2V0QW5pbWF0aW9uKG5leHQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMuc3ByaXRlLmZyYW1lSW5kZXggPSBuZXh0O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRpbWUrKztcbiAgICAgIH0pO1xuICAgICAgdGhpcy50aW1lID0gMDtcbiAgICB9LFxuXG4gICAgc2V0U2hhZG93OiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLnNoYWRvdykgcmV0dXJuIHRoaXM7XG4gICAgICB0aGlzLnNoYWRvdyA9IFNwcml0ZShcInNoYWRvd1wiKVxuICAgICAgICAuc2V0UG9zaXRpb24oMCwgMzIpXG4gICAgICAgIC5hZGRDaGlsZFRvKHRoaXMpO1xuICAgICAgdGhpcy5zaGFkb3cuYWxwaGEgPSAwLjU7XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBzZXR1cEFuaW1hdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgc2V0QW5pbWF0aW9uOiBmdW5jdGlvbihhbmltTmFtZSkge1xuICAgICAgaWYgKCF0aGlzLmZyYW1lW2FuaW1OYW1lXSkgcmV0dXJuIHRoaXM7XG4gICAgICBpZiAoYW5pbU5hbWUgPT0gdGhpcy5ub3dBbmltYXRpb24pIHJldHVybiB0aGlzO1xuICAgICAgdGhpcy5ub3dBbmltYXRpb24gPSBhbmltTmFtZTtcbiAgICAgIHRoaXMuaW5kZXggPSAtMTtcbiAgICAgIHRoaXMuaXNDaGFuZ2VBbmltYXRpb24gPSB0cnVlO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICB9KTtcblxufSk7XG4iLCJwaGluYS5kZWZpbmUoXCJCdXR0b25cIiwge1xuICBzdXBlckNsYXNzOiBcIkFjY2Vzc29yeVwiLFxuXG4gIGxvZ25wcmVzc1RpbWU6IDUwMCxcbiAgZG9Mb25ncHJlc3M6IGZhbHNlLFxuXG4gIC8v6ZW35oq844GX44Gn6YCj5omT44Oi44O844OJXG4gIGxvbmdwcmVzc0JhcnJhZ2U6IGZhbHNlLFxuXG4gIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3VwZXJJbml0KCk7XG5cbiAgICB0aGlzLm9uKFwiYXR0YWNoZWRcIiwgKCkgPT4ge1xuICAgICAgdGhpcy50YXJnZXQuaW50ZXJhY3RpdmUgPSB0cnVlO1xuICAgICAgdGhpcy50YXJnZXQuY2xpY2tTb3VuZCA9IEJ1dHRvbi5kZWZhdWx0cy5jbGlja1NvdW5kO1xuXG4gICAgICAvL+ODnOOCv+ODs+aKvOOBl+aZgueUqFxuICAgICAgdGhpcy50YXJnZXQuc2NhbGVUd2VlbmVyID0gVHdlZW5lcigpLmF0dGFjaFRvKHRoaXMudGFyZ2V0KTtcblxuICAgICAgLy/plbfmirzjgZfnlKhcbiAgICAgIHRoaXMudGFyZ2V0LnR3TG9uZ3ByZXNzID0gVHdlZW5lcigpLmF0dGFjaFRvKHRoaXMudGFyZ2V0KTtcblxuICAgICAgLy/plbfmirzjgZfkuK3nibnmrorlr77lv5znlKhcbiAgICAgIHRoaXMudGFyZ2V0LnR3TG9uZ3ByZXNzaW5nID0gVHdlZW5lcigpLmF0dGFjaFRvKHRoaXMudGFyZ2V0KTtcblxuICAgICAgdGhpcy50YXJnZXQub24oXCJwb2ludHN0YXJ0XCIsIChlKSA9PiB7XG5cbiAgICAgICAgLy/jgqTjg5njg7Pjg4josqvpgJrjgavjgZfjgabjgYrjgY9cbiAgICAgICAgZS5wYXNzID0gdHJ1ZTtcblxuICAgICAgICAvL+ODnOOCv+ODs+OBruWQjOaZguaKvOOBl+OCkuWItumZkFxuICAgICAgICBpZiAoQnV0dG9uLmFjdGlvblRhcmdldCAhPT0gbnVsbCkgcmV0dXJuO1xuXG4gICAgICAgIC8v44Oq44K544OI44OT44Ol44O844Gu5a2Q5L6b44Gg44Gj44Gf5aC05ZCI44Gvdmlld3BvcnTjgajjga7jgYLjgZ/jgorliKTlrprjgpLjgZnjgotcbiAgICAgICAgY29uc3QgbGlzdFZpZXcgPSBCdXR0b24uZmluZExpc3RWaWV3KGUudGFyZ2V0KTtcbiAgICAgICAgaWYgKGxpc3RWaWV3ICYmICFsaXN0Vmlldy52aWV3cG9ydC5oaXRUZXN0KGUucG9pbnRlci54LCBlLnBvaW50ZXIueSkpIHJldHVybjtcblxuICAgICAgICBpZiAobGlzdFZpZXcpIHtcbiAgICAgICAgICAvL+ODneOCpOODs+OCv+OBjOenu+WLleOBl+OBn+WgtOWQiOOBr+mVt+aKvOOBl+OCreODo+ODs+OCu+ODq++8iGxpc3RWaWV35YaF54mI77yJXG4gICAgICAgICAgbGlzdFZpZXcuaW5uZXIuJHdhdGNoKCd5JywgKHYxLCB2MikgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0ICE9PSBCdXR0b24uYWN0aW9uVGFyZ2V0KSByZXR1cm47XG4gICAgICAgICAgICBpZiAoTWF0aC5hYnModjEgLSB2MikgPCAxMCkgcmV0dXJuO1xuXG4gICAgICAgICAgICBCdXR0b24uYWN0aW9uVGFyZ2V0ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudGFyZ2V0LnR3TG9uZ3ByZXNzLmNsZWFyKCk7XG4gICAgICAgICAgICB0aGlzLnRhcmdldC5zY2FsZVR3ZWVuZXIuY2xlYXIoKS50byh7XG4gICAgICAgICAgICAgIHNjYWxlWDogMS4wICogdGhpcy5zeCxcbiAgICAgICAgICAgICAgc2NhbGVZOiAxLjAgKiB0aGlzLnN5XG4gICAgICAgICAgICB9LCA1MCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvL+ODnOOCv+ODs+OBruWHpueQhuOCkuWun+ihjOOBl+OBpuOCguWVj+mhjOOBquOBhOWgtOWQiOOBruOBv+iyq+mAmuOCkuWBnOatouOBmeOCi1xuICAgICAgICBlLnBhc3MgPSBmYWxzZTtcbiAgICAgICAgQnV0dG9uLmFjdGlvblRhcmdldCA9IHRoaXMudGFyZ2V0O1xuXG4gICAgICAgIC8v5Y+N6Lui44GX44Gm44GE44KL44Oc44K/44Oz55So44Gr5L+d5oyB44GZ44KLXG4gICAgICAgIHRoaXMuc3ggPSAodGhpcy50YXJnZXQuc2NhbGVYID4gMCkgPyAxIDogLTE7XG4gICAgICAgIHRoaXMuc3kgPSAodGhpcy50YXJnZXQuc2NhbGVZID4gMCkgPyAxIDogLTE7XG5cbiAgICAgICAgdGhpcy50YXJnZXQuc2NhbGVUd2VlbmVyLmNsZWFyKClcbiAgICAgICAgICAudG8oe1xuICAgICAgICAgICAgc2NhbGVYOiAwLjk1ICogdGhpcy5zeCxcbiAgICAgICAgICAgIHNjYWxlWTogMC45NSAqIHRoaXMuc3lcbiAgICAgICAgICB9LCA1MCk7XG5cbiAgICAgICAgdGhpcy5kb0xvbmdwcmVzcyA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRhcmdldC50d0xvbmdwcmVzcy5jbGVhcigpXG4gICAgICAgICAgLndhaXQodGhpcy5sb2ducHJlc3NUaW1lKVxuICAgICAgICAgIC5jYWxsKCgpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy5sb25ncHJlc3NCYXJyYWdlKSB7XG4gICAgICAgICAgICAgIEJ1dHRvbi5hY3Rpb25UYXJnZXQgPSBudWxsO1xuICAgICAgICAgICAgICB0aGlzLnRhcmdldC5zY2FsZVR3ZWVuZXIuY2xlYXIoKVxuICAgICAgICAgICAgICAgIC50byh7XG4gICAgICAgICAgICAgICAgICBzY2FsZVg6IDEuMCAqIHRoaXMuc3gsXG4gICAgICAgICAgICAgICAgICBzY2FsZVk6IDEuMCAqIHRoaXMuc3lcbiAgICAgICAgICAgICAgICB9LCA1MClcbiAgICAgICAgICAgICAgdGhpcy50YXJnZXQuZmxhcmUoXCJsb25ncHJlc3NcIilcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMudGFyZ2V0LmZsYXJlKFwiY2xpY2tTb3VuZFwiKTtcbiAgICAgICAgICAgICAgdGhpcy50YXJnZXQudHdMb25ncHJlc3NpbmcuY2xlYXIoKVxuICAgICAgICAgICAgICAgIC53YWl0KDUpXG4gICAgICAgICAgICAgICAgLmNhbGwoKCkgPT4gdGhpcy50YXJnZXQuZmxhcmUoXCJjbGlja2VkXCIsIHtcbiAgICAgICAgICAgICAgICAgIGxvbmdwcmVzczogdHJ1ZVxuICAgICAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgICAgIC5jYWxsKCgpID0+IHRoaXMudGFyZ2V0LmZsYXJlKFwibG9uZ3ByZXNzaW5nXCIpKVxuICAgICAgICAgICAgICAgIC5zZXRMb29wKHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIHRoaXMudGFyZ2V0Lm9uKFwicG9pbnRlbmRcIiwgKGUpID0+IHtcbiAgICAgICAgLy/jgqTjg5njg7Pjg4josqvpgJrjgavjgZfjgabjgYrjgY9cbiAgICAgICAgZS5wYXNzID0gdHJ1ZTtcblxuICAgICAgICAvL1xuICAgICAgICB0aGlzLnRhcmdldC50d0xvbmdwcmVzcy5jbGVhcigpO1xuICAgICAgICB0aGlzLnRhcmdldC50d0xvbmdwcmVzc2luZy5jbGVhcigpO1xuXG4gICAgICAgIC8v44K/44O844Ky44OD44OI44GMbnVsbOOBi3BvaW50c3RhcnTjgafkv53mjIHjgZfjgZ/jgr/jg7zjgrLjg4Pjg4jjgajpgZXjgYbloLTlkIjjga/jgrnjg6vjg7zjgZnjgotcbiAgICAgICAgaWYgKEJ1dHRvbi5hY3Rpb25UYXJnZXQgPT09IG51bGwpIHJldHVybjtcbiAgICAgICAgaWYgKEJ1dHRvbi5hY3Rpb25UYXJnZXQgIT09IHRoaXMudGFyZ2V0KSByZXR1cm47XG5cbiAgICAgICAgLy/jg5zjgr/jg7Pjga7lh6bnkIbjgpLlrp/ooYzjgZfjgabjgoLllY/poYzjgarjgYTloLTlkIjjga7jgb/osqvpgJrjgpLlgZzmraLjgZnjgotcbiAgICAgICAgZS5wYXNzID0gZmFsc2U7XG5cbiAgICAgICAgLy/mirzjgZfjgZ/kvY3nva7jgYvjgonjgYLjgovnqIvluqbnp7vli5XjgZfjgabjgYTjgovloLTlkIjjga/jgq/jg6rjg4Pjgq/jgqTjg5njg7Pjg4jjgpLnmbrnlJ/jgZXjgZvjgarjgYRcbiAgICAgICAgY29uc3QgaXNNb3ZlID0gZS5wb2ludGVyLnN0YXJ0UG9zaXRpb24uc3ViKGUucG9pbnRlci5wb3NpdGlvbikubGVuZ3RoKCkgPiA1MDtcbiAgICAgICAgY29uc3QgaGl0VGVzdCA9IHRoaXMudGFyZ2V0LmhpdFRlc3QoZS5wb2ludGVyLngsIGUucG9pbnRlci55KTtcbiAgICAgICAgaWYgKGhpdFRlc3QgJiYgIWlzTW92ZSkgdGhpcy50YXJnZXQuZmxhcmUoXCJjbGlja1NvdW5kXCIpO1xuXG4gICAgICAgIHRoaXMudGFyZ2V0LnNjYWxlVHdlZW5lci5jbGVhcigpXG4gICAgICAgICAgLnRvKHtcbiAgICAgICAgICAgIHNjYWxlWDogMS4wICogdGhpcy5zeCxcbiAgICAgICAgICAgIHNjYWxlWTogMS4wICogdGhpcy5zeVxuICAgICAgICAgIH0sIDUwKVxuICAgICAgICAgIC5jYWxsKCgpID0+IHtcbiAgICAgICAgICAgIEJ1dHRvbi5hY3Rpb25UYXJnZXQgPSBudWxsO1xuICAgICAgICAgICAgaWYgKCFoaXRUZXN0IHx8IGlzTW92ZSB8fCB0aGlzLmRvTG9uZ3ByZXNzKSByZXR1cm47XG4gICAgICAgICAgICB0aGlzLnRhcmdldC5mbGFyZShcImNsaWNrZWRcIiwge1xuICAgICAgICAgICAgICBwb2ludGVyOiBlLnBvaW50ZXJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIC8v44Ki44OL44Oh44O844K344On44Oz44Gu5pyA5Lit44Gr5YmK6Zmk44GV44KM44Gf5aC05ZCI44Gr5YKZ44GI44GmcmVtb3ZlZOOCpOODmeODs+ODiOaZguOBq+ODleODqeOCsOOCkuWFg+OBq+aIu+OBl+OBpuOBiuOBj1xuICAgICAgdGhpcy50YXJnZXQub25lKFwicmVtb3ZlZFwiLCAoKSA9PiB7XG4gICAgICAgIGlmIChCdXR0b24uYWN0aW9uVGFyZ2V0ID09PSB0aGlzLnRhcmdldCkge1xuICAgICAgICAgIEJ1dHRvbi5hY3Rpb25UYXJnZXQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgdGhpcy50YXJnZXQub24oXCJjbGlja1NvdW5kXCIsICgpID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLnRhcmdldC5jbGlja1NvdW5kIHx8IHRoaXMudGFyZ2V0LmNsaWNrU291bmQgPT0gXCJcIikgcmV0dXJuO1xuICAgICAgICBwaGluYS5hc3NldC5Tb3VuZE1hbmFnZXIucGxheSh0aGlzLnRhcmdldC5jbGlja1NvdW5kKTtcbiAgICAgIH0pO1xuXG4gICAgfSk7XG4gIH0sXG5cbiAgLy/plbfmirzjgZfjga7lvLfliLbjgq3jg6Pjg7Pjgrvjg6tcbiAgbG9uZ3ByZXNzQ2FuY2VsOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnRhcmdldC50d0xvbmdwcmVzcy5jbGVhcigpO1xuICAgIHRoaXMudGFyZ2V0LnR3TG9uZ3ByZXNzaW5nLmNsZWFyKCk7XG4gIH0sXG5cbiAgX3N0YXRpYzoge1xuICAgIC8v44Oc44K/44Oz5ZCM5pmC5oq844GX44KS5Yi25b6h44GZ44KL44Gf44KB44Grc3RhdHVz44Gvc3RhdGlj44Gr44GZ44KLXG4gICAgc3RhdHVzOiAwLFxuICAgIGFjdGlvblRhcmdldDogbnVsbCxcbiAgICAvL+WfuuacrOioreWumlxuICAgIGRlZmF1bHRzOiB7XG4gICAgICBjbGlja1NvdW5kOiBcImNvbW1vbi9zb3VuZHMvc2UvYnV0dG9uXCIsXG4gICAgfSxcblxuICAgIC8v6Kaq44KS44Gf44Gp44Gj44GmTGlzdFZpZXfjgpLmjqLjgZlcbiAgICBmaW5kTGlzdFZpZXc6IGZ1bmN0aW9uKGVsZW1lbnQsIHApIHtcbiAgICAgIC8v44Oq44K544OI44OT44Ol44O844KS5oyB44Gj44Gm44GE44KL5aC05ZCIXG4gICAgICBpZiAoZWxlbWVudC5MaXN0VmlldyAhPSBudWxsKSByZXR1cm4gZWxlbWVudC5MaXN0VmlldztcbiAgICAgIC8v6Kaq44GM44Gq44GR44KM44Gw57WC5LqGXG4gICAgICBpZiAoZWxlbWVudC5wYXJlbnQgPT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gICAgICAvL+imquOCkuOBn+OBqeOCi1xuICAgICAgcmV0dXJuIHRoaXMuZmluZExpc3RWaWV3KGVsZW1lbnQucGFyZW50KTtcbiAgICB9XG5cbiAgfVxuXG59KTtcbiIsIi8qKlxyXG4gKiDopqrjgrnjg5fjg6njgqTjg4jjga7jg4bjgq/jgrnjg4Hjg6PjgpLliIfjgormipzjgYTjgaboh6rliIbjga7jg4bjgq/jgrnjg4Hjg6PjgajjgZnjgovjgrnjg5fjg6njgqTjg4hcclxuICog6Kaq44K544OX44Op44Kk44OI44Gu5YiH44KK5oqc44GL44KM44Gf6YOo5YiG44Gv44CB5YiH44KK5oqc44GN56+E5Zuy44Gu5bem5LiK44Gu44OU44Kv44K744Or44Gu6Imy44Gn5aGX44KK44Gk44G244GV44KM44KLXHJcbiAqIFxyXG4gKiDopqropoHntKDjga7mi6HnuK7jg7vlm57ou6Ljga/ogIPmha7jgZfjgarjgYRcclxuICovXHJcbnBoaW5hLmRlZmluZShcIkNsaXBTcHJpdGVcIiwge1xyXG4gIHN1cGVyQ2xhc3M6IFwiQWNjZXNzb3J5XCIsXHJcblxyXG4gIGluaXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5zdXBlckluaXQoKTtcclxuICAgIHRoaXMub24oXCJhdHRhY2hlZFwiLCAoKSA9PiB7XHJcbiAgICAgIHRoaXMudGFyZ2V0Lm9uZShcImFkZGVkXCIsICgpID0+IHtcclxuICAgICAgICB0aGlzLnNldHVwKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgc2V0dXA6IGZ1bmN0aW9uKCkge1xyXG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpcy50YXJnZXQ7XHJcbiAgICBjb25zdCBwYXJlbnQgPSB0YXJnZXQucGFyZW50O1xyXG4gICAgaWYgKHBhcmVudCBpbnN0YW5jZW9mIHBoaW5hLmRpc3BsYXkuU3ByaXRlKSB7XHJcbiAgICAgIGNvbnN0IHggPSBwYXJlbnQud2lkdGggKiBwYXJlbnQub3JpZ2luLnggKyB0YXJnZXQueCAtIHRhcmdldC53aWR0aCAqIHRhcmdldC5vcmlnaW4ueDtcclxuICAgICAgY29uc3QgeSA9IHBhcmVudC5oZWlnaHQgKiBwYXJlbnQub3JpZ2luLnkgKyB0YXJnZXQueSAtIHRhcmdldC5oZWlnaHQgKiB0YXJnZXQub3JpZ2luLnk7XHJcbiAgICAgIGNvbnN0IHcgPSB0YXJnZXQud2lkdGg7XHJcbiAgICAgIGNvbnN0IGggPSB0YXJnZXQuaGVpZ2h0O1xyXG5cclxuICAgICAgY29uc3QgcGFyZW50VGV4dHVyZSA9IHBhcmVudC5pbWFnZTtcclxuICAgICAgY29uc3QgY2FudmFzID0gcGhpbmEuZ3JhcGhpY3MuQ2FudmFzKCkuc2V0U2l6ZSh3LCBoKTtcclxuICAgICAgY2FudmFzLmNvbnRleHQuZHJhd0ltYWdlKHBhcmVudFRleHR1cmUuZG9tRWxlbWVudCwgeCwgeSwgdywgaCwgMCwgMCwgdywgaCk7XHJcbiAgICAgIGlmIChwYXJlbnRUZXh0dXJlIGluc3RhbmNlb2YgcGhpbmEuZ3JhcGhpY3MuQ2FudmFzKSB7XHJcbiAgICAgICAgLy8g44Kv44Ot44O844Oz44GX44Gm44Gd44Gj44Gh44KS5L2/44GGXHJcbiAgICAgICAgY29uc3QgcGFyZW50VGV4dHVyZUNsb25lID0gcGhpbmEuZ3JhcGhpY3MuQ2FudmFzKCkuc2V0U2l6ZShwYXJlbnRUZXh0dXJlLndpZHRoLCBwYXJlbnRUZXh0dXJlLmhlaWdodCk7XHJcbiAgICAgICAgcGFyZW50VGV4dHVyZUNsb25lLmNvbnRleHQuZHJhd0ltYWdlKHBhcmVudFRleHR1cmUuZG9tRWxlbWVudCwgMCwgMCk7XHJcbiAgICAgICAgcGFyZW50LmltYWdlID0gcGFyZW50VGV4dHVyZUNsb25lO1xyXG5cclxuICAgICAgICBjb25zdCBkYXRhID0gcGFyZW50VGV4dHVyZUNsb25lLmNvbnRleHQuZ2V0SW1hZ2VEYXRhKHgsIHksIDEsIDEpLmRhdGE7XHJcbiAgICAgICAgcGFyZW50VGV4dHVyZUNsb25lLmNvbnRleHQuY2xlYXJSZWN0KHgsIHksIHcsIGgpO1xyXG4gICAgICAgIGlmIChkYXRhWzNdID4gMCkge1xyXG4gICAgICAgICAgcGFyZW50VGV4dHVyZUNsb25lLmNvbnRleHQuZ2xvYmFsQWxwaGEgPSAxO1xyXG4gICAgICAgICAgcGFyZW50VGV4dHVyZUNsb25lLmNvbnRleHQuZmlsbFN0eWxlID0gYHJnYmEoJHtkYXRhWzBdfSwgJHtkYXRhWzFdfSwgJHtkYXRhWzJdfSwgJHtkYXRhWzNdIC8gMjU1fSlgO1xyXG4gICAgICAgICAgcGFyZW50VGV4dHVyZUNsb25lLmNvbnRleHQuZmlsbFJlY3QoeCAtIDEsIHkgLSAxLCB3ICsgMiwgaCArIDIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3Qgc3ByaXRlID0gcGhpbmEuZGlzcGxheS5TcHJpdGUoY2FudmFzKTtcclxuICAgICAgc3ByaXRlLnNldE9yaWdpbih0YXJnZXQub3JpZ2luLngsIHRhcmdldC5vcmlnaW4ueSk7XHJcbiAgICAgIHRhcmdldC5hZGRDaGlsZEF0KHNwcml0ZSwgMCk7XHJcbiAgICB9XHJcbiAgfSxcclxufSk7XHJcbiIsInBoaW5hLmRlZmluZShcIkdhdWdlXCIsIHtcbiAgc3VwZXJDbGFzczogXCJSZWN0YW5nbGVDbGlwXCIsXG5cbiAgX21pbjogMCxcbiAgX21heDogMS4wLFxuICBfdmFsdWU6IDEuMCwgLy9taW4gfiBtYXhcblxuICBkaXJlY3Rpb246IFwiaG9yaXpvbnRhbFwiLCAvLyBob3Jpem9udGFsIG9yIHZlcnRpY2FsXG5cbiAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zdXBlckluaXQoKTtcbiAgICB0aGlzLm9uKFwiYXR0YWNoZWRcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5fd2lkdGggPSB0aGlzLndpZHRoO1xuICAgICAgdGhpcy5faGVpZ2h0ID0gdGhpcy53aWR0aDtcblxuICAgICAgdGhpcy50YXJnZXQuYWNjZXNzb3IoXCJHYXVnZS5taW5cIiwge1xuICAgICAgICBcImdldFwiOiAoKSA9PiB0aGlzLm1pbixcbiAgICAgICAgXCJzZXRcIjogKHYpID0+IHRoaXMubWluID0gdixcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLnRhcmdldC5hY2Nlc3NvcihcIkdhdWdlLm1heFwiLCB7XG4gICAgICAgIFwiZ2V0XCI6ICgpID0+IHRoaXMubWF4LFxuICAgICAgICBcInNldFwiOiAodikgPT4gdGhpcy5tYXggPSB2LFxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMudGFyZ2V0LmFjY2Vzc29yKFwiR2F1Z2UudmFsdWVcIiwge1xuICAgICAgICBcImdldFwiOiAoKSA9PiB0aGlzLnZhbHVlLFxuICAgICAgICBcInNldFwiOiAodikgPT4gdGhpcy52YWx1ZSA9IHYsXG4gICAgICB9KTtcblxuICAgICAgdGhpcy50YXJnZXQuYWNjZXNzb3IoXCJHYXVnZS5wcm9ncmVzc1wiLCB7XG4gICAgICAgIFwiZ2V0XCI6ICgpID0+IHRoaXMucHJvZ3Jlc3MsXG4gICAgICAgIFwic2V0XCI6ICh2KSA9PiB0aGlzLnByb2dyZXNzID0gdixcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9LFxuXG4gIF9yZWZyZXNoOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5kaXJlY3Rpb24gIT09IFwidmVydGljYWxcIikge1xuICAgICAgdGhpcy53aWR0aCA9IHRoaXMudGFyZ2V0LndpZHRoICogdGhpcy5wcm9ncmVzcztcbiAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy50YXJnZXQuaGVpZ2h0O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLndpZHRoID0gdGhpcy50YXJnZXQud2lkdGg7XG4gICAgICB0aGlzLmhlaWdodCA9IHRoaXMudGFyZ2V0LmhlaWdodCAqIHRoaXMucHJvZ3Jlc3M7XG4gICAgfVxuICB9LFxuXG4gIF9hY2Nlc3Nvcjoge1xuICAgIHByb2dyZXNzOiB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBwID0gKHRoaXMudmFsdWUgLSB0aGlzLm1pbikgLyAodGhpcy5tYXggLSB0aGlzLm1pbik7XG4gICAgICAgIHJldHVybiAoaXNOYU4ocCkpID8gMC4wIDogcDtcbiAgICAgIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMubWF4ICogdjtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgbWF4OiB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWF4O1xuICAgICAgfSxcbiAgICAgIHNldDogZnVuY3Rpb24odikge1xuICAgICAgICB0aGlzLl9tYXggPSB2O1xuICAgICAgICB0aGlzLl9yZWZyZXNoKCk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIG1pbjoge1xuICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21pbjtcbiAgICAgIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgdGhpcy5fbWluID0gdjtcbiAgICAgICAgdGhpcy5fcmVmcmVzaCgpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICB2YWx1ZToge1xuICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICAgICAgfSxcbiAgICAgIHNldDogZnVuY3Rpb24odikge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHY7XG4gICAgICAgIHRoaXMuX3JlZnJlc2goKTtcbiAgICAgIH1cbiAgICB9LFxuICB9XG5cbn0pO1xuIiwicGhpbmEuZGVmaW5lKFwiR3JheXNjYWxlXCIsIHtcbiAgc3VwZXJDbGFzczogXCJBY2Nlc3NvcnlcIixcblxuICBncmF5VGV4dHVyZU5hbWU6IG51bGwsXG5cbiAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHRoaXMuc3VwZXJJbml0KCk7XG4gICAgdGhpcy5vbihcImF0dGFjaGVkXCIsICgpID0+IHtcbiAgICAgIHRoaXMuZ3JheVRleHR1cmVOYW1lID0gb3B0aW9ucy5ncmF5VGV4dHVyZU5hbWU7XG4gICAgICB0aGlzLm5vcm1hbCA9IHRoaXMudGFyZ2V0LmltYWdlO1xuICAgIH0pO1xuICB9LFxuXG4gIHRvR3JheXNjYWxlOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnRhcmdldC5pbWFnZSA9IHRoaXMuZ3JheVRleHR1cmVOYW1lO1xuICB9LFxuXG4gIHRvTm9ybWFsOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnRhcmdldC5pbWFnZSA9IHRoaXMubm9ybWFsO1xuICB9LFxuXG59KTtcbiIsInBoaW5hLm5hbWVzcGFjZSgoKSA9PiB7XG5cbiAgcGhpbmEuZGVmaW5lKFwiTGlzdFZpZXdcIiwge1xuICAgIHN1cGVyQ2xhc3M6IFwiQWNjZXNzb3J5XCIsXG5cbiAgICBzY3JvbGxUeXBlOiBudWxsLFxuXG4gICAgaXRlbXM6IG51bGwsXG5cbiAgICBnZXRWaWV3SWQ6IG51bGwsIC8vIGl0ZW3jgYvjgonlr77lv5zjgZnjgot2aWV344GuSlNPTuOCkumBuOWIpSAoaXRlbSkgPT4ganNvblxuICAgIGJpbmQ6IG51bGwsIC8vIGl0ZW3jga7mg4XloLHjgpJ2aWV344Gr5Y+N5pigICh2aWV3LCBpdGVtLCBsaXN0VmlldykgPT4gdm9pZCxcblxuICAgIHZpZXdKU09OczogbnVsbCxcblxuICAgIHNjcm9sbEJhcjogbnVsbCxcbiAgICBzY3JvbGxCYXJIYW5kbGU6IG51bGwsXG4gICAgdmlld3BvcnQ6IG51bGwsXG4gICAgaW5uZXI6IG51bGwsXG5cbiAgICBzY3JvbGw6IDAsXG4gICAgc2Nyb2xsTG9jazogZmFsc2UsXG5cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLnN1cGVySW5pdChvcHRpb25zKTtcblxuICAgICAgb3B0aW9ucyA9ICh7fSkuJHNhZmUob3B0aW9ucywgTGlzdFZpZXcuZGVmYXVsdHMpO1xuXG4gICAgICB0aGlzLml0ZW1zID0gW107XG5cbiAgICAgIHRoaXMuZ2V0Vmlld0lkID0gKGl0ZW0pID0+IG51bGw7XG4gICAgICB0aGlzLmJpbmQgPSAodmlldywgaXRlbSwgbGlzdFZpZXcpID0+IHt9O1xuXG4gICAgICB0aGlzLml0ZW1NYXJnaW5MZWZ0ID0gb3B0aW9ucy5pdGVtTWFyZ2luTGVmdDtcbiAgICAgIHRoaXMuaXRlbU1hcmdpblRvcCA9IG9wdGlvbnMuaXRlbU1hcmdpblRvcDtcblxuICAgICAgdGhpcy5vbihcImF0dGFjaGVkXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy50YXJnZXQub25lKFwicmVhZHlcIiwgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuc2V0dXAob3B0aW9ucylcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGlmICh0aGlzLnRhcmdldC5wYXJlbnQpIHtcbiAgICAgICAgLy8gICB0aGlzLnNldHVwKG9wdGlvbnMpO1xuICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAvLyAgIHRoaXMudGFyZ2V0Lm9uZShcImFkZGVkXCIsICgpID0+IHtcbiAgICAgICAgLy8gICAgIHRoaXMuc2V0dXAob3B0aW9ucyk7XG4gICAgICAgIC8vICAgfSk7XG4gICAgICAgIC8vIH1cbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBzZXR1cDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgY29uc3QgZmluZExheW91dFJvb3QgPSAoZWxlbWVudCkgPT4ge1xuICAgICAgICBpZiAoZWxlbWVudC5sYXlvdXRBc3NldCkge1xuICAgICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgICAgICB9IGVsc2UgaWYgKGVsZW1lbnQucGFyZW50KSB7XG4gICAgICAgICAgcmV0dXJuIGZpbmRMYXlvdXRSb290KGVsZW1lbnQucGFyZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgbGF5b3V0Um9vdCA9IGZpbmRMYXlvdXRSb290KHRoaXMudGFyZ2V0KTtcbiAgICAgIGNvbnN0IGFzc2V0ID0gbGF5b3V0Um9vdC5sYXlvdXRBc3NldDtcblxuICAgICAgdGhpcy5zY3JvbGxUeXBlID0gb3B0aW9ucy5zY3JvbGxUeXBlO1xuXG4gICAgICB0aGlzLnZpZXdwb3J0ID0gdGhpcy5fY3JlYXRlVmlld3BvcnQob3B0aW9ucykuYWRkQ2hpbGRUbyh0aGlzLnRhcmdldCk7XG4gICAgICB0aGlzLmlubmVyID0gdGhpcy5fY3JlYXRlSW5uZXIob3B0aW9ucywgdGhpcy52aWV3cG9ydCkuYWRkQ2hpbGRUbyh0aGlzLnZpZXdwb3J0KTtcbiAgICAgIHRoaXMuZnJvbnQgPSB0aGlzLl9jcmVhdGVGcm9udChvcHRpb25zLCB0aGlzLnZpZXdwb3J0LCB0aGlzLmlubmVyKS5hZGRDaGlsZFRvKHRoaXMudGFyZ2V0KTtcbiAgICAgIHRoaXMuX3NldHVwU2Nyb2xsQmFyKG9wdGlvbnMsIHRoaXMudmlld3BvcnQsIHRoaXMuaW5uZXIpO1xuXG4gICAgICB0aGlzLl9zZXR1cFdoZWVsQ29udHJvbChvcHRpb25zLCB0aGlzLnZpZXdwb3J0LCB0aGlzLmlubmVyLCB0aGlzLmZyb250KTtcbiAgICAgIHRoaXMuX3NldHVwVG91Y2hDb250cm9sKG9wdGlvbnMsIHRoaXMudmlld3BvcnQsIHRoaXMuaW5uZXIsIHRoaXMuZnJvbnQpO1xuXG4gICAgICBjb25zdCBmaW5kQnlJZCA9IChpZCwgZWxlbWVudCkgPT4ge1xuICAgICAgICBpZiAoZWxlbWVudC5pZCA9PT0gaWQpIHtcbiAgICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBjaGlsZHJlbiA9IE9iamVjdC5rZXlzKGVsZW1lbnQuY2hpbGRyZW4gfHwge30pLm1hcChrZXkgPT4gZWxlbWVudC5jaGlsZHJlbltrZXldKTtcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBoaXQgPSBmaW5kQnlJZChpZCwgY2hpbGRyZW5baV0pO1xuICAgICAgICAgICAgaWYgKGhpdCkgcmV0dXJuIGhpdDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBjb25zdCB2aWV3SWRzID0gb3B0aW9ucy5pdGVtLnNwbGl0KFwiLFwiKS5tYXAoXyA9PiBfLnRyaW0oKSk7XG4gICAgICB0aGlzLnZpZXdKU09OcyA9IHZpZXdJZHNcbiAgICAgICAgLm1hcChpZCA9PiBmaW5kQnlJZChpZCwgYXNzZXQuZGF0YS5yb290KSlcbiAgICAgICAgLnJlZHVjZSgob2JqLCB2aWV3KSA9PiB7XG4gICAgICAgICAgb2JqW3ZpZXcuaWRdID0gdmlldztcbiAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICB9LCB7fSk7XG4gICAgICB0aGlzLmdldFZpZXdJZCA9IChpdGVtKSA9PiB2aWV3SWRzWzBdO1xuXG4gICAgICAvLyDlrp/kvZPljJbjgZXjgozjgZ/jg5Pjg6Xjg7zjgpLkuIDml6bliYrpmaTjgZnjgotcbiAgICAgIHZpZXdJZHMuZm9yRWFjaChpZCA9PiBsYXlvdXRSb290LnJlZltpZF0ucmVtb3ZlKCkpO1xuXG4gICAgICB0aGlzLnNjcm9sbEJhciA9IGxheW91dFJvb3QucmVmW29wdGlvbnMuc2Nyb2xsQmFyXTtcbiAgICAgIHRoaXMuc2Nyb2xsQmFySGFuZGxlID0gbGF5b3V0Um9vdC5yZWZbb3B0aW9ucy5zY3JvbGxCYXJIYW5kbGVdO1xuXG4gICAgfSxcblxuICAgIF9jcmVhdGVWaWV3cG9ydDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgY29uc3Qgdmlld3BvcnQgPSBEaXNwbGF5RWxlbWVudCgpO1xuXG4gICAgICB2aWV3cG9ydC54ID0gb3B0aW9ucy5zY3JvbGxSZWN0Lng7XG4gICAgICB2aWV3cG9ydC55ID0gb3B0aW9ucy5zY3JvbGxSZWN0Lnk7XG4gICAgICB2aWV3cG9ydC53aWR0aCA9IG9wdGlvbnMuc2Nyb2xsUmVjdC53aWR0aDtcbiAgICAgIHZpZXdwb3J0LmhlaWdodCA9IG9wdGlvbnMuc2Nyb2xsUmVjdC5oZWlnaHQ7XG4gICAgICB2aWV3cG9ydC5jbGlwID0gKGNhbnZhcykgPT4ge1xuICAgICAgICBjb25zdCB3ID0gdmlld3BvcnQud2lkdGg7XG4gICAgICAgIGNvbnN0IGggPSB2aWV3cG9ydC5oZWlnaHQ7XG5cbiAgICAgICAgY29uc3QgY3R4ID0gY2FudmFzLmNvbnRleHQ7XG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgY3R4Lm1vdmVUbyh3ICogLTAuNSwgaCAqIC0wLjUpO1xuICAgICAgICBjdHgubGluZVRvKHcgKiArMC41LCBoICogLTAuNSk7XG4gICAgICAgIGN0eC5saW5lVG8odyAqICswLjUsIGggKiArMC41KTtcbiAgICAgICAgY3R4LmxpbmVUbyh3ICogLTAuNSwgaCAqICswLjUpO1xuICAgICAgICBjdHguY2xvc2VQYXRoKCk7XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gdmlld3BvcnQ7XG4gICAgfSxcblxuICAgIF9jcmVhdGVJbm5lcjogZnVuY3Rpb24ob3B0aW9ucywgdmlld3BvcnQpIHtcbiAgICAgIGlmIChvcHRpb25zLmlubmVyKSB7XG4gICAgICAgIC8vIFRPRE9cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGlubmVyID0gRGlzcGxheUVsZW1lbnQoKTtcblxuICAgICAgICBpbm5lci54ID0gLXZpZXdwb3J0LndpZHRoICogdmlld3BvcnQub3JpZ2luWDtcbiAgICAgICAgaW5uZXIueSA9IC12aWV3cG9ydC5oZWlnaHQgKiB2aWV3cG9ydC5vcmlnaW5ZO1xuICAgICAgICBpbm5lci5vcmlnaW5YID0gMDtcbiAgICAgICAgaW5uZXIub3JpZ2luWSA9IDA7XG5cbiAgICAgICAgcmV0dXJuIGlubmVyO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBfY3JlYXRlRnJvbnQ6IGZ1bmN0aW9uKG9wdGlvbnMsIHZpZXdwb3J0LCBpbm5lcikge1xuICAgICAgY29uc3QgZnJvbnQgPSBEaXNwbGF5RWxlbWVudCgpO1xuXG4gICAgICBmcm9udC54ID0gb3B0aW9ucy5zY3JvbGxSZWN0Lng7XG4gICAgICBmcm9udC55ID0gb3B0aW9ucy5zY3JvbGxSZWN0Lnk7XG4gICAgICBmcm9udC53aWR0aCA9IG9wdGlvbnMuc2Nyb2xsUmVjdC53aWR0aDtcbiAgICAgIGZyb250LmhlaWdodCA9IG9wdGlvbnMuc2Nyb2xsUmVjdC5oZWlnaHQ7XG4gICAgICBmcm9udC5pbnRlcmFjdGl2ZSA9IHRydWU7XG5cbiAgICAgIHJldHVybiBmcm9udDtcbiAgICB9LFxuXG4gICAgX3NldHVwU2Nyb2xsQmFyOiBmdW5jdGlvbihvcHRpb25zLCB2aWV3cG9ydCwgaW5uZXIpIHtcbiAgICAgIHRoaXMudGFyZ2V0Lm9uKFwiZW50ZXJmcmFtZVwiLCAoKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5zY3JvbGxCYXIgJiYgIXRoaXMuc2Nyb2xsQmFySGFuZGxlKSByZXR1cm47XG5cbiAgICAgICAgaWYgKHRoaXMuc2Nyb2xsVHlwZSAhPT0gXCJob3Jpem9udGFsXCIpIHtcbiAgICAgICAgICBjb25zdCB0b3AgPSB2aWV3cG9ydC5oZWlnaHQgKiAtdmlld3BvcnQub3JpZ2luWTtcbiAgICAgICAgICBjb25zdCBib3R0b20gPSB2aWV3cG9ydC5oZWlnaHQgKiAoMSAtIHZpZXdwb3J0Lm9yaWdpblkpO1xuICAgICAgICAgIGNvbnN0IHNjcm9sbE1pbiA9IHRvcDtcbiAgICAgICAgICBjb25zdCBzY3JvbGxNYXggPSBib3R0b20gLSBpbm5lci5oZWlnaHQ7XG4gICAgICAgICAgY29uc3Qgc2Nyb2xsVmFsdWUgPSBNYXRoLmNsYW1wKChpbm5lci50b3AgLSBzY3JvbGxNaW4pIC8gKHNjcm9sbE1heCAtIHNjcm9sbE1pbiksIDAsIDEpO1xuXG4gICAgICAgICAgY29uc3QgeU1pbiA9IHRoaXMuc2Nyb2xsQmFyLmhlaWdodCAqIC10aGlzLnNjcm9sbEJhci5vcmlnaW5ZICsgdGhpcy5zY3JvbGxCYXJIYW5kbGUuaGVpZ2h0ICogdGhpcy5zY3JvbGxCYXJIYW5kbGUub3JpZ2luWSArIHRoaXMuc2Nyb2xsQmFyLnk7XG4gICAgICAgICAgY29uc3QgeU1heCA9IHRoaXMuc2Nyb2xsQmFyLmhlaWdodCAqICgxIC0gdGhpcy5zY3JvbGxCYXIub3JpZ2luWSkgLSB0aGlzLnNjcm9sbEJhckhhbmRsZS5oZWlnaHQgKiAoMSAtIHRoaXMuc2Nyb2xsQmFySGFuZGxlLm9yaWdpblkpICsgdGhpcy5zY3JvbGxCYXIueTtcbiAgICAgICAgICBpZiAoaW5uZXIuaGVpZ2h0IDw9IHZpZXdwb3J0LmhlaWdodCkge1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxCYXJIYW5kbGUueSA9IHlNaW47XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsQmFySGFuZGxlLnkgPSB5TWluICsgKHlNYXggLSB5TWluKSAqIHNjcm9sbFZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBsZWZ0ID0gdmlld3BvcnQud2lkdGggKiAtdmlld3BvcnQub3JpZ2luWTtcbiAgICAgICAgICBjb25zdCByaWdodCA9IHZpZXdwb3J0LmhlaWdodCAqICgxIC0gdmlld3BvcnQub3JpZ2luWSk7XG4gICAgICAgICAgY29uc3Qgc2Nyb2xsTWluID0gbGVmdDtcbiAgICAgICAgICBjb25zdCBzY3JvbGxNYXggPSByaWdodCAtIGlubmVyLmhlaWdodDtcbiAgICAgICAgICBjb25zdCBzY3JvbGxWYWx1ZSA9IE1hdGguY2xhbXAoKGlubmVyLmxlZnQgLSBzY3JvbGxNaW4pIC8gKHNjcm9sbE1heCAtIHNjcm9sbE1pbiksIDAsIDEpO1xuXG4gICAgICAgICAgY29uc3QgeU1pbiA9IHRoaXMuc2Nyb2xsQmFyLmhlaWdodCAqIC10aGlzLnNjcm9sbEJhci5vcmlnaW5ZICsgdGhpcy5zY3JvbGxCYXJIYW5kbGUuaGVpZ2h0ICogdGhpcy5zY3JvbGxCYXJIYW5kbGUub3JpZ2luWSArIHRoaXMuc2Nyb2xsQmFyLnk7XG4gICAgICAgICAgY29uc3QgeU1heCA9IHRoaXMuc2Nyb2xsQmFyLmhlaWdodCAqICgxIC0gdGhpcy5zY3JvbGxCYXIub3JpZ2luWSkgLSB0aGlzLnNjcm9sbEJhckhhbmRsZS5oZWlnaHQgKiAoMSAtIHRoaXMuc2Nyb2xsQmFySGFuZGxlLm9yaWdpblkpICsgdGhpcy5zY3JvbGxCYXIueTtcbiAgICAgICAgICBpZiAoaW5uZXIuaGVpZ2h0IDw9IHZpZXdwb3J0LmhlaWdodCkge1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxCYXJIYW5kbGUueSA9IHlNaW47XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsQmFySGFuZGxlLnkgPSB5TWluICsgKHlNYXggLSB5TWluKSAqIHNjcm9sbFZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9zZXR1cFdoZWVsQ29udHJvbDogZnVuY3Rpb24ob3B0aW9ucywgdmlld3BvcnQsIGlubmVyLCBmcm9udCkge1xuICAgICAgaWYgKHRoaXMuc2Nyb2xsVHlwZSAhPT0gXCJob3Jpem9udGFsXCIpIHtcbiAgICAgICAgdGhpcy50YXJnZXQub24oXCJlbnRlcmZyYW1lXCIsIChlKSA9PiB7XG4gICAgICAgICAgaWYgKGlubmVyLmhlaWdodCA8PSB2aWV3cG9ydC5oZWlnaHQpIHJldHVybjtcbiAgICAgICAgICBpZiAodGhpcy5zY3JvbGxMb2NrKSByZXR1cm47XG5cbiAgICAgICAgICBjb25zdCBwID0gZS5hcHAucG9pbnRlcjtcbiAgICAgICAgICBjb25zdCBkZWx0YSA9IHAud2hlZWxEZWx0YVk7XG4gICAgICAgICAgaWYgKGRlbHRhICYmIGZyb250LmhpdFRlc3QocC54LCBwLnkpKSB7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbCArPSBkZWx0YSAvIGlubmVyLmhlaWdodCAqIDAuODtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy50YXJnZXQub24oXCJlbnRlcmZyYW1lXCIsIChlKSA9PiB7XG4gICAgICAgICAgaWYgKGlubmVyLndpZHRoIDw9IHZpZXdwb3J0LndpZHRoKSByZXR1cm47XG4gICAgICAgICAgaWYgKHRoaXMuc2Nyb2xsTG9jaykgcmV0dXJuO1xuXG4gICAgICAgICAgY29uc3QgcCA9IGUuYXBwLnBvaW50ZXI7XG4gICAgICAgICAgY29uc3QgZGVsdGEgPSBwLndoZWVsRGVsdGFZO1xuICAgICAgICAgIGlmIChkZWx0YSAmJiBmcm9udC5oaXRUZXN0KHAueCwgcC55KSkge1xuICAgICAgICAgICAgdGhpcy5zY3JvbGwgKz0gZGVsdGEgLyBpbm5lci53aWR0aCAqIDAuODtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBfc2V0dXBUb3VjaENvbnRyb2w6IGZ1bmN0aW9uKG9wdGlvbnMsIHZpZXdwb3J0LCBpbm5lciwgZnJvbnQpIHtcbiAgICAgIGNvbnN0IHR3ZWVuZXIgPSBUd2VlbmVyKCkuYXR0YWNoVG8oaW5uZXIpO1xuICAgICAgY29uc3QgdmVsb2NpdHkgPSBWZWN0b3IyKDAsIDApO1xuXG4gICAgICBsZXQgZHJhZ2dpbmcgPSBmYWxzZTtcbiAgICAgIGZyb250Lm9uKCdwb2ludHN0YXJ0JywgKGUpID0+IHtcbiAgICAgICAgZS5wYXNzID0gdHJ1ZTtcblxuICAgICAgICBpZiAoaW5uZXIuaGVpZ2h0IDw9IHZpZXdwb3J0LmhlaWdodCkgcmV0dXJuO1xuXG4gICAgICAgIGRyYWdnaW5nID0gdHJ1ZTtcbiAgICAgICAgdmVsb2NpdHkuc2V0KDAsIDApO1xuICAgICAgICB0d2VlbmVyLnN0b3AoKTtcbiAgICAgIH0pO1xuICAgICAgZnJvbnQub24oJ3BvaW50c3RheScsIChlKSA9PiB7XG4gICAgICAgIGlmICghZHJhZ2dpbmcpIHJldHVybjtcbiAgICAgICAgdmVsb2NpdHkuc2V0KGUucG9pbnRlci5keCwgZS5wb2ludGVyLmR5KTtcblxuICAgICAgICBpZiAodGhpcy5zY3JvbGxUeXBlICE9PSBcImhvcml6b250YWxcIikge1xuICAgICAgICAgIGNvbnN0IHRvcCA9IC12aWV3cG9ydC5oZWlnaHQgKiB2aWV3cG9ydC5vcmlnaW5ZO1xuICAgICAgICAgIGNvbnN0IGJvdHRvbSA9IHZpZXdwb3J0LmhlaWdodCAqICgxIC0gdmlld3BvcnQub3JpZ2luWSk7XG4gICAgICAgICAgbGV0IG92ZXJkaXN0YW5jZSA9IDA7XG4gICAgICAgICAgaWYgKHRvcCA8IGlubmVyLnRvcCkge1xuICAgICAgICAgICAgb3ZlcmRpc3RhbmNlID0gdG9wIC0gaW5uZXIudG9wO1xuICAgICAgICAgIH0gZWxzZSBpZiAoaW5uZXIudG9wIDwgYm90dG9tIC0gaW5uZXIuaGVpZ2h0KSB7XG4gICAgICAgICAgICBvdmVyZGlzdGFuY2UgPSBpbm5lci50b3AgLSAoYm90dG9tIC0gaW5uZXIuaGVpZ2h0KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmVsb2NpdHkubXVsKDEuMCAtIE1hdGguYWJzKG92ZXJkaXN0YW5jZSkgLyAyMDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGxlZnQgPSAtdmlld3BvcnQud2lkdGggKiB2aWV3cG9ydC5vcmlnaW5ZO1xuICAgICAgICAgIGNvbnN0IHJpZ2h0ID0gdmlld3BvcnQud2lkdGggKiAoMSAtIHZpZXdwb3J0Lm9yaWdpblkpO1xuICAgICAgICAgIGxldCBvdmVyZGlzdGFuY2UgPSAwO1xuICAgICAgICAgIGlmIChsZWZ0IDwgaW5uZXIubGVmdCkge1xuICAgICAgICAgICAgb3ZlcmRpc3RhbmNlID0gbGVmdCAtIGlubmVyLmxlZnQ7XG4gICAgICAgICAgfSBlbHNlIGlmIChpbm5lci5sZWZ0IDwgcmlnaHQgLSBpbm5lci53aWR0aCkge1xuICAgICAgICAgICAgb3ZlcmRpc3RhbmNlID0gaW5uZXIubGVmdCAtIChyaWdodCAtIGlubmVyLndpZHRoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmVsb2NpdHkubXVsKDEuMCAtIE1hdGguYWJzKG92ZXJkaXN0YW5jZSkgLyAyMDApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGZyb250Lm9uKCdwb2ludGVuZCcsIChlKSA9PiB7XG4gICAgICAgIGUucGFzcyA9IHRydWU7XG4gICAgICAgIGUudmVsb2NpdHkgPSB2ZWxvY2l0eTtcbiAgICAgICAgZHJhZ2dpbmcgPSBmYWxzZTtcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLm9uKFwidmlld3N0b3BcIiwgKGUpID0+IHtcbiAgICAgICAgdmVsb2NpdHkuc2V0KDAsIDApO1xuICAgICAgfSk7XG5cbiAgICAgIHRoaXMudGFyZ2V0Lm9uKFwiZW50ZXJmcmFtZVwiLCAoZSkgPT4ge1xuICAgICAgICBpZiAodGhpcy5zY3JvbGxUeXBlICE9PSBcImhvcml6b250YWxcIikge1xuICAgICAgICAgIGlmIChpbm5lci5oZWlnaHQgPD0gdmlld3BvcnQuaGVpZ2h0KSByZXR1cm47XG4gICAgICAgICAgaW5uZXIudG9wICs9IHZlbG9jaXR5Lnk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGlubmVyLndpZHRoIDw9IHZpZXdwb3J0LndpZHRoKSByZXR1cm47XG4gICAgICAgICAgaW5uZXIubGVmdCArPSB2ZWxvY2l0eS54O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRyYWdnaW5nKSByZXR1cm47XG5cbiAgICAgICAgaWYgKCF0d2VlbmVyLnBsYXlpbmcpIHtcbiAgICAgICAgICB2ZWxvY2l0eS5tdWwoMC45KTtcbiAgICAgICAgICBpZiAoTWF0aC5hYnModmVsb2NpdHkueCkgPCAwLjEgJiYgTWF0aC5hYnModmVsb2NpdHkueSkgPCAwLjEpIHtcbiAgICAgICAgICAgIHZlbG9jaXR5LnNldCgwLCAwKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodGhpcy5zY3JvbGxUeXBlICE9PSBcImhvcml6b250YWxcIikge1xuICAgICAgICAgICAgY29uc3QgdG9wID0gLXZpZXdwb3J0LmhlaWdodCAqIHZpZXdwb3J0Lm9yaWdpblk7XG4gICAgICAgICAgICBjb25zdCBib3R0b20gPSB2aWV3cG9ydC5oZWlnaHQgKiAoMSAtIHZpZXdwb3J0Lm9yaWdpblkpO1xuICAgICAgICAgICAgaWYgKHRvcCA8IGlubmVyLnRvcCkge1xuICAgICAgICAgICAgICB2ZWxvY2l0eS5zZXQoMCwgMCk7XG4gICAgICAgICAgICAgIHR3ZWVuZXIuY2xlYXIoKS50byh7XG4gICAgICAgICAgICAgICAgeTogdG9wXG4gICAgICAgICAgICAgIH0sIDEwMCwgXCJlYXNlSW5RdWFkXCIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpbm5lci50b3AgPCBib3R0b20gLSBpbm5lci5oZWlnaHQpIHtcbiAgICAgICAgICAgICAgdmVsb2NpdHkuc2V0KDAsIDApO1xuICAgICAgICAgICAgICB0d2VlbmVyLmNsZWFyKCkudG8oe1xuICAgICAgICAgICAgICAgIHk6IGJvdHRvbSAtIGlubmVyLmhlaWdodFxuICAgICAgICAgICAgICB9LCAxMDAsIFwiZWFzZUluUXVhZFwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHR3ZWVuZXIuc3RvcCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBsZWZ0ID0gLXZpZXdwb3J0LmhlaWdodCAqIHZpZXdwb3J0Lm9yaWdpblk7XG4gICAgICAgICAgICBjb25zdCByaWdodCA9IHZpZXdwb3J0LmhlaWdodCAqICgxIC0gdmlld3BvcnQub3JpZ2luWSk7XG4gICAgICAgICAgICBpZiAobGVmdCA8IGlubmVyLmxlZnQpIHtcbiAgICAgICAgICAgICAgdmVsb2NpdHkuc2V0KDAsIDApO1xuICAgICAgICAgICAgICB0d2VlbmVyLmNsZWFyKCkudG8oe1xuICAgICAgICAgICAgICAgIHk6IGxlZnRcbiAgICAgICAgICAgICAgfSwgMTAwLCBcImVhc2VJblF1YWRcIik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlubmVyLmxlZnQgPCByaWdodCAtIGlubmVyLmhlaWdodCkge1xuICAgICAgICAgICAgICB2ZWxvY2l0eS5zZXQoMCwgMCk7XG4gICAgICAgICAgICAgIHR3ZWVuZXIuY2xlYXIoKS50byh7XG4gICAgICAgICAgICAgICAgeTogcmlnaHQgLSBpbm5lci5oZWlnaHRcbiAgICAgICAgICAgICAgfSwgMTAwLCBcImVhc2VJblF1YWRcIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0d2VlbmVyLnN0b3AoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBjcmVhdGVWaWV3OiBmdW5jdGlvbihpdGVtKSB7XG4gICAgICBjb25zdCB2aWV3SlNPTiA9IHRoaXMudmlld0pTT05zW3RoaXMuZ2V0Vmlld0lkKGl0ZW0pXTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKHZpZXdKU09OKTtcbiAgICAgIHRoaXMuaW5uZXIuZnJvbUpTT04oe1xuICAgICAgICBjaGlsZHJlbjogW3ZpZXdKU09OXSxcbiAgICAgIH0pO1xuICAgICAgY29uc3QgdmlldyA9IHRoaXMuaW5uZXIuY2hpbGRyZW4ubGFzdDtcbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH0sXG5cbiAgICBhZGRJdGVtOiBmdW5jdGlvbihpdGVtKSB7XG4gICAgICB0aGlzLml0ZW1zLnB1c2goaXRlbSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgYWRkSXRlbXM6IGZ1bmN0aW9uKGl0ZW1zKSB7XG4gICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSh0aGlzLml0ZW1zLCBpdGVtcyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgcmVtb3ZlSXRlbTogZnVuY3Rpb24oaXRlbSkge1xuICAgICAgdGhpcy5pdGVtcy5lcmFzZShpdGVtKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBjbGVhckl0ZW06IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5pdGVtcy5jbGVhcigpO1xuICAgICAgdGhpcy5zY3JvbGwgPSAwO1xuICAgICAgdGhpcy5mbGFyZSgndmlld3N0b3AnKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBpbnZhbGlkYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuaW5uZXIuY2hpbGRyZW4uY2xvbmUoKS5mb3JFYWNoKChjaGlsZCkgPT4gY2hpbGQucmVtb3ZlKCkpO1xuXG4gICAgICBsZXQgeSA9IDA7XG4gICAgICBsZXQgeCA9IDA7XG5cbiAgICAgIHRoaXMuaW5uZXIuaGVpZ2h0ID0gMTtcblxuICAgICAgdGhpcy5pdGVtcy5mb3JFYWNoKChpdGVtLCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zdCB2aWV3ID0gdGhpcy5jcmVhdGVWaWV3KGl0ZW0pO1xuICAgICAgICB2aWV3Ll9saXN0VmlldyA9IHRoaXM7XG4gICAgICAgIHRoaXMuYmluZCh2aWV3LCBpdGVtLCB0aGlzKTtcblxuICAgICAgICBpZiAodGhpcy5zY3JvbGxUeXBlICE9PSBcImhvcml6b250YWxcIikge1xuICAgICAgICAgIHZpZXcubGVmdCA9IHggKyB0aGlzLml0ZW1NYXJnaW5MZWZ0O1xuICAgICAgICAgIHZpZXcudG9wID0geSArIHRoaXMuaXRlbU1hcmdpblRvcDtcblxuICAgICAgICAgIGlmICgodmlldy5yaWdodCArIHZpZXcud2lkdGggKyB0aGlzLml0ZW1NYXJnaW5MZWZ0KSA8IHRoaXMudmlld3BvcnQud2lkdGgpIHtcbiAgICAgICAgICAgIHggPSB2aWV3LnJpZ2h0O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB4ID0gMDtcbiAgICAgICAgICAgIHkgPSB2aWV3LmJvdHRvbTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmlubmVyLmhlaWdodCA9IE1hdGgubWF4KHRoaXMudmlld3BvcnQuaGVpZ2h0LCB2aWV3LnRvcCArIHZpZXcuaGVpZ2h0ICsgdGhpcy5pdGVtTWFyZ2luVG9wKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBUT0RPXG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvL+OBiuippuOBl+Wun+ijhVxuICAgICAgaWYgKHRoaXMudXBkYXRlRnVuYykgdGhpcy50YXJnZXQub2ZmKFwiZW50ZXJmcmFtZVwiLCB0aGlzLnVwZGF0ZUZ1bmMpO1xuXG4gICAgICBpZiAoIXRoaXMudXBkYXRlRnVuYykge1xuICAgICAgICB0aGlzLnVwZGF0ZUZ1bmMgPSAoKSA9PiB7XG4gICAgICAgICAgbGV0IHkgPSAwO1xuICAgICAgICAgIGxldCB4ID0gMDtcbiAgICAgICAgICB0aGlzLmlubmVyLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkLCBpKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5zY3JvbGxUeXBlICE9PSBcImhvcml6b250YWxcIikge1xuICAgICAgICAgICAgICBjaGlsZC5sZWZ0ID0geCArIHRoaXMuaXRlbU1hcmdpbkxlZnQ7XG4gICAgICAgICAgICAgIGNoaWxkLnRvcCA9IHkgKyB0aGlzLml0ZW1NYXJnaW5Ub3A7XG5cbiAgICAgICAgICAgICAgaWYgKChjaGlsZC5yaWdodCArIGNoaWxkLndpZHRoICsgdGhpcy5pdGVtTWFyZ2luTGVmdCkgPCB0aGlzLnZpZXdwb3J0LndpZHRoKSB7XG4gICAgICAgICAgICAgICAgeCA9IGNoaWxkLnJpZ2h0O1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHggPSAwO1xuICAgICAgICAgICAgICAgIHkgPSBjaGlsZC5ib3R0b207XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB0aGlzLmlubmVyLmhlaWdodCA9IE1hdGgubWF4KHRoaXMudmlld3BvcnQuaGVpZ2h0LCBjaGlsZC50b3AgKyBjaGlsZC5oZWlnaHQgKyB0aGlzLml0ZW1NYXJnaW5Ub3ApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gVE9ET1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICAvL2VudGVyZnJhbWXjgafjga/jgarjgY/jgaZ3YXRjaOOBp2hlaWdodOOBv+OBpuOCguOBhOOBhOOBi+OBqlxuICAgICAgdGhpcy50YXJnZXQub24oXCJlbnRlcmZyYW1lXCIsIHRoaXMudXBkYXRlRnVuYyk7XG4gICAgfSxcblxuICAgIC8vIHJldHVybiAwLjDvvZ4xLjBcbiAgICBnZXRTY3JvbGw6IGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3Qgdmlld3BvcnQgPSB0aGlzLnZpZXdwb3J0O1xuICAgICAgY29uc3QgaW5uZXIgPSB0aGlzLmlubmVyO1xuXG4gICAgICBpZiAodGhpcy5zY3JvbGxUeXBlICE9PSBcImhvcml6b250YWxcIikge1xuICAgICAgICBjb25zdCB0b3AgPSB2aWV3cG9ydC5oZWlnaHQgKiAtdmlld3BvcnQub3JpZ2luWTtcbiAgICAgICAgY29uc3QgYm90dG9tID0gdmlld3BvcnQuaGVpZ2h0ICogKDEgLSB2aWV3cG9ydC5vcmlnaW5ZKTtcbiAgICAgICAgY29uc3QgbWluID0gdG9wO1xuICAgICAgICBjb25zdCBtYXggPSBib3R0b20gLSBpbm5lci5oZWlnaHQ7XG5cbiAgICAgICAgcmV0dXJuIChpbm5lci50b3AgLSBtaW4pIC8gKG1heCAtIG1pbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUT09EXG4gICAgICAgIHJldHVybiAwO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyB2OiAwLjDvvZ4xLjBcbiAgICBzZXRTY3JvbGw6IGZ1bmN0aW9uKHYpIHtcbiAgICAgIHYgPSBNYXRoLmNsYW1wKHYsIDAsIDEpO1xuXG4gICAgICBjb25zdCB2aWV3cG9ydCA9IHRoaXMudmlld3BvcnQ7XG4gICAgICBjb25zdCBpbm5lciA9IHRoaXMuaW5uZXI7XG5cbiAgICAgIGlmICh0aGlzLnNjcm9sbFR5cGUgIT09IFwiaG9yaXpvbnRhbFwiKSB7XG4gICAgICAgIGlmIChpbm5lci5oZWlnaHQgPD0gdmlld3BvcnQuaGVpZ2h0KSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgdG9wID0gdmlld3BvcnQuaGVpZ2h0ICogLXZpZXdwb3J0Lm9yaWdpblk7XG4gICAgICAgIGNvbnN0IGJvdHRvbSA9IHZpZXdwb3J0LmhlaWdodCAqICgxIC0gdmlld3BvcnQub3JpZ2luWSk7XG4gICAgICAgIGNvbnN0IG1pbiA9IHRvcDtcbiAgICAgICAgY29uc3QgbWF4ID0gYm90dG9tIC0gaW5uZXIuaGVpZ2h0O1xuXG4gICAgICAgIGlubmVyLnRvcCA9IG1pbiArIChtYXggLSBtaW4pICogdjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRPT0RcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIF9hY2Nlc3Nvcjoge1xuICAgICAgZWxlbWVudHM6IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5pbm5lci5jaGlsZHJlbjtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBzY3JvbGw6IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5nZXRTY3JvbGwoKTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XG4gICAgICAgICAgdGhpcy5zZXRTY3JvbGwodik7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG5cbiAgICBfc3RhdGljOiB7XG4gICAgICBkZWZhdWx0czoge1xuICAgICAgICBzY3JvbGxUeXBlOiBcInZlcnRpY2FsXCIsXG4gICAgICAgIGl0ZW1NYXJnaW5MZWZ0OiAwLFxuICAgICAgICBpdGVtTWFyZ2luVG9wOiAwLFxuICAgICAgfSxcbiAgICB9LFxuXG4gIH0pO1xuXG59KTtcbiIsInBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcbiAgLy/jg57jgqbjgrnov73lvpNcbiAgcGhpbmEuZGVmaW5lKFwiTW91c2VDaGFzZXJcIiwge1xuICAgIHN1cGVyQ2xhc3M6IFwiQWNjZXNzb3J5XCIsXG5cbiAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuc3VwZXJJbml0KCk7XG4gICAgfSxcblxuICAgIG9uYXR0YWNoZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgbGV0IHB4ID0gMDtcbiAgICAgIGxldCBweSA9IDA7XG4gICAgICBjb25zb2xlLmxvZyhcIiNNb3VzZUNoYXNlclwiLCBcIm9uYXR0YWNoZWRcIik7XG4gICAgICB0aGlzLnR3ZWVuZXIgPSBUd2VlbmVyKCkuYXR0YWNoVG8odGhpcy50YXJnZXQpO1xuICAgICAgdGhpcy50YXJnZXQub24oXCJlbnRlcmZyYW1lXCIsIChlKSA9PiB7XG4gICAgICAgIGNvbnN0IHAgPSBlLmFwcC5wb2ludGVyO1xuICAgICAgICBpZiAocHkgPT0gcC54ICYmIHB5ID09IHAueSkgcmV0dXJuO1xuICAgICAgICBweCA9IHAueDtcbiAgICAgICAgcHkgPSBwLnk7XG4gICAgICAgIGNvbnN0IHggPSBwLnggLSBTQ1JFRU5fV0lEVEhfSEFMRjtcbiAgICAgICAgY29uc3QgeSA9IHAueSAtIFNDUkVFTl9IRUlHSFRfSEFMRjtcbiAgICAgICAgdGhpcy50d2VlbmVyLmNsZWFyKCkudG8oeyB4LCB5IH0sIDIwMDAsIFwiZWFzZU91dFF1YWRcIilcbiAgICAgIH0pO1xuXG4gICAgfSxcblxuICAgIG9uZGV0YWNoZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgY29uc29sZS5sb2coXCIjTW91c2VDaGFzZXJcIiwgXCJvbmRldGFjaGVkXCIpO1xuICAgICAgdGhpcy50d2VlbmVyLnJlbW92ZSgpO1xuICAgIH1cblxuICB9KTtcbn0pO1xuIiwicGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuXG4gIHBoaW5hLmRlZmluZShcIlBpZUNsaXBcIiwge1xuICAgIHN1cGVyQ2xhc3M6IFwiQWNjZXNzb3J5XCIsXG5cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0gKHt9KS4kc2FmZShvcHRpb25zLCBQaWVDbGlwLmRlZmF1bHRzKVxuICAgICAgdGhpcy5zdXBlckluaXQob3B0aW9ucyk7XG5cbiAgICAgIHRoaXMucGl2b3RYID0gb3B0aW9ucy5waXZvdFg7XG4gICAgICB0aGlzLnBpdm90WSA9IG9wdGlvbnMucGl2b3RZO1xuICAgICAgdGhpcy5hbmdsZU1pbiA9IG9wdGlvbnMuYW5nbGVNaW47XG4gICAgICB0aGlzLmFuZ2xlTWF4ID0gb3B0aW9ucy5hbmdsZU1heDtcbiAgICAgIHRoaXMucmFkaXVzID0gb3B0aW9ucy5yYWRpdXM7XG4gICAgICB0aGlzLmFudGljbG9ja3dpc2UgPSBvcHRpb25zLmFudGljbG9ja3dpc2U7XG4gICAgfSxcblxuICAgIG9uYXR0YWNoZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy50YXJnZXQuY2xpcCA9IChjYW52YXMpID0+IHtcbiAgICAgICAgY29uc3QgYW5nbGVNaW4gPSB0aGlzLmFuZ2xlTWluICogTWF0aC5ERUdfVE9fUkFEO1xuICAgICAgICBjb25zdCBhbmdsZU1heCA9IHRoaXMuYW5nbGVNYXggKiBNYXRoLkRFR19UT19SQUQ7XG4gICAgICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5jb250ZXh0O1xuICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIGN0eC5tb3ZlVG8odGhpcy5waXZvdFgsIHRoaXMucGl2b3RZKTtcbiAgICAgICAgY3R4LmxpbmVUbyh0aGlzLnBpdm90WCArIE1hdGguY29zKGFuZ2xlTWluKSAqIHRoaXMucmFkaXVzLCB0aGlzLnBpdm90WSArIE1hdGguc2luKGFuZ2xlTWluKSAqIHRoaXMucmFkaXVzKTtcbiAgICAgICAgY3R4LmFyYyh0aGlzLnBpdm90WCwgdGhpcy5waXZvdFksIHRoaXMucmFkaXVzLCBhbmdsZU1pbiwgYW5nbGVNYXgsIHRoaXMuYW50aWNsb2Nrd2lzZSk7XG4gICAgICAgIGN0eC5jbG9zZVBhdGgoKTtcbiAgICAgIH07XG4gICAgfSxcblxuICAgIF9zdGF0aWM6IHtcbiAgICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIHBpdm90WDogMzIsXG4gICAgICAgIHBpdm90WTogMzIsXG4gICAgICAgIGFuZ2xlTWluOiAwLFxuICAgICAgICBhbmdsZU1heDogMzYwLFxuICAgICAgICByYWRpdXM6IDY0LFxuICAgICAgICBhbnRpY2xvY2t3aXNlOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgfSxcblxuICB9KTtcbn0pO1xuIiwicGhpbmEuZGVmaW5lKFwiUmVjdGFuZ2xlQ2xpcFwiLCB7XG4gIHN1cGVyQ2xhc3M6IFwiQWNjZXNzb3J5XCIsXG5cbiAgeDogMCxcbiAgeTogMCxcbiAgd2lkdGg6IDAsXG4gIGhlaWdodDogMCxcblxuICBfZW5hYmxlOiB0cnVlLFxuXG4gIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3VwZXJJbml0KCk7XG4gICAgdGhpcy5faW5pdCgpO1xuICB9LFxuXG4gIF9pbml0OiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLm9uKFwiYXR0YWNoZWRcIiwgKCkgPT4ge1xuXG4gICAgICB0aGlzLnRhcmdldC5hY2Nlc3NvcihcIlJlY3RhbmdsZUNsaXAud2lkdGhcIiwge1xuICAgICAgICBcImdldFwiOiAoKSA9PiB0aGlzLndpZHRoLFxuICAgICAgICBcInNldFwiOiAodikgPT4gdGhpcy53aWR0aCA9IHYsXG4gICAgICB9KTtcblxuICAgICAgdGhpcy50YXJnZXQuYWNjZXNzb3IoXCJSZWN0YW5nbGVDbGlwLmhlaWdodFwiLCB7XG4gICAgICAgIFwiZ2V0XCI6ICgpID0+IHRoaXMuaGVpZ2h0LFxuICAgICAgICBcInNldFwiOiAodikgPT4gdGhpcy5oZWlnaHQgPSB2LFxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMudGFyZ2V0LmFjY2Vzc29yKFwiUmVjdGFuZ2xlQ2xpcC54XCIsIHtcbiAgICAgICAgXCJnZXRcIjogKCkgPT4gdGhpcy54LFxuICAgICAgICBcInNldFwiOiAodikgPT4gdGhpcy54ID0gdixcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLnRhcmdldC5hY2Nlc3NvcihcIlJlY3RhbmdsZUNsaXAueVwiLCB7XG4gICAgICAgIFwiZ2V0XCI6ICgpID0+IHRoaXMueSxcbiAgICAgICAgXCJzZXRcIjogKHYpID0+IHRoaXMueSA9IHYsXG4gICAgICB9KTtcblxuICAgICAgdGhpcy54ID0gMDtcbiAgICAgIHRoaXMueSA9IDA7XG4gICAgICB0aGlzLndpZHRoID0gdGhpcy50YXJnZXQud2lkdGg7XG4gICAgICB0aGlzLmhlaWdodCA9IHRoaXMudGFyZ2V0LmhlaWdodDtcblxuICAgICAgdGhpcy50YXJnZXQuY2xpcCA9IChjKSA9PiB0aGlzLl9jbGlwKGMpO1xuICAgIH0pO1xuICB9LFxuXG4gIF9jbGlwOiBmdW5jdGlvbihjYW52YXMpIHtcbiAgICBjb25zdCB4ID0gdGhpcy54IC0gKHRoaXMud2lkdGggKiB0aGlzLnRhcmdldC5vcmlnaW5YKTtcbiAgICBjb25zdCB5ID0gdGhpcy55IC0gKHRoaXMuaGVpZ2h0ICogdGhpcy50YXJnZXQub3JpZ2luWSk7XG5cbiAgICBjYW52YXMuYmVnaW5QYXRoKCk7XG4gICAgY2FudmFzLnJlY3QoeCwgeSwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIGNhbnZhcy5jbG9zZVBhdGgoKTtcbiAgfSxcblxuICBzZXRFbmFibGU6IGZ1bmN0aW9uKGVuYWJsZSkge1xuICAgIHRoaXMuX2VuYWJsZSA9IGVuYWJsZTtcbiAgICBpZiAodGhpcy5fZW5hYmxlKSB7XG4gICAgICB0aGlzLnRhcmdldC5jbGlwID0gKGMpID0+IHRoaXMuX2NsaXAoYyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudGFyZ2V0LmNsaXAgPSBudWxsO1xuICAgIH1cbiAgfSxcblxuICBfYWNjZXNzb3I6IHtcbiAgICBlbmFibGU6IHtcbiAgICAgIHNldDogZnVuY3Rpb24odikge1xuICAgICAgICB0aGlzLnNldEVuYWJsZSh2KTtcbiAgICAgIH0sXG4gICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZW5hYmxlO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxufSk7XG4iLCJwaGluYS5kZWZpbmUoXCJUb2dnbGVcIiwge1xuICBzdXBlckNsYXNzOiBcIkFjY2Vzc29yeVwiLFxuXG4gIGluaXQ6IGZ1bmN0aW9uKGlzT24pIHtcbiAgICB0aGlzLnN1cGVySW5pdCgpO1xuICAgIHRoaXMuX2luaXQoaXNPbik7XG4gIH0sXG5cbiAgX2luaXQ6IGZ1bmN0aW9uKGlzT24pIHtcbiAgICB0aGlzLmlzT24gPSBpc09uIHx8IGZhbHNlO1xuICB9LFxuXG4gIHNldFN0YXR1czogZnVuY3Rpb24oc3RhdHVzKSB7XG4gICAgdGhpcy5pc09uID0gc3RhdHVzO1xuICAgIHRoaXMudGFyZ2V0LmZsYXJlKCh0aGlzLmlzT24pID8gXCJzd2l0Y2hPblwiIDogXCJzd2l0Y2hPZmZcIik7XG4gIH0sXG5cbiAgc3dpdGNoT246IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmlzT24pIHJldHVybjtcbiAgICB0aGlzLnNldFN0YXR1cyh0cnVlKTtcbiAgfSxcblxuICBzd2l0Y2hPZmY6IGZ1bmN0aW9uKCkge1xuICAgIGlmICghdGhpcy5pc09uKSByZXR1cm47XG4gICAgdGhpcy5zZXRTdGF0dXMoZmFsc2UpO1xuICB9LFxuXG4gIHN3aXRjaDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5pc09uID0gIXRoaXMuaXNPbjtcbiAgICB0aGlzLnNldFN0YXR1cyh0aGlzLmlzT24pO1xuICB9LFxuXG4gIF9hY2Nlc3Nvcjoge1xuICAgIHN0YXR1czoge1xuICAgICAgXCJnZXRcIjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlzT247XG4gICAgICB9LFxuICAgICAgXCJzZXRcIjogZnVuY3Rpb24odikge1xuICAgICAgICByZXR1cm4gc2V0U3RhdHVzKHYpO1xuICAgICAgfSxcbiAgICB9LFxuICB9LFxuXG59KTtcbiIsInBoaW5hLmRlZmluZShcIkJ1dHRvbml6ZVwiLCB7XG4gIGluaXQ6IGZ1bmN0aW9uKCkge30sXG4gIF9zdGF0aWM6IHtcbiAgICBTVEFUVVM6IHtcbiAgICAgIE5PTkU6IDAsXG4gICAgICBTVEFSVDogMSxcbiAgICAgIEVORDogMixcbiAgICB9LFxuICAgIHN0YXR1czogMCxcbiAgICByZWN0OiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICBlbGVtZW50LmJvdW5kaW5nVHlwZSA9IFwicmVjdFwiO1xuICAgICAgdGhpcy5fY29tbW9uKGVsZW1lbnQpO1xuICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfSxcbiAgICBjaXJjbGU6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgIGVsZW1lbnQucmFkaXVzID0gTWF0aC5tYXgoZWxlbWVudC53aWR0aCwgZWxlbWVudC5oZWlnaHQpICogMC41O1xuICAgICAgZWxlbWVudC5ib3VuZGluZ1R5cGUgPSBcImNpcmNsZVwiO1xuICAgICAgdGhpcy5fY29tbW9uKGVsZW1lbnQpO1xuICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfSxcbiAgICBfY29tbW9uOiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAvL1RPRE8644Ko44OH44Kj44K/44O844Gn44GN44KL44G+44Gn44Gu5pqr5a6a5a++5b+cXG4gICAgICBlbGVtZW50LnNldE9yaWdpbigwLjUsIDAuNSwgdHJ1ZSk7XG5cbiAgICAgIGVsZW1lbnQuaW50ZXJhY3RpdmUgPSB0cnVlO1xuICAgICAgZWxlbWVudC5jbGlja1NvdW5kID0gXCJzZS9jbGlja0J1dHRvblwiO1xuXG4gICAgICAvL1RPRE8644Oc44K/44Oz44Gu5ZCM5pmC5oq85LiL44Gv5a6f5qmf44Gn6Kq/5pW044GZ44KLXG4gICAgICBlbGVtZW50Lm9uKFwicG9pbnRzdGFydFwiLCBlID0+IHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzICE9IHRoaXMuU1RBVFVTLk5PTkUpIHJldHVybjtcbiAgICAgICAgdGhpcy5zdGF0dXMgPSB0aGlzLlNUQVRVUy5TVEFSVDtcbiAgICAgICAgZWxlbWVudC50d2VlbmVyLmNsZWFyKClcbiAgICAgICAgICAudG8oe1xuICAgICAgICAgICAgc2NhbGVYOiAwLjksXG4gICAgICAgICAgICBzY2FsZVk6IDAuOVxuICAgICAgICAgIH0sIDEwMCk7XG4gICAgICB9KTtcblxuICAgICAgZWxlbWVudC5vbihcInBvaW50ZW5kXCIsIChlKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnN0YXR1cyAhPSB0aGlzLlNUQVRVUy5TVEFSVCkgcmV0dXJuO1xuICAgICAgICBjb25zdCBoaXRUZXN0ID0gZWxlbWVudC5oaXRUZXN0KGUucG9pbnRlci54LCBlLnBvaW50ZXIueSk7XG4gICAgICAgIHRoaXMuc3RhdHVzID0gdGhpcy5TVEFUVVMuRU5EO1xuICAgICAgICBpZiAoaGl0VGVzdCkgZWxlbWVudC5mbGFyZShcImNsaWNrU291bmRcIik7XG5cbiAgICAgICAgZWxlbWVudC50d2VlbmVyLmNsZWFyKClcbiAgICAgICAgICAudG8oe1xuICAgICAgICAgICAgc2NhbGVYOiAxLjAsXG4gICAgICAgICAgICBzY2FsZVk6IDEuMFxuICAgICAgICAgIH0sIDEwMClcbiAgICAgICAgICAuY2FsbCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXR1cyA9IHRoaXMuU1RBVFVTLk5PTkU7XG4gICAgICAgICAgICBpZiAoIWhpdFRlc3QpIHJldHVybjtcbiAgICAgICAgICAgIGVsZW1lbnQuZmxhcmUoXCJjbGlja2VkXCIsIHtcbiAgICAgICAgICAgICAgcG9pbnRlcjogZS5wb2ludGVyXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvL+OCouODi+ODoeODvOOCt+ODp+ODs+OBruacgOS4reOBq+WJiumZpOOBleOCjOOBn+WgtOWQiOOBq+WCmeOBiOOBpnJlbW92ZWTjgqTjg5njg7Pjg4jmmYLjgavjg5Xjg6njgrDjgpLlhYPjgavmiLvjgZfjgabjgYrjgY9cbiAgICAgIGVsZW1lbnQub25lKFwicmVtb3ZlZFwiLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuc3RhdHVzID0gdGhpcy5TVEFUVVMuTk9ORTtcbiAgICAgIH0pO1xuXG4gICAgICBlbGVtZW50Lm9uKFwiY2xpY2tTb3VuZFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCFlbGVtZW50LmNsaWNrU291bmQpIHJldHVybjtcbiAgICAgICAgLy9waGluYS5hc3NldC5Tb3VuZE1hbmFnZXIucGxheShlbGVtZW50LmNsaWNrU291bmQpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgfSxcbn0pO1xuIiwicGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuXG4gIC8qKlxuICAgKiDjg4bjgq/jgrnjg4Hjg6PplqLkv4Ljga7jg6bjg7zjg4bjgqPjg6rjg4bjgqNcbiAgICovXG4gIHBoaW5hLmRlZmluZShcIlRleHR1cmVVdGlsXCIsIHtcblxuICAgIF9zdGF0aWM6IHtcblxuICAgICAgLyoqXG4gICAgICAgKiBSR0LlkITopoHntKDjgavlrp/mlbDjgpLnqY3nrpfjgZnjgotcbiAgICAgICAqL1xuICAgICAgbXVsdGlwbHlDb2xvcjogZnVuY3Rpb24odGV4dHVyZSwgcmVkLCBncmVlbiwgYmx1ZSkge1xuICAgICAgICBpZiAodHlwZW9mKHRleHR1cmUpID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgdGV4dHVyZSA9IEFzc2V0TWFuYWdlci5nZXQoXCJpbWFnZVwiLCB0ZXh0dXJlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHdpZHRoID0gdGV4dHVyZS5kb21FbGVtZW50LndpZHRoO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSB0ZXh0dXJlLmRvbUVsZW1lbnQuaGVpZ2h0O1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IENhbnZhcygpLnNldFNpemUod2lkdGgsIGhlaWdodCk7XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSByZXN1bHQuY29udGV4dDtcblxuICAgICAgICBjb250ZXh0LmRyYXdJbWFnZSh0ZXh0dXJlLmRvbUVsZW1lbnQsIDAsIDApO1xuICAgICAgICBjb25zdCBpbWFnZURhdGEgPSBjb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbWFnZURhdGEuZGF0YS5sZW5ndGg7IGkgKz0gNCkge1xuICAgICAgICAgIGltYWdlRGF0YS5kYXRhW2kgKyAwXSA9IE1hdGguZmxvb3IoaW1hZ2VEYXRhLmRhdGFbaSArIDBdICogcmVkKTtcbiAgICAgICAgICBpbWFnZURhdGEuZGF0YVtpICsgMV0gPSBNYXRoLmZsb29yKGltYWdlRGF0YS5kYXRhW2kgKyAxXSAqIGdyZWVuKTtcbiAgICAgICAgICBpbWFnZURhdGEuZGF0YVtpICsgMl0gPSBNYXRoLmZsb29yKGltYWdlRGF0YS5kYXRhW2kgKyAyXSAqIGJsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRleHQucHV0SW1hZ2VEYXRhKGltYWdlRGF0YSwgMCwgMCk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICog6Imy55u444O75b2p5bqm44O75piO5bqm44KS5pON5L2c44GZ44KLXG4gICAgICAgKi9cbiAgICAgIGVkaXRCeUhzbDogZnVuY3Rpb24odGV4dHVyZSwgaCwgcywgbCkge1xuICAgICAgICBpZiAodHlwZW9mKHRleHR1cmUpID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgdGV4dHVyZSA9IEFzc2V0TWFuYWdlci5nZXQoXCJpbWFnZVwiLCB0ZXh0dXJlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHdpZHRoID0gdGV4dHVyZS5kb21FbGVtZW50LndpZHRoO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSB0ZXh0dXJlLmRvbUVsZW1lbnQuaGVpZ2h0O1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IENhbnZhcygpLnNldFNpemUod2lkdGgsIGhlaWdodCk7XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSByZXN1bHQuY29udGV4dDtcblxuICAgICAgICBjb250ZXh0LmRyYXdJbWFnZSh0ZXh0dXJlLmRvbUVsZW1lbnQsIDAsIDApO1xuICAgICAgICBjb25zdCBpbWFnZURhdGEgPSBjb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbWFnZURhdGEuZGF0YS5sZW5ndGg7IGkgKz0gNCkge1xuICAgICAgICAgIGNvbnN0IHIgPSBpbWFnZURhdGEuZGF0YVtpICsgMF07XG4gICAgICAgICAgY29uc3QgZyA9IGltYWdlRGF0YS5kYXRhW2kgKyAxXTtcbiAgICAgICAgICBjb25zdCBiID0gaW1hZ2VEYXRhLmRhdGFbaSArIDJdO1xuXG4gICAgICAgICAgY29uc3QgaHNsID0gcGhpbmEudXRpbC5Db2xvci5SR0J0b0hTTChyLCBnLCBiKTtcbiAgICAgICAgICBjb25zdCBuZXdSZ2IgPSBwaGluYS51dGlsLkNvbG9yLkhTTHRvUkdCKGhzbFswXSArIGgsIE1hdGguY2xhbXAoaHNsWzFdICsgcywgMCwgMTAwKSwgTWF0aC5jbGFtcChoc2xbMl0gKyBsLCAwLCAxMDApKTtcblxuICAgICAgICAgIGltYWdlRGF0YS5kYXRhW2kgKyAwXSA9IG5ld1JnYlswXTtcbiAgICAgICAgICBpbWFnZURhdGEuZGF0YVtpICsgMV0gPSBuZXdSZ2JbMV07XG4gICAgICAgICAgaW1hZ2VEYXRhLmRhdGFbaSArIDJdID0gbmV3UmdiWzJdO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRleHQucHV0SW1hZ2VEYXRhKGltYWdlRGF0YSwgMCwgMCk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH0sXG5cbiAgICB9LFxuXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7fSxcbiAgfSk7XG5cbn0pO1xuIiwiLypcbiAqICBwaGluYS50aWxlZG1hcC5qc1xuICogIDIwMTYvOS8xMFxuICogIEBhdXRoZXIgbWluaW1vICBcbiAqICBUaGlzIFByb2dyYW0gaXMgTUlUIGxpY2Vuc2UuXG4gKlxuICovXG5cbnBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcblxuICBwaGluYS5kZWZpbmUoXCJwaGluYS5hc3NldC5UaWxlZE1hcFwiLCB7XG4gICAgc3VwZXJDbGFzczogXCJwaGluYS5hc3NldC5Bc3NldFwiLFxuXG4gICAgaW1hZ2U6IG51bGwsXG5cbiAgICB0aWxlc2V0czogbnVsbCxcbiAgICBsYXllcnM6IG51bGwsXG5cbiAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zdXBlckluaXQoKTtcbiAgICB9LFxuXG4gICAgX2xvYWQ6IGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICAgIC8v44OR44K55oqc44GN5Ye644GXXG4gICAgICB0aGlzLnBhdGggPSBcIlwiO1xuICAgICAgY29uc3QgbGFzdCA9IHRoaXMuc3JjLmxhc3RJbmRleE9mKFwiL1wiKTtcbiAgICAgIGlmIChsYXN0ID4gMCkge1xuICAgICAgICAgIHRoaXMucGF0aCA9IHRoaXMuc3JjLnN1YnN0cmluZygwLCBsYXN0KzEpO1xuICAgICAgfVxuXG4gICAgICAvL+e1guS6humWouaVsOS/neWtmFxuICAgICAgdGhpcy5fcmVzb2x2ZSA9IHJlc29sdmU7XG5cbiAgICAgIC8vIGxvYWRcbiAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgY29uc3QgeG1sID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICB4bWwub3BlbignR0VUJywgdGhpcy5zcmMpO1xuICAgICAgeG1sLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoeG1sLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICBpZiAoWzIwMCwgMjAxLCAwXS5pbmRleE9mKHhtbC5zdGF0dXMpICE9PSAtMSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSB4bWwucmVzcG9uc2VUZXh0O1xuICAgICAgICAgICAgZGF0YSA9IChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyhkYXRhLCBcInRleHQveG1sXCIpO1xuICAgICAgICAgICAgc2VsZi5kYXRhVHlwZSA9IFwieG1sXCI7XG4gICAgICAgICAgICBzZWxmLmRhdGEgPSBkYXRhO1xuICAgICAgICAgICAgc2VsZi5fcGFyc2UoZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgeG1sLnNlbmQobnVsbCk7XG4gICAgfSxcblxuICAgIC8v44Oe44OD44OX44Kk44Oh44O844K45Y+W5b6XXG4gICAgZ2V0SW1hZ2U6IGZ1bmN0aW9uKGxheWVyTmFtZSkge1xuICAgICAgaWYgKGxheWVyTmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmltYWdlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dlbmVyYXRlSW1hZ2UobGF5ZXJOYW1lKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLy/mjIflrprjg57jg4Pjg5fjg6zjgqTjg6Tjg7zjgpLphY3liJfjgajjgZfjgablj5blvpdcbiAgICBnZXRNYXBEYXRhOiBmdW5jdGlvbihsYXllck5hbWUpIHtcbiAgICAgIC8v44Os44Kk44Ok44O85qSc57SiXG4gICAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5sYXllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHRoaXMubGF5ZXJzW2ldLm5hbWUgPT0gbGF5ZXJOYW1lKSB7XG4gICAgICAgICAgLy/jgrPjg5Tjg7zjgpLov5TjgZlcbiAgICAgICAgICByZXR1cm4gdGhpcy5sYXllcnNbaV0uZGF0YS5jb25jYXQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcblxuICAgIC8v44Kq44OW44K444Kn44Kv44OI44Kw44Or44O844OX44KS5Y+W5b6X77yI5oyH5a6a44GM54Sh44GE5aC05ZCI44CB5YWo44Os44Kk44Ok44O844KS6YWN5YiX44Gr44GX44Gm6L+U44GZ77yJXG4gICAgZ2V0T2JqZWN0R3JvdXA6IGZ1bmN0aW9uKGdyb3VwTmFtZSkge1xuICAgICAgZ3JvdXBOYW1lID0gZ3JvdXBOYW1lIHx8IG51bGw7XG4gICAgICB2YXIgbHMgPSBbXTtcbiAgICAgIHZhciBsZW4gPSB0aGlzLmxheWVycy5sZW5ndGg7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGlmICh0aGlzLmxheWVyc1tpXS50eXBlID09IFwib2JqZWN0Z3JvdXBcIikge1xuICAgICAgICAgIGlmIChncm91cE5hbWUgPT0gbnVsbCB8fCBncm91cE5hbWUgPT0gdGhpcy5sYXllcnNbaV0ubmFtZSkge1xuICAgICAgICAgICAgLy/jg6zjgqTjg6Tjg7zmg4XloLHjgpLjgq/jg63jg7zjg7PjgZnjgotcbiAgICAgICAgICAgIGNvbnN0IG9iaiA9IHRoaXMuX2Nsb25lT2JqZWN0TGF5ZXIodGhpcy5sYXllcnNbaV0pO1xuICAgICAgICAgICAgaWYgKGdyb3VwTmFtZSAhPT0gbnVsbCkgcmV0dXJuIG9iajtcbiAgICAgICAgICB9XG4gICAgICAgICAgbHMucHVzaChvYmopO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbHM7XG4gICAgfSxcblxuICAgIC8v44Kq44OW44K444Kn44Kv44OI44Os44Kk44Ok44O844KS44Kv44Ot44O844Oz44GX44Gm6L+U44GZXG4gICAgX2Nsb25lT2JqZWN0TGF5ZXI6IGZ1bmN0aW9uKHNyY0xheWVyKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSB7fS4kc2FmZShzcmNMYXllcik7XG4gICAgICByZXN1bHQub2JqZWN0cyA9IFtdO1xuICAgICAgLy/jg6zjgqTjg6Tjg7zlhoXjgqrjg5bjgrjjgqfjgq/jg4jjga7jgrPjg5Tjg7xcbiAgICAgIHNyY0xheWVyLm9iamVjdHMuZm9yRWFjaChmdW5jdGlvbihvYmope1xuICAgICAgICBjb25zdCByZXNPYmogPSB7XG4gICAgICAgICAgcHJvcGVydGllczoge30uJHNhZmUob2JqLnByb3BlcnRpZXMpLFxuICAgICAgICB9LiRleHRlbmQob2JqKTtcbiAgICAgICAgaWYgKG9iai5lbGxpcHNlKSByZXNPYmouZWxsaXBzZSA9IG9iai5lbGxpcHNlO1xuICAgICAgICBpZiAob2JqLmdpZCkgcmVzT2JqLmdpZCA9IG9iai5naWQ7XG4gICAgICAgIGlmIChvYmoucG9seWdvbikgcmVzT2JqLnBvbHlnb24gPSBvYmoucG9seWdvbi5jbG9uZSgpO1xuICAgICAgICBpZiAob2JqLnBvbHlsaW5lKSByZXNPYmoucG9seWxpbmUgPSBvYmoucG9seWxpbmUuY2xvbmUoKTtcbiAgICAgICAgcmVzdWx0Lm9iamVjdHMucHVzaChyZXNPYmopO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICBfcGFyc2U6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIC8v44K/44Kk44Or5bGe5oCn5oOF5aCx5Y+W5b6XXG4gICAgICB2YXIgbWFwID0gZGF0YS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnbWFwJylbMF07XG4gICAgICB2YXIgYXR0ciA9IHRoaXMuX2F0dHJUb0pTT04obWFwKTtcbiAgICAgIHRoaXMuJGV4dGVuZChhdHRyKTtcbiAgICAgIHRoaXMucHJvcGVydGllcyA9IHRoaXMuX3Byb3BlcnRpZXNUb0pTT04obWFwKTtcblxuICAgICAgLy/jgr/jgqTjg6vjgrvjg4Pjg4jlj5blvpdcbiAgICAgIHRoaXMudGlsZXNldHMgPSB0aGlzLl9wYXJzZVRpbGVzZXRzKGRhdGEpO1xuXG4gICAgICAvL+OCv+OCpOODq+OCu+ODg+ODiOaDheWgseijnOWujFxuICAgICAgdmFyIGRlZmF1bHRBdHRyID0ge1xuICAgICAgICB0aWxld2lkdGg6IDMyLFxuICAgICAgICB0aWxlaGVpZ2h0OiAzMixcbiAgICAgICAgc3BhY2luZzogMCxcbiAgICAgICAgbWFyZ2luOiAwLFxuICAgICAgfTtcbiAgICAgIHRoaXMudGlsZXNldHMuY2hpcHMgPSBbXTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy50aWxlc2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAvL+OCv+OCpOODq+OCu+ODg+ODiOWxnuaAp+aDheWgseWPluW+l1xuICAgICAgICB2YXIgYXR0ciA9IHRoaXMuX2F0dHJUb0pTT04oZGF0YS5nZXRFbGVtZW50c0J5VGFnTmFtZSgndGlsZXNldCcpW2ldKTtcbiAgICAgICAgYXR0ci4kc2FmZShkZWZhdWx0QXR0cik7XG4gICAgICAgIGF0dHIuZmlyc3RnaWQtLTtcbiAgICAgICAgdGhpcy50aWxlc2V0c1tpXS4kZXh0ZW5kKGF0dHIpO1xuXG4gICAgICAgIC8v44Oe44OD44OX44OB44OD44OX44Oq44K544OI5L2c5oiQXG4gICAgICAgIHZhciB0ID0gdGhpcy50aWxlc2V0c1tpXTtcbiAgICAgICAgdGhpcy50aWxlc2V0c1tpXS5tYXBDaGlwID0gW107XG4gICAgICAgIGZvciAodmFyIHIgPSBhdHRyLmZpcnN0Z2lkOyByIDwgYXR0ci5maXJzdGdpZCthdHRyLnRpbGVjb3VudDsgcisrKSB7XG4gICAgICAgICAgdmFyIGNoaXAgPSB7XG4gICAgICAgICAgICBpbWFnZTogdC5pbWFnZSxcbiAgICAgICAgICAgIHg6ICgociAtIGF0dHIuZmlyc3RnaWQpICUgdC5jb2x1bW5zKSAqICh0LnRpbGV3aWR0aCArIHQuc3BhY2luZykgKyB0Lm1hcmdpbixcbiAgICAgICAgICAgIHk6IE1hdGguZmxvb3IoKHIgLSBhdHRyLmZpcnN0Z2lkKSAvIHQuY29sdW1ucykgKiAodC50aWxlaGVpZ2h0ICsgdC5zcGFjaW5nKSArIHQubWFyZ2luLFxuICAgICAgICAgIH0uJHNhZmUoYXR0cik7XG4gICAgICAgICAgdGhpcy50aWxlc2V0cy5jaGlwc1tyXSA9IGNoaXA7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy/jg6zjgqTjg6Tjg7zlj5blvpdcbiAgICAgIHRoaXMubGF5ZXJzID0gdGhpcy5fcGFyc2VMYXllcnMoZGF0YSk7XG5cbiAgICAgIC8v44Kk44Oh44O844K444OH44O844K/6Kqt44G/6L6844G/XG4gICAgICB0aGlzLl9jaGVja0ltYWdlKCk7XG4gICAgfSxcblxuICAgIC8v44Ki44K744OD44OI44Gr54Sh44GE44Kk44Oh44O844K444OH44O844K/44KS6Kqt44G/6L6844G/XG4gICAgX2NoZWNrSW1hZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgdmFyIGltYWdlU291cmNlID0gW107XG4gICAgICB2YXIgbG9hZEltYWdlID0gW107XG5cbiAgICAgIC8v5LiA6Kan5L2c5oiQXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudGlsZXNldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG9iaiA9IHtcbiAgICAgICAgICBpbWFnZTogdGhpcy50aWxlc2V0c1tpXS5pbWFnZSxcbiAgICAgICAgICB0cmFuc1I6IHRoaXMudGlsZXNldHNbaV0udHJhbnNSLFxuICAgICAgICAgIHRyYW5zRzogdGhpcy50aWxlc2V0c1tpXS50cmFuc0csXG4gICAgICAgICAgdHJhbnNCOiB0aGlzLnRpbGVzZXRzW2ldLnRyYW5zQixcbiAgICAgICAgfTtcbiAgICAgICAgaW1hZ2VTb3VyY2UucHVzaChvYmopO1xuICAgICAgfVxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodGhpcy5sYXllcnNbaV0uaW1hZ2UpIHtcbiAgICAgICAgICB2YXIgb2JqID0ge1xuICAgICAgICAgICAgaW1hZ2U6IHRoaXMubGF5ZXJzW2ldLmltYWdlLnNvdXJjZVxuICAgICAgICAgIH07XG4gICAgICAgICAgaW1hZ2VTb3VyY2UucHVzaChvYmopO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8v44Ki44K744OD44OI44Gr44GC44KL44GL56K66KqNXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGltYWdlU291cmNlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBpbWFnZSA9IHBoaW5hLmFzc2V0LkFzc2V0TWFuYWdlci5nZXQoJ2ltYWdlJywgaW1hZ2VTb3VyY2VbaV0uaW1hZ2UpO1xuICAgICAgICBpZiAoaW1hZ2UpIHtcbiAgICAgICAgICAvL+OCouOCu+ODg+ODiOOBq+OBguOCi1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8v44Gq44GL44Gj44Gf44Gu44Gn44Ot44O844OJ44Oq44K544OI44Gr6L+95YqgXG4gICAgICAgICAgbG9hZEltYWdlLnB1c2goaW1hZ2VTb3VyY2VbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8v5LiA5ous44Ot44O844OJXG4gICAgICAvL+ODreODvOODieODquOCueODiOS9nOaIkFxuICAgICAgdmFyIGFzc2V0cyA9IHtcbiAgICAgICAgaW1hZ2U6IFtdXG4gICAgICB9O1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsb2FkSW1hZ2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgLy/jgqTjg6Hjg7zjgrjjga7jg5HjgrnjgpLjg57jg4Pjg5fjgajlkIzjgZjjgavjgZnjgotcbiAgICAgICAgYXNzZXRzLmltYWdlW2ltYWdlU291cmNlW2ldLmltYWdlXSA9IHRoaXMucGF0aCtpbWFnZVNvdXJjZVtpXS5pbWFnZTtcbiAgICAgIH1cbiAgICAgIGlmIChsb2FkSW1hZ2UubGVuZ3RoKSB7XG4gICAgICAgIHZhciBsb2FkZXIgPSBwaGluYS5hc3NldC5Bc3NldExvYWRlcigpO1xuICAgICAgICBsb2FkZXIubG9hZChhc3NldHMpO1xuICAgICAgICBsb2FkZXIub24oJ2xvYWQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgLy/pgI/pgY7oibLoqK3lrprlj43mmKBcbiAgICAgICAgICBsb2FkSW1hZ2UuZm9yRWFjaChmdW5jdGlvbihlbG0pIHtcbiAgICAgICAgICAgIHZhciBpbWFnZSA9IHBoaW5hLmFzc2V0LkFzc2V0TWFuYWdlci5nZXQoJ2ltYWdlJywgZWxtLmltYWdlKTtcbiAgICAgICAgICAgIGlmIChlbG0udHJhbnNSICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgdmFyIHIgPSBlbG0udHJhbnNSLCBnID0gZWxtLnRyYW5zRywgYiA9IGVsbS50cmFuc0I7XG4gICAgICAgICAgICAgIGltYWdlLmZpbHRlcihmdW5jdGlvbihwaXhlbCwgaW5kZXgsIHgsIHksIGJpdG1hcCkge1xuICAgICAgICAgICAgICAgIHZhciBkYXRhID0gYml0bWFwLmRhdGE7XG4gICAgICAgICAgICAgICAgaWYgKHBpeGVsWzBdID09IHIgJiYgcGl4ZWxbMV0gPT0gZyAmJiBwaXhlbFsyXSA9PSBiKSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFbaW5kZXgrM10gPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgLy/jg57jg4Pjg5fjgqTjg6Hjg7zjgrjnlJ/miJBcbiAgICAgICAgICB0aGF0LmltYWdlID0gdGhhdC5fZ2VuZXJhdGVJbWFnZSgpO1xuICAgICAgICAgIC8v6Kqt44G/6L6844G/57WC5LqGXG4gICAgICAgICAgdGhhdC5fcmVzb2x2ZSh0aGF0KTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8v44Oe44OD44OX44Kk44Oh44O844K455Sf5oiQXG4gICAgICAgIHRoaXMuaW1hZ2UgPSB0aGF0Ll9nZW5lcmF0ZUltYWdlKCk7XG4gICAgICAgIC8v6Kqt44G/6L6844G/57WC5LqGXG4gICAgICAgIHRoaXMuX3Jlc29sdmUodGhhdCk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8v44Oe44OD44OX44Kk44Oh44O844K45L2c5oiQXG4gICAgX2dlbmVyYXRlSW1hZ2U6IGZ1bmN0aW9uKGxheWVyTmFtZSkge1xuICAgICAgdmFyIG51bUxheWVyID0gMDtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sYXllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHRoaXMubGF5ZXJzW2ldLnR5cGUgPT0gXCJsYXllclwiIHx8IHRoaXMubGF5ZXJzW2ldLnR5cGUgPT0gXCJpbWFnZWxheWVyXCIpIG51bUxheWVyKys7XG4gICAgICB9XG4gICAgICBpZiAobnVtTGF5ZXIgPT0gMCkgcmV0dXJuIG51bGw7XG5cbiAgICAgIHZhciB3aWR0aCA9IHRoaXMud2lkdGggKiB0aGlzLnRpbGV3aWR0aDtcbiAgICAgIHZhciBoZWlnaHQgPSB0aGlzLmhlaWdodCAqIHRoaXMudGlsZWhlaWdodDtcbiAgICAgIHZhciBjYW52YXMgPSBwaGluYS5ncmFwaGljcy5DYW52YXMoKS5zZXRTaXplKHdpZHRoLCBoZWlnaHQpO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIC8v44Oe44OD44OX44Os44Kk44Ok44O8XG4gICAgICAgIGlmICh0aGlzLmxheWVyc1tpXS50eXBlID09IFwibGF5ZXJcIiAmJiB0aGlzLmxheWVyc1tpXS52aXNpYmxlICE9IFwiMFwiKSB7XG4gICAgICAgICAgaWYgKGxheWVyTmFtZSA9PT0gdW5kZWZpbmVkIHx8IGxheWVyTmFtZSA9PT0gdGhpcy5sYXllcnNbaV0ubmFtZSkge1xuICAgICAgICAgICAgdmFyIGxheWVyID0gdGhpcy5sYXllcnNbaV07XG4gICAgICAgICAgICB2YXIgbWFwZGF0YSA9IGxheWVyLmRhdGE7XG4gICAgICAgICAgICB2YXIgd2lkdGggPSBsYXllci53aWR0aDtcbiAgICAgICAgICAgIHZhciBoZWlnaHQgPSBsYXllci5oZWlnaHQ7XG4gICAgICAgICAgICB2YXIgb3BhY2l0eSA9IGxheWVyLm9wYWNpdHkgfHwgMS4wO1xuICAgICAgICAgICAgdmFyIGNvdW50ID0gMDtcbiAgICAgICAgICAgIGZvciAodmFyIHkgPSAwOyB5IDwgaGVpZ2h0OyB5KyspIHtcbiAgICAgICAgICAgICAgZm9yICh2YXIgeCA9IDA7IHggPCB3aWR0aDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gbWFwZGF0YVtjb3VudF07XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgLy/jg57jg4Pjg5fjg4Hjg4Pjg5fjgpLphY3nva5cbiAgICAgICAgICAgICAgICAgIHRoaXMuX3NldE1hcENoaXAoY2FudmFzLCBpbmRleCwgeCAqIHRoaXMudGlsZXdpZHRoLCB5ICogdGhpcy50aWxlaGVpZ2h0LCBvcGFjaXR5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvL+OCquODluOCuOOCp+OCr+ODiOOCsOODq+ODvOODl1xuICAgICAgICBpZiAodGhpcy5sYXllcnNbaV0udHlwZSA9PSBcIm9iamVjdGdyb3VwXCIgJiYgdGhpcy5sYXllcnNbaV0udmlzaWJsZSAhPSBcIjBcIikge1xuICAgICAgICAgIGlmIChsYXllck5hbWUgPT09IHVuZGVmaW5lZCB8fCBsYXllck5hbWUgPT09IHRoaXMubGF5ZXJzW2ldLm5hbWUpIHtcbiAgICAgICAgICAgIHZhciBsYXllciA9IHRoaXMubGF5ZXJzW2ldO1xuICAgICAgICAgICAgdmFyIG9wYWNpdHkgPSBsYXllci5vcGFjaXR5IHx8IDEuMDtcbiAgICAgICAgICAgIGxheWVyLm9iamVjdHMuZm9yRWFjaChmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgIGlmIChlLmdpZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3NldE1hcENoaXAoY2FudmFzLCBlLmdpZCwgZS54LCBlLnksIG9wYWNpdHkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvL+OCpOODoeODvOOCuOODrOOCpOODpOODvFxuICAgICAgICBpZiAodGhpcy5sYXllcnNbaV0udHlwZSA9PSBcImltYWdlbGF5ZXJcIiAmJiB0aGlzLmxheWVyc1tpXS52aXNpYmxlICE9IFwiMFwiKSB7XG4gICAgICAgICAgaWYgKGxheWVyTmFtZSA9PT0gdW5kZWZpbmVkIHx8IGxheWVyTmFtZSA9PT0gdGhpcy5sYXllcnNbaV0ubmFtZSkge1xuICAgICAgICAgICAgdmFyIGxlbiA9IHRoaXMubGF5ZXJzW2ldO1xuICAgICAgICAgICAgdmFyIGltYWdlID0gcGhpbmEuYXNzZXQuQXNzZXRNYW5hZ2VyLmdldCgnaW1hZ2UnLCB0aGlzLmxheWVyc1tpXS5pbWFnZS5zb3VyY2UpO1xuICAgICAgICAgICAgY2FudmFzLmNvbnRleHQuZHJhd0ltYWdlKGltYWdlLmRvbUVsZW1lbnQsIHRoaXMubGF5ZXJzW2ldLngsIHRoaXMubGF5ZXJzW2ldLnkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgdGV4dHVyZSA9IHBoaW5hLmFzc2V0LlRleHR1cmUoKTtcbiAgICAgIHRleHR1cmUuZG9tRWxlbWVudCA9IGNhbnZhcy5kb21FbGVtZW50O1xuICAgICAgcmV0dXJuIHRleHR1cmU7XG4gICAgfSxcblxuICAgIC8v44Kt44Oj44Oz44OQ44K544Gu5oyH5a6a44GX44Gf5bqn5qiZ44Gr44Oe44OD44OX44OB44OD44OX44Gu44Kk44Oh44O844K444KS44Kz44OU44O844GZ44KLXG4gICAgX3NldE1hcENoaXA6IGZ1bmN0aW9uKGNhbnZhcywgaW5kZXgsIHgsIHksIG9wYWNpdHkpIHtcbiAgICAgIC8v44K/44Kk44Or44K744OD44OI44GL44KJ44Oe44OD44OX44OB44OD44OX44KS5Y+W5b6XXG4gICAgICB2YXIgY2hpcCA9IHRoaXMudGlsZXNldHMuY2hpcHNbaW5kZXhdO1xuICAgICAgdmFyIGltYWdlID0gcGhpbmEuYXNzZXQuQXNzZXRNYW5hZ2VyLmdldCgnaW1hZ2UnLCBjaGlwLmltYWdlKTtcbiAgICAgIGNhbnZhcy5jb250ZXh0LmRyYXdJbWFnZShcbiAgICAgICAgaW1hZ2UuZG9tRWxlbWVudCxcbiAgICAgICAgY2hpcC54ICsgY2hpcC5tYXJnaW4sIGNoaXAueSArIGNoaXAubWFyZ2luLFxuICAgICAgICBjaGlwLnRpbGV3aWR0aCwgY2hpcC50aWxlaGVpZ2h0LFxuICAgICAgICB4LCB5LFxuICAgICAgICBjaGlwLnRpbGV3aWR0aCwgY2hpcC50aWxlaGVpZ2h0KTtcbiAgICB9LFxuXG4gICAgLy9YTUzjg5fjg63jg5Hjg4bjgqPjgpJKU09O44Gr5aSJ5o+bXG4gICAgX3Byb3BlcnRpZXNUb0pTT046IGZ1bmN0aW9uKGVsbSkge1xuICAgICAgdmFyIHByb3BlcnRpZXMgPSBlbG0uZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJwcm9wZXJ0aWVzXCIpWzBdO1xuICAgICAgdmFyIG9iaiA9IHt9O1xuICAgICAgaWYgKHByb3BlcnRpZXMgPT09IHVuZGVmaW5lZCkgcmV0dXJuIG9iajtcblxuICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBwcm9wZXJ0aWVzLmNoaWxkTm9kZXMubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgdmFyIHAgPSBwcm9wZXJ0aWVzLmNoaWxkTm9kZXNba107XG4gICAgICAgIGlmIChwLnRhZ05hbWUgPT09IFwicHJvcGVydHlcIikge1xuICAgICAgICAgIC8vcHJvcGVydHnjgat0eXBl5oyH5a6a44GM44GC44Gj44Gf44KJ5aSJ5o+bXG4gICAgICAgICAgdmFyIHR5cGUgPSBwLmdldEF0dHJpYnV0ZSgndHlwZScpO1xuICAgICAgICAgIHZhciB2YWx1ZSA9IHAuZ2V0QXR0cmlidXRlKCd2YWx1ZScpO1xuICAgICAgICAgIGlmICghdmFsdWUpIHZhbHVlID0gcC50ZXh0Q29udGVudDtcbiAgICAgICAgICBpZiAodHlwZSA9PSBcImludFwiKSB7XG4gICAgICAgICAgICBvYmpbcC5nZXRBdHRyaWJ1dGUoJ25hbWUnKV0gPSBwYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PSBcImZsb2F0XCIpIHtcbiAgICAgICAgICAgIG9ialtwLmdldEF0dHJpYnV0ZSgnbmFtZScpXSA9IHBhcnNlRmxvYXQodmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PSBcImJvb2xcIiApIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcInRydWVcIikgb2JqW3AuZ2V0QXR0cmlidXRlKCduYW1lJyldID0gdHJ1ZTtcbiAgICAgICAgICAgIGVsc2Ugb2JqW3AuZ2V0QXR0cmlidXRlKCduYW1lJyldID0gZmFsc2U7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9ialtwLmdldEF0dHJpYnV0ZSgnbmFtZScpXSA9IHZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG9iajtcbiAgICB9LFxuXG4gICAgLy9YTUzlsZ7mgKfjgpJKU09O44Gr5aSJ5o+bXG4gICAgX2F0dHJUb0pTT046IGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgdmFyIG9iaiA9IHt9O1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzb3VyY2UuYXR0cmlidXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdmFsID0gc291cmNlLmF0dHJpYnV0ZXNbaV0udmFsdWU7XG4gICAgICAgIHZhbCA9IGlzTmFOKHBhcnNlRmxvYXQodmFsKSk/IHZhbDogcGFyc2VGbG9hdCh2YWwpO1xuICAgICAgICBvYmpbc291cmNlLmF0dHJpYnV0ZXNbaV0ubmFtZV0gPSB2YWw7XG4gICAgICB9XG4gICAgICByZXR1cm4gb2JqO1xuICAgIH0sXG5cbiAgICAvL1hNTOWxnuaAp+OCkkpTT07jgavlpInmj5vvvIhTdHJpbmfjgafov5TjgZnvvIlcbiAgICBfYXR0clRvSlNPTl9zdHI6IGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgdmFyIG9iaiA9IHt9O1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzb3VyY2UuYXR0cmlidXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdmFsID0gc291cmNlLmF0dHJpYnV0ZXNbaV0udmFsdWU7XG4gICAgICAgIG9ialtzb3VyY2UuYXR0cmlidXRlc1tpXS5uYW1lXSA9IHZhbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBvYmo7XG4gICAgfSxcblxuICAgIC8v44K/44Kk44Or44K744OD44OI44Gu44OR44O844K5XG4gICAgX3BhcnNlVGlsZXNldHM6IGZ1bmN0aW9uKHhtbCkge1xuICAgICAgdmFyIGVhY2ggPSBBcnJheS5wcm90b3R5cGUuZm9yRWFjaDtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBkYXRhID0gW107XG4gICAgICB2YXIgdGlsZXNldHMgPSB4bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3RpbGVzZXQnKTtcbiAgICAgIGVhY2guY2FsbCh0aWxlc2V0cywgZnVuY3Rpb24odGlsZXNldCkge1xuICAgICAgICB2YXIgdCA9IHt9O1xuICAgICAgICB2YXIgcHJvcHMgPSBzZWxmLl9wcm9wZXJ0aWVzVG9KU09OKHRpbGVzZXQpO1xuICAgICAgICBpZiAocHJvcHMuc3JjKSB7XG4gICAgICAgICAgdC5pbWFnZSA9IHByb3BzLnNyYztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0LmltYWdlID0gdGlsZXNldC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW1hZ2UnKVswXS5nZXRBdHRyaWJ1dGUoJ3NvdXJjZScpO1xuICAgICAgICB9XG4gICAgICAgIC8v6YCP6YGO6Imy6Kit5a6a5Y+W5b6XXG4gICAgICAgIHQudHJhbnMgPSB0aWxlc2V0LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbWFnZScpWzBdLmdldEF0dHJpYnV0ZSgndHJhbnMnKTtcbiAgICAgICAgaWYgKHQudHJhbnMpIHtcbiAgICAgICAgICB0LnRyYW5zUiA9IHBhcnNlSW50KHQudHJhbnMuc3Vic3RyaW5nKDAsIDIpLCAxNik7XG4gICAgICAgICAgdC50cmFuc0cgPSBwYXJzZUludCh0LnRyYW5zLnN1YnN0cmluZygyLCA0KSwgMTYpO1xuICAgICAgICAgIHQudHJhbnNCID0gcGFyc2VJbnQodC50cmFucy5zdWJzdHJpbmcoNCwgNiksIDE2KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRhdGEucHVzaCh0KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfSxcblxuICAgIC8v44Os44Kk44Ok44O85oOF5aCx44Gu44OR44O844K5XG4gICAgX3BhcnNlTGF5ZXJzOiBmdW5jdGlvbih4bWwpIHtcbiAgICAgIHZhciBlYWNoID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2g7XG4gICAgICB2YXIgZGF0YSA9IFtdO1xuXG4gICAgICB2YXIgbWFwID0geG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwibWFwXCIpWzBdO1xuICAgICAgdmFyIGxheWVycyA9IFtdO1xuICAgICAgZWFjaC5jYWxsKG1hcC5jaGlsZE5vZGVzLCBmdW5jdGlvbihlbG0pIHtcbiAgICAgICAgaWYgKGVsbS50YWdOYW1lID09IFwibGF5ZXJcIiB8fCBlbG0udGFnTmFtZSA9PSBcIm9iamVjdGdyb3VwXCIgfHwgZWxtLnRhZ05hbWUgPT0gXCJpbWFnZWxheWVyXCIpIHtcbiAgICAgICAgICBsYXllcnMucHVzaChlbG0pO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgbGF5ZXJzLmVhY2goZnVuY3Rpb24obGF5ZXIpIHtcbiAgICAgICAgc3dpdGNoIChsYXllci50YWdOYW1lKSB7XG4gICAgICAgICAgY2FzZSBcImxheWVyXCI6XG4gICAgICAgICAgICAvL+mAmuW4uOODrOOCpOODpOODvFxuICAgICAgICAgICAgdmFyIGQgPSBsYXllci5nZXRFbGVtZW50c0J5VGFnTmFtZSgnZGF0YScpWzBdO1xuICAgICAgICAgICAgdmFyIGVuY29kaW5nID0gZC5nZXRBdHRyaWJ1dGUoXCJlbmNvZGluZ1wiKTtcbiAgICAgICAgICAgIHZhciBsID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwibGF5ZXJcIixcbiAgICAgICAgICAgICAgICBuYW1lOiBsYXllci5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGVuY29kaW5nID09IFwiY3N2XCIpIHtcbiAgICAgICAgICAgICAgICBsLmRhdGEgPSB0aGlzLl9wYXJzZUNTVihkLnRleHRDb250ZW50KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZW5jb2RpbmcgPT0gXCJiYXNlNjRcIikge1xuICAgICAgICAgICAgICAgIGwuZGF0YSA9IHRoaXMuX3BhcnNlQmFzZTY0KGQudGV4dENvbnRlbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgYXR0ciA9IHRoaXMuX2F0dHJUb0pTT04obGF5ZXIpO1xuICAgICAgICAgICAgbC4kZXh0ZW5kKGF0dHIpO1xuICAgICAgICAgICAgbC5wcm9wZXJ0aWVzID0gdGhpcy5fcHJvcGVydGllc1RvSlNPTihsYXllcik7XG5cbiAgICAgICAgICAgIGRhdGEucHVzaChsKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgLy/jgqrjg5bjgrjjgqfjgq/jg4jjg6zjgqTjg6Tjg7xcbiAgICAgICAgICBjYXNlIFwib2JqZWN0Z3JvdXBcIjpcbiAgICAgICAgICAgIHZhciBsID0ge1xuICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdGdyb3VwXCIsXG4gICAgICAgICAgICAgIG9iamVjdHM6IFtdLFxuICAgICAgICAgICAgICBuYW1lOiBsYXllci5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpLFxuICAgICAgICAgICAgICB4OiBwYXJzZUZsb2F0KGxheWVyLmdldEF0dHJpYnV0ZShcIm9mZnNldHhcIikpIHx8IDAsXG4gICAgICAgICAgICAgIHk6IHBhcnNlRmxvYXQobGF5ZXIuZ2V0QXR0cmlidXRlKFwib2Zmc2V0eVwiKSkgfHwgMCxcbiAgICAgICAgICAgICAgYWxwaGE6IGxheWVyLmdldEF0dHJpYnV0ZShcIm9wYWNpdHlcIikgfHwgMSxcbiAgICAgICAgICAgICAgY29sb3I6IGxheWVyLmdldEF0dHJpYnV0ZShcImNvbG9yXCIpIHx8IG51bGwsXG4gICAgICAgICAgICAgIGRyYXdvcmRlcjogbGF5ZXIuZ2V0QXR0cmlidXRlKFwiZHJhd29yZGVyXCIpIHx8IG51bGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgZWFjaC5jYWxsKGxheWVyLmNoaWxkTm9kZXMsIGZ1bmN0aW9uKGVsbSkge1xuICAgICAgICAgICAgICBpZiAoZWxtLm5vZGVUeXBlID09IDMpIHJldHVybjtcbiAgICAgICAgICAgICAgdmFyIGQgPSB0aGlzLl9hdHRyVG9KU09OKGVsbSk7XG4gICAgICAgICAgICAgIGQucHJvcGVydGllcyA9IHRoaXMuX3Byb3BlcnRpZXNUb0pTT04oZWxtKTtcbiAgICAgICAgICAgICAgLy/lrZDopoHntKDjga7op6PmnpBcbiAgICAgICAgICAgICAgaWYgKGVsbS5jaGlsZE5vZGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGVsbS5jaGlsZE5vZGVzLmZvckVhY2goZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgaWYgKGUubm9kZVR5cGUgPT0gMykgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgLy/mpZXlhoZcbiAgICAgICAgICAgICAgICAgIGlmIChlLm5vZGVOYW1lID09ICdlbGxpcHNlJykge1xuICAgICAgICAgICAgICAgICAgICBkLmVsbGlwc2UgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgLy/lpJrop5LlvaJcbiAgICAgICAgICAgICAgICAgIGlmIChlLm5vZGVOYW1lID09ICdwb2x5Z29uJykge1xuICAgICAgICAgICAgICAgICAgICBkLnBvbHlnb24gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHIgPSB0aGlzLl9hdHRyVG9KU09OX3N0cihlKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBsID0gYXR0ci5wb2ludHMuc3BsaXQoXCIgXCIpO1xuICAgICAgICAgICAgICAgICAgICBwbC5mb3JFYWNoKGZ1bmN0aW9uKHN0cikge1xuICAgICAgICAgICAgICAgICAgICAgIHZhciBwdHMgPSBzdHIuc3BsaXQoXCIsXCIpO1xuICAgICAgICAgICAgICAgICAgICAgIGQucG9seWdvbi5wdXNoKHt4OiBwYXJzZUZsb2F0KHB0c1swXSksIHk6IHBhcnNlRmxvYXQocHRzWzFdKX0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIC8v57ea5YiGXG4gICAgICAgICAgICAgICAgICBpZiAoZS5ub2RlTmFtZSA9PSAncG9seWxpbmUnKSB7XG4gICAgICAgICAgICAgICAgICAgIGQucG9seWxpbmUgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHIgPSB0aGlzLl9hdHRyVG9KU09OX3N0cihlKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBsID0gYXR0ci5wb2ludHMuc3BsaXQoXCIgXCIpO1xuICAgICAgICAgICAgICAgICAgICBwbC5mb3JFYWNoKGZ1bmN0aW9uKHN0cikge1xuICAgICAgICAgICAgICAgICAgICAgIHZhciBwdHMgPSBzdHIuc3BsaXQoXCIsXCIpO1xuICAgICAgICAgICAgICAgICAgICAgIGQucG9seWxpbmUucHVzaCh7eDogcGFyc2VGbG9hdChwdHNbMF0pLCB5OiBwYXJzZUZsb2F0KHB0c1sxXSl9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBsLm9iamVjdHMucHVzaChkKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgICAgICBsLnByb3BlcnRpZXMgPSB0aGlzLl9wcm9wZXJ0aWVzVG9KU09OKGxheWVyKTtcblxuICAgICAgICAgICAgZGF0YS5wdXNoKGwpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAvL+OCpOODoeODvOOCuOODrOOCpOODpOODvFxuICAgICAgICAgIGNhc2UgXCJpbWFnZWxheWVyXCI6XG4gICAgICAgICAgICAgIHZhciBsID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2VsYXllclwiLFxuICAgICAgICAgICAgICAgIG5hbWU6IGxheWVyLmdldEF0dHJpYnV0ZShcIm5hbWVcIiksXG4gICAgICAgICAgICAgICAgeDogcGFyc2VGbG9hdChsYXllci5nZXRBdHRyaWJ1dGUoXCJvZmZzZXR4XCIpKSB8fCAwLFxuICAgICAgICAgICAgICAgIHk6IHBhcnNlRmxvYXQobGF5ZXIuZ2V0QXR0cmlidXRlKFwib2Zmc2V0eVwiKSkgfHwgMCxcbiAgICAgICAgICAgICAgICBhbHBoYTogbGF5ZXIuZ2V0QXR0cmlidXRlKFwib3BhY2l0eVwiKSB8fCAxLFxuICAgICAgICAgICAgICAgIHZpc2libGU6IChsYXllci5nZXRBdHRyaWJ1dGUoXCJ2aXNpYmxlXCIpID09PSB1bmRlZmluZWQgfHwgbGF5ZXIuZ2V0QXR0cmlidXRlKFwidmlzaWJsZVwiKSAhPSAwKSxcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgdmFyIGltYWdlRWxtID0gbGF5ZXIuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpbWFnZVwiKVswXTtcbiAgICAgICAgICAgICAgbC5pbWFnZSA9IHtzb3VyY2U6IGltYWdlRWxtLmdldEF0dHJpYnV0ZShcInNvdXJjZVwiKX07XG5cbiAgICAgICAgICAgICAgZGF0YS5wdXNoKGwpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgIHJldHVybiBkYXRhO1xuICAgIH0sXG5cbiAgICAvL0NTVuODkeODvOOCuVxuICAgIF9wYXJzZUNTVjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgdmFyIGRhdGFMaXN0ID0gZGF0YS5zcGxpdCgnLCcpO1xuICAgICAgdmFyIGxheWVyID0gW107XG5cbiAgICAgIGRhdGFMaXN0LmVhY2goZnVuY3Rpb24oZWxtLCBpKSB7XG4gICAgICAgIHZhciBudW0gPSBwYXJzZUludChlbG0sIDEwKSAtIDE7XG4gICAgICAgIGxheWVyLnB1c2gobnVtKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gbGF5ZXI7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEJBU0U2NOODkeODvOOCuVxuICAgICAqIGh0dHA6Ly90aGVrYW5ub24tc2VydmVyLmFwcHNwb3QuY29tL2hlcnBpdHktZGVycGl0eS5hcHBzcG90LmNvbS9wYXN0ZWJpbi5jb20vNzVLa3MwV0hcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9wYXJzZUJhc2U2NDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgdmFyIGRhdGFMaXN0ID0gYXRvYihkYXRhLnRyaW0oKSk7XG4gICAgICB2YXIgcnN0ID0gW107XG5cbiAgICAgIGRhdGFMaXN0ID0gZGF0YUxpc3Quc3BsaXQoJycpLm1hcChmdW5jdGlvbihlKSB7XG4gICAgICAgIHJldHVybiBlLmNoYXJDb2RlQXQoMCk7XG4gICAgICB9KTtcblxuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGRhdGFMaXN0Lmxlbmd0aCAvIDQ7IGkgPCBsZW47ICsraSkge1xuICAgICAgICB2YXIgbiA9IGRhdGFMaXN0W2kqNF07XG4gICAgICAgIHJzdFtpXSA9IHBhcnNlSW50KG4sIDEwKSAtIDE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByc3Q7XG4gICAgfSxcbiAgfSk7XG5cbiAgLy/jg63jg7zjg4Djg7zjgavov73liqBcbiAgcGhpbmEuYXNzZXQuQXNzZXRMb2FkZXIuYXNzZXRMb2FkRnVuY3Rpb25zLnRteCA9IGZ1bmN0aW9uKGtleSwgcGF0aCkge1xuICAgIHZhciB0bXggPSBwaGluYS5hc3NldC5UaWxlZE1hcCgpO1xuICAgIHJldHVybiB0bXgubG9hZChwYXRoKTtcbiAgfTtcblxufSk7IiwiLy9cbi8vIOaxjueUqOmWouaVsOe+pFxuLy9cbnBoaW5hLmRlZmluZShcIlV0aWxcIiwge1xuICBfc3RhdGljOiB7XG5cbiAgICAvL+aMh+WumuOBleOCjOOBn+OCquODluOCuOOCp+OCr+ODiOOCkuODq+ODvOODiOOBqOOBl+OBpuebrueahOOBrmlk44KS6LWw5p+744GZ44KLXG4gICAgZmluZEJ5SWQ6IGZ1bmN0aW9uKGlkLCBvYmopIHtcbiAgICAgIGlmIChvYmouaWQgPT09IGlkKSByZXR1cm4gb2JqO1xuICAgICAgY29uc3QgY2hpbGRyZW4gPSBPYmplY3Qua2V5cyhvYmouY2hpbGRyZW4gfHwge30pLm1hcChrZXkgPT4gb2JqLmNoaWxkcmVuW2tleV0pO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBoaXQgPSB0aGlzLmZpbmRCeUlkKGlkLCBjaGlsZHJlbltpXSk7XG4gICAgICAgIGlmIChoaXQpIHJldHVybiBoaXQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9LFxuXG4gICAgLy9UT0RPOuOBk+OBk+OBmOOCg+OBquOBhOaEn+OBjOOBguOCi+OBruOBp+OBmeOBjOOAgeS4gOaXpuWun+ijhVxuICAgIC8v5oyH5a6a44GV44KM44GfQeOBqELjga5hc3NldHPjga7pgKPmg7PphY3liJfjgpLmlrDopo/jga7jgqrjg5bjgrjjgqfjgq/jg4jjgavjg57jg7zjgrjjgZnjgotcbiAgICBtZXJnZUFzc2V0czogZnVuY3Rpb24oYXNzZXRzQSwgYXNzZXRzQikge1xuICAgICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgICBhc3NldHNBLmZvckluKCh0eXBlS2V5LCB0eXBlVmFsdWUpID0+IHtcbiAgICAgICAgaWYgKCFyZXN1bHQuJGhhcyh0eXBlS2V5KSkgcmVzdWx0W3R5cGVLZXldID0ge307XG4gICAgICAgIHR5cGVWYWx1ZS5mb3JJbigoYXNzZXRLZXksIGFzc2V0UGF0aCkgPT4ge1xuICAgICAgICAgIHJlc3VsdFt0eXBlS2V5XVthc3NldEtleV0gPSBhc3NldFBhdGg7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICBhc3NldHNCLmZvckluKCh0eXBlS2V5LCB0eXBlVmFsdWUpID0+IHtcbiAgICAgICAgaWYgKCFyZXN1bHQuJGhhcyh0eXBlS2V5KSkgcmVzdWx0W3R5cGVLZXldID0ge307XG4gICAgICAgIHR5cGVWYWx1ZS5mb3JJbigoYXNzZXRLZXksIGFzc2V0UGF0aCkgPT4ge1xuICAgICAgICAgIHJlc3VsdFt0eXBlS2V5XVthc3NldEtleV0gPSBhc3NldFBhdGg7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICAvL+ePvuWcqOaZgumWk+OBi+OCieaMh+WumuaZgumWk+OBvuOBp+OBqeOBruOBj+OCieOBhOOBi+OBi+OCi+OBi+OCkui/lOWNtOOBmeOCi1xuICAgIC8vXG4gICAgLy8gb3V0cHV0IDogeyBcbiAgICAvLyAgIHRvdGFsRGF0ZTowICwgXG4gICAgLy8gICB0b3RhbEhvdXI6MCAsIFxuICAgIC8vICAgdG90YWxNaW51dGVzOjAgLCBcbiAgICAvLyAgIHRvdGFsU2Vjb25kczowICxcbiAgICAvLyAgIGRhdGU6MCAsIFxuICAgIC8vICAgaG91cjowICwgXG4gICAgLy8gICBtaW51dGVzOjAgLCBcbiAgICAvLyAgIHNlY29uZHM6MCBcbiAgICAvLyB9XG4gICAgLy9cblxuICAgIGNhbGNSZW1haW5pbmdUaW1lOiBmdW5jdGlvbihmaW5pc2gpIHtcbiAgICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICBjb25zdCByZXN1bHQgPSB7XG4gICAgICAgIFwidG90YWxEYXRlXCI6IDAsXG4gICAgICAgIFwidG90YWxIb3VyXCI6IDAsXG4gICAgICAgIFwidG90YWxNaW51dGVzXCI6IDAsXG4gICAgICAgIFwidG90YWxTZWNvbmRzXCI6IDAsXG4gICAgICAgIFwiZGF0ZVwiOiAwLFxuICAgICAgICBcImhvdXJcIjogMCxcbiAgICAgICAgXCJtaW51dGVzXCI6IDAsXG4gICAgICAgIFwic2Vjb25kc1wiOiAwLFxuICAgICAgfVxuXG4gICAgICBmaW5pc2ggPSAoZmluaXNoIGluc3RhbmNlb2YgRGF0ZSkgPyBmaW5pc2ggOiBuZXcgRGF0ZShmaW5pc2gpO1xuICAgICAgbGV0IGRpZmYgPSBmaW5pc2ggLSBub3c7XG4gICAgICBpZiAoZGlmZiA9PT0gMCkgcmV0dXJuIHJlc3VsdDtcblxuICAgICAgY29uc3Qgc2lnbiA9IChkaWZmIDwgMCkgPyAtMSA6IDE7XG5cbiAgICAgIC8vVE9ETzrjgZPjga7ovrrjgorjgoLjgYblsJHjgZfntrrpupfjgavmm7jjgZHjgarjgYTjgYvmpJzoqI5cbiAgICAgIC8v5Y2Y5L2N5YilIDHmnKrmuoDjga8wXG4gICAgICByZXN1bHRbXCJ0b3RhbERhdGVcIl0gPSBwYXJzZUludChkaWZmIC8gMTAwMCAvIDYwIC8gNjAgLyAyNCk7XG4gICAgICByZXN1bHRbXCJ0b3RhbEhvdXJcIl0gPSBwYXJzZUludChkaWZmIC8gMTAwMCAvIDYwIC8gNjApO1xuICAgICAgcmVzdWx0W1widG90YWxNaW51dGVzXCJdID0gcGFyc2VJbnQoZGlmZiAvIDEwMDAgLyA2MCk7XG4gICAgICByZXN1bHRbXCJ0b3RhbFNlY29uZHNcIl0gPSBwYXJzZUludChkaWZmIC8gMTAwMCk7XG5cbiAgICAgIGRpZmYgLT0gcmVzdWx0W1widG90YWxEYXRlXCJdICogODY0MDAwMDA7XG4gICAgICByZXN1bHRbXCJob3VyXCJdID0gcGFyc2VJbnQoZGlmZiAvIDEwMDAgLyA2MCAvIDYwKTtcblxuICAgICAgZGlmZiAtPSByZXN1bHRbXCJob3VyXCJdICogMzYwMDAwMDtcbiAgICAgIHJlc3VsdFtcIm1pbnV0ZXNcIl0gPSBwYXJzZUludChkaWZmIC8gMTAwMCAvIDYwKTtcblxuICAgICAgZGlmZiAtPSByZXN1bHRbXCJtaW51dGVzXCJdICogNjAwMDA7XG4gICAgICByZXN1bHRbXCJzZWNvbmRzXCJdID0gcGFyc2VJbnQoZGlmZiAvIDEwMDApO1xuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuXG4gICAgfSxcblxuICAgIC8v44Os44Kk44Ki44Km44OI44Ko44OH44Kj44K/44O844Gn44GvU3ByaXRl5YWo44GmQXRhbHNTcHJpdGXjgavjgarjgaPjgabjgZfjgb7jgYbjgZ/jgoHjgIFcbiAgICAvL1Nwcml0ZeOBq+W3ruOBl+abv+OBiOOCieOCjOOCi+OCiOOBhuOBq+OBmeOCi1xuXG4gICAgLy9BdGxhc1Nwcml0ZeiHqui6q+OBq+WNmOeZuuOBrkltYWdl44KS44K744OD44OI44Gn44GN44KL44KI44GG44Gr44GZ44KL77yfXG4gICAgLy/jgYLjgajjgafjgarjgavjgYvjgZfjgonlr77nrZbjgZfjgarjgYTjgajjgaDjgoHjgaDjgYzvvJPmnIjntI3lk4Hjgafjga/kuIDml6bjgZPjgozjgadcbiAgICByZXBsYWNlQXRsYXNTcHJpdGVUb1Nwcml0ZTogZnVuY3Rpb24ocGFyZW50LCBhdGxhc1Nwcml0ZSwgc3ByaXRlKSB7XG4gICAgICBjb25zdCBpbmRleCA9IHBhcmVudC5nZXRDaGlsZEluZGV4KGF0bGFzU3ByaXRlKTtcbiAgICAgIHNwcml0ZS5zZXRPcmlnaW4oYXRsYXNTcHJpdGUub3JpZ2luWCwgYXRsYXNTcHJpdGUub3JpZ2luWSk7XG4gICAgICBzcHJpdGUuc2V0UG9zaXRpb24oYXRsYXNTcHJpdGUueCwgYXRsYXNTcHJpdGUueSk7XG4gICAgICBwYXJlbnQuYWRkQ2hpbGRBdChzcHJpdGUsIGluZGV4KTtcbiAgICAgIGF0bGFzU3ByaXRlLnJlbW92ZSgpO1xuICAgICAgcmV0dXJuIHNwcml0ZTtcbiAgICB9LFxuICB9XG59KTtcbiIsInBoaW5hLmFzc2V0LkFzc2V0TG9hZGVyLnByb3RvdHlwZS5sb2FkID0gZnVuY3Rpb24ocGFyYW1zKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIGxvYWRBc3NldHMgPSBbXTtcbiAgdmFyIGNvdW50ZXIgPSAwO1xuICB2YXIgbGVuZ3RoID0gMDtcbiAgdmFyIG1heENvbm5lY3Rpb25Db3VudCA9IDI7XG5cbiAgcGFyYW1zLmZvckluKGZ1bmN0aW9uKHR5cGUsIGFzc2V0cykge1xuICAgIGxlbmd0aCArPSBPYmplY3Qua2V5cyhhc3NldHMpLmxlbmd0aDtcbiAgfSk7XG5cbiAgaWYgKGxlbmd0aCA9PSAwKSB7XG4gICAgcmV0dXJuIHBoaW5hLnV0aWwuRmxvdy5yZXNvbHZlKCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYuZmxhcmUoJ2xvYWQnKTtcbiAgICB9KTtcbiAgfVxuXG4gIHBhcmFtcy5mb3JJbihmdW5jdGlvbih0eXBlLCBhc3NldHMpIHtcbiAgICBhc3NldHMuZm9ySW4oZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgICAgbG9hZEFzc2V0cy5wdXNoKHtcbiAgICAgICAgXCJmdW5jXCI6IHBoaW5hLmFzc2V0LkFzc2V0TG9hZGVyLmFzc2V0TG9hZEZ1bmN0aW9uc1t0eXBlXSxcbiAgICAgICAgXCJrZXlcIjoga2V5LFxuICAgICAgICBcInZhbHVlXCI6IHZhbHVlLFxuICAgICAgICBcInR5cGVcIjogdHlwZSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBpZiAoc2VsZi5jYWNoZSkge1xuICAgIHNlbGYub24oJ3Byb2dyZXNzJywgZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKGUucHJvZ3Jlc3MgPj0gMS4wKSB7XG4gICAgICAgIHBhcmFtcy5mb3JJbihmdW5jdGlvbih0eXBlLCBhc3NldHMpIHtcbiAgICAgICAgICBhc3NldHMuZm9ySW4oZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIGFzc2V0ID0gcGhpbmEuYXNzZXQuQXNzZXRNYW5hZ2VyLmdldCh0eXBlLCBrZXkpO1xuICAgICAgICAgICAgaWYgKGFzc2V0LmxvYWRFcnJvcikge1xuICAgICAgICAgICAgICB2YXIgZHVtbXkgPSBwaGluYS5hc3NldC5Bc3NldE1hbmFnZXIuZ2V0KHR5cGUsICdkdW1teScpO1xuICAgICAgICAgICAgICBpZiAoZHVtbXkpIHtcbiAgICAgICAgICAgICAgICBpZiAoZHVtbXkubG9hZEVycm9yKSB7XG4gICAgICAgICAgICAgICAgICBkdW1teS5sb2FkRHVtbXkoKTtcbiAgICAgICAgICAgICAgICAgIGR1bW15LmxvYWRFcnJvciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwaGluYS5hc3NldC5Bc3NldE1hbmFnZXIuc2V0KHR5cGUsIGtleSwgZHVtbXkpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFzc2V0LmxvYWREdW1teSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgdmFyIGxvYWRBc3NldHNBcnJheSA9IFtdO1xuXG4gIHdoaWxlIChsb2FkQXNzZXRzLmxlbmd0aCA+IDApIHtcbiAgICBsb2FkQXNzZXRzQXJyYXkucHVzaChsb2FkQXNzZXRzLnNwbGljZSgwLCBtYXhDb25uZWN0aW9uQ291bnQpKTtcbiAgfVxuXG4gIHZhciBmbG93ID0gcGhpbmEudXRpbC5GbG93LnJlc29sdmUoKTtcblxuICBsb2FkQXNzZXRzQXJyYXkuZm9yRWFjaChmdW5jdGlvbihsb2FkQXNzZXRzKSB7XG4gICAgZmxvdyA9IGZsb3cudGhlbihmdW5jdGlvbigpIHtcbiAgICAgIHZhciBmbG93cyA9IFtdO1xuICAgICAgbG9hZEFzc2V0cy5mb3JFYWNoKGZ1bmN0aW9uKGxvYWRBc3NldCkge1xuICAgICAgICB2YXIgZiA9IGxvYWRBc3NldC5mdW5jKGxvYWRBc3NldC5rZXksIGxvYWRBc3NldC52YWx1ZSk7XG4gICAgICAgIGYudGhlbihmdW5jdGlvbihhc3NldCkge1xuICAgICAgICAgIGlmIChzZWxmLmNhY2hlKSB7XG4gICAgICAgICAgICBwaGluYS5hc3NldC5Bc3NldE1hbmFnZXIuc2V0KGxvYWRBc3NldC50eXBlLCBsb2FkQXNzZXQua2V5LCBhc3NldCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHNlbGYuZmxhcmUoJ3Byb2dyZXNzJywge1xuICAgICAgICAgICAga2V5OiBsb2FkQXNzZXQua2V5LFxuICAgICAgICAgICAgYXNzZXQ6IGFzc2V0LFxuICAgICAgICAgICAgcHJvZ3Jlc3M6ICgrK2NvdW50ZXIgLyBsZW5ndGgpLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgZmxvd3MucHVzaChmKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHBoaW5hLnV0aWwuRmxvdy5hbGwoZmxvd3MpO1xuICAgIH0pO1xuICB9KTtcblxuICByZXR1cm4gZmxvdy50aGVuKGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICBzZWxmLmZsYXJlKCdsb2FkJyk7XG4gIH0pO1xufVxuIiwicGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuXG4gIHBoaW5hLmFwcC5CYXNlQXBwLnByb3RvdHlwZS4kbWV0aG9kKFwicmVwbGFjZVNjZW5lXCIsIGZ1bmN0aW9uKHNjZW5lKSB7XG4gICAgdGhpcy5mbGFyZSgncmVwbGFjZScpO1xuICAgIHRoaXMuZmxhcmUoJ2NoYW5nZXNjZW5lJyk7XG5cbiAgICB3aGlsZSAodGhpcy5fc2NlbmVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHNjZW5lID0gdGhpcy5fc2NlbmVzLnBvcCgpO1xuICAgICAgc2NlbmUuZmxhcmUoXCJkZXN0cm95XCIpO1xuICAgIH1cblxuICAgIHRoaXMuX3NjZW5lSW5kZXggPSAwO1xuXG4gICAgaWYgKHRoaXMuY3VycmVudFNjZW5lKSB7XG4gICAgICB0aGlzLmN1cnJlbnRTY2VuZS5hcHAgPSBudWxsO1xuICAgIH1cblxuICAgIHRoaXMuY3VycmVudFNjZW5lID0gc2NlbmU7XG4gICAgdGhpcy5jdXJyZW50U2NlbmUuYXBwID0gdGhpcztcbiAgICB0aGlzLmN1cnJlbnRTY2VuZS5mbGFyZSgnZW50ZXInLCB7XG4gICAgICBhcHA6IHRoaXMsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSk7XG5cbiAgcGhpbmEuYXBwLkJhc2VBcHAucHJvdG90eXBlLiRtZXRob2QoXCJwb3BTY2VuZVwiLCBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmZsYXJlKCdwb3AnKTtcbiAgICB0aGlzLmZsYXJlKCdjaGFuZ2VzY2VuZScpO1xuXG4gICAgdmFyIHNjZW5lID0gdGhpcy5fc2NlbmVzLnBvcCgpO1xuICAgIC0tdGhpcy5fc2NlbmVJbmRleDtcblxuICAgIHNjZW5lLmZsYXJlKCdleGl0Jywge1xuICAgICAgYXBwOiB0aGlzLFxuICAgIH0pO1xuICAgIHNjZW5lLmZsYXJlKCdkZXN0cm95Jyk7XG4gICAgc2NlbmUuYXBwID0gbnVsbDtcblxuICAgIHRoaXMuZmxhcmUoJ3BvcGVkJyk7XG5cbiAgICAvLyBcbiAgICB0aGlzLmN1cnJlbnRTY2VuZS5mbGFyZSgncmVzdW1lJywge1xuICAgICAgYXBwOiB0aGlzLFxuICAgICAgcHJldlNjZW5lOiBzY2VuZSxcbiAgICB9KTtcblxuICAgIHJldHVybiBzY2VuZTtcbiAgfSk7XG5cbn0pO1xuIiwicGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuXG4gIHBoaW5hLmdyYXBoaWNzLkNhbnZhcy5wcm90b3R5cGUuJG1ldGhvZChcImluaXRcIiwgZnVuY3Rpb24oY2FudmFzKSB7XG4gICAgdGhpcy5pc0NyZWF0ZUNhbnZhcyA9IGZhbHNlO1xuICAgIGlmICh0eXBlb2YgY2FudmFzID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5jYW52YXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGNhbnZhcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChjYW52YXMpIHtcbiAgICAgICAgdGhpcy5jYW52YXMgPSBjYW52YXM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICB0aGlzLmlzQ3JlYXRlQ2FudmFzID0gdHJ1ZTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJyMjIyMgY3JlYXRlIGNhbnZhcyAjIyMjJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5kb21FbGVtZW50ID0gdGhpcy5jYW52YXM7XG4gICAgdGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB0aGlzLmNvbnRleHQubGluZUNhcCA9ICdyb3VuZCc7XG4gICAgdGhpcy5jb250ZXh0LmxpbmVKb2luID0gJ3JvdW5kJztcbiAgfSk7XG5cbiAgcGhpbmEuZ3JhcGhpY3MuQ2FudmFzLnByb3RvdHlwZS4kbWV0aG9kKCdkZXN0cm95JywgZnVuY3Rpb24oY2FudmFzKSB7XG4gICAgaWYgKCF0aGlzLmlzQ3JlYXRlQ2FudmFzKSByZXR1cm47XG4gICAgLy8gY29uc29sZS5sb2coYCMjIyMgZGVsZXRlIGNhbnZhcyAke3RoaXMuY2FudmFzLndpZHRofSB4ICR7dGhpcy5jYW52YXMuaGVpZ2h0fSAjIyMjYCk7XG4gICAgdGhpcy5zZXRTaXplKDAsIDApO1xuICAgIGRlbGV0ZSB0aGlzLmNhbnZhcztcbiAgICBkZWxldGUgdGhpcy5kb21FbGVtZW50O1xuICB9KTtcblxufSk7XG4iLCJwaGluYS5uYW1lc3BhY2UoKCkgPT4ge1xuXG4gIHZhciBxdWFsaXR5U2NhbGUgPSBwaGluYS5nZW9tLk1hdHJpeDMzKCk7XG5cbiAgcGhpbmEuZGlzcGxheS5DYW52YXNSZW5kZXJlci5wcm90b3R5cGUuJG1ldGhvZChcInJlbmRlclwiLCBmdW5jdGlvbihzY2VuZSwgcXVhbGl0eSkge1xuICAgIHRoaXMuY2FudmFzLmNsZWFyKCk7XG4gICAgaWYgKHNjZW5lLmJhY2tncm91bmRDb2xvcikge1xuICAgICAgdGhpcy5jYW52YXMuY2xlYXJDb2xvcihzY2VuZS5iYWNrZ3JvdW5kQ29sb3IpO1xuICAgIH1cblxuICAgIHRoaXMuX2NvbnRleHQuc2F2ZSgpO1xuICAgIHRoaXMucmVuZGVyQ2hpbGRyZW4oc2NlbmUsIHF1YWxpdHkpO1xuICAgIHRoaXMuX2NvbnRleHQucmVzdG9yZSgpO1xuICB9KTtcblxuICBwaGluYS5kaXNwbGF5LkNhbnZhc1JlbmRlcmVyLnByb3RvdHlwZS4kbWV0aG9kKFwicmVuZGVyQ2hpbGRyZW5cIiwgZnVuY3Rpb24ob2JqLCBxdWFsaXR5KSB7XG4gICAgLy8g5a2Q5L6b44Gf44Gh44KC5a6f6KGMXG4gICAgaWYgKG9iai5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICB2YXIgdGVtcENoaWxkcmVuID0gb2JqLmNoaWxkcmVuLnNsaWNlKCk7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGVtcENoaWxkcmVuLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgIHRoaXMucmVuZGVyT2JqZWN0KHRlbXBDaGlsZHJlbltpXSwgcXVhbGl0eSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICBwaGluYS5kaXNwbGF5LkNhbnZhc1JlbmRlcmVyLnByb3RvdHlwZS4kbWV0aG9kKFwicmVuZGVyT2JqZWN0XCIsIGZ1bmN0aW9uKG9iaiwgcXVhbGl0eSkge1xuICAgIGlmIChvYmoudmlzaWJsZSA9PT0gZmFsc2UgJiYgIW9iai5pbnRlcmFjdGl2ZSkgcmV0dXJuO1xuXG4gICAgb2JqLl9jYWxjV29ybGRNYXRyaXggJiYgb2JqLl9jYWxjV29ybGRNYXRyaXgoKTtcblxuICAgIGlmIChvYmoudmlzaWJsZSA9PT0gZmFsc2UpIHJldHVybjtcblxuICAgIG9iai5fY2FsY1dvcmxkQWxwaGEgJiYgb2JqLl9jYWxjV29ybGRBbHBoYSgpO1xuXG4gICAgdmFyIGNvbnRleHQgPSB0aGlzLmNhbnZhcy5jb250ZXh0O1xuXG4gICAgY29udGV4dC5nbG9iYWxBbHBoYSA9IG9iai5fd29ybGRBbHBoYTtcbiAgICBjb250ZXh0Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IG9iai5ibGVuZE1vZGU7XG5cbiAgICBpZiAob2JqLl93b3JsZE1hdHJpeCkge1xuXG4gICAgICBxdWFsaXR5U2NhbGUuaWRlbnRpdHkoKTtcblxuICAgICAgcXVhbGl0eVNjYWxlLm0wMCA9IHF1YWxpdHkgfHwgMS4wO1xuICAgICAgcXVhbGl0eVNjYWxlLm0xMSA9IHF1YWxpdHkgfHwgMS4wO1xuXG4gICAgICB2YXIgbSA9IHF1YWxpdHlTY2FsZS5tdWx0aXBseShvYmouX3dvcmxkTWF0cml4KTtcbiAgICAgIGNvbnRleHQuc2V0VHJhbnNmb3JtKG0ubTAwLCBtLm0xMCwgbS5tMDEsIG0ubTExLCBtLm0wMiwgbS5tMTIpO1xuXG4gICAgfVxuXG4gICAgaWYgKG9iai5jbGlwKSB7XG5cbiAgICAgIGNvbnRleHQuc2F2ZSgpO1xuXG4gICAgICBvYmouY2xpcCh0aGlzLmNhbnZhcyk7XG4gICAgICBjb250ZXh0LmNsaXAoKTtcblxuICAgICAgaWYgKG9iai5kcmF3KSBvYmouZHJhdyh0aGlzLmNhbnZhcyk7XG5cbiAgICAgIC8vIOWtkOS+m+OBn+OBoeOCguWun+ihjFxuICAgICAgaWYgKG9iai5yZW5kZXJDaGlsZEJ5U2VsZiA9PT0gZmFsc2UgJiYgb2JqLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIHRlbXBDaGlsZHJlbiA9IG9iai5jaGlsZHJlbi5zbGljZSgpO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGVtcENoaWxkcmVuLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgICAgdGhpcy5yZW5kZXJPYmplY3QodGVtcENoaWxkcmVuW2ldLCBxdWFsaXR5KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb250ZXh0LnJlc3RvcmUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG9iai5kcmF3KSBvYmouZHJhdyh0aGlzLmNhbnZhcyk7XG5cbiAgICAgIC8vIOWtkOS+m+OBn+OBoeOCguWun+ihjFxuICAgICAgaWYgKG9iai5yZW5kZXJDaGlsZEJ5U2VsZiA9PT0gZmFsc2UgJiYgb2JqLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIHRlbXBDaGlsZHJlbiA9IG9iai5jaGlsZHJlbi5zbGljZSgpO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGVtcENoaWxkcmVuLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgICAgdGhpcy5yZW5kZXJPYmplY3QodGVtcENoaWxkcmVuW2ldLCBxdWFsaXR5KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgfVxuICB9KTtcblxufSk7XG4iLCJwaGluYS5uYW1lc3BhY2UoKCkgPT4ge1xuICAvL+ODpuODvOOCtuODvOOCqOODvOOCuOOCp+ODs+ODiOOBi+OCieODluODqeOCpuOCtuOCv+OCpOODl+OBruWIpOWIpeOCkuihjOOBhlxuICBwaGluYS4kbWV0aG9kKCdjaGVja0Jyb3dzZXInLCBmdW5jdGlvbigpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBjb25zdCBhZ2VudCA9IHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCk7O1xuXG4gICAgcmVzdWx0LmlzQ2hyb21lID0gKGFnZW50LmluZGV4T2YoJ2Nocm9tZScpICE9PSAtMSkgJiYgKGFnZW50LmluZGV4T2YoJ2VkZ2UnKSA9PT0gLTEpICYmIChhZ2VudC5pbmRleE9mKCdvcHInKSA9PT0gLTEpO1xuICAgIHJlc3VsdC5pc0VkZ2UgPSAoYWdlbnQuaW5kZXhPZignZWRnZScpICE9PSAtMSk7XG4gICAgcmVzdWx0LmlzSWUxMSA9IChhZ2VudC5pbmRleE9mKCd0cmlkZW50LzcnKSAhPT0gLTEpO1xuICAgIHJlc3VsdC5pc0ZpcmVmb3ggPSAoYWdlbnQuaW5kZXhPZignZmlyZWZveCcpICE9PSAtMSk7XG4gICAgcmVzdWx0LmlzU2FmYXJpID0gKGFnZW50LmluZGV4T2YoJ3NhZmFyaScpICE9PSAtMSkgJiYgKGFnZW50LmluZGV4T2YoJ2Nocm9tZScpID09PSAtMSk7XG4gICAgcmVzdWx0LmlzRWxlY3Ryb24gPSAoYWdlbnQuaW5kZXhPZignZWxlY3Ryb24nKSAhPT0gLTEpO1xuXG4gICAgcmVzdWx0LmlzV2luZG93cyA9IChhZ2VudC5pbmRleE9mKCd3aW5kb3dzJykgIT09IC0xKTtcbiAgICByZXN1bHQuaXNNYWMgPSAoYWdlbnQuaW5kZXhPZignbWFjIG9zIHgnKSAhPT0gLTEpO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSk7XG59KTtcbiIsIi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vICBFeHRlbnNpb24gcGhpbmEuZGlzcGxheS5EaXNwbGF5RWxlbWVudFxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxucGhpbmEubmFtZXNwYWNlKCgpID0+IHtcbiAgcGhpbmEuZGlzcGxheS5EaXNwbGF5RWxlbWVudC5wcm90b3R5cGUuJG1ldGhvZChcImVuYWJsZVwiLCBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNob3coKS53YWtlVXAoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSk7XG5cbiAgcGhpbmEuZGlzcGxheS5EaXNwbGF5RWxlbWVudC5wcm90b3R5cGUuJG1ldGhvZChcImRpc2FibGVcIiwgZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5oaWRlKCkuc2xlZXAoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSk7XG59KTtcbiIsInBoaW5hLm5hbWVzcGFjZSgoKSA9PiB7XG4gIHBoaW5hLmRpc3BsYXkuRGlzcGxheVNjZW5lLnF1YWxpdHkgPSAxLjA7XG4gIHBoaW5hLmRpc3BsYXkuRGlzcGxheVNjZW5lLnByb3RvdHlwZS4kbWV0aG9kKFwiaW5pdFwiLCBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICB0aGlzLnN1cGVySW5pdCgpO1xuICAgIHZhciBxdWFsaXR5ID0gcGhpbmEuZGlzcGxheS5EaXNwbGF5U2NlbmUucXVhbGl0eTtcblxuICAgIHBhcmFtcyA9ICh7fSkuJHNhZmUocGFyYW1zLCBwaGluYS5kaXNwbGF5LkRpc3BsYXlTY2VuZS5kZWZhdWx0cyk7XG4gICAgdGhpcy5jYW52YXMgPSBwaGluYS5ncmFwaGljcy5DYW52YXMoKTtcbiAgICB0aGlzLmNhbnZhcy5zZXRTaXplKHBhcmFtcy53aWR0aCAqIHF1YWxpdHksIHBhcmFtcy5oZWlnaHQgKiBxdWFsaXR5KTtcbiAgICB0aGlzLnJlbmRlcmVyID0gcGhpbmEuZGlzcGxheS5DYW52YXNSZW5kZXJlcih0aGlzLmNhbnZhcyk7XG4gICAgdGhpcy5iYWNrZ3JvdW5kQ29sb3IgPSAocGFyYW1zLmJhY2tncm91bmRDb2xvcikgPyBwYXJhbXMuYmFja2dyb3VuZENvbG9yIDogbnVsbDtcblxuICAgIHRoaXMud2lkdGggPSBwYXJhbXMud2lkdGg7XG4gICAgdGhpcy5oZWlnaHQgPSBwYXJhbXMuaGVpZ2h0O1xuICAgIHRoaXMuZ3JpZFggPSBwaGluYS51dGlsLkdyaWQocGFyYW1zLndpZHRoLCAxNik7XG4gICAgdGhpcy5ncmlkWSA9IHBoaW5hLnV0aWwuR3JpZChwYXJhbXMuaGVpZ2h0LCAxNik7XG5cbiAgICB0aGlzLmludGVyYWN0aXZlID0gdHJ1ZTtcbiAgICB0aGlzLnNldEludGVyYWN0aXZlID0gZnVuY3Rpb24oZmxhZykge1xuICAgICAgdGhpcy5pbnRlcmFjdGl2ZSA9IGZsYWc7XG4gICAgfTtcbiAgICB0aGlzLl9vdmVyRmxhZ3MgPSB7fTtcbiAgICB0aGlzLl90b3VjaEZsYWdzID0ge307XG4gIH0pO1xuXG59KTtcbiIsInBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcclxuXHJcbiAgLy8gYXVkaW/opoHntKDjgafpn7Plo7DjgpLlho3nlJ/jgZnjgovjgILkuLvjgatJReeUqFxyXG4gIHBoaW5hLmRlZmluZShcInBoaW5hLmFzc2V0LkRvbUF1ZGlvU291bmRcIiwge1xyXG4gICAgc3VwZXJDbGFzczogXCJwaGluYS5hc3NldC5Bc3NldFwiLFxyXG5cclxuICAgIGRvbUVsZW1lbnQ6IG51bGwsXHJcbiAgICBlbXB0eVNvdW5kOiBmYWxzZSxcclxuXHJcbiAgICBpbml0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5zdXBlckluaXQoKTtcclxuICAgIH0sXHJcblxyXG4gICAgX2xvYWQ6IGZ1bmN0aW9uKHJlc29sdmUpIHtcclxuICAgICAgdGhpcy5kb21FbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImF1ZGlvXCIpO1xyXG4gICAgICBpZiAodGhpcy5kb21FbGVtZW50LmNhblBsYXlUeXBlKFwiYXVkaW8vbXBlZ1wiKSkge1xyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gcmVhZHlzdGF0ZUNoZWNrKCkge1xyXG4gICAgICAgICAgaWYgKHRoaXMuZG9tRWxlbWVudC5yZWFkeVN0YXRlIDwgNCkge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KHJlYWR5c3RhdGVDaGVjay5iaW5kKHRoaXMpLCAxMCk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmVtcHR5U291bmQgPSBmYWxzZTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJlbmQgbG9hZCBcIiwgdGhpcy5zcmMpO1xyXG4gICAgICAgICAgICByZXNvbHZlKHRoaXMpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpLCAxMCk7XHJcbiAgICAgICAgdGhpcy5kb21FbGVtZW50Lm9uZXJyb3IgPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwi44Kq44O844OH44Kj44Kq44Gu44Ot44O844OJ44Gr5aSx5pWXXCIsIGUpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5kb21FbGVtZW50LnNyYyA9IHRoaXMuc3JjO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiYmVnaW4gbG9hZCBcIiwgdGhpcy5zcmMpO1xyXG4gICAgICAgIHRoaXMuZG9tRWxlbWVudC5sb2FkKCk7XHJcbiAgICAgICAgdGhpcy5kb21FbGVtZW50LmF1dG9wbGF5ID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5kb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJlbmRlZFwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHRoaXMuZmxhcmUoXCJlbmRlZFwiKTtcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwibXAz44Gv5YaN55Sf44Gn44GN44G+44Gb44KTXCIpO1xyXG4gICAgICAgIHRoaXMuZW1wdHlTb3VuZCA9IHRydWU7XHJcbiAgICAgICAgcmVzb2x2ZSh0aGlzKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBwbGF5OiBmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKHRoaXMuZW1wdHlTb3VuZCkgcmV0dXJuO1xyXG4gICAgICB0aGlzLmRvbUVsZW1lbnQucGF1c2UoKTtcclxuICAgICAgdGhpcy5kb21FbGVtZW50LmN1cnJlbnRUaW1lID0gMDtcclxuICAgICAgdGhpcy5kb21FbGVtZW50LnBsYXkoKTtcclxuICAgIH0sXHJcblxyXG4gICAgc3RvcDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIGlmICh0aGlzLmVtcHR5U291bmQpIHJldHVybjtcclxuICAgICAgdGhpcy5kb21FbGVtZW50LnBhdXNlKCk7XHJcbiAgICAgIHRoaXMuZG9tRWxlbWVudC5jdXJyZW50VGltZSA9IDA7XHJcbiAgICB9LFxyXG5cclxuICAgIHBhdXNlOiBmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKHRoaXMuZW1wdHlTb3VuZCkgcmV0dXJuO1xyXG4gICAgICB0aGlzLmRvbUVsZW1lbnQucGF1c2UoKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVzdW1lOiBmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKHRoaXMuZW1wdHlTb3VuZCkgcmV0dXJuO1xyXG4gICAgICB0aGlzLmRvbUVsZW1lbnQucGxheSgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXRMb29wOiBmdW5jdGlvbih2KSB7XHJcbiAgICAgIGlmICh0aGlzLmVtcHR5U291bmQpIHJldHVybjtcclxuICAgICAgdGhpcy5kb21FbGVtZW50Lmxvb3AgPSB2O1xyXG4gICAgfSxcclxuXHJcbiAgICBfYWNjZXNzb3I6IHtcclxuICAgICAgdm9sdW1lOiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmICh0aGlzLmVtcHR5U291bmQpIHJldHVybiAwO1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuZG9tRWxlbWVudC52b2x1bWU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgIGlmICh0aGlzLmVtcHR5U291bmQpIHJldHVybjtcclxuICAgICAgICAgIHRoaXMuZG9tRWxlbWVudC52b2x1bWUgPSB2O1xyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIGxvb3A6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgaWYgKHRoaXMuZW1wdHlTb3VuZCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuZG9tRWxlbWVudC5sb29wO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgICBpZiAodGhpcy5lbXB0eVNvdW5kKSByZXR1cm47XHJcbiAgICAgICAgICB0aGlzLnNldExvb3Aodik7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICAvLyBJRTEx44Gu5aC05ZCI44Gu44G/6Z+z5aOw44Ki44K744OD44OI44GvRG9tQXVkaW9Tb3VuZOOBp+WGjeeUn+OBmeOCi1xyXG4gIHZhciB1YSA9IHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCk7XHJcbiAgaWYgKHVhLmluZGV4T2YoJ3RyaWRlbnQvNycpICE9PSAtMSkge1xyXG4gICAgcGhpbmEuYXNzZXQuQXNzZXRMb2FkZXIucmVnaXN0ZXIoXCJzb3VuZFwiLCBmdW5jdGlvbihrZXksIHBhdGgpIHtcclxuICAgICAgdmFyIGFzc2V0ID0gcGhpbmEuYXNzZXQuRG9tQXVkaW9Tb3VuZCgpO1xyXG4gICAgICByZXR1cm4gYXNzZXQubG9hZChwYXRoKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbn0pO1xyXG4iLCJwaGluYS5uYW1lc3BhY2UoKCkgPT4ge1xuXG4gIHBoaW5hLmFwcC5FbGVtZW50LnByb3RvdHlwZS4kbWV0aG9kKFwiZmluZEJ5SWRcIiwgZnVuY3Rpb24oaWQpIHtcbiAgICBpZiAodGhpcy5pZCA9PT0gaWQpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHRoaXMuY2hpbGRyZW5baV0uZmluZEJ5SWQoaWQpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuY2hpbGRyZW5baV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfSk7XG5cbiAgLy/mjIflrprjgZXjgozjgZ/lrZDjgqrjg5bjgrjjgqfjgq/jg4jjgpLmnIDliY3pnaLjgavnp7vli5XjgZnjgotcbiAgcGhpbmEuYXBwLkVsZW1lbnQucHJvdG90eXBlLiRtZXRob2QoXCJtb3ZlRnJvbnRcIiwgZnVuY3Rpb24oY2hpbGQpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLmNoaWxkcmVuW2ldID09IGNoaWxkKSB7XG4gICAgICAgIHRoaXMuY2hpbGRyZW4uc3BsaWNlKGksIDEpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5jaGlsZHJlbi5wdXNoKGNoaWxkKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSk7XG5cbiAgcGhpbmEuYXBwLkVsZW1lbnQucHJvdG90eXBlLiRtZXRob2QoXCJkZXN0cm95Q2hpbGRcIiwgZnVuY3Rpb24oKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLmNoaWxkcmVuW2ldLmZsYXJlKCdkZXN0cm95Jyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9KTtcblxufSk7XG4iLCJwaGluYS5uYW1lc3BhY2UoKCkgPT4ge1xuXG4gIHBoaW5hLmlucHV0LklucHV0LnF1YWxpdHkgPSAxLjA7XG5cbiAgcGhpbmEuaW5wdXQuSW5wdXQucHJvdG90eXBlLiRtZXRob2QoXCJfbW92ZVwiLCBmdW5jdGlvbih4LCB5KSB7XG4gICAgdGhpcy5fdGVtcFBvc2l0aW9uLnggPSB4O1xuICAgIHRoaXMuX3RlbXBQb3NpdGlvbi55ID0geTtcblxuICAgIC8vIGFkanVzdCBzY2FsZVxuICAgIHZhciBlbG0gPSB0aGlzLmRvbUVsZW1lbnQ7XG4gICAgdmFyIHJlY3QgPSBlbG0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICB2YXIgdyA9IGVsbS53aWR0aCAvIHBoaW5hLmlucHV0LklucHV0LnF1YWxpdHk7XG4gICAgdmFyIGggPSBlbG0uaGVpZ2h0IC8gcGhpbmEuaW5wdXQuSW5wdXQucXVhbGl0eTtcblxuICAgIGlmIChyZWN0LndpZHRoKSB7XG4gICAgICB0aGlzLl90ZW1wUG9zaXRpb24ueCAqPSB3IC8gcmVjdC53aWR0aDtcbiAgICB9XG5cbiAgICBpZiAocmVjdC5oZWlnaHQpIHtcbiAgICAgIHRoaXMuX3RlbXBQb3NpdGlvbi55ICo9IGggLyByZWN0LmhlaWdodDtcbiAgICB9XG5cbiAgfSk7XG5cbn0pO1xuIiwicGhpbmEubmFtZXNwYWNlKCgpID0+IHtcbiAgcGhpbmEuZGlzcGxheS5MYWJlbC5wcm90b3R5cGUuJG1ldGhvZChcImluaXRcIiwgZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIGlmICh0eXBlb2YgYXJndW1lbnRzWzBdICE9PSAnb2JqZWN0Jykge1xuICAgICAgb3B0aW9ucyA9IHsgdGV4dDogYXJndW1lbnRzWzBdLCB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBvcHRpb25zID0gYXJndW1lbnRzWzBdO1xuICAgIH1cblxuICAgIG9wdGlvbnMgPSAoe30pLiRzYWZlKG9wdGlvbnMsIHBoaW5hLmRpc3BsYXkuTGFiZWwuZGVmYXVsdHMpO1xuICAgIHRoaXMuc3VwZXJJbml0KG9wdGlvbnMpO1xuXG4gICAgdGhpcy50ZXh0ID0gKG9wdGlvbnMudGV4dCkgPyBvcHRpb25zLnRleHQgOiBcIlwiO1xuICAgIHRoaXMuZm9udFNpemUgPSBvcHRpb25zLmZvbnRTaXplO1xuICAgIHRoaXMuZm9udFdlaWdodCA9IG9wdGlvbnMuZm9udFdlaWdodDtcbiAgICB0aGlzLmZvbnRGYW1pbHkgPSBvcHRpb25zLmZvbnRGYW1pbHk7XG4gICAgdGhpcy5hbGlnbiA9IG9wdGlvbnMuYWxpZ247XG4gICAgdGhpcy5iYXNlbGluZSA9IG9wdGlvbnMuYmFzZWxpbmU7XG4gICAgdGhpcy5saW5lSGVpZ2h0ID0gb3B0aW9ucy5saW5lSGVpZ2h0O1xuICB9KTtcblxufSk7XG4iLCJwaGluYS5uYW1lc3BhY2UoKCkgPT4ge1xuICBwaGluYS5pbnB1dC5Nb3VzZS5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKGRvbUVsZW1lbnQpIHtcbiAgICB0aGlzLnN1cGVySW5pdChkb21FbGVtZW50KTtcblxuICAgIHRoaXMuaWQgPSAwO1xuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMuZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBmdW5jdGlvbihlKSB7XG4gICAgICBzZWxmLl9zdGFydChlLnBvaW50WCwgZS5wb2ludFksIDEgPDwgZS5idXR0b24pO1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9KTtcblxuICAgIHRoaXMuZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgZnVuY3Rpb24oZSkge1xuICAgICAgc2VsZi5fZW5kKDEgPDwgZS5idXR0b24pO1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9KTtcbiAgICB0aGlzLmRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgZnVuY3Rpb24oZSkge1xuICAgICAgc2VsZi5fbW92ZShlLnBvaW50WCwgZS5wb2ludFkpO1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9KTtcblxuICAgIC8vIOODnuOCpuOCueOBjOOCreODo+ODs+ODkOOCueimgee0oOOBruWkluOBq+WHuuOBn+WgtOWQiOOBruWvvuW/nFxuICAgIHRoaXMuZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW91dCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHNlbGYuX2VuZCgxKTtcbiAgICB9KTtcbiAgfVxufSk7XG4iLCIvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyAgRXh0ZW5zaW9uIHBoaW5hLmFwcC5PYmplY3QyRFxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5waGluYS5uYW1lc3BhY2UoKCkgPT4ge1xuICBwaGluYS5hcHAuT2JqZWN0MkQucHJvdG90eXBlLiRtZXRob2QoXCJzZXRPcmlnaW5cIiwgZnVuY3Rpb24oeCwgeSwgcmVwb3NpdGlvbikge1xuICAgIGlmICghcmVwb3NpdGlvbikge1xuICAgICAgdGhpcy5vcmlnaW4ueCA9IHg7XG4gICAgICB0aGlzLm9yaWdpbi55ID0geTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8v5aSJ5pu044GV44KM44Gf5Z+65rqW54K544Gr56e75YuV44GV44Gb44KLXG4gICAgY29uc3QgX29yaWdpblggPSB0aGlzLm9yaWdpblg7XG4gICAgY29uc3QgX29yaWdpblkgPSB0aGlzLm9yaWdpblk7XG4gICAgY29uc3QgX2FkZFggPSAoeCAtIF9vcmlnaW5YKSAqIHRoaXMud2lkdGg7XG4gICAgY29uc3QgX2FkZFkgPSAoeSAtIF9vcmlnaW5ZKSAqIHRoaXMuaGVpZ2h0O1xuXG4gICAgdGhpcy54ICs9IF9hZGRYO1xuICAgIHRoaXMueSArPSBfYWRkWTtcbiAgICB0aGlzLm9yaWdpblggPSB4O1xuICAgIHRoaXMub3JpZ2luWSA9IHk7XG5cbiAgICB0aGlzLmNoaWxkcmVuLmZvckVhY2goY2hpbGQgPT4ge1xuICAgICAgY2hpbGQueCAtPSBfYWRkWDtcbiAgICAgIGNoaWxkLnkgLT0gX2FkZFk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0pO1xuXG4gIHBoaW5hLmFwcC5PYmplY3QyRC5wcm90b3R5cGUuJG1ldGhvZChcImhpdFRlc3RFbGVtZW50XCIsIGZ1bmN0aW9uKGVsbSkge1xuICAgIGNvbnN0IHJlY3QwID0gdGhpcy5jYWxjR2xvYmFsUmVjdCgpO1xuICAgIGNvbnN0IHJlY3QxID0gZWxtLmNhbGNHbG9iYWxSZWN0KCk7XG4gICAgcmV0dXJuIChyZWN0MC5sZWZ0IDwgcmVjdDEucmlnaHQpICYmIChyZWN0MC5yaWdodCA+IHJlY3QxLmxlZnQpICYmXG4gICAgICAocmVjdDAudG9wIDwgcmVjdDEuYm90dG9tKSAmJiAocmVjdDAuYm90dG9tID4gcmVjdDEudG9wKTtcbiAgfSk7XG5cbiAgcGhpbmEuYXBwLk9iamVjdDJELnByb3RvdHlwZS4kbWV0aG9kKFwiY2FsY0dsb2JhbFJlY3RcIiwgZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgbGVmdCA9IHRoaXMuX3dvcmxkTWF0cml4Lm0wMiAtIHRoaXMub3JpZ2luWCAqIHRoaXMud2lkdGg7XG4gICAgY29uc3QgdG9wID0gdGhpcy5fd29ybGRNYXRyaXgubTEyIC0gdGhpcy5vcmlnaW5ZICogdGhpcy5oZWlnaHQ7XG4gICAgcmV0dXJuIFJlY3QobGVmdCwgdG9wLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gIH0pO1xuXG4gIHBoaW5hLmFwcC5PYmplY3QyRC5wcm90b3R5cGUuJG1ldGhvZChcImNhbGNHbG9iYWxSZWN0XCIsIGZ1bmN0aW9uKCkge1xuICAgIGNvbnN0IGxlZnQgPSB0aGlzLl93b3JsZE1hdHJpeC5tMDIgLSB0aGlzLm9yaWdpblggKiB0aGlzLndpZHRoO1xuICAgIGNvbnN0IHRvcCA9IHRoaXMuX3dvcmxkTWF0cml4Lm0xMiAtIHRoaXMub3JpZ2luWSAqIHRoaXMuaGVpZ2h0O1xuICAgIHJldHVybiBSZWN0KGxlZnQsIHRvcCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICB9KTtcblxufSk7XG4iLCJwaGluYS5uYW1lc3BhY2UoZnVuY3Rpb24oKSB7XG5cbiAgcGhpbmEuZGlzcGxheS5QbGFpbkVsZW1lbnQucHJvdG90eXBlLiRtZXRob2QoXCJkZXN0cm95Q2FudmFzXCIsIGZ1bmN0aW9uKCkge1xuICAgIGlmICghdGhpcy5jYW52YXMpIHJldHVybjtcbiAgICB0aGlzLmNhbnZhcy5kZXN0cm95KCk7XG4gICAgZGVsZXRlIHRoaXMuY2FudmFzO1xuICB9KTtcblxufSk7XG4iLCIvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyAgRXh0ZW5zaW9uIHBoaW5hLmRpc3BsYXkuU2hhcGVcbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnBoaW5hLmRpc3BsYXkuU2hhcGUucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKGNhbnZhcykge1xuICBpZiAoIWNhbnZhcykge1xuICAgIGNvbnNvbGUubG9nKFwiY2FudmFzIG51bGxcIik7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBjb250ZXh0ID0gY2FudmFzLmNvbnRleHQ7XG4gIC8vIOODquOCteOCpOOCulxuICB2YXIgc2l6ZSA9IHRoaXMuY2FsY0NhbnZhc1NpemUoKTtcbiAgY2FudmFzLnNldFNpemUoc2l6ZS53aWR0aCwgc2l6ZS5oZWlnaHQpO1xuICAvLyDjgq/jg6rjgqLjgqvjg6njg7xcbiAgY2FudmFzLmNsZWFyQ29sb3IodGhpcy5iYWNrZ3JvdW5kQ29sb3IpO1xuICAvLyDkuK3lv4PjgavluqfmqJnjgpLnp7vli5VcbiAgY2FudmFzLnRyYW5zZm9ybUNlbnRlcigpO1xuXG4gIC8vIOaPj+eUu+WJjeWHpueQhlxuICB0aGlzLnByZXJlbmRlcih0aGlzLmNhbnZhcyk7XG5cbiAgLy8g44K544OI44Ot44O844Kv5o+P55S7XG4gIGlmICh0aGlzLmlzU3Ryb2thYmxlKCkpIHtcbiAgICBjb250ZXh0LnN0cm9rZVN0eWxlID0gdGhpcy5zdHJva2U7XG4gICAgY29udGV4dC5saW5lV2lkdGggPSB0aGlzLnN0cm9rZVdpZHRoO1xuICAgIGNvbnRleHQubGluZUpvaW4gPSBcInJvdW5kXCI7XG4gICAgY29udGV4dC5zaGFkb3dCbHVyID0gMDtcbiAgICB0aGlzLnJlbmRlclN0cm9rZShjYW52YXMpO1xuICB9XG5cbiAgLy8g5aGX44KK44Gk44G244GX5o+P55S7XG4gIGlmICh0aGlzLmZpbGwpIHtcbiAgICBjb250ZXh0LmZpbGxTdHlsZSA9IHRoaXMuZmlsbDtcbiAgICAvLyBzaGFkb3cg44GuIG9uL29mZlxuICAgIGlmICh0aGlzLnNoYWRvdykge1xuICAgICAgY29udGV4dC5zaGFkb3dDb2xvciA9IHRoaXMuc2hhZG93O1xuICAgICAgY29udGV4dC5zaGFkb3dCbHVyID0gdGhpcy5zaGFkb3dCbHVyO1xuICAgICAgY29udGV4dC5zaGFkb3dPZmZzZXRYID0gdGhpcy5zaGFkb3dPZmZzZXRYIHx8IDA7XG4gICAgICBjb250ZXh0LnNoYWRvd09mZnNldFkgPSB0aGlzLnNoYWRvd09mZnNldFkgfHwgMDtcbiAgICB9IGVsc2Uge1xuICAgICAgY29udGV4dC5zaGFkb3dCbHVyID0gMDtcbiAgICB9XG4gICAgdGhpcy5yZW5kZXJGaWxsKGNhbnZhcyk7XG4gIH1cblxuICAvLyDmj4/nlLvlvozlh6bnkIZcbiAgdGhpcy5wb3N0cmVuZGVyKHRoaXMuY2FudmFzKTtcblxuICByZXR1cm4gdGhpcztcbn07XG4iLCJwaGluYS5uYW1lc3BhY2UoZnVuY3Rpb24oKSB7XG5cbiAgcGhpbmEuYXNzZXQuU291bmQucHJvdG90eXBlLiRtZXRob2QoXCJfbG9hZFwiLCBmdW5jdGlvbihyZXNvbHZlKSB7XG4gICAgaWYgKC9eZGF0YTovLnRlc3QodGhpcy5zcmMpKSB7XG4gICAgICB0aGlzLl9sb2FkRnJvbVVSSVNjaGVtZShyZXNvbHZlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fbG9hZEZyb21GaWxlKHJlc29sdmUpO1xuICAgIH1cbiAgfSk7XG5cbiAgcGhpbmEuYXNzZXQuU291bmQucHJvdG90eXBlLiRtZXRob2QoXCJfbG9hZEZyb21GaWxlXCIsIGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLnNyYyk7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciB4bWwgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICB4bWwub3BlbignR0VUJywgdGhpcy5zcmMpO1xuICAgIHhtbC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh4bWwucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICBpZiAoWzIwMCwgMjAxLCAwXS5pbmRleE9mKHhtbC5zdGF0dXMpICE9PSAtMSkge1xuICAgICAgICAgIC8vIOmfs+alveODkOOCpOODiuODquODvOODh+ODvOOCv1xuICAgICAgICAgIHZhciBkYXRhID0geG1sLnJlc3BvbnNlO1xuICAgICAgICAgIC8vIHdlYmF1ZGlvIOeUqOOBq+WkieaPm1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgICAgc2VsZi5jb250ZXh0LmRlY29kZUF1ZGlvRGF0YShkYXRhLCBmdW5jdGlvbihidWZmZXIpIHtcbiAgICAgICAgICAgIHNlbGYubG9hZEZyb21CdWZmZXIoYnVmZmVyKTtcbiAgICAgICAgICAgIHJlc29sdmUoc2VsZik7XG4gICAgICAgICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCLpn7Plo7Djg5XjgqHjgqTjg6vjga7jg4fjgrPjg7zjg4njgavlpLHmlZfjgZfjgb7jgZfjgZ/jgIIoXCIgKyBzZWxmLnNyYyArIFwiKVwiKTtcbiAgICAgICAgICAgIHJlc29sdmUoc2VsZik7XG4gICAgICAgICAgICBzZWxmLmZsYXJlKCdkZWNvZGVlcnJvcicpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHhtbC5zdGF0dXMgPT09IDQwNCkge1xuICAgICAgICAgIC8vIG5vdCBmb3VuZFxuICAgICAgICAgIHNlbGYubG9hZEVycm9yID0gdHJ1ZTtcbiAgICAgICAgICBzZWxmLm5vdEZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICByZXNvbHZlKHNlbGYpO1xuICAgICAgICAgIHNlbGYuZmxhcmUoJ2xvYWRlcnJvcicpO1xuICAgICAgICAgIHNlbGYuZmxhcmUoJ25vdGZvdW5kJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8g44K144O844OQ44O844Ko44Op44O8XG4gICAgICAgICAgc2VsZi5sb2FkRXJyb3IgPSB0cnVlO1xuICAgICAgICAgIHNlbGYuc2VydmVyRXJyb3IgPSB0cnVlO1xuICAgICAgICAgIHJlc29sdmUoc2VsZik7XG4gICAgICAgICAgc2VsZi5mbGFyZSgnbG9hZGVycm9yJyk7XG4gICAgICAgICAgc2VsZi5mbGFyZSgnc2VydmVyZXJyb3InKTtcbiAgICAgICAgfVxuICAgICAgICB4bWwub25yZWFkeXN0YXRlY2hhbmdlID0gbnVsbDtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgeG1sLnJlc3BvbnNlVHlwZSA9ICdhcnJheWJ1ZmZlcic7XG5cbiAgICB4bWwuc2VuZChudWxsKTtcbiAgfSk7XG5cbiAgcGhpbmEuYXNzZXQuU291bmQucHJvdG90eXBlLiRtZXRob2QoXCJwbGF5XCIsIGZ1bmN0aW9uKHdoZW4sIG9mZnNldCwgZHVyYXRpb24pIHtcbiAgICB3aGVuID0gd2hlbiA/IHdoZW4gKyB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgOiAwO1xuICAgIG9mZnNldCA9IG9mZnNldCB8fCAwO1xuXG4gICAgdmFyIHNvdXJjZSA9IHRoaXMuc291cmNlID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xuICAgIHZhciBidWZmZXIgPSBzb3VyY2UuYnVmZmVyID0gdGhpcy5idWZmZXI7XG4gICAgc291cmNlLmxvb3AgPSB0aGlzLl9sb29wO1xuICAgIHNvdXJjZS5sb29wU3RhcnQgPSB0aGlzLl9sb29wU3RhcnQ7XG4gICAgc291cmNlLmxvb3BFbmQgPSB0aGlzLl9sb29wRW5kO1xuICAgIHNvdXJjZS5wbGF5YmFja1JhdGUudmFsdWUgPSB0aGlzLl9wbGF5YmFja1JhdGU7XG5cbiAgICAvLyBjb25uZWN0XG4gICAgc291cmNlLmNvbm5lY3QodGhpcy5nYWluTm9kZSk7XG4gICAgdGhpcy5nYWluTm9kZS5jb25uZWN0KHBoaW5hLmFzc2V0LlNvdW5kLmdldE1hc3RlckdhaW4oKSk7XG4gICAgLy8gcGxheVxuICAgIGlmIChkdXJhdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBzb3VyY2Uuc3RhcnQod2hlbiwgb2Zmc2V0LCBkdXJhdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNvdXJjZS5zdGFydCh3aGVuLCBvZmZzZXQpO1xuICAgIH1cblxuICAgIHNvdXJjZS5vbmVuZGVkID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIXNvdXJjZSkge1xuICAgICAgICB0aGlzLmZsYXJlKCdlbmRlZCcpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzb3VyY2Uub25lbmRlZCA9IG51bGw7XG4gICAgICBzb3VyY2UuZGlzY29ubmVjdCgpO1xuICAgICAgc291cmNlLmJ1ZmZlciA9IG51bGw7XG4gICAgICBzb3VyY2UgPSBudWxsO1xuICAgICAgdGhpcy5mbGFyZSgnZW5kZWQnKTtcbiAgICB9LmJpbmQodGhpcyk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSk7XG5cbiAgcGhpbmEuYXNzZXQuU291bmQucHJvdG90eXBlLiRtZXRob2QoXCJzdG9wXCIsIGZ1bmN0aW9uKCkge1xuICAgIC8vIHN0b3BcbiAgICBpZiAodGhpcy5zb3VyY2UpIHtcbiAgICAgIC8vIHN0b3Ag44GZ44KL44GoIHNvdXJjZS5lbmRlZOOCgueZuueBq+OBmeOCi1xuICAgICAgdGhpcy5zb3VyY2Uuc3RvcCAmJiB0aGlzLnNvdXJjZS5zdG9wKDApO1xuICAgICAgdGhpcy5mbGFyZSgnc3RvcCcpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9KTtcblxufSk7XG4iLCIvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyAgRXh0ZW5zaW9uIHBoaW5hLmFzc2V0LlNvdW5kTWFuYWdlclxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuU291bmRNYW5hZ2VyLiRtZXRob2QoXCJnZXRWb2x1bWVcIiwgZnVuY3Rpb24oKSB7XG4gIHJldHVybiAhdGhpcy5pc011dGUoKSA/IHRoaXMudm9sdW1lIDogMDtcbn0pO1xuXG5Tb3VuZE1hbmFnZXIuJG1ldGhvZChcImdldFZvbHVtZU11c2ljXCIsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4gIXRoaXMuaXNNdXRlKCkgPyB0aGlzLm11c2ljVm9sdW1lIDogMDtcbn0pO1xuXG5Tb3VuZE1hbmFnZXIuJG1ldGhvZChcInNldFZvbHVtZU11c2ljXCIsIGZ1bmN0aW9uKHZvbHVtZSkge1xuICB0aGlzLm11c2ljVm9sdW1lID0gdm9sdW1lO1xuICBpZiAoIXRoaXMuaXNNdXRlKCkgJiYgdGhpcy5jdXJyZW50TXVzaWMpIHtcbiAgICB0aGlzLmN1cnJlbnRNdXNpYy52b2x1bWUgPSB2b2x1bWU7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59KTtcblxuU291bmRNYW5hZ2VyLiRtZXRob2QoXCJwbGF5TXVzaWNcIiwgZnVuY3Rpb24obmFtZSwgZmFkZVRpbWUsIGxvb3AsIHdoZW4sIG9mZnNldCwgZHVyYXRpb24pIHtcbiAgLy8gY29uc3QgcmVzID0gcGhpbmEuY2hlY2tCcm93c2VyKCk7XG4gIC8vIGlmIChyZXMuaXNJZTExKSByZXR1cm4gbnVsbDtcblxuICBsb29wID0gKGxvb3AgIT09IHVuZGVmaW5lZCkgPyBsb29wIDogdHJ1ZTtcblxuICBpZiAodGhpcy5jdXJyZW50TXVzaWMpIHtcbiAgICB0aGlzLnN0b3BNdXNpYyhmYWRlVGltZSk7XG4gIH1cblxuICB2YXIgbXVzaWMgPSBudWxsO1xuICBpZiAobmFtZSBpbnN0YW5jZW9mIHBoaW5hLmFzc2V0LlNvdW5kIHx8IG5hbWUgaW5zdGFuY2VvZiBwaGluYS5hc3NldC5Eb21BdWRpb1NvdW5kKSB7XG4gICAgbXVzaWMgPSBuYW1lO1xuICB9IGVsc2Uge1xuICAgIG11c2ljID0gcGhpbmEuYXNzZXQuQXNzZXRNYW5hZ2VyLmdldCgnc291bmQnLCBuYW1lKTtcbiAgfVxuXG4gIGlmICghbXVzaWMpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiU291bmQgbm90IGZvdW5kOiBcIiwgbmFtZSk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBtdXNpYy5zZXRMb29wKGxvb3ApO1xuICBtdXNpYy5wbGF5KHdoZW4sIG9mZnNldCwgZHVyYXRpb24pO1xuXG4gIGlmIChmYWRlVGltZSA+IDApIHtcbiAgICB2YXIgY291bnQgPSAzMjtcbiAgICB2YXIgY291bnRlciA9IDA7XG4gICAgdmFyIHVuaXRUaW1lID0gZmFkZVRpbWUgLyBjb3VudDtcbiAgICB2YXIgdm9sdW1lID0gdGhpcy5nZXRWb2x1bWVNdXNpYygpO1xuXG4gICAgbXVzaWMudm9sdW1lID0gMDtcbiAgICB2YXIgaWQgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgIGNvdW50ZXIgKz0gMTtcbiAgICAgIHZhciByYXRlID0gY291bnRlciAvIGNvdW50O1xuICAgICAgbXVzaWMudm9sdW1lID0gcmF0ZSAqIHZvbHVtZTtcblxuICAgICAgaWYgKHJhdGUgPj0gMSkge1xuICAgICAgICBjbGVhckludGVydmFsKGlkKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LCB1bml0VGltZSk7XG4gIH0gZWxzZSB7XG4gICAgbXVzaWMudm9sdW1lID0gdGhpcy5nZXRWb2x1bWVNdXNpYygpO1xuICB9XG5cbiAgdGhpcy5jdXJyZW50TXVzaWMgPSBtdXNpYztcblxuICByZXR1cm4gdGhpcy5jdXJyZW50TXVzaWM7XG59KTtcblxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8g44Oc44Kk44K555So44Gu6Z+z6YeP6Kit5a6a44CB5YaN55Sf44Oh44K944OD44OJ5ouh5by1XG5Tb3VuZE1hbmFnZXIuJG1ldGhvZChcImdldFZvbHVtZVZvaWNlXCIsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4gIXRoaXMuaXNNdXRlKCkgPyB0aGlzLnZvaWNlVm9sdW1lIDogMDtcbn0pO1xuXG5Tb3VuZE1hbmFnZXIuJG1ldGhvZChcInNldFZvbHVtZVZvaWNlXCIsIGZ1bmN0aW9uKHZvbHVtZSkge1xuICB0aGlzLnZvaWNlVm9sdW1lID0gdm9sdW1lO1xuICByZXR1cm4gdGhpcztcbn0pO1xuXG5Tb3VuZE1hbmFnZXIuJG1ldGhvZChcInBsYXlWb2ljZVwiLCBmdW5jdGlvbihuYW1lKSB7XG4gIHZhciBzb3VuZCA9IHBoaW5hLmFzc2V0LkFzc2V0TWFuYWdlci5nZXQoJ3NvdW5kJywgbmFtZSk7XG4gIHNvdW5kLnZvbHVtZSA9IHRoaXMuZ2V0Vm9sdW1lVm9pY2UoKTtcbiAgc291bmQucGxheSgpO1xuICByZXR1cm4gc291bmQ7XG59KTtcbiIsIi8v44K544OX44Op44Kk44OI5qmf6IO95ouh5by1XG5waGluYS5uYW1lc3BhY2UoZnVuY3Rpb24oKSB7XG5cbiAgcGhpbmEuZGlzcGxheS5TcHJpdGUucHJvdG90eXBlLnNldEZyYW1lVHJpbW1pbmcgPSBmdW5jdGlvbih4LCB5LCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgdGhpcy5fZnJhbWVUcmltWCA9IHggfHwgMDtcbiAgICB0aGlzLl9mcmFtZVRyaW1ZID0geSB8fCAwO1xuICAgIHRoaXMuX2ZyYW1lVHJpbVdpZHRoID0gd2lkdGggfHwgdGhpcy5pbWFnZS5kb21FbGVtZW50LndpZHRoIC0gdGhpcy5fZnJhbWVUcmltWDtcbiAgICB0aGlzLl9mcmFtZVRyaW1IZWlnaHQgPSBoZWlnaHQgfHwgdGhpcy5pbWFnZS5kb21FbGVtZW50LmhlaWdodCAtIHRoaXMuX2ZyYW1lVHJpbVk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBwaGluYS5kaXNwbGF5LlNwcml0ZS5wcm90b3R5cGUuc2V0RnJhbWVJbmRleCA9IGZ1bmN0aW9uKGluZGV4LCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgdmFyIHN4ID0gdGhpcy5fZnJhbWVUcmltWCB8fCAwO1xuICAgIHZhciBzeSA9IHRoaXMuX2ZyYW1lVHJpbVkgfHwgMDtcbiAgICB2YXIgc3cgPSB0aGlzLl9mcmFtZVRyaW1XaWR0aCAgfHwgKHRoaXMuaW1hZ2UuZG9tRWxlbWVudC53aWR0aC1zeCk7XG4gICAgdmFyIHNoID0gdGhpcy5fZnJhbWVUcmltSGVpZ2h0IHx8ICh0aGlzLmltYWdlLmRvbUVsZW1lbnQuaGVpZ2h0LXN5KTtcblxuICAgIHZhciB0dyAgPSB3aWR0aCB8fCB0aGlzLndpZHRoOyAgICAgIC8vIHR3XG4gICAgdmFyIHRoICA9IGhlaWdodCB8fCB0aGlzLmhlaWdodDsgICAgLy8gdGhcbiAgICB2YXIgcm93ID0gfn4oc3cgLyB0dyk7XG4gICAgdmFyIGNvbCA9IH5+KHNoIC8gdGgpO1xuICAgIHZhciBtYXhJbmRleCA9IHJvdypjb2w7XG4gICAgaW5kZXggPSBpbmRleCVtYXhJbmRleDtcblxuICAgIHZhciB4ICAgPSBpbmRleCVyb3c7XG4gICAgdmFyIHkgICA9IH5+KGluZGV4L3Jvdyk7XG4gICAgdGhpcy5zcmNSZWN0LnggPSBzeCt4KnR3O1xuICAgIHRoaXMuc3JjUmVjdC55ID0gc3kreSp0aDtcbiAgICB0aGlzLnNyY1JlY3Qud2lkdGggID0gdHc7XG4gICAgdGhpcy5zcmNSZWN0LmhlaWdodCA9IHRoO1xuXG4gICAgdGhpcy5fZnJhbWVJbmRleCA9IGluZGV4O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxufSk7IiwicGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuICAvLyDmloflrZfliJfjgYvjgonmlbDlgKTjgpLmir3lh7rjgZnjgotcbiAgLy8g44Os44Kk44Ki44Km44OI44OV44Kh44Kk44Or44GL44KJ5L2c5qWt44GZ44KL5aC05ZCI44Gr5Yip55So44GX44Gf44GP44Gq44KLXG4gIC8vIGhvZ2VfMCBob2dlXzHjgarjganjgYvjgonmlbDlrZfjgaDjgZHmir3lh7pcbiAgLy8gMDEwMF9ob2dlXzk5OTkgPT4gW1wiMDEwMFwiICwgXCI5OTk5XCJd44Gr44Gq44KLXG4gIC8vIGhvZ2UwLjDjgajjgYvjga/jganjgYbjgZnjgYvjgarvvJ9cbiAgLy8g5oq95Ye65b6M44GrcGFyc2VJbnTjgZnjgovjgYvjga/mpJzoqI7kuK1cbiAgU3RyaW5nLnByb3RvdHlwZS4kbWV0aG9kKFwibWF0Y2hJbnRcIiwgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMubWF0Y2goL1swLTldKy9nKTtcbiAgfSk7XG59KTtcbiIsInBoaW5hLm5hbWVzcGFjZShmdW5jdGlvbigpIHtcblxuICBwaGluYS5hc3NldC5UZXh0dXJlLnByb3RvdHlwZS4kbWV0aG9kKFwiX2xvYWRcIiwgZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgIHRoaXMuZG9tRWxlbWVudCA9IG5ldyBJbWFnZSgpO1xuXG4gICAgdmFyIGlzTG9jYWwgPSAobG9jYXRpb24ucHJvdG9jb2wgPT0gJ2ZpbGU6Jyk7XG4gICAgaWYgKCEoL15kYXRhOi8udGVzdCh0aGlzLnNyYykpKSB7XG4gICAgICB0aGlzLmRvbUVsZW1lbnQuY3Jvc3NPcmlnaW4gPSAnYW5vbnltb3VzJzsgLy8g44Kv44Ot44K544Kq44Oq44K444Oz6Kej6ZmkXG4gICAgfVxuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMuZG9tRWxlbWVudC5vbmxvYWQgPSBmdW5jdGlvbihlKSB7XG4gICAgICBzZWxmLmxvYWRlZCA9IHRydWU7XG4gICAgICBlLnRhcmdldC5vbmxvYWQgPSBudWxsO1xuICAgICAgZS50YXJnZXQub25lcnJvciA9IG51bGw7XG4gICAgICByZXNvbHZlKHNlbGYpO1xuICAgIH07XG5cbiAgICB0aGlzLmRvbUVsZW1lbnQub25lcnJvciA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGUudGFyZ2V0Lm9ubG9hZCA9IG51bGw7XG4gICAgICBlLnRhcmdldC5vbmVycm9yID0gbnVsbDtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJwaGluYS5hc3NldC5UZXh0dXJlIF9sb2FkIG9uRXJyb3IgXCIsIHRoaXMuc3JjKTtcbiAgICB9O1xuXG4gICAgdGhpcy5kb21FbGVtZW50LnNyYyA9IHRoaXMuc3JjO1xuICB9KTtcblxufSk7XG4iLCJwaGluYS5uYW1lc3BhY2UoZnVuY3Rpb24oKSB7XG5cbiAgcGhpbmEuYWNjZXNzb3J5LlR3ZWVuZXIucHJvdG90eXBlLiRtZXRob2QoXCJfdXBkYXRlVHdlZW5cIiwgZnVuY3Rpb24oYXBwKSB7XG4gICAgLy/igLvjgZPjgozjgarjgYTjgahwYXVzZeOBjOOBhuOBlOOBi+OBquOBhFxuICAgIGlmICghdGhpcy5wbGF5aW5nKSByZXR1cm47XG5cbiAgICB2YXIgdHdlZW4gPSB0aGlzLl90d2VlbjtcbiAgICB2YXIgdGltZSA9IHRoaXMuX2dldFVuaXRUaW1lKGFwcCk7XG5cbiAgICB0d2Vlbi5mb3J3YXJkKHRpbWUpO1xuICAgIHRoaXMuZmxhcmUoJ3R3ZWVuJyk7XG5cbiAgICBpZiAodHdlZW4udGltZSA+PSB0d2Vlbi5kdXJhdGlvbikge1xuICAgICAgZGVsZXRlIHRoaXMuX3R3ZWVuO1xuICAgICAgdGhpcy5fdHdlZW4gPSBudWxsO1xuICAgICAgdGhpcy5fdXBkYXRlID0gdGhpcy5fdXBkYXRlVGFzaztcbiAgICB9XG4gIH0pO1xuXG4gIHBoaW5hLmFjY2Vzc29yeS5Ud2VlbmVyLnByb3RvdHlwZS4kbWV0aG9kKFwiX3VwZGF0ZVdhaXRcIiwgZnVuY3Rpb24oYXBwKSB7XG4gICAgLy/igLvjgZPjgozjgarjgYTjgahwYXVzZeOBjOOBhuOBlOOBi+OBquOBhFxuICAgIGlmICghdGhpcy5wbGF5aW5nKSByZXR1cm47XG5cbiAgICB2YXIgd2FpdCA9IHRoaXMuX3dhaXQ7XG4gICAgdmFyIHRpbWUgPSB0aGlzLl9nZXRVbml0VGltZShhcHApO1xuICAgIHdhaXQudGltZSArPSB0aW1lO1xuXG4gICAgaWYgKHdhaXQudGltZSA+PSB3YWl0LmxpbWl0KSB7XG4gICAgICBkZWxldGUgdGhpcy5fd2FpdDtcbiAgICAgIHRoaXMuX3dhaXQgPSBudWxsO1xuICAgICAgdGhpcy5fdXBkYXRlID0gdGhpcy5fdXBkYXRlVGFzaztcbiAgICB9XG4gIH0pO1xuXG59KTtcbiIsIi8vXG4vLyDln7rnpI7jgrfjg7zjg7Pjgq/jg6njgrlcbi8vXG5waGluYS5kZWZpbmUoXCJCYXNlU2NlbmVcIiwge1xuICBzdXBlckNsYXNzOiBcIkRpc3BsYXlTY2VuZVwiLFxuXG4gIGZvb3RlcjogbnVsbCxcblxuICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgLy8gY29uc29sZS5sb2coXCIjQmFzZVNjZW5lXCIgLCBcImluaXRcIik7XG5cbiAgICB0aGlzLnN1cGVySW5pdCgpO1xuICAgIHRoaXMuYmFja2dyb3VuZENvbG9yID0gXCJ3aGl0ZVwiO1xuXG4gICAgaWYgKCFwaGluYS5pc01vYmlsZSgpKSB0aGlzLm9uKFwiZW50ZXJmcmFtZVwiLCAoZSkgPT4gdGhpcy5mbGFyZShcIm1vdXNlbW92ZVwiLCB7IGFwcDogZS5hcHAgfSkpO1xuXG4gICAgdGhpcy5vbmUoJ2Rlc3Ryb3knLCAoKSA9PiB0aGlzLmNhbnZhcy5kZXN0cm95KCkpO1xuICB9LFxuXG4gIG9uZW50ZXI6IGZ1bmN0aW9uKGUpIHtcbiAgICAvLyBjb25zb2xlLmxvZyhcIiNCYXNlU2NlbmVcIiAsIFwib25lbnRlclwiKTtcbiAgICB0aGlzLl9wbGF5QmdtKCk7XG4gICAgdGhpcy5fc2V0dXBGb290ZXIoKTtcbiAgICB0aGlzLmZsYXJlKFwicmVhZHlcIiwgeyBhcHA6IGUuYXBwIH0pO1xuICAgIHRoaXMuX2FkZEZvb3RlcigpO1xuICB9LFxuXG4gIC8v44K344O844Oz6ZaL5aeL44Ko44OV44Kn44Kv44OIIFxuICBiZWdpbjogZnVuY3Rpb24odHlwZSwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSAoe30pLiRzYWZlKG9wdGlvbnMsIHtcbiAgICAgIGNvbG9yOiBcIndoaXRlXCIsXG4gICAgICB0aW1lOiAxMDBcbiAgICB9KTtcbiAgICBjb25zdCBlZmZlY3QgPSB0aGlzLl9zZXR1cCh0eXBlLCBvcHRpb25zKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgIC50aGVuKGVmZmVjdC5iZWdpbigpKVxuICB9LFxuXG4gIC8v44K344O844Oz57WC5LqG44Ko44OV44Kn44Kv44OIXG4gIGZpbmlzaDogZnVuY3Rpb24odHlwZSwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSAoe30pLiRzYWZlKG9wdGlvbnMsIHtcbiAgICAgIGNvbG9yOiBcIndoaXRlXCIsXG4gICAgICB0aW1lOiAxMDBcbiAgICB9KTtcbiAgICBjb25zdCBlZmZlY3QgPSB0aGlzLl9zZXR1cCh0eXBlLCBvcHRpb25zKTtcbiAgICByZXR1cm4gZWZmZWN0LmZpbmlzaCgpO1xuICB9LFxuXG4gIF9zZXR1cDogZnVuY3Rpb24odHlwZSwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSBcImZhZGVcIjpcbiAgICAgICAgcmV0dXJuIFNjZW5lRWZmZWN0RmFkZShvcHRpb25zKS5hZGRDaGlsZFRvKHRoaXMpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIFNjZW5lRWZmZWN0Tm9uZShvcHRpb25zKS5hZGRDaGlsZFRvKHRoaXMpO1xuICAgIH1cbiAgfSxcblxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIC8vIFByb21pc2XjgpLnlKjjgYTjgZ/jgqbjgqfjgqTjg4jlh6bnkIZcbiAgcGxheVdhaXQ6IGZ1bmN0aW9uKHdhaXQpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICBjb25zdCB0d1dhaXQgPSBUd2VlbmVyKCkuYXR0YWNoVG8odGhpcyk7XG4gICAgICB0d1dhaXQud2FpdCh3YWl0KS5jYWxsKCgpID0+IHtcbiAgICAgICAgdGhpcy5kZXRhY2godHdXYWl0KTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgX3JlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5yZW5kZXJlci5yZW5kZXIodGhpcywgMS4wKTtcbiAgfSxcblxufSk7XG4iLCIvL1xuLy8g44K344O844Oz44Ko44OV44Kn44Kv44OI44Gu5Z+656SO44Kv44Op44K5XG4vL1xucGhpbmEuZGVmaW5lKFwiU2NlbmVFZmZlY3RCYXNlXCIsIHtcbiAgc3VwZXJDbGFzczogXCJJbnB1dEludGVyY2VwdFwiLFxuXG4gIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3VwZXJJbml0KCk7XG4gICAgdGhpcy5lbmFibGUoKTtcbiAgfSxcblxufSk7XG4iLCIvL1xuLy8g44K344O844Oz44Ko44OV44Kn44Kv44OI77ya6KSH5pWw44Gu5YaG44Gn44OV44Kn44O844OJ44Kk44Oz44Ki44Km44OIXG4vL1xucGhpbmEuZGVmaW5lKFwiU2NlbmVFZmZlY3RDaXJjbGVGYWRlXCIsIHtcbiAgc3VwZXJDbGFzczogXCJTY2VuZUVmZmVjdEJhc2VcIixcblxuICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gKHt9KS4kc2FmZShvcHRpb25zLCBTY2VuZUVmZmVjdENpcmNsZUZhZGUuZGVmYXVsdHMpO1xuXG4gICAgdGhpcy5zdXBlckluaXQoKTtcbiAgfSxcblxuICBfY3JlYXRlQ2lyY2xlOiBmdW5jdGlvbigpIHtcbiAgICBjb25zdCBudW0gPSA1O1xuICAgIGNvbnN0IHdpZHRoID0gU0NSRUVOX1dJRFRIIC8gbnVtO1xuICAgIHJldHVybiBBcnJheS5yYW5nZSgoU0NSRUVOX0hFSUdIVCAvIHdpZHRoKSArIDEpLm1hcCh5ID0+IHtcbiAgICAgIHJldHVybiBBcnJheS5yYW5nZShudW0gKyAxKS5tYXAoeCA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZENoaWxkKENpcmNsZVNoYXBlKHtcbiAgICAgICAgICB4OiB4ICogd2lkdGgsXG4gICAgICAgICAgeTogeSAqIHdpZHRoLFxuICAgICAgICAgIGZpbGw6IHRoaXMub3B0aW9ucy5jb2xvcixcbiAgICAgICAgICBzdHJva2U6IG51bGwsXG4gICAgICAgICAgcmFkaXVzOiB3aWR0aCAqIDAuNSxcbiAgICAgICAgfSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgYmVnaW46IGZ1bmN0aW9uKCkge1xuICAgIGNvbnN0IGNpcmNsZXMgPSB0aGlzLl9jcmVhdGVDaXJjbGUoKTtcbiAgICBjb25zdCB0YXNrcyA9IFtdO1xuICAgIGNpcmNsZXMuZm9yRWFjaCgoeExpbmUsIHkpID0+IHtcbiAgICAgIHhMaW5lLmZvckVhY2goKGNpcmNsZSwgeCkgPT4ge1xuICAgICAgICBjaXJjbGUuc2NhbGVYID0gMDtcbiAgICAgICAgY2lyY2xlLnNjYWxlWSA9IDA7XG4gICAgICAgIHRhc2tzLnB1c2gobmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgY2lyY2xlLnR3ZWVuZXIuY2xlYXIoKVxuICAgICAgICAgICAgLnRvKHtcbiAgICAgICAgICAgICAgc2NhbGVYOiAxLjUsXG4gICAgICAgICAgICAgIHNjYWxlWTogMS41XG4gICAgICAgICAgICB9LCA1MDAsIFwiZWFzZU91dFF1YWRcIilcbiAgICAgICAgICAgIC5jYWxsKCgpID0+IHtcbiAgICAgICAgICAgICAgY2lyY2xlLnJlbW92ZSgpO1xuICAgICAgICAgICAgICBjaXJjbGUuZGVzdHJveUNhbnZhcygpO1xuICAgICAgICAgICAgICB0aGlzLmNoaWxkcmVuLmNsZWFyKCk7XG4gICAgICAgICAgICAgIHRoaXMuZGlzYWJsZSgpO1xuICAgICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwodGFza3MpO1xuICB9LFxuXG4gIGZpbmlzaDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jaGlsZHJlbi5jbGVhcigpO1xuXG4gICAgY29uc3QgY2lyY2xlcyA9IHRoaXMuX2NyZWF0ZUNpcmNsZSgpO1xuICAgIGNvbnN0IHRhc2tzID0gW107XG4gICAgY2lyY2xlcy5mb3JFYWNoKHhMaW5lID0+IHtcbiAgICAgIHhMaW5lLmZvckVhY2goY2lyY2xlID0+IHtcbiAgICAgICAgY2lyY2xlLnNjYWxlWCA9IDEuNTtcbiAgICAgICAgY2lyY2xlLnNjYWxlWSA9IDEuNTtcbiAgICAgICAgdGFza3MucHVzaChuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICBjaXJjbGUudHdlZW5lci5jbGVhcigpXG4gICAgICAgICAgICAudG8oe1xuICAgICAgICAgICAgICBzY2FsZVg6IDAsXG4gICAgICAgICAgICAgIHNjYWxlWTogMFxuICAgICAgICAgICAgfSwgNTAwLCBcImVhc2VPdXRRdWFkXCIpXG4gICAgICAgICAgICAuY2FsbCgoKSA9PiB7XG4gICAgICAgICAgICAgIGNpcmNsZS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgY2lyY2xlLmRlc3Ryb3lDYW52YXMoKTtcbiAgICAgICAgICAgICAgdGhpcy5jaGlsZHJlbi5jbGVhcigpO1xuICAgICAgICAgICAgICB0aGlzLmRpc2FibGUoKTtcbiAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiBQcm9taXNlLmFsbCh0YXNrcyk7XG4gIH0sXG5cbiAgX3N0YXRpYzoge1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICBjb2xvcjogXCJ3aGl0ZVwiLFxuICAgIH1cbiAgfVxuXG59KTtcbiIsIi8vXG4vLyDjgrfjg7zjg7Pjgqjjg5Xjgqfjgq/jg4jvvJrjg5Xjgqfjg7zjg4njgqTjg7PjgqLjgqbjg4hcbi8vXG5waGluYS5kZWZpbmUoXCJTY2VuZUVmZmVjdEZhZGVcIiwge1xuICBzdXBlckNsYXNzOiBcIlNjZW5lRWZmZWN0QmFzZVwiLFxuXG4gIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSAoe30pLiRzYWZlKG9wdGlvbnMsIHtcbiAgICAgIGNvbG9yOiBcImJsYWNrXCIsXG4gICAgICB0aW1lOiA1MDAsXG4gICAgfSk7XG5cbiAgICB0aGlzLnN1cGVySW5pdCgpO1xuICAgIHRoaXMuZnJvbUpTT04oe1xuICAgICAgY2hpbGRyZW46IHtcbiAgICAgICAgZmFkZToge1xuICAgICAgICAgIGNsYXNzTmFtZTogXCJSZWN0YW5nbGVTaGFwZVwiLFxuICAgICAgICAgIGFyZ3VtZW50czoge1xuICAgICAgICAgICAgd2lkdGg6IFNDUkVFTl9XSURUSCxcbiAgICAgICAgICAgIGhlaWdodDogU0NSRUVOX0hFSUdIVCxcbiAgICAgICAgICAgIGZpbGw6IHRoaXMub3B0aW9ucy5jb2xvcixcbiAgICAgICAgICAgIHN0cm9rZTogbnVsbCxcbiAgICAgICAgICAgIHBhZGRpbmc6IDAsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB4OiBTQ1JFRU5fV0lEVEggKiAwLjUsXG4gICAgICAgICAgeTogU0NSRUVOX0hFSUdIVCAqIDAuNSxcbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICBzdGF5OiBmdW5jdGlvbigpIHtcbiAgICBjb25zdCBmYWRlID0gdGhpcy5mYWRlO1xuICAgIGZhZGUuYWxwaGEgPSAxLjA7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9LFxuXG4gIGJlZ2luOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICBjb25zdCBmYWRlID0gdGhpcy5mYWRlO1xuICAgICAgZmFkZS5hbHBoYSA9IDEuMDtcbiAgICAgIGZhZGUudHdlZW5lci5jbGVhcigpXG4gICAgICAgIC5mYWRlT3V0KHRoaXMub3B0aW9ucy50aW1lKVxuICAgICAgICAuY2FsbCgoKSA9PiB7XG4gICAgICAgICAgLy8xRnJhbWXmj4/nlLvjgZXjgozjgabjgZfjgb7jgaPjgabjgaHjgonjgaTjgY/jga7jgadlbnRlcmZyYW1l44Gn5YmK6ZmkXG4gICAgICAgICAgdGhpcy5vbmUoXCJlbnRlcmZyYW1lXCIsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZmFkZS5yZW1vdmUoKTtcbiAgICAgICAgICAgIHRoaXMuZmFkZS5kZXN0cm95Q2FudmFzKCk7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZSgpXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfSxcblxuICBmaW5pc2g6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIGNvbnN0IGZhZGUgPSB0aGlzLmZhZGU7XG4gICAgICBmYWRlLmFscGhhID0gMC4wO1xuICAgICAgZmFkZS50d2VlbmVyLmNsZWFyKClcbiAgICAgICAgLmZhZGVJbih0aGlzLm9wdGlvbnMudGltZSlcbiAgICAgICAgLmNhbGwoKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmxhcmUoXCJmaW5pc2hcIik7XG4gICAgICAgICAgLy8xRnJhbWXmj4/nlLvjgZXjgozjgabjgZfjgb7jgaPjgabjgaHjgonjgaTjgY/jga7jgadlbnRlcmZyYW1l44Gn5YmK6ZmkXG4gICAgICAgICAgdGhpcy5vbmUoXCJlbnRlcmZyYW1lXCIsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZmFkZS5yZW1vdmUoKTtcbiAgICAgICAgICAgIHRoaXMuZmFkZS5kZXN0cm95Q2FudmFzKCk7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZSgpXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfSxcblxuICBfc3RhdGljOiB7XG4gICAgZGVmYXVsdHM6IHtcbiAgICAgIGNvbG9yOiBcImJsYWNrXCIsXG4gICAgfVxuICB9XG5cbn0pO1xuIiwiLy9cbi8vIOOCt+ODvOODs+OCqOODleOCp+OCr+ODiO+8muOBquOBq+OCguOBl+OBquOBhFxuLy9cbnBoaW5hLmRlZmluZShcIlNjZW5lRWZmZWN0Tm9uZVwiLCB7XG4gIHN1cGVyQ2xhc3M6IFwiU2NlbmVFZmZlY3RCYXNlXCIsXG5cbiAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zdXBlckluaXQoKTtcbiAgfSxcblxuICBiZWdpbjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgdGhpcy5vbmUoXCJlbnRlcmZyYW1lXCIsICgpID0+IHRoaXMucmVtb3ZlKCkpO1xuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0pO1xuICB9LFxuXG4gIGZpbmlzaDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgdGhpcy5vbmUoXCJlbnRlcmZyYW1lXCIsICgpID0+IHRoaXMucmVtb3ZlKCkpO1xuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0pO1xuICB9XG5cbn0pO1xuIiwiLy9cbi8vIOOCt+ODvOODs+OCqOODleOCp+OCr+ODiO+8muOCv+OCpOODq+ODleOCp+ODvOODiVxuLy9cbnBoaW5hLmRlZmluZShcIlNjZW5lRWZmZWN0VGlsZUZhZGVcIiwge1xuICBzdXBlckNsYXNzOiBcIlNjZW5lRWZmZWN0QmFzZVwiLFxuXG4gIHRpbGVzOiBudWxsLFxuICBudW06IDE1LFxuICBzcGVlZDogNTAsXG5cbiAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHRoaXMuc3VwZXJJbml0KCk7XG4gICAgdGhpcy5vcHRpb25zID0gKHt9KS4kc2FmZShvcHRpb25zLCB7XG4gICAgICBjb2xvcjogXCJibGFja1wiLFxuICAgICAgd2lkdGg6IDc2OCxcbiAgICAgIGhlaWdodDogMTAyNCxcbiAgICB9KTtcblxuICAgIHRoaXMudGlsZXMgPSB0aGlzLl9jcmVhdGVUaWxlcygpO1xuICB9LFxuXG4gIF9jcmVhdGVUaWxlczogZnVuY3Rpb24oKSB7XG4gICAgY29uc3Qgd2lkdGggPSBNYXRoLmZsb29yKHRoaXMub3B0aW9ucy53aWR0aCAvIHRoaXMubnVtKTtcblxuICAgIHJldHVybiBBcnJheS5yYW5nZSgodGhpcy5vcHRpb25zLmhlaWdodCAvIHdpZHRoKSArIDEpLm1hcCh5ID0+IHtcbiAgICAgIHJldHVybiBBcnJheS5yYW5nZSh0aGlzLm51bSArIDEpLm1hcCh4ID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkQ2hpbGQoUmVjdGFuZ2xlU2hhcGUoe1xuICAgICAgICAgIHdpZHRoOiB3aWR0aCArIDIsXG4gICAgICAgICAgaGVpZ2h0OiB3aWR0aCArIDIsXG4gICAgICAgICAgeDogeCAqIHdpZHRoLFxuICAgICAgICAgIHk6IHkgKiB3aWR0aCxcbiAgICAgICAgICBmaWxsOiB0aGlzLm9wdGlvbnMuY29sb3IsXG4gICAgICAgICAgc3Ryb2tlOiBudWxsLFxuICAgICAgICAgIHN0cm9rZVdpZHRoOiAwLFxuICAgICAgICB9KSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcblxuICBzdGF5OiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnRpbGVzLmZvckVhY2goKHhsaW5lLCB5KSA9PiB7XG4gICAgICB4bGluZS5mb3JFYWNoKCh0aWxlLCB4KSA9PiB7XG4gICAgICAgIHRpbGUuc2NhbGVYID0gMS4wO1xuICAgICAgICB0aWxlLnNjYWxlWSA9IDEuMDtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfSxcblxuICBiZWdpbjogZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgdGFza3MgPSBbXTtcbiAgICB0aGlzLnRpbGVzLmZvckVhY2goKHhsaW5lLCB5KSA9PiB7XG4gICAgICBjb25zdCB3ID0gTWF0aC5yYW5kZmxvYXQoMCwgMSkgKiB0aGlzLnNwZWVkO1xuICAgICAgeGxpbmUuZm9yRWFjaCgodGlsZSwgeCkgPT4ge1xuICAgICAgICB0aWxlLnNjYWxlWCA9IDEuMDtcbiAgICAgICAgdGlsZS5zY2FsZVkgPSAxLjA7XG4gICAgICAgIHRhc2tzLnB1c2gobmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgdGlsZS50d2VlbmVyLmNsZWFyKClcbiAgICAgICAgICAgIC53YWl0KHggKiB0aGlzLnNwZWVkICsgdylcbiAgICAgICAgICAgIC50byh7XG4gICAgICAgICAgICAgIHNjYWxlWDogMCxcbiAgICAgICAgICAgICAgc2NhbGVZOiAwXG4gICAgICAgICAgICB9LCA1MDAsIFwiZWFzZU91dFF1YWRcIilcbiAgICAgICAgICAgIC5jYWxsKCgpID0+IHtcbiAgICAgICAgICAgICAgdGlsZS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgdGlsZS5kZXN0cm95Q2FudmFzKCk7XG4gICAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiBQcm9taXNlLmFsbCh0YXNrcylcbiAgfSxcblxuICBmaW5pc2g6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnN0IHRhc2tzID0gW107XG4gICAgdGhpcy50aWxlcy5mb3JFYWNoKCh4bGluZSwgeSkgPT4ge1xuICAgICAgY29uc3QgdyA9IE1hdGgucmFuZGZsb2F0KDAsIDEpICogdGhpcy5zcGVlZDtcbiAgICAgIHhsaW5lLmZvckVhY2goKHRpbGUsIHgpID0+IHtcbiAgICAgICAgdGlsZS5zY2FsZVggPSAwLjA7XG4gICAgICAgIHRpbGUuc2NhbGVZID0gMC4wO1xuICAgICAgICB0YXNrcy5wdXNoKG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgIHRpbGUudHdlZW5lci5jbGVhcigpXG4gICAgICAgICAgICAud2FpdCgoeGxpbmUubGVuZ3RoIC0geCkgKiB0aGlzLnNwZWVkICsgdylcbiAgICAgICAgICAgIC50byh7XG4gICAgICAgICAgICAgIHNjYWxlWDogMSxcbiAgICAgICAgICAgICAgc2NhbGVZOiAxXG4gICAgICAgICAgICB9LCA1MDAsIFwiZWFzZU91dFF1YWRcIilcbiAgICAgICAgICAgIC5jYWxsKCgpID0+IHtcbiAgICAgICAgICAgICAgdGlsZS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgdGlsZS5kZXN0cm95Q2FudmFzKCk7XG4gICAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiBQcm9taXNlLmFsbCh0YXNrcylcbiAgfSxcblxuICBfc3RhdGljOiB7XG4gICAgZGVmYXVsdHM6IHtcbiAgICAgIGNvbG9yOiBcImJsYWNrXCIsXG4gICAgfVxuICB9XG5cbn0pO1xuIiwiLy9cbi8vIEFQSeODquOCr+OCqOOCueODiOaZguOChOOBquOBq+OBi+aZgumWk+OBruOBi+OBi+OCi+WHpueQhueUqOOBruODl+ODreOCsOODrOOCueeUu+mdou+8iOS7ru+8iVxuLy9cbnBoaW5hLmRlZmluZShcIkNvbm5lY3Rpb25Qcm9ncmVzc1wiLCB7XG4gIHN1cGVyQ2xhc3M6IFwiTW9kYWxcIixcbiAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHRoaXMuc3VwZXJJbml0KCk7XG4gICAgdGhpcy5vcHRpb25zID0gKHt9KS4kc2FmZShvcHRpb25zIHx8IHt9LCBDb25uZWN0aW9uUHJvZ3Jlc3MuZGVmYXVsdHMpO1xuXG4gICAgdGhpcy5zZXR1cCgpO1xuICB9LFxuXG4gIHNldHVwOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmxheW91dCA9IEFzc2V0TWFuYWdlci5nZXQoXCJsYXlvdXRcIiwgXCJjb25uZWN0aW9uUHJvZ3Jlc3NcIikuYnVpbGQoKS5hZGRDaGlsZFRvKHRoaXMpO1xuICAgIHRoaXMuYWxwaGEgPSAwO1xuICAgIHRoaXMuc2V0dXBMb2FkaW5nQW5pbWF0aW9uKCk7XG4gIH0sXG5cbiAgc2V0dXBMb2FkaW5nQW5pbWF0aW9uOiBmdW5jdGlvbigpIHtcbiAgICBjb25zdCBsb2FkaW5nID0gdGhpcy5sYXlvdXQucmVmW1wibG9hZGluZ1wiXTtcblxuICAgIGNvbnN0IHRhc2sgPSBBcnJheS5yYW5nZSgwLCAxMykubWFwKGkgPT4ge1xuICAgICAgY29uc3Qga2V5ID0gXCJjXCIgKyBpO1xuICAgICAgY29uc3Qgb3kgPSBsb2FkaW5nW2tleV0ueTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgbG9hZGluZ1trZXldLnR3ZWVuZXIuY2xlYXIoKVxuICAgICAgICAgIC53YWl0KGkgKiAxNTApXG4gICAgICAgICAgLnRvKHtcbiAgICAgICAgICAgIHk6IG95IC0gMTBcbiAgICAgICAgICB9LCAxNTAsIFwiZWFzZUluUXVhZFwiKVxuICAgICAgICAgIC50byh7XG4gICAgICAgICAgICB5OiBveVxuICAgICAgICAgIH0sIDE1MCwgXCJlYXNlT3V0UXVhZFwiKVxuICAgICAgICAgIC5jYWxsKCgpID0+IHJlc29sdmUoKSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIFByb21pc2UuYWxsKHRhc2spXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0dXBMb2FkaW5nQW5pbWF0aW9uKCk7XG4gICAgICB9KVxuICB9LFxuXG4gIC8v6KGo56S644Ki44OL44Oh44O844K344On44OzXG4gIG9wZW5BbmltYXRpb246IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIHRoaXMuYWxwaGEgPSAwO1xuICAgICAgdGhpcy50d2VlbmVyLmNsZWFyKClcbiAgICAgICAgLmZhZGVJbigyNTApXG4gICAgICAgIC5jYWxsKCgpID0+IHJlc29sdmUoKSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgLy/pnZ7ooajnpLrjgqLjg4vjg6Hjg7zjgrfjg6fjg7NcbiAgY2xvc2VBbmltYXRpb246IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIHRoaXMuYWxwaGEgPSAxO1xuICAgICAgdGhpcy50d2VlbmVyLmNsZWFyKClcbiAgICAgICAgLmZhZGVPdXQoMjUwKVxuICAgICAgICAuY2FsbCgoKSA9PiB7XG4gICAgICAgICAgdGhpcy5yZW1vdmUoKTtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9LFxuXG4gIC8v5b6F5qmf44Ki44OL44Oh44O844K344On44OzXG4gIC8vVE9ETzrjg4fjgrbjgqTjg7PjgYzjgarjgYTjga7jgafjgajjgorjgYLjgYjjgZouLi5cbiAgaWRsZUFuaW1hdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgLy8gdGhpcy5sYWJlbC5kb3RDb3VudCA9IDA7XG4gICAgICAvLyB0aGlzLmxhYmVsLnR3ZWVuZXIuY2xlYXIoKVxuICAgICAgLy8gICAudG8oeyBkb3RDb3VudDogNSB9LCAyMDAwKVxuICAgICAgLy8gICAud2FpdCgyMDApXG4gICAgICAvLyAgIC5zZXQoeyBkb3RDb3VudDogMCB9KVxuICAgICAgLy8gICAuc2V0TG9vcCh0cnVlKTtcbiAgICAgIC8vIHRoaXMubGFiZWwub24oXCJlbnRlcmZyYW1lXCIsICgpID0+IHtcbiAgICAgIC8vICAgdGhpcy5sYWJlbC50ZXh0ID0gdGhpcy5vcHRpb25zLnRleHQgKyBBcnJheS5yYW5nZShNYXRoLmZsb29yKHRoaXMubGFiZWwuZG90Q291bnQpKS5tYXAoKCkgPT4gXCIuXCIpLmpvaW4oXCJcIik7XG4gICAgICAvLyB9KTtcbiAgICAgIHJlc29sdmUoKTtcbiAgICB9KTtcbiAgfSxcblxuICBfc3RhdGljOiB7XG5cbiAgICBpbnN0YW5jZTogbnVsbCxcblxuICAgIG9wZW46IGZ1bmN0aW9uKHNjZW5lKSB7XG4gICAgICAvL+OCt+ODvOODs+OBjOWtmOWcqOOBl+OBquOBhOWgtOWQiOOBr+WNs+W6p+OBq+WujOS6huOBq+OBmeOCi1xuICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9XG5cbiAgICAgIC8v44GZ44Gn44Gr44Kk44Oz44K544K/44Oz44K544GM5a2Y5Zyo44GZ44KL5aC05ZCI44Gr44Gv6ZaJ44GY44Gm44GK44GPXG4gICAgICBpZiAodGhpcy5pbnN0YW5jZSkge1xuICAgICAgICB0aGlzLmluc3RhbmNlLmNsb3NlKCk7XG4gICAgICAgIHRoaXMuaW5zdGFuY2UgPSBudWxsO1xuICAgICAgfVxuICAgICAgLy/mlrDjgZfjgY/ov73liqDjgZfjgabooajnpLpcbiAgICAgIHRoaXMuaW5zdGFuY2UgPSBDb25uZWN0aW9uUHJvZ3Jlc3MoKS5hZGRDaGlsZFRvKHNjZW5lKTtcbiAgICAgIHJldHVybiB0aGlzLmluc3RhbmNlLm9wZW4oKS50aGVuKHRoaXMuaW5zdGFuY2UuaWRsZUFuaW1hdGlvbigpKTtcbiAgICB9LFxuXG4gICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCF0aGlzLmluc3RhbmNlKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICByZXR1cm4gdGhpcy5pbnN0YW5jZS5jbG9zZSgpLnRoZW4oKCkgPT4gdGhpcy5pbnN0YW5jZSA9IG51bGwpO1xuICAgIH0sXG5cbiAgICBkZWZhdWx0czoge1xuICAgICAgdGV4dDogXCLoqq3jgb/ovrzjgb/kuK1cIixcbiAgICB9LFxuICB9XG5cbn0pO1xuIiwicGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuXG4gIGNvbnN0IFBBRERJTkcgPSAyMDtcblxuICBwaGluYS5kZWZpbmUoXCJEaWFsb2dcIiwge1xuICAgIHN1cGVyQ2xhc3M6IFwiTW9kYWxcIixcblxuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMuc3VwZXJJbml0KCk7XG4gICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgIHRoaXMuc2l6ZSA9IG9wdGlvbnMuc2l6ZSB8fCBEaWFsb2cuU0laRS5TO1xuXG4gICAgICBjb25zb2xlLmxvZyhcInNpemU6XCIgKyB0aGlzLnNpemUpO1xuXG4gICAgICB0aGlzLmZyb21KU09OKHtcbiAgICAgICAgY2hpbGRyZW46IHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiB7XG4gICAgICAgICAgICBjbGFzc05hbWU6IFwiUmVjdGFuZ2xlU2hhcGVcIixcbiAgICAgICAgICAgIGFyZ3VtZW50czoge1xuICAgICAgICAgICAgICB3aWR0aDogU0NSRUVOX1dJRFRILFxuICAgICAgICAgICAgICBoZWlnaHQ6IFNDUkVFTl9IRUlHSFQsXG4gICAgICAgICAgICAgIHN0cm9rZTogbnVsbCxcbiAgICAgICAgICAgICAgZmlsbDogXCIjMDAwMDAwOTlcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHg6IFNDUkVFTl9XSURUSCAqIDAuNSxcbiAgICAgICAgICAgIHk6IFNDUkVFTl9IRUlHSFQgKiAwLjUsXG4gICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIHRoaXMubGF5b3V0ID0gQXNzZXRNYW5hZ2VyLmdldChcImxheW91dFwiLCBgZGlhbG9nXyR7dGhpcy5zaXplfWApXG4gICAgICB0aGlzLmxheW91dCA9IEFzc2V0TWFuYWdlci5nZXQoXCJsYXlvdXRcIiwgXCJkaWFsb2dfZnJhbWVcIilcbiAgICAgICAgLmJ1aWxkKClcbiAgICAgICAgLmFkZENoaWxkVG8odGhpcyk7XG5cbiAgICAgIHRoaXMudXBkYXRlU2l6ZSgpO1xuICAgICAgdGhpcy5zZXR1cEJ1dHRvbnMoKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlU2l6ZTogZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCBkaWFsb2cgPSB0aGlzLmxheW91dC5kaWFsb2c7XG4gICAgICBEaWFsb2cuU0laRS5mb3JJbigoc2l6ZSkgPT4ge1xuICAgICAgICBkaWFsb2dbRGlhbG9nLlNJWkVbc2l6ZV1dLnNsZWVwKCkuaGlkZSgpXG4gICAgICB9KVxuICAgICAgdGhpcy5kaWFsb2cud2FrZVVwKCkuc2hvdygpO1xuICAgIH0sXG5cbiAgICBzZXR1cEJ1dHRvbnM6IGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3QgYnV0dG9uTGF5b3V0ID0gQXNzZXRNYW5hZ2VyLmdldChcImxheW91dFwiLCBcImRpYWxvZ19idXR0b25zXCIpLmJ1aWxkKCk7XG4gICAgICBjb25zdCBkYXRhID0gYnV0dG9uTGF5b3V0LmxheW91dEFzc2V0LmRhdGE7XG4gICAgICB0aGlzLl9idXR0b25KU09OcyA9IGJ1dHRvbkxheW91dC5sYXlvdXRBc3NldC5kYXRhLnJvb3QuY2hpbGRyZW47XG4gICAgfSxcblxuICAgIHNldFRpdGxlOiBmdW5jdGlvbih0aXRsZSkge1xuICAgICAgdGhpcy50aXRsZS50ZXh0ID0gdGl0bGU7XG4gICAgfSxcblxuICAgIGFkZEJ1dHRvbjogZnVuY3Rpb24obGFiZWwsIGNvbG9yLCBvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgdGhpcy5idXR0b25zLmZyb21KU09OKHtcbiAgICAgICAgY2hpbGRyZW46IFt0aGlzLl9idXR0b25KU09Oc1tgJHtjb2xvcn1fbWBdXSxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBidXR0b24gPSB0aGlzLmJ1dHRvbnMuY2hpbGRyZW4ubGFzdDtcblxuICAgICAgYnV0dG9uLkJ1dHRvbiA9IEJ1dHRvbigpLmF0dGFjaFRvKGJ1dHRvbik7XG4gICAgICBidXR0b24ubGFiZWwudGV4dCA9IGJ1dHRvbi5sYWJlbF8yLnRleHQgPSBsYWJlbDtcbiAgICAgIGJ1dHRvbi5sYWJlbC5mb250U2l6ZSA9IGJ1dHRvbi5sYWJlbF8yLmZvbnRTaXplID0gKCFvcHRpb25zLmZvbnRTaXplKSA/IGJ1dHRvbi5sYWJlbC5mb250U2l6ZSA6IG9wdGlvbnMuZm9udFNpemU7XG4gICAgICBidXR0b24ucG9zaXRpb24gPSBWZWN0b3IyKDAsIDApO1xuICAgICAgYnV0dG9uLmhvZ2VJZCA9IHRoaXMuYnV0dG9ucy5jaGlsZHJlbi5sZW5ndGg7XG5cbiAgICAgIGxldCB3aWR0aCA9IHRoaXMuYnV0dG9ucy5jaGlsZHJlbi5yZWR1Y2UoKHcsIGVsbSkgPT4ge1xuICAgICAgICByZXR1cm4gdyArPSBlbG0ud2lkdGggKyBQQURESU5HO1xuICAgICAgfSwgMCk7XG5cbiAgICAgIGxldCBsZWZ0ID0gKHRoaXMuYnV0dG9ucy53aWR0aCAtIHdpZHRoKSAqIDAuNSAtICh0aGlzLmJ1dHRvbnMud2lkdGggKiAwLjUpO1xuXG4gICAgICB0aGlzLmJ1dHRvbnMuY2hpbGRyZW4uZm9yRWFjaCgoZWxtKSA9PiB7XG4gICAgICAgIGVsbS54ID0gbGVmdCArIChlbG0ud2lkdGggKyBQQURESU5HKSAqIDAuNTtcbiAgICAgICAgbGVmdCA9IGVsbS5yaWdodCArIFBBRERJTkcgKiAwLjU7XG4gICAgICB9KTtcblxuICAgICAgLy90aGlzLmJ1dHRvbnMuY2hpbGRyZW4uZm9yRWFjaChlID0+IGNvbnNvbGUubG9nKGUucG9zaXRpb24pKTtcblxuICAgICAgcmV0dXJuIGJ1dHRvbjtcbiAgICB9LFxuXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8v6KGo56S6XG4gICAgb3BlbjogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5vcGVuQW5pbWF0aW9uKCk7XG4gICAgfSxcblxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvL+mdnuihqOekulxuICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLmNsb3NlQW5pbWF0aW9uKCk7XG4gICAgfSxcblxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvL+ihqOekuuOCouODi+ODoeODvOOCt+ODp+ODs1xuICAgIG9wZW5BbmltYXRpb246IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFtcbiAgICAgICAgbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kLmFscGhhID0gMDtcbiAgICAgICAgICB0aGlzLmJhY2tncm91bmQudHdlZW5lci5jbGVhcigpXG4gICAgICAgICAgICAuZmFkZUluKDI1MClcbiAgICAgICAgICAgIC5jYWxsKCgpID0+IHJlc29sdmUoKSk7XG4gICAgICAgIH0pLFxuICAgICAgICBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICB0aGlzLmxheW91dC5kaWFsb2cuc2NhbGVYID0gMC4wO1xuICAgICAgICAgIHRoaXMubGF5b3V0LmRpYWxvZy5zY2FsZVkgPSAwLjA7XG4gICAgICAgICAgdGhpcy5sYXlvdXQuZGlhbG9nLnR3ZWVuZXIuY2xlYXIoKVxuICAgICAgICAgICAgLnRvKHtcbiAgICAgICAgICAgICAgc2NhbGVYOiAxLjAsXG4gICAgICAgICAgICAgIHNjYWxlWTogMS4wXG4gICAgICAgICAgICB9LCAyNTAsIFwiZWFzZUluT3V0UXVhZFwiKVxuICAgICAgICAgICAgLmNhbGwoKCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLmZsYXJlKFwib3BlbmVkXCIsIHtcbiAgICAgICAgICAgICAgICBkaWFsb2c6IHRoaXNcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgXSk7XG4gICAgfSxcblxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvL+mdnuihqOekuuOCouODi+ODoeODvOOCt+ODp+ODs1xuICAgIGNsb3NlQW5pbWF0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgICAgIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgIHRoaXMuYmFja2dyb3VuZC5hbHBoYSA9IDE7XG4gICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kLnR3ZWVuZXIuY2xlYXIoKVxuICAgICAgICAgICAgLmZhZGVPdXQoMjUwKVxuICAgICAgICAgICAgLmNhbGwoKCkgPT4gcmVzb2x2ZSgpKTtcbiAgICAgICAgfSksXG4gICAgICAgIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgIHRoaXMubGF5b3V0LmRpYWxvZy5zY2FsZVggPSAxLjA7XG4gICAgICAgICAgdGhpcy5sYXlvdXQuZGlhbG9nLnNjYWxlWSA9IDEuMDtcbiAgICAgICAgICB0aGlzLmxheW91dC5kaWFsb2cudHdlZW5lci5jbGVhcigpXG4gICAgICAgICAgICAudG8oe1xuICAgICAgICAgICAgICBzY2FsZVg6IDAuMCxcbiAgICAgICAgICAgICAgc2NhbGVZOiAwLjBcbiAgICAgICAgICAgIH0sIDI1MCwgXCJlYXNlSW5PdXRRdWFkXCIpXG4gICAgICAgICAgICAuY2FsbCgoKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMuZmxhcmUoXCJjbG9zZWRcIiwge1xuICAgICAgICAgICAgICAgIGRpYWxvZzogdGhpc1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICBdKS50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5yZW1vdmUoKTtcbiAgICAgICAgdGhpcy5sYXlvdXQuZGVzdHJveSgpO1xuICAgICAgICBkZWxldGUgdGhpcy5sYXlvdXQ7XG4gICAgICAgIHRoaXMuZmxhcmUoXCJkZXN0cm95XCIpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9hY2Nlc3Nvcjoge1xuICAgICAgY29udGVudHM6IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5sYXlvdXQucmVmW1wiY29udGVudHNcIl07XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBkaWFsb2c6IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5sYXlvdXQuZGlhbG9nW3RoaXMuc2l6ZV07XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB0aXRsZToge1xuICAgICAgICAvLyBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5sYXlvdXQucmVmW1widGl0bGVcIl0ubGFiZWw7IH1cbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5kaWFsb2cubGFiZWw7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBidXR0b25zOiB7XG4gICAgICAgIC8vIGdldDogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLmxheW91dC5yZWZbXCJidXR0b25zXCJdOyB9XG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuZGlhbG9nLmJ1dHRvbnM7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSxcblxuICAgIF9zdGF0aWM6IHtcbiAgICAgIFNJWkU6IHtcbiAgICAgICAgWFM6IFwieHNcIiwgLy80ODZ4MzA3ICBcbiAgICAgICAgUzogXCJzXCIsIC8vNDg2eDM5NiAgXG4gICAgICAgIE06IFwibVwiLCAvLzQ4Nng0NjYgIFxuICAgICAgICBMOiBcImxcIiwgLy80ODZ4NTg2ICBcbiAgICAgICAgWEw6IFwieGxcIiwgLy81NDZ4NTk2ICBcbiAgICAgICAgWFhMOiBcInh4bFwiLCAvLzU0Nng3MjYgIFxuICAgICAgICBYWFhMOiBcInh4eGxcIiAvLzU0Nng5NTYgIFxuICAgICAgfSxcbiAgICAgIEJVVFRPTl9DT0xPUjoge1xuICAgICAgICBSRUQ6IFwicmVkXCIsXG4gICAgICAgIC8vIEdSRUVOOiBcImdyZWVuXCIsXG4gICAgICAgIEJMVUU6IFwiYmx1ZVwiLFxuICAgICAgICBXSElURTogXCJ3aGl0ZVwiLFxuICAgICAgfSxcblxuICAgICAgb3BlbjogZnVuY3Rpb24oc2NlbmUsIHNpemUsIHNldHVwRnVuY3Rpb24pIHtcbiAgICAgICAgY29uc3QgZGlhbG9nID0gRGlhbG9nKHtcbiAgICAgICAgICBzaXplXG4gICAgICAgIH0pLmFkZENoaWxkVG8oc2NlbmUpO1xuXG4gICAgICAgIHNldHVwRnVuY3Rpb24oZGlhbG9nKTtcbiAgICAgICAgZGlhbG9nLm9wZW4oKTtcblxuICAgICAgICAvLyDjgZPjgYbjgZfjgZ/jgYTjgYzjgIExRnJhbWXpgYXjgozjgabjgaHjgonjgaTjgY9cbiAgICAgICAgLy8gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgICAgLy8gICAudGhlbigoKSA9PiBzZXR1cEZ1bmN0aW9uKGRpYWxvZykpXG4gICAgICAgIC8vICAgLnRoZW4oKCkgPT4gZGlhbG9nLm9wZW4oKSlcblxuICAgICAgICByZXR1cm4gZGlhbG9nO1xuICAgICAgfSxcblxuICAgIH1cbiAgfSk7XG59KTtcbiIsIi8qKlxuICogRG9tQnV0dG9uXG4gKiBlbGVtZW5044Gr44GL44G244Gb44KL5b2i44GnRE9N44Oc44K/44Oz44KS5L2c5oiQ44GX44G+44GZ44CCXG4gKiBcbiAqIFBhcmFtYXRlclxuICogYXBwICAgICAgQ2FudmFzQXBwXG4gKiBlbGVtZW50ICDjgYvjgbbjgZvjgovlr77osaFlbGVtZW50XG4gKiBmdW5jICAgICDjgq/jg6rjg4Pjgq/jgZXjgozjgZ/mmYLjgavlrp/ooYzjgZXjgozjgovplqLmlbBcbiAqL1xuXG5waGluYS5uYW1lc3BhY2UoKCkgPT4ge1xuICBwaGluYS5kZWZpbmUoXCJEb21CdXR0b25cIiwge1xuICAgIHN1cGVyQ2xhc3M6IFwiRGlzcGxheUVsZW1lbnRcIixcblxuICAgIGluaXQ6IGZ1bmN0aW9uKGFwcCwgZWxlbWVudCkge1xuICAgICAgdGhpcy5zdXBlckluaXQoKTtcblxuICAgICAgdGhpcy5hcHAgPSBhcHA7XG5cbiAgICAgIHRoaXMuYnRuID0gbnVsbDtcbiAgICAgIHRoaXMuc2V0dXAoZWxlbWVudCk7XG4gICAgfSxcblxuICAgIHNldHVwOiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICBpZiAodGhpcy5idG4pIHtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCh0aGlzLmJ0bik7XG4gICAgICAgIC8vIHRoaXMuYnRuLnJlbW92ZSgpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICB0aGlzLmJ0bi5pZCA9IFwiYnRuXCJcbiAgICAgIHRoaXMuYnRuLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgdGhpcy5idG4uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgdGhpcy5idG4uc3R5bGUucGFkZGluZyA9IFwiMHB4XCI7XG4gICAgICB0aGlzLmJ0bi5zdHlsZS5ib3JkZXJXaWR0aCA9IFwiMHB4XCI7XG5cbiAgICAgIHRoaXMuYnRuLnN0eWxlLmZpbHRlciA9ICdhbHBoYShvcGFjaXR5PTApJztcbiAgICAgIHRoaXMuYnRuLnN0eWxlLk1vek9wYWNpdHkgPSAwLjA7XG4gICAgICB0aGlzLmJ0bi5zdHlsZS5vcGFjaXR5ID0gMC4wO1xuXG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuYnRuKTtcblxuICAgICAgdGhpcy5idG4ub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgZWxlbWVudC5mbGFyZSgnY2xpY2tlZCcpO1xuICAgICAgICB0aGlzLmZsYXJlKCdjbGlja2VkJyk7XG4gICAgICB9O1xuXG4gICAgICB0aGlzLm9uKCdlbnRlcmZyYW1lJywgKCkgPT4ge1xuICAgICAgICBpZiAoIXRoaXMuYnRuKSByZXR1cm47XG4gICAgICAgIGNvbnN0IHNjYWxlID0gcGFyc2VJbnQodGhpcy5hcHAuZG9tRWxlbWVudC5zdHlsZS53aWR0aCkgLyB0aGlzLmFwcC5kb21FbGVtZW50LndpZHRoICogdGhpcy5hcHAucXVhbGl0eTtcbiAgICAgICAgY29uc3Qgd2lkdGggPSBlbGVtZW50LndpZHRoICogc2NhbGU7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IGVsZW1lbnQuaGVpZ2h0ICogc2NhbGU7XG5cbiAgICAgICAgbGV0IGNhbnZhc0xlZnQgPSBwYXJzZUludCh0aGlzLmFwcC5kb21FbGVtZW50LnN0eWxlLmxlZnQpO1xuICAgICAgICBsZXQgY2FudmFzVG9wID0gcGFyc2VJbnQodGhpcy5hcHAuZG9tRWxlbWVudC5zdHlsZS50b3ApO1xuICAgICAgICAvL+iHqui6q+OBruOCsOODreODvOODkOODq+W6p+aomeOBq+WQiOOCj+OBm+OCi1xuICAgICAgICBjYW52YXNMZWZ0ICs9IGVsZW1lbnQuX3dvcmxkTWF0cml4Lm0wMiAqIHNjYWxlO1xuICAgICAgICBjYW52YXNUb3AgKz0gZWxlbWVudC5fd29ybGRNYXRyaXgubTEyICogc2NhbGU7XG4gICAgICAgIGNhbnZhc0xlZnQgKz0gLWVsZW1lbnQub3JpZ2luWCAqIHdpZHRoO1xuICAgICAgICBjYW52YXNUb3AgKz0gLWVsZW1lbnQub3JpZ2luWSAqIGhlaWdodDtcblxuICAgICAgICB0aGlzLmJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgICAgICAgdGhpcy5idG4uc3R5bGUud2lkdGggPSBgJHt3aWR0aH1weGA7XG4gICAgICAgIHRoaXMuYnRuLnN0eWxlLmhlaWdodCA9IGAke2hlaWdodH1weGA7XG4gICAgICAgIHRoaXMuYnRuLnN0eWxlLmxlZnQgPSBgJHtjYW52YXNMZWZ0fXB4YDtcbiAgICAgICAgdGhpcy5idG4uc3R5bGUudG9wID0gYCR7Y2FudmFzVG9wfXB4YDtcbiAgICAgIH0pO1xuXG4gICAgfSxcblxuICAgIG9ucmVtb3ZlZDogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIXRoaXMuYnRuKSByZXR1cm47XG4gICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRoaXMuYnRuKTtcbiAgICAgIC8vIHRoaXMuYnRuLnJlbW92ZSgpO1xuICAgICAgdGhpcy5idG4gPSBudWxsO1xuICAgIH0sXG5cbiAgfSk7XG59KTtcbiIsInBoaW5hLm5hbWVzcGFjZSgoKSA9PiB7XG4gIHBoaW5hLmRlZmluZShcIkRvbVZpZGVvXCIsIHtcbiAgICBzdXBlckNsYXNzOiBcIkRpc3BsYXlFbGVtZW50XCIsXG5cbiAgICBpbml0OiBmdW5jdGlvbihhcHAsIGVsZW1lbnQpIHtcbiAgICAgIHRoaXMuc3VwZXJJbml0KCk7XG4gICAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICAgIHRoaXMudmlkZW8gPSBudWxsO1xuICAgICAgdGhpcy5zZXR1cChlbGVtZW50KTtcbiAgICB9LFxuXG4gICAgc2V0dXA6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgIGlmICh0aGlzLnZpZGVvKSB7XG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQodGhpcy52aWRlbyk7XG4gICAgICAgIC8vIHRoaXMudmlkZW8ucmVtb3ZlKCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHZpZGVvID0gdGhpcy52aWRlbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ2aWRlb1wiKTtcbiAgICAgIHZpZGVvLmlkID0gXCJ2aWRlb1wiO1xuICAgICAgdmlkZW8ubXV0ZWQgPSB0cnVlO1xuXG4gICAgICB2aWRlby5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcblxuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh2aWRlbyk7XG5cbiAgICAgIHRoaXMub24oJ2VudGVyZnJhbWUnLCAoKSA9PiB7XG4gICAgICAgIGlmICghdmlkZW8pIHJldHVybjtcbiAgICAgICAgY29uc3Qgc2NhbGUgPSBwYXJzZUludCh0aGlzLmFwcC5kb21FbGVtZW50LnN0eWxlLndpZHRoKSAvIHRoaXMuYXBwLmRvbUVsZW1lbnQud2lkdGggKiB0aGlzLmFwcC5xdWFsaXR5O1xuICAgICAgICBjb25zdCB3aWR0aCA9IGVsZW1lbnQud2lkdGggKiBlbGVtZW50LnNjYWxlWCAqIHNjYWxlO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBlbGVtZW50LmhlaWdodCAqIGVsZW1lbnQuc2NhbGVYICogc2NhbGU7XG5cbiAgICAgICAgbGV0IGNhbnZhc0xlZnQgPSBwYXJzZUludCh0aGlzLmFwcC5kb21FbGVtZW50LnN0eWxlLmxlZnQpO1xuICAgICAgICBsZXQgY2FudmFzVG9wID0gcGFyc2VJbnQodGhpcy5hcHAuZG9tRWxlbWVudC5zdHlsZS50b3ApO1xuXG4gICAgICAgIGNhbnZhc0xlZnQgKz0gZWxlbWVudC5fd29ybGRNYXRyaXgubTAyICogc2NhbGU7XG4gICAgICAgIGNhbnZhc1RvcCArPSBlbGVtZW50Ll93b3JsZE1hdHJpeC5tMTIgKiBzY2FsZTtcbiAgICAgICAgY2FudmFzTGVmdCArPSAtZWxlbWVudC5vcmlnaW5YICogd2lkdGg7XG4gICAgICAgIGNhbnZhc1RvcCArPSAtZWxlbWVudC5vcmlnaW5ZICogaGVpZ2h0O1xuXG4gICAgICAgIC8vIHZpZGVvLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgICB2aWRlby5zdHlsZS53aWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgICAgdmlkZW8uc3R5bGUuaGVpZ2h0ID0gYCR7aGVpZ2h0fXB4YDtcbiAgICAgICAgdmlkZW8uc3R5bGUubGVmdCA9IGAke2NhbnZhc0xlZnR9cHhgO1xuICAgICAgICB2aWRlby5zdHlsZS50b3AgPSBgJHtjYW52YXNUb3B9cHhgO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIGxvYWQ6IGZ1bmN0aW9uKHNyYykge1xuICAgICAgdGhpcy52aWRlby5zcmMgPSBzcmM7XG4gICAgICB0aGlzLnZpZGVvLm9ubG9hZGVkbWV0YWRhdGEgPSAoKCkgPT4ge1xuICAgICAgICB0aGlzLmlzTG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5mbGFyZShcImxvYWRlZFwiKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIHBsYXk6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy52aWRlby5jdXJyZW50VGltZSA9IDA7XG4gICAgICB0aGlzLnZpZGVvLnBsYXkoKTtcbiAgICAgIHRoaXMuZmxhcmUoXCJwbGF5XCIpXG4gICAgfSxcblxuICAgIG9ucmVtb3ZlZDogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIXRoaXMudmlkZW8pIHJldHVybjtcbiAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQodGhpcy52aWRlbyk7XG4gICAgICAvLyB0aGlzLnZpZGVvLnJlbW92ZSgpO1xuICAgICAgdGhpcy52aWRlbyA9IG51bGw7XG4gICAgfSxcblxuICB9KTtcbn0pO1xuIiwicGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuICBwaGluYS5kZWZpbmUoXCJEb3dubG9hZFByb2dyZXNzXCIsIHtcbiAgICBzdXBlckNsYXNzOiBcIk1vZGFsXCIsXG4gICAgYXNzZXRzOiBudWxsLFxuXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdGhpcy5zdXBlckluaXQoKTtcbiAgICAgIHRoaXMuYXNzZXRzID0gb3B0aW9ucy5hc3NldHM7XG4gICAgICB0aGlzLnNldHVwKCk7XG4gICAgfSxcblxuICAgIHNldHVwOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuZ2F1Z2VGcmFtZSA9IFJlY3RhbmdsZVNoYXBlKHtcbiAgICAgICAgZmlsbDogXCJ3aGl0ZVwiLFxuICAgICAgICBzdHJva2U6IG51bGwsXG4gICAgICAgIGNvcm5lclJhZGl1czogMTIsXG4gICAgICAgIHdpZHRoOiA1MTIsXG4gICAgICAgIGhlaWdodDogMzIsXG4gICAgICAgIHBhZGRpbmc6IDAsXG4gICAgICAgIHg6IFNDUkVFTl9XSURUSCAqIDAuNSxcbiAgICAgICAgeTogMjRcbiAgICAgIH0pLmFkZENoaWxkVG8odGhpcyk7XG5cbiAgICAgIGNvbnNvbGUubG9nKHRoaXMuZ2F1Z2VGcmFtZS5vcmlnaW5YLCB0aGlzLmdhdWdlRnJhbWUub3JpZ2luWSlcblxuICAgICAgdGhpcy5nYXVnZSA9IFJlY3RhbmdsZVNoYXBlKHtcbiAgICAgICAgZmlsbDogXCJvcmFuZ2VcIixcbiAgICAgICAgc3Ryb2tlOiBudWxsLFxuICAgICAgICBjb3JuZXJSYWRpdXM6IDEyLFxuICAgICAgICB3aWR0aDogNTA2LFxuICAgICAgICBoZWlnaHQ6IDI2LFxuICAgICAgICBwYWRkaW5nOiAwLFxuICAgICAgICB4OiAtdGhpcy5nYXVnZUZyYW1lLndpZHRoICogMC41ICsgMyxcbiAgICAgICAgeTogMCxcbiAgICAgIH0pLmFkZENoaWxkVG8odGhpcy5nYXVnZUZyYW1lKTtcblxuICAgICAgdGhpcy5nYXVnZS5zZXRPcmlnaW4oMCwgMC41KTtcblxuICAgICAgdGhpcy5nYXVnZS5HYXVnZSA9IEdhdWdlKCkuYXR0YWNoVG8odGhpcy5nYXVnZSk7XG4gICAgICB0aGlzLmdhdWdlLkdhdWdlLm1pbiA9IDAuMDtcbiAgICAgIHRoaXMuZ2F1Z2UuR2F1Z2UubWF4ID0gMS4wO1xuICAgICAgdGhpcy5zZXRQcm9ncmVzcygwLjApO1xuICAgIH0sXG5cbiAgICBzZXRQcm9ncmVzczogZnVuY3Rpb24ocHJvZ3Jlc3MpIHtcbiAgICAgIHRoaXMuZ2F1Z2UuR2F1Z2UudmFsdWUgPSBwcm9ncmVzcztcbiAgICB9LFxuXG4gICAgLy/ooajnpLrjgqLjg4vjg6Hjg7zjgrfjg6fjg7NcbiAgICBvcGVuQW5pbWF0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgdGhpcy5hbHBoYSA9IDA7XG4gICAgICAgIHRoaXMudHdlZW5lci5jbGVhcigpXG4gICAgICAgICAgLmZhZGVJbigyNTApXG4gICAgICAgICAgLndhaXQoMjUwKVxuICAgICAgICAgIC5jYWxsKCgpID0+IHJlc29sdmUoKSk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgLy/pnZ7ooajnpLrjgqLjg4vjg6Hjg7zjgrfjg6fjg7NcbiAgICBjbG9zZUFuaW1hdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIHRoaXMuYWxwaGEgPSAxO1xuICAgICAgICB0aGlzLnR3ZWVuZXIuY2xlYXIoKVxuICAgICAgICAgIC53YWl0KDI1MClcbiAgICAgICAgICAuZmFkZU91dCgyNTApXG4gICAgICAgICAgLmNhbGwoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUoKTtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvL+i/veWKoOOBp+OCouOCu+ODg+ODiOOCkuiqreOBv+i+vOOCgFxuICAgIHN0YXJ0TG9hZEFzc2V0czogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIXRoaXMuYXNzZXRzKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIGNvbnN0IGxvYWRlciA9IEFzc2V0TG9hZGVyKCk7XG4gICAgICAgIGxvYWRlci5vbmxvYWQgPSAoKSA9PiByZXNvbHZlKCk7XG4gICAgICAgIGxvYWRlci5vbnByb2dyZXNzID0gKGUpID0+IHRoaXMuc2V0UHJvZ3Jlc3MoZS5wcm9ncmVzcyk7XG4gICAgICAgIGxvYWRlci5sb2FkKHRoaXMuYXNzZXRzKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfc3RhdGljOiB7XG5cbiAgICAgIGluc3RhbmNlOiBudWxsLFxuXG4gICAgICBvcGVuOiBmdW5jdGlvbihzY2VuZSwgcGF0aFByZWYsIGFzc2V0cykge1xuXG4gICAgICAgIGFzc2V0cyA9IERvd25sb2FkUHJvZ3Jlc3MueWV0TG9hZGVkQXNzZXRzKFxuICAgICAgICAgIFJvb3QuTG9hZGluZ1NjZW5lLmNvbWJpbmVBc3NldHNQYXRoKGFzc2V0cywgcGF0aFByZWYpXG4gICAgICAgICk7XG5cbiAgICAgICAgLy/jgrfjg7zjg7PjgYzlrZjlnKjjgZfjgarjgYTloLTlkIjjga/ljbPluqfjgavlrozkuobjgavjgZnjgotcbiAgICAgICAgaWYgKCFzY2VuZSB8fCAhYXNzZXRzKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy/jgZnjgafjgavjgqTjg7Pjgrnjgr/jg7PjgrnjgYzlrZjlnKjjgZnjgovloLTlkIjjgavjga/plonjgZjjgabjgYrjgY9cbiAgICAgICAgaWYgKHRoaXMuaW5zdGFuY2UpIHtcbiAgICAgICAgICB0aGlzLmluc3RhbmNlLmNsb3NlKCk7XG4gICAgICAgICAgdGhpcy5pbnN0YW5jZSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvL+aWsOOBl+OBj+i/veWKoOOBl+OBpuihqOekulxuICAgICAgICB0aGlzLmluc3RhbmNlID0gRG93bmxvYWRQcm9ncmVzcyh7IGFzc2V0cyB9KS5hZGRDaGlsZFRvKHNjZW5lKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5zdGFuY2Uub3BlbigpXG4gICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5pbnN0YW5jZS5zdGFydExvYWRBc3NldHMoKSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmluc3RhbmNlLmNsb3NlKClcbiAgICAgICAgICAgIHRoaXMuaW5zdGFuY2UgPSBudWxsO1xuICAgICAgICAgIH0pXG4gICAgICB9LFxuXG4gICAgICB5ZXRMb2FkZWRBc3NldHM6IGZ1bmN0aW9uKGFzc2V0cykge1xuICAgICAgICBpZiAoIWFzc2V0cykgcmV0dXJuIG51bGw7XG4gICAgICAgIGNvbnN0IHlldCA9IHt9O1xuICAgICAgICBhc3NldHMuZm9ySW4oKHR5cGUsIGRhdGEpID0+IHtcbiAgICAgICAgICBkYXRhLmZvckluKChrZXksIHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXBoaW5hLmFzc2V0LkFzc2V0TWFuYWdlci5nZXQodHlwZSwga2V5KSkge1xuICAgICAgICAgICAgICB5ZXRbdHlwZV0gPSB5ZXRbdHlwZV0gfHwge307XG4gICAgICAgICAgICAgIHlldFt0eXBlXVtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gKE9iamVjdC5rZXlzKHlldCkubGVuZ3RoID4gMCkgPyB5ZXQgOiBudWxsO1xuICAgICAgfVxuXG4gICAgfVxuXG4gIH0pO1xufSk7XG4iLCJwaGluYS5uYW1lc3BhY2UoKCkgPT4ge1xuICBwaGluYS5kZWZpbmUoXCJJbnB1dEZpZWxkXCIsIHtcbiAgICBzdXBlckNsYXNzOiBcIkRpc3BsYXlFbGVtZW50XCIsXG5cbiAgICBkb21FbGVtZW50OiBudWxsLFxuXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdGhpcy5vcHRpb25zID0gKHt9KS4kc2FmZShvcHRpb25zLCBJbnB1dEZpZWxkLmRlZmF1bHRzKTtcbiAgICAgIHRoaXMuc3VwZXJJbml0KG9wdGlvbnMpO1xuXG4gICAgICB0aGlzLmRvbUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG4gICAgICB0aGlzLmRvbUVsZW1lbnQudHlwZSA9IFwidGV4dFwiO1xuICAgICAgdGhpcy5kb21FbGVtZW50LnZhbHVlID0gdGhpcy5vcHRpb25zLnRleHQ7XG5cbiAgICAgIHRoaXMuZG9tRWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgIHRoaXMuZG9tRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUucGFkZGluZyA9IFwiMHB4XCI7XG4gICAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUuYm9yZGVyV2lkdGggPSBcIjBweFwiO1xuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmRvbUVsZW1lbnQpO1xuXG4gICAgICB0aGlzLmRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImZvY3VzXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5mbGFyZShcImZvY3VzXCIpO1xuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiZm9jdXNvdXRcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLmZsYXJlKFwiZm9jdXNvdXRcIik7XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5kb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuZmxhcmUoXCJjaGFuZ2VcIik7XG4gICAgICB9KTtcblxuICAgICAgLy9UT0RPOmFwcOOBruWPgueFp+aWueazleOBp+S7luOBq+iJr+OBhOaWueazleOBjOOBguOCjOOBsOWkieabtOOBmeOCi1xuICAgICAgdGhpcy5vbmUoXCJlbnRlcmZyYW1lXCIsIChlKSA9PiB7XG4gICAgICAgIHRoaXMuYXBwID0gZS5hcHA7XG4gICAgICAgIHRoaXMuc2V0dXAoKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBzZXR1cDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLm9uKFwiZW50ZXJmcmFtZVwiLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHNjYWxlID0gcGFyc2VJbnQodGhpcy5hcHAuZG9tRWxlbWVudC5zdHlsZS53aWR0aCkgLyB0aGlzLmFwcC5kb21FbGVtZW50LndpZHRoICogdGhpcy5hcHAucXVhbGl0eTtcblxuICAgICAgICBsZXQgZm9udFNpemUgPSAodGhpcy5vcHRpb25zLmZvbnRTaXplICogc2NhbGUpLnJvdW5kKCk7XG4gICAgICAgIC8v44Kt44Oj44Oz44OQ44K544Gu5bem5LiK44Gr5ZCI44KP44Gb44KLXG4gICAgICAgIGxldCB3aWR0aCA9IHRoaXMud2lkdGggKiBzY2FsZTtcbiAgICAgICAgbGV0IGhlaWdodCA9IHRoaXMuaGVpZ2h0ICogc2NhbGU7XG4gICAgICAgIGxldCBjYW52YXNMZWZ0ID0gcGFyc2VJbnQodGhpcy5hcHAuZG9tRWxlbWVudC5zdHlsZS5sZWZ0KTtcbiAgICAgICAgbGV0IGNhbnZhc1RvcCA9IHBhcnNlSW50KHRoaXMuYXBwLmRvbUVsZW1lbnQuc3R5bGUudG9wKTtcblxuICAgICAgICAvL+iHqui6q+OBruOCsOODreODvOODkOODq+W6p+aomeOBq+WQiOOCj+OBm+OCi1xuICAgICAgICBjYW52YXNMZWZ0ICs9IHRoaXMuX3dvcmxkTWF0cml4Lm0wMiAqIHNjYWxlO1xuICAgICAgICBjYW52YXNUb3AgKz0gdGhpcy5fd29ybGRNYXRyaXgubTEyICogc2NhbGU7XG4gICAgICAgIC8vb3JpZ2lu44Gu6Kq/5pW0XG4gICAgICAgIGNhbnZhc0xlZnQgKz0gLXRoaXMub3JpZ2luWCAqIHdpZHRoO1xuICAgICAgICBjYW52YXNUb3AgKz0gLXRoaXMub3JpZ2luWSAqIGhlaWdodDtcblxuICAgICAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwiXCI7XG4gICAgICAgIHRoaXMuZG9tRWxlbWVudC5zdHlsZS53aWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgICAgdGhpcy5kb21FbGVtZW50LnN0eWxlLmhlaWdodCA9IGAke2hlaWdodH1weGA7XG4gICAgICAgIHRoaXMuZG9tRWxlbWVudC5zdHlsZS5sZWZ0ID0gYCR7Y2FudmFzTGVmdH1weGA7XG4gICAgICAgIHRoaXMuZG9tRWxlbWVudC5zdHlsZS50b3AgPSBgJHtjYW52YXNUb3B9cHhgO1xuICAgICAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUuZm9udFNpemUgPSBgJHtmb250U2l6ZX1weGA7XG4gICAgICAgIHRoaXMuZG9tRWxlbWVudC5zdHlsZS5mb250RmFtaWxpeSA9IFwiTWFpbi1Cb2xkXCI7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgc2V0VmlzaWJsZTogZnVuY3Rpb24oZmxhZykge1xuICAgICAgdGhpcy52aXNpYmxlID0gZmxhZztcbiAgICAgIGlmICh0aGlzLmRvbUVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5kb21FbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAoZmxhZykgPyBcIlwiIDogXCJub25lXCI7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgc2hvdzogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnNldFZpc2libGUodHJ1ZSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgaGlkZTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnNldFZpc2libGUoZmFsc2UpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGFkZENTUzogZnVuY3Rpb24oY3NzKSB7XG4gICAgICBpZiAoY3NzIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgY3NzLmZvckVhY2goKGMpID0+IHtcbiAgICAgICAgICB0aGlzLmRvbUVsZW1lbnQuY2xhc3NMaXN0LmFkZChjKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpcy5kb21FbGVtZW50KSB7XG4gICAgICAgICAgdGhpcy5kb21FbGVtZW50LmNsYXNzTGlzdC5hZGQoY3NzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIHJlbW92ZUNTUzogZnVuY3Rpb24oY3NzKSB7XG4gICAgICBpZiAoY3NzIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgY3NzLmZvckVhY2goKGMpID0+IHtcbiAgICAgICAgICB0aGlzLmRvbUVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShjKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpcy5kb21FbGVtZW50KSB7XG4gICAgICAgICAgdGhpcy5kb21FbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoY3NzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIG9ucmVtb3ZlZDogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy5kb21FbGVtZW50KSB7XG4gICAgICAgIHRoaXMuZG9tRWxlbWVudC5yZW1vdmUoKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgX2FjY2Vzc29yOiB7XG4gICAgICB0ZXh0OiB7XG4gICAgICAgIFwiZ2V0XCI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiAodGhpcy5kb21FbGVtZW50KSA/IHRoaXMuZG9tRWxlbWVudC52YWx1ZSA6IFwiXCI7XG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0XCI6IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICBpZiAoIXRoaXMuZG9tRWxlbWVudCkgcmV0dXJuO1xuICAgICAgICAgIHRoaXMuZG9tRWxlbWVudC52YWx1ZSA9IHY7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgX3N0YXRpYzoge1xuICAgICAgZGVmYXVsdHM6IHtcbiAgICAgICAgd2lkdGg6IDIwMCxcbiAgICAgICAgaGVpZ2h0OiA0MCxcbiAgICAgICAgZm9udFNpemU6IDIwLFxuICAgICAgICB0ZXh0OiBcIlwiLFxuICAgICAgfVxuICAgIH0sXG4gIH0pO1xufSk7XG4iLCIvL1xuLy8g44Kv44Oq44OD44Kv44KE44K/44OD44OB44KS44Kk44Oz44K/44O844K744OX44OI44GZ44KLXG4vL1xucGhpbmEuZGVmaW5lKFwiSW5wdXRJbnRlcmNlcHRcIiwge1xuICBzdXBlckNsYXNzOiBcIkRpc3BsYXlFbGVtZW50XCIsXG5cbiAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zdXBlckluaXQoKTtcblxuICAgIHRoaXMub24oXCJhZGRlZFwiLCAoKSA9PiB7XG4gICAgICAvL+imquOBq+WvvuOBl+OBpuimhuOBhOOBi+OBtuOBm+OCi1xuICAgICAgdGhpcy53aWR0aCA9IHRoaXMucGFyZW50LndpZHRoO1xuICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLnBhcmVudC5oZWlnaHQ7XG4gICAgICB0aGlzLm9yaWdpblggPSB0aGlzLnBhcmVudC5vcmlnaW5YIHx8IDA7XG4gICAgICB0aGlzLm9yaWdpblkgPSB0aGlzLnBhcmVudC5vcmlnaW5ZIHx8IDA7XG4gICAgICB0aGlzLnggPSAwO1xuICAgICAgdGhpcy55ID0gMDtcbiAgICB9KTtcbiAgICB0aGlzLmRpc2FibGUoKTtcbiAgfSxcblxuICBlbmFibGU6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2V0SW50ZXJhY3RpdmUodHJ1ZSk7XG4gIH0sXG5cbiAgZGlzYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zZXRJbnRlcmFjdGl2ZShmYWxzZSk7XG4gIH0sXG5cbn0pO1xuIiwicGhpbmEuZGVmaW5lKFwiTW9kYWxcIiwge1xuICBzdXBlckNsYXNzOiBcIklucHV0SW50ZXJjZXB0XCIsXG5cbiAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zdXBlckluaXQoKTtcbiAgICB0aGlzLmVuYWJsZSgpO1xuICB9LFxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIC8v6KGo56S644Ki44OL44Oh44O844K344On44OzXG4gIC8vIOOCouODi+ODoeODvOOCt+ODp+ODs+OBq+OBpOOBhOOBpuOBr+e2meaJv+WFg+OBp+WGjeWumue+qVxuICBvcGVuQW5pbWF0aW9uOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH0sXG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvL+mdnuihqOekuuOCouODi+ODoeODvOOCt+ODp+ODs1xuICAvLyDjgqLjg4vjg6Hjg7zjgrfjg6fjg7PjgavjgaTjgYTjgabjga/ntpnmib/lhYPjgaflho3lrprnvqlcbiAgY2xvc2VBbmltYXRpb246IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfSxcblxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIC8v6KGo56S6XG4gIG9wZW46IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLm9wZW5BbmltYXRpb24oKTtcbiAgfSxcblxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIC8v6Z2e6KGo56S6XG4gIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5jbG9zZUFuaW1hdGlvbigpO1xuICB9XG5cbn0pO1xuIiwicGhpbmEubmFtZXNwYWNlKGZ1bmN0aW9uKCkge1xuXG4gIGxldCBkdW1teVRleHR1cmUgPSBudWxsO1xuXG4gIHBoaW5hLmRlZmluZShcIlNwcml0ZUxhYmVsXCIsIHtcbiAgICBzdXBlckNsYXNzOiBcIkRpc3BsYXlFbGVtZW50XCIsXG5cbiAgICBfdGV4dDogbnVsbCxcbiAgICB0YWJsZTogbnVsbCxcbiAgICBmaXhXaWR0aDogMCxcblxuICAgIHNwcml0ZXM6IG51bGwsXG5cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICBpZiAoIWR1bW15VGV4dHVyZSkge1xuICAgICAgICBkdW1teVRleHR1cmUgPSBDYW52YXMoKS5zZXRTaXplKDEsIDEpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN1cGVySW5pdChvcHRpb25zKTtcbiAgICAgIHRoaXMudGFibGUgPSBvcHRpb25zLnRhYmxlO1xuICAgICAgdGhpcy5maXhXaWR0aCA9IG9wdGlvbnMuZml4V2lkdGggfHwgMDtcblxuICAgICAgdGhpcy5zcHJpdGVzID0gW107XG5cbiAgICAgIHRoaXMuc2V0VGV4dChcIlwiKTtcbiAgICB9LFxuXG4gICAgc2V0VGV4dDogZnVuY3Rpb24odGV4dCkge1xuICAgICAgdGhpcy5fdGV4dCA9IHRleHQ7XG5cbiAgICAgIGNvbnN0IGNoYXJzID0gdGhpcy50ZXh0LnNwbGl0KFwiXCIpO1xuXG4gICAgICBpZiAodGhpcy5zcHJpdGVzLmxlbmd0aCA8IGNoYXJzLmxlbmd0aCkge1xuICAgICAgICBBcnJheS5yYW5nZSgwLCB0aGlzLnNwcml0ZXMubGVuZ3RoIC0gY2hhcnMubGVuZ3RoKS5mb3JFYWNoKCgpID0+IHtcbiAgICAgICAgICB0aGlzLnNwcml0ZXMucHVzaChTcHJpdGUoZHVtbXlUZXh0dXJlKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgQXJyYXkucmFuZ2UoMCwgY2hhcnMubGVuZ3RoIC0gdGhpcy5zcHJpdGVzLmxlbmd0aCkuZm9yRWFjaCgoKSA9PiB7XG4gICAgICAgICAgdGhpcy5zcHJpdGVzLmxhc3QucmVtb3ZlKCk7XG4gICAgICAgICAgdGhpcy5zcHJpdGVzLmxlbmd0aCAtPSAxO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fdGV4dC5zcGxpdChcIlwiKS5tYXAoKGMsIGkpID0+IHtcbiAgICAgICAgdGhpcy5zcHJpdGVzW2ldXG4gICAgICAgICAgLnNldEltYWdlKHRoaXMudGFibGVbY10pXG4gICAgICAgICAgLnNldE9yaWdpbih0aGlzLm9yaWdpblgsIHRoaXMub3JpZ2luWSlcbiAgICAgICAgICAuYWRkQ2hpbGRUbyh0aGlzKTtcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCB0b3RhbFdpZHRoID0gdGhpcy5zcHJpdGVzLnJlZHVjZSgodywgcykgPT4gdyArICh0aGlzLmZpeFdpZHRoIHx8IHMud2lkdGgpLCAwKTtcbiAgICAgIGNvbnN0IHRvdGFsSGVpZ2h0ID0gdGhpcy5zcHJpdGVzLm1hcChfID0+IF8uaGVpZ2h0KS5zb3J0KCkubGFzdDtcblxuICAgICAgbGV0IHggPSB0b3RhbFdpZHRoICogLXRoaXMub3JpZ2luWDtcbiAgICAgIHRoaXMuc3ByaXRlcy5mb3JFYWNoKChzKSA9PiB7XG4gICAgICAgIGNvbnN0IHdpZHRoID0gdGhpcy5maXhXaWR0aCB8fCBzLndpZHRoO1xuICAgICAgICBzLnggPSB4ICsgd2lkdGggKiBzLm9yaWdpblg7XG4gICAgICAgIHggKz0gd2lkdGg7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIF9hY2Nlc3Nvcjoge1xuICAgICAgdGV4dDoge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLl90ZXh0O1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICB0aGlzLnNldFRleHQodik7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG5cbiAgfSk7XG5cbn0pO1xuIl19
