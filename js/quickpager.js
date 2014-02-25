//----------------------------------------------------------------------------
//                Quick Pager jquery plugin
//                Created by dan and emanuel @geckonm.com
//                www.geckonewmedia.com
//
//
//                18/09/09 * bug fix by John V - http://blog.geekyjohn.com/
//                1.2 - allows reloading of pager with new items
//				  25/02/2014 * Modified for s0rtega for discotify!
//----------------------------------------------------------------------------

(function($) {
        
        $.fn.quickPager = function(options) {
        
                var defaults = {
                        pageSize: 10,
                        currentPage: 1,
                        holder: null,
                        pagerLocation: "after"
                };
                
                var options = $.extend(defaults, options);
                
                
                return this.each(function() {        
                                                
                        var selector = $(this);        
                        var pageCounter = 1;
                        
                        selector.wrap("<div class='simplePagerContainer'></div>");
                        
                        $(".navegadorPaginas").empty();
                        
                        selector.children().each(function(i){
                                        
                                if(i < pageCounter*options.pageSize && i >= (pageCounter-1)*options.pageSize) {
                                $(this).addClass("simplePagerPage"+pageCounter);
                                }
                                else {
                                        $(this).addClass("simplePagerPage"+(pageCounter+1));
                                        pageCounter ++;
                                }        
                                
                        });
                        
                        // show/hide the appropriate regions
                        selector.children().hide();
                        selector.children(".simplePagerPage"+options.currentPage).show();
                        
                        if(pageCounter <= 1) {
                                return;
                        }
                        
                        //Build pager navigation
                        var pageNav = "<ul class='simplePagerNav'>";        
                        for (i=1;i<=pageCounter;i++){
                                if (i==options.currentPage) {
                                        pageNav += "<li class='currentPage simplePageNav"+i+"'><a rel='"+i+"' href='#'>"+i+"</a></li>";        
                                }
                                else {
                                        pageNav += "<li class='simplePageNav"+i+"'><a rel='"+i+"' href='#'>"+i+"</a></li>";
                                }
                        }
                        pageNav += "</ul>";
                        
						$(".navegadorPaginas").append(pageNav);
						
                        //pager navigation behaviour
                        $(".navegadorPaginas").find(".simplePagerNav a").click(function() {                                        
							//grab the REL attribute
							var clickedLink = $(this).attr("rel");
							options.currentPage = clickedLink;

							//remove current current (!) page
							$(this).parent("li").parent("ul").parent(".navegadorPaginas").find("li.currentPage").removeClass("currentPage");
							//Add current page highlighting
							$(this).parent("li").parent("ul").parent(".navegadorPaginas").find("a[rel='"+clickedLink+"']").parent("li").addClass("currentPage");
						   
							//hide and show relevant links
							selector.children().hide();                        
							selector.find(".simplePagerPage"+clickedLink).show();
							
							return false;
                        });
                });
        }  

})(jQuery);