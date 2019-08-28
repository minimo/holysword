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
