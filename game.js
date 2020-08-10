/**
 * Alpha.
 * Code for mario maker
 */
var playerSize = [30, 30];
var pJumpHeight = 8;
var playerColor;
var grid = 32;
var score = 0;
var width, height;
var level = 0;

if (!localStorage.getItem("level")) {
  localStorage.setItem("level", 0);
}
if (!localStorage.getItem("score")) {
  localStorage.setItem("score", 0);
}
level = parseInt(localStorage.getItem("level"));
score = parseInt(localStorage.getItem("score"));

var keys = [];
var level_h;
var level_w;
var transparence = 0;
var redTrans = 0;
var cam;
var scene = "home";
var clouds = [];

function setup() {
  playerColor = color(255, 0, 0);
  noStroke();
  var canvas = createCanvas(windowWidth, windowHeight);
  canvas.class("game")
  width = windowWidth, height = windowHeight;
  textAlign(RIGHT);
  level_h = windowWidth * 1234e+5;
  level_w = windowHeight * 1234e+5;
  var options = {
    preventDefault: true
  };

  var hammer = new Hammer(document.body, options);
  hammer.get('swipe').set({
    direction: Hammer.DIRECTION_ALL
  });

  hammer.on("swipe", swiped);
}

//@key interaction
keyPressed = function () {
  keys[keyCode] = true;
  return false;
};
keyReleased = function () {
  keys[keyCode] = false;
  return false;
};
var polygonCollide = function (shape1, shape2) {
  var isBetween = function (c, a, b) {
    return (a - c) * (b - c) <= 0;
  };
  /* Do ranges a and b overlap? */
  var overlap = function (a, b) {
    return isBetween(b.min, a.min, a.max) || isBetween(a.min, b.min, b.max);
  };
  /*
   * Project shape onto axis.  Simply
   * compute dot products between the
   * shape's vertices and the axis, and
   * keep track of the min and max values.
   */
  var project = function (shape, axis) {
    var mn = Infinity;
    var mx = -Infinity;
    for (var i = 0; i < shape.length; i++) {
      var dot = shape[i].x * axis.x + shape[i].y * axis.y;
      mx = max(mx, dot);
      mn = min(mn, dot);
    }
    return {
      min: mn,
      max: mx
    };
  };
  /* Compute all projections axes of shape. */
  var getAxes = function (shape) {
    var axes = [];
    for (var i = 0; i < shape.length; i++) {
      var n = (i + 1) % shape.length;
      /*
       * The edge is simply the delta between i and n.
       * The axis is the edge's normal. And a normal 
       * of (x, y) is either of (y, -x) or (-y, x).
       */
      axes[i] = {
        y: shape[i].x - shape[n].x,
        x: -(shape[i].y - shape[n].y)
      };
    }
    return axes;
  };
  var shapes = [shape1, shape2];
  for (var s = 0; s < shapes.length; s++) {
    var axes = getAxes(shapes[s]);
    for (var i = 0; i < axes.length; i++) {
      var axis = axes[i];
      /* Project both shapes onto this axis */
      var p1 = project(shape1, axis);
      var p2 = project(shape2, axis);
      if (!overlap(p1, p2)) {
        /* The two shapes cannot overlap */
        return false;
      }
    }
  }
  return true; /* they overlap */
}; //for triangular collisions

//@Camera
var Camera1 = function (x, y) {
  this.x = x;
  this.y = y;
  this.w = width;
  this.h = height;
  this.view = function (plyer) {
    this.x = plyer.x;
    this.y = plyer.y;
    this.x = constrain(this.x, this.w / 2, level_w - this.w / 2);
    this.y = constrain(this.y, this.h / 2, level_h - this.h / 2);
    translate(width / 2 - this.x, height / 2 - this.y);
  };
};
var view = function (obj) {
  return obj.x + width / 2 - cam.x < width && obj.x + width / 2 - cam.x > -obj.w &&
    obj.y + height / 2 - cam.y < height && obj.y + height / 2 - cam.y > -obj.h;
};
var collide = function (obj1, obj2) {
  return obj1.x < obj2.x + obj2.w && obj1.x + obj1.w > obj2.x &&
    obj1.y < obj2.y + obj2.h && obj1.y + obj1.h > obj2.y;
};

//@player
var Player = function (x, y, w, h) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.speed = 3.0;
  this.yvel = 0;
  this.xvel = 0;
  this.gravity = 0.3;
  this.JH = pJumpHeight;
  this.falling = false;
  this.speedLimit = 10;
  this.mxvel =-1;
  this.fallLimit = 8;
  this.health = 100;
  this.dir = 0;
  this.color = playerColor; //art stuff
  this.dead = false;
  this.deadTimer = 0;
  this.update = function (blocks) {
    this.sight = this.w / 4; //calculate the offset of the face based on the width of the player.
    if (!this.dead) { //moving
      if (keys[UP_ARROW] && !this.falling) {
        this.yvel = -this.JH;
      }
      if (keys[RIGHT_ARROW]) {
        this.xvel += this.speed;
        this.dir += this.speed;
      }
      if (keys[LEFT_ARROW]) {
        this.xvel -= this.speed;
        this.dir -= this.speed;
      }
    }
    cam = new Camera1(this.x, this.y)
    if (!keys[RIGHT_ARROW] && !keys[LEFT_ARROW]) {
      if (this.dir > 0) {
        this.dir -= this.speed;
      }
      if (this.dir < 0) {
        this.dir += this.speed;
      }
      if (this.xvel > 0) {
        this.xvel -= this.speed;
      }
      if (this.xvel < 0) {
        this.xvel += this.speed;
      }
    }
    this.dir = constrain(this.dir, -this.sight, this.sight);
    this.xvel = constrain(this.xvel, -this.speedLimit, this.speedLimit);
    if (this.yvel > this.fallLimit) {
      this.yvel = this.fallLimit;
    }
    this.x = constrain(this.x, 0, level_w - this.w);
    this.x += this.xvel;
    this.x += this.mxvel;
    this.applyCollision(blocks, this.xvel, 0); // apply speed and collisions
    this.applyCollision(blocks, this.mxvel, 0); // apply speed and collisions
    this.falling = true;
    this.y += this.yvel;
    this.applyCollision(blocks, 0, this.yvel);
    this.yvel += this.gravity;
    if (this.health <= 0) {
      this.dead = true;
      score = 0;
      localStorage.setItem("score", score);
    }
    if (this.dead) {
      this.deadTimer += 10;
    }
    if (this.xvel < 0) {
      fill(255, 0, 0);
      rect(this.x, this.y, this.w, this.h);
    }
    if (this.xvel >= 0) {
      fill(255, 255, 0);
      rect(this.x, this.y, this.w, this.h);
    }
  };
  this.draw = function () {
    var d = (this.dir / this.w) * 15;
    /*if (this.xvel <= 0) {
      fill(255, 0, 0);
      rect(this.x, this.y, this.w, this.h);
    }
    if (this.xvel >= 0) {
      fill(255, 25, 0);
      rect(this.x, this.y, this.w, this.h);
    }*/
  };
  this.applyCollision = function (obj, velx, vely) {
    for (var i = 0; i < obj.length; i++) {
      if (collide(this, obj[i]) && obj[i].solid) { // handle collisions
        if (obj[i].type === "ice" || obj[i].type === "shortice") {
          obj[i].melting = true;
        } //make the ice blocks start melting
        if (vely > 0) {
          this.yvel = 0;
          this.falling = false;
          this.y = obj[i].y - this.h;
        }
        if (vely < 0) {
          this.yvel = 0;
          this.falling = true;
          this.y = obj[i].y + obj[i].h;
        }
        if (velx < 0) {
          this.xvel = 0;
          this.mxvel = 0;
          this.x = obj[i].x + obj[i].w;
        }
        if (velx > 0) {
          this.xvel = 0;
          this.mxvel = 0;
          this.x = obj[i].x - this.w;
        }
      }
    }
  };
  this.healthBar = function () {
    textSize(14);
    fill(255);
    rect(20, 20, 100, 15);
    fill(255, 0, 0);
    rect(20, 20, this.health, 15);
    fill(0);
    textAlign(CENTER, CENTER);
    text("Health " + max(0, round(this.health)) + "%", 70, 20 + 15 / 2);
    text("Score " + score, 70, 35 + 15 / 2);
    this.health = constrain(this.health, 0, 100);
  };
};
var player = new Player(200, 100, playerSize[0], playerSize[1]);

//@blocks
var Block = function (x, y, w, h, type, i) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.isImage = i;
  this.type = type;
  this.melting = false;
  this.solid = true;
  this.op = 255;
  this.draw = function () {
    if (view(this)) {
      switch (this.type) {
        case "solid":
          noStroke();
          fill(122, 90, 0);
          rect(this.x, this.y, this.w, this.h);
          fill(31, 232, 0);
          rect(this.x, this.y, this.w, this.h - 25);
          break;
        case "brick":
          noStroke();
          fill(166, 72, 0);
          rect(this.x, this.y, this.w, this.h);
          strokeWeight(2);
          stroke(255, 206, 168);
          fill(255, 206, 168);
          rect(this.x + 1, this.y + 1, this.w - 20, this.h - 20);
          fill(235, 178, 134);
          stroke(235, 178, 134);
          rect(this.x + 18, this.y + 18, this.w - 19, this.h - 19);
          fill(235, 215, 136);
          stroke(235, 215, 136);
          rect(this.x + 24, this.y + 1, this.w - 25, this.h - 25);
          fill(255, 168, 61);
          stroke(255, 168, 61);
          rect(this.x + 1, this.y + 24, this.w - 25, this.h - 25);
          break;
        case "ice":
          strokeWeight(2);
          stroke(255, 255, 255, this.op);
          fill(150, 207, 245, this.op);
          rect(this.x + 1, this.y + 1, this.w - 2, this.h - 2);
          break;
        case "shortice":
          strokeWeight(2);
          stroke(255, 255, 255, this.op);
          fill(150, 207, 245, this.op);
          rect(this.x + 1, this.y + 1, this.w - 2, this.h - 2);
          break;
        case "opened":
          fill(163, 109, 0);
          strokeWeight(2);
          stroke(84, 36, 0);
          rect(this.x + 1, this.y + 1, this.w - 2, this.h - 2);
          break;
      }
    }
  };
  this.update = function () {
    if (this.type === "ice" || this.type === "shortice") {
      if (this.melting) {
        this.op -= 2;
      }
      if (this.op < 50) {
        this.solid = false;
      }
      if (this.op < -120) {
        this.op = 255;
        this.melting = false;
        this.solid = true;
      }
    }
  };
};
var blocks = [];
blocks.add = function (x, y, w, h, t) {
  this.push(new Block(x, y, w, h, t));
};
blocks.apply = function () {
  for (var i = 0; i < this.length; i++) {
    this[i].draw();
    this[i].update();
  }
};

//@portal
var Goal = function (x, y, radius, i) {
  this.x = x;
  this.y = y;
  this.w = radius;
  this.h = radius;
  this.isImage = i;
  this.timer = 0;
  this.complete = false;
  this.color = 0;
  this.draw = function () {
    if (view(this)) {
      noStroke();
      fill(18, 184, 62);
      rect(this.x + 3, this.y, this.w - 6, this.h);
      fill(0, 122, 31);
      rect(this.x, this.y, this.w, this.h - 13);
    }
  };
  this.update = function () {
    if (collide(this, player)) {
      nextlevel();
    }
  };
};
var portals = [];
portals.add = function (x, y, r) {
  this.push(new Goal(x, y, r));
};
portals.apply = function () {
  for (var i = 0; i < this.length; i++) {
    this[i].draw();
    this[i].update();
  }
};

//@coin
var Coin = function (x, y, radius, i) {
  this.x = x;
  this.y = y;
  this.w = radius;
  this.h = radius;
  this.isImage = i;
  this.draw = function () {
    if (view(this)) {
      fill(255, 255, 0);
      ellipse(this.x, this.y, this.w, this.h);
    }
  };
  this.update = function () {
    if (collide(this, player)) {
      score++;
      localStorage.setItem("score", score);
      var i = coins.indexOf(this);
      coins.splice(i, 1);
    }
  };
};
var coins = [];
coins.add = function (x, y, r) {
  this.push(new Coin(x, y, r));
};
coins.apply = function () {
  for (var i = 0; i < this.length; i++) {
    this[i].draw();
    this[i].update();
  }
};

//@mystery box
var MysteryBox = function (x, y, radius, type, i) {
  this.x = x;
  this.y = y;
  this.w = radius;
  this.h = radius;
  this.isImage = i;
  this.type = type;
  this.draw = function () {
    if (view(this)) {
      fill(163, 109, 0);
      strokeWeight(2);
      stroke(84, 36, 0);
      rect(this.x + 1, this.y + 1, this.w - 2, this.h - 2);
      noStroke();
      fill(255, 211, 158);
      rect(this.x + 13, this.y + 4, 3, 3);
      rect(this.x + 11, this.y + 4, 3, 3);
      rect(this.x + 16, this.y + 4, 3, 3);
      rect(this.x + 19, this.y + 7, 3, 3);
      rect(this.x + 19, this.y + 10, 3, 3);
      rect(this.x + 16, this.y + 13, 3, 3);
      rect(this.x + 13, this.y + 16, 3, 3);
      rect(this.x + 13, this.y + 22, 3, 3);
      rect(this.x + 8, this.y + 7, 3, 3);
    }
  };
  this.update = function () {
    if (collide(this, player)) {
      score += 3;
      localStorage.setItem("score", score);
      var i = mboxes.indexOf(this);
      mboxes.splice(i, 1);
      if (this.type == "norm") {
        blocks.add(this.x, this.y, this.w, this.h, "opened");
        blocks.apply();
      }
    }
  };
};
var mboxes = [];
mboxes.add = function (x, y, r, t) {
  this.push(new MysteryBox(x, y, r, t));
};
mboxes.apply = function () {
  for (var i = 0; i < this.length; i++) {
    this[i].draw();
    this[i].update();
  }
};

//@lava
var Lava = function (x, y, s, t, i) {
  this.x = x;
  this.y = y;
  this.w = s;
  this.h = s;
  this.type = t;
  this.s = (s / 3);
  this.isImage = i;
  this.draw = function () {
    if (view(this)) {
      noStroke();
      for (var x = 0; x < this.w; x += this.s) {
        for (var y = 0; y < this.h; y += this.s) {
          this.type == "lava"
            ? fill(random(100, 200), 0, 0)
            : fill(0, random(100, 200), 0);
          rect(this.x + x, this.y + y, this.s, this.s);
        }
      }
    }
  };
  this.update = function () {
    if (collide(this, player)) {
      player.health -= 2;
      redTrans = 80;
    }
  };
};
var lava = [];
lava.add = function (x, y, s, t) {
  lava.push(new Lava(x, y, s, t));
};
lava.apply = function () {
  for (var i = 0; i < lava.length; i++) {
    lava[i].draw();
    lava[i].update();
  }
};

//@spikes
var Spike = function (x, y, w, h, type, i) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.type = type;
  this.isImage = i;
  this.draw = function () {
    if (view(this)) {
      fill(120);
      noStroke();
      switch (this.type) {
        case "up":
          triangle(this.x + this.w / 2, this.y, this.x, this.y + this.h, this.x + this.w, this.y + this.h);
          break;
        case "down":
          triangle(this.x + this.w / 2, this.y + this.h, this.x, this.y, this.x + this.w, this.y);
          break;
        case "left":
          triangle(this.x, this.y + this.h / 2, this.x + this.w, this.y + this.h, this.x + this.w, this.y);
          break;
        case "right":
          triangle(this.x + this.w, this.y + this.h / 2, this.x, this.y + this.h, this.x, this.y);
          break;
      }
    }
  };
  this.update = function () {
    var pcoord = [
      { x: player.x, y: player.y },
      { x: player.x + player.w, y: player.y },
      { x: player.x + player.w, y: player.y + player.h },
      { x: player.x, y: player.y + player.h }
    ];
    function tatriangle(a, b, c, d, e, f) {
      return [{ x: a, y: b }, { x: c, y: d }, { x: e, y: f }]
    }
    var tup = tatriangle(this.x + this.w / 2, this.y, this.x, this.y + this.h, this.x + this.w, this.y + this.h);
    var tdown = tatriangle(this.x + this.w / 2, this.y + this.h, this.x, this.y, this.x + this.w, this.y);
    var tleft = tatriangle(this.x, this.y + this.h / 2, this.x + this.w, this.y + this.h, this.x + this.w, this.y);
    var tright = tatriangle(this.x + this.w, this.y + this.h / 2, this.x, this.y + this.h, this.x, this.y);
    var cols = {
      up: polygonCollide(pcoord, tup),
      down: polygonCollide(pcoord, tdown),
      left: polygonCollide(pcoord, tleft),
      right: polygonCollide(pcoord, tright)
    };
    var this_true = cols[this.type];
    if (this_true) {
      switch (this.type) {
        case "up":
          player.yvel = -player.JH;
          break;
        case "down":
          player.falling = true;
          player.yvel = 3;
          break;
        case "left":
          player.xvel = -11;
          break;
        case "right":
          player.xvel = 11;
          break;
      }
      player.health -= 5;
      redTrans = 80; //red flash
    }
  };
};
var spikes = [];
spikes.add = function (x, y, s, s, t) {
  this.push(new Spike(x, y, s, s, t));
};
spikes.apply = function () {
  for (var i = 0; i < spikes.length; i++) {
    this[i].draw();
    this[i].update();
  }
};

//@jumpBlocks
var JumpBlock = function (x, y, w, h, i) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.isImage = i;
  this.draw = function () {
    if (view(this)) {
      fill(255, 71, 169);
      noStroke();
      rect(this.x, this.y, this.w, this.h);
    }
  };
  this.update = function () {
    if (collide(this, player)) {
      player.yvel = -player.JH * 1.3;
    }
  };
};
var jumpBlocks = [];
jumpBlocks.add = function (x, y, w, h) {
  this.push(new JumpBlock(x, y, w, h));
};
jumpBlocks.apply = function () {
  for (var i = 0; i < this.length; i++) {
    this[i].draw();
    this[i].update();
  }
};

//@bullet
var Bullet = function (x, y, s, angle) {
  this.x = x;
  this.y = y;
  this.w = s;
  this.h = s;
  this.deleted = false;
  this.angle = angle;
  this.draw = function () {
    if (!this.deleted && view(this)) {
      noStroke();
      fill(50);
      ellipseMode(CORNER);
      ellipse(this.x, this.y, this.w, this.h);
      ellipseMode(CENTER);
    }
  };
  this.update = function () {
    this.x += cos(this.angle) * 2;
    this.y += sin(this.angle) * 2;
    if (collide(this, player) && !this.deleted && !player.dead) {
      this.deleted = true;
      player.health -= 10;
      redTrans = 80;
    }
    for (var i = 0; i < blocks.length; i++) {
      if (collide(this, blocks[i]) && !this.deleted) {
        this.deleted = true;
      }
    }
  };
};
var bullets = [];
bullets.add = function (x, y, angle) {
  this.push(new Bullet(x, y, 5, angle));
};
bullets.apply = function () {
  for (var i = 0; i < this.length; i++) {
    bullets[i].draw();
    bullets[i].update();
    if (bullets[i].deleted) {
      bullets.splice(i, 1);
    }
  }
};

//@cannon
var Cannon = function (x, y, w, h) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.angle = Math.atan2(this.x - player.x, player.y - this.y);
  this.bullets = [];
  this.draw = function () {
    if (view(this)) {
      push();
      fill(80);
      translate(this.x + this.w / 2, this.y + this.h / 2);
      rotate(this.angle);
      rect(-5, 5, this.w / 3, 10);
      pop();
      ellipse(this.x, this.y, this.w, this.h);
    }
  };
  this.update = function () {
    this.angle = Math.atan2(this.x - player.x, player.y - this.y);
    if ((frameCount % 50) === 0) {
      bullets.add(this.x + this.w / 2, this.y + this.w / 2, this.angle + 90);
    }
  };
};
var cannons = [];
cannons.add = function (x, y, s) {
  this.push(new Cannon(x, y, s, s));
};
cannons.apply = function () {
  for (var i = 0; i < this.length; i++) {
    this[i].draw();
    this[i].update();
  }
};
//@Monster
var Monster = function (x, y, w, h) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.dead = false; // is the monster "dead"?
  this.xvel = 1; // monster's speed
  this.angle = 0; // the monster's eye's angle
  this.draw = function () {
    if (!this.dead) {
      // Draw the monster
      fill(127, 73, 2);
      rect(this.x, this.y, this.w, this.h);
    }
  };
  this.update = function () {
    if (!this.dead) {
      this.angle = Math.atan2(this.x - player.x, player.y - this.y);//make the angle point to the player
      this.x += this.xvel;
      for (var i = 0; i < blocks.length; i++) {
        if (collide(this, blocks[i])) {
          this.xvel = -this.xvel;
        }
      }
      if (collide(this, player)) {
        if (!player.falling && !this.dead && !player.dead) {
          player.health -= 5;
          redTrans = 80;
        } else if (player.yvel > 0 && player.falling) {
          score += 2;
          localStorage.setItem("score", score);
          this.dead = true; // the monster is "dead"
          player.yvel = -player.JH; // make the player hop 
        }
      }
    }
  };
};
var monsters = [];
monsters.add = function (x, y, w, h) {
  monsters.push(new Monster(x, y, w, h));
};
monsters.apply = function () {
  for (var i = 0; i < monsters.length; i++) {
    monsters[i].update();
    monsters[i].draw();
    if (monsters[i].dead) {
      monsters.splice(i, 1);
    }
  }
};
//manage the objects in the game
var objects = [blocks, portals, lava, spikes, jumpBlocks, cannons, bullets, monsters, coins, mboxes];
objects.remove = function () {
  for (var i = 0; i < objects.length; i++) {
    for (var j = 0; j < objects[i].length; j++) {
      objects[i].splice(j, objects[i].length);
    }
  }
};
// Draw blocks
var updateMap = function () {
  localStorage.setItem("level", level);
  objects.remove();
  for (var col = 0; col < leveler[level].length; col++) {
    var cells = leveler[level][col];
    for (var row = 0; row < cells.length; row++) {
      switch (cells[row]) {
        case "b":
          blocks.add(row * grid, col * grid, grid, grid, "solid");
          break;
        case "@":
          portals.add(row * grid, col * grid, grid);
          break;
        case "_":
          blocks.add(row * grid, col * grid + (grid / 3) * 2, grid * 2, grid / 3, "ice");
          break;
        case "X":
          blocks.add(row * grid, col * grid, grid, grid, "brick");
          break;
        case "-":
          blocks.add(row * grid, col * grid, grid, grid, "shortice");
          break;
        case "#":
          lava.add(row * grid, col * grid, grid, "lava");
          break;
        case "E":
          lava.add(row * grid, col * grid, grid, "acid");
          break;
        case "?":
          mboxes.add(row * grid, col * grid, grid, "norm");
          break;
        case "C":
          mboxes.add(row * grid, col * grid, grid, "not");
          break;
        case "P":
          player = new Player(row * grid - (player.w - grid) / 2, col * grid - (player.h - grid) / 2, playerSize[0], playerSize[1]);
          break;
        case "A":
          spikes.add(row * grid, col * grid, grid, grid, "up");
          break;
        case "V":
          spikes.add(row * grid, col * grid, grid, grid, "down");
          break;
        case "<":
          spikes.add(row * grid, col * grid, grid, grid, "left");
          break;
        case ">":
          spikes.add(row * grid, col * grid, grid, grid, "right");
          break;
        case "M":
          jumpBlocks.add(row * grid, col * grid + grid * 2 / 3, grid, grid / 3);
          break;
        case "%":
          cannons.add(row * grid, col * grid, grid);
          break;
        case "&":
          monsters.add(row * grid, col * grid, grid, grid);
          break;
        case "O":
          coins.add(row * grid, col * grid, grid, grid);
          break;
      }
      level_w = leveler[level][col].length * grid;
      level_h = leveler[level].length * grid;
    }
  }
};
var resetCam = function () {
  cam.x = player.x;
  cam.y = player.y;
}; //reset the cam to the player's location.

function drawbg() {
  background(120, 210, 255);
}

var nextlevel = function () {
  $('.game,.close').fadeOut(500);
  updateMap();
  resetCam();
}
var applyGame = function () {
  blocks.apply();
  portals.apply();
  if (!player.dead) {
    player.draw();
  }
  lava.apply();
  spikes.apply();
  jumpBlocks.apply();
  monsters.apply();
  bullets.apply();
  cannons.apply();
  coins.apply();
  mboxes.apply();
  player.update(blocks);
};
updateMap();
var cam = new Camera1(player.x, player.y);
var draw = function () {
  drawbg();
  switch (scene) {
    case "home":
      noStroke();
      push();
      cam.view(player);
      applyGame();
      pop();
      player.healthBar();
      if (player.deadTimer > 10) {
        updateMap();
        resetCam();
      }
      //@transparency
      {
        fill(255, 255, 255, transparence);
        rect(0, 0, width, height);
        fill(255, 0, 0, redTrans);
        rect(0, 0, width, height);
        transparence -= 0.2;
        redTrans -= 1;
        transparence = constrain(transparence, 0, 255);
        redTrans = constrain(redTrans, 0, 255);
      }
      break;
  }
};
function swiped(event) {
  if (event.direction == 4) {//right
    if (player.mxvel < 5) {
      if (player.mxvel < 0) {
        player.mxvel = 0;
      }
      player.mxvel += 1;
    }
  } else if (event.direction == 8) {//up
    if (!player.falling) {
      player.yvel = -pJumpHeight;
    }
  } else if (event.direction == 2) {//left
    if (player.mxvel > -5) {
      if (player.mxvel > 0) {
        player.mxvel = 0;
      }
      player.mxvel += -1;
    }
  } else if (event.direction == 16) {//down
    player.mxvel = 0;
  }
}
function change(level) {
  leveler = level;
  updateMap();
  resetCam();
}