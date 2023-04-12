/*
 * SvgChart v0.1.20180711
 * jquery 1.11 이상과 d3 v4 이상이 필요함
 */
SvgChart.svgChartCnt = 0;
SvgChart.BOX_WIDTH = 100;
SvgChart.BOX_HEIGHT = 50;
SvgChart.FONT_SIZE = 12;
SvgChart.DOT_RADIUS = 6;
SvgChart.DEFAULT_CONFIG = {
	"mode"	: "VIEW",	// EDIT or VIEW
	"width"	: 1190,
	"height": 550,
	"useGradient" : true,
	"useShadow" : true,
	"useBackGroundImage" : true,
	"showMetric" : true,
	"imgPath" : "",
	"arrowInitPoints" : [{"x" : 50, "y" : 100},{"x" : 50, "y" : 150},{"x" : 50, "y" : 200},{"x" : 50, "y" : 250}]
}

function SvgChart(config) {
	if($("#scArrowHead").length == 0) {
		this.makeMarker();
	}

	var sc = this;
	sc.config = {};
	for(var i in SvgChart.DEFAULT_CONFIG) {
		sc.config[i] = SvgChart.DEFAULT_CONFIG[i];
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
		sc.clickedPosCorrection = {"x":0, "y":0};	// 박스 드래그시 좌표 보정용 배열 {x, y}
		sc.allArrowsHide = false;	// 화살표 숨김 여부
		sc.idx = 0;					// 객체 index
		sc.selectedObjIdx = null;	// 현재 선택된 객체의 idx

		sc.makeLayout();
		sc.addShadow();
		sc.loadData();
		sc.showMetric();

		if(sc.config.mode == "EDIT") {
			d3.select("#" + sc.id + " .svgChart").on("click", function() {
				if(d3.event.target.tagName == "svg") {
					sc.deselectAll();
				}
			});
		}
	}

	this.init();
}

SvgChart.prototype = {
	"generateId" : function() {
		return "svgChart" + ++SvgChart.svgChartCnt;
	},
	// 레이아웃 생성, 버튼 생성
	"makeLayout" : function() {
		var sc = this;
		sc.$layout = $("<div class='svgChartLayout'>")
						.attr("id", sc.id)
						.appendTo((sc.config.targetId == undefined || $("#" + sc.config.targetId).length == 0 ? $("body") : $("#" + sc.config.targetId)))
						.css({
							"width" : sc.config.width
						});
						;
		sc.$svg = $("<svg class='svgChart'>")
					.appendTo(sc.$layout)
					.css({
						"width" : sc.config.width,
						"height" : sc.config.height
					});

		// 가로선용 그룹 추가 (z-index 대용)
		d3.select("#" + sc.id + " .svgChart").append("g")
				.attr("class", "hLineLayer")
				;

		sc.$btns = $("<div class='scBtns'>").appendTo(sc.$layout);
		$("<div class='scChkboxDiv'><input type='checkbox' id='chkbox_" + sc.id + "' " + (sc.config.showMetric ? "checked='checked'" : "") + "/> <label for='chkbox_" + sc.id + "'>" + getMessage("button.showMetric") + "</label></div>").appendTo(sc.$btns);
		$("#chkbox_" + sc.id).on("change", function() {sc.showMetric();return false;});
		if(sc.config.mode != "EDIT") {
			$("#chkbox_" + sc.id).closest(".scChkboxDiv").hide();
		}

		var $btnGrps;
		var $btnGrp;
		if(sc.config.mode == "EDIT") {

		}
	},

	// 데이터 로드
	"loadData" : function() {
		var sc = this;
		var idx = sc.idx;

		if(sc.config.url == undefined) {
			$.showMsgBox(getMessage("errors.noUrl"));
			return false;
		}
		
		console.log("data","load");
		
		var $data = null;
		$.ajax({
			url : decodeURIComponent(sc.config.url),
			method : "GET",
			dataType : "html",
			async : false
		})
			.done(function(data, textStatus, jqXHR) {
				$data = $(data).siblings("chart");
			})
			.fail(function(jqXHR, textStatus, errorThrown) {
				$.showMsgBox(getMessage("errors.processing"));
			});

		if($data == null || $data.length == 0) {
			return false;
		}

		// 신호등 정보 조회
		$.ajax({
			url : sc.config.trafficUrl,
			method : "GET",
			dataType : "html",
			async : false
		})
			.done(function(data, textStatus, jqXHR) {
				$(data).siblings("chart").find("etc item signal").each(function(i, e) {
					sc.signals[$(e).attr("code")] = "#" + $(e).attr("color").replace("0x", "");
					sc.addGradient($(e).attr("code"));
				});
			})
			.fail(function(jqXHR, textStatus, errorThrown) {
				$.showMsgBox(getMessage("errors.processing"));
			});

		// 배경 이미지 세팅
		if(sc.config.useBackGroundImage && isNotEmpty($data.find("etc").attr("img"))) {
			sc.$svg.css("background", "url(" + sc.config.imgPath + $data.find("etc").attr("img") + ")");
		}

		$data.find("etc item").each(function(i, e) {
			sc.dataList[idx] = {
								"isNew"	:	false,
								"idx"	:	idx,
								"type"	:	"box",
								"text"	:	$(this).attr("text"),
								"index"	:	$(this).attr("index"),
								"x"		:	isNaN($(this).attr("x")) || $(this).attr("x") == "" ? 0 : parseInt($(this).attr("x"), 10),
								"y"		:	isNaN($(this).attr("y")) || $(this).attr("y") == "" ? 0 : parseInt($(this).attr("y"), 10),
								"kind"	:	$(this).attr("kind") == "" ? "Symbol1" : $(this).attr("kind"),
								"signal" :	$(this).attr("signal"),
								"url"	:	sc.config.mode == "VIEW" ? $(this).attr("url") : ""
							};

			sc.makeBox(idx);
			$(this).find("data").each(function(i, e) {
				sc.makeData(idx, i, $(e));
				sc.makeData2(idx, i, $(e));
			});
			idx++;
		});

		// 관점
		$data.find("etc perspective").each(function(i, e) {
			sc.dataList[idx] = {
					"isNew"	:	false,
					"idx"	:	idx,
					"type"	:	"perspective",
					"text"	:	$(this).attr("text"),
					"index"	:	$(this).attr("index"),
					"x"		:	isNaN($(this).attr("x")) || $(this).attr("x") == "" ? 0 : parseInt($(this).attr("x"), 10),
					"y"		:	isNaN($(this).attr("y")) || $(this).attr("y") == "" ? 0 : parseInt($(this).attr("y"), 10),
					"kind"	:	"Symbol4"	// 투명
			};
			sc.makeBox(idx);
			idx++;
		});

		$data.find("etc arrow").each(function(i, e) {
			sc.dataList[idx] = {
								"isNew"	:	false,
								"idx"	:	idx,
								"type"	:	"arrow",
								"value"	:	$(this).attr("value"),
								"points" :	[
												{"x" : parseInt($(this).attr("px2"), 10), "y" : parseInt($(this).attr("py2"), 10)},
												{"x" : parseInt($(this).attr("cx2"), 10), "y" : parseInt($(this).attr("cy2"), 10)},
												{"x" : parseInt($(this).attr("cx1"), 10), "y" : parseInt($(this).attr("cy1"), 10)},
												{"x" : parseInt($(this).attr("px1"), 10), "y" : parseInt($(this).attr("py1"), 10)}
											],
								"initPoints" :	[
												{"x" : parseInt($(this).attr("px2"), 10), "y" : parseInt($(this).attr("py2"), 10)},
												{"x" : parseInt($(this).attr("cx2"), 10), "y" : parseInt($(this).attr("cy2"), 10)},
												{"x" : parseInt($(this).attr("cx1"), 10), "y" : parseInt($(this).attr("cy1"), 10)},
												{"x" : parseInt($(this).attr("px1"), 10), "y" : parseInt($(this).attr("py1"), 10)}
											]
							};

			sc.makeArrow(idx);
			idx++;
		});

		$data.find("etc hLine").each(function(i, e) {
			sc.dataList[idx] = {
					"isNew"	:	false,
					"idx"	:	idx,
					"type"	:	"hLine",
					"value"	:	$(this).attr("value"),
					"points" :	[
									{"x" : 0, "y" : parseInt($(this).attr("py1"), 10)},
									{"x" : sc.config["width"], "y" : parseInt($(this).attr("py2"), 10)}
								]
			};

			sc.makeHLine(idx);
			idx++;
		});

		// 지표 표시
		$("#chkbox_" + sc.id).prop("checked", ($data.find("etc").attr("showMetricYn") == "Y"));
		sc.showMetric();

		sc.idx = idx;
	},

	// 박스 생성
	"makeBox" : function(idx) {
		var sc = this;

		var boxGrp = d3.select("#" + sc.id + " .svgChart")
						.append("g")
						.attr("transform", function(d){return "translate(" + [sc.dataList[idx].x, sc.dataList[idx].y] + ")"})
						.attr("idx", idx)
						.attr("class", "boxGrp boxGrp" + idx)
						;
		if(sc.config.mode == "EDIT") {
			boxGrp.call(
				d3.drag()
					.on("start", function() {sc.dragStartObj(this);})
					.on("drag", function() {sc.dragObj(this);})
			).classed("cursorMove", true);
		}

		var box;
		switch(sc.dataList[idx].kind) {
			case "Symbol1":	// 타원
				box = boxGrp.append("ellipse")
						.attr("cx", SvgChart.BOX_WIDTH/2)
						.attr("cy", SvgChart.BOX_HEIGHT/2)
						.attr("rx", SvgChart.BOX_WIDTH/2)
						.attr("ry", SvgChart.BOX_HEIGHT/2)
						;
				break;
			case "Symbol4":	// 투명박스
				box = boxGrp.append("rect")
						.attr("width", SvgChart.BOX_WIDTH)
						.attr("height", SvgChart.BOX_HEIGHT)
						.attr("fill", "transparent")
						;
				break;
			case "Symbol3":	// 원형박스
				box = boxGrp.append("rect")
						.attr("width", SvgChart.BOX_WIDTH)
						.attr("height", SvgChart.BOX_HEIGHT)
						.attr("rx", SvgChart.BOX_WIDTH/3)
						.attr("ry", SvgChart.BOX_HEIGHT/2)
						;
				break;
			case "Symbol2":	// 라운딩박스
				box = boxGrp.append("rect")
						.attr("width", SvgChart.BOX_WIDTH)
						.attr("height", SvgChart.BOX_HEIGHT)
						.attr("rx", 5)
						.attr("ry", 5)
						;
				break;
		}
		box.attr("class", "box")
				.attr("type", "box")
				.attr("idx", idx)
				;
		if(box.attr("fill") == null) {
			if(sc.config.useGradient) {
				box.attr("fill", "url(#linear_" + sc.id + "_" + sc.dataList[idx].signal + ")");
			} else {
				box.attr("fill", sc.signals[sc.dataList[idx].signal]);
			}
			if(sc.config.useShadow) {
				box.attr("filter", "url(#shadow_" + sc.id + ")");
			}
			box.attr("style", "stroke:" + sc.signals[sc.dataList[idx].signal]);
		}

		if(sc.dataList[idx].type == "perspective") {
			boxGrp.append("text")
				.attr("x", 0)
				.attr("y", (SvgChart.BOX_HEIGHT + SvgChart.FONT_SIZE)/2)
				.attr("fill", "black")
				.attr("class", "title")
				.attr("font-size", SvgChart.FONT_SIZE)
				.attr("font-weight", "bold")
				.text(sc.dataList[idx].text);
		} else {
			boxGrp.append("text")
				.attr("x", SvgChart.BOX_WIDTH/2)
				.attr("text-anchor", "middle")
				.attr("fill", "black")
				.attr("class", "title")
				.attr("font-size", SvgChart.FONT_SIZE)
				.text(sc.dataList[idx].text)
				.call(sc.textWrap, SvgChart.BOX_WIDTH, sc.dataList[idx].kind);
		}

		if(!isEmpty(sc.dataList[idx].url)) {
			var url = sc.dataList[idx].url;
			if(url.indexOf("javascript:") == 0) {
				url = url.substring("javascript:".length);
				var f = new Function(url);
				box.on("click", f);
				boxGrp.select("text").on("click", f);
			} else if(url.indexOf("http://") == 0 || url.indexOf("https://") == 0) {
				box.on("click", function() {
							document.location.href = url;
						});
				boxGrp.select("text").on("click", function() {
							document.location.href = url;
						});
			}
		}
	},
	// 박스 dragStart시 클릭 지점 보정 좌표 계산
	"dragStartObj" : function(obj) {
		var d = d3.select(obj).data()[0];
		var sc = this;
		sc.deselectAll();
		sc.selectedObjIdx = d3.select(obj).attr("idx");
		d3.select(obj)
			.classed("boxGrpClicked", true);
		try {
			var t = $.trim(d3.select(obj).attr("transform").replace(/(translate\(|\))/gi, ""));

			if(t.indexOf(",") > -1) {
				t = t.split(",");
			} else {
				t = t.split(" ");
			}
			if(t.length == 1) {
				t[1] = 0;
			}
			sc.clickedPosCorrection = {
										"x":parseFloat(t[0], 10) - d3.event.x,
										"y":parseFloat(t[1], 10) - d3.event.y
									};
		} catch(e) {
			sc.clickedPosCorrection = {"x":0, "y":0};
		}
	},
	// 박스 이동
	"dragObj" : function(obj) {
		var sc = this;
		var x = d3.event.x + sc.clickedPosCorrection.x;
		var y = d3.event.y + sc.clickedPosCorrection.y;
		d3.select(obj)
			.attr("transform", "translate(" + [x, y] + ")");
		sc.dataList[sc.selectedObjIdx].x = x;
		sc.dataList[sc.selectedObjIdx].y = y;
	},
	/*
	 * 텍스트 자동 줄바꿈
	 * https://bl.ocks.org/mbostock/7555321	소스를 참고함
	 */
	"textWrap" : function(text, width, kind) {
		var x = SvgChart.BOX_WIDTH/2;
		text.each(function() {
			var text = d3.select(this),
				words = text.text().split(/\s+/).reverse(),
				word,
				line = [],
				lineHeight = SvgChart.FONT_SIZE * 1.2,
				y = text.attr("y"),
				dy = parseFloat(text.attr("font-size")),
				tspan = text.text(null).append("tspan").attr("type", "box").attr("x", x).attr("y", y).attr("dy", lineHeight + "px");

			while(word = words.pop()) {
				line.push(word);
				tspan.text(line.join(" "));
				if (tspan.node().getComputedTextLength() > width) {
					line.pop();
					tspan.text(line.join(" "));
					line = [word];
					tspan = text.append("tspan").attr("type", "box").attr("x", x).attr("y", y).attr("dy", lineHeight + "px").text(word);
				}
			}

			// 텍스트 세로 위치 보정
			try {
				txtboxHeight = text.select("tspan").node().getBBox().height;
				dy = parseFloat(parseFloat(text.select("tspan").attr("dy").replace("px", ""), 10).toFixed(2), 10);
				text.select("tspan").attr("dy", ((SvgChart.BOX_HEIGHT - txtboxHeight)/2 + dy - 1) + "px");
			} catch(e) {
				txtboxHeight = text.attr("font-size") * text.selectAll("tspan").size();
				dy = parseFloat(parseFloat(text.select("tspan").attr("dy").replace("px", ""), 10).toFixed(2), 10);
				text.select("tspan").attr("dy", ((SvgChart.BOX_HEIGHT - txtboxHeight)/2 + dy - 2) + "px");
			}
		});
	},
	// 하위 데이터 생성 (점 + 지표명)
	"makeData" : function(idx, i, $data) {
		var sc = this;
		var txt = $data.attr("text");

		var boxGrp = d3.select("#" + sc.id).select(".boxGrp" + idx);
		var metricGrp;
		if(i == 0) {
			metricGrp = boxGrp.append("g").attr("class", "metricGrp1 metricGrp1_" + idx).attr("visibility", "hidden");;
		} else {
			metricGrp = boxGrp.select(".metricGrp1");
		}

		var boxTxt = metricGrp.append("text")
				.attr("x", 20)
				.attr("y", SvgChart.BOX_HEIGHT + SvgChart.FONT_SIZE * (i+1) * 1.3 + 3)
				.attr("font-size", SvgChart.FONT_SIZE)
				.attr("type", "box")
				.text(txt);
		var dot = metricGrp.append("circle")
				.attr("cx", 10)
				.attr("cy", SvgChart.BOX_HEIGHT + SvgChart.FONT_SIZE * (i+1) * 1.3 - 1)
				.attr("r", SvgChart.DOT_RADIUS);

		// 하위 데이터 글자 말줄임표 처리
		var txtOffset = boxTxt.node().getBBox();
		while(txtOffset.width > SvgChart.BOX_WIDTH * 1.2) {
			txt = txt.substring(0, txt.length-1);
			boxTxt.text(txt);
			txtOffset = boxTxt.node().getBBox();
		}

		if(txt != $data.attr("text")) {
			txt = txt + "...";
			boxTxt.text(txt);
			txtOffset = boxTxt.node().getBBox();
		}

		// title tooltip 처리
		var titleRect = metricGrp.append("rect")
						.attr("x", txtOffset.x)
						.attr("y", txtOffset.y)
						.attr("width", txtOffset.width)
						.attr("height", txtOffset.height)
						.attr("fill", "transparent");

		var title = titleRect.append("title")
						.text($data.attr("text"));

		if(sc.config.useGradient) {
			dot.attr("fill", "url(#linear_" + sc.id + "_" + $data.attr("signal") + ")");
		} else {
			dot.attr("fill", sc.signals[$data.attr("signal")]);
		}
		dot.attr("style", "stroke:" + sc.signals[$data.attr("signal")]);

		if(sc.config.mode == "VIEW") {
			var url = $data.attr("url");
			if(!isEmpty(url)) {
				if(url.indexOf("javascript:") == 0) {
					url = url.substring("javascript:".length);
					var f = new Function(url);
					titleRect.on("click", f);
					boxTxt.on("click", f);
				} else if(url.indexOf("http://") == 0 || url.indexOf("https://") == 0) {
					titleRect.on("click", function() {
								document.location.href = url;
							});
					boxTxt.on("click", function() {
								document.location.href = url;
							});
				}
			}
		}
	},
	// 하위 데이터 생성 (점만 표시)
	"makeData2" : function(idx, i, $data) {
		var sc = this;
		var txt = $data.attr("text");

		var boxGrp = d3.select("#" + sc.id).select(".boxGrp" + idx);
		var metricGrp;
		if(i == 0) {
			metricGrp = boxGrp.append("g").attr("class", "metricGrp2 metricGrp2_" + idx).attr("visibility", "hidden");
		} else {
			metricGrp = boxGrp.select(".metricGrp2");
		}


		var dotsPerRow = parseInt((SvgChart.BOX_WIDTH + SvgChart.DOT_RADIUS) / (SvgChart.DOT_RADIUS * 3), 10);
		var dotRows = parseInt(i/dotsPerRow, 10);
		var dotI = i % dotsPerRow;
		var dotX = SvgChart.DOT_RADIUS + (dotI * SvgChart.DOT_RADIUS * 3);
		var dotY = SvgChart.BOX_HEIGHT + SvgChart.FONT_SIZE * 1.3 - 1
					+ (dotRows * SvgChart.DOT_RADIUS * 3);

		var dot = metricGrp.append("circle")
			.attr("cx", dotX)
			.attr("cy", dotY)
			.attr("r", SvgChart.DOT_RADIUS);

		var txtOffset = dot.node().getBBox();

		// title tooltip 처리
		var titleRect = metricGrp.append("rect")
								.attr("x", txtOffset.x)
								.attr("y", txtOffset.y)
								.attr("width", txtOffset.width)
								.attr("height", txtOffset.height)
								.attr("fill", "transparent");

		var title = titleRect.append("title")
							.text($data.attr("text"));

		if(sc.config.useGradient) {
			dot.attr("fill", "url(#linear_" + sc.id + "_" + $data.attr("signal") + ")");
		} else {
			dot.attr("fill", sc.signals[$data.attr("signal")]);
		}
		dot.attr("style", "stroke:" + sc.signals[$data.attr("signal")]);

		// 가운데 정렬
		metricGrp.attr("transform", "translate(" + [parseInt((SvgChart.BOX_WIDTH - metricGrp.node().getBBox().width)/2, 10), 0]+ ")");

		if(sc.config.mode == "VIEW") {
			var url = $data.attr("url");
			if(!isEmpty(url)) {
				if(url.indexOf("javascript:") == 0) {
					url = url.substring("javascript:".length);
					var f = new Function(url);
					titleRect.on("click", f);
					dot.on("click", f);
				} else if(url.indexOf("http://") == 0 || url.indexOf("https://") == 0) {
					titleRect.on("click", function() {
						document.location.href = url;
					});
					dot.on("click", function() {
						document.location.href = url;
					});
				}
			}
		}
	},
	// 박스 변경
	"changeBox" : function(kind) {
		var sc = this;
		var idx = sc.selectedObjIdx;

		if(idx == null) return;
		if(sc.dataList[idx].type != "box") return;

		var boxGrp = d3.select("#" + sc.id + " .boxGrp" + idx);
		var box, oldBox;
		var x = SvgChart.BOX_WIDTH/2;

		var oldBoxType = sc.dataList[idx].kind == "Symbol1" ? "ellipse" : "rect";
		var newBoxType = kind == "Symbol1" ? "ellipse" : "rect";
		sc.dataList[idx].kind = kind;

		oldBox = boxGrp.select(oldBoxType);
		box = boxGrp.insert(newBoxType, oldBoxType)
					.attr("class", "box")
					.attr("type", "box")
					.attr("idx", idx);

		switch(kind) {
			case "Symbol1":	// 타원
				box.attr("cx", SvgChart.BOX_WIDTH/2)
					.attr("cy", SvgChart.BOX_HEIGHT/2)
					.attr("rx", SvgChart.BOX_WIDTH/2)
					.attr("ry", SvgChart.BOX_HEIGHT/2)
					;
				break;
			case "Symbol4":	// 투명박스
				box.attr("width", SvgChart.BOX_WIDTH)
					.attr("height", SvgChart.BOX_HEIGHT)
					.attr("fill", "transparent")
					;
				break;
			case "Symbol3":	// 원형박스
				box.attr("width", SvgChart.BOX_WIDTH)
					.attr("height", SvgChart.BOX_HEIGHT)
					.attr("rx", SvgChart.BOX_WIDTH/3)
					.attr("ry", SvgChart.BOX_HEIGHT/2)
					;
				break;
			case "Symbol2":	// 라운딩박스
				box.attr("width", SvgChart.BOX_WIDTH)
					.attr("height", SvgChart.BOX_HEIGHT)
					.attr("rx", 5)
					.attr("ry", 5)
					;
				break;
		}

		if(box.attr("fill") == null) {
			if(sc.config.useGradient) {
				box.attr("fill", "url(#linear_" + sc.id + "_" + sc.dataList[idx].signal + ")");
			} else {
				box.attr("fill", sc.signals[sc.dataList[idx].signal]);
			}
		}
		if(sc.config.useShadow) {
			box.attr("filter", "url(#shadow_" + sc.id + ")");
		}

		oldBox.remove();

		boxGrp.selectAll("tspan").attr("x", x);
	},

	// 수평선 추가
	"addHLine" : function() {
		var sc = this;
		var idx = sc.idx;
		sc.deselectAll();
		sc.dataList[idx] = {
								"isNew"	:	true,
								"idx"	:	idx,
								"type"	:	"hLine",
								"value"	:	"",
								"points" :	[
												{"x" : 0, "y" : sc.config["height"]/2},
												{"x" : sc.config["width"], "y" : sc.config["height"]/2}
											]
							};

		sc.makeHLine(idx);
		sc.idx++;
	},
	// 수평선 생성
	"makeHLine" : function(idx) {
		var sc = this;
		var hLineGrp = d3.select("#" + sc.id + " .hLineLayer").append("g")
						.attr("idx", idx)
						.attr("class", "hLineGrp hLineGrp" + idx)
						;
		hLineGrp.append("path")
					.attr("class", "hLineBorder hideHLineBorder hLineBorder" + idx)
					.attr("d", sc.lineFunction(sc.dataList[idx].points));
		hLineGrp.append("path")
					.attr("class", "hLine hLine" + idx)
					.attr("d", sc.lineFunction(sc.dataList[idx].points));
		if(sc.config.mode == "EDIT") {
			hLineGrp.call(
						d3.drag()
							.on("start", function() {sc.clickHLine(idx)})
							.on("drag", function() {sc.dragHLine(idx);})
						).classed("cursorVMove", true);
		}
	},
	// 수평선 클릭
	"clickHLine" : function(idx) {
		var sc = this;
		sc.deselectAll();
		sc.selectedObjIdx = idx;
		d3.select("#" + sc.id + " .hLineBorder"+idx).classed("hLineBorderClicked", true);
	},
	// 수평선 이동
	"dragHLine" : function(idx) {
		var sc = this;
		$(sc.dataList[idx].points).each(function(i, d) {
			d.y = d3.event.y;
		});
		d3.select("#" + sc.id + " .hLine"+idx).attr("d", sc.lineFunction(sc.dataList[idx].points));
		d3.select("#" + sc.id + " .hLineBorder"+idx).attr("d", sc.lineFunction(sc.dataList[idx].points));
	},
	// 수평선 삭제
	"removeHLine" : function() {
		var sc = this;
		var dataList = sc.dataList;
		var selectedObjIdx = sc.selectedObjIdx;
		if(selectedObjIdx != null && dataList[selectedObjIdx].type == "hLine") {
			d3.select("#" + sc.id + " .hLineGrp" + selectedObjIdx).remove();
			delete dataList[selectedObjIdx];
			sc.deselectAll();
		}
	},

	// 화살표 초기화
	"resetArrows" : function() {
		var sc = this;
		for(var i in sc.dataList) {
			var d = sc.dataList[i];
			if(d.type == "arrow") {
				if(d.isNew) {
					d3.select("#" + sc.id + " .arrowGrp" + d.idx).remove();
					delete sc.dataList[i];
				} else {
					// 좌표 초기화
					for(var j=0, jLen=d.points.length; j<jLen; j++) {
						d.points[j].x = d.initPoints[j].x;
						d.points[j].y = d.initPoints[j].y;
					}
					d3.select("#" + sc.id + " .arrowGrp" + i)
						.attr("transform", function(d){return "translate(" + [0, 0] + ")"});
					d3.select("#" + sc.id + " .arrow" + i)
						.attr("d", sc.arrowFunction(d.points));
					d3.select("#" + sc.id + " .arrowBorder" + i)
						.attr("d", sc.arrowFunction(d.points));
					d3.select("#" + sc.id + " .handleLine" + i)
						.attr("d", sc.lineFunction(d.points));
					d3.select("#" + sc.id + " .handleGrp" + i)
						.selectAll("circle")
						.data(d.points)
						.attr("cx", function(d) {return d.x})
						.attr("cy", function(d) {return d.y})
				}
			}
		}

		//dataList
		d3.select("#" + sc.id).selectAll(".removedArrow").classed("removedArrow", false);
		sc.deleteArrows = [];
		sc.hideArrows(false);
	},
	// 화살표 보임/숨김
	"hideArrows" : function(flag) {
		var sc = this;
		sc.deselectAll();
		if(flag != undefined) {
			sc.allArrowsHide = !flag;
		}
		if(sc.allArrowsHide) {
			d3.select("#" + sc.id).selectAll(".arrowGrp").classed("hideArrow", false);
			$("#" + sc.id + " .scBtnHideArrows").text(getMessage("button.arrowHide"));
			sc.allArrowsHide = false;
		} else {
			d3.select("#" + sc.id).selectAll(".arrowGrp").classed("hideArrow", true);
			$("#" + sc.id + " .scBtnHideArrows").text(getMessage("button.arrowShow"));
			sc.allArrowsHide = true;
		}
	},
	// 화살표 추가
	"addArrow" : function() {
		var sc = this;
		var idx = sc.idx;
		sc.deselectAll();
		sc.dataList[idx] = {
								"isNew"	:	true,
								"idx"	:	idx,
								"type"	:	"arrow",
								"value"	:	"",
								"points" :	$.extend(true, [], sc.config.arrowInitPoints),
								"initPoints" :	$.extend(true, [], sc.config.arrowInitPoints)
							};
		sc.makeArrow(idx);
		sc.idx++;
	},
	// 화살표 생성
	"makeArrow" : function(idx) {
		var sc = this;
		var arrowGrp = d3.select("#" + sc.id + " .svgChart").append("g")
						.attr("idx", idx)
						.attr("class", "arrowGrp arrowGrp" + idx)
						.attr("transform", function(d){return "translate(" + [0, 0] + ")"});
		arrowGrp.append("path")
				.attr("d", sc.arrowFunction(sc.dataList[idx].points))
				.attr("class", "arrowBorder arrowBorder" + idx);

		arrowGrp.append("path")
			.attr("d", sc.arrowFunction(sc.dataList[idx].points))
			.attr("class", "arrow arrow" + idx)
			.attr("type", "arrow")
			.attr("idx", idx)
			.style("marker-start", "url(#scArrowHead)");

		// 브라우저에 따라 marker가 클릭이 되지 않는 경우가 있어서 마커 위치에 클릭용 원을 추가
		arrowGrp.append("circle")
				.attr("class", (sc.config.mode == "EDIT" ? "hiddenClickPoint hiddenClickPoint" + idx : ""))
				.attr("cx", sc.dataList[idx].points[0].x)
				.attr("cy", sc.dataList[idx].points[0].y)
				.attr("fill", "transparent")
				.attr("r", 5);

		var handleGrp = arrowGrp.append("g")
								.attr("class", "handleGrp handleGrp" + idx);
		handleGrp.append("path")
					.attr("class", "handleLine handleLine" + idx)
					.attr("d", sc.lineFunction(sc.dataList[idx].points));
		handleGrp.selectAll("circle")
					.data(sc.dataList[idx].points).enter().append("circle")
					.each(function(d, i) {
						if(i == 0) {
							d.class = "firstHandle handle";
						} else if(i == sc.dataList[idx].points.length-1) {
							d.class = "lastHandle handle";
						} else {
							d.class = "handle";
						}
						d.idx = i;
					})
					.attr("cx", function(d) {return d.x})
					.attr("cy", function(d) {return d.y})
					.attr("r", 5)
					.attr("type", "handle")
					.attr("class", function(d) {return d.class});

		if(sc.config.mode == "EDIT") {
			arrowGrp.call(
						d3.drag()
							.on("start", function() {sc.clickArrow(this)})
							.on("drag", function() {sc.dragArrow(this);})
						).classed("cursorMove", true);

			handleGrp.selectAll("circle")
						.call(d3.drag().on("drag", function() {
								sc.dragArrowPoint(this);
							}))
						;
		}
	},
	// 화살표 삭제
	"removeArrow" : function() {
		var sc = this;
		var dataList = sc.dataList;
		var selectedObjIdx = sc.selectedObjIdx;
		if(selectedObjIdx != null && dataList[selectedObjIdx].type == "arrow") {
			// 신규 추가는 바로 삭제
			if(dataList[selectedObjIdx].isNew) {
				d3.select("#" + sc.id + " .arrowGrp" + selectedObjIdx).remove();
				delete dataList[selectedObjIdx];
			} else {
				// 기존 화살표는 초기화시 복구를 위해 숨김 처리
				var arrowGrp = d3.select("#" + sc.id + " .arrowGrp" + selectedObjIdx).classed("removedArrow", true);
				sc.deleteArrows.push(dataList[selectedObjIdx].value);
			}
			sc.deselectAll();
		}
	},
	// 화살표 지점 이동
	"dragArrowPoint" : function(obj) {
		var d = d3.select(obj).data()[0];
		var sc = this;
		var idx = sc.selectedObjIdx;
		d.x = d3.event.x;
		d.y = d3.event.y;
		d3.select("#" + sc.id + " .arrow"+idx).attr("d", sc.arrowFunction(sc.dataList[idx].points));
		/*	특정 IE에서 화살표 곡선이 반영되지 않는 문제가 있을 경우 이 주석을 풀고 사용할 것
		d3.select("#" + sc.id + " .arrow"+idx).style("marker-start", null);
		setTimeout(function() {
			d3.select("#" + sc.id + " .arrow"+idx).style("marker-start", "url(#scArrowHead)");
		}, 1);
		*/
		d3.select("#" + sc.id + " .arrowBorder"+idx).attr("d", sc.arrowFunction(sc.dataList[idx].points));
		d3.select("#" + sc.id + " .handleLine"+idx).attr("d", sc.lineFunction(sc.dataList[idx].points));
		d3.select(obj).attr("cx", d.x).attr("cy", d.y);
		d3.select("#" + sc.id + " .hiddenClickPoint"+idx)
			.attr("cx", sc.dataList[idx].points[0].x)
			.attr("cy", sc.dataList[idx].points[0].y);
	},
	// 화살표 클릭
	"clickArrow" : function(obj) {
		var arrowGrp = d3.select(obj);
		var sc = this;
		sc.deselectAll();
		var idx = arrowGrp.attr("idx");
		sc.selectedObjIdx = idx;
		sc.showHandle(idx);

		try {
			var t = $.trim(d3.select(obj).attr("transform").replace(/(translate\(|\))/gi, ""));

			if(t.indexOf(",") > -1) {
				t = t.split(",");
			} else {
				t = t.split(" ");
			}
			if(t.length == 1) {
				t[1] = 0;
			}
			sc.clickedPosCorrection = {
										"x":parseFloat(t[0], 10) - d3.event.x,
										"y":parseFloat(t[1], 10) - d3.event.y
									};
		} catch(e) {
			sc.clickedPosCorrection = {"x":0, "y":0};
		}
	},
	// 화살표 이동
	"dragArrow" : function(obj) {
		var sc = this;
		var x = d3.event.x + sc.clickedPosCorrection.x;
		var y = d3.event.y + sc.clickedPosCorrection.y;
		d3.select(obj)
			.attr("transform", "translate(" + [x, y] + ")");
		sc.dataList[sc.selectedObjIdx].x = x;
		sc.dataList[sc.selectedObjIdx].y = y;
	},
	// 화살표 핸들 표시
	"showHandle" : function(idx) {
		var sc = this;
		$("#" + sc.id + " .handleGrp"+idx).show();
	},
	// 선택 해제
	"deselectAll" : function() {
		var sc = this;
		$("#" + sc.id + " g.handleGrp").hide();
		d3.selectAll("#" + sc.id + " .boxGrpClicked").classed("boxGrpClicked", false);
		d3.selectAll("#" + sc.id + " .hLineBorder").classed("hLineBorderClicked", false);

		sc.selectedObjIdx = null;
		sc.clickedPosCorrection = {"x":0, "y":0};
	},
	"saveChart" : function(paramData) {
		var sc = this;
		if(typeof paramData == "undefined" || paramData == null) paramData = {"_csrf" : getCsrf()};
		var dataList = sc.dataList;
		var line = [];
		var strategy = [];

		var data;
		var arrowCnt = 0;
		for(var i in dataList) {
			data = dataList[i];
			if(data.type == "box") {
				strategy.push(
								"index:" + data.index
								+ ",kind:" + data.kind
								+ ",x:" + data.x
								+ ",y:" + data.y
							);
			} else if(data.type == "perspective") {
					strategy.push(
							"index:" + data.index
							+ ",kind:" + data.type
							+ ",x:" + data.x
							+ ",y:" + data.y
					);
			} else if(data.type == "arrow" && $.inArray(data.value, sc.deleteArrows) == -1) {
				var grpX = 0, grpY = 0;
				try {
					var t = $.trim(d3.select("#" + sc.id + " .arrowGrp" + data.idx).attr("transform").replace(/(translate\(|\))/gi, ""));

					if(t.indexOf(",") > -1) {
						t = t.split(",");
					} else {
						t = t.split(" ");
					}
					if(t.length == 1) {
						t[1] = 0;
					}
					grpX = parseFloat(t[0], 10);
					grpY = parseFloat(t[1], 10);
				} catch(e) {
					console.log(e.message);
				}

				line.push(
							"index:" + "C_st_" + (++arrowCnt)
								+ ",kind:" + data.type
								+ ",px1:" + (parseFloat(data.points[3].x, 10) + grpX)
								+ ",py1:" + (parseFloat(data.points[3].y, 10) + grpY)
								+ ",px2:" + (parseFloat(data.points[0].x, 10) + grpX)
								+ ",py2:" + (parseFloat(data.points[0].y, 10) + grpY)
								+ ",cx1:" + (parseFloat(data.points[2].x, 10) + grpX)
								+ ",cy1:" + (parseFloat(data.points[2].y, 10) + grpY)
								+ ",cx2:" + (parseFloat(data.points[1].x, 10) + grpX)
								+ ",cy2:" + (parseFloat(data.points[1].y, 10) + grpY)
							);
			} else if(data.type == "hLine") {
				line.push(
						"index:" + "C_st_" + (++arrowCnt)
						+ ",kind:" + data.type
						+ ",px1:" + parseInt(data.points[0].x, 10)
						+ ",py1:" + parseInt(data.points[0].y, 10)
						+ ",px2:" + parseInt(data.points[1].x, 10)
						+ ",py2:" + parseInt(data.points[1].y, 10)
				);
			}
		}
		line = line.join("/");
		strategy = strategy.join("/");

		paramData["line"] = line;
		paramData["strategy"] = strategy;
		paramData["showMetricYn"] = $("#chkbox_" + sc.id).prop("checked") ? "Y" : "N";

		$.ajax({
			url : sc.config.saveUrl,
			method :"POST",
			data : paramData,
			dataType : "json"
		})
			.done(function(data, textStatus, jqXHR) {
				$.showMsgBox(data.msg);
				if(data.result == AJAX_SUCCESS) {
					sc.init();
				}
			})
			.fail(function(jqXHR, textStatus, errorThrown) {
				$.showMsgBox(getMessage("errors.processing"));
			});
	},
	/*
	 * IE 호환을 위해 marker용 svg 생성
	 */
	"makeMarker" : function() {
		var svg = this.makeSVG("svg", {"width":"0", "height":"0"});
		var defs = this.makeSVG("defs", {});
		var marker = this.makeSVG("marker", {"id":"scArrowHead","viewBox":"0 0 10 10","refX":"10","refY":"5","markerUnits":"userSpaceOnUse","markerWidth":"8","markerHeight":"8","orient":"auto","class":"arrowHead"});
		var path = this.makeSVG("path", {"d":"M 10 0 L 0 5 L 10 10 z"});
		$(".contents").append(svg);
		$(svg).addClass("block");
		svg.appendChild(defs);
		defs.appendChild(marker);
		marker.appendChild(path);
	},
	"makeSVG" : function(tag, attrs) {
		var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
		for (var k in attrs) {
			el.setAttribute(k, attrs[k]);
		}
		return el;
	},
	"getDefs" : function() {
		var sc = this;
		var svg = d3.select("#" + sc.id + " .svgChart");
		var defs;
		if($("#" + sc.id + " defs").length == 0) {
			defs = svg.append("defs");
		} else {
			defs = d3.select("#" + sc.id + " defs");
		}
		return defs;
	},
	// 그림자 정의
	"addShadow" : function() {
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
	},
	// 그라데이션 정의
	"addGradient" : function(id) {
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
	},
	"showMetric" : function() {
		var sc = this;
		if($("#chkbox_" + sc.id).is(":checked")) {
			d3.selectAll("#" + sc.id + " .metricGrp1").attr("visibility", null);
			d3.selectAll("#" + sc.id + " .metricGrp2").attr("visibility", "hidden");
		} else {
			d3.selectAll("#" + sc.id + " .metricGrp1").attr("visibility", "hidden");
			d3.selectAll("#" + sc.id + " .metricGrp2").attr("visibility", null);
		}
	}
}

SvgChart.prototype.arrowFunction = d3.line()
							.x(function(d) {return d.x;})
							.y(function(d) {return d.y;})
							.curve(d3.curveBasis);
SvgChart.prototype.lineFunction = d3.line()
							.x(function(d) {return d.x;})
							.y(function(d) {return d.y;});
