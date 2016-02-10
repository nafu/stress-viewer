function Viewer(config) {
  this.type = config.type
  log('config.type = ' + config.type);
  log('this.type = ' + this.type);

  // NOTE: Set debugMode to true in debug-utility.js for debugging
  this.width = window.innerWidth;
  this.height = window.innerHeight;
  this.aspect = width/height;
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

  var createControls = function(){
    var controls = new THREE.TrackballControls(camera);

    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.noRotate = true;
    controls.noZoom = false;
    controls.noPan = true;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;
    return controls;
  }

  var createScene = function(){
    var scene = new THREE.Scene();
    return scene;
  }

  var createLight = function(){
    var light = new THREE.AmbientLight(0xffffff);
    light.position.set(0, 500, 2000);
    return light;
  }

  var createCube = function(id, x, y, z, color) {
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

  var createCubes = function(){
    var data = $.ajax({
        type: "GET",
        url: "data/sample-mises.csv",
        dataType: "text",
        async: false
    }).responseText;

    return processData(data);

    function processData(allText) {
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
        var object = createCube(tarr[0], tarr[1] - 5, tarr[2], tarr[3] - 5, color);
        if (object.ref_id == "") continue;
        objects[object.ref_id] = object;

        lines.push(tarr);
      }
      // alert(lines);

      return objects;
    }
  };

  var createPlane = function(){
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

  // Sound
  var soundID = 'Swoosh';
  function loadSound() {
    createjs.Sound.registerSound('./sounds/swoosh.mp3', soundID);
  }
  function playSound() {
    createjs.Sound.play(soundID);
  }
  loadSound();

  var scene = createScene();
  var group = new THREE.Object3D();
  var edgegroup = new THREE.Object3D();
  var camera = this.createCamera();
  var controls = createControls();

  var light = createLight();
  var cubes = createCubes();
  var renderer = this.createRenderer();

  var projector = new THREE.Projector();
  var mouse = new THREE.Vector2()

  scene.add(light);

  for(key in cubes) {
    group.add(cubes[key]);
    var edge = new THREE.EdgesHelper(cubes[key], 0xffffff);
    edge.material.linewidth = 0.1;
    edgegroup.add(edge);
  }

  scene.add(group);
  scene.add(edgegroup);
  scene.add(createPlane());

  var render = function(){
    log('mouseX - mouseXOnMouseDown = ' + (mouseX - mouseXOnMouseDown));
    log('targetRotationX - group.rotation.y = ' + (targetRotationX - group.rotation.y));
    if (Math.abs(mouseX - mouseXOnMouseDown) > 0.1 &&
        Math.abs(targetRotationX - group.rotation.y) > 0.5 &&
        Math.abs(targetRotationX - group.rotation.y) < 5) {
      group.rotation.y += ( targetRotationX - group.rotation.y ) * 0.25;
    }

    renderer.render(scene,camera);
    TWEEN.update();
  }
  var animate = function(){
    requestAnimationFrame(animate);
    controls.update();
    render();
  }

  var movedObjects = [];

  animate();

  var getIntersects = function(event) {
    // Return empty array if detecting multi-touch
    log('getIntersects');
    log(event);
    if (event.changedTouches && event.changedTouches.length > 1) {
      log('multi-touch detected');
      return [];
    }

    //FIXME - Figure out whether 2 here and 0.5
    // in the line below are related
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    if (event.changedTouches && event.changedTouches.length > 0) {
      mouse.x = (event.changedTouches[0].clientX / window.innerWidth) * 2 - 1;
      mouse.y = - (event.changedTouches[0].clientY / window.innerHeight) * 2 + 1;
    }

    //FIXME - Figure out logic behind 0.5
    var vector = new THREE.Vector3(mouse.x, mouse.y ,0.5);

    vector.unproject(camera);

    var raycaster = new THREE.Raycaster(
      camera.position,
      vector.sub(camera.position).normalize()
    );

    var intersects = raycaster.intersectObjects(group.children);

    return intersects;
  }

  var cutVoxels = function(event) {
    log('cutVoxels');
    var intersects = getIntersects(event);

    if ( intersects.length > 0 ) {
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
        for (key in cubes) {
          if (faceIndex == 8 || faceIndex == 9) {
            if (event.ctrlKey) {
              if (cubes[key].position.x >= selectedObject.position.x) {
                index = movedObjects.indexOf(cubes[key])
                if (index > -1) {
                  moveObjects.push(cubes[key]);
                  movedObjects.splice(index, 1);
                }
              }
            } else {
              if (cubes[key].position.x >= selectedObject.position.x) {
                if ($.inArray(cubes[key], movedObjects) == -1) {
                  moveObjects.push(cubes[key]);
                  movedObjects.push(cubes[key]);
                }
              }
            }
          } else if (faceIndex == 0 || faceIndex == 1) {
            if (event.ctrlKey) {
              if (cubes[key].position.z >= selectedObject.position.z) {
                index = movedObjects.indexOf(cubes[key])
                if (index > -1) {
                  moveObjects.push(cubes[key]);
                  movedObjects.splice(index, 1);
                }
              }
            } else {
              if (cubes[key].position.z >= selectedObject.position.z) {
                if ($.inArray(cubes[key], movedObjects) == -1) {
                  moveObjects.push(cubes[key]);
                  movedObjects.push(cubes[key]);
                }
              }
            }
          }
        }
      } else if (this.type == 'c') {
        for (key in cubes) {
          if (faceIndex == 8 || faceIndex == 9) {
            if (event.ctrlKey) {
              if (cubes[key].position.z >= selectedObject.position.z) {
                index = movedObjects.indexOf(cubes[key])
                if (index > -1) {
                  moveObjects.push(cubes[key]);
                  movedObjects.splice(index, 1);
                }
              }
            } else {
              if (cubes[key].position.z >= selectedObject.position.z) {
                if ($.inArray(cubes[key], movedObjects) == -1) {
                  moveObjects.push(cubes[key]);
                  movedObjects.push(cubes[key]);
                }
              }
            }
          } else if (faceIndex == 0 || faceIndex == 1) {
            if (event.ctrlKey) {
              if (cubes[key].position.x >= selectedObject.position.x) {
                index = movedObjects.indexOf(cubes[key])
                if (index > -1) {
                  moveObjects.push(cubes[key]);
                  movedObjects.splice(index, 1);
                }
              }
            } else {
              if (cubes[key].position.x >= selectedObject.position.x) {
                if ($.inArray(cubes[key], movedObjects) == -1) {
                  moveObjects.push(cubes[key]);
                  movedObjects.push(cubes[key]);
                }
              }
            }
          }
        }
      }

      if (moveObjects.length > 0) {
        // Sound
        playSound();

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

  // Custom Event
  renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
  renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
  renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);
  renderer.domElement.addEventListener('mouseout', onDocumentMouseOut, false);
  renderer.domElement.addEventListener('touchmove', touchmove, false );
  renderer.domElement.addEventListener('touchstart', touchstart, false );
  renderer.domElement.addEventListener('touchend', touchend, false );

  // Mouse
  function onDocumentMouseMove(event) {
    log('MouseMove');
    event.preventDefault();
    DRAGGING = true;

    if (MOUSE_DOWN) {
      moveEventCount++;
      log('moveEventCount');
      log(moveEventCount);

      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      targetRotationX = targetRotationOnMouseDownX + ( mouseX - mouseXOnMouseDown ) * 3.05;

      // log('targetRotationX = ' + targetRotationX);
    }
  }
  function onDocumentMouseDown(event) {
    log('MouseDown');
    event.preventDefault();
    MOUSE_DOWN = true;
    moveEventCount = 0;
    if (getIntersects(event).length > 0) {
      controls.enabled = false;
    }

    mouseXOnMouseDown = (event.clientX / window.innerWidth) * 2 - 1;
    targetRotationOnMouseDownX = targetRotationX;
  }
  function onDocumentMouseUp(event) {
    log('MouseUp');
    event.preventDefault();
    controls.enabled = true;

    if (this.type == 'b') {
      if (DRAGGING && moveEventCount > 5) {
        cutVoxels(event);
      }
    } else if (this.type == 'c') {
      cutVoxels(event);
    }
    DRAGGING = null;
    MOUSE_DOWN = false;
    moveEventCount = 0;
  }
  function onDocumentMouseOut(event) {
    log('MouseOut');
    event.preventDefault();
    controls.enabled = true;
    MOUSE_DOWN = false;
  }

  // Touch
  function touchmove(event) {
    log('touchmove');
    event.preventDefault();
    DRAGGING = true;
    moveEventCount++;
    log('moveEventCount = '+moveEventCount);

    mouseX = (event.touches[0].pageX / window.innerWidth) * 2 - 1;
    targetRotationX = targetRotationOnMouseDownX + ( mouseX - mouseXOnMouseDown ) * 2.05;

    // log('targetRotationX = ' + targetRotationX);
  }
  function touchstart(event) {
    log('touchstart');
    log(event);
    event.preventDefault();
    CURRENT_MAX_TOUCH_COUNT += event.touches.length
    log('event.touches.length = ' + event.touches.length);
    if (CURRENT_MAX_TOUCH_COUNT > 1 || event.touches.length > 1) {
      MULTI_TOUCH_DETECTED = true;
    }
    DRAGGING_TIME_MS = 0;
    if (!timerID) {
      timerID = setInterval('countup()', 100);
    }
    moveEventCount = 0;

    mouseXOnMouseDown = (event.touches[0].pageX / window.innerWidth) * 2 - 1;
    targetRotationOnMouseDownX = targetRotationX;
  }
  function touchend(event) {
    log('touchend');
    event.preventDefault();
    controls.enabled = true;

    if (!MULTI_TOUCH_DETECTED) {
      log('MULTI_TOUCH_DETECTED false');
      if (this.type == 'b') {
        if (DRAGGING && DRAGGING_TIME_MS < 10 && moveEventCount > 0) {
          log('cutVoxels');
          cutVoxels(event);
          DRAGGING = null;
        }
      } else if (this.type == 'c') {
        log('cutVoxels');
        cutVoxels(event);
        DRAGGING = null;
      }
    }
    clearInterval(timerID);
    timerID = 0;
    DRAGGING_TIME_MS = 0;
    TOUCH_END_COUNT++;
    if (TOUCH_END_COUNT >= CURRENT_MAX_TOUCH_COUNT) {
      MULTI_TOUCH_DETECTED = false;
      CURRENT_MAX_TOUCH_COUNT = 0;
      TOUCH_END_COUNT = 0;
    }
  }

  function countup() {
   log('countup');
   log('DRAGGING_TIME_MS = ' + DRAGGING_TIME_MS);
   DRAGGING_TIME_MS++;
  }

  var container = $('body').append('<div>');
  $(container).append( renderer.domElement);

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
  var camera = new THREE.PerspectiveCamera(this.angle, this.aspect, this.near, this.far);
  camera.position.x = 30;
  camera.position.y = 30;
  camera.position.z = 30;
  return camera;
}
