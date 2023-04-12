
/*목표/활동 칸반목록에 대한 스크롤 이벤트*/
function resizeKanban(){
	var ctleng = $(".ct-bx.type01 .ct-scroll > ul > li").length;

	var ctwidth = 337 * ctleng;

	var ctmargin =  (ctleng+1) * 10;

	const $boardWidth = ctwidth + ctmargin;

	$(".ct-bx.type01 .ct-scroll").css("width", ctwidth + ctmargin);

	//const $popupWidth = 619;
}

function initBoard(){

	$('.contents').on('click','a[href="#"]',function(event) {
		event.preventDefault();
	});

	/*목표/활동 리스트 및 목표 문구입력 이벤트*/
	$(".contents").on("click",".ct-bx > ul > li .title-bx .title", function(e){
		$(e.target).siblings(".title-input").show();
	});

	/*$(".contents").on("click",".active-select .btn-sch-open",function(event){

		alert("click");

		if ( $(this).hasClass("active")) {
			$(this).removeClass("active");
			$(this).siblings("ul").removeClass("active");
		} else {
			$(this).addClass("active");
			$(this).siblings("ul").addClass("active");
		}
	});

	$(".contents").on("click",".active-select > ul > li button",function(){
		var this_html = $(this).html();
		//$(".active-select .btn-sch-open").html(this_html);
		$(this).closest('.active-select').find('.btn-sch-open').html(this_html);
		$(".active-select > ul, .active-select .btn-sch-open").removeClass("active");
		//$(this).closest('.active-select').find('ul, .active-select .btn-sch-open').removeClass("active");
	});*/

	/*$(".contents").on("click",".active-select-edit .btn-sch-open",function(event){
		if ( $(this).hasClass("active")) {
			$(this).removeClass("active");
			$(this).siblings("ul").removeClass("active");
		} else {
			$(this).addClass("active");
			$(this).siblings("ul").addClass("active");
		}
	});

	$(".contents").on("click",".active-select-edit > ul > li button",function(){
		var this_html = $(this).html();
		//$(".active-select .btn-sch-open").html(this_html);
		$(this).closest('.active-select-edit').find('.btn-sch-open').html(this_html);
		$(".active-select-edit > ul, .active-select-edit .btn-sch-open").removeClass("active");
		//$(this).closest('.active-select').find('ul, .active-select .btn-sch-open').removeClass("active");
	});*/

	$(".contents").on("click",".idp-active-select .btn-sch-open",function(event){
		if ( $(this).hasClass("active")) {
			$(this).removeClass("active");
			$(this).siblings("ul").removeClass("active");
		} else {
			$(this).addClass("active");
			$(this).siblings("ul").addClass("active");
		}
	});

	$(".contents").on("click",".idp-active-select > ul > li button",function(){
		var this_html = $(this).html();
		//$(".active-select .btn-sch-open").html(this_html);
		$(this).closest('.idp-active-select').find('.btn-sch-open').html(this_html);
		$(".idp-active-select > ul, .idp-active-select .btn-sch-open").removeClass("active");
		//$(this).closest('.active-select').find('ul, .active-select .btn-sch-open').removeClass("active");
	});

	//활동 카테고리서브메뉴
	/*
	$(".contents").on("click",".listMenu > li > button.btn-listMove",function(){

		$(this).siblings(".list_move").show();

		if($('button#type02').hasClass('active')){
			$(this).siblings(".list_move").css('left','-200px');
		}
		else{
			$(this).siblings(".list_move").css('left','151px');
		}
	});

	$(".contents").on("click",".listMenu > li .list_move .btn-close",function(){
		$(this).parents(".list_move").hide();
	});
	*/

}

$(document).ready(function(){
  $('#Menu li').on('click',function(){
    $('#Menu li').removeClass('active');
    $(this).addClass('active');


  });
});