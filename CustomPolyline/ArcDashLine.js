/**
 * 虚弧线
 *
 * @param {Cesium.Viewer} viewer 场景视图
 * @param {Object} options 包括如下选项的对象:
 * @param {Node[]} [options.nodes=[]] 节点数组
 * @param {Cesium.Color} [options.color=Cesium.Color.WHITE] 颜色
 * @param {String} [options.icon=undefined] 图标地址
 * @param {Number} [options.dashLength=16] 虚线长度
 * @param {Number} [options.angularityFactor=10000] 曲率
 *
 * @constructor
 */
function ArcDashLine(viewer,options) {
    options=Cesium.defaultValue(options,{});

    this._viewer=viewer;

    this._nodes=Cesium.defaultValue(options.nodes,[]);
    this._color=Cesium.defaultValue(options.color,Cesium.Color.WHITE);
    this._icon=Cesium.defaultValue(options.icon,drawIcon({
        color:this._color
    }));
    this._dashLength=Cesium.defaultValue(options.dashLength,16);
    this._angularityFactor=Cesium.defaultValue(options.angularityFactor,10000);

    this.markers=[];
    this.lines=[];

    this.nodes=this._nodes;
}

Cesium.defineProperties(ArcDashLine.prototype, {
    /**
     * 获取或设置线节点数组
     *
     * @memberof ArcDashLine.prototype     *
     * @type {Node[]}
     */
    nodes:{
        get:function () {
            return this._nodes;
        },
        set:function (value) {
            this.removeAll();
            for(var i=0;i<value.length;i++){
                this.addNode(value[i]);
            }
        }
    }
});

/**
 * 添加节点
 *
 * @param {Node} node 节点对象
 */
ArcDashLine.prototype.addNode=function(node){
    var entities=this._viewer.entities;

    var marker=entities.add({
        position : node.position,
        billboard : {
            image : this._icon,
            //heightReference:Cesium.HeightReference.CLAMP_TO_GROUND,
            verticalOrigin : Cesium.VerticalOrigin.BOTTOM
        },
        label:{
            text:node.text,
            fillColor:this._color,
            pixelOffset:new Cesium.Cartesian2(40,-40),
            font:'25px sans-serif',
        }
    });
    this.markers.push(marker);

    if(this._nodes.length>0){
        var line=entities.add({
            polyline : {
                positions : getLinkedPointList(this._nodes[this._nodes.length-1].position,node.position,this._angularityFactor,Math.max(this._angularityFactor/100,10)),
                width : 3,
                material : new Cesium.PolylineDashMaterialProperty({
                    color:this._color,
                    dashLength:this._dashLength
                })
            }
        });

        this.lines.push(line);
    }

    this._nodes.push(node);
};

/**
 * 移除所有实体
 */
ArcDashLine.prototype.removeAll=function () {
    var entities=this._viewer.entities;

    for(var i=0;i<this._nodes.length;i++){
        entities.remove(this.markers[i]);
        entities.remove(this.lines[i]);
    }

    this.lines=[];
    this.markers=[];
    this._nodes=[];
};


/**
 * 定义节点
 *
 * @param {Cesium.Cartesian3} position 节点坐标
 * @param {String} text 节点标注文本
 * @return {{position: *, text: *}}
 *
 * @constructor
 */
function Node(position,text) {
    return {
        position:position,
        text:text
    }
}


var colorScratch = new Cesium.Color();

/**
 * 绘制图标
 *
 * @param {Object} options 包括如下选项的对象:
 * @param {Number} [options.width=40] 图标宽度
 * @param {Number} [options.height=48] 图标高度
 * @param {Cesium.Color} [options.color=Cesium.Color.WHITE] 图标颜色
 *
 * @return {string} 返回图标的base64格式
 */
function drawIcon(options) {
    options=Cesium.defaultValue(options,{});

    var width=options.width;
    var height=options.height;
    var color=options.color;

    if(!Cesium.defined(width)){
        width=40;
    }
    if(!Cesium.defined(height)){
        height=48;
    }
    if(!Cesium.defined(color)){
        color=Cesium.Color.WHITE;
    }

    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var context2D = canvas.getContext("2d");

    context2D.save();
    context2D.scale(width / 24, height / 24); //Added to auto-generated code to scale up to desired size.
    context2D.fillStyle = color.toCssColorString(); //Modified from auto-generated code.
    context2D.strokeStyle = color.brighten(0.6, colorScratch).toCssColorString(); //Modified from auto-generated code.
    context2D.lineWidth = 0;
    context2D.beginPath();

    context2D.moveTo(12, 24);
    context2D.lineTo(4, 8);
    context2D.arc(12,8,8,1*Math.PI,0*Math.PI);
    context2D.lineTo(12, 24);

    context2D.closePath();
    context2D.fill();
    context2D.stroke();
    context2D.restore();

    return canvas.toDataURL("image/png");//base64
}

/**
 * 计算链路的点集
 *
 * @param {Cesium.Cartesian3} startPoint 开始节点
 * @param {Cesium.Cartesian3} endPoint 结束节点
 * @param {Number} angularityFactor 曲率
 * @param {Number} numOfSingleLine 点集数量
 *
 * @returns {Cartesian3[]}
 */
function getLinkedPointList(startPoint, endPoint, angularityFactor, numOfSingleLine) {
    var result = [];

    var startPosition = Cesium.Cartographic.fromCartesian(startPoint);
    var endPosition = Cesium.Cartographic.fromCartesian(endPoint);

    var startLon = startPosition.longitude * 180 / Math.PI;
    var startLat = startPosition.latitude * 180 / Math.PI;
    var endLon = endPosition.longitude * 180 / Math.PI;
    var endLat = endPosition.latitude * 180 / Math.PI;

    var dist = Math.sqrt((startLon - endLon) * (startLon - endLon) + (startLat - endLat) * (startLat - endLat));


    //var dist = Cesium.Cartesian3.distance(startPoint, endPoint);
    var angularity = dist * angularityFactor;

    var startVec = Cesium.Cartesian3.clone(startPoint);
    var endVec = Cesium.Cartesian3.clone(endPoint);

    var startLength = Cesium.Cartesian3.distance(startVec, Cesium.Cartesian3.ZERO);
    var endLength = Cesium.Cartesian3.distance(endVec, Cesium.Cartesian3.ZERO);

    Cesium.Cartesian3.normalize(startVec, startVec);
    Cesium.Cartesian3.normalize(endVec, endVec);

    if (Cesium.Cartesian3.distance(startVec, endVec) == 0) {
        return result;
    }

    //var cosOmega = Cesium.Cartesian3.dot(startVec, endVec);
    //var omega = Math.acos(cosOmega);

    var omega = Cesium.Cartesian3.angleBetween(startVec, endVec);

    result.push(startPoint);
    for (var i = 1; i < numOfSingleLine - 1; i++) {
        var t = i * 1.0 / (numOfSingleLine - 1);
        var invT = 1 - t;

        var startScalar = Math.sin(invT * omega) / Math.sin(omega);
        var endScalar = Math.sin(t * omega) / Math.sin(omega);

        var startScalarVec = Cesium.Cartesian3.multiplyByScalar(startVec, startScalar, new Cesium.Cartesian3());
        var endScalarVec = Cesium.Cartesian3.multiplyByScalar(endVec, endScalar, new Cesium.Cartesian3());

        var centerVec = Cesium.Cartesian3.add(startScalarVec, endScalarVec, new Cesium.Cartesian3());

        var ht = t * Math.PI;
        var centerLength = startLength * invT + endLength * t + Math.sin(ht) * angularity;
        centerVec = Cesium.Cartesian3.multiplyByScalar(centerVec, centerLength, centerVec);

        result.push(centerVec);
    }

    result.push(endPoint);

    return result;
}
