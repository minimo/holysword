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
