// ==UserScript==
// @name         【雀魂】最近大铳
// @namespace    https://paulzzh.tech/
// @supportURL   https://github.com/paulzzh/Majsoul-Chong
// @version      1.0.0
// @description  最近大铳插件，让最近大和区域显示最近大铳
// @author       Paulzzh
// @license      MIT
// @match        *://majsoul.union-game.com/0/
// @grant        none
// @icon         https://i.loli.net/2019/08/05/EJOIypKbXuxMFeB.png
// ==/UserScript==

(function() {
    'use strict';
    window.paulzzh_plugin_zjdc = {};
    
    //==================================
    //
    //        最近大铳 插件配置
    //
    //最近大铳 数据交换服务器   一般情况下不需要修改。
    //为了确认用户身份，会收集您和他人的account_id,昵称,对局日期,和(铳)牌信息等信息；会储存您和他人的account_id,和(铳)牌信息等信息。
    window.paulzzh_plugin_zjdc.server = "https://majsoul.paulzzh.tech/api/zjdc";
    
    //大铳大和切换延迟(毫秒)
    window.paulzzh_plugin_zjdc.display_showtime = 3000;
    
    //==================================
    
    
    //切换大铳大和
    window.paulzzh_plugin_zjdc.display = function() {
        var vui=window.paulzzh_plugin_zjdc.display_vui;
        var datas = window.paulzzh_plugin_zjdc.display_data;
        var data=datas[window.paulzzh_plugin_zjdc.display_which%datas.length];
        vui.me.getChildAt(0).getChildAt(0).text = data.text;
        vui.me.getChildAt(0).getChildAt(0).color = data.color;
        vui.me.getChildAt(0).getChildAt(0).font = data.font;
        vui._showDaHe(data.data.hands, data.data.ming, data.data.hupai);
        vui._setTitle(data.data.title_id);
        window.paulzzh_plugin_zjdc.display_which +=1;
    };
    window.paulzzh_plugin_zjdc.display_inv = [];
    
    window.paulzzh_plugin_zjdc.display_clear = function(){
        var l=window.paulzzh_plugin_zjdc.display_inv.length;
        for(var i=0; i<l ; i++){
            clearInterval(window.paulzzh_plugin_zjdc.display_inv.shift());
        }
    }
    
    //网络请求，铳牌获取
    window.paulzzh_plugin_zjdc.xhr = function(vui,account_id,which,t) {
        window.paulzzh_plugin_zjdc.display_clear();
        vui.me.getChildAt(0).getChildAt(0).text = "最近大和";
        vui.me.getChildAt(0).getChildAt(0).color = "#e8af71";
        vui.me.getChildAt(0).getChildAt(0).font = "fengyu";
        window.paulzzh_plugin_zjdc.display_which = 0;
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && account_id==window.paulzzh_plugin_zjdc.account_id && which==window.paulzzh_plugin_zjdc.which) {
                try {
                    window.paulzzh_plugin_zjdc.display_clear();
                    var ret = JSON.parse(xhr.responseText);
                    if (ret.status) {
                        var data = []
                        if (ret.datac){
                            data.push({"text":"最近大铳","color":"#ff4e4e","font":"fengyu","data":ret.datac});
                        };
                        if (ret.dataz){
                            //雀魂fengyu字体没有"炸"这个字。。没办法只能换字体
                            data.push({"text":"最近炸庄","color":"#c1c630","font":"SimHei","data":ret.dataz});
                        };
                        if (t.statistic_data){
                            for (var a = 0; a < t.statistic_data.length; a++) {
                                var r = t.statistic_data[a];
                                if (which==String(r.mahjong_category)+String(r.game_category)){
                                    data.push({"text":"最近大和","color":"#e8af71","font":"fengyu","data":r.statistic.highest_hu});
                                    break
                                }
                            }
                        };
                        window.paulzzh_plugin_zjdc.display_data=data;
                        window.paulzzh_plugin_zjdc.display_vui=vui;
                        window.paulzzh_plugin_zjdc.display_inv.push(setInterval("window.paulzzh_plugin_zjdc.display()",window.paulzzh_plugin_zjdc.display_showtime));
                    }
                } catch(error) {
                    console.log("[最近大铳]" + error.message)
                }
            }
        };
        xhr.open("post", window.paulzzh_plugin_zjdc.server, true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset-UTF-8");
        xhr.send("action=query&id=" + account_id + "&data=" + which);
    };
    
    //网络请求，铳牌记录
    window.paulzzh_plugin_zjdc.postxhr = function(t,ds) {
        var mj = view.DesktopMgr.Inst.rule_mode + 1;
        if (view.DesktopMgr.Inst.game_config.meta.mode_id) {
            var gm = 2
        } else {
            var gm = 1
        };
        var which=String(mj)+String(gm);
        if (!t[0].zimo) {
            var xhr = new XMLHttpRequest();
            var chong = view.DesktopMgr.Inst.player_datas[view.DesktopMgr.Inst.lastpai_seat];
            var he = view.DesktopMgr.Inst.player_datas[t[0].seat];
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    console.log(xhr.responseText)
                }
            };
            xhr.open("post", window.paulzzh_plugin_zjdc.server, true);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset-UTF-8");
            xhr.send("action=chong&id=" + chong.account_id + "&which="+which+"&cnick="+chong.nickname+"&hnick="+he.nickname + "&data=" + JSON.stringify(t))
        }else if(t[0].zimo && !t[0].qinjia){
            var zimo = view.DesktopMgr.Inst.player_datas[t[0].seat];
            var min=0;
            var zha=0;
            for (var a = 0; a < ds.length; a++) {
                if(ds[a]<min){
                    min=ds[a];
                    zha=view.DesktopMgr.Inst.player_datas[a];
                }
            }
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    console.log(xhr.responseText)
                }
            };
            xhr.open("post", window.paulzzh_plugin_zjdc.server, true);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset-UTF-8");
            xhr.send("action=zha&id=" + zha.account_id + "&which="+which+"&znick="+zha.nickname+"&mnick="+zimo.nickname + "&data=" + JSON.stringify(t))
        }
    };
    
    //对于雀魂的hack
    window.paulzzh_plugin_zjdc.hook = function() {
        try {
            //需要注入的东西，要在游戏加载完后修改
            if (uiscript.UI_PlayerInfo.Inst && uiscript.UI_OtherPlayerInfo.Inst && uiscript.UI_PlayerInfo.Inst.show && uiscript.UI_OtherPlayerInfo.Inst.show && uiscript.UI_PlayerInfo.Inst.detail_data.blocks[0].show && uiscript.UI_OtherPlayerInfo.Inst.detail_data.blocks[0].show && view.ActionHule.play) {
                console.log("[最近大铳]游戏已登录");
                try {
                    //自己详情页
                    window.paulzzh_plugin_zjdc.funcpds = uiscript.UI_PlayerInfo.Inst.detail_data.blocks[0].show;
                    uiscript.UI_PlayerInfo.Inst.detail_data.blocks[0].show = function(t, e, i) {
                        var w = String(e)+String(i);
                        var vui = uiscript.UI_PlayerInfo.Inst.detail_data.blocks[0];
                        var account_id = GameMgr.Inst.account_id;
                        
                        //xhr异步问题,为了验证一下选项卡是否更改
                        window.paulzzh_plugin_zjdc.which=w;
                        window.paulzzh_plugin_zjdc.account_id=account_id;
                        
                        window.paulzzh_plugin_zjdc.xhr(vui,account_id,w,t);
                        window.paulzzh_plugin_zjdc.funcpds.apply(this, [t, e, i])
                    };
                    //别人详情页
                    window.paulzzh_plugin_zjdc.funcopds = uiscript.UI_OtherPlayerInfo.Inst.detail_data.blocks[0].show;
                    uiscript.UI_OtherPlayerInfo.Inst.detail_data.blocks[0].show = function(t, e, i) {
                        var w = String(e)+String(i);
                        var vui = uiscript.UI_OtherPlayerInfo.Inst.detail_data.blocks[0];
                        var account_id = uiscript.UI_OtherPlayerInfo.Inst.account_id;
                        
                        //xhr异步问题,为了验证一下选项卡是否更改
                        window.paulzzh_plugin_zjdc.which=w;
                        window.paulzzh_plugin_zjdc.account_id=account_id;
                        
                        window.paulzzh_plugin_zjdc.xhr(vui,account_id,w,t);
                        window.paulzzh_plugin_zjdc.funcopds.apply(this, [t, e, i])
                    };
                    //有人和牌了
                    window.paulzzh_plugin_zjdc.funchlpl = view.ActionHule.play;
                    view.ActionHule.play = function(e) {
                        window.paulzzh_plugin_zjdc.postxhr(e.hules,e.delta_scores);
                        window.paulzzh_plugin_zjdc.funchlpl.apply(this, [e])
                    };
                    clearInterval(window.paulzzh_plugin_zjdc.inv);
                    console.log("[最近大铳]插件已成功注入！");
                    uiscript.UI_LightTips.Inst.show("【最近大铳】插件 已成功注入！");
                    if(!localStorage.getItem("paulzzh_plugin_zjdc_xieyi")){
                    uiscript.UI_InfoLite.Inst.show("【最近大铳】插件 权限申请\n版本:1.0.0\n\n本插件会收集您和他人的account_id,昵称,对局日期,和(铳)牌信息等信息。\n会储存您和他人的account_id,和(铳)牌信息等信息。\n为了实现插件的基础功能，这些数据是必须的。\n他们会被上传到第三方服务器 "+window.paulzzh_plugin_zjdc.server+"\n本插件与雀魂官方无任何联系，放铳数据均来自安装此插件的用户主动上传。\n开源地址:https://github.com/paulzzh/Majsoul-Chong\n\n此提示只会显示一次，确定后将不再提示。");
                    localStorage.setItem("paulzzh_plugin_zjdc_xieyi","ok");
                    }
                } catch(error) {
                    console.log("[最近大铳]插件注入失败" + error.message)
                }
            } else {
                console.log("[最近大铳]游戏未加载完毕")
            }
        } catch(error) {
            console.log("[最近大铳]插件注入失败" + error.message)
        }
    };
    
    //检测雀魂加载状态
    window.paulzzh_plugin_zjdc.inv = setInterval("window.paulzzh_plugin_zjdc.hook()",3000)
})();