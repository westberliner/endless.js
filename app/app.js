(function($){
  // dataObject
  var DataContainer = function() {
    var data = [],
        itemCount = 0;
    this.push = function(item) {
      data.push(item);
    }
    this.getData = function() {
      return data;
    }
    this.getItem = function() {
      var item = data[itemCount].clone();
      incrementItemCount();
      return item;
    }
    var incrementItemCount = function() {
      itemCount++;
      if(itemCount >= data.length) {
        itemCount = 0;
      }
    }
  };
  // vars
  var screenSize = {width: 0, height: 0},
      tileSize = {width: 250, height: 250},
      data = new DataContainer(),
      gridOffset = 1, // how much overflow in each direction
      gridSize = {
        tilesOnX: 0,
        tilesOnY: 0
      },
      dragStartPoint = {},
      dragSpeed = 0.1,
      updateInterval = 2,
      updateIntervalStatus = 0,
      animateInterval = null,
      diff = {},
      timeOutResize = null,
      zIndex = 100,
      initAnchor = {x:0, y:0};

  // create data
  for(var i = 0; i < 100; i++) {
    var item = $('<div class="tile item-'+i+'"></div>');
    if(i < 10) {
      item.css({
        'backgroundImage':'url(http://lorempixel.com/250/250/city/'+i+')'
      });
    } else {
      item.css({
        'backgroundColor':'rgb('+getRandom(255)+','+getRandom(255)+','+getRandom(255)+')'
      });
    }
    data.push(item);
  }

  // init
  updateOnResize();
  initDraw();
  initHandlers();
  // update on resize
  function updateOnResize() {
    screenSize = {width: window.innerWidth, height: window.innerHeight};
    gridSize = {
      tilesOnX: Math.ceil(screenSize.width/tileSize.width)+gridOffset*2,
      tilesOnY: Math.ceil(screenSize.height/tileSize.height)+gridOffset*2
    };
  }
  // draw
  function initDraw() {
    $('#canvas').css(screenSize);
    $('#grid').css({width: gridSize.tilesOnX*tileSize.width, height: gridSize.tilesOnY*tileSize.height});
    var index = 0;
    for(var i = 0; i < gridSize.tilesOnY; i++) {
      var row = $('<div class="row"></div>');
      row.css({'zIndex':zIndex});
      for(var j = 0; j < gridSize.tilesOnX; j++) {
        var item = data.getItem();
        item.css({
          left: initAnchor.x+j*tileSize.width-gridOffset*tileSize.width,
          top: initAnchor.y+i*tileSize.height-gridOffset*tileSize.height
        });
        row.append(item);
        index++;
      }
      $('#grid').append(row);
    }
    updateHandlers();
  }
  function moveGrid(diff) {
    var newPostion = {};
    newPostion.left = $('#grid').position().left - diff.x;
    newPostion.top = $('#grid').position().top - diff.y;
    $('#grid').css({
      'transition': '0.04s',
      'transform': 'translate3d('+newPostion.left+'px, '+newPostion.top+'px, 0px)'
    });
    if(updateIntervalStatus > updateInterval) {
      checkGridItems();
      updateIntervalStatus = 0;
    }
    updateIntervalStatus++;
  }
  function checkGridItems() {
    var addNewRowsAt = {top: false, right: false, bottom: false, left: false},
        currentPosition = {};
    // check left
    currentPosition = $('.tile:first-child').offset();
    if(currentPosition.left < -tileSize.width-gridOffset*tileSize.width) {
      $.each($('.row .tile:first-child'), function(k,v) {
        $(v).remove();
        addNewRowsAt.right = true;
      });
    }
    // check right
    currentPosition = $('.tile:last-child').offset();
    if(currentPosition.left > screenSize.width+gridOffset*tileSize.width) {
      $.each($('.row .tile:last-child'), function(k,v) {
        $(v).remove();
        addNewRowsAt.left = true;
      });
    }
    // check top
    currentPosition = $('.row:first-child .tile:first-child').offset();
    if(currentPosition.top < -tileSize.height-gridOffset*tileSize.height) {
      $('.row:first-child').remove();
      addNewRowsAt.bottom = true;
    }
    // bottom
    currentPosition = $('.row:last-child .tile:first-child').offset();
    if(currentPosition.top > screenSize.height+gridOffset*tileSize.height) {
      $('.row:last-child').remove();
      addNewRowsAt.top = true;
    }

    addNewGridItems(addNewRowsAt);
    updateHandlers();
  }

  function updateHandlers() {
    $('img').on('dragstart', function(event) { event.preventDefault(); });
  }

  function addNewGridItems(at) {
    // add columns first
    if(at.left) { // insert after
      $.each($('.row'),function(k,v){
        var row = $(v),
            oldFirstChildPosition = row.find('.tile:first-child').position(),
            newItemPosition = {
              top: oldFirstChildPosition.top,
              left: oldFirstChildPosition.left-tileSize.width
            },
            item = data.getItem();
            item.css(newItemPosition);
            row.prepend(item);
      });
    }
    if(at.right) { // insert after
      $.each($('.row'),function(k,v){
        var row = $(v),
            oldFirstChildPosition = row.find('.tile:last-child').position(),
            newItemPosition = {
              top: oldFirstChildPosition.top,
              left: oldFirstChildPosition.left+tileSize.width
            },
            item = data.getItem();
            item.css(newItemPosition);
            row.append(item);
      });
    }

    if(at.top) { // prepend
      var row = $('<div class="row"></div>'),
          oldFirstChildPosition = $('.row:first-child .tile:first-child').position();
      row.css({'zIndex':zIndex});
      for(var i = 0; i < gridSize.tilesOnX; i++) {
        var item = data.getItem();
        item.css({
          left: i*tileSize.width+oldFirstChildPosition.left,
          top: oldFirstChildPosition.top-tileSize.height
        });
        row.append(item);
      }
      $('#grid').prepend(row);
    }

    if(at.bottom) { // append
      var row = $('<div class="row"></div>'),
          oldFirstChildPosition = $('.row:last-child .tile:first-child').position();
      row.css({'zIndex':zIndex});
      for(var i = 0; i < gridSize.tilesOnX; i++) {
        var item = data.getItem();
        item.css({
          left: i*tileSize.width+oldFirstChildPosition.left,
          top: oldFirstChildPosition.top+tileSize.height
        });
        row.append(item);
      }
      $('#grid').append(row);
    }
  }

  // handlers
  function initHandlers() {
    $('body').on('mousedown touchstart',startdragHandler);
    $('body').on('mouseup touchend',stopdragHandler);
    $(window).on('resize', resizeHandler);
  }

  function startdragHandler(e) {
    e.preventDefault();
    if(e.type == 'mousedown') {
      dragStartPoint = {x: e.clientX, y: e.clientY};
    } else {
      dragStartPoint = {x: e.originalEvent.targetTouches[0].clientX, y: e.originalEvent.targetTouches[0].clientY};
    }

    $('body').on('mousemove touchmove',mousemoveHandler);
    if(animateInterval != null) {
      clearInterval(animateInterval);
      animateInterval = null;
      animateMove();
    }
    animateInterval = setInterval(animateMove, 40);
  }
  function stopdragHandler(e) {
    e.preventDefault();
    $('body').off('mousemove touchmove',mousemoveHandler);
    clearInterval(animateInterval);
    animateInterval = null;
    stopdragEaseOut();
  }
  function mousemoveHandler(e) {
    e.preventDefault();
    if(e.type == 'mousemove') {
      currentPosition = {x: e.clientX, y: e.clientY};
    } else {
      currentPosition = {x: e.originalEvent.targetTouches[0].clientX, y: e.originalEvent.targetTouches[0].clientY};
    }
    diff = {};
    diff.x = (dragStartPoint.x - currentPosition.x)*dragSpeed;
    diff.y = (dragStartPoint.y - currentPosition.y)*dragSpeed;
  }
  function resizeHandler(e) {
    if(timeOutResize != null) {
      clearTimeout(timeOutResize);
      timeOutResize = null;
    }
    timeOutResize = setTimeout(updateWindow, 500);
  }
  function updateWindow() {
    zIndex--;
    timeOutResize = null;
    clearGrid();
    updateOnResize();
    initDraw();
  }

  // helpers
  function getRandom(n) {
    return Math.floor(Math.random()*n);
  }
  function animateMove() {
    moveGrid(diff);
  }
  function stopdragEaseOut() {
    var newPostion = {};
    newPostion.left = $('#grid').position().left - diff.x;
    newPostion.top = $('#grid').position().top - diff.y;
    $('#grid').css({
      'transition': '2s ease-out',
      'transform': 'translate3d('+newPostion.left+'px, '+newPostion.top+'px, 0px)'
    });
    // check items again to be sure
    checkGridItems();
  }
  function clearGrid() {
    // save last position before clear all
    initAnchor = {
      x: $('.row:first-child .tile:nth-child('+(1+gridOffset)+')').position().left,
      y: $('.row:nth-child('+(1+gridOffset)+') .tile:first-child').position().top
    }
    $.each($('.row'), function(k,v) {
      $(v).delay(100*k).fadeOut(2000,function() {
        this.remove();
      });
    });
  }
})(jQuery);

// todo window resize
// - check position