
/******************************************
 * 엘리먼트 이동시 애니메이트 효과(https://stackoverflow.com/questions/9893134/appendto-animation)
 * appendTo : append구분(appendTo, prependTo, insertBefore, insertAfter)
 * destination : appendTo할 object
 * duration : 움직임이 발생할 시간
 * easing : 움직임에 변화를 줄 수 있는 함수
 * easing : complete 움직임이 멈춘 후 실행될 함수
 ******************************************/
$.fn.animateTo = function(appendTo, destination, duration, easing, complete) {
	  if(appendTo !== 'appendTo'     &&
	     appendTo !== 'prependTo'    &&
	     appendTo !== 'insertBefore' &&
	     appendTo !== 'insertAfter') return this;
	  var target = this.clone(true).css('visibility','hidden')[appendTo](destination);
	  this.css({
	    'position' : 'relative',
	    'top'      : '0px',
	    'left'     : '0px'
	  }).animate({
	    'top'  : (target.offset().top - this.offset().top)+'px',
	    'left' : (target.offset().left - this.offset().left)+'px'
	  }, duration, easing, function() {
	    target.replaceWith($(this));
	    $(this).css({
	      //'position' : 'static',
	      'top'      : '',
	      'left'     : ''
	    });
	    if($.isFunction(complete)) complete.call(this);
	  });
}
/*
$.fn.unfold = function(axis){
	if('y'==axis)
	{
		var autoHeight = $(this).css('height');
		$(this).height(0).animate({height: autoHeight}, 100);
	}
	else if('x'==axis)
	{
		var autoWidth = $(this).css('width');
		$(this).width(0).animate({width: autoWidth}, 100);
	}

	return $(this);
}
*/

if (typeof Object.assign != 'function') {
	// Must be writable: true, enumerable: false, configurable: true
	Object.defineProperty(Object, "assign", {
		value : function assign(target, varArgs) { // .length of function is 2
			'use strict';
			if (target == null) { // TypeError if undefined or null
				throw new TypeError(
						'Cannot convert undefined or null to object');
			}

			var to = Object(target);

			for (var index = 1; index < arguments.length; index++) {
				var nextSource = arguments[index];

				if (nextSource != null) { // Skip over if undefined or null
					for ( var nextKey in nextSource) {
						// Avoid bugs when hasOwnProperty is shadowed
						if (Object.prototype.hasOwnProperty.call(nextSource,
								nextKey)) {
							to[nextKey] = nextSource[nextKey];
						}
					}
				}
			}
			return to;
		},
		writable : true,
		configurable : true
	});
}

var sortableRow = function(params){
	 $("#"+params.id).sortable({
 		grid: [ 10, 10 ],
 		forcePlaceholderSize: true,
 		helper:function(e, ui) {
 			var sum = 0;
 			var px = [];
 		    var per = [];
 			ui.children().each(function(index,item) {
 				var innerWidth = 0;
			   	 	sum+=$(this).innerWidth();
			   	 	if($(this).is(':visible') == true){
			   	 		$(this).css({"width":$(this).innerWidth()+"px"});
			   	 	}
			   		per[index] = $(this).width();
			  	});

			  return ui;
		},
		update : function(){
			if(isNotEmpty(params.callback)){
				params.callback();
			}
		}
 	}).disableSelection();
}

var serializeObj = function(id) {
	//console.log('===========serializeObj===========');
	var arr = new Array();
	$('#' + id).find(':input,:hidden').each(function() {
		var name = $(this).attr('name');
		var val = $(this).val();
		if (isNotEmpty(name)) {
			arr.push(name + '=' + val);
			//console.log(name + '=' + val);
		}
	});

	if($('#' + id).find('[name=_csrf]').size()==0)
	{
		arr.push('_csrf=' + getCsrf());
	}
	//console.log('===========serializeObj===========');
	return arr.join('&');
}

/*
 $.fn.serializeObject = function() {
 var o = {};
 var a = this.serializeArray();
 $.each(a, function() {
 if (o[this.name]) {
 if (!o[this.name].push) {
 o[this.name] = [o[this.name]];
 }
 o[this.name].push(this.value || '');
 } else {
 o[this.name] = this.value || '';

 console.log('this.name : ' + this.name + ', this.value : ' + this.value);
 }
 });
 return o;
 };*/

Vue.use(VTooltip)


//--------------------VUE 인스턴스 공통 --------------------//
var profileImgMap = [];
var commonMixin = {
	data : function(){
		return{
			escapeHTMLMap :  {
				"&": "&amp;",
				"<" : "&lt;",
				">" : "&gt;",
				'"' : "&quot;",
				"'" : "&#39;",
				"&amp;#160;" : ""
			},
			nonEscapeHTMLMap :  {
				"&amp;" : "&",
				"&lt;"  : "<",
				"&gt;"  : ">",
				"&quot;": '"',
				"&#39;" : "'",
				"&apos;": "'"
			},
			searchUser : {
	    		visible : false,
	    		callback : ''
	    	},
	    	searchUserParam : {
	    		visible : false,
				callback : ""
			},
			beliefUser1 : {
	    		visible : false,
				callback : ""
			},
			beliefUser2 : {
	    		visible : false,
				callback : ""
			},
	    	searchKpiParam : {
	    		visible : false,
				callback : ""
			},
			searchDeptParam : {
	    		visible : false,
	    		callback : '',
	    		value:''
	    	},
			searchScDeptParam : {
	    		visible : false,
	    		callback : '',
	    		value:''
	    	},
			searchScDeptMultiParam : {
	    		visible : false,
	    		callback : '',
	    		value:''
	    	},
	    	searchDeptInsa : {
	    	    visible : false,
	    	    callback : '',
	    	    value : '',
	    	    orgData : ""
	    	},
	    	searchScDept : {
	    	    visible : false,
	    	    callback : '',
	    	    value : '',
	    	    orgData : ''
	    	},
	    	insaEvalEnd : false,
	    	loadComplete : false,
		}
	},
	mounted : function(){
		this.$nextTick(function(){
			$(this.$refs.editForm).find('.datepicker').datepicker();
		});
	},
	computed : {
        isIE : function(){
        	var ua = window.navigator.userAgent;
        	return /MSIE|Trident/.test(ua);
        },
        numberComma : function (val) {
            return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
	},
	methods : {
		/*v-on:input 에서 사용*/
        numeric : function (val) {
            return val.toString().replace(/(^-?)\d+(.?\d*)/g, ",");
        },
        addComma : function (val) {
            if(isEmpty(val)) return "";
            let arr = val.toString().split(".");
            arr[0] = arr[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            return arr.join(".");
        },
		codeOptions : function(codeListStr){
		    var options = [];
            if(isNotEmpty(codeListStr))
            {
                $.each(codeListStr.split(';'), function(i, el){
                    var code = el.split(':');
                    options.push({id : code[0], text : code[1] });
                });
            }
            return options;
		},
		splitJoin : function(theText){
	      	return theText.split(',');
      	},
      	/*
		isEmpty: function(yourObject){
			return Object.keys(yourObject).length === 0
		},
		*/

		isNotEmpty : function(val) {
            return (typeof val != "undefined" && val != null && $.trim(val) != "");
        },

		makeBr : function(content){
			return content.replace(/(?:\r\n|\r|\n)/g, '<br />').split('\n').join('<br />');
		},

		openSearchUser: function(selectedList) {
			var self=this;
			self.$refs.searchUser.open(selectedList);
			self.searchUser.callback=$(event.target).data('callback');
		},
		openSearchUserSingle: function() {
			var self=this;
			self.$refs.searchUserSingle.open();
			self.searchUserParam.callback=$(event.target).data('callback');
		},
		openSearchKpi: function() {
			var self=this;
			self.$refs.searchKpi.open();
			self.searchKpiParam.callback=$(event.target).data('callback');
		},
		openSearchDept: function(value,seq, insayn, List) {
			var self=this;
			self.$refs.searchDept.open(self.searchDeptParam.value=$(event.target).data('target'),seq, insayn, value, List);
			self.searchDeptParam.callback=$(event.target).data('callback');
			self.searchDeptParam.value=$(event.target).data('target');
		},
		openSearchScDept: function(value, seq, List) {
			var self=this;
			self.$refs.searchScDept.open(self.searchScDeptParam.value=$(event.target).data('target'), seq, value, List);
			self.searchScDeptParam.callback=$(event.target).data('callback');
			self.searchScDeptParam.value=$(event.target).data('target');
		},
		openSearchScDeptMulti: function(value, seq, List) {
			var self=this;
			self.$refs.searchScDeptMulti.open(value, List);
			self.searchScDeptMultiParam.callback=$(event.target).data('callback');
			self.searchScDeptMultiParam.value=$(event.target).data('target');
		},
		openDeptInsa : function(values, year) {
		    var self=this;
            self.$refs.searchDeptInsa.open(self.searchDeptInsa.value=$(event.target).data('target'), values, year);
            self.searchDeptInsa.orgData = $(event.target).data('list');
            self.searchDeptInsa.callback=$(event.target).data('callback');
            self.searchDeptInsa.value=$(event.target).data('target');
		},
		openUpDeptInsa : function(value, seq, List) {
            var self=this;
            self.$refs.searchScDept.open(self.searchScDept.value=$(event.target).data('target'),seq, value, List);
            self.searchScDept.orgData = $(event.target).data('list');
            self.searchScDept.callback=$(event.target).data('callback');
            self.searchScDept.value=$(event.target).data('target');
        },
        unformatDatepicker : function(value){
        	$(this.$refs.editForm).find('.datepicker').each(function(){
        		$(this).val(dateUnformatter($(this).val()));
        	});
        },
        updateDate : function(target, date){
            target = date;

        },
        // undefined 또는 null 여부
		isEmpty : function(val) {
			return (typeof val == "undefined" || val == null || $.trim(val) == "");
		},
		getQueryString : function(obj){
			var params = "";
			var idx = 0;
			if(isEmpty(obj)){
				return null;
			}else if(typeof obj == 'object' ){
				for(key in obj){
					params += (idx==0?"":"&")+key+"="+obj[key];
					idx++;
				}
			}
			return params;
		},
		contains : function(obj,checkVal){
			if(obj == '' || obj == null || obj == undefined){
				return false;
			}else if(typeof obj == "object"){
				return obj.includes(checkVal);
			}else if(typeof obj == "string"){
				return obj == checkVal;
			}else if(typeof obj == "number"){
				return Number(obj) == Number(checkVal);
			}else{
				return false;
			}
		},
        numeral : function(){
            this.$nextTick(function(){
                $('.input-numeral').each(function(){
                    new Cleave(this, {
                        numeral: true,
                        numeralThousandsGroupStyle: 'thousand',
                        numeralIntegerScale: 15,    // 숫자 자리수 제한
                        numeralDecimalScale: 5   // 소수점 자리수 제한
                    });
                });
            });
        },
		escapeHTML : function(s) {
			var _self = this;
			s = s.toString();
			for(var k in _self.escapeHTMLMap) {
				s = s.replaceAll(k, this.escapeHTMLMap[k]);
			}
			return s;
		},
		escapeHTMLObject : function(o) {
			var _self = this;
			if(typeof o == "object") {
				for(var k in o){
					o[k] = _self.escapeHTML(o[k]);
				}
			}
			return o;
		},
		nonEscapeHTML : function(s) {
			var _self = this;
            if(Array.isArray(s)){

                for(var idx in s){
                    val = s[idx].toString();
                    for(var k in _self.nonEscapeHTMLMap) {
                        s[idx] = val.replaceAll(k, this.nonEscapeHTMLMap[k]);
                    }
                }
                return s;

            }else{
                s = s.toString();
                for(var k in _self.nonEscapeHTMLMap) {
                    s = s.replaceAll(k, this.nonEscapeHTMLMap[k]);
                }
                return s;
            }
		},
		nonEscapeHTMLObject : function(o) {
			var _self = this;
			if(typeof o == "object") {
				for(var k in o){
					o[k] = _self.nonEscapeHTML(o[k]);
				}
			}
			return o;
		},
		nonEscapeHTMLArrayByObject : function(a) {
			var _self = this;
			if(typeof a == "object") {
			    for(var k in a){
                    a[k] = _self.nonEscapeHTMLObject(a[k]);
                }
			}
			return a;
		},
        overMask : function(){
            $(".mask").show();
        },
        removeMask : function(){
            $(".mask").hide();
        },
		toggleMask : function(_id) {
		    if($("#"+_id).find("div.maskInner").size() === 0)
		    {
		       $("#"+_id).append("<div class='maskInner'></div>");
		    }

		    if($("#"+_id).find("div.maskInner").is(":visible"))
		    {
		       $("#"+_id).find("div.maskInner").hide();
		    }
		    else
		    {
		       $("#"+_id).find("div.maskInner").show();
		    }
		},
		toggleMaskItem : function(_this) {
		    if($(_this).find("div.maskInnerItem").size() === 0)
		    {
		       $(_this).append("<div class='maskInnerItem'></div>");
		    }

		    if($(_this).find("div.maskInnerItem").is(":visible"))
		    {
		       $(_this).find("div.maskInnerItem").hide();
		    }
		    else
		    {
		       $(_this).find("div.maskInnerItem").show();
		    }
		},
		wheelScroll : function(obj){
		    this.$nextTick(function(){
		        $(obj).mousewheel(function(event, delta) {
		            if(Object.is($(obj).get(0), $(event.target).get(0)))
		            {
                        this.scrollLeft -= (delta * 50);
                        event.preventDefault();
		            }
                });
            });
		},
    	loadProfileImg : function(userId){
    	    var self = this;
    	    var params = new URLSearchParams();
    	    params.append('userId', userId);
            axios({
                 method: 'post',
                 url : contextPath + "/common/profileImg.do",
                 data : params
            }).then(function (response) {
                $.each(response.data.profileImgMap, function(userId, src){
                    profileImgMap[userId] = src;
                });
            });
    	},
    	getProfileImg : function(userId){
    	    var self = this;
    	    return nvl(profileImgMap[userId], contextPath + '/images/new_img/img-member.png');
    	},
        getFormattedMonStr : function(yyyyMM){
            if(typeof yyyyMM !== 'string' || yyyyMM.length!=6){
                return yyyyMM;
            }

            return yyyyMM.substring(0,4)+ '년 '+ yyyyMM.substring(4)+'월';
        },
        getInsaEvalEnd : function(year){
            let self = this;
            return new Promise(function(resolve, reject){
                var params = new URLSearchParams();
                params.append('findYear', year);
                axios({
                     method: 'post',
                     url : contextPath + "/common/selectInsaEvalEndYn.do",
                     data : params
                }).then(function (response) {
                    self.insaEvalEnd = response.data.insaEvalEndYn=='Y'?true:false;
                    //self.insaEvalEnd = false;
                    resolve(self.insaEvalEnd);
                });
            });
        },
        initAttach : function(config)
        {
            var self = this;

            let iframeClass = config.iframeClass;
            let atchFileId = config.atchFileId;
            let downloadOnly = config.downloadOnly;

            let maxFileCnt = config.maxFileCnt;
            let maxTotalSize = config.maxTotalSize;
            let allowFileExts = config.allowFileExts;

            var initAttachFile = $('iframe.' + iframeClass).eq(0);
            var $id = 'upload' + new Date().getTime();

            axios.get(contextPath + '/common/initAttachFile.do', {
                params:
                {
                    inputFileName : $id,
                    atchFileColumnName : 'atchFileId',
                    atchFileId : atchFileId,
                    maxFileCnt : maxFileCnt,
                    maxTotalSize : maxTotalSize,
                    allowFileExts : allowFileExts,
                    downloadOnly : downloadOnly
                }
            }).then(function(response) {
                $(initAttachFile).attr('id', $id)
                $(initAttachFile).contents().find('body').html(response.data);
                window['initAttachFile']($id);
            });
        },
        initAttachForDiv : function(config)
        {
            var self = this;

            let wrapper = config.wrapper;
            let atchFileId = config.atchFileId;
            let downloadOnly = config.downloadOnly;

            let maxFileCnt = config.maxFileCnt;
            let maxTotalSize = config.maxTotalSize;
            let allowFileExts = config.allowFileExts;

            var initAttachFile = wrapper;
            var $id = 'upload' + new Date().getTime();

            axios.get(contextPath + '/common/initAttachFile.do', {
                params:
                {
                    inputFileName : $id,
                    atchFileColumnName : 'atchFileId',
                    atchFileId : atchFileId,
                    maxFileCnt : maxFileCnt,
                    maxTotalSize : maxTotalSize,
                    allowFileExts : allowFileExts,
                    downloadOnly : downloadOnly
                }
            }).then(function(response) {
                $(initAttachFile).html(response.data);
                self.$nextTick(function(){
                    window['initAttachFile']($id);
                });
            });
        },
        movepage: function(params, pageNumber)
        {
			var self = this;
			if(isEmpty(params))
			{
				self.params = params
				self.nowPage = pageNumber
				self.getList();
			}
			else{
				self.modules[params].params=params;
				self.modules[params].nowPage=pageNumber;
				self[params]().getList();
			}

        },
		//페이지 번호 목록 나열
		page : function(totalCount, moduleId, vmId) { // 페이징

			if(totalCount==0)
			{
				//return false;
				totalCount=1;
			}

			var self = isEmpty(moduleId) ? this : this.modules[moduleId];
			/*var self = isNotEmpty(this.pageRecordCount) ? this : this.modules[moduleId];*/
			/*var self = this;*/

			if (self.nowPage == 0)
				self.nowPage = 1
			//var totalPage = Math.ceil(totalCount / self.pageRecordCount + ((totalCount % self.pageRecordCount) > 0 ? 1 : 0));
			var totalPage = Math.ceil(totalCount % self.pageRecordCount > 0)? (totalCount/self.pageRecordCount)+1 : (totalCount/self.pageRecordCount);

			if (self.nowPage > totalPage) {
				self.nowPage = totalPage;
			}
			var startRownum = (self.nowPage - 1)
					* self.pageRecordCount + 1
			var endRownum = self.nowPage
					* self.pageRecordCount
			var groupNo = Math.floor(self.nowPage
					/ self.pageCount
					+ (self.nowPage
							% self.pageCount > 0 ? 1 : 0))
			var endPage = groupNo * self.pageCount


			var startPage = endPage - (self.pageCount - 1)
			if (endPage > totalPage) {
				endPage = totalPage
			}
			var prevPage = startPage - self.pageCount
			var nextPage = startPage + self.pageCount
			if (prevPage < 1) {
				prevPage = 1
			}
			if (nextPage > totalPage) {
				nextPage = totalPage
			}

			//alert('moduleId : ' + moduleId + ', totalCount : '+ totalCount +', endPage : ' + endPage);

			self.paging = ""
			if (nextPage <= 11) {
				self.paging = "<li class='page-item'><a class='page-link' disabled></a></li>"

			} else {
				if(isEmpty(vmId)){
					self.paging = "<li class='page-item'><a class='page-link' href=\"javascript:movepage('"
						+ self.params
						+ "', "
						+ (startPage - self.pageCount)
						+ ")\" aria-label='Previous'><span aria-hidden='true'></span></a></li>"
				}else{
					self.paging = "<li class='page-item'><a class='page-link' href=\"javascript:"+vmId+".movepage('"
						+ self.params
						+ "', "
						+ (startPage - self.pageCount)
						+ ")\" aria-label='Previous'><span aria-hidden='true'></span></a></li>"
				}

			}

			self.endPage = endPage-1;

			for (var i = startPage; i <= endPage; i++) {
				if (i == self.nowPage) {
					self.paging += "<li class='page-item'><a class='page-link active'>"
							+ i + "</a></li>"
				} else {
					if(isEmpty(vmId)){
						self.paging += "<li class='page-item'><a class='page-link' href=\"javascript:movepage('"
							+ self.params
							+ "', " + i + ")\">" + i + "</a></li>"
					}else{
						self.paging += "<li class='page-item'><a class='page-link' href=\"javascript:"+vmId+".movepage('"
							+ self.params
							+ "', " + i + ")\">" + i + "</a></li>"
					}
				}
			}

			if (nextPage != totalPage) {
				if(isEmpty(vmId)){
					self.paging += "<li class='page-item'><a class='page-link' href=\"javascript:movepage('"
						+ self.params
						+ "', "
						+ (startPage + self.pageCount)
						+ ")\" aria-label='Next'></a></li>"
				}else{
					self.paging += "<li class='page-item'><a class='page-link' href=\"javascript:"+vmId+".movepage('"
						+ self.params
						+ "', "
						+ (startPage + self.pageCount)
						+ ")\" aria-label='Next'></a></li>"
				}

			} else {
				self.paging += "<li class='page-item'><a class='page-link disabled'></a></li>"
			}

		}
	}
}

//--------------------VUE 인스턴스 공통 --------------------//

//--------------------VUE 그리드 콤퍼넌트 공통 --------------------//

var listComponentMixin = {
	methods : {
		clickRow : function(){
			$(event.currentTarget).find('td').css('background-color','#c9f5ff');
			$(event.currentTarget).parent().find('tr').not(':eq('+ $(event.currentTarget).index() +')').find('td').css('background-color','');

		},
		listCheckAll : function(event) {
			if ($(this.$refs.checkboxAll).prop('checked')) {
				$(this.$refs.checkboxes).prop('checked', true);
			} else {
				$(this.$refs.checkboxes).prop('checked', false);
			}
		},
		makeGridButtion : function(params/*fn*/){

			var $html = '';

			$html += '<div class="tbl-bottom">';

			$html += '<div class="tbl-btn" style="text-align:inherit;position:inherit;">';

			$html += params.button;

			$html += '</div>';

			$html += '</div>';

			return $html;

			/*if(isNotEmpty(fn))
			{
				return ''

			}*/
		}
	}
}

//--------------------VUE 그리드 콤퍼넌트 공통 --------------------//

//--------------------VUE 인스턴스 공통 --------------------//
var commonSingleMixin = {
	methods : {

		//페이지 번호 목록 나열
		page : function(totalCount) { // 페이징
			//this. -> self.
			if (this.nowPage == 0)
				this.nowPage = 1
			var totalPage = Math.ceil(totalCount / this.pageRecordCount
					+ ((totalCount % this.pageRecordCount) > 0 ? 1 : 0));

			//console.log("totalPage", totalPage);

			if (this.nowPage > totalPage) {
				this.nowPage = totalPage;
			}
			var startRownum = (this.nowPage - 1) * this.pageRecordCount + 1
			var endRownum = this.nowPage * this.pageRecordCount
			var groupNo = Math.floor(this.nowPage / this.pageCount
					+ (this.nowPage % this.pageCount > 0 ? 1 : 0))
			var endPage = groupNo * this.pageCount
			var startPage = endPage - (this.pageCount - 1)
			if (endPage > totalPage) {
				endPage = totalPage
			}
			var prevPage = startPage - this.pageCount
			var nextPage = startPage + this.pageCount
			if (prevPage < 1) {
				prevPage = 1
			}
			if (nextPage > totalPage) {
				nextPage = totalPage
			}

			this.paging = ""
			if (nextPage <= 11) {
				this.paging = "<li class='page-item'><a class='page-link' disabled></a></li>"

			} else {
				this.paging = "<li class='page-item'><a class='page-link' href=\"javascript:movepage('"
						+ this.params
						+ "', "
						+ (startPage - this.pageCount)
						+ ")\" aria-label='Previous'><span aria-hidden='true'></span></a></li>"
			}

			for (var i = startPage; i <= endPage - 1; i++) {
				if (i == this.nowPage) {
					this.paging += "<li class='page-item'><a class='page-link active'>"
							+ i + "</a></li>"
				} else {
					this.paging += "<li class='page-item'><a class='page-link' href=\"javascript:movepage('"
							+ this.params
							+ "', "
							+ i
							+ ")\">"
							+ i
							+ "</a></li>"
				}
			}

			if (nextPage != totalPage) {
				this.paging += "<li class='page-item'><a class='page-link' href=\"javascript:movepage('"
						+ this.params
						+ "', "
						+ (startPage + this.pageCount)
						+ ")\" aria-label='Next'></a></li>"
			} else {
				this.paging += "<li class='page-item'><a class='page-link disabled'></a></li>"
			}

		}
	}
}
//--------------------VUE 인스턴스 공통 --------------------//




//페이지 클릭 이벤트가 vue 안에서 안먹혀서 이쪽으로 호출 후 vue로 다시 호출
function movepage(params, pageNumber) {
	vm.movepage(params, pageNumber);
}



// 페이지 클릭 이벤트가 vue 안에서 안먹혀서 이쪽으로 호출 후 vue로 다시 호출
function moveSinglepage(params, pageNumber) {
	vm.common().movepage(params, pageNumber)
}




Vue.component('tree-item', {
	  template: '#item-template',
	  props: {
	    item: Object
	  },
	  data: function () {
	    return {
	      isOpen: false
	    }
	  },
	  mounted : function(){
		  var _self = this;
		  $(".treeUl").sortable({
			  update: function( event, ui ) {

				/*var pgmIds = [];*/
				var pgmIds = "";
				var orders = "";

				//$(ui).closest("ul").childern();

				/*console.log("$(ui)",$(this));
				console.log("$(ui).closest(ul)",$(this).closest("ul"));
				console.log("$(ui).closest(ul).childern();",$(this).closest("ul").children());*/

				$(this).closest("ul").children().each(function(item, index){
					/*pgmIds.push($(this).data("id"));*/
					pgmIds += $(this).data("id")+"\|";
					orders += $(this).data("sort")+"\|";
				});
				/*$(".treeContainer").find(".item").each(function(item, index){
					pgmIds.push($(this).data("id"));
				});*/
				/*console.log("component pgmIds!!!",pgmIds);*/
				_self.$emit('get-tree-sort-data',pgmIds,orders);
			}
		  });
	  },
	  updated : function(){
		//
		//console.log("component updated!");
	  },
	  computed: {
	    isFolder: function () {
	      return this.item.children &&
	        this.item.children.length
	    }
	  },
	  methods: {
	    toggle: function (id) {
	      if (this.isFolder) {
	    	/*if(this.isOpen){
	    		console.log($(".treeUl[data-treeUl='"+id+"']").find(".treeUl").prev().find("a").first());
	    		$(".treeUl[data-treeUl='"+id+"']").find(".foldText-for-tree").text("+");
	    		$(".treeUl[data-treeUl='"+id+"']").find(".treeUl").hide();
	    	}*/
	        this.isOpen = !this.isOpen;
	      }
	    },
	    getTreeData : function(e){
	    	this.$emit('get-tree-data',e);
	    },
	    checkColor : function(yn){
	    	return yn=='Y'?'black':'red';
	    }
	  }
	});


function validateInit(){
	$('.validation-target').each(function(){
		$(this).removeClass('validation-target');
		$(this).removeClass('validation-fail');
		$(this).removeClass('validation.' + nvl($(this).attr('name'), $(this).attr('id')));
	});
}

$.fn.validate = function(){
	$(this).addClass('validation-target validation.' + nvl($(this).attr('name'), $(this).attr('id')));
	return this;
}

function validateParams(validatorFunctionName, urlSearchParams){
	if(document.validateUrlSearchParamsForm){
		$(document.validateUrlSearchParamsForm).remove();
	}
	var $validationForm = $('<form id="validationForm" name="validateUrlSearchParamsForm"></form>');
	urlSearchParams.forEach(function(value, key) {
		$($validationForm).append('<input type="hidden" name="'+key+'" value="'+value+'" />');
	});
	$validationForm.appendTo($('.appRoot'));
	if(!window[validatorFunctionName](document.validateUrlSearchParamsForm))
	{
		$(document.validateUrlSearchParamsForm).remove();
		return false;
	}
	$(document.validateUrlSearchParamsForm).remove();
	return true;
}


function mergeParams(params1, params2){
	params2.forEach(function(value, key) {
		if(!params1.has(key))
		{
			params1.append(key, value);
		}
	});

}

$.fn.hasClassStartsWith=function(prefix){
    return $(this).is('[class^=${prefix}]');
};


function validationNotify(arr, callback){
	$.each(arr,function(i, el){
		$('.validation\\.'+el).eq(0).addClass('validation-fail');
	});
	callback();
}

$(document).ajaxError(function myErrorHandler(event, xhr, ajaxOptions, thrownError) {

    var errorObj = JSON.parse(xhr.responseText);
    if(!isEmpty(errorObj.redirectUrl)){
        window.location.href = errorObj.redirectUrl;
    }
    $.showMsgBox(getMessage("errors.processing"));
});


axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common[$("meta[name='_csrf_header']").attr("content")] = $("meta[name='_csrf']").attr("content");
axios.defaults.method = "post";

axios.interceptors.request.use(function (config) {
    // Do something before request is sent

    //console.log("config",config);

    showLoading(true);
    //debugger;

    return config;
  }, function (error) {
    // Do something with request error

    showLoading(false);
    if(!isEmpty(error.response.data.redirectUrl)){
        window.location.href = error.response.data.redirectUrl;
    }else{
        $.showMsgBox(getMessage("errors.processing"));
    }

    return Promise.reject(error);
  });

axios.interceptors.response.use(function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data

    showLoading(false);
    initSessionTime();

    if(response.data.result == AJAX_FAIL) {
        $.showMsgBox(response.data.msg);
        return Promise.reject(response.data.msg);
    }else{
        return response;
    }

  }, function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error

    showLoading(false);
    if(!isEmpty(error.response.data.redirectUrl)){
        $.showMsgBox("세션이 만료되었습니다. 로그인 화면으로 이동하세요.",function(){
            window.location.href = error.response.data.redirectUrl;
        });

    }else{
        $.showMsgBox(getMessage("errors.processing"));
    }

    return Promise.reject(error);
  });