/*
 * SvgTree v0.1.20180601
 * SvgTree v0.1.20170811의 임시 수정판
 * jquery 1.11 이상과 d3 v4 이상이 필요함
 */
SvgTree.svgTreeCnt = 0;
SvgTree.BOX_WIDTH = 200;
SvgTree.BOX_HEIGHT = 90;
SvgTree.BOX_SPACE = 40;
SvgTree.FONT_SIZE = 12;
SvgTree.BUTTON_SIZE_S = 15;
SvgTree.DEFAULT_CONFIG = {
	"width"	: 1200,
	"height": 600,
	"url"	: "",
	"direction" : "H",
	"zoomMin" : 50,
	"zoomMax" : 150,
	"useGradient" : "N",
	"useShadow" : "Y"
}

function SvgTree(config) {
	var sc = this;
	sc.config = {};
	for(var i in SvgTree.DEFAULT_CONFIG) {
		sc.config[i] = SvgTree.DEFAULT_CONFIG[i];
	}
	if(config != undefined) {
		for(var i in config) {
			sc.config[i] = config[i];
		}
	}

	sc.id = sc.generateId();

	this.init = function() {
		$("#" + sc.id).remove();
		sc.scale = 1;
		sc.idx = 0;	// 객체 index
		sc.makeLayout();
		sc.addShadow();
		sc.loadData();
		svg_textMultiline();

	}

	this.init();
}

SvgTree.prototype.generateId = function() {
	return "svgTree" + ++SvgTree.svgTreeCnt;
}

// 레이아웃 생성, 버튼 생성
SvgTree.prototype.makeLayout = function() {
	var sc = this;
	sc.$layout = $("<div class='svgTreeLayout'>")
					.attr("id", sc.id)
					.appendTo((sc.config.targetId == undefined || $("#" + sc.config.targetId).length == 0 ? $("body") : $("#" + sc.config.targetId)))
					.css({
						"width" : sc.config.width
					});


	sc.$btns = $("<div class='scBtns'>").appendTo(sc.$layout);
	var txt = sc.config.direction == "H" ? "수직" : "수평";

	$("<button type=\"button\" class=\"scBtnZoomInit hx20\">기본크기</button>").appendTo(sc.$btns).on("click", function() {sc.setZoom("INIT");return false;});
	$("<button type=\"button\" class=\"scBtnZoomMax hx20\">최대크기</button>").appendTo(sc.$btns).on("click", function() {sc.setZoom("MAX");return false;});
	$("<button type=\"button\" class=\"scBtnChangeDirection hx20\">" + txt + "</button>").appendTo(sc.$btns).on("click", function() {sc.changeDirection();return false;});
	$("<input class=\"scZoomRange\" type=\"range\" min=\"" + sc.config.zoomMin + "\" max=\"" + sc.config.zoomMax + "\" value=\"100\"/>").appendTo(sc.$btns).on("input change", function() {sc.zoom(this.value);return false;});

	$("<input class=\"scChkAttr\" type=\"checkbox\" id=\"scChkAttr_" + sc.id + "\">").appendTo(sc.$btns).on("change", function() {sc.showAttr();return false;});
	$("<label for=\"scChkAttr_" + sc.id + "\">").text("항목속성").appendTo(sc.$btns);

	$("<div class='svgTreeDiv'>").css({
					"width" : sc.config.width,
					"height" : sc.config.height
				})
				.appendTo(sc.$layout);
	sc.$svg = $("<svg class='svgTree'>")
					.css({
						"width" : sc.config.width,
						"height" : sc.config.height - 5
					})
					.appendTo(sc.$layout.find(".svgTreeDiv"))
					;
}

// 데이터 로드
SvgTree.prototype.loadData = function() {
	var sc = this;
	var idx = sc.idx;

	if(sc.config.url == undefined) {
		$.showMsgBox("데이터를 조회할 URL 정보가 없습니다.");
		return false;
	}

	var $data = null;
	$.ajax({
		url : decodeURIComponent(sc.config.url),
		method : "GET",
		dataType : "html",
		async : false
	})
		.done(function(data, textStatus, jqXHR) {
			data = $.parseXML($.trim(data));
			$data = $(data).find("root");
		})
		.fail(function(jqXHR, textStatus, errorThrown) {
			$.showMsgBox("데이터 조회 중 오류가 발생했습니다.");
		});

	if($data == null || $data.length == 0) {
		sc.data = null;
		return false;
	}

	if($data.children("node") == null || $data.children("node").length == 0){
		sc.data = null;
		return false;
	}

	// 그라데이션 정의
	$data.find("node").each(function(i, e) {
		sc.addGradient($(e).attr("color"));
	});

	$data.children("node").each(function(i, e) {
		sc.makeBox($(e));
	});
	sc.resizeSvg();
	sc.data = $data;
}

// 박스 생성
SvgTree.prototype.makeBox = function($node) {
	var sc = this;
	var idx = ++sc.idx;
	$node.attr("isVisible", "Y");
	$node.attr({
		"idx" : idx,
		"totChildCnt" : sc.getTotalChlidrenCnt($node),
	});

	var level = $node.parents("node").length;
	if(level > 0) level = 1;
	var $sNodes = $node.prevAll("node");
	var sNodeCnt = $sNodes.length;

	var x, y;
	if(sc.config.direction == "H") {
		x = (SvgTree.BOX_WIDTH + SvgTree.BOX_SPACE) * level;
		y = 0;
		for(var i=0; i<sNodeCnt; i++) {
			y += parseInt($sNodes.eq(i).attr("totChildCnt"), 10);
		}
		y = (SvgTree.BOX_HEIGHT + SvgTree.BOX_SPACE) * y;
	} else {
		x = 0;
		y = (SvgTree.BOX_HEIGHT + SvgTree.BOX_SPACE) * level;
		for(var i=0; i<sNodeCnt; i++) {
			x += parseInt($sNodes.eq(i).attr("totChildCnt"), 10);
		}
		x = (SvgTree.BOX_WIDTH + SvgTree.BOX_SPACE) * x;
	}

	var boxGrp, subBoxGrp, box;

	if(level == 0) {
		boxGrp = d3.select("#" + sc.id + " .svgTree");
	} else {
		var pIdx = $node.parent().attr("idx");
		boxGrp = d3.select("#" + sc.id + " .svgTree").select(".subBoxGrp" + pIdx);
	}

	// 그룹
	boxGrp = boxGrp.append("g")
		.attr("transform", function(d){return "translate(" + [x, y] + ") scale(" + sc.scale + ")"})
		.attr("grpIdx", idx)
		.attr("class", "boxGrp boxGrp" + idx)
		;

	// 상단
	var path = "M 0, " + (SvgTree.BOX_HEIGHT/3)
			+ " v" + -(SvgTree.BOX_HEIGHT/3-6)
			+ " a5,5 0 0 1 5,-5"
			+ " h" + (SvgTree.BOX_WIDTH-10)
			+ " a5,5 0 0 1 5,5"
			+ " v" + (SvgTree.BOX_HEIGHT/3-6)
			;
	var boxUpper = boxGrp.append("path")
			.attr("d", path)
			.attr("class", "boxBorder")
			;
	if(sc.config.useGradient == "Y") {
		boxUpper.attr("fill", "url(#linear_" + sc.id + "_" + $node.attr("color") + ")");
	} else {
		boxUpper.attr("fill", $node.attr("color"));
	}
	if(sc.config.useShadow == "Y") {
		boxUpper.attr("filter", "url(#shadow_" + sc.id + ")");
	}

	// 하단
	path = "M 0, " + (SvgTree.BOX_HEIGHT/3)
			+ " v" + (SvgTree.BOX_HEIGHT/3*2-6)
			+ " a5,5 0 0 0 5,5"
			+ " h" + (SvgTree.BOX_WIDTH-10)
			+ " a5,5 0 0 0 5,-5"
			+ " v" + -(SvgTree.BOX_HEIGHT/3*2-6)
			+ " z"
			;
	var boxLower = boxGrp.append("path")
			.attr("d", path)
			.attr("fill", "#FFFFFF")
			.attr("class", "boxBorder")
			;
	if(sc.config.useShadow == "Y") {
		boxLower.attr("filter", "url(#shadow_" + sc.id + ")");
	}

	// 글자
	var boxTxt = boxGrp.append("text")
			.attr("x", SvgTree.BUTTON_SIZE_S * 0.5)
			.attr("y", SvgTree.BUTTON_SIZE_S * 1.3)
			.attr("fill", "black")
			.attr("class", "title")
			.attr("font-size", 12)
			.text($node.attr("label"))
			.on("click", function() {
				//cascadingJS($node.attr("url"));
				if(isNotEmpty(sc.config.callback))
				{
				    sc.config.callback($node.attr("id"));
				}
			});
			;

	boxGrp.append("text")
			.attr("x", SvgTree.BUTTON_SIZE_S * 0.5)
			.attr("y", SvgTree.BOX_HEIGHT/3 + SvgTree.BUTTON_SIZE_S)
			.attr("fill", "black")
			.attr("font-size", 12)
			.text($node.attr("title"))
			;

	// 속성
	var boxAttrX = SvgTree.BUTTON_SIZE_S * 0.5;
	var boxAttrY = SvgTree.BOX_HEIGHT/3 + SvgTree.BUTTON_SIZE_S * 2;
	var boxAttrGrp = boxGrp.append("g")
		.attr("transform", function(d){return "translate(" + [boxAttrX, boxAttrY] + ")"})
		.attr("class", "boxAttrGrp boxAttrGrp" + idx)
		/*.attr("visibility", "")*/
		.attr("visibility", "hidden")
		;

	boxAttrGrp.append("rect")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", SvgTree.BOX_WIDTH - SvgTree.BUTTON_SIZE_S)
			.attr("height", SvgTree.BUTTON_SIZE_S * 1.4)
			.attr("fill", "transparent")
			.attr("class", "boxAttr")
			.attr("rx", 3)
			.attr("ry", 3)
			;

	boxAttrGrp.append("text")
			.attr("x", SvgTree.BUTTON_SIZE_S * 0.5)
			.attr("y", SvgTree.BUTTON_SIZE_S)
			.attr("fill", "black")
			.attr("font-size", 11)
			.text($node.attr("attributes").split("/")[0])
			;

	boxAttrGrp.append("text")
			.attr("x", SvgTree.BOX_WIDTH - SvgTree.BUTTON_SIZE_S * 1.5)
			.attr("y", SvgTree.BUTTON_SIZE_S)
			.attr("text-anchor", "end")
			.attr("fill", "black")
			.attr("font-size", 11)
			.text($node.attr("attributes").split("/")[1])
			;


	// 선
	if(level > 0) {
		boxGrp.append("line")
				.attr("x1", $node.prevAll("node").length == 0 ? -SvgTree.BOX_SPACE : -SvgTree.BOX_SPACE/2)
				.attr("y1", SvgTree.BOX_HEIGHT/2)
				.attr("x2", 0)
				.attr("y2", SvgTree.BOX_HEIGHT/2)
				.attr("class", "treeLine treeLineH")
				;

		boxGrp.append("line")
				.attr("x1", SvgTree.BOX_WIDTH/2)
				.attr("y1", $node.prevAll("node").length == 0 ? -SvgTree.BOX_SPACE : -SvgTree.BOX_SPACE/2)
				.attr("x2", SvgTree.BOX_WIDTH/2)
				.attr("y2", 0)
				.attr("class", "treeLine treeLineV")
				;

		if(sc.config.direction == "H") {
			boxGrp.select(".treeLineV")
					.attr("visibility", "hidden");
		} else {
			boxGrp.select(".treeLineH")
					.attr("visibility", "hidden");
		}
	}

	if($node.children().length > 0) {
		// 숨김, 보임 버튼
		box = boxGrp.append("rect")
				.attr("width", SvgTree.BUTTON_SIZE_S)
				.attr("height", SvgTree.BUTTON_SIZE_S)
				.attr("x", SvgTree.BOX_WIDTH - SvgTree.BUTTON_SIZE_S * 1.5)
				.attr("y", SvgTree.BUTTON_SIZE_S * 0.5)
				.attr("fill", "#FFFFFF")
				.attr("class", "boxBorder boxBtn")
				.attr("grpIdx", idx)
				.on("click", function(){sc.showSubNode($node)});
				;

		boxGrp.append("line")
				.attr("x1", SvgTree.BOX_WIDTH - SvgTree.BUTTON_SIZE_S)
				.attr("y1", SvgTree.BUTTON_SIZE_S * 0.5)
				.attr("x2", SvgTree.BOX_WIDTH - SvgTree.BUTTON_SIZE_S)
				.attr("y2", SvgTree.BUTTON_SIZE_S * 1.5)
				.attr("class", "btnLine btnLine" + idx)
				.attr("visibility", "hidden")
				.on("click", function(){sc.showSubNode($node)});
				;

		boxGrp.append("line")
				.attr("x1", SvgTree.BOX_WIDTH - SvgTree.BUTTON_SIZE_S * 1.5)
				.attr("y1", SvgTree.BUTTON_SIZE_S)
				.attr("x2", SvgTree.BOX_WIDTH - SvgTree.BUTTON_SIZE_S * 0.5)
				.attr("y2", SvgTree.BUTTON_SIZE_S)
				.attr("class", "btnLine")
				.on("click", function(){sc.showSubNode($node)});
				;

		subBoxGrp = boxGrp.append("g")
				.attr("transform", function(d){return "translate(" + [0,0] + ")"})
				.attr("class", "subBoxGrp" + idx)
				;

		$node.children("node").each(function(i, e) {
			sc.makeBox($(e));
		});

		// 하위 노드들 선 연결
		if($node.children().length > 1) {
			if(sc.config.direction == "H") {
				var lastY = $.trim(subBoxGrp.select(function() {return this.childNodes[this.childNodes.length-1]}).attr("transform").replace(/(translate\(|\))/gi, ""));
				if(lastY.indexOf(",") > -1) {
					lastY = lastY.split(",");
				} else {
					lastY = lastY.split(" ");
				}
				lastY = parseInt(lastY[1], 10);

				subBoxGrp.append("line")
					.attr("x1", SvgTree.BOX_WIDTH + SvgTree.BOX_SPACE/2)
					.attr("y1", SvgTree.BOX_HEIGHT/2)
					.attr("x2", SvgTree.BOX_WIDTH + SvgTree.BOX_SPACE/2)
					.attr("y2", lastY + SvgTree.BOX_HEIGHT/2)
					.attr("class", "treeLine treeLvlLine" + idx)
					;
			} else {
				var lastX = $.trim(subBoxGrp.select(function() {return this.childNodes[this.childNodes.length-1]}).attr("transform").replace(/(translate\(|\))/gi, ""));
				if(lastX.indexOf(",") > -1) {
					lastX = lastX.split(",");
				} else {
					lastX = lastX.split(" ");
				}
				lastX = parseInt(lastX[0], 10);

				subBoxGrp.append("line")
					.attr("x1", SvgTree.BOX_WIDTH/2)
					.attr("y1", SvgTree.BOX_HEIGHT + SvgTree.BOX_SPACE/2)
					.attr("x2", lastX + SvgTree.BOX_WIDTH/2)
					.attr("y2", SvgTree.BOX_HEIGHT + SvgTree.BOX_SPACE/2)
					.attr("class", "treeLine treeLvlLine" + idx)
					;
			}
		}
	}
}

// 박스 재배치
SvgTree.prototype.relocateBox = function($node) {
	var sc = this;
	var idx = $node.attr("idx");
	$node.attr("totChildCnt", sc.getTotalChlidrenCnt($node));

	var level = $node.parents("node").length;
	if(level > 0) level = 1;
	var $sNodes = $node.prevAll("node");
	var sNodeCnt = $sNodes.length;
	var x, y;
	if(sc.config.direction == "H") {
		x = (SvgTree.BOX_WIDTH + SvgTree.BOX_SPACE) * level;
		y = 0;
		for(var i=0; i<sNodeCnt; i++) {
			y += parseInt($sNodes.eq(i).attr("totChildCnt"), 10);
		}
		y = (SvgTree.BOX_HEIGHT + SvgTree.BOX_SPACE) * y;
	} else {
		x = 0;
		y = (SvgTree.BOX_HEIGHT + SvgTree.BOX_SPACE) * level;
		for(var i=0; i<sNodeCnt; i++) {
			x += parseInt($sNodes.eq(i).attr("totChildCnt"), 10);
		}
		x = (SvgTree.BOX_WIDTH + SvgTree.BOX_SPACE) * x;
	}

	var boxGrp, scaleStr;

	if(level == 0) {
		boxGrp = d3.select("#" + sc.id + " .svgTree");
		scaleStr = " scale(" + sc.scale + ")";
	} else {
		var pIdx = $node.parent().attr("idx");
		boxGrp = d3.select("#" + sc.id + " .svgTree").select(".subBoxGrp" + pIdx);
		scaleStr = "";
	}

	boxGrp = boxGrp.select("g.boxGrp" + idx)
					.attr("transform", "translate(" + [x, y] + ")" + scaleStr)
					;

	if($node.children().length > 0 && $node.attr("isVisible") == "Y") {
		$node.children("node").each(function(i, e) {
			sc.relocateBox($(e));
		});

		// 하위 노드들 선 연결
		if(sc.config.direction == "H") {
			var lastY = $.trim(boxGrp.select(".boxGrp" + $node.children("node:last").attr("idx")).attr("transform").replace(/(translate\(|\))/gi, ""));
			if(lastY.indexOf(",") > -1) {
				lastY = lastY.split(",");
			} else {
				lastY = lastY.split(" ");
			}
			lastY = parseInt(lastY[1], 10);

			boxGrp.select(".treeLvlLine" + idx)
					.attr("x1", SvgTree.BOX_WIDTH + SvgTree.BOX_SPACE/2)
					.attr("y1", SvgTree.BOX_HEIGHT/2)
					.attr("x2", SvgTree.BOX_WIDTH + SvgTree.BOX_SPACE/2)
					.attr("y2", lastY + SvgTree.BOX_HEIGHT/2)
					;
		} else {
			var lastX = $.trim(boxGrp.select(".boxGrp" + $node.children("node:last").attr("idx")).attr("transform").replace(/(translate\(|\))/gi, ""));
			if(lastX.indexOf(",") > -1) {
				lastX = lastX.split(",");
			} else {
				lastX = lastX.split(" ");
			}
			lastX = parseInt(lastX[0], 10);

			boxGrp.select(".treeLvlLine" + idx)
					.attr("x1", SvgTree.BOX_WIDTH/2)
					.attr("y1", SvgTree.BOX_HEIGHT + SvgTree.BOX_SPACE/2)
					.attr("x2", lastX + SvgTree.BOX_WIDTH/2)
					.attr("y2", SvgTree.BOX_HEIGHT + SvgTree.BOX_SPACE/2)
					;
		}
	}
}

// 하위 보임, 숨김
SvgTree.prototype.showSubNode = function($node) {
	var sc = this;
	var idx = $node.attr("idx");
	var subBoxGrp = d3.select("#" + sc.id + " .subBoxGrp" + idx);
	var btnLine = d3.select("#" + sc.id + " .btnLine" + idx);
	if(subBoxGrp.attr("visibility") == null || subBoxGrp.attr("visibility") == "visible") {
		subBoxGrp.attr("visibility", "hidden");
		btnLine.attr("visibility", null);
		$node.attr("isVisible", "N");
	} else {
		subBoxGrp.attr("visibility", null);
		btnLine.attr("visibility", "hidden");
		$node.attr("isVisible", "Y");
	}

	sc.relocateBox(sc.data.children("node"));
	sc.resizeSvg();
}

// 하위 노드 수 구함
SvgTree.prototype.getTotalChlidrenCnt = function($node) {
	var sc = this;
	var sum = 0;
	var $subNodes = $node.children("node");
	var len = $subNodes.length;
	if(len == 0 || ($node.attr("isVisible") != undefined && $node.attr("isVisible") == "N")) {
		return 1;
	}
	for(var i=0; i<len; i++) {
		sum += sc.getTotalChlidrenCnt($subNodes.eq(i));
	}
	return sum;
}

// 방향 전환
SvgTree.prototype.changeDirection = function() {
	var sc = this;
	var btnTxt = "";
	if(sc.config.direction == "H") {
		sc.config.direction = "V";
		btnTxt = "수평";
		d3.select("#" + sc.id + " .svgTree")
			.selectAll(".treeLineH")
			.attr("visibility", "hidden")
		;
		d3.select("#" + sc.id + " .svgTree")
			.selectAll(".treeLineV")
			.attr("visibility", null)
		;
	} else {
		sc.config.direction = "H";
		btnTxt = "수직";
		d3.select("#" + sc.id + " .svgTree")
			.selectAll(".treeLineH")
			.attr("visibility", null)
		;
		d3.select("#" + sc.id + " .svgTree")
			.selectAll(".treeLineV")
			.attr("visibility", "hidden")
		;
	}

	sc.$btns.find(".scBtnChangeDirection").text(btnTxt);
	sc.relocateBox(sc.data.children("node"));
	sc.resizeSvg();
}

// 확대/축소
SvgTree.prototype.setZoom = function(val) {

	var sc = this;
	if(val != undefined && typeof val === "string") {
		if(val == "INIT") {
			val = 100;
		} else if(val == "MAX") {
			val = sc.config.zoomMax;
		} else {
			val = 100;
		}
	}
	$("#" + sc.id + " .scZoomRange").val(val);
	sc.zoom(val);
}
SvgTree.prototype.zoom = function(val) {
	var sc = this;
	sc.scale = val/100;
	//sc.$svg.attr("transform", "translate(" + [0, 0] + ") scale(" + sc.scale + ")");
	d3.select("#" + sc.id + " .boxGrp")
		.attr("transform", "translate(" + [0, 0] + ") scale(" + sc.scale + ")")
		.attr("transform", "translate(" + [0, 0] + ") scale(" + sc.scale + ")")
		;
	sc.resizeSvg();
}

// 스크롤바 생성을 위해 svg 영역 조절
SvgTree.prototype.resizeSvg = function() {
	var sc = this;
	var bbox = $("#" + sc.id + " .boxGrp1").get(0).getBBox();
	try {
		d3.select("#" + sc.id + " svg")
			.style("width", sc.config.width * sc.scale)
			.style("height", sc.config.height * sc.scale - 5)
			;
	} catch(e) {
		// IE9 호환용
		d3.select("#" + sc.id + " svg")
			.attr("width", (sc.config.width * sc.scale))
			.attr("height", (sc.config.height * sc.scale - 5))
			;
	}
}

// 항목속성 보기
SvgTree.prototype.showAttr = function() {
	var sc = this;
	if($("#scChkAttr_" + sc.id).is(":checked")) {
		d3.selectAll("#" + sc.id + " .boxAttrGrp")
			.attr("visibility", null);
	} else {
		d3.selectAll("#" + sc.id + " .boxAttrGrp")
			.attr("visibility", "hidden");
	}
}

SvgTree.prototype.getDefs = function() {
	var sc = this;
	var svg = d3.select("#" + sc.id + " .svgTree");
	var defs;
	if($("#" + sc.id + " defs").length == 0) {
		defs = svg.append("defs");
	} else {
		defs = d3.select("#" + sc.id + " defs");
	}
	return defs;
}

// 그림자 정의
SvgTree.prototype.addShadow = function() {
	var sc = this;
	var defs = sc.getDefs();
	var filter = defs.append("filter")
						.attr("id", "shadow_" + sc.id)
						.attr("height", "150%")
						;
	filter.append("feGaussianBlur")
			.attr("in", "SourceAlpha")
			.attr("stdDeviation", "2")
			;
	filter.append("feOffset")
			.attr("dx", "0")
			.attr("dy", "2")
			.attr("result", "offsetblur")
			;
	var feComponentTransfer = filter.append("feComponentTransfer");
	feComponentTransfer.append("feFuncA")
						.attr("type", "linear")
						.attr("slope", "0.3");
	var feMerge = filter.append("feMerge");
	feMerge.append("feMergeNode");
	feMerge.append("feMergeNode")
			.attr("in", "SourceGraphic");
}

// 그라데이션 정의
SvgTree.prototype.addGradient = function(id) {
	var sc = this;
	var defs = sc.getDefs();
	var defId = "linear_" + sc.id + "_" + id;
	if($("#" + defId).length > 0) return;

	var gradient = defs.append("linearGradient")
						.attr("id", defId)
						.attr("x1", "0%")
						.attr("y1", "0%")
						.attr("x2", "0%")
						.attr("y2", "100%")
						;
	gradient.append("stop")
			.attr("offset", "0%")
			.attr("style", "stop-color:#FFFFFF;stop-opacity:0.3")
			;
	gradient.append("stop")
			.attr("offset", "100%")
			.attr("style", "stop-color:" + (id!=""?id:"#999999") + ";stop-opacity:1")
			;
}



function svg_textMultiline() {

  var x = 5;
  var y = 15;
  var width = 180;
  var lineHeight = 15;

  $('svg text:not(.title)').each(function(i, el){
      /* get the text */
      var element = el;//document.getElementById('test');
      var text = element.innerHTML;

      /* split the words into array */
      var words = text.split(' ');
      var line = '';

      /* Make a tspan for testing */
      element.innerHTML = '<tspan id="PROCESSING">busy</tspan >';

      for (var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + ' ';
        var testElem = document.getElementById('PROCESSING');
        /*  Add line in testElement */
        testElem.innerHTML = testLine;
        /* Messure textElement */
        var metrics = testElem.getBoundingClientRect();
        testWidth = metrics.width;

        if (testWidth > width && n > 0)
        {
          element.innerHTML += '<tspan x="' + x + '" dy="' + y + '">' + line + '</tspan>';
          line = words[n] + ' ';
        }
        else
        {
          line = testLine;
        }
      }

      element.innerHTML += '<tspan x="'+x+'" dy="' + y + '">' + line + '</tspan>';
      document.getElementById("PROCESSING").remove();
  });

  $('svg text[y=45]:not(.title)').each(function(i, el){
    $(el).find('tspan:eq(0)').attr('dy','0');
  });
}

