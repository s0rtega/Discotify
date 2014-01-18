$(function main(){                 
	$(".catalogLoader").click(function(){
	  getCatalogFromDiscogs();
	}); 
})

function getCatalogFromDiscogs(){

	catalogArray = new Array();
	catalog      = ""
	userName     = document.getElementById("userName").value
	var urls     = new Array();
	var jxhr     = [];
	
	$("#showDiscogs").html(" ");
	
	require(['$views/throbber#Throbber','$api/models'], function(Throbber,models,List) {	
		
		//catalogContentDiv = document.getElementById('catalogContent');
		//throbber = Throbber.forElement(catalogContentDiv);
		//$("#userCatalog").html(" ");
		//throbber.show();
			
		$.getJSON("http://api.discogs.com/users/"+userName.toLowerCase()+"/collection/folders/0/releases?per_page=100").done(function(data){ 
			$.each(data.releases, function(i,release) {
				addToCatalog(release);
			}); 	
			for (var i = 2, p = data.pagination.pages; i <= p; i++) {
				urls.push("http://api.discogs.com/users/"+userName.toLowerCase()+"/collection/folders/0/releases?per_page=100&page="+i);
			}
			$.each(urls, function (i, url) {
				jxhr.push(
					$.getJSON(url, function (data) {
						$.each(data.releases, function(i,release) {
							addToCatalog(release);
						});
					})
				);
			});			
			$.when.apply($, jxhr).done(function() {
				searchUserPlaylists(catalogArray, userName);

				$("#userCatalog").html(" ");
				$("#userCatalog").append("<br/><ul class=\"pagination3\">"+catalog+"<br/></ul>");
				$("ul.pagination3").quickPager({pageSize:"10"});
				
				var nextLink = '<li><a id="nextLink" href="#">Next</a></li>';
				var prevLink = '<li><a id="prevLink" href="#">Prev</a></li>';
				$(".simplePagerNav").prepend(prevLink).append(nextLink);
				$("#nextLink").click(function(e) {
					e.preventDefault();
					$("li.currentPage").next("li[class^=simplePageNav]").find("a").click();
				});
				$("#prevLink").click(function(e) {
					e.preventDefault();
					$("li.currentPage").prev("li[class^=simplePageNav]").find("a").click();
				});

				//throbber.hide();						
			});	
		})
		.fail(function(error){
			$("#userCatalog").html(" ");
			$("#userCatalog").append("Sorry, we can´t access to this user collection!");
		});
	});
};

function addToCatalog(release)
{
	catalog += "<li><a href=\"#\" onClick=\"fetchAlbumInfoFromDiscogs("+release.basic_information.resource_url.split("/")[4]+")\">"+release.basic_information.artists[0].name+" - "+release.basic_information.title+"<br/></a></li>";
	catalogArray.push(release.basic_information.title+" - "+release.basic_information.artists[0].name);	
}

function fetchAlbumInfoFromDiscogs(id)
{
	var discogsUrl = "http://api.discogs.com/release/"+id+"?f=json"

	$.getJSON(discogsUrl).done(function(data){ 
		$("#showDiscogs").html(" ");
		$("#showDiscogs").append("<p><img src=\""+data.resp.release.thumb+"\" style=\"float:right\">");
		$("#showDiscogs").append(data.resp.release.title+" ("+data.resp.release.year+")");
		$("#showDiscogs").append("<br>"+data.resp.release.artists[0].name+"</p>");
		
		data.resp.release.tracklist.forEach(function(song) {
			$("#showDiscogs").append("<br>"+song.position+" - "+song.title);
		});
		
		$("#showDiscogs").append("<br><a href="+data.resp.release.uri+">More information on Discogs</a>");		
	})
	.fail(function(error){
		console.log(error);
	});
}

function showPlaylist(uri,models,List)
{
	//$("#userCatalog").html(" ");
	var playlist = models.Playlist.fromURI(uri);
	var list = List.forPlaylist(playlist);

	list.fetch = "scroll";
	list.style = "rounded";
	list.minItemsForScroll = 50;
	list.viewAllLimit = 3;
	list.height = "fixed";
	
	var userCatalogDiv = document.getElementById("userCatalog");
	//userCatalogDiv.appendChild(list.node);

	//list.init();
}

function searchUserPlaylists(catalogArray, userName)
{		
	require(['$api/search#Search','$api/models','$api/library#Library','$views/list#List'], function(Search, models, Library, List) {	

		var exists = false;	
		
		returnedLibrary = Library.forCurrentUser();
		returnedLibrary.playlists.snapshot().done(function(snapshot) {
			for (var i = 0, l = snapshot.length; i < l; i++) {
			  var playlist = snapshot.get(i);
			  if (playlist.name == userName.toLowerCase()+"´s collection"){
				playlist = models.Playlist.fromURI(playlist.uri);
				exists = true;
				getAlbumsFromCatalog(catalogArray, Search,models,playlist);
				showPlaylist(playlist.uri,models,List);
				break;
			  }
			}
			if (exists == false){
				models.Playlist.create(userName.toLowerCase()+"´s collection").done(function(createPlaylist) {
					playlist = createPlaylist
					showPlaylist(playlist.uri,models,List);
					getAlbumsFromCatalog(catalogArray, Search,models,playlist)
				});
			}
			
			
		});	

	});                     		
}

function getAlbumsFromCatalog(catalogArray, Search,models,playlist,deferred)
{
	catalogArray.forEach(function(catalogAlbum) {	
		var search = Search.search(catalogAlbum);
		search.albums.snapshot(0,1).done(function(snapshot) {
			snapshot.loadAll('name').done(function(albums) {					
				loadSongsForAlbums(albums,playlist,models);
			});
		});
	});
}

function loadSongsForAlbums(albums,playlist,models)
{
	playlist.load("tracks").done(function(loadedPlaylist) {
		albums.forEach(function(album) {
			var album = models.Album.fromURI(album);
			album.load("tracks").done(function(albumlist) {
				albumlist.tracks.snapshot().done(function(albumSnapshot) {	
					loadedPlaylist.tracks.snapshot().done(function(playlistSnapshot) {
						addAlbumSongsToPlaylist(playlistSnapshot,albumSnapshot,loadedPlaylist,models)
					});								
				});
			});
		});
	});
}

function addAlbumSongsToPlaylist(playlistSnapshot,albumSnapshot,loadedPlaylist,models)
{
	for (var i = 0, l = albumSnapshot.length; i < l; i++) {
		var track = albumSnapshot.get(i);
		if (!playlistSnapshot.find(track)){
			loadedPlaylist.tracks.add(models.Track.fromURI(track.uri));			
		}
	}
}