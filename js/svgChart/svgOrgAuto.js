/*
 * SvgOrgAuto v0.1.20180619
 *	- 권한에 따라 조직도가 바뀌는 경우 조직도를 자동으로 배치하는 버전
 *	- 조회 전용
 *	- jquery 1.11 이상과 d3 v4 이상이 필요함
 */
SvgOrg.svgOrgCnt = 0;
SvgOrg.BOX_WIDTH = 80;
SvgOrg.BOX_HEIGHT = 40;
SvgOrg.ORG_GROUP_TOP = 150;
SvgOrg.ORG_GROUP_WIDTH = 185;
SvgOrg.ORG_GROUP_HEIGHT = 200;
SvgOrg.ORG_GROUP_SPACE = 15;
SvgOrg.ORG_GROUP_HSPACE = 50;
SvgOrg.ORG_SPACE = 30;
SvgOrg.FONT_SIZE = 12;
SvgOrg.DEFAULT_CONFIG = {
	"width"	: 1188,
	"height": 400,
	"signalUrl" : "",
	"useGradient" : "Y",
	"useShadow" : "Y"
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
		sc.signals = {};			// 신호등 정보
		sc.shapes = {};				// 박스 모양 정보

		sc.loadData();
		sc.makeLayout();
	}

	this.init();
}

SvgOrg.prototype.generateId = function() {
	return "svgOrg" + ++SvgOrg.svgOrgCnt;
}

// 데이터 로드
SvgOrg.prototype.loadData = function() {
	var sc = this;

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
	sc.bgUrl = sc.config.imgPath + $data.find("category_setting").attr("backGround");

	var maxLevel = 0;
	var siblings = 0;
	$data.find("etc item").each(function(i, e) {
		var $item = $(this);
		var level = $item.parents("item").length + 1;
		if(level > maxLevel) maxLevel = level;
		if(level == 2 && siblings == 0) {
			siblings = $item.nextAll("item").length + 1;
		}
		$item.attr("level", level);
		$item.attr("idx", $item.prevAll("item").length);

		sc.dataList[i] = {
			"idx"	:	i,
			"text"	:	$item.attr("text"),
			"code"	:	$item.attr("code")
		}
	});

	sc.maxLevel = maxLevel;
	sc.siblings = siblings;
	sc.data = $data.children("etc");
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

	sc.addShadow();

	// 그라데이션 생성
	for(var key in sc.signals) {
		sc.addGradient(key);
	}

	if(sc.bgUrl != "") {
		//sc.$svg.css("background", "url(" + sc.bgUrl + ")");
	}

	if(sc.siblings > 0) {
		var orgGrpSpace = SvgOrg.ORG_GROUP_SPACE;
		if(sc.siblings < 6) {
			orgGrpSpace = SvgOrg.ORG_GROUP_SPACE * Math.pow(2, (4-sc.siblings)) * 3;
		}
		sc.orgGrpSpace = orgGrpSpace;

		var bgBoxGrpWidth = (SvgOrg.ORG_GROUP_WIDTH + orgGrpSpace) * sc.siblings - orgGrpSpace;
		var orgGrpLayout = d3.select("#" + sc.id + " .svgOrg")
						.append("g")
						.attr("transform", function(d){return "translate(" + [((sc.config.width - bgBoxGrpWidth) / 2), SvgOrg.ORG_GROUP_TOP] + ")"})
						.attr("class", "orgGrpLayout")
						;

		var x;
		// 조직 그룹별 배경, 세로선
		for(var i=0; i<sc.siblings; i++) {
			x = (SvgOrg.ORG_GROUP_WIDTH + orgGrpSpace) * i;

			if(sc.maxLevel > 2) {
				orgGrpLayout.append("rect")
					.attr("x", x)
					.attr("y", 0)
					.attr("width", SvgOrg.ORG_GROUP_WIDTH)
					.attr("height", SvgOrg.ORG_GROUP_HEIGHT)
					.attr("rx", 5)
					.attr("ry", 5)
					.attr("fill", "transparent")
					.attr("class", "orgGrp")
					;
			}

			x = x + SvgOrg.ORG_GROUP_WIDTH/2;
			orgGrpLayout.append("line")
				.attr("x1", x)
				.attr("y1", 0)
				.attr("x2", x)
				.attr("y2", -SvgOrg.ORG_GROUP_HSPACE/2)
				.attr("class", "orgLine orgLineH")
				;
		}

		// 가로선
		orgGrpLayout.append("line")
				.attr("x1", SvgOrg.ORG_GROUP_WIDTH/2)
				.attr("y1", -SvgOrg.ORG_GROUP_HSPACE/2)
				.attr("x2", (SvgOrg.ORG_GROUP_WIDTH + orgGrpSpace) * (sc.siblings-1) + SvgOrg.ORG_GROUP_WIDTH/2)
				.attr("y2", -SvgOrg.ORG_GROUP_HSPACE/2)
				.attr("class", "orgLine orgLineH")
				;

		// 중앙 세로선
		orgGrpLayout.append("line")
				.attr("x1", bgBoxGrpWidth/2)
				.attr("y1", -SvgOrg.ORG_GROUP_HSPACE/2)
				.attr("x2", bgBoxGrpWidth/2)
				.attr("y2", -SvgOrg.ORG_GROUP_HSPACE)
				.attr("class", "orgLine")
				;
	}

	$(sc.data.children("item")).each(function(i, e) {
		sc.makeBox($(e));
	});
}

// 박스 생성
SvgOrg.prototype.makeBox = function($item) {
	if($item == null || $item == undefined) return false;

	var sc = this;
	var boxGrp;
	var level = $item.attr("level");
	var x, y, idx = 0, pIdx = 0;
	if(level == 1) {
		boxGrp = d3.select("#" + sc.id + " .svgOrg")
					.append("g")
					;
		x = sc.config.width / 2;
		y = SvgOrg.ORG_GROUP_TOP - SvgOrg.ORG_GROUP_HSPACE;
	} else {
		boxGrp = d3.select("#" + sc.id + " .orgGrpLayout")
					.append("g")
					;
		idx = parseInt($item.attr("idx"), 10);
		pIdx = parseInt($item.parent().attr("idx"), 10);

		if(level == 2) {
			x = (SvgOrg.ORG_GROUP_WIDTH + sc.orgGrpSpace) * idx + SvgOrg.ORG_GROUP_WIDTH/2;
		} else {
			x = (SvgOrg.ORG_GROUP_WIDTH + sc.orgGrpSpace) * pIdx + SvgOrg.ORG_GROUP_WIDTH/2;
		}
		y = 0;
	}

	var kind = $item.attr("kind");
	if(kind.toString().length == 1) kind = "0" + kind;
	var shape = sc.shapes[kind];
	// kind 정보가 없는 경우
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
	x = x - width/2;
	if(level == 1) {
		y = y - height;
	} else if(level == 2) {
		y = y - height/2;
	} else if(level == 3) {
		x -= SvgOrg.ORG_SPACE/2;
		y = SvgOrg.ORG_SPACE;
		if(idx == 0) {
			y = SvgOrg.ORG_SPACE;
		} else  {
			y = parseInt($item.prev().attr("y"), 10) + ($item.prev().children("item").length + 1) * SvgOrg.ORG_SPACE;
		}
		$item.attr({"x":x, "y":y});
	} else {
		x = parseInt($item.parent().attr("x"), 10) + SvgOrg.ORG_SPACE/2;
		y = parseInt($item.parent().attr("y"), 10) + SvgOrg.ORG_SPACE * (idx + 1);
	}

	boxGrp.attr("transform", function(d){return "translate(" + [x, y] + ")"})
			.attr("class", "boxGrp boxGrp" + idx)
			.classed("boxClick", true)
			;

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
			;

	if(box.attr("fill") == null) {
		if(sc.config.useGradient == "Y") {
			box.attr("fill", "url(#linear_" + sc.id + "_" + $item.attr("signal") + ")");
		} else {
			box.attr("fill", sc.signals[$item.attr("signal")]);
		}
		if(shape.kind != SvgOrg.KIND_CIRCLE && sc.config.useShadow == "Y") {
			box.attr("filter", "url(#shadow_" + sc.id + ")");
		}
		box.attr("style", "stroke:" + sc.signals[$item.attr("signal")]);
	}

	var boxTxt = boxGrp.append("text")
			.attr("x", width/2)//.attr("y", height/2+1)
			.attr("text-anchor", "middle")//.attr("alignment-baseline", "middle")
			.attr("fill", "black")
			.attr("class", "title")
			.attr("font-size", shape.fontsize)
			.style("font-family", shape.fontfamily)
			.text($item.attr("text"))
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

	var link = $item.children("link").text();
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

	$item.children("item").each(function(i, e) {
		sc.makeBox($(e));
	});
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