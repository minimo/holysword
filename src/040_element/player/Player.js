phina.namespace(function() {

  phina.define('Player', {
    superClass: 'Actor',

    init: function() {
      this.superInit({ width: 32, height: 32 });

      this.setShadow();

      this.sprite = Sprite("actor4", 32, 32)
        .setFrameIndex(0)
        .addChildTo(this);

      this.nowAnimation = "down";

      this.weapon = Sprite("weapons", 16, 16)
        .setFrameIndex(0)
        .disable()
        .addChildTo(this);

      this.collision = DisplayElement({ width: 32, height: 8 })
        .setPosition(0, 16)
        .addChildTo(this)
    },

    update: function() {
      this.isAnimation = false;
      const app = phina_app;
      const ctrl = app.controller;
      let animationName = "";
      let vx = 0;
      let vy = 0;
      if (ctrl.up) {
        vy = -2;
        animationName = "up";
      } else if (ctrl.down) {
        vy = 2;
        animationName = "down";
      }
      if (ctrl.left) {
        vx = -2;
        animationName += "left";
      } else if (ctrl.right) {
        vx = 2;
        animationName += "right";
      }

      if (ctrl.attack) {
        if (!this.isAttack) {
          this.isAttack = true;
        }
      }

      if (ctrl.up || ctrl.down || ctrl.left || ctrl.right || this.isJump || this.isAttack) this.isAnimation = true;
      this.setAnimation(animationName);

      const x = this.x + vx;
      const y = this.y + vy;
      const res1 = this.checkCollision(x, y);
      const res2 = this.checkFloor(x, y);
      if (!res1.isCollision && res2.isCollision || res2.isBridge) {
        this.x += vx;
        this.y += vy;
        if (res1.isCover || res2.isCover) {
          this.alpha = 0.5;
        } else {
          this.alpha = 1.0;
        }

        if (res2.isBridge) {
          this.alpha = 1.0;
          this.floorNumber = res2.floorNumber;
        }
      }

      if (ctrl.jump && !res2.isBridge) {
        if (!this.isJump) {
          this.isJump = true;
          this.sprite.tweener.clear()
            .by({ y: -32 }, 250, "easeOutSine")
            .by({ y: 32 }, 250, "easeInSine")
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
      this.frame["damage"] = [ 18, 19, 20];
      this.frame["drop"] = [18, 19, 20];
      this.frame["dead"] = [18, 19, 20, 33, 34, 35, "stop"];
      this.frame["clear"] = [24, 25, 26];
      this.frame["stun"] = [ 18, 19, 20];
      this.index = -1;
      return this;
    },

    setCollisionData: function(collisionData) {
      this.collisionData = collisionData;
      return this;
    },

    setFloorData: function(floorData) {
      this.floorData = floorData;
      return this;
    },

    checkCollision: function(x, y) {
      const ox = this.x;
      const oy = this.y;
      this.x = x;
      this.y = y;
      this._calcWorldMatrix();
      this.collision._calcWorldMatrix();
      let result = {
        isCollision: false,
        isCover: false,
      };
      this.collisionData.forEach(e => {
        if (this.collision.hitTestElement(e)) {
          if (e.floorNumber[this.floorNumber]) {
            result.isCollision = true;
          } else {
            for (let i = this.floorNumber + 1; i < e.floorNumber.length; i++) {
              if (e.floorNumber[i]) result.isCover = true;
            }
          }
        }
      });
      this.x = ox;
      this.y = oy;
      this._calcWorldMatrix();
      this.collision._calcWorldMatrix();
      return result;
    },

    checkFloor: function(x, y) {
      const ox = this.x;
      const oy = this.y;
      this.x = x;
      this.y = y;
      this._calcWorldMatrix();
      this.collision._calcWorldMatrix();
      let result = {
        isCollision: false,
        isCover: false,
        isBridge: false,
        floorNumber: 0,
      };
      if (this.floorNumber == 0) result.isCollision = true;
      this.floorData.forEach(e => {
        if (this.collision.hitTestElement(e)) {
          if (e.bridge) {
            result.isCollision = true;
            result.isBridge = true;
          } else if (e.floorNumber[this.floorNumber]) {
              result.isCollision = true;
          } else {
            for (let i = this.floorNumber + 1; i < e.floorNumber.length; i++) {
              if (e.floorNumber[i]) {
                result.isCover = true;
                result.floorNumber = i;
              }
            }
          }
        }
      });
      this.x = ox;
      this.y = oy;
      this._calcWorldMatrix();
      this.collision._calcWorldMatrix();
      return result;
    },

  });

});
