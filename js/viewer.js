/**
 * @fileOverview 応力集中部ビューアクラス
 *
 * @author Fumiya Nakamura
 * @version 1.0.0
 */

/**
 * Three.jsを利用して3Dモデルを描画、断面を取ることができます。
 *
 * @class 応力集中部ビューアのクラスです。<br>
 * Three.jsを利用して3Dモデルを描画し、断面を取る機能を保有します。
 *
 * @param {Hash} config 設定情報
 *
 * @example
 * var config = {
 *   type: 'c'
 * }
 * var viewerC = new Viewer(config);
 */
function Viewer(config) {
  /**
   * Viewerの種類
   * @return {String}
   */
  this.type = config.type
  log('config.type = ' + config.type);
  log('this.type = ' + this.type);

  /**
   * Viewerの幅
   * @return {Number}
   */
  this.width = window.innerWidth;
  /**
   * Viewerの高さ
   * @return {Number}
   */
  this.height = window.innerHeight;
  /**
   * Viewerの縦横比
   * @return {Number}
   */
  this.aspect = this.width / this.height;
  /**
   * Cameraのクリッピング手前
   * @return {Number}
   */
  this.near = 1;
  /**
   * Cameraのクリッピング奥
   * @return {Number}
   */
  this.far = 10000;
  /**
   * Cameraの角度
   * @return {Number}
   */
  this.angle = 45;
  /**
   * マウスがクリックされている状態か
   * @return {Bool}
   */
  this.MOUSE_DOWN = false;
  /**
   * マウス（タッチ）でドラッグされている状態か
   * @return {Bool}
   */
  this.DRAGGING = false;
  /**
   * タッチ動作継続時間
   * @return {Number}
   */
  this.DRAGGING_TIME_MS = 0;
  /**
   * タッチ動作継続時間を数えるためのタイマーID
   * @return {Number}
   */
  this.timerID = 0;
  /**
   * マウス（タッチ）のmoveイベント実行回数
   * @return {Number}
   */
  this.moveEventCount = 0;

  /**
   * 最初に断面をとった時のcubesのx位置
   * @return {Number}
   */
  this.firstClickedX = null;
  /**
   * 最初に断面をとった時のcubesのz位置
   * @return {Number}
   */
  this.firstClickedZ = null;

  /**
   * 回転動作用の目標位置
   * @return {Number}
   */
  this.targetRotationX = 0;
  /**
   * マウスダウン時の回転動作用の目標位置
   * @return {Number}
   */
  this.targetRotationOnMouseDownX = 0;
  /**
   * マウスのx位置
   * @return {Number}
   */
  this.mouseX = 0;
  /**
   * マウスダウン時のマウスのx位置
   * @return {Number}
   */
  this.mouseXOnMouseDown = 0;

  /**
   * マルチタッチが検出されているか
   * @return {Bool}
   */
  this.MULTI_TOUCH_DETECTED = false;
  /**
   * 最大タッチ数
   * @return {Number}
   */
  this.CURRENT_MAX_TOUCH_COUNT = 0;
  /**
   * タッチエンド数
   * @return {Number}
   */
  this.TOUCH_END_COUNT = 0;

  // Sound
  /**
   * 再生する音声ID
   * @return {String}
   */
  this.soundID = 'Swoosh';
  this.loadSound();

  this.scene = this.createScene();
  this.group = new THREE.Object3D();
  var edgegroup = new THREE.Object3D();
  this.camera = this.createCamera();
  this.controls = this.createControls();

  var light = this.createLight();
  this.cubes = this.createCubes();
  this.renderer = this.createRenderer();

  this.mouse = new THREE.Vector2()

  this.scene.add(light);

  for(key in this.cubes) {
    this.group.add(this.cubes[key]);
    var edge = new THREE.EdgesHelper(this.cubes[key], 0xffffff);
    edge.material.linewidth = 0.1;
    edgegroup.add(edge);
  }

  this.scene.add(this.group);
  this.scene.add(edgegroup);
  this.scene.add(this.createPlane());

  this.movedObjects = [];

  this.animate();

  // Custom Event
  this.constructEventListner(this);

  var container = $('body').append('<div>');
  $(container).append(this.renderer.domElement);

  // Suppress mobile scroll
  document.ontouchmove = function(e) {e.preventDefault()};
  $(container).ontouchmove = function(e) {e.stopPropagation()};
}

Viewer.prototype.createRenderer = function(){
  var renderer =  new THREE.WebGLRenderer(
    { antialias: true, alpha: true }
  );
  renderer.setSize(this.width, this.height);
  return renderer;
}

Viewer.prototype.createCamera = function(){
  var myCamera = new THREE.PerspectiveCamera(this.angle, this.aspect, this.near, this.far);
  myCamera.position.x = 30;
  myCamera.position.y = 30;
  myCamera.position.z = 30;
  return myCamera;
}

Viewer.prototype.createControls = function(){
  var myControls = new THREE.TrackballControls(this.camera);
  myControls.rotateSpeed = 1.0;
  myControls.zoomSpeed = 1.2;
  myControls.panSpeed = 0.8;
  myControls.noRotate = true;
  myControls.noZoom = false;
  myControls.noPan = true;
  myControls.staticMoving = true;
  myControls.dynamicDampingFactor = 0.3;
  return myControls;
}

Viewer.prototype.createScene = function(){
  var scene = new THREE.Scene();
  return scene;
}

Viewer.prototype.createLight = function(){
  var light = new THREE.AmbientLight(0xffffff);
  light.position.set(0, 500, 2000);
  return light;
}

Viewer.prototype.createCube = function(id, x, y, z, color) {
  // TODO: Refactor
  // For bone-mises
  // var geometry = new THREE.CubeGeometry(0.14, 0.14, 0.14);
  var geometry = new THREE.CubeGeometry(1, 1, 1);
  var material = new THREE.MeshLambertMaterial(
    { color: color }
  );
  var object = new THREE.Mesh(geometry, material);

  object.material.ambient = object.material.color;

  object.position.x = x;
  object.position.y = y;
  object.position.z = z;

  object.castShadow = true;
  object.receiveShadow = true;

  object.ref_id = id;

  return object;
}

Viewer.prototype.processData = function(allText) {
  var objects = {};

  var allTextLines = allText.split(/\r\n|\n/);
  var lines = [];

  for (var i = 0; i < allTextLines.length; i++) {
    // TODO: Refactor
    // For bone-mises
    // if (i % 100 !== 0) {
    //   continue;
    // }
    var data = allTextLines[i].split(',');
    var tarr = [];
    for (var j = 0; j < 8; j++) {
      tarr.push(data[j]);
    }

    // TODO: Contour color generator
    var color;
    max = 0.001977217;
    min = 0.000000039293;
    // TODO: Refactor
    // For bone-mises
    // max = 4.61;
    // min = 0;
    var hsv2rgb = function(h, s, v) {
      // adapted from http://schinckel.net/2012/01/10/hsv-to-rgb-in-javascript/
      var rgb, i, data = [];
      if (s === 0) {
        rgb = [v,v,v];
      } else {
        h = h / 60;
        i = Math.floor(h);
        data = [v*(1-s), v*(1-s*(h-i)), v*(1-s*(1-(h-i)))];
        switch(i) {
          case 0:
            rgb = [v, data[2], data[0]];
            break;
          case 1:
            rgb = [data[1], v, data[0]];
            break;
          case 2:
            rgb = [data[0], v, data[2]];
            break;
          case 3:
            rgb = [data[0], data[1], v];
            break;
          case 4:
            rgb = [data[2], data[0], v];
            break;
          default:
            rgb = [v, data[0], data[1]];
            break;
        }
      }
      return '#' + rgb.map(function(x){
        return ("0" + Math.round(x*255).toString(16)).slice(-2);
      }).join('');
    };
    // 240 - 0 is blue to red
    h = 240 - ((tarr[7] - min)/(max - min)) * 240
    if (isNaN(h)) {
      h = 0;
    }
    color = hsv2rgb(h, 1, 1);

    // Render partial parts
    // if (i % 100 > 50) {
    //   continue;
    // }
    var object = this.createCube(tarr[0], tarr[1] - 5, tarr[2], tarr[3] - 5, color);
    if (object.ref_id == "") continue;
    objects[object.ref_id] = object;

    lines.push(tarr);
  }
  // alert(lines);

  return objects;
}

Viewer.prototype.createCubes = function(){
  var data = $.ajax({
      type: "GET",
      url: "data/sample-mises.csv",
      dataType: "text",
      async: false
  }).responseText;

  return this.processData(data);
};

Viewer.prototype.createPlane = function(){
  var plane =
    new THREE.Mesh(
      new THREE.PlaneGeometry(
        2000,
        2000, 8, 8 ),
      new THREE.MeshBasicMaterial(
        {
          color: 0x000000,
          opacity: 0.25,
          transparent: true,
          wireframe: true } ) );
  plane.visible = false;
  return plane;
}

Viewer.prototype.render = function(){
  //log('mouseX - mouseXOnMouseDown = ' + (this.mouseX - this.mouseXOnMouseDown));
  //log('targetRotationX - group.rotation.y = ' + (this.targetRotationX - this.group.rotation.y));
  if (Math.abs(this.mouseX - this.mouseXOnMouseDown) > 0.1 &&
      Math.abs(this.targetRotationX - this.group.rotation.y) > 0.5 &&
      Math.abs(this.targetRotationX - this.group.rotation.y) < 5) {
    this.group.rotation.y += ( this.targetRotationX - this.group.rotation.y ) * 0.25;
  }

  this.renderer.render(this.scene, this.camera);
  TWEEN.update();
}

Viewer.prototype.getIntersects = function(event) {
  // Return empty array if detecting multi-touch
  log('getIntersects');
  log(event);
  if (event.changedTouches && event.changedTouches.length > 1) {
    log('multi-touch detected');
    return [];
  }

  //FIXME - Figure out whether 2 here and 0.5
  // in the line below are related
  this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  if (event.changedTouches && event.changedTouches.length > 0) {
    this.mouse.x = (event.changedTouches[0].clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = - (event.changedTouches[0].clientY / window.innerHeight) * 2 + 1;
  }

  //FIXME - Figure out logic behind 0.5
  var vector = new THREE.Vector3(this.mouse.x, this.mouse.y ,0.5);

  vector.unproject(this.camera);

  var raycaster = new THREE.Raycaster(
    this.camera.position,
    vector.sub(this.camera.position).normalize()
  );

  var intersects = raycaster.intersectObjects(this.group.children);

  return intersects;
}

Viewer.prototype.cutVoxels = function(event) {
  log('cutVoxels');
  var intersects = this.getIntersects(event);

  if (intersects.length > 0) {
    log('intersects[0]');
    log(intersects[0]);
    log('intersects[0].faceIndex');
    log(intersects[0].faceIndex);
    var faceIndex = intersects[0].faceIndex;
    var point = intersects[0].point
    var selectedObject = intersects[0].object;
    //log('Few Objects Selected '+intersects.length);
    //log(selectedObject);
    //intersects[0].object.material.color.setHex(0x000000);
    var moveObjects = [];

    if (this.type == 'b') {
      log('this.type == b');
      for (key in this.cubes) {
        if (faceIndex == 8 || faceIndex == 9) {
          if (event.ctrlKey) {
            if (this.cubes[key].position.x >= selectedObject.position.x) {
              index = this.movedObjects.indexOf(this.cubes[key])
              if (index > -1) {
                moveObjects.push(this.cubes[key]);
                this.movedObjects.splice(index, 1);
              }
            }
          } else {
            if (this.cubes[key].position.x >= selectedObject.position.x) {
              if ($.inArray(this.cubes[key], this.movedObjects) == -1) {
                moveObjects.push(this.cubes[key]);
                this.movedObjects.push(this.cubes[key]);
              }
            }
          }
        } else if (faceIndex == 0 || faceIndex == 1) {
          if (event.ctrlKey) {
            if (this.cubes[key].position.z >= selectedObject.position.z) {
              index = this.movedObjects.indexOf(this.cubes[key])
              if (index > -1) {
                moveObjects.push(this.cubes[key]);
                this.movedObjects.splice(index, 1);
              }
            }
          } else {
            if (this.cubes[key].position.z >= selectedObject.position.z) {
              if ($.inArray(this.cubes[key], this.movedObjects) == -1) {
                moveObjects.push(this.cubes[key]);
                this.movedObjects.push(this.cubes[key]);
              }
            }
          }
        }
      }
    } else if (this.type == 'c') {
      for (key in this.cubes) {
        if (faceIndex == 8 || faceIndex == 9) {
          if (event.ctrlKey) {
            if (this.cubes[key].position.z >= selectedObject.position.z) {
              index = this.movedObjects.indexOf(this.cubes[key])
              if (index > -1) {
                moveObjects.push(this.cubes[key]);
                this.movedObjects.splice(index, 1);
              }
            }
          } else {
            if (this.cubes[key].position.z >= selectedObject.position.z) {
              if ($.inArray(this.cubes[key], this.movedObjects) == -1) {
                moveObjects.push(this.cubes[key]);
                this.movedObjects.push(this.cubes[key]);
              }
            }
          }
        } else if (faceIndex == 0 || faceIndex == 1) {
          if (event.ctrlKey) {
            if (this.cubes[key].position.x >= selectedObject.position.x) {
              index = this.movedObjects.indexOf(this.cubes[key])
              if (index > -1) {
                moveObjects.push(this.cubes[key]);
                this.movedObjects.splice(index, 1);
              }
            }
          } else {
            if (this.cubes[key].position.x >= selectedObject.position.x) {
              if ($.inArray(this.cubes[key], this.movedObjects) == -1) {
                moveObjects.push(this.cubes[key]);
                this.movedObjects.push(this.cubes[key]);
              }
            }
          }
        }
      }
    }

    if (moveObjects.length > 0) {
      // Sound
      this.playSound();

      for (var i = 0; i < moveObjects.length; i++) {
        log('moveTween');
        this.moveTween(moveObjects[i], selectedObject.position, faceIndex);
      }
    }
  } else {
    log('No Objects Selected');
  }
}

Viewer.prototype.moveTween = function(object, clicked, faceIndex) {
  var position = {
    x:object.position.x,
    y:object.position.y,
    z:object.position.z
  };
  var target = {
    x:object.position.x,
    y:object.position.y,
    z:object.position.z
  };

  if (this.type == 'b') {
    if (faceIndex == 8 || faceIndex == 9) {
      if (!this.firstClickedX) {
        this.firstClickedX = clicked.x;
      }
      if (event.ctrlKey) {
        target.z+=10;
      } else {
        target.x = parseFloat(this.firstClickedX) + parseFloat(position.z - 0.5) + 10;
        target.z = -position.x - 10;
      }
    } else if (faceIndex == 0 || faceIndex == 1) {
      if (!this.firstClickedZ) {
        this.firstClickedZ = clicked.x;
      }
      if (event.ctrlKey) {
        target.z+=10;
      } else {
        target.x = - position.z - 10
        target.z = parseFloat(this.firstClickedZ) + parseFloat(position.x - 0.5) + 10;
      }
    }
  } else if (this.type == 'c') {
    if (faceIndex == 8 || faceIndex == 9) {
      if (!this.firstClickedX) {
        this.firstClickedX = clicked.x;
      }
      if (event.ctrlKey) {
        target.x+=10;
      } else {
        target.x-=10;
      }
    } else if (faceIndex == 0 || faceIndex == 1) {
      if (!this.firstClickedZ) {
        this.firstClickedZ = clicked.x;
      }
      if (event.ctrlKey) {
        target.z+=10;
      } else {
        target.z-=10;
      }
    }
  }
  tween = new TWEEN.Tween(position).to(target, 100);
  tween.start();
  tween.onUpdate(function(){
    log('tween.onUpdate');
    log('object.position.x = ' + this.x);
    log('object.position.z = ' + this.z);
    object.position.x = this.x;
    object.position.z = this.z;
    object.needsUpdate = true;
  });
}

Viewer.prototype.loadSound = function() {
  createjs.Sound.registerSound('./sounds/swoosh.mp3', this.soundID);
}

Viewer.prototype.playSound = function() {
  createjs.Sound.play(this.soundID);
}

Viewer.prototype.animate = function(){
  requestAnimationFrame(this.animate.bind(this));
  log('animate');
  this.controls.update();
  this.render();
}

Viewer.prototype.constructEventListner = function(_self) {
  this.renderer.domElement.addEventListener('mousemove', this.onDocumentMouseMove(_self), false);
  this.renderer.domElement.addEventListener('mousedown', this.onDocumentMouseDown(_self), false);
  this.renderer.domElement.addEventListener('mouseup', this.onDocumentMouseUp(_self), false);
  this.renderer.domElement.addEventListener('mouseout', this.onDocumentMouseOut(_self), false);
  // Touch
  this.renderer.domElement.addEventListener('touchmove', this.touchmove(_self), false );
  this.renderer.domElement.addEventListener('touchstart', this.touchstart(_self), false );
  this.renderer.domElement.addEventListener('touchend', this.touchend(_self), false );
}

Viewer.prototype.onDocumentMouseMove = function(_self) {
  return function(event) {
    log('MouseMove');
    event.preventDefault();
    _self.DRAGGING = true;

    if (_self.MOUSE_DOWN) {
      _self.moveEventCount++;
      log('moveEventCount');
      log(_self.moveEventCount);

      _self.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      _self.targetRotationX = _self.targetRotationOnMouseDownX + (_self.mouseX - _self.mouseXOnMouseDown) * 3.05;

      // log('targetRotationX = ' + targetRotationX);
    }
  }
}

Viewer.prototype.onDocumentMouseDown = function(_self) {
  return function(event) {
    log('MouseDown');
    event.preventDefault();
    _self.MOUSE_DOWN = true;
    _self.moveEventCount = 0;
    if (_self.getIntersects(event).length > 0) {
      _self.controls.enabled = false;
    }

    _self.mouseXOnMouseDown = (event.clientX / window.innerWidth) * 2 - 1;
    _self.targetRotationOnMouseDownX = _self.targetRotationX;
  }
}

Viewer.prototype.onDocumentMouseUp = function(_self) {
  return function(event) {
    log('MouseUp');
    event.preventDefault();
    _self.controls.enabled = true;

    if (_self.type == 'b') {
      if (_self.DRAGGING && _self.moveEventCount > 5) {
        _self.cutVoxels(event);
      }
    } else if (_self.type == 'c') {
      _self.cutVoxels(event);
    }
    _self.DRAGGING = false;
    _self.MOUSE_DOWN = false;
    _self.moveEventCount = 0;
  }
}

Viewer.prototype.onDocumentMouseOut = function(_self) {
  return function(event) {
    log('MouseOut');
    event.preventDefault();
    _self.controls.enabled = true;
    _self.MOUSE_DOWN = false;
  }
}

Viewer.prototype.touchmove = function(_self) {
  return function(event) {
    log('touchmove');
    event.preventDefault();
    _self.DRAGGING = true;
    _self.moveEventCount++;
    log('moveEventCount = ' + _self.moveEventCount);

    _self.mouseX = (event.touches[0].pageX / window.innerWidth) * 2 - 1;
    _self.targetRotationX = _self.targetRotationOnMouseDownX + (_self.mouseX - _self.mouseXOnMouseDown) * 2.05;

    // log('targetRotationX = ' + targetRotationX);
  }
}

Viewer.prototype.touchstart = function(_self) {
  return function(event) {
    log('touchstart');
    log(event);
    event.preventDefault();
    _self.CURRENT_MAX_TOUCH_COUNT += event.touches.length
    log('event.touches.length = ' + event.touches.length);
    if (_self.CURRENT_MAX_TOUCH_COUNT > 1 || event.touches.length > 1) {
      _self.MULTI_TOUCH_DETECTED = true;
    }
    _self.DRAGGING_TIME_MS = 0;
    if (!_self.timerID) {
      _self.timerID = setInterval(function(){ _self.countup(); }, 100);
    }
    _self.moveEventCount = 0;

    _self.mouseXOnMouseDown = (event.touches[0].pageX / window.innerWidth) * 2 - 1;
    _self.targetRotationOnMouseDownX = _self.targetRotationX;
  }
}

Viewer.prototype.touchend = function(_self) {
  return function(event) {
    log('touchend');
    event.preventDefault();
    _self.controls.enabled = true;

    if (!_self.MULTI_TOUCH_DETECTED) {
      log('MULTI_TOUCH_DETECTED false');
      if (_self.type == 'b') {
        if (_self.DRAGGING && _self.DRAGGING_TIME_MS < 10 && _self.moveEventCount > 0) {
          log('cutVoxels');
          _self.cutVoxels(event);
          _self.DRAGGING = false;
        }
      } else if (_self.type == 'c') {
        log('cutVoxels');
        _self.cutVoxels(event);
        _self.DRAGGING = false;
      }
    }
    clearInterval(_self.timerID);
    _self.timerID = 0;
    _self.DRAGGING_TIME_MS = 0;
    _self.TOUCH_END_COUNT++;
    if (_self.TOUCH_END_COUNT >= _self.CURRENT_MAX_TOUCH_COUNT) {
      _self.MULTI_TOUCH_DETECTED = false;
      _self.CURRENT_MAX_TOUCH_COUNT = 0;
      _self.TOUCH_END_COUNT = 0;
    }
  }
}

Viewer.prototype.countup = function() {
 log('countup');
 log('DRAGGING_TIME_MS = ' + this.DRAGGING_TIME_MS);
 this.DRAGGING_TIME_MS++;
}
