/*
 * SvgOrg v0.1.20180131
 * jquery 1.11 이상과 d3 v4 이상이 필요함
 */
SvgOrg.svgOrgCnt = 0;
SvgOrg.BOX_WIDTH = 80;
SvgOrg.BOX_HEIGHT = 40;
SvgOrg.FONT_SIZE = 12;
SvgOrg.DEFAULT_CONFIG = {
	"width"	: 1188,
	"height": 400,
	"imgPath" : "",
	"signalUrl" : "",
	"saveUrl" : "",
	"useGradient" : "Y",
	"useShadow" : "Y",
	"hideDefaultBtn" : false,
	"mode"	: "VIEW"	// EDIT or VIEW
}
SvgOrg.KIND_CIRCLE = "05"

function SvgOrg(config) {
	var sc = this;
	sc.config = {};
	for(var i in SvgOrg.DEFAULT_CONFIG) {
		sc.config[i] = SvgOrg.DEFAULT_CONFIG[i];
	}
	if(config != undefined) {
		for(var i in config) {
			sc.config[i] = config[i];
		}
	}
	
	sc.id = sc.generateId();
	
	this.init = function() {
		$("#" + sc.id).remove();
		sc.dataList = {};
		sc.deleteArrows = [];		// 삭제한 화살표들 value
		sc.signals = {};			// 신호등 정보
		sc.shapes = {};				// 박스 모양 정보
		sc.clickedPosCorrection = {"x":0, "y":0};	// 박스 드래그시 좌표 보정용 배열 {x, y}
		sc.idx = 0;					// 객체 index
		sc.selectedObjIdx = null;	// 현재 선택된 객체의 idx
		
		sc.makeLayout();
		sc.addShadow();
		sc.loadData();
	}
	
	this.init();
}

SvgOrg.prototype.generateId = function() {
	return "svgOrg" + ++SvgOrg.svgOrgCnt;
}

// 레이아웃 생성, 버튼 생성
SvgOrg.prototype.makeLayout = function() {
	var sc = this;
	sc.$layout = $("<div class='svgOrgLayout'>")
					.attr("id", sc.id)
					.appendTo((sc.config.targetId == undefined || $("#" + sc.config.targetId).length == 0 ? $("body") : $("#" + sc.config.targetId)))
					.css({
						"width" : sc.config.width
					});
					;
	sc.$svg = $("<svg class='svgOrg'>")
				.appendTo(sc.$layout)
				.css({
					"width" : sc.config.width,
					"height" : sc.config.height
				});
	
	if(sc.config.mode == "EDIT" && !sc.config.hideDefaultBtn) {
		sc.$btns = $("<div class='scBtns'>").appendTo(sc.$layout);
		$("<button class=\"scBtnSaveChart\">" + getMessage("button.save") + "</button>").appendTo(sc.$btns).on("click", function() {sc.saveChart();return false;});
	}
}

// 데이터 로드
SvgOrg.prototype.loadData = function() {
	var sc = this;
	var idx = sc.idx;
	
	if(sc.config.url == undefined) {
		$.showMsgBox(getMessage("errors.noUrl"));
		return false;
	}
	
	var $data = null;
	$.ajax({
		url : decodeURIComponent(sc.config.url),
		method : "GET",
		dataType : "text",
		async : false
	})
		.done(function(data, textStatus, jqXHR) {
			data = $.parseXML($.trim(data));
			$data = $(data).find("chart");
		})
		.fail(function(jqXHR, textStatus, errorThrown) {
			$.showMsgBox(getMessage("errors.processing"));
		});
	
	if($data == null || $data.length == 0) {
		return false;
	}
	
	// 신호등 정보 조회
	$.ajax({
		url : decodeURIComponent(sc.config.signalUrl),
		method : "GET",
		dataType : "xml",
		async : false
	})
		.done(function(data, textStatus, jqXHR) {
			$(data).find("chart etc item signal").each(function(i, e) {
				sc.signals[$(e).attr("code")] = "#" + $(e).attr("color").replace("0x", "");
				sc.addGradient($(e).attr("code"));
			});
			$(data).find("chart etc shape item").each(function(i, e) {
				var kind = $(e).attr("kind");
				sc.shapes[kind] = {}
				$(e).each(function() {
					$.each(this.attributes, function() {
						if(this.specified) {
							sc.shapes[kind][this.name] = this.value;
						}
					});
				});
			});
		})
		.fail(function(jqXHR, textStatus, errorThrown) {
			$.showMsgBox(getMessage("errors.processing"));
		});
	
	// 배경 이미지 세팅
	sc.$svg.css("background", "url(" + sc.config.imgPath + $data.find("category_setting").attr("backGround") + ")");
	
	$data.find("etc item").each(function(i, e) {
		var $item = $(this);
		var $link = $(this).children("link");
		
		sc.dataList[idx] = {
							"idx"	:	idx,
							"text"	:	$item.attr("text"),
							"code"	:	$item.attr("code"),
							"signal" :	$item.attr("signal"),
							"kind"	:	$item.attr("kind"),
							"x"		:	parseInt($item.attr("x"), 10),
							"y"		:	parseInt($item.attr("y"), 10),
							"score"	:	$item.attr("score"),
							"link"	:	sc.config.mode == "VIEW" ? $link.text() : "",
							"level"	:	$item.parents("item").length + 1
						};

		sc.makeBox(idx);
		idx++;
	});
	
	sc.idx = idx;
}

// 박스 생성
SvgOrg.prototype.makeBox = function(idx) {
	var sc = this;
	
	var boxGrp = d3.select("#" + sc.id + " .svgOrg")
					.append("g")
					.attr("transform", function(d){return "translate(" + [sc.dataList[idx].x, sc.dataList[idx].y] + ")"})
					.attr("grpIdx", idx)
					.attr("class", "boxGrp boxGrp" + idx)
					;
	
	if(sc.config.mode == "EDIT") {
		boxGrp.classed("boxMove", true)
				.call(
					d3.drag()
					.on("start", function() {sc.dragStartObj(this);})
					.on("drag", function() {sc.dragObj(this);})
		);
	} else {
		boxGrp.classed("boxClick", true);
	}
	
	var kind = sc.dataList[idx].kind;
	if(kind.toString().length == 1) kind = "0" + kind;
	var shape = sc.shapes[kind];

	var level = sc.dataList[idx].level;
	if(level == 1) {
		shape = sc.shapes["07"];
	} else if(level == 2) {
		shape = sc.shapes["19"];
	} else if(level == 3) {
		shape = sc.shapes["05"];
	}
	
	var width = parseInt(shape.width, 10);
	var height = parseInt(shape.height, 10);
	var box;
	
	if(shape.kind != SvgOrg.KIND_CIRCLE) {
		box = boxGrp.append("rect")
				.attr("width", width)
				.attr("height", height)
				.attr("rx", parseInt(height/3, 10))
				.attr("ry", parseInt(height/3, 10));
	} else {
		box = boxGrp.append("circle")
				.attr("cx", 10)
				.attr("cy", height/2)
				.attr("r", height/2-2);
	}

	box.attr("class", "box")
			.attr("type", "box")
			.attr("grpIdx", idx)
			;
	
	if(box.attr("fill") == null) {
		if(sc.config.useGradient == "Y") {
			box.attr("fill", "url(#linear_" + sc.id + "_" + sc.dataList[idx].signal + ")");
		} else {
			box.attr("fill", sc.signals[sc.dataList[idx].signal]);
		}
		if(shape.kind != SvgOrg.KIND_CIRCLE && sc.config.useShadow == "Y") {
			box.attr("filter", "url(#shadow_" + sc.id + ")");
		}
		
		box.attr("style", "stroke:" + sc.signals[sc.dataList[idx].signal]);
	}

	var boxTxt = boxGrp.append("text")
			.attr("x", width/2)
			.attr("text-anchor", "middle")
			.attr("fill", "black")
			.attr("class", "title")
			.attr("font-size", shape.fontsize)
			.style("font-family", shape.fontfamily)
			.text(sc.dataList[idx].text)
			;
	
	var y = boxTxt.node().getBBox().height + parseInt((box.node().getBBox().height - boxTxt.node().getBBox().height) / 2, 10);
	if(navigator.userAgent.toLowerCase().indexOf("chrome") > -1 && navigator.userAgent.toLowerCase().indexOf("edge") == -1) {	// chrome
		boxTxt.attr("y", y);
	} else {
		boxTxt.attr("y", y-1);
	}
	
	if(boxTxt.node().getBBox().width > width) {
		boxTxt.call(sc.textWrap, shape.kind, width, height, level, shape.fontsize);
	}
	
	if(shape.kind != SvgOrg.KIND_CIRCLE) {
		boxTxt.attr("x", width/2)
			.attr("text-anchor", "middle");
	} else {
		boxTxt.attr("x", height + 5)
			.attr("text-anchor", "start");
	}
	
	if(shape.fontbold == "true") {
		boxTxt.attr("font-weight", "bold");
	}
	
	var link = sc.dataList[idx].link;
	if(link != "") {
		if(link.indexOf("javascript:") == 0) {
			link = link.substring("javascript:".length);
			var f = new Function(link);
			box.on("click", f);
			boxGrp.select("text").on("click", f);
		} else if(link.indexOf("http://") == 0 || link.indexOf("https://") == 0) {
			box.on("click", function() {
						document.location.href = link;
					});
			boxGrp.select("text").on("click", function() {
						document.location.href = link;
					});
		}
	}
}

/*
 * 텍스트 자동 줄바꿈
 * https://bl.ocks.org/mbostock/7555321	소스를 참고함
 */
SvgOrg.prototype.textWrap = function(text, kind, width, height, level, fontsize) {
	var x = width/2;
	if(kind == SvgOrg.KIND_CIRCLE) {
		x = height + 5;
	}
	
	text.each(function() {
		var text = d3.select(this),
			words = text.text().split(/\s+/).reverse(),
			word,
			line = [],
			lineHeight = fontsize,
			y = parseInt(text.attr("y"), 10),
			dy = parseFloat(text.attr("font-size"), 10),
			tspan = text.text(null).append("tspan").attr("type", "box").attr("x", x).attr("y", y).attr("dy", "0px");

		var lineCnt = 0;
		while(word = words.pop()) {
			line.push(word);
			tspan.text(line.join(" "));
			if (tspan.node().getComputedTextLength() > width) {
				line.pop();
				tspan.text(line.join(" "));
				
				if(line.join(" ") == "") {
					tspan.text(word);
					continue;
				}
				
				line = [word];
				tspan = text.append("tspan").attr("type", "box").attr("x", x).attr("y", y).text(word);
			}
			lineCnt++;
		}

		var tspans = text.selectAll("tspan");
		var corrVal = 0;
		tspans.each(function(d, i) {
			if(level < 3) {
				corrVal = lineHeight/2 * (tspans.size()-1);
			}
			d3.select(this).attr("dy", lineHeight * i - corrVal);
		});
	});
}

// 박스 dragStart시 클릭 지점 보정 좌표 계산
SvgOrg.prototype.dragStartObj = function(obj) {
	var d = d3.select(obj).data()[0];
	var sc = this;
	sc.selectedObjIdx = d3.select(obj).attr("grpIdx");
	d3.select(obj)
		.classed("boxGrpClicked", true);
	try {
		var t = $.trim(d3.select(obj).attr("transform").replace(/(translate\(|\))/gi, ""));
		if(t.indexOf(",") > -1) {
			t = t.split(",");
		} else {
			t = t.split(" ");
		}
		sc.clickedPosCorrection = {
									"x":parseFloat(t[0], 10) - d3.event.x,
									"y":parseFloat(t[1], 10) - d3.event.y
								};
	} catch(e) {
		sc.clickedPosCorrection = {"x":0, "y":0};
	}
}

// 박스 이동
SvgOrg.prototype.dragObj = function(obj) {
	var sc = this;
	var x = d3.event.x + sc.clickedPosCorrection.x;
	var y = d3.event.y + sc.clickedPosCorrection.y;
	d3.select(obj)
		.attr("transform", "translate(" + [x, y] + ")");
	sc.dataList[sc.selectedObjIdx].x = x;
	sc.dataList[sc.selectedObjIdx].y = y;
};

SvgOrg.prototype.saveChart = function(paramData) {
	var sc = this;
	if(typeof paramData == "undefined" || paramData == null) paramData = {};
	var dataList = sc.dataList;
	var code = [];
	
	var data;
	var arrowCnt = 0;
	for(var i in dataList) {
		data = dataList[i];
		code.push(
						"code=" + data.code
						+ ",x=" + data.x
						+ ",y=" + data.y
					);
	}
	code = code.join(";");
	paramData["code"] = code;
	
	$.ajax({
		url : decodeURIComponent(sc.config.saveUrl),
		method :"POST",
		data : paramData,
		dataType : "text"
	})
		.done(function(data, textStatus, jqXHR) {
			try {
				var json = JSON.parse(data);
				if(json.callbackFunction != undefined) {
					window[json.callbackFunction]();
				} else {
					$.showMsgBox("저장이 완료되었습니다.");
				}
			} catch(e) {
				$.showMsgBox("저장이 완료되었습니다.");
			}
		})
		.fail(function(jqXHR, textStatus, errorThrown) {
			$.showMsgBox("오류가 발생했습니다.");
		});
}

SvgOrg.prototype.getDefs = function() {
	var sc = this;
	var svg = d3.select("#" + sc.id + " .svgOrg");
	var defs;
	if($("#" + sc.id + " defs").length == 0) {
		defs = svg.append("defs");
	} else {
		defs = d3.select("#" + sc.id + " defs");
	}
	return defs;
}

// 그림자 정의
SvgOrg.prototype.addShadow = function() {
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
SvgOrg.prototype.addGradient = function(id) {
	var sc = this;
	var defs = sc.getDefs();
	var gradient = defs.append("linearGradient")
						.attr("id", "linear_" + sc.id + "_" + id)
						.attr("x1", "0%")
						.attr("y1", "0%")
						.attr("x2", "0%")
						.attr("y2", "100%")
						;
	gradient.append("stop")
			.attr("offset", "0%")
			.attr("style", "stop-color:#FFFFFF;stop-opacity:1")
			;
	gradient.append("stop")
			.attr("offset", "100%")
			.attr("style", "stop-color:" + sc.signals[id] + ";stop-opacity:1")
			;
}