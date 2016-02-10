function Viewer(config) {
  this.type = config.type
  log('config.type = ' + config.type);
  log('this.type = ' + this.type);

  // NOTE: Set debugMode to true in debug-utility.js for debugging
  this.width = window.innerWidth;
  this.height = window.innerHeight;
  this.aspect = this.width / this.height;
  this.near = 1;
  this.far = 10000;
  this.angle = 45;
  this.tween = null;
  this.MOUSE_DOWN = false;
  this.DRAGGING = null;
  this.DRAGGING_TIME_MS = 0;
  this.timerID = 0;

  this.moveEventCount = 0;

  this.firstClickedX = null;
  this.firstClickedZ = null;

  this.targetRotationX = 0;
  this.targetRotationOnMouseDownX = 0;
  this.mouseX = 0;
  this.mouseXOnMouseDown = 0;

  this.MULTI_TOUCH_DETECTED = false;
  this.CURRENT_MAX_TOUCH_COUNT = 0;
  this.TOUCH_END_COUNT = 0;

  // Sound
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

  var projector = new THREE.Projector();
  var mouse = new THREE.Vector2()

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

  var movedObjects = [];

  this.animate();

  // Custom Event
  this.renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
  this.renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
  this.renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);
  this.renderer.domElement.addEventListener('mouseout', onDocumentMouseOut, false);
  this.renderer.domElement.addEventListener('touchmove', touchmove, false );
  this.renderer.domElement.addEventListener('touchstart', touchstart, false );
  this.renderer.domElement.addEventListener('touchend', touchend, false );

  // Mouse
  function onDocumentMouseMove(event) {
    log('MouseMove');
    event.preventDefault();
    this.DRAGGING = true;

    if (this.MOUSE_DOWN) {
      this.moveEventCount++;
      log('moveEventCount');
      log(this.moveEventCount);

      this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      this.targetRotationX = this.targetRotationOnMouseDownX + (this.mouseX - this.mouseXOnMouseDown) * 3.05;

      // log('targetRotationX = ' + targetRotationX);
    }
  }
  function onDocumentMouseDown(event) {
    log('MouseDown');
    event.preventDefault();
    this.MOUSE_DOWN = true;
    this.moveEventCount = 0;
    if (this.getIntersects(event).length > 0) {
      this.controls.enabled = false;
    }

    this.mouseXOnMouseDown = (event.clientX / window.innerWidth) * 2 - 1;
    this.targetRotationOnMouseDownX = this.targetRotationX;
  }
  function onDocumentMouseUp(event) {
    log('MouseUp');
    event.preventDefault();
    this.controls.enabled = true;

    if (this.type == 'b') {
      if (this.DRAGGING && this.moveEventCount > 5) {
        this.cutVoxels(event);
      }
    } else if (this.type == 'c') {
      this.cutVoxels(event);
    }
    this.DRAGGING = null;
    this.MOUSE_DOWN = false;
    this.moveEventCount = 0;
  }
  function onDocumentMouseOut(event) {
    log('MouseOut');
    event.preventDefault();
    this.controls.enabled = true;
    this.MOUSE_DOWN = false;
  }

  // Touch
  function touchmove(event) {
    log('touchmove');
    event.preventDefault();
    this.DRAGGING = true;
    this.moveEventCount++;
    log('moveEventCount = ' + this.moveEventCount);

    this.mouseX = (event.touches[0].pageX / window.innerWidth) * 2 - 1;
    this.targetRotationX = this.targetRotationOnMouseDownX + (this.mouseX - this.mouseXOnMouseDown) * 2.05;

    // log('targetRotationX = ' + targetRotationX);
  }
  function touchstart(event) {
    log('touchstart');
    log(event);
    event.preventDefault();
    this.CURRENT_MAX_TOUCH_COUNT += event.touches.length
    log('event.touches.length = ' + event.touches.length);
    if (this.CURRENT_MAX_TOUCH_COUNT > 1 || event.touches.length > 1) {
      this.MULTI_TOUCH_DETECTED = true;
    }
    this.DRAGGING_TIME_MS = 0;
    if (!this.timerID) {
      this.timerID = setInterval('countup()', 100);
    }
    this.moveEventCount = 0;

    this.mouseXOnMouseDown = (event.touches[0].pageX / window.innerWidth) * 2 - 1;
    this.targetRotationOnMouseDownX = this.targetRotationX;
  }
  function touchend(event) {
    log('touchend');
    event.preventDefault();
    this.controls.enabled = true;

    if (!this.MULTI_TOUCH_DETECTED) {
      log('MULTI_TOUCH_DETECTED false');
      if (this.type == 'b') {
        if (this.DRAGGING && this.DRAGGING_TIME_MS < 10 && this.moveEventCount > 0) {
          log('cutVoxels');
          this.cutVoxels(event);
          this.DRAGGING = null;
        }
      } else if (this.type == 'c') {
        log('cutVoxels');
        this.cutVoxels(event);
        this.DRAGGING = null;
      }
    }
    clearInterval(timerID);
    this.timerID = 0;
    this.DRAGGING_TIME_MS = 0;
    this.TOUCH_END_COUNT++;
    if (this.TOUCH_END_COUNT >= this.CURRENT_MAX_TOUCH_COUNT) {
      this.MULTI_TOUCH_DETECTED = false;
      this.CURRENT_MAX_TOUCH_COUNT = 0;
      this.TOUCH_END_COUNT = 0;
    }
  }

  function countup() {
   log('countup');
   log('DRAGGING_TIME_MS = ' + this.DRAGGING_TIME_MS);
   this.DRAGGING_TIME_MS++;
  }

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
        moveTween(moveObjects[i], selectedObject.position, faceIndex);
      }
    }
  } else {
    log('No Objects Selected');
  }

  function moveTween(object, clicked, faceIndex) {
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
        if (!firstClickedX) {
          firstClickedX = clicked.x;
        }
        if (event.ctrlKey) {
          target.z+=10;
        } else {
          target.x = parseFloat(firstClickedX) + parseFloat(position.z - 0.5) + 10;
          target.z = -position.x - 10;
        }
      } else if (faceIndex == 0 || faceIndex == 1) {
        if (!firstClickedZ) {
          firstClickedZ = clicked.x;
        }
        if (event.ctrlKey) {
          target.z+=10;
        } else {
          target.x = - position.z - 10
          target.z = parseFloat(firstClickedZ) + parseFloat(position.x - 0.5) + 10;
        }
      }
    } else if (this.type == 'c') {
      if (faceIndex == 8 || faceIndex == 9) {
        if (!firstClickedX) {
          firstClickedX = clicked.x;
        }
        if (event.ctrlKey) {
          target.x+=10;
        } else {
          target.x-=10;
        }
      } else if (faceIndex == 0 || faceIndex == 1) {
        if (!firstClickedZ) {
          firstClickedZ = clicked.x;
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
      object.position.x = this.x;
      object.position.z = this.z;
      object.needsUpdate = true;
    });
  }
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
