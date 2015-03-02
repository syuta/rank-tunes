/**
 * Created by syuta on 2015/02/23.
 */
$( function() {

    var SEARCH_URL_BASE = "https://itunes.apple.com/jp/rss/";

    /**
     * browser actionの際に呼ばれる初期化関数
     */
    function initApp() {

        //message listener
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            if (request.name === "audioEnded") {
                //audio再生完了のメッセージ
                chrome.runtime.getBackgroundPage(function(backgroundPage) {
                    //再生したメディアに矢印設定
                    var bgp = backgroundPage.background;
                    var cMedia = bgp.getCurrentMedia();
                    $("#rankTable tr").each(function () {
                        if (cMedia.media.id === $(this).attr("mediaId")) {
                            $(this).find('td:first').text("▶");
                        } else {
                            $(this).find('td:first').text("　");
                        }
                    });
                    setCurrentMediaInfo(cMedia.media);

                    var response = {data: "ok"};
                    sendResponse(response);
                });
            }
        });

        chrome.runtime.getBackgroundPage(function(backgroundPage) {
            var bgp = backgroundPage.background;
            var cMedia = bgp.getCurrentMedia();
            var mediaList = bgp.getMediaList();

            //行クリア
            $('#rankTable').find("tr:gt(0)").remove();

            //リスト復元
            if(mediaList) {
                for(var i = 0; i < mediaList.length;i++) {
                    addRow(mediaList[i]);
                }
            }

            if(cMedia) {
                //再生している曲に▶/〓をつける
                var mark =  "";
                if(cMedia.status === "play") {
                    mark = "▶";
                } else if(cMedia.status === "pause"){
                    mark = "〓";
                }
                $("#rankTable tr[mediaId='"+ cMedia.media.id +"']").find('td:first').text(mark);

                //選択中のメディア情報を表示
                setCurrentMediaInfo(cMedia.media);
            }

        });
    };


    /**
     * ランキング情報取得
     */
    $('#getBtn').on('click', function() {
        //行クリア
        $('#rankTable').find("tr:gt(0)").remove();

        var url = makeUrl();
        var mediaList = [];
        $.getJSON(url, function(json){
            for(var i = 0; i < json.feed.entry.length; i++) {
                var item = json.feed.entry[i];
                var id = item.id.attributes["im:id"];
                var title = item["im:name"].label;
                var previewLink = item.link[1].attributes.href;
                var artist = item["im:artist"].label;
                var img = item["im:image"][2].label;
                var media = {
                    id:id,
                    count:i + 1,
                    title:title,
                    previewLink:previewLink,
                    artist:artist,
                    img:img
                };
                mediaList.push(media);
                addRow(media);
            }
            chrome.runtime.getBackgroundPage(function(backgroundPage) {
                var bgp = backgroundPage.background;
                bgp.setMediaList(mediaList);
            });


        });
    });

    /**
     * ランキング情報取得
     */
    $('#clearBtn').on('click', function() {
        //行クリア
        $('#rankTable').find("tr:gt(0)").remove();
        //データクリア
        chrome.runtime.getBackgroundPage(function(backgroundPage) {
            var bgp = backgroundPage.background;
            var cMedia = bgp.getCurrentMedia();
            bgp.stopMedia(cMedia)
            bgp.setMediaList([]);
            bgp.setCurrentMedia({});
            setCurrentMediaInfo(null);
        });
    });

    /**
     * メディア一覧の行をクリックしたときのイベント
     */
    $(document).on('click',"#rankTable tr", function(e){

        var that = this;

        chrome.runtime.getBackgroundPage(function(backgroundPage) {
            var bgp = backgroundPage.background;
            var selectedMedia = bgp.findById($(that).attr("mediaId"))
            var cMedia = bgp.getCurrentMedia();

            //クリア
            $("#rankTable tr").each(function() {
                $(this).find('td:first').text("　");
            });

            if(cMedia && cMedia.media && cMedia.media.previewLink === selectedMedia.previewLink) {
                //同じ曲が選択された場合
                if(cMedia.status === "play") {
                    bgp.pauseMedia(selectedMedia);
                    $(that).find('td:first').text("〓");
                } else {
                    bgp.playMedia(selectedMedia);
                    $(that).find('td:first').text("▶");
                }
            } else {
                bgp.playMedia(selectedMedia);
                $(that).find('td:first').text("▶");
                setCurrentMediaInfo(selectedMedia);
            }
        });
    });



    /**
     * 渡されたmediaオブジェクトの画像と情報を設定する
     * @param media mediaオブジェクト
     */
    function setCurrentMediaInfo(media) {
        if(media) {
            $("#mediaImg").attr("src",media.img);
            $("#infomation").html("<b>" + media.artist + "</br>" + media.title + "</b>");
        } else {
            $("#mediaImg").attr("src","");
            $("#infomation").html("");
        }
    }


    /**
     * フォーム内容を元に検索するurlを作成する.
     * @return 検索するUrl
     */
    function makeUrl() {
        var feedType = "topsongs";//($("#feedType").val()
        var searchUrl = SEARCH_URL_BASE + feedType + "/limit=" + $("#size").val();
        var genre = $("#genre").val();
        if(genre === "ALL") {
            searchUrl += "/json";
        } else {
            searchUrl += "/genre=" + $("#genre").val() + "/json";
        }
        return searchUrl;
    };

    /**
     * 取得したデータをテーブルに表示する
     * @param mediaオブジェクト
     */
    function addRow(media) {
        $('#rankTable').append(
            '<tr mediaId="' + media.id + '">' +
            '<td width="25px">&nbsp;&nbsp;&nbsp;</td>' +
            '<td width="28px">' + media.count + '</td>' +
            '<td width="170px">' + media.title + '</td>' +
            '<td width="260px">' + media.artist +'</td>' +
            '</tr>');
    };

    //初期化処理実行
    initApp();
});
