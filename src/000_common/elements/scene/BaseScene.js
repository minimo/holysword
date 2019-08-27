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
