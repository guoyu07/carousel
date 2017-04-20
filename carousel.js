/**
 * 初始化轮播图
 * @param container
 * @param option
 */
$.installCarousel = function(container, option) {
    // 当前的触摸事件
    var touchEvent = null;
    // 当前的翻页事件
    var slideEvent = null;
    // 正在触屏的手指数量
    var touchFinger = 0;
    // 当前图片下标
    var curIndex = 0;
    // 当前X轴偏移
    var curX = 0;
    // 触摸开始/结束时间
    var touchStartTime = 0;

    // 默认配置
    var defaultOption = {
        images: new Array(), // 图片URL数组
        click: function(index, image) {} // 点击回调
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
        imageList.append(imageItem);
    }

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
    }

    // 动画切换图片
    function transImageList(index) {
        // 启动动画
        imageList.addClass("slideTrans");

        imageList.on('transitionend webkitTransitionEnd oTransitionEnd', function (event) {
            console.log("trans end");
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
                slideEvent = null;
            }
        });

        // 向目标页切换
        setImage(index);
    }

    // 设置初始化偏移
    setImage(finalOption.images.length > 1 ? 1 : 0);
    // 底片添加到容器
    $(container).append(imageList);

    // 更新最新的手指集合
    // 浏览器对changedTouches的实现存在问题, 因此总是使用全量的touches进行比对
    function compareTouchFingers(event) {
        var identSet = {};
        // 将不存在手指的添加到集合中
        for (var i = 0; i < event.originalEvent.touches.length; ++i) {
            var touch = event.originalEvent.touches[i];
            identSet[touch.identifier] = true;
            if (touchEvent[touch.identifier] === undefined) {
                touchEvent[touch.identifier] = null;
                ++touchFinger;
            }
        }
        // 将已删除的手指集合清理
        for (var identifier in touchEvent) {
            // 浏览器集合中已不存在,删除
            if (identSet[identifier] === undefined) {
                delete(touchEvent[identifier]);
                --touchFinger;
            }
        }
    }

    // 多于一张图片, 才支持触摸翻页
    if (renderImages.length > 1) {
        // 右边界
        var rightBound = (renderImages.length - 1) * width * -1;
        // 父容器注册下拉事件
        $(container).on("touchstart", function (event) {
            if (!touchEvent) {
                // 第一根指头触屏, 产生新的触摸事件
                touchEvent = {};
            }
            // 将本次的手指加入到触摸事件集合中
            compareTouchFingers(event);
            // 翻页事件正在进行,忽略本次触屏
            if (slideEvent) {
                return;
            }
            // 产生新的翻页事件
            slideEvent = touchEvent;
            // 触摸开始时间
            touchStartTime = new Date().getTime();
            // 暂停动画
            imageList.removeClass("slideTrans");
            imageList.unbind();
        }).on("touchmove", function (event) {
            // 禁止默认处理,停止冒泡
            event.preventDefault();
            event.stopPropagation();

            // 在翻页未完成前触摸,将被忽略
            if (touchEvent != slideEvent) {
                return;
            }
            // 计算每个变化的手指, 取变化最大的delta
            var maxDelta = 0;
            for (var i = 0; i < event.originalEvent.changedTouches.length; ++i) {
                var fingerTouch = event.originalEvent.changedTouches[i];
                if (touchEvent[fingerTouch.identifier] !== null) {
                    var delta = fingerTouch.clientX - touchEvent[fingerTouch.identifier];
                    if (Math.abs(delta) > Math.abs(maxDelta)) {
                        maxDelta = delta;
                    }
                }
                touchEvent[fingerTouch.identifier] = fingerTouch.clientX;
            }
            // 移动到指定偏移
            var destX = curX + maxDelta;
            if (destX > 0) { // 超出左边界
                destX = 0;
            } else if (destX < rightBound) { // 超出右边界
                destX = rightBound;
            }
            setTranslateX(destX);
        }).on("touchend touchcancel", function (event) {
            // 从touchEvent移除手指对应的记录
            compareTouchFingers(event);

            var touchEventRef = touchEvent;
            // 所有手指都离开, 则当前触摸事件结束
            if (!touchFinger) {
                touchEvent = null;
            }
            // 在翻页未完成前触摸,将被忽略
            if (touchEventRef != slideEvent) {
                return;
            }
            // 只有所有手指都离开后, 才开始刷新动作
            if (touchFinger) {
                return;
            }

            // 判断动画条件
            var prevX = curIndex * width * -1;
            // 偏移量
            var deltaX = Math.abs(curX - prevX);
            // 触屏时间
            var deltaTime = new Date().getTime() - touchStartTime;
            // 是否满足翻页
            var isSlide = false;
            if (deltaX * 2>= width || deltaTime <= 200) { // 超过半屏 或者 触屏时间小于200毫秒
                isSlide = true;
            }
            // 满足翻页, 则计算下一页的下标
            if (isSlide) {
                transImageList(curIndex + (curX < prevX ? 1 : (curX == prevX ? 0 : -1)));
            } else { // 否则回到原先位置
                transImageList(curIndex);
            }
        });
    }
};