phina.namespace(function() {

  phina.define('Actor', {
    superClass: 'DisplayElement',

    //0を上として、時計回りに45度づつ
    direction: 0,
    state: null,

    vx: 0,
    vy: 0,

    sprite: null,

    isAnimation: false,
    nowAnimation: "",
    animationInterval: 10,
    animationTime: 0,

    isJump: false,
    isAttack: false,
    beforeFrame: null,

    floorNumber: 0,

    time: 0,

    init: function(options) {
      this.superInit(options);

      this.setupAnimation();

      this.beforeFrame = {
        collision: {},
        floor: {},
      };

      this.base = DisplayElement().addChildTo(this);
      this.mask = DisplayElement().addChildTo(this);

      this.collision = DisplayElement({ width: 16, height: 8 })
        .setPosition(0, 16)
        .addChildTo(this)

      this.on('enterframe', () => {
        //アニメーション
        if (this.sprite && this.sprite_mask && this.isAnimation && this.animationTime % this.animationInterval == 0) {
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
            this.sprite_mask.frameIndex = next;
          }
        }
        this.time++;
        this.animationTime++;
      });
      this.time = 0;
    },

    setShadow: function(options) {
      if (this.shadow) return this;
      options = ({} || options).$safe({
        y: 16,
        scale: 0.8,
      });
      this.shadow = Sprite("shadow")
        .setPosition(0, options.y)
        .setScale(options.scale)
        .addChildTo(this.base);
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
