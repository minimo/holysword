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

      this.weapon = Sprite("weapons", 16, 16)
        .setFrameIndex(0)
        .disable()
        .addChildTo(this);
    },

    update: function() {
      this.isAnimation = false;
      const app = phina_app;
      const ctrl = app.controller;
      let animationName = "";
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

      if (ctrl.up || ctrl.down || ctrl.left || ctrl.right || this.isJump || this.isAttack) this.isAnimation = true;
      this.setAnimation(animationName);

      this.checkCollision();
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
      this.frame["damage"] = [ 18, 19, 20];
      this.frame["drop"] = [18, 19, 20];
      this.frame["dead"] = [18, 19, 20, 33, 34, 35, "stop"];
      this.frame["clear"] = [24, 25, 26];
      this.frame["stun"] = [ 18, 19, 20];
      this.index = -1;
      return this;
    },

    checkCollision: function() {

    },

  });

});
