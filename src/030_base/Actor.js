phina.namespace(function() {

  phina.define('Actor', {
    superClass: 'DisplayElement',

    // 012
    // 3*5
    // 678
    direction: 0,
    state: "",

    sprite: null,

    isAnimation: false,
    nowAnimation: "",
    animationInterval: 10,
    animationTime: 0,

    isJump: false,
    isAttack: false,

    time: 0,

    init: function(options) {
      this.superInit();

      this.setupAnimation();

      this.on('enterframe', () => {
        //アニメーション
        if (this.sprite && this.isAnimation && this.animationTime % this.animationInterval == 0) {
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
        this.animationTime++;
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
      this.animationTime = 0;
      return this;
    },

  });

});
