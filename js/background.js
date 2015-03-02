var Background = function() {
    this.audio = new Audio();
};

Background.prototype = {
    initialize:function() {

        var that = this;
        this.audio.addEventListener("ended",function(){
            var cMedia = that.getCurrentMedia();
            var mList = that.getMediaList();
            if(cMedia) {
                for(var i = 0; i < mList.length;i++) {
                    if(mList[i].id === cMedia.media.id) {
                        if( i < mList.length - 1) {
                            //次のメディア
                            var nextMedia = mList[i + 1];
                            cMedia = that.playMedia(nextMedia);
                        } else {
                            //リスト最初のメディア
                            cMedia = that.playMedia(mList[0]);
                        }
                        break;
                    }
                }
            }
            //UI更新のためメッセージ送信
            chrome.runtime.sendMessage({name: "audioEnded"}, function() {
                console.log("get response.");
            });
        });
    },
    getAudio:function() {
        return this.audio;
    },
    getCurrentMedia:function() {
        var cMedia = localStorage["currentMedia"];
        if(!cMedia) {
            return null;
        } else {
            return JSON.parse(localStorage["currentMedia"]);
        }
    },
    getMediaList:function() {
        var mList = localStorage["mediaList"];
        if(!mList) {
            return null;
        } else {
            return JSON.parse(localStorage["mediaList"]);
        }
    },

    setCurrentMedia:function(cMedia) {
        localStorage["currentMedia"] = JSON.stringify(cMedia);
    },

    setMediaList:function (mList) {
        localStorage["mediaList"] = JSON.stringify(mList);
    },

    /**
     * メディア再生する.
     * 引数のオブジェクトとstatusを合わせてCurrentMediaオブジェクトとして保存する.
     * @param media mediaオブジェクト
     */
    playMedia:function(media) {
        var cMedia = {media:media,status:"play"};
        this.setCurrentMedia(cMedia);
        this.audio.src = media.previewLink;
        this.audio.play();
        return cMedia;
    },

    /**
     * メディア一時停止
     * @param media
     */
    pauseMedia:function (media) {
        var cMedia = {media:media,status:"pause"};
        this.setCurrentMedia(cMedia);
        this.audio.pause();
        return cMedia;
    },
    /**
     * メディア停止
     * @param media
     */
    stopMedia:function (media) {
        var cMedia = {media:media,status:"stop"};
        this.setCurrentMedia(cMedia);
        this.audio.pause();
        this.audio.currentTime = 0;
        return cMedia;
    },


    /**
     * mediaオブジェクトをIDで検索して返す
     * @param mediaId 音楽ID
     * @returns mediaオブジェクト
     */
    findById:function(mediaId) {
        var mList = this.getMediaList();

        for(var i = 0; i < mList.length; i++) {
            if(mList[i].id === mediaId) {
                return mList[i];
            }
        }
        return null;
    }
};

var background = new Background();
background.initialize();