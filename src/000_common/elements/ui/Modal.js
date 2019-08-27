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
