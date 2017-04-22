/**
 * 初始化轮播图
 * @param container
 * @param option
 */
$.installCarousel = function(container, option) {
    // 触摸容器的手指集合
    var touchFingers = {};
    // 集合大小
    var fingerCount = 0;

    // 触摸事件的唯一ID
    var touchEventID = 0;
    // 当前的翻页事件
    var slideEventID = 0;

    // 当前图片下标
    var curIndex = 0;
    // 当前X轴偏移
    var curX = 0;
    // 触摸开始/结束时间
    var touchStartTime = 0;
    // 轮播定时器
    var timer = null;

    // 默认配置
    var defaultOption = {
        images: new Array(), // 图片URL数组
        click: function(index, image) {}, // 点击回调
        interval: 2000, // 翻滚间隔
    };
    var finalOption = $.extend(true, defaultOption, option);

    // 获取视口宽高
    var width = parseInt($(container).css("width"));
    var height = parseInt($(container).css("height"));
    // 视口溢出隐藏
    $(container).css("overflow", "hidden");

    // 创建底片
    var imageList = $('<div class="carouselImageList"></div>');
    // 设置底片宽高
    var imageListWidth = finalOption.images.length * width;
    if (finalOption.images.length > 1) { // 超过1张图片,需要在首位分别增加一张图片用于过渡
        imageListWidth += 2 * width;
    }
    imageList.css("width", imageListWidth + "px");
    imageList.css("height", height + "px");

    // 首部添加一张尾图
    var renderImages = new Array();
    if (finalOption.images.length > 1) {
        renderImages.push(finalOption.images[finalOption.images.length - 1]);
    }
    renderImages = renderImages.concat(finalOption.images);
    // 尾部添加一张首图
    if (finalOption.images.length > 1) {
        renderImages.push(finalOption.images[0]);
    }
    // 添加图片
    for (var i = 0; i < renderImages.length; ++i) {
        var imageItem = $('<img>');
        imageItem.attr("src", renderImages[i]);
        imageItem.css("width", width + "px");
        imageItem.css("height", height + "px");
        imageItem.bind("click", (function(i, image) {
            // 用于首尾过渡的图片需要特殊处理
            if (finalOption.images.length > 1) {
                --i;
                if (i == -1) {
                    i = finalOption.images.length - 1;
                } else if (i == renderImages.length - 2) {
                    i = 0;
                }
            }
            return function(event) {
                finalOption.click(i, image);
            }
        })(i, renderImages[i]));
        imageList.append(imageItem);
    }
    // 添加页码区域
    var pointBox = $('<div class="carouselPointBox"></div>');
    var pointList = $('<div class="carouselPointList"></div>')
    pointBox.append(pointList);
    for (var i = 0; i < finalOption.images.length; ++i) {
        pointList.append($('<div class="carouselPoint"></div>'));
    }
    $(container).append(pointBox);

    // 设置transform的函数
    function cssTransform(node, content) {
        node.css({
            '-webkit-transform' : content,
            '-moz-transform'    : content,
            '-ms-transform'     : content,
            '-o-transform'      : content,
            'transform'         : content,
        });
    }

    // 设置底片位置
    function setTranslateX(translateX) {
        curX = translateX;
        cssTransform(imageList, "translateX(" + translateX + "px)");
    }

    // 设置当前图片
    function setImage(index) {
        curIndex = index;
        var translateX = index * width * -1;
        setTranslateX(translateX);

        // 更新页码
        var page = curIndex;
        if (finalOption.images.length > 1) {
            --page;
            if (page == -1) {
                page = finalOption.images.length - 1;
            } else if (page == finalOption.images.length) {
                page = 0;
            }
        }
        // 清理当前的选中页码
        pointList.find("div").removeClass('carouselActivePoint');
        // 高亮新的页码
        $(pointList.find("div").get(page)).addClass('carouselActivePoint');
    }

    // 启动轮播定时器
    function startSlideTimer() {
        timer = setTimeout(function() {
            // 当前没有进行中的翻页事件
            if (!slideEventID) {
                // 创建翻页事件
                slideEventID = - 1;
                // 向右翻页
                transImageList(curIndex + 1);
            }
        }, finalOption.interval);
    }

    // 停止轮播定时器
    function stopSlideTimer() {
        clearTimeout(timer);
    }

    // 动画切换图片
    function transImageList(index) {
        // 如果偏移量相同, 则不必执行动画
        var toTranslateX = index * width * -1;
        var needTrans = toTranslateX != curX;

        if (needTrans) {
            // 启动动画
            imageList.addClass("slideTrans");
            // 等待动画结束
            imageList.on('transitionend webkitTransitionEnd oTransitionEnd', function (event) {
                // 由于transitionend会对每个属性回调一次,所以只处理其中一个
                if (event.originalEvent.propertyName == "transform") {
                    // 停止动画
                    imageList.removeClass("slideTrans");
                    imageList.unbind();
                    // 判断边界
                    if (index == 0) { // 左边界
                        setImage(renderImages.length - 2); // 偷梁换柱为倒数第二张图片
                    } else if (index == renderImages.length - 1) { // 右边界
                        setImage(1); // 偷梁换柱为第二张图片
                    }
                    slideEventID = 0;
                    // 动画结束, 重启定时器
                    startSlideTimer();
                }
            });
        }
        // 向目标页切换
        setImage(index);
        // 如果偏移量相同, 则立即结束翻页事件
        if (!needTrans) {
            // 判断边界
            if (index == 0) { // 左边界
                setImage(renderImages.length - 2); // 偷梁换柱为倒数第二张图片
            } else if (index == renderImages.length - 1) { // 右边界
                setImage(1); // 偷梁换柱为第二张图片
            }
            slideEventID = 0;
            // 无需动画,立即重启定时器
            startSlideTimer();
        }
    }

    // 设置初始化偏移
    setImage(finalOption.images.length > 1 ? 1 : 0);
    // 底片添加到容器
    $(container).append(imageList);

    // 更新最新的手指集合
    // 浏览器对changedTouches的实现存在问题, 因此总是使用全量的touches进行比对
    function compareTouchFingers(event) {
        var identSet = {};

        // 添加target内新出现的手指
        for (var i = 0; i < event.originalEvent.targetTouches.length; ++i) {
            var touch = event.originalEvent.targetTouches[i];
            identSet[touch.identifier] = true;
            if (touchFingers[touch.identifier] === undefined) {
                touchFingers[touch.identifier] = { clientX: touch.clientX, target: touch.target };
                ++fingerCount;
            }
        }
        // 将target内消失的手指移除
        for (var identifier in touchFingers) {
            // 与本次touchevent属于同一个target,但是touchevent中已消失的手指,需要移除
            if (identSet[identifier] === undefined && touchFingers[identifier].target === event.originalEvent.target) {
                delete(touchFingers[identifier]);
                --fingerCount;
            }
        }
    }

    // 多于一张图片, 才支持触摸翻页
    if (renderImages.length > 1) {
        // 右边界
        var rightBound = (renderImages.length - 1) * width * -1;

        // 统一处理
        $(container).on("touchstart touchmove touchend touchcancel", function(event) {
            var beforeFingerCount = fingerCount;
            compareTouchFingers(event);

            if (!beforeFingerCount && fingerCount) { // 开始触摸
                ++touchEventID; // 新建触摸事件
                if (!slideEventID) { // 新建翻页事件
                    slideEventID = touchEventID;
                    // 触摸开始时间
                    touchStartTime = new Date().getTime();
                    // 停止当前的动画
                    imageList.removeClass("slideTrans");
                    imageList.unbind();
                    // 停止定时器
                    stopSlideTimer();
                }
            } else if (beforeFingerCount && !fingerCount) { // 结束触摸
                if (touchEventID != slideEventID) { // 在前一个翻页未完成前进行了触摸,将被忽略
                    return;
                }

                // 判断动画条件
                var prevX = curIndex * width * -1;
                // 偏移量
                var deltaX = Math.abs(curX - prevX);
                // 触屏时间
                var deltaTime = new Date().getTime() - touchStartTime;
                // 计算下一页
                var nextIndex = curIndex;
                if (deltaX * 2>= width || (deltaX && deltaTime <= 200)) { // 超过半屏 或者 触屏时间小于200毫秒
                    nextIndex = curIndex + (curX < prevX ? 1 : -1);
                }
                // 翻页
                transImageList(nextIndex);
            } else if (beforeFingerCount) { // 正在触摸
                // 计算每个变化的手指, 取变化最大的delta
                var maxDelta = 0;
                for (var i = 0; i < event.originalEvent.changedTouches.length; ++i) {
                    var fingerTouch = event.originalEvent.changedTouches[i];
                    if (touchFingers[fingerTouch.identifier] !== undefined) {
                        var delta = fingerTouch.clientX - touchFingers[fingerTouch.identifier].clientX;
                        if (Math.abs(delta) > Math.abs(maxDelta)) {
                            maxDelta = delta;
                        }
                        touchFingers[fingerTouch.identifier].clientX = fingerTouch.clientX;
                    }
                }
                if (touchEventID != slideEventID) {
                    return;
                }

                // 移动到指定偏移
                var destX = curX + maxDelta;
                if (destX > 0) { // 超出左边界
                    destX = 0;
                } else if (destX < rightBound) { // 超出右边界
                    destX = rightBound;
                }
                setTranslateX(destX);
            }
        });

        // 启动轮播
        startSlideTimer();
    }
};